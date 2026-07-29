import type { Response } from 'express';

/** Result of Shopify `auth.begin` (typically an HTTP redirect). */
export type BeginOAuthResult = Promise<unknown>;

/** Express redirect response from OAuth callback route. */
export type OAuthCallbackHttpResult = Promise<void>;

/** Express response from webhook processing route. */
export type WebhookHandlerResult = Promise<Response>;
