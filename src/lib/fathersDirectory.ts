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
  "century-1":
    "Clement’s letter to Corinth and the Didache, from the generation after the Apostles. The Epistle of Barnabas, filed here, is usually dated c. 96–135, often c. 130.",
  "century-2": "Bishops write to their churches on the road to martyrdom, and the Apologists answer pagan Rome.",
  "century-3":
    "Tertullian, Origen and Cyprian write through the persecutions. Irenaeus, whose Against Heresies dates from about 180, is filed here by the year of his death.",
  "century-4": "The century of Nicaea: Athanasius, the Cappadocians, the desert monks and the first church histories.",
  "century-5": "Augustine, Chrysostom and Jerome, the councils of Ephesus and Chalcedon, and the end of the western empire.",
  "century-6": "The West after Rome: the Rule of Benedict, Justinian’s Hagia Sophia, and Gregory the Great’s election at Rome in 590.",
  "century-7": "Gregory the Great dies in 604, and within a generation the Arab conquests take Jerusalem, Antioch and Alexandria.",
  "century-8": "John of Damascus gathers the Greek Fathers into one summary of the faith, as the dispute over icons begins.",
  "century-9": "After the Fathers: Cyril and Methodius carry the faith to the Slavs, and the Photian schism strains Rome and Constantinople.",
  "century-11":
    "The mutual excommunications of 1054, later taken as the symbol of the schism between East and West, close the story this library tells.",
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
  // No placeholder prose: a Father without a written profile shows only the catalog's own bio, if any.
  // tests/fathersDirectory.test.ts fails when a Father with works has no profile.
  const paragraphs = author.bio ? [author.bio] : [];
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

/** Named shelves after the centuries. Authors holds writers the ancient church called heretics. */
const NAMED_SECTION_ORDER = ["Councils", "Authors", "Disputed historical figures"];

/** Century sections in order, then Councils, Authors, and Disputed historical figures. */
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
  const namedSections = [...named.entries()].sort((a, b) => {
    const ra = NAMED_SECTION_ORDER.indexOf(a[0]);
    const rb = NAMED_SECTION_ORDER.indexOf(b[0]);
    return (ra === -1 ? NAMED_SECTION_ORDER.length : ra) - (rb === -1 ? NAMED_SECTION_ORDER.length : rb);
  });
  for (const [title, fathers] of namedSections) {
    sections.push({
      id: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      title,
      fathers: fathers.sort(byDeathThenName)
    });
  }
  return sections;
}
