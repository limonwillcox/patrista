import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleApiRequest } from "../server/api";
import {
  clearLinksCache,
  fetchExcerpt,
  fetchSectionLinks,
  fetchVerseLinks,
  linksCache,
  sectionCacheKey,
  verseCacheKey
} from "../src/api/links";
import * as lks from "../src/api/lks";

describe("Links API — verse lookup", () => {
  it("GET /api/links/verse?book=mt&chapter=16&verse=18 returns multiple centuries", () => {
    const res = handleApiRequest("/api/links/verse?book=mt&chapter=16&verse=18");
    expect(res.status).toBe(200);

    const json = res.json as {
      ref: { bookId: string; chapter: number; verseStart: number; locStart: number };
      tree: { century: number; fathers: { fatherId: string }[] }[];
      counts: { links: number; centuries: number; fathers: number; works: number };
    };

    expect(json.ref.bookId).toBe("mt");
    expect(json.ref.chapter).toBe(16);
    expect(json.ref.verseStart).toBe(18);

    // Prompt requirement: "Vitest: fixture verse returns multiple centuries."
    expect(json.tree.length).toBeGreaterThanOrEqual(3);
    const centuries = json.tree.map((node) => node.century);
    expect(centuries).toEqual([3, 4, 5, 6]);

    expect(json.counts.links).toBeGreaterThanOrEqual(8);
    expect(json.counts.centuries).toBe(json.tree.length);
    expect(json.counts.fathers).toBeGreaterThanOrEqual(3);
    expect(json.counts.works).toBeGreaterThan(0);

    const fatherIds = json.tree.flatMap((c) => c.fathers.map((f) => f.fatherId));
    expect(fatherIds).toContain("origen");
    expect(fatherIds).toContain("cyprian");
    expect(fatherIds).toContain("augustine");
  });

  it("returns 400 for unknown book", () => {
    const res = handleApiRequest("/api/links/verse?book=invalid_book&chapter=1&verse=1");
    expect(res.status).toBe(400);
    expect((res.json as { error: string }).error).toMatch(/unknown book/i);

    const noBook = handleApiRequest("/api/links/verse?chapter=1&verse=1");
    expect(noBook.status).toBe(400);
  });

  it("returns 400 for invalid or missing chapter/verse", () => {
    const res1 = handleApiRequest("/api/links/verse?book=mt");
    expect(res1.status).toBe(400);

    const res2 = handleApiRequest("/api/links/verse?book=mt&chapter=abc&verse=1");
    expect(res2.status).toBe(400);

    const res3 = handleApiRequest("/api/links/verse?book=mt&chapter=1&verse=0");
    expect(res3.status).toBe(400);
  });

  it("returns 200 and empty tree for missing verse (unlinked or out-of-range)", () => {
    const res = handleApiRequest("/api/links/verse?book=mt&chapter=16&verse=999");
    expect(res.status).toBe(200);

    const json = res.json as {
      ref: { bookId: string; chapter: number; verseStart: number };
      tree: unknown[];
      counts: { links: number; centuries: number; fathers: number; works: number };
    };

    expect(json.ref.bookId).toBe("mt");
    expect(json.ref.chapter).toBe(16);
    expect(json.ref.verseStart).toBe(999);
    expect(json.tree).toEqual([]);
    expect(json.counts.links).toBe(0);
    expect(json.counts.centuries).toBe(0);
    expect(json.counts.fathers).toBe(0);
  });
});

describe("Links API — section lookup", () => {
  it("GET /api/links/section?sectionId=mt.16.peters-confession returns section tree and counts", () => {
    const res = handleApiRequest("/api/links/section?sectionId=mt.16.peters-confession");
    expect(res.status).toBe(200);

    const json = res.json as {
      sectionId: string;
      tree: { canon: string; books: { bookId: string; refs: unknown[] }[] }[];
      counts: { links: number; books: number; refs: number };
    };

    expect(json.sectionId).toBe("mt.16.peters-confession");
    expect(json.tree.length).toBeGreaterThan(0);
    const canons = json.tree.map((t) => t.canon);
    expect(canons).toContain("nt");
    expect(json.counts.links).toBeGreaterThanOrEqual(10);
    expect(json.counts.books).toBeGreaterThan(0);
    expect(json.counts.refs).toBeGreaterThan(0);
  });

  it("returns 200 and empty tree for section with no links", () => {
    const res = handleApiRequest("/api/links/section?sectionId=confessions:8:p12");
    expect(res.status).toBe(200);

    const json = res.json as {
      sectionId: string;
      tree: unknown[];
      counts: { links: number };
    };

    expect(json.sectionId).toBe("confessions:8:p12");
    expect(json.tree).toEqual([]);
    expect(json.counts.links).toBe(0);
  });

  it("returns 400 when sectionId parameter is missing", () => {
    const res = handleApiRequest("/api/links/section");
    expect(res.status).toBe(400);
  });
});

describe("Links API — excerpt lookup", () => {
  it("GET /api/links/excerpt/:id returns one Link", () => {
    const res = handleApiRequest("/api/links/excerpt/origen-comm-matt-12-10");
    expect(res.status).toBe(200);

    const link = res.json as {
      id: string;
      fatherId: string;
      workTitle: string;
      excerpt: string;
      refs: unknown[];
    };

    expect(link.id).toBe("origen-comm-matt-12-10");
    expect(link.fatherId).toBe("origen");
    expect(link.excerpt).toMatch(/Peter/i);
    expect(link.refs.length).toBeGreaterThan(0);
  });

  it("returns 404 for non-existent excerpt id", () => {
    const res = handleApiRequest("/api/links/excerpt/non-existent-link-id");
    expect(res.status).toBe(404);
  });
});

describe("Existing routes remain intact", () => {
  it("GET /api/catalog is unchanged", () => {
    const res = handleApiRequest("/api/catalog");
    expect(res.status).toBe(200);
    expect((res.json as { works: unknown[] }).works.length).toBeGreaterThan(0);
  }, 60_000);

  it("GET /api/works/:id is unchanged", () => {
    const res = handleApiRequest("/api/works/confessions");
    expect(res.status).toBe(200);
    expect((res.json as { work: { id: string } }).work.id).toBe("confessions");
  });

  it("GET /api/search is unchanged", () => {
    const res = handleApiRequest("/api/search?q=God");
    expect(res.status).toBe(200);
  });

  it("GET /api/bible/:book/:chapter exists and leaves unknown book as 404", () => {
    const resJo = handleApiRequest("/api/bible/jo/1");
    expect(resJo.status).toBe(200);

    const resUnknown = handleApiRequest("/api/bible/not-a-real-book/1");
    expect(resUnknown.status).toBe(404);
  });
});

describe("Client src/api/links.ts", () => {
  beforeEach(() => {
    clearLinksCache();
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      const apiRes = handleApiRequest(url);
      return {
        ok: apiRes.status >= 200 && apiRes.status < 300,
        status: apiRes.status,
        json: async () => apiRes.json
      } as Response;
    });
  });

  it("caches verse lookups under verse:mt.16.18 key", async () => {
    const key = verseCacheKey("mt", 16, 18);
    expect(key).toBe("verse:mt.16.18");

    const p1 = fetchVerseLinks("mt", 16, 18);
    expect(linksCache.has("verse:mt.16.18")).toBe(true);

    const data = await p1;
    expect(data.ref.bookId).toBe("mt");
    expect(data.tree.length).toBeGreaterThanOrEqual(3);

    // Second call returns identical cached promise
    const p2 = fetchVerseLinks("mt", 16, 18);
    expect(p2).toBe(p1);
  });

  it("caches section lookups under section:... key", async () => {
    const key = sectionCacheKey("mt.16.peters-confession");
    expect(key).toBe("section:mt.16.peters-confession");

    const p1 = fetchSectionLinks("mt.16.peters-confession");
    expect(linksCache.has("section:mt.16.peters-confession")).toBe(true);

    const data = await p1;
    expect(data.sectionId).toBe("mt.16.peters-confession");
    expect(data.tree.length).toBeGreaterThan(0);

    const p2 = fetchSectionLinks("mt.16.peters-confession");
    expect(p2).toBe(p1);
  });

  it("fetches single link excerpt", async () => {
    const link = await fetchExcerpt("origen-comm-matt-12-10");
    expect(link.id).toBe("origen-comm-matt-12-10");
    expect(link.fatherId).toBe("origen");
    expect(linksCache.has("excerpt:origen-comm-matt-12-10")).toBe(true);
  });

  it("src/api/lks.ts re-exports everything from src/api/links.ts", () => {
    expect(lks.fetchVerseLinks).toBe(fetchVerseLinks);
    expect(lks.fetchSectionLinks).toBe(fetchSectionLinks);
    expect(lks.fetchExcerpt).toBe(fetchExcerpt);
    expect(lks.linksCache).toBe(linksCache);
  });
});
