import { describe, expect, it } from "vitest";
import { MIGNE_FATHERS } from "../server/migneFathers";
import { deathCentury } from "../server/shelf";
import { fatherSections } from "../src/lib/fathersDirectory";
import type { Author } from "../server/types";

const SKIPPED = [/egyptian fathers/i, /paschal chronicle/i, /theophanes continuatus/i, /mozarab/i, /pseudo-isidore/i, /dexter/i, /lives of the fathers/i];

describe("Migne fathers in the catalog", () => {
  it("names each person once, with an office and a life", () => {
    const ids = MIGNE_FATHERS.map((father) => father.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const father of MIGNE_FATHERS) {
      expect(father.office.length).toBeGreaterThan(0);
      expect(father.paragraphs.length).toBeGreaterThan(0);
      expect(father.deathYear).toBeGreaterThan(300);
      for (const skipped of SKIPPED) expect(father.name).not.toMatch(skipped);
    }
  });

  it("files Photius in the ninth century and Gerbert in the eleventh", () => {
    const authors: Author[] = MIGNE_FATHERS.map((father) => ({
      id: father.id,
      name: father.name,
      dates: father.dates,
      era: "post-nicene",
      region: father.region,
      deathYear: father.deathYear,
      bio: ""
    }));
    const sections = fatherSections(authors);
    const photius = sections.find((section) => section.fathers.some((father) => father.id === "photius"));
    const gerbert = sections.find((section) => section.fathers.some((father) => father.id === "gerbert"));
    expect(photius?.id).toBe("century-" + deathCentury(893));
    expect(gerbert?.id).toBe("century-11");
    expect(photius?.title).toBe("Ninth Century");
    expect(gerbert?.title).toBe("Eleventh Century");
  });

  it("adds them to the catalog with no books", async () => {
    const { getCatalog } = await import("../server/api");
    const catalog = getCatalog();
    for (const father of MIGNE_FATHERS) {
      const matches = catalog.authors.filter((author) => author.id === father.id);
      expect(matches.map((author) => author.name)).toEqual([father.name]);
      expect(catalog.works.filter((work) => work.author === father.id)).toEqual([]);
    }
  }, 120_000);
});
