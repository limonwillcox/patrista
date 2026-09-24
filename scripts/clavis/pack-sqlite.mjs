#!/usr/bin/env node
import { existsSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { applyAuthorDetails, importWorksFile, openDatabase, readAuthorDetails, root } from "./import-works.mjs";

export function packClavisSqlite(jsonlPath, sqlitePath, authorDetailsPath) {
  const counts = importWorksFile(jsonlPath, sqlitePath);
  if (authorDetailsPath && existsSync(authorDetailsPath)) {
    const db = openDatabase(sqlitePath);
    try {
      counts.authorUrls = applyAuthorDetails(db, readAuthorDetails(authorDetailsPath)).updated;
    } finally {
      db.close();
    }
  }
  return counts;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const jsonlPath = resolve(root, process.argv[2] || "data/clavis/imports/works-by-author.jsonl");
  const sqlitePath = resolve(root, process.argv[3] || "data/clavis/clavis.sqlite");
  const authorsPath = resolve(root, "data/clavis/imports/authors-expanded.jsonl");
  const counts = packClavisSqlite(jsonlPath, sqlitePath, existsSync(authorsPath) ? authorsPath : null);
  console.log("packed", counts.works, "works,", counts.authors, "authors →", sqlitePath);
}
