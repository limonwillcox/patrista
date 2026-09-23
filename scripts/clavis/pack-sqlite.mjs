#!/usr/bin/env node
import { resolve } from "path";
import { fileURLToPath } from "url";
import { importWorksFile, root } from "./import-works.mjs";

export function packClavisSqlite(jsonlPath, sqlitePath) {
  return importWorksFile(jsonlPath, sqlitePath);
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const jsonlPath = resolve(root, process.argv[2] || "data/clavis/fixtures/works.jsonl");
  const sqlitePath = resolve(root, process.argv[3] || "data/clavis/clavis.sqlite");
  const counts = packClavisSqlite(jsonlPath, sqlitePath);
  console.log("packed", counts.works, "works,", counts.authors, "authors →", sqlitePath);
}
