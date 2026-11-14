import { readdir, readFile } from "node:fs/promises";
import { resolve, relative, join } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(process.env.FAST_FLAGS_ROOT ?? process.cwd());
const registryPath = join(root, "src/lib/flags/registry.ts");
const adapterPath = join(root, "src/lib/flags/fast-flags.ts");
const sourceRoot = join(root, "src");
const errors = [];

function parseDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined;
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day
    ? parsed
    : undefined;
}

async function filesUnder(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }

  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await filesUnder(path)));
    } else if (/\.(?:ts|tsx)$/.test(entry.name)) {
      files.push(path);
    }
  }
  return files;
}

let registry;
try {
  registry = await import(`${pathToFileURL(registryPath).href}?checked=${Date.now()}`);
} catch (error) {
  console.error(`fast-flags: could not load ${relative(root, registryPath)}: ${error.message}`);
  process.exitCode = 1;
}

if (!registry) {
  process.exit();
}

const { FAST_FLAGS, FAST_FLAG_MAX_AGE_DAYS } = registry;
if (!FAST_FLAGS || typeof FAST_FLAGS !== "object" || Array.isArray(FAST_FLAGS)) {
  errors.push("registry must export FAST_FLAGS as an object");
}
if (!Number.isInteger(FAST_FLAG_MAX_AGE_DAYS) || FAST_FLAG_MAX_AGE_DAYS < 1) {
  errors.push("registry must export a positive integer FAST_FLAG_MAX_AGE_DAYS");
}

const now = parseDate(process.env.FAST_FLAGS_NOW ?? new Date().toISOString().slice(0, 10));
if (!now) {
  errors.push("FAST_FLAGS_NOW must use YYYY-MM-DD");
}

const entries = Object.entries(FAST_FLAGS ?? {});
for (const [key, metadata] of entries) {
  if (!metadata || typeof metadata !== "object") {
    errors.push(`${key}: metadata must be an object`);
    continue;
  }

  if (metadata.key !== key) {
    errors.push(`${key}: metadata key must match its registry key`);
  }
  for (const field of ["owner", "surface", "fallback"]) {
    if (typeof metadata[field] !== "string" || metadata[field].trim() === "") {
      errors.push(`${key}: ${field} must be a non-empty string`);
    }
  }
  if (typeof metadata.defaultEnabled !== "boolean") {
    errors.push(`${key}: defaultEnabled must be a boolean`);
  }

  const createdAt = parseDate(metadata.createdAt);
  const expiresAt = parseDate(metadata.expiresAt);
  if (!createdAt) errors.push(`${key}: createdAt must use a real YYYY-MM-DD date`);
  if (!expiresAt) errors.push(`${key}: expiresAt must use a real YYYY-MM-DD date`);
  if (createdAt && expiresAt) {
    const age = (expiresAt.getTime() - createdAt.getTime()) / 86_400_000;
    if (age < 0) errors.push(`${key}: expiresAt must not precede createdAt`);
    if (age > FAST_FLAG_MAX_AGE_DAYS) {
      errors.push(`${key}: lifecycle must not exceed ${FAST_FLAG_MAX_AGE_DAYS} calendar days`);
    }
  }
  if (expiresAt && now && expiresAt < now) {
    errors.push(`${key}: flag expired on ${metadata.expiresAt}; create a successor instead of extending it`);
  }
}

const usageKeys = new Set();
for (const path of await filesUnder(sourceRoot)) {
  const content = await readFile(path, "utf8");
  const source = relative(root, path);
  const usages = content.matchAll(/^\s*\/\/\s*fast-flag-use:\s*([A-Za-z][A-Za-z0-9]*)\s*$/gm);
  for (const usage of usages) {
    usageKeys.add(usage[1]);
    if (!Object.hasOwn(FAST_FLAGS ?? {}, usage[1])) {
      errors.push(`${source}: fast-flag-use ${usage[1]} is not registered`);
    }
  }
  if (resolve(path) !== resolve(adapterPath) && /\.getBooleanValue\s*\(/.test(content)) {
    errors.push(`${source}: direct provider access is only allowed in src/lib/flags/fast-flags.ts`);
  }
}

for (const key of Object.keys(FAST_FLAGS ?? {})) {
  if (!usageKeys.has(key)) {
    errors.push(`${key}: registered flag has no fast-flag-use source marker`);
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`fast-flags: ${error}`);
  process.exitCode = 1;
} else {
  console.log(`fast-flags: ${entries.length} registered flag${entries.length === 1 ? "" : "s"} passed lifecycle and usage checks`);
}
