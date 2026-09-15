import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { bookById, loadBooks } from "../src/links/books";
import {
  centuryFromDeathYear,
  locOf,
  locsOverlap,
  refOverlapsVerse
} from "../src/links/loc";
import { createLinkStore, loadLinkStore } from "../src/links/store";
import type { Link } from "../src/links/types";

const ROOT = join(import.meta.dirname, "..");
const FIXTURE = join(ROOT, "data/links/fixtures/matthew-16-18.json");

function fixtureLinks(): Link[] {
  const parsed = JSON.parse(readFileSync(FIXTURE, "utf8")) as { links: Link[] };
  return parsed.links;
}

describe("loc encoding", () => {
  it("encodes loc as chapter * 1_000_000 + verse", () => {
    expect(locOf(16, 18)).toBe(16 * 1_000_000 + 18);
    expect(locOf(1, 1)).toBe(1_000_001);
    expect(locOf(150, 6)).toBe(150_000_006);
  });

  it("treats overlapping verse spans as overlap and adjacent spans as disjoint", () => {
    const mt1818 = { start: locOf(16, 18), end: locOf(16, 18) };
    expect(locsOverlap(locOf(16, 13), locOf(16, 20), mt1818.start, mt1818.end)).toBe(true);
    expect(locsOverlap(locOf(16, 16), locOf(16, 19), mt1818.start, mt1818.end)).toBe(true);
    expect(locsOverlap(locOf(16, 13), locOf(16, 17), mt1818.start, mt1818.end)).toBe(false);
    expect(locsOverlap(locOf(16, 19), locOf(16, 20), mt1818.start, mt1818.end)).toBe(false);
  });

  it("requires the same bookId for a verse hit", () => {
    const ref = { bookId: "mt", locStart: locOf(16, 16), locEnd: locOf(16, 19) };
    expect(refOverlapsVerse(ref, "mt", 16, 18)).toBe(true);
    expect(refOverlapsVerse(ref, "mt", 16, 16)).toBe(true);
    expect(refOverlapsVerse(ref, "mt", 16, 15)).toBe(false);
    expect(refOverlapsVerse(ref, "mk", 16, 18)).toBe(false);
  });
});

describe("century from deathYear", () => {
  it("is ceil(deathYear / 100) clamped to 1–6", () => {
    expect(centuryFromDeathYear(99)).toBe(1);
    expect(centuryFromDeathYear(165)).toBe(2);
    expect(centuryFromDeathYear(254)).toBe(3);
    expect(centuryFromDeathYear(258)).toBe(3);
    expect(centuryFromDeathYear(373)).toBe(4);
    expect(centuryFromDeathYear(407)).toBe(5);
    expect(centuryFromDeathYear(430)).toBe(5);
    expect(centuryFromDeathYear(461)).toBe(5);
    expect(centuryFromDeathYear(604)).toBe(6);
    expect(centuryFromDeathYear(749)).toBe(6);
  });
});

describe("KJV book table", () => {
  it("numbers Matthew 40 (NT) and Genesis 1 (OT) from the KJV manifest", () => {
    const books = loadBooks(ROOT);
    expect(books.length).toBe(66);
    const gn = bookById(ROOT, "gn");
    const mt = bookById(ROOT, "mt");
    const re = bookById(ROOT, "re");
    expect(gn).toMatchObject({ bookId: "gn", bookNum: 1, canon: "ot", name: "Genesis" });
    expect(mt).toMatchObject({ bookId: "mt", bookNum: 40, canon: "nt", name: "Matthew" });
    expect(re).toMatchObject({ bookId: "re", bookNum: 66, canon: "nt" });
  });
});

describe("Mt 16:18 golden fixture", () => {
  it("has 8–15 handmade links across at least 3 centuries and 3 named fathers", () => {
    const links = fixtureLinks();
    expect(links.length).toBeGreaterThanOrEqual(8);
    expect(links.length).toBeLessThanOrEqual(15);

    const centuries = new Set(links.map((l) => l.century));
    expect(centuries.size).toBeGreaterThanOrEqual(3);

    const fathers = new Set(links.map((l) => l.fatherId));
    const named = ["origen", "cyprian", "augustine", "chrysostom", "leo"].filter((id) =>
      fathers.has(id)
    );
    expect(named.length).toBeGreaterThanOrEqual(3);

    for (const link of links) {
      expect(link.excerpt.length).toBeGreaterThan(40);
      expect(link.provenance).toMatch(/^(hcf|ecatena|catena-aurea|anf-fn|crowd)$/);
      expect(link.status).toMatch(/^(verified|crowd|rejected)$/);
      expect(link.century).toBe(centuryFromDeathYear(link.deathYear));
      expect(link.refs.length).toBeGreaterThan(0);
      for (const ref of link.refs) {
        expect(ref.locStart).toBe(locOf(ref.chapter, ref.verseStart));
        expect(ref.locEnd).toBe(locOf(ref.chapter, ref.verseEnd));
      }
    }
  });

  it("builds century → father → work → excerpt for Matthew 16:18", () => {
    const store = createLinkStore(fixtureLinks());
    const hits = store.getLinksForVerse("mt", 16, 18);
    expect(hits.length).toBeGreaterThanOrEqual(8);
    expect(hits.every((l) => l.status !== "rejected")).toBe(true);
    expect(
      hits.every((l) => l.refs.some((r) => refOverlapsVerse(r, "mt", 16, 18)))
    ).toBe(true);

    const tree = store.getTreeForVerse("mt", 16, 18);
    expect(tree.map((n) => n.century)).toEqual([...tree.map((n) => n.century)].sort((a, b) => a - b));
    expect(tree.length).toBeGreaterThanOrEqual(3);

    const fatherIds = tree.flatMap((c) => c.fathers.map((f) => f.fatherId));
    expect(fatherIds).toEqual(expect.arrayContaining(["origen", "cyprian"]));
    expect(fatherIds.some((id) => id === "augustine" || id === "chrysostom" || id === "leo")).toBe(
      true
    );

    const excerpts = tree.flatMap((c) =>
      c.fathers.flatMap((f) => f.works.flatMap((w) => w.links.map((l) => l.excerpt)))
    );
    expect(excerpts.some((e) => /upon this rock/i.test(e))).toBe(true);
    expect(excerpts.some((e) => /Peter/i.test(e))).toBe(true);
  });

  it("builds OT/NT → book → verse for the Peter confession section", () => {
    const store = createLinkStore(fixtureLinks());
    const sectionHits = store.getLinksForSection("mt.16.peters-confession");
    expect(sectionHits.length).toBeGreaterThan(0);

    const tree = store.getTreeForSection("mt.16.peters-confession");
    const canons = tree.map((t) => t.canon);
    expect(canons).toContain("nt");
    expect(canons).toEqual([...canons].sort((a, b) => {
      const order = { ot: 0, nt: 1, dt: 2 };
      return order[a] - order[b];
    }));

    const nt = tree.find((t) => t.canon === "nt");
    const mt = nt?.books.find((b) => b.bookId === "mt");
    expect(mt).toBeTruthy();
    expect(mt!.refs.some((r) => r.chapter === 16 && r.verseStart <= 18 && r.verseEnd >= 18)).toBe(
      true
    );
  });

  it("loads the ingested json/sqlite store with the fixture Mt 16:18 fathers still present", () => {
    const fromFixture = createLinkStore(fixtureLinks()).getTreeForVerse("mt", 16, 18);
    const fromDisk = loadLinkStore(ROOT).getTreeForVerse("mt", 16, 18);
    const fixtureFathers = fromFixture.flatMap((n) => n.fathers.map((f) => f.fatherId));
    const diskFathers = fromDisk.flatMap((n) => n.fathers.map((f) => f.fatherId));
    expect(diskFathers).toEqual(expect.arrayContaining(fixtureFathers));
    expect(fromDisk.map((n) => n.century)).toEqual(
      expect.arrayContaining(fromFixture.map((n) => n.century))
    );
  });
});
