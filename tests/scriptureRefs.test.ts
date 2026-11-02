import { describe, expect, it } from "vitest";
import { findScriptureRefs, romanToInt, scriptureHref, scriptureLabel } from "../src/lib/scriptureRefs";

describe("romanToInt", () => {
  it("reads lowercase chapter numerals", () => {
    expect(romanToInt("i")).toBe(1);
    expect(romanToInt("xix")).toBe(19);
    expect(romanToInt("cxix")).toBe(119);
    expect(romanToInt("xliv")).toBe(44);
    expect(romanToInt("abc")).toBeNull();
  });
});

describe("findScriptureRefs", () => {
  it("finds Schaff-style references", () => {
    const refs = findScriptureRefs("Matt. xix. 4, &c.");
    expect(refs).toHaveLength(1);
    expect(refs[0]).toMatchObject({ book: "mt", chapter: 19, verse: 4 });
    expect(findScriptureRefs("John i. 3.")[0]).toMatchObject({ book: "jo", chapter: 1, verse: 3 });
    expect(findScriptureRefs("Gen. i. 1.")[0]).toMatchObject({ book: "gn", chapter: 1, verse: 1 });
  });

  it("handles numbered books, colons and ranges", () => {
    expect(findScriptureRefs("tes eusebeias. See 1 Tim. iii. 16, and note 1")[0]).toMatchObject({ book: "1tm", chapter: 3, verse: 16 });
    expect(findScriptureRefs("Rom. 5:12-14")[0]).toMatchObject({ book: "rm", chapter: 5, verse: 12, endVerse: 14 });
    expect(findScriptureRefs("I Cor. xv. 22")[0]).toMatchObject({ book: "1co", chapter: 15, verse: 22 });
    expect(findScriptureRefs("Ps. cxix. 105")[0]).toMatchObject({ book: "ps", chapter: 119, verse: 105 });
  });

  it("finds several references and keeps their offsets", () => {
    const text = "Cf. Heb. i. 3; Col. i. 15, and Phil. ii. 6.";
    const refs = findScriptureRefs(text);
    expect(refs.map((r) => r.book)).toEqual(["hb", "cl", "ph"]);
    for (const r of refs) expect(text.slice(r.start, r.end)).toMatch(/^(Heb|Col|Phil)/);
  });

  it("ignores works of the Fathers and impossible chapters", () => {
    expect(findScriptureRefs("Orat. ii. 4; Hist. Ar. 7; Herm. Mand. 1.")).toEqual([]);
    expect(findScriptureRefs("Jude xx. 3")).toEqual([]);
  });

  it("does not mistake Philemon for Philippians", () => {
    expect(findScriptureRefs("Philem. 1:10")[0]).toMatchObject({ book: "phm" });
  });
});

describe("scripture links", () => {
  it("labels and links a reference", () => {
    const ref = { book: "mt", bookName: "Matthew", chapter: 19, verse: 4, endVerse: 6 };
    expect(scriptureLabel(ref)).toBe("Matthew 19:4–6");
    expect(scriptureHref(ref)).toBe("/bible?book=mt&chapter=19&verse=4");
  });
});
