import { mkdirSync, mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { auditSeo } from "../server/seoAudit";
import { renderStubPage } from "../server/staticFathers";

const O = "https://patrista.com";
const desc = (s: string) => s + " — a plain sentence that is long enough to clear the one hundred character minimum for descriptions.";

function page(path: string, title: string, description: string, body = ""): string {
  return (
    '<html><head><title>' + title + '</title><meta name="description" content="' + description +
    '" /><link rel="canonical" href="' + O + path + '" /></head><body>' + body + "</body></html>"
  );
}

function write(dist: string, path: string, html: string) {
  const file = join(dist, path.endsWith("/") ? path + "index.html" : path);
  mkdirSync(join(file, ".."), { recursive: true });
  writeFileSync(file, html);
}

describe("SEO build check", () => {
  it("passes a clean site", () => {
    const dist = mkdtempSync(join(tmpdir(), "seo-"));
    write(dist, "/fathers/augustine/confessions.html", page("/fathers/augustine/confessions.html", "Confessions by Augustine", desc("Work"), '<a href="/fathers/augustine/confessions/chapter-1/">Chapter 1</a>'));
    write(dist, "/fathers/augustine/confessions/chapter-1/", page("/fathers/augustine/confessions/chapter-1/", "Chapter 1 - Confessions by Augustine", desc("One")));
    write(dist, "/fathers/augustine/confessions/chapter-2/", page("/fathers/augustine/confessions/chapter-2/", "Chapter 2 - Confessions by Augustine", desc("Two")));
    write(dist, "/fathers/augustine/confessions/book-ii/", renderStubPage(O + "/fathers/augustine/confessions/chapter-2/", "/fathers/augustine/confessions/chapter-2/"));
    const r = auditSeo(dist, O, ["/fathers/augustine/confessions/book-ii/"]);
    expect(r.errors).toEqual([]);
    expect(r.checked).toBe(3);
    expect(r.stubs).toBe(1);
  });

  it("flags duplicates, lengths, gaps, links to stubs, and missing stubs", () => {
    const dist = mkdtempSync(join(tmpdir(), "seo-"));
    write(dist, "/fathers/a/w.html", page("/fathers/a/w.html", "Same", "short", '<a href="/fathers/a/w/old-slug/">x</a>'));
    write(dist, "/fathers/a/w/chapter-1/", page("/fathers/a/w/chapter-1/", "Same", desc("x")));
    write(dist, "/fathers/a/w/chapter-3/", page("/fathers/a/w/chapter-3/", "T".repeat(70), desc("x")));
    write(dist, "/fathers/a/w/old-slug/", renderStubPage(O + "/fathers/a/w/chapter-1/", "/fathers/a/w/chapter-1/"));
    const errors = auditSeo(dist, O, ["/fathers/a/w/missing/"]).errors.join("\n");
    expect(errors).toMatch(/duplicate title/);
    expect(errors).toMatch(/duplicate description/);
    expect(errors).toMatch(/description under 100/);
    expect(errors).toMatch(/title over 65/);
    expect(errors).toMatch(/1\.\.N/);
    expect(errors).toMatch(/internal link to a moved chapter/);
    expect(errors).toMatch(/no longer resolves.*\/fathers\/a\/w\/missing\//);
  });

  it("flags noindex or non-self-canonical /fathers/ pages, long descriptions, and stubs to nowhere", () => {
    const dist = mkdtempSync(join(tmpdir(), "seo-"));
    write(dist, "/fathers/a/w.html", page("/fathers/a/w.html", "W by A", desc("W")).replace("<head>", '<head><meta name="robots" content="noindex" />'));
    write(dist, "/fathers/a/w/chapter-1/", page("/fathers/a/w/chapter-2/", "Chapter 1 - W by A", desc("One")));
    write(dist, "/fathers/a/v.html", page("/fathers/a/v.html", "V by A", "x".repeat(161)));
    write(dist, "/fathers/a/v/old/", renderStubPage(O + "/fathers/a/v/chapter-9/", "/fathers/a/v/chapter-9/"));
    const errors = auditSeo(dist, O, ["/fathers/a/v/old/"]).errors.join("\n");
    expect(errors).toMatch(/noindex on a \/fathers\/ page: \/fathers\/a\/w\.html/);
    expect(errors).toMatch(/canonical is not itself: \/fathers\/a\/w\/chapter-1\//);
    expect(errors).toMatch(/description over 160/);
    expect(errors).toMatch(/stub points at no indexable page: \/fathers\/a\/v\/old\//);
    expect(errors).not.toMatch(/no longer resolves/);
  });
});
