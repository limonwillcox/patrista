/** Bible chapter → known section → 3-verse blocks (remainder absorbed into the last block). */

export type VerseSpan = { start: number; end: number };

export type BibleBlock = VerseSpan & {
  id: string; // jo.1.1-3
};

export type BibleSectionDef = {
  id: string; // jo.1.prologue
  label: string;
  /** Inclusive verse span within the chapter. */
  verses: VerseSpan;
};

export type BibleSection = BibleSectionDef & {
  book: string;
  chapter: number;
  blocks: BibleBlock[];
};

export type BibleChapterIndex = {
  book: string;
  chapter: number;
  verseCount: number;
  sections: BibleSection[];
};

/** Split [start, end] into blocks of `size` verses; leftover 1–2 verses join the last block. */
export function verseBlocks(start: number, end: number, size = 3): VerseSpan[] {
  if (end < start) return [];
  if (size < 1) throw new Error("block size must be >= 1");
  const out: VerseSpan[] = [];
  let s = start;
  while (s <= end) {
    let e = Math.min(s + size - 1, end);
    const rem = end - e;
    if (rem > 0 && rem < size) e = end;
    out.push({ start: s, end: e });
    s = e + 1;
  }
  return out;
}

export function blockId(book: string, chapter: number, span: VerseSpan): string {
  return span.start === span.end
    ? `${book}.${chapter}.${span.start}`
    : `${book}.${chapter}.${span.start}-${span.end}`;
}

export function buildChapterIndex(
  book: string,
  chapter: number,
  verseCount: number,
  sectionDefs: BibleSectionDef[]
): BibleChapterIndex {
  const sections: BibleSection[] = sectionDefs.map((def) => {
    const start = Math.max(1, def.verses.start);
    const end = Math.min(verseCount, def.verses.end);
    const blocks = verseBlocks(start, end, 3).map((span) => ({
      ...span,
      id: blockId(book, chapter, span)
    }));
    return { ...def, book, chapter, verses: { start, end }, blocks };
  });
  return { book, chapter, verseCount, sections };
}

/** Genesis 1 style: one section covering the whole chapter, chunked by 3. */
export function chapterAsSingleSection(
  book: string,
  chapter: number,
  verseCount: number,
  label?: string
): BibleChapterIndex {
  return buildChapterIndex(book, chapter, verseCount, [
    {
      id: `${book}.${chapter}.all`,
      label: label || `${book.toUpperCase()} ${chapter}`,
      verses: { start: 1, end: verseCount }
    }
  ]);
}
