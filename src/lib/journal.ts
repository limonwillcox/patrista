import { deathCentury } from "../../server/shelf";
import { formatCentury } from "./libraryHover";

export type JournalWork = {
  id: string;
  title: string;
  hasNote: boolean;
};

export type JournalFather = {
  id: string;
  name: string;
  deathYear: number;
  works: JournalWork[];
  hasNote: boolean;
};

export type JournalCentury = {
  n: number;
  label: string;
  fathers: JournalFather[];
  hasNote: boolean;
};

export type JournalTocBlock =
  | { kind: "chapter"; n: number; label: string; roman: string; title: string }
  | { kind: "author"; id: string; name: string; deathYear: number; hasNote: boolean }
  | { kind: "work"; id: string; title: string; hasNote: boolean };

export type JournalPage = {
  folio: number;
  blocks: JournalTocBlock[];
};

/** Line budget on a contents leaf. Chapter costs 2; author and work cost 1. */
export const JOURNAL_PAGE_SLOTS = 20;

const ROMAN_ONES = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
const ROMAN_TENS = ["", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC"];
const CENTURY_WORDS = [
  "",
  "First",
  "Second",
  "Third",
  "Fourth",
  "Fifth",
  "Sixth",
  "Seventh",
  "Eighth",
  "Ninth",
  "Tenth",
  "Eleventh",
  "Twelfth",
  "Thirteenth",
  "Fourteenth",
  "Fifteenth",
  "Sixteenth",
  "Seventeenth",
  "Eighteenth",
  "Nineteenth",
  "Twentieth"
];

export function toRoman(n: number): string {
  if (n <= 0) return "";
  if (n >= 100) return String(n);
  return ROMAN_TENS[Math.floor(n / 10)] + ROMAN_ONES[n % 10];
}

export function centuryChapterTitle(n: number): string {
  const word = CENTURY_WORDS[n] || n + "th";
  const start = (n - 1) * 100;
  const end = n * 100;
  return word + " Century: " + start + "-" + end + " AD";
}

export function fatherDate(year: number): string {
  return year > 0 ? "d. " + year : "date unknown";
}

export function journalTree(
  authors: { id: string; name: string; deathYear: number }[],
  works: { id: string; author: string; title: string }[],
  hasNote: (workId: string) => boolean
): JournalCentury[] {
  const byId = new Map(authors.map((a) => [a.id, a]));
  const centuries = new Map<number, Map<string, JournalFather>>();
  for (const work of works) {
    const author = byId.get(work.author);
    if (!author) continue;
    const n = deathCentury(author.deathYear);
    let fathers = centuries.get(n);
    if (!fathers) {
      fathers = new Map();
      centuries.set(n, fathers);
    }
    let father = fathers.get(author.id);
    if (!father) {
      father = { id: author.id, name: author.name, deathYear: author.deathYear, works: [], hasNote: false };
      fathers.set(author.id, father);
    }
    const noted = hasNote(work.id);
    father.works.push({ id: work.id, title: work.title, hasNote: noted });
    if (noted) father.hasNote = true;
  }
  return [...centuries.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([n, fathers]) => {
      const list = [...fathers.values()].sort((a, b) => a.name.localeCompare(b.name));
      return {
        n,
        label: formatCentury(n),
        fathers: list,
        hasNote: list.some((f) => f.hasNote)
      };
    });
}

export function journalPages(tree: JournalCentury[]): JournalPage[] {
  const stream: JournalTocBlock[] = [];
  for (const century of tree) {
    stream.push({
      kind: "chapter",
      n: century.n,
      label: century.label,
      roman: toRoman(century.n),
      title: centuryChapterTitle(century.n)
    });
    for (const father of century.fathers) {
      stream.push({
        kind: "author",
        id: father.id,
        name: father.name,
        deathYear: father.deathYear,
        hasNote: father.hasNote
      });
      for (const work of father.works) {
        stream.push({
          kind: "work",
          id: work.id,
          title: work.title,
          hasNote: work.hasNote
        });
      }
    }
  }

  const pages: JournalPage[] = [];
  let blocks: JournalTocBlock[] = [];
  let slots = 0;

  function cost(block: JournalTocBlock): number {
    return block.kind === "chapter" ? 2 : 1;
  }

  function flush() {
    pages.push({
      folio: pages.length + 1,
      blocks
    });
    blocks = [];
    slots = 0;
  }

  for (const block of stream) {
    const n = cost(block);
    const need = block.kind === "chapter" ? n + 2 : block.kind === "author" ? n + 1 : n;
    if (slots + need > JOURNAL_PAGE_SLOTS && blocks.length) flush();
    blocks.push(block);
    slots += n;
  }
  if (blocks.length || pages.length === 0) flush();
  return pages;
}
