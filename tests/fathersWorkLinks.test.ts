import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";
import { staticWorkId } from "../src/lib/workSlugs";

describe("father work links open the reader", () => {
  it("reads the work id from static work URLs", () => {
    expect(staticWorkId("/fathers/josephus/antiquities-of-the-jews.html")).toBe("antiquities-of-the-jews");
    expect(staticWorkId("/fathers/didache/teaching-of-the-twelve-apostles.html")).toBe("didache");
    expect(staticWorkId("/fathers/josephus/")).toBeNull();
    expect(staticWorkId("/fathers/josephus/wars-of-the-jews/book-i/")).toBeNull();
  });

  it("Fathers page links each work to the reader, not the static page", () => {
    const src = readFileSync("src/pages/FathersPage.tsx", "utf8");
    expect(src).toContain("to={readPath(work.id)}");
    expect(src).not.toContain("workPublicPath");
  });
});

describe("every father bio page links only to real works", () => {
  it("resolves each work link on every profile to a catalog work", async () => {
    const { getCatalog } = await import("../server/api");
    const { renderFatherProfileBody } = await import("../src/lib/fatherPageHtml");
    const { WORK_READ_PATHS } = await import("../src/lib/workSlugs");
    const catalog = getCatalog();
    const ids = new Set(catalog.works.map((w) => w.id));
    const byPath = new Map(Object.entries(WORK_READ_PATHS).map(([id, p]) => [p, id]));
    let checked = 0;
    for (const author of catalog.authors) {
      const works = catalog.works.filter((w) => w.author === author.id);
      const body = renderFatherProfileBody(author, works, {});
      for (const [, href] of body.matchAll(/href="([^"]+)"/g)) {
        if (href === "/fathers/" || href.startsWith("http")) continue;
        expect(href, author.id).not.toMatch(/\.html$/);
        const m = href.match(/^\/read\?work=([^&"]+)$/);
        const id = m ? decodeURIComponent(m[1]) : byPath.get(href);
        expect(id && ids.has(id), author.id + " " + href).toBe(true);
        checked++;
      }
    }
    expect(checked).toBe(catalog.works.filter((w) => catalog.authors.some((a) => a.id === w.author)).length);
  }, 60_000);
});
