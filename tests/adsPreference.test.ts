import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ADS_PREF_KEY, loadAdsEnabled, saveAdsEnabled } from "../src/lib/adsPreference";

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
  localStorage.removeItem(ADS_PREF_KEY);
});

describe("loadAdsEnabled", () => {
  it("defaults to false when unset", () => {
    expect(loadAdsEnabled()).toBe(false);
  });

  it("defaults to false for garbage values", () => {
    localStorage.setItem(ADS_PREF_KEY, "yes");
    expect(loadAdsEnabled()).toBe(false);
  });
});

describe("saveAdsEnabled", () => {
  it("round-trips on and off", () => {
    saveAdsEnabled(true);
    expect(localStorage.getItem(ADS_PREF_KEY)).toBe("on");
    expect(loadAdsEnabled()).toBe(true);
    saveAdsEnabled(false);
    expect(localStorage.getItem(ADS_PREF_KEY)).toBe("off");
    expect(loadAdsEnabled()).toBe(false);
  });
});
