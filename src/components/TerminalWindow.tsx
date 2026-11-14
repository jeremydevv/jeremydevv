import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type PropsWithChildren
} from "react";

import {
  placeRect,
  resizeRect,
  zoomedRect,
  type Rect,
  type ResizeEdge,
  type Viewport
} from "./terminal-geometry";
import "./terminal-resize.css";

interface DragState {
  pointerId: number;
  offsetX: number;
  offsetY: number;
}

interface ResizeState {
  pointerId: number;
  edge: ResizeEdge;
  rect: Rect;
  startX: number;
  startY: number;
}

const RESIZE_TARGETS: ReadonlyArray<{ id: string; edge: ResizeEdge }> = [
  { id: "n", edge: "top" },
  { id: "e", edge: "right" },
  { id: "s", edge: "bottom" },
  { id: "w", edge: "left" },
  { id: "nw", edge: "top-left" },
  { id: "ne", edge: "top-right" },
  { id: "se", edge: "bottom-right" },
  { id: "sw", edge: "bottom-left" }
];

const TERMINAL_CELL_WIDTH = 7;
const TERMINAL_CELL_HEIGHT = 15;

export function terminalGridSize(
  usableWidth: number,
  usableHeight: number,
  cellWidth = TERMINAL_CELL_WIDTH,
  cellHeight = TERMINAL_CELL_HEIGHT
) {
  return {
    columns: Math.max(1, Math.floor(usableWidth / cellWidth)),
    rows: Math.max(1, Math.floor(usableHeight / cellHeight))
  };
}

function viewport(): Viewport {
  return { width: window.innerWidth, height: window.innerHeight };
}

function measuredRect(element: HTMLElement): Rect {
  const rect = element.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height
  };
}

export function TerminalWindow({ children, textZoomEnabled = true }: PropsWithChildren<{ textZoomEnabled?: boolean }>) {
  const terminalRef = useRef<HTMLElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const resizeRef = useRef<ResizeState | null>(null);
  const savedRectRef = useRef<Rect | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [isClosed, setIsClosed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const [isControlsHovered, setIsControlsHovered] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [textZoom, setTextZoom] = useState(100);
  const [grid, setGrid] = useState<{ columns: number; rows: number } | null>(
    null
  );

  function snapshot(): Rect {
    if (terminalRef.current) {
      return measuredRect(terminalRef.current);
    }

    return rect ?? { left: 12, top: 12, width: 340, height: 250 };
  }

  function setPlacedRect(nextRect: Rect) {
    setRect(placeRect(nextRect, viewport()));
  }

  function placeAt(left: number, top: number) {
    const current = snapshot();
    setPlacedRect({ ...current, left, top });
  }

  function focusWindow() {
    setIsFocused(true);
  }

  function restoreWindow() {
    setIsClosed(false);
    setIsMinimized(false);
    setIsZoomed(false);
    if (savedRectRef.current) {
      setPlacedRect(savedRectRef.current);
    }
    focusWindow();
  }

  function resetToCenteredWindow() {
    dragRef.current = null;
    savedRectRef.current = null;
    setRect(null);
    setIsDragging(false);
    setIsMinimized(false);
    setIsZoomed(false);
  }

  function closeWindow() {
    setIsClosed(true);
  }

  function restoreClosedWindow() {
    resetToCenteredWindow();
    setIsClosed(false);
    focusWindow();
  }

  function minimizeWindow() {
    if (isClosed) return;
    if (!isMinimized) {
      savedRectRef.current = snapshot();
    }

    setIsZoomed(false);
    setIsMinimized(true);
  }

  function zoomWindow() {
    if (isClosed) return;
    if (isMinimized) {
      restoreWindow();
      return;
    }

    if (isZoomed) {
      if (savedRectRef.current) {
        setPlacedRect(savedRectRef.current);
      }
      setIsZoomed(false);
      return;
    }

    savedRectRef.current = snapshot();
    setIsZoomed(true);
    setRect(zoomedRect(viewport()));
  }

  function moveBy(deltaX: number, deltaY: number) {
    const current = snapshot();
    placeAt(current.left + deltaX, current.top + deltaY);
  }

  function canResize() {
    return !isClosed && !isMinimized && !isZoomed;
  }

  function resizeBy(edge: ResizeEdge, deltaX: number, deltaY: number) {
    if (!canResize()) return;
    setRect(resizeRect(snapshot(), edge, { x: deltaX, y: deltaY }, viewport()));
  }

  function handleResizePointerDown(
    edge: ResizeEdge,
    event: PointerEvent<HTMLElement>
  ) {
    if (!canResize() || event.button !== 0 || event.isPrimary === false) return;

    event.stopPropagation();
    focusWindow();
    dragRef.current = null;
    setIsDragging(false);
    resizeRef.current = {
      pointerId: event.pointerId,
      edge,
      rect: snapshot(),
      startX: event.clientX,
      startY: event.clientY
    };
    setIsResizing(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handleResizePointerMove(event: PointerEvent<HTMLElement>) {
    const resize = resizeRef.current;
    if (!resize || event.pointerId !== resize.pointerId) return;

    setRect(
      resizeRect(
        resize.rect,
        resize.edge,
        { x: event.clientX - resize.startX, y: event.clientY - resize.startY },
        viewport()
      )
    );
  }

  function stopResize(event: PointerEvent<HTMLElement>) {
    const resize = resizeRef.current;
    if (!resize || event.pointerId !== resize.pointerId) return;

    resizeRef.current = null;
    setIsResizing(false);
  }

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if ((event.target as Element).closest("[data-window-action]")) return;
    if (event.button !== 0 || event.isPrimary === false) return;

    focusWindow();
    const startingRect =
      isMinimized && savedRectRef.current ? savedRectRef.current : snapshot();
    if (isMinimized) {
      restoreWindow();
    }

    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - startingRect.left,
      offsetY: event.clientY - startingRect.top
    };
    setIsDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setPlacedRect(startingRect);
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;

    placeAt(event.clientX - drag.offsetX, event.clientY - drag.offsetY);
  }

  function stopDrag(event: PointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;

    dragRef.current = null;
    setIsDragging(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    const step = event.shiftKey ? 48 : 16;
    const movements: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step]
    };
    const movement = movements[event.key];

    if (movement) {
      event.preventDefault();
      if (event.altKey) {
        const edge: Record<string, ResizeEdge> = {
          ArrowLeft: "right",
          ArrowRight: "right",
          ArrowUp: "bottom",
          ArrowDown: "bottom"
        };
        const delta: Record<string, [number, number]> = {
          ArrowLeft: [-step, 0],
          ArrowRight: [step, 0],
          ArrowUp: [0, -step],
          ArrowDown: [0, step]
        };
        resizeBy(edge[event.key], ...delta[event.key]);
        return;
      }
      moveBy(...movement);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      zoomWindow();
    }
  }

  useEffect(() => {
    function handleResize() {
      if (isZoomed) {
        setRect(zoomedRect(viewport()));
        return;
      }

      if (terminalRef.current) {
        setPlacedRect(measuredRect(terminalRef.current));
      }
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isZoomed]);

  useEffect(() => {
    function dimWhenPointerLeavesWindow(event: globalThis.PointerEvent) {
      if (!terminalRef.current?.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }

    document.addEventListener("pointerdown", dimWhenPointerLeavesWindow);
    return () =>
      document.removeEventListener("pointerdown", dimWhenPointerLeavesWindow);
  }, []);

  useEffect(() => {
    function dimForWindowBlur() {
      setIsFocused(false);
    }

    function restoreForTerminalFocus() {
      if (terminalRef.current?.contains(document.activeElement)) {
        setIsFocused(true);
      }
    }

    window.addEventListener("blur", dimForWindowBlur);
    window.addEventListener("focus", restoreForTerminalFocus);
    return () => {
      window.removeEventListener("blur", dimForWindowBlur);
      window.removeEventListener("focus", restoreForTerminalFocus);
    };
  }, []);

  useLayoutEffect(() => {
    function updateGrid() {
      const shell = shellRef.current;
      if (!shell) return;

      const style = window.getComputedStyle(shell);
      const usableWidth =
        shell.clientWidth -
        Number.parseFloat(style.paddingLeft) -
        Number.parseFloat(style.paddingRight);
      const usableHeight =
        shell.clientHeight -
        Number.parseFloat(style.paddingTop) -
        Number.parseFloat(style.paddingBottom);
      const cellHeight = Number.parseFloat(style.lineHeight);
      if (cellHeight <= 0 || usableWidth <= 0 || usableHeight <= 0) return;

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;

      if (context) {
        context.font = font;
        const cellWidth = context.measureText("M").width +
          (Number.parseFloat(style.letterSpacing) || 0);
        if (cellWidth <= 0) return;

        setGrid(
          terminalGridSize(
            usableWidth,
            usableHeight,
            cellWidth,
            cellHeight
          )
        );
      }
    }

    updateGrid();
    let disposed = false;
    void document.fonts?.ready.then(() => {
      if (!disposed) updateGrid();
    });
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateGrid);
      return () => {
        disposed = true;
        window.removeEventListener("resize", updateGrid);
      };
    }

    const shell = shellRef.current;
    if (!shell) return;

    const observer = new ResizeObserver(updateGrid);
    observer.observe(shell);
    return () => {
      disposed = true;
      observer.disconnect();
    };
  }, [textZoom]);

  useLayoutEffect(() => {
    if (isClosed || isMinimized) restoreRef.current?.focus();
  }, [isClosed, isMinimized]);

  const className = [
    "terminal",
    isFocused && "is-focused",
    isDragging && "is-dragging",
    isResizing && "is-resizing",
    isMinimized && "is-minimized",
    isZoomed && "is-zoomed",
    isClosed && "is-closed"
  ]
    .filter(Boolean)
    .join(" ");
  const style: CSSProperties | undefined = rect
    ? {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        transform: "none"
      }
    : undefined;

  return (
    <>
      <section
        ref={terminalRef}
        className={className}
        style={style}
        aria-label="Jeremy portfolio terminal"
        aria-hidden={isClosed || isMinimized || undefined}
        inert={isClosed || isMinimized}
        onFocusCapture={focusWindow}
        onPointerDown={focusWindow}
      >
      <div className="terminal-resize-surface">
      <header
        className="titlebar"
        tabIndex={0}
        aria-label="Drag terminal window"
        aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Shift+ArrowUp Shift+ArrowDown Shift+ArrowLeft Shift+ArrowRight Alt+ArrowUp Alt+ArrowDown Alt+ArrowLeft Alt+ArrowRight Enter Space"
        onDoubleClick={(event) => {
          if (!(event.target as Element).closest("[data-window-action]")) {
            zoomWindow();
          }
        }}
        onKeyDown={handleKeyDown}
        onPointerCancel={stopDrag}
        onLostPointerCapture={stopDrag}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDrag}
      >
        <div
          className={`lights${isControlsHovered ? " is-revealed" : ""}`}
          role="group"
          aria-label="Window controls"
          onPointerEnter={() => setIsControlsHovered(true)}
          onPointerLeave={() => setIsControlsHovered(false)}
        >
          <button
            className="light red"
            type="button"
            data-window-action="close"
            aria-label="Close"
            onPointerDown={(event) => {
              event.stopPropagation();
              focusWindow();
            }}
            onClick={(event) => {
              event.stopPropagation();
              closeWindow();
            }}
          />
          <button
            className="light yellow"
            type="button"
            data-window-action="minimize"
            aria-label="Minimize"
            onPointerDown={(event) => {
              event.stopPropagation();
              focusWindow();
            }}
            onClick={(event) => {
              event.stopPropagation();
              minimizeWindow();
            }}
          />
          <button
            className="light green"
            type="button"
            data-window-action="zoom"
            aria-label={isZoomed ? "Restore window size" : "Zoom"}
            onPointerDown={(event) => {
              event.stopPropagation();
              focusWindow();
            }}
            onClick={(event) => {
              event.stopPropagation();
              zoomWindow();
            }}
          />
        </div>
        <div className="title">
          <span className="folder-icon" aria-hidden="true" />
          <span className="title-text">
            jeremydevv - zsh - {grid ? `${grid.columns}x${grid.rows}` : "-"}
          </span>
        </div>
        <div aria-hidden="true" />
      </header>
        <span className="split-pane-control" aria-hidden="true" />
        <div className={`shell${textZoomEnabled ? " has-text-zoom" : ""}`} ref={shellRef}
          style={textZoomEnabled ? { fontSize: `${11.4 * textZoom / 100}px`, lineHeight: `${15 * textZoom / 100}px` } : undefined}>
          {children}
        </div>
        {textZoomEnabled && <div className="text-zoom-bar" role="group" aria-label="Terminal text zoom">
          <span aria-hidden="true">[ zoom</span>
          <button type="button" aria-label="Decrease text size" disabled={textZoom <= 80}
            onClick={() => setTextZoom((value) => Math.max(80, value - 10))}>-</button>
          <input type="range" aria-label="Text zoom" min="80" max="180" step="10" value={textZoom}
            onChange={(event) => setTextZoom(Number(event.target.value))} />
          <button type="button" aria-label="Increase text size" disabled={textZoom >= 180}
            onClick={() => setTextZoom((value) => Math.min(180, value + 10))}>+</button>
          <button type="button" className="text-zoom-reset" aria-label={`Reset text zoom, currently ${textZoom}%`}
            onClick={() => setTextZoom(100)}>{textZoom}%</button>
          <span aria-hidden="true">]</span>
        </div>}
      </div>
      <div className="terminal-resize-targets" aria-hidden="true">
        {RESIZE_TARGETS.map(({ id, edge }) => (
          <span
            key={id}
            className={`terminal-resize-target terminal-resize-target-${id}`}
            data-resize-edge={id}
            onPointerCancel={stopResize}
            onLostPointerCapture={stopResize}
            onPointerDown={(event) => handleResizePointerDown(edge, event)}
            onPointerMove={handleResizePointerMove}
            onPointerUp={stopResize}
          />
        ))}
      </div>
      </section>
      {(isClosed || isMinimized) && (
        <button
          ref={restoreRef}
          className="terminal-restore"
          type="button"
          onClick={isClosed ? restoreClosedWindow : restoreWindow}
        >
          {isClosed ? "Restore terminal" : "Restore minimized terminal"}
        </button>
      )}
    </>
  );
}
