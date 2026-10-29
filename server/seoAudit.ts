import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join, relative, sep } from "path";
import { DESCRIPTION_MIN, TITLE_MAX } from "../src/lib/seoMeta";

export type SeoAuditResult = { checked: number; stubs: number; errors: string[] };

const CHAPTER_PATH = /^\/fathers\/([^/]+)\/([^/]+)\/([^/]+)\/$/;

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
 * duplicate titles or descriptions, titles over 65 chars, descriptions under 100 chars,
 * chapter slugs over 20 chars or not numbered 1..N per work, internal links or sitemap entries
 * that point at moved-chapter stubs, and old chapter URLs without a stub.
 */
export function auditSeo(dist: string, origin: string, expectedStubs: string[] = []): SeoAuditResult {
  const errors: string[] = [];
  const titles = new Map<string, string>();
  const descs = new Map<string, string>();
  const stubPaths = new Set<string>();
  const pages: { path: string; html: string }[] = [];
  const chapterNums = new Map<string, number[]>();

  for (const file of htmlFiles(dist)) {
    const html = readFileSync(file, "utf8");
    const path = servedPath(dist, file);
    if (/<meta\s+http-equiv="refresh"/i.test(html)) {
      stubPaths.add(path);
      continue;
    }
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
    // Indexable = self-canonical and not noindex. SPA shells and alias copies are skipped.
    if (!canonical || decode(canonical[1]!) !== origin + path) continue;
    if (/<meta\s+name="robots"[^>]*noindex/i.test(html)) continue;
    pages.push({ path, html });
    const title = decode(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "").trim();
    const desc = decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "").trim();
    if (!title) errors.push("missing <title>: " + path);
    if (title.length > TITLE_MAX) errors.push("title over " + TITLE_MAX + " chars: " + path + " (" + title + ")");
    if (desc.length < DESCRIPTION_MIN) errors.push("description under " + DESCRIPTION_MIN + " chars: " + path + " (" + desc + ")");
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

  for (const old of expectedStubs) {
    if (!stubPaths.has(old)) errors.push("old chapter URL has no stub: " + old);
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
