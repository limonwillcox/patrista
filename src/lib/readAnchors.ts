/**
 * Reader URLs inside a work. A chapter is "#ch-3"; a paragraph is "#ch-3-p12" (paragraphs count from 1
 * within the chapter). A book-chapter heading in a two-level work stays "#ch-3-2".
 */

export function paraAnchor(chapter: number, n: number): string {
  return "ch-" + chapter + "-p" + n;
}

/** The chapter a reader hash points into, or null. "#ch-3", "#ch-3-p12" and "#ch-3-2" all give 3. */
export function hashChapter(hash: string): number | null {
  const m = hash.match(/^#ch-(\d+)(?:-p?\d+)?$/);
  return m ? Number(m[1]) : null;
}

/** A paragraph hash ("#ch-3-p12"), or null. */
export function hashParagraph(hash: string): { chapter: number; n: number } | null {
  const m = hash.match(/^#ch-(\d+)-p(\d+)$/);
  return m ? { chapter: Number(m[1]), n: Number(m[2]) } : null;
}

export type CitationParts = {
  author: string;
  work: string;
  /** Chapter heading, e.g. "Book I" or "Chapter 3". Empty for one-part works. */
  chapter: string;
  n: number;
  translator: string;
  url: string;
};

/** "Augustine of Hippo, The Confessions, Book I, ¶3 (tr. E. B. Pusey). https://…" */
export function citation(p: CitationParts): string {
  const where = [p.author, p.work, p.chapter, "¶" + p.n].filter(Boolean).join(", ");
  return where + (p.translator ? " (tr. " + p.translator + ")" : "") + ". " + p.url;
}

export function quoteWithCitation(text: string, p: CitationParts): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return "“" + clean + "” — " + citation(p);
}

/** Translator credit for a work's English, from its series. */
export function translatorFor(workId: string, series: string): string {
  if (workId === "confessions") return "E. B. Pusey";
  if (/^ANF/i.test(series)) return "Ante-Nicene Fathers, ed. Roberts & Donaldson";
  if (/^NPNF/i.test(series)) return "Nicene and Post-Nicene Fathers, ed. Schaff";
  return "";
}
