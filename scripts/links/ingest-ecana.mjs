#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import * as cheerio from "cheerio";
import { packLinksJson } from "./pack-sqlite.mjs";
import {
  DEFAULT_BOOKS,
  centuryFromDeathYear,
  loadAuthorMap,
  loadCatalogWorks,
  mapAuthor,
  mapBook,
  mapWork,
  makeRef,
  mergeByProvenance,
  parseBooksArg
} from "./map.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");

const HEAD_RE =
  /^((?:1\s*)?(?:2\s*)?(?:3\s*)?(?:Matt|Matthew|Mark|Luke|John|Rom|Romans|Acts|Cor|Corinthians|Gal|Galatians|Eph|Ephesians|Phil|Philippians|Col|Colossians|Thess|Thessalonians|Tim|Timothy|Tit|Titus|Phlm|Philemon|Heb|Hebrews|Jas|James|Pet|Peter|Jude|Rev|Revelation)\.?)\s+(\d+):(\d+)\b.*?\bin\s+(.+)$/i;

function bookFromPointer(rootDir, token) {
  const cleaned = token.replace(/\./g, "").replace(/\s+/g, "");
  return mapBook(rootDir, cleaned) || mapBook(rootDir, token);
}

export function parseEcatenaHtml(html, { root: repoRoot, authorMap, catalogWorks, sourcePage }) {
  const $ = cheerio.load(html);
  const links = [];
  let i = 0;
  $("p").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    const m = text.match(HEAD_RE);
    if (!m) return;
    const book = bookFromPointer(repoRoot, m[1]);
    if (!book) return;
    const chapter = Number(m[2]);
    const verse = Number(m[3]);
    const pointer = m[4].trim();
    const author = mapAuthor(authorMap, pointer);
    if (!author) return;
    const workTitle = author.rest || pointer;
    const next = $(el).next();
    const excerpt = (next.is("blockquote") ? next.text() : "").replace(/\s+/g, " ").trim();
    const href = ($(el).find("a").last().attr("href") || "").trim();
    i += 1;
    links.push({
      id: ["ecatena", book.bookId, chapter, verse, author.id, i].join("-"),
      sectionId: null,
      workId: mapWork(catalogWorks, author.id, workTitle),
      fatherId: author.id,
      workTitle: workTitle || pointer,
      excerpt: excerpt || workTitle || pointer,
      sourceUrl: href || sourcePage || "",
      sourceWork: workTitle || pointer,
      deathYear: author.deathYear,
      century: centuryFromDeathYear(author.deathYear),
      provenance: "ecatena",
      confidence: 0.7,
      status: "verified",
      refs: [makeRef(book, chapter, verse, verse)]
    });
  });
  return links;
}

function htmlBookId(filename) {
  const m = filename.match(/^([a-z0-9]+)(\d+)\.html$/i);
  if (!m) return null;
  return mapBook(root, m[1])?.bookId || null;
}

export function ingestEcatena({
  htmlDir,
  jsonOut,
  sqliteOut,
  bookIds,
  repoRoot = root
}) {
  if (!existsSync(htmlDir)) {
    throw new Error(
      "e-Catena HTML cache not found at " +
        htmlDir +
        ". The Access zip is a linked-table shell; cache HTML from earlychristianwritings.com/e-catena/."
    );
  }
  const authorMap = loadAuthorMap(repoRoot);
  const catalogWorks = loadCatalogWorks(repoRoot);
  const bookFilter = bookIds ? new Set(bookIds) : null;
  const files = readdirSync(htmlDir).filter((f) => f.endsWith(".html"));
  const links = [];
  for (const file of files) {
    const bid = htmlBookId(file);
    if (bookFilter && bid && !bookFilter.has(bid)) continue;
    const html = readFileSync(join(htmlDir, file), "utf8");
    const page = "https://www.earlychristianwritings.com/e-catena/" + file;
    const rows = parseEcatenaHtml(html, {
      root: repoRoot,
      authorMap,
      catalogWorks,
      sourcePage: page
    });
    for (const row of rows) {
      if (bookFilter && !bookFilter.has(row.refs[0].bookId)) continue;
      links.push(row);
    }
  }
  const existing = existsSync(jsonOut)
    ? JSON.parse(readFileSync(jsonOut, "utf8")).links || []
    : [];
  const merged = mergeByProvenance(existing, links, "ecatena");
  mkdirSync(dirname(jsonOut), { recursive: true });
  writeFileSync(
    jsonOut,
    JSON.stringify({
      note: "Verified Scripture ↔ Fathers links. HCF + e-Catena + handmade fixture. Not CatenaBible, not ACCS.",
      links: merged
    }) + "\n"
  );
  packLinksJson(jsonOut, sqliteOut);
  const statsPath = resolve(dirname(jsonOut), "ingest-stats.json");
  let stats = existsSync(statsPath) ? JSON.parse(readFileSync(statsPath, "utf8")) : {};
  stats.ecatena = {
    ingested: links.length,
    books: bookIds || "all",
    htmlDir,
    note: "Access e-catena.mdb is a linked-table shell (no rows). Parsed the public HTML index instead."
  };
  writeFileSync(statsPath, JSON.stringify(stats, null, 2) + "\n");
  return { ingested: links.length, total: merged.length };
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
  const htmlDir = resolve(root, args.get("html") || "data/links/cache/ecatena/html");
  const jsonOut = resolve(root, args.get("out") || "data/links/links.json");
  const sqliteOut = resolve(root, args.get("sqliteOut") || "data/links/links.sqlite");
  const result = ingestEcatena({ htmlDir, jsonOut, sqliteOut, bookIds: books, repoRoot: root });
  console.log("ecatena ingested", result.ingested, "links; store", result.total);
}
