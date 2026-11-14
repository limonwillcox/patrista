import { useEffect, useState } from "react";

/**
 * Who is signed in on this browser, if anyone. Signing in is optional: marks are saved in the
 * browser either way, and an account only copies them somewhere they cannot be lost.
 */

export type Account = { token: string; email: string };

const KEY = "patrista-account-v1";
const listeners = new Set<() => void>();
let cache: Account | null | undefined;

/** The Google client ID the site was built with. Empty: sign-in is not offered at all. */
export const GOOGLE_CLIENT_ID: string = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
export const accountsEnabled = Boolean(GOOGLE_CLIENT_ID);

export function accountApiBase(): string {
  return String(import.meta.env.VITE_DONATE_API_BASE || "").replace(/\/+$/, "");
}

export function getAccount(): Account | null {
  if (cache !== undefined) return cache;
  cache = null;
  if (typeof localStorage === "undefined") return cache;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null") as Partial<Account> | null;
    if (raw && typeof raw.token === "string" && typeof raw.email === "string") cache = { token: raw.token, email: raw.email };
  } catch {
    /* unreadable: signed out */
  }
  return cache;
}

export function setAccount(account: Account | null): void {
  cache = account;
  try {
    if (account) localStorage.setItem(KEY, JSON.stringify(account));
    else localStorage.removeItem(KEY);
  } catch {
    /* private window: signed in for this visit only */
  }
  listeners.forEach((f) => f());
}

export function useAccount(): Account | null {
  const [, rerender] = useState(0);
  useEffect(() => {
    const f = () => rerender((x) => x + 1);
    listeners.add(f);
    return () => {
      listeners.delete(f);
    };
  }, []);
  return getAccount();
}
