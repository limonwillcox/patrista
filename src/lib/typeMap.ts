import { canonPosition, splitVid, type Meta, type TypeEntry } from "../api/connections";
import { trailPassages, typeFathers } from "./typeTrail";

/*
 * The types map (/types): the Bible as one line from Genesis to Revelation, each type a chain of arcs joining
 * its passages. Positions on the line run 0 (Genesis 1:1) to 1 (the end of Revelation), by chapters. The view
 * is the stretch of the line on screen; zoom changes only its width, because the Bible is one-dimensional,
 * and what the map draws changes with it (book groups, then books, then chapters). Everything here is pure,
 * for tests/typeMap.test.ts; src/components/typeMap/TypeMap.tsx draws it.
 */

export type View = { a: number; b: number };
export const FULL: View = { a: 0, b: 1 };

/** One arc: from one of a type's passages to the next, as positions on the line. */
export type Arc = { t: TypeEntry; i: number; p0: number; p1: number };

export function typeArcs(types: TypeEntry[], pos: (vid: number) => number): Arc[] {
  return types.flatMap((t) => {
    const ps = trailPassages(t).map((r) => pos(r[0]));
    return ps.slice(1).map((p1, i) => ({ t, i, p0: ps[i], p1 }));
  });
}

/** A function from a verse id to its place on the line. */
export function positioner(meta: Meta, offsets: number[]): (vid: number) => number {
  return (vid) => canonPosition(meta, vid, offsets);
}

/** Narrowest view: about this many chapters. */
export const MIN_CHAPTERS = 3;

/** The view kept on the line, no narrower than a few chapters and no wider than the whole Bible. */
export function clampView(v: View, totalChapters: number): View {
  const min = MIN_CHAPTERS / totalChapters;
  let span = Math.min(1, Math.max(min, v.b - v.a));
  let a = v.a;
  if (!Number.isFinite(a)) a = 0;
  // Keep the centre where it was when only the width changed.
  if (v.b - v.a !== span) a = (v.a + v.b) / 2 - span / 2;
  a = Math.min(Math.max(a, 0), 1 - span);
  span = Math.min(span, 1);
  return { a, b: a + span };
}

/** Zoom by `factor` (below 1 is in) about the place `p`, which stays where it is on screen. */
export function zoomAt(v: View, p: number, factor: number, totalChapters: number): View {
  const span = v.b - v.a;
  const f = (p - v.a) / span;
  const next = Math.min(1, Math.max(MIN_CHAPTERS / totalChapters, span * factor));
  const a = p - f * next;
  return clampView({ a, b: a + next }, totalChapters);
}

export function panBy(v: View, dp: number, totalChapters: number): View {
  return clampView({ a: v.a + dp, b: v.b + dp }, totalChapters);
}

/** A view that holds p0 to p1 with a margin each side, at least `minChapters` wide. */
export function frame(p0: number, p1: number, totalChapters: number, minChapters = 24, margin = 0.12): View {
  const lo = Math.min(p0, p1);
  const hi = Math.max(p0, p1);
  const span = Math.max((hi - lo) * (1 + 2 * margin), minChapters / totalChapters);
  const mid = (lo + hi) / 2;
  return clampView({ a: mid - span / 2, b: mid + span / 2 }, totalChapters);
}

/**
 * Where the map looks at a stop on a type's trail. The overview and "in Christ" show the whole type. A passage
 * is shown with the one before it, so the arc just followed is on screen; the first passage on its own.
 */
export function frameForStop(passages: number[], stop: number, totalChapters: number): View {
  if (!passages.length) return FULL;
  const n = passages.length;
  if (stop <= 0 || stop > n) return frame(passages[0], passages[n - 1], totalChapters, 40, 0.06);
  const here = passages[stop - 1];
  const prev = stop >= 2 ? passages[stop - 2] : here;
  return frame(prev, here, totalChapters, 40, 0.22);
}

/** What the line shows at this width: the book groups, the books, or the chapters. */
export type Level = "groups" | "books" | "chapters";
export function levelFor(v: View, totalChapters: number): Level {
  const chapters = (v.b - v.a) * totalChapters;
  return chapters > 420 ? "groups" : chapters > 70 ? "books" : "chapters";
}

/** Screen x of a place on the line, for a map `width` wide with `pad` each side. */
export const toX = (v: View, p: number, width: number, pad: number) => pad + ((p - v.a) / (v.b - v.a)) * (width - 2 * pad);
export const toP = (v: View, x: number, width: number, pad: number) => v.a + ((x - pad) / (width - 2 * pad)) * (v.b - v.a);

/**
 * How high an arc rises: in proportion to the distance it spans, so an arc as wide as the map is `max` high.
 * Being exactly proportional, zooming scales every arc about the line without changing its shape, so the map
 * can draw the arcs once and move them with one transform. Zoomed in, an arc whose other end is far off screen
 * rises steeply off the top instead of flattening into a line across the map.
 */
export const arcHeight = (dx: number, max: number, width: number) => (Math.abs(dx) / width) * max;

/**
 * The transform that takes arcs drawn for the whole Bible to the view `v`: x stretches by the zoom and
 * shifts, and y stretches by the same amount about the line, so each arc keeps its shape.
 */
export function viewTransform(v: View, width: number, pad: number, base: number): { s: number; tx: number; ty: number } {
  const s = 1 / (v.b - v.a);
  const inner = width - 2 * pad;
  return { s, tx: pad * (1 - s) - v.a * s * inner, ty: base * (1 - s) };
}

/**
 * A point on an arc drawn as `M x0,base C x0,base-k x1,base-k x1,base` with k = h·4/3, so that its top is h
 * above the line. t runs 0 to 1.
 */
export function arcPoint(x0: number, x1: number, base: number, h: number, t: number): [number, number] {
  const k = (h * 4) / 3;
  const u = 1 - t;
  const x = u * u * u * x0 + 3 * u * u * t * x0 + 3 * u * t * t * x1 + t * t * t * x1;
  const y = base - 3 * u * t * k;
  return [x, y];
}

/** A cubic Bézier as its four points. */
export type Cubic = [[number, number], [number, number], [number, number], [number, number]];

/** Split a cubic at t (de Casteljau): the part before t and the part after. */
export function splitCubic(c: Cubic, t: number): [Cubic, Cubic] {
  const lerp = (a: [number, number], b: [number, number]): [number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const [p0, p1, p2, p3] = c;
  const a = lerp(p0, p1);
  const b = lerp(p1, p2);
  const d = lerp(p2, p3);
  const e = lerp(a, b);
  const f = lerp(b, d);
  const g = lerp(e, f);
  return [
    [p0, a, e, g],
    [g, f, d, p3]
  ];
}

/**
 * The parts of an arc worth drawing on a map `width` by `height`. Zoomed in, an arc can be tens of thousands
 * of pixels long with only its two ends on screen, and stroking all of it stalls the browser. So a tall arc is
 * cut down to its ends, up to just above the top edge, and an end off either side is left out.
 */
export function visiblePieces(x0: number, x1: number, base: number, h: number, width: number, height: number): Cubic[] {
  const lo = Math.min(x0, x1);
  const hi = Math.max(x0, x1);
  if (hi < -20 || lo > width + 20) return [];
  const k = (h * 4) / 3;
  const whole: Cubic = [
    [x0, base],
    [x0, base - k],
    [x1, base - k],
    [x1, base]
  ];
  if (h <= height * 3) return [whole];
  // Near an end the arc rises about 4h·t, so it leaves the top by t = (base + margin) / 4h.
  const tv = Math.min(0.5, ((base + 40) / (4 * h)) * 1.25);
  const out: Cubic[] = [];
  if (x0 > -20 && x0 < width + 20) out.push(splitCubic(whole, tv)[0]);
  if (x1 > -20 && x1 < width + 20) out.push(splitCubic(whole, 1 - tv)[1]);
  return out;
}

export const arcPath = (x0: number, x1: number, base: number, h: number) => {
  const k = (h * 4) / 3;
  return `M${x0},${base} C${x0},${base - k} ${x1},${base - k} ${x1},${base}`;
};

/** The arc nearest the pointer, if one is within `within` pixels. Arcs are given in screen units. */
export function nearestArc<T extends { x0: number; x1: number; h: number }>(
  arcs: T[],
  px: number,
  py: number,
  base: number,
  within: number
): T | null {
  let best: T | null = null;
  let bestD = within * within;
  for (const a of arcs) {
    const lo = Math.min(a.x0, a.x1) - within;
    const hi = Math.max(a.x0, a.x1) + within;
    if (px < lo || px > hi || py > base + within || py < base - a.h - within) continue;
    // Only the part of a tall arc near the map can be pointed at: sample its two ends up to the top edge.
    const tv = Math.min(0.5, (base + within + 20) / (4 * Math.max(a.h, 1)));
    for (let s = 0; s <= 48; s++) {
      const t = s <= 24 ? (s / 24) * tv : 1 - ((48 - s) / 24) * tv;
      const [x, y] = arcPoint(a.x0, a.x1, base, a.h, t);
      const d = (x - px) ** 2 + (y - py) ** 2;
      if (d < bestD) {
        bestD = d;
        best = a;
      }
    }
  }
  return best;
}

/** The book and chapter at a place on the line. */
export function chapterAt(meta: Meta, offsets: number[], p: number): { book: number; chapter: number } {
  const total = offsets[offsets.length - 1];
  const c = Math.min(total - 1, Math.max(0, Math.floor(p * total)));
  let book = 1;
  while (book < offsets.length - 1 && offsets[book] <= c) book++;
  return { book, chapter: c - offsets[book - 1] + 1 };
}

/** Where a chapter starts and ends on the line. */
export function chapterSpan(offsets: number[], book: number, chapter: number): [number, number] {
  const total = offsets[offsets.length - 1];
  const start = offsets[book - 1] + chapter - 1;
  return [start / total, (start + 1) / total];
}

/** The types with a passage in this chapter. */
export function typesThrough(types: TypeEntry[], book: number, chapter: number): TypeEntry[] {
  const at = book * 1000 + chapter;
  return types.filter((t) =>
    t.ranges.some(([a, b]) => {
      const A = splitVid(a);
      const B = splitVid(b);
      return A.bookNumber * 1000 + A.chapter <= at && at <= B.bookNumber * 1000 + Math.min(B.chapter, 999);
    })
  );
}

/** A place in the URL: "ex.14" ↔ Exodus 14. */
export function placeFromParam(meta: Meta, raw: string | null): { book: number; chapter: number } | null {
  const m = raw?.match(/^([a-z0-9]+)\.(\d+)$/);
  if (!m) return null;
  const b = meta.books.find((x) => x.id === m[1]);
  const chapter = Number(m[2]);
  if (!b || chapter < 1 || chapter > b.chapters) return null;
  return { book: b.n, chapter };
}
export const placeParam = (meta: Meta, book: number, chapter: number) => meta.books[book - 1].id + "." + chapter;

/** Every Father who drew a type on the map, with how many types, most first. */
export function fathersOnMap(types: TypeEntry[]): { name: string; count: number }[] {
  const n = new Map<string, number>();
  for (const t of types) for (const f of typeFathers(t)) n.set(f, (n.get(f) ?? 0) + 1);
  return [...n].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/**
 * A type to draw clearly on the resting map, as a first thing to follow: a different one each visit. Only a
 * type that makes a good first picture is chosen: three passages or more, from the Old Testament into the New.
 * `random` is Math.random, or a fixed number in tests.
 */
export function pickFeatured(types: TypeEntry[], random: () => number = Math.random): TypeEntry | null {
  const good = types.filter((t) => {
    const ps = trailPassages(t);
    return ps.length >= 3 && Math.floor(ps[0][0] / 1_000_000) <= 39 && Math.floor(ps[ps.length - 1][0] / 1_000_000) >= 40;
  });
  const pool = good.length ? good : types;
  return pool.length ? pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))] : null;
}

/** Places on the line that open a page of their own. The tabernacle is the first. */
export const PLACES: { label: string; from: number; to: number; href: string }[] = [
  { label: "The tabernacle", from: 2025001, to: 2040038, href: "/tabernacle" }
];

/** Labels laid left to right, each skipped if it would overlap one already placed. */
export function placeLabels<T extends { x: number; w: number }>(items: T[], gap = 6): T[] {
  const out: T[] = [];
  const sorted = [...items].sort((a, b) => a.x - b.x);
  let right = -Infinity;
  for (const it of sorted) {
    const left = it.x - it.w / 2;
    if (left >= right + gap) {
      out.push(it);
      right = it.x + it.w / 2;
    }
  }
  return out;
}
