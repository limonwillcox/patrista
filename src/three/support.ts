/** Feature checks with no three.js import, so pages can ask before loading the 3D code. */

/** True when this browser can draw WebGL. Everything 3D falls back to the flat page when it cannot. */
let cached: boolean | null = null;

export function webglAvailable(): boolean {
  // Checked once: each test opens a WebGL context, and browsers cap how many may be open.
  if (cached != null) return cached;
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    cached = Boolean(gl);
    (gl as WebGLRenderingContext | null)?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    cached = false;
  }
  return cached;
}

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
