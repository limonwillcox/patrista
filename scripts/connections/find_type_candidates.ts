/**
 * Step 1 of finding every type the Fathers saw: every paragraph, in every language we hold, where a Father
 * uses his own word for a type. Two sources: the reader's library (English, and the Latin it shows), and the
 * Greek and Latin originals in Fathers/Greek and Fathers/Latin (Open Greek and Latin, the Patristic Text
 * Archive, The Latin Library). Writes data/connections/typology/candidates.jsonl, one paragraph per line:
 *   { id, author, work, lang, marker, text, page?, chapter?, para?, file?, section? }
 *
 *   npx tsx scripts/connections/find_type_candidates.ts
 *
 * The words (the Fathers' vocabulary, and the translators' for it):
 *   English  type, typical(ly), typify, antitype, figure(d), prefigure, foreshadow, shadow
 *   Greek    τύπος and its forms, ἀντίτυπος, προτυπόω, σκιά (accents ignored; τύπτω "strike" excluded)
 *   Latin    typus, typice, figura and figurare, praefigurare, umbra, adumbrare
 * A paragraph is a candidate when it has one of them; step 2 reads each one and keeps only the paragraphs
 * where the Father himself says one thing foreshadows another.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getCatalog, getWork } from "../../server/api";

const ROOT = join(import.meta.dirname, "..", "..");
const OUT = join(ROOT, "data", "connections", "typology");

const EN = /\b(types?|typical(?:ly)?|typif\w*|antitypes?|figures?|figured|prefigur\w*|foreshadow\w*|shadows?)\b/i;
const GRK = /(?<![α-ω])(αντιτυπ\w*|προτυπ\w*|τυπ(?!τ)\w*|σκια\w*|σκιᾳ)/;
const LAT = /\b(typ(?:us|um|i|o|os|is|ice|icus|ica|icum)|figur\w*|praefigur\w*|prefigur\w*|umbr(?:a|ae|am|is|as)|adumbr\w*)\b/i;

/** In a block too long to read whole, the words kept on each side of a type word. */
const WINDOW = 200;

/** Lower case, without accents or breathings, so "τύπον" and "τυπον" are one word. */
const plain = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

function marker(lang: string, text: string): string | null {
  if (lang === "grk") return plain(text).match(GRK)?.[0] ?? null;
  if (lang === "lat") return text.match(LAT)?.[0] ?? null;
  return text.match(EN)?.[0] ?? null;
}

mkdirSync(OUT, { recursive: true });
const lines: string[] = [];
const out: string[] = [];
const count: Record<string, number> = {};
const total: Record<string, number> = {};
const catalog = getCatalog();
for (const w of catalog.works) {
  const work = getWork(w.id);
  if (!work) continue;
  [...work.chapters]
    .sort((a, b) => a.chapter - b.chapter)
    .forEach((ch, i) => {
      for (const [ver, paras] of Object.entries(ch.versions)) {
        const lang = ver === "lat" || ver === "grk" ? ver : "en";
        (paras ?? []).forEach((text, p) => {
          total[lang] = (total[lang] ?? 0) + 1;
          const m = marker(lang, text);
          if (!m) return;
          count[lang] = (count[lang] ?? 0) + 1;
          lines.push(
            JSON.stringify({
              id: `${w.id}/${ch.chapter}/${ver}/${p}`,
              author: w.author,
              work: w.id,
              chapter: ch.chapter,
              page: `/fathers/${w.author}/${w.id}/chapter-${i + 1}/`,
              para: p,
              lang,
              version: ver,
              marker: m,
              text
            })
          );
        });
      }
    });
}
// The Greek and Latin originals, file by file: "# father:" / "# author:" and "# work:" head each file;
// "[Chapter 1]", "[1 ]" and "===== [Book 2] =====" mark sections; a blank line ends a paragraph.
for (const [dir, lang] of [["Greek", "grk"], ["Latin", "lat"]] as const) {
  const base = join(ROOT, "Fathers", dir);
  for (const folder of readdirSync(base, { withFileTypes: true }).filter((d) => d.isDirectory())) {
    for (const f of readdirSync(join(base, folder.name)).filter((f) => f.endsWith(".txt"))) {
      const raw = readFileSync(join(base, folder.name, f), "utf8");
      const head = (k: string) => raw.match(new RegExp("^# " + k + ": (.+)$", "m"))?.[1].trim() ?? "";
      const author = head("father") || head("author") || folder.name.replace(/_(Greek|Latin)$/, "");
      const work = head("work") || f.replace(/\.txt$/, "");
      let section = "";
      let para = 0;
      for (const block of raw.split(/\r?\n\s*\r?\n/)) {
        const rows = block.split(/\r?\n/).filter((l) => !l.startsWith("#") && !/^=+$/.test(l.trim()));
        const text: string[] = [];
        for (const l of rows) {
          const sec = l.trim().match(/^(?:=+\s*)?\[([^\]]+)\](?:\s*=+)?$/);
          if (sec) section = sec[1].trim();
          else text.push(l.trim());
        }
        const t = text.join(" ").trim();
        if (t.length < 20) continue;
        para += 1;
        total[lang] = (total[lang] ?? 0) + 1;
        const m = marker(lang, t);
        if (!m) continue;
        count[lang] = (count[lang] ?? 0) + 1;
        const file = ["Fathers", dir, folder.name, f].join("/");
        // Some files keep a whole book as one block. Over WINDOW*3 words, keep a window of WINDOW words on each
        // side of every type word instead (windows that touch are joined), so each candidate stays readable.
        const words = t.split(/\s+/);
        if (words.length <= WINDOW * 3) {
          out.push(JSON.stringify({ id: `${file}#${para}`, author, work, lang, marker: m, file, section, para, text: t }));
          continue;
        }
        const spans: [number, number][] = [];
        words.forEach((w, k) => {
          if (!marker(lang, w)) return;
          const [a, b] = [Math.max(0, k - WINDOW), Math.min(words.length, k + WINDOW + 1)];
          const last = spans[spans.length - 1];
          if (last && a <= last[1]) last[1] = b;
          else spans.push([a, b]);
        });
        spans.forEach(([a, b], n) => {
          const piece = words.slice(a, b).join(" ");
          out.push(
            JSON.stringify({ id: `${file}#${para}.w${n + 1}`, author, work, lang, marker: marker(lang, piece) ?? m, file, section, para, words: [a, b], text: piece })
          );
        });
      }
    }
  }
}
for (const l of out) lines.push(l);

writeFileSync(join(OUT, "candidates.jsonl"), lines.join("\n") + "\n");
for (const lang of Object.keys(total)) console.log(`${lang}: ${count[lang] ?? 0} of ${total[lang]} paragraphs`);
console.log(`${lines.length} candidates -> data/connections/typology/candidates.jsonl`);
