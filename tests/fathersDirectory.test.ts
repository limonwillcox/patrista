import { matchPath } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { Author } from "../server/types";
import { centuryHeading, fatherSections, isFathersTabPath } from "../src/lib/fathersDirectory";

function author(partial: Pick<Author, "id" | "name" | "deathYear"> & Partial<Author>): Author {
  return {
    dates: "",
    era: "post-nicene",
    region: "Various",
    bio: "",
    ...partial
  };
}

describe("Fathers tab path", () => {
  it("is active on the index and a profile, and inactive on a reading chapter", () => {
    expect(isFathersTabPath("/fathers")).toBe(true);
    expect(isFathersTabPath("/fathers/")).toBe(true);
    expect(isFathersTabPath("/fathers/augustine")).toBe(true);
    expect(isFathersTabPath("/fathers/augustine/")).toBe(true);
    expect(isFathersTabPath("/fathers/augustine/confessions/book-1")).toBe(false);
    expect(isFathersTabPath("/fathers/augustine/confessions.html")).toBe(false);
    expect(isFathersTabPath("/read")).toBe(false);
    expect(matchPath("/fathers", "/fathers/")).not.toBeNull();
    expect(matchPath("/fathers/:authorId", "/fathers/augustine/")).not.toBeNull();
  });
});

describe("father sections", () => {
  it("groups by century, orders by death year, and puts Councils last", () => {
    const sections = fatherSections([
      author({ id: "augustine", name: "Augustine of Hippo", deathYear: 430 }),
      author({ id: "jerome", name: "Jerome", deathYear: 420 }),
      author({ id: "ignatius", name: "Ignatius of Antioch", deathYear: 110 }),
      author({ id: "clement_rome", name: "Clement of Rome", deathYear: 99 }),
      author({ id: "councils", name: "Ecumenical Councils", deathYear: 451 }),
      author({ id: "polycarp", name: "Polycarp of Smyrna", deathYear: 155 })
    ]);
    expect(sections.map((s) => s.title)).toEqual([
      "First Century",
      "Second Century",
      "Fifth Century",
      "Councils"
    ]);
    expect(centuryHeading(4)).toBe("Fourth Century");
    const second = sections.find((s) => s.title === "Second Century");
    expect(second?.fathers.map((f) => f.id)).toEqual(["ignatius", "polycarp"]);
    expect(second?.fathers[0].office).toBe("Bishop of Antioch");
    const fifth = sections.find((s) => s.title === "Fifth Century");
    expect(fifth?.fathers.map((f) => f.name)).toEqual(["Jerome", "Augustine of Hippo"]);
    expect(sections.at(-1)?.id).toBe("councils");
  });

  it("still lists a father who has no profile copy", () => {
    const sections = fatherSections([
      author({ id: "new_father", name: "New Father", deathYear: 250, region: "Egypt", bio: "A short life." })
    ]);
    expect(sections[0].title).toBe("Third Century");
    expect(sections[0].fathers[0]).toMatchObject({
      office: "Egypt",
      paragraphs: ["A short life."]
    });
  });
});
