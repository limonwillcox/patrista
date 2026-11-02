import { writingCategory } from "./libraryHover";

/** The physical form a work is shown in: what it would have been written on in its own time. */
export type ManuscriptForm = "roll" | "papyrus-codex" | "parchment-codex";

/**
 * Letters went out as papyrus rolls. Books were codices, which Christians took up early: papyrus
 * before about 300, parchment after, when large books moved to skin.
 */
export function manuscriptForm(work: { title: string }, author: { deathYear: number }): ManuscriptForm {
  if (writingCategory(work.title) === "Epistle") return "roll";
  return author.deathYear < 300 ? "papyrus-codex" : "parchment-codex";
}

export const FORM_NOTES: Record<ManuscriptForm, { label: string; note: string; hint: string }> = {
  roll: {
    label: "Papyrus roll",
    note: "Letters were written on papyrus, rolled up, tied, and carried by hand to the church they addressed.",
    hint: "Drag or scroll to unroll"
  },
  "papyrus-codex": {
    label: "Papyrus codex",
    note: "Christians took up the codex, a book of folded leaves, long before their neighbours gave up the roll. Before the fourth century most were papyrus.",
    hint: "Tap a page to turn it"
  },
  "parchment-codex": {
    label: "Parchment codex",
    note: "From the fourth century large books were copied onto parchment, the form of the great Bibles of that age.",
    hint: "Tap a page to turn it"
  }
};
