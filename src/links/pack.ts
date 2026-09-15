import type { VerseLinksResponse } from "../api/links";
import { locOf } from "./loc";
import { createLinkStore } from "./createStore";
import type { BibleRef, Canon, Link } from "./types";

export type ChapterLinksPack = {
  bookId: string;
  bookNum: number;
  canon: Canon;
  chapter: number;
  links: Record<string, Link>;
  verses: Record<string, string[]>;
};

function refFor(pack: Pick<ChapterLinksPack, "bookId" | "bookNum" | "canon" | "chapter">, verse: number): BibleRef {
  return {
    bookId: pack.bookId,
    bookNum: pack.bookNum,
    canon: pack.canon,
    chapter: pack.chapter,
    verseStart: verse,
    verseEnd: verse,
    locStart: locOf(pack.chapter, verse),
    locEnd: locOf(pack.chapter, verse)
  };
}

export function emptyVerseResponse(
  pack: Pick<ChapterLinksPack, "bookId" | "bookNum" | "canon" | "chapter">,
  verse: number
): VerseLinksResponse {
  return {
    ref: refFor(pack, verse),
    tree: [],
    counts: { links: 0, total: 0, centuries: 0, fathers: 0, works: 0 }
  };
}

export function verseResponseFromPack(pack: ChapterLinksPack, verse: number): VerseLinksResponse {
  const ids = pack.verses[String(verse)] || [];
  const hits = ids.map((id) => pack.links[id]).filter(Boolean) as Link[];
  if (!hits.length) return emptyVerseResponse(pack, verse);

  const store = createLinkStore(hits);
  const tree = store.getTreeForVerse(pack.bookId, pack.chapter, verse);
  const fatherIds = new Set(hits.map((l) => l.fatherId));
  const workIds = new Set(hits.map((l) => l.workId));
  const centuries = new Set(hits.map((l) => l.century));

  return {
    ref: refFor(pack, verse),
    tree,
    counts: {
      links: hits.length,
      total: hits.length,
      centuries: centuries.size,
      fathers: fatherIds.size,
      works: workIds.size
    }
  };
}
