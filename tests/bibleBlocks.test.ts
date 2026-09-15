import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { chapterAsSingleSection, verseBlocks } from "../server/bibleBlocks";
import { johnChapterIndex } from "../server/johnIndex";
import type { QuoteTag, Topic } from "../server/types";

const ROOT = join(import.meta.dirname, "..");

describe("verseBlocks", () => {
  it("chunks Genesis 1 (31 verses) into 10 blocks with 28–31 absorbing verse 31", () => {
    const blocks = verseBlocks(1, 31, 3);
    expect(blocks).toHaveLength(10);
    expect(blocks[0]).toEqual({ start: 1, end: 3 });
    expect(blocks[8]).toEqual({ start: 25, end: 27 });
    expect(blocks[9]).toEqual({ start: 28, end: 31 });
  });

  it("absorbs a 1-verse remainder into the last block", () => {
    expect(verseBlocks(1, 7, 3)).toEqual([
      { start: 1, end: 3 },
      { start: 4, end: 7 }
    ]);
  });
});

describe("John section index", () => {
  it("builds prologue into six 3-verse blocks covering 1–18", () => {
    const ch1 = johnChapterIndex(ROOT).get(1)!;
    const prologue = ch1.sections.find((s) => s.id === "jo.1.prologue")!;
    expect(prologue.verses).toEqual({ start: 1, end: 18 });
    expect(prologue.blocks).toHaveLength(6);
    expect(prologue.blocks[0]!.id).toBe("jo.1.1-3");
    expect(prologue.blocks[5]!.id).toBe("jo.1.16-18");
    expect(prologue.blocks.map((b) => [b.start, b.end])).toEqual([
      [1, 3],
      [4, 6],
      [7, 9],
      [10, 12],
      [13, 15],
      [16, 18]
    ]);
  });

  it("covers every verse of John exactly once across sections", () => {
    const jo = JSON.parse(readFileSync(join(ROOT, "Bibles/KJV/jo.json"), "utf8")) as {
      chapters: string[][];
    };
    const index = johnChapterIndex(ROOT);
    for (let ch = 1; ch <= jo.chapters.length; ch++) {
      const n = jo.chapters[ch - 1]!.length;
      const covered = new Set<number>();
      for (const sec of index.get(ch)!.sections) {
        for (let v = sec.verses.start; v <= sec.verses.end; v++) covered.add(v);
      }
      expect([...covered].sort((a, b) => a - b)).toEqual(
        Array.from({ length: n }, (_, i) => i + 1)
      );
    }
  });

  it("chapterAsSingleSection matches the Genesis-1 pattern", () => {
    const idx = chapterAsSingleSection("gn", 1, 31, "Creation day frame");
    expect(idx.sections).toHaveLength(1);
    expect(idx.sections[0]!.blocks).toHaveLength(10);
    expect(idx.sections[0]!.blocks[9]).toMatchObject({ start: 28, end: 31, id: "gn.1.28-31" });
  });
});

describe("Chrysostom Homilies on John tags (John 1 start)", () => {
  it("tags reference real topics, sections, and ≥5-verse spans where intended", () => {
    const topics = JSON.parse(readFileSync(join(ROOT, "corpus/topics.json"), "utf8")) as Topic[];
    const topicIds = new Set(topics.map((t) => t.id));
    const file = JSON.parse(
      readFileSync(join(ROOT, "corpus/tags/homilies-on-john-and-hebrews.json"), "utf8")
    ) as { tags: QuoteTag[] };

    expect(file.tags.length).toBeGreaterThanOrEqual(8);
    const index = johnChapterIndex(ROOT);
    const sectionIds = new Set(
      [...index.values()].flatMap((ch) => ch.sections.map((s) => s.id))
    );
    const blockIds = new Set(
      [...index.values()].flatMap((ch) => ch.sections.flatMap((s) => s.blocks.map((b) => b.id)))
    );

    for (const tag of file.tags) {
      expect(tag.snippet.split(/(?<=[.!?])\s+/).length).toBeLessThanOrEqual(4);
      expect(tag.topics.length).toBeGreaterThan(0);
      for (const t of tag.topics) expect(topicIds.has(t), t).toBe(true);
      for (const s of tag.sections) expect(sectionIds.has(s), s).toBe(true);
      for (const b of tag.blocks || []) expect(blockIds.has(b), b).toBe(true);
      for (const v of tag.verses) {
        const span = (v.endVerse ?? v.verse) - v.verse + 1;
        // Prefer ≥5 when commenting on a unit; allow short cites of 3+.
        expect(span).toBeGreaterThanOrEqual(3);
      }
    }

    const prologueTags = file.tags.filter((t) => t.sections.includes("jo.1.prologue"));
    expect(prologueTags.length).toBeGreaterThanOrEqual(5);
  });
});
