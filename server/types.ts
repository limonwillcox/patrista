export type VersionGroup = "translation" | "original";

export type Version = {
  id: string;
  label: string;
  short: string;
  group: VersionGroup;
};

export type Author = {
  id: string;
  name: string;
  dates: string;
  era: string;
  region: string;
  /** Estimated year of death; floruit midpoint when the death is unknown. */
  deathYear: number;
  /** Two-sentence bio for the inspect overlay. Empty until the copy pass. */
  bio: string;
};

export type Era = {
  id: string;
  label: string;
};

export type Work = {
  id: string;
  author: string;
  title: string;
  short: string;
  chapters: number;
  series: string;
  wordCount: number;
  blurb?: string;
  cover?: string;
  /** When true, inspect overlay shows a disputed-authorship warning. */
  authorshipDisputed?: boolean;
};

export type Footnote = {
  n: string;
  text: string;
  para: number;
};

export type Passage = {
  work: string;
  chapter: number;
  heading: string;
  versions: Record<string, string[]>;
  footnotes: Footnote[];
  /** Cross-ref tags attached at library load (optional). */
  tags?: QuoteTag[];
};

export type VerseRelation = "cites" | "alludes" | "comments";

/** Bible verse span. Prefer ≥5 verses when the Father treats a whole unit. */
export type VerseRef = {
  book: string;
  chapter: number;
  verse: number;
  endVerse?: number;
  relation: VerseRelation;
};

export type Topic = {
  id: string;
  label: string;
  parent?: string;
};

/**
 * A short Father quote tagged to Bible passage(s) and topic(s).
 * `snippet` stays 1–2 sentences; the reader can open the homily for more.
 */
export type QuoteTag = {
  id: string;
  work: string;
  /** Father work unit (homily / chapter number in our Passage model). */
  chapter: number;
  snippet: string;
  topics: string[];
  verses: VerseRef[];
  /** Known section ids, e.g. jo.1.prologue */
  sections: string[];
  /** 3-verse block ids, e.g. jo.1.1-3 */
  blocks?: string[];
};

export type Catalog = {
  versions: Version[];
  authors: Author[];
  eras: Era[];
  works: Work[];
  votd: {
    work: string;
    chapter: number;
    quote: string;
    latin: string;
  };
};

export type QueryRef = { type: "ref"; work: string; chapter: number | null };
export type QueryKeyword = { type: "keyword"; q: string };
export type QueryEmpty = { type: "empty" };
export type Query = QueryRef | QueryKeyword | QueryEmpty;

export type SearchHit = {
  work: string;
  chapter: number;
  heading: string;
  author: string;
  title: string;
  snippet: string;
  snippetHtml: string;
};

export type WorkPayload = {
  work: Work;
  author: Author;
  chapters: Passage[];
};

export type ApiResult = {
  status: number;
  json: unknown;
};
