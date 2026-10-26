import { describe, expect, it } from "vitest";
import { HOME_HREF, isHomePath, LANDING_NAV, showSiteRail } from "../src/lib/homeNav";

describe("home rail tab", () => {
  it("is active on the landing path", () => {
    expect(isHomePath("/")).toBe(true);
  });

  it("is inactive on every other route", () => {
    expect(isHomePath("/read")).toBe(false);
    expect(isHomePath("/church-fathers")).toBe(false);
    expect(isHomePath("/church-history/timeline")).toBe(false);
  });

  it("points at the landing href", () => {
    expect(HOME_HREF).toBe("/");
  });
});

describe("site rail visibility", () => {
  it("is hidden on the home path", () => {
    expect(showSiteRail("/")).toBe(false);
  });

  it("is shown on every other route", () => {
    expect(showSiteRail("/read")).toBe(true);
    expect(showSiteRail("/bible")).toBe(true);
    expect(showSiteRail("/church-fathers")).toBe(true);
    expect(showSiteRail("/church-history/timeline")).toBe(true);
    expect(showSiteRail("/about")).toBe(true);
    expect(showSiteRail("/give")).toBe(true);
    expect(showSiteRail("/fixes")).toBe(true);
    expect(showSiteRail("/journal")).toBe(true);
  });
});

describe("landing hero nav tiles", () => {
  it("lists Read through About in rail order, with Browse featured in the middle", () => {
    expect(LANDING_NAV.map((item) => item.id)).toEqual(["read", "bible", "browse", "fathers", "about"]);
    expect(LANDING_NAV.map((item) => item.label)).toEqual(["Read", "Bible", "Browse", "Fathers", "About"]);
    const mid = Math.floor(LANDING_NAV.length / 2);
    expect(LANDING_NAV[mid].id).toBe("browse");
    expect(LANDING_NAV.filter((item) => item.featured).map((item) => item.id)).toEqual(["browse"]);
  });

  it("uses the same hrefs as the rail and omits Home, Give, and Fixes", () => {
    expect(LANDING_NAV.map((item) => item.href)).toEqual([
      "/augustines-confessions",
      "/bible",
      "/church-fathers",
      "/fathers/",
      "/about"
    ]);
  });
});
