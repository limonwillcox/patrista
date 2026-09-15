#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { packLinksJson } from "./pack-sqlite.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");

const OT_COUNT = 39;

function locOf(chapter, verse) {
  return chapter * 1_000_000 + verse;
}

function centuryFromDeathYear(deathYear) {
  const c = Math.ceil(deathYear / 100);
  return Math.min(6, Math.max(1, c));
}

function loadManifest() {
  const raw = JSON.parse(readFileSync(resolve(root, "Bibles/KJV/manifest.json"), "utf8"));
  const byId = new Map();
  raw.forEach((b, i) => {
    const bookNum = i + 1;
    byId.set(b.id, {
      bookId: b.id,
      bookNum,
      canon: bookNum <= OT_COUNT ? "ot" : "nt",
      name: b.name
    });
  });
  return byId;
}

export function ingestFixture(fixturePath, jsonOut, sqliteOut) {
  const books = loadManifest();
  const parsed = JSON.parse(readFileSync(fixturePath, "utf8"));
  const links = (parsed.links || []).map((link) => {
    const century = centuryFromDeathYear(link.deathYear);
    const refs = (link.refs || []).map((ref) => {
      const book = books.get(ref.bookId);
      if (!book) throw new Error("Unknown bookId in fixture: " + ref.bookId);
      return {
        ...ref,
        bookNum: book.bookNum,
        canon: book.canon,
        locStart: locOf(ref.chapter, ref.verseStart),
        locEnd: locOf(ref.chapter, ref.verseEnd)
      };
    });
    return { ...link, century, refs };
  });

  mkdirSync(dirname(jsonOut), { recursive: true });
  const payload = {
    note: parsed.note || "Ingested from fixture.",
    links
  };
  writeFileSync(jsonOut, JSON.stringify(payload, null, 2) + "\n");
  packLinksJson(jsonOut, sqliteOut);
  return links.length;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const fixture = resolve(root, process.argv[2] || "data/links/fixtures/matthew-16-18.json");
  const jsonOut = resolve(root, "data/links/links.json");
  const sqliteOut = resolve(root, "data/links/links.sqlite");
  const n = ingestFixture(fixture, jsonOut, sqliteOut);
  console.log("ingested", n, "links →", jsonOut, "and", sqliteOut);
}
