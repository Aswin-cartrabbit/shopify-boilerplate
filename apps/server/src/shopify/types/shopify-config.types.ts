/** Hostname and scheme parsed from the HOST env var for the Shopify SDK. */
export type ShopifyHostConfig = {
  hostName: string;
  hostScheme: 'http' | 'https';
};
