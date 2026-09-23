/**
 * Clavis read API for the donate Worker.
 * Metadata comes from D1 (CLAVIS_DB). Bodies come from R2 (CLAVIS_TEXTS).
 * Must not import Node fs or the Clavis pack scripts.
 */

export const CLAVIS_TEXT_CACHE_CONTROL = "public, max-age=86400";
export const CLAVIS_DRAFT_CACHE_CONTROL = "private, no-store";
export const CLAVIS_META_CACHE_CONTROL = "public, max-age=300";

const ID_RE = /^[A-F0-9]{32}$/;

export type ClavisLanguage = "english" | "original";
export type ClavisTextStatus = "draft" | "ready";

export type ClavisAuthor = {
  author_id: string;
  name_latin: string;
  detail_url: string | null;
  letter_bucket: string;
};

export type ClavisTextMeta = {
  language: ClavisLanguage;
  title: string | null;
  status: ClavisTextStatus;
  r2_key: string | null;
  source_path: string | null;
  content_sha256: string | null;
  byte_size: number | null;
  updated_at: string | null;
};

export type ClavisWork = {
  work_id: string;
  author_id: string;
  parent_work_id: string | null;
  title_latin: string;
  title_designated: string | null;
  clavis: string[];
  path: string[];
  detail_url: string | null;
  kind: string;
  texts: ClavisTextMeta[];
  english_ready: boolean;
};

export interface ClavisD1Prepared {
  bind(...values: unknown[]): ClavisD1Prepared;
  all<T = Record<string, unknown>>(): Promise<{ results?: T[] }>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
}

export interface ClavisD1Database {
  prepare(query: string): ClavisD1Prepared;
}

export interface ClavisR2Object {
  body: ReadableStream | ArrayBuffer | Uint8Array | string | null;
  size?: number;
}

export interface ClavisR2Bucket {
  get(key: string): Promise<ClavisR2Object | null>;
}

export type ClavisEnv = {
  CLAVIS_DB?: ClavisD1Database;
  CLAVIS_TEXTS?: ClavisR2Bucket;
  DONATE_PUBLIC_ORIGIN?: string;
};

type SqlRow = Record<string, unknown>;

/**
 * Formatting English board gate.
 * True only when a work_texts row is language=english and status=ready.
 * A path under Fathers/English is not an input.
 */
export function isEnglishReady(texts: { language: string; status: string }[]): boolean {
  return texts.some((text) => text.language === "english" && text.status === "ready");
}

export function isClavisPath(pathname: string): boolean {
  const path = stripSlash(pathname);
  return path === "/api/clavis" || path.startsWith("/api/clavis/");
}

function stripSlash(pathname: string): string {
  return pathname.replace(/\/+$/, "") || "/";
}

function parseId(raw: string): string | null {
  const id = raw.trim().toUpperCase();
  return ID_RE.test(id) ? id : null;
}

function asNullableString(value: unknown): string | null {
  if (value == null) return null;
  return String(value);
}

function asNullableNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== "string" || value.trim() === "") return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function mapAuthor(row: SqlRow): ClavisAuthor {
  return {
    author_id: String(row.author_id),
    name_latin: String(row.name_latin),
    detail_url: asNullableString(row.detail_url),
    letter_bucket: String(row.letter_bucket)
  };
}

function mapText(row: SqlRow): ClavisTextMeta {
  const language = row.language === "original" ? "original" : "english";
  const status = row.status === "ready" ? "ready" : "draft";
  return {
    language,
    title: asNullableString(row.title),
    status,
    r2_key: asNullableString(row.r2_key),
    source_path: asNullableString(row.source_path),
    content_sha256: asNullableString(row.content_sha256),
    byte_size: asNullableNumber(row.byte_size),
    updated_at: asNullableString(row.updated_at)
  };
}

function mapWork(row: SqlRow, texts: ClavisTextMeta[]): ClavisWork {
  return {
    work_id: String(row.work_id),
    author_id: String(row.author_id),
    parent_work_id: asNullableString(row.parent_work_id),
    title_latin: String(row.title_latin),
    title_designated: asNullableString(row.title_designated),
    clavis: parseJsonArray(row.clavis_codes),
    path: parseJsonArray(row.path_json),
    detail_url: asNullableString(row.detail_url),
    kind: String(row.kind),
    texts,
    english_ready: isEnglishReady(texts)
  };
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Expose-Headers": "ETag, X-Clavis-Text-Status, X-Clavis-R2-Key"
  };
}

function publicOrigin(request: Request, env: ClavisEnv): string {
  return env.DONATE_PUBLIC_ORIGIN || request.headers.get("origin") || "https://patrista.com";
}

function asBodyInit(body: Exclude<ClavisR2Object["body"], null>): BodyInit {
  if (typeof body === "string" || body instanceof ArrayBuffer || body instanceof ReadableStream) return body;
  const copy = new Uint8Array(body.byteLength);
  copy.set(body);
  return copy;
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  cors: Record<string, string>,
  cacheControl = "no-store"
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": cacheControl,
      ...cors
    }
  });
}

async function allRows(db: ClavisD1Database, sql: string, params: unknown[] = []): Promise<SqlRow[]> {
  const prepared = params.length ? db.prepare(sql).bind(...params) : db.prepare(sql);
  const result = await prepared.all<SqlRow>();
  return result.results || [];
}

async function firstRow(db: ClavisD1Database, sql: string, params: unknown[]): Promise<SqlRow | null> {
  const row = await db.prepare(sql).bind(...params).first<SqlRow>();
  return row || null;
}

const AUTHOR_LIST_SQL = `
SELECT author_id, name_latin, detail_url, letter_bucket
FROM authors
ORDER BY name_latin COLLATE NOCASE, author_id
`;

const AUTHOR_SQL = `
SELECT author_id, name_latin, detail_url, letter_bucket
FROM authors
WHERE author_id = ?
`;

const WORKS_FOR_AUTHOR_SQL = `
SELECT work_id, author_id, parent_work_id, title_latin, title_designated,
       clavis_codes, path_json, detail_url, kind
FROM works
WHERE author_id = ?
ORDER BY title_latin COLLATE NOCASE, work_id
`;

const TEXTS_FOR_AUTHOR_SQL = `
SELECT t.work_id, t.language, t.title, t.status, t.r2_key, t.source_path,
       t.content_sha256, t.byte_size, t.updated_at
FROM work_texts t
JOIN works w ON w.work_id = t.work_id
WHERE w.author_id = ?
ORDER BY t.work_id, t.language
`;

const WORK_SQL = `
SELECT work_id, author_id, parent_work_id, title_latin, title_designated,
       clavis_codes, path_json, detail_url, kind
FROM works
WHERE work_id = ?
`;

const TEXTS_FOR_WORK_SQL = `
SELECT work_id, language, title, status, r2_key, source_path,
       content_sha256, byte_size, updated_at
FROM work_texts
WHERE work_id = ?
ORDER BY language
`;

const TEXT_SQL = `
SELECT work_id, language, title, status, r2_key, source_path,
       content_sha256, byte_size, updated_at
FROM work_texts
WHERE work_id = ? AND language = ?
`;

function textsByWork(rows: SqlRow[]): Map<string, ClavisTextMeta[]> {
  const grouped = new Map<string, ClavisTextMeta[]>();
  for (const row of rows) {
    const id = String(row.work_id);
    const list = grouped.get(id) || [];
    list.push(mapText(row));
    grouped.set(id, list);
  }
  return grouped;
}

function worksWithTexts(workRows: SqlRow[], textRows: SqlRow[]): ClavisWork[] {
  const grouped = textsByWork(textRows);
  return workRows.map((row) => mapWork(row, grouped.get(String(row.work_id)) || []));
}

export async function handleClavisFetch(request: Request, env: ClavisEnv = {}): Promise<Response | null> {
  const url = new URL(request.url);
  if (!isClavisPath(url.pathname)) return null;

  const origin = publicOrigin(request, env);
  const cors = corsHeaders(origin);
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  if (request.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405, cors);
  }

  const path = stripSlash(url.pathname);
  const authorWorks = path.match(/^\/api\/clavis\/authors\/([^/]+)\/works$/);
  const workText = path.match(/^\/api\/clavis\/works\/([^/]+)\/text$/);
  const workOne = path.match(/^\/api\/clavis\/works\/([^/]+)$/);
  const authors = path === "/api/clavis/authors";

  if (!authors && !authorWorks && !workText && !workOne) {
    return jsonResponse({ error: "Not found" }, 404, cors);
  }
  if (!env.CLAVIS_DB) {
    return jsonResponse(
      { error: "Clavis database is not connected. Bind D1 CLAVIS_DB." },
      503,
      cors
    );
  }

  try {
    if (authors) {
      const rows = await allRows(env.CLAVIS_DB, AUTHOR_LIST_SQL);
      return jsonResponse({ authors: rows.map(mapAuthor) }, 200, cors, CLAVIS_META_CACHE_CONTROL);
    }

    if (authorWorks) {
      const authorId = parseId(authorWorks[1]);
      if (!authorId) return jsonResponse({ error: "Invalid id" }, 400, cors);
      const author = await firstRow(env.CLAVIS_DB, AUTHOR_SQL, [authorId]);
      if (!author) return jsonResponse({ error: "Author not found" }, 404, cors);
      const works = await allRows(env.CLAVIS_DB, WORKS_FOR_AUTHOR_SQL, [authorId]);
      const texts = await allRows(env.CLAVIS_DB, TEXTS_FOR_AUTHOR_SQL, [authorId]);
      return jsonResponse(
        { author: mapAuthor(author), works: worksWithTexts(works, texts) },
        200,
        cors,
        CLAVIS_META_CACHE_CONTROL
      );
    }

    if (workOne) {
      const workId = parseId(workOne[1]);
      if (!workId) return jsonResponse({ error: "Invalid id" }, 400, cors);
      const work = await firstRow(env.CLAVIS_DB, WORK_SQL, [workId]);
      if (!work) return jsonResponse({ error: "Work not found" }, 404, cors);
      const texts = await allRows(env.CLAVIS_DB, TEXTS_FOR_WORK_SQL, [workId]);
      return jsonResponse(
        { work: worksWithTexts([work], texts)[0] },
        200,
        cors,
        CLAVIS_META_CACHE_CONTROL
      );
    }

    const workId = parseId(workText![1]);
    if (!workId) return jsonResponse({ error: "Invalid id" }, 400, cors);
    const languageRaw = (url.searchParams.get("language") || "english").trim().toLowerCase();
    if (languageRaw !== "english" && languageRaw !== "original") {
      return jsonResponse({ error: "language must be english or original" }, 400, cors);
    }
    const text = await firstRow(env.CLAVIS_DB, TEXT_SQL, [workId, languageRaw]);
    if (!text || text.r2_key == null || String(text.r2_key) === "") {
      return jsonResponse({ error: "Text not found" }, 404, cors);
    }
    if (!env.CLAVIS_TEXTS) {
      return jsonResponse(
        { error: "Clavis text bucket is not connected. Bind R2 CLAVIS_TEXTS." },
        501,
        cors
      );
    }
    const object = await env.CLAVIS_TEXTS.get(String(text.r2_key));
    if (!object || object.body == null) {
      return jsonResponse({ error: "Text body not found" }, 404, cors);
    }
    const ready = text.status === "ready";
    const headers: Record<string, string> = {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": ready ? CLAVIS_TEXT_CACHE_CONTROL : CLAVIS_DRAFT_CACHE_CONTROL,
      "x-clavis-text-status": ready ? "ready" : "draft",
      "x-clavis-r2-key": String(text.r2_key),
      ...cors
    };
    if (text.content_sha256 != null && String(text.content_sha256) !== "") {
      headers.etag = '"' + String(text.content_sha256) + '"';
    }
    return new Response(asBodyInit(object.body), { status: 200, headers });
  } catch {
    return jsonResponse({ error: "Clavis query failed" }, 500, cors);
  }
}
