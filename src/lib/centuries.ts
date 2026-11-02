import { ERAS, type HistoryEra } from "../../server/churchHistory";
import { centuryHeading, fatherSections, type FatherEntry } from "./fathersDirectory";
import type { Author } from "../../server/types";

/**
 * One century of the Fathers page: the Fathers who died in it and what happened in it.
 * The church history timeline lives here rather than on a page of its own, so the people and
 * the events of each century are read together. Named sections (the councils) have no events.
 */
export type CenturyBlock = {
  id: string;
  title: string;
  /** The century number, or null for a named section. */
  century: number | null;
  fathers: FatherEntry[];
  events: HistoryEra[];
};

/** The century an event falls in. BC dates (the Nativity) belong to the first. */
export function eraCentury(year: number): number {
  return year <= 0 ? 1 : Math.ceil(year / 100);
}

export function centuryBlocks(authors: Author[]): CenturyBlock[] {
  const byCentury = new Map<number, CenturyBlock>();
  const named: CenturyBlock[] = [];
  for (const section of fatherSections(authors)) {
    const m = section.id.match(/^century-(\d+)$/);
    if (m) byCentury.set(Number(m[1]), { ...section, century: Number(m[1]), events: [] });
    else named.push({ ...section, century: null, events: [] });
  }
  for (const era of [...ERAS].sort((a, b) => a.year - b.year)) {
    const n = eraCentury(era.year);
    let block = byCentury.get(n);
    if (!block) {
      block = { id: "century-" + n, title: centuryHeading(n), century: n, fathers: [], events: [] };
      byCentury.set(n, block);
    }
    block.events.push(era);
  }
  return [...[...byCentury.values()].sort((a, b) => a.century! - b.century!), ...named];
}
