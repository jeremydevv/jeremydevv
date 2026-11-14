/**
 * A flag may not stay active for more than this many calendar days without a
 * consciously-created successor. The checker enforces this lifecycle.
 */
export const FAST_FLAG_MAX_AGE_DAYS = 28;

export interface FastFlagMetadata {
  key: string;
  owner: string;
  surface: string;
  createdAt: string;
  expiresAt: string;
  fallback: string;
  defaultEnabled: boolean;
}

export const FAST_FLAGS = {
  productionDelivery: {
    key: "productionDelivery",
    owner: "jeremydevv",
    surface: "production Worker delivery",
    createdAt: "2026-11-09",
    expiresAt: "2026-12-07",
    fallback: "do not deploy",
    defaultEnabled: false
  },
  terminalTextZoom: {
    key: "terminalTextZoom",
    owner: "jeremydevv",
    surface: "terminal text zoom",
    createdAt: "2026-11-07",
    expiresAt: "2026-12-05",
    fallback: "fixed terminal text size",
    defaultEnabled: true
  },
  collapsiblePortfolio: {
    key: "collapsiblePortfolio",
    owner: "jeremydevv",
    surface: "homepage sections",
    createdAt: "2026-11-07",
    expiresAt: "2026-12-05",
    fallback: "expanded portfolio sections",
    defaultEnabled: true
  },
  expandedPortfolio: {
    key: "expandedPortfolio",
    owner: "jeremydevv",
    surface: "homepage content",
    createdAt: "2026-11-07",
    expiresAt: "2026-12-05",
    fallback: "existing portfolio introduction",
    defaultEnabled: true
  },
  terminalPortfolioHomepageV3: {
    key: "terminalPortfolioHomepageV3",
    owner: "jeremydevv",
    surface: "homepage",
    createdAt: "2026-11-08",
    expiresAt: "2026-12-06",
    fallback: "classicHomepage",
    defaultEnabled: true
  }
} as const satisfies Record<string, FastFlagMetadata>;

export type FastFlagKey = keyof typeof FAST_FLAGS;
