import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import type { Meta, TypeEntry } from "../src/api/connections";
import { describeShare, embedCode, hexColor, shareCardSvg, typeSlug, wrapTitle } from "../src/lib/typeShare";
import { writeTypeSharePages } from "../server/typeSharePages";

const meta = JSON.parse(readFileSync("public/connections/meta.json", "utf8")) as Meta;
const types = JSON.parse(readFileSync("public/connections/types.json", "utf8")) as TypeEntry[];
const isaac = types.find((t) => t.id.endsWith("abraham-offering-isaac"))!;

describe("describeShare", () => {
  it("gives a type a page of its own", () => {
    const s = describeShare(meta, { type: isaac, drawn: [isaac] });
    expect(s.title).toBe(isaac.label);
    expect(s.path).toBe("/types/abraham-offering-isaac/");
    expect(s.embedPath).toBe("/embed/types?type=abraham-offering-isaac");
    expect(s.subtitle).toMatch(/^Genesis → .+ · \d+ passages$/);
  });

  it("shares a chapter, a theme, a Father or the whole map as the map's own address", () => {
    const drawn = types.slice(0, 4);
    expect(describeShare(meta, { place: { book: 2, chapter: 14 }, drawn })).toMatchObject({
      title: "Exodus 14",
      subtitle: "4 types of Christ the Fathers saw here",
      path: "/types?at=ex.14",
      embedPath: "/embed/types?at=ex.14"
    });
    expect(describeShare(meta, { father: "Cyril of Jerusalem", drawn }).path).toBe("/types?father=Cyril%20of%20Jerusalem");
    expect(describeShare(meta, { theme: { id: "x-1", name: "tertullian, On Baptism 9" }, drawn }).title).toBe("Tertullian, On Baptism 9");
    expect(describeShare(meta, { drawn: types }).path).toBe("/types");
    expect(describeShare(meta, { place: { book: 2, chapter: 14 }, drawn: [isaac] }).subtitle).toBe("1 type of Christ the Fathers saw here");
  });

  it("an open type comes before the Father filter", () => {
    expect(describeShare(meta, { type: isaac, father: "Origen", drawn: [isaac] }).path).toBe("/types/abraham-offering-isaac/");
  });
});

describe("the picture", () => {
  it("wraps a long title and cuts it with an ellipsis", () => {
    expect(wrapTitle("Jonah", 40, 2)).toEqual(["Jonah"]);
    const lines = wrapTitle("Let us put wood into his bread → the cross on the body of Christ, and more words that will not fit at all", 40, 2);
    expect(lines).toHaveLength(2);
    expect(lines[1].endsWith("…")).toBe(true);
    expect(Math.max(...lines.map((l) => l.length))).toBeLessThanOrEqual(41);
  });

  it("writes colours as hex", () => {
    expect(hexColor("hsl(0 100% 50%)")).toBe("#ff0000");
    expect(hexColor("hsl(120 100% 25%)")).toBe("#008000");
    expect(hexColor("#a39d93")).toBe("#a39d93");
  });

  it("draws one arc between each pair of passages, and escapes the title", () => {
    const share = describeShare(meta, { type: isaac, drawn: [isaac] });
    const svg = shareCardSvg(meta, { ...share, title: "Bread & <wine>" }, () => "hsl(10 64% 43%)");
    expect(svg.match(/<path /g)).toHaveLength(isaac.ranges.length - 1);
    expect(svg.match(/<circle /g)).toHaveLength(isaac.ranges.length);
    expect(svg).toContain("Bread &amp; &lt;wine&gt;");
    expect(svg).not.toContain("hsl(");
  });

  it("makes the embed snippet", () => {
    const share = describeShare(meta, { place: { book: 2, chapter: 14 }, theme: null, drawn: [] });
    expect(embedCode("https://patrista.com", share)).toContain('src="https://patrista.com/embed/types?at=ex.14"');
    expect(typeSlug("04:paschal-lamb")).toBe("paschal-lamb");
  });
});

describe("writeTypeSharePages", () => {
  it("writes a page and a 1200 × 630 picture for every type", async () => {
    const dist = mkdtempSync(join(tmpdir(), "patrista-share-"));
    try {
      const shell =
        '<html><head><title>x</title><meta name="description" content="x" />\n</head><body><div id="root"></div></body></html>';
      const { urls } = await writeTypeSharePages(dist, shell, "https://patrista.com", "public/connections", null);
      expect(urls).toHaveLength(types.length);
      expect(new Set(urls).size).toBe(types.length);
      const html = readFileSync(join(dist, "types", "abraham-offering-isaac", "index.html"), "utf8");
      expect(html).toContain('<meta property="og:image" content="https://patrista.com/share/types/abraham-offering-isaac.png" />');
      expect(html).toContain('<link rel="canonical" href="https://patrista.com/types/abraham-offering-isaac/" />');
      expect(html).toContain("<h1>");
      const png = join(dist, "share", "types", "abraham-offering-isaac.png");
      expect(existsSync(png)).toBe(true);
      const info = await sharp(png).metadata();
      expect([info.width, info.height]).toEqual([1200, 630]);
    } finally {
      rmSync(dist, { recursive: true, force: true });
    }
  }, 120_000);
});
