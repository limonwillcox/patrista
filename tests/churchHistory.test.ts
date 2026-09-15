import { matchPath } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { getCatalog } from "../server/api";
import {
  ACT_ONE_SCENES,
  CHURCH_HISTORY_CANONICAL_PATH,
  CHURCH_HISTORY_DESCRIPTION,
  CHURCH_HISTORY_PATH,
  CHURCH_HISTORY_TITLE,
  ERAS,
  churchHistoryJsonLd,
  erasByPeriod,
  renderChurchHistoryCinematicHtml,
  renderChurchHistoryHtml,
  workLink,
  workRefId
} from "../server/churchHistory";

describe("church history era data", () => {
  it("has unique ids and runs 4 BC to 1054 in order", () => {
    const ids = ERAS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ERAS[0].year).toBe(-4);
    expect(ERAS[ERAS.length - 1].year).toBe(1054);
    for (let i = 1; i < ERAS.length; i++) {
      expect(ERAS[i].year).toBeGreaterThanOrEqual(ERAS[i - 1].year);
    }
  });

  it("splits at Nicaea — 325 is the last pre-Nicene era", () => {
    const pre = erasByPeriod("pre-nicene");
    const post = erasByPeriod("post-nicene");
    expect(pre.length + post.length).toBe(ERAS.length);
    expect(pre[pre.length - 1].id).toBe("nicaea");
    expect(pre[pre.length - 1].year).toBe(325);
    expect(post[0].year).toBeGreaterThan(325);
    expect(pre.every((e) => e.year <= 325)).toBe(true);
  });

  it("omits datetime for BC years, since HTML <time> requires a year above zero", () => {
    for (const era of ERAS) {
      if (era.year < 1) expect(era.datetime).toBeUndefined();
      else expect(era.datetime).toMatch(/^\d{4}(-\d{2}-\d{2})?$/);
    }
  });

  it("carries real prose for every era — this is the crawlable payload", () => {
    for (const era of ERAS) {
      expect(era.title.length).toBeGreaterThan(3);
      expect(era.body.length).toBeGreaterThan(80);
      expect(era.display.length).toBeGreaterThan(1);
    }
  });

  it("references only works that exist in the catalog", () => {
    const catalog = getCatalog();
    const workIds = new Set(catalog.works.map((w) => w.id));
    for (const era of ERAS) {
      for (const ref of era.works || []) {
        const id = workRefId(ref);
        expect(workIds.has(id), era.id + " references missing work " + id).toBe(true);
        const link = workLink(catalog, ref);
        expect(link, era.id + " could not link " + id).not.toBeNull();
        // Generic anchor text is wasted on readers and crawlers alike.
        expect(link!.name.length, era.id + " has thin anchor text for " + id).toBeGreaterThan(7);
      }
    }
  }, 120_000);

  it("does not link an author's arbitrary first work in place of the right one", () => {
    const byId = new Map(ERAS.map((e) => [e.id, e]));
    // Clement of Rome's first catalog work is the pseudo-Clementine Recognitions;
    // Augustine's is the Confessions, not the book written after the sack of Rome.
    expect(byId.get("apostolic-fathers")?.works).toContain("first-epistle-of-clement");
    expect(byId.get("apostolic-fathers")?.works).not.toContain("recognitions-of-clement");
    expect(byId.get("sack-of-rome")?.works).toEqual(["city-of-god"]);
    expect(byId.get("apologists")?.works).toContain("apology");
    expect(byId.get("milvian")?.works).toContain("of-the-manner-in-which-the-persecutors-died");
  });

  it("assigns Act I cinematic slots through Milan, not Milvian", () => {
    const byId = new Map(ERAS.map((e) => [e.id, e]));
    expect(byId.get("milvian")?.scene).toBeUndefined();
    expect(byId.get("milan")?.scene).toBe("milan");
    expect(ACT_ONE_SCENES).toContain("milan");
    expect(ACT_ONE_SCENES).not.toContain("milvian");
    expect(ACT_ONE_SCENES).toEqual([
      "pentecost",
      "acts-book",
      "nero",
      "jerusalem",
      "apostolic-fathers",
      "persecution",
      "great-persecution",
      "milan",
      "nicaea"
    ]);
  });
});

describe("church history routing", () => {
  it("matches the route with and without the trailing slash", () => {
    // The rail and footer link to the canonical trailing-slash form so that a
    // new-tab open lands on the prerendered file; the route is registered
    // without it. Both must resolve to the same page.
    expect(matchPath(CHURCH_HISTORY_PATH, CHURCH_HISTORY_PATH)).not.toBeNull();
    expect(matchPath(CHURCH_HISTORY_PATH, CHURCH_HISTORY_CANONICAL_PATH)).not.toBeNull();
  });
});

describe("church history prerender", () => {
  it("emits every era's date, title and prose as crawlable HTML", () => {
    const html = renderChurchHistoryHtml(getCatalog());
    for (const era of ERAS) {
      expect(html).toContain(">" + era.title + "<");
      expect(html).toContain('id="' + era.id + '"');
      if (era.datetime) expect(html).toContain('datetime="' + era.datetime + '"');
    }
    expect(html).toContain("<h1>");
    expect(html).toContain('<h2 id="pre-nicene">');
    expect(html).toContain('<h2 id="post-nicene">');
  }, 120_000);

  it("links Fathers into the reader", () => {
    const html = renderChurchHistoryHtml(getCatalog());
    expect(html).toContain('<a href="/read?work=');
  }, 120_000);

  it("survives a missing catalog without emitting broken links", () => {
    const html = renderChurchHistoryHtml(null);
    expect(html).toContain("Pentecost");
    expect(html).not.toContain("<a href");
  });

  it("escapes markup rather than injecting it", () => {
    const html = renderChurchHistoryHtml(null);
    expect(html).not.toMatch(/<script/i);
  });

  it("keeps the timeline free of the cinematic theatre", () => {
    const html = renderChurchHistoryHtml(null);
    expect(html).toContain('class="ch-page ch-page--timeline"');
    expect(html).not.toContain("ch-cinematic");
    expect(html).not.toContain("data-scene-placeholder");
  });
});

describe("church history cinematic prerender", () => {
  it("emits one theatre placeholder for Act I (CLS reserve)", () => {
    const html = renderChurchHistoryCinematicHtml();
    expect(html).toContain('class="ch-cinematic"');
    expect(html).toContain('class="ch-theatre"');
    expect(html).toContain('data-scene-placeholder="act-one"');
    expect(html.match(/data-scene-placeholder=/g)?.length).toBe(1);
  });
});

describe("church history JSON-LD", () => {
  it("describes the article, breadcrumbs and every era", () => {
    const ld = churchHistoryJsonLd("https://patrista.com") as {
      "@graph": { "@type": string; itemListElement?: unknown[]; numberOfItems?: number }[];
    };
    const types = ld["@graph"].map((n) => n["@type"]);
    expect(types).toContain("Article");
    expect(types).toContain("BreadcrumbList");
    expect(types).toContain("ItemList");
    const list = ld["@graph"].find((n) => n["@type"] === "ItemList");
    expect(list?.numberOfItems).toBe(ERAS.length);
    expect(list?.itemListElement).toHaveLength(ERAS.length);
    expect(JSON.stringify(ld)).toContain("https://patrista.com/church-history/timeline");
  });

  it("keeps the SEO title and description within sensible lengths", () => {
    expect(CHURCH_HISTORY_TITLE.length).toBeLessThanOrEqual(60);
    expect(CHURCH_HISTORY_DESCRIPTION.length).toBeLessThanOrEqual(160);
    expect(CHURCH_HISTORY_DESCRIPTION.length).toBeGreaterThanOrEqual(100);
  });
});
