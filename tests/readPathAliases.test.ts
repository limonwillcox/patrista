import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { describe, expect, it } from "vitest";
import type { Catalog } from "../server/types";
import { writeReadPathAliases } from "../server/staticFathers";
import { WORK_READ_PATHS } from "../src/lib/workSlugs";

describe("read path aliases", () => {
  it("gives /augustines-confessions a real file so the host does not answer 404", () => {
    const dist = mkdtempSync(join(tmpdir(), "patrista-alias-"));
    mkdirSync(join(dist, "fathers", "augustine"), { recursive: true });
    writeFileSync(join(dist, "fathers", "augustine", "confessions.html"), "<title>Confessions</title>");
    const catalog = { works: [{ id: "confessions", author: "augustine", title: "The Confessions" }] } as unknown as Catalog;
    expect(writeReadPathAliases(dist, catalog, WORK_READ_PATHS)).toEqual(["/augustines-confessions"]);
    expect(readFileSync(join(dist, "augustines-confessions.html"), "utf8")).toBe("<title>Confessions</title>");
  });

  it("skips works with no static page", () => {
    const dist = mkdtempSync(join(tmpdir(), "patrista-alias-"));
    const catalog = { works: [{ id: "confessions", author: "augustine", title: "The Confessions" }] } as unknown as Catalog;
    expect(writeReadPathAliases(dist, catalog, WORK_READ_PATHS)).toEqual([]);
    expect(existsSync(join(dist, "augustines-confessions.html"))).toBe(false);
  });
});
