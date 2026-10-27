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
