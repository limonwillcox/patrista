import { existsSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";

/**
 * Pack per-chapter JSON files into size-capped group files, for static hosts with a file limit
 * (Cloudflare Pages Free: 20,000 files per site). Runs on dist/ after the build has written the
 * one-file-per-chapter layout; the dev server and public/ keep that layout.
 *
 *   <base>/<key>/<n>.json   ->   <base>/<key>/g<start>.json = { "<n>": <payload>, ... }
 *   <base>/groups.json      =    { "<key>": [start, start, ...] }   (first chapter of each group)
 *
 * The client (src/api/packed.ts) reads groups.json once, picks the group whose start is the last one
 * at or below the chapter, and takes the chapter from it. A chapter larger than the budget gets a
 * group of its own.
 */

/** Largest group, in bytes of JSON, before a new group starts (about 70 KB gzipped). */
export const PACK_BUDGET = 256 * 1024;

export type PackIndex = Record<string, number[]>;

/** Pack one directory of <n>.json files. Returns the group starts, ascending. */
export function packDir(dir: string, budget = PACK_BUDGET): number[] {
  const nums = readdirSync(dir)
    .map((f) => /^(\d+)\.json$/.exec(f))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => Number(m[1]))
    .sort((a, b) => a - b);
  const starts: number[] = [];
  let group: Record<string, unknown> = {};
  let size = 0;
  let start: number | null = null;
  const flush = () => {
    if (start === null) return;
    writeFileSync(join(dir, "g" + start + ".json"), JSON.stringify(group));
    starts.push(start);
    group = {};
    size = 0;
    start = null;
  };
  for (const n of nums) {
    const file = join(dir, n + ".json");
    const raw = readFileSync(file, "utf8");
    if (start !== null && size + raw.length > budget) flush();
    if (start === null) start = n;
    group[String(n)] = JSON.parse(raw);
    size += raw.length;
    unlinkSync(file);
  }
  flush();
  return starts;
}

/**
 * Pack every `<base>/<key>` directory, where `keys` lists the subpaths to pack (e.g. "gn", or
 * "confessions/chapters"). Writes `<base>/groups.json`. Returns the number of chapter files removed
 * and group files written.
 */
export function packSet(dist: string, base: string, keys: string[], budget = PACK_BUDGET): { removed: number; written: number } {
  const root = join(dist, base);
  const index: PackIndex = {};
  let removed = 0;
  let written = 0;
  for (const key of keys) {
    const dir = join(root, key);
    if (!existsSync(dir) || !statSync(dir).isDirectory()) continue;
    const before = readdirSync(dir).filter((f) => /^\d+\.json$/.test(f)).length;
    if (!before) continue;
    const starts = packDir(dir, budget);
    index[key] = starts;
    removed += before;
    written += starts.length;
  }
  writeFileSync(join(root, "groups.json"), JSON.stringify(index));
  return { removed, written: written + 1 };
}

/** Subdirectories of `dir`, minus `skip`. */
export function subdirs(dir: string, skip: string[] = []): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !skip.includes(d.name))
    .map((d) => d.name);
}

/** The chapter sets the static build packs, relative to dist/. */
export function packStaticChapters(dist: string, budget = PACK_BUDGET): { removed: number; written: number } {
  const sets: { base: string; keys: string[] }[] = [
    // Reader chapters: api/works/<id>/chapters/<n>.json
    {
      base: "api/works",
      keys: subdirs(join(dist, "api/works"))
        .filter((id) => existsSync(join(dist, "api/works", id, "chapters")))
        .map((id) => id + "/chapters")
    },
    // KJV chapter with the Fathers' comments: api/bible/<book>/<n>.json
    { base: "api/bible", keys: subdirs(join(dist, "api/bible"), ["text"]) },
    // Other local translations: api/bible/text/<translation>/<book>/<n>.json
    ...subdirs(join(dist, "api/bible/text")).map((t) => ({
      base: "api/bible/text/" + t,
      keys: subdirs(join(dist, "api/bible/text", t))
    })),
    // Fathers' citations per chapter: api/scripture/<book>/<n>.json
    { base: "api/scripture", keys: subdirs(join(dist, "api/scripture")) },
    // Connections per chapter: connections/verse/<book>/<n>.json
    { base: "connections/verse", keys: subdirs(join(dist, "connections/verse")) },
    // Strong's-tagged KJV per chapter: strongs/kjv/<book>/<n>.json
    { base: "strongs/kjv", keys: subdirs(join(dist, "strongs/kjv")) }
  ];
  let removed = 0;
  let written = 0;
  for (const set of sets) {
    if (!existsSync(join(dist, set.base))) continue;
    const r = packSet(dist, set.base, set.keys, budget);
    removed += r.removed;
    written += r.written;
  }
  return { removed, written };
}
