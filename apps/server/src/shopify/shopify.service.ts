import { Injectable } from '@nestjs/common';
import { createShopify } from './shopify.config';
import type { Shopify } from '@shopify/shopify-api';

@Injectable()
export class ShopifyService {
  readonly shopify: Shopify;

  /**
   * Creates one Shopify SDK client per Nest process from environment configuration.
   * Exposed as `shopify` so auth and webhook services call OAuth, GraphQL, and validators on the same instance.
   */
  constructor() {
    this.shopify = createShopify();
  }
}
