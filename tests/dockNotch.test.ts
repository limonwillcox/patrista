import { describe, expect, it } from "vitest";
import { readDockOpen, writeDockOpen } from "../src/lib/dockState";

function memoryStore() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
}

describe("dock notch state", () => {
  it("is open by default and toggles each dock on its own", () => {
    const store = memoryStore();
    expect(readDockOpen("chapters", store)).toBe(true);
    expect(readDockOpen("dictionary", store)).toBe(true);
    writeDockOpen("chapters", false, store);
    expect(readDockOpen("chapters", store)).toBe(false);
    expect(readDockOpen("dictionary", store)).toBe(true);
    writeDockOpen("chapters", true, store);
    expect(readDockOpen("chapters", store)).toBe(true);
  });

  it("treats missing storage as open", () => {
    expect(readDockOpen("chapters", null)).toBe(true);
  });
});
