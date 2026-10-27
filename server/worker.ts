type Env = { ASSETS?: { fetch: (request: Request) => Promise<Response> } };

/**
 * Cloudflare Worker: static assets only.
 * Must not import Node fs corpus loaders.
 */
export default {
  async fetch(request: Request, env: Env = {}): Promise<Response> {
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response("Not found", { status: 404 });
  }
};
