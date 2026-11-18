import { BIBLE_HIGHLIGHTS_KEY, BOOKMARKS_KEY, NOTE_PREFIX, SAVED_CONNECTIONS_KEY, WORK_HIGHLIGHTS_PREFIX } from "../../server/syncKeys";

/**
 * Two browsers changed the same marks before either heard from the other. Join them so nothing a
 * reader made is lost: highlights, bookmarks and saved connections are united, two different notes are put
 * one after the other. `local` is this browser's value, `remote` the account's; null means deleted.
 */
export function mergeMarks(key: string, local: string | null, remote: string | null): string | null {
  if (local === remote) return local;
  if (remote == null) return local;
  if (local == null) return remote;
  try {
    if (key === BIBLE_HIGHLIGHTS_KEY) {
      return JSON.stringify({ ...(JSON.parse(remote) as object), ...(JSON.parse(local) as object) });
    }
    if (key === BOOKMARKS_KEY) {
      // Every place once, the newer copy of each, newest first (the same join as src/lib/bookmarks.ts).
      type Mark = { id: string; at?: number };
      const by = new Map<string, Mark>();
      for (const b of [...(JSON.parse(remote) as Mark[]), ...(JSON.parse(local) as Mark[])]) {
        const have = by.get(b.id);
        if (!have || (b.at || 0) >= (have.at || 0)) by.set(b.id, b);
      }
      return JSON.stringify([...by.values()].sort((a, b) => (b.at || 0) - (a.at || 0)));
    }
    if (key === SAVED_CONNECTIONS_KEY) {
      type Saved = { a: unknown; b: unknown };
      const seen = new Set<string>();
      const out: Saved[] = [];
      for (const item of [...(JSON.parse(local) as Saved[]), ...(JSON.parse(remote) as Saved[])]) {
        const id = JSON.stringify([item.a, item.b]);
        if (seen.has(id)) continue;
        seen.add(id);
        out.push(item);
      }
      return JSON.stringify(out);
    }
    if (key.startsWith(WORK_HIGHLIGHTS_PREFIX)) {
      type Item = { key: string; start: number; end: number };
      const l = JSON.parse(local) as { v?: number; list?: Item[] };
      const r = JSON.parse(remote) as { v?: number; list?: Item[] };
      if (l.v !== 2) return remote;
      if (r.v !== 2) return local;
      const seen = new Set<string>();
      const list: Item[] = [];
      for (const item of [...(l.list || []), ...(r.list || [])]) {
        const id = item.key + "|" + item.start + "|" + item.end;
        if (seen.has(id)) continue;
        seen.add(id);
        list.push(item);
      }
      return JSON.stringify({ v: 2, list });
    }
    if (key.startsWith(NOTE_PREFIX)) {
      const l = String((JSON.parse(local) as { html?: string }).html || "");
      const r = String((JSON.parse(remote) as { html?: string }).html || "");
      if (!r || l.includes(r)) return local;
      if (!l || r.includes(l)) return remote;
      return JSON.stringify({ v: 1, html: r + "<br>" + l });
    }
  } catch {
    /* unreadable on one side: keep this browser's */
  }
  return local;
}

/** How many marks this browser holds: highlighted verses and passages, and notes. */
export function countMarks(storage: Pick<Storage, "length" | "key" | "getItem">): number {
  let n = 0;
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i) || "";
    try {
      if (key === BIBLE_HIGHLIGHTS_KEY) n += Object.keys(JSON.parse(storage.getItem(key) || "{}") as object).length;
      else if (key === BOOKMARKS_KEY) n += (JSON.parse(storage.getItem(key) || "[]") as unknown[]).length;
      else if (key.startsWith(WORK_HIGHLIGHTS_PREFIX)) n += ((JSON.parse(storage.getItem(key) || "{}") as { list?: unknown[] }).list || []).length;
      else if (key.startsWith(NOTE_PREFIX)) n += 1;
    } catch {
      /* unreadable: not counted */
    }
  }
  return n;
}
