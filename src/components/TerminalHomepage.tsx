import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode
} from "react";

import { TerminalWindow } from "./TerminalWindow";
import "./terminal-input.css";

interface TranscriptEntry {
  command: string;
  output?: "cancelled" | "links" | string;
  snapshot?: SectionName[];
}

const PROMPT = "jeremy@portfolio ~ %";
const TRANSCRIPT_LIMIT = 200;
const HISTORY_LIMIT = 200;

function isAscii(value: string): boolean {
  return /^[\u0000-\u007f]*$/.test(value);
}

function responseFor(command: string): string | "links" | null {
  switch (command) {
    case "help":
      return `available commands:
  open <section>  expand a section
  close <section> collapse a section
  whoami          show background
  ls focus        show practical skills
  cat atripix     read client work
  cat locora      read FBLA project
  cat experience  read other experience
  open links      show contact and documents
  pwd             show working directory
  clear           clear the terminal`;
    case "whoami":
      return "Jeremy Mathew - high school student, dual enrolled at Hillsborough College; founder of Atripix.";
    case "ls focus":
      return "typescript  lua  java  react  cloudflare-workers  git  github-actions";
    case "cat atripix":
      return "Atripix (June 2026-present): built and launched 5+ websites and custom CRMs for four paying clients, leading sales, design, infrastructure, development, and deployment. Generated $1,000 in total revenue and over $300 in monthly revenue.";
    case "cat locora":
      return "Locora (August 2025-February 2026): an FBLA Coding & Programming project built with TypeScript, React, Electron, a serverless API, D1, R2, and CI/CD for the web and desktop artifact. 2nd place at districts and 3rd in Florida in 2026.";
    case "cat experience":
      return "Roblox senior game developer (June 2025-August 2026): backend systems for live games reporting 5,500 combined concurrent players; contributed to a team that generated $20,000 in revenue.";
    case "open links":
      return "links";
    case "pwd":
      return "/Users/jeremy";
    default:
      return null;
  }
}

function appendBounded<T>(items: T[], item: T, limit: number): T[] {
  return [...items, item].slice(-limit);
}

function renderOutput(output: TranscriptEntry["output"]): ReactNode {
  if (output === "cancelled") return "^C";

  if (output === "links") {
    return (
      <>
        <a href="https://github.com/jeremydevv">github.com/jeremydevv</a>
        <br />
        <a href="mailto:me@jeremy.md">me@jeremy.md</a>
        <br />
        <a href="/assets/Jeremy-Mathew-Resume.pdf">resume</a>
      </>
    );
  }

  if (!output) return null;

  const lines = output.split("\n");
  return lines.map((line, index) => (
    <span key={`${line}-${index}`}>
      {line}
      {index < lines.length - 1 && <br />}
    </span>
  ));
}

const SECTION_NAMES = ["experience", "project", "education", "leadership", "skills"] as const;
type SectionName = (typeof SECTION_NAMES)[number];

function SectionContent({ section }: { section: SectionName }) {
  switch (section) {
    case "education":
      return <div className="section-output">
                <p>&gt; <strong>Hillsborough College</strong>  [expected 2028]<br />
                  A.A. in Computer Science Engineering<br />GPA: 4.0</p>
                <p>&gt; <strong>Wharton High School</strong>  [expected 2028]<br />
                  GPA: 4.6 weighted, 3.98 unweighted<br />
                  <span className="ascii-highlight">{'{ class rank: 1 of 450 }'}</span></p>
              </div>;
    case "experience":
      return <div className="section-output">
                <p>&gt; <strong>Atripix LLC</strong>  [ founder | June 2026-present ]<br />
                  * Built and launched 5+ websites and custom CRMs for four paying clients.<br />
                  * Led sales, design, infrastructure, development, and deployment.<br />
                  * Generated $1,000 in total revenue and over $300 in monthly revenue; implemented SEO improvements.</p>
                <p>&gt; <strong>Roblox</strong>  [ senior game developer | June 2025-August 2026 ]<br />
                  * Developed backend systems for live games reporting 5,500 combined concurrent players.<br />
                  * Contributed to advertising and retention improvements on a team that generated $20,000 in revenue.</p>
              </div>;
    case "project":
      return <div className="section-output">
                  <p>&gt; <strong>Locora</strong>  [ August 2025-February 2026 ]<br />
                    * Developed a place-discovery web application with Electron desktop packaging, Cloudflare services, database storage, and REST APIs.<br />
                    * Configured GitHub Actions for builds and lint checks.<br />
                    * Earned 2nd at districts and 3rd in Florida FBLA Coding and Programming.</p>
                </div>;
    case "leadership":
      return <div className="section-output">
                  <p>&gt; <strong>Dual Enrollment Club</strong>  [ president | August 2026-present ]<br />
                    * Recruited 100+ members and helped students select courses and register.<br />
                    * Guided students through enrollment in 60+ credits, equivalent to about $6,300 in state-university base tuition.</p>
                  <p>&gt; <strong>Future Business Leaders of America</strong>  [ 2024-present ]<br />
                    * Webmaster and Computer Applications participant; maintained the chapter website and published event information.<br />
                    * Placed at districts and in Florida with Locora.</p>
                </div>;
    case "skills":
      return <div className="section-output">
                  <p>&gt; Programming: TypeScript, Lua, Java<br />&gt; Frameworks and tools: React, Cloudflare Workers, Git, GitHub Actions<br />&gt; Languages: English, Malayalam</p>
                </div>;
  }
}

export function TerminalHomepage({ expanded = true, collapsible = true, textZoomEnabled = true }: { expanded?: boolean; collapsible?: boolean; textZoomEnabled?: boolean }) {
  const [currentSections, setCurrentSections] = useState<SectionName[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const promptLineRef = useRef<HTMLDivElement>(null);
  const promptRailRef = useRef<HTMLSpanElement>(null);
  const cellProbeRef = useRef<HTMLSpanElement>(null);
  const [command, setCommand] = useState("");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [historyDraft, setHistoryDraft] = useState("");
  const [selection, setSelection] = useState({ start: 0, end: 0, scrollLeft: 0 });
  const [isComposing, setIsComposing] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isSingleVisualLine, setIsSingleVisualLine] = useState(true);
  const [shouldRevealPrompt, setShouldRevealPrompt] = useState(false);
  const [promptIndent, setPromptIndent] = useState<number | null>(null);
  const [pendingCursorPosition, setPendingCursorPosition] = useState<number | null>(
    null
  );

  function focusInput() {
    inputRef.current?.focus({ preventScroll: true });
  }

  function appendTranscript(entry: TranscriptEntry) {
    setTranscript((entries) => appendBounded(entries, entry, TRANSCRIPT_LIMIT));
  }

  function resetHistoryNavigation() {
    setHistoryIndex(null);
    setHistoryDraft("");
  }

  function syncSelection(input: HTMLTextAreaElement) {
    setSelection({
      start: input.selectionStart ?? 0,
      end: input.selectionEnd ?? 0,
      scrollLeft: input.scrollLeft
    });
  }

  function revealPromptAfterRender() {
    setShouldRevealPrompt(true);
  }

  function measurePromptIndent() {
    const promptWidth = promptRailRef.current?.getBoundingClientRect().width ?? 0;
    const cellWidth = cellProbeRef.current?.getBoundingClientRect().width ?? 0;
    if (promptWidth > 0 && cellWidth > 0) {
      setPromptIndent(promptWidth + cellWidth);
    }
  }

  function resizeTextarea() {
    const textarea = inputRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const lineHeight = Number.parseFloat(window.getComputedStyle(textarea).lineHeight);
    const singleLineHeight = Number.isFinite(lineHeight)
      ? lineHeight
      : textarea.clientHeight;
    const contentHeight = textarea.scrollHeight;
    textarea.style.height = `${Math.max(contentHeight, singleLineHeight)}px`;
    setIsSingleVisualLine(contentHeight <= singleLineHeight + 0.5);
  }

  useEffect(() => {
    if (window.matchMedia?.("(pointer: fine)").matches) focusInput();
  }, []);

  useEffect(() => {
    if (!shouldRevealPrompt) return;

    promptLineRef.current?.scrollIntoView?.({ block: "end" });
    setShouldRevealPrompt(false);
  }, [shouldRevealPrompt]);

  useLayoutEffect(() => {
    if (pendingCursorPosition === null || !inputRef.current) return;

    inputRef.current.setSelectionRange(pendingCursorPosition, pendingCursorPosition);
    inputRef.current.scrollLeft = 0;
    syncSelection(inputRef.current);
    setPendingCursorPosition(null);
  }, [pendingCursorPosition]);

  useLayoutEffect(resizeTextarea, [command, promptIndent]);

  useLayoutEffect(() => {
    measurePromptIndent();
    resizeTextarea();

    function handleLayoutChange() {
      measurePromptIndent();
      resizeTextarea();
    }

    window.addEventListener("resize", handleLayoutChange);
    const fontsReady = document.fonts?.ready;
    void fontsReady?.then(handleLayoutChange);

    if (typeof ResizeObserver === "undefined") {
      return () => window.removeEventListener("resize", handleLayoutChange);
    }

    const observer = new ResizeObserver(handleLayoutChange);
    if (promptRailRef.current) observer.observe(promptRailRef.current);
    if (cellProbeRef.current) observer.observe(cellProbeRef.current);
    if (inputRef.current) observer.observe(inputRef.current);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleLayoutChange);
    };
  }, []);

  function runSectionCommand(action: "open" | "close", section: SectionName, base = currentSections, raw = `${action} ${section}`) {
    const snapshot = action === "open"
      ? base.includes(section) ? [...base] : [...base, section]
      : base.filter((item) => item !== section);
    setCurrentSections(snapshot);
    appendTranscript({ command: raw, snapshot });
    setHistory((entries) => appendBounded(entries, raw, HISTORY_LIMIT));
    resetHistoryNavigation();
    revealPromptAfterRender();
  }

  function sectionControl(section: SectionName, label: string, snapshot: SectionName[]) {
    if (!collapsible) return null;
    const isOpen = snapshot.includes(section);
    return <button type="button" className="section-toggle" aria-expanded={isOpen}
      aria-label={`${isOpen ? "Collapse" : "Expand"} ${label}`}
      onClick={() => runSectionCommand(isOpen ? "close" : "open", section, snapshot)}>
      {isOpen ? "[-] collapse" : "[+] expand"}
    </button>;
  }

  function submitCommand() {
    const rawCommand = command;
    const normalized = rawCommand.trim().replace(/\s+/g, " ");

    const sectionMatch = /^(open|close) (experience|project|education|leadership|skills)$/.exec(normalized);
    const sectionAvailable = sectionMatch && (expanded || ["education", "experience"].includes(sectionMatch[2]));
    if (collapsible && sectionMatch && sectionAvailable) {
      runSectionCommand(sectionMatch[1] as "open" | "close", sectionMatch[2] as SectionName, currentSections, rawCommand);
      setCommand("");
      resetHistoryNavigation();
      return;
    }
    if (!normalized) {
      appendTranscript({ command: rawCommand });
    } else if (normalized === "clear") {
      setTranscript([]);
      setCurrentSections([]);
    } else {
      appendTranscript({
        command: rawCommand,
        output:
          responseFor(normalized) ??
          `zsh: command not found: ${normalized}`
      });
    }

    if (normalized) {
      setHistory((entries) => appendBounded(entries, rawCommand, HISTORY_LIMIT));
    }

    setCommand("");
    resetHistoryNavigation();
    focusInput();
    revealPromptAfterRender();
  }

  function cancelCommand() {
    appendTranscript({ command, output: "cancelled" });
    setCommand("");
    resetHistoryNavigation();
    focusInput();
    revealPromptAfterRender();
  }

  function moveThroughHistory(direction: "up" | "down") {
    if (!history.length) return;

    if (direction === "up") {
      const nextIndex =
        historyIndex === null
          ? history.length - 1
          : Math.max(historyIndex - 1, 0);
      if (historyIndex === null) setHistoryDraft(command);
      setHistoryIndex(nextIndex);
      const nextCommand = history[nextIndex];
      setCommand(nextCommand);
      setPendingCursorPosition(nextCommand.length);
      return;
    }

    if (historyIndex === null) return;
    if (historyIndex === history.length - 1) {
      setCommand(historyDraft);
      setPendingCursorPosition(historyDraft.length);
      setHistoryIndex(null);
      return;
    }

    const nextIndex = historyIndex + 1;
    setHistoryIndex(nextIndex);
    const nextCommand = history[nextIndex];
    setCommand(nextCommand);
    setPendingCursorPosition(nextCommand.length);
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (isComposing || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) {
      return;
    }

    if (event.ctrlKey && event.key.toLowerCase() === "c") {
      event.preventDefault();
      cancelCommand();
      return;
    }

    if (event.ctrlKey && event.key.toLowerCase() === "l") {
      event.preventDefault();
      setTranscript([]);
      setCurrentSections([]);
      focusInput();
      revealPromptAfterRender();
      return;
    }

    if (
      (event.key === "ArrowUp" || event.key === "ArrowDown") &&
      (command.includes("\n") || !isSingleVisualLine)
    ) {
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveThroughHistory("up");
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveThroughHistory("down");
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      submitCommand();
    }
  }

  function handleSessionPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) focusInput();
  }

  const blockCaretVisible =
    isInputFocused &&
    !isComposing &&
    isAscii(command) &&
    !command.includes("\n") &&
    isSingleVisualLine &&
    selection.start === selection.end;
  const caretStyle = {
    "--terminal-caret-column": selection.start,
    "--terminal-input-scroll-left": `${selection.scrollLeft}px`,
    "--terminal-caret-prefix": `${promptIndent ?? 0}px`
  } as CSSProperties;
  const inputStyle = promptIndent
    ? ({ "--terminal-prompt-indent": `${promptIndent}px` } as CSSProperties)
    : undefined;

  function renderPortfolio(snapshot: SectionName[], initial = false) {
    return (
      <div className="portfolio-intro">
            {initial && <div><span className="prompt">{PROMPT}</span> cat welcome.txt</div>}
            <pre className="ascii-banner ascii-banner-wide" aria-hidden="true">{String.raw`
     _  _____  ____   _____  __  __ __   __
    | || ____||  _ \ | ____||  \/  |\ \ / /
  _ | ||  _|  | |_) ||  _|  | |\/| | \ V /
 | || || |___ |  _ < | |___ | |  | |  | |
  \__/ |_____||_| \_\|_____||_|  |_|  |_|
`}</pre>
            <pre className="ascii-banner ascii-banner-small" aria-hidden="true">{String.raw`
       .-----------------.
       |  >_ JEREMY      |
       |                 |
       '-----------------'
           /_________\
`}</pre>
            <h1>Jeremy Mathew</h1>
            <p>Cloud infrastructure, product design, and practical software.<br />
              High school student in Tampa, Florida, dual enrolled at Hillsborough College.<br />
              Founder of Atripix, building websites, CRM workflows, and serverless systems.</p>
            <div className="intro-links" aria-label="Contact and documents">
              <a href="mailto:me@jeremy.md">[ email ]</a>{"  "}
              <a href="/assets/Jeremy-Mathew-Resume.pdf">[ resume.pdf ]</a>{"  "}

              <a href="https://github.com/jeremydevv">[ github ]</a>
            </div>
            <section aria-label="education">
              <div className="section-header"><h2>[ education ]</h2>{sectionControl("education", "education", snapshot)}</div>
              {(!collapsible || snapshot.includes("education")) && <SectionContent section="education" />}

            </section>
            <section aria-label="experience">
              <div className="section-header"><h2>[ experience ]</h2>{sectionControl("experience", "experience", snapshot)}</div>
              {(!collapsible || snapshot.includes("experience")) && <SectionContent section="experience" />}

            </section>
            {expanded && <>
              <section aria-label="projects">
                <div className="section-header"><h2>[ projects ]</h2>{sectionControl("project", "projects", snapshot)}</div>
              {(!collapsible || snapshot.includes("project")) && <SectionContent section="project" />}

              </section>
              <section aria-label="leadership and activities">
                <div className="section-header"><h2>[ leadership and activities ]</h2>{sectionControl("leadership", "leadership and activities", snapshot)}</div>
              {(!collapsible || snapshot.includes("leadership")) && <SectionContent section="leadership" />}

              </section>
              <section aria-label="skills">
                <div className="section-header"><h2>[ skills ]</h2>{sectionControl("skills", "skills", snapshot)}</div>
              {(!collapsible || snapshot.includes("skills")) && <SectionContent section="skills" />}

              </section>
            </>}
            <p>Type <code>open education</code> to expand a section, or <code>help</code> for all commands.</p>
          </div>
    );
  }

  return (
    <main className="desktop" aria-label="Movable desktop portfolio">
      <TerminalWindow textZoomEnabled={textZoomEnabled}>
        <div className="terminal-session" onPointerDown={handleSessionPointerDown}>
          {renderPortfolio([], true)}
          {transcript.map((entry, index) => (
            <div className="terminal-entry" key={`${entry.command}-${index}`}>
              <div>
                <span className="prompt">{PROMPT}</span>{" "}
                <span className="command">{entry.command}</span>
              </div>
              {entry.snapshot ? renderPortfolio(entry.snapshot) : entry.output && <div className="output">{renderOutput(entry.output)}</div>}
            </div>
          ))}
          <div className="terminal-line" ref={promptLineRef}>
            <span className="terminal-input-wrap">
              <span
                ref={promptRailRef}
                aria-hidden="true"
                className="prompt terminal-prompt-rail"
              >
                {PROMPT}
              </span>
              <span ref={cellProbeRef} aria-hidden="true" className="terminal-cell-probe">
                0
              </span>
              <textarea
                ref={inputRef}
                className="terminal-input terminal-textarea"
                aria-label="Terminal command"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                rows={1}
                data-block-caret-visible={blockCaretVisible}
                style={inputStyle}
                value={command}
                onChange={(event) => {
                  setCommand(event.target.value);
                  resetHistoryNavigation();
                  syncSelection(event.target);
                }}
                onKeyDown={handleInputKeyDown}
                onSelect={(event) => syncSelection(event.currentTarget)}
                onScroll={(event) => syncSelection(event.currentTarget)}
                onFocus={(event) => {
                  setIsInputFocused(true);
                  syncSelection(event.currentTarget);
                }}
                onBlur={() => setIsInputFocused(false)}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={(event) => {
                  setIsComposing(false);
                  syncSelection(event.currentTarget);
                }}
              />
              <span
                aria-hidden="true"
                className="terminal-caret"
                data-visible={blockCaretVisible}
                style={caretStyle}
              />
            </span>
          </div>
        </div>
      </TerminalWindow>
    </main>
  );
}
