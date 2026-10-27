import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";
import { readPathForStaticWork } from "../src/lib/workSlugs";

describe("father work links open the reader", () => {
  it("maps old static work pages to the reader", () => {
    expect(readPathForStaticWork("/fathers/josephus/antiquities-of-the-jews.html")).toBe(
      "/read?work=antiquities-of-the-jews"
    );
    expect(readPathForStaticWork("/fathers/augustine/confessions.html")).toBe("/augustines-confessions");
    expect(readPathForStaticWork("/fathers/didache/teaching-of-the-twelve-apostles.html")).toBe("/read?work=didache");
    expect(readPathForStaticWork("/fathers/josephus/")).toBeNull();
    expect(readPathForStaticWork("/fathers/josephus/wars-of-the-jews/book-i/")).toBeNull();
  });

  it("Fathers page links each work to the reader, not the static page", () => {
    const src = readFileSync("src/pages/FathersPage.tsx", "utf8");
    expect(src).toContain("to={readPath(work.id)}");
    expect(src).not.toContain("workPublicPath");
  });
});
