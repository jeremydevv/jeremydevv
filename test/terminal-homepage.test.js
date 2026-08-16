import assert from "node:assert/strict";
import test from "node:test";

import worker from "../src/index.js";

test("terminal homepage uses the owner name and native-inspired terminal scrolling", async () => {
  const response = await worker.fetch(new Request("https://example.test/"), {
    SITE_URL: "https://jeremy.md"
  });
  const html = await response.text();

  assert.match(html, /Jeremy Mathew/);
  assert.doesNotMatch(html, /Jeremy K\. Mathew/);
  assert.match(html, /background: var\(--chalk\);/);
  assert.doesNotMatch(html, /radial-gradient/);
  assert.match(html, /scrollbar-width: thin;/);
  assert.match(html, /::-webkit-scrollbar-thumb/);
  assert.doesNotMatch(html, /addEventListener\("wheel"/);
});
