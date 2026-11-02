type Store = Pick<Storage, "getItem" | "setItem">;

const KEY = "patrista.dock.";

/** The reader's own choice wins; with none stored, docks start open (or closed, on narrow screens). */
export function readDockOpen(id: string, store: Store | null = safeStorage(), fallback = true): boolean {
  const saved = store?.getItem(KEY + id);
  if (saved === "closed") return false;
  if (saved === "open") return true;
  return fallback;
}

/** Below this width an open dock would cover the text, so docks start closed. */
export const DOCKS_OPEN_MIN_WIDTH = 900;

export function writeDockOpen(id: string, open: boolean, store: Store | null = safeStorage()): void {
  try {
    store?.setItem(KEY + id, open ? "open" : "closed");
  } catch {
    /* storage full or blocked */
  }
}

function safeStorage(): Store | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}
