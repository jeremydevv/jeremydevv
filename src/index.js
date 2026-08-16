const SITE_TITLE = "Jeremy Mathew";
const SITE_DESCRIPTION =
  "Software engineer building fast, reliable products across cloud, web, and applied AI systems.";

const FAST_FLAGS = {
  terminalPortfolioHomepage: {
    key: "terminalPortfolioHomepage",
    owner: "jeremydevv",
    surface: "homepage",
    createdAt: "2026-08-15",
    expiresAt: "2026-09-12",
    fallback: "classicHomepage",
    defaultEnabled: true
  }
};

function flagOverride(url, key) {
  const value = url.searchParams.get("ff_" + key);
  if (value === "0" || value === "false" || value === "off") return false;
  if (value === "1" || value === "true" || value === "on") return true;
  return null;
}

function isFastFlagEnabled(url, key) {
  const metadata = FAST_FLAGS[key];
  if (!metadata) return false;
  const override = flagOverride(url, key);
  return override ?? metadata.defaultEnabled;
}

function terminalHomepageHtml() {
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
  <meta name="theme-color" content="#111827">
  <style>
    :root {
      color-scheme: dark;
      --chalk: #111827;
      --chalk-soft: #172033;
      --terminal: #18212f;
      --terminal-top: #253247;
      --line: #394a62;
      --text: #e5e7eb;
      --muted: #a5b4c8;
      --command: #a5c7f5;
      --green: #72c76e;
      --yellow: #d7b65d;
      --red: #d96b5f;
      --shadow: rgba(2, 6, 23, 0.48);
    }

    * {
      box-sizing: border-box;
    }

    html,
    body {
      width: 100%;
      min-height: 100%;
    }

    body {
      margin: 0;
      min-height: 100vh;
      overflow: hidden;
      color: var(--text);
      background: var(--chalk);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    }

    .desktop {
      position: relative;
      width: 100vw;
      height: 100vh;
    }

    .terminal {
      position: absolute;
      left: 50%;
      top: 50%;
      width: min(clamp(340px, 31vw, 560px), calc(100vw - 24px));
      height: min(clamp(250px, 31vh, 380px), calc(100vh - 24px));
      border: 1px solid rgba(229, 231, 235, 0.14);
      border-radius: 10px;
      background: var(--terminal);
      box-shadow: 0 18px 42px var(--shadow);
      transform: translate(-50%, -50%);
      overflow: hidden;
      user-select: none;
      transition: box-shadow 150ms ease, opacity 220ms ease;
    }

    .terminal.is-dragging {
      cursor: grabbing;
      transition: none;
    }

    .terminal.is-focused {
      border-color: rgba(229, 231, 235, 0.2);
      box-shadow: 0 22px 56px rgba(0, 0, 0, 0.42);
    }

    .terminal.is-minimized {
      height: 36px;
      min-height: 36px;
    }

    .terminal.is-minimized .shell {
      display: none;
    }

    .terminal.is-closed {
      opacity: 0;
      pointer-events: none;
    }

    .titlebar {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      height: 36px;
      padding: 0 12px;
      border-bottom: 1px solid rgba(229, 231, 235, 0.09);
      background: linear-gradient(var(--terminal-top), #202c3e);
      cursor: grab;
      touch-action: none;
    }

    .terminal.is-dragging .titlebar {
      cursor: grabbing;
    }

    .lights {
      display: flex;
      gap: 8px;
    }

    .light {
      appearance: none;
      width: 12px;
      height: 12px;
      padding: 0;
      border: 0;
      border-radius: 50%;
      box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.22);
      color: rgba(15, 23, 42, 0);
      font: 700 8px/12px ui-sans-serif, system-ui, sans-serif;
      text-align: center;
      cursor: default;
    }

    .light.red {
      background: var(--red);
    }

    .light.yellow {
      background: var(--yellow);
    }

    .light.green {
      background: var(--green);
    }

    .lights:hover .light,
    .light:focus-visible {
      color: rgba(15, 23, 42, 0.74);
      outline: none;
    }

    .light::before {
      display: block;
    }

    .light.red::before {
      content: "x";
      transform: translateY(-0.5px);
    }

    .light.yellow::before {
      content: "-";
      transform: translateY(-1px);
    }

    .light.green::before {
      content: "+";
      transform: translateY(-0.5px);
    }

    .title {
      justify-self: center;
      color: #cbd5e1;
      font-size: 0.77rem;
    }

    .shell {
      height: calc(100% - 36px);
      padding: 18px 20px 22px;
      font-size: clamp(0.78rem, 1.05vw, 0.96rem);
      line-height: 1.68;
      overflow: auto;
      scrollbar-width: thin;
      scrollbar-color: rgba(229, 231, 235, 0.34) transparent;
      white-space: pre-wrap;
    }

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
      background: rgba(229, 231, 235, 0.34);
      background-clip: content-box;
    }

    .shell::-webkit-scrollbar-thumb:hover {
      background-color: rgba(229, 231, 235, 0.52);
    }

    .prompt {
      color: var(--muted);
    }

    .command {
      color: var(--command);
    }

    .output {
      color: var(--text);
    }

    .dim {
      color: var(--muted);
    }

    .shell a {
      color: var(--text);
      text-decoration-thickness: 1px;
      text-underline-offset: 3px;
    }

    .cursor {
      display: inline-block;
      width: 0.55em;
      height: 1.05em;
      margin-left: 2px;
      vertical-align: -0.16em;
      background: var(--text);
      animation: blink 1.1s steps(2, start) infinite;
    }

    @keyframes blink {
      50% {
        opacity: 0;
      }
    }

    @media (max-width: 760px) {
      body {
        overflow: hidden;
      }

      .terminal {
        width: min(88vw, 420px);
        height: min(32vh, calc(100vh - 24px));
      }

      .shell {
        padding: 16px;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .terminal {
        transition: none;
      }

      .cursor {
        animation: none;
      }
    }
  </style>
</head>
<body>
  <main class="desktop" aria-label="Movable desktop portfolio">
    <section class="terminal is-focused" id="terminal" aria-label="Jeremy portfolio terminal">
      <header class="titlebar" id="titlebar" tabindex="0" aria-label="Drag terminal window" aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Shift+ArrowUp Shift+ArrowDown Shift+ArrowLeft Shift+ArrowRight Enter Space">
        <div class="lights" aria-label="Window controls">
          <button class="light red" type="button" data-window-action="close" aria-label="Close"></button>
          <button class="light yellow" type="button" data-window-action="minimize" aria-label="Minimize"></button>
          <button class="light green" type="button" data-window-action="zoom" aria-label="Zoom"></button>
        </div>
        <div class="title">jeremy.md - zsh</div>
        <div aria-hidden="true"></div>
      </header>
      <div class="shell">
<span class="prompt">jeremy@portfolio ~ %</span> <span class="command">help</span>
<span class="output">available commands:
  whoami      show identity
  ls focus    show areas of focus
  open links  show github, email, and status</span>

<span class="prompt">jeremy@portfolio ~ %</span><span class="cursor" aria-hidden="true"></span>
      </div>
    </section>
  </main>
  <script>
    const terminal = document.getElementById("terminal");
    const titlebar = document.getElementById("titlebar");
    let drag = null;
    let savedRect = null;
    let isZoomed = false;
    let isMinimized = false;
    let closeRestoreTimer = null;

    function clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }

    function boundsFor(rect) {
      const margin = 12;
      return {
        minX: margin,
        minY: margin,
        maxX: window.innerWidth - rect.width - margin,
        maxY: window.innerHeight - rect.height - margin
      };
    }

    function placeAt(x, y) {
      const rect = terminal.getBoundingClientRect();
      const bounds = boundsFor(rect);
      terminal.style.transform = "none";
      terminal.style.left = clamp(x, bounds.minX, Math.max(bounds.minX, bounds.maxX)) + "px";
      terminal.style.top = clamp(y, bounds.minY, Math.max(bounds.minY, bounds.maxY)) + "px";
    }

    function rectSnapshot() {
      const rect = terminal.getBoundingClientRect();
      return {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      };
    }

    function setRect(rect) {
      terminal.style.transform = "none";
      terminal.style.left = rect.left + "px";
      terminal.style.top = rect.top + "px";
      terminal.style.width = rect.width + "px";
      terminal.style.height = rect.height + "px";
      placeAt(rect.left, rect.top);
    }

    function moveBy(deltaX, deltaY) {
      const rect = terminal.getBoundingClientRect();
      placeAt(rect.left + deltaX, rect.top + deltaY);
    }

    function focusWindow() {
      terminal.classList.add("is-focused");
    }

    function restoreWindow() {
      terminal.classList.remove("is-closed", "is-minimized", "is-zoomed");
      isMinimized = false;
      isZoomed = false;
      if (savedRect) setRect(savedRect);
      focusWindow();
    }

    function resetToCenteredWindow() {
      terminal.classList.remove("is-dragging", "is-minimized", "is-zoomed");
      terminal.style.transform = "";
      terminal.style.left = "";
      terminal.style.top = "";
      terminal.style.width = "";
      terminal.style.height = "";
      drag = null;
      savedRect = null;
      isMinimized = false;
      isZoomed = false;
    }

    function restoreClosedWindow() {
      closeRestoreTimer = null;
      resetToCenteredWindow();
      focusWindow();
      requestAnimationFrame(() => {
        terminal.classList.remove("is-closed");
      });
    }

    function closeWindow() {
      clearTimeout(closeRestoreTimer);
      terminal.classList.add("is-closed");
      closeRestoreTimer = setTimeout(restoreClosedWindow, 350);
    }

    function minimizeWindow() {
      if (terminal.classList.contains("is-closed")) return;
      if (!isMinimized) savedRect = rectSnapshot();
      isZoomed = false;
      isMinimized = true;
      terminal.classList.remove("is-zoomed");
      terminal.classList.add("is-minimized");
      setRect({
        left: 18,
        top: window.innerHeight - 54,
        width: Math.min(340, window.innerWidth - 36),
        height: 36
      });
    }

    function zoomWindow() {
      if (terminal.classList.contains("is-closed")) return;
      if (isMinimized) {
        restoreWindow();
        return;
      }

      if (isZoomed) {
        if (savedRect) setRect(savedRect);
        terminal.classList.remove("is-zoomed");
        isZoomed = false;
        return;
      }

      savedRect = rectSnapshot();
      isZoomed = true;
      terminal.classList.add("is-zoomed");
      setRect({
        left: 18,
        top: 18,
        width: window.innerWidth - 36,
        height: window.innerHeight - 36
      });
    }

    document.querySelectorAll("[data-window-action]").forEach((button) => {
      button.addEventListener("pointerdown", (event) => {
        event.stopPropagation();
        focusWindow();
      });

      button.addEventListener("click", (event) => {
        event.stopPropagation();
        const action = button.dataset.windowAction;
        if (action === "close") closeWindow();
        if (action === "minimize") minimizeWindow();
        if (action === "zoom") zoomWindow();
      });
    });

    titlebar.addEventListener("pointerdown", (event) => {
      if (event.target.closest("[data-window-action]")) return;
      focusWindow();
      if (isMinimized) restoreWindow();
      const rect = terminal.getBoundingClientRect();
      drag = {
        pointerId: event.pointerId,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top
      };
      terminal.classList.add("is-dragging");
      titlebar.setPointerCapture(event.pointerId);
      placeAt(rect.left, rect.top);
    });

    titlebar.addEventListener("dblclick", (event) => {
      if (event.target.closest("[data-window-action]")) return;
      zoomWindow();
    });

    titlebar.addEventListener("keydown", (event) => {
      const step = event.shiftKey ? 48 : 16;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveBy(-step, 0);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        moveBy(step, 0);
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        moveBy(0, -step);
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveBy(0, step);
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        zoomWindow();
      }
    });

    titlebar.addEventListener("pointermove", (event) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      placeAt(event.clientX - drag.offsetX, event.clientY - drag.offsetY);
    });

    function stopDrag(event) {
      if (!drag || event.pointerId !== drag.pointerId) return;
      terminal.classList.remove("is-dragging");
      drag = null;
    }

    titlebar.addEventListener("pointerup", stopDrag);
    titlebar.addEventListener("pointercancel", stopDrag);

    window.addEventListener("resize", () => {
      if (isZoomed) {
        setRect({
          left: 18,
          top: 18,
          width: window.innerWidth - 36,
          height: window.innerHeight - 36
        });
        return;
      }

      const rect = terminal.getBoundingClientRect();
      placeAt(rect.left, rect.top);
    });
  </script>
</body>
</html>`;
}

function classicHomepageHtml(url) {
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
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.5;
      color: var(--text);
      background:
        linear-gradient(145deg, rgba(116, 211, 174, 0.10), transparent 34rem),
        var(--bg);
    }

    main {
      width: min(960px, calc(100% - 40px));
      margin: 0 auto;
      padding: 72px 0;
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
  </style>
</head>
<body>
  <main>
    <h1>Jeremy Mathew</h1>
    <p class="lede">${SITE_DESCRIPTION}</p>
    <nav class="links" aria-label="Primary links">
      <a href="https://github.com/jeremydevv">GitHub</a>
      <a href="mailto:jeremymathewgithub@outlook.com">Email</a>
      <a href="${new URL("/status", url).toString()}">Status</a>
    </nav>
  </main>
</body>
</html>`;
}

function securityHeaders() {
  return {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "public, max-age=300",
    "content-security-policy":
      "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; img-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'",
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

    const enabled = isFastFlagEnabled(url, "terminalPortfolioHomepage");
    const html = enabled ? terminalHomepageHtml() : classicHomepageHtml(url);

    return new Response(html, {
      headers: securityHeaders()
    });
  }
};
