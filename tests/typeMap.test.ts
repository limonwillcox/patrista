import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { chapterOffsets, type Meta, type TypeEntry } from "../src/api/connections";
import { THEMES, THEME_OF } from "../src/data/typeThemes";
import {
  FULL,
  arcHeight,
  arcPoint,
  chapterAt,
  chapterSpan,
  clampView,
  frameForStop,
  levelFor,
  nearestArc,
  panBy,
  pickFeatured,
  placeFromParam,
  placeLabels,
  placeParam,
  positioner,
  toX,
  typeArcs,
  viewTransform,
  visiblePieces,
  splitCubic,
  typesThrough,
  zoomAt
} from "../src/lib/typeMap";

const read = <T,>(name: string) => JSON.parse(readFileSync(join(__dirname, "..", "public", "connections", name), "utf8")) as T;
const types = read<TypeEntry[]>("types.json");
const meta = read<Meta>("meta.json");
const offsets = chapterOffsets(meta);
const total = offsets[offsets.length - 1];

describe("themes", () => {
  it("give every type on the site exactly one known theme", () => {
    const known = new Set(THEMES.map((t) => t.id));
    for (const t of types) expect(known.has(THEME_OF[t.id]), t.id).toBe(true);
  });

  it("name no type that is not on the site", () => {
    const ids = new Set(types.map((t) => t.id));
    for (const id of Object.keys(THEME_OF)) expect(ids.has(id), id).toBe(true);
  });
});

describe("the view", () => {
  it("stays on the line and no narrower than a few chapters", () => {
    expect(clampView({ a: -0.2, b: 0.3 }, total)).toEqual({ a: 0, b: 0.5 });
    expect(clampView({ a: 0.9, b: 1.3 }, total).b).toBeCloseTo(1);
    const tiny = clampView({ a: 0.5, b: 0.5 }, total);
    expect((tiny.b - tiny.a) * total).toBeCloseTo(3);
    expect(panBy(FULL, 0.2, total)).toEqual(FULL);
  });

  it("zooms about the place under the pointer", () => {
    const v = zoomAt(FULL, 0.25, 0.5, total);
    expect(v.b - v.a).toBeCloseTo(0.5);
    // 0.25 was a quarter of the way across, and still is.
    expect((0.25 - v.a) / (v.b - v.a)).toBeCloseTo(0.25);
    expect(zoomAt(v, 0.3, 10, total)).toEqual(FULL);
  });

  it("draws book groups, then books, then chapters, as it narrows", () => {
    expect(levelFor(FULL, total)).toBe("groups");
    expect(levelFor({ a: 0, b: 200 / total }, total)).toBe("books");
    expect(levelFor({ a: 0, b: 30 / total }, total)).toBe("chapters");
  });

  it("frames a trail stop with the passage before it", () => {
    const ps = [0.01, 0.2, 0.8];
    const whole = frameForStop(ps, 0, total);
    expect(whole.a).toBeLessThanOrEqual(0.01);
    expect(whole.b).toBeGreaterThanOrEqual(0.8);
    const second = frameForStop(ps, 2, total);
    expect(second.a).toBeLessThanOrEqual(0.01);
    expect(second.b).toBeGreaterThanOrEqual(0.2);
    expect(second.b).toBeLessThan(0.8);
    expect(frameForStop(ps, 4, total)).toEqual(whole);
  });
});

describe("arcs", () => {
  it("join each type's passages in canonical order", () => {
    const pos = positioner(meta, offsets);
    const arcs = typeArcs(types, pos);
    expect(arcs.length).toBe(types.reduce((n, t) => n + Math.max(0, t.ranges.length - 1), 0));
    for (const a of arcs) expect(a.p1).toBeGreaterThanOrEqual(a.p0);
  });

  it("move with the view by one transform, keeping their shape", () => {
    const width = 1000;
    const pad = 20;
    const base = 300;
    const max = 200;
    const v = { a: 0.2, b: 0.45 };
    const { s, tx, ty } = viewTransform(v, width, pad, base);
    // An arc from 0.25 to 0.3, drawn for the whole Bible, then moved by the transform...
    const xb0 = pad + 0.25 * (width - 2 * pad);
    const xb1 = pad + 0.3 * (width - 2 * pad);
    const hb = arcHeight(xb1 - xb0, max, width - 2 * pad);
    // ...lands where drawing it afresh for the view would put it.
    const x0 = toX(v, 0.25, width, pad);
    const x1 = toX(v, 0.3, width, pad);
    expect(s * xb0 + tx).toBeCloseTo(x0);
    expect(s * xb1 + tx).toBeCloseTo(x1);
    expect(base - (s * (base - hb) + ty)).toBeCloseTo(arcHeight(x1 - x0, max, width - 2 * pad));
  });

  it("rise to their height at the middle and are found near the pointer", () => {
    const h = arcHeight(200, 150, 1000);
    const [x, y] = arcPoint(100, 300, 200, h, 0.5);
    expect(x).toBeCloseTo(200);
    expect(y).toBeCloseTo(200 - h);
    const a = { x0: 100, x1: 300, h };
    const b = { x0: 400, x1: 420, h: arcHeight(20, 150, 1000) };
    expect(nearestArc([a, b], 200, 200 - h + 3, 200, 10)).toBe(a);
    expect(nearestArc([a, b], 200, 60, 200, 10)).toBeNull();
    // An arc as wide as the map is the full height; one running far off screen rises steeply from its end.
    expect(arcHeight(1000, 150, 1000)).toBe(150);
    const far = { x0: 500, x1: 60000, h: arcHeight(59500, 150, 1000) };
    const [, nearTop] = arcPoint(far.x0, far.x1, 200, far.h, 0.002);
    expect(nearTop).toBeLessThan(200);
    expect(nearestArc([far], 501, 150, 200, 10)).toBe(far);
  });
});

describe("the line", () => {
  it("knows the chapter at a place, and back", () => {
    const exodus14 = chapterSpan(offsets, 2, 14);
    expect(chapterAt(meta, offsets, (exodus14[0] + exodus14[1]) / 2)).toEqual({ book: 2, chapter: 14 });
    expect(chapterAt(meta, offsets, 0)).toEqual({ book: 1, chapter: 1 });
    expect(chapterAt(meta, offsets, 1)).toEqual({ book: 66, chapter: 22 });
    expect(placeFromParam(meta, placeParam(meta, 2, 14))).toEqual({ book: 2, chapter: 14 });
    expect(placeFromParam(meta, "ex.99")).toBeNull();
    expect(placeFromParam(meta, "nonsense")).toBeNull();
  });

  it("finds the types through a chapter", () => {
    const through = typesThrough(types, 2, 14).map((t) => t.id);
    expect(through).toContain("04:exodus-through-water");
  });

  it("skips a label that would overlap the one before", () => {
    const kept = placeLabels([
      { x: 10, w: 20 },
      { x: 25, w: 20 },
      { x: 60, w: 20 }
    ]);
    expect(kept.map((k) => k.x)).toEqual([10, 60]);
  });
});

describe("drawing only what shows", () => {
  it("splits a curve into two that meet on it", () => {
    const [a, b] = splitCubic([[0, 0], [0, -10], [10, -10], [10, 0]], 0.5);
    expect(a[3]).toEqual(b[0]);
    expect(a[3][0]).toBeCloseTo(5);
    expect(a[3][1]).toBeCloseTo(-7.5);
  });

  it("draws a short arc whole and cuts a towering one down to its ends on screen", () => {
    expect(visiblePieces(100, 300, 400, 80, 1000, 480)).toHaveLength(1);
    const tall = visiblePieces(500, 90000, 400, 36000, 1000, 480);
    // Only the end at x = 500 is on screen, and its piece stays near it and reaches above the top.
    expect(tall).toHaveLength(1);
    const piece = tall[0];
    expect(piece[0]).toEqual([500, 400]);
    expect(piece[3][1]).toBeLessThan(0);
    expect(Math.abs(piece[3][0] - 500)).toBeLessThan(1000);
    // Both ends off the same side: nothing.
    expect(visiblePieces(-900, -300, 400, 200, 1000, 480)).toHaveLength(0);
  });
});

describe("the featured type", () => {
  it("is a different good first picture each visit: three passages or more, Old Testament into New", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const t = pickFeatured(types, () => i / 20)!;
      seen.add(t.id);
      expect(t.ranges.length).toBeGreaterThanOrEqual(3);
      const books = t.ranges.map((r) => Math.floor(r[0] / 1_000_000));
      expect(Math.min(...books)).toBeLessThanOrEqual(39);
      expect(Math.max(...books)).toBeGreaterThanOrEqual(40);
    }
    expect(seen.size).toBeGreaterThan(10);
    expect(pickFeatured([])).toBeNull();
  });
});
