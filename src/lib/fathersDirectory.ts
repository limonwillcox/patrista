import type { Author } from "../../server/types";
import { deathCentury } from "../../server/shelf";
import { centuryChapterTitle } from "./journal";
import { FATHER_PROFILES, type FatherProfile } from "./fatherProfiles";

export type FatherEntry = {
  id: string;
  name: string;
  dates: string;
  region: string;
  deathYear: number;
  office: string;
  paragraphs: string[];
};

export type FatherSection = {
  id: string;
  title: string;
  fathers: FatherEntry[];
};

export function isFathersTabPath(pathname: string): boolean {
  if (pathname === "/fathers") return true;
  const parts = pathname.split("/").filter(Boolean);
  return parts[0] === "fathers" && parts.length === 2;
}

export function centuryHeading(n: number): string {
  const titled = centuryChapterTitle(n);
  const split = titled.indexOf(":");
  return split === -1 ? titled : titled.slice(0, split);
}

export function fatherEntry(author: Author, profile?: FatherProfile): FatherEntry {
  const known = profile ?? FATHER_PROFILES[author.id];
  if (known) {
    return {
      id: author.id,
      name: author.name,
      dates: author.dates,
      region: author.region,
      deathYear: author.deathYear,
      office: known.office,
      paragraphs: known.paragraphs
    };
  }
  const paragraphs = author.bio
    ? [author.bio]
    : [
        author.name +
          (author.dates ? " (" + author.dates + ")" : "") +
          " is part of the Patrista library" +
          (author.region ? ", associated with " + author.region + "." : ".")
      ];
  return {
    id: author.id,
    name: author.name,
    dates: author.dates,
    region: author.region,
    deathYear: author.deathYear,
    office: author.region || "Church Father",
    paragraphs
  };
}

function byDeathThenName(a: FatherEntry, b: FatherEntry): number {
  if (a.deathYear !== b.deathYear) return a.deathYear - b.deathYear;
  return a.name.localeCompare(b.name);
}

/** Century sections in order, then any named sections (Councils) at the end. */
export function fatherSections(authors: Author[]): FatherSection[] {
  const centuries = new Map<number, FatherEntry[]>();
  const named = new Map<string, FatherEntry[]>();
  for (const author of authors) {
    const profile = FATHER_PROFILES[author.id];
    const entry = fatherEntry(author, profile);
    if (profile?.section) {
      const list = named.get(profile.section) ?? [];
      list.push(entry);
      named.set(profile.section, list);
      continue;
    }
    const n = deathCentury(author.deathYear);
    const list = centuries.get(n) ?? [];
    list.push(entry);
    centuries.set(n, list);
  }
  const sections: FatherSection[] = [...centuries.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([n, fathers]) => ({
      id: "century-" + n,
      title: centuryHeading(n),
      fathers: fathers.sort(byDeathThenName)
    }));
  for (const [title, fathers] of named) {
    sections.push({
      id: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      title,
      fathers: fathers.sort(byDeathThenName)
    });
  }
  return sections;
}
