/**
 * Read one chapter from the packed static files (see server/packChapters.ts).
 *
 * The production build groups per-chapter JSON into size-capped files to stay under the static host's
 * file limit: `<base>/<key>/g<start>.json` holds `{ "<n>": payload }`, and `<base>/groups.json` lists the
 * first chapter of each group per key. The dev server keeps one file per chapter, so callers use this
 * only when `PACKED` is true.
 */

export const PACKED = !import.meta.env.DEV;

const indexes = new Map<string, Promise<Record<string, number[]> | null>>();
const groups = new Map<string, Promise<Record<string, unknown> | null>>();

function getJson<T>(url: string, cache: Map<string, Promise<T | null>>): Promise<T | null> {
  let p = cache.get(url);
  if (!p) {
    p = fetch(url)
      .then((r) => (r.ok ? (r.json() as Promise<T>) : null))
      .catch(() => null);
    p.then((v) => {
      if (v === null) cache.delete(url);
    });
    cache.set(url, p);
  }
  return p;
}

/** The first chapter of the group that holds `chapter`, or null. */
export function groupStart(starts: number[], chapter: number): number | null {
  let found: number | null = null;
  for (const s of starts) {
    if (s <= chapter) found = s;
    else break;
  }
  return found;
}

/**
 * One chapter's payload, or null when it is not in the packed files.
 * `base` is a site path ("/api/works"); `key` the packed subpath ("confessions/chapters", "gn").
 */
export async function fetchPacked<T>(base: string, key: string, chapter: number): Promise<T | null> {
  const index = await getJson<Record<string, number[]>>(base + "/groups.json", indexes);
  const starts = index?.[key];
  if (!starts) return null;
  const start = groupStart(starts, chapter);
  if (start === null) return null;
  const path = key.split("/").map(encodeURIComponent).join("/");
  const group = await getJson<Record<string, unknown>>(base + "/" + path + "/g" + start + ".json", groups);
  const hit = group?.[String(chapter)];
  return hit === undefined ? null : (hit as T);
}
