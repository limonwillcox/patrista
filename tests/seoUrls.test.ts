import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";
import {
  clearLegacyRedirectMapCache,
  fathersLegacyRedirectResponse,
  lookupLegacyRedirect
} from "../src/lib/legacyRedirects";
import { SITE_ORIGIN } from "../src/lib/siteOrigin";
import { workPublicPath, workStaticRel } from "../src/lib/fatherPaths";

describe("site origin", () => {
  it("is the apex host", () => {
    expect(SITE_ORIGIN).toBe("https://patrista.com");
  });

  it("is what FathersPage and ChurchHistoryPage use for canonicals, og:url and JSON-LD", () => {
    const fathers = readFileSync("src/pages/FathersPage.tsx", "utf8");
    expect(fathers).toContain("SITE_ORIGIN");
    expect(fathers).not.toContain("window.location.origin");
    const history = readFileSync("src/pages/ChurchHistoryPage.tsx", "utf8");
    expect(history).toContain("SITE_ORIGIN");
    expect(history).not.toContain("window.location.origin");
  });
});

describe("work public URLs", () => {
  it("are extensionless and still written as .html files", () => {
    expect(workPublicPath("augustine", "confessions")).toBe("/fathers/augustine/confessions");
    expect(workStaticRel("augustine", "confessions")).toBe("fathers/augustine/confessions.html");
  });
});

describe("legacy redirects", () => {
  const map = {
    "/fathers/ambrose/on-the-mysteries/chapter-viii-of-the-mystical-feast-of-the-altar-of-the-lord-lest-any-should-thin":
      "/fathers/ambrose/on-the-mysteries/chapter-8/",
    "/fathers/didache/teaching-of-the-twelve-apostles": "/fathers/didache/didache",
    "/fathers/jerome/apology-in-defence-of-himself": "/fathers/rufinus/rufinus-apology-in-defence-of-himself"
  };

  it("maps old chapter slugs, .html and slash variants onto the current path", () => {
    expect(
      lookupLegacyRedirect(
        "/fathers/ambrose/on-the-mysteries/chapter-viii-of-the-mystical-feast-of-the-altar-of-the-lord-lest-any-should-thin/",
        map
      )
    ).toBe("/fathers/ambrose/on-the-mysteries/chapter-8/");
    expect(lookupLegacyRedirect("/fathers/didache/teaching-of-the-twelve-apostles.html", map)).toBe(
      "/fathers/didache/didache"
    );
    expect(lookupLegacyRedirect("/fathers/jerome/apology-in-defence-of-himself/", map)).toBe(
      "/fathers/rufinus/rufinus-apology-in-defence-of-himself"
    );
    expect(lookupLegacyRedirect("/fathers/ambrose/on-the-mysteries/chapter-8/", map)).toBeNull();
  });

  it("returns a one-hop 301 to the apex current URL", async () => {
    clearLegacyRedirectMapCache();
    const json = JSON.stringify(map);
    const redirected = await fathersLegacyRedirectResponse(
      new Request("https://www.patrista.com/fathers/didache/teaching-of-the-twelve-apostles.html?x=1"),
      async () => new Response(json, { status: 200 })
    );
    expect(redirected).not.toBeNull();
    expect(redirected!.status).toBe(301);
    expect(redirected!.headers.get("Location")).toBe("https://patrista.com/fathers/didache/didache?x=1");
    const live = await fathersLegacyRedirectResponse(
      new Request("https://patrista.com/fathers/didache/didache"),
      async () => new Response(json, { status: 200 })
    );
    expect(live).toBeNull();
  });
});
