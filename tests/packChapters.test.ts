import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { packSet } from "../server/packChapters";
import { fetchPacked, groupStart } from "../src/api/packed";

function fixture(sizes: number[]): string {
  const dist = mkdtempSync(join(tmpdir(), "patrista-pack-"));
  const dir = join(dist, "api", "works", "w", "chapters");
  mkdirSync(dir, { recursive: true });
  sizes.forEach((size, i) => writeFileSync(join(dir, i + 1 + ".json"), JSON.stringify({ chapter: i + 1, text: "x".repeat(size) })));
  return dist;
}

describe("packing per-chapter files", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("keeps every chapter, caps groups by size, and gives an oversized chapter its own group", () => {
    const dist = fixture([100, 100, 100, 900, 100, 100]);
    const { removed, written } = packSet(dist, "api/works", ["w/chapters"], 400);
    const dir = join(dist, "api", "works", "w", "chapters");
    const index = JSON.parse(readFileSync(join(dist, "api", "works", "groups.json"), "utf8"));
    expect(removed).toBe(6);
    expect(index["w/chapters"]).toEqual([1, 4, 5]);
    expect(written).toBe(4); // three groups and the index
    expect(readdirSync(dir).sort()).toEqual(["g1.json", "g4.json", "g5.json"]);
    const all = Object.assign({}, ...["g1", "g4", "g5"].map((g) => JSON.parse(readFileSync(join(dir, g + ".json"), "utf8"))));
    expect(Object.keys(all).map(Number).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(all["4"].chapter).toBe(4);
  });

  it("finds the group that holds a chapter", () => {
    expect(groupStart([1, 4, 5], 1)).toBe(1);
    expect(groupStart([1, 4, 5], 3)).toBe(1);
    expect(groupStart([1, 4, 5], 4)).toBe(4);
    expect(groupStart([1, 4, 5], 9)).toBe(5);
    expect(groupStart([3], 1)).toBeNull();
  });

  it("reads a chapter from its packed group over fetch", async () => {
    const dist = fixture([10, 10, 10]);
    packSet(dist, "api/works", ["w/chapters"], 25);
    vi.stubGlobal("fetch", async (url: string) => {
      const file = join(dist, url);
      try {
        const body = readFileSync(file, "utf8");
        return { ok: true, json: async () => JSON.parse(body) };
      } catch {
        return { ok: false, json: async () => null };
      }
    });
    const ch = await fetchPacked<{ chapter: number }>("/api/works", "w/chapters", 3);
    expect(ch?.chapter).toBe(3);
    expect(await fetchPacked("/api/works", "w/chapters", 7)).toBeNull();
    expect(await fetchPacked("/api/works", "missing/chapters", 1)).toBeNull();
  });
});
