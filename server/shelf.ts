import { authorAnchorId } from "../src/lib/fatherPaths";
import { ERAS, workRefId, type HistoryEra } from "./churchHistory";
import type { Catalog } from "./types";

export type ShelfPeriodId =
  | "apostolic"
  | "apologists"
  | "alexandria-carthage"
  | "great-persecution"
  | "councils"
  | "after-nicaea"
  | "golden-age"
  | "after-the-west";

export type ShelfPeriod = {
  id: ShelfPeriodId;
  label: string;
  deathFrom: number;
  deathTo: number;
  bookendYear: number;
  homeTimelineEraId: string;
};

export const SHELF_PERIODS: ShelfPeriod[] = [
  { id: "apostolic", label: "Apostolic era", deathFrom: -4, deathTo: 155, bookendYear: 155, homeTimelineEraId: "apostolic-fathers" },
  { id: "apologists", label: "Apologists", deathFrom: 156, deathTo: 202, bookendYear: 202, homeTimelineEraId: "apologists" },
  { id: "alexandria-carthage", label: "Alexandria and Carthage", deathFrom: 203, deathTo: 270, bookendYear: 270, homeTimelineEraId: "alexandria" },
  { id: "great-persecution", label: "The Great Persecution", deathFrom: 271, deathTo: 325, bookendYear: 325, homeTimelineEraId: "diocletian" },
  { id: "councils", label: "The Councils", deathFrom: 325, deathTo: 451, bookendYear: 451, homeTimelineEraId: "nicaea" },
  { id: "after-nicaea", label: "After Nicaea", deathFrom: 326, deathTo: 400, bookendYear: 397, homeTimelineEraId: "constantinople" },
  { id: "golden-age", label: "The Golden Age", deathFrom: 401, deathTo: 461, bookendYear: 461, homeTimelineEraId: "sack-of-rome" },
  { id: "after-the-west", label: "After the West", deathFrom: 462, deathTo: 2000, bookendYear: 749, homeTimelineEraId: "gregory-great" }
];

export function periodIdForAuthor(author: { id: string; deathYear: number }): ShelfPeriodId {
  if (author.id === "councils") return "councils";
  const hit = SHELF_PERIODS.find(
    (p) => p.id !== "councils" && author.deathYear >= p.deathFrom && author.deathYear <= p.deathTo
  );
  return hit?.id ?? "after-the-west";
}

export type SpineBin = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type SpineScale = { p5: number; p95: number };

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 1;
  const i = Math.min(sorted.length - 1, Math.max(0, Math.floor(p * (sorted.length - 1))));
  return Math.max(1, sorted[i]);
}

export function spineScale(wordCounts: number[]): SpineScale {
  const sorted = wordCounts.filter((n) => n > 0).sort((a, b) => a - b);
  return { p5: percentile(sorted, 0.05), p95: percentile(sorted, 0.95) };
}

export function spineBin(wordCount: number, scale: SpineScale): SpineBin {
  if (wordCount <= scale.p5) return 1;
  if (wordCount >= scale.p95) return 10;
  const lo = Math.log(scale.p5);
  const hi = Math.log(scale.p95);
  const t = hi === lo ? 1 : (Math.log(wordCount) - lo) / (hi - lo);
  const bin = 1 + Math.round(t * 9);
  return Math.min(10, Math.max(1, bin)) as SpineBin;
}

export type PackedBook = { workId: string; authorId: string; bin: SpineBin; continued: boolean };
export type PackedAuthorRun = { authorId: string; continued: boolean; books: PackedBook[] };
export type PackedShelf = {
  periodId: ShelfPeriodId;
  runs: PackedAuthorRun[];
  isPeriodEnd: boolean;
  nextPeriodLabel?: string;
};

export type PackWork = { id: string; author: string; wordCount: number };
export type PackAuthor = { id: string; deathYear: number };
export type PackOptions = {
  shelfWidthPx: number;
  binWidthPx?: (bin: SpineBin) => number;
  scale: SpineScale;
};

/** Spine thickness scale (0.85 = 15% smaller books). */
export const SPINE_SCALE = 0.85;

export function defaultBinWidthPx(bin: SpineBin): number {
  const min = 36;
  const max = 128;
  return Math.round((min + ((max - min) * (bin - 1)) / 9) * SPINE_SCALE);
}

export function packShelves(works: PackWork[], authors: PackAuthor[], opts: PackOptions): PackedShelf[] {
  const widthOf = opts.binWidthPx ?? defaultBinWidthPx;
  const worksByAuthor = new Map<string, PackWork[]>();
  for (const w of works) {
    const list = worksByAuthor.get(w.author);
    if (list) list.push(w);
    else worksByAuthor.set(w.author, [w]);
  }
  const authorsByPeriod = new Map<ShelfPeriodId, PackAuthor[]>();
  for (const a of authors) {
    const periodId = periodIdForAuthor(a);
    const list = authorsByPeriod.get(periodId);
    if (list) list.push(a);
    else authorsByPeriod.set(periodId, [a]);
  }
  for (const list of authorsByPeriod.values()) {
    list.sort((a, b) => a.deathYear - b.deathYear || a.id.localeCompare(b.id));
  }
  const authorsOrdered: PackAuthor[] = [];
  for (const period of SHELF_PERIODS) {
    authorsOrdered.push(...(authorsByPeriod.get(period.id) || []));
  }

  type OpenShelf = { periodId: ShelfPeriodId; used: number; runs: PackedAuthorRun[] };
  const shelves: OpenShelf[] = [];

  function startShelf(periodId: ShelfPeriodId): OpenShelf {
    const opened: OpenShelf = { periodId, used: 0, runs: [] };
    shelves.push(opened);
    return opened;
  }

  for (const a of authorsOrdered) {
    const authorWorks = worksByAuthor.get(a.id);
    if (!authorWorks?.length) continue;
    const periodId = periodIdForAuthor(a);
    const queue: PackedBook[] = authorWorks.map((w) => ({
      workId: w.id,
      authorId: a.id,
      bin: spineBin(w.wordCount, opts.scale),
      continued: false
    }));
    let firstChunk = true;
    let current = shelves[shelves.length - 1];

    while (queue.length) {
      if (!current || current.periodId !== periodId) current = startShelf(periodId);

      const totalWidth = queue.reduce((sum, b) => sum + widthOf(b.bin), 0);
      const leftover = opts.shelfWidthPx - current.used;
      const fitsFullShelf = totalWidth <= opts.shelfWidthPx;

      if (current.runs.length > 0 && totalWidth > leftover) {
        if (fitsFullShelf) current = startShelf(periodId);
        else if (leftover < widthOf(queue[0].bin)) current = startShelf(periodId);
      }

      const chunk: PackedBook[] = [];
      let chunkW = 0;
      while (queue.length) {
        const nextW = widthOf(queue[0].bin);
        const empty = current.used === 0 && chunk.length === 0;
        if (chunk.length > 0 && current.used + chunkW + nextW > opts.shelfWidthPx) break;
        if (chunk.length === 0 && current.used + nextW > opts.shelfWidthPx && !empty) break;
        chunk.push(queue.shift()!);
        chunkW += nextW;
        if (empty && chunkW >= opts.shelfWidthPx) break;
        if (current.used + chunkW >= opts.shelfWidthPx && queue.length) break;
      }

      if (!chunk.length) {
        current = startShelf(periodId);
        continue;
      }

      current.runs.push({ authorId: a.id, continued: !firstChunk, books: chunk });
      current.used += chunkW;
      firstChunk = false;
    }
  }

  const periodIndex = new Map(SHELF_PERIODS.map((p, i) => [p.id, i]));
  return shelves.map((s, i) => {
    const next = shelves[i + 1];
    const isPeriodEnd = !next || next.periodId !== s.periodId;
    let nextPeriodLabel: string | undefined;
    if (isPeriodEnd) {
      const idx = periodIndex.get(s.periodId) ?? -1;
      nextPeriodLabel = SHELF_PERIODS[idx + 1]?.label;
    }
    return { periodId: s.periodId, runs: s.runs, isPeriodEnd, nextPeriodLabel };
  });
}

export function packCatalog(catalog: Catalog, shelfWidthPx: number): PackedShelf[] {
  return packShelves(catalog.works, catalog.authors, {
    shelfWidthPx,
    scale: spineScale(catalog.works.map((w) => w.wordCount))
  });
}

/** Target books per author-mode shelf: enough to read, few enough to stay a centered line. */
export const AUTHOR_SHELF_MAX = 8;

/** AD century from death year, rounded up. 430 → 5; 101 → 2. Clamped 1–8 for band styles. */
export function deathCentury(deathYear: number): number {
  if (deathYear <= 0) return 1;
  return Math.max(1, Math.min(8, Math.ceil(deathYear / 100)));
}

/** Where century band pairs sit relative to the spine title. */
export function spineBandPlace(century: number): "upper" | "split" | "lower" {
  if (century <= 2) return "upper";
  if (century <= 4) return "split";
  if (century === 5) return "upper";
  return "lower";
}

export type AuthorPacked = {
  authorId: string;
  shelves: PackedBook[][];
};

export function packAuthorCatalog(catalog: { authors: PackAuthor[]; works: PackWork[] }): AuthorPacked[] {
  const scale = spineScale(catalog.works.map((w) => w.wordCount));
  const worksByAuthor = new Map<string, PackWork[]>();
  for (const w of catalog.works) {
    const list = worksByAuthor.get(w.author);
    if (list) list.push(w);
    else worksByAuthor.set(w.author, [w]);
  }
  const authors = [...catalog.authors]
    .filter((a) => (worksByAuthor.get(a.id) || []).length)
    .sort((a, b) => a.deathYear - b.deathYear || a.id.localeCompare(b.id));

  return authors.map((a) => {
    const books: PackedBook[] = (worksByAuthor.get(a.id) || []).map((w) => ({
      workId: w.id,
      authorId: a.id,
      bin: spineBin(w.wordCount, scale),
      continued: false
    }));
    const shelves: PackedBook[][] = [];
    for (let i = 0; i < books.length; i += AUTHOR_SHELF_MAX) {
      shelves.push(books.slice(i, i + AUTHOR_SHELF_MAX));
    }
    return { authorId: a.id, shelves };
  });
}

/** Router path. React Router ignores a trailing slash. */
export const CHURCH_FATHERS_PATH = "/church-fathers";
/**
 * Canonical path. The build emits church-fathers/index.html, which GitHub Pages
 * serves at the trailing-slash URL and 301s the bare form to.
 */
export const CHURCH_FATHERS_CANONICAL_PATH = "/church-fathers/";
export const CHURCH_FATHERS_TITLE = "Church Writings: the Fathers by period";
export const CHURCH_FATHERS_DESCRIPTION =
  "Browse the public-domain Church Fathers by period of church history — Apostolic era to John of Damascus — and read the English texts.";

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Crawlable catalog: period → author → works. React replaces this on desktop. */
export function renderChurchFathersHtml(catalog: Catalog): string {
  const out: string[] = [];
  out.push("<div class=\"browse-prerender\">");
  out.push("<h1>Church Writings</h1>");
  out.push("<p>" + escapeHtml(CHURCH_FATHERS_DESCRIPTION) + "</p>");
  const worksByAuthor = new Map<string, typeof catalog.works>();
  for (const w of catalog.works) {
    const list = worksByAuthor.get(w.author);
    if (list) list.push(w);
    else worksByAuthor.set(w.author, [w]);
  }
  const authorsInPeriod = (periodId: ShelfPeriodId) =>
    catalog.authors
      .filter((a) => periodIdForAuthor(a) === periodId && (worksByAuthor.get(a.id) || []).length)
      .sort((a, b) => a.deathYear - b.deathYear || a.id.localeCompare(b.id));

  for (const period of SHELF_PERIODS) {
    const authors = authorsInPeriod(period.id);
    if (!authors.length) continue;
    out.push("<section id=\"" + period.id + "\">");
    out.push("<h2>" + escapeHtml(period.label) + "</h2>");
    for (const a of authors) {
      out.push('<h3 id="' + escapeHtml(authorAnchorId(a.id)) + '">' + escapeHtml(a.name) + "</h3>");
      if (a.bio) out.push("<p>" + escapeHtml(a.bio) + "</p>");
      out.push("<p>" + escapeHtml([a.dates, a.region].filter(Boolean).join(" · ")) + "</p>");
      out.push("<ul>");
      for (const w of worksByAuthor.get(a.id) || []) {
        const href = "/fathers/" + encodeURIComponent(a.id) + "/" + encodeURIComponent(w.id) + ".html";
        out.push("<li><a href=\"" + href + "\">" + escapeHtml(w.title) + "</a></li>");
      }
      out.push("</ul>");
    }
    out.push("</section>");
  }
  out.push("</div>");
  return out.join("\n");
}

export function churchFathersJsonLd(origin: string, catalog: Catalog): unknown {
  const url = origin + CHURCH_FATHERS_CANONICAL_PATH;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: CHURCH_FATHERS_TITLE,
    description: CHURCH_FATHERS_DESCRIPTION,
    url,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: catalog.works.length,
      itemListElement: catalog.works.map((w, i) => {
        const author = catalog.authors.find((a) => a.id === w.author);
        return {
          "@type": "ListItem",
          position: i + 1,
          url: origin + "/fathers/" + w.author + "/" + w.id + ".html",
          name: w.title + (author ? " — " + author.name : "")
        };
      })
    }
  };
}

export function inspectTimelineEra(workId: string, periodId: ShelfPeriodId, deathYear: number): HistoryEra {
  const linked = ERAS.filter((era) => (era.works || []).some((ref) => workRefId(ref) === workId));
  if (linked.length) {
    return linked.reduce((best, era) =>
      Math.abs(era.year - deathYear) < Math.abs(best.year - deathYear) ? era : best
    );
  }
  const period = SHELF_PERIODS.find((p) => p.id === periodId);
  const home = ERAS.find((era) => era.id === period?.homeTimelineEraId);
  if (!home) throw new Error("No timeline era for shelf period " + periodId);
  return home;
}
