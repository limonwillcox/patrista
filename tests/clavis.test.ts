// @ts-nocheck
import { mkdtempSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it } from "vitest";
import { attachTextFile } from "../scripts/clavis/attach-text.mjs";
import {
  applyAuthorDetails,
  importWorks,
  importWorksFile,
  openDatabase,
  readAuthorDetails,
  readWorkRows
} from "../scripts/clavis/import-works.mjs";
import { packClavisSqlite } from "../scripts/clavis/pack-sqlite.mjs";
import {
  attachReadyBatch,
  listEnglishFiles,
  loadWorks,
  planEnglishAttaches,
  trimCcelIndex
} from "../scripts/clavis/attach-english.mjs";
import worker from "../server/donate-worker";
import {
  CLAVIS_DRAFT_CACHE_CONTROL,
  CLAVIS_TEXT_CACHE_CONTROL,
  handleClavisFetch,
  isEnglishReady
} from "../server/clavis-api";

const ROOT = join(import.meta.dirname, "..");
const FIXTURE = join(ROOT, "data/clavis/fixtures/works.jsonl");
const ENGLISH = join(ROOT, "data/clavis/fixtures/retractationes-english.txt");
const SCHEMA = join(ROOT, "data/clavis/schema.sql");
const AUGUSTINE = "E84EBB53FD524B8F8CD332CC55C805D1";
const AUGUSTINE_AUTHOR = "A4300000000000000000000000000001";
const ACACIUS_WORK = "6F4F6BC373DE46C0B5C6093B651B0EAE";

const dirs = [];

function tempDir() {
  const dir = mkdtempSync(join(tmpdir(), "clavis-"));
  dirs.push(dir);
  return dir;
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop(), { recursive: true, force: true });
});

function sqliteD1(db) {
  return {
    prepare(sql) {
      const stmt = db.prepare(sql);
      let params = [];
      const api = {
        bind(...values) {
          params = values;
          return api;
        },
        async all() {
          return { results: stmt.all(...params) };
        },
        async first() {
          return stmt.get(...params) ?? null;
        }
      };
      return api;
    }
  };
}

function fileBucket(root) {
  return {
    async get(key) {
      const match = /^clavis\/texts\/([A-F0-9]{32})\/(english|original)\.txt$/.exec(key);
      if (!match) return null;
      try {
        const body = readFileSync(join(root, match[1], match[2] + ".txt"));
        return { body, size: body.byteLength };
      } catch {
        return null;
      }
    }
  };
}

describe("Formatting English gate", () => {
  it("requires language=english and status=ready", () => {
    expect(isEnglishReady([])).toBe(false);
    expect(isEnglishReady([{ language: "english", status: "draft" }])).toBe(false);
    expect(isEnglishReady([{ language: "original", status: "ready" }])).toBe(false);
    expect(isEnglishReady([{ language: "english", status: "ready" }])).toBe(true);
    expect(isEnglishReady([{ language: "english", status: "ready", source_path: "Fathers/English/Augustine_English/retractations.txt" }])).toBe(true);
  });
});

describe("schema → import fixture → attach english → author works text", () => {
  it("nests a ready English body under Retractationes without storing the body in sqlite", () => {
    const dir = tempDir();
    const sqlitePath = join(dir, "clavis.sqlite");
    const bodies = join(dir, "bodies");
    const packed = packClavisSqlite(FIXTURE, sqlitePath);
    expect(packed).toMatchObject({ authors: 2, works: 3, rows: 3, duplicateRows: 0 });

    const again = packClavisSqlite(FIXTURE, sqlitePath);
    expect(again.works).toBe(3);

    const db = openDatabase(sqlitePath);
    try {
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all();
      expect(tables.map((row) => row.name)).toEqual(["authors", "work_texts", "works"]);

      const pk = db.prepare("SELECT sql FROM sqlite_master WHERE name = 'work_texts'").get();
      expect(String(pk.sql)).toMatch(/PRIMARY KEY \(work_id, language\)/);
      expect(String(pk.sql)).not.toMatch(/\bbody\b/i);

      const author = db.prepare("SELECT name_latin, letter_bucket FROM authors WHERE author_id = ?").get(AUGUSTINE_AUTHOR);
      expect(author).toMatchObject({
        name_latin: "Augustinus episcopus Hipponensis",
        letter_bucket: "A"
      });

      const child = db.prepare("SELECT parent_work_id, title_latin FROM works WHERE work_id = ?").get("A4300000000000000000000000000002");
      expect(child).toMatchObject({ parent_work_id: AUGUSTINE, title_latin: "Retractationes liber I" });

      const acacius = db.prepare("SELECT parent_work_id, clavis_codes, path_json FROM works WHERE work_id = ?").get(ACACIUS_WORK);
      expect(acacius.parent_work_id).toBeNull();
      expect(JSON.parse(acacius.clavis_codes)).toEqual(["CPG-5991", "CPG-9123"]);
      expect(JSON.parse(acacius.path_json)).toEqual(["Genuina"]);

      expect(() => {
        db.prepare("INSERT INTO work_texts (work_id, language, status) VALUES (?, 'french', 'draft')").run(AUGUSTINE);
      }).toThrow(/CHECK constraint failed/);
    } finally {
      db.close();
    }

    const draft = attachTextFile({
      sqlitePath,
      filePath: ENGLISH,
      workId: AUGUSTINE,
      language: "english",
      title: "Retractations",
      status: "draft",
      sourcePath: "data/clavis/fixtures/retractationes-english.txt",
      bodiesRoot: bodies
    });
    expect(draft.r2_key).toBe("clavis/texts/" + AUGUSTINE + "/english.txt");
    expect(draft.status).toBe("draft");

    const ready = attachTextFile({
      sqlitePath,
      filePath: ENGLISH,
      workId: AUGUSTINE,
      language: "english",
      title: "Retractations",
      status: "ready",
      sourcePath: "data/clavis/fixtures/retractationes-english.txt",
      bodiesRoot: bodies
    });
    expect(ready.content_sha256).toBe(draft.content_sha256);
    expect(ready.byte_size).toBeGreaterThan(0);

    const original = attachTextFile({
      sqlitePath,
      filePath: ENGLISH,
      workId: AUGUSTINE,
      language: "original",
      title: "Retractationes",
      status: "draft",
      sourcePath: "data/clavis/fixtures/retractationes-english.txt",
      bodiesRoot: bodies
    });
    expect(original.language).toBe("original");

    const check = openDatabase(sqlitePath);
    try {
      const texts = check.prepare("SELECT language, status FROM work_texts WHERE work_id = ? ORDER BY language").all(AUGUSTINE);
      expect(texts).toEqual([
        { language: "english", status: "ready" },
        { language: "original", status: "draft" }
      ]);
      const nested = check.prepare(`
        SELECT a.name_latin AS author, w.title_latin AS title, t.language, t.status, t.r2_key, t.title AS text_title
        FROM authors a
        JOIN works w ON w.author_id = a.author_id
        JOIN work_texts t ON t.work_id = w.work_id
        WHERE w.work_id = ? AND t.language = 'english'
      `).get(AUGUSTINE);
      expect(nested).toMatchObject({
        author: "Augustinus episcopus Hipponensis",
        title: "Retractationes",
        language: "english",
        status: "ready",
        r2_key: "clavis/texts/" + AUGUSTINE + "/english.txt",
        text_title: "Retractations"
      });
      const stored = JSON.stringify(check.prepare("SELECT * FROM work_texts").all());
      expect(stored).not.toContain("It is not a Fathers/English file");
      expect(readFileSync(join(bodies, AUGUSTINE, "english.txt"), "utf8")).toContain("Fixture English body");
    } finally {
      check.close();
    }

    const renamed = readWorkRows(FIXTURE).map((row) =>
      row.author_id === AUGUSTINE_AUTHOR ? { ...row, name_latin: "Augustinus Hipponensis" } : row
    );
    const live = openDatabase(sqlitePath);
    try {
      importWorks(live, renamed, "2026-09-23T00:00:00.000Z");
      const count = live.prepare("SELECT COUNT(*) AS n FROM authors").get();
      expect(count.n).toBe(2);
      const name = live.prepare("SELECT name_latin FROM authors WHERE author_id = ?").get(AUGUSTINE_AUTHOR);
      expect(name.name_latin).toBe("Augustinus Hipponensis");
      const still = live.prepare("SELECT status FROM work_texts WHERE work_id = ? AND language = 'english'").get(AUGUSTINE);
      expect(still.status).toBe("ready");
    } finally {
      live.close();
    }
  });

  it("refuses to attach a work that was not imported", () => {
    const dir = tempDir();
    const sqlitePath = join(dir, "clavis.sqlite");
    packClavisSqlite(FIXTURE, sqlitePath);
    expect(() =>
      attachTextFile({
        sqlitePath,
        filePath: ENGLISH,
        workId: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        language: "english",
        bodiesRoot: join(dir, "bodies")
      })
    ).toThrow(/not in works/);
  });
});

describe("clavis worker", () => {
  it("returns 503 without CLAVIS_DB and leaves donate on its own path", async () => {
    const authors = await handleClavisFetch(new Request("https://patrista.com/api/clavis/authors"));
    expect(authors?.status).toBe(503);
    expect(await authors.json()).toEqual({
      error: "Clavis database is not connected. Bind D1 CLAVIS_DB."
    });

    const donate = await worker.fetch(
      new Request("https://patrista.com/api/donate/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountCents: 500, interval: "once", feeCover: false })
      })
    );
    expect(donate.status).toBe(503);
    expect(String((await donate.json()).error)).toMatch(/not connected/i);

    const viaWorker = await worker.fetch(new Request("https://patrista.com/api/clavis/authors"));
    expect(viaWorker.status).toBe(503);

    const other = await worker.fetch(new Request("https://patrista.com/api/catalog"));
    expect(other.status).toBe(404);

    const ignored = await handleClavisFetch(new Request("https://patrista.com/api/donate/checkout"));
    expect(ignored).toBeNull();
  });

  it("reads author → works → ready English text from D1 and R2", async () => {
    const dir = tempDir();
    const sqlitePath = join(dir, "clavis.sqlite");
    const bodies = join(dir, "bodies");
    packClavisSqlite(FIXTURE, sqlitePath);
    attachTextFile({
      sqlitePath,
      filePath: ENGLISH,
      workId: AUGUSTINE,
      language: "english",
      title: "Retractations",
      status: "ready",
      sourcePath: "data/clavis/fixtures/retractationes-english.txt",
      bodiesRoot: bodies
    });

    const db = new DatabaseSync(sqlitePath, { readOnly: true, enableForeignKeyConstraints: true });
    try {
      const env = { CLAVIS_DB: sqliteD1(db), CLAVIS_TEXTS: fileBucket(bodies) };
      const authors = await handleClavisFetch(new Request("https://patrista.com/api/clavis/authors"), env);
      expect(authors.status).toBe(200);
      expect(authors.headers.get("cache-control")).toBe("public, max-age=300");
      const authorJson = await authors.json();
      expect(authorJson.authors.map((row) => row.name_latin)).toEqual([
        "Acacius Constantinopolitanus",
        "Augustinus episcopus Hipponensis"
      ]);

      const worksRes = await handleClavisFetch(
        new Request("https://patrista.com/api/clavis/authors/" + AUGUSTINE_AUTHOR + "/works"),
        env
      );
      expect(worksRes.status).toBe(200);
      const worksJson = await worksRes.json();
      expect(worksJson.author.name_latin).toBe("Augustinus episcopus Hipponensis");
      const retract = worksJson.works.find((work) => work.work_id === AUGUSTINE);
      expect(retract.title_latin).toBe("Retractationes");
      expect(retract.english_ready).toBe(true);
      expect(retract.texts).toEqual([
        expect.objectContaining({
          language: "english",
          status: "ready",
          title: "Retractations",
          r2_key: "clavis/texts/" + AUGUSTINE + "/english.txt"
        })
      ]);
      const child = worksJson.works.find((work) => work.work_id === "A4300000000000000000000000000002");
      expect(child.parent_work_id).toBe(AUGUSTINE);
      expect(child.english_ready).toBe(false);

      const one = await handleClavisFetch(new Request("https://patrista.com/api/clavis/works/" + AUGUSTINE), env);
      expect((await one.json()).work.clavis).toEqual(["CPL-250"]);

      const text = await handleClavisFetch(
        new Request("https://patrista.com/api/clavis/works/" + AUGUSTINE + "/text?language=english"),
        env
      );
      expect(text.status).toBe(200);
      expect(text.headers.get("content-type")).toContain("text/plain");
      expect(text.headers.get("cache-control")).toBe(CLAVIS_TEXT_CACHE_CONTROL);
      expect(text.headers.get("x-clavis-text-status")).toBe("ready");
      expect(await text.text()).toContain("Fixture English body");

      const noBucket = await handleClavisFetch(
        new Request("https://patrista.com/api/clavis/works/" + AUGUSTINE + "/text?language=english"),
        { CLAVIS_DB: sqliteD1(db) }
      );
      expect(noBucket.status).toBe(501);
      expect(await noBucket.json()).toEqual({
        error: "Clavis text bucket is not connected. Bind R2 CLAVIS_TEXTS."
      });
    } finally {
      db.close();
    }
  });

  it("does not cache a draft English body as public", async () => {
    const dir = tempDir();
    const sqlitePath = join(dir, "clavis.sqlite");
    const bodies = join(dir, "bodies");
    packClavisSqlite(FIXTURE, sqlitePath);
    attachTextFile({
      sqlitePath,
      filePath: ENGLISH,
      workId: AUGUSTINE,
      language: "english",
      status: "draft",
      bodiesRoot: bodies
    });
    const db = new DatabaseSync(sqlitePath, { readOnly: true });
    try {
      const env = { CLAVIS_DB: sqliteD1(db), CLAVIS_TEXTS: fileBucket(bodies) };
      const work = await handleClavisFetch(new Request("https://patrista.com/api/clavis/works/" + AUGUSTINE), env);
      expect((await work.json()).work.english_ready).toBe(false);
      const text = await handleClavisFetch(
        new Request("https://patrista.com/api/clavis/works/" + AUGUSTINE + "/text?language=english"),
        env
      );
      expect(text.headers.get("cache-control")).toBe(CLAVIS_DRAFT_CACHE_CONTROL);
      expect(text.headers.get("x-clavis-text-status")).toBe("draft");
    } finally {
      db.close();
    }
  });

  it("rejects an unknown language", async () => {
    const dir = tempDir();
    const sqlitePath = join(dir, "clavis.sqlite");
    packClavisSqlite(FIXTURE, sqlitePath);
    const db = new DatabaseSync(sqlitePath, { readOnly: true });
    try {
      const res = await handleClavisFetch(
        new Request("https://patrista.com/api/clavis/works/" + AUGUSTINE + "/text?language=french"),
        { CLAVIS_DB: sqliteD1(db), CLAVIS_TEXTS: fileBucket(join(dir, "bodies")) }
      );
      expect(res.status).toBe(400);
    } finally {
      db.close();
    }
  });
});

describe("clavis spine and English tranche", () => {
  const spine = join(ROOT, "data/clavis/imports/works-by-author.jsonl");
  const authors = join(ROOT, "data/clavis/imports/authors-expanded.jsonl");
  const planPath = join(ROOT, "data/clavis/imports/batch-001-promote-plan.json");
  const faustusId = "ED338925AEC5413192EB2FC79F806212";

  it("imports the multi-work Clavis spine idempotently", () => {
    const dir = tempDir();
    const sqlitePath = join(dir, "clavis.sqlite");
    const rows = readWorkRows(spine);
    expect(rows.length).toBeGreaterThan(5000);
    const counts = importWorksFile(spine, sqlitePath);
    expect(counts.rows).toBe(rows.length);
    expect(counts.works).toBe(new Set(rows.map((row) => row.work_id)).size);
    expect(counts.authors).toBeGreaterThan(200);
    expect(counts.duplicateRows).toBe(rows.length - counts.works);
    const again = importWorksFile(spine, sqlitePath);
    expect(again.works).toBe(counts.works);
    expect(again.authors).toBe(counts.authors);

    const db = openDatabase(sqlitePath);
    try {
      const urls = applyAuthorDetails(db, readAuthorDetails(authors));
      expect(urls.updated).toBeGreaterThan(200);
      const retract = db.prepare("SELECT title_latin FROM works WHERE work_id = ?").get(AUGUSTINE);
      expect(retract.title_latin).toBe("Retractationes");
      const acacius = db.prepare("SELECT detail_url FROM authors WHERE author_id = ?").get("553436765CE645E3BBE5B69EBC2B87D1");
      expect(String(acacius.detail_url)).toMatch(/^https:\/\/clavis\.brepols\.net\//);
    } finally {
      db.close();
    }
  });

  it("attaches a real Fathers/English file only when english is ready", () => {
    const dir = tempDir();
    const sqlitePath = join(dir, "clavis.sqlite");
    importWorksFile(spine, sqlitePath);
    const db = openDatabase(sqlitePath);
    try {
      const before = db.prepare("SELECT COUNT(*) AS n FROM work_texts").get();
      expect(before.n).toBe(0);
      expect(isEnglishReady([])).toBe(false);

      const files = listEnglishFiles(join(ROOT, "Fathers/English"));
      const plan = JSON.parse(readFileSync(planPath, "utf8"));
      const planned = planEnglishAttaches(loadWorks(db), files, plan);
      const faustus = planned.ready.find((row) => row.source_path.endsWith("Reply to Faustus the Manichaean.txt"));
      expect(faustus).toMatchObject({
        work_id: faustusId,
        language: "english",
        status: "ready",
        title_latin: "Contra Faustum Manichaeum"
      });
      expect(planned.ready.some((row) => row.source_path.endsWith("/Letters.txt"))).toBe(false);
      expect(planned.skipped).toContainEqual(expect.objectContaining({
        source_path: "Fathers/English/Athanasius_English/On the Incarnation of the Word.txt",
        reason: "collection"
      }));
      expect(planned.skipped).toContainEqual(expect.objectContaining({
        source_path: "Fathers/English/Augustine_English/The Confessions of St. Augustine. Augustine.txt",
        reason: "duplicate_file"
      }));

      attachReadyBatch({
        db,
        ready: [faustus],
        repoRoot: ROOT,
        bodiesRoot: join(dir, "bodies")
      });
      const text = db.prepare("SELECT language, status, r2_key FROM work_texts WHERE work_id = ?").get(faustusId);
      expect(text).toMatchObject({
        language: "english",
        status: "ready",
        r2_key: "clavis/texts/" + faustusId + "/english.txt"
      });
      expect(isEnglishReady([text])).toBe(true);
      expect(isEnglishReady([{ language: "english", status: "draft" }])).toBe(false);
      const letters = db.prepare("SELECT COUNT(*) AS n FROM work_texts WHERE source_path LIKE '%Letters.txt'").get();
      expect(letters.n).toBe(0);
      expect(Object.keys(db.prepare("SELECT * FROM work_texts").get())).not.toContain("body");
    } finally {
      db.close();
    }
  });

  it("drops a trailing CCEL cache index and leaves a short file unchanged", () => {
    const dump = Array.from({ length: 40 }, (_, i) => i + ". file:///ccel/s/schaff/anf03/cache/x.html").join("\n");
    const trimmed = trimCcelIndex("Of Patience.\nChapter I.\n" + dump + "\n");
    expect(trimmed).toBe("Of Patience.\nChapter I.\n");
    expect(trimmed).not.toContain("file:///ccel/");
    expect(trimCcelIndex("Chapter I.\nfile:///ccel/only-one\n")).toContain("file:///ccel/only-one");
  });
});

describe("schema file", () => {
  it("declares the three mirror tables and the composite text key", () => {
    const sql = readFileSync(SCHEMA, "utf8");
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS authors/);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS works/);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS work_texts/);
    expect(sql).toMatch(/PRIMARY KEY \(work_id, language\)/);
    expect(sql).toMatch(/CHECK \(language IN \('english', 'original'\)\)/);
    expect(sql).not.toMatch(/\bbody\b/i);
  });
});
