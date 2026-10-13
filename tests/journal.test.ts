import { describe, expect, it } from "vitest";
import { journalPages, journalTree } from "../src/lib/journal";
import { showSiteRail } from "../src/lib/homeNav";

describe("journalTree", () => {
  it("nests works under fathers under centuries", () => {
    const tree = journalTree(
      [
        { id: "augustine", name: "Augustine of Hippo", deathYear: 430 },
        { id: "clement-rome", name: "Clement of Rome", deathYear: 99 }
      ],
      [
        { id: "confessions", author: "augustine", title: "The Confessions" },
        { id: "city-of-god", author: "augustine", title: "City of God" },
        { id: "first-epistle-of-clement", author: "clement-rome", title: "First Epistle of Clement" }
      ],
      (id) => id === "confessions"
    );
    expect(tree.map((c) => c.label)).toEqual(["1st", "5th"]);
    expect(tree[0].fathers[0].name).toBe("Clement of Rome");
    expect(tree[0].fathers[0].works.map((w) => w.id)).toEqual(["first-epistle-of-clement"]);
    expect(tree[1].fathers[0].works.map((w) => w.id)).toEqual(["confessions", "city-of-god"]);
    expect(tree[1].hasNote).toBe(true);
    expect(tree[1].fathers[0].works.find((w) => w.id === "confessions")?.hasNote).toBe(true);
    expect(tree[1].fathers[0].works.find((w) => w.id === "city-of-god")?.hasNote).toBe(false);
  });
});

describe("journalPages", () => {
  const tree = journalTree(
    [
      { id: "clement-rome", name: "Clement of Rome", deathYear: 99 },
      { id: "augustine", name: "Augustine of Hippo", deathYear: 430 }
    ],
    [
      { id: "first-epistle-of-clement", author: "clement-rome", title: "First Epistle of Clement" },
      { id: "confessions", author: "augustine", title: "The Confessions" },
      { id: "city-of-god", author: "augustine", title: "City of God" }
    ],
    () => false
  );

  it("opens as a contents list with century chapters, then authors, then works", () => {
    const pages = journalPages(tree);
    expect(pages[0].blocks[0]).toMatchObject({
      kind: "chapter",
      title: "First Century: 0-100 AD"
    });
    const kinds = pages.flatMap((p) => p.blocks.map((b) => b.kind + ":" + ("id" in b ? b.id : "title" in b ? b.title : "")));
    expect(kinds.join(" ")).toContain("chapter:First Century: 0-100 AD");
    expect(kinds.join(" ")).toContain("author:clement-rome");
    expect(kinds.join(" ")).toContain("work:first-epistle-of-clement");
    expect(kinds.join(" ")).toContain("chapter:Fifth Century: 400-500 AD");
    expect(kinds.join(" ")).toContain("author:augustine");
    expect(kinds.join(" ")).toContain("work:confessions");
  });

  it("continues works across a leaf without repeating the author name", () => {
    const many = journalTree(
      [{ id: "augustine", name: "Augustine of Hippo", deathYear: 430 }],
      Array.from({ length: 40 }, (_, i) => ({
        id: "w" + i,
        author: "augustine",
        title: "Work " + i
      })),
      () => false
    );
    const pages = journalPages(many);
    expect(pages.length).toBeGreaterThan(1);
    const works = pages.flatMap((p) => p.blocks.filter((b) => b.kind === "work"));
    expect(works.map((w) => w.kind === "work" && w.id)).toEqual(Array.from({ length: 40 }, (_, i) => "w" + i));
    expect(pages[0].blocks.some((b) => b.kind === "author" && b.id === "augustine")).toBe(true);
    expect(pages.slice(1).every((p) => p.blocks[0].kind === "work")).toBe(true);
  });

  it("never ends a leaf on an author with no work beneath", () => {
    const tree = journalTree(
      [
        { id: "ambrose", name: "Ambrose of Milan", deathYear: 397 },
        { id: "athanasius", name: "Athanasius of Alexandria", deathYear: 373 }
      ],
      [
        ...Array.from({ length: 18 }, (_, i) => ({
          id: "amb-" + i,
          author: "ambrose",
          title: "Ambrose " + i
        })),
        { id: "against-the-heathen", author: "athanasius", title: "Against the Heathen" },
        { id: "on-the-incarnation", author: "athanasius", title: "On the Incarnation" }
      ],
      () => false
    );
    const pages = journalPages(tree);
    for (const page of pages) {
      const last = page.blocks[page.blocks.length - 1];
      expect(last?.kind).not.toBe("author");
      expect(last?.kind).not.toBe("chapter");
    }
    const athanasiusPages = pages.filter((p) =>
      p.blocks.some((b) => b.kind === "author" && b.id === "athanasius")
    );
    expect(athanasiusPages.length).toBe(1);
    const i = athanasiusPages[0].blocks.findIndex((b) => b.kind === "author" && b.id === "athanasius");
    expect(athanasiusPages[0].blocks[i + 1]?.kind).toBe("work");
  });
});

describe("journal route rail", () => {
  it("keeps the site rail on /journal", () => {
    expect(showSiteRail("/journal")).toBe(true);
  });
});

