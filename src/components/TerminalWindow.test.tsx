import {
  act,
  fireEvent,
  render,
  screen
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TerminalWindow, terminalGridSize } from "./TerminalWindow";

const MEASURED_RECT = {
  left: 100,
  top: 100,
  width: 400,
  height: 300,
  right: 500,
  bottom: 400,
  x: 100,
  y: 100,
  toJSON: () => ({})
} as DOMRect;

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("TerminalWindow", () => {
  it("adjusts and resets terminal text size, with a fixed-size fallback", () => {
    const { container, rerender } = render(<TerminalWindow>content</TerminalWindow>);
    const shell = container.querySelector(".shell");
    fireEvent.click(screen.getByRole("button", { name: "Increase text size" }));
    expect(screen.getByRole("slider", { name: "Text zoom" })).toHaveValue("110");
    expect(shell).toHaveStyle({ fontSize: "12.54px" });
    fireEvent.change(screen.getByRole("slider", { name: "Text zoom" }), { target: { value: "150" } });
    fireEvent.click(screen.getByRole("button", { name: "Reset text zoom, currently 150%" }));
    expect(screen.getByRole("slider", { name: "Text zoom" })).toHaveValue("100");
    rerender(<TerminalWindow textZoomEnabled={false}>content</TerminalWindow>);
    expect(screen.queryByRole("slider", { name: "Text zoom" })).not.toBeInTheDocument();
    expect(shell).not.toHaveStyle({ fontSize: "11.4px" });
  });
  it("derives the title grid from the shell's usable cell area", () => {
    expect(terminalGridSize(840, 450, 7, 15)).toEqual({
      columns: 120,
      rows: 30
    });
    expect(terminalGridSize(839, 449, 7, 15)).toEqual({
      columns: 119,
      rows: 29
    });
    expect(terminalGridSize(6, 14, 7, 15)).toEqual({ columns: 1, rows: 1 });
  });

  it("reveals traffic-light symbols only while their group is hovered", () => {
    render(
      <TerminalWindow>
        <span>content</span>
      </TerminalWindow>
    );
    const controls = screen.getByLabelText("Window controls");

    expect(controls).not.toHaveClass("is-revealed");

    fireEvent.pointerEnter(controls);
    expect(controls).toHaveClass("is-revealed");

    fireEvent.pointerLeave(controls);
    expect(controls).not.toHaveClass("is-revealed");
  });

  it("keeps title copy in a separate text span from the folder icon", () => {
    render(
      <TerminalWindow>
        <span>content</span>
      </TerminalWindow>
    );

    const title = document.querySelector(".title");
    const titleText = title?.querySelector(".title-text");

    expect(title?.querySelector(".folder-icon")).toBeInTheDocument();
    expect(titleText).toHaveTextContent("jeremydevv - zsh -");
  });

  it("exposes pointer-only resize targets for every window edge and corner", () => {
    render(
      <TerminalWindow>
        <span>content</span>
      </TerminalWindow>
    );

    expect(
      [...document.querySelectorAll<HTMLElement>("[data-resize-edge]")].map(
        (handle) => handle.dataset.resizeEdge
      )
    ).toEqual([
      "n",
      "e",
      "s",
      "w",
      "nw",
      "ne",
      "se",
      "sw"
    ]);
  });

  it("resizes from a corner with pointer capture and stops after pointer up", () => {
    render(
      <TerminalWindow>
        <span>content</span>
      </TerminalWindow>
    );
    const terminal = screen.getByRole("region", {
      name: "Jeremy portfolio terminal"
    });
    vi.spyOn(terminal, "getBoundingClientRect").mockReturnValue(MEASURED_RECT);
    const handle = document.querySelector<HTMLElement>(
      '[data-resize-edge="se"]'
    );

    expect(handle).toBeInTheDocument();
    fireEvent.pointerDown(handle!, {
      pointerId: 9,
      button: 0,
      isPrimary: true,
      clientX: 500,
      clientY: 400
    });
    fireEvent.pointerMove(handle!, {
      pointerId: 9,
      clientX: 560,
      clientY: 450
    });
    expect(terminal).toHaveClass("is-resizing");
    expect(terminal.style.width).toBe("460px");
    expect(terminal.style.height).toBe("350px");

    fireEvent.pointerUp(handle!, { pointerId: 9 });
    fireEvent.pointerMove(handle!, {
      pointerId: 9,
      clientX: 620,
      clientY: 500
    });
    expect(terminal).not.toHaveClass("is-resizing");
    expect(terminal.style.width).toBe("460px");
    expect(terminal.style.height).toBe("350px");
  });

  it("stops a resize when pointer capture is cancelled or lost", () => {
    render(
      <TerminalWindow>
        <span>content</span>
      </TerminalWindow>
    );
    const terminal = screen.getByRole("region", {
      name: "Jeremy portfolio terminal"
    });
    vi.spyOn(terminal, "getBoundingClientRect").mockReturnValue(MEASURED_RECT);
    const handle = document.querySelector<HTMLElement>('[data-resize-edge="se"]');

    fireEvent.pointerDown(handle!, {
      pointerId: 11,
      button: 0,
      isPrimary: true,
      clientX: 500,
      clientY: 400
    });
    fireEvent.pointerCancel(handle!, { pointerId: 11 });
    fireEvent.pointerMove(handle!, {
      pointerId: 11,
      clientX: 560,
      clientY: 450
    });
    expect(terminal).not.toHaveClass("is-resizing");
    expect(terminal.style.width).toBe("");

    fireEvent.pointerDown(handle!, {
      pointerId: 12,
      button: 0,
      isPrimary: true,
      clientX: 500,
      clientY: 400
    });
    const lostCapture = new Event("lostpointercapture", { bubbles: true });
    Object.defineProperty(lostCapture, "pointerId", { value: 12 });
    fireEvent(handle!, lostCapture);
    fireEvent.pointerMove(handle!, {
      pointerId: 12,
      clientX: 560,
      clientY: 450
    });
    expect(terminal).not.toHaveClass("is-resizing");
    expect(terminal.style.width).toBe("");
  });

  it("does not start edge resizing while the window is zoomed", () => {
    render(
      <TerminalWindow>
        <span>content</span>
      </TerminalWindow>
    );
    const terminal = screen.getByRole("region", {
      name: "Jeremy portfolio terminal"
    });
    vi.spyOn(terminal, "getBoundingClientRect").mockReturnValue(MEASURED_RECT);
    fireEvent.click(screen.getByRole("button", { name: "Zoom" }));

    const handle = document.querySelector<HTMLElement>('[data-resize-edge="w"]');
    fireEvent.pointerDown(handle!, {
      pointerId: 10,
      button: 0,
      isPrimary: true,
      clientX: 100,
      clientY: 250
    });
    fireEvent.pointerMove(handle!, {
      pointerId: 10,
      clientX: 50,
      clientY: 250
    });

    expect(terminal).toHaveClass("is-zoomed");
    expect(terminal).not.toHaveClass("is-resizing");
  });

  it("resizes from the titlebar with Alt+Arrow while preserving the top-left anchor", () => {
    render(
      <TerminalWindow>
        <span>content</span>
      </TerminalWindow>
    );
    const terminal = screen.getByRole("region", {
      name: "Jeremy portfolio terminal"
    });
    const titlebar = screen.getByRole("banner", {
      name: "Drag terminal window"
    });
    vi.spyOn(terminal, "getBoundingClientRect").mockImplementation(() => {
      const left = Number.parseFloat(terminal.style.left) || MEASURED_RECT.left;
      const top = Number.parseFloat(terminal.style.top) || MEASURED_RECT.top;
      const width = Number.parseFloat(terminal.style.width) || MEASURED_RECT.width;
      const height = Number.parseFloat(terminal.style.height) || MEASURED_RECT.height;
      return {
        ...MEASURED_RECT,
        left,
        top,
        width,
        height,
        right: left + width,
        bottom: top + height
      } as DOMRect;
    });

    fireEvent.keyDown(titlebar, { key: "ArrowLeft", altKey: true });
    expect(terminal.style.left).toBe("100px");
    expect(terminal.style.width).toBe("384px");

    fireEvent.keyDown(titlebar, { key: "ArrowRight", altKey: true });
    expect(terminal.style.left).toBe("100px");
    expect(terminal.style.width).toBe("400px");

    fireEvent.keyDown(titlebar, {
      key: "ArrowRight",
      altKey: true,
      shiftKey: true
    });
    expect(terminal.style.width).toBe("448px");
  });

  it("keeps minimized and closed windows hidden until their explicit restore controls are used", () => {
    render(
      <TerminalWindow>
        <span>content</span>
      </TerminalWindow>
    );
    const terminal = screen.getByRole("region", {
      name: "Jeremy portfolio terminal"
    });
    vi.spyOn(terminal, "getBoundingClientRect").mockReturnValue(MEASURED_RECT);

    fireEvent.click(screen.getByRole("button", { name: "Minimize" }));
    expect(terminal).toHaveClass("is-minimized");
    expect(terminal).toHaveAttribute("aria-hidden", "true");
    const minimizedRestore = screen.getByRole("button", {
      name: "Restore minimized terminal"
    });
    expect(minimizedRestore).toHaveFocus();

    fireEvent.click(minimizedRestore);
    expect(terminal).not.toHaveClass("is-minimized");

    fireEvent.click(screen.getByRole("button", { name: "Zoom" }));
    expect(terminal).toHaveClass("is-zoomed");
    expect(screen.getByRole("button", { name: "Restore window size" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(terminal).toHaveClass("is-closed");
    expect(terminal).toHaveAttribute("aria-hidden", "true");
    expect(terminal).toHaveAttribute("inert");
    const restore = screen.getByRole("button", { name: "Restore terminal" });
    expect(restore).toBeVisible();
    expect(restore).toHaveFocus();

    fireEvent.click(restore);
    expect(terminal).not.toHaveClass("is-closed");
    expect(terminal.style.left).toBe("");
    expect(terminal.style.transform).toBe("");
  });

  it("moves with arrow keys and zooms with Enter", () => {
    render(
      <TerminalWindow>
        <span>content</span>
      </TerminalWindow>
    );
    const terminal = screen.getByRole("region", {
      name: "Jeremy portfolio terminal"
    });
    const titlebar = screen.getByRole("banner", {
      name: "Drag terminal window"
    });
    vi.spyOn(terminal, "getBoundingClientRect").mockReturnValue(MEASURED_RECT);

    fireEvent.keyDown(titlebar, { key: "ArrowRight" });
    expect(terminal.style.left).toBe("116px");
    expect(terminal.style.top).toBe("100px");
    expect(terminal.style.transform).toBe("none");

    fireEvent.keyDown(titlebar, { key: "Enter" });
    expect(terminal).toHaveClass("is-zoomed");
  });

  it("drags by pointer offset and stops moving after pointer up", () => {
    render(
      <TerminalWindow>
        <span>content</span>
      </TerminalWindow>
    );
    const terminal = screen.getByRole("region", {
      name: "Jeremy portfolio terminal"
    });
    const titlebar = screen.getByRole("banner", {
      name: "Drag terminal window"
    });
    vi.spyOn(terminal, "getBoundingClientRect").mockReturnValue(MEASURED_RECT);

    fireEvent.pointerDown(titlebar, {
      pointerId: 7,
      button: 0,
      isPrimary: true,
      clientX: 120,
      clientY: 130
    });
    fireEvent.pointerMove(titlebar, {
      pointerId: 7,
      clientX: 220,
      clientY: 230
    });
    expect(terminal.style.left).toBe("200px");
    expect(terminal.style.top).toBe("200px");

    fireEvent.pointerUp(titlebar, { pointerId: 7 });
    fireEvent.pointerMove(titlebar, {
      pointerId: 7,
      clientX: 320,
      clientY: 330
    });
    expect(terminal.style.left).toBe("200px");
    expect(terminal).not.toHaveClass("is-dragging");
  });

  it("does not begin a drag from a non-primary pointer", () => {
    render(
      <TerminalWindow>
        <span>content</span>
      </TerminalWindow>
    );
    const terminal = screen.getByRole("region", {
      name: "Jeremy portfolio terminal"
    });
    const titlebar = screen.getByRole("banner", {
      name: "Drag terminal window"
    });
    vi.spyOn(terminal, "getBoundingClientRect").mockReturnValue(MEASURED_RECT);

    fireEvent.pointerDown(titlebar, {
      pointerId: 4,
      button: 2,
      isPrimary: false,
      clientX: 120,
      clientY: 130
    });
    fireEvent.pointerMove(titlebar, {
      pointerId: 4,
      clientX: 220,
      clientY: 230
    });

    expect(terminal).not.toHaveClass("is-dragging");
    expect(terminal.style.left).toBe("");
  });

  it("stops dragging when the browser reports lost pointer capture", () => {
    render(
      <TerminalWindow>
        <span>content</span>
      </TerminalWindow>
    );
    const terminal = screen.getByRole("region", {
      name: "Jeremy portfolio terminal"
    });
    const titlebar = screen.getByRole("banner", {
      name: "Drag terminal window"
    });
    vi.spyOn(terminal, "getBoundingClientRect").mockReturnValue(MEASURED_RECT);

    fireEvent.pointerDown(titlebar, {
      pointerId: 7,
      button: 0,
      isPrimary: true,
      clientX: 120,
      clientY: 130
    });
    const lostCapture = new Event("lostpointercapture", { bubbles: true });
    Object.defineProperty(lostCapture, "pointerId", { value: 7 });
    fireEvent(titlebar, lostCapture);
    fireEvent.pointerMove(titlebar, {
      pointerId: 7,
      clientX: 220,
      clientY: 230
    });

    expect(terminal).not.toHaveClass("is-dragging");
    expect(terminal.style.left).toBe("100px");
  });

  it("returns to the focused chrome state when a keyboard-focused control receives focus", () => {
    render(
      <>
        <button type="button">Outside</button>
        <TerminalWindow>
          <span>content</span>
        </TerminalWindow>
      </>
    );
    const terminal = screen.getByRole("region", {
      name: "Jeremy portfolio terminal"
    });

    fireEvent.pointerDown(screen.getByRole("button", { name: "Outside" }));
    expect(terminal).not.toHaveClass("is-focused");

    fireEvent.focus(screen.getByRole("button", { name: "Zoom" }));
    expect(terminal).toHaveClass("is-focused");
  });

  it("dims on window blur and restores focus only when a terminal control is active", () => {
    render(
      <>
        <button type="button">Outside</button>
        <TerminalWindow>
          <span>content</span>
        </TerminalWindow>
      </>
    );
    const terminal = screen.getByRole("region", {
      name: "Jeremy portfolio terminal"
    });
    const outside = screen.getByRole("button", { name: "Outside" });
    const zoom = screen.getByRole("button", { name: "Zoom" });

    fireEvent(window, new Event("blur"));
    expect(terminal).not.toHaveClass("is-focused");

    outside.focus();
    fireEvent(window, new Event("focus"));
    expect(terminal).not.toHaveClass("is-focused");

    zoom.focus();
    fireEvent(window, new Event("focus"));
    expect(terminal).toHaveClass("is-focused");
  });
});
