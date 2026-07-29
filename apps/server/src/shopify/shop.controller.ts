import { Controller, Get, Query } from '@nestjs/common';
import { AuthService } from './auth/auth.service';
import type { ShopStatusApiResponse } from './types';

@Controller('api/shop')
export class ShopController {
  /**
   * Read-only shop metadata for the React client before or after OAuth.
   * @param {AuthService} authService - Loads shops via {@link AuthService.getShopStatus}.
   */
  constructor(private readonly authService: AuthService) {}

  /**
   * Reports whether a shop has installed the app and returns display metadata.
   * Called as `GET /api/shop/status?shop=example.myshopify.com` from the non-embedded client path
   * in {@link useShopifyAuth}; when `installed` is false the client redirects to OAuth.
   * When the shop is unknown, returns `{ installed: false }` without error.
   * @param {string} shop - Shopify shop domain query parameter from the browser URL.
   * @returns {Promise<ShopStatusApiResponse>} Installation flag and optional shop summary.
   */
  @Get('status')
  async status(@Query('shop') shop: string): Promise<ShopStatusApiResponse> {
    const shopRecord = await this.authService.getShopStatus(shop);

    if (!shopRecord) {
      return { installed: false };
    }

    const isInstalled = shopRecord.status === 'INSTALLED';

    if (!isInstalled) {
      return { installed: false };
    }

    return {
      installed: true,
      shop: {
        domain: shopRecord.shopDomain,
        name: shopRecord.name,
        status: shopRecord.status,
        installedAt: shopRecord.installedAt?.toISOString() ?? null,
        uninstalledAt: shopRecord.uninstalledAt?.toISOString() ?? null,
      },
    };
  }
}
