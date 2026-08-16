# Terminal Identity and Scrollbar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the middle initial from the portfolio’s displayed name, simplify the page to a solid chalk background, and give its terminal output a macOS-Terminal-inspired scrollbar without changing native scrolling.

**Architecture:** The Cloudflare Worker keeps emitting one static HTML document from `src/index.js`. The change is confined to its title/output strings and embedded CSS; `.shell` remains the browser’s native scroll container, with only browser-supported scrollbar presentation rules added.

**Tech Stack:** Cloudflare Workers, HTML, CSS, JavaScript, Wrangler 4.

## Global Constraints

- Do not modify email addresses, GitHub handles, Worker names, domain names, or deployment configuration.
- Preserve native wheel, trackpad, keyboard, and touch scrolling; do not add JavaScript scroll handling.
- Use `#171714` as the solid page background and remove the decorative background layers.
- Do not add dependencies, analytics, or persistent state.
- Do not commit or push; the owner has not authorized a publish workflow.

---

### Task 1: Update visible identity and terminal surface styling

**Files:**
- Modify: `src/index.js:1,70-100,205-215,309`
- Test: live Worker response at `http://100.114.150.83:8787/`

**Interfaces:**
- Consumes: `SITE_TITLE`, CSS tokens, and the `.shell` element emitted by `terminalHomepageHtml()`.
- Produces: metadata and terminal output displaying `Jeremy Mathew`; a browser-native scroll area with macOS-inspired visual styling.

- [ ] **Step 1: Verify the current page contains the middle initial and decorative background**

Run:

```bash
curl -fsS http://100.114.150.83:8787/ | rg -n 'Jeremy K\. Mathew|radial-gradient|body::before'
```

Expected: the response contains both instances of `Jeremy K. Mathew` and the decorative background CSS.

- [ ] **Step 2: Make the minimal source change**

In `src/index.js`, replace both display strings with `Jeremy Mathew`; replace the `body` multi-layer `background` declaration with `background: var(--chalk);`; remove the `body::before` rule; and add the following presentation-only rules to `.shell`:

```css
scrollbar-width: thin;
scrollbar-color: rgba(236, 232, 216, 0.34) transparent;

.shell::-webkit-scrollbar {
  width: 10px;
}

.shell::-webkit-scrollbar-track {
  background: transparent;
}

.shell::-webkit-scrollbar-thumb {
  min-height: 32px;
  border: 3px solid transparent;
  border-radius: 999px;
  background: rgba(236, 232, 216, 0.34);
  background-clip: content-box;
}

.shell::-webkit-scrollbar-thumb:hover {
  background-color: rgba(236, 232, 216, 0.52);
}
```

- [ ] **Step 3: Verify the updated Worker response**

Run:

```bash
curl -fsS http://100.114.150.83:8787/ | rg -n 'Jeremy Mathew|Jeremy K\. Mathew|background: var\(--chalk\)|scrollbar-width|scrollbar-thumb|addEventListener\("wheel"'
```

Expected: `Jeremy Mathew`, `background: var(--chalk)`, and scrollbar rules are present; `Jeremy K. Mathew` and a `wheel` listener are absent.

- [ ] **Step 4: Run the Worker configuration check**

Run:

```bash
PATH=/tmp/crossview-node-VqfgKz/node-v26.7.0-linux-x64/bin:$PATH npm run check
```

Expected: Wrangler completes its dry-run without an error.

- [ ] **Step 5: Perform visual QA**

Open `http://100.114.150.83:8787/` in a macOS browser, make the terminal output overflow temporarily with browser DevTools only, then confirm the scrollbar is narrow, pill-shaped, and low contrast while mouse wheel and trackpad scrolling remain native.

- [ ] **Step 6: Leave the scoped changes uncommitted**

Run:

```bash
git diff --check && git status --short
```

Expected: no whitespace errors; only `src/index.js` and the approved planning documents are changed.
