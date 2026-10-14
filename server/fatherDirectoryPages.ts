import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import type { Catalog } from "./types";
import { fatherEntry, fatherSections } from "../src/lib/fathersDirectory";
import type { FatherImageMap } from "../src/lib/fatherImages";
import { renderFatherProfileBody, renderFathersIndexBody } from "../src/lib/fatherPageHtml";
import {
  FATHERS_INDEX_DESCRIPTION,
  FATHERS_INDEX_PATH,
  FATHERS_INDEX_TITLE,
  answerFirstBio,
  fatherDirectoryRedirects,
  fatherProfileDescription,
  fatherProfileJsonLd,
  fatherProfilePath,
  fatherProfileTitle,
  fathersIndexJsonLd
} from "../src/lib/fatherPageMeta";
import sameAsData from "../src/data/fatherSameAs.json";
import { prerenderShell } from "./staticFathers";

const SAME_AS = sameAsData as Record<string, string[]>;

function jsonLdTag(data: unknown): string {
  return (
    '<script type="application/ld+json" id="father-jsonld">' +
    JSON.stringify(data).replace(/</g, "\\u003c") +
    "</script>"
  );
}

export function fatherSameAs(authorId: string): string[] {
  const list = SAME_AS[authorId];
  return Array.isArray(list) ? list.filter((url) => typeof url === "string" && url.startsWith("http")) : [];
}

export function writeFatherDirectoryPages(
  dist: string,
  indexHtml: string,
  catalog: Catalog,
  origin: string,
  images: FatherImageMap
): { urls: string[]; redirects: string[] } {
  const urls: string[] = [];
  const people = fatherSections(catalog.authors).flatMap((section) =>
    section.fathers.map((father) => ({ name: father.name, path: fatherProfilePath(father.id) }))
  );

  const indexPage = prerenderShell(indexHtml, origin, {
    canonicalPath: FATHERS_INDEX_PATH,
    title: FATHERS_INDEX_TITLE,
    description: FATHERS_INDEX_DESCRIPTION,
    bodyHtml: renderFathersIndexBody(catalog.authors, images),
    extraHead: "    " + jsonLdTag(fathersIndexJsonLd(origin, people))
  });
  const indexFile = join(dist, "fathers", "index.html");
  mkdirSync(dirname(indexFile), { recursive: true });
  writeFileSync(indexFile, indexPage);
  urls.push(origin + FATHERS_INDEX_PATH);

  for (const author of catalog.authors) {
    const entry = fatherEntry(author);
    const bio = answerFirstBio(entry.paragraphs);
    const path = fatherProfilePath(author.id);
    const works = catalog.works
      .filter((work) => work.author === author.id)
      .map((work) => ({ id: work.id, title: work.title }));
    const description = fatherProfileDescription(bio.lede || entry.name);
    const html = prerenderShell(indexHtml, origin, {
      canonicalPath: path,
      title: fatherProfileTitle(entry.name, entry.dates),
      description,
      bodyHtml: renderFatherProfileBody(author, works, images),
      extraHead:
        "    " +
        jsonLdTag(
          fatherProfileJsonLd({
            origin,
            name: entry.name,
            path,
            description,
            dates: entry.dates,
            office: entry.office,
            region: entry.region,
            sameAs: fatherSameAs(author.id)
          })
        )
    });
    const file = join(dist, "fathers", author.id, "index.html");
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, html);
    urls.push(origin + path);
  }

  return { urls, redirects: fatherDirectoryRedirects(catalog.authors.map((author) => author.id)) };
}
