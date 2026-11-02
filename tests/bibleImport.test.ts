import { existsSync, mkdtempSync, readFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { alignBookByWording, alignVerses, cleanVerse, convertToKjvShape, parseVpl } from "../scripts/import-bibles";
import { handleApiRequest } from "../server/api";
import { getBibleTextChapter } from "../server/bibleText";
import { writeStaticBibleText } from "../server/staticBible";
import { repoRoot } from "../server/corpus";
import { bibleTextPath, isLocalTextTranslation } from "../src/api/bibleTranslations";

describe("import-bibles", () => {
  it("cleans brackets, cross references and pilcrows out of a verse", () => {
    expect(cleanVerse("This [is] the book ¶ of the generation")).toBe("This is the book of the generation");
    expect(cleanVerse("The psalm of David. [2 Kings 16] O Lord")).toBe("The psalm of David. O Lord");
    expect(cleanVerse("  A <w>word</w>  ,  spaced ")).toBe("A word, spaced");
  });

  it("keeps a verse the translation leaves out as an empty string in its place", () => {
    const src = parseVpl("MAT 17:20 Because of your little faith.\nMAT 17:22 While they were in Galilee.\nTOB 1:1 dropped\n");
    expect([...src.keys()]).toEqual(["mt"]);
    const { verses, report } = alignVerses(22, src.get("mt")!.get(17));
    expect(verses).toHaveLength(22);
    expect(verses[19]).toBe("Because of your little faith.");
    expect(verses[20]).toBe("");
    expect(verses[21]).toBe("While they were in Galilee.");
    expect(report).toBeUndefined();
  });

  it("reports chapters whose verse count differs from the KJV", () => {
    const kjv = [{ id: "3jo", name: "3 John", chapters: [["a", "b", "c"]] }];
    const { books, reports, emptyVerses } = convertToKjvShape(parseVpl("3JO 1:1 a\n3JO 1:2 b\n"), kjv);
    expect(books[0].chapters[0]).toEqual(["a", "b", ""]);
    expect(reports).toEqual([{ book: "3jo", chapter: 1, kjv: 3, source: 2, note: "verses 3–3 empty" }]);
    expect(emptyVerses).toEqual(["3jo 1:3"]);
  });

  it("lays a differently numbered book onto the KJV's verses by wording", () => {
    const kjv = [
      ["Blessed is the man that walketh not in the counsel of the ungodly", "But his delight is in the law of the LORD"],
      ["[A Psalm of David.] Why do the heathen rage, and the people imagine a vain thing?", "The kings of the earth set themselves"]
    ];
    const source = [
      { ch: 1, v: 1, text: "Blessed is the man who hath not walked in the counsel of the ungodly" },
      { ch: 1, v: 2, text: "But his will is in the law of the Lord" },
      // A title numbered as a verse of its own opens the next psalm: it joins that psalm's verse 1.
      { ch: 2, v: 1, text: "A psalm for David." },
      { ch: 2, v: 2, text: "Why have the Gentiles raged, and the people devised vain things?" },
      { ch: 2, v: 3, text: "The kings of the earth stood up" }
    ];
    const { chapters, dropped } = alignBookByWording(kjv, source);
    expect(chapters[0]).toEqual([source[0].text, source[1].text]);
    expect(chapters[1][0]).toBe("A psalm for David. Why have the Gentiles raged, and the people devised vain things?");
    expect(chapters[1][1]).toBe("The kings of the earth stood up");
    expect(dropped).toBe(0);
  });
});

describe("local Bible translations", () => {
  const root = repoRoot();

  it("are listed and served per chapter, aligned to the KJV", () => {
    for (const id of ["bsb", "web", "asv", "dra"]) {
      expect(isLocalTextTranslation(id)).toBe(true);
      const jo1 = getBibleTextChapter(root, id, "jo", 1);
      expect(jo1?.verses[0]).toMatch(/In the beginning was the Word/);
    }
    expect(isLocalTextTranslation("kjv")).toBe(false);
    expect(isLocalTextTranslation("esv")).toBe(false);
    // The BSB leaves Matthew 17:21 out: an empty verse keeps 17:22 in its place.
    const mt17 = getBibleTextChapter(root, "bsb", "mt", 17)!;
    expect(mt17.verses[20]).toBe("");
    expect(mt17.verses[21]).toMatch(/Galilee/);
    // The Douay-Rheims numbers this Psalm 22; here it is on the KJV's Psalm 23.
    expect(getBibleTextChapter(root, "dra", "ps", 23)?.verses[0]).toMatch(/The Lord ruleth me/);
  });

  it("refuses unknown translations and books", () => {
    expect(getBibleTextChapter(root, "esv", "jo", 1)).toBeNull();
    expect(getBibleTextChapter(root, "kjv", "jo", 1)).toBeNull();
    expect(getBibleTextChapter(root, "bsb", "..", 1)).toBeNull();
    expect(getBibleTextChapter(root, "bsb", "jo", 99)).toBeNull();
    expect(handleApiRequest("/api/bible/text/esv/jo/1").status).toBe(404);
  });

  it("answers the text path and ?translation= on the chapter API, without the KJV's margin notes", () => {
    const text = handleApiRequest(bibleTextPath("web", "jo", 3));
    expect(text.status).toBe(200);
    expect((text.json as { verses: string[] }).verses[15]).toMatch(/For God so loved the world/);
    const kjv = handleApiRequest("/api/bible/rt/1").json as { verses: string[]; notes?: object; comments: unknown[] };
    const asv = handleApiRequest("/api/bible/rt/1?translation=asv").json as typeof kjv;
    expect(kjv.notes).toBeTruthy();
    expect(asv.notes).toBeUndefined();
    expect(asv.verses[0]).toMatch(/judges judged/);
    expect(asv.comments).toEqual(kjv.comments);
  });

  it("writes one static file per chapter", () => {
    const dist = mkdtempSync(join(tmpdir(), "patrista-bible-text-"));
    expect(writeStaticBibleText(dist, root)).toBeGreaterThan(4 * 1189 - 10);
    const file = join(dist, "api", "bible", "text", "bsb", "jo", "1.json");
    expect(existsSync(file)).toBe(true);
    expect(JSON.parse(readFileSync(file, "utf8")).verses[0]).toMatch(/In the beginning was the Word/);
  }, 120_000);
});
