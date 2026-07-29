import { useEffect, useState } from 'react';
import {
  authenticateShop,
  fetchShopStatus,
  getShopifyParams,
  isEmbeddedApp,
} from '../lib/shopify';
import type { ShopifyAuthState, UseShopifyAuthResult } from '../types';

/**
 * Central auth hook for the embedded Shopify app shell.
 * On mount, reads `shop`/`host` from the URL. Embedded sessions call {@link authenticateShop};
 * standalone tabs call {@link fetchShopStatus} and redirect to `/api/auth` when not installed.
 * Exposes `embedded` and `shop` alongside status for {@link App} loading gates.
 * @returns {UseShopifyAuthResult} Discriminated union auth state plus embedding context.
 */
export function useShopifyAuth(): UseShopifyAuthResult {
  const [state, setState] = useState<ShopifyAuthState>({ status: 'idle' });
  const { shop } = getShopifyParams();
  const embedded = isEmbeddedApp();

  useEffect(() => {
    if (!shop) {
      setState({
        status: 'error',
        message: 'Missing shop parameter. Open this app from Shopify Admin.',
      });
      return;
    }

    let cancelled = false;

    /**
     * Performs one auth attempt for the current shop and embedding mode.
     * Sets `loading` first, then `ready` with shop metadata or `error` with a message.
     * Non-embedded not-installed shops navigate away to OAuth (full page redirect).
     * @returns {Promise<void>} Resolves when state is updated or the effect is cancelled.
     */
    async function runShopAuthentication(): Promise<void> {
      setState({ status: 'loading' });

      try {
        if (embedded) {
          const result = await authenticateShop(shop);
          if (cancelled) return;

          setState({
            status: 'ready',
            shop: result.shop.domain,
            name: result.shop.name,
            isFreshInstall: result.isFreshInstall,
          });
          return;
        }

        const status = await fetchShopStatus(shop);
        if (cancelled) return;

        if (!status.installed) {
          window.location.href = `/api/auth?shop=${encodeURIComponent(shop)}`;
          return;
        }

        setState({
          status: 'ready',
          shop: status.shop.domain,
          name: status.shop.name,
          isFreshInstall: false,
        });
      } catch (error) {
        if (cancelled) return;

        setState({
          status: 'error',
          message:
            error instanceof Error ? error.message : 'Authentication failed',
        });
      }
    }

    void runShopAuthentication();

    return () => {
      cancelled = true;
    };
  }, [embedded, shop]);

  return { ...state, embedded, shop };
}
