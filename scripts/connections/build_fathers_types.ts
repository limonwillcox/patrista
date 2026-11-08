/**
 * The types on the site: the approved list of types the Fathers saw (data/connections/typology/approved.json),
 * turned into the types map's entries. Writes data/connections/typology/types.json; pack_public.py copies it
 * to public/connections/types.json and files each type under the Bible chapters it touches.
 *
 *   npx tsx scripts/connections/build_fathers_types.ts
 *
 * How approved.json was made: every paragraph in the library, in English, Latin and Greek, that uses a word
 * like "type", "figure" or "shadow" (find_type_candidates.ts) was read for the types its Father names; each
 * claim's quotation was checked against the paragraph; the claims were grouped into types; the types seen by
 * two or more Fathers were cleaned (duplicates merged, general statements dropped), grouped and approved.
 *
 * Each entry here:
 *   label     the approved wording, "X → Y"
 *   def       its group and the Fathers who saw it; nothing is written about a type beyond what they say
 *   where     the Fathers' quotations, "Name, *Work* 12.3 — “…”", at most two per Father, English first. A
 *             Latin or Greek quotation is given in a machine translation, marked as one, with the original.
 *   links     the reader paragraph of each English quotation
 *   ranges    the type's passages: the ones its claims name, then up to three verses of the other Testament
 *             that the Fathers cite together with them (connections.sqlite `witness`: two Fathers citing
 *             both in one paragraph, or one Father and a paragraph quoted here), so the map has two ends
 *             to join. A type with no such verse has its own passage only.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { getCatalog, getWork } from "../../server/api";
import { kjvText } from "../../server/scriptureIndex";
import { englishParagraphs } from "../../src/lib/fatherPaths";
import { findScriptureRefs } from "../../src/lib/scriptureRefs";

const ROOT = join(import.meta.dirname, "..", "..");
const DIR = join(ROOT, "data", "connections", "typology");
const PER_FATHER = 2;
const CITED_ENDS = 3;
const NAMED_ENDS = 5;

type Evidence = {
  father: string;
  lang: "en" | "lat" | "grk";
  work: string;
  quote: string;
  en?: string;
  passage?: string;
  page?: string;
  chapter?: number;
  para?: number;
  candidate: string;
};
type Approved = { group: string; label: string; passage: string; fathers: string[]; evidence: Evidence[] };

const approved = JSON.parse(readFileSync(join(DIR, "approved.json"), "utf8")) as Approved[];
const meta = JSON.parse(readFileSync(join(ROOT, "public", "connections", "meta.json"), "utf8")) as {
  books: { id: string; name: string; n: number; chapters: number }[];
};
const kjv = kjvText(ROOT);
// Pairs of verses the Fathers cite in one paragraph (build_witness.py), with how many Fathers do.
const db = new DatabaseSync(join(ROOT, "data", "connections", "connections.sqlite"), { readOnly: true });
const together = db.prepare(
  "select b as v, fathers from witness where a between ? and ? " +
    "union all select a as v, fathers from witness where b between ? and ?"
);
const catalog = getCatalog();
const authorName = new Map(catalog.authors.map((a) => [a.id, a.name.replace(/\s*\(.*\)$/, "")]));
// Fathers whose Latin the library holds but who have no page in the reader yet.
for (const [id, name] of Object.entries({
  bede: "Bede",
  isidore: "Isidore of Seville",
  junillus: "Junillus",
  prosper: "Prosper of Aquitaine",
  sedulius: "Sedulius",
  eucherius: "Eucherius of Lyons"
}))
  if (!authorName.has(id)) authorName.set(id, name);
const workTitle = new Map(catalog.works.map((w) => [w.id, w.title]));

// ---- passages: "Exodus 12", "Genesis 6-8", "Exodus 12:46", "Genesis 22:1-19", "Exodus 25:40-26:3" ----
const bookByName = new Map<string, { n: number; id: string }>();
for (const b of meta.books) bookByName.set(b.name.toLowerCase(), b);
bookByName.set("psalm", bookByName.get("psalms")!);
bookByName.set("song of songs", bookByName.get("song of solomon") ?? bookByName.get("song of songs")!);
const names = [...bookByName.keys()].sort((a, b) => b.length - a.length);
const kjvBook = new Map(kjv.books.map((b) => [b.id, b]));
const lastVerse = (bookId: string, ch: number) => kjvBook.get(bookId)?.c[ch - 1]?.length ?? 0;
const vid = (n: number, c: number, v: number) => n * 1_000_000 + c * 1000 + v;

function parsePassage(text: string): [number, number] | null {
  const s = text.trim().replace(/\.$/, "").toLowerCase();
  const name = names.find((n) => s === n || s.startsWith(n + " "));
  if (!name) return null;
  const b = bookByName.get(name)!;
  const m = s.slice(name.length).trim().match(/^(\d+)(?::(\d+))?(?:\s*[-–]\s*(\d+)(?::(\d+))?)?$/);
  if (!m) return null;
  const c1 = Number(m[1]);
  if (!lastVerse(b.id, c1)) return null;
  if (m[2] == null) {
    const c2 = m[3] ? Number(m[3]) : c1;
    if (!lastVerse(b.id, c2) || c2 < c1) return null;
    return [vid(b.n, c1, 1), vid(b.n, c2, lastVerse(b.id, c2))];
  }
  const v1 = Number(m[2]);
  if (m[3] == null) return [vid(b.n, c1, v1), vid(b.n, c1, v1)];
  if (m[4] == null) return [vid(b.n, c1, v1), vid(b.n, c1, Number(m[3]))];
  return [vid(b.n, c1, v1), vid(b.n, Number(m[3]), Number(m[4]))];
}
const passages = (text?: string) =>
  (text ?? "")
    .split(";")
    .map((p) => parsePassage(p))
    .filter((r): r is [number, number] => !!r && r[0] <= r[1]);

/** Keep the widest of overlapping passages ("Genesis 6-8" swallows "Genesis 7:7"). */
function widest(rs: [number, number][]): [number, number][] {
  const kept: [number, number][] = [];
  for (const r of [...rs].sort((a, b) => a[0] - b[0] || b[1] - a[1])) {
    const last = kept[kept.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else kept.push([r[0], r[1]]);
  }
  return kept;
}
const testament = (v: number) => (Math.floor(v / 1_000_000) >= 40 ? "nt" : "ot");

// ---- the reader paragraph of an English quotation, and the verses that paragraph cites ----
const norm = (s: string) => s.toLowerCase().replace(/[‘’]/g, "'").replace(/[^a-z0-9']+/g, " ").trim();
const bookN = new Map(meta.books.map((b) => [b.id, b.n]));
type Place = { href: string; label: string; cites: number[] };
function place(e: Evidence): Place | null {
  if (e.lang !== "en" || !e.page || e.chapter == null || e.para == null) return null;
  const workId = e.candidate.split("/")[0];
  const work = getWork(workId);
  const ch = work?.chapters.find((c) => c.chapter === e.chapter);
  if (!work || !ch) return null;
  const paras = englishParagraphs(ch.versions);
  // The paragraph the claim was read in; if another English version numbered it differently, find the quotation.
  const pieces = e.quote.split(/…|\.\.\./).map(norm).filter((p) => p.length > 0);
  const has = (i: number) => pieces.every((p) => norm(paras[i] ?? "").includes(p));
  let p = e.para;
  if (!has(p)) p = paras.findIndex((_, i) => has(i));
  if (p < 0) p = e.para;
  const subAt = new Map((ch.sections ?? []).map((s) => [s.para, s]));
  let n = 0;
  for (let i = 0; i <= p; i++) {
    const sub = subAt.get(i);
    if (sub && !sub.inline && !sub.hidden && i !== p) continue;
    n += 1;
  }
  const cites: number[] = [];
  const add = (t: string) => {
    for (const r of findScriptureRefs(t)) {
      const b = bookN.get(r.book);
      if (b) for (let v = r.verse; v <= Math.min(r.endVerse ?? r.verse, r.verse + 5); v++) cites.push(vid(b, r.chapter, v));
    }
  };
  add(paras[p] ?? "");
  for (const f of ch.footnotes ?? []) if (f.para === p) add(f.text);
  return { href: `${e.page}#ch-${e.chapter}-p${n}`, label: `${e.chapter}.${n}`, cites };
}

// ---- the entries ----
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const ids = new Set<string>();
const LANG = { lat: "Latin", grk: "Greek" } as const;
const out = [];
let oneEnd = 0;
for (const t of approved) {
  const [x, y] = t.label.split(" → ");
  let id = "04:" + slug(x.replace(/^the /i, "").replace(/^"|"$/g, ""));
  if (ids.has(id)) id += "-" + slug(y.replace(/^the /i, ""));
  ids.add(id);

  const placed = t.evidence.map((e) => ({ e, at: place(e) }));
  // At most PER_FATHER quotations per Father: English with a reader link first, then the shortest.
  const byFather = new Map<string, typeof placed>();
  for (const p of placed) byFather.set(p.e.father, [...(byFather.get(p.e.father) ?? []), p]);
  const chosen = [...byFather.values()].flatMap((ps) =>
    [...ps].sort((a, b) => Number(!a.at) - Number(!b.at) || a.e.quote.length - b.e.quote.length).slice(0, PER_FATHER)
  );
  const where: string[] = [];
  const links: ({ label: string; href: string } | null)[] = [];
  for (const { e, at } of chosen) {
    const who = authorName.get(e.father) ?? e.father;
    const title = (e.lang === "en" ? workTitle.get(e.candidate.split("/")[0]) : null) ?? e.work;
    if (at) {
      where.push(`${who}, *${title}* ${at.label} — “${e.quote}”`);
      links.push({ label: `${who}, ${title} ${at.label}`, href: at.href });
    } else {
      const lang = LANG[e.lang as "lat" | "grk"] ?? "original";
      where.push(`${who}, *${title}* (${lang}) — “${e.en ?? e.quote}” (machine translation from the ${lang}: “${e.quote}”)`);
      links.push(null);
    }
  }

  // The passages its claims name, most named first.
  const named = new Map<string, { r: [number, number]; n: number }>();
  for (const r of [...passages(t.passage), ...t.evidence.flatMap((e) => passages(e.passage))]) {
    const k = r.join("-");
    named.set(k, { r, n: (named.get(k)?.n ?? 0) + 1 });
  }
  const namedRanges = widest([...named.values()].sort((a, b) => b.n - a.n).map((x) => x.r)).slice(0, NAMED_ENDS);
  const home = namedRanges.length ? testament(namedRanges[0][0]) : "ot";
  // The other end: a verse of the other Testament that one of this type's own quoted paragraphs cites, and
  // that the Fathers cite together with the type's passage (in that paragraph or elsewhere). Failing that, a
  // verse three or more Fathers cite together with the passage. Most Fathers first.
  const own = new Map<number, number>();
  for (const { at } of placed) for (const v of new Set(at?.cites ?? [])) own.set(v, (own.get(v) ?? 0) + 1);
  const withPassage = new Map<number, Set<string>>();
  for (const [a, b] of namedRanges)
    for (const { v, fathers } of together.all(a, b, a, b) as { v: number; fathers: string }[]) {
      if (testament(v) === home || namedRanges.some(([x, y]) => v >= x && v <= y)) continue;
      const s = withPassage.get(v) ?? new Set<string>();
      for (const f of JSON.parse(fathers) as string[]) s.add(f);
      withPassage.set(v, s);
    }
  const rank = (vs: number[]) =>
    vs.sort((a, b) => withPassage.get(b)!.size - withPassage.get(a)!.size || (own.get(b) ?? 0) - (own.get(a) ?? 0) || a - b);
  let ends = rank([...withPassage.keys()].filter((v) => own.has(v) && withPassage.get(v)!.size >= 2));
  if (!ends.length) ends = rank([...withPassage.keys()].filter((v) => withPassage.get(v)!.size >= 3));
  const cited = ends.slice(0, CITED_ENDS).map((v) => [v, v] as [number, number]);
  const ranges = widest([...namedRanges, ...cited]);
  if (ranges.length < 2) oneEnd += 1;

  const fathers = t.fathers.map((f) => authorName.get(f) ?? f);
  out.push({
    id,
    label: t.label,
    def: `${t.group}. Seen by ${fathers.length} Fathers: ${fathers.join(", ")}.`,
    kind: slug(t.group),
    christ: "",
    where,
    ranges,
    links
  });
}
out.sort((a, b) => a.label.localeCompare(b.label));
writeFileSync(join(DIR, "types.json"), JSON.stringify(out, null, 1) + "\n");
console.log(`${out.length} types; ${out.reduce((s, t) => s + t.where.length, 0)} quotations; ${oneEnd} with one passage only`);
