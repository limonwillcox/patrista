import { handleAccountFetch, type AccountEnv } from "./account";
import { handleBibleRemoteFetch, type BibleRemoteEnv } from "./bibleRemote";
import { handleClavisFetch, type ClavisEnv } from "./clavis-api";
import { handleDictionaryMissFetch, type DictionaryMissEnv } from "./dictionaryMiss";
import { handleFixesFetch, type FixesEnv } from "./fixes";

type Env = FixesEnv & BibleRemoteEnv & ClavisEnv & DictionaryMissEnv & AccountEnv;

/**
 * Cloudflare Worker: Fixes → GitHub Issues + API.Bible proxy + Clavis reads + reader accounts.
 * Must not import Node fs corpus loaders.
 * Secret: BIBLE_API_KEY (wrangler secret put BIBLE_API_KEY)
 * Accounts: D1 ACCOUNT_DB + var GOOGLE_CLIENT_ID (commented in wrangler.toml until created).
 * Clavis: D1 CLAVIS_DB + R2 CLAVIS_TEXTS (commented in wrangler.toml until created).
 */
export default {
  async fetch(request: Request, env: Env = {}): Promise<Response> {
    const account = await handleAccountFetch(request, env);
    if (account) return account;
    const fixes = await handleFixesFetch(request, env);
    if (fixes) return fixes;
    const dictMiss = await handleDictionaryMissFetch(request, env);
    if (dictMiss) return dictMiss;
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
