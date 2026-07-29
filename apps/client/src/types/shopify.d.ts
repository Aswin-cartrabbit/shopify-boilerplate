interface ShopifyGlobal {
  idToken(): Promise<string>;
  toast: {
    show(message: string): void;
  };
}

declare global {
  interface Window {
    shopify?: ShopifyGlobal;
  }
}

export {};
