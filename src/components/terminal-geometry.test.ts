import { describe, expect, it } from "vitest";

import { placeRect, resizeRect, zoomedRect } from "./terminal-geometry";

describe("terminal geometry", () => {
  it("keeps a window inside the viewport margin", () => {
    expect(
      placeRect(
        { left: -50, top: 900, width: 340, height: 250 },
        { width: 800, height: 600 },
        12
      )
    ).toEqual({ left: 12, top: 338, width: 340, height: 250 });
  });

  it("shrinks an oversized window to the viewport margins", () => {
    expect(
      placeRect(
        { left: 500, top: 500, width: 900, height: 700 },
        { width: 800, height: 600 },
        12
      )
    ).toEqual({ left: 12, top: 12, width: 776, height: 576 });
  });

  it("creates an 18 pixel inset zoom rectangle", () => {
    expect(zoomedRect({ width: 1000, height: 700 })).toEqual({
      left: 18,
      top: 18,
      width: 964,
      height: 664
    });
  });

  it("does not create negative zoom dimensions on tiny viewports", () => {
    expect(zoomedRect({ width: 20, height: 30 })).toEqual({
      left: 18,
      top: 18,
      width: 0,
      height: 0
    });
  });

  it("resizes right and bottom edges while keeping the opposite origin fixed", () => {
    expect(
      resizeRect(
        { left: 100, top: 100, width: 400, height: 300 },
        "bottom-right",
        { x: 80, y: 60 },
        { width: 900, height: 700 }
      )
    ).toEqual({ left: 100, top: 100, width: 480, height: 360 });
  });

  it("resizes left and top edges while keeping right and bottom anchors fixed", () => {
    expect(
      resizeRect(
        { left: 100, top: 100, width: 400, height: 300 },
        "top-left",
        { x: -70, y: -40 },
        { width: 900, height: 700 }
      )
    ).toEqual({ left: 30, top: 60, width: 470, height: 340 });
  });

  it("stops shrinking at its minimum while preserving the opposite anchor", () => {
    expect(
      resizeRect(
        { left: 100, top: 100, width: 400, height: 300 },
        "left",
        { x: 300, y: 0 },
        { width: 900, height: 700 },
        { width: 260, height: 180 }
      )
    ).toEqual({ left: 240, top: 100, width: 260, height: 300 });
  });

  it("keeps a resize within viewport margins even when the pointer crosses an edge", () => {
    expect(
      resizeRect(
        { left: 100, top: 100, width: 400, height: 300 },
        "top-left",
        { x: -300, y: -300 },
        { width: 800, height: 600 }
      )
    ).toEqual({ left: 12, top: 12, width: 488, height: 388 });
  });
});
