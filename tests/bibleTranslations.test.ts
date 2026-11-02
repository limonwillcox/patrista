import { describe, expect, it } from "vitest";
import { esvQuery, parseEsvPassage } from "../src/api/bibleTranslations";

describe("ESV", () => {
  it("asks for a chapter by the book's English name", () => {
    expect(esvQuery("SNG", 1)).toBe("Song of Solomon 1");
    expect(esvQuery("1jn", "4")).toBe("1 John 4");
  });

  it("places each verse by its number, so a verse the ESV leaves out does not shift the rest", () => {
    // Matthew 17: the ESV has no verse 21.
    const text = "[19] Then the disciples came. [20] He said to them, Because of your little faith. [22] As they were gathering in Galilee. (ESV)";
    const v = parseEsvPassage(text);
    expect(v.length).toBe(22);
    expect(v[19]).toBe("He said to them, Because of your little faith.");
    expect(v[20]).toBe("");
    expect(v[21]).toBe("As they were gathering in Galilee.");
    expect(v[0]).toBe("");
  });
});
