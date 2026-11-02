import { describe, expect, it } from "vitest";
import { getCatalog, getWork } from "../server/api";
import { JOURNEYS } from "../src/data/journeys";
import { MANUSCRIPTS, manuscriptImage } from "../src/data/manuscripts";
import { englishParagraphs } from "../src/lib/fatherPaths";
import { FORM_NOTES, manuscriptForm } from "../src/lib/manuscriptForm";

/** "/fathers/<author>/<work>/chapter-<n>/" → the chapter's English text, or null. */
function chapterText(href: string): string | null {
  const m = href.match(/^\/fathers\/([^/]+)\/([^/]+)\/chapter-(\d+)\/$/);
  if (!m) return null;
  const work = getWork(m[2]);
  if (!work || work.author.id !== m[1]) return null;
  const chapter = [...work.chapters].sort((a, b) => a.chapter - b.chapter)[Number(m[3]) - 1];
  return chapter ? englishParagraphs(chapter.versions).join(" ").replace(/\s+/g, " ") : null;
}

describe("manuscript form", () => {
  it("shows letters as rolls and books as codices, papyrus before 300 and parchment after", () => {
    expect(manuscriptForm({ title: "Epistles of Ignatius" }, { deathYear: 110 })).toBe("roll");
    expect(manuscriptForm({ title: "Letters" }, { deathYear: 430 })).toBe("roll");
    expect(manuscriptForm({ title: "Against Heresies" }, { deathYear: 202 })).toBe("papyrus-codex");
    expect(manuscriptForm({ title: "The Confessions" }, { deathYear: 430 })).toBe("parchment-codex");
    for (const note of Object.values(FORM_NOTES)) expect(note.note.length).toBeGreaterThan(40);
  });
});

describe("journeys", () => {
  it("connects real stops and cites chapters that exist", () => {
    for (const journey of Object.values(JOURNEYS)) {
      const ids = new Set(journey.stops.map((s) => s.id));
      for (const leg of journey.legs) {
        expect(ids.has(leg.from), leg.from).toBe(true);
        expect(ids.has(leg.to), leg.to).toBe(true);
      }
      for (const stop of journey.stops) {
        expect(stop.sources.length, stop.id).toBeGreaterThan(0);
        for (const link of [...stop.sources, ...(stop.wrote ?? [])]) {
          expect(chapterText(link.href), stop.id + " " + link.href).not.toBeNull();
        }
      }
    }
  }, 120_000);

  it("quotes only words that are in the chapters it cites", () => {
    for (const journey of Object.values(JOURNEYS)) {
      for (const stop of journey.stops) {
        const sources = stop.sources.map((s) => chapterText(s.href) ?? "").join(" ");
        for (const [, quote] of stop.text.matchAll(/“([^”]+)”/g)) {
          expect(sources.includes(quote.replace(/\s+/g, " ")), stop.id + ": " + quote).toBe(true);
        }
      }
    }
  }, 120_000);
});

describe("manuscripts", () => {
  it("belong to works in the catalog and load over https", () => {
    const ids = new Set(getCatalog().works.map((w) => w.id));
    for (const [key, m] of Object.entries(MANUSCRIPTS)) {
      expect(m.workId).toBe(key);
      expect(ids.has(m.workId), m.workId).toBe(true);
      expect(manuscriptImage(m, 1600)).toMatch(/^https:\/\/.+\/(full|pct:[\d.,]+)\/1600,\/0\/default\.jpg$/);
      expect(m.viewer).toMatch(/^https:\/\//);
      expect(m.rights.label.length).toBeGreaterThan(5);
    }
  }, 120_000);

  it("never asks a server for more than the width it allows", () => {
    const barnabas = MANUSCRIPTS["epistle-of-barnabas"];
    expect(barnabas.maxWidth).toBe(1600);
    expect(manuscriptImage(barnabas, 2000)).toMatch(/\/full\/1600,\/0\/default\.jpg$/);
    expect(manuscriptImage(MANUSCRIPTS["confessions"], 2000)).toMatch(/\/full\/2000,\/0\/default\.jpg$/);
  });
});
