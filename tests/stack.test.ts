import { existsSync, readFileSync } from "fs";
import { describe, expect, it } from "vitest";

describe("shipped app stack", () => {
  it("is Vite + React started with pnpm, not the old http-server HTML shells", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
      packageManager?: string;
    };
    expect(pkg.packageManager?.startsWith("pnpm")).toBe(true);
    expect(pkg.scripts.dev).toMatch(/\bvite\b/);
    expect(pkg.scripts.build).toMatch(/\bvite(?:\.js)? build\b/);
    expect(pkg.scripts.preview).toMatch(/\bvite preview\b/);
    expect(JSON.stringify(pkg.scripts)).not.toMatch(/http-server/);
    expect(existsSync("package-lock.json")).toBe(false);

    const html = readFileSync("index.html", "utf8");
    expect(html).toContain("/src/main.tsx");
    expect(html).not.toContain("FG.boot");
    expect(html).not.toContain("js/app.js");

    for (const leftover of [
      "js/app.js",
      "js/data.js",
      "css/styles.css",
      "about.html",
      "browse.html",
      "read.html",
      "search.html",
      "study.html",
      "plans.html"
    ]) {
      expect(existsSync(leftover), leftover + " should be deleted").toBe(false);
    }
  });
});
