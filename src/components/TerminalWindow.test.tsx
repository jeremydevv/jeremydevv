import {
  act,
  fireEvent,
  render,
  screen
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TerminalWindow } from "./TerminalWindow";

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
  it("minimizes, restores, zooms, and restores after close", async () => {
    vi.useFakeTimers();
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

    fireEvent.click(screen.getByRole("button", { name: "Zoom" }));
    expect(terminal).not.toHaveClass("is-minimized");

    fireEvent.click(screen.getByRole("button", { name: "Zoom" }));
    expect(terminal).toHaveClass("is-zoomed");

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(terminal).toHaveClass("is-closed");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(366);
    });
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
});
