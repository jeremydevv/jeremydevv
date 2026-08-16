import { describe, expect, it } from "vitest";

import { placeRect, zoomedRect } from "./terminal-geometry";

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

  it("keeps an oversized window anchored to the viewport margin", () => {
    expect(
      placeRect(
        { left: 500, top: 500, width: 900, height: 700 },
        { width: 800, height: 600 },
        12
      )
    ).toEqual({ left: 12, top: 12, width: 900, height: 700 });
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
});
