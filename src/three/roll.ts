import * as THREE from "three";
import { approach, canvasTexture, fitCamera, prefersReducedMotion, type Stage } from "./stage";
import { chunk, drawColumn, makeCanvas, paintPapyrus, readyFont, seedOf, wrapLines } from "./writing";

export type RollHandle = {
  move: (delta: number) => void;
  dispose: () => void;
  /** External mode: the roll (posed by the owner), its lamps, and its size in its own units. */
  group: THREE.Group;
  rig: THREE.Group;
  dims: { height: number; radius: number; openWidth: number; maxRadius: number };
  /** Untie it and let it open (it stays shut until then in external mode). */
  openRoll: () => void;
  /** 0: the picture of the flat roll from the page shows over it; 1: the papyrus itself, in lamplight. */
  setLit: (t: number) => void;
};

const H = 1.25; // sheet height in scene units
const PX_PER_UNIT = 820; // canvas pixels per scene unit
const COL_PX = 560;
const GUTTER_PX = 90;
const THICK = 0.018; // sheet thickness (exaggerated a little), for how fat the rolled ends get

/**
 * A papyrus letter roll. The middle lies open; the read part is rolled up on the left and the
 * unread part on the right. `pos` (0–1) is how far along the sheet the open window sits.
 */
export async function buildRoll(
  stage: Stage,
  opts: {
    title: string;
    paras: string[];
    /** External mode: the owner poses the roll and owns the camera; no pointer input of its own. */
    external?: boolean;
    /** A picture of the roll as it stands on the page, laid over the front while it takes over. */
    spineArt?: HTMLCanvasElement;
  }
): Promise<RollHandle> {
  const font = await readyFont();
  const seed = seedOf(opts.title);
  const style = { font, size: 30, lineHeight: 41 };
  const hPx = Math.round(H * PX_PER_UNIT);
  const linesPerCol = Math.floor((hPx - 150) / style.lineHeight);

  // Lay the text out in columns along one long sheet, as a scribe would.
  const [probe] = makeCanvas(8, 8);
  const lines = wrapLines(probe.getContext("2d")!, opts.paras, COL_PX, style);
  const maxW = Math.min(stage.renderer.capabilities.maxTextureSize, 8192);
  const maxCols = Math.max(2, Math.floor((maxW - GUTTER_PX) / (COL_PX + GUTTER_PX)));
  const cols = chunk(lines, linesPerCol).slice(0, maxCols);
  const sheetPx = GUTTER_PX * 2 + cols.length * (COL_PX + GUTTER_PX) + 260;
  const [canvas, ctx] = makeCanvas(sheetPx, hPx);
  paintPapyrus(ctx, sheetPx, hPx, seed);
  cols.forEach((col, i) => {
    drawColumn(ctx, col, GUTTER_PX * 1.5 + i * (COL_PX + GUTTER_PX), 70, style, seed + i, {
      width: COL_PX,
      initial: i === 0,
      heading: i === 0 ? opts.title : undefined
    });
  });
  const sheetTex = canvasTexture(canvas, stage.renderer);
  sheetTex.wrapS = THREE.ClampToEdgeWrapping;

  const [backC, backCtx] = makeCanvas(512, 512);
  paintPapyrus(backCtx, 512, 512, seed + 99);
  const backTex = canvasTexture(backC, stage.renderer);
  backTex.wrapS = backTex.wrapT = THREE.RepeatWrapping;

  const L = sheetPx / PX_PER_UNIT;
  const group = new THREE.Group();
  stage.scene.add(group);

  // The open stretch of sheet, gently bowed like real papyrus held in the hands.
  const panelGeo = new THREE.PlaneGeometry(1, H, 48, 1);
  const pos = panelGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    pos.setZ(i, -0.035 * (1 - (2 * x) ** 2));
  }
  pos.needsUpdate = true;
  panelGeo.computeVertexNormals();
  const panelMat = new THREE.MeshStandardMaterial({ map: sheetTex, roughness: 0.92, side: THREE.DoubleSide });
  const panel = new THREE.Mesh(panelGeo, panelMat);
  group.add(panel);

  // The rolled ends: the cut edge of the sheet, a little darker than its face, the turns only faintly
  // seen, so the end reads as papyrus and not as a spiral.
  const [capC, capCtx] = makeCanvas(256, 256);
  const capShade = capCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
  capShade.addColorStop(0, "#bfa06a");
  capShade.addColorStop(0.85, "#c9ab74");
  capShade.addColorStop(1, "#a88a56");
  capCtx.fillStyle = capShade;
  capCtx.fillRect(0, 0, 256, 256);
  capCtx.strokeStyle = "rgba(95,65,25,0.12)";
  capCtx.lineWidth = 1.2;
  for (let rr = 30; rr < 122; rr += 16) {
    capCtx.beginPath();
    capCtx.arc(128, 128, rr, 0, Math.PI * 2);
    capCtx.stroke();
  }
  const capTex = canvasTexture(capC, stage.renderer);
  const sideMat = new THREE.MeshStandardMaterial({ map: backTex, roughness: 0.95 });
  // Taken off the shelf, the shut roll is lit to the paler papyrus of its picture there.
  if (opts.external) sideMat.color.setScalar(1.22);
  const capMat = new THREE.MeshStandardMaterial({ map: capTex, roughness: 0.95 });
  const cylGeo = new THREE.CylinderGeometry(1, 1, H * 0.998, 56, 1, false);
  const left = new THREE.Mesh(cylGeo, [sideMat, capMat, capMat]);
  const right = new THREE.Mesh(cylGeo, [sideMat, capMat, capMat]);
  group.add(left, right);

  // The rod (umbilicus) the sheet is rolled on, glued to its last column, so it sits in the core of the
  // unread end. Only its turned knobs show, one above and one below.
  const knobGeo = new THREE.LatheGeometry(
    [
      [0.02, 0], [0.02, 0.012], [0.034, 0.02], [0.05, 0.042], [0.046, 0.06], [0.026, 0.074],
      [0.014, 0.08], [0.018, 0.088], [0.012, 0.098], [0.0005, 0.104]
    ].map(([x, y]) => new THREE.Vector2(x, y)),
    28
  );
  const knobMat = new THREE.MeshStandardMaterial({ color: "#6b3f1e", roughness: 0.45, metalness: 0.05 });
  const knobTop = new THREE.Mesh(knobGeo, knobMat);
  const knobFoot = new THREE.Mesh(knobGeo, knobMat);
  knobFoot.rotation.x = Math.PI;
  group.add(knobTop, knobFoot);

  // A cord that tied the roll shut; it lies by the right end once the roll is open.
  const cord = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.012, 8, 48),
    new THREE.MeshStandardMaterial({ color: "#7a3b1d", roughness: 0.8 })
  );
  cord.rotation.x = Math.PI / 2;
  group.add(cord);

  // Lighting: a warm lamp from the upper left, a cool fill, and a faint rim.
  const key = new THREE.DirectionalLight("#ffd9a8", 2.4);
  key.position.set(-2, 2.5, 3);
  const fill = new THREE.HemisphereLight("#cfd8ff", "#3a2412", 0.7);
  const rim = new THREE.DirectionalLight("#ffeacc", 0.6);
  rim.position.set(2, -1, -2);
  const rig = new THREE.Group();
  rig.add(key, key.target, fill, rim, rim.target);
  stage.scene.add(rig);
  if (opts.external) {
    // On the shelf the reader faces the roll: light it from the front, a little from the left.
    key.position.set(-1.6, 2.2, 3.4);
    // Lighter than in the reader's own roll view, to meet the flat roll on the shelf.
    fill.intensity = 1.25;
    key.intensity = 3.1;
  }

  const radius = (len: number) => Math.sqrt(0.035 ** 2 + (Math.max(0, len) * THICK) / Math.PI);
  const rr0 = radius(L);
  const reduced = prefersReducedMotion();
  const wOpen = Math.min(L * 0.92, 2.1);
  const WMAX = () => wOpen;
  let open = reduced ? 1 : 0; // 0 = tied shut, 1 = open window at full width
  let held = Boolean(opts.external) && !reduced;
  let at = 0;
  let target = 0;
  let tiltX = 0;
  let tiltY = 0;
  let aimX = 0;
  let aimY = 0;

  function layout() {
    const W = Math.max(0.0001, WMAX() * open);
    const start = at * Math.max(0, L - W);
    const rl = radius(start);
    const rr = radius(L - start - W);
    panel.scale.x = W;
    sheetTex.repeat.x = W / L;
    sheetTex.offset.x = start / L;
    left.scale.set(rl, 1, rl);
    left.position.set(-W / 2, 0, -rl);
    left.rotation.y = start / Math.max(rl, 0.01);
    right.scale.set(rr, 1, rr);
    right.position.set(W / 2, 0, -rr);
    right.rotation.y = -(L - start - W) / Math.max(rr, 0.01);
    backTex.repeat.set(1, 1);
    // The knobs are as wide against the roll as on the page: 35% of its girth.
    const kw = (rr0 * 0.35) / 0.05;
    knobTop.scale.set(kw, 1, kw);
    knobFoot.scale.set(kw, 1, kw);
    knobTop.position.set(W / 2, H / 2, -rr);
    knobFoot.position.set(W / 2, -H / 2, -rr);
    cord.scale.setScalar(rr + 0.015);
    cord.position.set(W / 2, H * 0.2, -rr); // a third of the way down, as on the shelf
    cord.visible = open < 0.15;
  }

  // Room for the open stretch plus both rolled ends.
  const stopFit = opts.external
    ? () => {}
    : fitCamera(stage, { halfW: wOpen / 2 + radius(L) + 0.06, halfH: H / 2 + 0.08, elevation: 0.12, margin: 1.08 });

  // The picture of the roll as it stands on the shelf on the page, wrapped round the front of the 3D
  // roll and mapped so that seen from the front it is exactly that picture. It fades as the papyrus and
  // the lamp come in.
  let veil: THREE.Mesh | null = null;
  if (opts.spineArt) {
    const geo = new THREE.CylinderGeometry(1, 1, H, 48, 1, true, -Math.PI / 2, Math.PI);
    const p = geo.attributes.position as THREE.BufferAttribute;
    const uv = geo.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) uv.setX(i, (p.getX(i) + 1) / 2);
    uv.needsUpdate = true;
    veil = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: canvasTexture(opts.spineArt, stage.renderer), transparent: true, toneMapped: false }));
    veil.position.set(0, 0, -rr0);
    veil.scale.set(rr0 * 1.01, 1, rr0 * 1.01);
    group.add(veil);
  }

  const stopFrame = stage.onFrame((dt) => {
    let moving = false;
    let m: boolean;
    if (!reduced && !held) {
      [open, m] = approach(open, 1, 2.2, dt);
      moving ||= m;
    }
    [at, m] = approach(at, target, 7, dt);
    moving ||= m;
    [tiltX, m] = approach(tiltX, aimX, 4, dt);
    moving ||= m;
    [tiltY, m] = approach(tiltY, aimY, 4, dt);
    moving ||= m;
    if (!opts.external) group.rotation.set(-0.12 + tiltY, tiltX, 0);
    layout();
    return moving;
  });

  // Drag sideways or use the wheel to move along the roll; the pointer tilts it a little.
  const el = stage.canvas;
  let dragX: number | null = null;
  const onDown = (e: PointerEvent) => {
    dragX = e.clientX;
    el.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    aimX = ((e.clientX - r.left) / r.width - 0.5) * 0.35;
    aimY = ((e.clientY - r.top) / r.height - 0.5) * 0.2;
    if (dragX != null) {
      move(-(e.clientX - dragX) / r.width / Math.max(1, L / WMAX()));
      dragX = e.clientX;
    }
    stage.invalidate();
  };
  const onUp = () => {
    dragX = null;
  };
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    move((e.deltaY + e.deltaX) / 1800);
  };
  if (!opts.external) {
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });
  }

  function move(delta: number) {
    target = Math.min(1, Math.max(0, target + delta));
    stage.invalidate();
  }

  layout();
  stage.invalidate();
  return {
    move,
    group,
    rig,
    dims: { height: H, radius: rr0, openWidth: wOpen, maxRadius: rr0 },
    openRoll() {
      held = false;
      stage.invalidate();
    },
    setLit(t: number) {
      if (!veil) return;
      (veil.material as THREE.MeshBasicMaterial).opacity = 1 - t;
      veil.visible = t < 0.999;
    },
    dispose() {
      stopFrame();
      stopFit();
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("wheel", onWheel);
    }
  };
}
