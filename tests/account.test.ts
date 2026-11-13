import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { beforeEach, describe, expect, it } from "vitest";
import {
  accountCorsOrigin,
  handleAccountFetch,
  parseDocWrites,
  verifyGoogleIdToken,
  type AccountD1Database,
  type AccountD1Prepared,
  type AccountEnv
} from "../server/account";
import { isSyncedKey } from "../server/syncKeys";

/** D1's interface over an in-memory SQLite database, so the real SQL runs. */
function fakeD1(): AccountD1Database {
  const db = new DatabaseSync(":memory:");
  db.exec(readFileSync("data/account/schema.sql", "utf8"));
  return {
    prepare(query: string) {
      let args: unknown[] = [];
      const p: AccountD1Prepared = {
        bind(...values: unknown[]) {
          args = values;
          return p;
        },
        async all<T>() {
          return { results: db.prepare(query).all(...(args as never[])) as T[] };
        },
        async first<T>() {
          return ((db.prepare(query).get(...(args as never[])) as T | undefined) ?? null) as T | null;
        },
        async run() {
          db.prepare(query).run(...(args as never[]));
        }
      };
      return p;
    }
  };
}

const CLIENT = "client-id.apps.googleusercontent.com";
let env: AccountEnv;
const people: Record<string, { sub: string; email: string }> = {
  ada: { sub: "1", email: "ada@example.com" },
  bob: { sub: "2", email: "bob@example.com" }
};
const verifyGoogle = async (credential: string) => people[credential] || null;

async function call(method: string, path: string, opts: { token?: string; body?: unknown; now?: number } = {}) {
  const res = await handleAccountFetch(
    new Request("https://api.example" + path, {
      method,
      headers: { ...(opts.token ? { authorization: "Bearer " + opts.token } : {}), "content-type": "application/json" },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body)
    }),
    env,
    { verifyGoogle, now: opts.now }
  );
  if (!res) throw new Error("not an account path");
  return { status: res.status, json: (await res.json()) as Record<string, any> };
}

async function signIn(who: string): Promise<string> {
  return (await call("POST", "/api/account/google", { body: { credential: who } })).json.token as string;
}

beforeEach(() => {
  env = { ACCOUNT_DB: fakeD1(), GOOGLE_CLIENT_ID: CLIENT, DONATE_PUBLIC_ORIGIN: "https://patrista.com" };
});

describe("synced keys", () => {
  it("accepts marks and nothing else", () => {
    expect(isSyncedKey("patrista-bible-highlights-v1")).toBe(true);
    expect(isSyncedKey("fg-note-confessions")).toBe(true);
    expect(isSyncedKey("fg-hl-confessions")).toBe(true);
    expect(isSyncedKey("fg-note-")).toBe(false);
    expect(isSyncedKey("patrista-account-v1")).toBe(false);
    expect(isSyncedKey("fg-note-" + "x".repeat(300))).toBe(false);
  });
  it("rejects writes to other keys and oversized values", () => {
    expect(parseDocWrites({ docs: [{ key: "theme", value: "night" }] }).ok).toBe(false);
    expect(parseDocWrites({ docs: [{ key: "fg-note-a", value: "x".repeat(300_000) }] }).ok).toBe(false);
    expect(parseDocWrites({ docs: [{ key: "fg-note-a", value: null, base: 3 }] })).toEqual({
      ok: true,
      docs: [{ key: "fg-note-a", value: null, base: 3 }]
    });
  });
});

describe("account API", () => {
  it("is off until the database and client id are set", async () => {
    env = {};
    expect((await call("GET", "/api/account/docs")).status).toBe(503);
  });

  it("ignores other paths", async () => {
    expect(await handleAccountFetch(new Request("https://api.example/api/fixes"), env)).toBeNull();
  });

  it("needs a session for everything but sign-in", async () => {
    expect((await call("GET", "/api/account/docs")).status).toBe(401);
    expect((await call("GET", "/api/account/docs", { token: "made-up" })).status).toBe(401);
    expect((await call("POST", "/api/account/google", { body: { credential: "stranger" } })).status).toBe(401);
  });

  it("saves docs and returns only what changed since", async () => {
    const token = await signIn("ada");
    const put = await call("PUT", "/api/account/docs", {
      token,
      now: 1000,
      body: { docs: [{ key: "fg-note-a", value: "one", base: 0 }, { key: "fg-note-b", value: "two", base: 0 }] }
    });
    expect(put.json.results).toEqual([{ key: "fg-note-a", updatedAt: 1000 }, { key: "fg-note-b", updatedAt: 1000 }]);

    await call("PUT", "/api/account/docs", { token, now: 2000, body: { docs: [{ key: "fg-note-b", value: null, base: 1000 }] } });
    const all = await call("GET", "/api/account/docs", { token, now: 9000 });
    expect(all.json.docs).toEqual([
      { key: "fg-note-a", value: "one", updatedAt: 1000 },
      { key: "fg-note-b", value: null, updatedAt: 2000 }
    ]);
    expect(all.json.now).toBe(4000);
    const later = await call("GET", "/api/account/docs?since=1000", { token });
    expect(later.json.docs.map((d: { key: string }) => d.key)).toEqual(["fg-note-b"]);
  });

  it("refuses a write made from an old version and hands back the stored doc", async () => {
    const token = await signIn("ada");
    await call("PUT", "/api/account/docs", { token, now: 1000, body: { docs: [{ key: "fg-note-a", value: "phone", base: 0 }] } });
    const stale = await call("PUT", "/api/account/docs", { token, now: 2000, body: { docs: [{ key: "fg-note-a", value: "laptop", base: 0 }] } });
    expect(stale.json.results).toEqual([{ key: "fg-note-a", conflict: { key: "fg-note-a", value: "phone", updatedAt: 1000 } }]);
    // The version always moves forward, even if the clock does not.
    const ok = await call("PUT", "/api/account/docs", { token, now: 500, body: { docs: [{ key: "fg-note-a", value: "merged", base: 1000 }] } });
    expect(ok.json.results).toEqual([{ key: "fg-note-a", updatedAt: 1001 }]);
  });

  it("keeps each person's docs apart", async () => {
    const ada = await signIn("ada");
    const bob = await signIn("bob");
    await call("PUT", "/api/account/docs", { token: ada, body: { docs: [{ key: "fg-note-a", value: "ada's", base: 0 }] } });
    expect((await call("GET", "/api/account/docs", { token: bob })).json.docs).toEqual([]);
  });

  it("signs out one browser and deletes an account entirely", async () => {
    const phone = await signIn("ada");
    const laptop = await signIn("ada");
    await call("PUT", "/api/account/docs", { token: phone, body: { docs: [{ key: "fg-note-a", value: "x", base: 0 }] } });
    expect((await call("POST", "/api/account/signout", { token: phone })).status).toBe(200);
    expect((await call("GET", "/api/account/docs", { token: phone })).status).toBe(401);
    expect((await call("GET", "/api/account/docs", { token: laptop })).json.docs).toHaveLength(1);

    expect((await call("DELETE", "/api/account", { token: laptop })).status).toBe(200);
    expect((await call("GET", "/api/account/docs", { token: laptop })).status).toBe(401);
    expect((await call("GET", "/api/account/docs", { token: await signIn("ada") })).json.docs).toEqual([]);
  });

  it("expires sessions", async () => {
    const token = await signIn("ada");
    const farFuture = Date.now() + 200 * 86_400_000;
    expect((await call("GET", "/api/account/docs", { token, now: farFuture })).status).toBe(401);
  });

  it("answers the site's origins and local development only", () => {
    expect(accountCorsOrigin("https://www.patrista.com", "https://patrista.com")).toBe("https://www.patrista.com");
    expect(accountCorsOrigin("http://localhost:5173", "https://patrista.com")).toBe("http://localhost:5173");
    expect(accountCorsOrigin("https://evil.example", "https://patrista.com")).toBe("https://patrista.com");
  });
});

describe("verifyGoogleIdToken", () => {
  const b64 = (data: Uint8Array | string) =>
    Buffer.from(typeof data === "string" ? new TextEncoder().encode(data) : data).toString("base64url");

  async function setup() {
    const pair = await crypto.subtle.generateKey(
      { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
      true,
      ["sign", "verify"]
    );
    const jwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
    const kid = "kid-" + Math.random();
    const fetchCerts = async () => ({ ok: true, json: async () => ({ keys: [{ ...jwk, kid }] }) });
    async function token(claims: Record<string, unknown>, signer = pair.privateKey) {
      const head = b64(JSON.stringify({ alg: "RS256", kid })) + "." + b64(JSON.stringify(claims));
      const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", signer, new TextEncoder().encode(head));
      return head + "." + b64(new Uint8Array(sig));
    }
    return { token, fetchCerts, pair };
  }
  const good = { iss: "https://accounts.google.com", aud: CLIENT, exp: 2000, sub: "42", email: "ada@example.com", email_verified: true };

  it("accepts a token Google signed for this site", async () => {
    const { token, fetchCerts } = await setup();
    expect(await verifyGoogleIdToken(await token(good), CLIENT, { fetch: fetchCerts, now: 1_000_000 })).toEqual({
      sub: "42",
      email: "ada@example.com"
    });
  });

  it("rejects another site's token, an expired one, a wrong issuer and a forged signature", async () => {
    const { token, fetchCerts } = await setup();
    const check = async (t: string) => verifyGoogleIdToken(t, CLIENT, { fetch: fetchCerts, now: 1_000_000 });
    expect(await check(await token({ ...good, aud: "someone-else" }))).toBeNull();
    expect(await check(await token({ ...good, exp: 999 }))).toBeNull();
    expect(await check(await token({ ...good, iss: "https://evil.example" }))).toBeNull();
    expect(await check(await token({ ...good, email_verified: false }))).toBeNull();
    const other = await setup();
    expect(await check(await token(good, other.pair.privateKey))).toBeNull();
    expect(await check("not.a.token")).toBeNull();
  });
});
