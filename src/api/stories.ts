import type { StoryRow } from "../lib/stories";

const books = new Map<string, Promise<StoryRow[] | null>>();

/** The stories of one book of the Bible, in order, or null when the list is not there. */
export function fetchStories(book: string): Promise<StoryRow[] | null> {
  let p = books.get(book);
  if (!p) {
    p = fetch("/stories/" + encodeURIComponent(book) + ".json")
      .then((r) => (r.ok ? (r.json() as Promise<StoryRow[]>) : null))
      .catch(() => null);
    p.then((rows) => {
      if (rows === null) books.delete(book);
    });
    books.set(book, p);
  }
  return p;
}
