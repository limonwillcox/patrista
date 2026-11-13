import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Meta, TypeEntry } from "../api/connections";
import { computeThemes, type LexEntry, type TaggedChapter, type Theme } from "./typeThemes";

/*
 * Node only: read what the themes are computed from, for scripts/connections/build_themes.ts and the test.
 * Themes come out largest first (most types), then in the editor's order.
 */

export type ThemeInputs = {
  chosen: { id: string; hebrew: string[] }[];
  types: TypeEntry[];
  lex: Record<string, LexEntry>;
  chapter: (book: number, ch: number) => TaggedChapter | null;
};

export function loadThemeInputs(root: string): ThemeInputs {
  const read = <T>(...p: string[]) => JSON.parse(readFileSync(join(root, ...p), "utf8")) as T;
  const lex: Record<string, LexEntry> = {};
  for (const f of readdirSync(join(root, "public", "strongs", "lex"))) Object.assign(lex, read(["public", "strongs", "lex", f].join("/")));
  const meta = read<Meta>("public", "connections", "meta.json");
  const cache = new Map<string, TaggedChapter | null>();
  const chapter = (book: number, ch: number) => {
    const key = book + ":" + ch;
    if (!cache.has(key)) {
      const p = join(root, "public", "strongs", "kjv", meta.books[book - 1]?.id ?? "", ch + ".json");
      cache.set(key, existsSync(p) ? (JSON.parse(readFileSync(p, "utf8")) as { v: TaggedChapter }).v : null);
    }
    return cache.get(key)!;
  };
  return {
    chosen: read<{ themes: { id: string; hebrew: string[] }[] }>("data", "connections", "themes.json").themes,
    types: read<TypeEntry[]>("public", "connections", "types.json"),
    lex,
    chapter
  };
}

export function themesFromInputs(i: ThemeInputs): Theme[] {
  const order = new Map(i.chosen.map((c, n) => [c.id, n]));
  return computeThemes(i.chosen, i.types, i.lex, i.chapter).sort(
    (a, b) => b.members.length - a.members.length || order.get(a.id)! - order.get(b.id)!
  );
}
