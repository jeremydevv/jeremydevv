const SITE_TITLE = "Jeremy K. Mathew";
const SITE_DESCRIPTION =
  "Software engineer building fast, reliable products across cloud, web, and applied AI systems.";

function pageHtml(url) {
  const canonical = "https://jeremy.md/";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${SITE_TITLE}</title>
  <meta name="description" content="${SITE_DESCRIPTION}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:title" content="${SITE_TITLE}">
  <meta property="og:description" content="${SITE_DESCRIPTION}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:type" content="website">
  <meta name="theme-color" content="#101417">
  <style>
    :root {
      color-scheme: dark;
      --bg: #101417;
      --panel: #171d21;
      --text: #edf2f4;
      --muted: #a8b3b8;
      --line: #2a3338;
      --accent: #74d3ae;
      --accent-2: #f3b562;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.5;
      color: var(--text);
      background:
        linear-gradient(145deg, rgba(116, 211, 174, 0.10), transparent 34rem),
        linear-gradient(320deg, rgba(243, 181, 98, 0.12), transparent 30rem),
        var(--bg);
    }

    main {
      width: min(960px, calc(100% - 40px));
      margin: 0 auto;
      padding: 72px 0;
    }

    .eyebrow {
      margin: 0 0 18px;
      color: var(--accent);
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    h1 {
      max-width: 820px;
      margin: 0;
      font-size: clamp(3rem, 9vw, 7.5rem);
      line-height: 0.92;
      letter-spacing: 0;
    }

    .lede {
      max-width: 680px;
      margin: 28px 0 0;
      color: var(--muted);
      font-size: clamp(1.1rem, 2vw, 1.35rem);
    }

    .links {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 36px;
    }

    .links a {
      display: inline-flex;
      align-items: center;
      min-height: 44px;
      padding: 0 16px;
      border: 1px solid var(--line);
      border-radius: 8px;
      color: var(--text);
      text-decoration: none;
      background: rgba(23, 29, 33, 0.72);
    }

    .links a:hover,
    .links a:focus-visible {
      border-color: var(--accent);
      outline: none;
    }

    .work {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 1px;
      margin-top: 72px;
      border: 1px solid var(--line);
      background: var(--line);
    }

    .work section {
      min-height: 170px;
      padding: 22px;
      background: rgba(23, 29, 33, 0.82);
    }

    h2 {
      margin: 0 0 10px;
      font-size: 1rem;
      letter-spacing: 0;
    }

    .work p {
      margin: 0;
      color: var(--muted);
      font-size: 0.95rem;
    }

    footer {
      margin-top: 48px;
      color: var(--muted);
      font-size: 0.9rem;
    }

    @media (max-width: 760px) {
      main {
        width: min(100% - 28px, 960px);
        padding: 48px 0;
      }

      .work {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <main>
    <p class="eyebrow">jeremy.md</p>
    <h1>Jeremy K. Mathew</h1>
    <p class="lede">${SITE_DESCRIPTION}</p>
    <nav class="links" aria-label="Primary links">
      <a href="https://github.com/jeremydevv">GitHub</a>
      <a href="mailto:jeremymathewgithub@outlook.com">Email</a>
      <a href="${new URL("/status", url).toString()}">Status</a>
    </nav>
    <div class="work" aria-label="Work focus areas">
      <section>
        <h2>Product Engineering</h2>
        <p>Full-stack systems with sharp UX, reliable delivery paths, and room to evolve.</p>
      </section>
      <section>
        <h2>Cloud Platforms</h2>
        <p>Cloudflare, automation, auth, data flows, and production operations.</p>
      </section>
      <section>
        <h2>Applied AI</h2>
        <p>Practical AI tools, evaluation loops, and human-centered workflow design.</p>
      </section>
    </div>
    <footer>Available at <strong>https://jeremy.md</strong></footer>
  </main>
</body>
</html>`;
}

function securityHeaders() {
  return {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "public, max-age=300",
    "content-security-policy":
      "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; img-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; script-src 'none'",
    "referrer-policy": "strict-origin-when-cross-origin",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY"
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/status") {
      return Response.json({
        ok: true,
        worker: "jeremy-portfolio",
        canonical: env.SITE_URL ?? "https://jeremy.md"
      });
    }

    if (url.pathname !== "/") {
      return Response.redirect(new URL("/", url), 302);
    }

    return new Response(pageHtml(url), {
      headers: securityHeaders()
    });
  }
};
