import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SCHOLARS_UI_KEY, loadScholarsUi, saveScholarsUi } from "../src/lib/scholarsUi";

beforeEach(() => {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, String(v));
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => {
      store.clear();
    },
    length: 0,
    key: () => null
  } as unknown as Storage;
});

afterEach(() => {
  localStorage.removeItem(SCHOLARS_UI_KEY);
});

describe("loadScholarsUi", () => {
  it("is off when unset", () => {
    expect(loadScholarsUi()).toBe(false);
  });

  it("is off for any value other than scholars", () => {
    localStorage.setItem(SCHOLARS_UI_KEY, "yes");
    expect(loadScholarsUi()).toBe(false);
  });
});

describe("saveScholarsUi", () => {
  it("round-trips on and off", () => {
    saveScholarsUi(true);
    expect(localStorage.getItem(SCHOLARS_UI_KEY)).toBe("scholars");
    expect(loadScholarsUi()).toBe(true);
    saveScholarsUi(false);
    expect(localStorage.getItem(SCHOLARS_UI_KEY)).toBe("directory");
    expect(loadScholarsUi()).toBe(false);
  });
});
