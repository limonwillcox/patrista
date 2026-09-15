import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { DatabaseSync } from "node:sqlite";
import { refOverlapsVerse } from "./loc";
import type { Canon, CenturyNode, Link, TestamentNode } from "./types";

export type LinkStore = {
  getLinksForVerse(bookId: string, ch: number, vs: number): Link[];
  getLinksForSection(sectionId: string): Link[];
  getTreeForVerse(bookId: string, ch: number, vs: number): CenturyNode[];
  getTreeForSection(sectionId: string): TestamentNode[];
  getLinkById(id: string): Link | undefined;
};

const CANON_ORDER: Record<Canon, number> = { ot: 0, nt: 1, dt: 2 };

function live(links: Link[]): Link[] {
  return links.filter((l) => l.status !== "rejected");
}

export function createLinkStore(links: Link[]): LinkStore {
  const rows = live(links);
  const byId = new Map<string, Link>(rows.map((l) => [l.id, l]));

  function getLinkById(id: string): Link | undefined {
    return byId.get(id);
  }

  function getLinksForVerse(bookId: string, ch: number, vs: number): Link[] {
    return rows.filter((l) => l.refs.some((r) => refOverlapsVerse(r, bookId, ch, vs)));
  }

  function getLinksForSection(sectionId: string): Link[] {
    return rows.filter((l) => l.sectionId === sectionId);
  }

  function getTreeForVerse(bookId: string, ch: number, vs: number): CenturyNode[] {
    const hits = getLinksForVerse(bookId, ch, vs);
    const byCentury = new Map<number, Map<string, { deathYear: number; works: Map<string, Link[]> }>>();
    for (const link of hits) {
      let fathers = byCentury.get(link.century);
      if (!fathers) {
        fathers = new Map();
        byCentury.set(link.century, fathers);
      }
      let father = fathers.get(link.fatherId);
      if (!father) {
        father = { deathYear: link.deathYear, works: new Map() };
        fathers.set(link.fatherId, father);
      }
      const workKey = link.workId;
      const workLinks = father.works.get(workKey) || [];
      workLinks.push(link);
      father.works.set(workKey, workLinks);
    }
    return [...byCentury.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([century, fathers]) => ({
        century,
        fathers: [...fathers.entries()]
          .sort((a, b) => a[1].deathYear - b[1].deathYear || a[0].localeCompare(b[0]))
          .map(([fatherId, father]) => ({
            fatherId,
            deathYear: father.deathYear,
            works: [...father.works.entries()]
              .sort((a, b) => a[1][0]!.workTitle.localeCompare(b[1][0]!.workTitle))
              .map(([workId, workLinks]) => ({
                workId,
                workTitle: workLinks[0]!.workTitle,
                links: workLinks
              }))
          }))
      }));
  }

  function getTreeForSection(sectionId: string): TestamentNode[] {
    const hits = getLinksForSection(sectionId);
    const byCanon = new Map<Canon, Map<string, { bookNum: number; refs: typeof hits[0]["refs"] }>>();
    const seen = new Set<string>();
    for (const link of hits) {
      for (const ref of link.refs) {
        const key = [ref.bookId, ref.chapter, ref.verseStart, ref.verseEnd].join(":");
        if (seen.has(key)) continue;
        seen.add(key);
        let books = byCanon.get(ref.canon);
        if (!books) {
          books = new Map();
          byCanon.set(ref.canon, books);
        }
        let book = books.get(ref.bookId);
        if (!book) {
          book = { bookNum: ref.bookNum, refs: [] };
          books.set(ref.bookId, book);
        }
        book.refs.push(ref);
      }
    }
    return [...byCanon.entries()]
      .sort((a, b) => CANON_ORDER[a[0]] - CANON_ORDER[b[0]])
      .map(([canon, books]) => ({
        canon,
        books: [...books.entries()]
          .sort((a, b) => a[1].bookNum - b[1].bookNum)
          .map(([bookId, book]) => ({
            bookId,
            bookNum: book.bookNum,
            refs: [...book.refs].sort((a, b) => a.locStart - b.locStart || a.locEnd - b.locEnd)
          }))
      }));
  }

  return { getLinksForVerse, getLinksForSection, getTreeForVerse, getTreeForSection, getLinkById };
}

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
