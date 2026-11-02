import { describe, expect, it } from "vitest";
import { getCatalog } from "../server/api";
import { ERAS } from "../server/churchHistory";
import { centuryBlocks, eraCentury } from "../src/lib/centuries";

describe("centuries on the Fathers page", () => {
  it("files each event under its century, BC dates under the first", () => {
    expect(eraCentury(-4)).toBe(1);
    expect(eraCentury(33)).toBe(1);
    expect(eraCentury(100)).toBe(1);
    expect(eraCentury(325)).toBe(4);
    expect(eraCentury(1054)).toBe(11);
  });

  it("keeps every Father and every event exactly once, in century order", () => {
    const { authors } = getCatalog();
    const blocks = centuryBlocks(authors);
    expect(blocks.flatMap((b) => b.fathers).length).toBe(authors.length);
    expect(blocks.flatMap((b) => b.events).length).toBe(ERAS.length);
    const centuries = blocks.filter((b) => b.century !== null).map((b) => b.century!);
    expect(centuries).toEqual([...centuries].sort((a, b) => a - b));
    // Centuries with events but no Fathers still get a section.
    const eleventh = blocks.find((b) => b.century === 11);
    expect(eleventh?.events.map((e) => e.title)).toContain("The Great Schism");
    // Named sections (the councils) come last and carry no events.
    for (const b of blocks.filter((b) => b.century === null)) expect(b.events).toEqual([]);
  }, 120_000);
});
