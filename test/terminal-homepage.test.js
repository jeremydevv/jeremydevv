import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

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
  assert.match(html, /--chalk: #111827;/);
  assert.match(html, /--terminal: #18212f;/);
  assert.match(html, /--text: #e5e7eb;/);
  assert.doesNotMatch(html, /--chalk: #171714;/);
});

test("terminal starts in a help state and restores after close", async () => {
  const response = await worker.fetch(new Request("https://example.test/"), {
    SITE_URL: "https://jeremy.md"
  });
  const html = await response.text();

  assert.match(
    html,
    /jeremy@portfolio ~ %<\/span> <span class="command">help<\/span>/
  );
  assert.match(html, /whoami.*ls focus.*open links/s);
  assert.doesNotMatch(html, /command">whoami<\/span>/);
  assert.match(html, /setTimeout\(restoreClosedWindow, 350\)/);
  assert.match(html, /terminal\.style\.left = ""/);
  assert.match(html, /requestAnimationFrame\(\(\) => \{/);
});

test("Worker configuration separates development and production domains", async () => {
  const config = JSON.parse(
    await readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8")
  );

  assert.equal(config.name, "jeremy-portfolio-development");
  assert.equal(config.vars.SITE_URL, "https://dev.jeremy.md");
  assert.deepEqual(config.routes, [
    {
      pattern: "dev.jeremy.md",
      zone_name: "jeremy.md",
      custom_domain: true
    }
  ]);
  assert.equal(config.env.production.name, "jeremy-portfolio-production");
  assert.equal(config.env.production.vars.SITE_URL, "https://jeremy.md");
});
