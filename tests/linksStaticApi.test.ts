import { existsSync, mkdtempSync, readFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { repoRoot } from "../server/corpus";
import { writeStaticLinksApi } from "../server/staticLinks";
import { verseResponseFromPack, type ChapterLinksPack } from "../src/links/pack";

describe("writeStaticLinksApi", () => {
  it("writes John 1 chapter pack, Mt 16 section, and a known excerpt", () => {
    const dist = mkdtempSync(join(tmpdir(), "piblia-links-"));
    const redirects = writeStaticLinksApi(dist, repoRoot());

    const jo1Path = join(dist, "api", "links", "chapter", "jo", "1.json");
    expect(existsSync(jo1Path)).toBe(true);
    const pack = JSON.parse(readFileSync(jo1Path, "utf8")) as ChapterLinksPack;
    expect(pack.bookId).toBe("jo");
    expect(pack.chapter).toBe(1);
    expect(pack.verses["1"]?.length).toBeGreaterThan(0);

    const jo11 = verseResponseFromPack(pack, 1);
    expect(jo11.counts.links).toBeGreaterThan(10);
    expect(
      jo11.tree.some((c) => c.fathers.some((f) => /chrysostom/i.test(f.fatherId)))
    ).toBe(true);

    const sectionPath = join(
      dist,
      "api",
      "links",
      "section",
      encodeURIComponent("mt.16.peters-confession") + ".json"
    );
    expect(existsSync(sectionPath)).toBe(true);

    const excerptPath = join(
      dist,
      "api",
      "links",
      "excerpt",
      encodeURIComponent("origen-comm-matt-12-10") + ".json"
    );
    expect(existsSync(excerptPath)).toBe(true);

    expect(redirects.some((l) => l.includes("/api/links/chapter/jo/1"))).toBe(true);
  }, 120_000);
});
