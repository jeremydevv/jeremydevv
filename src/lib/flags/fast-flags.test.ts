import { describe, expect, it, vi } from "vitest";

import {
  isFastFlagEnabled,
  withFastFlag,
  type FastFlagProvider
} from "./fast-flags";

const key = "terminalPortfolioHomepageV3";

describe("fast flag provider adapter", () => {
  it("honors a provider true value", async () => {
    const provider: FastFlagProvider = { getBooleanValue: vi.fn().mockResolvedValue(true) };

    await expect(isFastFlagEnabled(provider, key)).resolves.toBe(true);
    expect(provider.getBooleanValue).toHaveBeenCalledWith(key, true, {});
  });

  it("honors a provider false value", async () => {
    const provider: FastFlagProvider = { getBooleanValue: vi.fn().mockResolvedValue(false) };

    await expect(isFastFlagEnabled(provider, key)).resolves.toBe(false);
  });

  it("uses the registry default when no remote provider is configured", async () => {
    await expect(isFastFlagEnabled(undefined, key)).resolves.toBe(true);
  });

  it("uses the registry default when the provider errors", async () => {
    const provider: FastFlagProvider = { getBooleanValue: vi.fn().mockRejectedValue(new Error("unavailable")) };

    await expect(isFastFlagEnabled(provider, key)).resolves.toBe(true);
  });

  it("uses the registry default for an invalid provider response", async () => {
    const provider = { getBooleanValue: vi.fn().mockResolvedValue(undefined) } as FastFlagProvider;

    await expect(isFastFlagEnabled(provider, key)).resolves.toBe(true);
  });

  it("invokes exactly the resolved enabled or disabled branch", async () => {
    const enabled = vi.fn().mockReturnValue("enabled");
    const disabled = vi.fn().mockReturnValue("disabled");

    await expect(withFastFlag({ getBooleanValue: () => false }, key, { enabled, disabled })).resolves.toBe("disabled");
    expect(enabled).not.toHaveBeenCalled();
    expect(disabled).toHaveBeenCalledTimes(1);
  });
});
