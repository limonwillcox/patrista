import { handleBibleRemoteFetch, type BibleRemoteEnv } from "./bibleRemote";
import { handleClavisFetch, type ClavisEnv } from "./clavis-api";
import { handleDonateFetch, type DonateEnv } from "./donate";
import { handleFixesFetch, type FixesEnv } from "./fixes";

type Env = DonateEnv & FixesEnv & BibleRemoteEnv & ClavisEnv;

/**
 * Cloudflare Worker: Stripe donate + Fixes → GitHub Issues + API.Bible proxy + Clavis reads.
 * Must not import Node fs corpus loaders.
 * Secret: BIBLE_API_KEY (wrangler secret put BIBLE_API_KEY)
 * Clavis: D1 CLAVIS_DB + R2 CLAVIS_TEXTS (commented in wrangler.toml until created).
 */
export default {
  async fetch(request: Request, env: Env = {}): Promise<Response> {
    const donate = await handleDonateFetch(request, env);
    if (donate) return donate;
    const fixes = await handleFixesFetch(request, env);
    if (fixes) return fixes;
    const bible = await handleBibleRemoteFetch(request, env);
    if (bible) return bible;
    const clavis = await handleClavisFetch(request, env);
    if (clavis) return clavis;
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }
};
