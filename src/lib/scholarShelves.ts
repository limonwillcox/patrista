import type { Author } from "../../server/types";
import { fatherSections, type FatherEntry } from "./fathersDirectory";

export type ScholarShelf = {
  id: string;
  title: string;
  fathers: FatherEntry[];
  workCount: number;
};

function byName(a: FatherEntry, b: FatherEntry): number {
  return a.name.localeCompare(b.name, "en", { sensitivity: "base" });
}

export function scholarShelves(authors: Author[], works: { author: string }[]): ScholarShelf[] {
  const counts = new Map<string, number>();
  for (const work of works) counts.set(work.author, (counts.get(work.author) || 0) + 1);
  return fatherSections(authors).map((section) => {
    const fathers = [...section.fathers].sort(byName);
    return {
      id: section.id,
      title: section.title,
      fathers,
      workCount: fathers.reduce((sum, father) => sum + (counts.get(father.id) || 0), 0)
    };
  });
}

export function shelfPreview(shelf: ScholarShelf): string {
  const names = shelf.fathers.slice(0, 4).map((father) => father.name);
  const line = names.join(" · ");
  return shelf.fathers.length > 4 ? line + " · …" : line;
}

export function shelfCountLine(shelf: ScholarShelf): string {
  const people = shelf.fathers.length;
  const works = shelf.workCount;
  return (
    people +
    (people === 1 ? " father" : " fathers") +
    " · " +
    works +
    (works === 1 ? " work" : " works")
  );
}

export function scholarCenturyId(search: string): string | null {
  const value = new URLSearchParams(search).get("century");
  return value ? value : null;
}
