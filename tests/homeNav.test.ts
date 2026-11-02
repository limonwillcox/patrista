import { describe, expect, it } from "vitest";
import { siteTab } from "../src/lib/homeNav";

describe("site tabs", () => {
  it("puts the front page, the library, each Father and church history under Fathers", () => {
    expect(siteTab("/")).toBe("fathers");
    expect(siteTab("/fathers/")).toBe("fathers");
    expect(siteTab("/fathers/augustine/")).toBe("fathers");
    expect(siteTab("/church-history")).toBe("fathers");
    expect(siteTab("/church-history/timeline")).toBe("fathers");
  });

  it("puts a Father's text and the study desk under Study", () => {
    expect(siteTab("/read")).toBe("study");
    expect(siteTab("/augustines-confessions")).toBe("study");
    expect(siteTab("/fathers/augustine/confessions/chapter-1/")).toBe("study");
    expect(siteTab("/fathers/augustine/confessions.html")).toBe("study");
    expect(siteTab("/study")).toBe("study");
  });

  it("gives the Bible its own tab and leaves other pages out", () => {
    expect(siteTab("/bible")).toBe("bible");
    expect(siteTab("/church-historyx")).toBe(null);
    expect(siteTab("/about")).toBe(null);
    expect(siteTab("/search")).toBe(null);
  });
});
