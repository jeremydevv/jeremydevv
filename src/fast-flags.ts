import { FAST_FLAGS, type FastFlagKey } from "./lib/flags/registry";

export { FAST_FLAGS };
export type { FastFlagKey };

/**
 * This is the active rollout, not an extension of the expired 2026-09-12
 * `terminalPortfolioHomepage` flag.
 */
// fast-flag-use: terminalPortfolioHomepageV3
export const terminalPortfolioHomepageFlag = "terminalPortfolioHomepageV3" as const;

const legacyTerminalPortfolioHomepageQueries = ["terminalPortfolioHomepage", "terminalPortfolioHomepageV2"];

function booleanOverride(value: string | null): boolean | undefined {
  if (["0", "false", "off"].includes(value ?? "")) {
    return false;
  }

  if (["1", "true", "on"].includes(value ?? "")) {
    return true;
  }

  return undefined;
}

/**
 * Homepage-only local switch. It does not call a remote provider: Flagship is
 * intentionally unconfigured until a real application and binding are
 * provisioned. The old query parameter remains a one-way compatibility escape
 * hatch: it may select the safe classic fallback, never re-enable an expired
 * rollout.
 */
export function isFastFlagEnabled(url: URL, key: FastFlagKey): boolean {
  const versionedOverride = booleanOverride(url.searchParams.get(`ff_${key}`));
  if (versionedOverride !== undefined) {
    return versionedOverride;
  }

  const legacyDisabled = legacyTerminalPortfolioHomepageQueries.some((key) =>
    booleanOverride(url.searchParams.get(`ff_${key}`)) === false
  );
  if (legacyDisabled) {
    return false;
  }

  return FAST_FLAGS[key].defaultEnabled;
}
