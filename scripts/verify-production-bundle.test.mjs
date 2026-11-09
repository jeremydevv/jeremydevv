import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const script = new URL('./verify-production-bundle.mjs', import.meta.url).pathname;
test('accepts the production bundle and rejects development targets', async () => {
  const root = await mkdtemp(join(tmpdir(), 'portfolio-bundle-'));
  try {
    await mkdir(join(root, 'jeremy_portfolio_development'));
    await mkdir(join(root, 'client'));
    await writeFile(join(root, 'jeremy_portfolio_development/index.js'), '');
    await writeFile(join(root, 'client/index.html'), '');
    const cfg = { name: 'jeremy-portfolio-production', targetEnvironment: 'production', account_id: '83952a1be987e4a12647732861a60925', vars: {SITE_URL: 'https://jeremy.md'}, workers_dev: false, preview_urls: false, main: 'index.js', assets: {binding: 'ASSETS', directory: '../client'}, routes: [{pattern: 'jeremy.md', zone_name: 'jeremy.md', custom_domain: true}, {pattern: 'www.jeremy.md', zone_name: 'jeremy.md', custom_domain: true}] };
    const configPath = join(root, 'jeremy_portfolio_development/wrangler.json');
    await writeFile(configPath, JSON.stringify(cfg));
    assert.equal(spawnSync(process.execPath, [script, root]).status, 0);
    cfg.name = 'jeremy-portfolio-development';
    await writeFile(configPath, JSON.stringify(cfg));
    assert.notEqual(spawnSync(process.execPath, [script, root]).status, 0);
  } finally { await rm(root, {recursive: true, force: true}); }
});
