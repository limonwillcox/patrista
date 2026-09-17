import type { IncomingMessage, ServerResponse } from "http";
import { loadEnv, type Plugin } from "vite";
import { handleApiRequest } from "./api";
import {
  bibleRemoteCorsHeaders,
  handleBibleRemoteChapter,
  isBibleRemotePath
} from "./bibleRemote";
import { donateCorsHeaders, handleDonateCheckout, isDonateCheckoutPath } from "./donate";
import { fixesCorsHeaders, handleFixesSubmit, isFixesPath } from "./fixes";
import { writeLocalFix } from "./fixesLocal";
import { repoRoot } from "./corpus";

function apiMiddleware(req: IncomingMessage, res: ServerResponse, next: () => void) {
  const url = req.url || "";
  if (!url.startsWith("/api/")) return next();
  const path = url.split("?")[0].replace(/\/+$/, "") || "/";
  if (isDonateCheckoutPath(path) || isFixesPath(path) || isBibleRemotePath(path)) return next();
  try {
    const result = handleApiRequest(url);
    res.statusCode = result.status;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify(result.json));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
  }
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function donateMiddleware(env: Record<string, string>) {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const path = (req.url || "").split("?")[0].replace(/\/+$/, "") || "/";
    if (!isDonateCheckoutPath(path)) return next();

    const origin =
      (typeof req.headers.origin === "string" && req.headers.origin) ||
      env.DONATE_PUBLIC_ORIGIN ||
      "http://127.0.0.1:5173";
    const cors = donateCorsHeaders(origin);
    for (const [k, v] of Object.entries(cors)) res.setHeader(k, v);
    res.setHeader("Cache-Control", "no-store");

    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }
    if (req.method !== "POST") {
      res.statusCode = 405;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    let body: unknown = null;
    try {
      const raw = await readBody(req);
      body = raw ? JSON.parse(raw) : null;
    } catch {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: "Invalid JSON" }));
      return;
    }

    const result = await handleDonateCheckout(body, {
      secretKey: env.STRIPE_SECRET_KEY,
      publicOrigin: env.DONATE_PUBLIC_ORIGIN || origin
    });
    res.statusCode = result.status;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(result.json));
  };
}

function fixesMiddleware(env: Record<string, string>) {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const path = (req.url || "").split("?")[0].replace(/\/+$/, "") || "/";
    if (!isFixesPath(path)) return next();

    const origin =
      (typeof req.headers.origin === "string" && req.headers.origin) ||
      env.DONATE_PUBLIC_ORIGIN ||
      "http://127.0.0.1:5173";
    const cors = fixesCorsHeaders(origin);
    for (const [k, v] of Object.entries(cors)) res.setHeader(k, v);
    res.setHeader("Cache-Control", "no-store");

    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }
    if (req.method !== "POST") {
      res.statusCode = 405;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    let body: unknown = null;
    try {
      const raw = await readBody(req);
      body = raw ? JSON.parse(raw) : null;
    } catch {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: "Invalid JSON" }));
      return;
    }

    const result = await handleFixesSubmit(body, {
      githubToken: env.GITHUB_TOKEN,
      writeLocal: (data) => writeLocalFix(repoRoot(), data)
    });
    res.statusCode = result.status;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(result.json));
  };
}

function bibleRemoteMiddleware(env: Record<string, string>) {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const rawUrl = req.url || "";
    const path = rawUrl.split("?")[0].replace(/\/+$/, "") || "/";
    if (!isBibleRemotePath(path)) return next();

    const origin =
      (typeof req.headers.origin === "string" && req.headers.origin) ||
      env.DONATE_PUBLIC_ORIGIN ||
      "http://127.0.0.1:5173";
    const cors = bibleRemoteCorsHeaders(origin);
    for (const [k, v] of Object.entries(cors)) res.setHeader(k, v);
    res.setHeader("Cache-Control", "no-store");

    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }
    if (req.method !== "GET") {
      res.statusCode = 405;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    const qs = new URL(rawUrl, "http://127.0.0.1").searchParams;
    const result = await handleBibleRemoteChapter(qs.get("bibleId") || "", qs.get("chapterId") || "", {
      apiKey: env.BIBLE_API_KEY || env.VITE_BIBLE_API_KEY
    });
    res.statusCode = result.status;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(result.json));
  };
}

export function fathersApiPlugin(): Plugin {
  return {
    name: "fathers-api",
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.root, "");
      server.middlewares.use(donateMiddleware(env));
      server.middlewares.use(fixesMiddleware(env));
      server.middlewares.use(bibleRemoteMiddleware(env));
      server.middlewares.use(apiMiddleware);
    },
    configurePreviewServer(server) {
      const env = loadEnv(server.config.mode, server.config.root, "");
      server.middlewares.use(donateMiddleware(env));
      server.middlewares.use(fixesMiddleware(env));
      server.middlewares.use(bibleRemoteMiddleware(env));
      server.middlewares.use(apiMiddleware);
    }
  };
}
