import { describe, expect, it } from "vitest";
import { handleApiRequest } from "../server/api";
import type { Link, VerseLinksResponse } from "../src/api/links";
import {
  type ChapterLinksPack,
  verseResponseFromPack
} from "../src/links/pack";

function packFromApiVerse(book: string, chapter: number, verse: number): ChapterLinksPack {
  const res = handleApiRequest(
    `/api/links/verse?book=${book}&chapter=${chapter}&verse=${verse}`
  );
  expect(res.status).toBe(200);
  const json = res.json as VerseLinksResponse;
  const links: Record<string, Link> = {};
  const ids: string[] = [];
  for (const c of json.tree) {
    for (const f of c.fathers) {
      for (const w of f.works) {
        for (const link of w.links) {
          links[link.id] = link;
          ids.push(link.id);
        }
      }
    }
  }
  return {
    bookId: json.ref.bookId,
    bookNum: json.ref.bookNum,
    canon: json.ref.canon,
    chapter: json.ref.chapter,
    links,
    verses: { [String(verse)]: ids }
  };
}

describe("verseResponseFromPack", () => {
  it("matches GET /api/links/verse for Matthew 16:18", () => {
    const api = handleApiRequest("/api/links/verse?book=mt&chapter=16&verse=18");
    expect(api.status).toBe(200);
    const expected = api.json as VerseLinksResponse;
    const pack = packFromApiVerse("mt", 16, 18);
    const got = verseResponseFromPack(pack, 18);
    expect(got.ref).toEqual(expected.ref);
    expect(got.counts).toEqual(expected.counts);
    expect(got.tree).toEqual(expected.tree);
  });

  it("matches GET /api/links/verse for John 1:1", () => {
    const api = handleApiRequest("/api/links/verse?book=jo&chapter=1&verse=1");
    expect(api.status).toBe(200);
    const expected = api.json as VerseLinksResponse;
    const pack = packFromApiVerse("jo", 1, 1);
    const got = verseResponseFromPack(pack, 1);
    expect(got.counts.links).toBe(expected.counts.links);
    expect(got.counts.links).toBeGreaterThan(10);
    expect(got.tree.some((c) => c.fathers.some((f) => /chrysostom/i.test(f.fatherId)))).toBe(
      true
    );
    expect(got.tree).toEqual(expected.tree);
  });
});
