import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";
import { workPublicPath } from "../src/lib/fatherPaths";
import { staticWorkId } from "../src/lib/workSlugs";

describe("father work links open the reader", () => {
  it("reads the work id from static work URLs", () => {
    expect(staticWorkId("/fathers/josephus/antiquities-of-the-jews.html")).toBe("antiquities-of-the-jews");
    expect(staticWorkId("/fathers/josephus/antiquities-of-the-jews")).toBe("antiquities-of-the-jews");
    expect(staticWorkId("/fathers/josephus/antiquities-of-the-jews/")).toBe("antiquities-of-the-jews");
    expect(staticWorkId("/fathers/didache/teaching-of-the-twelve-apostles.html")).toBe("didache");
    expect(staticWorkId("/fathers/didache/teaching-of-the-twelve-apostles")).toBe("didache");
    expect(staticWorkId("/fathers/josephus/")).toBeNull();
    expect(staticWorkId("/fathers/josephus/wars-of-the-jews/book-i/")).toBeNull();
  });

  it("the Fathers bookcase opens each work in the reader, not the static page", () => {
    const src = readFileSync("src/components/shelf/BookViewer.tsx", "utf8");
    expect(src).toContain("readPath(work.id)");
    expect(src).not.toContain("workPublicPath");
  });

  it("hub spines, rolls, and the writings list point at the public work URL", () => {
    expect(workPublicPath("augustine", "confessions")).toBe("/fathers/augustine/confessions");
    expect(readFileSync("src/components/shelf/BookSpine.tsx", "utf8")).toContain("workPublicPath(author.id, work.id)");
    expect(readFileSync("src/components/shelf/RollSlot.tsx", "utf8")).toContain("workPublicPath(author.id, work.id)");
    expect(readFileSync("src/components/Booklist.tsx", "utf8")).toContain("workPublicPath(g.author.id, w.id)");
    expect(readFileSync("src/lib/fatherPageHtml.ts", "utf8")).toContain("workPublicPath(author.id, work.id)");
    expect(readFileSync("src/components/shelf/BookSpine.tsx", "utf8")).not.toContain("/read?work=");
    expect(readFileSync("src/components/shelf/RollSlot.tsx", "utf8")).not.toContain("/read?work=");
  });
});

describe("every father bio page links only to real works", () => {
  it("resolves each work link on every profile to a catalog work", async () => {
    const { getCatalog } = await import("../server/api");
    const { renderFatherProfileBody } = await import("../src/lib/fatherPageHtml");
    const catalog = getCatalog();
    const ids = new Set(catalog.works.map((w) => w.id));
    let checked = 0;
    for (const author of catalog.authors) {
      const works = catalog.works.filter((w) => w.author === author.id);
      const body = renderFatherProfileBody(author, works, {});
      expect(body, author.id).not.toContain("/read?work=");
      for (const [, href] of body.matchAll(/href="([^"]+)"/g)) {
        if (href === "/fathers/" || href.startsWith("http")) continue;
        expect(href, author.id).not.toMatch(/\.html$/);
        const m = href.match(/^\/fathers\/[^/]+\/([^/?#]+)$/);
        const id = m ? decodeURIComponent(m[1]) : null;
        expect(id && ids.has(id), author.id + " " + href).toBe(true);
        if (id) expect(href).toBe(workPublicPath(author.id, id));
        checked++;
      }
    }
    expect(checked).toBe(catalog.works.filter((w) => catalog.authors.some((a) => a.id === w.author)).length);
  }, 60_000);
});
