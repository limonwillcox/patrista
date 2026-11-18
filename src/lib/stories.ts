/**
 * The story a verse belongs to, from the story list at /stories/<book>.json (scripts/stories/build_stories.py:
 * the Berean Standard Bible's section headings, with the long stories joined by hand).
 *
 * The Fathers often speak of a whole story ("Envy brought down Dathan and Abiram alive to Hades") while
 * the editor's footnote names one verse of it. The Commentary tab shows such a passage on every verse of
 * the story, under the verse's own passages.
 */

/** A row of the story list: [first chapter, first verse, last chapter, last verse, title]. */
export type StoryRow = [number, number, number, number, string];
export type Story = { fromChapter: number; fromVerse: number; toChapter: number; toVerse: number; title: string };

const before = (c: number, v: number, c2: number, v2: number) => c < c2 || (c === c2 && v < v2);

/** The story that holds a verse, or null. */
export function storyAt(rows: StoryRow[] | null | undefined, chapter: number, verse: number): Story | null {
  for (const [c0, v0, c1, v1, title] of rows ?? []) {
    if (before(chapter, verse, c0, v0)) return null; // rows are in order
    if (!before(c1, v1, chapter, verse)) return { fromChapter: c0, fromVerse: v0, toChapter: c1, toVerse: v1, title };
  }
  return null;
}

/** Whether a verse lies in a story. */
export const inStory = (s: Story, chapter: number, verse: number) =>
  !before(chapter, verse, s.fromChapter, s.fromVerse) && !before(s.toChapter, s.toVerse, chapter, verse);

/** The chapters a story touches. */
export function storyChapters(s: Story): number[] {
  const out: number[] = [];
  for (let c = s.fromChapter; c <= s.toChapter; c++) out.push(c);
  return out;
}

/** "Numbers 16:1–50", "Genesis 6:1–9:17". */
export function storyRange(bookName: string, s: Story): string {
  const end = s.toChapter === s.fromChapter ? (s.toVerse === s.fromVerse ? "" : "–" + s.toVerse) : "–" + s.toChapter + ":" + s.toVerse;
  return bookName + " " + s.fromChapter + ":" + s.fromVerse + end;
}

/** Sorted verse numbers as runs: [1, 2, 3, 7] reads "1–3, 7". */
export function verseRuns(verses: number[]): string {
  const sorted = [...new Set(verses)].sort((a, b) => a - b);
  const runs: string[] = [];
  for (let i = 0; i < sorted.length; i++) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
    runs.push(j > i ? sorted[i] + "–" + sorted[j] : String(sorted[i]));
    i = j;
  }
  return runs.join(", ");
}

/**
 * Where in a story a passage of the Fathers lands, from the [chapter, verse] points it cites. Verse 0 is
 * the chapter cited as a whole ("Gen. xxxvii."). In a story of one chapter: "vv. 31–33", "ch. 16". In a
 * longer one the chapter leads each run: "7:11–12, 8:2", "ch. 37".
 */
export function storyWhere(points: [number, number][], story: Story): string {
  const byChapter = new Map<number, number[]>();
  for (const [c, v] of points) byChapter.set(c, [...(byChapter.get(c) ?? []), v]);
  const chapters = [...byChapter.keys()].sort((a, b) => a - b);
  const one = story.fromChapter === story.toChapter;
  const parts: string[] = [];
  for (const c of chapters) {
    const verses = byChapter.get(c)!.filter((v) => v > 0);
    if (!verses.length) parts.push("ch. " + c);
    else if (one) parts.push((new Set(verses).size > 1 ? "vv. " : "v. ") + verseRuns(verses));
    else parts.push(c + ":" + verseRuns(verses).replace(/, /g, ", " + c + ":"));
  }
  return parts.join(", ");
}

/** What a section of the Bible is, for the heading over the Fathers' words on it. */
export type StoryKind = "story" | "parable" | "passage";

/** The books that tell a story. The law, the poets, the prophets and the letters teach: their sections are passages. */
const NARRATIVE_BOOKS = new Set("gn ex nm js jud rt 1sm 2sm 1kgs 2kgs 1ch 2ch ezr ne et dn jn mt mk lk jo act".split(" "));

/** Teaching inside the story books, the long discourses: [book, first chapter, first verse, last chapter, last verse]. */
const DISCOURSES: [string, number, number, number, number][] = [
  ["mt", 5, 1, 7, 29],
  ["mt", 10, 5, 10, 42],
  ["mt", 18, 1, 18, 35],
  ["mt", 23, 1, 25, 46],
  ["mk", 13, 1, 13, 37],
  ["lk", 6, 17, 6, 49],
  ["lk", 21, 5, 21, 38],
  ["jo", 13, 31, 17, 26]
];

/**
 * A parable is named as one. A section of a letter, a psalm, a prophet or one of the Lord's discourses
 * is a passage. The rest, in the books that narrate, are stories.
 */
export function storyKind(book: string, s: Story): StoryKind {
  if (/\bparables?\b/i.test(s.title)) return "parable";
  if (!NARRATIVE_BOOKS.has(book)) return "passage";
  const taught = DISCOURSES.some(
    ([b, c0, v0, c1, v1]) => b === book && !before(s.fromChapter, s.fromVerse, c0, v0) && !before(c1, v1, s.toChapter, s.toVerse)
  );
  return taught ? "passage" : "story";
}

/** The line over the Fathers' words on a section: "The Fathers on the story", "… on this parable", "… on this passage". */
export function storyKicker(kind: StoryKind): string {
  return kind === "story" ? "The Fathers on the story" : "The Fathers on this " + kind;
}
