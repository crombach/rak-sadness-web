import { useEffect } from "react";

/** The height actually on screen, which `dvh` does not shrink to. */
export const VIEWPORT_HEIGHT_VAR = "--rak-viewport-height";

/** How far down the layout viewport the visible area starts. */
export const VIEWPORT_OFFSET_VAR = "--rak-viewport-offset";

/** How much of the bottom edge something like a keyboard covers. */
export const KEYBOARD_INSET_VAR = "--rak-keyboard-inset";

/**
 * What is on screen, out of what the layout is sized against.
 *
 * A virtual keyboard shrinks the visual viewport and leaves the layout viewport
 * alone, so `dvh` still measures the whole screen and anything sized in it runs
 * on under the keyboard. This is the difference, for the stylesheet to subtract.
 *
 * Pinching zooms the visual viewport the same way a keyboard shrinks it, and a
 * reader who zoomed in did not ask for the dialog to be resized around them, so
 * a zoomed page reports the layout viewport back unchanged.
 */
export function viewportInsets({
  layoutHeight,
  viewportHeight,
  offsetTop,
  scale,
}: {
  layoutHeight: number;
  viewportHeight: number;
  offsetTop: number;
  scale: number;
}): { height: number; offset: number; keyboardInset: number } {
  if (scale > 1) {
    return { height: layoutHeight, offset: 0, keyboardInset: 0 };
  }
  return {
    height: viewportHeight,
    offset: offsetTop,
    keyboardInset: Math.max(layoutHeight - viewportHeight - offsetTop, 0),
  };
}

/**
 * Publishes the visible viewport to the document root, so a stylesheet can size
 * against what the reader can actually see rather than the whole screen.
 *
 * Held to while `enabled`, since the only thing that asks is a dialog with a
 * search in it, and the properties are dropped on the way out so everything
 * falls back to its `dvh` default.
 */
export default function useViewportInsets(enabled: boolean): void {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!enabled || viewport == null) return;

    const root = document.documentElement;

    const measure = () => {
      const { height, offset, keyboardInset } = viewportInsets({
        layoutHeight: window.innerHeight,
        viewportHeight: viewport.height,
        offsetTop: viewport.offsetTop,
        scale: viewport.scale,
      });
      root.style.setProperty(VIEWPORT_HEIGHT_VAR, `${height}px`);
      root.style.setProperty(VIEWPORT_OFFSET_VAR, `${offset}px`);
      root.style.setProperty(KEYBOARD_INSET_VAR, `${keyboardInset}px`);
    };

    measure();
    viewport.addEventListener("resize", measure);
    viewport.addEventListener("scroll", measure);
    return () => {
      viewport.removeEventListener("resize", measure);
      viewport.removeEventListener("scroll", measure);
      root.style.removeProperty(VIEWPORT_HEIGHT_VAR);
      root.style.removeProperty(VIEWPORT_OFFSET_VAR);
      root.style.removeProperty(KEYBOARD_INSET_VAR);
    };
  }, [enabled]);
}
