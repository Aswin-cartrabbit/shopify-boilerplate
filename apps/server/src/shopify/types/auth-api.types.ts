import type { InstallCompleteResult } from './shop-persistence.types';

/** Minimal shop summary from POST /api/auth/session. */
export type EmbeddedAuthShopSummary = {
  domain: string;
  name: string | null;
  status: string;
};

export type EmbeddedSessionAuthResponse = {
  success: true;
  isFreshInstall: boolean;
  shop: EmbeddedAuthShopSummary;
};

/** Internal result of OAuth callback before HTTP redirect. */
export type OAuthCallbackResult = {
  redirectUrl: string;
} & InstallCompleteResult;
