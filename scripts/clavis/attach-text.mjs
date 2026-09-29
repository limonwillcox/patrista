#!/usr/bin/env node
import { createHash } from "crypto";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { isAbsolute, join, relative, resolve } from "path";
import { fileURLToPath } from "url";
import { applySchema, assertLanguage, defaultSchemaPath, openDatabase, r2KeyFor, root } from "./import-works.mjs";

const STATUSES = new Set(["draft", "ready"]);
const QUALITIES = new Set(["ocr-raw", "needs-cleanup", "partial", "clean", "verified"]);

function cleanText(value) {
  if (value == null) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
}

function cleanYear(value) {
  if (value == null || value === "") return null;
  const year = Number(value);
  if (!Number.isInteger(year) || year < 1 || year > 9999) {
    throw new Error("edition_year must be a year");
  }
  return year;
}

function cleanQuality(value) {
  const quality = cleanText(value);
  if (quality == null) return null;
  const lowered = quality.toLowerCase();
  if (!QUALITIES.has(lowered)) {
    throw new Error("quality must be ocr-raw, needs-cleanup, partial, clean, or verified");
  }
  return lowered;
}

export function missingReadyFields(fields) {
  const missing = [];
  if (!cleanText(fields.sourceUrl ?? fields.source_url)) missing.push("source_url");
  if (!cleanText(fields.license)) missing.push("license");
  // A ready text may omit a translator only when the body is the original
  // language. English needs a name, or the explicit values anonymous or n/a.
  if (fields.language !== "original" && !cleanText(fields.translator)) missing.push("translator");
  return missing;
}

export function localBodyPath(bodiesRoot, workId, language) {
  return join(bodiesRoot, workId, language + ".txt");
}

export function attachText(options) {
  const db = options.db;
  const workId = String(options.workId || "").trim().toUpperCase();
  const language = assertLanguage(options.language);
  const status = options.status || "draft";
  if (!STATUSES.has(status)) throw new Error("status must be draft or ready");
  if (!options.bodiesRoot) throw new Error("bodiesRoot is required");
  const translator = cleanText(options.translator);
  const edition = cleanText(options.edition);
  const editionYear = cleanYear(options.editionYear ?? options.edition_year);
  const sourceUrl = cleanText(options.sourceUrl ?? options.source_url);
  const license = cleanText(options.license);
  const quality = cleanQuality(options.quality);
  if (status === "ready") {
    const missing = missingReadyFields({ language, translator, sourceUrl, license });
    if (missing.length) throw new Error("status=ready requires " + missing.join(", "));
  }
  const found = db.prepare("SELECT 1 AS ok FROM works WHERE work_id = ?").get(workId);
  if (!found) throw new Error("work_id " + workId + " is not in works; import Clavis before attaching text");

  const buf = Buffer.isBuffer(options.body) ? options.body : Buffer.from(options.body);
  const sha = createHash("sha256").update(buf).digest("hex");
  const mirrorPath = localBodyPath(options.bodiesRoot, workId, language);
  mkdirSync(join(options.bodiesRoot, workId), { recursive: true });
  writeFileSync(mirrorPath, buf);

  const r2Key = r2KeyFor(workId, language);
  const updatedAt = options.updatedAt || new Date().toISOString();
  const title = options.title == null || options.title === "" ? null : String(options.title);
  const sourcePath = options.sourcePath == null || options.sourcePath === "" ? null : String(options.sourcePath);
  db.prepare(`
    INSERT INTO work_texts (
      work_id, language, title, status, r2_key, source_path,
      content_sha256, byte_size, updated_at,
      translator, edition, edition_year, source_url, license, quality
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, COALESCE(?, 'needs-cleanup')
    )
    ON CONFLICT(work_id, language) DO UPDATE SET
      title = excluded.title,
      status = excluded.status,
      r2_key = excluded.r2_key,
      source_path = excluded.source_path,
      content_sha256 = excluded.content_sha256,
      byte_size = excluded.byte_size,
      updated_at = excluded.updated_at,
      translator = CASE WHEN ? IS NULL THEN work_texts.translator ELSE ? END,
      edition = CASE WHEN ? IS NULL THEN work_texts.edition ELSE ? END,
      edition_year = CASE WHEN ? IS NULL THEN work_texts.edition_year ELSE ? END,
      source_url = CASE WHEN ? IS NULL THEN work_texts.source_url ELSE ? END,
      license = CASE WHEN ? IS NULL THEN work_texts.license ELSE ? END,
      quality = CASE WHEN ? IS NULL THEN work_texts.quality ELSE ? END
  `).run(
    workId,
    language,
    title,
    status,
    r2Key,
    sourcePath,
    sha,
    buf.byteLength,
    updatedAt,
    translator,
    edition,
    editionYear,
    sourceUrl,
    license,
    quality,
    translator,
    translator,
    edition,
    edition,
    editionYear,
    editionYear,
    sourceUrl,
    sourceUrl,
    license,
    license,
    quality,
    quality
  );

  const stored = db.prepare(`
    SELECT translator, edition, edition_year, source_url, license, quality
    FROM work_texts
    WHERE work_id = ? AND language = ?
  `).get(workId, language);

  return {
    work_id: workId,
    language,
    status,
    title,
    r2_key: r2Key,
    source_path: sourcePath,
    content_sha256: sha,
    byte_size: buf.byteLength,
    mirror_path: mirrorPath,
    updated_at: updatedAt,
    translator: stored.translator == null ? null : String(stored.translator),
    edition: stored.edition == null ? null : String(stored.edition),
    edition_year: stored.edition_year == null ? null : Number(stored.edition_year),
    source_url: stored.source_url == null ? null : String(stored.source_url),
    license: stored.license == null ? null : String(stored.license),
    quality: String(stored.quality)
  };
}

export function attachTextFile(options) {
  const sqlitePath = options.sqlitePath;
  const db = openDatabase(sqlitePath);
  try {
    applySchema(db, options.schemaPath || defaultSchemaPath);
    const body = readFileSync(options.filePath);
    return attachText({
      db,
      workId: options.workId,
      language: options.language,
      body,
      title: options.title,
      status: options.status,
      sourcePath: options.sourcePath || options.filePath,
      bodiesRoot: options.bodiesRoot,
      updatedAt: options.updatedAt,
      translator: options.translator,
      edition: options.edition,
      editionYear: options.editionYear ?? options.edition_year,
      sourceUrl: options.sourceUrl ?? options.source_url,
      license: options.license,
      quality: options.quality
    });
  } finally {
    db.close();
  }
}

function portablePath(absPath) {
  const rel = relative(root, absPath);
  if (!rel || rel.startsWith("..") || isAbsolute(rel)) return absPath;
  return rel.split("\\").join("/");
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
  const filePath = args.file || args._[0];
  const workId = args.work || args.work_id;
  const language = args.language || "english";
  if (!filePath || !workId) {
    console.error(
      "usage: node scripts/clavis/attach-text.mjs --work WORK_ID --language english|original --file BODY.txt [--title TITLE] [--status draft|ready] [--translator NAME] [--edition NAME] [--edition-year YEAR] [--source-url URL] [--license us-public-domain] [--quality needs-cleanup] [--sqlite data/clavis/clavis.sqlite] [--bodies data/clavis/bodies]"
    );
    process.exit(1);
  }
  const sqlitePath = resolve(root, args.sqlite || "data/clavis/clavis.sqlite");
  const bodiesRoot = resolve(root, args.bodies || "data/clavis/bodies");
  const absFile = resolve(root, filePath);
  const attached = attachTextFile({
    sqlitePath,
    filePath: absFile,
    workId,
    language,
    title: args.title,
    status: args.status || "draft",
    sourcePath: portablePath(args.source ? resolve(root, args.source) : absFile),
    bodiesRoot,
    translator: args.translator,
    edition: args.edition,
    editionYear: args["edition-year"],
    sourceUrl: args["source-url"],
    license: args.license,
    quality: args.quality
  });
  console.log("attached", attached.language, attached.status, attached.r2_key, attached.byte_size + " bytes");
}
