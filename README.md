## Hi there 👋

Website: https://jeremy.md

## Deploy

Production runs on the `jeremy-portfolio` Cloudflare Worker in the
`Jeremymathew100@outlook.com` account.

Use Cloudflare Workers Builds, or the included GitHub Actions workflow, with:

- Production branch: `development`
- Build command: `npm ci`
- Deploy command: `npx wrangler deploy --env production`
- GitHub Actions secrets: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`

<!--
...
-->
