# Cool Terminal Palette Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the terminal homepage a cool neutral-slate palette instead of a warm chalk appearance.

**Architecture:** Update only the terminal page's CSS custom properties in `src/index.js`. The existing Worker test fetches the emitted page and verifies the user-visible color tokens.

**Tech Stack:** JavaScript ES modules, Cloudflare Worker, Node.js built-in test runner, CSS.

## Global Constraints

- Preserve the terminal layout, close restoration, command behavior, and classic-homepage fallback.
- Do not commit, push, deploy, or modify unrelated work without explicit owner approval.

---

### Task 1: Test and apply the cool terminal palette

**Files:**
- Modify: `test/terminal-homepage.test.js`
- Modify: `src/index.js`

**Interfaces:**
- Consumes: HTML from `worker.fetch(Request, env)`.
- Produces: a terminal homepage with neutral slate and cool gray CSS tokens.

- [ ] **Step 1: Write the failing test**

Add an assertion to the terminal-homepage test for the new `--chalk: #111827;`, `--terminal: #18212f;`, and `--text: #e5e7eb;` CSS tokens, and assert the old warm `--chalk: #171714;` token is absent.

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `node --test test/terminal-homepage.test.js`

Expected: FAIL because the emitted homepage uses the warm palette.

- [ ] **Step 3: Apply the minimal CSS token update**

Replace the terminal homepage's `--chalk`, `--chalk-soft`, `--terminal`, `--terminal-top`, `--line`, `--text`, `--muted`, `--command`, and `--shadow` values with cool slate/blue-gray equivalents. Do not modify the classic homepage tokens.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `node --test test/terminal-homepage.test.js`

Expected: PASS.

- [ ] **Step 5: Run complete verification**

Run: `npm test && npm run check && npm run check:production`

Expected: tests pass; the Worker checks require Node.js 22 or later.
