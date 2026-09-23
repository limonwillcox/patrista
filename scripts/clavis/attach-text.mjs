#!/usr/bin/env node
import { createHash } from "crypto";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { isAbsolute, join, relative, resolve } from "path";
import { fileURLToPath } from "url";
import { applySchema, assertLanguage, defaultSchemaPath, openDatabase, r2KeyFor, root } from "./import-works.mjs";

const STATUSES = new Set(["draft", "ready"]);

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
  const found = db.prepare("SELECT 1 AS ok FROM works WHERE work_id = ?").get(workId);
  if (!found) throw new Error("work_id " + workId + " is not in works; import Clavis before attaching text");

  const buf = Buffer.isBuffer(options.body) ? options.body : Buffer.from(options.body);
  const sha = createHash("sha256").update(buf).digest("hex");
  const mirrorPath = localBodyPath(options.bodiesRoot, workId, language);
  mkdirSync(join(options.bodiesRoot, workId), { recursive: true });
  writeFileSync(mirrorPath, buf);

  const r2Key = r2KeyFor(workId, language);
  const updatedAt = options.updatedAt || new Date().toISOString();
  db.prepare(`
    INSERT INTO work_texts (
      work_id, language, title, status, r2_key, source_path,
      content_sha256, byte_size, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(work_id, language) DO UPDATE SET
      title = excluded.title,
      status = excluded.status,
      r2_key = excluded.r2_key,
      source_path = excluded.source_path,
      content_sha256 = excluded.content_sha256,
      byte_size = excluded.byte_size,
      updated_at = excluded.updated_at
  `).run(
    workId,
    language,
    options.title == null || options.title === "" ? null : String(options.title),
    status,
    r2Key,
    options.sourcePath == null || options.sourcePath === "" ? null : String(options.sourcePath),
    sha,
    buf.byteLength,
    updatedAt
  );

  return {
    work_id: workId,
    language,
    status,
    title: options.title == null || options.title === "" ? null : String(options.title),
    r2_key: r2Key,
    source_path: options.sourcePath == null || options.sourcePath === "" ? null : String(options.sourcePath),
    content_sha256: sha,
    byte_size: buf.byteLength,
    mirror_path: mirrorPath,
    updated_at: updatedAt
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
      updatedAt: options.updatedAt
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
      "usage: node scripts/clavis/attach-text.mjs --work WORK_ID --language english|original --file BODY.txt [--title TITLE] [--status draft|ready] [--sqlite data/clavis/clavis.sqlite] [--bodies data/clavis/bodies]"
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
    bodiesRoot
  });
  console.log("attached", attached.language, attached.status, attached.r2_key, attached.byte_size + " bytes");
}
