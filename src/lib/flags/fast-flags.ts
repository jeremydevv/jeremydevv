import { FAST_FLAGS, type FastFlagKey } from "./registry";

export interface FastFlagProvider {
  getBooleanValue(
    key: FastFlagKey,
    defaultValue: boolean,
    context: Record<string, unknown>
  ): boolean | Promise<boolean>;
}

export interface FastFlagBranches<T> {
  enabled: () => T | Promise<T>;
  disabled: () => T | Promise<T>;
}

/**
 * Resolves a flag through an optional provider. No Flagship application,
 * binding, or provider is configured in this repository today; absence or
 * failure deliberately returns the registry default rather than pretending a
 * remote decision was received.
 */
export async function isFastFlagEnabled(
  provider: FastFlagProvider | undefined,
  key: FastFlagKey,
  context: Record<string, unknown> = {}
): Promise<boolean> {
  const fallback = FAST_FLAGS[key].defaultEnabled;

  if (!provider) {
    return fallback;
  }

  try {
    const decision = await provider.getBooleanValue(key, fallback, context);
    return typeof decision === "boolean" ? decision : fallback;
  } catch {
    return fallback;
  }
}

export async function withFastFlag<T>(
  provider: FastFlagProvider | undefined,
  key: FastFlagKey,
  branches: FastFlagBranches<T>,
  context: Record<string, unknown> = {}
): Promise<T> {
  return (await isFastFlagEnabled(provider, key, context))
    ? branches.enabled()
    : branches.disabled();
}
