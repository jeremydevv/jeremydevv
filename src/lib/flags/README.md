# Local feature-flag adapter

The browser homepage currently resolves its flag from the local registry and
the explicit `ff_` query overrides only. No Cloudflare Flagship application,
provider binding, or remote provider configuration exists in this repository.

`fast-flags.ts` is an optional provider adapter for a future, explicitly
provisioned integration. It falls back to the registered default whenever no
provider is supplied or a provider fails. Do not add a placeholder application
ID or describe this local adapter as a remote Flagship integration.

The registry is checked by `npm run flags:check`; each entry needs an owner,
fallback, and a lifecycle of no more than 28 calendar days.
