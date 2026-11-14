import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import type { ChapterCitations, VerseCite } from "../src/api/scripture";
import { storyPassages } from "../src/components/FathersThread";
import { findChapterRefs, findScriptureRefs } from "../src/lib/scriptureRefs";
import { inStory, storyAt, storyChapters, storyRange, storyWhere, verseRuns, type StoryRow } from "../src/lib/stories";

const root = join(__dirname, "..");
const rows = (book: string) => JSON.parse(readFileSync(join(root, "public", "stories", book + ".json"), "utf8")) as StoryRow[];
const cite = (url: string, father: string, n = 1, focus = 1): VerseCite => [url, url, father, n, "…", focus, "w", 1, [0], []];

describe("the story list", () => {
  it("has every book, in order, with no story over another and none outside its book", () => {
    const manifest = JSON.parse(readFileSync(join(root, "Bibles", "KJV", "manifest.json"), "utf8")) as { id: string }[];
    expect(readdirSync(join(root, "public", "stories")).sort()).toEqual(manifest.map((b) => b.id + ".json").sort());
    for (const b of manifest) {
      const kjv = JSON.parse(readFileSync(join(root, "Bibles", "KJV", b.id + ".json"), "utf8")) as { chapters: string[][] };
      let last = [0, 0];
      for (const [c0, v0, c1, v1, title] of rows(b.id)) {
        expect(title.length, b.id + " " + c0 + ":" + v0).toBeGreaterThan(0);
        expect(c0 > last[0] || (c0 === last[0] && v0 > last[1]), b.id + " " + c0 + ":" + v0 + " starts after the last story").toBe(true);
        expect(c1 > c0 || (c1 === c0 && v1 >= v0), b.id + " " + c0 + ":" + v0 + " ends after it starts").toBe(true);
        expect(v0, b.id + " " + c0 + ":" + v0).toBeLessThanOrEqual(kjv.chapters[c0 - 1].length);
        expect(v1, b.id + " " + c1 + ":" + v1).toBeLessThanOrEqual(kjv.chapters[c1 - 1].length);
        last = [c1, v1];
      }
    }
  });

  it("joins the long stories", () => {
    expect(storyAt(rows("nm"), 16, 5)).toMatchObject({ fromChapter: 16, fromVerse: 1, toChapter: 16, toVerse: 50 });
    expect(storyAt(rows("nm"), 16, 33)?.title).toMatch(/Korah/);
    expect(storyAt(rows("gn"), 8, 4)).toMatchObject({ fromChapter: 6, fromVerse: 1, toChapter: 9, toVerse: 17, title: "The Flood" });
    expect(storyAt(rows("gn"), 19, 24)?.title).toBe("Sodom and Gomorrah");
    expect(storyAt(rows("gn"), 22, 13)?.title).toBe("The Offering of Isaac");
  });
});

describe("storyAt", () => {
  const list: StoryRow[] = [
    [1, 3, 1, 9, "A"],
    [2, 1, 3, 4, "B"]
  ];
  it("finds the story a verse is in", () => {
    expect(storyAt(list, 1, 3)?.title).toBe("A");
    expect(storyAt(list, 1, 9)?.title).toBe("A");
    expect(storyAt(list, 2, 40)?.title).toBe("B");
    expect(storyAt(list, 3, 4)?.title).toBe("B");
  });
  it("is null before the first story, between stories and after the last", () => {
    expect(storyAt(list, 1, 2)).toBeNull();
    expect(storyAt(list, 1, 10)).toBeNull();
    expect(storyAt(list, 3, 5)).toBeNull();
    expect(storyAt(null, 1, 1)).toBeNull();
  });
  it("names its chapters and range", () => {
    const b = storyAt(list, 2, 1)!;
    expect(storyChapters(b)).toEqual([2, 3]);
    expect(storyRange("Genesis", b)).toBe("Genesis 2:1–3:4");
    expect(storyRange("Genesis", storyAt(list, 1, 4)!)).toBe("Genesis 1:3–9");
    expect(inStory(b, 3, 4)).toBe(true);
    expect(inStory(b, 3, 5)).toBe(false);
  });
});

describe("where a passage lands in a story", () => {
  const one = storyAt([[16, 1, 16, 50, "Korah"]], 16, 1)!;
  const long = storyAt([[6, 1, 9, 17, "The Flood"]], 7, 1)!;
  it("writes verses as runs", () => {
    expect(verseRuns([3, 1, 2, 7, 7])).toBe("1–3, 7");
    expect(storyWhere([[16, 33]], one)).toBe("v. 33");
    expect(storyWhere([[16, 31], [16, 32], [16, 33], [16, 9]], one)).toBe("vv. 9, 31–33");
  });
  it("leads with the chapter in a story of several chapters", () => {
    expect(storyWhere([[7, 11], [7, 12], [8, 2]], long)).toBe("7:11–12, 8:2");
    expect(storyWhere([[7, 1], [7, 7]], long)).toBe("7:1, 7:7");
  });
  it("names a chapter cited as a whole", () => {
    expect(storyWhere([[16, 0]], one)).toBe("ch. 16");
    expect(storyWhere([[8, 0], [7, 4]], long)).toBe("7:4, ch. 8");
  });
});

describe("storyPassages", () => {
  const story = storyAt([[16, 1, 16, 35, "Korah"]], 16, 1)!;
  const chapter: ChapterCitations = {
    "16:1": [cite("/a", "Augustine", 1, 3)],
    "16:31": [cite("/a", "Augustine", 2, 3)],
    "16:33": [cite("/a", "Augustine", 1, 3), cite("/clement", "Clement of Rome")],
    "16:40": [cite("/outside", "Ambrose")],
    "16:0": [cite("/whole", "Jerome")],
    "17:8": [cite("/wrong-chapter", "Origen")]
  };
  it("gathers the story's verses, one entry per passage, the fullest first", () => {
    const got = storyPassages([[16, chapter]], story);
    expect(got.map((p) => p.key)).toEqual(["/a", "/clement", "/whole"]);
    expect(got[0]).toMatchObject({ n: 4, where: "vv. 1, 31, 33" });
    expect(got[1].where).toBe("v. 33");
    expect(got[2].where).toBe("ch. 16");
  });
  it("leaves out what the verse already shows", () => {
    expect(storyPassages([[16, chapter]], story, new Set(["/a"])).map((p) => p.key)).toEqual(["/clement", "/whole"]);
  });
  it("copes with a chapter that has no citations", () => {
    expect(storyPassages([[16, null]], story)).toEqual([]);
  });
});

describe("findChapterRefs", () => {
  it("finds a chapter cited with no verse", () => {
    expect(findChapterRefs("Gen. xxxvii.")).toMatchObject([{ book: "gn", chapter: 37 }]);
    expect(findChapterRefs("Comp. Num. 16; Heb. xi.")).toMatchObject([
      { book: "nm", chapter: 16 },
      { book: "hb", chapter: 11 }
    ]);
  });
  it("leaves references with a verse to findScriptureRefs", () => {
    for (const t of ["Gen. xxvii. 41, etc.", "Num. xvi. 33.", "Rom. 5:12-14", "Ex. ii. 14.", "Ps. cxix. 105"]) {
      expect(findChapterRefs(t), t).toEqual([]);
      expect(findScriptureRefs(t), t).toHaveLength(1);
    }
  });
  it("ignores capital numerals, impossible chapters, books of one chapter and other works", () => {
    expect(findChapterRefs("Luke I have set down")).toEqual([]);
    expect(findChapterRefs("Gen. lxx.")).toEqual([]);
    expect(findChapterRefs("Jude 8")).toEqual([]);
    expect(findChapterRefs("Orat. ii.; Hist. Ar. 7")).toEqual([]);
    expect(findChapterRefs("Gen. vital")).toEqual([]);
  });
});
