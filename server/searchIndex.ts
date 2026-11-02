import { join } from "path";
import { getWork } from "./api";
import { deathCentury } from "./shelf";
import type { Catalog } from "./types";
import { assignChapterSlugs, chapterPublicPath, englishParagraphs } from "../src/lib/fatherPaths";
import { readPath } from "../src/lib/workSlugs";

function ordinal(n: number): string {
  return n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : n + "th";
}

export type SearchRecord = {
  url: string;
  content: string;
  meta: { title: string; work: string; chapter: string; author: string };
  filters: { father: string[]; century: string[] };
};

/** One search record per chapter: the English text, keyed to the chapter's public URL. */
export function searchRecords(catalog: Catalog): SearchRecord[] {
  const out: SearchRecord[] = [];
  for (const w of catalog.works) {
    const payload = getWork(w.id);
    if (!payload) continue;
    const author = payload.author;
    const century = author.id === "councils" ? "Councils" : ordinal(deathCentury(author.deathYear)) + " century";
    const slugs = assignChapterSlugs(payload.chapters);
    const split = payload.chapters.length > 1;
    for (const ch of payload.chapters) {
      const paras = englishParagraphs(ch.versions);
      if (!paras.length) continue;
      const slug = slugs.get(ch.chapter);
      const url = split && slug ? chapterPublicPath(author.id, w.id, slug) : readPath(w.id);
      out.push({
        url,
        content: paras.join("\n\n"),
        meta: {
          title: split ? w.title + " — " + ch.heading : w.title,
          work: w.title,
          chapter: split ? ch.heading : "",
          author: author.name
        },
        filters: { father: [author.name], century: [century] }
      });
    }
  }
  return out;
}

/**
 * Full-text search for the static site. Pagefind writes a chunked index to dist/pagefind/; the browser
 * downloads only the chunks a query needs. Set SKIP_SEARCH_INDEX=1 for a faster local build.
 */
export async function writeSearchIndex(dist: string, catalog: Catalog): Promise<number> {
  const pagefind = await import("pagefind");
  const { index, errors } = await pagefind.createIndex({ forceLanguage: "en" });
  if (!index) throw new Error("Pagefind: " + errors.join("; "));
  const records = searchRecords(catalog);
  for (const r of records) {
    const added = await index.addCustomRecord({ ...r, language: "en" });
    if (added.errors.length) throw new Error("Pagefind " + r.url + ": " + added.errors.join("; "));
  }
  const written = await index.writeFiles({ outputPath: join(dist, "pagefind") });
  if (written.errors.length) throw new Error("Pagefind write: " + written.errors.join("; "));
  await pagefind.close();
  return records.length;
}
