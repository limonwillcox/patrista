import { describe, expect, it } from "vitest";
import {
  libraryHoverBarMetrics,
  libraryHoverReadout,
  workBarFontPx,
  writingCategory,
  writingTopic
} from "../src/lib/libraryHover";

const works = new Map([
  ["confessions", { title: "The Confessions", author: "augustine" }],
  ["homilies", { title: "Homilies on Matthew", author: "chrysostom" }],
  ["apology", { title: "The Apology", author: "tertullian" }]
]);

function authorInfo(id: string): { name: string; century: number } | undefined {
  if (id === "augustine") return { name: "Augustine", century: 5 };
  if (id === "chrysostom") return { name: "Chrysostom", century: 5 };
  if (id === "tertullian") return { name: "Tertullian", century: 3 };
  return undefined;
}

describe("library hover readout", () => {
  it("is empty when no book is hovered", () => {
    expect(libraryHoverReadout(null, works, authorInfo)).toBeNull();
  });

  it("fills author, work, century, category, and topic for the hovered book", () => {
    expect(libraryHoverReadout("homilies", works, authorInfo)).toEqual({
      author: "Chrysostom",
      work: "Homilies on Matthew",
      century: "5th",
      category: "Homily",
      topic: ""
    });
  });

  it("is empty when the hovered id is not in the catalog", () => {
    expect(libraryHoverReadout("missing", works, authorInfo)).toBeNull();
  });
});

describe("writingCategory", () => {
  it("names common patristic forms from the title", () => {
    expect(writingCategory("Homilies on Matthew")).toBe("Homily");
    expect(writingCategory("The First Epistle of Clement")).toBe("Epistle");
    expect(writingCategory("The Nicene Creed")).toBe("Creed");
    expect(writingCategory("The Apology")).toBe("Apology");
    expect(writingCategory("Catechetical Lectures")).toBe("Catechesis");
    expect(writingCategory("Church History")).toBe("History");
    expect(writingCategory("The Martyrdom of Polycarp")).toBe("Martyrdom");
    expect(writingCategory("Against Heresies")).toBe("Treatise");
    expect(writingCategory("The Confessions")).toBe("Treatise");
  });
});

describe("writingTopic", () => {
  it("pulls a topic word from the title when one is there", () => {
    expect(writingTopic("On the Incarnation")).toBe("Incarnation");
    expect(writingTopic("On the Holy Spirit")).toBe("Holy Spirit");
    expect(writingTopic("On the Trinity")).toBe("Trinity");
    expect(writingTopic("Homilies on Matthew")).toBe("");
  });
});

describe("library hover bar metrics", () => {
  const rows = [
    {
      author: "Leo",
      work: "The Homily",
      century: "5th",
      category: "Homily",
      topic: ""
    },
    {
      author: "Clement of Alexandria",
      work: "The First Epistle of Clement to the Corinthians",
      century: "1st",
      category: "Commentary",
      topic: "Holy Spirit"
    }
  ];

  it("sizes each bar to the longest value, with the work bar wrapping to two lines", () => {
    const m = libraryHoverBarMetrics(rows);
    expect(m.widthCh.author).toBeGreaterThan(m.widthCh.century);
    expect(m.widthCh.work).toBeGreaterThan(m.widthCh.century);
    expect(m.widthCh.work).toBeLessThanOrEqual(Math.ceil("The First Epistle of Clement to the Corinthians".length / 2) + 2);
    expect(m.widthCh.category).toBeGreaterThanOrEqual("Commentary".length);
    expect(m.widthCh.topic).toBeGreaterThanOrEqual("Holy Spirit".length);
    expect(m.workLines).toBe(2);
  });

  it("scales work font only a little between the shortest and longest titles", () => {
    const m = libraryHoverBarMetrics(rows);
    const short = workBarFontPx("The Homily", m);
    const long = workBarFontPx("The First Epistle of Clement to the Corinthians", m);
    expect(short).toBeGreaterThan(long);
    expect(short - long).toBeLessThanOrEqual(4);
    expect(short - long).toBeGreaterThanOrEqual(1);
    expect(workBarFontPx("The Homily", m)).toBe(short);
  });
});
