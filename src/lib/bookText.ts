import type { WorkOutline } from "../../server/types";
import { fetchChapter, fetchWork } from "../api/client";
import { bodyParagraphs, openingLines } from "../components/shelf/BookViewer";
import { englishParagraphs } from "./fatherPaths";

export type BookText = {
  outline: WorkOutline;
  /** The first lines, for the closed-book preview. */
  opening: { heading: string; text: string } | null;
  /** Enough paragraphs to fill the pages of the 3D book. */
  paras: string[];
};

const cache = new Map<string, Promise<BookText>>();

/**
 * The opening of a work, as the book viewer shows it: the outline, the first lines, and enough
 * paragraphs to fill a few spreads. Fetched once per work, so the shelf can start it while the reader
 * is still pointing at the book and the viewer finds it ready.
 */
export function loadBookText(work: { id: string; title: string }): Promise<BookText> {
  let p = cache.get(work.id);
  if (p) return p;
  p = (async () => {
    const outline = await fetchWork(work.id);
    const first = outline.chapters[0];
    if (!first) return { outline, opening: null, paras: [] };
    const passage = await fetchChapter(work.id, first.chapter);
    const english = englishParagraphs(passage.versions);
    const opening = { heading: outline.chapters.length > 1 ? passage.heading : "", text: openingLines(english, [work.title, passage.heading]) };
    const body = bodyParagraphs(english, [work.title, passage.heading]);
    // A short first chapter would leave the book mostly blank: read on into the next few.
    for (const ch of outline.chapters.slice(1, 4)) {
      if (body.join(" ").length >= 9000) break;
      try {
        body.push(...englishParagraphs((await fetchChapter(work.id, ch.chapter)).versions));
      } catch {
        break;
      }
    }
    return { outline, opening, paras: body };
  })();
  p.catch(() => cache.delete(work.id));
  cache.set(work.id, p);
  return p;
}
