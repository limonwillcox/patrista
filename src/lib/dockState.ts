type Store = Pick<Storage, "getItem" | "setItem">;

const KEY = "patrista.dock.";

/** Docks are open unless the reader closed them. */
export function readDockOpen(id: string, store: Store | null = safeStorage()): boolean {
  return store?.getItem(KEY + id) !== "closed";
}

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
