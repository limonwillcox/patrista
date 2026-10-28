import { describe, expect, it } from "vitest";
import { formatChapterRange, parseChapterRange } from "../src/lib/printRange";

describe("print chapter ranges", () => {
  it("parses ranges and singles, clamped and sorted", () => {
    expect(parseChapterRange("7,1-3,99", 10)).toEqual([1, 2, 3, 7]);
    expect(parseChapterRange(null, 3)).toEqual([1, 2, 3]);
    expect(parseChapterRange("none", 3)).toEqual([]);
  });
  it("formats back to a short range", () => {
    expect(formatChapterRange([7, 1, 2, 3])).toBe("1-3,7");
  });
});
