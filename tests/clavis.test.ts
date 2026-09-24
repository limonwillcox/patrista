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

  it("records the staged catecheses as ready seed rows", () => {
    const lines = readFileSync(join(ROOT, "data/clavis/seeds/work-texts.jsonl"), "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    const first = lines.find((item) => item.work_id === "84D990F10C594432B98F2B7720BC8D75");
    const second = lines.find((item) => item.work_id === "CBEB3672B73940E4ABEFFB72CF7F80C5");
    expect(first).toMatchObject({
      language: "english",
      title: "First Instruction to Catechumens",
      status: "ready",
      r2_key: "clavis/texts/84D990F10C594432B98F2B7720BC8D75/english.txt",
      content_sha256: "0c063da13b5c0e8824e16f8095103471e8ae12e16fd485eeca63199cfac489b3",
      byte_size: 28572
    });
    expect(second).toMatchObject({
      language: "english",
      title: "Second Instruction to Catechumens",
      status: "ready",
      r2_key: "clavis/texts/CBEB3672B73940E4ABEFFB72CF7F80C5/english.txt",
      content_sha256: "295bb627c982b69522fe3d1aa37321fbb4f3d618fc75995ac2e1b53fe3968a05",
      byte_size: 32575
    });
    const lights = lines.find((item) => item.work_id === "99397283D8804F49A9F053C06D79114C");
    expect(lights).toMatchObject({
      language: "english",
      title: "Oration on the Holy Lights",
      status: "ready",
      r2_key: "clavis/texts/99397283D8804F49A9F053C06D79114C/english.txt",
      content_sha256: "0059129718395301566f35d33716ad800cc4a78732f227ef7a34078d3fb6dc2b",
      byte_size: 33159
    });
    const egyptians = lines.find((item) => item.work_id === "9A4671890F0F4D17B10501321F88E559");
    expect(egyptians).toMatchObject({
      language: "english",
      title: "On the Arrival of the Egyptians",
      status: "ready",
      r2_key: "clavis/texts/9A4671890F0F4D17B10501321F88E559/english.txt",
      content_sha256: "5c361a2282d481528202a02a8f85cf90d1de227300f8e27cf5bada21fd450396",
      byte_size: 17887
    });
    const baptism = lines.find((item) => item.work_id === "852554E9B5584DDBA5FCBF0FE2023387");
    expect(baptism).toMatchObject({
      language: "english",
      title: "The Oration on Holy Baptism",
      status: "ready",
      r2_key: "clavis/texts/852554E9B5584DDBA5FCBF0FE2023387/english.txt",
      content_sha256: "fe720e82d48b0c43f479959348e40ab9f28dc66f1a069b12fca144c130bcad54",
      byte_size: 83654
    });
    const donatists = lines.find((item) => item.work_id === "12E4B8193BDC4A8C97B8549A3CF39F68");
    expect(donatists).toMatchObject({
      language: "english",
      title: "The Correction of the Donatists",
      status: "ready",
      r2_key: "clavis/texts/12E4B8193BDC4A8C97B8549A3CF39F68/english.txt",
      content_sha256: "71650f991da761e2fd95640c5b8d5516ec5fb76a17a7f74b975c8f6685219083",
      byte_size: 89982
    });
    expect(lines.find((item) => item.work_id === "3C5F838B863641D3B49601A7ED110890")).toMatchObject({
      language: "english",
      title: "Defence Against the Arians",
      status: "ready",
      r2_key: "clavis/texts/3C5F838B863641D3B49601A7ED110890/english.txt",
      content_sha256: "e51dbcc1ff1006519c1a9ac08b9d885ac6688c1f84b2dc943f56e303650c4a04",
      byte_size: 212419
    });
    expect(lines.find((item) => item.work_id === "F447B660730E4BE2B4BFDB414FA24551")).toMatchObject({
      language: "english",
      title: "Defence of His Flight",
      status: "ready",
      r2_key: "clavis/texts/F447B660730E4BE2B4BFDB414FA24551/english.txt",
      content_sha256: "60eba8953545a645473fcb1ed97b1f5b4198599e5b37fef956d59bc05ef0b270",
      byte_size: 38189
    });
    expect(lines.find((item) => item.work_id === "B6538F071CEA4C239332B00E7C9B7296")).toMatchObject({
      language: "english",
      title: "Apology to the Emperor",
      status: "ready",
      r2_key: "clavis/texts/B6538F071CEA4C239332B00E7C9B7296/english.txt",
      content_sha256: "c0ebd9e2a271b2a11f9f95f71faabded991fb2a6bd6a95d0cf6052a8977ab44d",
      byte_size: 61743
    });
    expect(lines.find((item) => item.work_id === "C5D1DDB3C8924055B1EF983A824B2789")).toMatchObject({
      language: "english",
      title: "Apology Against Rufinus",
      status: "ready",
      r2_key: "clavis/texts/C5D1DDB3C8924055B1EF983A824B2789/english.txt",
      content_sha256: "735a7550fdda539aea326296c3f87f92f4c887a8bb80cd49f3a11b7ef25870a9",
      byte_size: 289625
    });
    expect(lines.find((item) => item.work_id === "E6EEE603DF9D4278A69D23BB929A5E23")).toMatchObject({
      language: "english",
      title: "To his Brother Gregory, concerning the difference between ουσία and υπόστασις",
      status: "ready",
      r2_key: "clavis/texts/E6EEE603DF9D4278A69D23BB929A5E23/english.txt",
      content_sha256: "41d30637b2c73c9e7d84ed2cd624d6d9ab6ed9683c4ca84e1204a5fab741fc76",
      byte_size: 21538
    });
    expect(lines.find((item) => item.work_id === "773B6E43A8464983BA3DFE7CF9E5CE3E")).toMatchObject({
      language: "english",
      title: "On the Temple, Schools, and Theatres in Athens",
      status: "ready",
      r2_key: "clavis/texts/773B6E43A8464983BA3DFE7CF9E5CE3E/english.txt",
      content_sha256: "7ccc12e51a708fce1a181451274b988103a02b028bcc884d778d172e3144dcb6",
      byte_size: 6162
    });
    expect(lines.find((item) => item.work_id === "ECD449066BF24006A0571686398CD252")).toMatchObject({
      language: "english",
      title: "On Naboth",
      status: "ready",
      r2_key: "clavis/texts/ECD449066BF24006A0571686398CD252/english.txt",
      content_sha256: "89aa3b96992fb67ae80c5cb8dbe54a5b230bfcdd1d5107ce28497d1e9fc33583",
      byte_size: 69026
    });
    expect(lines.find((item) => item.work_id === "87978F5DD3F84B62A7A05D83E01B3E46")).toMatchObject({
      language: "english",
      title: "The First Canonical Epistle of St. Basil to Amphilochius (Canons I–XVI)",
      status: "ready",
      r2_key: "clavis/texts/87978F5DD3F84B62A7A05D83E01B3E46/english.txt",
      content_sha256: "4d8a4043833e06db398e32a82159f4cedde423c068b23588c7ab6f6d9175c35d",
      byte_size: 6595
    });
    expect(lines.find((item) => item.work_id === "449E4FAE1FFA41F1BE26941388BC1A10")).toMatchObject({
      language: "english",
      title: "The Apology of Rufinus",
      status: "ready",
      r2_key: "clavis/texts/449E4FAE1FFA41F1BE26941388BC1A10/english.txt",
      content_sha256: "91830a81fc68afd5be0f09f11b1d7dce4dc1d71878d0dcd70774c4c40313a692",
      byte_size: 278290
    });
    expect(lines.find((item) => item.work_id === "EB66B24E69C74E3895C20EC7A567BC40")).toMatchObject({
      language: "english",
      title: "Commentary on the Apocalypse of the Blessed John",
      status: "ready",
      r2_key: "clavis/texts/EB66B24E69C74E3895C20EC7A567BC40/english.txt",
      content_sha256: "8bfaaf255d7a208bee4f57e97eb62955ee3f02b498246c870561aeda8d2dc1d2",
      byte_size: 90514
    });
    expect(lines.find((item) => item.work_id === "CE5CA020C8584E04B7A71F73083F1B70")).toMatchObject({
      language: "english",
      title: "First Book on Compunction (to Demetrius)",
      status: "ready",
      r2_key: "clavis/texts/CE5CA020C8584E04B7A71F73083F1B70/english.txt",
      content_sha256: "d6c20e948e8c09e71f4b168d786cd0dba703b022dcda166f78ecf247c883a487",
      byte_size: 69223
    });
    expect(lines.find((item) => item.work_id === "1F5F2DE50EE14B21940358C8FCDCF127")).toMatchObject({
      language: "english",
      title: "Second Book on Compunction (to Stelechius)",
      status: "ready",
      r2_key: "clavis/texts/1F5F2DE50EE14B21940358C8FCDCF127/english.txt",
      content_sha256: "4f473d4cb33a93cf0dfaf6570c9e404a8b30f89b8084f139dad8406a210aaf5a",
      byte_size: 50131
    });
    expect(lines.find((item) => item.work_id === "52A399A65F674619AC6B8185E6F3C52B")).toMatchObject({
      language: "english",
      title: "On Elias and Fasting",
      status: "ready",
      r2_key: "clavis/texts/52A399A65F674619AC6B8185E6F3C52B/english.txt",
      content_sha256: "f0b149b3cf11725875d85e0c6881da80526816a9d9cc5c2a68e21d1cd84a3a2f",
      byte_size: 77651
    });
    expect(lines.find((item) => item.work_id === "2B1F6A2E09E741F58E1A4070E2F01A7E")).toMatchObject({
      language: "english",
      title: "Of the Happiness of Death",
      status: "ready",
      r2_key: "clavis/texts/2B1F6A2E09E741F58E1A4070E2F01A7E/english.txt",
      content_sha256: "377f3e857274136c92c805de1c07a2bf49a84f63466b7d82b5b2d0a4a967377d",
      byte_size: 62920
    });
    expect(lines.find((item) => item.work_id === "625C765E8FB845EC91632AE01F33DD04")).toMatchObject({
      language: "english",
      title: "Letter CLXXXIX. To Eustathius the physician",
      status: "ready",
      r2_key: "clavis/texts/625C765E8FB845EC91632AE01F33DD04/english.txt",
      content_sha256: "22943df5cb9dbda1cc53998e6746338b336806f558fb58f6e413086b9ed143d9",
      byte_size: 15835
    });
    expect(lines.find((item) => item.work_id === "700F6347743C4F79985FCC247EB1C789")).toMatchObject({
      language: "english",
      title: "Catechetical Lectures (Procatechesis and Lectures I–XVIII)",
      status: "ready",
      r2_key: "clavis/texts/700F6347743C4F79985FCC247EB1C789/english.txt",
      content_sha256: "d4c5b8ecc26364a04eaf0a9e2ec2f039d3d74ec137c604b9242e75217483d0ce",
      byte_size: 774399
    });
    expect(lines.find((item) => item.work_id === "7ADD1965B8FE433385C0A33D8DEF1981")).toMatchObject({
      language: "english",
      title: "The Conferences of John Cassian",
      status: "ready",
      r2_key: "clavis/texts/7ADD1965B8FE433385C0A33D8DEF1981/english.txt",
      content_sha256: "7ce300172a90415aa19ac7a053932fc21e17b8cf6c6e5bdcbc757469b855d446",
      byte_size: 1166121
    });
    expect(lines.find((item) => item.work_id === "CF46D0EA186A441BB1F4C5FCF6557677")).toMatchObject({
      language: "english",
      title: "The Demonstration of the Apostolic Preaching",
      status: "ready",
      r2_key: "clavis/texts/CF46D0EA186A441BB1F4C5FCF6557677/english.txt",
      content_sha256: "1e095d515077e9f3f0144d34d766f354a60d0f888659b2fce58ef5ca6ed718b9",
      byte_size: 150581
    });
    expect(lines.find((item) => item.work_id === "7C1D229E0AB24F3B9659C216C92B5E15")).toMatchObject({
      language: "english",
      title: "Epistle I. To Donatus",
      status: "ready",
      r2_key: "clavis/texts/7C1D229E0AB24F3B9659C216C92B5E15/english.txt",
      content_sha256: "662c37cbe76f8ce98f9da2f4c88607105940ebacf28bb941c36b31c445ca6f2c",
      byte_size: 28875
    });
    expect(lines.find((item) => item.work_id === "7B2888F4BDD1433E9F58A2E1D247464B")).toMatchObject({
      language: "english",
      title: "The Epitome of the Divine Institutes",
      status: "ready",
      r2_key: "clavis/texts/7B2888F4BDD1433E9F58A2E1D247464B/english.txt",
      content_sha256: "e86dd99e9db225aa8c5ff8b44fe4c0962936bef0e16e52e97c51dc7c7813e555",
      byte_size: 396045
    });
    expect(lines.find((item) => item.work_id === "13CEA531516C45DA95FF4735A9C904FD")).toMatchObject({
      language: "english",
      title: "An Exhortation to Theodore After His Fall",
      status: "ready",
      r2_key: "clavis/texts/13CEA531516C45DA95FF4735A9C904FD/english.txt",
      content_sha256: "09889e7fc648557ab0496dafc7c08c5e6f87f7529f74c8b9fd63c80cc57f4195",
      byte_size: 132272
    });
    expect(lines.find((item) => item.work_id === "8C5F722EA3A0488D80A0B94D4101F5DD")).toMatchObject({
      language: "english",
      title: "Against Eunomius (Books I–XII)",
      status: "ready",
      r2_key: "clavis/texts/8C5F722EA3A0488D80A0B94D4101F5DD/english.txt",
      content_sha256: "93100e049c38b0f27dadaf36ba704d2d66743cdfbd20b91ab00eabfdba3e3e10",
      byte_size: 1155551
    });
    expect(lines.find((item) => item.work_id === "04B64425F4C74D5EA8591B2BE09DC275")).toMatchObject({
      language: "english",
      title: "Mystagogic Catechetical Lectures (Lectures XIX–XXIII)",
      status: "ready",
      r2_key: "clavis/texts/04B64425F4C74D5EA8591B2BE09DC275/english.txt",
      content_sha256: "c7cbd448ce324a8bbc98f1176b236989e5a736b31e8a67a2ed02c46c6dc6ac9c",
      byte_size: 77344
    });
    expect(lines.find((item) => item.work_id === "47A887850794412E9AC961924EB0A9C2")).toMatchObject({
      language: "english",
      title: "The Twelve Books on the Institutes of the Coenobia",
      status: "ready",
      r2_key: "clavis/texts/47A887850794412E9AC961924EB0A9C2/english.txt",
      content_sha256: "26136ef50369595bcc45beba6033072bb595a77a42a739af0ec36eeae60bb7be",
      byte_size: 438408
    });
    expect(lines.find((item) => item.work_id === "6359B395B9A1499D8F039ADCC60A2A3E")).toMatchObject({
      language: "english",
      title: "Treatise XII. Three Books of Testimonies Against the Jews",
      status: "ready",
      r2_key: "clavis/texts/6359B395B9A1499D8F039ADCC60A2A3E/english.txt",
      content_sha256: "497fc5af2896c87fd1adb332c59a1c850f8e54d9e201037fadc96803e3f05d70",
      byte_size: 269729
    });
    expect(lines.find((item) => item.work_id === "F36CC64FB9E04D5B8D78AEF3B7C39E74")).toMatchObject({
      language: "english",
      title: "The Discourse to the Greeks",
      status: "ready",
      r2_key: "clavis/texts/F36CC64FB9E04D5B8D78AEF3B7C39E74/english.txt",
      content_sha256: "cae1e72085f037b6be84f732964d040f3773a426a0d1aeeb5c5f667e6609990f",
      byte_size: 9947
    });
    expect(lines.find((item) => item.work_id === "8EAC5D05D03C4088B8826FEEA37215F7")).toMatchObject({
      language: "english",
      title: "The Phoenix",
      status: "ready",
      r2_key: "clavis/texts/8EAC5D05D03C4088B8826FEEA37215F7/english.txt",
      content_sha256: "a85209e7b568bb13d83c7a0c60d73fe1f1645f525a7b0fce17db44bb5adb6840",
      byte_size: 12624
    });
    expect(lines.find((item) => item.work_id === "0363964018C743C3A595768B63C575AF")).toMatchObject({
      language: "english",
      title: "Seven Books on the Incarnation of the Lord, Against Nestorius",
      status: "ready",
      r2_key: "clavis/texts/0363964018C743C3A595768B63C575AF/english.txt",
      content_sha256: "f95cd26386cc1c07ffac674bb22b0e9b24b7685b6e5217686421d3454a75a05d",
      byte_size: 624335
    });
    expect(lines.find((item) => item.work_id === "28AB3BB867454A7CB71B1A6AAFE3725B")).toMatchObject({
      language: "english",
      title: "Treatise II. On the Dress of Virgins",
      status: "ready",
      r2_key: "clavis/texts/28AB3BB867454A7CB71B1A6AAFE3725B/english.txt",
      content_sha256: "c9eb98763561a9fce61f5caddee09a3bd578767ddb49116d6c7e12bc302242d6",
      byte_size: 37901
    });
    expect(lines.find((item) => item.work_id === "59B86508830044119B7BA2E74F7B1FA5")).toMatchObject({
      language: "english",
      title: "Hortatory Address to the Greeks",
      status: "ready",
      r2_key: "clavis/texts/59B86508830044119B7BA2E74F7B1FA5/english.txt",
      content_sha256: "4dedf533f0cca228afe36835331e2ba97cc4eb24a3d521114bab1b8746b6b946",
      byte_size: 90265
    });
    expect(lines.find((item) => item.work_id === "F3AAE8F52F7044FDAF5C3920C1E79B20")).toMatchObject({
      language: "english",
      title: "On the Holy Spirit (De Spiritu Sancto)",
      status: "ready",
      r2_key: "clavis/texts/F3AAE8F52F7044FDAF5C3920C1E79B20/english.txt",
      content_sha256: "3cfd111ec84d37c74bd9f01ca60a4e6261bfbacf97ed6f589f6eae970de55e65",
      byte_size: 293447
    });
    expect(lines.find((item) => item.work_id === "6BBF6C5F3ED64531A84EBEB7CEAF085C")).toMatchObject({
      language: "english",
      title: "On the Holy Trinity, and of the Godhead of the Holy Spirit (To Eustathius)",
      status: "ready",
      r2_key: "clavis/texts/6BBF6C5F3ED64531A84EBEB7CEAF085C/english.txt",
      content_sha256: "bab448fa355ec6c7f0f9cca8e564429230e1fe62ce837836ab495d48aef8e458",
      byte_size: 22204
    });
    expect(lines.find((item) => item.work_id === "D3C6B0011C424D1F81888A9DE9A65BED")).toMatchObject({
      language: "english",
      title: "Treatise I. On the Unity of the Church",
      status: "ready",
      r2_key: "clavis/texts/D3C6B0011C424D1F81888A9DE9A65BED/english.txt",
      content_sha256: "3c721d943a9236e6ba6bef24a4786da2bb1261d0facd3c1e58c03d9bdb65bf22",
      byte_size: 48269
    });
    expect(lines.find((item) => item.work_id === "6CC1F72BEF4B49929EF37D6CE3F58A7E")).toMatchObject({
      language: "english",
      title: "On the Sole Government of God",
      status: "ready",
      r2_key: "clavis/texts/6CC1F72BEF4B49929EF37D6CE3F58A7E/english.txt",
      content_sha256: "34645732f718c22f1663f6ed3aadcf5e21254c5eeaf20a9c3136a8e39e536f79",
      byte_size: 17883
    });
    expect(lines.find((item) => item.work_id === "8403C5890607412DB09F54121D1C0882")).toMatchObject({
      language: "english",
      title: "On \"Not Three Gods\" (To Ablabius)",
      status: "ready",
      r2_key: "clavis/texts/8403C5890607412DB09F54121D1C0882/english.txt",
      content_sha256: "be0dbe4c66a12831a96fe2b11c98c217e17785a251e8c5d4af9ae8f6315044f3",
      byte_size: 31308
    });
    expect(lines.find((item) => item.work_id === "F5B7BE76FA304C1B881525CAD062557D")).toMatchObject({
      language: "english",
      title: "The Book of Pastoral Rule",
      status: "ready",
      r2_key: "clavis/texts/F5B7BE76FA304C1B881525CAD062557D/english.txt",
      content_sha256: "fb38f647887496337b19b269dceb5323294e1226d0347643e62168bc820138dd",
      byte_size: 377677
    });
    expect(lines.find((item) => item.work_id === "CB40644F575B4F33B78F2FA1FD6E510D")).toMatchObject({
      language: "english",
      title: "Treatise III. On the Lapsed",
      status: "ready",
      r2_key: "clavis/texts/CB40644F575B4F33B78F2FA1FD6E510D/english.txt",
      content_sha256: "79f2d2b413880855ec115ce337dd26a4ecf5302964a47e8620452a7ed7ab1b70",
      byte_size: 58377
    });
    expect(lines.find((item) => item.work_id === "2C4A6FF2AF8E49BA97E66130037BE656")).toMatchObject({
      language: "english",
      title: "Letter to a Young Widow",
      status: "ready",
      r2_key: "clavis/texts/2C4A6FF2AF8E49BA97E66130037BE656/english.txt",
      content_sha256: "68c83c5f133ddaaedb2aef45b3c8a6876403d392b2ad37d542ec60fa4de17203",
      byte_size: 25242
    });
    expect(lines.find((item) => item.work_id === "37944672F45E480781E8E9A73E29A85D")).toMatchObject({
      language: "english",
      title: "On the Faith (To Simplicius)",
      status: "ready",
      r2_key: "clavis/texts/37944672F45E480781E8E9A73E29A85D/english.txt",
      content_sha256: "c54fa550a3f8c47fde97c03620546559a3539e1d54bfa8e6db9105cdfeb6d325",
      byte_size: 15438
    });
    expect(lines.find((item) => item.work_id === "AE784095FFA740BDB688F37F7295DAFE")).toMatchObject({
      language: "english",
      title: "Treatise IV. On the Lord's Prayer",
      status: "ready",
      r2_key: "clavis/texts/AE784095FFA740BDB688F37F7295DAFE/english.txt",
      content_sha256: "4002e3639a02748e4dc9ded2c35c7591783e67f5e5ba7e5119d4efc5613f17e9",
      byte_size: 54285
    });
    expect(lines.find((item) => item.work_id === "90E9F6BF787F432B889E19DFEB7ABC82")).toMatchObject({
      language: "english",
      title: "On the Trinity",
      status: "ready",
      r2_key: "clavis/texts/90E9F6BF787F432B889E19DFEB7ABC82/english.txt",
      content_sha256: "5504f9a9862b7bba37d2a916418729fd6f79dadd9f2d530e8cc521fde3761919",
      byte_size: 974704
    });
    expect(lines.find((item) => item.work_id === "7548BCE2E40046089D8ECE090D024E28")).toMatchObject({
      language: "english",
      title: "The Passion of the Holy Martyrs Perpetua and Felicitas",
      status: "ready",
      r2_key: "clavis/texts/7548BCE2E40046089D8ECE090D024E28/english.txt",
      content_sha256: "946a76972cf29f14dbc55c1f2b58bfb0f9717fc626c79a533e26e98cfa5d119b",
      byte_size: 36146
    });
    expect(lines.find((item) => item.work_id === "F279A6267CD64CB8AAB5BAFF2669904C")).toMatchObject({
      language: "english",
      title: "Treatise VII. On the Mortality",
      status: "ready",
      r2_key: "clavis/texts/F279A6267CD64CB8AAB5BAFF2669904C/english.txt",
      content_sha256: "d593b825348d4948c704926d5fc45e13bbee1a05b3210ec7e43eaad3c8157078",
      byte_size: 37428
    });
    expect(lines.find((item) => item.work_id === "6B1A9AEBAAC54D1987FE56EF753E051F")).toMatchObject({
      language: "english",
      title: "On the Priesthood (Six Books)",
      status: "ready",
      r2_key: "clavis/texts/6B1A9AEBAAC54D1987FE56EF753E051F/english.txt",
      content_sha256: "c2fe26bf461f013b6267a485e76c7e2a41ae0ea3d195b0cf81446da99b373bf1",
      byte_size: 250429
    });
    expect(lines.find((item) => item.work_id === "29CD75317DC2477094C9F4D25EB5C629")).toMatchObject({
      language: "english",
      title: "On the Holy Spirit Against the Followers of Macedonius",
      status: "ready",
      r2_key: "clavis/texts/29CD75317DC2477094C9F4D25EB5C629/english.txt",
      content_sha256: "b25f137c85b9e7ef46fd129128632df88bdbf6089cbe9d678e65d52b8f5728da",
      byte_size: 60798
    });
    expect(lines.find((item) => item.work_id === "C73C999C6D954D46874BC30F8D7AF1DA")).toMatchObject({
      language: "english",
      title: "On the Councils, or, The Faith of the Easterns (De Synodis)",
      status: "ready",
      r2_key: "clavis/texts/C73C999C6D954D46874BC30F8D7AF1DA/english.txt",
      content_sha256: "448c0674988ec42f2286e76ad1daa6ac291e28cdd3cb18da4d68d64ab28137a6",
      byte_size: 165389
    });
    expect(lines.find((item) => item.work_id === "EE9356C4C4CC4561A4A5547E82CF1C6A")).toMatchObject({
      language: "english",
      title: "Treatise XI. Exhortation to Martyrdom, Addressed to Fortunatus",
      status: "ready",
      r2_key: "clavis/texts/EE9356C4C4CC4561A4A5547E82CF1C6A/english.txt",
      content_sha256: "c9fa09b11be3db82c1cba4cb64edb6dc6d340a69172cd11875de4c25551d7852",
      byte_size: 56943
    });
    expect(lines.find((item) => item.work_id === "5C26BD3257764681AE46790FF9F1140A")).toMatchObject({
      language: "english",
      title: "On Infants' Early Deaths",
      status: "ready",
      r2_key: "clavis/texts/5C26BD3257764681AE46790FF9F1140A/english.txt",
      content_sha256: "fcd5b95669a2a241443d75e578e484c080045736c6de0731f987910e1bf84ef0",
      byte_size: 43703
    });
    expect(lines.find((item) => item.work_id === "13060EC8AAF245F2A8323AF18278D94B")).toMatchObject({
      language: "english",
      title: "Treatise V. An Address to Demetrianus",
      status: "ready",
      r2_key: "clavis/texts/13060EC8AAF245F2A8323AF18278D94B/english.txt",
      content_sha256: "a85dba9cb82e04d2f4e5d0810edc5405bde2aea5a7896c696cf042bc43154d40",
      byte_size: 43179
    });
    expect(lines.find((item) => item.work_id === "0D11ECFDA83849CFB1370F81BB81A4DA")).toMatchObject({
      language: "english",
      title: "On the Morals of the Catholic Church; and On the Morals of the Manichaeans",
      status: "ready",
      r2_key: "clavis/texts/0D11ECFDA83849CFB1370F81BB81A4DA/english.txt",
      content_sha256: "764a33c03e2173283943de14d5d8c4f3eb044efbf200c505e8dda36a222b24e3",
      byte_size: 292373
    });
    expect(lines.find((item) => item.work_id === "81BDAC3BF41249EEA4B9FB083543F52F")).toMatchObject({
      language: "english",
      title: "Two Books Concerning Repentance",
      status: "ready",
      r2_key: "clavis/texts/81BDAC3BF41249EEA4B9FB083543F52F/english.txt",
      content_sha256: "e296b2217621ec570d1918e8258af0c555ab735d08259040d9cf7d413db19a74",
      byte_size: 265155
    });
    expect(lines.find((item) => item.work_id === "6A7B4E542150445E933F8DE559994112")).toMatchObject({
      language: "english",
      title: "The Epistle of Mathetes to Diognetus",
      status: "ready",
      r2_key: "clavis/texts/6A7B4E542150445E933F8DE559994112/english.txt",
      content_sha256: "5238dc391145b2bc4630c5015ab225e77e5ccea0d36ce8376c65915658ee4b2d",
      byte_size: 28309
    });
    expect(lines.find((item) => item.work_id === "4D43DDE8311F44EBB1751FEDF9AC3DA0")).toMatchObject({
      language: "english",
      title: "On the Incarnation of the Word",
      status: "ready",
      r2_key: "clavis/texts/4D43DDE8311F44EBB1751FEDF9AC3DA0/english.txt",
      content_sha256: "891e657183836b8e536e319a06d740ca6d7dce041221ef7e09e4827dd8011650",
      byte_size: 304267
    });
    expect(lines.find((item) => item.work_id === "23B12A4DF60F4DE98D7E8380625BBD3F")).toMatchObject({
      language: "english",
      title: "Four Discourses Against the Arians (Orations/Discourses I–III)",
      status: "ready",
      r2_key: "clavis/texts/23B12A4DF60F4DE98D7E8380625BBD3F/english.txt",
      content_sha256: "0e3fba817c9622eb4a70b872f4be8145974f3224465f6a7a3fa0e20fcf8727a5",
      byte_size: 746344
    });
    expect(lines.find((item) => item.work_id === "0FBB951E609D4F0AAEEE0B515DE99B1A")).toMatchObject({
      language: "english",
      title: "Life of Antony",
      status: "ready",
      r2_key: "clavis/texts/0FBB951E609D4F0AAEEE0B515DE99B1A/english.txt",
      content_sha256: "ccc06f698a0e596a29281264c1c2b8e8e2c122e5f30e0c723e9371dc73152b05",
      byte_size: 550787
    });
    expect(lines.find((item) => item.work_id === "B56F7AFF65E04094A4FC0A43E8FF6C45")).toMatchObject({
      language: "english",
      title: "The Enchiridion",
      status: "ready",
      r2_key: "clavis/texts/B56F7AFF65E04094A4FC0A43E8FF6C45/english.txt",
      content_sha256: "66f55c1f17ac0fa0dab715549302396893c849a45f969e25514e15f4131d0c92",
      byte_size: 424417
    });
    expect(lines.find((item) => item.work_id === "2A947A2E95874A89A893959ED14B1C5B")).toMatchObject({
      language: "english",
      title: "On the Resurrection of the Dead",
      status: "ready",
      r2_key: "clavis/texts/2A947A2E95874A89A893959ED14B1C5B/english.txt",
      content_sha256: "4961193d3d1290987f4450fc6f7b0048cc6a7ef3f090a96a37e5545358e5fc15",
      byte_size: 94526
    });
    expect(lines.find((item) => item.work_id === "F3520F5C5F734F9BB2BB3FA2FFCD49FE")).toMatchObject({
      language: "english",
      title: "A Plea for the Christians (Embassy)",
      status: "ready",
      r2_key: "clavis/texts/F3520F5C5F734F9BB2BB3FA2FFCD49FE/english.txt",
      content_sha256: "6dac8919067d48cbdf485ad9d3122be32d20acae70f684ba59d5b16aec59df19",
      byte_size: 104157
    });
    expect(lines.find((item) => item.work_id === "EE96887038474C85B2971FBF906B14E6")).toMatchObject({
      language: "english",
      title: "The Book of the Laws of Various Countries",
      status: "ready",
      r2_key: "clavis/texts/EE96887038474C85B2971FBF906B14E6/english.txt",
      content_sha256: "c7dd2ce5df22d8537690c5676d9bb4df56a3f1abd403225c902451dc85da4568",
      byte_size: 54038
    });
    expect(lines.find((item) => item.work_id === "2B3338894E6F417BA8EE5FC0C6066C8E")).toMatchObject({
      language: "english",
      title: "Bede's Ecclesiastical History of England",
      status: "ready",
      r2_key: "clavis/texts/2B3338894E6F417BA8EE5FC0C6066C8E/english.txt",
      content_sha256: "8a90d82801828f8e6095b79aa5bb063ff349c5f1de5aff965d12ae8feccfc035",
      byte_size: 629345
    });
    expect(lines.find((item) => item.work_id === "92454D22E91440C98A18D0BA6C792F51")).toMatchObject({
      language: "english",
      title: "The Seven Genuine Epistles of Ignatius (ANF shorter and longer versions)",
      status: "ready",
      r2_key: "clavis/texts/92454D22E91440C98A18D0BA6C792F51/english.txt",
      content_sha256: "f1b2a99858480705adf5e385101c8d213868b2d8a02bc81334ff407aa6fea976",
      byte_size: 277645
    });
    expect(lines.find((item) => item.work_id === "4A3837A44C424F69855C4DFD68035502")).toMatchObject({
      language: "english",
      title: "Address of Tatian to the Greeks",
      status: "ready",
      r2_key: "clavis/texts/4A3837A44C424F69855C4DFD68035502/english.txt",
      content_sha256: "dcea9410b41fbe606d2262965950fc0fdd30cb5575fd88f7eee84f3c44ef869b",
      byte_size: 99399
    });
    expect(lines.find((item) => item.work_id === "BF9173970E214EEF8830F1CB42880CFA")).toMatchObject({
      language: "english",
      title: "The Instructions of Commodianus",
      status: "ready",
      r2_key: "clavis/texts/BF9173970E214EEF8830F1CB42880CFA/english.txt",
      content_sha256: "c2bf7c34ea598775e3ae9b253ac7fc14529b4e312a7fd07be8e0fb01cb354e11",
      byte_size: 80254
    });
    expect(lines.find((item) => item.work_id === "C5CAD272624D4A07B4A99D40FA464907")).toMatchObject({
      language: "english",
      title: "On the Jewish Meats",
      status: "ready",
      r2_key: "clavis/texts/C5CAD272624D4A07B4A99D40FA464907/english.txt",
      content_sha256: "f4f0e19aa1defa5517f2f300e4c0a8069cabd0e50b166c708678321024032de0",
      byte_size: 29535
    });
    expect(lines.find((item) => item.work_id === "2366A8A732974E638039A9594F74DADC")).toMatchObject({
      language: "english",
      title: "The Ecclesiastical History of Theodoret",
      status: "ready",
      r2_key: "clavis/texts/2366A8A732974E638039A9594F74DADC/english.txt",
      content_sha256: "bd9d02f6f5efbe5770a53bb2952c298599d25a4961baaacfd018adfe108a51ef",
      byte_size: 697496
    });
    expect(lines.find((item) => item.work_id === "B2037578EC314E579A2F9D09E45E0D38")).toMatchObject({
      language: "english",
      title: "The Consolation of Philosophy",
      status: "ready",
      r2_key: "clavis/texts/B2037578EC314E579A2F9D09E45E0D38/english.txt",
      content_sha256: "d02c98b93f8c734e27f8b5746e21434ab716a6eb04f2395b99e5a0cf3eb02628",
      byte_size: 249385
    });
    expect(lines.find((item) => item.work_id === "DBA8ED30B4CF4E4891B31036C5029B05")).toMatchObject({
      language: "english",
      title: "The Sacred History (Chronicles), Books I–II",
      status: "ready",
      r2_key: "clavis/texts/DBA8ED30B4CF4E4891B31036C5029B05/english.txt",
      content_sha256: "cd0a22c6ffa7bb47ff9d1d58b6a00bd7f4f8c7ed4bbc05769bfc0135bcede379",
      byte_size: 265833
    });
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
