/**
 * Domain and database-layer types for shop install lifecycle.
 * Built on Prisma payloads; use in services, not in HTTP responses directly.
 */

import type { Prisma, Shop } from '@prisma/client';

/** Shop row including related sessions (caller filters session state in queries). */
export type ShopWithActiveSessions = Prisma.ShopGetPayload<{
  include: { sessions: true };
}>;

/** Outcome of {@link ShopService.persistSession} after OAuth or token exchange. */
export type PersistSessionResult = {
  shop: Shop;
  isFreshInstall: boolean;
};

/** Outcome of post-auth sync (persist + GraphQL metadata + reload with sessions). */
export type InstallCompleteResult = {
  shop: ShopWithActiveSessions;
  isFreshInstall: boolean;
};
