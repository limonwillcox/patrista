import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ARK,
  BOARD,
  BRASEN_ALTAR,
  COURT,
  FINISHED_PAIRS,
  GOATS_HAIR,
  GUESSES,
  INCENSE_ALTAR,
  LINEN,
  MERCY_SEAT,
  MOST_HOLY,
  PATH,
  PIECES,
  SABBATH_PAIR,
  SPEECHES,
  TABLE,
  TENT,
  refVids,
  type Pair,
  type Quote,
  type Ref
} from "../src/data/tabernacle";

/*
 * The tabernacle model must keep to the text. The numbers below are the ones Exodus states; if the data
 * module changes one, this fails. Quotations and shared Hebrew words are checked against the repo's KJV.
 */

const ROOT = join(__dirname, "..");
const books = new Map<string, { chapters: string[][] }>();
function verse(r: Ref, v = r.verse): string {
  if (!books.has(r.book)) books.set(r.book, JSON.parse(readFileSync(join(ROOT, "Bibles", "KJV", r.book + ".json"), "utf8")));
  const text = books.get(r.book)!.chapters[r.chapter - 1]?.[v - 1];
  if (!text) throw new Error("No verse " + r.book + " " + r.chapter + ":" + v);
  return text;
}
const plain = (s: string) => s.replace(/[‘’]/g, "'");

describe("stated measures (Exodus, KJV)", () => {
  it("court: 100 × 50, 5 high, a 20-cubit gate, 15 each side", () => {
    expect([COURT.length, COURT.breadth, COURT.height]).toEqual([100, 50, 5]);
    expect([COURT.gate, COURT.gateSide, COURT.gateHeight]).toEqual([20, 15, 5]);
    expect(COURT.gateSide * 2 + COURT.gate).toBe(COURT.breadth);
    expect(COURT.pillars).toEqual({ south: 20, north: 20, west: 10, eachSideOfGate: 3, gate: 4 });
    // 60 pillars by the text; the chosen spacing must put exactly that many round the fence.
    const counted = Object.values(COURT.pillars).reduce((a, b) => a + b, 0) + COURT.pillars.eachSideOfGate;
    expect(counted).toBe(60);
    expect((2 * (COURT.length + COURT.breadth)) / COURT.pillarSpacing).toBe(60);
  });

  it("boards: 10 high, 1.5 broad; 20 + 20 + 6 + 2 corners; two sockets each, a hundred with the vail's", () => {
    expect([BOARD.height, BOARD.breadth]).toEqual([10, 1.5]);
    expect([BOARD.south, BOARD.north, BOARD.west, BOARD.corners]).toEqual([20, 20, 6, 2]);
    const boards = BOARD.south + BOARD.north + BOARD.west + BOARD.corners;
    expect(boards * BOARD.socketsPerBoard + TENT.veilPillars).toBe(100); // Exod 38:27
    expect(TENT.doorPillars).toBe(5);
  });

  it("the tent and the most holy place", () => {
    expect(TENT.innerLength).toBe(30);
    expect(TENT.height).toBe(10);
    expect(TENT.veilFromDoor).toBe(20);
    expect(MOST_HOLY).toEqual({ length: 10, breadth: 10, height: 10 });
  });

  it("curtains", () => {
    expect([LINEN.count, LINEN.length, LINEN.breadth, LINEN.perSet]).toEqual([10, 28, 4, 5]);
    expect([GOATS_HAIR.count, GOATS_HAIR.length, GOATS_HAIR.breadth]).toEqual([11, 30, 4]);
  });

  it("furniture", () => {
    expect([ARK.length, ARK.breadth, ARK.height]).toEqual([2.5, 1.5, 1.5]);
    expect([MERCY_SEAT.length, MERCY_SEAT.breadth]).toEqual([2.5, 1.5]);
    expect([TABLE.length, TABLE.breadth, TABLE.height]).toEqual([2, 1, 1.5]);
    expect([INCENSE_ALTAR.length, INCENSE_ALTAR.breadth, INCENSE_ALTAR.height]).toEqual([1, 1, 2]);
    expect([BRASEN_ALTAR.length, BRASEN_ALTAR.breadth, BRASEN_ALTAR.height]).toEqual([5, 5, 3]);
    expect(BRASEN_ALTAR.grateHeight).toBe(BRASEN_ALTAR.height / 2);
  });

  it("the numbers are in the verses they are taken from", () => {
    const has = (r: Ref, words: string[]) => words.forEach((w) => expect(verse(r)).toContain(w));
    has({ book: "ex", chapter: 25, verse: 10 }, ["two cubits and a half", "a cubit and a half the breadth", "a cubit and a half the height"]);
    has({ book: "ex", chapter: 25, verse: 23 }, ["two cubits", "a cubit the breadth", "a cubit and a half the height"]);
    has({ book: "ex", chapter: 26, verse: 16 }, ["Ten cubits", "a cubit and a half"]);
    has({ book: "ex", chapter: 26, verse: 18 }, ["twenty boards"]);
    has({ book: "ex", chapter: 26, verse: 22 }, ["six boards"]);
    has({ book: "ex", chapter: 26, verse: 23 }, ["two boards"]);
    has({ book: "ex", chapter: 26, verse: 2 }, ["eight and twenty cubits", "four cubits"]);
    has({ book: "ex", chapter: 26, verse: 8 }, ["thirty cubits", "four cubits"]);
    has({ book: "ex", chapter: 27, verse: 1 }, ["five cubits long", "five cubits broad", "three cubits"]);
    has({ book: "ex", chapter: 27, verse: 18 }, ["an hundred cubits", "fifty every where", "five cubits"]);
    has({ book: "ex", chapter: 27, verse: 16 }, ["twenty cubits", "pillars shall be four"]);
    has({ book: "ex", chapter: 30, verse: 2 }, ["A cubit shall be the length", "a cubit the breadth", "two cubits shall be the height"]);
    has({ book: "ex", chapter: 38, verse: 27 }, ["an hundred sockets"]);
  });
});

describe("pieces, path and guesses", () => {
  it("every verse cited exists", () => {
    const all: Ref[] = [
      ...PIECES.flatMap((p) => p.refs),
      ...GUESSES.flatMap((g) => g.refs),
      ...PATH.map((s) => s.lineRef),
      ...SPEECHES.map((s) => s.span)
    ];
    for (const r of all) {
      verse(r);
      if (r.to) {
        expect(r.to).toBeGreaterThan(r.verse);
        verse(r, r.to);
      }
    }
  });

  it("the priest's path runs gate → altar → laver → holy place → vail → ark", () => {
    expect(PATH.map((s) => s.piece)).toEqual(["gate", "brasenAltar", "laver", "door", "table", "lampstand", "incenseAltar", "veil", "ark"]);
    const ids = new Set(PIECES.map((p) => p.id));
    PATH.forEach((s) => expect(ids.has(s.piece)).toBe(true));
  });

  it("quoted lines on the path are in their verses", () => {
    for (const s of PATH) {
      const m = s.line.match(/^"(.*)"$/);
      if (!m) continue;
      const text = plain(Array.from({ length: (s.lineRef.to ?? s.lineRef.verse) - s.lineRef.verse + 1 }, (_, i) => verse(s.lineRef, s.lineRef.verse + i)).join(" "));
      // A quotation may start mid-sentence with a capital, and end with its own full stop.
      for (const part of m[1].split(" … ")) expect(text.toLowerCase()).toContain(part.replace(/[.,]$/, "").toLowerCase());
    }
  });

  it("a type is linked only where the Fathers' type covers that very passage", () => {
    const types: { id: string; ranges: [number, number][] }[] = JSON.parse(
      readFileSync(join(ROOT, "public", "connections", "types.json"), "utf8")
    );
    for (const p of PIECES.filter((x) => x.typeId)) {
      const t = types.find((x) => x.id === p.typeId);
      expect(t, p.typeId).toBeTruthy();
      const overlaps = p.refs.some((r) => {
        const [a, b] = refVids(r);
        return t!.ranges.some(([c, d]) => a <= d && c <= b);
      });
      expect(overlaps, p.id + " → " + p.typeId).toBe(true);
    }
  });
});

describe("the creation in the text", () => {
  const quoted = (q: Quote) => expect(plain(verse(q.ref))).toContain(plain(q.text));
  const strongsOf = (r: Ref): string[] => {
    const d = JSON.parse(readFileSync(join(ROOT, "public", "strongs", "kjv", r.book, r.chapter + ".json"), "utf8"));
    return (d.v[String(r.verse)] as [string, string][]).map(([, s]) => s);
  };
  const checkPair = (p: Pair) => {
    quoted(p.a);
    quoted(p.b);
    for (const w of p.shared) {
      expect(p.a.text.toLowerCase()).toContain(w.a);
      expect(p.b.text.toLowerCase()).toContain(w.b);
      if (w.strongs) {
        expect(strongsOf(p.a.ref), p.a.text + " " + w.strongs).toContain(w.strongs);
        expect(strongsOf(p.b.ref), p.b.text + " " + w.strongs).toContain(w.strongs);
      }
    }
  };

  it("the LORD speaks to Moses seven times in Exodus 25–31, and the seventh is the sabbath", () => {
    expect(SPEECHES).toHaveLength(7);
    SPEECHES.forEach((s) => quoted(s.quote));
    expect(SPEECHES.map((s) => s.quote.ref.chapter + ":" + s.quote.ref.verse)).toEqual(["25:1", "30:11", "30:17", "30:22", "30:34", "31:1", "31:12"]);
    // No other speech in 25–31 that the list misses.
    const found: string[] = [];
    for (let c = 25; c <= 31; c++) {
      for (let v = 1; ; v++) {
        let t: string;
        try {
          t = verse({ book: "ex", chapter: c, verse: v });
        } catch {
          break;
        }
        if (/the LORD (spake|said) unto Moses/.test(t)) found.push(c + ":" + v);
      }
    }
    expect(found).toEqual(["25:1", "30:11", "30:17", "30:22", "30:34", "31:1", "31:12"]);
    expect(verse({ book: "ex", chapter: 31, verse: 13 })).toContain("sabbaths");
    checkPair(SABBATH_PAIR);
  });

  it("the finished work echoes Genesis 1:31 – 2:3", () => {
    expect(FINISHED_PAIRS.length).toBeGreaterThan(0);
    FINISHED_PAIRS.forEach(checkPair);
  });
});
