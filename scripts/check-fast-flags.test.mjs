import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import assert from "node:assert/strict";

const projectRoot = process.cwd();

const validRegistry = `
export const FAST_FLAG_MAX_AGE_DAYS = 28;
export const FAST_FLAGS = {
  terminalPortfolioHomepageV2: {
    key: "terminalPortfolioHomepageV2",
    owner: "jeremydevv",
    surface: "homepage",
    createdAt: "2026-09-14",
    expiresAt: "2026-10-12",
    fallback: "classicHomepage",
    defaultEnabled: true
  }
};
`;

async function writeFixture(files) {
  const root = await mkdtemp(join(tmpdir(), "fast-flags-"));
  for (const [relativePath, content] of Object.entries(files)) {
    const target = join(root, relativePath);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content);
  }
  return root;
}

function check(root) {
  return spawnSync(process.execPath, ["scripts/check-fast-flags.mjs"], {
    cwd: projectRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      FAST_FLAGS_ROOT: root,
      FAST_FLAGS_NOW: "2026-09-14"
    }
  });
}

test("accepts bounded metadata with an explicit source usage", async (t) => {
  const root = await writeFixture({
    "src/lib/flags/registry.ts": validRegistry,
    "src/feature.ts": "// fast-flag-use: terminalPortfolioHomepageV2\n"
  });
  t.after(() => rm(root, { recursive: true, force: true }));

  const result = check(root);
  assert.equal(result.status, 0, result.stderr);
});

test("rejects malformed or overlong metadata", async (t) => {
  const root = await writeFixture({
    "src/lib/flags/registry.ts": validRegistry
      .replace('expiresAt: "2026-10-12"', 'expiresAt: "2026-10-13"')
      .replace('fallback: "classicHomepage",\n    ', ""),
    "src/feature.ts": "// fast-flag-use: terminalPortfolioHomepageV2\n"
  });
  t.after(() => rm(root, { recursive: true, force: true }));

  const result = check(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /fallback/);
  assert.match(result.stderr, /28 calendar days/);
});

test("rejects an unregistered source use and direct provider access", async (t) => {
  const root = await writeFixture({
    "src/lib/flags/registry.ts": validRegistry,
    "src/feature.ts": [
      "// fast-flag-use: notRegisteredV1",
      "provider.getBooleanValue(\"notRegisteredV1\", true, {});"
    ].join("\n")
  });
  t.after(() => rm(root, { recursive: true, force: true }));

  const result = check(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /not registered/);
  assert.match(result.stderr, /direct provider access/);
});
