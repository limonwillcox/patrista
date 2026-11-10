import { describe, expect, it } from "vitest";
import type { Author } from "../server/types";
import { scholarCenturyId, scholarShelves, shelfCountLine, shelfPreview } from "../src/lib/scholarShelves";

function author(partial: Pick<Author, "id" | "name" | "deathYear"> & Partial<Author>): Author {
  return { dates: "", era: "post-nicene", region: "Various", bio: "", ...partial };
}

describe("scholarShelves", () => {
  const authors = [
    author({ id: "augustine", name: "Augustine of Hippo", deathYear: 430 }),
    author({ id: "jerome", name: "Jerome", deathYear: 420 }),
    author({ id: "ignatius", name: "Ignatius of Antioch", deathYear: 110 }),
    author({ id: "polycarp", name: "Polycarp of Smyrna", deathYear: 155 }),
    author({ id: "clement_rome", name: "Clement of Rome", deathYear: 99 }),
    author({ id: "origen", name: "Origen", deathYear: 254 }),
    author({ id: "tatian", name: "Tatian", deathYear: 170 }),
    author({ id: "tertullian", name: "Tertullian", deathYear: 240 }),
    author({ id: "novatian", name: "Novatian", deathYear: 250 }),
    author({ id: "josephus", name: "Flavius Josephus", deathYear: 100 }),
    author({ id: "councils", name: "Ecumenical Councils", deathYear: 451 })
  ];
  const works = [
    { author: "jerome" },
    { author: "jerome" },
    { author: "augustine" },
    { author: "councils" }
  ];

  it("keeps century order, then Councils, then Other Authors", () => {
    expect(scholarShelves(authors, works).map((s) => s.title)).toEqual([
      "First Century",
      "Second Century",
      "Third Century",
      "Fifth Century",
      "Councils",
      "Other Authors"
    ]);
  });

  it("sorts a century by name, not by year of death", () => {
    const fifth = scholarShelves(authors, works).find((s) => s.id === "century-5");
    expect(fifth?.fathers.map((f) => f.name)).toEqual(["Augustine of Hippo", "Jerome"]);
    expect(fifth?.workCount).toBe(3);
  });

  it("sorts Other Authors by name and leaves Origen in his century", () => {
    const shelves = scholarShelves(authors, works);
    expect(shelves.find((s) => s.id === "century-3")?.fathers.map((f) => f.id)).toEqual(["origen"]);
    expect(shelves.find((s) => s.id === "other-authors")?.fathers.map((f) => f.name)).toEqual([
      "Flavius Josephus",
      "Novatian",
      "Tatian",
      "Tertullian"
    ]);
  });
});

describe("shelfPreview", () => {
  it("joins the first four names and marks a longer shelf", () => {
    const shelf = scholarShelves(
      ["Anna", "Benedict", "Cyril", "Dionysius", "Ephrem"].map((name, i) =>
        author({ id: name.toLowerCase(), name, deathYear: 300 })
      ),
      []
    )[0];
    expect(shelfPreview(shelf)).toBe("Anna · Benedict · Cyril · Dionysius · …");
  });

  it("does not add an ellipsis when the shelf has four or fewer names", () => {
    const shelf = scholarShelves(
      [author({ id: "jerome", name: "Jerome", deathYear: 420 }), author({ id: "augustine", name: "Augustine of Hippo", deathYear: 430 })],
      []
    )[0];
    expect(shelfPreview(shelf)).toBe("Augustine of Hippo · Jerome");
  });
});

describe("shelfCountLine", () => {
  it("uses fathers and works, with singulars", () => {
    const one = scholarShelves([author({ id: "jerome", name: "Jerome", deathYear: 420 })], [{ author: "jerome" }])[0];
    expect(shelfCountLine(one)).toBe("1 father · 1 work");
    const two = scholarShelves(
      [author({ id: "jerome", name: "Jerome", deathYear: 420 }), author({ id: "augustine", name: "Augustine of Hippo", deathYear: 430 })],
      [{ author: "jerome" }, { author: "augustine" }, { author: "augustine" }]
    )[0];
    expect(shelfCountLine(two)).toBe("2 fathers · 3 works");
  });
});

describe("scholarCenturyId", () => {
  it("reads the century query and ignores a blank one", () => {
    expect(scholarCenturyId("?century=century-1")).toBe("century-1");
    expect(scholarCenturyId("century=councils")).toBe("councils");
    expect(scholarCenturyId("")).toBeNull();
    expect(scholarCenturyId("?century=")).toBeNull();
    expect(scholarCenturyId("?q=augustine")).toBeNull();
  });
});
