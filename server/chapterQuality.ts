/** Source-data checks for static chapter pages: junk tails, unique titles, numbering. */

export type TrimResult = {
  paras: string[];
  cut: number;
  reason: string;
};

const INDEX_HEADING = /^\s*(INDEX OF\b|Subject Indexes|Hidden links:)/i;
const URL_TOKEN = /(?:file:|https?:)\/\/\S+/gi;
const INDEX_ENTRY = /^.{1,100},\s*\[\d+\]\d+\.?\s*$/;
const UNIT_HEADING = /^(Homily|Book|Letter|Sermon|Chapter)\s+([IVXLCDM]+)(?:\s*\(Part \d+\))?$/i;

export function isLinkDumpParagraph(p: string): boolean {
  const t = p.trim();
  if (!t) return false;
  if (INDEX_HEADING.test(t)) return true;
  if (/^(?:file:|https?:)\/\//i.test(t)) return true;
  if (/^\d+\.\s+(?:file:|https?:)\/\//i.test(t)) return true;
  if (/^Hidden links:/i.test(t)) return true;
  const urlChars = (t.match(URL_TOKEN) || []).join("").length;
  if (urlChars >= 20 && urlChars / t.length >= 0.4) return true;
  if (INDEX_ENTRY.test(t) && urlChars === 0) return true;
  return false;
}

function junkRunLength(paras: string[], start: number): number {
  let n = 0;
  for (let i = start; i < paras.length; i++) {
    if (!isLinkDumpParagraph(paras[i])) break;
    n += 1;
  }
  return n;
}

/** Drop a trailing index, URL dump, or page-ref list. Never cuts from the first paragraph. */
export function trimTrailingJunk(paras: string[]): TrimResult {
  const clean = paras.filter((p) => p.trim());
  if (clean.length < 2) return { paras: clean, cut: 0, reason: "" };

  let cutAt = -1;
  let reason = "";
  for (let i = 1; i < clean.length; i++) {
    if (INDEX_HEADING.test(clean[i].trim())) {
      cutAt = i;
      reason = "index heading";
      break;
    }
  }
  if (cutAt < 0) {
    for (let i = 1; i < clean.length; i++) {
      const run = junkRunLength(clean, i);
      if (run >= 5 && i + run === clean.length) {
        cutAt = i;
        reason = "trailing link dump";
        break;
      }
    }
  }
  if (cutAt < 0) {
    let i = clean.length;
    while (i > 1 && isLinkDumpParagraph(clean[i - 1])) i -= 1;
    if (i < clean.length && clean.length - i >= 3) {
      cutAt = i;
      reason = "trailing link dump";
    }
  }
  if (cutAt < 0) return { paras: clean, cut: 0, reason: "" };
  return { paras: clean.slice(0, cutAt), cut: clean.length - cutAt, reason };
}

export function uniqueChapterHeadings(chapters: { chapter: number; heading: string }[]): Map<number, string> {
  const counts = new Map<string, number>();
  for (const ch of chapters) counts.set(ch.heading, (counts.get(ch.heading) || 0) + 1);
  const seen = new Map<string, number>();
  const out = new Map<number, string>();
  for (const ch of chapters) {
    const total = counts.get(ch.heading) || 1;
    if (total === 1 || /\s*\(Part \d+\)$/.test(ch.heading)) {
      out.set(ch.chapter, ch.heading);
      continue;
    }
    const n = (seen.get(ch.heading) || 0) + 1;
    seen.set(ch.heading, n);
    out.set(ch.chapter, n === 1 ? ch.heading : ch.heading + " (Part " + n + ")");
  }
  return out;
}

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

export function numberingWarnings(headings: string[]): string[] {
  const nums: number[] = [];
  for (const heading of headings) {
    const match = heading.match(UNIT_HEADING);
    if (!match) return [];
    const n = romanToInt(match[2]);
    if (n == null) return [];
    nums.push(n);
  }
  if (nums.length < 2) return [];
  const warnings: string[] = [];
  const have = new Set<number>();
  const dupes = new Set<number>();
  for (const n of nums) {
    if (have.has(n)) dupes.add(n);
    have.add(n);
  }
  if (dupes.size) warnings.push("duplicate " + [...dupes].sort((a, b) => a - b).join(", "));
  const max = Math.max(...nums);
  const missing: number[] = [];
  for (let i = 1; i <= max; i++) {
    if (!have.has(i)) missing.push(i);
  }
  if (missing.length) warnings.push("skip " + missing.join(", "));
  return warnings;
}

export type ChapterPageCheck = {
  path: string;
  title: string;
  paras: string[];
};

export function assertChapterPageQuality(pages: ChapterPageCheck[]): void {
  const titles = new Map<string, string>();
  for (const page of pages) {
    const prev = titles.get(page.title);
    if (prev) {
      throw new Error("duplicate <title> " + JSON.stringify(page.title) + " on " + prev + " and " + page.path);
    }
    titles.set(page.title, page.path);
    for (let i = 0; i < page.paras.length; i++) {
      if (junkRunLength(page.paras, i) >= 5) {
        throw new Error("link dump in " + page.path);
      }
    }
  }
}

export function renderRedirectHtml(absoluteUrl: string, fromPath?: string): string {
  const path = absoluteUrl.replace(/^https?:\/\/[^/]+/, "") || "/";
  const safe = absoluteUrl.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const safePath = path.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const safeFrom = (fromPath || path).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  return [
    "<!DOCTYPE html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="utf-8" />',
    '  <meta http-equiv="refresh" content="0; url=' + safe + '" />',
    '  <link rel="canonical" href="' + safe + '" />',
    "  <title>Moved from " + safeFrom + "</title>",
    "</head>",
    "<body>",
    '  <p>This page has moved to <a href="' + safePath + '">' + safePath + "</a>.</p>",
    "</body>",
    "</html>",
    ""
  ].join("\n");
}

/** Live chapter URLs that disappear when false unit marks are dropped. */
export const CHAPTER_REDIRECTS: { author: string; work: string; fromSlug: string; toSlug: string }[] = [
  {
    author: "chrysostom",
    work: "homilies-on-matthew",
    fromSlug: "homily-lxxxiii-82",
    toSlug: "homily-lxxxiii"
  },
  {
    author: "chrysostom",
    work: "homilies-on-matthew",
    fromSlug: "homily-lxxxviii-87",
    toSlug: "homily-lxxxviii"
  },
  { author: "theophilus", work: "to-autolycus", fromSlug: "book-ii-3", toSlug: "book-ii" },
  { author: "hippolytus", work: "refutation-of-all-heresies", fromSlug: "book-iv-3", toSlug: "book-iv" },
  { author: "hippolytus", work: "refutation-of-all-heresies", fromSlug: "book-i-4", toSlug: "book-iv" },
  { author: "hippolytus", work: "refutation-of-all-heresies", fromSlug: "book-i-6", toSlug: "book-v" },
  { author: "tertullian", work: "five-books-against-marcion", fromSlug: "book-iv-5", toSlug: "book-iv" },
  { author: "tertullian", work: "five-books-against-marcion", fromSlug: "book-iv-7", toSlug: "book-v" },
  { author: "origen", work: "against-celsus", fromSlug: "book-iii-5", toSlug: "book-iv" }
];
