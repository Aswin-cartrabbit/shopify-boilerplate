/**
 * Polaris web components runtime is loaded from Shopify CDN in index.html:
 * https://cdn.shopify.com/shopifycloud/polaris.js
 *
 * TypeScript support comes from @shopify/polaris-types (dev dependency).
 * Use <s-page>, <s-section>, <s-button>, etc. directly in JSX — no imports needed.
 */

export const POLARIS_CDN_URL =
  'https://cdn.shopify.com/shopifycloud/polaris.js';

/**
 * Tests whether Polaris custom elements have been registered on `customElements`.
 * Uses `s-page` as a canary tag defined by the Polaris web components bundle.
 * @returns {boolean} True when `customElements.get('s-page')` is defined.
 */
export function isPolarisLoaded() {
  return customElements.get('s-page') !== undefined;
}

/**
 * Polls until Polaris registers or until the timeout fires.
 * Resolves immediately when already loaded; rejects with an Error after `timeoutMs` to avoid hanging the UI forever.
 * Used by {@link usePolarisReady} before rendering Polaris markup.
 * @param {number} timeoutMs - Maximum wait in milliseconds (default 10_000).
 * @returns {Promise<void>} Resolves when Polaris is ready; rejects on timeout.
 */
export function waitForPolaris(timeoutMs = 10_000) {
  if (isPolarisLoaded()) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const started = Date.now();

    const interval = window.setInterval(() => {
      if (isPolarisLoaded()) {
        window.clearInterval(interval);
        resolve();
        return;
      }

      if (Date.now() - started >= timeoutMs) {
        window.clearInterval(interval);
        reject(new Error('Polaris web components failed to load'));
      }
    }, 50);
  });
}
