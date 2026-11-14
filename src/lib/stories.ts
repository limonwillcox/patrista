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
