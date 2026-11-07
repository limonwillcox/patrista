import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  ARK,
  BARS,
  BOARD,
  BRASEN_ALTAR,
  COURT,
  GOATS_HAIR,
  INCENSE_ALTAR,
  LAMPSTAND,
  LAVER,
  MERCY_SEAT,
  OVERVIEW,
  PATH,
  PLACE,
  PRIEST_START,
  TABLE,
  TENT,
  type PieceId
} from "../data/tabernacle";
import { approach, canvasTexture, prefersReducedMotion, type Stage } from "./stage";
import { makeCanvas } from "./writing";

/*
 * The tabernacle in cubits (one unit = one cubit), built from src/data/tabernacle.ts. x runs east, y up,
 * z south. Plain colours and boxes, a few instanced meshes for the many boards, sockets and pillars, so a
 * phone draws it without strain. No shadows: they cost more than they add from above.
 */

export type TabernacleHandle = {
  /** Fly to a step of the priest's path (index into PATH), or the whole court (-1). The priest walks there. */
  view(step: number): void;
  select(id: PieceId | null): void;
  /** Lift the four coverings off the tent, to see inside. */
  setLifted(on: boolean): void;
  dispose(): void;
};

const COLOR = {
  gold: "#d2a93e",
  brass: "#b5803f",
  silver: "#c8ccd2",
  linen: "#efe8d8",
  goatsHair: "#3c3631",
  ramsRed: "#8c2a1f",
  badger: "#6b6459",
  sand: "#d8c6a0",
  court: "#e4d6b4",
  wood: "#8a6a45",
  blue: "#2c4c9a",
  skin: "#c79a74",
  flame: "#ffb347",
  water: "#7fa6b8",
  mark: "#ff7a3d"
};

/** Bands of blue, purple, scarlet and linen, one cubit each: the needlework hangings and the inner curtains. */
function needlework(stage: Stage): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(64, 4);
  ["#2c4c9a", "#6a2f78", "#b2281f", "#efe8d8"].forEach((col, i) => {
    ctx.fillStyle = col;
    ctx.fillRect(i * 16, 0, 16, 4);
  });
  const tex = canvasTexture(c, stage.renderer);
  tex.wrapS = THREE.RepeatWrapping;
  tex.magFilter = THREE.NearestFilter;
  return tex;
}

export function buildTabernacle(stage: Stage, opts: { onPick: (id: PieceId | null) => void }): TabernacleHandle {
  const reduced = prefersReducedMotion();
  const { scene, camera } = stage;
  camera.fov = 40;
  camera.near = 0.1;
  camera.far = 1200;
  camera.updateProjectionMatrix();

  scene.add(new THREE.HemisphereLight("#fff6e6", "#8a7350", 1.5));
  const sun = new THREE.DirectionalLight("#fff1d6", 2.1);
  sun.position.set(40, 80, 30);
  scene.add(sun);

  // One unit box and one unit cylinder, scaled per piece: fewer buffers to send to the GPU.
  const BOX = new THREE.BoxGeometry(1, 1, 1);
  const CYL = new THREE.CylinderGeometry(1, 1, 1, 10);

  const phong = (color: string, shininess = 40) => new THREE.MeshPhongMaterial({ color, shininess, specular: "#5a4a30" });
  const plain = (color: string) => new THREE.MeshLambertMaterial({ color });
  const M = {
    gold: phong(COLOR.gold, 60),
    brass: phong(COLOR.brass, 30),
    silver: phong(COLOR.silver, 50),
    linen: plain(COLOR.linen),
    wood: plain(COLOR.wood),
    blue: plain(COLOR.blue),
    skin: plain(COLOR.skin),
    water: phong(COLOR.water, 80),
    flame: new THREE.MeshBasicMaterial({ color: COLOR.flame })
  };
  const band = needlework(stage);
  /** A needlework material whose bands run along a hanging `width` cubits wide. */
  const hangingMat = (width: number) => {
    const t = band.clone();
    t.repeat.set(width / 4, 1);
    return new THREE.MeshLambertMaterial({ map: t, side: THREE.DoubleSide });
  };

  /** A box filling [x0,x1] × [y0,y1] × [z0,z1]. */
  function block(mat: THREE.Material, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): THREE.Mesh {
    const m = new THREE.Mesh(BOX, mat);
    m.scale.set(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0));
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    return m;
  }
  /** An upright post of radius r from y0 to y1 at (x, z). */
  function post(mat: THREE.Material, r: number, x: number, z: number, y0: number, y1: number): THREE.Mesh {
    const m = new THREE.Mesh(CYL, mat);
    m.scale.set(r, y1 - y0, r);
    m.position.set(x, (y0 + y1) / 2, z);
    return m;
  }
  /** A stave or bar of radius r along the x or z axis, centred at (x, y, z). */
  function rod(mat: THREE.Material, r: number, len: number, axis: "x" | "z", x: number, y: number, z: number): THREE.Mesh {
    const m = new THREE.Mesh(CYL, mat);
    m.scale.set(r, len, r);
    if (axis === "x") m.rotation.z = Math.PI / 2;
    else m.rotation.x = Math.PI / 2;
    m.position.set(x, y, z);
    return m;
  }
  /** Many copies of one shape as a single draw. */
  function instanced(geo: THREE.BufferGeometry, mat: THREE.Material, mats: THREE.Matrix4[]): THREE.InstancedMesh {
    const m = new THREE.InstancedMesh(geo, mat, mats.length);
    mats.forEach((mx, i) => m.setMatrixAt(i, mx));
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
    m.computeBoundingBox();
    return m;
  }
  const at = (x: number, y: number, z: number, sx: number, sy: number, sz: number, rot?: THREE.Euler) =>
    new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(rot ?? new THREE.Euler()), new THREE.Vector3(sx, sy, sz));

  const groups = new Map<PieceId, THREE.Group>();
  function piece(id: PieceId, ...parts: THREE.Object3D[]): THREE.Group {
    const g = groups.get(id) ?? new THREE.Group();
    g.add(...parts);
    if (!groups.has(id)) {
      groups.set(id, g);
      scene.add(g);
    }
    return g;
  }

  /* -------------------------------------------------------------- ground and court */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), plain(COLOR.sand));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(COURT.length, COURT.breadth), plain(COLOR.court));
  floor.rotation.x = -Math.PI / 2;
  scene.add(ground, floor);

  const E = COURT.length / 2;
  const S = COURT.breadth / 2;
  const H = COURT.height;
  const t = 0.08; // a hanging's thickness, for drawing only
  const halfGate = COURT.gate / 2;
  piece(
    "court",
    block(M.linen, -E, E, 0, H, S - t / 2, S + t / 2),
    block(M.linen, -E, E, 0, H, -S - t / 2, -S + t / 2),
    block(M.linen, -E - t / 2, -E + t / 2, 0, H, -S, S),
    block(M.linen, E - t / 2, E + t / 2, 0, H, -S, -halfGate),
    block(M.linen, E - t / 2, E + t / 2, 0, H, halfGate, S)
  );
  // Sixty pillars every five cubits round the fence (the spacing is chosen; see the data module).
  const spots: [number, number][] = [];
  for (let x = -E; x <= E; x += COURT.pillarSpacing) spots.push([x, S], [x, -S]);
  for (let z = -S + COURT.pillarSpacing; z < S; z += COURT.pillarSpacing) spots.push([E, z], [-E, z]);
  const pr = COURT.pillarRadius;
  piece(
    "court",
    instanced(CYL, M.brass, spots.map(([x, z]) => at(x, H / 2, z, pr, H, pr))), // pillars of brass (27:10)
    instanced(BOX, M.brass, spots.map(([x, z]) => at(x, 0.2, z, 0.7, 0.4, 0.7))), // sockets of brass (27:17)
    instanced(CYL, M.silver, spots.map(([x, z]) => at(x, H + 0.1, z, pr * 1.3, 0.25, pr * 1.3))) // chapiters of silver (38:17)
  );
  const gateHanging = block(hangingMat(COURT.gate), E + 0.3, E + 0.3 + t, 0, COURT.gateHeight, -halfGate, halfGate);
  piece("gate", gateHanging);

  /* -------------------------------------------------------------- the altar of burnt offering */
  {
    const [cx, cz] = PLACE.brasenAltar;
    const a = BRASEN_ALTAR;
    const hl = a.length / 2;
    const w = 0.2; // "hollow with boards" (27:8): the walls' thickness is chosen
    const parts: THREE.Object3D[] = [
      block(M.brass, cx - hl, cx + hl, 0, a.height, cz - hl, cz - hl + w),
      block(M.brass, cx - hl, cx + hl, 0, a.height, cz + hl - w, cz + hl),
      block(M.brass, cx - hl, cx - hl + w, 0, a.height, cz - hl, cz + hl),
      block(M.brass, cx + hl - w, cx + hl, 0, a.height, cz - hl, cz + hl),
      block(plain("#4a3020"), cx - hl + w, cx + hl - w, a.grateHeight - 0.05, a.grateHeight, cz - hl + w, cz + hl - w), // the grate
      rod(M.brass, 0.12, a.staveLength, "x", cx, a.grateHeight, cz - hl - 0.2),
      rod(M.brass, 0.12, a.staveLength, "x", cx, a.grateHeight, cz + hl + 0.2)
    ];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) parts.push(block(M.brass, cx + sx * hl - 0.25 * (sx + 1), cx + sx * hl - 0.25 * (sx - 1), a.height, a.height + 0.5, cz + sz * hl - 0.25 * (sz + 1), cz + sz * hl - 0.25 * (sz - 1)));
    piece("brasenAltar", ...parts);
  }

  /* -------------------------------------------------------------- the laver */
  {
    const [cx, cz] = PLACE.laver;
    const r = LAVER.diameter / 2;
    const h = LAVER.height;
    // A foot, a stem and a bowl, turned on a lathe. The proportions are chosen; only "a laver … and his foot" is given.
    const profile = [
      [0, 0], [r * 0.65, 0], [r * 0.65, 0.12], [0.3, 0.3], [0.22, h * 0.48], [0.5, h * 0.56],
      [r * 0.75, h * 0.7], [r, h * 0.93], [r, h], [r - 0.1, h], [r - 0.12, h * 0.93], [r * 0.68, h * 0.74], [0, h * 0.7]
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const bowl = new THREE.Mesh(new THREE.LatheGeometry(profile, 28), M.brass);
    bowl.position.set(cx, 0, cz);
    const water = new THREE.Mesh(new THREE.CircleGeometry(r - 0.15, 28), M.water);
    water.rotation.x = -Math.PI / 2;
    water.position.set(cx, h * 0.92, cz);
    piece("laver", bowl, water);
  }

  /* -------------------------------------------------------------- the boards, sockets and bars */
  const T = BOARD.thickness;
  const L = TENT.innerLength;
  const W2 = TENT.innerBreadth / 2;
  const BH = BOARD.height;
  const bw = BOARD.breadth;
  const gap = 0.03; // a hairline between boards so they read as boards
  {
    const boards: THREE.Matrix4[] = [];
    const sockets: THREE.Matrix4[] = [];
    const addBoard = (x0: number, x1: number, z0: number, z1: number) => {
      boards.push(at((x0 + x1) / 2, BH / 2, (z0 + z1) / 2, Math.abs(x1 - x0) - gap, BH, Math.abs(z1 - z0) - gap));
      // Two sockets under each board, one for each tenon (26:19).
      const alongX = Math.abs(x1 - x0) > Math.abs(z1 - z0);
      for (const f of [0.25, 0.75]) {
        const x = alongX ? x0 + (x1 - x0) * f : (x0 + x1) / 2;
        const z = alongX ? (z0 + z1) / 2 : z0 + (z1 - z0) * f;
        sockets.push(at(x, 0.25, z, alongX ? bw / 2 - 0.06 : T + 0.2, 0.5, alongX ? T + 0.2 : bw / 2 - 0.06));
      }
    };
    for (let i = 0; i < BOARD.south; i++) addBoard(-bw * (i + 1), -bw * i, W2, W2 + T); // south (26:18)
    for (let i = 0; i < BOARD.north; i++) addBoard(-bw * (i + 1), -bw * i, -W2 - T, -W2); // north (26:20)
    const west0 = -(BOARD.west * bw) / 2;
    for (let j = 0; j < BOARD.west; j++) addBoard(-L - T, -L, west0 + j * bw, west0 + (j + 1) * bw); // west (26:22)
    // The corner boards: half a cubit shows inside, the rest covers the end of the side wall (chosen).
    addBoard(-L - T, -L, -west0, -west0 + bw);
    addBoard(-L - T, -L, west0 - bw, west0);

    const bars: THREE.Matrix4[] = [];
    const R = BARS.radius;
    const out = 0.2; // the bars run outside the boards, in their rings (chosen)
    const sideLen = L + T;
    for (const z of [W2 + T + out, -W2 - T - out]) {
      bars.push(at(-sideLen / 2, BARS.middleHeight, z, R, sideLen, R, new THREE.Euler(0, 0, Math.PI / 2)));
      for (const y of BARS.otherHeights) {
        bars.push(at(-sideLen / 4, y, z, R, sideLen / 2 - 0.3, R, new THREE.Euler(0, 0, Math.PI / 2)));
        bars.push(at((-sideLen * 3) / 4, y, z, R, sideLen / 2 - 0.3, R, new THREE.Euler(0, 0, Math.PI / 2)));
      }
    }
    const westX = -L - T - out;
    const westLen = TENT.innerBreadth + 2 * T;
    bars.push(at(westX, BARS.middleHeight, 0, R, westLen, R, new THREE.Euler(Math.PI / 2, 0, 0)));
    for (const y of BARS.otherHeights) {
      bars.push(at(westX, y, -westLen / 4, R, westLen / 2 - 0.3, R, new THREE.Euler(Math.PI / 2, 0, 0)));
      bars.push(at(westX, y, westLen / 4, R, westLen / 2 - 0.3, R, new THREE.Euler(Math.PI / 2, 0, 0)));
    }
    piece("tent", instanced(BOX, M.gold, boards), instanced(BOX, M.silver, sockets), instanced(CYL, M.gold, bars));
  }

  /* -------------------------------------------------------------- the door and the vail */
  const hh = TENT.hangingHeight;
  const tr = TENT.pillarRadius;
  {
    const parts: THREE.Object3D[] = [];
    for (let i = 0; i < TENT.doorPillars; i++) {
      const z = -W2 + 1 + (i * (TENT.innerBreadth - 2)) / (TENT.doorPillars - 1);
      parts.push(post(M.gold, tr, 0, z, 0, hh), block(M.brass, -0.35, 0.35, 0, 0.4, z - 0.35, z + 0.35)); // brass sockets (26:37)
    }
    parts.push(block(hangingMat(TENT.innerBreadth), 0.3, 0.3 + t, 0, hh, -W2, W2));
    piece("door", ...parts);
  }
  {
    const x = PLACE.veil;
    const parts: THREE.Object3D[] = [];
    for (let i = 0; i < TENT.veilPillars; i++) {
      const z = -W2 + 1.25 + (i * (TENT.innerBreadth - 2.5)) / (TENT.veilPillars - 1);
      parts.push(post(M.gold, tr, x, z, 0, hh), block(M.silver, x - 0.35, x + 0.35, 0, 0.4, z - 0.35, z + 0.35)); // silver sockets (26:32)
    }
    parts.push(block(hangingMat(TENT.innerBreadth), x + 0.3, x + 0.3 + t, 0, hh, -W2, W2));
    piece("veil", ...parts);
  }

  /* -------------------------------------------------------------- the coverings */
  // Each layer has its own material so the coverings can fade as they lift.
  const coverMats: THREE.Material[] = [];
  const cover = (m: THREE.Material) => {
    coverMats.push(m);
    return m;
  };
  const lin = cover(hangingMat(28));
  const goat = cover(plain(COLOR.goatsHair));
  const rams = cover(plain(COLOR.ramsRed));
  const badger = cover(plain(COLOR.badger));
  // The curtains hang outside the bars, which run outside the boards.
  const back = -L - T - 0.4;
  const side = W2 + T + 0.4;
  const coverings = piece(
    "coverings",
    // Linen: over the top, 8 cubits down each side and 9 down the back (the lie is chosen).
    block(lin, back, 0, BH, BH + 0.05, -side, side),
    block(lin, back, 0, BH - 8, BH, side, side + 0.05),
    block(lin, back, 0, BH - 8, BH, -side - 0.05, -side),
    block(lin, back - 0.05, back, BH - 9, BH, -side, side),
    // Goats' hair: a cubit further down each side than the linen (26:13), to the ground at the back, a fold
    // of 2 cubits over the front (26:9).
    block(goat, back - 0.1, 0.1, BH + 0.08, BH + 0.16, -side - 0.1, side + 0.1),
    block(goat, back - 0.1, 0.1, BH - 9, BH + 0.08, side + 0.08, side + 0.16),
    block(goat, back - 0.1, 0.1, BH - 9, BH + 0.08, -side - 0.16, -side - 0.08),
    block(goat, back - 0.16, back - 0.08, 0, BH + 0.08, -side - 0.1, side + 0.1),
    block(goat, 0.45, 0.45 + t, BH - GOATS_HAIR.frontFold, BH + 0.16, -side - 0.1, side + 0.1),
    // Rams' skins dyed red, then badgers' skins: no size given; over the roof only.
    block(rams, back - 0.2, 0.25, BH + 0.2, BH + 0.28, -side - 0.2, side + 0.2),
    block(badger, back - 0.3, 0.35, BH + 0.32, BH + 0.42, -side - 0.3, side + 0.3)
  );

  /* -------------------------------------------------------------- the table */
  {
    const [cx, cz] = PLACE.table;
    const hl = TABLE.length / 2; // along x (chosen)
    const hb = TABLE.breadth / 2;
    const top = TABLE.height;
    const leg = 0.12;
    const parts: THREE.Object3D[] = [block(M.gold, cx - hl, cx + hl, top - 0.1, top, cz - hb, cz + hb)];
    // The crown round the top (25:24), the border of a handbreadth below it (25:25).
    parts.push(
      block(M.gold, cx - hl, cx + hl, top, top + 0.06, cz - hb, cz - hb + 0.05),
      block(M.gold, cx - hl, cx + hl, top, top + 0.06, cz + hb - 0.05, cz + hb),
      block(M.gold, cx - hl + 0.06, cx + hl - 0.06, top - 0.1 - TABLE.border, top - 0.1, cz - hb + 0.04, cz + hb - 0.04)
    );
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const x = cx + sx * (hl - leg);
      const z = cz + sz * (hb - leg);
      parts.push(block(M.gold, x - leg / 2, x + leg / 2, 0, top - 0.1, z - leg / 2, z + leg / 2));
    }
    // Staves through the rings at the feet (25:26–28).
    for (const sz of [-1, 1]) parts.push(rod(M.gold, 0.05, TABLE.staveLength, "x", cx, top * 0.55, cz + sz * (hb + 0.08)));
    piece("table", ...parts);
  }

  /* -------------------------------------------------------------- the candlestick */
  {
    const [cx, cz] = PLACE.lampstand;
    const top = LAMPSTAND.height - 0.2; // the lamps sit on top; the flames reach the full height
    const parts: THREE.Object3D[] = [post(M.gold, 0.35, cx, cz, 0, 0.12), post(M.gold, 0.06, cx, cz, 0, top)];
    // Three branches out of each side (25:32), drawn as arcs in one plane across the room (chosen).
    const step = LAMPSTAND.span / 2 / 3;
    for (let k = 1; k <= 3; k++) {
      const arc = new THREE.Mesh(new THREE.TorusGeometry(step * k, 0.045, 6, 24, Math.PI), M.gold);
      arc.rotation.z = Math.PI; // the lower half of the ring
      arc.position.set(cx, top, cz);
      parts.push(arc);
    }
    for (let k = -3; k <= 3; k++) {
      const x = cx + k * step;
      parts.push(post(M.gold, 0.08, x, cz, top, top + 0.1));
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 6), M.flame);
      flame.position.set(x, top + 0.17, cz);
      parts.push(flame);
    }
    piece("lampstand", ...parts);
  }

  /* -------------------------------------------------------------- the altar of incense */
  {
    const [cx, cz] = PLACE.incenseAltar;
    const h = INCENSE_ALTAR.height;
    const hl = INCENSE_ALTAR.length / 2;
    const parts: THREE.Object3D[] = [
      block(M.gold, cx - hl, cx + hl, 0, h, cz - hl, cz + hl),
      block(M.gold, cx - hl - 0.04, cx + hl + 0.04, h - 0.08, h, cz - hl - 0.04, cz + hl + 0.04) // the crown (30:3)
    ];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) parts.push(block(M.gold, cx + sx * hl - (sx > 0 ? 0.16 : 0), cx + sx * hl + (sx < 0 ? 0.16 : 0), h, h + 0.18, cz + sz * hl - (sz > 0 ? 0.16 : 0), cz + sz * hl + (sz < 0 ? 0.16 : 0)));
    for (const sz of [-1, 1]) parts.push(rod(M.gold, 0.04, INCENSE_ALTAR.staveLength, "x", cx, h - 0.35, cz + sz * (hl + 0.07)));
    piece("incenseAltar", ...parts);
  }

  /* -------------------------------------------------------------- the ark and the mercy seat */
  {
    const [cx, cz] = PLACE.ark;
    const hx = ARK.breadth / 2; // its length runs across the room, north to south (chosen)
    const hz = ARK.length / 2;
    const h = ARK.height;
    const seatTop = h + MERCY_SEAT.thickness;
    const parts: THREE.Object3D[] = [
      block(M.gold, cx - hx, cx + hx, 0, h, cz - hz, cz + hz),
      block(M.gold, cx - hx - 0.04, cx + hx + 0.04, h - 0.08, h, cz - hz - 0.04, cz + hz + 0.04), // the crown (25:11)
      block(M.gold, cx - hx, cx + hx, h, seatTop, cz - hz, cz + hz) // the mercy seat (25:17)
    ];
    for (const sx of [-1, 1]) parts.push(rod(M.gold, 0.05, ARK.staveLength, "z", cx + sx * (hx + 0.08), h * 0.35, cz));
    // Two cherubim on the ends, faces toward each other, wings on high over the mercy seat (25:18–20).
    // Their form is not described; these are plain figures of the chosen height.
    const ch = MERCY_SEAT.cherubHeight;
    for (const sz of [-1, 1]) {
      const z = cz + sz * (hz - 0.25);
      parts.push(block(M.gold, cx - 0.2, cx + 0.2, seatTop, seatTop + ch * 0.62, z - 0.16, z + 0.16));
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), M.gold);
      head.position.set(cx, seatTop + ch * 0.72, z - sz * 0.05);
      const wing = block(M.gold, cx - 0.62, cx + 0.62, 0, 0.05, 0, 1.0);
      wing.position.set(cx, seatTop + ch * 0.82, z - sz * 0.45);
      wing.rotation.x = sz * 0.45; // the inner edge rises: wings on high
      parts.push(head, wing);
    }
    piece("ark", ...parts);
  }

  /* -------------------------------------------------------------- the high priest */
  // About 3.6 cubits tall, if a cubit is about 45 cm. A robe all of blue (28:31), the ephod, the linen mitre (28:39).
  const priest = piece(
    "priest",
    (() => {
      const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.55, 2.6, 12), M.blue);
      robe.position.y = 1.3;
      return robe;
    })(),
    post(M.gold, 0.4, 0, 0, 1.6, 2.45),
    block(M.gold, 0.3, 0.42, 1.95, 2.4, -0.2, 0.2),
    (() => {
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), M.skin);
      head.position.y = 2.88;
      return head;
    })(),
    post(M.linen, 0.27, 0, 0, 3.05, 3.5)
  );
  priest.position.set(PRIEST_START[0], 0, PRIEST_START[1]);
  priest.rotation.y = Math.PI;

  /* -------------------------------------------------------------- marking the chosen piece */
  const markBox = new THREE.Box3();
  const mark = new THREE.Box3Helper(markBox, new THREE.Color(COLOR.mark));
  (mark.material as THREE.LineBasicMaterial).depthTest = false;
  mark.renderOrder = 10;
  mark.visible = false;
  scene.add(mark);
  let selected: PieceId | null = null;
  function placeMark() {
    const g = selected ? groups.get(selected) : null;
    mark.visible = Boolean(g);
    if (g) {
      markBox.setFromObject(g);
      markBox.expandByScalar(0.15);
    }
  }

  /* -------------------------------------------------------------- the camera */
  const controls = new OrbitControls(camera, stage.canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 2;
  controls.maxDistance = 320;
  controls.maxPolarAngle = 1.48; // never below the ground
  controls.screenSpacePanning = false; // panning slides over the ground
  controls.rotateSpeed = 0.6;
  let userMoving = false;
  let flight: { target: THREE.Vector3; pos: THREE.Vector3 } | null = null;
  controls.addEventListener("start", () => {
    userMoving = true;
    flight = null;
  });
  controls.addEventListener("end", () => (userMoving = false));
  controls.addEventListener("change", () => {
    // Keep the view over the camp.
    controls.target.x = THREE.MathUtils.clamp(controls.target.x, -90, 90);
    controls.target.z = THREE.MathUtils.clamp(controls.target.z, -70, 70);
    controls.target.y = THREE.MathUtils.clamp(controls.target.y, 0, 12);
    stage.invalidate();
  });

  /** Camera position for a view: bearing (0 = from the east, 90 = from the south), height angle, distance. */
  function cameraFor(target: THREE.Vector3, v: { from: number; up: number; dist: number }, fit = false): THREE.Vector3 {
    const { w, h } = stage.size();
    const aspect = w / Math.max(1, h);
    const half = THREE.MathUtils.degToRad(camera.fov / 2);
    // On a tall phone screen, stand back far enough that the court's length still fits across.
    let dist = fit ? Math.max(v.dist, (COURT.length / 2 + 8) / (Math.tan(half) * aspect)) : v.dist * Math.max(1, 1.25 / aspect);
    dist = Math.min(dist, controls.maxDistance);
    const b = THREE.MathUtils.degToRad(v.from);
    const u = THREE.MathUtils.degToRad(v.up);
    return target.clone().add(new THREE.Vector3(Math.cos(b) * Math.cos(u), Math.sin(u), Math.sin(b) * Math.cos(u)).multiplyScalar(dist));
  }

  function centreOf(id: PieceId): THREE.Vector3 {
    const c = new THREE.Box3().setFromObject(groups.get(id)!).getCenter(new THREE.Vector3());
    c.y = Math.min(c.y, 4); // look at the middle of a thing, but never up into the roof
    return c;
  }

  /* -------------------------------------------------------------- the priest's walk */
  let walk: { pts: THREE.Vector2[]; d: number; total: number } | null = null;
  const WALK_SPEED = 9; // cubits a second
  function walkTo(stand: [number, number], via: [number, number][] = []) {
    const pts = [new THREE.Vector2(priest.position.x, priest.position.z), ...via.map(([x, z]) => new THREE.Vector2(x, z)), new THREE.Vector2(stand[0], stand[1])];
    let total = 0;
    for (let i = 1; i < pts.length; i++) total += pts[i].distanceTo(pts[i - 1]);
    walk = { pts, d: 0, total };
  }
  function walkFrame(dt: number): boolean {
    if (!walk) return false;
    walk.d = reduced ? walk.total : Math.min(walk.total, walk.d + WALK_SPEED * dt);
    let left = walk.d;
    for (let i = 1; i < walk.pts.length; i++) {
      const a = walk.pts[i - 1];
      const b = walk.pts[i];
      const len = a.distanceTo(b);
      if (left <= len || i === walk.pts.length - 1) {
        const f = len ? Math.min(1, left / len) : 1;
        priest.position.set(a.x + (b.x - a.x) * f, 0, a.y + (b.y - a.y) * f);
        if (len > 0.01) priest.rotation.y = Math.atan2(b.x - a.x, b.y - a.y) - Math.PI / 2;
        break;
      }
      left -= len;
    }
    if (walk.d >= walk.total) {
      walk = null;
      return false;
    }
    return true;
  }

  /* -------------------------------------------------------------- the coverings lift */
  let lift = 0;
  let liftGoal = 0;
  function liftFrame(dt: number): boolean {
    let moving: boolean;
    [lift, moving] = approach(lift, liftGoal, reduced ? 100 : 3.2, dt);
    coverings.position.y = lift * 14;
    coverings.visible = lift < 0.98;
    const opacity = 1 - lift;
    for (const m of coverMats) {
      const fading = opacity < 0.999;
      if (m.transparent !== fading) {
        m.transparent = fading;
        m.needsUpdate = true;
      }
      m.opacity = opacity;
    }
    return moving;
  }

  /* -------------------------------------------------------------- picking */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pickable = [...groups.values()];
  const shown = (o: THREE.Object3D | null): boolean => !o || (o.visible && shown(o.parent));
  function pickAt(clientX: number, clientY: number): PieceId | null {
    const r = stage.canvas.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    for (const hit of ray.intersectObjects(pickable, true)) {
      if (!shown(hit.object)) continue;
      let o: THREE.Object3D | null = hit.object;
      while (o) {
        for (const [id, g] of groups) if (g === o) return id;
        o = o.parent;
      }
    }
    return null;
  }
  let down: { x: number; y: number; t: number } | null = null;
  const onDown = (e: PointerEvent) => {
    down = { x: e.clientX, y: e.clientY, t: performance.now() };
  };
  const onUp = (e: PointerEvent) => {
    // A tap, not a drag: pick what is under it.
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 6 && performance.now() - down.t < 600) opts.onPick(pickAt(e.clientX, e.clientY));
    down = null;
  };
  let hoverQueued = false;
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" || e.buttons || hoverQueued) return;
    hoverQueued = true;
    requestAnimationFrame(() => {
      hoverQueued = false;
      stage.canvas.style.cursor = pickAt(e.clientX, e.clientY) ? "pointer" : "";
    });
  };
  stage.canvas.addEventListener("pointerdown", onDown);
  stage.canvas.addEventListener("pointerup", onUp);
  stage.canvas.addEventListener("pointermove", onMove);

  /* -------------------------------------------------------------- the frame */
  const stopFrame = stage.onFrame((dt) => {
    let moving = false;
    if (flight && !userMoving) {
      const k = reduced ? 1 : 1 - Math.exp(-2.6 * dt);
      controls.target.lerp(flight.target, k);
      camera.position.lerp(flight.pos, k);
      if (camera.position.distanceTo(flight.pos) < 0.02 && controls.target.distanceTo(flight.target) < 0.02) {
        controls.target.copy(flight.target);
        camera.position.copy(flight.pos);
        flight = null;
      } else moving = true;
    }
    if (walkFrame(dt)) moving = true;
    if (liftFrame(dt)) moving = true;
    if (controls.update()) moving = true;
    if (selected === "priest" || (selected === "coverings" && moving)) placeMark();
    return moving;
  });

  // Start over the whole court.
  const start = new THREE.Vector3(...OVERVIEW.target);
  controls.target.copy(start);
  camera.position.copy(cameraFor(start, OVERVIEW.view, true));
  controls.update();
  stage.invalidate();

  return {
    view(step) {
      const s = PATH[step];
      if (!s) {
        const target = new THREE.Vector3(...OVERVIEW.target);
        flight = { target, pos: cameraFor(target, OVERVIEW.view, true) };
        walkTo(PRIEST_START);
      } else {
        const target = centreOf(s.piece);
        flight = { target, pos: cameraFor(target, s.view) };
        walkTo(s.stand, s.via);
      }
      stage.invalidate();
    },
    select(id) {
      selected = id;
      placeMark();
      stage.invalidate();
    },
    setLifted(on) {
      liftGoal = on ? 1 : 0;
      stage.invalidate();
    },
    dispose() {
      stopFrame();
      controls.dispose();
      band.dispose();
      stage.canvas.removeEventListener("pointerdown", onDown);
      stage.canvas.removeEventListener("pointerup", onUp);
      stage.canvas.removeEventListener("pointermove", onMove);
    }
  };
}
