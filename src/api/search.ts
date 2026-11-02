/**
 * Full-text search. The static build ships a Pagefind index at /pagefind/; the browser loads only the
 * parts a query needs. The dev server has no index, so there we ask the dev API (/api/search) instead.
 */

export type TextHit = {
  url: string;
  title: string;
  work: string;
  chapter: string;
  author: string;
  excerptHtml: string;
};

export type FilterCounts = Record<string, Record<string, number>>;

type PagefindData = {
  url: string;
  excerpt: string;
  meta: Record<string, string>;
};
type PagefindResult = { id: string; data: () => Promise<PagefindData> };
type PagefindResponse = { results: PagefindResult[]; unfilteredResultCount: number; filters: FilterCounts };
type Pagefind = {
  options: (o: Record<string, unknown>) => Promise<void>;
  init: () => Promise<void>;
  search: (q: string, o?: { filters?: Record<string, string | string[]> }) => Promise<PagefindResponse>;
  filters: () => Promise<FilterCounts>;
};

let loading: Promise<Pagefind | null> | null = null;

export function loadPagefind(): Promise<Pagefind | null> {
  if (!loading) {
    const url = "/pagefind/pagefind.js";
    loading = import(/* @vite-ignore */ url)
      .then(async (m: Pagefind) => {
        // Chapters run long (a whole book of the Confessions); the default length penalty buried them.
        await m.options({ excerptLength: 36, ranking: { pageLength: 0.4 } });
        await m.init();
        return m;
      })
      .catch(() => null);
  }
  return loading;
}

export type TextSearch = {
  total: number;
  filters: FilterCounts;
  /** Load hits [from, to) in rank order. */
  page: (from: number, to: number) => Promise<TextHit[]>;
};

function toHit(d: PagefindData): TextHit {
  return {
    url: d.url,
    title: d.meta.title || d.url,
    work: d.meta.work || "",
    chapter: d.meta.chapter || "",
    author: d.meta.author || "",
    excerptHtml: d.excerpt
  };
}

/** Old dev-only path: the Vite dev server answers /api/search from the corpus on disk. */
async function devSearch(q: string, father: string): Promise<TextSearch> {
  const res = await fetch("/api/search?q=" + encodeURIComponent(q));
  if (!res.ok) throw new Error("Search is not available here (" + res.status + ").");
  const body = (await res.json()) as {
    hits: { work: string; chapter: number; heading: string; author: string; title: string; snippetHtml: string }[];
  };
  const all = body.hits
    .filter((h) => !father || h.author === father)
    .map((h) => ({
      url: "/read?work=" + encodeURIComponent(h.work) + "&chapter=" + h.chapter,
      title: h.title + " — " + h.heading,
      work: h.title,
      chapter: h.heading,
      author: h.author,
      excerptHtml: h.snippetHtml
    }));
  const counts: Record<string, number> = {};
  for (const h of body.hits) counts[h.author] = (counts[h.author] || 0) + 1;
  return { total: all.length, filters: { father: counts }, page: async (a, b) => all.slice(a, b) };
}

export async function searchTexts(q: string, father = ""): Promise<TextSearch> {
  const pf = await loadPagefind();
  if (!pf) {
    if (import.meta.env.DEV) return devSearch(q, father);
    throw new Error("The search index did not load. Check your connection and try again.");
  }
  const opts = father ? { filters: { father } } : undefined;
  const res = await pf.search(q, opts);
  // Several words without quotes: chapters with the exact phrase come first, then the rest.
  const phraseable = !/"/.test(q) && q.trim().split(/\s+/).length > 1;
  const phrase = phraseable ? await pf.search('"' + q.trim() + '"', opts) : null;
  const seen = new Set(phrase?.results.map((r) => r.id));
  const ordered = phrase ? [...phrase.results, ...res.results.filter((r) => !seen.has(r.id))] : res.results;
  // Counts per Father for the whole query, not just the selected one, so the chips stay put.
  const all = father ? await pf.search(q) : res;
  return {
    total: ordered.length,
    filters: all.filters,
    page: async (from, to) => Promise.all(ordered.slice(from, to).map((r) => r.data().then(toHit)))
  };
}

/** Reader URL for a hit, with the query so the reader can mark it. */
export function hitHref(hit: TextHit, q: string): string {
  const [path, hash] = hit.url.split("#");
  return path + (path.includes("?") ? "&" : "?") + "hl=" + encodeURIComponent(q) + (hash ? "#" + hash : "");
}
