import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getCatalog } from "../server/api";
import { bookJsonLd, renderChapterBody, renderWorkPage } from "../server/staticFathers";
import type { Author, Passage, Work } from "../server/types";
import {
  CONFESSIONS_OVERVIEW_FACTS,
  CONFESSIONS_OVERVIEW_TEXT,
  OVERVIEW_OPEN_KEY,
  firstSentence,
  setStoredOverviewOpen,
  storedOverviewOpen,
  workOverview,
  workOverviewHtml,
  workOverviewIds
} from "../src/lib/workOverviews";
import { DESCRIPTION_MAX, DESCRIPTION_MIN, descriptionFromOverview, workSeoDescription } from "../src/lib/seoMeta";
import { chapterPublicPath } from "../src/lib/fatherPaths";

const author: Author = {
  id: "augustine",
  name: "Augustine of Hippo",
  dates: "354–430",
  era: "post-nicene",
  region: "North Africa",
  deathYear: 430,
  bio: ""
};

function passage(n: number, heading: string, paras: string[]): Passage {
  return { work: "confessions", chapter: n, heading, versions: { pusey: paras }, footnotes: [] };
}

function sentenceCount(text: string): number {
  const normalized = text.replace(/([.!?])["”']+(?=\s|$)/g, "$1");
  return (normalized.match(/[^.!?]+[.!?]/g) || []).length;
}

describe("overview copy", () => {
  it("keeps the Confessions text and facts from the approved spec", () => {
    const o = workOverview("confessions");
    expect(o?.text).toBe(CONFESSIONS_OVERVIEW_TEXT);
    expect(o?.facts).toBe(CONFESSIONS_OVERVIEW_FACTS);
    expect(o?.text).toContain("Thou madest us for Thyself");
    expect(o?.facts).toContain("tr. E. B. Pusey (1838)");
  });

  it("has 2–4 sentences, no links, and facts without invented URLs", () => {
    const problems: string[] = [];
    for (const id of workOverviewIds()) {
      const o = workOverview(id)!;
      const n = sentenceCount(o.text);
      if (n < 2 || n > 4) problems.push(id + " has " + n + " sentences");
      if (/https?:|<a\b/i.test(o.text) || /https?:|<a\b/i.test(o.facts)) problems.push(id + " has a link");
      if (!o.facts.includes("·")) problems.push(id + " facts lack a middle-dot");
    }
    expect(problems).toEqual([]);
  });

  it("keys every overview to a real catalog work", () => {
    const ids = new Set(getCatalog().works.map((w) => w.id));
    const missing = workOverviewIds().filter((id) => !ids.has(id));
    expect(missing).toEqual([]);
  }, 120_000);

  it("fits every overview into the meta description length rules, uniquely", () => {
    const seen = new Map<string, string>();
    const problems: string[] = [];
    for (const id of workOverviewIds()) {
      const o = workOverview(id)!;
      const desc = descriptionFromOverview(o.text);
      if (!desc) problems.push(id + " produced no description");
      if (desc.length < DESCRIPTION_MIN) problems.push(id + " desc<" + DESCRIPTION_MIN + ": " + desc);
      if (desc.length > DESCRIPTION_MAX) problems.push(id + " desc>" + DESCRIPTION_MAX + ": " + desc);
      if (/…\./.test(desc)) problems.push(id + " period after a cut: " + desc);
      if (seen.has(desc)) problems.push("dup desc " + id + " = " + seen.get(desc));
      seen.set(desc, id);
      const viaWork = workSeoDescription({
        authorName: "Augustine of Hippo",
        workTitle: "Placeholder",
        workId: id,
        units: 2,
        noun: "chapters"
      });
      expect(viaWork).toBe(desc);
    }
    expect(problems).toEqual([]);
  }, 30_000);
});

describe("overview HTML", () => {
  it("emits a collapsed native details block with the text inside", () => {
    const html = workOverviewHtml("confessions");
    expect(html).toMatch(/<details class="work-overview">/);
    expect(html).not.toMatch(/\sopen\b/);
    expect(html).toContain("<summary>Overview</summary>");
    expect(html).toContain(CONFESSIONS_OVERVIEW_TEXT.replace(/&/g, "&amp;").replace(/"/g, "&quot;"));
    expect(html).toContain('class="work-overview-facts"');
    expect(html).toContain(CONFESSIONS_OVERVIEW_FACTS);
    expect(workOverviewHtml("no-such-work")).toBe("");
  });
});

describe("static work pages", () => {
  const origin = "https://patrista.com";
  const chapters = [
    passage(1, "Book I", ["Great art Thou, O Lord, and greatly to be praised."]),
    passage(2, "Book II", ["Second book."])
  ];
  const work: Work = {
    id: "confessions",
    author: "augustine",
    title: "The Confessions",
    short: "Conf.",
    chapters: 2,
    series: "Pusey",
    wordCount: 100
  };

  it("places Overview above Chapters, collapsed, with the copy in the HTML", () => {
    const page = renderWorkPage({ origin, author, work, chapters });
    expect(page.html).toContain("<summary>Overview</summary>");
    expect(page.html).toContain("restless, until it repose in Thee.");
    expect(page.html).toContain(CONFESSIONS_OVERVIEW_FACTS);
    expect(page.html.indexOf('<details class="work-overview">')).toBeGreaterThan(-1);
    expect(page.html.indexOf('<details class="work-overview">')).toBeLessThan(page.html.indexOf('<details class="chapter-index">'));
    expect(page.html).not.toMatch(/<details[^>]*\sopen\b/);
    expect(page.html).toContain("fg-overview-open");
    expect(page.html).toContain('"description":"Augustine tells the story of his life');
  });

  it("omits the row when the work has no overview", () => {
    const page = renderWorkPage({
      origin,
      author,
      work: { ...work, id: "soliloquies", title: "Soliloquies" },
      chapters: [passage(1, "Book I", ["I have sought myself."])]
    });
    expect(page.html).not.toContain('<details class="work-overview">');
    expect(page.html).not.toContain("<summary>Overview</summary>");
  });

  it("leaves chapter pages without an Overview", () => {
    const body = renderChapterBody({
      authorName: "Augustine of Hippo",
      workTitle: "The Confessions",
      workPath: "/fathers/augustine/confessions",
      chapter: chapters[1]!,
      prev: {
        chapter: 1,
        n: 1,
        label: "Chapter 1",
        heading: "Book I",
        slug: "chapter-1",
        path: chapterPublicPath("augustine", "confessions", "chapter-1")
      },
      next: null
    });
    expect(body).not.toContain("work-overview");
    expect(body).not.toContain("<summary>Overview</summary>");
  });

  it("puts the first sentence on the Book JSON-LD", () => {
    const ld = bookJsonLd({
      origin,
      authorName: author.name,
      authorId: author.id,
      workId: "confessions",
      workTitle: "The Confessions",
      workPath: "/fathers/augustine/confessions",
      parts: []
    }) as Record<string, unknown>;
    expect(ld.description).toBe(firstSentence(CONFESSIONS_OVERVIEW_TEXT));
  });
});

describe("overview localStorage", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    globalThis.localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, String(v));
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
      clear: () => store.clear(),
      length: 0,
      key: () => null
    } as unknown as Storage;
  });

  afterEach(() => {
    localStorage.removeItem(OVERVIEW_OPEN_KEY);
  });

  it("defaults collapsed and remembers the choice across works", () => {
    expect(storedOverviewOpen()).toBe(false);
    setStoredOverviewOpen(true);
    expect(localStorage.getItem(OVERVIEW_OPEN_KEY)).toBe("on");
    expect(storedOverviewOpen()).toBe(true);
    setStoredOverviewOpen(false);
    expect(storedOverviewOpen()).toBe(false);
  });
});
