/**
 * A sideways flick of one finger across the text: left for what comes next, right for what came before.
 * It must be mostly level and quick, so scrolling the page and pressing to select words are never
 * taken for one.
 */
export const SWIPE_MIN_PX = 64;
export const SWIPE_MAX_MS = 700;
/** How many times longer than tall the movement must be. */
export const SWIPE_LEVEL = 2.2;
/** A touch that starts this near a screen edge is the browser's own back and forward gesture. */
export const SWIPE_EDGE_PX = 24;

export function swipeDirection(dx: number, dy: number, ms: number): "next" | "prev" | null {
  if (ms > SWIPE_MAX_MS) return null;
  if (Math.abs(dx) < SWIPE_MIN_PX) return null;
  if (Math.abs(dx) < Math.abs(dy) * SWIPE_LEVEL) return null;
  return dx < 0 ? "next" : "prev";
}
