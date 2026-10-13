import { describe, expect, it } from "vitest";
import { previewCatalog } from "../src/lib/catalogPreview";
import type { Author, Catalog, Era, Work } from "../server/types";

function author(id: string, name: string, era: string): Author {
  return { id, name, dates: "", era, region: "", deathYear: 400, bio: "" };
}

function work(id: string, authorId: string, title: string, short: string): Work {
  return { id, author: authorId, title, short, chapters: 3, series: "NPNF", wordCount: 100 };
}

const eras: Era[] = [
  { id: "ante-nicene", label: "Ante-Nicene" },
  { id: "post-nicene", label: "Post-Nicene" }
];

const catalog: Catalog = {
  versions: [],
  votd: { work: "confessions", chapter: 1, quote: "", latin: "" },
  eras,
  authors: [
    author("justin", "Justin Martyr", "ante-nicene"),
    author("augustine", "Augustine of Hippo", "post-nicene"),
    author("chrysostom", "John Chrysostom", "post-nicene")
  ],
  works: [
    work("apology", "justin", "First Apology", "Apol."),
    work("jonah", "justin", "Commentary on Jonah", "Jonah"),
    work("confessions", "augustine", "The Confessions", "Conf."),
    work("city", "augustine", "The City of God", "Civ."),
    work("homilies_john", "chrysostom", "Homilies on John", "Jn.")
  ]
};

describe("previewCatalog", () => {
  it("returns every author and work in era order when the query is empty", () => {
    const preview = previewCatalog("", catalog);
    expect(preview.groups.map((g) => g.author.id)).toEqual(["justin", "augustine", "chrysostom"]);
    expect(preview.groups.map((g) => g.works.map((w) => w.id))).toEqual([
      ["apology", "jonah"],
      ["confessions", "city"],
      ["homilies_john"]
    ]);
    expect(preview.suggestion).toBeNull();
  });

  it("treats a father prefix as a name match and lists all of that father's works", () => {
    const preview = previewCatalog("aug", catalog);
    expect(preview.groups).toHaveLength(1);
    expect(preview.groups[0].author.id).toBe("augustine");
    expect(preview.groups[0].kind).toBe("name");
    expect(preview.groups[0].works.map((w) => w.id)).toEqual(["confessions", "city"]);
    expect(preview.suggestion).toBeNull();
  });

  it("treats a work title with no name match as a work match and lists only that work", () => {
    const preview = previewCatalog("conf", catalog);
    expect(preview.groups).toHaveLength(1);
    expect(preview.groups[0].author.id).toBe("augustine");
    expect(preview.groups[0].kind).toBe("work");
    expect(preview.groups[0].works.map((w) => w.id)).toEqual(["confessions"]);
  });

  it("matches a work short name", () => {
    const preview = previewCatalog("civ", catalog);
    expect(preview.groups[0].kind).toBe("work");
    expect(preview.groups[0].works.map((w) => w.id)).toEqual(["city"]);
  });

  it("marks a father as both when the query hits the name and one of their works", () => {
    const preview = previewCatalog("john", catalog);
    expect(preview.groups.some((g) => g.author.id === "chrysostom" && g.kind === "both")).toBe(true);
    const chrys = preview.groups.find((g) => g.author.id === "chrysostom")!;
    expect(chrys.works.map((w) => w.id)).toEqual(["homilies_john"]);
  });

  it("sorts name matches above work-only matches", () => {
    const preview = previewCatalog("jo", catalog);
    const kinds = preview.groups.map((g) => g.kind);
    const lastName = Math.max(-1, ...kinds.map((k, i) => (k === "name" || k === "both" ? i : -1)));
    const firstWork = kinds.findIndex((k) => k === "work");
    if (firstWork >= 0) expect(lastName).toBeLessThan(firstWork);
    expect(preview.groups[0].author.id).toBe("chrysostom");
    expect(preview.groups.find((g) => g.author.id === "justin")?.kind).toBe("work");
  });

  it("suggests the nearest father name when nothing matches", () => {
    const preview = previewCatalog("augusteen", catalog);
    expect(preview.groups).toHaveLength(0);
    expect(preview.suggestion).toEqual({
      type: "author",
      id: "augustine",
      label: "Augustine of Hippo"
    });
  });

  it("matches Confessions 1 as the Confessions work", () => {
    const preview = previewCatalog("Confessions 1", catalog);
    expect(preview.groups[0].kind).toBe("work");
    expect(preview.groups[0].works.map((w) => w.id)).toEqual(["confessions"]);
  });
});
