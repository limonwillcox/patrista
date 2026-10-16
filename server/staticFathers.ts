import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { getWork } from "./api";
import {
  assertChapterPageQuality,
  CHAPTER_REDIRECTS,
  numberingWarnings,
  renderRedirectHtml,
  uniqueChapterHeadings
} from "./chapterQuality";
import { junkTrimLog } from "./englishWorks";
import type { Author, Catalog, Passage, Work } from "./types";
import {
  assignChapterSlugs,
  authorAnchorId,
  chapterPageTitle,
  chapterPublicPath,
  englishParagraphs,
  escapeHtml,
  metaDescription,
  slugifyHeading,
  workPageTitle,
  workPublicPath
} from "../src/lib/fatherPaths";

export const SITEMAP_URL_LIMIT = 50_000;

/** A single passage above this size was not split into literary chapters. */
export const LARGE_UNSPLIT_WORDS = 8_000;

export type SplitNote = {
  id: string;
  author: string;
  title: string;
  reason: string;
};

type ChapterRef = {
  chapter: number;
  heading: string;
  slug: string;
  path: string;
};

function romanToInt(raw: string): number | null {
  const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  const s = raw.toUpperCase();
  if (!/^[IVXLCDM]+$/.test(s)) return null;
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const value = map[s[i]];
    const next = map[s[i + 1]] || 0;
    n += value < next ? -value : value;
  }
  return n > 0 ? n : null;
}

const UNIT_HEADING = /^(Homily|Book|Letter|Sermon|Chapter)\s+([IVXLCDM]+)$/i;

function missingUnitNumbers(headings: string[]): number[] {
  const nums: number[] = [];
  for (const heading of headings) {
    const match = heading.match(UNIT_HEADING);
    if (!match) return [];
    const n = romanToInt(match[2]);
    if (n == null) return [];
    nums.push(n);
  }
  if (nums.length < 2) return [];
  const have = new Set(nums);
  const max = Math.max(...nums);
  const missing: number[] = [];
  for (let i = 1; i <= max; i++) {
    if (!have.has(i)) missing.push(i);
  }
  return missing.length > 0 && missing.length <= 3 ? missing : [];
}

export function describeSplit(work: Work, chapters: Passage[]): SplitNote[] {
  const notes: SplitNote[] = [];
  const headings = chapters.map((ch) => ch.heading);
  const base = { id: work.id, author: work.author, title: work.title };
  if (chapters.length > 1 && headings.every((h) => / · Part \d+$/.test(h))) {
    notes.push({
      ...base,
      reason:
        "Split into artificial parts of about 40 paragraphs. The source had no book, chapter, homily, sermon, or letter marks the reader could use."
    });
  }
  if (chapters.length === 1 && work.wordCount > LARGE_UNSPLIT_WORDS) {
    notes.push({
      ...base,
      reason:
        "One passage over " +
        LARGE_UNSPLIT_WORDS.toLocaleString("en-US") +
        " words. No literary chapter marks were found, so the full text stays on the work page."
    });
  }
  const slugs = assignChapterSlugs(chapters);
  const collided: string[] = [];
  for (const ch of chapters) {
    if (/\s*\(Part \d+\)$/.test(ch.heading)) continue;
    const plain = slugifyHeading(ch.heading) || "chapter-" + ch.chapter;
    const slug = slugs.get(ch.chapter);
    if (slug && slug !== plain) collided.push(plain);
  }
  if (collided.length) {
    notes.push({
      ...base,
      reason: "Duplicate headings share a slug (" + [...new Set(collided)].slice(0, 6).join(", ") + "). Later units get the chapter number appended."
    });
  }
  const numbering = numberingWarnings(headings);
  for (const warning of numbering) {
    notes.push({
      ...base,
      reason: "Unit numbers " + warning + " (headings run to " + headings[headings.length - 1] + "). Gaps or repeats that are real in the source are left as warnings."
    });
  }
  return notes;
}

function chapterRefs(authorId: string, workId: string, chapters: Passage[]): ChapterRef[] {
  const slugs = assignChapterSlugs(chapters);
  return chapters.map((ch) => {
    const slug = slugs.get(ch.chapter) || "chapter-" + ch.chapter;
    return {
      chapter: ch.chapter,
      heading: ch.heading,
      slug,
      path: chapterPublicPath(authorId, workId, slug)
    };
  });
}

function paragraphsHtml(passage: Passage): string {
  return englishParagraphs(passage.versions)
    .filter((p) => p.trim())
    .map((p) => "<p>" + escapeHtml(p) + "</p>")
    .join("\n");
}

function notesHtml(passage: Passage): string {
  if (!passage.footnotes.length) return "";
  const items = passage.footnotes
    .map((f) => "<li>" + escapeHtml((f.n ? f.n + ". " : "") + f.text) + "</li>")
    .join("\n");
  return "<h2>Notes</h2>\n<ol class=\"static-notes\">\n" + items + "\n</ol>";
}

function proseOf(passage: Passage): string {
  return englishParagraphs(passage.versions).join(" ");
}

export function breadcrumbJsonLd(opts: {
  origin: string;
  author: Author;
  workTitle: string;
  workPath: string;
  chapterLabel: string;
  chapterPath: string;
}): unknown {
  const chapterUrl = opts.origin + opts.chapterPath;
  const workUrl = opts.origin + opts.workPath;
  const author = { "@type": "Person", name: opts.author.name };
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Chapter",
        name: opts.chapterLabel,
        url: chapterUrl,
        inLanguage: "en",
        isPartOf: {
          "@type": "Book",
          name: opts.workTitle,
          url: workUrl,
          author
        },
        author
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Patrista", item: opts.origin + "/" },
          { "@type": "ListItem", position: 2, name: "Church Fathers", item: opts.origin + "/church-fathers/" },
          {
            "@type": "ListItem",
            position: 3,
            name: opts.author.name,
            item: opts.origin + "/church-fathers/#" + authorAnchorId(opts.author.id)
          },
          { "@type": "ListItem", position: 4, name: opts.workTitle, item: workUrl },
          { "@type": "ListItem", position: 5, name: opts.chapterLabel, item: chapterUrl }
        ]
      }
    ]
  };
}

export function bookJsonLd(opts: {
  origin: string;
  authorName: string;
  workTitle: string;
  workPath: string;
  parts: { name: string; path: string }[];
}): unknown {
  const url = opts.origin + opts.workPath;
  const book: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: opts.workTitle,
    url,
    inLanguage: "en",
    author: { "@type": "Person", name: opts.authorName }
  };
  if (opts.parts.length) {
    book.hasPart = opts.parts.map((part) => ({
      "@type": "Chapter",
      name: part.name,
      url: opts.origin + part.path
    }));
  }
  return book;
}

export function renderChapterBody(opts: {
  authorName: string;
  workTitle: string;
  workPath: string;
  chapter: Passage;
  prev: ChapterRef | null;
  next: ChapterRef | null;
}): string {
  const links: string[] = [];
  if (opts.prev) {
    links.push('<a href="' + escapeHtml(opts.prev.path) + '" rel="prev">Previous</a>');
  }
  links.push('<a href="' + escapeHtml(opts.workPath) + '">Up</a>');
  if (opts.next) {
    links.push('<a href="' + escapeHtml(opts.next.path) + '" rel="next">Next</a>');
  }
  return [
    '<article class="static-chapter">',
    '<nav class="static-pager" aria-label="Chapter">' + links.join("\n") + "</nav>",
    '<p class="static-kicker">' +
      escapeHtml(opts.authorName) +
      ' · <a href="' +
      escapeHtml(opts.workPath) +
      '">' +
      escapeHtml(opts.workTitle) +
      "</a></p>",
    "<h1>" + escapeHtml(opts.chapter.heading) + "</h1>",
    '<div class="static-text">',
    paragraphsHtml(opts.chapter),
    "</div>",
    notesHtml(opts.chapter),
    "</article>"
  ].join("\n");
}

function jsonScript(data: unknown): string {
  return '<script type="application/ld+json">' + JSON.stringify(data).replace(/</g, "\\u003c") + "</script>";
}

const WORK_PAGE_CSS = [
  "body{font-family:Georgia,serif;max-width:42rem;margin:1.5rem auto;padding:0 1rem;line-height:1.55;color:#1a1a1a}",
  "h1{font-family:system-ui,sans-serif;font-size:1.6rem}",
  "a{color:#952004}",
  ".static-kicker{font-family:system-ui,sans-serif}",
  ".start-reading{display:inline-block;margin:8px 0 16px;padding:12px 20px;background:#952004;color:#fff;font-family:system-ui,sans-serif;font-size:16px;font-weight:700;border-radius:3px;text-decoration:none}",
  ".start-reading:hover{background:#6f1602;color:#fff}",
  ".chapter-index{margin:8px 0 0;max-width:36rem}",
  ".chapter-index>summary{cursor:pointer;list-style:none;font-family:system-ui,sans-serif;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#666;user-select:none}",
  ".chapter-index>summary::-webkit-details-marker{display:none}",
  '.chapter-index>summary::before{content:"▸";display:inline-block;width:1em;color:#952004;transition:transform .12s ease}',
  ".chapter-index[open]>summary::before{transform:rotate(90deg)}",
  ".chapter-index-list{display:block;margin:8px 0 0;padding:4px 0;border:1px solid #d9d9d9;max-height:11em;overflow:auto}",
  ".chapter-index-list a{display:block;height:2.2em;line-height:2.2em;padding:0 10px;font-family:system-ui,sans-serif;font-size:14px;color:#1a1a1a;text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
  ".chapter-index-list a:hover{background:#f6f6f6;color:#952004}"
].join("");

export function renderWorkPage(opts: {
  origin: string;
  author: Author;
  work: Work;
  chapters: Passage[];
}): { html: string; path: string; chapterPaths: string[] } {
  const path = workPublicPath(opts.author.id, opts.work.id);
  const url = opts.origin + path;
  const refs = chapterRefs(opts.author.id, opts.work.id, opts.chapters);
  const split = opts.chapters.length > 1;
  const title = workPageTitle(opts.author.name, opts.work.title);
  const description = split
    ? metaDescription("Contents of " + opts.work.title + " by " + opts.author.name + ".")
    : metaDescription(proseOf(opts.chapters[0]) || opts.work.title);
  const ld = bookJsonLd({
    origin: opts.origin,
    authorName: opts.author.name,
    workTitle: opts.work.title,
    workPath: path,
    parts: split ? refs.map((r) => ({ name: r.heading, path: r.path })) : []
  });

  const body: string[] = [];
  body.push(
    '<p class="static-kicker"><a href="/">Patrista</a> · <a href="/church-fathers/">Church Fathers</a></p>'
  );
  body.push("<h1>" + escapeHtml(opts.work.title) + "</h1>");
  body.push(
    "<p>" +
      escapeHtml(opts.author.name) +
      (opts.author.dates ? " (" + escapeHtml(opts.author.dates) + ")" : "") +
      "</p>"
  );
  if (split) {
    const first = refs[0]!;
    body.push('<p><a class="start-reading" href="' + escapeHtml(first.path) + '">Start reading</a></p>');
    body.push('<details class="chapter-index">');
    body.push("<summary>Chapters (" + refs.length + ")</summary>");
    body.push('<nav class="chapter-index-list" aria-label="Chapters">');
    for (const ref of refs) {
      body.push(
        '<a href="' +
          escapeHtml(ref.path) +
          '" title="' +
          escapeHtml(ref.heading) +
          '">' +
          escapeHtml(ref.heading) +
          "</a>"
      );
    }
    body.push("</nav></details>");
  } else if (opts.chapters[0]) {
    body.push('<div class="static-text">');
    body.push(paragraphsHtml(opts.chapters[0]));
    body.push("</div>");
    body.push(notesHtml(opts.chapters[0]));
  }

  const html = [
    "<!DOCTYPE html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="utf-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1" />',
    "  <title>" + escapeHtml(title) + "</title>",
    '  <meta name="description" content="' + escapeHtml(description) + '" />',
    '  <link rel="canonical" href="' + escapeHtml(url) + '" />',
    "  " + jsonScript(ld),
    "  <style>" + WORK_PAGE_CSS + "</style>",
    "</head>",
    "<body>",
    body.join("\n"),
    "</body>",
    "</html>",
    ""
  ].join("\n");

  return { html, path, chapterPaths: split ? refs.map((r) => r.path) : [] };
}

export type PrerenderOpts = {
  canonicalPath: string;
  bodyHtml: string;
  title: string;
  description: string;
  jsonLd?: unknown;
  extraHead?: string;
};

/** Fill the Vite shell (dist/index.html) with crawlable body copy. */
export function prerenderShell(indexHtml: string, origin: string, opts: PrerenderOpts): string {
  const canonical = origin + opts.canonicalPath;
  const headParts = [
    '    <link rel="canonical" href="' + escapeHtml(canonical) + '" />',
    '    <meta property="og:type" content="article" />',
    '    <meta property="og:url" content="' + escapeHtml(canonical) + '" />',
    '    <meta property="og:title" content="' + escapeHtml(opts.title) + '" />',
    '    <meta property="og:description" content="' + escapeHtml(opts.description) + '" />'
  ];
  if (opts.extraHead) headParts.push(opts.extraHead);
  if (opts.jsonLd) headParts.push("    " + jsonScript(opts.jsonLd));
  headParts.push("  </head>");
  const head = headParts.join("\n");

  // Match the slot, then replace. Do not treat an unchanged string as a miss:
  // String#replace returns the same string when the title or description already
  // matches the shell, which is the home page.
  const titlePattern = /<title>[\s\S]*?<\/title>/;
  if (!titlePattern.test(indexHtml)) throw new Error("prerender: could not find <title> in the shell");
  let html = indexHtml.replace(titlePattern, "<title>" + escapeHtml(opts.title) + "</title>");

  const descriptionPattern = /<meta\s+name="description"[\s\S]*?\/>/;
  if (!descriptionPattern.test(html)) throw new Error('prerender: could not find meta name="description" in the shell');
  html = html.replace(
    descriptionPattern,
    '<meta name="description" content="' + escapeHtml(opts.description) + '" />'
  );

  if (!html.includes("</head>")) throw new Error("prerender: could not find </head> in the shell");
  html = html.replace("</head>", head);

  const emptyRoot = '<div id="root"></div>';
  if (!html.includes(emptyRoot)) throw new Error('prerender: could not find empty <div id="root"> in the shell');
  html = html.replace(emptyRoot, '<div id="root"><main class="page" id="page">' + opts.bodyHtml + "</main></div>");
  return html;
}

export function renderHomeStaticHtml(catalog: Catalog, limit = 8): string {
  const totals = new Map<string, number>();
  for (const work of catalog.works) {
    totals.set(work.author, (totals.get(work.author) || 0) + work.wordCount);
  }
  const fathers = catalog.authors
    .map((author) => ({ author, words: totals.get(author.id) || 0 }))
    .filter((row) => row.words > 0)
    .sort((a, b) => b.words - a.words || a.author.id.localeCompare(b.author.id))
    .slice(0, limit);

  const items = fathers
    .map((row) => {
      const href = "/church-fathers/#" + authorAnchorId(row.author.id);
      return '<li><a href="' + escapeHtml(href) + '">' + escapeHtml(row.author.name) + "</a></li>";
    })
    .join("\n");

  return [
    '<div class="static-home">',
    "<h1>Patrista</h1>",
    "<p>A searchable library of the public-domain Church Fathers. The full English text of every work is published here, one chapter to a page.</p>",
    '<p><a href="/fathers/">Fathers</a></p>',
    '<p><a href="/church-fathers/">Church Fathers</a></p>',
    "<ul>",
    items,
    "</ul>",
    "</div>"
  ].join("\n");
}

export function workCanonicalMap(catalog: Catalog, origin: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const work of catalog.works) {
    map[work.id] = origin + workPublicPath(work.author, work.id);
  }
  return map;
}

export function renderReadShell(indexHtml: string, map: Record<string, string>, fallbackCanonical: string): string {
  const json = JSON.stringify(map).replace(/</g, "\\u003c");
  const tags = [
    '<meta name="robots" content="noindex" />',
    '<link rel="canonical" data-read-canonical="1" href="' + escapeHtml(fallbackCanonical) + '" />',
    '<script type="application/json" id="read-canon-map">' + json + "</script>",
    "<script>(function(){var el=document.querySelector('link[data-read-canonical]');var node=document.getElementById('read-canon-map');if(!el||!node)return;var map;try{map=JSON.parse(node.textContent||'{}')}catch(e){return}var work=new URLSearchParams(location.search).get('work');if(work&&map[work])el.setAttribute('href',map[work]);})();</script>"
  ].join("\n    ");
  let html = indexHtml.replace("</head>", "    " + tags + "\n  </head>");
  if (html === indexHtml) throw new Error("read shell: could not find </head>");
  const noscript =
    '<noscript><p><a href="/church-fathers/">Church Fathers</a> lists the full text of every work.</p></noscript>';
  html = html.replace('<div id="root"></div>', '<div id="root"></div>\n    ' + noscript);
  return html;
}

export function readCanonMap(html: string): Record<string, string> {
  const match = html.match(/<script type="application\/json" id="read-canon-map">([\s\S]*?)<\/script>/);
  if (!match) return {};
  return JSON.parse(match[1]) as Record<string, string>;
}

export function applyReadCanonical(html: string, workId: string | null, map: Record<string, string>): string {
  if (!workId || !map[workId]) return html;
  return html.replace(
    /(<link rel="canonical" data-read-canonical="1" href=")[^"]*(")/,
    "$1" + map[workId].replace(/&/g, "&amp;") + "$2"
  );
}

function urlset(urls: string[]): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((u) => "  <url><loc>" + escapeHtml(u) + "</loc><changefreq>weekly</changefreq></url>"),
    "</urlset>",
    ""
  ].join("\n");
}

function sitemapIndex(locs: string[]): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...locs.map((u) => "  <sitemap><loc>" + escapeHtml(u) + "</loc></sitemap>"),
    "</sitemapindex>",
    ""
  ].join("\n");
}

export function renderSitemaps(urls: string[], origin: string): { name: string; body: string }[] {
  if (urls.length <= SITEMAP_URL_LIMIT) {
    return [{ name: "sitemap.xml", body: urlset(urls) }];
  }
  const parts: { name: string; body: string }[] = [];
  for (let i = 0; i < urls.length; i += SITEMAP_URL_LIMIT) {
    const name = "sitemap-" + (parts.length + 1) + ".xml";
    parts.push({ name, body: urlset(urls.slice(i, i + SITEMAP_URL_LIMIT)) });
  }
  return [{ name: "sitemap.xml", body: sitemapIndex(parts.map((p) => origin + "/" + p.name)) }, ...parts];
}

export function robotsTxt(origin: string): string {
  return ["User-agent: *", "Allow: /", "Sitemap: " + origin + "/sitemap.xml", ""].join("\n");
}

export function writeFatherPages(
  dist: string,
  indexHtml: string,
  catalog: Catalog,
  origin: string
): { urls: string[]; notes: SplitNote[] } {
  const urls: string[] = [];
  const notes: SplitNote[] = [];
  const pageChecks: { path: string; title: string; paras: string[] }[] = [];

  for (const trim of junkTrimLog) {
    notes.push({
      id: trim.id,
      author: trim.author,
      title: trim.title,
      reason: "Trimmed " + trim.cut + " trailing junk paragraphs (" + trim.reason + ")."
    });
  }

  for (const work of catalog.works) {
    const payload = getWork(work.id);
    if (!payload) continue;
    const labels = uniqueChapterHeadings(payload.chapters);
    const chapters = payload.chapters.map((ch) => ({ ...ch, heading: labels.get(ch.chapter) || ch.heading }));
    notes.push(...describeSplit(payload.work, chapters));
    const page = renderWorkPage({
      origin,
      author: payload.author,
      work: payload.work,
      chapters
    });
    const workFile = join(dist, page.path.replace(/^\//, ""));
    mkdirSync(dirname(workFile), { recursive: true });
    writeFileSync(workFile, page.html);
    urls.push(origin + page.path);

    if (chapters.length < 2) continue;
    const refs = chapterRefs(payload.author.id, payload.work.id, chapters);
    chapters.forEach((chapter, index) => {
      const ref = refs[index];
      const prev = index > 0 ? refs[index - 1] : null;
      const next = index + 1 < refs.length ? refs[index + 1] : null;
      const label = chapter.heading;
      const title = chapterPageTitle(payload.author.name, payload.work.title, label);
      const description = metaDescription(proseOf(chapter) || label);
      const extra: string[] = [];
      if (prev) extra.push('    <link rel="prev" href="' + escapeHtml(origin + prev.path) + '" />');
      if (next) extra.push('    <link rel="next" href="' + escapeHtml(origin + next.path) + '" />');
      const html = prerenderShell(indexHtml, origin, {
        canonicalPath: ref.path,
        title,
        description,
        bodyHtml: renderChapterBody({
          authorName: payload.author.name,
          workTitle: payload.work.title,
          workPath: page.path,
          chapter,
          prev,
          next
        }),
        jsonLd: breadcrumbJsonLd({
          origin,
          author: payload.author,
          workTitle: payload.work.title,
          workPath: page.path,
          chapterLabel: label,
          chapterPath: ref.path
        }),
        extraHead: extra.join("\n")
      });
      const file = join(dist, ref.path.replace(/^\//, ""), "index.html");
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, html);
      urls.push(origin + ref.path);
      pageChecks.push({ path: ref.path, title, paras: englishParagraphs(chapter.versions) });
    });
  }

  for (const redir of CHAPTER_REDIRECTS) {
    const fromPath = chapterPublicPath(redir.author, redir.work, redir.fromSlug);
    const toPath = chapterPublicPath(redir.author, redir.work, redir.toSlug);
    if (urls.includes(origin + fromPath)) continue;
    const file = join(dist, fromPath.replace(/^\//, ""), "index.html");
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, renderRedirectHtml(origin + toPath, fromPath));
    notes.push({
      id: redir.work,
      author: redir.author,
      title: redir.work,
      reason: "Redirect " + fromPath + " → " + toPath
    });
  }

  assertChapterPageQuality(pageChecks);
  return { urls, notes };
}

export function writeSplitNotes(dist: string, notes: SplitNote[]): void {
  writeFileSync(join(dist, "chapter-split-notes.json"), JSON.stringify(notes, null, 2));
}
