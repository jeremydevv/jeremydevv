const SITE_TITLE = "Jeremy K. Mathew";
const SITE_DESCRIPTION =
  "Software engineer building fast, reliable products across cloud, web, and applied AI systems.";

function pageHtml() {
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
  <meta name="theme-color" content="#171714">
  <style>
    :root {
      color-scheme: dark;
      --chalk: #171714;
      --chalk-soft: #1f1f1b;
      --terminal: #20211d;
      --terminal-top: #2c2d28;
      --line: #3a3a33;
      --text: #ece8d8;
      --muted: #aaa590;
      --command: #d8d0af;
      --green: #72c76e;
      --yellow: #d7b65d;
      --red: #d96b5f;
      --shadow: rgba(0, 0, 0, 0.34);
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
      background:
        radial-gradient(circle at 20% 18%, rgba(255, 255, 255, 0.035), transparent 18rem),
        radial-gradient(circle at 78% 70%, rgba(215, 182, 93, 0.035), transparent 22rem),
        linear-gradient(135deg, var(--chalk), #12120f);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    }

    body::before {
      position: fixed;
      inset: 0;
      pointer-events: none;
      content: "";
      opacity: 0.18;
      background-image:
        linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.018) 1px, transparent 1px);
      background-size: 7px 7px, 11px 11px;
      mix-blend-mode: soft-light;
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
      width: clamp(340px, 31vw, 560px);
      height: clamp(250px, 31vh, 380px);
      border: 1px solid rgba(236, 232, 216, 0.14);
      border-radius: 10px;
      background: var(--terminal);
      box-shadow: 0 18px 42px var(--shadow);
      transform: translate(-50%, -50%);
      overflow: hidden;
      user-select: none;
      transition: box-shadow 150ms ease, opacity 120ms ease;
    }

    .terminal.is-dragging {
      cursor: grabbing;
      transition: none;
    }

    .terminal.is-focused {
      border-color: rgba(236, 232, 216, 0.2);
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
      border-bottom: 1px solid rgba(236, 232, 216, 0.09);
      background: linear-gradient(var(--terminal-top), #262722);
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
      color: rgba(40, 28, 22, 0);
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
      color: rgba(40, 28, 22, 0.74);
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
      color: #c7c1ac;
      font-size: 0.77rem;
    }

    .shell {
      height: calc(100% - 36px);
      padding: 18px 20px 22px;
      font-size: clamp(0.78rem, 1.05vw, 0.96rem);
      line-height: 1.68;
      overflow: auto;
      white-space: pre-wrap;
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
        height: 32vh;
      }

      .shell {
        padding: 16px;
      }
    }
  </style>
</head>
<body>
  <main class="desktop" aria-label="Movable desktop portfolio">
    <section class="terminal is-focused" id="terminal" aria-label="Jeremy portfolio terminal">
      <header class="titlebar" id="titlebar" aria-label="Drag terminal window">
        <div class="lights" aria-label="Window controls">
          <button class="light red" type="button" data-window-action="close" aria-label="Close"></button>
          <button class="light yellow" type="button" data-window-action="minimize" aria-label="Minimize"></button>
          <button class="light green" type="button" data-window-action="zoom" aria-label="Zoom"></button>
        </div>
        <div class="title">jeremy.md - zsh</div>
        <div aria-hidden="true"></div>
      </header>
      <div class="shell">
<span class="prompt">jeremy@portfolio ~ %</span> <span class="command">whoami</span>
<span class="output">Jeremy K. Mathew</span>

<span class="prompt">jeremy@portfolio ~ %</span> <span class="command">ls focus</span>
<span class="output">cloud-platforms   product-engineering   applied-ai</span>

<span class="prompt">jeremy@portfolio ~ %</span> <span class="command">open links</span>
<span class="output"><a href="https://github.com/jeremydevv">github</a>   <a href="mailto:jeremymathewgithub@outlook.com">email</a>   <a href="/status">status</a></span>

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

    function closeWindow() {
      terminal.classList.add("is-closed");
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

    return new Response(pageHtml(), {
      headers: securityHeaders()
    });
  }
};
