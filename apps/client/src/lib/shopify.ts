import type {
  EmbeddedSessionAuthResponse,
  ShopStatusApiResponse,
  ShopifyUrlParams,
} from '@server/api-wire';

/**
 * Reads Shopify embedding query parameters from the browser location.
 * Embedded apps receive `shop` and `host` on the iframe URL; standalone dev tabs may only have `shop`.
 * @returns {ShopifyUrlParams} Shop domain and host token (empty strings when absent).
 */
export function getShopifyParams(): ShopifyUrlParams {
  const params = new URLSearchParams(window.location.search);

  return {
    shop: params.get('shop') ?? '',
    host: params.get('host') ?? '',
  };
}

/**
 * Detects the embedded Shopify Admin iframe context.
 * Both `shop` and `host` must be present; used to choose App Bridge token auth vs OAuth redirect flow.
 * @returns {boolean} True when the app should use session token authentication.
 */
export function isEmbeddedApp(): boolean {
  const { shop, host } = getShopifyParams();
  return Boolean(shop && host);
}

/**
 * Fetches a short-lived session JWT from Shopify App Bridge.
 * Requires `window.shopify` (injected by App Bridge) and throws if the script has not loaded yet.
 * The token is sent to `POST /api/auth/session` as a Bearer credential.
 * @returns {Promise<string>} Session token string suitable for the Authorization header.
 */
export async function getSessionToken(): Promise<string> {
  if (!window.shopify?.idToken) {
    throw new Error('Shopify App Bridge is not loaded');
  }

  return window.shopify.idToken();
}

/**
 * Exchanges an App Bridge session token for a server-side offline session.
 * Calls `POST /api/auth/session` with JSON `{ shop }` and `Authorization: Bearer <token>`.
 * Throws with the response body text when the server returns a non-OK status (400/401/500).
 * @param {string} shop - Shop domain matching the embedded URL; must align with the JWT shop claim.
 * @returns {Promise<EmbeddedSessionAuthResponse>} Parsed JSON auth result for UI state.
 */
export async function authenticateShop(
  shop: string,
): Promise<EmbeddedSessionAuthResponse> {
  const token = await getSessionToken();

  const response = await fetch('/api/auth/session', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ shop }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Authentication failed');
  }

  return response.json() as Promise<EmbeddedSessionAuthResponse>;
}

/**
 * Checks whether the backend considers a shop installed (non-embedded flow).
 * Issues `GET /api/shop/status?shop=…` without auth headers; used before redirecting to OAuth.
 * @param {string} shop - Shop domain from the page query string.
 * @returns {Promise<ShopStatusApiResponse>} Status payload driving redirect vs ready state.
 */
export async function fetchShopStatus(
  shop: string,
): Promise<ShopStatusApiResponse> {
  const response = await fetch(
    `/api/shop/status?shop=${encodeURIComponent(shop)}`,
  );

  if (!response.ok) {
    throw new Error('Failed to load shop status');
  }

  return response.json() as Promise<ShopStatusApiResponse>;
}
