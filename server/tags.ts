import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import type { QuoteTag, Topic } from "./types";

export type CommentaryHit = {
  tag: QuoteTag;
  authorId: string;
  authorName: string;
  workTitle: string;
};

type TagFile = { work: string; tags: QuoteTag[] };

let topicsCache: Topic[] | null = null;
let tagsCache: QuoteTag[] | null = null;

export function loadTopics(root: string): Topic[] {
  if (topicsCache) return topicsCache;
  const path = join(root, "corpus", "topics.json");
  if (!existsSync(path)) return (topicsCache = []);
  topicsCache = JSON.parse(readFileSync(path, "utf8")) as Topic[];
  return topicsCache;
}

export function loadAllTags(root: string): QuoteTag[] {
  if (tagsCache) return tagsCache;
  const dir = join(root, "corpus", "tags");
  if (!existsSync(dir)) return (tagsCache = []);
  const out: QuoteTag[] = [];
  for (const file of readdirSync(dir).sort()) {
    if (!file.endsWith(".json")) continue;
    const parsed = JSON.parse(readFileSync(join(dir, file), "utf8")) as TagFile;
    for (const tag of parsed.tags || []) out.push(tag);
  }
  tagsCache = out;
  return out;
}

export function clearTagCaches(): void {
  topicsCache = null;
  tagsCache = null;
}

function spansOverlap(
  a: { verse: number; endVerse?: number },
  from: number,
  to: number
): boolean {
  const a0 = a.verse;
  const a1 = a.endVerse ?? a.verse;
  return a0 <= to && a1 >= from;
}

/** Tags whose verse spans overlap book/chapter (optional verse window). */
export function tagsForBiblePassage(
  root: string,
  book: string,
  chapter: number,
  from = 1,
  to = 999
): QuoteTag[] {
  return loadAllTags(root).filter((tag) =>
    tag.verses.some(
      (v) => v.book === book && v.chapter === chapter && spansOverlap(v, from, to)
    )
  );
}

export function tagsForSection(root: string, sectionId: string): QuoteTag[] {
  return loadAllTags(root).filter((tag) => tag.sections.includes(sectionId));
}
