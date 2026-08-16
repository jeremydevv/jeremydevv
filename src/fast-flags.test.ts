import { describe, expect, it } from "vitest";

import { FAST_FLAGS, isFastFlagEnabled } from "./fast-flags";

describe("terminalPortfolioHomepage", () => {
  it("is enabled by default and retains its lifecycle metadata", () => {
    expect(
      isFastFlagEnabled(
        new URL("https://jeremy.md/"),
        "terminalPortfolioHomepage"
      )
    ).toBe(true);
    expect(FAST_FLAGS.terminalPortfolioHomepage).toMatchObject({
      owner: "jeremydevv",
      fallback: "classicHomepage",
      createdAt: "2026-08-15",
      expiresAt: "2026-09-12"
    });
  });

  it.each(["0", "false", "off"])("disables for %s", (value) => {
    expect(
      isFastFlagEnabled(
        new URL(
          `https://jeremy.md/?ff_terminalPortfolioHomepage=${value}`
        ),
        "terminalPortfolioHomepage"
      )
    ).toBe(false);
  });

  it.each(["1", "true", "on"])("enables for %s", (value) => {
    expect(
      isFastFlagEnabled(
        new URL(
          `https://jeremy.md/?ff_terminalPortfolioHomepage=${value}`
        ),
        "terminalPortfolioHomepage"
      )
    ).toBe(true);
  });
});
