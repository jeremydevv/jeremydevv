import { describe, expect, it, vi } from "vitest";

import worker from "./index";

function createEnv() {
  return {
    SITE_URL: "https://dev.jeremy.md",
    ASSETS: {
      fetch: vi.fn(
        async () =>
          new Response('<div id="root"></div>', {
            headers: { "content-type": "text/html; charset=utf-8" }
          })
      )
    }
  };
}

describe("portfolio Worker", () => {
  it("returns the status contract", async () => {
    const response = await worker.fetch(
      new Request("https://example.test/status"),
      createEnv()
    );

    await expect(response.json()).resolves.toEqual({
      ok: true,
      worker: "jeremy-portfolio",
      canonical: "https://dev.jeremy.md"
    });
  });

  it("uses the production canonical fallback when SITE_URL is absent", async () => {
    const env = createEnv();
    const response = await worker.fetch(
      new Request("https://example.test/status"),
      { ASSETS: env.ASSETS }
    );

    await expect(response.json()).resolves.toMatchObject({
      canonical: "https://jeremy.md"
    });
  });

  it("serves root assets with security and cache headers", async () => {
    const response = await worker.fetch(
      new Request("https://example.test/"),
      createEnv()
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toContain('id="root"');
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=300"
    );
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("content-security-policy")).toContain(
      "script-src 'self'"
    );
  });

  it("serves generated assets through the asset binding", async () => {
    const env = createEnv();
    const request = new Request("https://example.test/assets/app.js");
    const response = await worker.fetch(request, env);

    expect(response.status).toBe(200);
    expect(env.ASSETS.fetch).toHaveBeenCalledWith(request);
  });

  it("redirects unsupported paths to root", async () => {
    const response = await worker.fetch(
      new Request("https://example.test/missing"),
      createEnv()
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("https://example.test/");
  });
});
