import { describe, expect, it } from "vitest";
import { getWork } from "../server/api";

/** The text of every chapter of a work, one string per paragraph. */
function paragraphs(id: string): string[] {
  const work = getWork(id);
  if (!work) throw new Error("no work " + id);
  return work.chapters.flatMap((c) => (c.versions as Record<string, string[]>).schaff ?? []);
}

/**
 * Concerning the Sacraments came from a raw scan of the 1919 SPCK edition: headings, running page heads
 * and page-bottom footnotes all sat in the text as paragraphs (issue 290). The source file was cleaned by
 * hand; this keeps it clean.
 */
describe("Concerning the Sacraments", () => {
  const work = getWork("concerning-the-sacraments")!;
  const text = paragraphs("concerning-the-sacraments");

  it("is six books in thirty chapters, each with its own heading", () => {
    expect(work.chapters).toHaveLength(30);
    expect(work.chapters[0].heading).toBe('Book I · Chapter I — Why instruction on the sacraments was deferred. The "opening of the ears."');
    expect(work.chapters[29].heading).toMatch(/^Book VI · Chapter V — On the modesty/);
    expect(new Set(work.chapters.map((c) => c.heading.split(" · ")[0]))).toEqual(new Set(["Book I", "Book II", "Book III", "Book IV", "Book V", "Book VI"]));
  });

  it("keeps headings, running heads and page furniture out of the text", () => {
    for (const p of text) {
      expect(p, p.slice(0, 60)).not.toMatch(/^(BOOK|CHAPTER|Book|Chapter) [IVXLC]+\.?$/);
      expect(p, p.slice(0, 60)).not.toMatch(/THE TREATISE|ON THE SACRAMENTS/);
      expect(p.length, p).toBeGreaterThan(20);
    }
  });

  it("holds its footnotes as footnotes, not as paragraphs", () => {
    const notes = work.chapters.reduce((n, c) => n + (c.footnotes ?? []).length, 0);
    expect(notes).toBe(275);
    for (const p of text) {
      expect(p, p.slice(0, 60)).not.toMatch(/\[\d+\]/);
      // A page-bottom note left in the text starts with its number and no full stop: "1 Cf. de Myst."
      expect(p, p.slice(0, 60)).not.toMatch(/^(\d{1,2}|\*) [A-Z"(]/);
    }
    expect(work.chapters[0].footnotes?.[2]).toMatchObject({ text: "A summary of Rom. iv. 2, 3, 9." });
  });

  it("joins the paragraphs a page break had cut", () => {
    expect(text.find((p) => p.startsWith("2. Therefore, what did we do on the Saturday?"))).toContain("touched thine ears and nostrils. It is this");
    // Every paragraph ends as a sentence does: none stops where a page did.
    const open = text.filter((p) => !/[.?!"”)]$/.test(p.trim()));
    expect(open).toEqual([]);
  });
});

describe("a book's bare heading", () => {
  it("does not end the chapter before it", () => {
    for (const id of ["concerning-virgins", "to-his-wife", "concerning-the-sacraments"])
      expect(paragraphs(id).filter((p) => /^Book [IVXLC]+\.?$/i.test(p.trim())), id).toEqual([]);
  });
});

/** The two other works that came from raw scans, cleaned the same day (issue 290). */
describe("On the Death of Theodosius", () => {
  const work = getWork("on-the-death-of-theodosius")!;
  const text = paragraphs("on-the-death-of-theodosius");

  it("is one oration of 56 numbered sections", () => {
    expect(work.chapters).toHaveLength(1);
    expect(text).toHaveLength(56);
    text.forEach((p, i) => expect(p.startsWith(i + 1 + ". "), p.slice(0, 30)).toBe(true));
  });

  it("has no running heads, page numbers or cut paragraphs in it", () => {
    for (const p of text) {
      expect(p, p.slice(0, 60)).not.toMatch(/PATRISTIC STUDIES|ON THE DEATH OF THEODOSIUS/);
      expect(p, p.slice(-60)).toMatch(/[.?!”’]$/);
    }
    expect(text[2]).toContain("during forty days, this son offers due ceremonies");
  });
});

describe("Address to Young Men on Reading Greek Literature", () => {
  const id = "address-to-young-men-on-reading-greek-literature-de-legendis-gentilium-libris";
  const work = getWork(id)!;
  const text = paragraphs(id);

  it("is ten chapters with its notes held as footnotes", () => {
    expect(work.chapters.map((c) => c.heading)).toEqual(["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"].map((n) => "Chapter " + n));
    expect(work.chapters.reduce((n, c) => n + (c.footnotes ?? []).length, 0)).toBe(73);
  });

  it("has no running heads, footnotes or cut paragraphs in the text", () => {
    for (const p of text) {
      expect(p, p.slice(0, 60)).not.toMatch(/The Right Use of Greek Literature|\[\d+\]|\^/);
      expect(p, p.slice(-60)).toMatch(/[.?!'’”]$/);
    }
    expect(text[0]).toContain("teach their lessons at every turn, have so familiarized me");
  });
});
