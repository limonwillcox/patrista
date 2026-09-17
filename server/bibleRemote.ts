const BIBLE_API_URL = "https://api.scripture.api.bible/v1";

/** API.Bible bible IDs look like `a556c5305ee15c3f-01`. */
const BIBLE_ID_RE = /^[a-zA-Z0-9-]{8,64}$/;
/** USFM chapter ids like `JHN.1`, `1CO.13`, `PSA.119`. */
const CHAPTER_ID_RE = /^[0-9A-Z]{1,4}\.\d{1,3}$/;

export type BibleRemoteEnv = {
  BIBLE_API_KEY?: string;
  DONATE_PUBLIC_ORIGIN?: string;
};

export type BibleRemoteHandlerResult = {
  status: number;
  json: Record<string, unknown>;
};

export function isBibleRemotePath(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  return path === "/api/bible/remote";
}

export function bibleRemoteCorsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

export function parseBibleRemoteQuery(
  bibleId: string | null,
  chapterId: string | null
): { ok: true; bibleId: string; chapterId: string } | { ok: false; error: string } {
  const bid = (bibleId || "").trim();
  const cid = (chapterId || "").trim().toUpperCase();
  if (!bid || !BIBLE_ID_RE.test(bid)) {
    return { ok: false, error: "Invalid or missing bibleId" };
  }
  if (!cid || !CHAPTER_ID_RE.test(cid)) {
    return { ok: false, error: "Invalid or missing chapterId (expected e.g. JHN.1)" };
  }
  return { ok: true, bibleId: bid, chapterId: cid };
}

export async function handleBibleRemoteChapter(
  bibleId: string,
  chapterId: string,
  options: { apiKey: string | undefined }
): Promise<BibleRemoteHandlerResult> {
  const parsed = parseBibleRemoteQuery(bibleId, chapterId);
  if (!parsed.ok) return { status: 400, json: { error: parsed.error } };

  const apiKey = options.apiKey?.trim();
  if (!apiKey) {
    return {
      status: 503,
      json: {
        error: "Bible translations are not connected yet. Add BIBLE_API_KEY on the API worker."
      }
    };
  }

  const url =
    `${BIBLE_API_URL}/bibles/${encodeURIComponent(parsed.bibleId)}/chapters/` +
    `${encodeURIComponent(parsed.chapterId)}?content-type=json&include-verse-numbers=true`;

  try {
    const res = await fetch(url, {
      headers: { "api-key": apiKey }
    });
    const text = await res.text();
    let body: unknown = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = null;
    }
    if (!res.ok) {
      const msg =
        body && typeof body === "object" && body !== null && "message" in body
          ? String((body as { message?: unknown }).message || "")
          : text.slice(0, 200);
      return {
        status: res.status === 404 ? 404 : 502,
        json: {
          error: msg || `API.Bible request failed (${res.status})`
        }
      };
    }
    if (!body || typeof body !== "object") {
      return { status: 502, json: { error: "API.Bible returned invalid JSON" } };
    }
    return { status: 200, json: body as Record<string, unknown> };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { status: 502, json: { error: message || "Bible proxy failed" } };
  }
}

function publicOrigin(request: Request, env: BibleRemoteEnv): string {
  return env.DONATE_PUBLIC_ORIGIN || request.headers.get("origin") || "https://patrista.com";
}

/** Web Fetch adapter for Cloudflare Workers and tests. */
export async function handleBibleRemoteFetch(
  request: Request,
  env: BibleRemoteEnv = {}
): Promise<Response | null> {
  const url = new URL(request.url);
  if (!isBibleRemotePath(url.pathname)) return null;
  const origin = publicOrigin(request, env);
  const cors = bibleRemoteCorsHeaders(origin);
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "content-type": "application/json; charset=utf-8", ...cors }
    });
  }
  const result = await handleBibleRemoteChapter(url.searchParams.get("bibleId") || "", url.searchParams.get("chapterId") || "", {
    apiKey: env.BIBLE_API_KEY
  });
  return new Response(JSON.stringify(result.json), {
    status: result.status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      ...cors
    }
  });
}
