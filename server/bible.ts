import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { authorMeta, discoverEnglishWorkSpecs } from "./englishWorks";
import { johnChapterIndex } from "./johnIndex";
import { tagsForBiblePassage, tagsForSection } from "./tags";
import type { QuoteTag } from "./types";


export type BibleManifestBook = { id: string; name: string; chapters: number };

export type BibleBook = {
  id: string;
  name: string;
  chapters: string[][];
};

function rootBible(root: string): string {
  return join(root, "Bibles", "KJV");
}

export function getBibleManifest(root: string): BibleManifestBook[] {
  const path = join(rootBible(root), "manifest.json");
  if (!existsSync(path)) return [];
  return JSON.parse(readFileSync(path, "utf8")) as BibleManifestBook[];
}

export function getBibleBook(root: string, bookId: string): BibleBook | null {
  const path = join(rootBible(root), bookId + ".json");
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8")) as BibleBook;
}

function enrich(root: string, tags: QuoteTag[]) {
  const specs = discoverEnglishWorkSpecs(root);
  return tags.map((tag) => {
    const work = specs.find((w) => w.id === tag.work);
    const author = authorMeta(work?.author || "unknown");
    return {
      tag,
      authorId: author.id,
      authorName: author.name,
      workTitle: work?.title || tag.work
    };
  });
}

export type BibleCommentWire = {
  authorId: string;
  authorName: string;
  workTitle: string;
  tag: { id: string; work: string; chapter: number; snippet: string };
};

export type BibleChapterPayload = {
  book: BibleManifestBook;
  chapter: number;
  verses: string[];
  /** Section index for this chapter when we have one (John first). Block ids stay server-side. */
  sections?: { id: string; label: string; verses: { start: number; end: number } }[];
  comments: BibleCommentWire[];
};

export function getBibleChapterPayload(
  root: string,
  bookId: string,
  chapter: number,
  opts?: { section?: string; from?: number; to?: number }
): BibleChapterPayload | null {
  const manifest = getBibleManifest(root);
  const bookMeta = manifest.find((b) => b.id === bookId);
  const book = getBibleBook(root, bookId);
  if (!bookMeta || !book) return null;
  if (chapter < 1 || chapter > book.chapters.length) return null;
  const verses = book.chapters[chapter - 1] || [];
  const from = opts?.from ?? 1;
  const to = opts?.to ?? verses.length;

  let tags = opts?.section
    ? tagsForSection(root, opts.section)
    : tagsForBiblePassage(root, bookId, chapter, from, to);

  // Section filter still scoped to this chapter's verses.
  if (opts?.section) {
    tags = tags.filter((t) =>
      t.verses.some((v) => v.book === bookId && v.chapter === chapter)
    );
  }

  const sections =
    bookId === "jo" ? johnChapterIndex(root).get(chapter)?.sections : undefined;

  // Wire format hides taxonomy fields — tags undergird selection only.
  const comments = enrich(root, tags).map((c) => ({
    authorId: c.authorId,
    authorName: c.authorName,
    workTitle: c.workTitle,
    tag: {
      id: c.tag.id,
      work: c.tag.work,
      chapter: c.tag.chapter,
      snippet: c.tag.snippet
    }
  }));

  return {
    book: bookMeta,
    chapter,
    verses,
    sections: sections?.map((s) => ({
      id: s.id,
      label: s.label,
      verses: s.verses
    })),
    comments
  };
}
