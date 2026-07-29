import { useEffect, useState } from 'react';
import { isPolarisLoaded, waitForPolaris } from '../lib/polaris';

/**
 * Delays Polaris-heavy UI until custom elements from the CDN script are defined.
 * Initializes from {@link isPolarisLoaded}; otherwise awaits {@link waitForPolaris}.
 * On load failure still marks ready so the app can surface errors instead of spinning forever.
 * @returns {boolean} True when Polaris web components are safe to render.
 */
export function usePolarisReady() {
  const [ready, setReady] = useState(() => isPolarisLoaded());

  useEffect(() => {
    if (ready) {
      return;
    }

    let cancelled = false;

    waitForPolaris()
      .then(() => {
        if (!cancelled) {
          setReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [ready]);

  return ready;
}
