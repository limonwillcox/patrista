/**
 * Find where in the library each Father's quotation on the types page comes from, and link it to that
 * paragraph in the reader. Writes data/connections/grammar/type-links.json:
 *   { "04:<type>": [ { "label": "Cyril, Cat. 13.20", "href": "/fathers/…/chapter-8/#ch-8-p20" } | null, … ] }
 * one entry per `where` quotation, in order. pack_public.py puts these on the types in types.json.
 *
 *   npx tsx scripts/connections/link_type_quotes.ts
 *
 * A quotation is matched on its words (case and punctuation ignored), part by part where it is cut with "…".
 * When it is found in several places, the chapter by the Father it is credited to wins.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getCatalog, getWork } from "../../server/api";
import { englishParagraphs } from "../../src/lib/fatherPaths";

const ROOT = join(import.meta.dirname, "..", "..");
const GRAMMAR = join(ROOT, "data", "connections", "grammar");

type Entry = { src: string; where: string[] };
type Para = { text: string; href: string; author: string; authorName: string };

const words = (s: string) => s.toLowerCase().replace(/[‘’]/g, "'").replace(/[^a-z0-9']+/g, " ").trim();

function loadTypes(): Entry[] {
  const sources = JSON.parse(readFileSync(join(GRAMMAR, "sources.json"), "utf8")) as Record<string, Entry>;
  const out = Object.entries(sources)
    .filter(([k]) => k.startsWith("04:"))
    .map(([, e]) => e);
  for (const f of readdirSync(join(GRAMMAR, "fathers-types")).filter((f) => f.endsWith(".json"))) {
    out.push(JSON.parse(readFileSync(join(GRAMMAR, "fathers-types", f), "utf8")) as Entry);
  }
  return out;
}

/** Every English paragraph in the library, with its reader link (chapter page + paragraph anchor). */
function loadParagraphs(): Para[] {
  const catalog = getCatalog();
  const names = new Map(catalog.authors.map((a) => [a.id, a.name]));
  const out: Para[] = [];
  for (const w of catalog.works) {
    const work = getWork(w.id);
    if (!work) continue;
    [...work.chapters]
      .sort((a, b) => a.chapter - b.chapter)
      .forEach((ch, i) => {
        const subAt = new Map((ch.sections ?? []).map((s) => [s.para, s]));
        let n = 0;
        englishParagraphs(ch.versions).forEach((text, p) => {
          const sub = subAt.get(p);
          // Numbered as the reader numbers them: a heading of its own is not a paragraph.
          if (sub && !sub.inline && !sub.hidden) return;
          n += 1;
          out.push({
            text: words(text),
            href: `/fathers/${w.author}/${w.id}/chapter-${i + 1}/#ch-${ch.chapter}-p${n}`,
            author: w.author,
            authorName: (names.get(w.author) ?? "").toLowerCase()
          });
        });
      });
  }
  return out;
}

function findQuote(quote: string, credited: string, paras: Para[]): Para | null {
  const all = quote.split(/…|\.\.\./).map(words).filter(Boolean);
  const long = all.filter((p) => p.split(" ").length >= 4);
  // A very short quotation ("Take another testimony.") is only trusted in the credited Father's own works.
  const short = !long.length;
  const parts = short ? all : long;
  if (!parts.length) return null;
  const who = credited.toLowerCase();
  const byHim = (p: Para) => p.authorName.split(/[ ,]/)[0] === who.split(/[ ,]/)[0];
  const hits = paras.filter((p) => (!short || byHim(p)) && parts.every((part) => p.text.includes(part)));
  if (!hits.length) return null;
  // "Cyril" matches "cyril of jerusalem"; "Clement" matches either Clement, so prefer an exact first word.
  return hits.find(byHim) ?? hits.find((p) => p.authorName.includes(who)) ?? hits[0];
}

const types = loadTypes();
const paras = loadParagraphs();
const result: Record<string, ({ label: string; href: string } | null)[]> = {};
let found = 0;
let total = 0;
for (const t of types) {
  result[t.src] = t.where.map((w) => {
    total += 1;
    const at = w.indexOf(" — ");
    const ref = at < 0 ? "" : w.slice(0, at);
    const quotes = [...w.matchAll(/“([^”]+)”/g)].map((m) => m[1]);
    const credited = ref.split(",")[0].replace(/\*/g, "").trim();
    for (const q of quotes) {
      const p = findQuote(q, credited, paras);
      if (p) {
        found += 1;
        return { label: ref.replace(/\*/g, ""), href: p.href };
      }
    }
    console.log("not found:", t.src, "|", w.slice(0, 100));
    return null;
  });
}
writeFileSync(join(GRAMMAR, "type-links.json"), JSON.stringify(result, null, 1) + "\n");
console.log(`linked ${found} of ${total} quotations across ${types.length} types`);
