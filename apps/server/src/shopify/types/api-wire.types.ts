/**
 * JSON API contracts for the React client (type-only imports via `@server/api-wire`).
 */
export type {
  EmbeddedAuthShopSummary,
  EmbeddedSessionAuthResponse,
} from './auth-api.types';

export type {
  ShopStatusApiResponse,
  ShopStatusInstalledResponse,
  ShopStatusNotInstalledResponse,
  ShopSummary,
} from './shop-api.types';

export type { ShopifyUrlParams } from './shopify-url.types';
