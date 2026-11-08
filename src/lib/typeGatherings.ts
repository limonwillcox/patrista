import type { TypeEntry } from "../api/connections";

/*
 * The themes of the types map are the Fathers' own gatherings: a passage where one Father names several types
 * together. Tertullian, On Baptism 9, walks from the Red Sea to the rock to the water and blood of Christ's side;
 * Augustine, Reply to Faustus 12, runs from Abel to Samson. Nobody chooses the members: a type is in a gathering
 * when one of its own quotations comes from that passage, and the gathering lists them in the order the Father
 * names them (where each quotation sits in the reader).
 *
 * A passage is the Father's own unit as the reference gives it: every number but the last ("Cyril, Cat. 3.10" is
 * lecture 3; "Irenaeus, AH 3.22.4" is book 3, chapter 22), or the single number when there is one
 * ("Tertullian, Bapt. 9"). A passage is a gathering when it names at least GATHER_MIN types.
 */

/** A passage gathers types when it names at least this many. */
export const GATHER_MIN = 5;

export type GatheringMember = {
  /** The type's id ("04:ark"). */
  type: string;
  /** Its first quotation from the passage (index into the type's `where`), its reference and reader link. */
  quote: number;
  ref: string;
  href: string;
};

export type Gathering = {
  /** "tertullian-bapt-9", for the address. */
  id: string;
  /** "Tertullian, *Bapt.* 9": the passage, as the quotations cite it. */
  ref: string;
  /** "Tertullian", as the quotations credit him. */
  father: string;
  /** The Father's and the work's ids in the library ("tertullian", "on-baptism"), and the unit's number ("9", "§8"). */
  author: string;
  work: string;
  unit: string;
  /** The reader page of the first quotation. */
  href: string;
  /** The types, in the order the Father names them. */
  members: GatheringMember[];
};

/** "Tertullian, *Bapt.* 8 (Jacob's crossed hands)" → the passage "Tertullian, *Bapt.* 8"; "Cyril, *Cat.* 3.10" → "Cyril, *Cat.* 3". */
export function passageOf(ref: string): { passage: string; unit: string } | null {
  const r = ref.replace(/\s*\([^)]*\)\s*$/, "").trim();
  const m = r.match(/^(.*?)(§?\d+(?:\.\d+)*)[a-z]?$/);
  if (!m) return null;
  const parts = m[2].split(".");
  const unit = parts.length > 1 ? parts.slice(0, -1).join(".") : parts[0];
  return { passage: m[1] + unit, unit };
}

/** A reader link's place in its work: chapter page, then paragraph. */
function position(href: string): [number, number] {
  const ch = Number(href.match(/\/chapter-(\d+)\//)?.[1] ?? 0);
  const p = Number(href.match(/-p(\d+)$/)?.[1] ?? 0);
  return [ch, p];
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[*§]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Every gathering, in no particular order (the page orders them). */
export function computeGatherings(types: TypeEntry[], min = GATHER_MIN): Gathering[] {
  type Hit = GatheringMember & { at: [number, number] };
  const by = new Map<string, { ref: string; unit: string; author: string; work: string; hits: Hit[] }>();
  for (const t of types) {
    t.where.forEach((w, quote) => {
      const link = t.links?.[quote];
      const cut = w.indexOf(" — ");
      if (!link || cut < 0) return;
      const ref = w.slice(0, cut);
      const p = passageOf(ref);
      if (!p) return;
      const [, author = "", work = ""] = link.href.match(/^\/fathers\/([^/]+)\/([^/]+)\//) ?? [];
      const key = p.passage;
      if (!by.has(key)) by.set(key, { ref: p.passage, unit: p.unit, author, work, hits: [] });
      by.get(key)!.hits.push({ type: t.id, quote, ref, href: link.href, at: position(link.href) });
    });
  }
  const out: Gathering[] = [];
  for (const g of by.values()) {
    const hits = [...g.hits].sort((a, b) => a.at[0] - b.at[0] || a.at[1] - b.at[1] || a.quote - b.quote);
    const members: GatheringMember[] = [];
    for (const { at: _at, ...h } of hits) if (!members.some((m) => m.type === h.type)) members.push(h);
    if (members.length < min) continue;
    out.push({
      id: slug(g.ref),
      ref: g.ref,
      father: g.ref.split(",")[0].trim(),
      author: g.author,
      work: g.work,
      unit: g.unit,
      href: members[0].href.split("#")[0],
      members
    });
  }
  return out;
}

export type NamedGathering = Gathering & { name: string };

type CatalogLike = { authors: { id: string; deathYear?: number | null }[]; works: { id: string; title: string }[] };

/** "On the Baptism of Christ (A Sermon for the Day of the Lights)" → "On the Baptism of Christ". */
const shortTitle = (t: string) => t.replace(/\s*\([^)]*\)\s*$/, "").trim();

/**
 * The gatherings named from the library's catalogue ("Tertullian, On Baptism 9") and ordered through history:
 * by the Father's death, then the work, then the passage.
 */
export function nameGatherings(gs: Gathering[], catalog: CatalogLike | null): NamedGathering[] {
  const died = new Map((catalog?.authors ?? []).map((a) => [a.id, a.deathYear ?? 9999]));
  const title = new Map((catalog?.works ?? []).map((w) => [w.id, shortTitle(w.title)]));
  const num = (u: string) => u.replace("§", "").split(".").map(Number);
  return gs
    .map((g) => ({ ...g, name: title.has(g.work) ? `${g.father}, ${title.get(g.work)} ${g.unit}` : g.ref.replace(/\*/g, "") }))
    .sort((a, b) => {
      const d = (died.get(a.author) ?? 9999) - (died.get(b.author) ?? 9999);
      if (d || a.work !== b.work) return d || a.work.localeCompare(b.work);
      const [x, y] = [num(a.unit), num(b.unit)];
      for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) - (y[i] ?? 0);
      return 0;
    });
}
