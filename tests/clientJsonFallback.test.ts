import { describe, expect, it } from "vitest";
import { jsonFallbackPath } from "../src/api/client";

describe("jsonFallbackPath", () => {
  it("appends .json to extensionless API paths", () => {
    expect(jsonFallbackPath("/api/bible/manifest")).toBe("/api/bible/manifest.json");
    expect(jsonFallbackPath("/api/bible/jo/1")).toBe("/api/bible/jo/1.json");
  });

  it("strips the query string before appending .json", () => {
    expect(jsonFallbackPath("/api/bible/jo/1?section=jo.1.prologue")).toBe(
      "/api/bible/jo/1.json"
    );
  });

  it("returns null when the path already ends in .json", () => {
    expect(jsonFallbackPath("/api/catalog.json")).toBeNull();
  });
});
