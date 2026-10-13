import type { Author, Catalog, Work } from "../../server/types";

export type AuthorMatchKind = "name" | "work" | "both";

export type CatalogPreviewGroup = {
  author: Author;
  kind: AuthorMatchKind;
  works: Work[];
};

export type CatalogSuggestion = {
  type: "author" | "work";
  id: string;
  label: string;
};

export type CatalogPreview = {
  query: string;
  groups: CatalogPreviewGroup[];
  suggestion: CatalogSuggestion | null;
};

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

/** Strip a trailing chapter number so "Confessions 1" still matches the work. */
export function catalogNeedle(raw: string): string {
  const t = raw.trim();
  const stripped = t.replace(/\s+\d+$/, "").trim();
  return normalize(stripped || t);
}

function nameScore(needle: string, name: string): number | null {
  const n = normalize(name);
  if (!needle) return 0;
  if (n.startsWith(needle)) return 0;
  const words = n.split(/[^a-z0-9]+/).filter(Boolean);
  if (words.some((w) => w.startsWith(needle))) return 1;
  if (n.includes(needle)) return 2;
  return null;
}

function workScore(needle: string, work: Work): number | null {
  const title = nameScore(needle, work.title);
  const short = nameScore(needle, work.short);
  if (title == null && short == null) return null;
  return Math.min(title ?? 99, short ?? 99);
}

function levenshtein(a: string, b: string): number {
  const s = normalize(a);
  const t = normalize(b);
  const rows = s.length + 1;
  const cols = t.length + 1;
  const dp = new Array<number>(rows * cols);
  for (let i = 0; i < rows; i++) dp[i * cols] = i;
  for (let j = 0; j < cols; j++) dp[j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      dp[i * cols + j] = Math.min(
        dp[(i - 1) * cols + j] + 1,
        dp[i * cols + j - 1] + 1,
        dp[(i - 1) * cols + j - 1] + cost
      );
    }
  }
  return dp[s.length * cols + t.length];
}

function authorsInEraOrder(catalog: Catalog): Author[] {
  const seen = new Set<string>();
  const out: Author[] = [];
  for (const era of catalog.eras) {
    for (const a of catalog.authors) {
      if (a.era !== era.id || seen.has(a.id)) continue;
      seen.add(a.id);
      out.push(a);
    }
  }
  for (const a of catalog.authors) {
    if (seen.has(a.id)) continue;
    out.push(a);
  }
  return out;
}

function worksOf(catalog: Catalog, authorId: string): Work[] {
  return catalog.works.filter((w) => w.author === authorId);
}

function tokens(s: string): string[] {
  return normalize(s)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 1);
}

function bestEditDistance(needle: string, labels: string[]): number {
  let best = Infinity;
  for (const label of labels) {
    if (!label) continue;
    const d = levenshtein(needle, label);
    if (d < best) best = d;
  }
  return best;
}

function nearer(
  dist: number,
  suggestion: CatalogSuggestion,
  bestDist: number,
  best: CatalogSuggestion | null
): boolean {
  if (!best) return true;
  if (dist < bestDist) return true;
  return dist === bestDist && suggestion.type === "author" && best.type === "work";
}

function nearestSuggestion(needle: string, catalog: Catalog): CatalogSuggestion | null {
  let bestDist = Infinity;
  let best: CatalogSuggestion | null = null;
  for (const a of catalog.authors) {
    const dist = bestEditDistance(needle, [a.name, a.id.replace(/_/g, " "), ...tokens(a.name)]);
    const suggestion: CatalogSuggestion = { type: "author", id: a.id, label: a.name };
    if (nearer(dist, suggestion, bestDist, best)) {
      bestDist = dist;
      best = suggestion;
    }
  }
  for (const w of catalog.works) {
    const dist = bestEditDistance(needle, [w.title, w.short, w.id.replace(/_/g, " "), ...tokens(w.title)]);
    const suggestion: CatalogSuggestion = { type: "work", id: w.id, label: w.title };
    if (nearer(dist, suggestion, bestDist, best)) {
      bestDist = dist;
      best = suggestion;
    }
  }
  return best;
}

export function previewCatalog(raw: string, catalog: Catalog): CatalogPreview {
  const query = raw.trim();
  const ordered = authorsInEraOrder(catalog);
  if (!query) {
    return {
      query,
      groups: ordered.map((author) => ({
        author,
        kind: "name" as const,
        works: worksOf(catalog, author.id)
      })),
      suggestion: null
    };
  }

  const needle = catalogNeedle(query);
  type Scored = { author: Author; kind: AuthorMatchKind; works: Work[]; name: number | null; work: number | null; index: number };
  const scored: Scored[] = [];

  ordered.forEach((author, index) => {
    const allWorks = worksOf(catalog, author.id);
    const n = nameScore(needle, author.name);
    const matchingWorks = allWorks.filter((w) => workScore(needle, w) != null);
    const bestWork = matchingWorks.reduce<number | null>((best, w) => {
      const s = workScore(needle, w);
      if (s == null) return best;
      return best == null ? s : Math.min(best, s);
    }, null);
    if (n == null && bestWork == null) return;
    const kind: AuthorMatchKind = n != null && bestWork != null ? "both" : n != null ? "name" : "work";
    const works = n != null ? allWorks : matchingWorks;
    scored.push({ author, kind, works, name: n, work: bestWork, index });
  });

  scored.sort((a, b) => {
    const tier = (k: AuthorMatchKind) => (k === "work" ? 1 : 0);
    if (tier(a.kind) !== tier(b.kind)) return tier(a.kind) - tier(b.kind);
    const sa = a.kind === "work" ? a.work ?? 99 : a.name ?? 99;
    const sb = b.kind === "work" ? b.work ?? 99 : b.name ?? 99;
    if (sa !== sb) return sa - sb;
    return a.index - b.index;
  });

  if (!scored.length) {
    return { query, groups: [], suggestion: nearestSuggestion(needle, catalog) };
  }

  return {
    query,
    groups: scored.map(({ author, kind, works }) => ({ author, kind, works })),
    suggestion: null
  };
}

export function isExactAuthorQuery(raw: string, catalog: Catalog): boolean {
  const q = normalize(raw);
  if (!q) return false;
  return catalog.authors.some((a) => normalize(a.name) === q || a.id === q);
}
