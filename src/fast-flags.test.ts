import { describe, expect, it } from "vitest";

import {
  FAST_FLAGS,
  isFastFlagEnabled,
  terminalPortfolioHomepageFlag
} from "./fast-flags";

describe("terminal portfolio homepage rollout", () => {
  it("uses a new, bounded lifecycle instead of extending the expired legacy flag", () => {
    expect(
      isFastFlagEnabled(
        new URL("https://jeremy.md/"),
        terminalPortfolioHomepageFlag
      )
    ).toBe(true);
    expect(terminalPortfolioHomepageFlag).toBe("terminalPortfolioHomepageV3");
    expect(FAST_FLAGS[terminalPortfolioHomepageFlag]).toMatchObject({
      owner: "jeremydevv",
      fallback: "classicHomepage",
      createdAt: "2026-11-08",
      expiresAt: "2026-12-06",
      defaultEnabled: true
    });
  });

  it.each(["0", "false", "off"])("keeps the legacy disabled path callable for %s", (value) => {
    expect(
      isFastFlagEnabled(
        new URL(
          `https://jeremy.md/?ff_terminalPortfolioHomepage=${value}`
        ),
        terminalPortfolioHomepageFlag
      )
    ).toBe(false);
  });

  it.each(["1", "true", "on"])("does not resurrect the expired legacy flag for %s", (value) => {
    expect(
      isFastFlagEnabled(
        new URL(
          `https://jeremy.md/?ff_terminalPortfolioHomepage=${value}`
        ),
        terminalPortfolioHomepageFlag
      )
    ).toBe(true);
  });

  it.each(["0", "false", "off"])("uses the versioned local override for %s", (value) => {
    expect(
      isFastFlagEnabled(
        new URL(
          `https://jeremy.md/?ff_${terminalPortfolioHomepageFlag}=${value}`
        ),
        terminalPortfolioHomepageFlag
      )
    ).toBe(false);
  });
});
