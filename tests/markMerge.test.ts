import { describe, expect, it } from "vitest";
import { countMarks, mergeMarks } from "../src/lib/markMerge";
import { nudgeDue } from "../src/components/SignIn";

describe("mergeMarks", () => {
  it("keeps the other side when one is unchanged or deleted", () => {
    expect(mergeMarks("fg-note-a", "x", "x")).toBe("x");
    expect(mergeMarks("fg-note-a", "x", null)).toBe("x");
    expect(mergeMarks("fg-note-a", null, "y")).toBe("y");
  });

  it("unites Bible highlights, this browser's colour winning", () => {
    const merged = mergeMarks(
      "patrista-bible-highlights-v1",
      JSON.stringify({ "gen.1.1": "gold", "gen.1.2": "blue" }),
      JSON.stringify({ "gen.1.2": "rose", "jhn.1.1": "green" })
    );
    expect(JSON.parse(merged!)).toEqual({ "gen.1.1": "gold", "gen.1.2": "blue", "jhn.1.1": "green" });
  });

  it("unites highlights in a writing without doubling the shared ones", () => {
    const a = { key: "p1", start: 0, end: 5, color: "gold" };
    const b = { key: "p2", start: 3, end: 9, color: "blue" };
    const merged = mergeMarks("fg-hl-confessions", JSON.stringify({ v: 2, list: [a] }), JSON.stringify({ v: 2, list: [a, b] }));
    expect(JSON.parse(merged!)).toEqual({ v: 2, list: [a, b] });
  });

  it("unites saved connections", () => {
    const one = { a: [1, 1], b: [2, 2], why: "x", at: 1 };
    const two = { a: [3, 3], b: [4, 4], why: "y", at: 2 };
    const merged = mergeMarks("patrista-cx-saved-v1", JSON.stringify([one]), JSON.stringify([two, one]));
    expect(JSON.parse(merged!)).toEqual([one, two]);
  });

  it("joins two different notes and does not repeat a note that grew", () => {
    const note = (html: string) => JSON.stringify({ v: 1, html });
    expect(mergeMarks("fg-note-a", note("from laptop"), note("from phone"))).toBe(note("from phone<br>from laptop"));
    expect(mergeMarks("fg-note-a", note("grace and more"), note("grace"))).toBe(note("grace and more"));
    expect(mergeMarks("fg-note-a", note("grace"), note("grace and more"))).toBe(note("grace and more"));
  });

  it("keeps this browser's value when the account's is unreadable", () => {
    expect(mergeMarks("patrista-bible-highlights-v1", "{}", "not json")).toBe("{}");
  });
});

describe("the sign-in bar", () => {
  it("counts highlights and notes", () => {
    const data: Record<string, string> = {
      "patrista-bible-highlights-v1": JSON.stringify({ "gen.1.1": "gold", "gen.1.2": "gold" }),
      "fg-hl-confessions": JSON.stringify({ v: 2, list: [{}, {}, {}] }),
      "fg-note-confessions": JSON.stringify({ v: 1, html: "x" }),
      theme: "night"
    };
    const keys = Object.keys(data);
    expect(countMarks({ length: keys.length, key: (i) => keys[i] ?? null, getItem: (k) => data[k] ?? null })).toBe(6);
  });

  it("asks after the first mark, once more at ten, then never", () => {
    expect(nudgeDue(0, 0)).toBe(false);
    expect(nudgeDue(0, 1)).toBe(true);
    expect(nudgeDue(1, 9)).toBe(false);
    expect(nudgeDue(1, 10)).toBe(true);
    expect(nudgeDue(2, 500)).toBe(false);
  });
});
