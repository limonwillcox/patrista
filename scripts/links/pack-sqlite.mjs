#!/usr/bin/env node
import { mkdirSync, readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { DatabaseSync } from "node:sqlite";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");

const CREATE_SQL = `
CREATE TABLE links (
  id TEXT PRIMARY KEY,
  sectionId TEXT,
  workId TEXT NOT NULL,
  fatherId TEXT NOT NULL,
  workTitle TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  sourceUrl TEXT NOT NULL,
  sourceWork TEXT NOT NULL,
  deathYear INTEGER NOT NULL,
  century INTEGER NOT NULL,
  provenance TEXT NOT NULL,
  confidence REAL NOT NULL,
  status TEXT NOT NULL,
  refsJson TEXT NOT NULL
);
`;

export function packLinksJson(jsonPath, sqlitePath) {
  const parsed = JSON.parse(readFileSync(jsonPath, "utf8"));
  const links = parsed.links || [];
  mkdirSync(dirname(sqlitePath), { recursive: true });
  const db = new DatabaseSync(sqlitePath);
  try {
    db.exec("DROP TABLE IF EXISTS links");
    db.exec(CREATE_SQL);
    const insert = db.prepare(
      `INSERT INTO links (
        id, sectionId, workId, fatherId, workTitle, excerpt,
        sourceUrl, sourceWork, deathYear, century, provenance,
        confidence, status, refsJson
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    db.exec("BEGIN");
    for (const link of links) {
      insert.run(
        link.id,
        link.sectionId ?? null,
        link.workId,
        link.fatherId,
        link.workTitle,
        link.excerpt,
        link.sourceUrl ?? "",
        link.sourceWork ?? "",
        link.deathYear,
        link.century,
        link.provenance,
        link.confidence,
        link.status,
        JSON.stringify(link.refs || [])
      );
    }
    db.exec("COMMIT");
  } finally {
    db.close();
  }
  return links.length;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const jsonPath = resolve(root, process.argv[2] || "data/links/links.json");
  const sqlitePath = resolve(root, process.argv[3] || "data/links/links.sqlite");
  const n = packLinksJson(jsonPath, sqlitePath);
  console.log("packed", n, "links →", sqlitePath);
}
