export type LangMode = "translation" | "original";
export type Theme = "day" | "night";
export type ReadOptId = "nums" | "head" | "fn";

const OPT_DEFAULT: Record<ReadOptId, boolean> = {
  nums: true,
  head: true,
  // Notes start off so Read opens as a clean column.
  fn: false
};

export function storedOpt(id: ReadOptId, fallback = OPT_DEFAULT[id]): boolean {
  const v = localStorage.getItem("fg-opt-" + id);
  if (v == null) return fallback;
  return v !== "off";
}

export function setStoredOpt(id: ReadOptId, on: boolean): void {
  localStorage.setItem("fg-opt-" + id, on ? "on" : "off");
}

export function storedMode(): LangMode {
  return localStorage.getItem("fg-mode") === "original" ? "original" : "translation";
}

export function setStoredMode(mode: LangMode): void {
  localStorage.setItem("fg-mode", mode);
}

export function storedVersion(): string {
  return localStorage.getItem("fg-version") || "";
}

export function setStoredVersion(id: string): void {
  if (id) localStorage.setItem("fg-version", id);
}

export function storedParallel(): boolean {
  // Split off by default; only on when the user has explicitly enabled it.
  return localStorage.getItem("fg-orig-parallel") === "on";
}

export function setStoredParallel(on: boolean): void {
  localStorage.setItem("fg-orig-parallel", on ? "on" : "off");
}

export function storedFont(): number {
  return Number(localStorage.getItem("fg-font") || 18);
}

export function setStoredFont(n: number): void {
  localStorage.setItem("fg-font", String(n));
}

export function storedTheme(): Theme {
  return localStorage.getItem("fg-theme") === "night" ? "night" : "day";
}

export function setStoredTheme(theme: Theme): void {
  localStorage.setItem("fg-theme", theme);
}

export function storedUser(): string | null {
  return localStorage.getItem("fg-user");
}

export function setStoredUser(name: string | null): void {
  if (name) localStorage.setItem("fg-user", name);
  else localStorage.removeItem("fg-user");
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme === "night" ? "night" : "day");
}

export function applyFont(n: number): void {
  document.documentElement.style.setProperty("--read-size", n + "px");
}

export function applyReadOptionClasses(opts: Record<ReadOptId, boolean>): void {
  document.body.classList.toggle("hide-nums", !opts.nums);
  document.body.classList.toggle("hide-head", !opts.head);
  document.body.classList.toggle("hide-fn", !opts.fn);
}

export function storedRailAutoFocus(): boolean {
  if (typeof localStorage === "undefined") return true;
  const v = localStorage.getItem("fg-scrollrail-autofocus") ?? localStorage.getItem("scrollRail.autoFocus");
  if (v == null) return true;
  return v === "on" || v === "true";
}

export function setStoredRailAutoFocus(on: boolean): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem("fg-scrollrail-autofocus", on ? "on" : "off");
  localStorage.setItem("scrollRail.autoFocus", on ? "true" : "false");
}

export function storedRailAutoCollapse(): boolean {
  if (typeof localStorage === "undefined") return true;
  const v = localStorage.getItem("fg-scrollrail-autocollapse") ?? localStorage.getItem("scrollRail.autoCollapse");
  if (v == null) return true;
  return v === "on" || v === "true";
}

export function setStoredRailAutoCollapse(on: boolean): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem("fg-scrollrail-autocollapse", on ? "on" : "off");
  localStorage.setItem("scrollRail.autoCollapse", on ? "true" : "false");
}

export function storedBibleSplitView(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem("fg-bible-split") === "on";
}

export function setStoredBibleSplitView(on: boolean): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem("fg-bible-split", on ? "on" : "off");
}

export function storedScrollDark(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem("fg-scroll-dark") === "on";
}

export function setStoredScrollDark(on: boolean): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem("fg-scroll-dark", on ? "on" : "off");
}

