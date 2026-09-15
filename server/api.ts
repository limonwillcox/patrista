import { getBibleChapterPayload, getBibleManifest } from "./bible";
import { getLibrary, repoRoot } from "./corpus";
import { authorById, parseQuery, searchKeyword, workById } from "./query";
import type { ApiResult, Passage, WorkPayload } from "./types";
import { bibleRef, bookById, loadBooks } from "../src/links/books";
import { loadLinkStore, type LinkStore } from "../src/links/store";

export function getCatalog() {
  return getLibrary().catalog;
}

export function getWork(workId: string): WorkPayload | null {
  const { catalog, passages } = getLibrary();
  const work = workById(catalog, workId);
  if (!work) return null;
  const author = authorById(catalog, work.author);
  if (!author) return null;
  const chapters = passages
    .filter((p) => p.work === work.id)
    .sort((a, b) => a.chapter - b.chapter);
  return { work, author, chapters };
}

export function getChapter(workId: string, chapter: number): Passage | null {
  const payload = getWork(workId);
  if (!payload) return null;
  return payload.chapters.find((p) => p.chapter === chapter) || null;
}

export function runSearch(q: string) {
  const { catalog, passages } = getLibrary();
  const query = parseQuery(q, catalog);
  if (query.type === "empty") return { query, hits: [] as ReturnType<typeof searchKeyword> };
  if (query.type === "ref") return { query, hits: [] as ReturnType<typeof searchKeyword> };
  return { query, hits: searchKeyword(query.q, catalog, passages) };
}

let cachedLinkStore: LinkStore | null = null;

export function getLinkStore(root = repoRoot()): LinkStore {
  if (!cachedLinkStore) {
    cachedLinkStore = loadLinkStore(root);
  }
  return cachedLinkStore;
}

export function clearLinkStoreCache(): void {
  cachedLinkStore = null;
}

export function setLinkStore(store: LinkStore | null): void {
  cachedLinkStore = store;
}

export function handleApiRequest(urlOrPath: string): ApiResult {
  const url = urlOrPath.startsWith("http") ? new URL(urlOrPath) : new URL(urlOrPath, "http://localhost");
  const path = url.pathname.replace(/\/+$/, "") || "/";

  if (path === "/api/catalog") {
    return { status: 200, json: getCatalog() };
  }

  const chapterMatch = path.match(/^\/api\/works\/([^/]+)\/chapters\/(\d+)$/);
  if (chapterMatch) {
    const workId = decodeURIComponent(chapterMatch[1]);
    const n = Number(chapterMatch[2]);
    const chapter = getChapter(workId, n);
    if (!chapter) return { status: 404, json: { error: "Chapter not found" } };
    return { status: 200, json: chapter };
  }

  const workMatch = path.match(/^\/api\/works\/([^/]+)$/);
  if (workMatch) {
    const workId = decodeURIComponent(workMatch[1]);
    const payload = getWork(workId);
    if (!payload) return { status: 404, json: { error: "Work not found" } };
    return { status: 200, json: payload };
  }

  if (path === "/api/search") {
    const q = url.searchParams.get("q") || "";
    return { status: 200, json: runSearch(q) };
  }

  if (path === "/api/bible/manifest") {
    return { status: 200, json: getBibleManifest(repoRoot()) };
  }

  const bibleChapter = path.match(/^\/api\/bible\/([^/]+)\/(\d+)$/);
  if (bibleChapter) {
    const bookId = decodeURIComponent(bibleChapter[1]);
    const n = Number(bibleChapter[2]);
    const section = url.searchParams.get("section") || undefined;
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const payload = getBibleChapterPayload(repoRoot(), bookId, n, {
      section,
      from: from ? Number(from) : undefined,
      to: to ? Number(to) : undefined
    });
    if (!payload) return { status: 404, json: { error: "Bible chapter not found" } };
    return { status: 200, json: payload };
  }

  if (path === "/api/links/verse") {
    const rawBook = url.searchParams.get("book");
    if (!rawBook) {
      return { status: 400, json: { error: "Unknown book: missing" } };
    }
    const cleanBook = rawBook.trim().toLowerCase();
    const root = repoRoot();
    const bookMeta =
      bookById(root, cleanBook) ||
      loadBooks(root).find((b) => b.name.toLowerCase() === cleanBook);
    if (!bookMeta) {
      return { status: 400, json: { error: `Unknown book: ${rawBook}` } };
    }

    const chStr = url.searchParams.get("chapter");
    const vsStr = url.searchParams.get("verse");
    if (!chStr || !vsStr) {
      return { status: 400, json: { error: "Missing chapter or verse" } };
    }
    const ch = Number(chStr);
    const vs = Number(vsStr);
    if (!Number.isInteger(ch) || !Number.isInteger(vs) || ch < 1 || vs < 1) {
      return { status: 400, json: { error: "Invalid chapter or verse" } };
    }

    const store = getLinkStore(root);
    const ref = bibleRef(root, bookMeta.bookId, ch, vs, vs);
    const hits = store.getLinksForVerse(bookMeta.bookId, ch, vs);
    const tree = store.getTreeForVerse(bookMeta.bookId, ch, vs);
    const fatherIds = new Set(hits.map((l) => l.fatherId));
    const workIds = new Set(hits.map((l) => l.workId));
    const centuries = new Set(hits.map((l) => l.century));

    return {
      status: 200,
      json: {
        ref,
        tree,
        counts: {
          links: hits.length,
          total: hits.length,
          centuries: centuries.size,
          fathers: fatherIds.size,
          works: workIds.size
        }
      }
    };
  }

  if (path === "/api/links/section") {
    const sectionId = url.searchParams.get("sectionId");
    if (!sectionId) {
      return { status: 400, json: { error: "Missing sectionId parameter" } };
    }
    const root = repoRoot();
    const store = getLinkStore(root);
    const hits = store.getLinksForSection(sectionId);
    const tree = store.getTreeForSection(sectionId);
    const fatherIds = new Set(hits.map((l) => l.fatherId));
    const bookIds = new Set<string>();
    let refCount = 0;
    for (const l of hits) {
      for (const r of l.refs) {
        bookIds.add(r.bookId);
        refCount++;
      }
    }
    const canons = new Set(tree.map((t) => t.canon));

    return {
      status: 200,
      json: {
        sectionId,
        tree,
        counts: {
          links: hits.length,
          total: hits.length,
          fathers: fatherIds.size,
          books: bookIds.size,
          refs: refCount,
          canons: canons.size
        }
      }
    };
  }

  const excerptMatch = path.match(/^\/api\/links\/excerpt\/([^/]+)$/);
  if (excerptMatch) {
    const id = decodeURIComponent(excerptMatch[1]);
    const store = getLinkStore(repoRoot());
    const link = store.getLinkById(id);
    if (!link) {
      return { status: 404, json: { error: "Link not found" } };
    }
    return { status: 200, json: link };
  }

  return { status: 404, json: { error: "Not found" } };
}
