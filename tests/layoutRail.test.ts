import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

describe("site rail", () => {
  it("hides the Give tab for now", () => {
    const src = readFileSync(join(here, "../src/components/Layout.tsx"), "utf8");
    expect(src).not.toContain('to="/give"');
    expect(src).not.toMatch(/<span>Give<\/span>/);
  });
});
