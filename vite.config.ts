/// <reference types="vitest/config" />
import { copyFileSync, createReadStream, cpSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "fs";
import type { IncomingMessage, ServerResponse } from "http";
import { getCatalog, getWork, getWorkOutline } from "./server/api";
import {
  CHURCH_HISTORY_CANONICAL_PATH,
  CHURCH_HISTORY_DESCRIPTION,
  CHURCH_HISTORY_INTRO_DESCRIPTION,
  CHURCH_HISTORY_INTRO_TITLE,
  CHURCH_HISTORY_TIMELINE_PATH,
  CHURCH_HISTORY_TITLE,
  churchHistoryJsonLd,
  renderChurchHistoryCinematicHtml,
  renderChurchHistoryHtml
} from "./server/churchHistory";
import {
  CHURCH_FATHERS_CANONICAL_PATH,
  CHURCH_FATHERS_DESCRIPTION,
  CHURCH_FATHERS_TITLE,
  churchFathersJsonLd,
  renderChurchFathersHtml
} from "./server/shelf";
import {
  applyReadCanonical,
  prerenderShell,
  readCanonMap,
  renderHomeStaticHtml,
  renderReadShell,
  renderSitemaps,
  robotsTxt,
  workCanonicalMap,
  writeFatherPages,
  writeSplitNotes
} from "./server/staticFathers";
import { writeFatherDirectoryPages } from "./server/fatherDirectoryPages";
import { auditSeo, oldChapterUrls } from "./server/seoAudit";
import { assignChapterSlugs, chapterPublicPath, legacyChapterSlugs } from "./src/lib/fatherPaths";
import { FATHER_IMAGES } from "./src/lib/fatherImages";
import { dirname, extname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fathersApiPlugin } from "./server/plugin";
import { writeStaticBibleApi } from "./server/staticBible";
import { writeStaticLinksApi } from "./server/staticLinks";

const root = dirname(fileURLToPath(import.meta.url));

const MIME: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

const SITE_ORIGIN = "https://patrista.com";

/**
 * Emit a crawlable page from the built shell. React replaces #root when it
 * boots; the substitutions are checked so a missing slot fails the build.
 */
function writePrerenderedPage(
  dist: string,
  indexHtml: string,
  opts: {
    outRel: string;
    canonicalPath: string;
    bodyHtml: string;
    label: string;
    title: string;
    description: string;
    jsonLd?: unknown;
  }
): void {
  let html: string;
  try {
    html = prerenderShell(indexHtml, SITE_ORIGIN, opts);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(opts.label + " " + message);
  }
  const outFile = join(dist, opts.outRel);
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, html);
}

function writeChurchHistoryPage(dist: string, indexHtml: string, catalog: ReturnType<typeof getCatalog>): void {
  writePrerenderedPage(dist, indexHtml, {
    outRel: join("church-history", "index.html"),
    canonicalPath: CHURCH_HISTORY_CANONICAL_PATH,
    bodyHtml: renderChurchHistoryCinematicHtml(),
    label: "church-history",
    title: CHURCH_HISTORY_INTRO_TITLE,
    description: CHURCH_HISTORY_INTRO_DESCRIPTION
  });
  writePrerenderedPage(dist, indexHtml, {
    outRel: join("church-history", "timeline", "index.html"),
    canonicalPath: CHURCH_HISTORY_TIMELINE_PATH,
    bodyHtml: renderChurchHistoryHtml(catalog),
    label: "church-history-timeline",
    title: CHURCH_HISTORY_TITLE,
    description: CHURCH_HISTORY_DESCRIPTION,
    jsonLd: churchHistoryJsonLd(SITE_ORIGIN)
  });
}

function writeChurchFathersPage(dist: string, indexHtml: string, catalog: ReturnType<typeof getCatalog>): void {
  writePrerenderedPage(dist, indexHtml, {
    outRel: join("church-fathers", "index.html"),
    canonicalPath: CHURCH_FATHERS_CANONICAL_PATH,
    bodyHtml: renderChurchFathersHtml(catalog),
    label: "church-fathers",
    title: CHURCH_FATHERS_TITLE,
    description: CHURCH_FATHERS_DESCRIPTION,
    jsonLd: churchFathersJsonLd(SITE_ORIGIN, catalog)
  });
}

function installReadCanonicalMiddleware(server: { middlewares: { stack: { route: string; handle: (req: IncomingMessage, res: ServerResponse, next: () => void) => void }[] } }): void {
  server.middlewares.stack.unshift({
    route: "",
    handle(req, res, next) {
      if (req.method !== "GET" && req.method !== "HEAD") return next();
      const raw = req.url || "/";
      const q = raw.indexOf("?");
      const path = (q === -1 ? raw : raw.slice(0, q)).replace(/\/+$/, "") || "/";
      if (path !== "/read") return next();
      const file = join(root, "dist", "read.html");
      if (!existsSync(file)) return next();
      const params = new URLSearchParams(q === -1 ? "" : raw.slice(q + 1));
      const rawHtml = readFileSync(file, "utf8");
      const html = applyReadCanonical(rawHtml, params.get("work"), readCanonMap(rawHtml));
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      if (req.method === "HEAD") {
        res.end();
        return;
      }
      res.end(html);
    }
  });
}

let fatherExtrasWritten = false;

function extrasPlugin() {
  function serveAssets(middlewares: { use: (fn: (req: { url?: string }, res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (s?: string) => void }, next: () => void) => void) => void }) {
    middlewares.use((req, res, next) => {
      const url = req.url || "";
      if (!url.startsWith("/assets/")) return next();
      const rel = decodeURIComponent(url.replace(/^\/assets\//, "").split("?")[0]);
      if (!rel || rel.includes("..") || rel.includes("\\")) {
        res.statusCode = 400;
        res.end("bad path");
        return;
      }
      const file = join(root, "assets", rel);
      if (!existsSync(file) || !statSync(file).isFile()) return next();
      const type = MIME[extname(file).toLowerCase()] || "application/octet-stream";
      res.setHeader("Content-Type", type);
      createReadStream(file).pipe(res as unknown as NodeJS.WritableStream);
    });
  }

  return {
    name: "fathers-extras",
    configureServer(server: { middlewares: Parameters<typeof serveAssets>[0] }) {
      serveAssets(server.middlewares);
    },
    configurePreviewServer(server: { middlewares: Parameters<typeof serveAssets>[0] }) {
      serveAssets(server.middlewares);
      return () => {
        installReadCanonicalMiddleware(
          server as { middlewares: Parameters<typeof serveAssets>[0] & Parameters<typeof installReadCanonicalMiddleware>[0]["middlewares"] }
        );
      };
    },
    closeBundle() {
      // Vitest loads this config. Do not rebuild thousands of HTML files during unit tests.
      if (process.env.VITEST || fatherExtrasWritten) return;
      const dist = join(root, "dist");
      const indexPath = join(dist, "index.html");
      if (!existsSync(indexPath)) return;
      // Read the Vite shell before any page is injected. A second environment's
      // closeBundle sees the finished home page and must leave the 404 shell alone.
      const shell = readFileSync(indexPath, "utf8");
      if (!shell.includes('<div id="root"></div>')) return;
      fatherExtrasWritten = true;

      cpSync(join(root, "assets"), join(dist, "assets"), { recursive: true });
      const cname = join(root, "CNAME");
      if (existsSync(cname)) copyFileSync(cname, join(dist, "CNAME"));
      const nojekyll = join(root, ".nojekyll");
      if (existsSync(nojekyll)) copyFileSync(nojekyll, join(dist, ".nojekyll"));
      else writeFileSync(join(dist, ".nojekyll"), "");

      // Companion static pages (phone gate, settings) + assets they need.
      // Do not copy give.html: GitHub Pages serves it at /give and would hide the React Give route.
      for (const name of ["get-app.html", "settings.html"]) {
        const src = join(root, name);
        if (existsSync(src)) copyFileSync(src, join(dist, name));
      }
      mkdirSync(join(dist, "js"), { recursive: true });
      mkdirSync(join(dist, "css"), { recursive: true });
      if (existsSync(join(root, "js", "gate.js"))) {
        copyFileSync(join(root, "js", "gate.js"), join(dist, "js", "gate.js"));
      }
      if (existsSync(join(root, "src", "styles.css"))) {
        copyFileSync(join(root, "src", "styles.css"), join(dist, "css", "styles.css"));
      }
      const apiDir = join(dist, "api");
      const worksDir = join(apiDir, "works");
      mkdirSync(worksDir, { recursive: true });
      const catalog = getCatalog();
      writeFileSync(join(apiDir, "catalog.json"), JSON.stringify(catalog));

      const redirectLines = [
        "/api/catalog  /api/catalog.json  200",
        "/get-app.html  /get-app.html  200",
        "/give.html  /give.html  200",
        "/settings.html  /settings.html  200",
        // Serve the prerendered page rather than falling through to the SPA catch-all.
        "/church-history  /church-history/index.html  200",
        "/church-history/  /church-history/index.html  200",
        "/church-history/timeline  /church-history/timeline/index.html  200",
        "/church-history/timeline/  /church-history/timeline/index.html  200",
        "/church-fathers  /church-fathers/index.html  200",
        "/church-fathers/  /church-fathers/index.html  200"
      ];
      // Renamed works: keep old static URLs working. Each old Didache chapter URL goes straight to its
      // numbered page (/fathers/didache/didache/chapter-<N>/), not through a second stub hop.
      redirectLines.push("/fathers/didache/teaching-of-the-twelve-apostles.html  /fathers/didache/didache.html  301");
      const didache = getWork("didache");
      if (didache && didache.chapters.length > 1) {
        const numbered = assignChapterSlugs(didache.chapters);
        const legacy = legacyChapterSlugs(didache.chapters);
        const oldBase = "/fathers/didache/teaching-of-the-twelve-apostles/";
        for (const ch of didache.chapters) {
          const target = chapterPublicPath("didache", "didache", numbered.get(ch.chapter)!);
          for (const slug of new Set([legacy.get(ch.chapter)!, numbered.get(ch.chapter)!])) {
            redirectLines.push(oldBase + slug + "/  " + target + "  301", oldBase + slug + "  " + target + "  301");
          }
        }
      }
      redirectLines.push("/fathers/didache/teaching-of-the-twelve-apostles/*  /fathers/didache/didache.html  301");
      const sitemapUrls = [
        SITE_ORIGIN + "/",
        SITE_ORIGIN + CHURCH_FATHERS_CANONICAL_PATH,
        SITE_ORIGIN + CHURCH_HISTORY_CANONICAL_PATH,
        SITE_ORIGIN + CHURCH_HISTORY_TIMELINE_PATH,
        SITE_ORIGIN + "/about",
        SITE_ORIGIN + "/give"
      ];

      writeChurchHistoryPage(dist, shell, catalog);
      writeChurchFathersPage(dist, shell, catalog);

      for (const w of catalog.works) {
        const payload = getWork(w.id);
        const outline = getWorkOutline(w.id);
        if (!payload || !outline) continue;
        writeFileSync(join(worksDir, w.id + ".json"), JSON.stringify(outline));
        writeFileSync(join(worksDir, w.id + ".text.json"), JSON.stringify(payload));
        redirectLines.push("/api/works/" + w.id + "  /api/works/" + w.id + ".json  200");
        redirectLines.push("/api/works/" + w.id + "/text  /api/works/" + w.id + ".text.json  200");
        const chapterDir = join(worksDir, w.id, "chapters");
        mkdirSync(chapterDir, { recursive: true });
        for (const chapter of payload.chapters) {
          writeFileSync(join(chapterDir, chapter.chapter + ".json"), JSON.stringify(chapter));
        }
      }

      const directory = writeFatherDirectoryPages(dist, shell, catalog, SITE_ORIGIN, FATHER_IMAGES);
      redirectLines.push(...directory.redirects);
      sitemapUrls.push(...directory.urls);
      console.log("[fathers] " + directory.urls.length + " directory URLs");

      const fathers = writeFatherPages(dist, shell, catalog, SITE_ORIGIN);
      writeSplitNotes(dist, fathers.notes);
      sitemapUrls.push(...fathers.urls);
      console.log("[fathers] " + fathers.stubs.length + " old chapter URLs now stub pages, " + fathers.reused.length + " reused as new chapter numbers");
      console.log(
        "[fathers] " +
          fathers.urls.length +
          " work and chapter URLs, " +
          fathers.notes.length +
          " ambiguous splits"
      );
      for (const note of fathers.notes) {
        console.log("[fathers] " + note.author + "/" + note.id + ": " + note.reason);
      }

      writeFileSync(
        join(dist, "read.html"),
        renderReadShell(shell, workCanonicalMap(catalog, SITE_ORIGIN), SITE_ORIGIN + CHURCH_FATHERS_CANONICAL_PATH)
      );
      writeFileSync(
        indexPath,
        prerenderShell(shell, SITE_ORIGIN, {
          canonicalPath: "/",
          title: "Patrista — a searchable library of the Church Fathers",
          description:
            "Look up a father, a work, or a keyword. Public-domain translations of the Church Fathers in a clean reading layout.",
          bodyHtml: renderHomeStaticHtml(catalog)
        })
      );
      // GitHub Pages serves /give from give.html and unknown paths from 404.html.
      // Both must stay the empty SPA shell, written after index.html becomes the home page.
      writeFileSync(join(dist, "404.html"), shell);
      writeFileSync(join(dist, "give.html"), shell);

      redirectLines.push(...writeStaticBibleApi(dist));
      redirectLines.push(...writeStaticLinksApi(dist));
      redirectLines.push("/*    /index.html   200", "");
      writeFileSync(join(dist, "_redirects"), redirectLines.join("\n"));
      for (const file of renderSitemaps(sitemapUrls, SITE_ORIGIN)) {
        writeFileSync(join(dist, file.name), file.body);
      }
      writeFileSync(join(dist, "robots.txt"), robotsTxt(SITE_ORIGIN));
      const seo = auditSeo(
        dist,
        SITE_ORIGIN,
        oldChapterUrls(
          catalog.works.flatMap((w) => {
            const p = getWork(w.id);
            return p ? [{ authorId: p.author.id, workId: p.work.id, chapters: p.chapters }] : [];
          })
        )
      );
      console.log("[seo] " + seo.checked + " indexable pages checked, " + seo.stubs + " stubs, " + seo.errors.length + " problems");
      if (seo.errors.length) {
        for (const e of seo.errors.slice(0, 50)) console.error("[seo] " + e);
        throw new Error("SEO check failed with " + seo.errors.length + " problems (see [seo] lines above)");
      }
      writeFileSync(
        join(dist, "_headers"),
        ["/assets/father-img/*", "  Cache-Control: public, max-age=31536000, immutable", ""].join("\n")
      );
    }
  };
}

function stripCliShebang() {
  return {
    name: "strip-cli-shebang",
    enforce: "pre" as const,
    transform(code: string) {
      if (!code.startsWith("#!")) return null;
      return code.slice(code.indexOf("\n") + 1);
    }
  };
}

export default defineConfig({
  plugins: [stripCliShebang(), react(), fathersApiPlugin(), extrasPlugin()],
  resolve: {
    alias: {
      "@": resolve(root, "src")
    }
  },
  server: {
    host: "127.0.0.1",
    port: 5173
  },
  preview: {
    host: "127.0.0.1",
    port: 4173
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"]
  }
});
