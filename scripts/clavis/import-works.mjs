#!/usr/bin/env node
import { mkdirSync, readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { DatabaseSync } from "node:sqlite";

const here = dirname(fileURLToPath(import.meta.url));
export const root = resolve(here, "../..");
export const defaultSchemaPath = resolve(root, "data/clavis/schema.sql");

const LANGUAGES = new Set(["english", "original"]);

export function letterBucket(nameLatin) {
  const ch = String(nameLatin || "").trim().charAt(0).toUpperCase();
  return /^[A-Z]$/.test(ch) ? ch : "#";
}

export function r2KeyFor(workId, language) {
  return "clavis/texts/" + workId + "/" + language + ".txt";
}

function required(obj, keys, where) {
  for (const key of keys) {
    if (obj[key] != null && String(obj[key]).trim() !== "") return String(obj[key]).trim();
  }
  throw new Error(where + ": missing " + keys.join(" or "));
}

export function normalizeWorkRow(obj, where = "row") {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    throw new Error(where + ": expected an object");
  }
  const authorId = required(obj, ["author_id", "authorId"], where).toUpperCase();
  const workId = required(obj, ["work_id", "workId"], where).toUpperCase();
  const nameLatin = required(obj, ["authorNameLatin", "name_latin", "author_name_latin"], where);
  const titleLatin = required(obj, ["titleLatin", "title_latin"], where);
  const parentRaw = obj.parent_id ?? obj.parent_work_id ?? obj.parentId ?? null;
  const parent =
    parentRaw == null || String(parentRaw).trim() === "" ? null : String(parentRaw).trim().toUpperCase();
  const clavis = Array.isArray(obj.clavis)
    ? obj.clavis.map(String)
    : Array.isArray(obj.clavis_codes)
      ? obj.clavis_codes.map(String)
      : [];
  const path = Array.isArray(obj.path) ? obj.path.map(String) : [];
  const designated = obj.titleDesignated ?? obj.title_designated ?? null;
  const detail = obj.detailUrl ?? obj.detail_url ?? null;
  const authorDetail = obj.authorDetailUrl ?? obj.author_detail_url ?? null;
  const kind = obj.kind == null || String(obj.kind).trim() === "" ? "work" : String(obj.kind).trim();
  return {
    author_id: authorId,
    name_latin: nameLatin,
    author_detail_url: authorDetail == null || String(authorDetail).trim() === "" ? null : String(authorDetail),
    work_id: workId,
    parent_id: parent,
    title_latin: titleLatin,
    title_designated: designated == null || String(designated).trim() === "" ? null : String(designated),
    clavis,
    path,
    detail_url: detail == null || String(detail).trim() === "" ? null : String(detail),
    kind
  };
}

export function readWorkRows(filePath) {
  const text = readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) throw new Error(filePath + ": expected a JSON array");
    return parsed.map((row, i) => normalizeWorkRow(row, filePath + " [" + i + "]"));
  }
  const rows = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;
    let obj;
    try {
      obj = JSON.parse(line);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(filePath + ":" + (i + 1) + ": " + message);
    }
    rows.push(normalizeWorkRow(obj, filePath + ":" + (i + 1)));
  }
  return rows;
}

export function openDatabase(sqlitePath) {
  mkdirSync(dirname(sqlitePath), { recursive: true });
  return new DatabaseSync(sqlitePath, { enableForeignKeyConstraints: true });
}

export function applySchema(db, schemaPath = defaultSchemaPath) {
  db.exec(readFileSync(schemaPath, "utf8"));
}

export function importWorks(db, rows, importedAt = new Date().toISOString()) {
  const upsertAuthor = db.prepare(`
    INSERT INTO authors (author_id, name_latin, detail_url, letter_bucket, imported_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(author_id) DO UPDATE SET
      name_latin = excluded.name_latin,
      detail_url = COALESCE(excluded.detail_url, authors.detail_url),
      letter_bucket = excluded.letter_bucket,
      imported_at = excluded.imported_at
  `);
  const upsertWork = db.prepare(`
    INSERT INTO works (
      work_id, author_id, parent_work_id, title_latin, title_designated,
      clavis_codes, path_json, detail_url, kind, imported_at
    ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(work_id) DO UPDATE SET
      author_id = excluded.author_id,
      title_latin = excluded.title_latin,
      title_designated = excluded.title_designated,
      clavis_codes = excluded.clavis_codes,
      path_json = excluded.path_json,
      detail_url = excluded.detail_url,
      kind = excluded.kind,
      imported_at = excluded.imported_at
  `);
  const setParent = db.prepare(`
    UPDATE works
    SET parent_work_id = (SELECT p.work_id FROM works p WHERE p.work_id = ?)
    WHERE work_id = ?
  `);

  db.exec("BEGIN");
  try {
    const authors = new Set();
    const works = new Set();
    for (const row of rows) {
      authors.add(row.author_id);
      upsertAuthor.run(
        row.author_id,
        row.name_latin,
        row.author_detail_url,
        letterBucket(row.name_latin),
        importedAt
      );
    }
    for (const row of rows) {
      works.add(row.work_id);
      upsertWork.run(
        row.work_id,
        row.author_id,
        row.title_latin,
        row.title_designated,
        JSON.stringify(row.clavis),
        JSON.stringify(row.path),
        row.detail_url,
        row.kind,
        importedAt
      );
    }
    for (const row of rows) {
      setParent.run(row.parent_id, row.work_id);
    }
    db.exec("COMMIT");
    return {
      authors: authors.size,
      works: works.size,
      rows: rows.length,
      duplicateRows: rows.length - works.size
    };
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

export function readAuthorDetails(filePath) {
  const text = readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const details = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;
    let obj;
    try {
      obj = JSON.parse(line);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(filePath + ":" + (i + 1) + ": " + message);
    }
    const authorId = required(obj, ["author_id", "authorId"], filePath + ":" + (i + 1)).toUpperCase();
    const detail = obj.detailUrl ?? obj.detail_url ?? null;
    details.push({
      author_id: authorId,
      detail_url: detail == null || String(detail).trim() === "" ? null : String(detail)
    });
  }
  return details;
}

export function applyAuthorDetails(db, details) {
  const update = db.prepare(`
    UPDATE authors
    SET detail_url = ?
    WHERE author_id = ?
  `);
  let updated = 0;
  db.exec("BEGIN");
  try {
    for (const row of details) {
      if (!row.detail_url) continue;
      const result = update.run(row.detail_url, row.author_id);
      updated += result.changes || 0;
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
  return { updated };
}

export function importWorksFile(jsonlPath, sqlitePath, schemaPath = defaultSchemaPath) {
  const rows = readWorkRows(jsonlPath);
  const db = openDatabase(sqlitePath);
  try {
    applySchema(db, schemaPath);
    return importWorks(db, rows);
  } finally {
    db.close();
  }
}

export function assertLanguage(language) {
  if (!LANGUAGES.has(language)) {
    throw new Error("language must be english or original");
  }
  return language;
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next == null || next.startsWith("--")) out[key] = true;
      else {
        out[key] = next;
        i++;
      }
    } else out._.push(arg);
  }
  return out;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = parseArgs(process.argv.slice(2));
  const jsonlPath = resolve(root, args._[0] || "data/clavis/imports/works-by-author.jsonl");
  const sqlitePath = resolve(root, args._[1] || "data/clavis/clavis.sqlite");
  const counts = importWorksFile(jsonlPath, sqlitePath);
  let authorDetails = null;
  if (args.authors && args.authors !== "none") {
    const db = openDatabase(sqlitePath);
    try {
      authorDetails = applyAuthorDetails(db, readAuthorDetails(resolve(root, args.authors)));
    } finally {
      db.close();
    }
  }
  console.log(
    "imported",
    counts.works,
    "works,",
    counts.authors,
    "authors,",
    counts.duplicateRows,
    "cross-listed rows →",
    sqlitePath,
    authorDetails ? "(" + authorDetails.updated + " author urls)" : ""
  );
}
