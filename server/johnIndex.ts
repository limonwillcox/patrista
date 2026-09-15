import { readFileSync } from "fs";
import { join } from "path";
import {
  buildChapterIndex,
  chapterAsSingleSection,
  type BibleChapterIndex,
  type BibleSectionDef
} from "./bibleBlocks";

type JoSectionsFile = {
  book: string;
  name: string;
  chapters: Record<string, BibleSectionDef[]>;
};

let cached: Map<number, BibleChapterIndex> | null = null;

function loadDefs(root: string): JoSectionsFile {
  return JSON.parse(readFileSync(join(root, "corpus", "bible", "jo.sections.json"), "utf8"));
}

function verseCounts(root: string): number[] {
  const jo = JSON.parse(readFileSync(join(root, "Bibles", "KJV", "jo.json"), "utf8")) as {
    chapters: string[][];
  };
  return jo.chapters.map((c) => c.length);
}

/** Full John index: chapter → sections → 3-verse blocks. */
export function johnChapterIndex(root: string): Map<number, BibleChapterIndex> {
  if (cached) return cached;
  const defs = loadDefs(root);
  const counts = verseCounts(root);
  const map = new Map<number, BibleChapterIndex>();
  for (let ch = 1; ch <= counts.length; ch++) {
    const sectionDefs = defs.chapters[String(ch)];
    if (!sectionDefs?.length) {
      map.set(ch, chapterAsSingleSection("jo", ch, counts[ch - 1]!));
    } else {
      map.set(ch, buildChapterIndex("jo", ch, counts[ch - 1]!, sectionDefs));
    }
  }
  cached = map;
  return map;
}

export function johnSection(root: string, chapter: number, sectionId: string) {
  return johnChapterIndex(root).get(chapter)?.sections.find((s) => s.id === sectionId);
}

export function clearJohnIndexCache(): void {
  cached = null;
}
