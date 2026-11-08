import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { TypeEntry } from "../src/api/connections";
import type { ChapterCitations } from "../src/api/scripture";
import { drawnBy, passageChapters, quoteAnchor, quoteForPassage, stopFromParam, trailPassages, typeFathers, verseWindow } from "../src/lib/typeTrail";

const type = (over: Partial<TypeEntry>): TypeEntry => ({ id: "04:x", label: "x", def: "", christ: "", where: [], ranges: [], ...over });

describe("how many Fathers drew a type", () => {
  it("counts each Father once, whatever note follows his name", () => {
    const t = type({
      where: [
        "Augustine, *C. Faust.* 12.9 — “a”",
        "Augustine, *City of God* 15.7 — “b”",
        "Irenaeus (attributed), *Frag.* 4 — “c”",
        "Ambrose (quoted in Cassian, *Inc.* 7.25) — “d”"
      ]
    });
    expect(typeFathers(t)).toEqual(["Augustine", "Irenaeus", "Ambrose"]);
    expect(drawnBy(t)).toBe("Drawn by 3 Fathers");
    expect(drawnBy(type({ where: ["Cyril, *Cat.* 13.20 — “a”"] }))).toBe("Drawn by 1 Father");
  });

  it("gives every type on the site at least one Father", () => {
    const types = JSON.parse(readFileSync(join(__dirname, "..", "public", "connections", "types.json"), "utf8")) as TypeEntry[];
    for (const t of types) expect(typeFathers(t).length, t.id).toBeGreaterThanOrEqual(1);
  });
});

describe("a trail", () => {
  it("runs Genesis to Revelation and keeps its stop in range", () => {
    const t = type({ ranges: [[58011004, 58011004], [1004001, 1004016], [40023035, 40023035]] });
    expect(trailPassages(t).map((r) => r[0])).toEqual([1004001, 40023035, 58011004]);
    expect(stopFromParam(null, 4)).toBeNull();
    expect(stopFromParam("3", 4)).toBe(3);
    expect(stopFromParam("9", 4)).toBe(4);
    expect(stopFromParam("0", 4)).toBe(1);
    expect(stopFromParam("x", 4)).toBe(1);
  });

  it("reads a quotation's paragraph from its reader link", () => {
    expect(quoteAnchor("/fathers/augustine/city-of-god/chapter-15/#ch-15-p17")).toEqual({ work: "city-of-god", chapter: 15, para: 16 });
    expect(quoteAnchor("/fathers/augustine/city-of-god/chapter-15/")).toBeNull();
  });

  it("ties a Father's line to a passage only when his quoted paragraph cites it", () => {
    const t = type({
      where: ["Cyril, *Cat.* 13.20 — “a longer line here”", "Augustine, *Civ.* 15.7 — “short”", "Origen, *Hom.* 1 — “x”"],
      links: [
        { label: "", href: "/fathers/cyril/cat/chapter-8/#ch-13-p20" },
        { label: "", href: "/fathers/augustine/civ/chapter-15/#ch-15-p7" },
        { label: "", href: "/fathers/origen/hom/chapter-1/#ch-1-p1" }
      ],
      ranges: [[1004001, 1004016]]
    });
    const cite = (work: string, chapter: number, paras: number[]) => ["", "", "", 1, "", 1, work, chapter, paras] as ChapterCitations[string][number];
    const cites = new Map<number, ChapterCitations | null>([
      [4, { "4:8": [cite("cat", 13, [19])], "4:10": [cite("civ", 15, [6]), cite("hom", 1, [3])] }]
    ]);
    // Both Cyril and Augustine cite Genesis 4 in the quoted paragraph; the shorter line wins. Origen's paragraph does not.
    expect(quoteForPassage(t, [1004001, 1004016], cites)).toEqual({ index: 1, vid: 1004010 });
    // Outside the passage, nothing.
    expect(quoteForPassage(t, [1004011, 1004016], cites)).toBeNull();
  });

  it("shows a few verses, from the Father's verse in a long passage", () => {
    expect(verseWindow([1022001, 1022003])).toEqual({ chapter: 22, from: 1, to: 3, more: false });
    expect(verseWindow([1006001, 1009999])).toEqual({ chapter: 6, from: 1, to: 6, more: true });
    expect(verseWindow([1006001, 1009999], 1008011)).toEqual({ chapter: 8, from: 11, to: 16, more: true });
    expect(passageChapters([1006001, 1009999])).toEqual([6, 7, 8, 9]);
  });
});
