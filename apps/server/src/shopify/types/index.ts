/**
 * Shopify module types (persistence, HTTP handlers, and JSON API wire shapes).
 */

export type {
  EmbeddedAuthShopSummary,
  EmbeddedSessionAuthResponse,
  OAuthCallbackResult,
} from './auth-api.types';

export type {
  ShopStatusApiResponse,
  ShopStatusInstalledResponse,
  ShopStatusNotInstalledResponse,
  ShopSummary,
} from './shop-api.types';

export type { ShopifyUrlParams } from './shopify-url.types';

export type {
  InstallCompleteResult,
  PersistSessionResult,
  ShopWithActiveSessions,
} from './shop-persistence.types';

export type {
  BeginOAuthResult,
  OAuthCallbackHttpResult,
  WebhookHandlerResult,
} from './http.types';

export type { ShopifyHostConfig } from './shopify-config.types';

export type { CustomerTestHealthResponse } from './customer-test-api.types';
