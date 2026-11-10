import { useSyncExternalStore } from "react";

export const SCHOLARS_UI_KEY = "fg-fathers-ui";
const SCHOLARS_UI_EVENT = "fg-fathers-ui";

export function loadScholarsUi(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(SCHOLARS_UI_KEY) === "scholars";
}

export function saveScholarsUi(on: boolean): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(SCHOLARS_UI_KEY, on ? "scholars" : "directory");
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SCHOLARS_UI_EVENT));
  }
}

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(SCHOLARS_UI_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(SCHOLARS_UI_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function useScholarsUi(): readonly [boolean, (on: boolean) => void] {
  const on = useSyncExternalStore(subscribe, loadScholarsUi, () => false);
  return [on, saveScholarsUi];
}
