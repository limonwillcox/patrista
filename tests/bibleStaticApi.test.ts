import { existsSync, mkdtempSync, readFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { writeStaticBibleApi } from "../server/staticBible";
import { repoRoot } from "../server/corpus";

describe("writeStaticBibleApi", () => {
  it("writes the KJV manifest and John 1 for GitHub Pages", () => {
    const dist = mkdtempSync(join(tmpdir(), "piblia-bible-"));
    const redirects = writeStaticBibleApi(dist, repoRoot());
    const manifestPath = join(dist, "api", "bible", "manifest.json");
    expect(existsSync(manifestPath)).toBe(true);
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
      id: string;
      name: string;
      chapters: number;
    }[];
    expect(manifest.find((b) => b.id === "gn")?.name).toBe("Genesis");
    expect(manifest.find((b) => b.id === "jo")?.chapters).toBe(21);
    const jo1 = JSON.parse(readFileSync(join(dist, "api", "bible", "jo", "1.json"), "utf8")) as {
      book: { id: string };
      chapter: number;
      verses: string[];
    };
    expect(jo1.book.id).toBe("jo");
    expect(jo1.chapter).toBe(1);
    expect(jo1.verses[0]).toMatch(/In the beginning was the Word/i);
    expect(redirects).toContain("/api/bible/manifest  /api/bible/manifest.json  200");
    expect(redirects).toContain("/api/bible/jo/1  /api/bible/jo/1.json  200");
  }, 120_000);
});
