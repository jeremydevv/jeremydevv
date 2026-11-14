import { FAST_FLAGS } from "./registry.ts";

// fast-flag-use: productionDelivery
export function productionDeliveryEnabled(override: string | undefined, today: string): boolean {
  return override === "true" && today <= FAST_FLAGS.productionDelivery.expiresAt;
}
