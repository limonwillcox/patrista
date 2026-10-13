import { describe, expect, it } from "vitest";
import {
  handleDictionaryMissList,
  handleDictionaryMissSubmit,
  mergeMissRecord,
  missKey,
  parseDictionaryMissBody,
  type DictMissRecord
} from "../server/dictionaryMiss";

describe("parseDictionaryMissBody", () => {
  it("normalizes the clicked word and keeps the work", () => {
    const ok = parseDictionaryMissBody({ word: "Wherefore,", work: "confessions" });
    expect(ok.ok).toBe(true);
    if (!ok.ok) return;
    expect(ok.data.word).toBe("wherefore");
    expect(ok.data.query).toBe("Wherefore");
    expect(ok.data.work).toBe("confessions");
  });

  it("rejects empty or tiny tokens", () => {
    expect(parseDictionaryMissBody({ word: "" }).ok).toBe(false);
    expect(parseDictionaryMissBody({ word: "O" }).ok).toBe(false);
    expect(parseDictionaryMissBody({ word: "!!" }).ok).toBe(false);
  });
});

describe("mergeMissRecord", () => {
  it("starts a new open miss at count 1", () => {
    const rec = mergeMissRecord(null, { word: "resistest", query: "resistest", work: "confessions" }, "2026-10-13T00:00:00.000Z");
    expect(rec).toEqual({
      word: "resistest",
      query: "resistest",
      count: 1,
      firstAt: "2026-10-13T00:00:00.000Z",
      lastAt: "2026-10-13T00:00:00.000Z",
      work: "confessions",
      status: "open"
    });
  });

  it("bumps count and last seen on a repeat miss", () => {
    const prev: DictMissRecord = {
      word: "resistest",
      query: "resistest",
      count: 2,
      firstAt: "2026-10-13T00:00:00.000Z",
      lastAt: "2026-10-13T00:00:00.000Z",
      work: "confessions",
      status: "open"
    };
    const rec = mergeMissRecord(prev, { word: "resistest", query: "Resistest", work: "city-of-god" }, "2026-10-14T00:00:00.000Z");
    expect(rec.count).toBe(3);
    expect(rec.firstAt).toBe("2026-10-13T00:00:00.000Z");
    expect(rec.lastAt).toBe("2026-10-14T00:00:00.000Z");
    expect(rec.work).toBe("city-of-god");
    expect(rec.query).toBe("Resistest");
  });
});

describe("handleDictionaryMissSubmit", () => {
  it("stores one KV record per word and increments on repeat", async () => {
    const store: Record<string, string> = {};
    const kv = {
      get: async (key: string) => store[key] ?? null,
      put: async (key: string, value: string) => {
        store[key] = value;
      },
      list: async () => ({ keys: Object.keys(store).map((name) => ({ name })) })
    };

    const first = await handleDictionaryMissSubmit(
      { word: "resistest", work: "confessions" },
      { kv, now: "2026-10-13T00:00:00.000Z" }
    );
    expect(first.status).toBe(200);
    expect(first.json.ok).toBe(true);
    expect(first.json.count).toBe(1);
    expect(store[missKey("resistest")]).toContain('"count": 1');

    const second = await handleDictionaryMissSubmit(
      { word: "resistest", work: "confessions" },
      { kv, now: "2026-10-13T01:00:00.000Z" }
    );
    expect(second.json.count).toBe(2);
    expect(JSON.parse(store[missKey("resistest")]).count).toBe(2);
  });

  it("lists open misses for the bot, highest count first", async () => {
    const store: Record<string, string> = {};
    const kv = {
      get: async (key: string) => store[key] ?? null,
      put: async (key: string, value: string) => {
        store[key] = value;
      },
      list: async ({ prefix }: { prefix: string }) => ({
        keys: Object.keys(store)
          .filter((name) => name.startsWith(prefix))
          .map((name) => ({ name }))
      })
    };
    await handleDictionaryMissSubmit({ word: "resistest" }, { kv, now: "2026-10-13T00:00:00.000Z" });
    await handleDictionaryMissSubmit({ word: "resistest" }, { kv, now: "2026-10-13T01:00:00.000Z" });
    await handleDictionaryMissSubmit({ word: "wherefore" }, { kv, now: "2026-10-13T02:00:00.000Z" });

    const listed = await handleDictionaryMissList({ kv });
    expect(listed.status).toBe(200);
    const misses = listed.json.misses as Array<{ word: string; count: number }>;
    expect(misses.map((m) => m.word)).toEqual(["resistest", "wherefore"]);
    expect(misses[0].count).toBe(2);
  });
});
