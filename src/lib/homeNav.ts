export const HOME_HREF = "/";

export function isHomePath(pathname: string): boolean {
  return pathname === "/";
}

/** Left rail is omitted on `/` so the hero tiles are the only site nav there. */
export function showSiteRail(pathname: string): boolean {
  return !isHomePath(pathname);
}

export type LandingNavId = "read" | "bible" | "browse" | "timeline" | "about";

export type LandingNavItem = {
  id: LandingNavId;
  href: string;
  label: string;
  featured?: boolean;
};

/** Hero tiles on `/` — rail destinations minus Home, Give, and Fixes. */
export const LANDING_NAV: readonly LandingNavItem[] = [
  { id: "read", href: "/read", label: "Read" },
  { id: "bible", href: "/bible", label: "Bible" },
  { id: "browse", href: "/church-fathers", label: "Browse", featured: true },
  { id: "timeline", href: "/church-history/timeline#nativity", label: "Timeline" },
  { id: "about", href: "/about", label: "About" }
];
