import { describe, expect, it } from "vitest";
import { viewportInsets } from "./useViewportInsets";

const SCREEN = 800;

function insets({
  layoutHeight = SCREEN,
  viewportHeight = SCREEN,
  offsetTop = 0,
  scale = 1,
}: {
  layoutHeight?: number;
  viewportHeight?: number;
  offsetTop?: number;
  scale?: number;
}) {
  return viewportInsets({ layoutHeight, viewportHeight, offsetTop, scale });
}

describe("viewportInsets", () => {
  it("reports nothing covered while the whole screen is visible", () => {
    expect(insets({})).toEqual({
      height: SCREEN,
      offset: 0,
      keyboardInset: 0,
    });
  });

  it("measures the keyboard as the screen the visual viewport gave up", () => {
    // The keyboard takes the bottom 340px, which is what the sheet has to clear.
    expect(insets({ viewportHeight: 460 })).toEqual({
      height: 460,
      offset: 0,
      keyboardInset: 340,
    });
  });

  it("counts the screen above the visible area as covered too", () => {
    // iOS scrolls the page up to keep the focused input in view, so the visible
    // area starts below the top of the layout viewport.
    expect(insets({ viewportHeight: 460, offsetTop: 120 })).toEqual({
      height: 460,
      offset: 120,
      keyboardInset: 220,
    });
  });

  it("asks for no inset when the visible area runs past the layout viewport", () => {
    expect(insets({ viewportHeight: 820 }).keyboardInset).toBe(0);
  });

  it("leaves a zoomed page the way it found it", () => {
    // Pinching shrinks the visual viewport the way a keyboard does, and resizing
    // the dialog around a reader who zoomed in is not what they asked for.
    expect(insets({ viewportHeight: 300, offsetTop: 200, scale: 2 })).toEqual({
      height: SCREEN,
      offset: 0,
      keyboardInset: 0,
    });
  });
});
