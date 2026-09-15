import { describe, expect, it } from "vitest";
import { handleApiRequest } from "../server/api";
import { clearTagCaches } from "../server/tags";

describe("Bible API", () => {
  it("serves KJV John 1 with Chrysostom comments and no topic chips in the payload", () => {
    clearTagCaches();
    const res = handleApiRequest("/api/bible/jo/1");
    expect(res.status).toBe(200);
    const json = res.json as {
      book: { id: string; name: string };
      chapter: number;
      verses: string[];
      sections: { id: string; label: string }[];
      comments: {
        authorName: string;
        workTitle: string;
        tag: { snippet: string; topics?: string[]; blocks?: string[] };
      }[];
    };
    expect(json.book.id).toBe("jo");
    expect(json.chapter).toBe(1);
    expect(json.verses[0]).toMatch(/In the beginning was the Word/i);
    expect(json.sections?.some((s) => s.id === "jo.1.prologue")).toBe(true);
    expect(json.comments.length).toBeGreaterThan(0);
    expect(json.comments.some((c) => /Chrysostom/i.test(c.authorName))).toBe(true);
    for (const c of json.comments) {
      expect(c.tag.topics).toBeUndefined();
      expect(c.tag.blocks).toBeUndefined();
      expect(c.tag.snippet.length).toBeGreaterThan(20);
    }
  }, 30_000);

  it("filters comments by section", () => {
    clearTagCaches();
    const res = handleApiRequest("/api/bible/jo/1?section=jo.1.lamb-of-god");
    expect(res.status).toBe(200);
    const json = res.json as { comments: { tag: { id: string } }[] };
    expect(json.comments.some((c) => c.tag.id.includes("lamb"))).toBe(true);
    expect(json.comments.every((c) => !c.tag.id.includes("cana"))).toBe(true);
  });
});
