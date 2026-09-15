#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { DatabaseSync } from "node:sqlite";
import { packLinksJson } from "./pack-sqlite.mjs";
import {
  DEFAULT_BOOKS,
  centuryFromDeathYear,
  isCopyrightedSource,
  loadAuthorMap,
  loadCatalogWorks,
  mapAuthor,
  mapAuthorExact,
  mapBook,
  mapWork,
  mergeByProvenance,
  parseBooksArg,
  refsFromLocs
} from "./map.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");

export function hcfRowToLink(row, { root: repoRoot, authorMap, catalogWorks, bookIds }) {
  if (isCopyrightedSource(row.source_url, row.source_title)) return null;
  const author = mapAuthorExact(authorMap, row.father_name);
  if (!author) return null;
  const book = mapBook(repoRoot, row.book);
  if (!book) return null;
  if (bookIds && !bookIds.has(book.bookId)) return null;
  const excerpt = String(row.txt || "").replace(/\s+/g, " ").trim();
  if (!excerpt) return null;
  const workTitle = String(row.source_title || "").trim() || "Untitled";
  return {
    id: "hcf-" + row.id,
    sectionId: null,
    workId: mapWork(catalogWorks, author.id, workTitle),
    fatherId: author.id,
    workTitle,
    excerpt,
    sourceUrl: String(row.source_url || ""),
    sourceWork: workTitle,
    deathYear: author.deathYear,
    century: centuryFromDeathYear(author.deathYear),
    provenance: "hcf",
    confidence: 1,
    status: "verified",
    refs: refsFromLocs(book, Number(row.location_start), Number(row.location_end))
  };
}

export function ingestHcf({
  sqlitePath,
  jsonOut,
  sqliteOut,
  bookIds,
  repoRoot = root
}) {
  if (!existsSync(sqlitePath)) {
    throw new Error(
      "HCF sqlite not found at " +
        sqlitePath +
        ". Download https://github.com/HistoricalChristianFaith/Commentaries-Database/releases/download/latest/commentaries.sqlite"
    );
  }
  const authorMap = loadAuthorMap(repoRoot);
  const catalogWorks = loadCatalogWorks(repoRoot);
  const db = new DatabaseSync(sqlitePath, { readOnly: true });
  const bookFilter = bookIds ? new Set(bookIds) : null;
  let rows;
  let remaining = [];
  const orphans = [];
  try {
    const hcfBooks = db.prepare("SELECT DISTINCT book FROM commentary").all().map((r) => r.book);
    const wanted = [];
    const leftover = [];
    for (const slug of hcfBooks) {
      const book = mapBook(repoRoot, slug);
      if (bookFilter && (!book || !bookFilter.has(book.bookId))) leftover.push(slug);
      else wanted.push(slug);
    }
    const placeholders = wanted.map(() => "?").join(",");
    rows = wanted.length
      ? db
          .prepare(
            `SELECT id, father_name, file_name, append_to_author_name, ts, book,
                    location_start, location_end, txt, source_url, source_title
             FROM commentary WHERE book IN (${placeholders})`
          )
          .all(...wanted)
      : [];
    const names = db.prepare("SELECT father_name, COUNT(*) AS c FROM commentary GROUP BY father_name").all();
    for (const n of names) {
      if (!mapAuthorExact(authorMap, n.father_name)) orphans.push({ name: n.father_name, count: n.c });
    }
    orphans.sort((a, b) => b.count - a.count);
    const mappedNames = names
      .map((n) => n.father_name)
      .filter((name) => mapAuthorExact(authorMap, name));
    remaining = leftover.map((slug) => {
      if (!mappedNames.length) return { book: slug, count: 0 };
      const ph = mappedNames.map(() => "?").join(",");
      const c = db
        .prepare(`SELECT COUNT(*) AS c FROM commentary WHERE book = ? AND father_name IN (${ph})`)
        .get(slug, ...mappedNames).c;
      return { book: slug, count: c };
    }).filter((b) => b.count > 0).sort((a, b) => b.count - a.count);
  } finally {
    db.close();
  }

  const links = [];
  for (const row of rows) {
    const link = hcfRowToLink(row, {
      root: repoRoot,
      authorMap,
      catalogWorks,
      bookIds: bookFilter
    });
    if (link) links.push(link);
  }

  const existing = existsSync(jsonOut)
    ? JSON.parse(readFileSync(jsonOut, "utf8")).links || []
    : [];
  const merged = mergeByProvenance(existing, links, "hcf");
  mkdirSync(dirname(jsonOut), { recursive: true });
  const payload = {
    note: "Verified Scripture ↔ Fathers links. HCF + e-Catena + handmade fixture. Not CatenaBible, not ACCS.",
    links: merged
  };
  writeFileSync(jsonOut, JSON.stringify(payload) + "\n");
  packLinksJson(jsonOut, sqliteOut);
  const statsPath = resolve(dirname(jsonOut), "ingest-stats.json");
  let stats = existsSync(statsPath) ? JSON.parse(readFileSync(statsPath, "utf8")) : {};
  stats.hcf = {
    ingested: links.length,
    orphans,
    remainingBooks: remaining,
    books: bookIds || "all",
    source: sqlitePath
  };
  writeFileSync(statsPath, JSON.stringify(stats, null, 2) + "\n");
  return { ingested: links.length, total: merged.length, remaining, orphanCount: orphans.length };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = new Map();
  for (let i = 2; i < process.argv.length; i++) {
    const a = process.argv[i];
    if (a.startsWith("--")) {
      const [k, v] = a.includes("=") ? a.slice(2).split("=") : [a.slice(2), process.argv[++i]];
      args.set(k, v);
    }
  }
  const books = parseBooksArg(args.get("books"), DEFAULT_BOOKS);
  const sqlitePath = resolve(root, args.get("sqlite") || "data/links/cache/commentaries.sqlite");
  const jsonOut = resolve(root, args.get("out") || "data/links/links.json");
  const sqliteOut = resolve(root, args.get("sqliteOut") || "data/links/links.sqlite");
  const result = ingestHcf({ sqlitePath, jsonOut, sqliteOut, bookIds: books, repoRoot: root });
  console.log(
    "hcf ingested",
    result.ingested,
    "links; store",
    result.total,
    "; remaining mapped books",
    result.remaining.length,
    "; orphan fathers",
    result.orphanCount
  );
}
