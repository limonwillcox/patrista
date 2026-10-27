export const ADS_PREF_KEY = "piblia-ads-enabled";

export function loadAdsEnabled(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(ADS_PREF_KEY) === "on";
}

export function saveAdsEnabled(on: boolean): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(ADS_PREF_KEY, on ? "on" : "off");
}
