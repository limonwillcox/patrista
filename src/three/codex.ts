import * as THREE from "three";
import { approach, canvasTexture, fitCamera, prefersReducedMotion, type Stage } from "./stage";
import {
  chunk,
  drawColumn,
  INK,
  makeCanvas,
  paintLeather,
  paintSurface,
  readyFont,
  rng,
  seedOf,
  wrapLines,
  type Surface
} from "./writing";

export type CodexHandle = {
  turn: (dir: 1 | -1) => void;
  openCover: () => void;
  dispose: () => void;
  /** External mode: the book (posed by the owner), its lamp rig, and its size in its own units. */
  book: THREE.Group;
  rig: THREE.Group;
  /** flapReach: how far the open flap lies out past the fore-edge (soft covers only). */
  dims: { boardW: number; boardD: number; closed: number; C: number; flapReach: number };
  /** External mode: the owner draws the book this many pixels to a unit; lights and shadows follow. */
  setScale: (s: number) => void;
  /** Show the table shadow under the book (only once it lies flat). */
  setGrounded: (on: boolean) => void;
  /** 0: the spine shows its picture exactly, unlit (as the flat spine on the page); 1: lit like the rest. */
  setLit: (t: number) => void;
  /** Compile every shader the book will use before it moves, so opening and landing never wait on one. */
  prewarm: () => Promise<void>;
};

const PW = 1.0; // page width (scene units)
const PH = 1.38; // page height
const T = 0.16; // thickness of the whole text block
const BOARD_C = 0.026; // cover board thickness, for a parchment book bound in boards
const BOARD_SQ = 0.035; // how far boards stand out past the pages (a binder's "squares")
const LIMP_C = 0.008; // a papyrus codex's soft leather cover: thin, and nearly flush with the leaves
const LIMP_SQ = 0.012;
const SEG = 40; // segments across a page, for the curve
const TEX_W = 1024;
const TEX_H = Math.round((TEX_W * PH) / PW);
const K = TEX_W / 720; // layout scale against the 720px design

/**
 * Height of the top page at distance `d` from the spine, on a stack `h` high. Pages dive into the
 * binding at the spine, arch up quickly, then settle toward the outer edge, as an open book does.
 */
export function surface(d: number, h: number): number {
  const u = Math.min(1, Math.max(0, d / PW));
  const gutter = 0.006;
  const rise = 1 - Math.exp(-u / 0.045);
  return gutter + (h + 0.028 - gutter) * rise - 0.022 * u * u;
}

/** Margins of a page, widest at the foot as in a scribe's layout. The inner margin also clears the curve at the spine. */
const MARGIN = { inner: 96 * K, outer: 96 * K, top: 78 * K, bottom: 132 * K };

/**
 * A codex lying open on a table: the front cover swings open, then pages turn with a curl.
 * Papyrus codices get papyrus leaves and a limp leather wrapper; parchment ones get tooled boards.
 * `cover` is the leather colour, matching the spine the reader picked off the shelf.
 */
export async function buildCodex(
  stage: Stage,
  opts: {
    title: string;
    author: string;
    paras: string[];
    surface: Surface;
    cover?: string;
    onSpread?: (n: number, total: number) => void;
    /** Keep the cover shut until openCover() is called (while the book flies in from the shelf). */
    holdCover?: boolean;
    /**
     * External mode: the owner of the stage poses the book (standing on a shelf, in flight, lying open)
     * and owns the camera; the book brings its lamps in a rig the owner places, and adds no pointer input.
     */
    external?: boolean;
    /**
     * A picture of the spine as it stands on the page (upright: width across the spine, height along
     * it). Used in place of the painted spine, so the 3D book takes over from the page without a change.
     */
    spineArt?: HTMLCanvasElement;
  }
): Promise<CodexHandle> {
  // Early papyrus codices had soft leather covers wrapped round the quire, not stiff boards.
  const limp = opts.surface === "papyrus";
  const C = limp ? LIMP_C : BOARD_C;
  const SQ = limp ? LIMP_SQ : BOARD_SQ;
  const font = await readyFont();
  const seed = seedOf(opts.title);
  const renderer = stage.renderer;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const style = { font, size: Math.round(25 * K), lineHeight: Math.round(35 * K) };
  const textW = TEX_W - MARGIN.inner - MARGIN.outer;
  const perPage = Math.floor((TEX_H - MARGIN.top - MARGIN.bottom - 30 * K) / style.lineHeight);

  const [probe] = makeCanvas(8, 8);
  const lines = wrapLines(probe.getContext("2d")!, opts.paras, textW, style);
  // The first page carries a red heading, so it holds two lines fewer.
  const pageLines = [lines.slice(0, perPage - 2), ...chunk(lines.slice(perPage - 2), perPage)].slice(0, 15);
  const pages = pageLines.length;
  const spreads = Math.ceil((pages + 1) / 2); // spread 0: endpaper | page 1

  /** Shade the page toward the spine (it curves away from the light into the binding). */
  function gutterShade(ctx: CanvasRenderingContext2D, right: boolean) {
    const w = TEX_W * 0.16;
    const g = right ? ctx.createLinearGradient(0, 0, w, 0) : ctx.createLinearGradient(TEX_W, 0, TEX_W - w, 0);
    g.addColorStop(0, "rgba(70,42,18,0.34)");
    g.addColorStop(0.35, "rgba(70,42,18,0.1)");
    g.addColorStop(1, "rgba(70,42,18,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, TEX_W, TEX_H);
    // The outer edge darkens a little from thumbs.
    const e = TEX_W * 0.05;
    const g2 = right ? ctx.createLinearGradient(TEX_W, 0, TEX_W - e, 0) : ctx.createLinearGradient(0, 0, e, 0);
    g2.addColorStop(0, "rgba(90,60,30,0.16)");
    g2.addColorStop(1, "rgba(90,60,30,0)");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, TEX_W, TEX_H);
  }

  const texCache = new Map<number, THREE.CanvasTexture>();
  function pageTexture(i: number): THREE.CanvasTexture {
    // i = -1 is the endpaper inside the front cover; i >= pages is a blank leaf.
    // Even pages lie on the right (rectos), odd pages and the endpaper on the left.
    const hit = texCache.get(i);
    if (hit) return hit;
    const right = i >= 0 && i % 2 === 0;
    const [c, ctx] = makeCanvas(TEX_W, TEX_H);
    if (i < 0) {
      paintSurface(opts.surface, ctx, TEX_W, TEX_H, seed + 7);
      // A small owner's label, as libraries pasted inside their books.
      const lw = 300 * K;
      const lh = 150 * K;
      const lx = (TEX_W - lw) / 2;
      const ly = TEX_H * 0.36;
      ctx.strokeStyle = "rgba(120,80,35,0.45)";
      ctx.lineWidth = 2 * K;
      ctx.strokeRect(lx, ly, lw, lh);
      ctx.strokeRect(lx + 7 * K, ly + 7 * K, lw - 14 * K, lh - 14 * K);
      ctx.fillStyle = "rgba(90,55,20,0.75)";
      ctx.textAlign = "center";
      ctx.font = `italic ${Math.round(30 * K)}px ${font}`;
      ctx.fillText(opts.author, TEX_W / 2, ly + lh * 0.48);
      ctx.font = `${Math.round(17 * K)}px ${font}`;
      ctx.fillText("E X   L I B R I S   P A T R I S T A", TEX_W / 2, ly + lh * 0.75);
    } else {
      paintSurface(opts.surface, ctx, TEX_W, TEX_H, seed + i * 31);
      const x0 = right ? MARGIN.inner : MARGIN.outer;
      if (opts.surface === "parchment") {
        // Dry-point ruling the scribe pricked and scored before writing, with the pricks in the outer margin.
        // Lines stop short of the text edges and are soft: hard 1px lines alias into dashes when the page is small.
        // The ruling also fades out toward the spine, where the curve squeezes the page into a few pixels.
        const a = x0 - 6 * K;
        const b = x0 + textW + 6 * K;
        const rule = ctx.createLinearGradient(right ? a : b, 0, right ? a + 90 * K : b - 90 * K, 0);
        rule.addColorStop(0, "rgba(120,90,50,0)");
        rule.addColorStop(1, "rgba(120,90,50,0.09)");
        ctx.strokeStyle = rule;
        ctx.lineWidth = 1.5 * K;
        const pr = rng(seed + i);
        for (let k = 0; k <= perPage; k++) {
          const y = MARGIN.top + 30 * K + style.size + 6 + k * style.lineHeight;
          ctx.beginPath();
          ctx.moveTo(x0 - 6 * K, y);
          ctx.lineTo(x0 + textW + 6 * K, y);
          ctx.stroke();
          const px = right ? TEX_W - 34 * K : 34 * K;
          ctx.fillStyle = `rgba(90,60,30,${0.14 + pr() * 0.1})`;
          ctx.beginPath();
          ctx.arc(px + (pr() - 0.5) * 3, y, 1.6 * K, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      const block = pageLines[i] ?? [];
      drawColumn(ctx, block, x0, MARGIN.top, style, seed + i, {
        width: textW,
        initial: i === 0,
        heading: i === 0 ? opts.title : undefined
      });
      // Folio number on each recto, in the outer top corner, as medieval books were numbered.
      if (right && i < pages) {
        ctx.fillStyle = INK;
        ctx.globalAlpha = 0.55;
        ctx.font = `${Math.round(19 * K)}px ${font}`;
        ctx.textAlign = "right";
        ctx.fillText(String(i / 2 + 1), TEX_W - 44 * K, 52 * K);
        ctx.globalAlpha = 1;
      }
    }
    gutterShade(ctx, right);
    const tex = canvasTexture(c, renderer);
    texCache.set(i, tex);
    return tex;
  }
  const flipCache = new Map<number, THREE.Texture>();
  function flippedTexture(i: number): THREE.Texture {
    const hit = flipCache.get(i);
    if (hit) return hit;
    const t = pageTexture(i).clone();
    t.wrapS = THREE.RepeatWrapping;
    t.repeat.x = -1;
    t.offset.x = 1;
    t.needsUpdate = true;
    flipCache.set(i, t);
    return t;
  }

  // Page edges seen on the sides of the text block: many thin leaves, not quite even.
  const [edgeC, edgeCtx] = makeCanvas(64, 512);
  const er = rng(seed + 3);
  edgeCtx.fillStyle = opts.surface === "papyrus" ? "#cfb37c" : "#ecdfc2";
  edgeCtx.fillRect(0, 0, 64, 512);
  for (let y = 0; y < 512; y += 2) {
    edgeCtx.fillStyle = `rgba(110,80,40,${0.07 + er() * 0.16})`;
    edgeCtx.fillRect(0, y, 64, 1);
  }
  const edgeTex = canvasTexture(edgeC, renderer);
  edgeTex.wrapT = THREE.RepeatWrapping;
  const edgeMat = new THREE.MeshStandardMaterial({ map: edgeTex, roughness: 0.95 });

  const coverColour = opts.cover ?? (opts.surface === "papyrus" ? "#6b4a2b" : "#4a2615");
  const boardW = PW + SQ;
  const boardD = PH + SQ * 2;
  const [leatherC, leatherCtx] = makeCanvas(640, Math.round((640 * boardD) / boardW));
  paintLeather(leatherCtx, leatherC.width, leatherC.height, seed, opts.surface === "papyrus" ? "limp" : "tooled", coverColour);
  if (opts.external) {
    leatherCtx.globalAlpha = 0.4;
    leatherCtx.fillStyle = coverColour;
    leatherCtx.fillRect(0, 0, leatherC.width, leatherC.height);
    leatherCtx.globalAlpha = 1;
  }
  const leatherMat = new THREE.MeshStandardMaterial({ map: canvasTexture(leatherC, renderer), roughness: 0.62, metalness: 0.04 });
  const [bareC, bareCtx] = makeCanvas(256, 352);
  paintLeather(bareCtx, 256, 352, seed + 1, "bare", coverColour);
  const bareMat = new THREE.MeshStandardMaterial({ map: canvasTexture(bareC, renderer), roughness: 0.7 });
  const leatherEdge = new THREE.MeshStandardMaterial({
    color: new THREE.Color(coverColour).multiplyScalar(opts.external ? 0.85 : 0.6),
    roughness: 0.75
  });
  // Box faces: +x, -x, +y, -y, +z, -z.
  const boardFaces = (top: THREE.Material, bottom: THREE.Material) => [leatherEdge, leatherEdge, top, bottom, leatherEdge, leatherEdge];

  const book = new THREE.Group();
  stage.scene.add(book);

  // Back board under the right-hand stack; its inside face shows as a leather border round the pages.
  const backBoard = new THREE.Mesh(new THREE.BoxGeometry(boardW, C, boardD), boardFaces(bareMat, leatherMat));
  backBoard.position.set(boardW / 2, -C / 2, 0);
  backBoard.castShadow = backBoard.receiveShadow = true;
  book.add(backBoard);

  // The two stacks of leaves. Rebuilt when the stack heights change (once per turned leaf).
  const leftBlock = new THREE.Mesh(new THREE.BufferGeometry(), edgeMat);
  const rightBlock = new THREE.Mesh(new THREE.BufferGeometry(), edgeMat);
  for (const b of [leftBlock, rightBlock]) b.castShadow = b.receiveShadow = true;
  book.add(leftBlock, rightBlock);

  const pageMat = () => new THREE.MeshStandardMaterial({ roughness: 0.88 });
  const leftPage = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH, SEG, 1), pageMat());
  const rightPage = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH, SEG, 1), pageMat());
  for (const p of [leftPage, rightPage]) p.receiveShadow = true;
  book.add(leftPage, rightPage);

  // Front cover: a board hinged at the spine. Tooled leather outside, bare leather inside.
  const coverPivot = new THREE.Group();
  const cover = new THREE.Mesh(new THREE.BoxGeometry(boardW, C, boardD), boardFaces(leatherMat, bareMat));
  cover.castShadow = cover.receiveShadow = true;
  coverPivot.add(cover);
  // No brass bosses: those belong to large books of the later Middle Ages, not to the Fathers' age.
  const bosses: THREE.Mesh[] = [];
  book.add(coverPivot);


  // The pastedown: the endpaper glued flat inside the front board, so it swings open with the cover.
  // Its corners are placed so that, once the board has turned over (pi about z), it lies exactly where
  // the left page would: u = 0 at the outer edge, u = 1 at the spine, v = 1 at the head.
  const pasteGeo = new THREE.PlaneGeometry(PW, PH, 1, 1);
  {
    const pp = pasteGeo.attributes.position as THREE.BufferAttribute;
    const pu = pasteGeo.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < pp.count; i++) {
      const d = (1 - pu.getX(i)) * PW;
      pp.setXYZ(i, d - boardW / 2, -C / 2 - 0.0008, -(pu.getY(i) - 0.5) * PH);
    }
    pp.needsUpdate = true;
    pasteGeo.computeVertexNormals();
  }
  // Drawn a little toward the viewer in depth, so the board it is glued to never shows through it.
  const pastedown = new THREE.Mesh(
    pasteGeo,
    new THREE.MeshStandardMaterial({ roughness: 0.9, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 })
  );
  pastedown.receiveShadow = true;
  cover.add(pastedown);

  // Headbands: the little striped cords sewn across the spine at head and tail.
  const [hbC, hbCtx] = makeCanvas(64, 8);
  for (let x = 0; x < 64; x += 8) {
    hbCtx.fillStyle = "#8f2412";
    hbCtx.fillRect(x, 0, 4, 8);
    hbCtx.fillStyle = "#e9d7a4";
    hbCtx.fillRect(x + 4, 0, 4, 8);
  }
  const hbMat = new THREE.MeshStandardMaterial({ map: canvasTexture(hbC, renderer), roughness: 0.6 });
  const hbGeo = new THREE.CylinderGeometry(0.011, 0.011, 0.09, 10).rotateZ(Math.PI / 2);
  // Headbands and the ribbon belong to later parchment books, not to the early papyrus codex.
  const bound = opts.surface === "parchment";
  // They sit across the gutter of the open book, so they show only once the cover is open: shut, they
  // would poke out behind the spine.
  const headbands: THREE.Mesh[] = [];
  for (const z of bound ? [-1, 1] : []) {
    const hb = new THREE.Mesh(hbGeo, hbMat);
    hb.position.set(0, 0.012, z * (PH / 2 + 0.006));
    book.add(hb);
    headbands.push(hb);
  }

  // A silk ribbon marker, coming out between the leaves at the tail and lying on the table.
  const ribbonMat = new THREE.MeshStandardMaterial({ color: "#7a1810", roughness: 0.45, side: THREE.DoubleSide });
  const ribbon = new THREE.Mesh(new THREE.BufferGeometry(), ribbonMat);
  ribbon.castShadow = true;
  ribbon.visible = bound && !opts.external;
  book.add(ribbon);
  function shapeRibbon(tr: number) {
    const x = 0.07;
    const top = surface(x, tr) * 0.75;
    const pts: THREE.Vector3[] = [];
    const n = 24;
    for (let k = 0; k <= n; k++) {
      const s = k / n;
      // Out past the tail of the leaves, over the board's edge, then flat on the table, drifting sideways.
      const z = PH / 2 - 0.02 + s * 0.26;
      const fall = Math.min(1, Math.max(0, (z - (PH / 2 + SQ * 0.4)) / 0.07));
      const y = top + (-C - 0.003 - top) * (fall * fall * (3 - 2 * fall));
      pts.push(new THREE.Vector3(x + 0.07 * s * s, y + 0.002, z));
    }
    const w = 0.028;
    const pos: number[] = [];
    const idx: number[] = [];
    pts.forEach((p, k) => {
      pos.push(p.x - w / 2, p.y, p.z, p.x + w / 2, p.y, p.z);
      if (k) idx.push(2 * k - 2, 2 * k - 1, 2 * k, 2 * k - 1, 2 * k + 1, 2 * k);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    ribbon.geometry.dispose();
    ribbon.geometry = g;
  }

  // The leaf being turned: front shows the page leaving the right, back the page arriving on the left.
  const leafGeo = new THREE.PlaneGeometry(PW, PH, SEG, 1);
  const uv = leafGeo.attributes.uv as THREE.BufferAttribute;
  // The curled underside faces away from the lamp; a faint glow of its own texture keeps it a page in
  // shade instead of a black patch.
  const leafMat = (side: THREE.Side) =>
    new THREE.MeshStandardMaterial({ roughness: 0.88, side, emissive: "#ffffff", emissiveIntensity: 0.18 });
  const leafFront = new THREE.Mesh(leafGeo, leafMat(THREE.FrontSide));
  const leafBack = new THREE.Mesh(leafGeo, leafMat(THREE.BackSide));
  leafFront.castShadow = true;
  book.add(leafFront, leafBack);
  leafFront.visible = leafBack.visible = false;

  // A warm lamp up and to the left, casting soft shadows; a cool sky fill so shadows are not black.
  const key = new THREE.SpotLight("#ffd9a6", 46, 12, 0.62, 0.55, 1.6);
  key.position.set(-1.5, 3.3, 1.5);
  key.target.position.set(0.1, 0, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.015;
  key.shadow.radius = 4;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 7;
  // The ground colour lights faces that point down, like the underside of a page as it turns: warm
  // light bounced off the table, not black.
  const fill = new THREE.HemisphereLight("#dfe3ff", "#9a7b5c", 0.8);
  const rim = new THREE.DirectionalLight("#fff1dc", 0.5);
  rim.position.set(2, 1.4, -2);
  const rig = new THREE.Group();
  rig.add(key, key.target, fill, rim, rim.target);
  stage.scene.add(rig);
  if (opts.external) {
    // The owner scales the scene to pixels: the lamp shines evenly instead of fading with distance.
    key.decay = 0;
    key.distance = 0;
    key.intensity = 3.1;
    key.castShadow = false;
    // On the shelf and in flight the cover faces the reader's right: a soft light from the front right
    // keeps it leather-coloured, not black, as it turns toward them.
    fill.intensity = 0.95;
    rim.intensity = 0.95;
    rim.position.set(2.4, 1.2, 1.4);
  }

  // The table: it shows only the book's shadow, so the book sits on linen by day and dark wood by night.
  const table = new THREE.Mesh(new THREE.PlaneGeometry(8, 8).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ opacity: 0.2 }));
  table.position.y = -C - 0.001;
  table.receiveShadow = true;
  table.visible = !opts.external;
  book.add(table);

  const reduced = prefersReducedMotion();
  let coverAngle = reduced ? Math.PI : 0;
  let coverHeld = !reduced && Boolean(opts.holdCover);
  let spread = 0;
  let turning: { from: number; to: number; theta: number; dir: 1 | -1 } | null = null;
  let tiltX = 0;
  let aimX = 0;

  const heights = (s: number) => {
    const done = spreads > 1 ? s / (spreads - 1) : 0;
    const tl = T * (0.04 + 0.22 * done);
    return { tl, tr: T - tl };
  };

  /**
   * A stack of leaves under the curved top page: head and tail ends, and the outer (fore-) edge.
   * The page lines on the ends follow the curve, as real leaves do.
   */
  function blockGeometry(side: 1 | -1, h: number): THREE.BufferGeometry {
    const pos: number[] = [];
    const uvs: number[] = [];
    const nrm: number[] = [];
    const lines = (h / T) * 2.2;
    const quad = (a: number[], b: number[], c: number[], d: number[], ua: number[], ub: number[], uc: number[], ud: number[], n: number[]) => {
      // Wind the two triangles so they face along `n`.
      const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const cross = [ab[1] * ac[2] - ab[2] * ac[1], ab[2] * ac[0] - ab[0] * ac[2], ab[0] * ac[1] - ab[1] * ac[0]];
      const facing = cross[0] * n[0] + cross[1] * n[1] + cross[2] * n[2] >= 0;
      const tris = facing ? [a, b, c, a, c, d] : [a, c, b, a, d, c];
      const tuv = facing ? [ua, ub, uc, ua, uc, ud] : [ua, uc, ub, ua, ud, uc];
      tris.forEach((p, k) => {
        pos.push(...p);
        uvs.push(...tuv[k]);
        nrm.push(...n);
      });
    };
    for (const zs of [-1, 1]) {
      const z = (zs * PH) / 2;
      for (let k = 0; k < SEG; k++) {
        const d0 = (k / SEG) * PW;
        const d1 = ((k + 1) / SEG) * PW;
        const y0 = surface(d0, h);
        const y1 = surface(d1, h);
        quad(
          [side * d0, 0, z],
          [side * d1, 0, z],
          [side * d1, y1, z],
          [side * d0, y0, z],
          [k / SEG, 0],
          [(k + 1) / SEG, 0],
          [(k + 1) / SEG, lines],
          [k / SEG, lines],
          [0, 0, zs]
        );
      }
    }
    const ye = surface(PW, h);
    quad(
      [side * PW, 0, -PH / 2],
      [side * PW, 0, PH / 2],
      [side * PW, ye, PH / 2],
      [side * PW, ye, -PH / 2],
      [0, 0],
      [1, 0],
      [1, lines],
      [0, lines],
      [side, 0, 0]
    );
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
    return geo;
  }

  /** Lay a page plane over its stack, following the curve. */
  function shapePage(mesh: THREE.Mesh, side: 1 | -1, h: number) {
    const geo = mesh.geometry as THREE.PlaneGeometry;
    const p = geo.attributes.position as THREE.BufferAttribute;
    const puv = geo.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const s = puv.getX(i);
      const d = side === 1 ? s * PW : (1 - s) * PW;
      p.setXYZ(i, side * d, surface(d, h) + 0.0015, -(puv.getY(i) - 0.5) * PH);
    }
    p.needsUpdate = true;
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
  }

  function setPage(mesh: THREE.Mesh, i: number, flip = false) {
    const mat = mesh.material as THREE.MeshStandardMaterial;
    mat.map = flip ? flippedTexture(i) : pageTexture(i);
    if (mat.emissiveIntensity > 0) mat.emissiveMap = mat.map;
    mat.needsUpdate = true;
  }

  function showSpread(s: number) {
    setPage(leftPage, s === 0 ? -1 : 2 * s - 1);
    setPage(rightPage, 2 * s);
    opts.onSpread?.(s, spreads);
  }

  function placeStacks(s: number) {
    const { tl, tr } = heights(s);
    leftBlock.geometry.dispose();
    leftBlock.geometry = blockGeometry(-1, tl);
    rightBlock.geometry.dispose();
    rightBlock.geometry = blockGeometry(1, tr);
    shapePage(leftPage, -1, tl);
    shapePage(rightPage, 1, tr);
    shapeRibbon(tr);
    // The cover turns about a hinge halfway up the closed book, so it lands flat beside it.
    const closed = surface(PW * 0.5, tr);
    coverPivot.position.set(0, closed / 2, 0);
    cover.position.set(boardW / 2, closed / 2 + C / 2, 0);
  }

  function bendLeaf(theta: number, s: number) {
    const { tl, tr } = heights(s);
    const p = leafGeo.attributes.position as THREE.BufferAttribute;
    // Near flat on either side, the leaf takes that side's curve; in the air it is held only at the spine.
    const wR = Math.max(0, Math.cos(theta));
    const wL = Math.max(0, -Math.cos(theta));
    for (let i = 0; i < p.count; i++) {
      const d = uv.getX(i) * PW;
      const z = -(uv.getY(i) - 0.5) * PH;
      // The free edge lags the spine, so the leaf curls as it lifts.
      const phi = theta - 0.55 * Math.sin(theta) * Math.pow(d / PW, 1.4);
      const lift = wR * (surface(d, tr) - 0.006) + wL * (surface(d, tl) - 0.006);
      p.setXYZ(i, d * Math.cos(phi), 0.01 + d * Math.sin(phi) + lift, z);
    }
    p.needsUpdate = true;
    leafGeo.computeVertexNormals();
    leafGeo.computeBoundingSphere();
  }

  function startTurn(dir: 1 | -1) {
    if (turning || coverAngle < Math.PI - 0.01) return;
    const to = spread + dir;
    if (to < 0 || to >= spreads) return;
    if (dir === 1) {
      // Leaving leaf: current right page on its front, next left page on its back.
      setPage(leafFront, 2 * spread);
      setPage(leafBack, 2 * to - 1, true);
      setPage(rightPage, 2 * to);
    } else {
      setPage(leafFront, 2 * to);
      setPage(leafBack, to === 0 ? -1 : 2 * spread - 1, true);
      setPage(leftPage, to === 0 ? -1 : 2 * to - 1);
    }
    leafFront.visible = leafBack.visible = true;
    if (reduced) {
      spread = to;
      leafFront.visible = leafBack.visible = false;
      placeStacks(spread);
      showSpread(spread);
      stage.invalidate();
      return;
    }
    turning = { from: spread, to, theta: dir === 1 ? 0 : Math.PI, dir };
    bendLeaf(turning.theta, spread);
    stage.invalidate();
  }

  // The near edge of a book lying flat looks wider than the far one, hence the generous margin.
  const stopFit = opts.external ? () => {} : fitCamera(stage, {
    halfW: boardW + 0.06,
    halfH: (boardD + 0.1) * 0.5 * Math.sin(0.9) + 0.14,
    elevation: 0.9,
    margin: 1.24,
    target: new THREE.Vector3(0, 0, 0.04)
  });
  // fitCamera frames the book lying flat. An upright board reaches about one page width above the
  // table, so ease the camera back and up while the board stands, by the sine of its angle.
  const fitTarget = new THREE.Vector3(0, 0, 0.04);
  const fitPos = new THREE.Vector3();
  const stopBase = opts.external
    ? () => {}
    : stage.onResize(() => {
        fitPos.copy(stage.camera.position);
        pullBack(coverAngle);
      });
  function pullBack(angle: number) {
    if (opts.external) return;
    const f = Math.max(0, Math.sin(angle));
    const aim = fitTarget.clone().add(new THREE.Vector3(0, 0.3 * f, -0.12 * f));
    stage.camera.position.copy(fitPos).sub(fitTarget).multiplyScalar(1 + 0.32 * f).add(aim);
    stage.camera.lookAt(aim);
  }
  const closed0 = surface(PW * 0.5, heights(0).tr);
  const spineH = closed0 + 2 * C;
  const [spC, spCtx] = makeCanvas(1024, Math.max(64, Math.round((1024 * spineH) / boardD)));
  paintLeather(spCtx, spC.width, spC.height, seed + 7, "bare", coverColour);
  {
    const w = spC.width;
    const h = spC.height;
    // The spine is the same leather as on the shelf: lay the colour back over the grain.
    spCtx.globalAlpha = 0.45;
    spCtx.fillStyle = coverColour;
    spCtx.fillRect(0, 0, w, h);
    spCtx.globalAlpha = 1;
    const shade = spCtx.createLinearGradient(0, 0, 0, h);
    shade.addColorStop(0, "rgba(0,0,0,0.45)");
    shade.addColorStop(0.3, "rgba(255,255,255,0.10)");
    shade.addColorStop(0.55, "rgba(0,0,0,0)");
    shade.addColorStop(1, "rgba(0,0,0,0.5)");
    spCtx.fillStyle = shade;
    spCtx.fillRect(0, 0, w, h);
    spCtx.fillStyle = "rgba(232,212,154,0.85)";
    for (const x of [0.07, 0.085, 0.915, 0.93]) spCtx.fillRect(Math.round(x * w), 0, 3, h);
    spCtx.fillStyle = "#e8d49a";
    spCtx.textAlign = "center";
    spCtx.textBaseline = "middle";
    let size = Math.round(h * 0.42);
    spCtx.font = `600 ${size}px ${font}`;
    while (spCtx.measureText(opts.title).width > w * 0.72 && size > 10) {
      size -= 2;
      spCtx.font = `600 ${size}px ${font}`;
    }
    spCtx.fillText(opts.title, w / 2, h / 2);
  }
  /**
   * The flap of a soft cover, as on the Nag Hammadi codices: it grows from the back cover, wraps up the
   * fore-edge and lies over the front cover, a thong at its tip tying the book shut. Two hinges:
   *   a  where the strip leaves the back cover (90 deg: up the fore-edge; 0: flat on the table)
   *   b  where the triangular flap meets the strip (90 deg: folded over the cover; 0: straight on)
   * Opening, the flap lifts off the cover and stands up (b to 0), then folds down to the right (a to
   * 0); only then can the cover open.
   */
  let flapOpen = limp && !prefersReducedMotion() ? 0 : 1;
  const flapGeo = new THREE.BufferGeometry();
  flapGeo.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(8 * 3), 3));
  flapGeo.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 0, 1, 0.3, 0, 0.3, 1, 0.85, 0.3, 0.85, 0.7, 1, 0.47, 1, 0.53], 2));
  flapGeo.setIndex([0, 2, 1, 1, 2, 3, 2, 4, 3, 3, 4, 5, 4, 6, 5, 5, 6, 7]);
  const flap = new THREE.Mesh(flapGeo, new THREE.MeshStandardMaterial({ map: leatherMat.map, roughness: 0.7, side: THREE.DoubleSide }));
  flap.castShadow = true;
  flap.visible = limp;
  book.add(flap);
  const shapeFlap = (f: number) => {
    if (!limp) return;
    const ease = (t: number) => t * t * (3 - 2 * t);
    const b = (Math.PI / 2) * (1 - ease(Math.min(1, f / 0.5)));
    const a = (Math.PI / 2) * (1 - ease(Math.max(0, (f - 0.5) / 0.5)));
    const closedTop = surface(PW * 0.5, heights(0).tr);
    const h1 = closedTop + 2 * C + 0.004; // the strip covers the fore-edge of the shut book
    const lt = boardW * 0.24; // the triangular flap
    const lthong = 0.12; // the thong at its tip
    const ax = boardW + 0.004;
    const ay = -C;
    const bx = ax + h1 * Math.cos(a);
    const by = ay + h1 * Math.sin(a);
    const a2 = a + b;
    const lift = 0.003; // keeps the flap just off the cover it lies on
    const tx = bx + lt * Math.cos(a2);
    const ty = by + lt * Math.sin(a2) + lift * Math.sin(b);
    const ex = tx + lthong * Math.cos(a2);
    const ey = ty + lthong * Math.sin(a2);
    const half = boardD / 2;
    const p = flapGeo.attributes.position as THREE.BufferAttribute;
    p.setXYZ(0, ax, ay, -half);
    p.setXYZ(1, ax, ay, half);
    p.setXYZ(2, bx, by, -half);
    p.setXYZ(3, bx, by, half);
    p.setXYZ(4, tx, ty, -half * 0.18);
    p.setXYZ(5, tx, ty, half * 0.18);
    p.setXYZ(6, ex, ey, -0.012);
    p.setXYZ(7, ex, ey, 0.012);
    p.needsUpdate = true;
    flapGeo.computeVertexNormals();
    flapGeo.computeBoundingSphere();
  };
  shapeFlap(flapOpen);

  // The page's own spine, turned to lie along the book: its height runs head to tail, its width across.
  let spineCanvas: HTMLCanvasElement = spC;
  if (opts.spineArt) {
    const art = opts.spineArt;
    const [rot, rotCtx] = makeCanvas(art.height, art.width);
    rotCtx.translate(0, art.width);
    rotCtx.rotate(-Math.PI / 2);
    rotCtx.drawImage(art, 0, 0);
    spineCanvas = rot;
  }
  const spineMat = new THREE.MeshStandardMaterial({ map: canvasTexture(spineCanvas, renderer), roughness: 0.6 });
  // Unlit, the spine is its picture and nothing else: no lamp, no tone curve. Lit, it is leather.
  spineMat.emissiveMap = spineMat.map;
  spineMat.emissive.setScalar(1);
  spineMat.toneMapped = false;
  /**
   * The spine is a strip of leather joined to the back board along one edge and to the cover's hinge
   * edge along the other. Shut, it is the flat spine; as the cover turns it stretches across, so no gap
   * opens at the hinge; open, it folds away under the binding. Rebuilt whenever the cover moves.
   */
  spineMat.side = THREE.DoubleSide;
  const spineGeo = new THREE.BufferGeometry();
  spineGeo.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(12), 3));
  spineGeo.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  spineGeo.setIndex([0, 2, 1, 0, 3, 2]);
  const spine = new THREE.Mesh(spineGeo, spineMat);
  const hingeR = closed0 / 2 + C; // the cover's outer face turns about the pivot at this radius
  const shapeSpine = (angle: number) => {
    const ex = -hingeR * Math.sin(angle) - 0.003;
    const ey = closed0 / 2 + hingeR * Math.cos(angle);
    const pos = spineGeo.attributes.position as THREE.BufferAttribute;
    const zh = -boardD / 2; // head
    const zt = boardD / 2; // tail
    // u runs head to tail, v from the back board (bottom) to the cover's edge (top), as the picture does.
    pos.setXYZ(0, -0.003, -C, zh);
    pos.setXYZ(1, -0.003, -C, zt);
    pos.setXYZ(2, ex, ey, zt);
    pos.setXYZ(3, ex, ey, zh);
    pos.needsUpdate = true;
    spineGeo.computeVertexNormals();
    spineGeo.computeBoundingSphere();
    spine.visible = Math.hypot(ex + 0.003, ey + C) > 0.004;
  };
  // Lit, the picture keeps most of its own brightness and the lamp adds shading on top: the spine
  // never turns darker or greyer than it was on the page.
  const setLit = (t: number) => {
    spineMat.color.setScalar(0.5 * t);
    spineMat.emissiveIntensity = 1 - 0.42 * t;
    // The boards and page edges come in the same way: their own picture first, the lamp's shading after.
    for (const m of boardMats) {
      m.color.copy(m.userData.base as THREE.Color).multiplyScalar(t);
      m.emissiveIntensity = 1 - 0.8 * t;
    }
    // The brass bosses grow in with the light: the flat spine on the page has none.
    const g = Math.max(0.001, t * t * (3 - 2 * t));
    for (const b of bosses) b.scale.setScalar(g);
  };
  const boardMats: THREE.MeshStandardMaterial[] = [];
  if (opts.external) {
    for (const m of [leatherMat, bareMat, leatherEdge, edgeMat]) {
      m.userData.base = m.color.clone();
      if (m.map) m.emissiveMap = m.map;
      m.emissive.copy(m.map ? new THREE.Color(1, 1, 1) : m.color);
      boardMats.push(m);
    }
  }
  setLit(opts.external ? 0 : 1);
  shapeSpine(coverAngle);
  book.add(spine);

  placeStacks(0);
  showSpread(0);
  setPage(pastedown, -1);
  coverPivot.rotation.z = coverAngle;

  const stopFrame = stage.onFrame((dt) => {
    let moving = false;
    let m: boolean;
    if (!coverHeld && flapOpen < 1) {
      flapOpen = Math.min(1, flapOpen + dt / 1.1);
      shapeFlap(flapOpen);
      moving = true;
    }
    if (!coverHeld && flapOpen >= 0.97 && coverAngle < Math.PI) {
      [coverAngle, m] = approach(coverAngle, Math.PI, 2.6, dt);
      if (Math.PI - coverAngle < 0.002) coverAngle = Math.PI;
      coverPivot.rotation.z = coverAngle;
      shapeSpine(coverAngle);
      moving ||= m;
    }
    // The pastedown is the left page of the first spread. The left stack and page appear only once
    // leaves have been turned onto it, so nothing pokes through the board while it comes down.
    leftBlock.visible = leftPage.visible = coverAngle >= Math.PI && (spread > 0 || (turning !== null && turning.from > 0));
    for (const hb of headbands) hb.visible = coverAngle > Math.PI * 0.92;
    // The spine shows only while the book is shut; open, it lies under the binding.

    pullBack(coverAngle);
    if (turning) {
      const goal = turning.dir === 1 ? Math.PI : 0;
      turning.theta += (goal - turning.theta) * (1 - Math.exp(-5.5 * dt)) + turning.dir * dt * 0.6;
      const done = turning.dir === 1 ? turning.theta >= Math.PI - 0.01 : turning.theta <= 0.01;
      bendLeaf(Math.min(Math.PI, Math.max(0, turning.theta)), turning.from);
      if (done) {
        spread = turning.to;
        turning = null;
        leafFront.visible = leafBack.visible = false;
        placeStacks(spread);
        showSpread(spread);
      }
      moving = true;
    }
    [tiltX, m] = approach(tiltX, aimX, 4, dt);
    moving ||= m;
    if (!opts.external) book.rotation.y = tiltX;
    return moving;
  });

  // Tap the right page to go on, the left page to go back; swipe works too. Arrow keys from the host.
  const el = stage.canvas;
  let downX: number | null = null;
  const onDown = (e: PointerEvent) => {
    downX = e.clientX;
  };
  const onUp = (e: PointerEvent) => {
    if (downX == null) return;
    const r = el.getBoundingClientRect();
    const dx = e.clientX - downX;
    downX = null;
    if (Math.abs(dx) > 30) startTurn(dx < 0 ? 1 : -1);
    else startTurn(e.clientX - r.left > r.width / 2 ? 1 : -1);
  };
  const onMove = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    aimX = ((e.clientX - r.left) / r.width - 0.5) * 0.18;
    stage.invalidate();
  };
  if (!opts.external) {
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointermove", onMove);
  }
  stage.invalidate();

  return {
    turn: startTurn,
    book,
    rig,
    dims: { boardW, boardD, closed: closed0, C, flapReach: limp ? closed0 + 2 * C + boardW * 0.24 + 0.12 : 0 },
    setScale(px: number) {
      key.shadow.camera.near = 0.5 * px;
      key.shadow.camera.far = 10 * px;
      key.shadow.normalBias = 0.015 * px;
      key.shadow.camera.updateProjectionMatrix();
    },
    setGrounded(on: boolean) {
      table.visible = on;
      // Shadows are worth their cost only once the book lies on the desk.
      key.castShadow = on;
      ribbon.visible = on && bound;
      stage.invalidate();
    },
    setLit,
    openCover() {
      coverHeld = false;
      stage.invalidate();
    },
    /**
     * A material's shader compiles the first time it is drawn, and the frame waits for it. The parts that
     * appear as the cover opens (headbands, left page) and the lamp's shadow, switched on when the book lands
     * (which changes every material's shader), each cost a stalled frame. Compile them all now, for both
     * lamp states. compile() covers hidden parts too, and compileAsync lets the browser work off the main thread.
     */
    async prewarm() {
      const casting = key.castShadow;
      try {
        key.castShadow = true;
        await stage.renderer.compileAsync(stage.scene, stage.camera);
        key.castShadow = false;
        await stage.renderer.compileAsync(stage.scene, stage.camera);
      } finally {
        key.castShadow = casting;
      }
    },
    dispose() {
      stopFrame();
      stopFit();
      stopBase();
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointermove", onMove);
      texCache.forEach((t) => t.dispose());
      flipCache.forEach((t) => t.dispose());
    }
  };
}
