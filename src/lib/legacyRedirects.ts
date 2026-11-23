/**
 * Old URLs that moved are forwarded through lookup files, one per Father:
 * dist/legacy-redirects/<author>.json = { "<old path key>": "<current path>" }.
 * Written by server/staticFathers.ts, checked by server/seoAudit.ts, read by the script in index.html
 * and by functions/fathers/[[path]].ts (real 301s on Cloudflare Pages).
 * The script in index.html repeats legacyRedirectKey() inline; keep the two in step.
 */

import { SITE_ORIGIN } from "./siteOrigin";

export const LEGACY_REDIRECTS_DIR = "legacy-redirects";

/** "/fathers/a/w/book-ii/" and "/fathers/a/w.html" -> "/fathers/a/w/book-ii", "/fathers/a/w". */
export function legacyRedirectKey(path: string): string {
  return path.replace(/\.html$/, "").replace(/\/+$/, "");
}

/** Current-site path for a legacy URL, or null if this request should not redirect. */
export function lookupLegacyRedirect(
  pathname: string,
  map: Record<string, string> | null | undefined
): string | null {
  if (!map) return null;
  const to = map[legacyRedirectKey(pathname)];
  if (!to || legacyRedirectKey(to) === legacyRedirectKey(pathname)) return null;
  return to;
}

export function legacyRedirectAbsoluteUrl(to: string, search = ""): string {
  return SITE_ORIGIN + to + search;
}

export type LegacyAssetFetcher = (url: URL) => Promise<Response>;

const mapCache = new Map<string, Record<string, string> | null>();

async function loadAuthorMap(
  origin: string,
  author: string,
  fetchAsset: LegacyAssetFetcher
): Promise<Record<string, string> | null> {
  if (mapCache.has(author)) return mapCache.get(author) ?? null;
  let map: Record<string, string> | null = null;
  try {
    const res = await fetchAsset(new URL("/" + LEGACY_REDIRECTS_DIR + "/" + encodeURIComponent(author) + ".json", origin));
    if (res.ok) map = (await res.json()) as Record<string, string>;
  } catch {
    map = null;
  }
  mapCache.set(author, map);
  return map;
}

/** Reset cached lookup files. Tests call this between cases. */
export function clearLegacyRedirectMapCache(): void {
  mapCache.clear();
}

/**
 * If this /fathers/… path is a moved URL, return a 301 to its current page on https://patrista.com.
 * Returns null when the request should fall through to the static asset or 404 page.
 */
export async function fathersLegacyRedirectResponse(
  request: Request,
  fetchAsset: LegacyAssetFetcher
): Promise<Response | null> {
  const url = new URL(request.url);
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 3 || parts[0] !== "fathers") return null;
  const author = parts[1];
  if (!author) return null;
  const map = await loadAuthorMap(url.origin, author, fetchAsset);
  const to = lookupLegacyRedirect(url.pathname, map);
  if (!to) return null;
  return new Response(null, {
    status: 301,
    headers: { Location: legacyRedirectAbsoluteUrl(to, url.search) }
  });
}
