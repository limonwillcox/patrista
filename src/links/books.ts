import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { locOf } from "./loc";
import type { BibleRef, Canon } from "./types";

export type BookMeta = {
  bookId: string;
  bookNum: number;
  canon: Canon;
  name: string;
  chapters: number;
};

type ManifestBook = { id: string; name: string; chapters: number };

const OT_COUNT = 39;
const cache = new Map<string, BookMeta[]>();

export function loadBooks(root: string): BookMeta[] {
  const hit = cache.get(root);
  if (hit) return hit;
  const path = join(root, "Bibles", "KJV", "manifest.json");
  if (!existsSync(path)) {
    cache.set(root, []);
    return [];
  }
  const raw = JSON.parse(readFileSync(path, "utf8")) as ManifestBook[];
  const books = raw.map((b, i) => {
    const bookNum = i + 1;
    const canon: Canon = bookNum <= OT_COUNT ? "ot" : "nt";
    return { bookId: b.id, bookNum, canon, name: b.name, chapters: b.chapters };
  });
  cache.set(root, books);
  return books;
}

export function bookById(root: string, bookId: string): BookMeta | undefined {
  return loadBooks(root).find((b) => b.bookId === bookId);
}

export function bibleRef(
  root: string,
  bookId: string,
  chapter: number,
  verseStart: number,
  verseEnd = verseStart
): BibleRef {
  const book = bookById(root, bookId);
  if (!book) throw new Error("Unknown bookId: " + bookId);
  return {
    bookId: book.bookId,
    bookNum: book.bookNum,
    canon: book.canon,
    chapter,
    verseStart,
    verseEnd,
    locStart: locOf(chapter, verseStart),
    locEnd: locOf(chapter, verseEnd)
  };
}
