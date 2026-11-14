import { isSyncedKey } from "../../server/syncKeys";
import { accountApiBase, getAccount, setAccount } from "./account";
import { mergeMarks } from "./markMerge";

/**
 * Copies a reader's marks between this browser and their account. Marks are always written to the
 * browser first, so the site works the same signed out or offline; this only carries them across.
 *
 * Each synced storage key is one doc on the server with a version. We remember the version we last
 * saw (`ver`) and which keys changed here since (`dirty`). A pull takes what changed on the server;
 * a push sends dirty keys, each naming the version it was made from, and merges on a conflict.
 */

type Meta = { since: number; ver: Record<string, number>; dirty: Record<string, true> };
type Doc = { key: string; value: string | null; updatedAt: number };
type WriteResult = { key: string; updatedAt?: number; conflict?: Doc; error?: string };

const META_KEY = "patrista-sync-v1";
const PUSH_DELAY_MS = 1500;
const BATCH = 50;

const markListeners = new Set<() => void>();
const remoteListeners = new Set<(key: string) => void>();

/** Called when the reader makes or changes a mark here (signed in or not). */
export function onMark(f: () => void): () => void {
  markListeners.add(f);
  return () => {
    markListeners.delete(f);
  };
}

/** Called when a key's value was replaced by one from the account, so in-memory copies can reload. */
export function onRemoteChange(f: (key: string) => void): () => void {
  remoteListeners.add(f);
  return () => {
    remoteListeners.delete(f);
  };
}

function loadMeta(): Meta {
  try {
    const raw = JSON.parse(localStorage.getItem(META_KEY) || "null") as Partial<Meta> | null;
    if (raw) return { since: Number(raw.since) || 0, ver: raw.ver || {}, dirty: raw.dirty || {} };
  } catch {
    /* start over */
  }
  return { since: 0, ver: {}, dirty: {} };
}

function saveMeta(meta: Meta): void {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    /* private window */
  }
}

function writeLocal(key: string, value: string | null): void {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* storage full or blocked */
  }
}

let pushTimer: number | undefined;

/** Every place that writes a synced key calls this afterwards. */
export function noteChange(key: string): void {
  if (typeof localStorage === "undefined" || !isSyncedKey(key)) return;
  if (getAccount()) {
    const meta = loadMeta();
    if (!meta.dirty[key]) {
      meta.dirty[key] = true;
      saveMeta(meta);
    }
    window.clearTimeout(pushTimer);
    pushTimer = window.setTimeout(() => void syncNow(), PUSH_DELAY_MS);
  }
  markListeners.forEach((f) => f());
}

async function api(method: string, path: string, body?: unknown): Promise<{ status: number; json: Record<string, unknown> }> {
  const account = getAccount();
  const res = await fetch(accountApiBase() + path, {
    method,
    headers: {
      ...(account ? { Authorization: "Bearer " + account.token } : {}),
      ...(body === undefined ? {} : { "Content-Type": "application/json" })
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  let json: Record<string, unknown> = {};
  try {
    json = (await res.json()) as Record<string, unknown>;
  } catch {
    /* no body */
  }
  return { status: res.status, json };
}

/** Take one doc from the account: replace ours, or merge if ours changed too. */
function applyRemote(meta: Meta, doc: Doc): void {
  if (!isSyncedKey(doc.key) || meta.ver[doc.key] === doc.updatedAt) return;
  const local = localStorage.getItem(doc.key);
  let next = doc.value;
  if (meta.dirty[doc.key]) {
    next = mergeMarks(doc.key, local, doc.value);
    if (next === doc.value) delete meta.dirty[doc.key];
  }
  meta.ver[doc.key] = doc.updatedAt;
  if (next !== local) {
    writeLocal(doc.key, next);
    remoteListeners.forEach((f) => f(doc.key));
  }
}

async function runSync(): Promise<void> {
  if (!getAccount()) return;
  const meta = loadMeta();

  const pulled = await api("GET", "/api/account/docs?since=" + meta.since);
  if (pulled.status === 401) {
    // The session ended (expired, or the account was deleted elsewhere). Marks stay in this browser.
    setAccount(null);
    localStorage.removeItem(META_KEY);
    return;
  }
  if (pulled.status !== 200) return;
  for (const doc of (pulled.json.docs as Doc[]) || []) applyRemote(meta, doc);
  meta.since = Number(pulled.json.now) || meta.since;
  saveMeta(meta);

  for (let round = 0; round < 3; round++) {
    const keys = Object.keys(meta.dirty);
    if (!keys.length) break;
    for (let i = 0; i < keys.length; i += BATCH) {
      const sent = keys.slice(i, i + BATCH).map((key) => ({ key, value: localStorage.getItem(key), base: meta.ver[key] || 0 }));
      const pushed = await api("PUT", "/api/account/docs", { docs: sent });
      if (pushed.status !== 200) return;
      for (const result of (pushed.json.results as WriteResult[]) || []) {
        const was = sent.find((d) => d.key === result.key);
        if (result.conflict) applyRemote(meta, result.conflict);
        else if (typeof result.updatedAt === "number") {
          meta.ver[result.key] = result.updatedAt;
          // Changed again while this was in flight: leave it dirty for the next round.
          if (was && localStorage.getItem(result.key) === was.value) delete meta.dirty[result.key];
        } else delete meta.dirty[result.key]; // refused (too large, account full): do not retry forever
      }
      saveMeta(meta);
    }
  }
}

let running: Promise<void> | null = null;
let again = false;

/** Pull, then push. Safe to call often; calls made while one is running are folded into one more. */
export function syncNow(): Promise<void> {
  if (typeof localStorage === "undefined" || !getAccount()) return Promise.resolve();
  if (running) {
    again = true;
    return running;
  }
  running = runSync()
    .catch(() => {
      /* offline: marks stay dirty and go next time */
    })
    .finally(() => {
      running = null;
      if (again) {
        again = false;
        void syncNow();
      }
    });
  return running;
}

/** Finish a Google sign-in: open a session, then send every mark already in this browser. */
export async function signInWithGoogle(credential: string): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  let res: { status: number; json: Record<string, unknown> };
  try {
    res = await api("POST", "/api/account/google", { credential });
  } catch {
    return { ok: false, error: "Could not reach Patrista. Check your connection and try again." };
  }
  const token = typeof res.json.token === "string" ? res.json.token : "";
  const email = typeof res.json.email === "string" ? res.json.email : "";
  if (res.status !== 200 || !token) {
    return { ok: false, error: typeof res.json.error === "string" ? res.json.error : "Sign-in did not work. Please try again." };
  }
  const meta: Meta = { since: 0, ver: {}, dirty: {} };
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i) || "";
    if (isSyncedKey(key)) meta.dirty[key] = true;
  }
  saveMeta(meta);
  setAccount({ token, email });
  await syncNow();
  return { ok: true, email };
}

/** Sign out of this browser. The marks made here stay here. */
export async function signOut(): Promise<void> {
  window.clearTimeout(pushTimer);
  try {
    await syncNow();
    await api("POST", "/api/account/signout");
  } catch {
    /* offline: the session simply expires */
  }
  setAccount(null);
  try {
    localStorage.removeItem(META_KEY);
  } catch {
    /* private window */
  }
}

/**
 * Delete the account and everything kept in it. Marks stay in this browser, as they were before
 * signing in. False if the server could not be reached, in which case nothing has changed.
 */
export async function deleteAccount(): Promise<boolean> {
  window.clearTimeout(pushTimer);
  try {
    const res = await api("DELETE", "/api/account");
    if (res.status !== 200) return false;
  } catch {
    return false;
  }
  setAccount(null);
  try {
    localStorage.removeItem(META_KEY);
  } catch {
    /* private window */
  }
  return true;
}

/** Keep in step while the site is open: on load, on returning to the tab, on coming back online. */
export function startAccountSync(): () => void {
  void syncNow();
  const onVisible = () => {
    if (document.visibilityState === "visible") void syncNow();
  };
  const onOnline = () => void syncNow();
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("online", onOnline);
  return () => {
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("online", onOnline);
  };
}
