/** Canvas drawing for manuscripts: papyrus, parchment and leather surfaces, and real text laid out as ink. */

export type Surface = "papyrus" | "parchment";

/** Small seeded random, so the same work always gets the same fibres and stains. */
export function rng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

export function seedOf(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  return [c, ctx];
}

/** Papyrus: strips laid across each other, so fibres run both ways, with uneven colour. */
export function paintPapyrus(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number): void {
  const r = rng(seed);
  ctx.fillStyle = "#d9c08a";
  ctx.fillRect(0, 0, w, h);
  // Broad strips of the stalk.
  for (let x = 0; x < w; ) {
    const sw = 18 + r() * 40;
    ctx.fillStyle = `rgba(${150 + r() * 40},${115 + r() * 30},${55 + r() * 25},${0.08 + r() * 0.1})`;
    ctx.fillRect(x, 0, sw, h);
    x += sw;
  }
  for (let y = 0; y < h; ) {
    const sh = 18 + r() * 40;
    ctx.fillStyle = `rgba(${120 + r() * 50},${90 + r() * 35},${45 + r() * 20},${0.05 + r() * 0.08})`;
    ctx.fillRect(0, y, w, sh);
    y += sh;
  }
  // Fine fibres.
  ctx.lineWidth = 1;
  for (let i = 0; i < (w * h) / 900; i++) {
    const horiz = r() < 0.5;
    const x = r() * w;
    const y = r() * h;
    const len = 20 + r() * 160;
    ctx.strokeStyle = `rgba(${90 + r() * 60},${65 + r() * 40},${30 + r() * 20},${0.06 + r() * 0.12})`;
    ctx.beginPath();
    ctx.moveTo(x, y);
    if (horiz) ctx.lineTo(x + len, y + (r() - 0.5) * 3);
    else ctx.lineTo(x + (r() - 0.5) * 3, y + len);
    ctx.stroke();
  }
  vignette(ctx, w, h, "rgba(90,60,25,0.35)");
}

/** Parchment: smooth skin with soft blotches, darker towards the edges. */
export function paintParchment(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number): void {
  const r = rng(seed);
  ctx.fillStyle = "#efe2c4";
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) {
    const x = r() * w;
    const y = r() * h;
    const rad = 40 + r() * 220;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    const a = 0.03 + r() * 0.06;
    g.addColorStop(0, `rgba(${170 + r() * 40},${140 + r() * 30},${90 + r() * 30},${a})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  // Hair-follicle speckle.
  for (let i = 0; i < (w * h) / 2500; i++) {
    ctx.fillStyle = `rgba(110,80,40,${0.04 + r() * 0.08})`;
    ctx.fillRect(r() * w, r() * h, 1 + r(), 1 + r());
  }
  vignette(ctx, w, h, "rgba(120,85,40,0.28)");
}

export function paintSurface(surface: Surface, ctx: CanvasRenderingContext2D, w: number, h: number, seed: number): void {
  if (surface === "papyrus") paintPapyrus(ctx, w, h, seed);
  else paintParchment(ctx, w, h, seed);
}

function vignette(ctx: CanvasRenderingContext2D, w: number, h: number, edge: string): void {
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, edge);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/**
 * Leather for a codex board. "tooled": blind-tooled frames and a gilt chi-rho (parchment codex).
 * "limp": a plain wrapper with one ruled frame (papyrus codex). "bare": grain only, for the inside faces.
 */
export function paintLeather(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  seed: number,
  style: "tooled" | "limp" | "bare",
  base?: string
): void {
  const r = rng(seed);
  const plain = style !== "tooled";
  ctx.fillStyle = base ?? (plain ? "#6b4a2b" : "#4a2615");
  ctx.fillRect(0, 0, w, h);
  // Grain: fine pores, plus a few long creases where the skin was worked.
  for (let i = 0; i < (w * h) / 300; i++) {
    ctx.fillStyle = `rgba(${r() < 0.5 ? "0,0,0" : "255,220,170"},${0.02 + r() * 0.05})`;
    ctx.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
  }
  ctx.lineWidth = 1;
  for (let i = 0; i < 26; i++) {
    const x = r() * w;
    const y = r() * h;
    ctx.strokeStyle = `rgba(0,0,0,${0.05 + r() * 0.07})`;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + (r() - 0.5) * 60, y + (r() - 0.5) * 60, x + (r() - 0.5) * 120, y + (r() - 0.5) * 120);
    ctx.stroke();
  }
  // Wear: the corners and edges rub lighter with handling.
  const wear = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.72);
  wear.addColorStop(0, "rgba(255,230,190,0)");
  wear.addColorStop(1, "rgba(255,230,190,0.1)");
  ctx.fillStyle = wear;
  ctx.fillRect(0, 0, w, h);
  vignette(ctx, w, h, "rgba(0,0,0,0.35)");
  if (style === "bare") return;
  if (plain) {
    ctx.strokeStyle = "rgba(30,15,5,0.5)";
    ctx.lineWidth = 3;
    ctx.strokeRect(w * 0.08, h * 0.06, w * 0.84, h * 0.88);
    return;
  }
  const gold = "rgba(226,190,110,0.85)";
  ctx.strokeStyle = "rgba(20,8,2,0.55)";
  ctx.lineWidth = 4;
  ctx.strokeRect(w * 0.07, h * 0.05, w * 0.86, h * 0.9);
  ctx.strokeRect(w * 0.13, h * 0.1, w * 0.74, h * 0.8);
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(w * 0.1, h * 0.075, w * 0.8, h * 0.85);
  // Diagonal blind tooling in the panel corners.
  ctx.strokeStyle = "rgba(20,8,2,0.45)";
  ctx.beginPath();
  ctx.moveTo(w * 0.13, h * 0.1);
  ctx.lineTo(w * 0.87, h * 0.9);
  ctx.moveTo(w * 0.87, h * 0.1);
  ctx.lineTo(w * 0.13, h * 0.9);
  ctx.stroke();
  chiRho(ctx, w / 2, h / 2, Math.min(w, h) * 0.17, gold);
}

/** The chi-rho monogram: a P (rho) laid over an X (chi). */
export function chiRho(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.lineWidth = size * 0.12;
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.6, cy - size * 0.6);
  ctx.lineTo(cx + size * 0.6, cy + size * 0.6);
  ctx.moveTo(cx + size * 0.6, cy - size * 0.6);
  ctx.lineTo(cx - size * 0.6, cy + size * 0.6);
  ctx.moveTo(cx, cy + size);
  ctx.lineTo(cx, cy - size);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + size * 0.28, cy - size * 0.68, size * 0.3, -Math.PI / 2 - 0.3, Math.PI / 2 + 0.1);
  ctx.stroke();
  ctx.restore();
}

export const INK = "#2b1a0e";
export const RUBRIC = "#9b2a12";

export type TextStyle = { font: string; size: number; lineHeight: number };

/** Break paragraphs into lines that fit `width`. An empty string marks a paragraph break. */
export function wrapLines(ctx: CanvasRenderingContext2D, paras: string[], width: number, style: TextStyle): string[] {
  ctx.font = `${style.size}px ${style.font}`;
  const out: string[] = [];
  paras.forEach((para, i) => {
    const words = para.replace(/\s+/g, " ").trim().split(" ");
    let line = "";
    for (const word of words) {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > width && line) {
        out.push(line);
        line = word;
      } else line = test;
    }
    if (line) out.push(line);
    if (i < paras.length - 1) out.push("");
  });
  return out;
}

/** Split lines into blocks of `perBlock`, dropping a paragraph break that would open a block. */
export function chunk(lines: string[], perBlock: number): string[][] {
  const blocks: string[][] = [];
  let cur: string[] = [];
  for (const line of lines) {
    if (!cur.length && line === "") continue;
    cur.push(line);
    if (cur.length >= perBlock) {
      blocks.push(cur);
      cur = [];
    }
  }
  if (cur.length) blocks.push(cur);
  return blocks;
}

/**
 * Draw one column of ink. A scribe's hand is not perfectly level, so each line sits a hair off
 * the ruling. The first line of the first block can carry a red initial.
 */
export function drawColumn(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y: number,
  style: TextStyle,
  seed: number,
  opts: { initial?: boolean; heading?: string; width: number }
): void {
  const r = rng(seed);
  let top = y;
  if (opts.heading) {
    ctx.fillStyle = RUBRIC;
    ctx.font = `600 ${Math.round(style.size * 0.92)}px ${style.font}`;
    ctx.textBaseline = "alphabetic";
    const head = opts.heading.toUpperCase();
    ctx.fillText(head, x + (opts.width - ctx.measureText(head).width) / 2, top + style.size);
    top += style.lineHeight * 1.6;
  }
  ctx.textBaseline = "alphabetic";
  // The red initial stands two lines tall, so both of those lines start after it. Its own width sets the
  // indent: a fixed "M" was narrower than a G or a W, and the second line ran into the letter.
  const bigFont = `700 ${Math.round(style.lineHeight * 2.05)}px ${style.font}`;
  const initial = opts.initial && /^[A-Za-z]/.test(lines[0] ?? "") ? lines[0][0] : "";
  ctx.font = bigFont;
  const indent = initial ? ctx.measureText(initial).width + style.size * 0.35 : 0;
  /** Write a line from `at`, narrowing it a little if it would run past the column. */
  const write = (text: string, at: number) => {
    const room = opts.width - at;
    const w = ctx.measureText(text).width;
    if (at > 0 && w > room && room > 0) {
      ctx.translate(at, 0);
      ctx.scale(room / w, 1);
      ctx.fillText(text, 0, 0);
    } else ctx.fillText(text, at, 0);
  };
  lines.forEach((line, i) => {
    const ly = top + style.size + i * style.lineHeight;
    ctx.save();
    ctx.translate(x + (r() - 0.5) * 1.2, ly + (r() - 0.5) * 1.4);
    ctx.rotate((r() - 0.5) * 0.004);
    if (i === 0 && initial) {
      ctx.font = bigFont;
      ctx.fillStyle = RUBRIC;
      ctx.fillText(initial, 0, style.lineHeight * 0.85);
      ctx.font = `${style.size}px ${style.font}`;
      ctx.fillStyle = INK;
      ctx.globalAlpha = 0.92;
      write(line.slice(1), indent);
    } else {
      ctx.font = `${style.size}px ${style.font}`;
      ctx.fillStyle = INK;
      ctx.globalAlpha = 0.86 + r() * 0.1;
      write(line, i === 1 && initial ? indent : 0);
    }
    ctx.restore();
  });
}

/** Wait for the reading face so the manuscripts are not drawn in a fallback serif. */
export async function readyFont(): Promise<string> {
  const family = '"Junicode", Georgia, serif';
  try {
    await document.fonts.load('32px "Junicode"');
  } catch {
    /* fall back silently */
  }
  return family;
}
