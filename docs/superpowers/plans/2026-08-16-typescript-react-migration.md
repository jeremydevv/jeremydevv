# TypeScript and React Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the inline JavaScript/HTML Worker homepage with a typed React application while preserving the terminal portfolio's public behavior and Cloudflare deployment contract.

**Architecture:** Vite builds a React TypeScript client and Cloudflare's Vite plugin packages it with a small TypeScript Worker. React owns presentation and terminal interaction state; the Worker owns `/status`, static asset delivery, security headers, and unsupported-path redirects.

**Tech Stack:** React 19, TypeScript 7, Vite 8, `@vitejs/plugin-react`, `@cloudflare/vite-plugin`, Cloudflare Workers/Wrangler, Vitest, React Testing Library, jsdom.

## Global Constraints

- Preserve the current terminal and classic homepage copy, appearance, accessibility labels, and interactions.
- Keep `jeremy-portfolio-development` and `jeremy-portfolio-production`, their existing domains, and the `SITE_URL` binding.
- Keep `terminalPortfolioHomepage` enabled by default with its existing owner, fallback, creation date, expiry, and query override syntax.
- Do not add React Router, persistence, new public routes, new portfolio content, infrastructure, or deployment behavior.
- Do not deploy, commit, or push without explicit owner approval.
- Require Node.js `>=22.13.0`, satisfying both Vite 8 and jsdom 29 on Node 22.

## File Map

- `index.html`: document metadata and React mount point.
- `src/main.tsx`: browser bootstrap only.
- `src/App.tsx`: feature-flag selection between page variants.
- `src/fast-flags.ts`: typed flag metadata and URL override evaluation.
- `src/components/ClassicHomepage.tsx`: stateless fallback page.
- `src/components/TerminalHomepage.tsx`: terminal page composition and copy.
- `src/components/TerminalWindow.tsx`: window interaction state and DOM event handlers.
- `src/components/terminal-geometry.ts`: pure rectangle and viewport calculations.
- `src/styles.css`: migrated visual styles for both page variants.
- `worker/index.ts`: typed Cloudflare request handler.
- `src/test/setup.ts`: DOM matcher setup.
- `src/**/*.test.ts(x)`: client unit and behavior tests colocated with their subjects.
- `worker/index.test.ts`: Worker contract tests.
- `vite.config.ts`, `tsconfig*.json`: build, type-check, and test configuration.
- `wrangler.jsonc`: Worker entry point and asset routing/binding.

---

### Task 1: TypeScript, React, and feature-flag foundation

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `tsconfig.worker.json`
- Create: `src/test/setup.ts`
- Create: `src/fast-flags.test.ts`
- Create: `src/fast-flags.ts`

**Interfaces:**
- Produces: `isFastFlagEnabled(url: URL, key: FastFlagKey): boolean`
- Produces: `FAST_FLAGS.terminalPortfolioHomepage` metadata.

- [ ] **Step 1: Install the approved toolchain and add configuration**

Set scripts to:

```json
{
  "build": "vite build",
  "check": "npm run typecheck && npm test && npm run build",
  "dev": "vite",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest",
  "typecheck": "tsc -b"
}
```

Add React runtime dependencies and the TypeScript/Vite/Cloudflare/Vitest/Testing Library development dependencies. Set `engines.node` to `>=22.12.0`. Configure Vite with `react()` and `cloudflare()`, a jsdom test environment, `src/test/setup.ts`, and test inclusion for both `src` and `worker`. Configure project references for browser, Node configuration, and Worker TypeScript projects.

- [ ] **Step 2: Write the failing feature-flag tests**

```ts
import { describe, expect, it } from "vitest";
import { FAST_FLAGS, isFastFlagEnabled } from "./fast-flags";

describe("terminalPortfolioHomepage", () => {
  it("is enabled by default and retains its lifecycle metadata", () => {
    expect(isFastFlagEnabled(new URL("https://jeremy.md/"), "terminalPortfolioHomepage")).toBe(true);
    expect(FAST_FLAGS.terminalPortfolioHomepage).toMatchObject({
      owner: "jeremydevv",
      fallback: "classicHomepage",
      createdAt: "2026-08-15",
      expiresAt: "2026-09-12"
    });
  });

  it.each(["0", "false", "off"])("disables for %s", (value) => {
    expect(isFastFlagEnabled(new URL(`https://jeremy.md/?ff_terminalPortfolioHomepage=${value}`), "terminalPortfolioHomepage")).toBe(false);
  });

  it.each(["1", "true", "on"])("enables for %s", (value) => {
    expect(isFastFlagEnabled(new URL(`https://jeremy.md/?ff_terminalPortfolioHomepage=${value}`), "terminalPortfolioHomepage")).toBe(true);
  });
});
```

- [ ] **Step 3: Run the focused test and confirm the missing-module failure**

Run: `npm test -- src/fast-flags.test.ts`

Expected: FAIL because `src/fast-flags.ts` does not exist.

- [ ] **Step 4: Implement the typed flag helper**

```ts
export const FAST_FLAGS = {
  terminalPortfolioHomepage: {
    key: "terminalPortfolioHomepage",
    owner: "jeremydevv",
    surface: "homepage",
    createdAt: "2026-08-15",
    expiresAt: "2026-09-12",
    fallback: "classicHomepage",
    defaultEnabled: true
  }
} as const;

export type FastFlagKey = keyof typeof FAST_FLAGS;

export function isFastFlagEnabled(url: URL, key: FastFlagKey): boolean {
  const value = url.searchParams.get(`ff_${key}`);
  if (value === "0" || value === "false" || value === "off") return false;
  if (value === "1" || value === "true" || value === "on") return true;
  return FAST_FLAGS[key].defaultEnabled;
}
```

- [ ] **Step 5: Run the focused test and type checker**

Run: `npm test -- src/fast-flags.test.ts && npm run typecheck`

Expected: the flag tests and TypeScript build pass.

- [ ] **Step 6: Review the task diff without committing**

Run: `git diff -- package.json package-lock.json index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json tsconfig.worker.json src/test/setup.ts src/fast-flags.ts src/fast-flags.test.ts`

Expected: only the toolchain foundation and tested fast-flag behavior are present.

---

### Task 2: React page selection and page content

**Files:**
- Create: `src/App.test.tsx`
- Create: `src/App.tsx`
- Create: `src/main.tsx`
- Create: `src/components/ClassicHomepage.tsx`
- Create: `src/components/TerminalHomepage.tsx`
- Create: `src/styles.css`

**Interfaces:**
- Consumes: `isFastFlagEnabled(url, "terminalPortfolioHomepage")`.
- Produces: `App({ url?: URL }): JSX.Element` with terminal/classic selection.
- Produces: `TerminalHomepage` with the existing terminal copy and links.
- Produces: `ClassicHomepage` with the existing name, description, GitHub, email, and status links.

- [ ] **Step 1: Write failing page-selection and content tests**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("renders the terminal homepage by default", () => {
    render(<App url={new URL("https://jeremy.md/")} />);
    expect(screen.getByRole("main", { name: "Movable desktop portfolio" })).toBeInTheDocument();
    expect(screen.getByText("available commands:", { exact: false })).toBeInTheDocument();
  });

  it("renders the classic fallback when the flag is disabled", () => {
    render(<App url={new URL("https://jeremy.md/?ff_terminalPortfolioHomepage=off")} />);
    expect(screen.getByRole("heading", { name: "Jeremy Mathew" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", "https://github.com/jeremydevv");
    expect(screen.getByRole("link", { name: "Status" })).toHaveAttribute("href", "/status");
  });
});
```

- [ ] **Step 2: Run the focused test and confirm the missing-component failure**

Run: `npm test -- src/App.test.tsx`

Expected: FAIL because `src/App.tsx` does not exist.

- [ ] **Step 3: Implement the page boundary and static page components**

```tsx
export function App({ url = new URL(window.location.href) }: { url?: URL }) {
  return isFastFlagEnabled(url, "terminalPortfolioHomepage")
    ? <TerminalHomepage />
    : <ClassicHomepage />;
}
```

`TerminalHomepage` must render semantic JSX for the current terminal markup, including the three labeled window-control buttons, title-bar keyboard metadata, help output, identity/focus/link commands, GitHub/email/status links, and cursor. `ClassicHomepage` must render the exact existing fallback copy. Move the current CSS into `src/styles.css`, scope fallback selectors under `.classic-homepage`, and retain both responsive media queries.

- [ ] **Step 4: Bootstrap React**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode><App /></StrictMode>
);
```

- [ ] **Step 5: Run the focused tests and type checker**

Run: `npm test -- src/App.test.tsx src/fast-flags.test.ts && npm run typecheck`

Expected: both test files and TypeScript build pass.

- [ ] **Step 6: Review the task diff without committing**

Run: `git diff -- src/App.tsx src/App.test.tsx src/main.tsx src/components/ClassicHomepage.tsx src/components/TerminalHomepage.tsx src/styles.css`

Expected: the existing content and styles have moved into typed React components without a redesign.

---

### Task 3: Typed terminal geometry and interactions

**Files:**
- Create: `src/components/terminal-geometry.test.ts`
- Create: `src/components/terminal-geometry.ts`
- Create: `src/components/TerminalWindow.test.tsx`
- Create: `src/components/TerminalWindow.tsx`
- Modify: `src/components/TerminalHomepage.tsx`

**Interfaces:**
- Produces: `Rect`, `Viewport`, `clamp`, `placeRect`, and `zoomedRect` pure geometry exports.
- Produces: `TerminalWindow({ children }: PropsWithChildren): JSX.Element`.
- Consumes: `TerminalHomepage` content as `children`.

- [ ] **Step 1: Write failing geometry tests**

```ts
import { describe, expect, it } from "vitest";
import { placeRect, zoomedRect } from "./terminal-geometry";

describe("terminal geometry", () => {
  it("keeps a window inside the viewport margin", () => {
    expect(placeRect({ left: -50, top: 900, width: 340, height: 250 }, { width: 800, height: 600 }, 12)).toEqual({
      left: 12, top: 338, width: 340, height: 250
    });
  });

  it("creates an 18 pixel inset zoom rectangle", () => {
    expect(zoomedRect({ width: 1000, height: 700 })).toEqual({ left: 18, top: 18, width: 964, height: 664 });
  });
});
```

- [ ] **Step 2: Run geometry tests and confirm the missing-module failure**

Run: `npm test -- src/components/terminal-geometry.test.ts`

Expected: FAIL because `terminal-geometry.ts` does not exist.

- [ ] **Step 3: Implement the pure geometry functions**

```ts
export type Rect = { left: number; top: number; width: number; height: number };
export type Viewport = { width: number; height: number };
export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function placeRect(rect: Rect, viewport: Viewport, margin = 12): Rect {
  return {
    ...rect,
    left: clamp(rect.left, margin, Math.max(margin, viewport.width - rect.width - margin)),
    top: clamp(rect.top, margin, Math.max(margin, viewport.height - rect.height - margin))
  };
}

export function zoomedRect(viewport: Viewport): Rect {
  return { left: 18, top: 18, width: viewport.width - 36, height: viewport.height - 36 };
}
```

- [ ] **Step 4: Run geometry tests and confirm they pass**

Run: `npm test -- src/components/terminal-geometry.test.ts`

Expected: both geometry tests pass.

- [ ] **Step 5: Write failing interaction tests**

```tsx
it("minimizes, restores, zooms, and restores after close", async () => {
  vi.useFakeTimers();
  render(<TerminalWindow><span>content</span></TerminalWindow>);
  const terminal = screen.getByRole("region", { name: "Jeremy portfolio terminal" });

  fireEvent.click(screen.getByRole("button", { name: "Minimize" }));
  expect(terminal).toHaveClass("is-minimized");
  fireEvent.click(screen.getByRole("button", { name: "Zoom" }));
  expect(terminal).not.toHaveClass("is-minimized");
  fireEvent.click(screen.getByRole("button", { name: "Zoom" }));
  expect(terminal).toHaveClass("is-zoomed");
  fireEvent.click(screen.getByRole("button", { name: "Close" }));
  expect(terminal).toHaveClass("is-closed");
  await vi.advanceTimersByTimeAsync(350);
  expect(terminal).not.toHaveClass("is-closed");
  vi.useRealTimers();
});

it("supports keyboard movement and keyboard zoom", () => {
  render(<TerminalWindow><span>content</span></TerminalWindow>);
  const titlebar = screen.getByRole("banner", { name: "Drag terminal window" });
  fireEvent.keyDown(titlebar, { key: "ArrowRight" });
  expect(screen.getByRole("region", { name: "Jeremy portfolio terminal" })).toHaveStyle({ transform: "none" });
  fireEvent.keyDown(titlebar, { key: "Enter" });
  expect(screen.getByRole("region", { name: "Jeremy portfolio terminal" })).toHaveClass("is-zoomed");
});
```

- [ ] **Step 6: Run interaction tests and confirm the missing-component failure**

Run: `npm test -- src/components/TerminalWindow.test.tsx`

Expected: FAIL because `TerminalWindow.tsx` does not exist.

- [ ] **Step 7: Implement React-owned terminal state and handlers**

Use typed state for `isClosed`, `isMinimized`, `isZoomed`, `isFocused`, current inline rectangle, saved rectangle, and a `DragState` containing `pointerId`, `offsetX`, and `offsetY`. Port the existing pointer down/move/up/cancel, double-click, keydown, resize, close timeout, focus, minimize, restore, and zoom behavior into React handlers and effects. Clear the timeout and resize listener on unmount. Render class names from state and apply the current rectangle through `CSSProperties`.

- [ ] **Step 8: Run all client tests and type checking**

Run: `npm test -- src && npm run typecheck`

Expected: all client tests and TypeScript build pass.

- [ ] **Step 9: Review the task diff without committing**

Run: `git diff -- src/components/TerminalWindow.tsx src/components/TerminalWindow.test.tsx src/components/terminal-geometry.ts src/components/terminal-geometry.test.ts src/components/TerminalHomepage.tsx`

Expected: terminal behavior is expressed in typed React state with pure, tested geometry helpers.

---

### Task 4: TypeScript Worker and Cloudflare asset delivery

**Files:**
- Create: `worker/index.test.ts`
- Create: `worker/index.ts`
- Modify: `wrangler.jsonc`
- Create: `public/_headers`

**Interfaces:**
- Produces: `Env = { SITE_URL?: string; ASSETS: Fetcher }`.
- Produces: default `ExportedHandler<Env>` handling `/status`, `/`, `/assets/*`, and unsupported paths.
- Consumes: the `ASSETS` binding generated by Cloudflare's Vite integration.

- [ ] **Step 1: Write failing Worker contract tests**

```ts
import { describe, expect, it, vi } from "vitest";
import worker from "./index";

const env = {
  SITE_URL: "https://dev.jeremy.md",
  ASSETS: { fetch: vi.fn(async () => new Response("<div id=\"root\"></div>", { headers: { "content-type": "text/html" } })) }
};

it("returns the status contract", async () => {
  const response = await worker.fetch(new Request("https://example.test/status"), env);
  await expect(response.json()).resolves.toEqual({ ok: true, worker: "jeremy-portfolio", canonical: "https://dev.jeremy.md" });
});

it("serves root assets with security headers", async () => {
  const response = await worker.fetch(new Request("https://example.test/"), env);
  expect(await response.text()).toContain("id=\"root\"");
  expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  expect(response.headers.get("content-security-policy")).toContain("script-src 'self'");
});

it("redirects unsupported paths to root", async () => {
  const response = await worker.fetch(new Request("https://example.test/missing"), env);
  expect(response.status).toBe(302);
  expect(response.headers.get("location")).toBe("https://example.test/");
});
```

- [ ] **Step 2: Run Worker tests and confirm the missing-module failure**

Run: `npm test -- worker/index.test.ts`

Expected: FAIL because `worker/index.ts` does not exist.

- [ ] **Step 3: Implement the typed Worker**

```ts
interface Env { SITE_URL?: string; ASSETS: Fetcher }

const SECURITY_HEADERS = {
  "cache-control": "public, max-age=300",
  "content-security-policy": "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; img-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY"
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/status") {
      return Response.json({ ok: true, worker: "jeremy-portfolio", canonical: env.SITE_URL ?? "https://jeremy.md" });
    }
    if (url.pathname !== "/" && !url.pathname.startsWith("/assets/")) {
      return Response.redirect(new URL("/", url), 302);
    }
    const asset = await env.ASSETS.fetch(request);
    const response = new Response(asset.body, asset);
    Object.entries(SECURITY_HEADERS).forEach(([name, value]) => response.headers.set(name, value));
    return response;
  }
} satisfies ExportedHandler<Env>;
```

- [ ] **Step 4: Configure Worker-first routing and the asset binding**

Change `main` to `worker/index.ts` and add:

```json
"assets": {
  "binding": "ASSETS",
  "run_worker_first": true
}
```

Preserve the current names, routes, variables, compatibility date, account, preview settings, and environment separation. Add equivalent static security rules to `public/_headers` so direct asset responses remain protected if routing changes later.

- [ ] **Step 5: Run Worker tests, all tests, and type checking**

Run: `npm test -- worker/index.test.ts && npm test && npm run typecheck`

Expected: Worker tests, full suite, and TypeScript build pass.

- [ ] **Step 6: Review the task diff without committing**

Run: `git diff -- worker/index.ts worker/index.test.ts wrangler.jsonc public/_headers`

Expected: existing Cloudflare identities and routes are unchanged; only the entry point and static asset integration differ.

---

### Task 5: Remove the legacy implementation and verify the migration

**Files:**
- Delete: `src/index.js`
- Delete: `test/terminal-homepage.test.js`
- Modify: `.gitignore`
- Modify: `README.md`

**Interfaces:**
- Consumes: all client and Worker outputs from Tasks 1-4.
- Produces: a repository with TypeScript/TSX source only for application and Worker code.

- [ ] **Step 1: Delete superseded JavaScript and update project documentation**

Remove `src/index.js` and `test/terminal-homepage.test.js` after their behavior is covered by the new tests. Add `dist`, `.wrangler`, `.dev.vars*`, and TypeScript build-info files to `.gitignore`. Update `README.md` with Node `>=22.12.0`, `npm install`, `npm run dev`, `npm test`, `npm run typecheck`, `npm run build`, and the unchanged Cloudflare deployment commands. State that the frontend is React + TypeScript.

- [ ] **Step 2: Run the complete automated verification**

Run: `npm test && npm run typecheck && npm run build`

Expected: all tests pass, TypeScript exits zero, and Vite produces the client plus Worker build output.

- [ ] **Step 3: Start the production-like preview**

Run: `npm run preview -- --host 0.0.0.0 --port 4173`

Expected: Vite preview reports a listener on port `4173`.

- [ ] **Step 4: Verify application responses through the Tailnet IP**

Run:

```bash
curl --fail --silent --show-error --dump-header - http://100.114.150.83:4173/ --output /tmp/jeremydevv-home.html
curl --fail --silent --show-error http://100.114.150.83:4173/status
```

Expected: `/` returns HTTP 200 and an HTML root mount; `/status` returns `{"ok":true,"worker":"jeremy-portfolio","canonical":"https://dev.jeremy.md"}`.

- [ ] **Step 5: Perform visual checks**

Open `http://100.114.150.83:4173/` at desktop and mobile widths. Confirm the terminal matches the previous composition, all controls work with pointer and keyboard, dragging remains in bounds, close restores after 350 ms, both flag variants render, and reduced-motion styling remains present.

- [ ] **Step 6: Inspect final repository state without committing or deploying**

Run: `git status --short && git diff --stat && git diff --check`

Expected: only migration files and the approved design/plan are changed, unrelated `.superpowers/` content remains untouched, and there are no whitespace errors.
