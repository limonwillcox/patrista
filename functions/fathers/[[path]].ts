/**
 * Cloudflare Pages Function: real 301s for old /fathers/ URLs (long chapter slugs, renamed works).
 * Static assets still win when a file exists, so live work/chapter/author pages are unchanged.
 * Lookup files are written by server/staticFathers.ts to dist/legacy-redirects/<author>.json.
 */
import { fathersLegacyRedirectResponse } from "../../src/lib/legacyRedirects";

type PagesContext = {
  request: Request;
  env: { ASSETS?: { fetch: (input: Request) => Promise<Response> } };
  next: () => Promise<Response>;
};

export async function onRequest(context: PagesContext): Promise<Response> {
  const fetchAsset = (url: URL) => {
    const req = new Request(url);
    return context.env.ASSETS ? context.env.ASSETS.fetch(req) : fetch(req);
  };
  const redirected = await fathersLegacyRedirectResponse(context.request, fetchAsset);
  return redirected ?? context.next();
}
