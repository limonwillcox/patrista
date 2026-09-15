export type Canon = "ot" | "nt" | "dt";

export type Provenance = "hcf" | "ecatena" | "catena-aurea" | "anf-fn" | "crowd";

export type LinkStatus = "verified" | "crowd" | "rejected";

/** Verse or verse-range. loc = chapter * 1_000_000 + verse. */
export type BibleRef = {
  bookId: string;
  bookNum: number;
  canon: Canon;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  locStart: number;
  locEnd: number;
};

/**
 * One Father excerpt tied to BibleRef span(s).
 * CrowdVote is deferred — not in this store.
 */
export type Link = {
  id: string;
  sectionId: string | null;
  workId: string;
  fatherId: string;
  workTitle: string;
  excerpt: string;
  sourceUrl: string;
  sourceWork: string;
  deathYear: number;
  /** ceil(deathYear / 100), clamped to 1–6. */
  century: number;
  provenance: Provenance;
  confidence: number;
  status: LinkStatus;
  refs: BibleRef[];
};

export type WorkNode = {
  workId: string;
  workTitle: string;
  links: Link[];
};

export type FatherNode = {
  fatherId: string;
  deathYear: number;
  works: WorkNode[];
};

export type CenturyNode = {
  century: number;
  fathers: FatherNode[];
};

export type BookNode = {
  bookId: string;
  bookNum: number;
  refs: BibleRef[];
};

export type TestamentNode = {
  canon: Canon;
  books: BookNode[];
};
