/** Titles, paths, and JSON-LD shared by the Fathers pages and the static build. */

import { metaDescription, sentences } from "./fatherPaths";

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

/**
 * Exact years written in the catalog date string. An approximate year ("c. 296", "330?") is left out,
 * so structured data never states a guess as a fact. Floruits such as "fl. c. 96" yield neither.
 */
export function lifeDatesFrom(dates: string): LifeDates {
  const s = dates.replace(/[\u2013\u2014]/g, "-");
  if (/\bfl\./.test(s)) return {};
  const out: LifeDates = {};
  const range = s.match(/(?:^|[^\d])(c\.\s*)?(\d{2,4})(\?)?\s*-\s*(c\.\s*)?(\d{2,4})(\?)?(?!\d)/);
  if (range) {
    if (!range[1] && !range[3]) out.birthDate = range[2];
    if (!range[4] && !range[6]) out.deathDate = range[5];
    return out;
  }
  const death = s.match(/\bd\.\s*(c\.\s*)?(\d{2,4})(\?)?(?!\d)/);
  if (death && !death[1] && !death[3]) out.deathDate = death[2];
  return out;
}

export { sentences };

/** Two or three sentences from the hand-written profile, then the remaining prose. */
export function answerFirstBio(paragraphs: string[]): { lede: string; rest: string[] } {
  const paras = paragraphs.map((p) => p.trim()).filter(Boolean);
  if (!paras.length) return { lede: "", rest: [] };
  const first = sentences(paras[0]);
  let ledeSentences = first.slice(0, 3);
  // Sentences of the first paragraph past the lede open the rest, so nothing written is dropped.
  const overflow = first.slice(3).join(" ");
  let consumed = 0;
  if (ledeSentences.length < 2 && paras[1]) {
    const extra = sentences(paras[1]);
    const take = extra.slice(0, 3 - ledeSentences.length);
    ledeSentences = ledeSentences.concat(take);
    consumed = take.length;
  }
  const rest = paras.slice(1).map((paragraph, index) => {
    if (index !== 0 || !consumed) return paragraph;
    return sentences(paragraph).slice(consumed).join(" ");
  });
  return { lede: ledeSentences.join(" "), rest: [overflow, ...rest].filter(Boolean) };
}

export function fatherProfileDescription(lede: string): string {
  const tails = [
    " Read the English translations of these writings, free and in full, chapter by chapter.",
    " Read the writings in English, free and in full.",
    " Free English texts."
  ];
  // Whole sentences first: a description never stops mid-sentence when a full one will do.
  const clean = metaDescription(lede, Number.MAX_SAFE_INTEGER);
  let whole = "";
  for (const s of sentences(clean)) {
    const next = whole ? whole + " " + s : s;
    if (next.length > 155) break;
    whole = next;
  }
  if (whole.length >= 120) return whole;
  // Short bios would fall under the 100-character floor; add a plain line about the texts.
  if (whole) {
    for (const tail of tails) {
      if (whole.length + tail.length <= 155) return whole + tail;
    }
    if (whole.length >= 100) return whole;
  }
  // No sentence fits: cut at a word, marked with an ellipsis.
  return metaDescription(lede);
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
  /** From the profile: only a person gets Person, birth and death dates, and a job title. */
  kind?: "person" | "document" | "collection";
};

export function fatherProfileJsonLd(input: FatherJsonLdInput): unknown {
  const url = input.origin + input.path;
  const kind = input.kind ?? "person";
  const person: Record<string, unknown> = {
    "@type": kind === "person" ? "Person" : kind === "document" ? "CreativeWork" : "Collection",
    name: input.name,
    url,
    description: input.description
  };
  if (kind === "person") {
    const life = lifeDatesFrom(input.dates);
    if (life.birthDate) person.birthDate = life.birthDate;
    if (life.deathDate) person.deathDate = life.deathDate;
    if (input.office) person.jobTitle = input.office;
    if (input.region && input.region !== "Various" && input.region !== "Unknown") {
      person.homeLocation = { "@type": "Place", name: input.region };
    }
  }
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
