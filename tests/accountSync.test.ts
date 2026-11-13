import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleAccountFetch, type AccountD1Database, type AccountD1Prepared, type AccountEnv } from "../server/account";

/** The site's sync code talking to the real account API over an in-memory database: two browsers, one account. */

function fakeD1(): AccountD1Database {
  const db = new DatabaseSync(":memory:");
  db.exec(readFileSync("data/account/schema.sql", "utf8"));
  return {
    prepare(query: string) {
      let args: unknown[] = [];
      const p: AccountD1Prepared = {
        bind: (...values: unknown[]) => ((args = values), p),
        all: async <T>() => ({ results: db.prepare(query).all(...(args as never[])) as T[] }),
        first: async <T>() => ((db.prepare(query).get(...(args as never[])) as T | undefined) ?? null) as T | null,
        run: async () => void db.prepare(query).run(...(args as never[]))
      };
      return p;
    }
  };
}

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    key: (i: number) => [...map.keys()][i] ?? null,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear()
  };
}

let env: AccountEnv;
let clock = 1000;
let online = true;

/** One browser: its own storage and its own fresh copy of the site's modules. */
async function browser(store = memoryStorage()) {
  vi.stubGlobal("localStorage", store);
  vi.resetModules();
  const sync = await import("../src/lib/accountSync");
  const account = await import("../src/lib/account");
  return { store, sync, account };
}

beforeEach(() => {
  env = { ACCOUNT_DB: fakeD1(), GOOGLE_CLIENT_ID: "client", DONATE_PUBLIC_ORIGIN: "https://patrista.com" };
  clock = 1000;
  online = true;
  vi.stubGlobal("window", { setTimeout: () => 0, clearTimeout: () => undefined });
  vi.stubGlobal("fetch", async (path: string, init?: RequestInit) => {
    if (!online) throw new Error("offline");
    clock += 10_000;
    const res = await handleAccountFetch(new Request("https://api.example" + path, init), env, {
      now: clock,
      verifyGoogle: async (credential) => ({ sub: credential, email: credential + "@example.com" })
    });
    return res as Response;
  });
});
afterEach(() => vi.unstubAllGlobals());

const HL = "patrista-bible-highlights-v1";
const note = (html: string) => JSON.stringify({ v: 1, html });

describe("account sync", () => {
  it("sends what was already in the browser at sign-in, and unites two devices", async () => {
    const phoneStore = memoryStorage();
    phoneStore.setItem(HL, JSON.stringify({ "gen.1.1": "gold" }));
    phoneStore.setItem("fg-note-confessions", note("restless"));
    phoneStore.setItem("theme", "night");
    const phone = await browser(phoneStore);
    expect(await phone.sync.signInWithGoogle("ada")).toEqual({ ok: true, email: "ada@example.com" });

    const laptopStore = memoryStorage();
    laptopStore.setItem(HL, JSON.stringify({ "jhn.1.1": "blue" }));
    const laptop = await browser(laptopStore);
    await laptop.sync.signInWithGoogle("ada");
    expect(JSON.parse(laptopStore.getItem(HL)!)).toEqual({ "gen.1.1": "gold", "jhn.1.1": "blue" });
    expect(laptopStore.getItem("fg-note-confessions")).toBe(note("restless"));
    expect(laptopStore.getItem("theme")).toBeNull();

    const phoneAgain = await browser(phoneStore);
    const changed: string[] = [];
    phoneAgain.sync.onRemoteChange((key) => changed.push(key));
    await phoneAgain.sync.syncNow();
    expect(JSON.parse(phoneStore.getItem(HL)!)).toEqual({ "gen.1.1": "gold", "jhn.1.1": "blue" });
    expect(changed).toEqual([HL]);
  });

  it("carries a later change and a deletion to the other device", async () => {
    const phone = await browser();
    await phone.sync.signInWithGoogle("ada");
    const laptopStore = memoryStorage();
    await (await browser(laptopStore)).sync.signInWithGoogle("ada");

    const p = await browser(phone.store);
    phone.store.setItem("fg-note-a", note("first"));
    p.sync.noteChange("fg-note-a");
    await p.sync.syncNow();
    let l = await browser(laptopStore);
    await l.sync.syncNow();
    expect(laptopStore.getItem("fg-note-a")).toBe(note("first"));

    laptopStore.removeItem("fg-note-a");
    l.sync.noteChange("fg-note-a");
    await l.sync.syncNow();
    const p2 = await browser(phone.store);
    await p2.sync.syncNow();
    expect(phone.store.getItem("fg-note-a")).toBeNull();
  });

  it("joins a note edited on two devices while one was offline", async () => {
    const phone = await browser();
    await phone.sync.signInWithGoogle("ada");
    const laptopStore = memoryStorage();
    await (await browser(laptopStore)).sync.signInWithGoogle("ada");

    online = false;
    const l = await browser(laptopStore);
    laptopStore.setItem("fg-note-a", note("from laptop"));
    l.sync.noteChange("fg-note-a");
    await l.sync.syncNow();

    online = true;
    const p = await browser(phone.store);
    phone.store.setItem("fg-note-a", note("from phone"));
    p.sync.noteChange("fg-note-a");
    await p.sync.syncNow();

    const l2 = await browser(laptopStore);
    await l2.sync.syncNow();
    expect(laptopStore.getItem("fg-note-a")).toBe(note("from phone<br>from laptop"));
    const p2 = await browser(phone.store);
    await p2.sync.syncNow();
    expect(phone.store.getItem("fg-note-a")).toBe(note("from phone<br>from laptop"));
  });

  it("does not track or send anything while signed out", async () => {
    const b = await browser();
    let marks = 0;
    b.sync.onMark(() => marks++);
    b.store.setItem(HL, JSON.stringify({ "gen.1.1": "gold" }));
    b.sync.noteChange(HL);
    await b.sync.syncNow();
    expect(marks).toBe(1);
    expect(b.store.getItem("patrista-sync-v1")).toBeNull();
  });

  it("keeps the marks on the device after signing out, and when a session has ended", async () => {
    const b = await browser();
    b.store.setItem(HL, JSON.stringify({ "gen.1.1": "gold" }));
    await b.sync.signInWithGoogle("ada");
    await b.sync.signOut();
    expect(b.account.getAccount()).toBeNull();
    expect(b.store.getItem(HL)).toBe(JSON.stringify({ "gen.1.1": "gold" }));

    const again = await browser(b.store);
    await again.sync.signInWithGoogle("ada");
    clock += 400 * 86_400_000;
    await again.sync.syncNow();
    expect(again.account.getAccount()).toBeNull();
    expect(b.store.getItem(HL)).toBe(JSON.stringify({ "gen.1.1": "gold" }));
  });
});
