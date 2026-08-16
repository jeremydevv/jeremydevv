interface AssetFetcher {
  fetch(request: Request): Promise<Response>;
}

export interface Env {
  SITE_URL?: string;
  ASSETS: AssetFetcher;
}

const SECURITY_HEADERS = {
  "cache-control": "public, max-age=300",
  "content-security-policy":
    "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; img-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY"
} as const;

function withSecurityHeaders(asset: Response): Response {
  const response = new Response(asset.body, asset);

  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(name, value);
  }

  return response;
}

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === "/status") {
    return Response.json({
      ok: true,
      worker: "jeremy-portfolio",
      canonical: env.SITE_URL ?? "https://jeremy.md"
    });
  }

  if (url.pathname !== "/" && !url.pathname.startsWith("/assets/")) {
    return Response.redirect(new URL("/", url).toString(), 302);
  }

  return withSecurityHeaders(await env.ASSETS.fetch(request));
}

export default {
  fetch: handleRequest
} satisfies ExportedHandler<Env>;
