import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { DatabaseSync } from "node:sqlite";
import { createLinkStore, type LinkStore } from "./createStore";
import type { Link } from "./types";

export type { LinkStore };
export { createLinkStore };

type DiskFile = { links: Link[] };

function loadJson(path: string): Link[] {
  const parsed = JSON.parse(readFileSync(path, "utf8")) as DiskFile;
  return parsed.links || [];
}

function loadSqlite(path: string): Link[] {
  const db = new DatabaseSync(path, { readOnly: true });
  try {
    const rows = db.prepare("SELECT * FROM links").all() as Record<string, unknown>[];
    return rows.map((row) => ({
      id: String(row.id),
      sectionId: row.sectionId == null ? null : String(row.sectionId),
      workId: String(row.workId),
      fatherId: String(row.fatherId),
      workTitle: String(row.workTitle),
      excerpt: String(row.excerpt),
      sourceUrl: String(row.sourceUrl ?? ""),
      sourceWork: String(row.sourceWork ?? ""),
      deathYear: Number(row.deathYear),
      century: Number(row.century),
      provenance: row.provenance as Link["provenance"],
      confidence: Number(row.confidence),
      status: row.status as Link["status"],
      refs: JSON.parse(String(row.refsJson || "[]"))
    }));
  } finally {
    db.close();
  }
}

export function readLinksFromDisk(root: string): Link[] {
  const sqlitePath = join(root, "data", "links", "links.sqlite");
  const jsonPath = join(root, "data", "links", "links.json");
  if (existsSync(sqlitePath)) {
    try {
      return loadSqlite(sqlitePath);
    } catch {
      // JSON fallback when sqlite cannot be opened.
    }
  }
  if (existsSync(jsonPath)) return loadJson(jsonPath);
  return [];
}

export function loadLinkStore(root = process.cwd()): LinkStore {
  return createLinkStore(readLinksFromDisk(root));
}
