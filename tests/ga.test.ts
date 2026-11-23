import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";
import { prerenderShell } from "../server/staticFathers";
import {
  GA_MEASUREMENT_ID,
  gtagHeadSnippet,
  gtagScriptSrc,
  gtagSnippetCount,
  injectGtagHead,
  pageViewParams,
  trackSpaPageView
} from "../src/lib/ga";

const SHELL = `<!DOCTYPE html>
<html lang="en">
<head>
<title>Old</title>
<meta name="description" content="Old description" />
</head>
<body>
<div id="root"></div>
</body>
</html>
`;

describe("GA4 gtag snippet", () => {
  it("keeps the measurement id in one place and builds the official async gtag.js tag", () => {
    expect(GA_MEASUREMENT_ID).toBe("G-M803MB7GYK");
    expect(gtagScriptSrc()).toBe("https://www.googletagmanager.com/gtag/js?id=G-M803MB7GYK");
    const snippet = gtagHeadSnippet();
    expect(gtagSnippetCount(snippet)).toBe(1);
    expect(snippet).toContain("<script async src=\"" + gtagScriptSrc() + "\"></script>");
    expect(snippet).toContain("gtag('config', 'G-M803MB7GYK'");
    expect(snippet).toContain("allow_google_signals: false");
    expect(snippet).toContain("allow_ad_personalization_signals: false");
    expect(snippet).not.toMatch(/GTM-[A-Z0-9]+/);
    expect(snippet).not.toContain("googletagmanager.com/gtm.js");
    expect(snippet).not.toContain("send_page_view: false");
  });

  it("puts exactly one tag in <head> and does not add a second", () => {
    const once = injectGtagHead(SHELL);
    expect(gtagSnippetCount(once)).toBe(1);
    expect(once.indexOf("googletagmanager.com/gtag/js")).toBeLessThan(once.indexOf("</head>"));
    expect(gtagSnippetCount(injectGtagHead(once))).toBe(1);
  });

  it("survives prerender so each static page still has one tag", () => {
    const html = prerenderShell(injectGtagHead(SHELL), "https://patrista.com", {
      canonicalPath: "/fathers/augustine/confessions",
      title: "The Confessions",
      description: "Augustine of Hippo.",
      bodyHtml: "<p>A work.</p>"
    });
    expect(gtagSnippetCount(html)).toBe(1);
    expect(html).toContain("allow_google_signals: false");
    expect(html.indexOf("googletagmanager.com/gtag/js")).toBeLessThan(html.indexOf("</head>"));
  });

  it("leaves the source SPA shell without a tag so pnpm dev does not load it", () => {
    const html = readFileSync("index.html", "utf8");
    expect(gtagSnippetCount(html)).toBe(0);
    expect(html).not.toContain("G-M803MB7GYK");
    expect(html).not.toContain("googletagmanager.com");
  });

  it("injects the tag in the production Vite build, not in the dev server", () => {
    const vite = readFileSync("vite.config.ts", "utf8");
    expect(vite).toContain("injectGtagHead");
    expect(vite).toContain("googleAnalytics()");
    expect(vite).toMatch(/name:\s*"google-analytics"/);
    expect(vite).toMatch(/apply:\s*"build"/);
  });

  it("sends one SPA page_view with page_path and page_location, and no-ops without gtag", () => {
    const loc = {
      pathname: "/types",
      search: "?type=abraham-offering-isaac",
      href: "https://patrista.com/types?type=abraham-offering-isaac",
      title: "Types of Christ"
    };
    expect(pageViewParams(loc)).toEqual({
      page_path: "/types?type=abraham-offering-isaac",
      page_location: "https://patrista.com/types?type=abraham-offering-isaac",
      page_title: "Types of Christ"
    });
    const calls: unknown[][] = [];
    expect(trackSpaPageView((...args) => calls.push(args), loc)).toBe(true);
    expect(calls).toEqual([["event", "page_view", pageViewParams(loc)]]);
    expect(trackSpaPageView(undefined, loc)).toBe(false);
  });

  it("records SPA route changes from the app after the HTML tag's first page_view", () => {
    const app = readFileSync("src/App.tsx", "utf8");
    const hook = readFileSync("src/lib/useGaPageViews.ts", "utf8");
    expect(app).toContain("useGaPageViews()");
    expect(hook).toContain("skipFirst");
    expect(hook).toContain("import.meta.env.PROD");
    expect(hook).toContain("trackSpaPageView");
  });
});
