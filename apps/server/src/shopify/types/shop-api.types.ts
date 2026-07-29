/** Shop summary fields as returned in JSON API responses (dates are ISO strings). */
export type ShopSummary = {
  domain: string;
  name: string | null;
  status: string;
  installedAt: string | null;
  uninstalledAt: string | null;
};

export type ShopStatusNotInstalledResponse = {
  installed: false;
};

export type ShopStatusInstalledResponse = {
  installed: true;
  shop: ShopSummary;
};

export type ShopStatusApiResponse =
  | ShopStatusNotInstalledResponse
  | ShopStatusInstalledResponse;
