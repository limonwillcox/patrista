export const DICT_MISS_PREFIX = "dict:miss:";

export type DictMissRecord = {
  word: string;
  query: string;
  count: number;
  firstAt: string;
  lastAt: string;
  work: string | null;
  status: "open";
};

export type DictMissInput = {
  word: string;
  query: string;
  work: string | null;
};

export type DictMissKv = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  list(opts: { prefix: string }): Promise<{ keys: Array<{ name: string }> }>;
};

export type DictMissHandlerResult = {
  status: number;
  json: Record<string, unknown>;
};

export function isDictionaryMissPath(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  return path === "/api/dictionary/miss" || path === "/api/dictionary/misses";
}

export function isDictionaryMissSubmitPath(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  return path === "/api/dictionary/miss";
}

export function isDictionaryMissListPath(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  return path === "/api/dictionary/misses";
}

export function dictionaryMissCorsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

export function missKey(word: string): string {
  return DICT_MISS_PREFIX + word;
}

export function parseDictionaryMissBody(
  body: unknown
): { ok: true; data: DictMissInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Missing word" };
  const rec = body as Record<string, unknown>;
  const raw = String(rec.word || "").trim();
  const query = raw.replace(/[^A-Za-z'-]+/g, "").replace(/^'+|'+$/g, "");
  const word = query.toLowerCase();
  if (word.length < 2 || word.length > 40) return { ok: false, error: "Not a word" };
  let work: string | null = null;
  if (rec.work != null && String(rec.work).trim()) {
    work = String(rec.work).trim().slice(0, 80);
  }
  return { ok: true, data: { word, query, work } };
}

export function mergeMissRecord(
  prev: DictMissRecord | null,
  input: DictMissInput,
  now: string
): DictMissRecord {
  if (!prev) {
    return {
      word: input.word,
      query: input.query,
      count: 1,
      firstAt: now,
      lastAt: now,
      work: input.work,
      status: "open"
    };
  }
  return {
    ...prev,
    word: input.word,
    query: input.query || prev.query,
    count: prev.count + 1,
    lastAt: now,
    work: input.work || prev.work,
    status: "open"
  };
}

export function parseMissRecord(raw: string | null): DictMissRecord | null {
  if (!raw) return null;
  try {
    const rec = JSON.parse(raw) as Partial<DictMissRecord>;
    if (!rec || typeof rec.word !== "string" || !rec.word) return null;
    const count = Number(rec.count);
    return {
      word: rec.word,
      query: String(rec.query || rec.word),
      count: Number.isFinite(count) && count > 0 ? count : 1,
      firstAt: String(rec.firstAt || ""),
      lastAt: String(rec.lastAt || ""),
      work: rec.work ? String(rec.work) : null,
      status: "open"
    };
  } catch {
    return null;
  }
}

export async function handleDictionaryMissSubmit(
  body: unknown,
  options: {
    kv?: DictMissKv;
    writeLocal?: (record: DictMissRecord) => { path: string };
    readLocal?: (word: string) => DictMissRecord | null;
    now?: string;
  }
): Promise<DictMissHandlerResult> {
  const parsed = parseDictionaryMissBody(body);
  if (!parsed.ok) return { status: 400, json: { error: parsed.error } };
  const now = options.now || new Date().toISOString();
  let prev: DictMissRecord | null = null;
  if (options.kv) {
    prev = parseMissRecord(await options.kv.get(missKey(parsed.data.word)));
  } else if (options.readLocal) {
    prev = options.readLocal(parsed.data.word);
  }
  const record = mergeMissRecord(prev, parsed.data, now);
  if (options.kv) {
    await options.kv.put(missKey(record.word), JSON.stringify(record, null, 2));
  }
  if (options.writeLocal) options.writeLocal(record);
  if (!options.kv && !options.writeLocal) {
    return { status: 503, json: { error: "Dictionary miss queue is not connected." } };
  }
  return { status: 200, json: { ok: true, word: record.word, count: record.count, queued: true } };
}

export async function handleDictionaryMissList(options: {
  kv?: DictMissKv;
  listLocal?: () => DictMissRecord[];
}): Promise<DictMissHandlerResult> {
  let misses: DictMissRecord[] = [];
  if (options.kv) {
    const listed = await options.kv.list({ prefix: DICT_MISS_PREFIX });
    for (const key of listed.keys) {
      const rec = parseMissRecord(await options.kv.get(key.name));
      if (rec) misses.push(rec);
    }
  } else if (options.listLocal) {
    misses = options.listLocal();
  } else {
    return { status: 503, json: { error: "Dictionary miss queue is not connected." } };
  }
  misses.sort((a, b) => b.count - a.count || a.word.localeCompare(b.word));
  return { status: 200, json: { ok: true, misses } };
}

export type DictionaryMissEnv = {
  DONATE_PUBLIC_ORIGIN?: string;
  FIXES_PUBLIC_ORIGIN?: string;
  FIXES_KV?: DictMissKv;
};

function publicOrigin(request: Request, env: DictionaryMissEnv): string {
  return (
    env.FIXES_PUBLIC_ORIGIN ||
    env.DONATE_PUBLIC_ORIGIN ||
    request.headers.get("origin") ||
    "https://patrista.com"
  );
}

export async function handleDictionaryMissFetch(
  request: Request,
  env: DictionaryMissEnv = {}
): Promise<Response | null> {
  const url = new URL(request.url);
  if (!isDictionaryMissPath(url.pathname)) return null;
  const origin = publicOrigin(request, env);
  const cors = dictionaryMissCorsHeaders(origin);
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  const jsonHeaders = { "content-type": "application/json; charset=utf-8", ...cors };

  if (isDictionaryMissListPath(url.pathname)) {
    if (request.method !== "GET") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: jsonHeaders });
    }
    const result = await handleDictionaryMissList({ kv: env.FIXES_KV });
    return new Response(JSON.stringify(result.json), { status: result.status, headers: jsonHeaders });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: jsonHeaders });
  }
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const result = await handleDictionaryMissSubmit(body, { kv: env.FIXES_KV });
  return new Response(JSON.stringify(result.json), { status: result.status, headers: jsonHeaders });
}
