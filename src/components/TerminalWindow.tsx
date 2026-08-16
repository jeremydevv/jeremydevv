import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type PropsWithChildren
} from "react";

import {
  placeRect,
  zoomedRect,
  type Rect,
  type Viewport
} from "./terminal-geometry";

interface DragState {
  pointerId: number;
  offsetX: number;
  offsetY: number;
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

export function TerminalWindow({ children }: PropsWithChildren) {
  const terminalRef = useRef<HTMLElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const savedRectRef = useRef<Rect | null>(null);
  const closeRestoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const [rect, setRect] = useState<Rect | null>(null);
  const [isClosed, setIsClosed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

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
    if (closeRestoreTimerRef.current) {
      clearTimeout(closeRestoreTimerRef.current);
    }

    setIsClosed(true);
    closeRestoreTimerRef.current = setTimeout(() => {
      closeRestoreTimerRef.current = null;
      resetToCenteredWindow();
      focusWindow();
      requestAnimationFrame(() => setIsClosed(false));
    }, 350);
  }

  function minimizeWindow() {
    if (isClosed) return;
    if (!isMinimized) {
      savedRectRef.current = snapshot();
    }

    setIsZoomed(false);
    setIsMinimized(true);
    setPlacedRect({
      left: 18,
      top: window.innerHeight - 54,
      width: Math.max(0, Math.min(340, window.innerWidth - 36)),
      height: 36
    });
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

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if ((event.target as Element).closest("[data-window-action]")) return;

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

  useEffect(
    () => () => {
      if (closeRestoreTimerRef.current) {
        clearTimeout(closeRestoreTimerRef.current);
      }
    },
    []
  );

  const className = [
    "terminal",
    isFocused && "is-focused",
    isDragging && "is-dragging",
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
    <section
      ref={terminalRef}
      className={className}
      style={style}
      aria-label="Jeremy portfolio terminal"
    >
      <header
        className="titlebar"
        tabIndex={0}
        aria-label="Drag terminal window"
        aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Shift+ArrowUp Shift+ArrowDown Shift+ArrowLeft Shift+ArrowRight Enter Space"
        onDoubleClick={(event) => {
          if (!(event.target as Element).closest("[data-window-action]")) {
            zoomWindow();
          }
        }}
        onKeyDown={handleKeyDown}
        onPointerCancel={stopDrag}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDrag}
      >
        <div className="lights" aria-label="Window controls">
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
            aria-label="Zoom"
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
        <div className="title">jeremy.md - zsh</div>
        <div aria-hidden="true" />
      </header>
      <div className="shell">{children}</div>
    </section>
  );
}
