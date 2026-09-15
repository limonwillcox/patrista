import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { loadBooks } from "../src/links/books";
import type { ChapterLinksPack } from "../src/links/pack";
import { createLinkStore, readLinksFromDisk } from "../src/links/store";
import type { Canon, Link } from "../src/links/types";
import { repoRoot } from "./corpus";

type ChapterBucket = {
  bookId: string;
  bookNum: number;
  canon: Canon;
  chapter: number;
  links: Map<string, Link>;
  verses: Map<number, Set<string>>;
};

export function writeStaticLinksApi(dist: string, root = repoRoot()): string[] {
  const all = readLinksFromDisk(root).filter((l) => l.status !== "rejected");
  const store = createLinkStore(all);
  const books = loadBooks(root);
  const bookMeta = new Map(books.map((b) => [b.bookId, b]));
  const chapters = new Map<string, ChapterBucket>();
  const sectionIds = new Set<string>();
  const redirects: string[] = [];

  for (const link of all) {
    if (link.sectionId) sectionIds.add(link.sectionId);
    for (const ref of link.refs) {
      const meta = bookMeta.get(ref.bookId);
      if (!meta) continue;
      const key = ref.bookId + ":" + ref.chapter;
      let bucket = chapters.get(key);
      if (!bucket) {
        bucket = {
          bookId: ref.bookId,
          bookNum: meta.bookNum,
          canon: meta.canon,
          chapter: ref.chapter,
          links: new Map(),
          verses: new Map()
        };
        chapters.set(key, bucket);
      }
      bucket.links.set(link.id, link);
      for (let v = ref.verseStart; v <= ref.verseEnd; v++) {
        let ids = bucket.verses.get(v);
        if (!ids) {
          ids = new Set();
          bucket.verses.set(v, ids);
        }
        ids.add(link.id);
      }
    }
  }

  const chapterRoot = join(dist, "api", "links", "chapter");
  mkdirSync(chapterRoot, { recursive: true });
  for (const bucket of chapters.values()) {
    if (bucket.verses.size === 0) continue;
    const pack: ChapterLinksPack = {
      bookId: bucket.bookId,
      bookNum: bucket.bookNum,
      canon: bucket.canon,
      chapter: bucket.chapter,
      links: Object.fromEntries(bucket.links),
      verses: Object.fromEntries(
        [...bucket.verses.entries()]
          .sort((a, b) => a[0] - b[0])
          .map(([v, ids]) => [String(v), [...ids]])
      )
    };
    const bookDir = join(chapterRoot, bucket.bookId);
    mkdirSync(bookDir, { recursive: true });
    writeFileSync(join(bookDir, bucket.chapter + ".json"), JSON.stringify(pack));
    redirects.push(
      `/api/links/chapter/${bucket.bookId}/${bucket.chapter}  /api/links/chapter/${bucket.bookId}/${bucket.chapter}.json  200`
    );
  }

  const sectionRoot = join(dist, "api", "links", "section");
  mkdirSync(sectionRoot, { recursive: true });
  for (const sectionId of [...sectionIds].sort()) {
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
    const body = {
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
    };
    const file = encodeURIComponent(sectionId) + ".json";
    writeFileSync(join(sectionRoot, file), JSON.stringify(body));
    redirects.push(
      `/api/links/section/${encodeURIComponent(sectionId)}  /api/links/section/${file}  200`
    );
  }

  const excerptRoot = join(dist, "api", "links", "excerpt");
  mkdirSync(excerptRoot, { recursive: true });
  for (const link of all) {
    const file = encodeURIComponent(link.id) + ".json";
    writeFileSync(join(excerptRoot, file), JSON.stringify(link));
    redirects.push(`/api/links/excerpt/${encodeURIComponent(link.id)}  /api/links/excerpt/${file}  200`);
  }

  return redirects;
}
