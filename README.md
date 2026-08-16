## Hi there 👋

Website: https://jeremy.md

The portfolio frontend is built with React and TypeScript, bundled by Vite,
and served with a TypeScript Cloudflare Worker.

## Develop

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Validate changes with:

```bash
npm test
npm run typecheck
npm run build
```

## Deploy

Production runs on the `jeremy-portfolio-production` Cloudflare Worker in the
`Jeremymathew100@outlook.com` account.

Use Cloudflare Workers Builds with:

- Production branch: `development`
- Deploy command: `npm run deploy:production`

The development environment can be built and deployed with `npm run deploy`.
Cloudflare environment selection happens during the Vite build.

<!--
...
-->
