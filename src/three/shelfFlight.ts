import * as THREE from "three";
import { buildCodex } from "./codex";
import { buildRoll } from "./roll";
import { createStage, type Stage } from "./stage";

/**
 * One 3D book that leaves the shelf and opens in the book viewer, drawn on a transparent layer over
 * the whole window. The scene is measured in CSS pixels at depth 0, so a spine's place on the page is
 * a place in the scene: the model stands exactly where the spine stands.
 *
 * The model takes over from the flat spine without a change: its spine is a picture of the page's
 * spine, shown unlit, and the book starts paper-thin. As it moves, light and depth come in.
 *
 * One continuous motion, `lift` from 0 to 1, runs while the reader keeps pointing: the top tips toward
 * them, the book slides out and turns to show its cover. Letting go runs it backwards into the shelf.
 * At 1 it leaves the shelf, flies into the viewer, lies down and opens.
 */

export type BookSpec = {
  key: string;
  title: string;
  author: string;
  cover: string;
  surface: "papyrus" | "parchment";
  /** A bound book, or a letter roll. */
  form: "codex" | "roll";
  paras: () => Promise<string[]>;
};

/**
 * What the flight needs to know about the object it carries, whichever it is: how it stands on the
 * shelf, where it pivots, how it is scaled, and how it lies open in the viewer.
 */
type Carry = {
  obj: THREE.Object3D;
  rig: THREE.Object3D;
  height: number; // standing height, in its own units
  width: number; // width of its face toward the reader on the shelf
  stand: THREE.Quaternion;
  pivot: (k: number) => THREE.Vector3; // bottom front edge, where it tips
  scale: (s: number, k: number, d: number) => THREE.Vector3;
  lie: THREE.Quaternion;
  centre: THREE.Vector3;
  fitW: number;
  fitH: number;
  turnTo: number; // how far it turns to the reader while being pulled out
  tipBy: number; // how much its top tips forward when first pointed at
  pullOut: (s: number) => number; // how far it comes out toward the reader, in pixels
  setLit: (t: number) => void;
  setScale: (s: number) => void;
  setGrounded: (on: boolean) => void;
  open: () => void;
  turn: (dir: 1 | -1) => void;
  dispose: () => void;
  /** Compile its shaders before it first moves (see CodexHandle.prewarm). */
  prewarm: () => Promise<void>;
};

type Phase = "loading" | "shelf" | "flying" | "open";

const ELEVATION = 0.9; // the viewer looks down on the open book at this angle, as ManuscriptStage does
const TIP = 0.26; // radians the top comes forward
const LIFT_TIME = 1.25; // seconds of pointing to take a book off the shelf
const QUICK_TIME = 0.5; // the same on a click
const BACK_TIME = 0.42; // putting it back
const FLY_TIME = 0.95;

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smooth = (t: number) => t * t * (3 - 2 * t);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Local book axes to the scene: spine (-X) faces the reader, head (-Z) points up, cover (+Y) faces right. */
const STAND = new THREE.Quaternion().setFromRotationMatrix(
  new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, -1), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, -1, 0))
);
const LIE = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), ELEVATION);
const X = new THREE.Vector3(1, 0, 0);
const Y = new THREE.Vector3(0, 1, 0);

/**
 * s: pixels to a unit. k: thickness drawn against true, so on the shelf it fills its spine's width.
 * d: depth drawn against true (paper-thin at rest, like the flat spine). lit: 0 unlit picture, 1 leather.
 */
type Pose = { p: THREE.Vector3; q: THREE.Quaternion; s: number; k: number; d: number; lit: number };

/** The flat spine's leather colour, with its per-book shade, as a CSS colour for the 3D boards. */
function spineColour(box: HTMLElement): string | undefined {
  const face = box.querySelector<HTMLElement>(".lib-face-spine");
  if (!face) return undefined;
  const m = getComputedStyle(face).backgroundColor.match(/[\d.]+/g);
  if (!m) return undefined;
  const tone = parseFloat(getComputedStyle(box.closest(".lib-book") ?? box).getPropertyValue("--tone")) || 1;
  const [r, g, b] = m.slice(0, 3).map((v) => Math.min(255, Math.round(Number(v) * tone)));
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * A roll standing on the shelf, seen from the front: papyrus rounded by the light, the edge of its
 * outer turn, and a cord round it. The same drawing as the CSS of .lib-roll-body, so the 3D roll takes
 * over unseen. (The knobs are drawn outside the body on the page, and by the 3D roll itself.)
 */
function paintRollBody(el: HTMLElement): HTMLCanvasElement | undefined {
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return undefined;
  const sc = Math.min(3, (window.devicePixelRatio || 1) * 1.5);
  const W = r.width;
  const H = r.height;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(W * sc);
  canvas.height = Math.round(H * sc);
  const ctx = canvas.getContext("2d")!;
  ctx.scale(sc, sc);
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 3);
  ctx.clip();
  ctx.fillStyle = "#c9ad78";
  ctx.fillRect(0, 0, W, H);
  const round = ctx.createLinearGradient(0, 0, W, 0);
  round.addColorStop(0, "rgba(70,42,12,0.5)");
  round.addColorStop(0.22, "rgba(255,248,225,0.38)");
  round.addColorStop(0.48, "rgba(255,248,225,0.06)");
  round.addColorStop(0.78, "rgba(70,42,12,0.18)");
  round.addColorStop(1, "rgba(70,42,12,0.6)");
  ctx.fillStyle = round;
  ctx.fillRect(0, 0, W, H);
  // The edge of the outer turn of the sheet, running down the roll.
  ctx.fillStyle = "rgba(70,42,12,0.32)";
  ctx.fillRect(Math.round(W * 0.7), 0, 1, H);
  // The cord, a third of the way down.
  ctx.fillStyle = "#7d2a12";
  ctx.fillRect(0, Math.round(H * 0.3), W, 3);
  return canvas;
}

/** A picture of the page's spine, part by part: leather, light, bands, mark, title and century. */
function paintSpine(box: HTMLElement): HTMLCanvasElement | undefined {
  if (box.classList.contains("lib-roll-body")) return paintRollBody(box);
  const face = box.querySelector<HTMLElement>(".lib-face-spine");
  if (!face) return undefined;
  const fr = face.getBoundingClientRect();
  if (fr.width < 2 || fr.height < 2) return undefined;
  const sc = Math.min(3, (window.devicePixelRatio || 1) * 1.5);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(fr.width * sc);
  canvas.height = Math.round(fr.height * sc);
  const ctx = canvas.getContext("2d")!;
  ctx.scale(sc, sc);
  const rel = (el: Element) => {
    const r = el.getBoundingClientRect();
    return { x: r.left - fr.left, y: r.top - fr.top, w: r.width, h: r.height };
  };
  const W = fr.width;
  const H = fr.height;
  const roll = Boolean(box.closest(".lib-book--roll"));
  // A soft-covered codex: plain leather, a tie round it, the title without a gilt label.
  const plain = roll || Boolean(box.closest(".lib-book--limp"));
  const tone = parseFloat(getComputedStyle(box.closest(".lib-book") ?? box).getPropertyValue("--tone")) || 1;
  ctx.filter = `brightness(${tone})`;

  ctx.fillStyle = getComputedStyle(face).backgroundColor;
  ctx.fillRect(0, 0, W, H);
  const round = ctx.createLinearGradient(0, 0, W, 0);
  const stops: [number, string][] = roll
    ? [
        [0, "rgba(70,42,12,0.62)"],
        [0.13, "rgba(70,42,12,0.16)"],
        [0.34, "rgba(255,248,225,0.42)"],
        [0.55, "rgba(255,248,225,0.08)"],
        [0.78, "rgba(70,42,12,0.18)"],
        [1, "rgba(70,42,12,0.66)"]
      ]
    : [
        [0, "rgba(0,0,0,0.5)"],
        [0.09, "rgba(0,0,0,0.08)"],
        [0.26, "rgba(255,255,255,0.22)"],
        [0.44, "rgba(255,255,255,0.06)"],
        [0.7, "rgba(0,0,0,0.08)"],
        [1, "rgba(0,0,0,0.52)"]
      ];
  for (const [at, c] of stops) round.addColorStop(at, c);
  ctx.fillStyle = round;
  ctx.fillRect(0, 0, W, H);
  if (roll) {
    // The rolled-over edges at head and foot.
    const edge = ctx.createLinearGradient(0, 0, 0, H);
    edge.addColorStop(0, "rgba(90,58,20,0.35)");
    edge.addColorStop(0.05, "rgba(90,58,20,0)");
    edge.addColorStop(0.95, "rgba(90,58,20,0)");
    edge.addColorStop(1, "rgba(90,58,20,0.35)");
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, W, H);
  }

  for (const band of face.querySelectorAll(".lib-spine-band")) {
    const b = rel(band);
    if (b.w < 1 || b.h < 1) continue;
    if (plain) {
      ctx.fillStyle = getComputedStyle(band).backgroundColor; // the cord or the tie
      ctx.fillRect(b.x, b.y, b.w, b.h);
      continue;
    }
    const g = ctx.createLinearGradient(0, b.y, 0, b.y + b.h);
    g.addColorStop(0, "rgba(255,255,255,0.24)");
    g.addColorStop(0.45, "rgba(0,0,0,0.04)");
    g.addColorStop(1, "rgba(0,0,0,0.38)");
    ctx.fillStyle = g;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = "rgba(232,212,154,0.35)";
    ctx.fillRect(b.x, b.y - 1, b.w, 1);
    ctx.fillRect(b.x, b.y + b.h, b.w, 1);
  }

  const mark = face.querySelector<HTMLImageElement>("img.lib-spine-mark");
  if (mark?.complete && mark.naturalWidth) {
    const m = rel(mark);
    ctx.drawImage(mark, m.x, m.y, m.w, m.h);
  }

  const title = face.querySelector<HTMLElement>(".lib-spine-title");
  if (title) {
    const t = rel(title);
    const cs = getComputedStyle(title);
    if (!plain) {
      const label = ctx.createLinearGradient(t.x, 0, t.x + t.w, 0);
      label.addColorStop(0, "rgba(0,0,0,0)");
      label.addColorStop(0.3, "rgba(0,0,0,0.16)");
      label.addColorStop(0.7, "rgba(0,0,0,0.16)");
      label.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = label;
      ctx.fillRect(t.x, t.y, t.w, t.h);
      ctx.fillStyle = "rgba(232,212,154,0.5)";
      ctx.fillRect(t.x, t.y, t.w, 1);
      ctx.fillRect(t.x, t.y + t.h - 1, t.w, 1);
    }

    // The title runs down the spine (vertical-rl): lines are columns, the first on the right.
    ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing =
      cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
    const size = parseFloat(cs.fontSize);
    const lh = parseFloat(cs.lineHeight) || size * 1.1;
    const padTop = parseFloat(cs.paddingTop) || 0;
    const room = t.h - padTop - (parseFloat(cs.paddingBottom) || 0);
    const words = (title.textContent ?? "").split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const next = line ? line + " " + w : w;
      if (ctx.measureText(next).width <= room || !line) line = next;
      else {
        lines.push(line);
        line = w;
      }
    }
    if (line) lines.push(line);
    ctx.fillStyle = cs.color;
    ctx.shadowColor = roll ? "transparent" : "rgba(0,0,0,0.4)";
    ctx.shadowOffsetY = 1 * sc;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    const cx = t.x + t.w / 2;
    const cy = t.y + padTop + room / 2;
    lines.forEach((l, i) => {
      ctx.save();
      ctx.translate(cx + ((lines.length - 1) / 2 - i) * lh, cy);
      ctx.rotate(Math.PI / 2);
      ctx.fillText(l, 0, 0);
      ctx.restore();
    });
    ctx.shadowColor = "transparent";
  }

  const century = face.querySelector<HTMLElement>(".lib-spine-century");
  if (century) {
    const c = rel(century);
    const cs = getComputedStyle(century);
    ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    ctx.fillStyle = cs.color;
    ctx.globalAlpha = parseFloat(cs.opacity) || 1;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(century.textContent ?? "", c.x + c.w / 2, c.y + c.h / 2);
    ctx.globalAlpha = 1;
  }
  return canvas;
}

export type ShelfFlight = {
  /** Pointing at a book: the model takes its place and the motion runs while pointing continues. */
  hover: (spec: BookSpec, spine: HTMLElement, dest: () => HTMLElement | null, onLeaveShelf: () => void) => void;
  /** Letting go: the motion runs backwards and the book goes back in the shelf. */
  unhover: (key: string) => void;
  /** A click: the same motion, quicker, to the end. */
  take: (
    spec: BookSpec,
    spine: HTMLElement,
    dest: () => HTMLElement | null,
    quick: boolean,
    onLeaveShelf: () => void
  ) => void;
  turn: (dir: 1 | -1) => void;
  /** The viewer closed: the book goes, and its spine is back on the shelf. */
  close: () => void;
  dispose: () => void;
};

type Book = {
  spec: BookSpec;
  spine: HTMLElement;
  handle: Carry | null;
  phase: Phase;
  lift: number;
  target: 0 | 1;
  speed: number; // seconds for the whole lift
  fly: number;
  from: Pose | null;
  dest: (() => HTMLElement | null) | null;
  onLeave: (() => void) | null;
  opened: boolean;
  dead: boolean;
  ready: Promise<void>;
};

export function createShelfFlight(): ShelfFlight {
  const host = document.createElement("div");
  host.className = "shelf-3d";
  host.setAttribute("aria-hidden", "true");
  document.body.appendChild(host);
  const stage: Stage = createStage(host, { fov: 30, near: 1, far: 40000, maxPixelRatio: 1.5 });
  // Colours exactly as on the page (no film curve), and fewer pixels: this layer covers the window.
  stage.renderer.toneMapping = THREE.NoToneMapping;

  // Put the camera where the plane z = 0 is exactly the window, one unit to a CSS pixel.
  const stopResize = stage.onResize((_w, h) => {
    const cam = stage.camera;
    cam.position.set(0, 0, h / 2 / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)));
    cam.lookAt(0, 0, 0);
    // The book never comes nearer than about two thirds of the way to the camera. A near plane at a
    // quarter of the distance, not 1 px, keeps the depth buffer fine enough for surfaces a fraction of a
    // pixel apart (the pastedown on its board), which otherwise flicker through each other.
    cam.near = cam.position.z * 0.25;
    cam.far = cam.position.z * 6;
    cam.updateProjectionMatrix();
  });
  const toWorld = (x: number, y: number) => new THREE.Vector3(x - window.innerWidth / 2, window.innerHeight / 2 - y, 0);

  let cur: Book | null = null;

  /** The book on the shelf at `lift`: standing in its spine's place, tipped, slid out and turned. */
  function shelfPose(c: Book, lift: number): Pose {
    const h = c.handle!;
    const r = c.spine.getBoundingClientRect();
    const s = r.height / h.height;
    const k = Math.max(0.4, Math.min(2.4, r.width / (h.width * s)));
    const tip = easeInOut(clamp01(lift / 0.4));
    const pull = easeInOut(clamp01((lift - 0.18) / 0.82));
    const q = new THREE.Quaternion()
      .setFromAxisAngle(Y, -h.turnTo * pull)
      .multiply(new THREE.Quaternion().setFromAxisAngle(X, TIP * h.tipBy * tip * (1 - 0.45 * pull)))
      .multiply(h.stand);
    // It pivots on the bottom edge of its face, then comes out of the shelf toward the reader.
    const pivot = h.pivot(k);
    const anchor = toWorld(r.left + r.width / 2, r.bottom).add(
      new THREE.Vector3(0, r.height * 0.06 * pull * h.tipBy, h.pullOut(s) * pull)
    );
    return {
      p: anchor.sub(pivot.applyQuaternion(q.clone()).multiplyScalar(s)),
      q,
      s,
      k,
      d: 0.02 + 0.98 * smooth(clamp01(lift / 0.28)),
      lit: smooth(clamp01(lift / 0.32))
    };
  }

  /** Lying open in the viewer's stage, seen from above at the viewer's angle. */
  function openPose(c: Book, el: HTMLElement): Pose {
    const h = c.handle!;
    const r = el.getBoundingClientRect();
    const s = Math.min((r.width * 0.9) / h.fitW, (r.height * 0.84) / h.fitH);
    const p = toWorld(r.left + r.width / 2, r.top + r.height / 2).sub(
      h.centre.clone().applyQuaternion(h.lie).multiplyScalar(s)
    );
    return { p, q: h.lie.clone(), s, k: 1, d: 1, lit: 1 };
  }

  function apply(c: Book, pose: Pose) {
    const h = c.handle!;
    h.obj.position.copy(pose.p);
    h.obj.quaternion.copy(pose.q);
    h.obj.scale.copy(h.scale(pose.s, pose.k, pose.d));
    // The lamps travel with the book, scaled with it but not turned with it.
    h.rig.position.copy(pose.p);
    h.rig.scale.setScalar(pose.s);
    h.setScale(pose.s);
    h.setLit(pose.lit);
  }

  stage.onFrame((dt) => {
    const c = cur;
    if (!c || !c.handle || c.dead) return false;
    if (c.phase === "shelf") {
      const step = dt / (c.target ? c.speed : BACK_TIME);
      c.lift = c.target ? Math.min(1, c.lift + step) : Math.max(0, c.lift - step);
      if (c.lift === 0 && !c.target) {
        drop(); // back in the shelf: the flat spine takes over again
        return false;
      }
      if (c.lift === 1 && c.target && c.dest && c.onLeave) {
        c.phase = "flying";
        c.from = shelfPose(c, 1);
        c.onLeave();
      } else {
        apply(c, shelfPose(c, c.lift));
        return c.lift !== c.target;
      }
    }
    if (c.phase === "flying") {
      const el = c.dest?.();
      if (el) {
        c.fly = Math.min(1, c.fly + dt / FLY_TIME);
        const to = openPose(c, el);
        const u = easeInOut(c.fly);
        const p = c.from!.p.clone().lerp(to.p, u);
        p.z += Math.sin(Math.PI * u) * 160; // the book rises toward the reader as it travels
        apply(c, {
          p,
          q: c.from!.q.clone().slerp(to.q, u),
          s: c.from!.s + (to.s - c.from!.s) * u,
          k: c.from!.k + (1 - c.from!.k) * u,
          d: 1,
          lit: 1
        });
        if (c.fly > 0.72 && !c.opened) {
          c.opened = true;
          c.handle.open();
        }
        if (c.fly >= 1) {
          c.phase = "open";
          c.handle.setGrounded(true);
        }
      }
      return true;
    }
    if (c.phase === "open") {
      const el = c.dest?.();
      if (el) apply(c, openPose(c, el));
    }
    return false;
  });

  const redraw = () => cur && stage.invalidate();
  window.addEventListener("scroll", redraw, { passive: true });
  window.addEventListener("resize", redraw);

  function drop() {
    if (!cur) return;
    cur.dead = true;
    cur.spine.classList.remove("is-carried");
    if (cur.handle) {
      cur.handle.dispose();
      stage.scene.remove(cur.handle.obj, cur.handle.rig);
      cur.handle.obj.traverse((o) => (o as THREE.Mesh).geometry?.dispose?.());
    }
    cur = null;
    stage.invalidate();
  }

  /** Build the 3D object for a book or a roll, and describe it for the flight. */
  async function carry(spec: BookSpec, spine: HTMLElement, paras: string[]): Promise<Carry> {
    const art = paintSpine(spine);
    if (spec.form === "roll") {
      const r = await buildRoll(stage, { title: spec.title, paras, external: true, spineArt: art });
      const R = r.dims.radius;
      const Hr = r.dims.height;
      return {
        obj: r.group,
        rig: r.rig,
        // Standing on the shelf as it stands open: its height up, its girth toward the reader.
        height: Hr,
        width: 2 * R,
        stand: new THREE.Quaternion(),
        // The foot of its front, where it tips.
        pivot: () => new THREE.Vector3(0, -Hr / 2, 0),
        // Its girth is drawn to the roll's width on the page.
        scale: (s, k) => new THREE.Vector3(s * k, s, s * k),
        // Open, it is held up to the reader, tipped back a little.
        lie: new THREE.Quaternion().setFromAxisAngle(X, 0.1),
        centre: new THREE.Vector3(0, 0, -R * 0.5),
        fitW: r.dims.openWidth + 2 * r.dims.maxRadius + 0.1,
        fitH: r.dims.height + 0.12,
        turnTo: 0,
        tipBy: 0.7,
        // It comes off the shelf toward the reader.
        pullOut: (s) => s * Hr * 0.3,
        setLit: r.setLit,
        setScale: () => {},
        setGrounded: () => {},
        open: r.openRoll,
        turn: (dir) => r.move(dir * 0.12),
        dispose: r.dispose,
        prewarm: () => stage.renderer.compileAsync(stage.scene, stage.camera).then(() => {})
      };
    }
    const b = await buildCodex(stage, {
      title: spec.title,
      author: spec.author,
      paras,
      surface: spec.surface,
      cover: spineColour(spine) ?? spec.cover,
      holdCover: true,
      external: true,
      spineArt: art
    });
    const d = b.dims;
    return {
      obj: b.book,
      rig: b.rig,
      height: d.boardD,
      width: d.closed + 2 * d.C,
      stand: STAND,
      pivot: (k) => new THREE.Vector3(0, (d.closed / 2) * k, d.boardD / 2),
      // Depth is the book x axis, thickness its y: paper-thin and spine-wide on the shelf, true when open.
      scale: (s, k, dd) => new THREE.Vector3(s * dd, s * k, s),
      lie: LIE,
      // A soft cover's flap lies out to the right when open: the open book is centred with it.
      centre: new THREE.Vector3(d.flapReach / 2, d.closed / 2, 0),
      fitW: 2 * d.boardW + d.flapReach,
      fitH: d.boardD * Math.sin(ELEVATION) + 0.3,
      turnTo: 0.55,
      tipBy: 1,
      pullOut: (s) => s * d.boardD * 0.75,
      setLit: b.setLit,
      setScale: b.setScale,
      setGrounded: b.setGrounded,
      open: b.openCover,
      turn: b.turn,
      dispose: b.dispose,
      prewarm: b.prewarm
    };
  }

  async function ensure(spec: BookSpec, spine: HTMLElement): Promise<Book> {
    if (cur && cur.spec.key === spec.key && !cur.dead) {
      const c = cur;
      await c.ready;
      return c;
    }
    drop();
    const c: Book = {
      spec,
      spine,
      handle: null,
      phase: "loading",
      lift: 0,
      target: 1,
      speed: LIFT_TIME,
      fly: 0,
      from: null,
      dest: null,
      onLeave: null,
      opened: false,
      dead: false,
      ready: Promise.resolve()
    };
    cur = c;
    let settle = () => {};
    c.ready = new Promise<void>((r) => (settle = r));
    try {
      const paras = await spec.paras();
      if (!c.dead && paras.length) {
        const handle = await carry(spec, spine, paras);
        // The flat spine stays on show meanwhile, so the wait costs a moment, never a frozen frame.
        // Hidden until placed: compile() still covers hidden parts, and nothing is drawn at the origin.
        handle.obj.visible = false;
        await handle.prewarm().catch(() => {});
        handle.obj.visible = true;
        if (c.dead) {
          handle.dispose();
          stage.scene.remove(handle.obj, handle.rig);
        } else {
          c.handle = handle;
          c.phase = "shelf";
          apply(c, shelfPose(c, 0));
          stage.invalidate();
          // Swap only once the model has been drawn in place, so the flat spine never blinks.
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              if (c.dead) return;
              c.spine.classList.add("is-carried");
              stage.invalidate();
            })
          );
        }
      }
    } finally {
      settle();
    }
    return c;
  }

  function start(
    spec: BookSpec,
    spine: HTMLElement,
    dest: () => HTMLElement | null,
    onLeave: () => void,
    speed: number
  ) {
    void ensure(spec, spine).then((c) => {
      if (c.dead || !c.handle) {
        if (speed === QUICK_TIME) onLeave(); // a click still opens the book, without the flight
        return;
      }
      c.target = 1;
      c.dest = dest;
      c.onLeave = onLeave;
      c.speed = Math.min(c.speed, speed);
      stage.invalidate();
    });
  }

  return {
    hover(spec, spine, dest, onLeave) {
      start(spec, spine, dest, onLeave, LIFT_TIME);
    },
    unhover(key) {
      const c = cur;
      if (!c || c.spec.key !== key) return;
      if (c.phase === "loading") drop();
      else if (c.phase === "shelf") {
        c.target = 0;
        c.speed = LIFT_TIME;
        stage.invalidate();
      }
    },
    take(spec, spine, dest, quick, onLeave) {
      start(spec, spine, dest, onLeave, quick ? QUICK_TIME : LIFT_TIME);
    },
    turn(dir) {
      if (cur?.phase === "open") cur.handle?.turn(dir);
    },
    close() {
      drop();
    },
    dispose() {
      drop();
      stopResize();
      window.removeEventListener("scroll", redraw);
      window.removeEventListener("resize", redraw);
      stage.dispose();
      host.remove();
    }
  };
}
