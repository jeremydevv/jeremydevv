import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(process.argv[2] ?? 'dist');
const config = JSON.parse(await readFile(resolve(root, 'jeremy_portfolio_development/wrangler.json'), 'utf8'));
const expectedRoutes = ['jeremy.md', 'www.jeremy.md'];
const routes = (config.routes ?? []).map((route) => route.pattern).sort();
if (config.name !== 'jeremy-portfolio-production' || config.targetEnvironment !== 'production' ||
    config.account_id !== '83952a1be987e4a12647732861a60925' ||
    config.vars?.SITE_URL !== 'https://jeremy.md' || config.workers_dev !== false ||
    config.preview_urls !== false || config.assets?.binding !== 'ASSETS' ||
    config.assets?.directory !== '../client' || config.main !== 'index.js' ||
    JSON.stringify(routes) !== JSON.stringify(expectedRoutes) ||
    config.routes.some((route) => route.zone_name !== 'jeremy.md' || route.custom_domain !== true)) {
  throw new Error('Production bundle configuration does not match the approved Worker, assets, and domains');
}
for (const path of ['jeremy_portfolio_development/index.js', 'client/index.html']) {
  if (!(await stat(resolve(root, path))).isFile()) throw new Error(`Missing bundle file: ${path}`);
}
console.log('Production bundle targets jeremy-portfolio-production and the expected domains.');
