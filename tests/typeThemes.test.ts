import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { computeThemes, norm, type Theme } from "../src/lib/typeThemes";
import { loadThemeInputs, themesFromInputs } from "../src/lib/typeThemesData";

/*
 * The themes on the types map come from the data alone (src/lib/typeThemes.ts). These tests recompute them,
 * so public/connections/themes.json cannot be edited by hand, and check every membership's evidence against
 * the tagged KJV and the type's own quotations.
 */

const ROOT = join(__dirname, "..");
const inputs = loadThemeInputs(ROOT);
const onDisk = JSON.parse(readFileSync(join(ROOT, "public", "connections", "themes.json"), "utf8")) as Theme[];

describe("themes", () => {
  it("are exactly what the data gives (run scripts/connections/build_themes.ts after changing the data)", () => {
    expect(onDisk).toEqual(themesFromInputs(inputs));
  });

  it("rest every membership on a verse and a Father using the same word", () => {
    const types = new Map(inputs.types.map((t) => [t.id, t]));
    for (const th of onDisk) {
      for (const m of th.members) {
        const t = types.get(m.type)!;
        // The verse is in one of the type's passages, and its tagged words include the theme's word.
        // (A passage running into another book is read to the end of its first chapter, as the computation does.)
        const end = ([a, b]: [number, number]) => (Math.floor(b / 1_000_000) === Math.floor(a / 1_000_000) ? b : Math.floor(a / 1000) * 1000 + 999);
        expect(t.ranges.some((r) => m.verse >= r[0] && m.verse <= end(r)), m.type).toBe(true);
        const tokens = inputs.chapter(Math.floor(m.verse / 1_000_000), Math.floor(m.verse / 1000) % 1000)?.[String(m.verse % 1000)] ?? [];
        expect(
          tokens.some(([eng, code]) => eng === m.word && code.split(/\s+/).some((c) => th.codes.includes(c))),
          th.id + " " + m.type
        ).toBe(true);
        // The Father's quotation uses the same word.
        const quote = t.where[m.quote].slice(t.where[m.quote].indexOf(" — ") + 3);
        expect((quote.match(/[A-Za-z’']+/g) ?? []).map(norm), th.id + " " + m.type).toContain(norm(m.word));
      }
    }
  });

  it("never match a word in another of its senses", () => {
    // rûwach is "spirit" and "wind": a Father's "Spirit" must not join a verse that says "wind".
    const lex = { H1: { uses: [["spirit", 10], ["wind", 8]] as [string, number][] } };
    const type = { id: "04:x", label: "x", def: "", christ: "", where: ["A, *W* 1 — “the Holy Spirit”"], ranges: [[1001001, 1001001]] as [number, number][] };
    const windOnly = () => ({ "1": [["wind", "H1"]] as [string, string][] });
    expect(computeThemes([{ id: "spirit", hebrew: ["H1"] }], [type], lex, windOnly)[0].members).toEqual([]);
    const spirit = () => ({ "1": [["Spirit", "H1"]] as [string, string][] });
    expect(computeThemes([{ id: "spirit", hebrew: ["H1"] }], [type], lex, spirit)[0].members).toHaveLength(1);
  });
});
