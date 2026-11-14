import { existsSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import labels from "../data/clavis/site-labels.json";
import { getLibrary } from "../server/corpus";
import { clavisForPath } from "../server/workClavis";
import { clavisUrl, formatClavisNumber } from "../src/lib/clavis";

const ROOT = join(__dirname, "..");

describe("work Clavis labels", () => {
  it("labels only files that exist, with CPG or CPL numbers and a Clavis id", () => {
    for (const [path, entry] of Object.entries(labels as Record<string, { id: string; numbers: string[] }>)) {
      expect(existsSync(join(ROOT, path)), path).toBe(true);
      expect(entry.id, path).toMatch(/^[0-9A-F]{32}$/);
      expect(entry.numbers.length, path).toBeGreaterThan(0);
      for (const n of entry.numbers) expect(n, path).toMatch(/^(CPG|CPL)-\S+$/);
    }
  });

  it("knows the Confessions and the City of God", () => {
    expect(clavisForPath("Fathers/English/Augustine_English/The Confessions of St. Augustine. Augustine.txt")?.numbers).toEqual(["CPL-251"]);
    expect(clavisForPath("Fathers\\English\\Augustine_English\\The City of God.txt")?.numbers).toContain("CPL-313");
  });

  it("formats numbers the way scholars cite them", () => {
    expect(formatClavisNumber("CPL-251")).toBe("CPL 251");
    expect(formatClavisNumber("CPG-1664.8")).toBe("CPG 1664.8");
    expect(clavisUrl("ABC")).toBe("https://clavis.brepols.net/clacla/OA/Details.aspx?id=ABC");
  });

  it("puts the label on the works the site serves", () => {
    const works = getLibrary().catalog.works;
    const byId = (id: string) => works.find((w) => w.id === id);
    expect(byId("confessions")?.clavis?.numbers).toEqual(["CPL-251"]);
    const labelled = works.filter((w) => w.clavis);
    expect(labelled.length).toBeGreaterThan(200);
  }, 60_000);
});
