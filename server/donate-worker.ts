import { handleDonateFetch, type DonateEnv } from "./donate";
import { handleFixesFetch, type FixesEnv } from "./fixes";

type Env = DonateEnv & FixesEnv;

/**
 * Cloudflare Worker: Stripe donate + Fixes → GitHub Issues.
 * Must not import Node fs corpus loaders.
 */
export default {
  async fetch(request: Request, env: Env = {}): Promise<Response> {
    const donate = await handleDonateFetch(request, env);
    if (donate) return donate;
    const fixes = await handleFixesFetch(request, env);
    if (fixes) return fixes;
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }
};
