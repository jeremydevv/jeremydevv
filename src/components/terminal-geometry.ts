export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Viewport {
  width: number;
  height: number;
}

export type ResizeEdge =
  | "top"
  | "right"
  | "bottom"
  | "left"
  | "top-left"
  | "top-right"
  | "bottom-right"
  | "bottom-left";

export interface Size {
  width: number;
  height: number;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function placeRect(
  rect: Rect,
  viewport: Viewport,
  margin = 12
): Rect {
  const width = Math.min(rect.width, Math.max(0, viewport.width - margin * 2));
  const height = Math.min(
    rect.height,
    Math.max(0, viewport.height - margin * 2)
  );

  return {
    ...rect,
    width,
    height,
    left: clamp(
      rect.left,
      margin,
      Math.max(margin, viewport.width - width - margin)
    ),
    top: clamp(
      rect.top,
      margin,
      Math.max(margin, viewport.height - height - margin)
    )
  };
}

export function zoomedRect(viewport: Viewport): Rect {
  return {
    left: 18,
    top: 18,
    width: Math.max(0, viewport.width - 36),
    height: Math.max(0, viewport.height - 36)
  };
}

function resizedAxis(
  start: number,
  size: number,
  delta: number,
  moveStart: boolean,
  moveEnd: boolean,
  viewportSize: number,
  minimumSize: number,
  margin: number
) {
  const lower = margin;
  const upper = Math.max(lower, viewportSize - margin);

  if (moveStart) {
    const fixedEnd = clamp(start + size, lower, upper);
    const effectiveMinimum = Math.min(
      minimumSize,
      Math.max(0, fixedEnd - lower)
    );
    const nextStart = clamp(start + delta, lower, fixedEnd - effectiveMinimum);
    return { start: nextStart, size: fixedEnd - nextStart };
  }

  if (moveEnd) {
    const fixedStart = clamp(start, lower, upper);
    const effectiveMinimum = Math.min(
      minimumSize,
      Math.max(0, upper - fixedStart)
    );
    const nextEnd = clamp(
      start + size + delta,
      fixedStart + effectiveMinimum,
      upper
    );
    return { start: fixedStart, size: nextEnd - fixedStart };
  }

  return { start, size };
}

export function resizeRect(
  rect: Rect,
  edge: ResizeEdge,
  delta: { x: number; y: number },
  viewport: Viewport,
  minimum: Size = { width: 260, height: 180 },
  margin = 12
): Rect {
  const horizontal = resizedAxis(
    rect.left,
    rect.width,
    delta.x,
    edge.includes("left"),
    edge.includes("right"),
    viewport.width,
    minimum.width,
    margin
  );
  const vertical = resizedAxis(
    rect.top,
    rect.height,
    delta.y,
    edge.includes("top"),
    edge.includes("bottom"),
    viewport.height,
    minimum.height,
    margin
  );

  return {
    left: horizontal.start,
    top: vertical.start,
    width: horizontal.size,
    height: vertical.size
  };
}
