import { splitVid, type ChapterConnections, type CuratedLink } from "../api/connections";

/*
 * Connections between passages, ranked strong, moderate or weak. Shared by the Bible's Connections tab and
 * the search page, so a link has the same strength wherever it is shown.
 */

export const overlaps = (a: [number, number], b: [number, number]) => a[0] <= b[1] && b[0] <= a[1];

export type Strength = "strong" | "moderate" | "weak";
export type Pattern = {
  from: number;
  to: number;
  sources: Set<number>;
  targets: Set<number>;
  codes: Set<string>;
  fathers: Set<string>;
  works: Set<string>;
  sample?: string;
  types: { entry: string; label: string }[];
  wordScore: number;
  points: number;
  strength: Strength;
};
export type TypeLink = { entry: string; label: string; fathers: string[]; cites: string[]; others: [number, number][] };

/**
 * The different Fathers among names taken from a type's citations ("Cyril, *Cat.* 13.20" gives "Cyril").
 * A note after the name ("Irenaeus (attributed)", "Ambrose (quoted in Cassian") is the same Father.
 */
export function fatherNames(names: string[]): string[] {
  return [...new Set(names.map((n) => n.split(",")[0].replace(/\s*\(.*$/, "").replace(/\*/g, "").trim()).filter(Boolean))];
}

/** Links that land within this many verses of each other, in one chapter, form one pattern. */
const GAP = 4;

/**
 * The patterns for a verse or passage. Every link from a verse here to a verse elsewhere (shared words,
 * or the Fathers citing both) is collected; links landing close together are grouped into one passage.
 *
 * Strength, in points:
 *   a type            when the Fathers name a type joining them: 5 when two or more Fathers draw it (strong
 *                     on its own), 3 when one Father does (like one Father citing both)
 *   the Fathers       3 when one Father cites both passages together, 5 for two or more: strong on its own
 *   shared words      by their weight, which counts rare words for more: under 6 is 1, under 9 is 2,
 *                     under 12 is 3, 12 and over is 4 (a few rare words, or a quotation)
 *   several verses    +1 when two verses here link to two verses there, +2 for three or more
 * Strong is 5 or more, moderate 3-4, weak 1-2. So a Father citing both, or a type one Father draws, is at
 * least moderate; two Fathers citing both, or a type two Fathers draw, is strong; and one Father plus shared
 * words of weight 6 or more is strong. Shared words alone never pass moderate, however many verses they
 * join: sampled by hand, about a third of the high-scoring word-only links were chance (two genealogies
 * sharing "concubine, begat"; Psalm 23 and Matthew 23:24 sharing "guides, cup"). Patterns sort by points; the word weight breaks ties.
 */
export function findPatterns(data: ChapterConnections, here: [number, number], types: TypeLink[]): Pattern[] {
  type Hit = { src: number; o: number; score: number; codes: string[]; fathers: string[]; works: string[]; sample?: string };
  const hits: Hit[] = [];
  for (let src = here[0]; src <= here[1]; src++) {
    const vc = data.v[String(splitVid(src).verse)];
    if (!vc) continue;
    for (const [o, score, , codes] of vc.l ?? [])
      if (o < here[0] || o > here[1]) hits.push({ src, o, score, codes, fathers: [], works: [] });
    for (const [o, , fathers, works, sample] of vc.w ?? [])
      if (o < here[0] || o > here[1]) hits.push({ src, o, score: 0, codes: [], fathers, works, sample });
  }
  hits.sort((a, b) => a.o - b.o);
  const out: Pattern[] = [];
  let cur: Pattern | null = null;
  for (const h of hits) {
    const near = cur && Math.floor(cur.to / 1000) === Math.floor(h.o / 1000) && h.o - cur.to <= GAP;
    if (!cur || !near) {
      cur = { from: h.o, to: h.o, sources: new Set(), targets: new Set(), codes: new Set(), fathers: new Set(), works: new Set(), types: [], wordScore: 0, points: 0, strength: "weak" };
      out.push(cur);
    }
    cur.to = Math.max(cur.to, h.o);
    cur.sources.add(h.src);
    cur.targets.add(h.o);
    cur.wordScore += h.score;
    h.codes.forEach((c) => cur!.codes.add(c));
    h.fathers.forEach((f) => cur!.fathers.add(f));
    h.works.forEach((w) => cur!.works.add(w));
    cur.sample ??= h.sample;
  }
  for (const p of out) {
    let typePoints = 0;
    for (const t of types)
      if (t.others.some((r) => overlaps(r, [p.from, p.to]))) {
        p.types.push({ entry: t.entry, label: t.label });
        typePoints = Math.max(typePoints, fatherNames(t.fathers).length >= 2 ? 5 : 3);
      }
    const spread = Math.min(p.sources.size, p.targets.size);
    const w = p.wordScore;
    const words = w <= 0 ? 0 : w < 6 ? 1 : w < 9 ? 2 : w < 12 ? 3 : 4;
    const fathers = p.fathers.size === 0 ? 0 : p.fathers.size === 1 ? 3 : 5;
    p.points = words + fathers + typePoints + (spread >= 3 ? 2 : spread === 2 ? 1 : 0);
    // Words alone: at most moderate, so they still sort by their points but are never called strong.
    if (!fathers && !p.types.length) p.points = Math.min(p.points, 4);
    p.strength = p.points >= 5 ? "strong" : p.points >= 3 ? "moderate" : "weak";
  }
  return out.sort((a, b) => b.points - a.points || b.wordScore - a.wordScore);
}

export const STRENGTH_TEXT: Record<Strength, string> = {
  strong: "A type two or more Fathers draw, two or more Fathers citing both, or a Father and shared words together",
  moderate: "A type one Father draws, a Father cites both, or they share rare words",
  weak: "A few common words in common"
};

export function groupCurated(curated: CuratedLink[], here: [number, number]): TypeLink[] {
  const by = new Map<string, TypeLink>();
  for (const [entry, label, fathers, cites, a0, a1, b0, b1] of curated) {
    const other: [number, number] = overlaps([a0, a1], here) ? [b0, b1] : [a0, a1];
    const g = by.get(entry) ?? { entry, label, fathers, cites, others: [] };
    if (!g.others.some(([x]) => x === other[0])) g.others.push(other);
    by.set(entry, g);
  }
  return [...by.values()].map((g) => ({ ...g, others: g.others.sort((x, y) => x[0] - y[0]) }));
}
