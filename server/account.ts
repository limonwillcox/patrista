import { isSyncedKey } from "./syncKeys";

/**
 * Reader accounts on the API worker: sign in with Google, then keep highlights and notes in D1.
 * Signing in is optional. The site saves marks in the browser first and copies them here.
 * The browser holds a session token and sends it as "Authorization: Bearer"; no cookies.
 */

export interface AccountD1Prepared {
  bind(...values: unknown[]): AccountD1Prepared;
  all<T = Record<string, unknown>>(): Promise<{ results?: T[] }>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<unknown>;
}

export interface AccountD1Database {
  prepare(query: string): AccountD1Prepared;
}

export type AccountEnv = {
  ACCOUNT_DB?: AccountD1Database;
  GOOGLE_CLIENT_ID?: string;
  DONATE_PUBLIC_ORIGIN?: string;
};

export const SESSION_DAYS = 180;
export const DOC_VALUE_MAX = 256_000;
export const DOCS_PER_REQUEST = 100;
export const DOCS_PER_USER = 5000;
/** Pulls ask for changes since a moment slightly in the past, so a write in the same instant is not missed. */
const PULL_MARGIN_MS = 5000;

export type DocRow = { key: string; value: string | null; updatedAt: number };
export type DocWrite = { key: string; value: string | null; base: number };
export type DocWriteResult = { key: string; updatedAt: number } | { key: string; conflict: DocRow } | { key: string; error: string };

export function isAccountPath(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  return path === "/api/account" || path.startsWith("/api/account/");
}

/** The site's own origins and local development may call the account API. */
export function accountCorsOrigin(requestOrigin: string | null, publicOrigin: string | undefined): string {
  const site = (publicOrigin || "https://patrista.com").replace(/\/+$/, "");
  if (!requestOrigin) return site;
  if (requestOrigin === site || requestOrigin === site.replace("://", "://www.")) return requestOrigin;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(requestOrigin)) return requestOrigin;
  return site;
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin"
  };
}

/* ---------- Google sign-in ---------- */

type Jwk = { kid?: string; kty?: string; n?: string; e?: string; alg?: string };
type FetchLike = (url: string) => Promise<{ ok: boolean; json(): Promise<unknown> }>;

const GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs";
let certCache: { at: number; keys: Jwk[] } | null = null;

function b64urlBytes(s: string): Uint8Array<ArrayBuffer> {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(pad);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function b64urlJson(s: string): Record<string, unknown> | null {
  try {
    return JSON.parse(new TextDecoder().decode(b64urlBytes(s))) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function googleKeys(fetcher: FetchLike, now: number, refresh: boolean): Promise<Jwk[]> {
  if (!refresh && certCache && now - certCache.at < 3_600_000) return certCache.keys;
  const res = await fetcher(GOOGLE_CERTS_URL);
  if (!res.ok) return certCache?.keys || [];
  const body = (await res.json()) as { keys?: Jwk[] };
  certCache = { at: now, keys: body.keys || [] };
  return certCache.keys;
}

/**
 * Check a Google ID token: signed by Google, made for this site, not expired, email verified.
 * Returns the account's permanent id and email, or null.
 */
export async function verifyGoogleIdToken(
  token: string,
  clientId: string,
  opts: { fetch?: FetchLike; now?: number } = {}
): Promise<{ sub: string; email: string } | null> {
  const parts = String(token || "").split(".");
  if (parts.length !== 3 || !clientId) return null;
  const header = b64urlJson(parts[0]);
  const claims = b64urlJson(parts[1]);
  if (!header || !claims || header.alg !== "RS256" || typeof header.kid !== "string") return null;

  const now = opts.now ?? Date.now();
  const fetcher: FetchLike = opts.fetch || ((url) => fetch(url));
  let key = (await googleKeys(fetcher, now, false)).find((k) => k.kid === header.kid);
  if (!key) key = (await googleKeys(fetcher, now, true)).find((k) => k.kid === header.kid);
  if (!key) return null;

  let valid = false;
  try {
    const cryptoKey = await crypto.subtle.importKey(
      "jwk",
      { kty: "RSA", n: key.n, e: key.e, alg: "RS256", ext: true },
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"]
    );
    valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      b64urlBytes(parts[2]),
      new TextEncoder().encode(parts[0] + "." + parts[1])
    );
  } catch {
    valid = false;
  }
  if (!valid) return null;

  const iss = claims.iss;
  if (iss !== "accounts.google.com" && iss !== "https://accounts.google.com") return null;
  if (claims.aud !== clientId) return null;
  if (typeof claims.exp !== "number" || claims.exp * 1000 <= now) return null;
  if (claims.email_verified !== true && claims.email_verified !== "true") return null;
  const sub = typeof claims.sub === "string" ? claims.sub : "";
  const email = typeof claims.email === "string" ? claims.email : "";
  if (!sub || !email) return null;
  return { sub, email };
}

/* ---------- sessions ---------- */

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

function newToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function createSession(db: AccountD1Database, user: { sub: string; email: string }, now = Date.now()): Promise<string> {
  await db
    .prepare("INSERT INTO users (sub, email, created_at) VALUES (?, ?, ?) ON CONFLICT(sub) DO UPDATE SET email = excluded.email")
    .bind(user.sub, user.email, now)
    .run();
  await db.prepare("DELETE FROM sessions WHERE expires_at < ?").bind(now).run();
  const token = newToken();
  await db
    .prepare("INSERT INTO sessions (token_hash, sub, created_at, expires_at) VALUES (?, ?, ?, ?)")
    .bind(await sha256Hex(token), user.sub, now, now + SESSION_DAYS * 86_400_000)
    .run();
  return token;
}

export async function sessionUser(db: AccountD1Database, token: string, now = Date.now()): Promise<string | null> {
  if (!token) return null;
  const row = await db
    .prepare("SELECT sub FROM sessions WHERE token_hash = ? AND expires_at > ?")
    .bind(await sha256Hex(token), now)
    .first<{ sub: string }>();
  return row?.sub || null;
}

/* ---------- docs ---------- */

export async function readDocs(db: AccountD1Database, sub: string, since: number): Promise<DocRow[]> {
  const res = await db
    .prepare("SELECT key, value, updated_at FROM docs WHERE sub = ? AND updated_at > ? ORDER BY updated_at")
    .bind(sub, since)
    .all<{ key: string; value: string | null; updated_at: number }>();
  return (res.results || []).map((r) => ({ key: r.key, value: r.value, updatedAt: r.updated_at }));
}

export function parseDocWrites(body: unknown): { ok: true; docs: DocWrite[] } | { ok: false; error: string } {
  const list = (body as { docs?: unknown } | null)?.docs;
  if (!Array.isArray(list)) return { ok: false, error: "Missing docs" };
  if (list.length > DOCS_PER_REQUEST) return { ok: false, error: "Too many docs in one request" };
  const docs: DocWrite[] = [];
  for (const item of list) {
    const rec = (item || {}) as Record<string, unknown>;
    const key = typeof rec.key === "string" ? rec.key : "";
    if (!isSyncedKey(key)) return { ok: false, error: "Unknown key" };
    const value = rec.value == null ? null : rec.value;
    if (value !== null && typeof value !== "string") return { ok: false, error: "Value must be text" };
    if (value !== null && value.length > DOC_VALUE_MAX) return { ok: false, error: "Value is too large" };
    const base = typeof rec.base === "number" && Number.isFinite(rec.base) ? rec.base : 0;
    docs.push({ key, value, base });
  }
  return { ok: true, docs };
}

/**
 * Write docs. Each write names the version it was made from (`base`); if the stored doc has moved on,
 * nothing is written and the stored doc comes back as a conflict for the browser to merge.
 */
export async function writeDocs(db: AccountD1Database, sub: string, docs: DocWrite[], now = Date.now()): Promise<DocWriteResult[]> {
  const count = await db.prepare("SELECT COUNT(*) AS n FROM docs WHERE sub = ?").bind(sub).first<{ n: number }>();
  const full = (count?.n || 0) + docs.length > DOCS_PER_USER;
  const out: DocWriteResult[] = [];
  for (const doc of docs) {
    if (full) {
      const exists = await db.prepare("SELECT 1 AS x FROM docs WHERE sub = ? AND key = ?").bind(sub, doc.key).first();
      if (!exists) {
        out.push({ key: doc.key, error: "Account is full" });
        continue;
      }
    }
    const written = await db
      .prepare(
        "INSERT INTO docs (sub, key, value, updated_at) VALUES (?, ?, ?, ?) " +
          "ON CONFLICT(sub, key) DO UPDATE SET value = excluded.value, updated_at = MAX(excluded.updated_at, docs.updated_at + 1) " +
          "WHERE docs.updated_at = ? RETURNING updated_at"
      )
      .bind(sub, doc.key, doc.value, now, doc.base)
      .first<{ updated_at: number }>();
    if (written) {
      out.push({ key: doc.key, updatedAt: written.updated_at });
      continue;
    }
    const current = await db
      .prepare("SELECT key, value, updated_at FROM docs WHERE sub = ? AND key = ?")
      .bind(sub, doc.key)
      .first<{ key: string; value: string | null; updated_at: number }>();
    if (current) out.push({ key: doc.key, conflict: { key: current.key, value: current.value, updatedAt: current.updated_at } });
    else out.push({ key: doc.key, error: "Could not save" });
  }
  return out;
}

export async function deleteAccount(db: AccountD1Database, sub: string): Promise<void> {
  await db.prepare("DELETE FROM docs WHERE sub = ?").bind(sub).run();
  await db.prepare("DELETE FROM sessions WHERE sub = ?").bind(sub).run();
  await db.prepare("DELETE FROM users WHERE sub = ?").bind(sub).run();
}

/* ---------- worker routes ---------- */

export type AccountFetchOptions = {
  now?: number;
  verifyGoogle?: (credential: string, clientId: string) => Promise<{ sub: string; email: string } | null>;
};

export async function handleAccountFetch(request: Request, env: AccountEnv = {}, opts: AccountFetchOptions = {}): Promise<Response | null> {
  const url = new URL(request.url);
  if (!isAccountPath(url.pathname)) return null;
  const path = url.pathname.replace(/\/+$/, "");
  const cors = corsHeaders(accountCorsOrigin(request.headers.get("origin"), env.DONATE_PUBLIC_ORIGIN));
  const json = (status: number, body: Record<string, unknown>) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...cors }
    });

  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  const db = env.ACCOUNT_DB;
  if (!db || !env.GOOGLE_CLIENT_ID) return json(503, { error: "Accounts are not connected yet." });
  const now = opts.now ?? Date.now();

  async function body(): Promise<unknown> {
    try {
      return await request.json();
    } catch {
      return null;
    }
  }

  if (path === "/api/account/google") {
    if (request.method !== "POST") return json(405, { error: "Method not allowed" });
    const credential = String(((await body()) as { credential?: unknown } | null)?.credential || "");
    const verify = opts.verifyGoogle || ((c: string, id: string) => verifyGoogleIdToken(c, id, { now }));
    const user = await verify(credential, env.GOOGLE_CLIENT_ID);
    if (!user) return json(401, { error: "Google sign-in could not be confirmed." });
    const token = await createSession(db, user, now);
    return json(200, { token, email: user.email });
  }

  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const sub = await sessionUser(db, token, now);
  if (!sub) return json(401, { error: "Not signed in" });

  if (path === "/api/account/signout") {
    if (request.method !== "POST") return json(405, { error: "Method not allowed" });
    await db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256Hex(token)).run();
    return json(200, { ok: true });
  }

  if (path === "/api/account/docs") {
    if (request.method === "GET") {
      const since = Number(url.searchParams.get("since")) || 0;
      const docs = await readDocs(db, sub, since);
      return json(200, { docs, now: now - PULL_MARGIN_MS });
    }
    if (request.method === "PUT") {
      const parsed = parseDocWrites(await body());
      if (!parsed.ok) return json(400, { error: parsed.error });
      return json(200, { results: await writeDocs(db, sub, parsed.docs, now) });
    }
    return json(405, { error: "Method not allowed" });
  }

  if (path === "/api/account") {
    if (request.method !== "DELETE") return json(405, { error: "Method not allowed" });
    await deleteAccount(db, sub);
    return json(200, { ok: true });
  }

  return json(404, { error: "Not found" });
}
