import { useEffect, useState } from "react";
/** What the map needs of a theme: its id, its name, and the types in it. */
export type Theme = { id: string; name: string; members: { type: string }[] };

/*
 * The themes' colours: a rainbow, red to violet, in the themes' order. A type takes the colour
 * of the first theme it is in; a type in none is grey.
 */

export function themeColor(index: number, count: number, night: boolean): string {
  if (index < 0) return night ? "#8d8a85" : "#a39d93";
  const hue = count > 1 ? Math.round((index * 280) / (count - 1)) : 0;
  return night ? `hsl(${hue} 72% 66%)` : `hsl(${hue} 64% 43%)`;
}

/** Per type id, the index of the first theme it is in. */
export function firstThemeOf(themes: Theme[]): Map<string, number> {
  const out = new Map<string, number>();
  themes.forEach((th, i) => th.members.forEach((m) => !out.has(m.type) && out.set(m.type, i)));
  return out;
}

/** The themes a type is in, in the themes' order. */
export const themesOf = (themes: Theme[], typeId: string) => themes.filter((th) => th.members.some((m) => m.type === typeId));

/** A theme's name for a label, with a capital. */
export const themeTitle = (th: Theme) => th.name.charAt(0).toUpperCase() + th.name.slice(1);

/** Whether the site is in night mode, following the switch. */
export function useNight(): boolean {
  const read = () => typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "night";
  const [night, setNight] = useState(read);
  useEffect(() => {
    const mo = new MutationObserver(() => setNight(read()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);
  return night;
}
