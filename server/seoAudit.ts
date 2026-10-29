import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join, relative, sep } from "path";
import { chapterPublicPath, legacyChapterSlugs } from "../src/lib/fatherPaths";
import { DESCRIPTION_HARD_MAX, DESCRIPTION_MIN, TITLE_MAX } from "../src/lib/seoMeta";

export type SeoAuditResult = { checked: number; stubs: number; errors: string[] };

const CHAPTER_PATH = /^\/fathers\/([^/]+)\/([^/]+)\/([^/]+)\/$/;
const WORK_PATH = /^\/fathers\/[^/]+\/[^/]+\.html$/;

/**
 * Old chapter URLs that must keep resolving, worked out here rather than taken from the page
 * generator: the pre-renumbering sitemap snapshot (data/seo/legacy-chapter-urls.txt) plus the
 * heading-based slugs today's catalog would have produced before chapters were numbered.
 */
export function oldChapterUrls(
  works: { authorId: string; workId: string; chapters: { chapter: number; heading: string }[] }[],
  root = process.cwd()
): string[] {
  const out = new Set<string>();
  const file = join(root, "data", "seo", "legacy-chapter-urls.txt");
  // The snapshot is the only record of URLs the old parser produced; never fall back to "no old URLs".
  if (!existsSync(file)) throw new Error("SEO audit: " + file + " is missing; old chapter URLs cannot be checked");
  for (const line of readFileSync(file, "utf8").split("\n")) if (line.startsWith("/fathers/")) out.add(line.trim());
  if (!out.size) throw new Error("SEO audit: " + file + " lists no /fathers/ URLs");
  for (const w of works) {
    if (w.chapters.length < 2) continue;
    for (const slug of legacyChapterSlugs(w.chapters).values()) out.add(chapterPublicPath(w.authorId, w.workId, slug));
  }
  return [...out].sort();
}

function htmlFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    const st = statSync(abs);
    if (st.isDirectory()) {
      if (name === "api" || name === "assets") continue;
      htmlFiles(abs, out);
    } else if (name.endsWith(".html")) out.push(abs);
  }
  return out;
}

function decode(s: string): string {
  return s.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

/** URL path a dist file is served at. */
function servedPath(dist: string, file: string): string {
  const rel = "/" + relative(dist, file).split(sep).join("/");
  return rel.endsWith("/index.html") ? rel.slice(0, -"index.html".length) : rel;
}

/**
 * Fail the build on SEO regressions in dist/:
 * /fathers/ work or chapter pages that are noindex or not self-canonical, duplicate titles or
 * descriptions, titles over 60 chars, descriptions under 100 or over 160 chars, chapter slugs over
 * 20 chars or not numbered 1..N per work, internal links or sitemap entries that point at
 * moved-chapter stubs, stubs that point at no live page, and old chapter URLs that no longer resolve.
 */
export function auditSeo(dist: string, origin: string, oldUrls: string[] = []): SeoAuditResult {
  const errors: string[] = [];
  const titles = new Map<string, string>();
  const descs = new Map<string, string>();
  const stubPaths = new Set<string>();
  const stubTargets = new Map<string, string>();
  const pages: { path: string; html: string }[] = [];
  const indexable = new Set<string>();
  const chapterNums = new Map<string, number[]>();

  for (const file of htmlFiles(dist)) {
    const html = readFileSync(file, "utf8");
    const path = servedPath(dist, file);
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
    if (/<meta\s+http-equiv="refresh"/i.test(html)) {
      // Only /fathers/ refresh pages are moved-chapter stubs (e.g. /get-app.html is a plain redirect page).
      if (!path.startsWith("/fathers/")) continue;
      stubPaths.add(path);
      stubTargets.set(path, canonical ? decode(canonical[1]!).replace(origin, "") : "");
      continue;
    }
    const noindex = /<meta\s+name="robots"[^>]*noindex/i.test(html);
    const selfCanonical = !!canonical && decode(canonical[1]!) === origin + path;
    const fathersPage = WORK_PATH.test(path) || CHAPTER_PATH.test(path);
    if (fathersPage && noindex) errors.push("noindex on a /fathers/ page: " + path);
    if (fathersPage && !selfCanonical) errors.push("canonical is not itself: " + path + " -> " + (canonical ? decode(canonical[1]!) : "(none)"));
    // Indexable = self-canonical and not noindex. SPA shells and alias copies elsewhere are skipped.
    if (!selfCanonical || noindex) continue;
    pages.push({ path, html });
    indexable.add(path);
    const title = decode(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "").trim();
    const desc = decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "").trim();
    if (!title) errors.push("missing <title>: " + path);
    if (title.length > TITLE_MAX) errors.push("title over " + TITLE_MAX + " chars: " + path + " (" + title + ")");
    if (desc.length < DESCRIPTION_MIN) errors.push("description under " + DESCRIPTION_MIN + " chars: " + path + " (" + desc + ")");
    if (desc.length > DESCRIPTION_HARD_MAX) errors.push("description over " + DESCRIPTION_HARD_MAX + " chars: " + path + " (" + desc + ")");
    if (titles.has(title)) errors.push("duplicate title: " + path + " and " + titles.get(title) + " (" + title + ")");
    else titles.set(title, path);
    if (descs.has(desc)) errors.push("duplicate description: " + path + " and " + descs.get(desc));
    else descs.set(desc, path);
    const m = path.match(CHAPTER_PATH);
    if (m) {
      const slug = m[3]!;
      if (slug.length > 20) errors.push("chapter slug over 20 chars: " + path);
      const n = slug.match(/^chapter-(\d+)$/);
      if (!n) errors.push("chapter slug is not chapter-<N>: " + path);
      else {
        const key = m[1] + "/" + m[2];
        chapterNums.set(key, [...(chapterNums.get(key) ?? []), Number(n[1])]);
      }
    }
  }

  for (const [work, nums] of chapterNums) {
    const sorted = [...nums].sort((a, b) => a - b);
    if (sorted.some((v, i) => v !== i + 1)) errors.push("chapter numbers do not run 1..N without gaps or duplicates: " + work);
  }

  for (const page of pages) {
    for (const m of page.html.matchAll(/href="([^"]+)"/g)) {
      let href = decode(m[1]!);
      if (href.startsWith(origin)) href = href.slice(origin.length);
      href = href.split("#")[0]!.split("?")[0]!;
      if (stubPaths.has(href)) errors.push("internal link to a moved chapter: " + page.path + " -> " + href);
    }
  }

  for (const [stub, target] of stubTargets) {
    if (!indexable.has(target)) errors.push("stub points at no indexable page: " + stub + " -> " + (target || "(none)"));
  }

  for (const old of oldUrls) {
    if (!stubPaths.has(old) && !indexable.has(old)) errors.push("old chapter URL no longer resolves (no stub, no page): " + old);
  }

  for (const name of existsSync(dist) ? readdirSync(dist) : []) {
    if (!/^sitemap.*\.xml$/.test(name)) continue;
    for (const m of readFileSync(join(dist, name), "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const p = decode(m[1]!).replace(origin, "");
      if (stubPaths.has(p)) errors.push("sitemap lists a moved-chapter stub: " + p);
    }
  }

  return { checked: pages.length, stubs: stubPaths.size, errors };
}
