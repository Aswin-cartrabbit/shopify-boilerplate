import { Shop } from '@prisma/client';

export const SHOP_EVENTS = {
  INSTALLED: 'shop.installed',
  UNINSTALLED: 'shop.uninstalled',
} as const;

export class ShopInstalledEvent {
  /**
   * Event payload published when a shop installs the app for the first time.
   * Emitted from {@link AuthService.completeInstall} after the shop row is created and synced.
   * @param {Shop} shop - Prisma shop entity including domain, status, and metadata fields.
   */
  constructor(public readonly shop: Shop) {}
}

export class ShopUninstalledEvent {
  /**
   * Event payload published after the app/uninstalled webhook revokes sessions.
   * Emitted from {@link WebhooksService.process} when uninstall handling succeeds.
   * @param {Shop} shop - Prisma shop entity with status UNINSTALLED and `uninstalledAt` set.
   */
  constructor(public readonly shop: Shop) {}
}
