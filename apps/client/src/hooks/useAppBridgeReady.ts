import { useEffect, useState } from 'react';

/**
 * Blocks UI rendering until Shopify App Bridge attaches `window.shopify`.
 * App Bridge loads asynchronously in the admin iframe; this hook polls every 50ms until available.
 * {@link App} shows a spinner while this returns false alongside auth and Polaris readiness.
 * @returns {boolean} True when `window.shopify` exists and App Bridge APIs can be called.
 */
export function useAppBridgeReady() {
  const [ready, setReady] = useState(() => Boolean(window.shopify));

  useEffect(() => {
    if (window.shopify) {
      setReady(true);
      return;
    }

    const interval = window.setInterval(() => {
      if (window.shopify) {
        setReady(true);
        window.clearInterval(interval);
      }
    }, 50);

    return () => window.clearInterval(interval);
  }, []);

  return ready;
}
