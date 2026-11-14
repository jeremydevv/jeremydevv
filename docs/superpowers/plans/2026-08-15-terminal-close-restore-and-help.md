# Terminal Close Restore and Help Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the pre-run terminal transcript with a help state and make the closed terminal restore at screen center after a short delay.

**Architecture:** The homepage continues to emit one self-contained HTML document from the Cloudflare Worker. The shell markup becomes a static help transcript. The existing inline window controller gains a close-restoration timer and a centering reset that removes geometry/state set by dragging, minimizing, or zooming before its opacity transition resumes.

**Tech Stack:** JavaScript ES modules, Cloudflare Worker, Node.js built-in test runner, HTML/CSS.

## Global Constraints

- The close pause is exactly 350 ms and the restore fade is 220 ms.
- `prefers-reduced-motion: reduce` retains the lifecycle but disables visual transitions.
- Do not commit, push, deploy, or modify unrelated work without explicit owner approval.
- Preserve the existing terminal controls, keyboard operation, and portfolio destinations.

---

### Task 1: Verify and implement terminal help and close restoration

**Files:**
- Modify: `test/terminal-homepage.test.js`
- Modify: `src/index.js`

**Interfaces:**
- Consumes: `worker.fetch(Request, env)` from `src/index.js`.
- Produces: Homepage markup with an idle `help` transcript and a `closeWindow()` lifecycle that restores a centered terminal.

- [ ] **Step 1: Write the failing test**

Add a homepage test that retrieves the emitted HTML and asserts the visible shell begins with `help`, lists `whoami`, `ls focus`, and `open links`, and does not include the old pre-run `whoami` prompt. Also assert the emitted controller declares the 350 ms close delay, resets inline position/size state, and defers removal of `is-closed` through `requestAnimationFrame`.

```js
test("terminal starts in a help state and restores after close", async () => {
  const response = await worker.fetch(new Request("https://example.test/"), {});
  const html = await response.text();

  assert.match(html, /jeremy@portfolio ~ %<\\/span> <span class="command">help<\\/span>/);
  assert.match(html, /whoami.*ls focus.*open links/s);
  assert.doesNotMatch(html, /command">whoami<\\/span>/);
  assert.match(html, /setTimeout\(restoreClosedWindow, 350\)/);
  assert.match(html, /terminal\.style\.left = ""/);
  assert.match(html, /requestAnimationFrame\(\(\) => \{/);
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `node --test test/terminal-homepage.test.js`

Expected: FAIL because the page still emits the old command transcript and `closeWindow()` only applies `is-closed`.

- [ ] **Step 3: Implement the minimal homepage changes**

In `src/index.js`:

1. Replace the three pre-run command blocks with one `help` prompt and a text command guide, keeping links out of the initial transcript.
2. Change `.terminal` opacity transition duration from `120ms` to `220ms`.
3. Add `let closeRestoreTimer = null` plus `resetToCenteredWindow()` that clears `left`, `top`, `width`, `height`, and the transform, removes minimized/zoomed classes, and resets their state flags.
4. Make `closeWindow()` clear a prior timer, add `is-closed`, and schedule `restoreClosedWindow` after 350 ms.
5. Make `restoreClosedWindow()` reset geometry and state, focus the terminal, then remove `is-closed` inside `requestAnimationFrame`.

```js
function closeWindow() {
  clearTimeout(closeRestoreTimer);
  terminal.classList.add("is-closed");
  closeRestoreTimer = setTimeout(restoreClosedWindow, 350);
}

function restoreClosedWindow() {
  resetToCenteredWindow();
  requestAnimationFrame(() => {
    terminal.classList.remove("is-closed");
  });
}
```

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `node --test test/terminal-homepage.test.js`

Expected: PASS, including the new terminal close and help-state test.

- [ ] **Step 5: Run the complete verification suite**

Run: `npm test && npm run check && npm run check:production`

Expected: all tests and both Workers dry-run checks pass with no warnings.
