export const HOME_HREF = "/";

export function isHomePath(pathname: string): boolean {
  return pathname === "/";
}

/** Left rail is omitted on `/` so the hero tiles are the only site nav there. */
export function showSiteRail(pathname: string): boolean {
  return !isHomePath(pathname);
}

export type LandingNavId = "read" | "bible" | "browse" | "fathers" | "about";

export type LandingNavItem = {
  id: LandingNavId;
  href: string;
  label: string;
  featured?: boolean;
};

/** Hero tiles on `/`. Timeline stays on the rail; Fathers takes its home slot. */
export const LANDING_NAV: readonly LandingNavItem[] = [
  { id: "read", href: "/augustines-confessions", label: "Read" },
  { id: "bible", href: "/bible", label: "Bible" },
  { id: "browse", href: "/church-fathers", label: "Browse", featured: true },
  { id: "fathers", href: "/fathers/", label: "Fathers" },
  { id: "about", href: "/about", label: "About" }
];
