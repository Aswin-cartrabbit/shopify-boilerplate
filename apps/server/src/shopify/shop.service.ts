import { Injectable } from '@nestjs/common';
import { Session } from '@shopify/shopify-api';
import {
  SessionState,
  SessionType,
  Shop,
  ShopStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ShopifyService } from './shopify.service';
import type { PersistSessionResult, ShopWithActiveSessions } from './types';

@Injectable()
export class ShopService {
  /**
   * Provides database access for shops and OAuth sessions used across auth and webhooks.
   * @param {PrismaService} prisma - Shared Prisma client connected to Postgres.
   * @param {ShopifyService} shopifyService - Used to call Admin GraphQL when syncing shop metadata.
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly shopifyService: ShopifyService,
  ) {}

  /**
   * Fetches one shop by Shopify domain including only sessions marked ACTIVE.
   * Used for status APIs and post-install reads; does not guarantee an offline token exists.
   * @param {string} shopDomain - Canonical shop hostname (for example `example.myshopify.com`).
   * @returns {Promise<ShopWithActiveSessions | null>} Shop with nested active sessions, or null if unknown.
   */
  findByDomain(shopDomain: string): Promise<ShopWithActiveSessions | null> {
    return this.prisma.shop.findUnique({
      where: { shopDomain },
      include: {
        sessions: {
          where: { state: SessionState.ACTIVE },
        },
      },
    });
  }

  /**
   * Determines whether the app is installed and has a usable offline session.
   * Requires `ShopStatus.INSTALLED` and at least one ACTIVE offline session row.
   * Embedded auth uses this to skip token exchange when tokens are already stored.
   * @param {string} shopDomain - Shopify shop domain to check.
   * @returns {Promise<Shop | null>} Matching shop row when installed with offline session; otherwise null.
   */
  hasActiveOfflineSession(shopDomain: string): Promise<Shop | null> {
    return this.prisma.shop.findFirst({
      where: {
        shopDomain,
        status: ShopStatus.INSTALLED,
        sessions: {
          some: {
            sessionType: SessionType.OFFLINE,
            state: SessionState.ACTIVE,
          },
        },
      },
    });
  }

  /**
   * Records a successful install or reinstall after OAuth or token exchange.
   * Upserts the shop (sets INSTALLED, clears `uninstalledAt`, refreshes `installedAt` on update),
   * then writes access and refresh tokens to `shopSession`. Sets `isFreshInstall` when no row existed before.
   * @param {Session} session - Shopify SDK session containing shop id, tokens, expiry, and online/offline flag.
   * @returns {Promise<PersistSessionResult>} Saved shop entity and first-time install indicator.
   */
  async persistSession(session: Session): Promise<PersistSessionResult> {
    const shopDomain = session.shop;
    const existingShop = await this.prisma.shop.findUnique({
      where: { shopDomain },
    });
    const isFreshInstall = !existingShop;

    const shop = await this.prisma.shop.upsert({
      where: { shopDomain },
      create: {
        shopDomain,
        status: ShopStatus.INSTALLED,
      },
      update: {
        status: ShopStatus.INSTALLED,
        uninstalledAt: null,
        installedAt: new Date(),
      },
    });

    await this.saveSession(shop.id, session);

    return { shop, isFreshInstall };
  }

  /**
   * Enriches the local shop row with live data from Shopify Admin GraphQL.
   * Runs the `ShopInstallMetadata` query (name, emails, timezone, plan, country) and maps Shopify's
   * global id to `shopifyShopId`. Silently returns when GraphQL returns no shop payload.
   * @param {Session} session - Session with access token authorized for Admin API.
   * @param {string} shopId - Internal UUID primary key of the shop row to update.
   * @returns {Promise<void>} Resolves when the update completes or is skipped.
   */
  async syncShopFromApi(session: Session, shopId: string): Promise<void> {
    const client = new this.shopifyService.shopify.clients.Graphql({ session });
    const response = await client.request<{
      shop: {
        id: string;
        name: string;
        email: string;
        contactEmail: string;
        shopOwnerName: string;
        currencyCode: string;
        ianaTimezone: string;
        plan: { displayName: string; shopifyPlus: boolean };
        billingAddress: { countryCodeV2: string | null };
      };
    }>(`#graphql
      query ShopInstallMetadata {
        shop {
          id
          name
          email
          contactEmail
          shopOwnerName
          currencyCode
          ianaTimezone
          plan {
            displayName
            shopifyPlus
          }
          billingAddress {
            countryCodeV2
          }
        }
      }
    `);

    const shopGraphqlPayload = response.data?.shop;
    if (!shopGraphqlPayload) {
      return;
    }

    const shopifyShopId = BigInt(shopGraphqlPayload.id.split('/').pop() ?? '0');

    await this.prisma.shop.update({
      where: { id: shopId },
      data: {
        shopifyShopId,
        name: shopGraphqlPayload.name,
        email: shopGraphqlPayload.email,
        contactEmail: shopGraphqlPayload.contactEmail,
        shopOwner: shopGraphqlPayload.shopOwnerName,
        currency: shopGraphqlPayload.currencyCode,
        timezone: shopGraphqlPayload.ianaTimezone,
        countryCode: shopGraphqlPayload.billingAddress?.countryCodeV2 ?? null,
        planName: shopGraphqlPayload.plan.displayName,
        isShopifyPlus: shopGraphqlPayload.plan.shopifyPlus,
      },
    });
  }

  /**
   * Processes an app uninstall webhook by revoking sessions and marking the shop uninstalled.
   * Sets every related `shopSession` to REVOKED, then updates the shop with `UNINSTALLED` and `uninstalledAt`.
   * Returns null when no shop row exists for the domain (idempotent for duplicate webhooks).
   * @param {string} shopDomain - Shop domain from the webhook `X-Shopify-Shop-Domain` header.
   * @returns {Promise<Shop | null>} Updated shop row, or null if the domain was unknown.
   */
  async markUninstalled(shopDomain: string): Promise<Shop | null> {
    const shop = await this.prisma.shop.findUnique({
      where: { shopDomain },
    });

    if (!shop) {
      return null;
    }

    await this.prisma.shopSession.updateMany({
      where: { shopId: shop.id },
      data: { state: SessionState.REVOKED },
    });

    return this.prisma.shop.update({
      where: { id: shop.id },
      data: {
        status: ShopStatus.UNINSTALLED,
        uninstalledAt: new Date(),
      },
    });
  }

  /**
   * Inserts or updates a `shopSession` row for online or offline OAuth results.
   * Matches existing rows by shop id, session type (online vs offline), and Shopify staff user id when online.
   * Overwrites tokens, scopes, and expiry fields on update so reinstalls refresh credentials.
   * @param {string} shopId - Foreign key to the parent shop row.
   * @param {Session} session - Shopify SDK session with token fields and online access metadata.
   * @returns {Promise<void>} Resolves after the database write completes.
   */
  private async saveSession(shopId: string, session: Session): Promise<void> {
    const sessionType = session.isOnline
      ? SessionType.ONLINE
      : SessionType.OFFLINE;
    const shopifyUserId = session.onlineAccessInfo?.associated_user?.id
      ? BigInt(session.onlineAccessInfo.associated_user.id)
      : null;

    const sessionPayload = {
      accessToken: session.accessToken ?? '',
      refreshToken: session.refreshToken ?? null,
      accessTokenExpiresAt: session.expires ?? null,
      refreshTokenExpiresAt: session.refreshTokenExpires ?? null,
      scope: session.scope ?? null,
      state: SessionState.ACTIVE,
    };

    const existing = await this.prisma.shopSession.findFirst({
      where: {
        shopId,
        sessionType,
        shopifyUserId,
      },
    });

    if (existing) {
      await this.prisma.shopSession.update({
        where: { id: existing.id },
        data: sessionPayload,
      });
      return;
    }

    await this.prisma.shopSession.create({
      data: {
        shopId,
        sessionType,
        shopifyUserId,
        ...sessionPayload,
      },
    });
  }
}
