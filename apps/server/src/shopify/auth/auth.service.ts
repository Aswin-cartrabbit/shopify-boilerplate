import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RequestedTokenType, Session } from '@shopify/shopify-api';
import type { Request, Response } from 'express';
import {
  SHOP_EVENTS,
  ShopInstalledEvent,
} from '../events/shop.events';
import { SHOPIFY_CALLBACK_PATH } from '../shopify.constants';
import { ShopifyService } from '../shopify.service';
import { ShopService } from '../shop.service';
import type {
  BeginOAuthResult,
  EmbeddedSessionAuthResponse,
  InstallCompleteResult,
  OAuthCallbackResult,
  ShopWithActiveSessions,
} from '../types';

@Injectable()
export class AuthService {
  /**
   * Wires Shopify OAuth, shop persistence, and domain events for install flows.
   * Used by HTTP controllers and shop status endpoints; keep business rules here rather than in controllers.
   * @param {ShopifyService} shopifyService - Singleton Shopify API client (OAuth, token exchange, redirects).
   * @param {ShopService} shopService - Reads and writes shops and session tokens in Postgres.
   * @param {EventEmitter2} eventEmitter - Publishes `shop.installed` after a first-time install completes.
   */
  constructor(
    private readonly shopifyService: ShopifyService,
    private readonly shopService: ShopService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Begins the offline OAuth install when the merchant is not yet authenticated.
   * Throws `400` if `shop` is missing. Calls Shopify `auth.begin` with `isOnline: false` so the
   * resulting session is a long-lived offline token suitable for background API calls and webhooks.
   * The library typically responds with a redirect to Shopify's permission screen; the merchant
   * returns via {@link AuthService.handleOAuthCallback}.
   * @param {string | undefined} shop - Shopify domain (for example `example.myshopify.com`).
   * @param {Request} req - Express request; forwarded as `rawRequest` to the Shopify SDK.
   * @param {Response} res - Express response; forwarded as `rawResponse` for redirect headers.
   * @returns {Promise<unknown>} Shopify SDK result (usually an HTTP redirect to Shopify).
   */
  async beginOAuth(
    shop: string | undefined,
    req: Request,
    res: Response,
  ): BeginOAuthResult {
    if (!shop) {
      throw new BadRequestException('Missing shop parameter');
    }

    return this.shopifyService.shopify.auth.begin({
      shop,
      callbackPath: SHOPIFY_CALLBACK_PATH,
      isOnline: false,
      rawRequest: req,
      rawResponse: res,
    });
  }

  /**
   * Finishes OAuth after Shopify redirects back to `/api/auth/callback`.
   * Validates the callback with Shopify `auth.callback`, stores the offline session via
   * {@link AuthService.completeInstall}, then resolves the embedded admin URL the browser should load next.
   * @param {Request} req - Callback request containing Shopify authorization query parameters.
   * @param {Response} res - Callback response passed through to the Shopify SDK.
   * @returns {Promise<OAuthCallbackResult>} Embedded app URL plus persisted shop row and first-install flag.
   */
  async handleOAuthCallback(req: Request, res: Response): Promise<OAuthCallbackResult> {
    const { session } = await this.shopifyService.shopify.auth.callback({
      rawRequest: req,
      rawResponse: res,
    });

    const result = await this.completeInstall(session);

    const redirectUrl =
      await this.shopifyService.shopify.auth.getEmbeddedAppUrl({
        rawRequest: req,
      });

    return { redirectUrl, ...result };
  }

  /**
   * Authenticates an embedded app load using an App Bridge session token (JWT).
   * Reads `Authorization: Bearer …` from the request. If the shop already has an active offline
   * session in the database, returns immediately without calling Shopify again. Otherwise performs
   * `auth.tokenExchange` to obtain an offline access token, then runs the same persistence path as OAuth.
   * Throws `400` without `shop` and `401` without a Bearer token.
   * @param {string | undefined} shop - Shop domain from the client body; must align with the token's shop.
   * @param {Request} req - Express request carrying the App Bridge JWT in the Authorization header.
   * @returns {Promise<EmbeddedSessionAuthResponse>} Success payload for the React client.
   */
  async authenticateEmbeddedSession(
    shop: string | undefined,
    req: Request,
  ): Promise<EmbeddedSessionAuthResponse> {
    if (!shop) {
      throw new BadRequestException('Missing shop parameter');
    }

    const sessionToken = this.extractBearerToken(req);
    if (!sessionToken) {
      throw new UnauthorizedException('Missing session token');
    }

    const existingShop = await this.shopService.hasActiveOfflineSession(shop);
    if (existingShop) {
      return {
        success: true,
        isFreshInstall: false,
        shop: {
          domain: existingShop.shopDomain,
          name: existingShop.name,
          status: existingShop.status,
        },
      };
    }

    const { session } = await this.shopifyService.shopify.auth.tokenExchange({
      shop,
      sessionToken,
      requestedTokenType: RequestedTokenType.OfflineAccessToken,
    });

    const result = await this.completeInstall(session);

    return {
      success: true,
      ...result,
      shop: {
        domain: result.shop.shopDomain,
        name: result.shop.name,
        status: result.shop.status,
      },
    };
  }

  /**
   * Loads a shop and its active sessions for status checks and admin UI.
   * Delegates to {@link ShopService.findByDomain}; returns `null` when the shop has never installed.
   * @param {string} shopDomain - Shopify shop domain to look up.
   * @returns {Promise<ShopWithActiveSessions | null>} Shop row with filtered active sessions, or null.
   */
  getShopStatus(
    shopDomain: string,
  ): Promise<ShopWithActiveSessions | null> {
    return this.shopService.findByDomain(shopDomain);
  }

  /**
   * Shared post-auth pipeline for OAuth callback and token exchange.
   * Saves tokens, pulls shop profile fields from the Admin GraphQL API, and emits
   * {@link SHOP_EVENTS.INSTALLED} only when the shop row did not exist before this session.
   * @param {Session} session - Shopify session object including shop domain and access token.
   * @returns {Promise<InstallCompleteResult>} Refreshed shop record and whether this was the first install.
   */
  private async completeInstall(session: Session): Promise<InstallCompleteResult> {
    const { shop, isFreshInstall } =
      await this.shopService.persistSession(session);

    await this.shopService.syncShopFromApi(session, shop.id);

    const updatedShop = (await this.shopService.findByDomain(session.shop))!;

    if (isFreshInstall) {
      this.eventEmitter.emit(
        SHOP_EVENTS.INSTALLED,
        new ShopInstalledEvent(updatedShop),
      );
    }

    return { shop: updatedShop, isFreshInstall };
  }

  /**
   * Parses `Authorization: Bearer <token>` from incoming App Bridge requests.
   * Returns null when the header is absent or not a Bearer scheme so callers can respond with `401`.
   * @param {Request} req - Express request whose headers are inspected.
   * @returns {string | null} Raw JWT string after `Bearer `, or null if not present.
   */
  private extractBearerToken(req: Request): string | null {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return null;
    }

    return header.slice('Bearer '.length).trim();
  }
}
