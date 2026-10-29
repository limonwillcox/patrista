import { describe, expect, it } from "vitest";
import { DEFAULT_READ_HREF, readTabHref } from "../src/lib/lastRead";

describe("read tab target", () => {
  it("sends first-time visitors to the Confessions", () => {
    expect(readTabHref(null)).toBe(DEFAULT_READ_HREF);
  });
  it("returns to the last work and chapter", () => {
    expect(readTabHref({ work: "didache", chapter: 3 })).toBe("/read?work=didache&chapter=3");
    expect(readTabHref({ work: "didache" })).toBe("/read?work=didache");
    expect(readTabHref({ work: "confessions", chapter: 8 })).toBe("/augustines-confessions?chapter=8");
  });
  it("falls back when the stored work no longer exists", () => {
    expect(readTabHref({ work: "gone" }, new Set(["didache"]))).toBe(DEFAULT_READ_HREF);
  });
});
