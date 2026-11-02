import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { BIBLE_TRANSLATIONS, isLocalTextTranslation } from "../src/api/bibleTranslations";
import type { BibleBook } from "./bible";

/**
 * The public-domain translations other than the KJV, kept in the repo as Bibles/<ID>/<book>.json in the
 * KJV's format and verse numbering (scripts/import-bibles.ts). Only the text: the margin notes, the
 * Strong's tagging and the Fathers' commentary come with the KJV chapter.
 */
export type BibleTextChapter = { translation: string; book: string; chapter: number; verses: string[] };

export function localTextTranslations(): string[] {
  return BIBLE_TRANSLATIONS.filter((t) => isLocalTextTranslation(t.id)).map((t) => t.id);
}

const books = new Map<string, BibleBook | null>();

function loadBook(root: string, translation: string, bookId: string): BibleBook | null {
  const key = root + "|" + translation + "|" + bookId;
  if (books.has(key)) return books.get(key)!;
  // Only known translation ids and plain book ids reach the file system.
  const path = join(root, "Bibles", translation.toUpperCase(), bookId + ".json");
  const book = /^[a-z0-9]+$/.test(bookId) && existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as BibleBook) : null;
  books.set(key, book);
  return book;
}

export function getBibleTextChapter(
  root: string,
  translation: string,
  bookId: string,
  chapter: number
): BibleTextChapter | null {
  if (!isLocalTextTranslation(translation)) return null;
  const book = loadBook(root, translation, bookId);
  const verses = book?.chapters[chapter - 1];
  if (!verses) return null;
  return { translation, book: bookId, chapter, verses };
}
