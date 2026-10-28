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

import { formatSelection, parseSelection } from "../src/lib/printRange";

describe("nested print selection", () => {
  const units = [
    { chapter: 1, subs: 3 },
    { chapter: 2, subs: 5 },
    { chapter: 3, subs: 0 }
  ];
  it("expands whole books and chapter ranges", () => {
    const sel = parseSelection("1,2.2-2.4,3", units);
    expect([...sel].sort()).toEqual(["1.1", "1.2", "1.3", "2.2", "2.3", "2.4", "3"]);
    expect(parseSelection("2.4-5", units).has("2.5")).toBe(true);
    expect(parseSelection(null, units).size).toBe(9);
  });
  it("formats back with whole books collapsed", () => {
    expect(formatSelection(parseSelection("1,2.2-2.4,2.5", units), units)).toBe("1,2.2-5");
    expect(formatSelection(parseSelection("1-3", units), units)).toBe("1-3");
  });
});
