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

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function placeRect(
  rect: Rect,
  viewport: Viewport,
  margin = 12
): Rect {
  return {
    ...rect,
    left: clamp(
      rect.left,
      margin,
      Math.max(margin, viewport.width - rect.width - margin)
    ),
    top: clamp(
      rect.top,
      margin,
      Math.max(margin, viewport.height - rect.height - margin)
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
