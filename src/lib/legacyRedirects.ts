/**
 * Old URLs that moved are forwarded through lookup files, one per Father:
 * dist/legacy-redirects/<author>.json = { "<old path key>": "<current path>" }.
 * Written by server/staticFathers.ts, checked by server/seoAudit.ts, read by the script in index.html.
 * The script repeats legacyRedirectKey() inline; keep the two in step.
 */

export const LEGACY_REDIRECTS_DIR = "legacy-redirects";

/** "/fathers/a/w/book-ii/" and "/fathers/a/w.html" -> "/fathers/a/w/book-ii", "/fathers/a/w". */
export function legacyRedirectKey(path: string): string {
  return path.replace(/\.html$/, "").replace(/\/+$/, "");
}
