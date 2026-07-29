import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SHOP_EVENTS, ShopInstalledEvent } from './shop.events';

@Injectable()
export class ShopInstalledListener {
  private readonly logger = new Logger(ShopInstalledListener.name);

  /**
   * Default handler for first-time installs after OAuth or token exchange.
   * Listens on {@link SHOP_EVENTS.INSTALLED}; extend this class or add listeners for provisioning jobs,
   * analytics, or welcome emails. Currently logs domain and internal id for visibility in server logs.
   * @param {ShopInstalledEvent} event - Payload containing the persisted shop row after install.
   * @returns {void}
   */
  @OnEvent(SHOP_EVENTS.INSTALLED)
  onShopInstalled(event: ShopInstalledEvent):void {
    this.logger.log(
      `Fresh install: ${event.shop.shopDomain} (${event.shop.id})`,
    );
  }
}
