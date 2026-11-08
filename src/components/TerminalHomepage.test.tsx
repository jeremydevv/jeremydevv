import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TerminalHomepage } from "./TerminalHomepage";

describe("TerminalHomepage", () => {
  it("appends complete portfolio snapshots without changing earlier versions", () => {
    render(<TerminalHomepage />);
    const button = screen.getByRole("button", { name: "Expand education" });
    expect(screen.queryByText("Hillsborough College")).not.toBeInTheDocument();
    fireEvent.click(button);
    expect(screen.getByText("Hillsborough College")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "Jeremy Mathew" })).toHaveLength(2);
    expect(button).toHaveAttribute("aria-expanded", "false");
    enter("open experience");
    expect(screen.getByText("Atripix LLC")).toBeInTheDocument();
    expect(screen.getAllByText("Hillsborough College")).toHaveLength(2);
    expect(button).toBeInTheDocument();
    enter("clear");
    expect(screen.queryByText("Hillsborough College")).not.toBeInTheDocument();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function commandInput(): HTMLTextAreaElement {
    return screen.getByRole("textbox", {
      name: "Terminal command"
    }) as HTMLTextAreaElement;
  }

  function enter(command: string) {
    const input = commandInput();
    fireEvent.change(input, { target: { value: command } });
    fireEvent.keyDown(input, { key: "Enter" });
  }

  it("accepts a command and renders its response after Return", () => {
    render(<TerminalHomepage />);

    const input = commandInput();
    fireEvent.change(input, { target: { value: "whoami" } });
    expect(input).toHaveValue("whoami");

    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.getByText(/high school student, dual enrolled at Hillsborough College/)).toBeInTheDocument();
    expect(input).toHaveValue("");
  });

  it("normalizes only dispatch whitespace while retaining the raw command", () => {
    render(<TerminalHomepage />);

    enter("  ls   focus  ");

    expect(
      screen.getAllByText(
        (_, element) =>
          element?.textContent === "typescript  lua  java  react  cloudflare-workers  git  github-actions"
      )
    ).not.toHaveLength(0);
    expect(
      screen.getByText(
        (_, element) =>
          Boolean(
            element?.classList.contains("command") &&
              element.textContent === "  ls   focus  "
          )
      )
    ).toBeInTheDocument();
  });

  it("renders a safe unknown-command response", () => {
    render(<TerminalHomepage />);

    enter("brew install fun");

    expect(screen.getByText("zsh: command not found: brew install fun")).toBeInTheDocument();
  });

  it("clears the transcript with clear and Ctrl-L", () => {
    render(<TerminalHomepage />);

    enter("whoami");
    enter("clear");
    expect(screen.queryByText(/high school student, dual enrolled at Hillsborough College/)).not.toBeInTheDocument();

    enter("help");
    fireEvent.keyDown(commandInput(), { key: "l", ctrlKey: true });
    expect(screen.queryByText("available commands:", { exact: false })).not.toBeInTheDocument();
  });

  it("adds a prompt for an empty Return and does not dispatch while composing", () => {
    render(<TerminalHomepage />);

    const input = commandInput();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getAllByText("jeremy@portfolio ~ %")).toHaveLength(3);

    fireEvent.change(input, { target: { value: "whoami" } });
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    expect(screen.queryByText(/high school student, dual enrolled at Hillsborough College/)).not.toBeInTheDocument();
    expect(input).toHaveValue("whoami");
  });

  it("cycles bounded command history and restores the typed draft", () => {
    render(<TerminalHomepage />);

    enter("help");
    enter("pwd");
    const input = commandInput();
    fireEvent.change(input, { target: { value: "draft" } });

    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input).toHaveValue("pwd");
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input).toHaveValue("help");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input).toHaveValue("pwd");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input).toHaveValue("draft");
  });

  it("cancels pending input with Ctrl-C and records the cancellation", () => {
    render(<TerminalHomepage />);

    const input = commandInput();
    fireEvent.change(input, { target: { value: "partial command" } });
    fireEvent.keyDown(input, { key: "c", ctrlKey: true });

    expect(input).toHaveValue("");
    expect(screen.getByText("partial command")).toBeInTheDocument();
    expect(screen.getByText("^C")).toBeInTheDocument();
  });

  it("renders portfolio links as clickable links without opening them", () => {
    render(<TerminalHomepage />);

    enter("open links");

    expect(screen.getByRole("link", { name: "github.com/jeremydevv" })).toHaveAttribute(
      "href",
      "https://github.com/jeremydevv"
    );
    expect(screen.getByRole("link", { name: "me@jeremy.md" })).toHaveAttribute(
      "href",
      "mailto:me@jeremy.md"
    );
    expect(screen.getByRole("link", { name: "resume" })).toHaveAttribute("href", "/assets/Jeremy-Mathew-Resume.pdf");
  });

  it("keeps only the most recent 200 transcript entries", () => {
    render(<TerminalHomepage />);

    for (let index = 0; index <= 200; index += 1) {
      enter(`unknown-${index}`);
    }

    expect(screen.queryByText("zsh: command not found: unknown-0")).not.toBeInTheDocument();
    expect(screen.getByText("zsh: command not found: unknown-200")).toBeInTheDocument();
  });

  it("does not steal focus when an output link is selected", () => {
    render(<TerminalHomepage />);
    enter("open links");

    const link = screen.getByRole("link", { name: "resume" });
    link.focus();
    fireEvent.pointerDown(link);

    expect(document.activeElement).toBe(link);
  });

  it("focuses the input on initial mount only for a fine pointer", () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true }));

    render(<TerminalHomepage />);

    expect(document.activeElement).toBe(commandInput());
  });

  it("keeps a coarse-pointer initial mount unfocused", () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: false }));

    render(<TerminalHomepage />);

    expect(document.activeElement).not.toBe(commandInput());
  });

  it("scrolls the new prompt into view after a command, not after transcript selection", () => {
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView
    });
    render(<TerminalHomepage />);

    enter("whoami");
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "end" });

    scrollIntoView.mockClear();
    fireEvent.select(screen.getByText(/high school student, dual enrolled at Hillsborough College/));
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("synchronizes the block caret to a collapsed native input selection", () => {
    render(<TerminalHomepage />);
    const input = commandInput();
    fireEvent.change(input, { target: { value: "portfolio" } });
    input.focus();
    input.setSelectionRange(4, 4);
    fireEvent.select(input);

    const caret = document.querySelector(".terminal-caret");
    expect(caret).toHaveAttribute("data-visible", "true");
    expect(input).toHaveAttribute("data-block-caret-visible", "true");
    expect(caret).toHaveStyle("--terminal-caret-column: 4");
    expect(caret?.parentElement).toHaveClass("terminal-input-wrap");

    Object.defineProperty(input, "scrollLeft", { configurable: true, value: 12 });
    fireEvent.scroll(input);
    expect(caret).toHaveStyle("--terminal-input-scroll-left: 12px");

    input.setSelectionRange(2, 6);
    fireEvent.select(input);
    expect(caret).toHaveAttribute("data-visible", "false");
    expect(input).toHaveAttribute("data-block-caret-visible", "false");
  });

  it("falls back to the native caret for emoji, CJK, or combining input", () => {
    render(<TerminalHomepage />);
    const input = commandInput();
    fireEvent.change(input, { target: { value: "cafe\u0301🙂東京" } });
    input.focus();
    input.setSelectionRange(5, 5);
    fireEvent.select(input);

    expect(document.querySelector(".terminal-caret")).toHaveAttribute(
      "data-visible",
      "false"
    );
    expect(input).toHaveAttribute("data-block-caret-visible", "false");
  });

  it("uses a native textarea with a prompt rail for soft-wrapped commands", () => {
    render(<TerminalHomepage />);

    const input = commandInput();
    expect(input.tagName).toBe("TEXTAREA");
    expect(input).toHaveAttribute("rows", "1");
    expect(input.parentElement).toHaveClass("terminal-input-wrap");
    expect(input.parentElement?.querySelector(".terminal-prompt-rail")).toBeInTheDocument();
  });

  it("derives first-line indent and caret prefix from measured prompt geometry", () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
      this: HTMLElement
    ) {
      if (this.classList.contains("terminal-prompt-rail")) {
        return { width: 140 } as DOMRect;
      }
      if (this.classList.contains("terminal-cell-probe")) {
        return { width: 8 } as DOMRect;
      }
      return { width: 0 } as DOMRect;
    });
    render(<TerminalHomepage />);

    const input = commandInput();
    input.focus();
    expect(document.querySelector(".terminal-cell-probe")).toBeInTheDocument();
    expect(input).toHaveStyle("--terminal-prompt-indent: 148px");
    expect(document.querySelector(".terminal-caret")).toHaveStyle(
      "--terminal-caret-prefix: 148px"
    );
  });

  it("keeps pasted multiline commands editable until a later Enter", () => {
    render(<TerminalHomepage />);

    const input = commandInput();
    fireEvent.change(input, { target: { value: "whoami\npwd" } });
    input.focus();
    input.setSelectionRange(5, 5);
    fireEvent.select(input);

    expect(input).toHaveValue("whoami\npwd");
    expect(screen.queryByText("Software engineer.")).not.toBeInTheDocument();
    expect(input).toHaveAttribute("data-block-caret-visible", "false");
  });

  it("uses the native caret when an ASCII command soft-wraps visually", () => {
    vi.spyOn(HTMLTextAreaElement.prototype, "clientHeight", "get").mockReturnValue(15);
    vi.spyOn(HTMLTextAreaElement.prototype, "scrollHeight", "get").mockImplementation(
      function (this: HTMLTextAreaElement) {
        return this.value ? 30 : 15;
      }
    );
    render(<TerminalHomepage />);

    const input = commandInput();
    fireEvent.change(input, { target: { value: "a long ASCII command" } });
    input.focus();
    input.setSelectionRange(4, 4);
    fireEvent.select(input);

    expect(input).toHaveAttribute("data-block-caret-visible", "false");
    expect(document.querySelector(".terminal-caret")).toHaveAttribute(
      "data-visible",
      "false"
    );
  });

  it("leaves multiline ArrowUp and ArrowDown to native textarea navigation", () => {
    render(<TerminalHomepage />);
    const input = commandInput();
    fireEvent.change(input, { target: { value: "first line\nsecond line" } });

    const arrowUp = createEvent.keyDown(input, { key: "ArrowUp" });
    fireEvent(input, arrowUp);
    const arrowDown = createEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent(input, arrowDown);

    expect(arrowUp.defaultPrevented).toBe(false);
    expect(arrowDown.defaultPrevented).toBe(false);
    expect(input).toHaveValue("first line\nsecond line");
  });

  it("moves the native selection and block caret to the end of recalled history", () => {
    render(<TerminalHomepage />);
    enter("whoami");
    const input = commandInput();
    input.focus();
    fireEvent.keyDown(input, { key: "ArrowUp" });

    expect(input.selectionStart).toBe(6);
    expect(document.querySelector(".terminal-caret")).toHaveStyle(
      "--terminal-caret-column: 6"
    );
  });

  it("leaves composition and history navigation to the native input while composing", () => {
    render(<TerminalHomepage />);
    enter("help");
    const input = commandInput();
    fireEvent.change(input, { target: { value: "draft" } });
    fireEvent.compositionStart(input);
    fireEvent.keyDown(input, { key: "ArrowUp", isComposing: true });

    expect(input).toHaveValue("draft");
    expect(document.querySelector(".terminal-caret")).toHaveAttribute(
      "data-visible",
      "false"
    );
  });
});
