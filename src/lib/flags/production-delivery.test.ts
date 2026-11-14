import { describe, expect, it } from "vitest";
import { productionDeliveryEnabled } from "./production-delivery";

describe("production delivery flag", () => {
  it("fails closed without explicit enablement or after expiration", () => {
    expect(productionDeliveryEnabled(undefined, "2026-11-09")).toBe(false);
    expect(productionDeliveryEnabled("false", "2026-11-09")).toBe(false);
    expect(productionDeliveryEnabled("true", "2026-11-09")).toBe(true);
    expect(productionDeliveryEnabled("true", "2026-12-08")).toBe(false);
  });
});
