import { mkdirSync, mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { describe, expect, it } from "vitest";
import {
  discoverEnglishWorkSpecs,
  parseEnglishWork,
  type EnglishWorkSpec
} from "../server/englishWorks";
import {
  assertChapterPageQuality,
  isLinkDumpParagraph,
  numberingWarnings,
  renderRedirectHtml,
  trimTrailingJunk,
  uniqueChapterHeadings
} from "../server/chapterQuality";
import { assignChapterSlugs, chapterPageTitle } from "../src/lib/fatherPaths";

const ROOT = join(import.meta.dirname, "..");

function spec(id: string): EnglishWorkSpec {
  const found = discoverEnglishWorkSpecs(ROOT).find((s) => s.id === id);
  if (!found) throw new Error("missing spec " + id);
  return found;
}

describe("isLinkDumpParagraph", () => {
  it("flags CCEL file links and index lines", () => {
    expect(isLinkDumpParagraph("5841. file:///ccel/s/schaff/npnf110/cache/npnf110.html3#iii.LXXII-Page_437")).toBe(true);
    expect(isLinkDumpParagraph("INDEX OF SUBJECTS.")).toBe(true);
    expect(isLinkDumpParagraph("Abel, wherefore slain, [1]446.")).toBe(true);
    expect(
      isLinkDumpParagraph(
        "to whom be glory and might, together with the Father and the Holy Ghost, now and always, and world without end. Amen."
      )
    ).toBe(false);
  });
});

describe("trimTrailingJunk", () => {
  it("keeps the homily and drops the index plus URL dump", () => {
    const paras = [
      "For the sake of these soldiers that earthquake took place.",
      "to whom be glory and might, world without end. Amen.",
      "INDEX OF SUBJECTS.",
      "Abel, wherefore slain, [1]446.",
      "5841. file:///ccel/s/schaff/npnf110/cache/npnf110.html3#iii.LXXII-Page_437"
    ];
    const { paras: kept, cut } = trimTrailingJunk(paras);
    expect(kept).toEqual(paras.slice(0, 2));
    expect(cut).toBe(3);
    expect(kept[kept.length - 1]).toMatch(/Amen\.$/);
  });
});

describe("uniqueChapterHeadings", () => {
  it("adds a part label only to later copies of the same heading", () => {
    const labels = uniqueChapterHeadings([
      { chapter: 1, heading: "Book II" },
      { chapter: 2, heading: "Book III" },
      { chapter: 3, heading: "Book II" }
    ]);
    expect(labels.get(1)).toBe("Book II");
    expect(labels.get(2)).toBe("Book III");
    expect(labels.get(3)).toBe("Book II (Part 2)");
  });

  it("keeps collision slugs so existing URLs stay put", () => {
    const chapters = [
      { chapter: 1, heading: "Book II" },
      { chapter: 3, heading: "Book II (Part 2)" }
    ];
    const slugs = assignChapterSlugs(chapters);
    expect(slugs.get(1)).toBe("book-ii");
    expect(slugs.get(3)).toBe("book-ii-3");
  });
});

describe("assertChapterPageQuality", () => {
  it("fails when two pages share a title", () => {
    const title = chapterPageTitle("Theophilus of Antioch", "To Autolycus", "Book II");
    expect(() =>
      assertChapterPageQuality([
        { path: "/a/", title, paras: ["Father text."] },
        { path: "/b/", title, paras: ["More father text."] }
      ])
    ).toThrow(/duplicate <title>/i);
  });

  it("fails when a chapter ends in a link dump", () => {
    expect(() =>
      assertChapterPageQuality([
        {
          path: "/xc/",
          title: "Homily XC",
          paras: ["Amen.", "5841. file:///ccel/foo", "5842. file:///ccel/bar", "5843. file:///ccel/baz", "5844. file:///ccel/qux", "5845. file:///ccel/quux"]
        }
      ])
    ).toThrow(/link dump/i);
  });

  it("warns on skipped unit numbers without failing", () => {
    const warnings = numberingWarnings(["Homily I", "Homily II", "Homily IV"]);
    expect(warnings).toEqual(["skip 3"]);
  });
});

describe("renderRedirectHtml", () => {
  it("points GitHub Pages at the new chapter with refresh and canonical", () => {
    const html = renderRedirectHtml(
      "https://patrista.com/fathers/chrysostom/homilies-on-matthew/homily-lxxxiii/",
      "/fathers/chrysostom/homilies-on-matthew/homily-lxxxiii-82/"
    );
    expect(html).toContain('http-equiv="refresh"');
    expect(html).toContain('rel="canonical" href="https://patrista.com/fathers/chrysostom/homilies-on-matthew/homily-lxxxiii/"');
    expect(html).toContain("<title>Moved from /fathers/chrysostom/homilies-on-matthew/homily-lxxxiii-82/</title>");
    expect(html).toContain('href="/fathers/chrysostom/homilies-on-matthew/homily-lxxxiii/"');
  });
});

describe("false book citations are not unit headings", () => {
  it("keeps To Autolycus as three books I–III", () => {
    const { work, passages } = parseEnglishWork(spec("to-autolycus"), ROOT);
    expect(work.chapters).toBe(3);
    expect(passages.map((p) => p.heading)).toEqual(["Book I", "Book II", "Book III"]);
  }, 30_000);

  it("does not split Hippolytus on footnote ‘book i.’ citations", () => {
    const { passages } = parseEnglishWork(spec("refutation-of-all-heresies"), ROOT);
    expect(passages.map((p) => p.heading)).toEqual([
      "Book I",
      "Book IV",
      "Book V",
      "Book VI",
      "Book VII",
      "Book VIII",
      "Book IX",
      "Book X"
    ]);
    expect(numberingWarnings(passages.map((p) => p.heading))).toEqual(["skip 2, 3"]);
  }, 30_000);
});

describe("Homilies on Matthew source parse", () => {
  it("does not treat editor footnotes as homily headings", () => {
    const dir = mkdtempSync(join(tmpdir(), "homilies-"));
    mkdirSync(join(dir, "Fathers/English/Chrysostom_English"), { recursive: true });
    writeFileSync(
      join(dir, "Fathers/English/Chrysostom_English/Homilies on Matthew.txt"),
      [
        "   Homily V.",
        "",
        "   Real homily five.",
        "   Homily LXXXVIII.--R.]",
        "   still homily five.",
        "",
        "   Homily VI.",
        "",
        "   Real homily six.",
        ""
      ].join("\n")
    );
    const { passages } = parseEnglishWork(
      {
        id: "homilies-on-matthew",
        author: "chrysostom",
        title: "Homilies on Matthew",
        short: "Matt.",
        series: "NPNF1",
        path: "Fathers/English/Chrysostom_English/Homilies on Matthew.txt",
        chunk: "homily"
      },
      dir
    );
    expect(passages.map((p) => p.heading)).toEqual(["Homily V", "Homily VI"]);
  });

  it("is ninety homilies I–XC, and Homily XC ends at Amen without the index", () => {
    const { work, passages } = parseEnglishWork(spec("homilies-on-matthew"), ROOT);
    expect(work.chapters).toBe(90);
    expect(passages).toHaveLength(90);
    const labels = passages.map((p) => p.heading);
    const expected = [
      "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
      "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX",
      "XXI", "XXII", "XXIII", "XXIV", "XXV", "XXVI", "XXVII", "XXVIII", "XXIX", "XXX",
      "XXXI", "XXXII", "XXXIII", "XXXIV", "XXXV", "XXXVI", "XXXVII", "XXXVIII", "XXXIX", "XL",
      "XLI", "XLII", "XLIII", "XLIV", "XLV", "XLVI", "XLVII", "XLVIII", "XLIX", "L",
      "LI", "LII", "LIII", "LIV", "LV", "LVI", "LVII", "LVIII", "LIX", "LX",
      "LXI", "LXII", "LXIII", "LXIV", "LXV", "LXVI", "LXVII", "LXVIII", "LXIX", "LXX",
      "LXXI", "LXXII", "LXXIII", "LXXIV", "LXXV", "LXXVI", "LXXVII", "LXXVIII", "LXXIX", "LXXX",
      "LXXXI", "LXXXII", "LXXXIII", "LXXXIV", "LXXXV", "LXXXVI", "LXXXVII", "LXXXVIII", "LXXXIX", "XC"
    ].map((n) => "Homily " + n);
    expect(labels).toEqual(expected);
    expect(passages[5]!.heading).toBe("Homily VI");
    const xc = (passages[89]!.versions.schaff || []).filter((p) => p.trim());
    expect(xc[xc.length - 1]).toMatch(/world without end\. Amen\.\s*$/);
    expect(xc.join("\n")).not.toMatch(/INDEX OF SUBJECTS/i);
    expect(xc.join("\n")).not.toMatch(/file:\/\//i);
    expect(xc.length).toBeLessThan(80);
  }, 60_000);

  it("drops the volume index glued onto Who is the Rich Man", () => {
    const { passages } = parseEnglishWork(spec("who-is-the-rich-man-that-shall-be-saved"), ROOT);
    const body = passages.flatMap((p) => p.versions.schaff || []).join("\n");
    expect(body).not.toMatch(/INDEX OF SUBJECTS/i);
    expect(body).not.toMatch(/file:\/\//i);
    expect(body).toMatch(/rich/i);
  }, 30_000);
});
