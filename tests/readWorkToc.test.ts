import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

describe("in-app work chapter index", () => {
  it("omits Start reading because the chapter text is already on the page", () => {
    const src = readFileSync(join(here, "../src/pages/ReadPage.tsx"), "utf8");
    expect(src).not.toContain("Start reading");
    expect(src).not.toContain("start-reading");
    expect(src).toContain('className="chapter-index"');
  });

  it("mounts ChapterDock in a shared read-docks stack and drops inert toolbar nav", () => {
    const src = readFileSync(join(here, "../src/pages/ReadPage.tsx"), "utf8");
    expect(src).toContain("ChapterDock");
    expect(src).toContain('className="read-docks"');
    expect(src).not.toMatch(/className="nav-chap"/);
  });
});
