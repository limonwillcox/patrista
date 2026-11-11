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
  /** Paragraph number within the chapter. Omitted when the selection has none. */
  n: number | null;
  translator: string;
  /** Printed series or edition, when the catalog names one. */
  edition?: string;
  url: string;
};

/**
 * A bibliography entry for the work, with the place that was selected.
 * No quotation. No invented page number: the paragraph is the locator.
 */
export function bibliography(p: CitationParts): string {
  const place = [p.chapter, p.n ? "¶" + p.n : ""].filter(Boolean).join(", ");
  const head = [p.author, p.work, place].filter(Boolean).join(". ") + ".";
  const credit = [
    p.translator ? "Translated by " + p.translator + "." : "",
    p.edition ? p.edition.replace(/\.$/, "") + "." : "",
    p.url
  ].filter(Boolean);
  return [head, ...credit].join(" ");
}

/** @deprecated The paragraph menu's short line. Papers use bibliography(). */
export function citation(p: CitationParts): string {
  return bibliography(p);
}

export function quoteWithCitation(text: string, p: CitationParts): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return "“" + clean + "”\n\n" + bibliography(p);
}

/** Share sheet: the quote, a blank line, the name and the book. The link is sent separately. */
export function shareText(quote: string, author: string, work: string): string {
  const clean = quote.replace(/\s+/g, " ").trim();
  const who = [author, work].filter(Boolean).join(", ");
  return "“" + clean + "”\n\n" + who;
}

/** Translator credit for a work's English, from its series. */
export function translatorFor(workId: string, series: string): string {
  if (workId === "confessions") return "E. B. Pusey";
  if (/^ANF/i.test(series)) return "Ante-Nicene Fathers, ed. Roberts & Donaldson";
  if (/^NPNF/i.test(series)) return "Nicene and Post-Nicene Fathers, ed. Schaff";
  return "";
}
