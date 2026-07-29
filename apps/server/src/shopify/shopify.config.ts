import { ApiVersion, shopifyApi, type Shopify } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';
import { SHOPIFY_CALLBACK_PATH } from './shopify.constants';
import type { ShopifyHostConfig } from './types/shopify-config.types';

/**
 * Reads `HOST` (for example `https://my-tunnel.example.com`) for Shopify SDK host configuration.
 * Defaults to `http://localhost:3000` in local development when HOST is unset.
 * @returns {ShopifyHostConfig} Hostname with port and URL scheme without trailing colon.
 */
function parseHost(): ShopifyHostConfig {
  const host = process.env.HOST ?? 'http://localhost:3000';
  const url = new URL(host);

  return {
    hostName: url.host,
    hostScheme: url.protocol.replace(':', '') as 'http' | 'https',
  };
}

/**
 * Factory for the process-wide Shopify API client used by auth and webhooks.
 * Pulls API key, secret, scopes, and public host from environment variables.
 * Configures an embedded app on Admin API version July26 with offline OAuth support.
 * @returns {Shopify} Initialized Shopify instance for OAuth, GraphQL, and webhook validation.
 */
export function createShopify(): Shopify {
  const { hostName, hostScheme } = parseHost();
  const scopes = (process.env.SCOPES ?? 'read_products')
    .split(',')
    .map((scopeEntry) => scopeEntry.trim());

  return shopifyApi({
    apiKey: process.env.SHOPIFY_API_KEY ?? '',
    apiSecretKey: process.env.SHOPIFY_API_SECRET ?? '',
    scopes,
    hostName,
    hostScheme,
    apiVersion: ApiVersion.July26,
    isEmbeddedApp: true,
  });
}

export { SHOPIFY_CALLBACK_PATH };
