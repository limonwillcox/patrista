import { handleBibleRemoteFetch, type BibleRemoteEnv } from "./bibleRemote";
import { handleDonateFetch, type DonateEnv } from "./donate";
import { handleFixesFetch, type FixesEnv } from "./fixes";

type Env = DonateEnv & FixesEnv & BibleRemoteEnv;

/**
 * Cloudflare Worker: Stripe donate + Fixes → GitHub Issues + API.Bible proxy.
 * Must not import Node fs corpus loaders.
 * Secret: BIBLE_API_KEY (wrangler secret put BIBLE_API_KEY)
 */
export default {
  async fetch(request: Request, env: Env = {}): Promise<Response> {
    const donate = await handleDonateFetch(request, env);
    if (donate) return donate;
    const fixes = await handleFixesFetch(request, env);
    if (fixes) return fixes;
    const bible = await handleBibleRemoteFetch(request, env);
    if (bible) return bible;
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }
};
