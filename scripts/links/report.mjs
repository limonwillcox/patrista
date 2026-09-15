#!/usr/bin/env node
import { existsSync, readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";


const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const DENSE = 5;

function loadVerseCounts(repoRoot, bookId) {
  const path = join(repoRoot, "Bibles/KJV", bookId + ".json");
  if (!existsSync(path)) return [];
  const book = JSON.parse(readFileSync(path, "utf8"));
  return (book.chapters || []).map((verses) => verses.length);
}

function verseKey(bookId, ch, vs) {
  return bookId + ":" + ch + ":" + vs;
}

export function reportLinks(links, { root: repoRoot, orphanNames = [], remainingBooks = [] }) {
  const byBookMap = new Map();
  const hits = new Map();
  for (const link of links) {
    for (const ref of link.refs || []) {
      byBookMap.set(ref.bookId, (byBookMap.get(ref.bookId) || 0) + 1);
      for (let vs = ref.verseStart; vs <= ref.verseEnd; vs++) {
        const k = verseKey(ref.bookId, ref.chapter, vs);
        hits.set(k, (hits.get(k) || 0) + 1);
      }
    }
  }
  const byBook = [...byBookMap.entries()]
    .map(([bookId, n]) => ({ bookId, links: n }))
    .sort((a, b) => b.links - a.links);

  const oc = new Map();
  for (const n of orphanNames) oc.set(n, (oc.get(n) || 0) + 1);
  const orphans = [...oc.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count]) => ({ name, count }));

  const emptyVsDense = [];
  const bookIds = new Set([...byBookMap.keys(), ...["mt", "mk", "lk", "jo", "rm"]]);
  for (const bookId of bookIds) {
    const chapters = loadVerseCounts(repoRoot, bookId);
    if (!chapters.length) continue;
    let total = 0;
    let empty = 0;
    let dense = 0;
    let linked = 0;
    chapters.forEach((n, i) => {
      const ch = i + 1;
      for (let vs = 1; vs <= n; vs++) {
        total += 1;
        const c = hits.get(verseKey(bookId, ch, vs)) || 0;
        if (c === 0) empty += 1;
        else linked += 1;
        if (c >= DENSE) dense += 1;
      }
    });
    emptyVsDense.push({ bookId, totalVerses: total, empty, linkedVerses: linked, dense });
  }

  return {
    totalLinks: links.length,
    byBook,
    orphans,
    emptyVsDense,
    remainingBooks
  };
}

function formatReport(out) {
  const lines = [];
  lines.push("links: " + out.totalLinks);
  lines.push("");
  lines.push("counts by book:");
  for (const b of out.byBook) lines.push("  " + b.bookId + "\t" + b.links);
  lines.push("");
  lines.push("orphan fathers (HCF names with no catalog id):");
  for (const o of out.orphans.slice(0, 40)) lines.push("  " + o.count + "\t" + o.name);
  if (out.orphans.length > 40) lines.push("  … " + (out.orphans.length - 40) + " more");
  lines.push("");
  lines.push("empty vs dense verses (dense = " + DENSE + "+ links):");
  for (const b of out.emptyVsDense) {
    lines.push(
      "  " +
        b.bookId +
        "\tlinked " +
        b.linkedVerses +
        "/" +
        b.totalVerses +
        "\tempty " +
        b.empty +
        "\tdense " +
        b.dense
    );
  }
  if (out.remainingBooks.length) {
    lines.push("");
    lines.push("remaining mapped HCF books (not ingested this pass):");
    for (const b of out.remainingBooks) {
      if (typeof b === "string") lines.push("  " + b);
      else lines.push("  " + b.book + "\t" + b.count);
    }
  }
  return lines.join("\n");
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const jsonPath = resolve(root, process.argv[2] || "data/links/links.json");
  const parsed = JSON.parse(readFileSync(jsonPath, "utf8"));
  const statsPath = resolve(root, "data/links/ingest-stats.json");
  const stats = existsSync(statsPath) ? JSON.parse(readFileSync(statsPath, "utf8")) : {};
  const orphanNames = [];
  for (const o of stats.hcf?.orphans || []) {
    if (typeof o === "string") orphanNames.push(o);
    else for (let i = 0; i < (o.count || 1); i++) orphanNames.push(o.name);
  }
  const remainingBooks = stats.hcf?.remainingBooks || [];
  const out = reportLinks(parsed.links || [], { root, orphanNames, remainingBooks });
  console.log(formatReport(out));
}
