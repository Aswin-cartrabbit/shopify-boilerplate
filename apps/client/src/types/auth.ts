/** Discriminated union for {@link useShopifyAuth} loading lifecycle. */
export type ShopifyAuthState =
  | { status: 'idle' }
  | { status: 'loading' }
  | {
      status: 'ready';
      shop: string;
      name: string | null;
      isFreshInstall: boolean;
    }
  | { status: 'error'; message: string };

/** Return value of {@link useShopifyAuth} including URL embedding context. */
export type UseShopifyAuthResult = ShopifyAuthState & {
  embedded: boolean;
  shop: string;
};
