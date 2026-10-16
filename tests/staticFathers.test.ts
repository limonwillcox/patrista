import { matchPath } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { Author, Catalog, Passage, Work } from "../server/types";
import { CHURCH_FATHERS_CANONICAL_PATH, churchFathersJsonLd, renderChurchFathersHtml } from "../server/shelf";
import {
  applyReadCanonical,
  breadcrumbJsonLd,
  describeSplit,
  prerenderShell,
  readCanonMap,
  renderChapterBody,
  renderHomeStaticHtml,
  renderReadShell,
  renderSitemaps,
  renderWorkPage,
  robotsTxt,
  SITEMAP_URL_LIMIT
} from "../server/staticFathers";
import {
  assignChapterSlugs,
  chapterNumberForSlug,
  chapterPageTitle,
  chapterPublicPath,
  metaDescription,
  parseFatherChapterPath,
  slugifyHeading,
  workPublicPath
} from "../src/lib/fatherPaths";

const author: Author = {
  id: "chrysostom",
  name: "John Chrysostom",
  dates: "c. 347–407",
  era: "post-nicene",
  region: "Antioch",
  deathYear: 407,
  bio: ""
};

function work(chapters: number, wordCount = 100): Work {
  return {
    id: "homilies-on-matthew",
    author: author.id,
    title: "Homilies on Matthew",
    short: "Matt.",
    chapters,
    series: "Schaff",
    wordCount
  };
}

function passage(n: number, heading: string, paras: string[]): Passage {
  return { work: "homilies-on-matthew", chapter: n, heading, versions: { schaff: paras }, footnotes: [] };
}

const SHELL = `<!DOCTYPE html>
<html lang="en">
<head>
<title>Old</title>
<meta name="description" content="Old description" />
</head>
<body>
<div id="root"></div>
</body>
</html>
`;

describe("chapter slugs", () => {
  it("turns homily and book labels into stable slugs", () => {
    expect(slugifyHeading("Homily XC")).toBe("homily-xc");
    expect(slugifyHeading("Book I")).toBe("book-i");
    expect(slugifyHeading("Book IV · Chapter 3 — The city of God")).toBe("book-iv-chapter-3-the-city-of-god");
  });

  it("keeps duplicate headings distinct", () => {
    const slugs = assignChapterSlugs([
      { chapter: 1, heading: "Chapter I" },
      { chapter: 2, heading: "Chapter I" }
    ]);
    expect(slugs.get(1)).toBe("chapter-i");
    expect(slugs.get(2)).toBe("chapter-i-2");
    expect(chapterNumberForSlug([{ chapter: 1, heading: "Chapter I" }, { chapter: 2, heading: "Chapter I" }], "chapter-i-2")).toBe(2);
  });

  it("parses a chapter path with or without the trailing slash", () => {
    const path = chapterPublicPath("chrysostom", "homilies-on-matthew", "homily-xc");
    expect(path).toBe("/fathers/chrysostom/homilies-on-matthew/homily-xc/");
    expect(parseFatherChapterPath(path)).toEqual({
      authorId: "chrysostom",
      workId: "homilies-on-matthew",
      chapterSlug: "homily-xc"
    });
    expect(parseFatherChapterPath(path.replace(/\/$/, ""))?.chapterSlug).toBe("homily-xc");
    expect(parseFatherChapterPath(workPublicPath("chrysostom", "homilies-on-matthew"))).toBeNull();
  });

  it("matches the reader route", () => {
    const pattern = "/fathers/:authorId/:workId/:chapterSlug";
    expect(matchPath(pattern, "/fathers/augustine/confessions/book-ii/")?.params.chapterSlug).toBe("book-ii");
    expect(matchPath(pattern, "/fathers/augustine/confessions/book-ii")?.params.chapterSlug).toBe("book-ii");
    expect(matchPath(pattern, "/fathers/augustine/confessions.html")).toBeNull();
  });
});

describe("descriptions and titles", () => {
  it("cleans markers and cuts on a word boundary", () => {
    const text = "Treatise III. [12] " + "word ".repeat(80);
    const description = metaDescription(text);
    expect(description.length).toBeLessThanOrEqual(155);
    expect(description.startsWith("Treatise III.")).toBe(true);
    expect(description).not.toContain("[12]");
    expect(description.endsWith(" ")).toBe(false);
  });

  it("uses the chapter title form", () => {
    expect(chapterPageTitle("John Chrysostom", "Homilies on Matthew", "Homily XC")).toBe(
      "John Chrysostom, Homilies on Matthew, Homily XC | Patrista"
    );
  });
});

describe("static chapter and work pages", () => {
  const origin = "https://patrista.com";

  it("puts the full chapter in the shell with one h1, canonical, pager, and JSON-LD", () => {
    const chapters = [
      passage(1, "Homily I", ["Opening of the first homily."]),
      passage(2, "Homily II", ["Second homily sentence one.", "Second homily sentence two."])
    ];
    const page = renderWorkPage({ origin, author, work: work(2), chapters });
    const refs = ["homily-i", "homily-ii"].map((slug, i) => ({
      chapter: i + 1,
      heading: chapters[i].heading,
      slug,
      path: chapterPublicPath(author.id, "homilies-on-matthew", slug)
    }));
    const body = renderChapterBody({
      authorName: author.name,
      workTitle: "Homilies on Matthew",
      workPath: page.path,
      chapter: chapters[1],
      prev: refs[0],
      next: null
    });
    const ld = breadcrumbJsonLd({
      origin,
      author,
      workTitle: "Homilies on Matthew",
      workPath: page.path,
      chapterLabel: "Homily II",
      chapterPath: refs[1].path
    });
    const html = prerenderShell(SHELL, origin, {
      canonicalPath: refs[1].path,
      title: chapterPageTitle(author.name, "Homilies on Matthew", "Homily II"),
      description: metaDescription("Second homily sentence one. Second homily sentence two."),
      bodyHtml: body,
      jsonLd: ld,
      extraHead: '<link rel="prev" href="' + origin + refs[0].path + '" />'
    });

    expect(html).toContain("<title>John Chrysostom, Homilies on Matthew, Homily II | Patrista</title>");
    expect(html).toContain('rel="canonical" href="https://patrista.com/fathers/chrysostom/homilies-on-matthew/homily-ii/"');
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toContain("<h1>Homily II</h1>");
    expect(html).toContain("Second homily sentence one.");
    expect(html).toContain("Second homily sentence two.");
    expect(html).not.toContain("Opening of the first homily.");
    expect(html).toContain('rel="prev"');
    expect(html).toContain(">Up</a>");
    expect(html).not.toContain('rel="next"');
    expect(html).toContain('"@type":"Chapter"');
    expect(html).toContain('"@type":"Book"');
    expect(html).toContain('"@type":"Person"');
    expect(html).toContain('"@type":"BreadcrumbList"');
    expect(html).toContain('"isPartOf"');
    expect(page.html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(page.html).toContain('href="/fathers/chrysostom/homilies-on-matthew/homily-ii/"');
    expect(page.html).toContain('"@type":"Book"');
    expect(page.html).not.toContain("Second homily sentence one.");
    expect(page.chapterPaths).toHaveLength(2);
    expect(page.html).toContain(">Start reading</a>");
    expect(page.html).toContain('href="/fathers/chrysostom/homilies-on-matthew/homily-i/"');
    expect(page.html).toMatch(/<details class="chapter-index">/);
    expect(page.html).not.toMatch(/<details[^>]*\sopen\b/);
    expect(page.html).toContain("<summary>Chapters (2)</summary>");
    expect(page.html).toContain('title="Homily I"');
    expect(page.html).toContain('title="Homily II"');
    expect(page.html).not.toContain('<nav class="static-toc"');
  });

  it("keeps a single passage on the work page", () => {
    const only = passage(1, "On the Lapsed", ["Treatise III. The lapsed are called back."]);
    const page = renderWorkPage({
      origin,
      author: { ...author, id: "cyprian", name: "Cyprian" },
      work: { ...work(1, 9000), id: "on-the-lapsed", author: "cyprian", title: "On the Lapsed" },
      chapters: [only]
    });
    expect(page.path).toBe("/fathers/cyprian/on-the-lapsed.html");
    expect(page.chapterPaths).toHaveLength(0);
    expect(page.html).toContain("Treatise III. The lapsed are called back.");
    expect(page.html).not.toContain("Start reading");
    expect(page.html).not.toMatch(/<details class="chapter-index">/);
    expect(page.html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(page.html).toContain('rel="canonical" href="https://patrista.com/fathers/cyprian/on-the-lapsed.html"');
  });

  it("flags artificial parts, large unsplit works, and skipped unit numbers", () => {
    const parts = [1, 2].map((n) => passage(n, "Expositions on the Psalms · Part " + n, ["x"]));
    expect(describeSplit({ ...work(2), id: "expositions-on-the-psalms", title: "Expositions on the Psalms" }, parts)[0].reason).toMatch(/artificial parts/);

    const blob = [passage(1, "On the Lapsed", ["x"])];
    expect(describeSplit({ ...work(1, 9596), id: "on-the-lapsed", title: "On the Lapsed" }, blob)[0].reason).toMatch(/One passage/);

    const skipped = [passage(1, "Homily I", ["a"]), passage(2, "Homily II", ["b"]), passage(3, "Homily IV", ["c"])];
    expect(describeSplit(work(3), skipped).some((note) => /skip 3/.test(note.reason))).toBe(true);
  });
});

describe("home, read shell, and sitemap", () => {
  const catalog = {
    versions: [],
    eras: [],
    votd: { work: "confessions", chapter: 1, quote: "", latin: "" },
    authors: [
      { ...author, id: "augustine", name: "Augustine of Hippo", deathYear: 430 },
      { ...author, id: "cyprian", name: "Cyprian", deathYear: 258 }
    ],
    works: [
      { ...work(13, 5000), id: "confessions", author: "augustine", title: "The Confessions" },
      { ...work(1, 100), id: "on-the-lapsed", author: "cyprian", title: "On the Lapsed" }
    ]
  } as Catalog;

  it("fills the home shell when its title and description already match", () => {
    const shell = `<!DOCTYPE html><html><head><title>Patrista — a searchable library of the Church Fathers</title><meta name="description" content="Look up a father, a work, or a keyword. Public-domain translations of the Church Fathers in a clean reading layout." /></head><body><div id="root"></div></body></html>`;
    const html = prerenderShell(shell, "https://patrista.com", {
      canonicalPath: "/",
      title: "Patrista — a searchable library of the Church Fathers",
      description:
        "Look up a father, a work, or a keyword. Public-domain translations of the Church Fathers in a clean reading layout.",
      bodyHtml: renderHomeStaticHtml(catalog)
    });
    expect(html).toContain('rel="canonical" href="https://patrista.com/"');
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toContain("<h1>Patrista</h1>");
    expect(html).toContain('href="/church-fathers/"');
  });

  it("gives the home page one h1 and links to the fathers index", () => {
    const html = renderHomeStaticHtml(catalog);
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toContain("<h1>Patrista</h1>");
    expect(html).toContain('href="/fathers/"');
    expect(html).toContain('href="/church-fathers/"');
    expect(html).toContain('href="/church-fathers/#author-augustine"');
    expect(html.indexOf("Augustine of Hippo")).toBeLessThan(html.indexOf("Cyprian"));
  });

  it("points the church fathers canonical at the trailing slash and keeps one h1", () => {
    const html = renderChurchFathersHtml(catalog);
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toContain('id="author-augustine"');
    const ld = churchFathersJsonLd("https://patrista.com", catalog) as { url: string };
    expect(ld.url).toBe("https://patrista.com" + CHURCH_FATHERS_CANONICAL_PATH);
    expect(CHURCH_FATHERS_CANONICAL_PATH).toBe("/church-fathers/");
  });

  it("serves /read as noindex and rewrites the canonical for a work", () => {
    const shell = renderReadShell(SHELL, { "on-the-lapsed": "https://patrista.com/fathers/cyprian/on-the-lapsed.html" }, "https://patrista.com/church-fathers/");
    expect(shell).toContain('<meta name="robots" content="noindex" />');
    expect(shell).toContain('href="https://patrista.com/church-fathers/"');
    const html = applyReadCanonical(shell, "on-the-lapsed", readCanonMap(shell));
    expect(html).toContain('href="https://patrista.com/fathers/cyprian/on-the-lapsed.html"');
    expect(html).toContain('content="noindex"');
  });

  it("splits the sitemap only past 50,000 urls and keeps robots on sitemap.xml", () => {
    const small = renderSitemaps(["https://patrista.com/"], "https://patrista.com");
    expect(small).toHaveLength(1);
    expect(small[0].name).toBe("sitemap.xml");
    expect(small[0].body).toContain("<urlset");
    const urls = Array.from({ length: SITEMAP_URL_LIMIT + 1 }, (_, i) => "https://patrista.com/p/" + i);
    const split = renderSitemaps(urls, "https://patrista.com");
    expect(split.map((file) => file.name)).toEqual(["sitemap.xml", "sitemap-1.xml", "sitemap-2.xml"]);
    expect(split[0].body).toContain("<sitemapindex");
    expect(split[0].body).toContain("https://patrista.com/sitemap-1.xml");
    expect(split[1].body.match(/<loc>/g)).toHaveLength(SITEMAP_URL_LIMIT);
    expect(split[2].body.match(/<loc>/g)).toHaveLength(1);
    expect(robotsTxt("https://patrista.com")).toContain("Sitemap: https://patrista.com/sitemap.xml");
  });
});
