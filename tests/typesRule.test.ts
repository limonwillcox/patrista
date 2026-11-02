import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getWork } from "../server/api";
import { englishParagraphs } from "../src/lib/fatherPaths";

/*
 * The rule for types: a type is on the site only because the Fathers drew it. No type is named by us.
 * Every type added from the library (data/connections/grammar/fathers-types/) must:
 *  - cite at least two passages of the Fathers, from at least two Fathers, each linked to its reader chapter;
 *  - quote faithfully: a quotation must be found in the chapter it links to, allowing for case, punctuation,
 *    cuts marked "…" and small differences of wording (a paraphrase without quotation marks needs only its link);
 *  - say what it points to in Christ in a line that names a Father it cites.
 * The older types (sources.json, from the study notes) were checked once against the whole library:
 * all 312 of their quotations are there (Nov 2026).
 */

const DIR = join(__dirname, "..", "data", "connections", "grammar", "fathers-types");
type Entry = { src: string; label: string; texts: string; christ: string; where: string[]; links?: { label: string; href: string }[] };

/** Words only: lower case, no punctuation, so "Lamb," and "lamb" agree. */
const words = (s: string) => s.toLowerCase().replace(/[‘’]/g, "'").replace(/[^a-z0-9']+/g, " ").trim();
const runs = (w: string) => {
  const t = w.split(" ");
  return t.length < 3 ? [w] : t.slice(2).map((_, i) => t[i] + " " + t[i + 1] + " " + t[i + 2]);
};

/** A quotation is faithful when each part (split at "…") is in the chapter, or nearly: 3 in 4 of its three-word runs. */
function faithful(quote: string, chapter: string): boolean {
  return quote
    .split(/…|\.\.\./)
    .map(words)
    .filter((part) => part.split(" ").length >= 3)
    .every((part) => {
      if (chapter.includes(part)) return true;
      const r = runs(part);
      return r.filter((x) => chapter.includes(x)).length / r.length >= 0.75;
    });
}

/** "/fathers/<author>/<work>/chapter-<n>/" → the chapter's English text, or null. Same rule as the reader. */
function chapterText(href: string): string | null {
  const m = href.match(/^\/fathers\/([^/]+)\/([^/]+)\/chapter-(\d+)\/$/);
  if (!m) return null;
  const work = getWork(m[2]);
  if (!work || work.author.id !== m[1]) return null;
  const chapter = [...work.chapters].sort((a, b) => a.chapter - b.chapter)[Number(m[3]) - 1];
  return chapter ? words(englishParagraphs(chapter.versions).join(" ")) : null;
}

const entries: [string, Entry][] = readdirSync(DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => [f, JSON.parse(readFileSync(join(DIR, f), "utf8")) as Entry]);

describe("types come from the Fathers", () => {
  it("lets small differences through but not an invented quotation", () => {
    const chapter = words("For they all drank of a spiritual Rock that followed them, and that Rock was Christ, said the Apostle.");
    expect(faithful("they all drank of a spiritual rock that followed them; and that Rock was Christ", chapter)).toBe(true);
    expect(faithful("They all drank of a spiritual Rock … that Rock was Christ", chapter)).toBe(true);
    expect(faithful("they all drank from the spiritual Rock that followed them, and the Rock was Christ", chapter)).toBe(false);
    expect(faithful("The rock in the desert is a figure of the baptismal font", chapter)).toBe(false);
  });

  it("has entries to check", () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it.each(entries)("%s cites at least two Fathers, each faithful to the chapter it links", (file, e) => {
    expect(e.src, file).toBe("04:" + file.replace(/\.json$/, ""));
    expect(e.where.length, "quotations").toBeGreaterThanOrEqual(2);
    expect(e.links?.length, "one link per quotation").toBe(e.where.length);
    const fathers = new Set(e.where.map((w) => w.split(",")[0].trim()));
    expect(fathers.size, "different Fathers").toBeGreaterThanOrEqual(2);
    expect(new Set(e.links!.map((l) => l.href + l.label)).size, "different passages").toBe(e.where.length);
    e.where.forEach((w, i) => {
      const text = chapterText(e.links![i].href);
      expect(text, "chapter exists: " + e.links![i].href).not.toBeNull();
      for (const [, quote] of w.matchAll(/“([^”]+)”/g)) {
        expect(faithful(quote, text!), file + " quotes " + e.links![i].label + ": " + quote).toBe(true);
      }
    });
    expect([...fathers].some((f) => e.christ.includes(f)), "the In Christ line names a quoted Father").toBe(true);
  }, 120_000);
});
