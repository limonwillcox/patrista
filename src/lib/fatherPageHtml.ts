/** Crawlable Fathers index and profile markup. The React page mirrors this. */

import type { Author } from "../../server/types";
import { escapeHtml } from "./fatherPaths";
import { readPath } from "./workSlugs";
import { fatherEntry, fatherSections, type FatherSection } from "./fathersDirectory";
import { HERO_SIZES, TILE_SIZES, type FatherImage, type FatherImageCredit, type FatherImageMap } from "./fatherImages";
import { answerFirstBio, fatherProfilePath } from "./fatherPageMeta";

const DOVE =
  '<div class="fathers-portrait fathers-portrait-fallback" aria-hidden="true">' +
  '<svg viewBox="0 0 64 48"><path d="M6 30c8-2 14-10 18-16 3-6 10-8 18-8 1 6-2 11-7 14 6 2 12 6 15 11-8 1-14-2-19-6-2 6-7 11-13 13l-4 8 1-8C10 36 6 33 6 30z"/>' +
  '<circle cx="40" cy="14" r="1.4" fill="currentColor" stroke="none"/></svg></div>';

const DOVE_HERO = DOVE.replace('class="fathers-portrait ', 'class="fathers-hero-photo ');

export function eagerFatherIds(sections: FatherSection[], count = 4): Set<string> {
  const ids: string[] = [];
  for (const section of sections) {
    for (const father of section.fathers) {
      ids.push(father.id);
      if (ids.length >= count) return new Set(ids);
    }
  }
  return new Set(ids);
}

export function portraitImgHtml(image: FatherImage, variant: "tile" | "hero", eager: boolean): string {
  const spec = variant === "tile" ? image.tile : image.hero;
  const className = variant === "tile" ? "fathers-portrait" : "fathers-hero-photo";
  const sizes = variant === "tile" ? TILE_SIZES : HERO_SIZES;
  const loading = eager ? ' loading="eager" fetchpriority="high"' : ' loading="lazy"';
  return (
    '<img class="' +
    className +
    '" alt="' +
    escapeHtml(image.alt) +
    '" src="' +
    escapeHtml(spec.src) +
    '" srcset="' +
    escapeHtml(spec.srcset) +
    '" sizes="' +
    sizes +
    '" width="' +
    spec.width +
    '" height="' +
    spec.height +
    '" decoding="async"' +
    loading +
    " />"
  );
}

export function creditHtml(credit: FatherImageCredit | null, className: string): string {
  if (!credit || !credit.attributionRequired) return "";
  const artist = escapeHtml(credit.artist || "Unknown artist");
  const license = credit.licenseUrl
    ? '<a href="' + escapeHtml(credit.licenseUrl) + '">' + escapeHtml(credit.license || "license") + "</a>"
    : escapeHtml(credit.license || "license");
  const via = credit.source
    ? '<a href="' + escapeHtml(credit.source) + '">Wikimedia Commons</a>'
    : "Wikimedia Commons";
  return '<p class="' + className + '">' + artist + ", " + license + ", via " + via + ".</p>";
}

function factsHtml(dates: string, office: string, region: string): string {
  const rows: [string, string][] = [];
  if (dates) rows.push(["Dates", dates]);
  if (office) rows.push(["Role", office]);
  if (region) rows.push(["See", region]);
  if (!rows.length) return "";
  return (
    '<dl class="fathers-facts">' +
    rows
      .map(
        ([label, value]) =>
          "<div><dt>" + escapeHtml(label) + "</dt><dd>" + escapeHtml(value) + "</dd></div>"
      )
      .join("") +
    "</dl>"
  );
}

export function renderFathersIndexBody(authors: Author[], images: FatherImageMap): string {
  const sections = fatherSections(authors);
  const eager = eagerFatherIds(sections);
  const blocks = sections.map((section) => {
    const cards = section.fathers
      .map((father) => {
        const image = images[father.id];
        const portrait = image
          ? portraitImgHtml(image, "tile", eager.has(father.id))
          : DOVE;
        const credit = creditHtml(image?.credit ?? null, "fathers-tile-credit");
        return (
          '<li class="fathers-card">' +
          '<a class="fathers-card-link" href="' +
          escapeHtml(fatherProfilePath(father.id)) +
          '">' +
          portrait +
          '<h3 class="fathers-name">' +
          escapeHtml(father.name) +
          "</h3>" +
          '<p class="fathers-office">' +
          escapeHtml(father.office) +
          "</p></a>" +
          credit +
          "</li>"
        );
      })
      .join("\n");
    return (
      '<section class="fathers-section" aria-labelledby="' +
      escapeHtml(section.id) +
      '"><div class="fathers-section-inner">' +
      '<h2 id="' +
      escapeHtml(section.id) +
      '" class="fathers-century">' +
      escapeHtml(section.title) +
      "</h2>" +
      '<ul class="fathers-grid">' +
      cards +
      "</ul></div></section>"
    );
  });
  return [
    '<div class="fathers-page">',
    '<h1 class="fathers-sr">Fathers</h1>',
    blocks.join("\n"),
    '<p class="fathers-credit">Portraits from <a href="https://commons.wikimedia.org/">Wikimedia Commons</a>.</p>',
    "</div>"
  ].join("\n");
}

export function renderFatherProfileBody(
  author: Author,
  works: { id: string; title: string }[],
  images: FatherImageMap
): string {
  const entry = fatherEntry(author);
  const bio = answerFirstBio(entry.paragraphs);
  const image = images[author.id];
  const portrait = image ? portraitImgHtml(image, "hero", true) : DOVE_HERO;
  const credit = creditHtml(image?.credit ?? null, "fathers-hero-credit");
  const writings = works
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title))
    .map(
      (work) =>
        '<li><a href="' +
        escapeHtml(readPath(work.id)) +
        '">' +
        escapeHtml(work.title) +
        "</a></li>"
    )
    .join("\n");
  const rest = bio.rest.map((paragraph) => "<p>" + escapeHtml(paragraph) + "</p>").join("\n");
  return [
    '<div class="fathers-page fathers-page--profile">',
    '<header class="fathers-hero"><div class="fathers-hero-inner">',
    '<div class="fathers-hero-photo-wrap">' + portrait + credit + "</div>",
    '<div class="fathers-hero-copy">',
    '<p class="fathers-back"><a href="/fathers/">Fathers</a></p>',
    "<h1>" + escapeHtml(entry.name) + "</h1>",
    '<p class="fathers-hero-office">' + escapeHtml(entry.office) + "</p>",
    bio.lede ? '<p class="fathers-lede">' + escapeHtml(bio.lede) + "</p>" : "",
    factsHtml(entry.dates, entry.office, entry.region),
    "</div></div></header>",
    '<article class="fathers-bio"><div class="fathers-bio-col">',
    rest,
    writings
      ? '<h2 class="fathers-writings-title">Writings</h2><ul class="fathers-writings">' + writings + "</ul>"
      : "",
    "</div></article>",
    "</div>"
  ]
    .filter(Boolean)
    .join("\n");
}
