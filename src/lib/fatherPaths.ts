/** Public URLs for static Father pages. Shared by the build and the reader. */

const SLUG_MAX = 80;

export function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function slugifyHeading(heading: string): string {
  const slug = heading
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, "");
  return slug;
}

/** Static chapter pages are numbered 1..N in reading order: /fathers/<author>/<work>/chapter-<N>/. */
export function assignChapterSlugs(chapters: { chapter: number; heading: string }[]): Map<number, string> {
  const out = new Map<number, string>();
  [...chapters].sort((a, b) => a.chapter - b.chapter).forEach((ch, i) => out.set(ch.chapter, "chapter-" + (i + 1)));
  return out;
}

/** Heading-based slugs used before Oct 2026 (e.g. "homily-xxxii"); old URLs get a stub page. */
export function legacyChapterSlugs(chapters: { chapter: number; heading: string }[]): Map<number, string> {
  const used = new Set<string>();
  const out = new Map<number, string>();
  const ordered = [...chapters].sort((a, b) => a.chapter - b.chapter);
  for (const ch of ordered) {
    const base = slugifyHeading(ch.heading) || "chapter-" + ch.chapter;
    let slug = base;
    let n = 2;
    while (used.has(slug)) {
      slug = base + "-" + ch.chapter + (n === 2 ? "" : "-" + n);
      n += 1;
    }
    used.add(slug);
    out.set(ch.chapter, slug);
  }
  return out;
}

export function chapterNumberForSlug(
  chapters: { chapter: number; heading: string }[],
  slug: string
): number | null {
  for (const map of [assignChapterSlugs(chapters), legacyChapterSlugs(chapters)]) {
    for (const ch of chapters) {
      if (map.get(ch.chapter) === slug) return ch.chapter;
    }
  }
  return null;
}

export function workPublicPath(authorId: string, workId: string): string {
  return "/fathers/" + encodeURIComponent(authorId) + "/" + encodeURIComponent(workId) + ".html";
}

export function chapterPublicPath(authorId: string, workId: string, slug: string): string {
  return (
    "/fathers/" +
    encodeURIComponent(authorId) +
    "/" +
    encodeURIComponent(workId) +
    "/" +
    encodeURIComponent(slug) +
    "/"
  );
}

export function authorAnchorId(authorId: string): string {
  return "author-" + authorId;
}

export type FatherChapterPath = {
  authorId: string;
  workId: string;
  chapterSlug: string;
};

export function parseFatherChapterPath(pathname: string): FatherChapterPath | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  const match = path.match(/^\/fathers\/([^/]+)\/([^/]+)\/([^/]+)$/);
  if (!match) return null;
  return {
    authorId: decodeURIComponent(match[1]),
    workId: decodeURIComponent(match[2]),
    chapterSlug: decodeURIComponent(match[3])
  };
}

/** First non-original version stored on a passage. */
export function englishParagraphs(versions: Record<string, string[]>): string[] {
  for (const [id, paras] of Object.entries(versions)) {
    if (id === "lat" || id === "grk") continue;
    if (paras && paras.length) return paras;
  }
  return [];
}

/** Meta description: cleaned prose, cut on a word boundary at about 155 characters. */
export function metaDescription(text: string, max = 155): string {
  const clean = text
    .replace(/\[[0-9]+\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const space = cut.lastIndexOf(" ");
  const clipped = (space > 40 ? cut.slice(0, space) : cut).replace(/[.,;:]+$/, "");
  return clipped;
}

