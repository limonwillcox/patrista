import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { kjvNoteParts } from "../src/components/reader/KjvNote";
import { findPatterns } from "../src/lib/connectionPatterns";
import type { ChapterConnections } from "../src/api/connections";

const root = join(__dirname, "..");
const book = (t: string, id: string) =>
  JSON.parse(readFileSync(join(root, "Bibles", t, id + ".json"), "utf8")) as { chapters: string[][]; notes?: Record<string, string> };

describe("KJV text", () => {
  it("holds no margin note, subscription or stray brace inside a verse", () => {
    const ids = (JSON.parse(readFileSync(join(root, "Bibles", "KJV", "manifest.json"), "utf8")) as { id: string }[]).map((b) => b.id);
    const bad: string[] = [];
    for (const id of ids) {
      book("KJV", id).chapters.forEach((ch, c) =>
        ch.forEach((v, i) => {
          if (/[{}«»]|\b(?:Heb|Gr|Chald)\.|: or,|\bcents\b|signifieth a|some (?:copies|read)/.test(v)) bad.push(`${id} ${c + 1}:${i + 1}`);
        })
      );
    }
    expect(bad).toEqual([]);
  });

  it("keeps the notes it moved out of the verses", () => {
    const mt = book("KJV", "mt");
    expect(mt.chapters[15][17]).toMatch(/shall not prevail against it\.$/);
    expect(mt.notes?.["16:18"]).toBe("Peter: this name signifies a rock");
    expect(book("KJV", "rm").notes?.["16:27"]).toMatch(/^«Written to the Romans from Corinthus/);
    expect(book("KJV", "gn").chapters[24][3]).toContain("Abidah");
  });
});

describe("KJV margin notes", () => {
  it("tells the 1611 note from the American cents and from a subscription", () => {
    expect(kjvNoteParts("penny: in value seven pence halfpenny; about fourteen cents")).toEqual([
      { kind: "margin", text: "penny: in value seven pence halfpenny" },
      { kind: "american", text: "about fourteen cents" }
    ]);
    expect(kjvNoteParts("«Written to the Hebrews from Italy, by Timothy.»")).toEqual([
      { kind: "subscription", text: "Written to the Hebrews from Italy, by Timothy." }
    ]);
    expect(kjvNoteParts("he goats: Heb. great he goats")).toEqual([{ kind: "margin", text: "he goats: Heb. great he goats" }]);
  });
});

describe("Douay-Rheims verses", () => {
  it("has the meek at Matthew 5:5 and the mourners at 5:4, as the KJV numbers them", () => {
    const mt = book("DRA", "mt").chapters[4];
    expect(mt[2]).toBe("Blessed are the poor in spirit: for theirs is the kingdom of heaven.");
    expect(mt[3]).toMatch(/^Blessed are they that mourn/);
    expect(mt[4]).toMatch(/^Blessed are the meek/);
  });

  it("leaves few verses empty", () => {
    let empty = 0;
    for (const f of readdirSync(join(root, "Bibles", "DRA")).filter((f) => f.endsWith(".json") && f !== "manifest.json"))
      for (const ch of book("DRA", f.replace(/\.json$/, "")).chapters) for (const v of ch) if (!v.trim()) empty++;
    expect(empty).toBeLessThanOrEqual(18);
  });
});

describe("connection strength", () => {
  it("never calls shared words alone strong, however many verses share them", () => {
    // Three verses here each share heavy words with three verses there: words 4 + several verses 2.
    const data: ChapterConnections = {
      v: {
        "1": { l: [[19023024, 13, "c", ["G3595"]]] },
        "2": { l: [[19023025, 13, "c", ["G4221"]]] },
        "3": { l: [[19023026, 13, "c", ["G4221"]]] }
      },
      c: []
    } as unknown as ChapterConnections;
    const [p] = findPatterns(data, [19001001, 19001003], []);
    expect(p.strength).toBe("moderate");
  });

  it("calls two Fathers citing both strong", () => {
    const data = { v: { "1": { w: [[40001001, 2, ["Augustine", "Origen"], ["x"]]] } }, c: [] } as unknown as ChapterConnections;
    const [p] = findPatterns(data, [19001001, 19001001], []);
    expect(p.strength).toBe("strong");
  });
});

describe("word study on names with æ", () => {
  it("finds G2541 for Caesar, spelt either way, and Zacchæus whole", async () => {
    const { codeFor, occurrenceAt } = await import("../src/api/strongs");
    const tagged = (b: string, c: number) =>
      (JSON.parse(readFileSync(join(root, "public", "strongs", "kjv", b, c + ".json"), "utf8")) as { v: Record<string, [string, string][]> }).v;
    const lk2 = tagged("lk", 2)["1"];
    expect(codeFor(lk2, "Cæsar", 0)).toBe("G2541");
    expect(codeFor(lk2, "Caesar", 0)).toBe("G2541");
    expect(codeFor(tagged("mt", 22)["17"], "Caesar", 0)).toBe("G2541");
    expect(codeFor(tagged("lk", 19)["2"], "Zacchæus", 0)).toBe("G2195");
    const verse = book("KJV", "lk").chapters[1][0];
    expect(verse).toContain("Cæsar");
    expect(occurrenceAt(verse, "Cæsar", verse.length)).toBe(1);
  });
});
