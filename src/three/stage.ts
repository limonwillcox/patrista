import * as THREE from "three";
import { prefersReducedMotion, webglAvailable } from "./support";

export { prefersReducedMotion, webglAvailable };

/** A frame step. Return true to ask for another frame (an animation still running). */
export type FrameFn = (dt: number, t: number) => boolean | void;

export type Stage = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  canvas: HTMLCanvasElement;
  size: () => { w: number; h: number };
  /** Draw one more frame (and keep drawing while any frame step asks to). */
  invalidate: () => void;
  onFrame: (fn: FrameFn) => () => void;
  onResize: (fn: (w: number, h: number) => void) => () => void;
  /** Measure the host now, not at the next ResizeObserver callback (after moving it, before drawing). */
  measure: () => void;
  dispose: () => void;
};

/**
 * One WebGL view inside `host`. It draws only when something changed (invalidate) or an animation is
 * running, so an idle page costs nothing.
 */
export function createStage(
  host: HTMLElement,
  opts: { fov?: number; near?: number; far?: number; /** Cap on device pixels per CSS pixel. */ maxPixelRatio?: number } = {}
): Stage {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.maxPixelRatio ?? 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const canvas = renderer.domElement;
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.touchAction = "none";
  host.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(opts.fov ?? 35, 1, opts.near ?? 0.05, opts.far ?? 100);
  const frames = new Set<FrameFn>();
  const resizers = new Set<(w: number, h: number) => void>();
  let raf = 0;
  let last = 0;
  let w = 1;
  let h = 1;
  let sized = false;
  let disposed = false;

  function tick(now: number) {
    raf = 0;
    if (disposed) return;
    // Slow devices draw few frames; let each frame cover real time so animations do not crawl. One long
    // frame (the page doing other work) counts as at most 1/20 s, so a stall pauses the motion for a
    // moment instead of making it jump ahead.
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    let more = false;
    frames.forEach((fn) => {
      if (fn(dt, now / 1000)) more = true;
    });
    renderer.render(scene, camera);
    // A frame step can call invalidate() while this frame runs (OrbitControls fires "change" from
    // update()), which already books the next frame. Book it only once: two bookings per frame
    // double every frame, and the scene ends up drawn dozens of times per screen refresh.
    if (more && !raf) raf = requestAnimationFrame(tick);
    else if (!more && !raf) last = 0;
  }

  function invalidate() {
    if (!raf && !disposed) raf = requestAnimationFrame(tick);
  }

  function resize() {
    const r = host.getBoundingClientRect();
    const nw = Math.max(1, Math.round(r.width));
    const nh = Math.max(1, Math.round(r.height));
    // Setting a canvas's size clears it, even to the same size: skip it when nothing changed.
    if (sized && nw === w && nh === h) return;
    sized = true;
    w = nw;
    h = nh;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    resizers.forEach((fn) => fn(w, h));
    invalidate();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  return {
    renderer,
    scene,
    camera,
    canvas,
    size: () => ({ w, h }),
    invalidate,
    onFrame(fn) {
      frames.add(fn);
      invalidate();
      return () => frames.delete(fn);
    },
    onResize(fn) {
      resizers.add(fn);
      fn(w, h);
      return () => resizers.delete(fn);
    },
    measure: resize,
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose?.();
        const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
        for (const m of mats) {
          for (const v of Object.values(m)) if (v instanceof THREE.Texture) v.dispose();
          m.dispose();
        }
      });
      renderer.dispose();
      canvas.remove();
    }
  };
}

/** Ease a value toward a target; returns the new value and whether it is still moving. */
export function approach(value: number, target: number, rate: number, dt: number): [number, boolean] {
  const next = value + (target - value) * (1 - Math.exp(-rate * dt));
  const done = Math.abs(target - next) < 1e-4;
  return [done ? target : next, !done];
}

export function canvasTexture(canvas: HTMLCanvasElement, renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return tex;
}

/**
 * Keep a box of `halfW` by `halfH` (as seen by the camera) in view at any panel shape. The camera looks
 * at `target` from `elevation` radians above the horizon.
 */
export function fitCamera(
  stage: Stage,
  opts: { halfW: number; halfH: number; elevation: number; target?: THREE.Vector3; margin?: number }
): () => void {
  const target = opts.target ?? new THREE.Vector3();
  return stage.onResize((w, h) => {
    const cam = stage.camera;
    const half = THREE.MathUtils.degToRad(cam.fov / 2);
    const aspect = w / h;
    const dist = Math.max(opts.halfW / (Math.tan(half) * aspect), opts.halfH / Math.tan(half)) * (opts.margin ?? 1.1);
    cam.position.set(target.x, target.y + dist * Math.sin(opts.elevation), target.z + dist * Math.cos(opts.elevation));
    cam.lookAt(target);
  });
}
