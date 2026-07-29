import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import type {
  BeginOAuthResult,
  EmbeddedSessionAuthResponse,
  OAuthCallbackHttpResult,
} from '../types';

@Controller('api/auth')
export class AuthController {
  /**
   * Injects Nest dependencies for Shopify OAuth HTTP routes.
   * @param {AuthService} authService - Authentication business logic.
   */
  constructor(private readonly authService: AuthService) {}

  /**
   * Starts the offline OAuth install flow for merchants who open the app outside the embedded admin.
   * The client (or browser) calls `GET /api/auth?shop={domain}`; this handler validates `shop`,
   * then delegates to the Shopify API library to redirect the merchant to Shopify's consent screen.
   * After approval, Shopify sends the merchant to {@link AuthController.callback}.
   * @param {string} shop - Shopify shop domain from the query string (for example `example.myshopify.com`).
   * @param {Request} req - Raw Express request forwarded to the Shopify OAuth helper.
   * @param {Response} res - Raw Express response used to issue the redirect to Shopify.
   * @returns {BeginOAuthResult} Result from the Shopify `auth.begin` call (typically a redirect).
   */
  @Get()
  begin(
    @Query('shop') shop: string,
    @Req() req: Request,
    @Res() res: Response,
  ): BeginOAuthResult {
    return this.authService.beginOAuth(shop, req, res);
  }

  /**
   * Completes OAuth after the merchant approves the app on Shopify's consent page.
   * Shopify redirects to `GET /api/auth/callback` with authorization parameters on the query string.
   * This handler exchanges that callback for an offline access session, saves the shop and tokens
   * in the database, then redirects the browser to the embedded app URL inside Shopify Admin.
   * @param {Request} req - OAuth callback request including Shopify query parameters.
   * @param {Response} res - Express response used to send the final `302` redirect to the app.
   * @returns {OAuthCallbackHttpResult} Redirect response to the embedded app URL.
   */
  @Get('callback')
  async callback(
    @Req() req: Request,
    @Res() res: Response,
  ): OAuthCallbackHttpResult {
    const { redirectUrl } = await this.authService.handleOAuthCallback(req, res);
    return res.redirect(redirectUrl);
  }

  /**
   * Authenticates the embedded React app on each load using App Bridge session tokens.
   * The client calls `POST /api/auth/session` with JSON `{ "shop": "example.myshopify.com" }` and
   * an `Authorization: Bearer {sessionToken}` header where `sessionToken` comes from
   * `window.shopify.idToken()`. The server verifies the token with Shopify, ensures an offline
   * session exists for that shop (exchanging the token for a long-lived offline token when needed),
   * persists access tokens and shop metadata, and returns whether this was a first-time install.
   * Returns `400` when `shop` is missing and `401` when the Bearer token is missing or invalid.
   * @param {string} shop - Shopify shop domain from the JSON body; must match the shop in the session token.
   * @param {Request} req - Express request whose `Authorization` header carries the App Bridge JWT.
   * @returns {Promise<EmbeddedSessionAuthResponse>} JSON with `success`, `isFreshInstall`, and a `shop` summary (`domain`, `name`, `status`).
   */
  @Post('session')
  authenticateSession(
    @Body('shop') shop: string,
    @Req() req: Request,
  ): Promise<EmbeddedSessionAuthResponse> {
    return this.authService.authenticateEmbeddedSession(shop, req);
  }
}
