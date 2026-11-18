import { useEffect, useState } from "react";
import { BOOKMARKS_KEY } from "../../server/syncKeys";
import { noteChange, onRemoteChange } from "./accountSync";

/**
 * A reader's bookmarks: a chapter of the Bible or a chapter of a Father's work, kept to come back to.
 * Like highlights and notes they live in this browser's storage, and follow the reader to their
 * account once they have signed in.
 */
export type Bookmark = {
  /** "bible:mt:5" or "work:confessions:3": one bookmark per place. */
  id: string;
  /** What the reader sees: "Matthew 5", "The Confessions — Book III". */
  title: string;
  /** Under the title: the Father's name, or "Bible". */
  note: string;
  /** Where it opens, from the site's root. */
  path: string;
  /** When it was made (ms), so the newest come first. */
  at: number;
};

const KEY = BOOKMARKS_KEY;
let cache: Bookmark[] | null = null;
const listeners = new Set<() => void>();

export const bibleBookmarkId = (book: string, chapter: number) => "bible:" + book + ":" + chapter;
export const workBookmarkId = (work: string, chapter: number) => "work:" + work + ":" + chapter;

/** Stored text to a clean list: anything unreadable or misshapen is left out. */
export function parseBookmarks(raw: string | null): Bookmark[] {
  try {
    const list = JSON.parse(raw || "[]") as unknown;
    if (!Array.isArray(list)) return [];
    return list.filter(
      (b): b is Bookmark =>
        !!b && typeof b.id === "string" && typeof b.title === "string" && typeof b.path === "string" && b.path.startsWith("/")
    );
  } catch {
    return [];
  }
}

/** The list with a bookmark added, or taken out if its place was already kept. Newest first. */
export function toggleIn(list: Bookmark[], mark: Bookmark): Bookmark[] {
  return list.some((b) => b.id === mark.id) ? list.filter((b) => b.id !== mark.id) : [mark, ...list];
}

/** Two browsers' lists joined: every place once, the newer copy of each, newest first. */
export function mergeBookmarks(local: Bookmark[], remote: Bookmark[]): Bookmark[] {
  const by = new Map<string, Bookmark>();
  for (const b of [...remote, ...local]) {
    const have = by.get(b.id);
    if (!have || (b.at || 0) >= (have.at || 0)) by.set(b.id, b);
  }
  return [...by.values()].sort((a, b) => (b.at || 0) - (a.at || 0));
}

function load(): Bookmark[] {
  if (cache) return cache;
  try {
    cache = parseBookmarks(localStorage.getItem(KEY));
  } catch {
    cache = [];
  }
  return cache;
}

function store(next: Bookmark[]): void {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private window: kept for this visit only */
  }
  listeners.forEach((f) => f());
  noteChange(KEY);
}

/** Keep this place, or let it go if it was kept. Returns true when it is now bookmarked. */
export function toggleBookmark(mark: Omit<Bookmark, "at">): boolean {
  const next = toggleIn(load(), { ...mark, at: Date.now() });
  store(next);
  return next.some((b) => b.id === mark.id);
}

export function removeBookmark(id: string): void {
  store(load().filter((b) => b.id !== id));
}

// Bookmarks arrived from the account: drop the copy in memory and redraw.
onRemoteChange((key) => {
  if (key !== KEY) return;
  cache = null;
  listeners.forEach((f) => f());
});

/** All bookmarks, newest first, updating when any change. */
export function useBookmarks(): Bookmark[] {
  const [, rerender] = useState(0);
  useEffect(() => {
    const f = () => rerender((x) => x + 1);
    listeners.add(f);
    return () => {
      listeners.delete(f);
    };
  }, []);
  return load();
}
