import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";
import { prerenderShell } from "../server/staticFathers";
import {
  GA_MEASUREMENT_ID,
  gtagHeadSnippet,
  gtagScriptSrc,
  gtagSnippetCount,
  injectGtagHead
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
});
