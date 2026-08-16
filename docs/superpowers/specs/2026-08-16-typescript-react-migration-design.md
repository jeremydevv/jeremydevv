# TypeScript and React Migration Design

## Goal

Migrate the existing `jeremy.md` terminal portfolio from a JavaScript Worker that emits inline HTML, CSS, and browser JavaScript to a TypeScript and React application without redesigning the site or changing its public behavior.

## Architecture

Use Vite with React and TypeScript for the browser application and Cloudflare's Vite plugin for local development, production builds, and Worker integration. Keep a small TypeScript Cloudflare Worker for the `/status` response and existing request-routing behavior. Deploy the built client assets and Worker as one Cloudflare Workers unit.

The repository will contain:

- `index.html` as the Vite document shell and metadata source;
- `src/main.tsx` as the React entry point;
- `src/App.tsx` as the fast-flag-aware application boundary;
- focused terminal and classic-homepage React components;
- typed helpers and hooks for terminal-window state and geometry;
- shared CSS that preserves the current visual presentation;
- `worker/index.ts` for `/status`, root asset delivery, and non-root redirects; and
- Vite, TypeScript, Vitest, and Wrangler configuration.

## Behavior Preservation

The terminal homepage remains enabled by default. The existing `ff_terminalPortfolioHomepage` query override continues to accept `0`, `false`, and `off` as disabled values and `1`, `true`, and `on` as enabled values. The classic homepage remains callable as the fallback.

The React terminal preserves:

- the current text content, links, colors, dimensions, and responsive layout;
- pointer dragging constrained to the viewport;
- close followed by timed restoration to the centered state;
- minimize and restore behavior;
- zoom, unzoom, and title-bar double-click behavior;
- keyboard movement and keyboard zoom controls;
- focus, pointer-capture, resize, scrollbar, and reduced-motion behavior; and
- the existing accessibility labels and native buttons.

The application retains the current development and production Worker names, domains, variables, routes, cache policy, security headers, canonical metadata, `/status` JSON contract, and redirect of unsupported paths to `/`.

## Component Boundaries

`App` reads the URL flag once at startup and selects `TerminalHomepage` or `ClassicHomepage`. `TerminalHomepage` owns the page shell and composes `TerminalWindow`. `TerminalWindow` owns interaction state and delegates geometry calculations to pure typed helpers so constraints can be tested without a browser layout engine. `ClassicHomepage` is a stateless fallback. The Worker has no presentation responsibility; it only handles status, asset delivery, headers, and redirects.

## Data Flow and State

There is no persistent application data. Browser state is limited to the current terminal rectangle, saved pre-minimize or pre-zoom rectangle, drag pointer data, and closed/minimized/zoomed/focused flags. A close-restore timeout is cleared during cleanup. Window listeners and pointer interactions are registered through React effects and handlers and removed on unmount.

The Worker reads `SITE_URL` from its typed environment for the `/status` canonical value. It does not log or persist requests or user data.

## Error Handling

Missing DOM measurements fall back to the initial centered layout. Geometry helpers clamp dimensions and positions for small viewports. Unknown feature-flag values use the configured default. Unsupported request paths receive the existing redirect. The Worker uses the existing canonical fallback when `SITE_URL` is absent.

## Testing and Verification

Use Vitest, React Testing Library, and a DOM environment for component behavior. Tests cover feature-flag selection, visible content, window controls, keyboard behavior, and timer-driven close restoration. Pure geometry tests cover viewport bounds. Worker tests cover `/status`, root delivery, redirects, and security headers using real request/response behavior with a minimal asset binding.

The migration is complete only when:

- the new tests demonstrate the expected failures before implementation and pass afterward;
- all tests pass;
- TypeScript type checking passes for client, configuration, and Worker code;
- the Vite/Cloudflare production build succeeds;
- a local production-like preview returns successful responses for `/` and `/status` through the Tailnet preview URL; and
- the rendered terminal is visually checked at desktop and mobile widths.

## Scope Boundaries

This migration does not redesign the portfolio, add routes, add portfolio content, change deployment ownership, deploy the application, or alter the approved Cloudflare infrastructure. It also does not add React Router because the site has no client-side navigation requirement.
