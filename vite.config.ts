/// <reference types="vitest/config" />
import { copyFileSync, createReadStream, cpSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "fs";
import type { IncomingMessage, ServerResponse } from "http";
import { getCatalog, getWork, getWorkOutline } from "./server/api";
import {
  CHURCH_HISTORY_CANONICAL_PATH,
  CHURCH_HISTORY_INTRO_DESCRIPTION,
  CHURCH_HISTORY_INTRO_TITLE,
  renderChurchHistoryCinematicHtml
} from "./server/churchHistory";
import {
  addLegacyRedirect,
  applyReadCanonical,
  clearLegacyRedirects,
  legacyChapterUrls,
  prerenderShell,
  readCanonMap,
  renderHomeStaticHtml,
  renderReadShell,
  renderSitemaps,
  renderStubPage,
  robotsTxt,
  workCanonicalMap,
  writeFatherPages,
  writeLegacyRedirects,
  writeSplitNotes,
  writeReadPathAliases
} from "./server/staticFathers";
import { packStaticChapters } from "./server/packChapters";
import { writeFatherDirectoryPages } from "./server/fatherDirectoryPages";
import { MOVED_CHAPTERS, MOVED_WORKS, WORK_READ_PATHS } from "./src/lib/workSlugs";
import { auditSeo, oldChapterUrls } from "./server/seoAudit";
import { assignChapterSlugs, chapterPublicPath, legacyChapterSlugs, workPublicPath } from "./src/lib/fatherPaths";
import { FATHER_IMAGES } from "./src/lib/fatherImages";
import { dirname, extname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fathersApiPlugin } from "./server/plugin";
import { writeStaticBibleApi } from "./server/staticBible";
import { writeStaticLinksApi } from "./server/staticLinks";
import { writeSearchIndex } from "./server/searchIndex";
import { writeScriptureIndex } from "./server/scriptureIndex";
import { APP_PAGES } from "./server/appPages";
import { writeTypeSharePages } from "./server/typeSharePages";

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
    extraHead?: string;
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

function writeChurchHistoryPage(dist: string, indexHtml: string): void {
  writePrerenderedPage(dist, indexHtml, {
    outRel: join("church-history", "index.html"),
    canonicalPath: CHURCH_HISTORY_CANONICAL_PATH,
    bodyHtml: renderChurchHistoryCinematicHtml(),
    label: "church-history",
    title: CHURCH_HISTORY_INTRO_TITLE,
    description: CHURCH_HISTORY_INTRO_DESCRIPTION
  });
  // The timeline now lives on the Fathers page, each event in its century. Old links get a stub that
  // forwards there (GitHub Pages ignores _redirects); the browser keeps any #event fragment.
  const timeline = join(dist, "church-history", "timeline", "index.html");
  mkdirSync(dirname(timeline), { recursive: true });
  writeFileSync(timeline, renderStubPage(SITE_ORIGIN + "/fathers/", "/fathers/"));
}

/**
 * App routes with no file of their own (/about, /bible, /search …) got 404.html and an HTTP 404 from
 * GitHub Pages. GitHub Pages serves /about from about.html, so each gets a page with a 200.
 */
function writeAppPages(dist: string, indexHtml: string): void {
  for (const page of APP_PAGES) {
    writePrerenderedPage(dist, indexHtml, {
      outRel: page.path.slice(1) + ".html",
      canonicalPath: page.path,
      bodyHtml: page.bodyHtml,
      label: page.path,
      title: page.title,
      description: page.description,
      extraHead: page.noindex ? '    <meta name="robots" content="noindex" />' : undefined
    });
  }
}

/** The old shelf page is now each Father's bookcase on /fathers/. */
function writeLibraryRedirect(dist: string): void {
  const file = join(dist, "church-fathers", "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, renderStubPage(SITE_ORIGIN + "/fathers/", "/fathers/"));
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
/** Set from the resolved config. The dev server also calls closeBundle when it restarts. */
let isBuild = false;

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
    configResolved(config: { command: string }) {
      isBuild = config.command === "build";
    },
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
    async closeBundle() {
      // Vitest loads this config. Do not rebuild thousands of HTML files during unit tests.
      // The dev server also calls this hook when it restarts; only a real build writes dist/.
      if (process.env.VITEST || !isBuild || fatherExtrasWritten) return;
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

      // Companion static page (phone gate) + assets it needs.
      // Do not copy give.html: GitHub Pages serves it at /give and would hide the React Give route.
      for (const name of ["get-app.html"]) {
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
        "/settings.html  /  301",
        // Serve the prerendered page rather than falling through to the SPA catch-all.
        "/church-history  /church-history/index.html  200",
        "/church-history/  /church-history/index.html  200",
        "/church-history/timeline  /fathers/  301",
        "/church-history/timeline/  /fathers/  301",
        "/church-fathers  /fathers/  301",
        "/church-fathers/  /fathers/  301",
        "/browse  /fathers/  301"
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
      // Works filed under the wrong Father: each old URL gets a 301 and a stub page (GitHub Pages
      // ignores _redirects), pointing at the same chapter of the copy that stays.
      clearLegacyRedirects();
      for (const move of MOVED_WORKS) {
        const target = getWork(move.to.work);
        if (!target || target.author.id !== move.to.author) throw new Error("moved work: no " + move.to.author + "/" + move.to.work);
        const toPage = workPublicPath(move.to.author, move.to.work);
        const pairs: [string, string][] = [[workPublicPath(move.from.author, move.from.work), toPage]];
        if (move.chapters) {
          // Chapters do not line up: map each old chapter number, or send it to the work page.
          const count = target.chapters.length;
          for (let n = 1; n <= (move.oldChapters ?? 0); n++) {
            const to = move.chapters[n];
            pairs.push([
              chapterPublicPath(move.from.author, move.from.work, "chapter-" + n),
              to && to <= count ? chapterPublicPath(move.to.author, move.to.work, "chapter-" + to) : toPage
            ]);
          }
        } else {
          for (const slug of assignChapterSlugs(target.chapters).values()) {
            pairs.push([chapterPublicPath(move.from.author, move.from.work, slug), chapterPublicPath(move.to.author, move.to.work, slug)]);
          }
        }
        // Heading-based URLs from before renumbering (e.g. .../book-ii/) go to the chapter with that heading.
        const numbered = assignChapterSlugs(target.chapters);
        const byOldSlug = new Map<string, string>();
        for (const [chapter, oldSlug] of legacyChapterSlugs(target.chapters)) {
          byOldSlug.set(oldSlug, chapterPublicPath(move.to.author, move.to.work, numbered.get(chapter)!));
        }
        const oldPrefix = "/fathers/" + move.from.author + "/" + move.from.work + "/";
        for (const old of legacyChapterUrls(oldPrefix)) pairs.push([old, byOldSlug.get(old.slice(oldPrefix.length, -1)) ?? toPage]);
        // The first pair for an old URL is the most specific (a chapter, not the work page): keep it.
        const seen = new Set<string>();
        for (const [from, to] of pairs) {
          if (seen.has(from)) continue;
          seen.add(from);
          addLegacyRedirect(from, to);
          redirectLines.push(from + "  " + to + "  301");
        }
      }
      const sitemapUrls = [
        SITE_ORIGIN + "/",
        SITE_ORIGIN + CHURCH_HISTORY_CANONICAL_PATH,
        ...APP_PAGES.filter((p) => !p.noindex).map((p) => SITE_ORIGIN + p.path)
      ];

      writeChurchHistoryPage(dist, shell);
      writeLibraryRedirect(dist);
      writeAppPages(dist, shell);

      // A page and a picture per type, so a shared type shows its diagram where the link is pasted.
      const typeShares = await writeTypeSharePages(dist, shell, SITE_ORIGIN, join(root, "public", "connections"), catalog);
      sitemapUrls.push(...typeShares.urls);
      console.log("[types] " + typeShares.urls.length + " share pages");

      for (const w of catalog.works) {
        const payload = getWork(w.id);
        const outline = getWorkOutline(w.id);
        if (!payload || !outline) continue;
        writeFileSync(join(worksDir, w.id + ".json"), JSON.stringify(outline));
        redirectLines.push("/api/works/" + w.id + "  /api/works/" + w.id + ".json  200");
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
      // Chapters cut out of a work that stays: the freed chapter numbers point at the work the text went to.
      // Recorded after the Father pages, so these override their generic redirect to the work page.
      for (const move of MOVED_CHAPTERS) {
        const source = getWork(move.from.work);
        const target = getWork(move.to.work);
        if (!target || target.author.id !== move.to.author) throw new Error("moved chapter: no " + move.to.author + "/" + move.to.work);
        if (source && source.chapters.length >= move.from.chapter) {
          throw new Error("moved chapter: " + move.from.work + " still has chapter " + move.from.chapter);
        }
        if (move.to.chapter > target.chapters.length) throw new Error("moved chapter: " + move.to.work + " has no chapter " + move.to.chapter);
        const from = chapterPublicPath(move.from.author, move.from.work, "chapter-" + move.from.chapter);
        const to = chapterPublicPath(move.to.author, move.to.work, "chapter-" + move.to.chapter);
        addLegacyRedirect(from, to, true);
        redirectLines.push(from + "  " + to + "  301");
      }
      writeSplitNotes(dist, fathers.notes);
      writeReadPathAliases(dist, catalog, WORK_READ_PATHS);
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
        renderReadShell(shell, workCanonicalMap(catalog, SITE_ORIGIN), SITE_ORIGIN + "/fathers/")
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
      const legacyFiles = writeLegacyRedirects(dist);
      console.log("[legacy] old URLs forwarded through " + legacyFiles + " lookup files");
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
      const cited = writeScriptureIndex(dist, catalog, root);
      console.log("[scripture] " + cited + " verses cited by the Fathers");

      // Per-chapter JSON -> size-capped group files (server/packChapters.ts), for hosts with a file limit.
      const packed = packStaticChapters(dist);
      console.log("[pack] " + packed.removed + " chapter files packed into " + packed.written + " files");

      // _redirects last: drop rewrites whose target was packed away. No catch-all to index.html: an
      // unknown path gets 404.html (the app shell), as on GitHub Pages, and the shell forwards old URLs.
      const kept = redirectLines.filter((line) => {
        const [, to, code] = line.trim().split(/\s+/);
        if (code !== "200" || !to || !to.endsWith(".json")) return true;
        return existsSync(join(dist, decodeURIComponent(to).slice(1)));
      });
      writeFileSync(join(dist, "_redirects"), kept.join("\n") + "\n");
      console.log("[redirects] " + kept.length + " rules (" + (redirectLines.length - kept.length) + " dropped)");
      if (process.env.SKIP_SEARCH_INDEX) {
        console.log("[search] skipped (SKIP_SEARCH_INDEX)");
      } else {
        const started = Date.now();
        const n = await writeSearchIndex(dist, catalog);
        console.log("[search] " + n + " chapters indexed in " + Math.round((Date.now() - started) / 1000) + "s");
      }
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
