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
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/fathers") return true;
  const parts = path.split("/").filter(Boolean);
  return parts[0] === "fathers" && parts.length === 2 && !parts[1].endsWith(".html");
}

/** One line under each century heading on /fathers/. Keyed by section id. */
export const SECTION_NOTES: Record<string, string> = {
  "century-1": "Letters and a church order from the generation that still remembered the Apostles.",
  "century-2": "Bishops write to their churches on the road to martyrdom, and the Apologists answer pagan Rome.",
  "century-3": "Irenaeus, Tertullian and Origen: the first great theologians, writing through the persecutions.",
  "century-4": "The century of Nicaea: Athanasius, the Cappadocians, the desert monks and the first church histories.",
  "century-5": "Augustine, Chrysostom and Jerome, the councils of Ephesus and Chalcedon, and the fall of Rome in the West.",
  "century-6": "The West after Rome: rules for monks, letters of popes, and the first chronicles of a new Europe.",
  "century-7": "Gregory the Great guides the Church of Rome through plague, war and the Lombard invasions.",
  "century-8": "John of Damascus gathers the Greek Fathers into one summary of the faith.",
  "century-9": "After the Fathers: Cyril and Methodius carry the faith to the Slavs, and Rome and Constantinople begin to part.",
  "century-11": "East and West divide in 1054, the end of the story this library tells.",
  councils: "The creeds and canons of the ecumenical councils, from Nicaea in 325 onward."
};

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

/** "I" for century-1; a short mark for named sections. */
export function sectionMark(sectionId: string): string {
  const m = sectionId.match(/^century-(\d+)$/);
  return m ? ROMAN[Number(m[1])] || m[1] : "✠";
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
