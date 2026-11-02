import { isFathersTabPath } from "./fathersDirectory";

/** The site's three places, shown as header tabs. */
export type SiteTab = "fathers" | "study" | "bible" | "types";

/**
 * Which tab a path belongs to:
 * - fathers: the front page, the library at /fathers/, each Father's page, and church history
 *   (whose timeline is part of the Fathers page);
 * - study: the Fathers' writings open in the reader, and the study desk;
 * - bible: the Bible with the Fathers' commentary beside it;
 * - types: the atlas of the types the Fathers draw from Scripture.
 * Other pages (About, Search, Report…) belong to no tab.
 */
export function siteTab(pathname: string): SiteTab | null {
  if (pathname === "/bible") return "bible";
  if (pathname === "/types") return "types";
  if (pathname === "/church-history" || pathname.startsWith("/church-history/")) return "fathers";
  if (pathname === "/" || isFathersTabPath(pathname)) return "fathers";
  if (pathname === "/study" || pathname === "/read" || pathname === "/augustines-confessions" || pathname.startsWith("/fathers/"))
    return "study";
  return null;
}
