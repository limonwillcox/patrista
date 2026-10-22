import { describe, expect, it } from "vitest";
import {
  announceReadDock,
  chapterAtReadingLine,
  chapterDockLabel,
  READ_DOCK_EVENT,
  subscribeReadDock
} from "../src/lib/readDocks";

describe("chapterDockLabel", () => {
  it("uses heading when present", () => {
    expect(chapterDockLabel("Book II", 2)).toBe("Book II");
  });
  it("falls back to Ch. N when heading empty", () => {
    expect(chapterDockLabel("", 3)).toBe("Ch. 3");
    expect(chapterDockLabel("   ", 3)).toBe("Ch. 3");
  });
});

describe("chapterAtReadingLine", () => {
  const sections = [
    { chapter: 1, top: 0, bottom: 400 },
    { chapter: 2, top: 400, bottom: 900 },
    { chapter: 3, top: 900, bottom: 1400 }
  ];
  it("returns containing section", () => {
    expect(chapterAtReadingLine(sections, 500)).toBe(2);
  });
  it("returns last above the line when none contain", () => {
    expect(chapterAtReadingLine(sections, 400)).toBe(2);
  });
  it("returns first when line is above all", () => {
    expect(chapterAtReadingLine(sections, -10)).toBe(1);
  });
  it("returns null for empty list", () => {
    expect(chapterAtReadingLine([], 100)).toBe(null);
  });
});

describe("read dock events", () => {
  it("notifies subscribers of the opening dock", () => {
    const seen: string[] = [];
    const stop = subscribeReadDock((dock) => seen.push(dock));
    announceReadDock("chapter");
    announceReadDock("dictionary");
    stop();
    announceReadDock("chapter");
    expect(seen).toEqual(["chapter", "dictionary"]);
  });
  it("uses the READ_DOCK_EVENT name", () => {
    expect(READ_DOCK_EVENT).toBe("piblia:read-dock");
  });
});
