/** Titles, paths, and JSON-LD shared by the Fathers pages and the static build. */

import { metaDescription } from "./fatherPaths";

export const FATHERS_INDEX_PATH = "/fathers/";
export const FATHERS_INDEX_TITLE = "Church Fathers: Lives and Writings";
export const FATHERS_INDEX_DESCRIPTION =
  "Lives, dates, and writings of the Church Fathers, arranged by century, with portraits and links to the English texts.";

export function fatherProfilePath(authorId: string): string {
  return "/fathers/" + encodeURIComponent(authorId) + "/";
}

export function fatherProfileTitle(name: string, dates: string): string {
  const when = dates.trim();
  const head = when ? name + " (" + when + ")" : name;
  return head + ": Life and Writings";
}

export type LifeDates = { birthDate?: string; deathDate?: string };

/** Years written in the catalog date string. Floruits such as "fl. c. 96" yield neither. */
export function lifeDatesFrom(dates: string): LifeDates {
  const s = dates.replace(/[\u2013\u2014]/g, "-");
  const range = s.match(/(?:^|[^\d])(?:c\.\s*)?(\d{2,4})\s*-\s*(?:c\.\s*)?(\d{2,4})(?!\d)/);
  if (range) return { birthDate: range[1], deathDate: range[2] };
  const death = s.match(/\bd\.\s*(?:c\.\s*)?(\d{2,4})(?!\d)/);
  if (death) return { deathDate: death[1] };
  return {};
}

function sentences(paragraph: string): string[] {
  return paragraph
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Two or three sentences from the hand-written profile, then the remaining prose. */
export function answerFirstBio(paragraphs: string[]): { lede: string; rest: string[] } {
  const paras = paragraphs.map((p) => p.trim()).filter(Boolean);
  if (!paras.length) return { lede: "", rest: [] };
  let ledeSentences = sentences(paras[0]);
  let consumed = 0;
  if (ledeSentences.length < 2 && paras[1]) {
    const extra = sentences(paras[1]);
    const take = extra.slice(0, 3 - ledeSentences.length);
    ledeSentences = ledeSentences.concat(take);
    consumed = take.length;
  }
  ledeSentences = ledeSentences.slice(0, 3);
  const rest = paras.slice(1).map((paragraph, index) => {
    if (index !== 0 || !consumed) return paragraph;
    return sentences(paragraph).slice(consumed).join(" ");
  });
  return { lede: ledeSentences.join(" "), rest: rest.filter(Boolean) };
}

export function fatherProfileDescription(lede: string): string {
  const base = metaDescription(lede);
  if (base.length >= 120) return base;
  // Short bios would fall under the 100-character floor; add a plain line about the texts.
  for (const tail of [
    " Read the English translations of these writings, free and in full, chapter by chapter.",
    " Read the writings in English, free and in full.",
    " Free English texts."
  ]) {
    if (base.length + tail.length <= 155) return base + tail;
  }
  return base;
}

export type FatherJsonLdInput = {
  origin: string;
  name: string;
  path: string;
  description: string;
  dates: string;
  office: string;
  region: string;
  sameAs?: string[];
};

export function fatherProfileJsonLd(input: FatherJsonLdInput): unknown {
  const url = input.origin + input.path;
  const life = lifeDatesFrom(input.dates);
  const person: Record<string, unknown> = {
    "@type": "Person",
    name: input.name,
    url,
    description: input.description
  };
  if (life.birthDate) person.birthDate = life.birthDate;
  if (life.deathDate) person.deathDate = life.deathDate;
  if (input.office) person.jobTitle = input.office;
  if (input.region) person.homeLocation = { "@type": "Place", name: input.region };
  if (input.sameAs && input.sameAs.length) person.sameAs = input.sameAs;
  return {
    "@context": "https://schema.org",
    "@graph": [
      person,
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Patrista", item: input.origin + "/" },
          { "@type": "ListItem", position: 2, name: "Fathers", item: input.origin + FATHERS_INDEX_PATH },
          { "@type": "ListItem", position: 3, name: input.name, item: url }
        ]
      }
    ]
  };
}

export function fathersIndexJsonLd(origin: string, people: { name: string; path: string }[]): unknown {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: FATHERS_INDEX_TITLE,
        description: FATHERS_INDEX_DESCRIPTION,
        url: origin + FATHERS_INDEX_PATH,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: people.length,
          itemListElement: people.map((person, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: person.name,
            url: origin + person.path
          }))
        }
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Patrista", item: origin + "/" },
          { "@type": "ListItem", position: 2, name: "Fathers", item: origin + FATHERS_INDEX_PATH }
        ]
      }
    ]
  };
}

export function fatherDirectoryRedirects(authorIds: string[]): string[] {
  const lines = [
    "/fathers  /fathers/index.html  200",
    "/fathers/  /fathers/index.html  200"
  ];
  for (const id of authorIds) {
    lines.push("/fathers/" + id + "  /fathers/" + id + "/index.html  200");
    lines.push("/fathers/" + id + "/  /fathers/" + id + "/index.html  200");
  }
  return lines;
}
