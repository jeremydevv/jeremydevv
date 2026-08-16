export const FAST_FLAGS = {
  terminalPortfolioHomepage: {
    key: "terminalPortfolioHomepage",
    owner: "jeremydevv",
    surface: "homepage",
    createdAt: "2026-08-15",
    expiresAt: "2026-09-12",
    fallback: "classicHomepage",
    defaultEnabled: true
  }
} as const;

export type FastFlagKey = keyof typeof FAST_FLAGS;

export function isFastFlagEnabled(url: URL, key: FastFlagKey): boolean {
  const value = url.searchParams.get(`ff_${key}`);

  if (value === "0" || value === "false" || value === "off") {
    return false;
  }

  if (value === "1" || value === "true" || value === "on") {
    return true;
  }

  return FAST_FLAGS[key].defaultEnabled;
}
