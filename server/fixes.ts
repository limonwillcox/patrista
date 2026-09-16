export const FIXES_MAX_SCREENSHOT_BYTES = 1_500_000;
export const FIXES_GITHUB_OWNER = "limonwillcox";
export const FIXES_GITHUB_REPO = "piblia";

export type FixesScreenshot = {
  mime: string;
  base64: string;
};

export type FixesRequest = {
  firstName: string;
  lastName: string;
  problem: string;
  screenshot?: FixesScreenshot | null;
};

export type FixesHandlerResult = {
  status: number;
  json: Record<string, unknown>;
};

export function isFixesPath(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  return path === "/api/fixes";
}

export function fixesCorsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

export function extForMime(mime: string): string | null {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return null;
}

export function parseFixesBody(body: unknown): { ok: true; data: FixesRequest } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Please describe the problem" };
  const rec = body as Record<string, unknown>;
  const firstName = String(rec.firstName || "").trim();
  const lastName = String(rec.lastName || "").trim();
  const problem = String(rec.problem || "").trim();
  if (!firstName) return { ok: false, error: "Please enter your first name" };
  if (!lastName) return { ok: false, error: "Please enter your last name" };
  if (!problem) return { ok: false, error: "Please describe the problem" };
  if (firstName.length > 80 || lastName.length > 80) {
    return { ok: false, error: "Name is too long" };
  }
  if (problem.length > 12_000) return { ok: false, error: "Problem text is too long" };

  let screenshot: FixesScreenshot | null = null;
  const rawShot = rec.screenshot;
  if (rawShot != null) {
    if (typeof rawShot !== "object") return { ok: false, error: "Invalid screenshot" };
    const shot = rawShot as Record<string, unknown>;
    const mime = String(shot.mime || "").trim().toLowerCase();
    const base64 = String(shot.base64 || "").replace(/\s+/g, "");
    const ext = extForMime(mime);
    if (!ext || !base64) return { ok: false, error: "Screenshot must be a PNG, JPEG, WebP, or GIF" };
    const bytes = Math.floor((base64.length * 3) / 4);
    if (bytes > FIXES_MAX_SCREENSHOT_BYTES) {
      return { ok: false, error: "Screenshot is too large (max about 1.5 MB)" };
    }
    screenshot = { mime, base64 };
  }

  return { ok: true, data: { firstName, lastName, problem, screenshot } };
}

export function newFixId(): string {
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

function issueBody(data: FixesRequest, screenshotUrl: string | null, id: string): string {
  const lines = [
    "<!-- patrista-fixes -->",
    `**From:** ${data.firstName} ${data.lastName}`,
    `**Id:** \`${id}\``,
    "",
    "## Problem",
    "",
    data.problem,
    ""
  ];
  if (screenshotUrl) {
    lines.push("## Screenshot", "", `![screenshot](${screenshotUrl})`, "");
  }
  lines.push("---", "", "_Submitted from the Patrista Fixes form._");
  return lines.join("\n");
}

async function githubRequest(
  token: string,
  method: string,
  path: string,
  body?: unknown
): Promise<{ ok: boolean; status: number; json: Record<string, unknown> }> {
  const res = await fetch("https://api.github.com" + path, {
    method,
    headers: {
      Authorization: "Bearer " + token,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "patrista-fixes",
      "X-GitHub-Api-Version": "2022-11-28"
    },
    body: body == null ? undefined : JSON.stringify(body)
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, json };
}

async function uploadScreenshot(
  token: string,
  id: string,
  shot: FixesScreenshot
): Promise<string | null> {
  const ext = extForMime(shot.mime);
  if (!ext) return null;
  const path = `data/fixes/screenshots/${id}.${ext}`;
  const put = await githubRequest(
    token,
    "PUT",
    `/repos/${FIXES_GITHUB_OWNER}/${FIXES_GITHUB_REPO}/contents/${path}`,
    {
      message: `fixes: screenshot ${id}`,
      content: shot.base64,
      branch: "main"
    }
  );
  if (!put.ok) return null;
  const content = put.json.content as { download_url?: string; html_url?: string } | undefined;
  return content?.download_url || content?.html_url || null;
}

async function createIssue(
  token: string,
  data: FixesRequest,
  id: string,
  screenshotUrl: string | null
): Promise<{ ok: true; url: string; number: number } | { ok: false; error: string }> {
  const title = `[Fixes] ${data.firstName} ${data.lastName}`.slice(0, 120);
  const body = issueBody(data, screenshotUrl, id);
  let created = await githubRequest(
    token,
    "POST",
    `/repos/${FIXES_GITHUB_OWNER}/${FIXES_GITHUB_REPO}/issues`,
    { title, body, labels: ["fixes"] }
  );
  if (!created.ok && created.status === 422) {
    created = await githubRequest(
      token,
      "POST",
      `/repos/${FIXES_GITHUB_OWNER}/${FIXES_GITHUB_REPO}/issues`,
      { title, body }
    );
  }
  if (!created.ok) {
    const msg =
      typeof created.json.message === "string"
        ? created.json.message
        : "Could not open a GitHub issue";
    return { ok: false, error: msg };
  }
  const url = String(created.json.html_url || "");
  const number = Number(created.json.number || 0);
  if (!url) return { ok: false, error: "GitHub did not return an issue URL" };
  return { ok: true, url, number };
}

export type LocalFixWriter = (
  data: FixesRequest
) => { id: string; path: string; screenshotPath: string | null };

export type FixesKv = {
  put(key: string, value: string): Promise<void>;
};

export async function handleFixesSubmit(
  body: unknown,
  options: { githubToken?: string; writeLocal?: LocalFixWriter; kv?: FixesKv }
): Promise<FixesHandlerResult> {
  const parsed = parseFixesBody(body);
  if (!parsed.ok) return { status: 400, json: { error: parsed.error } };

  const id = newFixId();
  const token = options.githubToken?.trim();
  let screenshotUrl: string | null = null;
  let issueUrl: string | undefined;
  let issueNumber: number | undefined;

  if (token && parsed.data.screenshot) {
    screenshotUrl = await uploadScreenshot(token, id, parsed.data.screenshot);
  }

  if (options.kv) {
    const record = {
      id,
      createdAt: new Date().toISOString(),
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      problem: parsed.data.problem,
      screenshotMime: parsed.data.screenshot?.mime || null,
      screenshotBase64: parsed.data.screenshot?.base64 || null,
      screenshotUrl
    };
    await options.kv.put("fix:" + id, JSON.stringify(record));
  }

  if (token) {
    const issue = await createIssue(token, parsed.data, id, screenshotUrl);
    if (!issue.ok) {
      if (options.kv) {
        return {
          status: 200,
          json: {
            ok: true,
            id,
            stored: true,
            warning: issue.error
          }
        };
      }
      return { status: 502, json: { error: issue.error } };
    }
    issueUrl = issue.url;
    issueNumber = issue.number;
    return {
      status: 200,
      json: { ok: true, id, issueUrl, issueNumber, stored: Boolean(options.kv) }
    };
  }

  if (options.writeLocal) {
    const local = options.writeLocal(parsed.data);
    return {
      status: 200,
      json: {
        ok: true,
        id: local.id,
        local: true,
        message: "Saved locally under data/fixes/inbox (no GITHUB_TOKEN)."
      }
    };
  }

  if (options.kv) {
    return { status: 200, json: { ok: true, id, stored: true } };
  }

  return {
    status: 503,
    json: {
      error: "Fixes are not connected yet. Add FIXES_KV or GITHUB_TOKEN on the API worker."
    }
  };
}

export type FixesEnv = {
  GITHUB_TOKEN?: string;
  DONATE_PUBLIC_ORIGIN?: string;
  FIXES_PUBLIC_ORIGIN?: string;
  FIXES_KV?: FixesKv;
};

function publicOrigin(request: Request, env: FixesEnv): string {
  return (
    env.FIXES_PUBLIC_ORIGIN ||
    env.DONATE_PUBLIC_ORIGIN ||
    request.headers.get("origin") ||
    "https://patrista.com"
  );
}

/** Web Fetch adapter for Vite-adjacent tests and Cloudflare Workers. */
export async function handleFixesFetch(request: Request, env: FixesEnv = {}): Promise<Response | null> {
  const url = new URL(request.url);
  if (!isFixesPath(url.pathname)) return null;
  const origin = publicOrigin(request, env);
  const cors = fixesCorsHeaders(origin);
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "content-type": "application/json; charset=utf-8", ...cors }
    });
  }
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const result = await handleFixesSubmit(body, {
    githubToken: env.GITHUB_TOKEN,
    kv: env.FIXES_KV
  });
  return new Response(JSON.stringify(result.json), {
    status: result.status,
    headers: { "content-type": "application/json; charset=utf-8", ...cors }
  });
}
