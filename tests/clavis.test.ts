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
    expect(lines.find((item) => item.work_id === "63FDDF09CBB8498B9E487B74BA48191D")).toMatchObject({
      language: "english",
      title: "On the Vanity of Idols",
      status: "ready",
      r2_key: "clavis/texts/63FDDF09CBB8498B9E487B74BA48191D/english.txt",
      content_sha256: "33334646014de77840d0e0f4faa49388478c89a36bc3d50779831427b37dd613",
      byte_size: 19232
    });
    expect(lines.find((item) => item.work_id === "711655E399F449C2A518D421511E52C3")).toMatchObject({
      language: "english",
      title: "On Works and Alms",
      status: "ready",
      r2_key: "clavis/texts/711655E399F449C2A518D421511E52C3/english.txt",
      content_sha256: "45369bffe2358a083d05610b6361dd50a64d25b00950c636334667cc6c10aa43",
      byte_size: 44225
    });
    expect(lines.find((item) => item.work_id === "DD4CAB9392EF4EABBAE72588A4C78F20")).toMatchObject({
      language: "english",
      title: "On the Advantage of Patience",
      status: "ready",
      r2_key: "clavis/texts/DD4CAB9392EF4EABBAE72588A4C78F20/english.txt",
      content_sha256: "bacba21cd8b3c42ef03fb54f10161e22e887062cbdf6b68618e1b58f1fc492f8",
      byte_size: 39709
    });
    expect(lines.find((item) => item.work_id === "731530545A7E42D89D244AA8C1BEFBEA")).toMatchObject({
      language: "english",
      title: "On Jealousy and Envy",
      status: "ready",
      r2_key: "clavis/texts/731530545A7E42D89D244AA8C1BEFBEA/english.txt",
      content_sha256: "35064224c84f6907d04ded8418415a15b887821bd3f21ef63978edd4d1c2eecc",
      byte_size: 28967
    });
    expect(lines.find((item) => item.work_id === "3DF9DF3CCA8D43E5A3214D58B714FF15")).toMatchObject({
      language: "english",
      title: "Lives of Illustrious Men (Jerome)",
      status: "ready",
      r2_key: "clavis/texts/3DF9DF3CCA8D43E5A3214D58B714FF15/english.txt",
      content_sha256: "3079acd3ae0a2d01647a3e273e7d16fb538701aab3159d1b69543f1d5a84a398",
      byte_size: 114923
    });
    expect(lines.find((item) => item.work_id === "ED3101DA1ED14286914EEA361E11A9D7")).toMatchObject({
      language: "english",
      title: "Against the Pelagians (Three Books)",
      status: "ready",
      r2_key: "clavis/texts/ED3101DA1ED14286914EEA361E11A9D7/english.txt",
      content_sha256: "4d4215b931ccefb5e81c368e9a1aaceb4212e29c0ab75192e29380f031cd2062",
      byte_size: 283082
    });
    expect(lines.find((item) => item.work_id === "60A606A7A5284FB19B5D271AE70D6297")).toMatchObject({
      language: "english",
      title: "The Life of St. Hilarion",
      status: "ready",
      r2_key: "clavis/texts/60A606A7A5284FB19B5D271AE70D6297/english.txt",
      content_sha256: "00d16a6df3bf420c84cf24dd605f2840ca328272b62debdc27145f0215a8aa62",
      byte_size: 62999
    });
    expect(lines.find((item) => item.work_id === "8D17CCB137F74C5CBBAAA34620DBE189")).toMatchObject({
      language: "english",
      title: "Against Vigilantius",
      status: "ready",
      r2_key: "clavis/texts/8D17CCB137F74C5CBBAAA34620DBE189/english.txt",
      content_sha256: "c40294830f93edf9145a50600b559fcf27f1d5fa1ad43369f8b3701a198829ba",
      byte_size: 36547
    });
    expect(lines.find((item) => item.work_id === "BD2877DB7FEA476AA9E6DB70A9B53A78")).toMatchObject({
      language: "english",
      title: "Against Jovinianus",
      status: "ready",
      r2_key: "clavis/texts/BD2877DB7FEA476AA9E6DB70A9B53A78/english.txt",
      content_sha256: "b242d7d934f20bbf3688983c9acac7e5a8d7aa6b711c90b9ba0b7e0affb57f8b",
      byte_size: 384023
    });
    expect(lines.find((item) => item.work_id === "5967D46223AB4C7C8E510FC98114F83C")).toMatchObject({
      language: "english",
      title: "Eranistes, or Dialogues",
      status: "ready",
      r2_key: "clavis/texts/5967D46223AB4C7C8E510FC98114F83C/english.txt",
      content_sha256: "a69e4598bca7c2a66452da3b27844abe27db851a8bc0faf1930c0e6e435a6d78",
      byte_size: 423748
    });
    expect(lines.find((item) => item.work_id === "F7C69DF39D6D49359A6D9D15EDB9DD4E")).toMatchObject({
      language: "english",
      title: "The Life of Constantine",
      status: "ready",
      r2_key: "clavis/texts/F7C69DF39D6D49359A6D9D15EDB9DD4E/english.txt",
      content_sha256: "4d76bb9b279e7af3fdc0f9ef6313be2a9f1b287ca8a6b614a74df4e08192cd08",
      byte_size: 388448
    });
    expect(lines.find((item) => item.work_id === "71CD2CB84BD646769CCEAA2AD26AD977")).toMatchObject({
      language: "english",
      title: "Oration of Constantine to the Assembly of the Saints",
      status: "ready",
      r2_key: "clavis/texts/71CD2CB84BD646769CCEAA2AD26AD977/english.txt",
      content_sha256: "1f985abe47b576fb064b6f2bdeef548f3249eaad3bd56c0b47d95d881a790217",
      byte_size: 114269
    });
    expect(lines.find((item) => item.work_id === "FD3FF75A9E3243A4B864B42DA97BCC75")).toMatchObject({
      language: "english",
      title: "Oration in Praise of Constantine",
      status: "ready",
      r2_key: "clavis/texts/FD3FF75A9E3243A4B864B42DA97BCC75/english.txt",
      content_sha256: "49b90921d300c94d7d2c5300119115c4a47f8289431e80b7a5ddf0454a05340c",
      byte_size: 166878
    });
    expect(lines.find((item) => item.work_id === "A52F6CCD2C574571B5ECF856B4383E9D")).toMatchObject({
      language: "english",
      title: "The Martyrs of Palestine",
      status: "ready",
      r2_key: "clavis/texts/A52F6CCD2C574571B5ECF856B4383E9D/english.txt",
      content_sha256: "d4bc3ce665905e1a22cd474499fe4dc14c0dfabbdee1faffa0324cbf11819841",
      byte_size: 90396
    });
    expect(lines.find((item) => item.work_id === "FA1860C60A8B4DDFBFB197327CF153E7")).toMatchObject({
      language: "english",
      title: "Oration II. In Defence of His Flight to Pontus",
      status: "ready",
      r2_key: "clavis/texts/FA1860C60A8B4DDFBFB197327CF153E7/english.txt",
      content_sha256: "a9bd4095d78d4006703518845eb99745e655265d939a1249d93f30c171a16c17",
      byte_size: 123403
    });
    expect(lines.find((item) => item.work_id === "F61A9F25FEA242218C768ED8BDB1927A")).toMatchObject({
      language: "english",
      title: "Preparation for the Gospel (Praeparatio Evangelica)",
      status: "ready",
      r2_key: "clavis/texts/F61A9F25FEA242218C768ED8BDB1927A/english.txt",
      content_sha256: "d29872d8c1da25f35624f2a93ac57af3665d7282c95907125034f91ea099cf19",
      byte_size: 1875216
    });
    expect(lines.find((item) => item.work_id === "9D52EDC1A40C448694B3DA344628C442")).toMatchObject({
      language: "english",
      title: "The Proof of the Gospel (Demonstratio Evangelica)",
      status: "ready",
      r2_key: "clavis/texts/9D52EDC1A40C448694B3DA344628C442/english.txt",
      content_sha256: "1278d3d363e740a8e09d845c503729009af8cb57dddd26febb87524ed81b2acf",
      byte_size: 1027488
    });
    expect(lines.find((item) => item.work_id === "0859C0FC73A6458F90C81E74A013B0A0")).toMatchObject({
      language: "english",
      title: "On the Making of Man",
      status: "ready",
      r2_key: "clavis/texts/0859C0FC73A6458F90C81E74A013B0A0/english.txt",
      content_sha256: "2a4b3bfd6dcf6f5d30252360ffe91ce068b3519cbc7e52042a5174bfb20d22ba",
      byte_size: 217980
    });
    expect(lines.find((item) => item.work_id === "EACC5779D7264A28AE2620484A55F55E")).toMatchObject({
      language: "english",
      title: "On the Soul and the Resurrection",
      status: "ready",
      r2_key: "clavis/texts/EACC5779D7264A28AE2620484A55F55E/english.txt",
      content_sha256: "2c0224b5a2cc6b919bcc1804319b8c5d6104b9681745a971371e6c0c15f2054f",
      byte_size: 240696
    });
    expect(lines.find((item) => item.work_id === "31F34E757644436CBF7CCB5C9D6FA343")).toMatchObject({
      language: "english",
      title: "The Great Catechism",
      status: "ready",
      r2_key: "clavis/texts/31F34E757644436CBF7CCB5C9D6FA343/english.txt",
      content_sha256: "b60399b19708617a8ae2a1fcdabccd0ccabc33d5ce4a9cb2d3247636f0d7763c",
      byte_size: 250834
    });
    expect(lines.find((item) => item.work_id === "DEBCD85163E24E65AB7C88ADE4617167")).toMatchObject({
      language: "english",
      title: "Treatise on Christ and Antichrist",
      status: "ready",
      r2_key: "clavis/texts/DEBCD85163E24E65AB7C88ADE4617167/english.txt",
      content_sha256: "7ec90bba7af878a1c9b43ffb3bb44d86b33c7c41019cf5e26aeded258311dc7e",
      byte_size: 83372
    });
    expect(lines.find((item) => item.work_id === "CF819A315C2D4B5385F6AD6F00DE4C42")).toMatchObject({
      language: "english",
      title: "Expository Treatise Against the Jews",
      status: "ready",
      r2_key: "clavis/texts/CF819A315C2D4B5385F6AD6F00DE4C42/english.txt",
      content_sha256: "a4bf2d0f17534ff6d3dbfb5bcc9837469257ffcebe55900de19c716d493b98f8",
      byte_size: 10455
    });
    expect(lines.find((item) => item.work_id === "C9BD5522D88F42DCAB06472370E5254C")).toMatchObject({
      language: "english",
      title: "Against the Heresy of One Noetus",
      status: "ready",
      r2_key: "clavis/texts/C9BD5522D88F42DCAB06472370E5254C/english.txt",
      content_sha256: "fa4d56d05101766f6e36e09b4cf35f80d8a77d722a720d554f3f03af850f40c3",
      byte_size: 45516
    });
    expect(lines.find((item) => item.work_id === "6952B2B123924032B8A92206A1FBF705")).toMatchObject({
      language: "english",
      title: "Oration XLII. The Last Farewell",
      status: "ready",
      r2_key: "clavis/texts/6952B2B123924032B8A92206A1FBF705/english.txt",
      content_sha256: "0ad79025d1c7c336bc90a34551918a1671297af73073969819267646107ede45",
      byte_size: 48237
    });
    expect(lines.find((item) => item.work_id === "BCB3D83838024D2C8E3B811E90CDD305")).toMatchObject({
      language: "english",
      title: "Canon Muratorianus (Muratorian Fragment)",
      status: "ready",
      r2_key: "clavis/texts/BCB3D83838024D2C8E3B811E90CDD305/english.txt",
      content_sha256: "ad68e274aba1f399eacfafcb7dc57d6d5f8aa82f34b724a759b3ce66140b009d",
      byte_size: 7188
    });
    expect(lines.find((item) => item.work_id === "A2EE8AE7D5D64EE5856748C90FF7912F")).toMatchObject({
      language: "english",
      title: "The Second Epistle of Clement",
      status: "ready",
      r2_key: "clavis/texts/A2EE8AE7D5D64EE5856748C90FF7912F/english.txt",
      content_sha256: "3295790d05baee15371acb09ec030260a08e6212791631144814760a8aa02122",
      byte_size: 23369
    });
    expect(lines.find((item) => item.work_id === "68137849291C4219B882D8A4A35CA032")).toMatchObject({
      language: "english",
      title: "The Clementine Homilies (Twenty Homilies)",
      status: "ready",
      r2_key: "clavis/texts/68137849291C4219B882D8A4A35CA032/english.txt",
      content_sha256: "beadf69451abc5c7564b5222478e000f5cc082fcfd0cd70eaee5d310de8584eb",
      byte_size: 630934
    });
    expect(lines.find((item) => item.work_id === "1300AF5DFA5B46CB9ACEC80C4F6F931B")).toMatchObject({
      language: "english",
      title: "Homilies on the Statues (Twenty-One Homilies to the People of Antioch)",
      status: "ready",
      r2_key: "clavis/texts/1300AF5DFA5B46CB9ACEC80C4F6F931B/english.txt",
      content_sha256: "666855cd4b33cfdafce4bcee9ad8b9a526c2ff987d31c8150c8f0c42795ce1ce",
      byte_size: 908088
    });
    expect(lines.find((item) => item.work_id === "327F7B993C2A47CDB2AB1B6119609ED9")).toMatchObject({
      language: "english",
      title: "Homilies on the Acts of the Apostles",
      status: "ready",
      r2_key: "clavis/texts/327F7B993C2A47CDB2AB1B6119609ED9/english.txt",
      content_sha256: "d797bb6973abffc3b2e88dc098f8ff453d4342f0befea13718f1888daf1f5ea9",
      byte_size: 1931090
    });
    expect(lines.find((item) => item.work_id === "1FB848D7823A41468F7AF32AD34454D2")).toMatchObject({
      language: "english",
      title: "Homilies on the Epistle to the Romans",
      status: "ready",
      r2_key: "clavis/texts/1FB848D7823A41468F7AF32AD34454D2/english.txt",
      content_sha256: "aa30a7c8db1ef65cff357a7c49e5240c6a485597bde5aefc55a63109ec06950b",
      byte_size: 1233697
    });
    expect(lines.find((item) => item.work_id === "F3DF6F14EAF74E5C97884F9FB9FC53A6")).toMatchObject({
      language: "english",
      title: "Homilies on First Corinthians",
      status: "ready",
      r2_key: "clavis/texts/F3DF6F14EAF74E5C97884F9FB9FC53A6/english.txt",
      content_sha256: "aab24b1fe568aefd761d4e60307554c4d032fe292f4eed5dcf4a3472acae9d6b",
      byte_size: 1406839
    });
    expect(lines.find((item) => item.work_id === "14F29CE90FB44FCBA5FE7880B81C92B3")).toMatchObject({
      language: "english",
      title: "Homilies on Second Corinthians",
      status: "ready",
      r2_key: "clavis/texts/14F29CE90FB44FCBA5FE7880B81C92B3/english.txt",
      content_sha256: "1b14d179793802793b3a99bfbdd38a94c88befc3999e840f4350b394a1841511",
      byte_size: 842035
    });
    expect(lines.find((item) => item.work_id === "F880A19600AF4F9A89A9B2B5B9CDE701")).toMatchObject({
      language: "english",
      title: "Commentary on Galatians",
      status: "ready",
      r2_key: "clavis/texts/F880A19600AF4F9A89A9B2B5B9CDE701/english.txt",
      content_sha256: "466078b0891d6ee956337bbbccf294fb66d4883bd86f4286cd1adc53ce879f66",
      byte_size: 263706
    });
    expect(lines.find((item) => item.work_id === "D028011E5CA548C4A496362814D8E8AB")).toMatchObject({
      language: "english",
      title: "Homilies on the Epistle to the Ephesians",
      status: "ready",
      r2_key: "clavis/texts/D028011E5CA548C4A496362814D8E8AB/english.txt",
      content_sha256: "1ad0e77393e379027a761230af1413d21db3028b8ad2de1c1891ef878c0eec9a",
      byte_size: 682642
    });
    expect(lines.find((item) => item.work_id === "1C9F6BF8B4594FEDBA513DF539774EC0")).toMatchObject({
      language: "english",
      title: "Homilies on the Epistle to the Philippians",
      status: "ready",
      r2_key: "clavis/texts/1C9F6BF8B4594FEDBA513DF539774EC0/english.txt",
      content_sha256: "b7dffaed22b9a5a6363c736669fd6e9c4ec9f10af449cb7de1d47145ff8c4d8e",
      byte_size: 397420
    });
    expect(lines.find((item) => item.work_id === "F3F27057D27E4F448FC9F9854DB73E98")).toMatchObject({
      language: "english",
      title: "Homilies on the Epistle to the Colossians",
      status: "ready",
      r2_key: "clavis/texts/F3F27057D27E4F448FC9F9854DB73E98/english.txt",
      content_sha256: "3d4289624455dfb905f2013e48907dbdcdc2d53f0fcf9609f912417cddce1268",
      byte_size: 345352
    });
    expect(lines.find((item) => item.work_id === "D1F4B50EF29E44E6A461488A45D3E869")).toMatchObject({
      language: "english",
      title: "Homilies on First Thessalonians",
      status: "ready",
      r2_key: "clavis/texts/D1F4B50EF29E44E6A461488A45D3E869/english.txt",
      content_sha256: "b6f5720eb34fac319cdbd422008a1b0aa4220281daf660c7f600f9f551a4d1f9",
      byte_size: 272776
    });
    expect(lines.find((item) => item.work_id === "5F05C2E7C3D34778AFBEDBDC8C8D0B86")).toMatchObject({
      language: "english",
      title: "Homilies on Second Thessalonians",
      status: "ready",
      r2_key: "clavis/texts/5F05C2E7C3D34778AFBEDBDC8C8D0B86/english.txt",
      content_sha256: "92d6b1fca4ea4d6f31fc62ce2c9f1388c67ea2ad004aef837b49a0b42a81b853",
      byte_size: 114892
    });
    expect(lines.find((item) => item.work_id === "0784BEBF8DCE462982A727E64D937845")).toMatchObject({
      language: "english",
      title: "Homilies on First Timothy",
      status: "ready",
      r2_key: "clavis/texts/0784BEBF8DCE462982A727E64D937845/english.txt",
      content_sha256: "10fe8996d44d25a3ede20baaed3a316841720147d334db7202cbfecfb937ca23",
      byte_size: 339320
    });
    expect(lines.find((item) => item.work_id === "E228B94D11344A539C1267AF0A4C165B")).toMatchObject({
      language: "english",
      title: "Homilies on Second Timothy",
      status: "ready",
      r2_key: "clavis/texts/E228B94D11344A539C1267AF0A4C165B/english.txt",
      content_sha256: "b2a5e04c1cf0eab7b0cb0689542675cd78bfe0ac28d43e7beeab9a475c6ba1ac",
      byte_size: 225393
    });
    expect(lines.find((item) => item.work_id === "3EAFEE13AC9B4177994C4771C01ECA26")).toMatchObject({
      language: "english",
      title: "Homilies on the Epistle to Titus",
      status: "ready",
      r2_key: "clavis/texts/3EAFEE13AC9B4177994C4771C01ECA26/english.txt",
      content_sha256: "38e42cc8f5115bcb2370f4a8ac99e0f824b7a8abb57ac77957b967a9565692c7",
      byte_size: 133581
    });
    expect(lines.find((item) => item.work_id === "388A7F36CC5047AABEF557D4E2C69B84")).toMatchObject({
      language: "english",
      title: "Homilies on the Epistle to Philemon",
      status: "ready",
      r2_key: "clavis/texts/388A7F36CC5047AABEF557D4E2C69B84/english.txt",
      content_sha256: "e2c89519cd57aa0e83aff188c449972a0a92c6e6e2f1ad98d23282d732f679e3",
      byte_size: 212406
    });
    expect(lines.find((item) => item.work_id === "370AE58AF79A4529A28BAF8B0A381FB9")).toMatchObject({
      language: "english",
      title: "Homilies on the Gospel of St. John",
      status: "ready",
      r2_key: "clavis/texts/370AE58AF79A4529A28BAF8B0A381FB9/english.txt",
      content_sha256: "7bb8fa08ef2cec2598977b457435f1a529229fc6e0473cd84ca08ff27f7a23dd",
      byte_size: 1787824
    });
    expect(lines.find((item) => item.work_id === "AA73F7138E1E483CA6C44D8651B286E6")).toMatchObject({
      language: "english",
      title: "Homilies on the Epistle to the Hebrews",
      status: "ready",
      r2_key: "clavis/texts/AA73F7138E1E483CA6C44D8651B286E6/english.txt",
      content_sha256: "d9a1fe1add011f291c67004ab388f891ecc5defc625dfd1dadb3f9cba3b1c790",
      byte_size: 986787
    });
    expect(lines.find((item) => item.work_id === "DE53E74B7D5C4C18AC862D03AB5B1B1F")).toMatchObject({
      language: "english",
      title: "The Ecclesiastical History of Evagrius Scholasticus",
      status: "ready",
      r2_key: "clavis/texts/DE53E74B7D5C4C18AC862D03AB5B1B1F/english.txt",
      content_sha256: "2db776721a1bdd162a51c43a3c15a6aee6c9d48dd75493f786c6b90e825b31f0",
      byte_size: 421105
    });
    expect(lines.find((item) => item.work_id === "0AA01FF61D9A4C37BA7DFDB736BB28F8")).toMatchObject({
      language: "english",
      title: "Oration I. On Easter and His Reluctance (Apologeticus minor / post consecrationem)",
      status: "ready",
      r2_key: "clavis/texts/0AA01FF61D9A4C37BA7DFDB736BB28F8/english.txt",
      content_sha256: "88e513db40335a65b742980df113ec24d6f1a73c12def2144e9c0a787df663c1",
      byte_size: 7165
    });
    expect(lines.find((item) => item.work_id === "93A4505862584B4BAAEB813BCD7B77FA")).toMatchObject({
      language: "english",
      title: "The Christian Topography of Cosmas Indicopleustes",
      status: "ready",
      r2_key: "clavis/texts/93A4505862584B4BAAEB813BCD7B77FA/english.txt",
      content_sha256: "a4bce61729aa21c576a9063a8720219e1f78cc83760345d9b0bfdb53884a27c9",
      byte_size: 785548
    });
    expect(lines.find((item) => item.work_id === "0C7688AA0C7B4A68B8FEF8C1115F06DC")).toMatchObject({
      language: "english",
      title: "The Seventh Council of Carthage under Cyprian (Sententiae of Eighty-Seven Bishops on Baptizing Heretics)",
      status: "ready",
      r2_key: "clavis/texts/0C7688AA0C7B4A68B8FEF8C1115F06DC/english.txt",
      content_sha256: "def32a025f0ca5a91defdc9c0e66d9fcf3964ecfb501fa5cf1a741f9c01f80b6",
      byte_size: 41510
    });
    expect(lines.find((item) => item.work_id === "936323F7125943B087045310963BFA85")).toMatchObject({
      language: "english",
      title: "A Treatise on Re-Baptism by an Anonymous Writer",
      status: "ready",
      r2_key: "clavis/texts/936323F7125943B087045310963BFA85/english.txt",
      content_sha256: "c621a229cdba48e665613d86a29b836932fe6f40dbbc38a5c2f0eb2838a9f698",
      byte_size: 59792
    });
    expect(lines.find((item) => item.work_id === "9DA20CB916DE4331A0832DCC79234E13")).toMatchObject({
      language: "english",
      title: "Five Tomes Against Nestorius",
      status: "ready",
      r2_key: "clavis/texts/9DA20CB916DE4331A0832DCC79234E13/english.txt",
      content_sha256: "3b9b579ebf7b57d1c9bd89518d15c1d269edef801d2d5d2959a507fe6a77caaa",
      byte_size: 430382
    });
    expect(lines.find((item) => item.work_id === "44754F76E72D4DB1A9AD4A4901059637")).toMatchObject({
      language: "english",
      title: "Against the Synousiasts",
      status: "ready",
      r2_key: "clavis/texts/44754F76E72D4DB1A9AD4A4901059637/english.txt",
      content_sha256: "fe7e9f113065837ae7faa367e40177f2c17f0b482c4a1fe30937af320d9305e0",
      byte_size: 34585
    });
    expect(lines.find((item) => item.work_id === "F93D2B0B10A34A31B1D8B812C175A687")).toMatchObject({
      language: "english",
      title: "That Christ is One (Quod unus sit Christus)",
      status: "ready",
      r2_key: "clavis/texts/F93D2B0B10A34A31B1D8B812C175A687/english.txt",
      content_sha256: "0ee12ec28f530f10afac67b682fc9f2659f23623631cafc355551228902a93fb",
      byte_size: 199483
    });
    expect(lines.find((item) => item.work_id === "C88F5CBAE1A44A78860598F2FC83AAE2")).toMatchObject({
      language: "english",
      title: "Scholia on the Incarnation of the Only-Begotten",
      status: "ready",
      r2_key: "clavis/texts/C88F5CBAE1A44A78860598F2FC83AAE2/english.txt",
      content_sha256: "beea094ca1926de91ec240ab394f0dab5c6230cfd0253f6a281b8446184a5c4b",
      byte_size: 124765
    });
    expect(lines.find((item) => item.work_id === "269FE18E204F4A8C8B35545834252FDC")).toMatchObject({
      language: "english",
      title: "Epistle XII. To the Alexandrians",
      status: "ready",
      r2_key: "clavis/texts/269FE18E204F4A8C8B35545834252FDC/english.txt",
      content_sha256: "3c87bad910dbf7ce2ba2194dd88dc30490c4897032d13d39d903abaa84a13848",
      byte_size: 7084
    });
    expect(lines.find((item) => item.work_id === "AC99900AC42645EFB758CE387593A438")).toMatchObject({
      language: "english",
      title: "Epistle XI. To Hermammon",
      status: "ready",
      r2_key: "clavis/texts/AC99900AC42645EFB758CE387593A438/english.txt",
      content_sha256: "2803a551ac9453c04ae45b2a340c6ffc06fe9baa7d261b80146f4e1acd987057",
      byte_size: 12196
    });
    expect(lines.find((item) => item.work_id === "C80180A0177B45C696256BA15DF615E5")).toMatchObject({
      language: "english",
      title: "Epistle to Bishop Basilides",
      status: "ready",
      r2_key: "clavis/texts/C80180A0177B45C696256BA15DF615E5/english.txt",
      content_sha256: "08b7783626a449fca3bfa973f9bfbe3af4486cc1f1454ddd0cc6cc3b9e39a44e",
      byte_size: 12474
    });
    expect(lines.find((item) => item.work_id === "50EE42F8775448BD93BEDBB2AC56DE0E")).toMatchObject({
      language: "english",
      title: "Epistle to Dionysius, Bishop of Rome",
      status: "ready",
      r2_key: "clavis/texts/50EE42F8775448BD93BEDBB2AC56DE0E/english.txt",
      content_sha256: "d65b9cc21d5809fa36ef5fd7bd37b1d60a10c1ab1dac619704fca90f10f8b984",
      byte_size: 12897
    });
    expect(lines.find((item) => item.work_id === "545EF29923B34C95BB5B62D6120CE97C")).toMatchObject({
      language: "english",
      title: "Epistle I. To Domitius and Didymus",
      status: "ready",
      r2_key: "clavis/texts/545EF29923B34C95BB5B62D6120CE97C/english.txt",
      content_sha256: "79eb243b4622ab87edac14052220dd1554bf7246b09b3acdc5a5ffe75441ab5b",
      byte_size: 6084
    });
    expect(lines.find((item) => item.work_id === "6BA12DF39D0C46E9973C7F54F0CE8D80")).toMatchObject({
      language: "english",
      title: "Epistle III. To Fabius, Bishop of Antioch",
      status: "ready",
      r2_key: "clavis/texts/6BA12DF39D0C46E9973C7F54F0CE8D80/english.txt",
      content_sha256: "698b079119b57a5bdea5bf408b9e233ac15b37e7a3c417fa47444b8671752d51",
      byte_size: 26276
    });
    expect(lines.find((item) => item.work_id === "5943013371B540308A66520EE0A9DF57")).toMatchObject({
      language: "english",
      title: "Epistle X. Against Bishop Germanus",
      status: "ready",
      r2_key: "clavis/texts/5943013371B540308A66520EE0A9DF57/english.txt",
      content_sha256: "b3aaa3fcea432ac696954f5c23c4c6fcad7d89ab8dc878cfa95758f40b3c148b",
      byte_size: 17297
    });
    expect(lines.find((item) => item.work_id === "8FA027E00F354EE780830D9E29086256")).toMatchObject({
      language: "english",
      title: "Epistle II. To Novatus (Novatian)",
      status: "ready",
      r2_key: "clavis/texts/8FA027E00F354EE780830D9E29086256/english.txt",
      content_sha256: "7acdd0fff3489f2c5f28f3aefe8304663ba2f4088370704e85a84d20a0375953",
      byte_size: 2260
    });
    expect(lines.find((item) => item.work_id === "1117A865C9C74795905515EA0B87BEB8")).toMatchObject({
      language: "english",
      title: "Epistle VII. To Philemon, a Presbyter",
      status: "ready",
      r2_key: "clavis/texts/1117A865C9C74795905515EA0B87BEB8/english.txt",
      content_sha256: "76e6f9765b2742fd539d116457736268c5507c4f67908215b9e5f1978b6a2ee7",
      byte_size: 2990
    });
    expect(lines.find((item) => item.work_id === "8EF504107A6B49D5A2C7B0D933932024")).toMatchObject({
      language: "english",
      title: "Epistle VI. To Sixtus, Bishop of Rome",
      status: "ready",
      r2_key: "clavis/texts/8EF504107A6B49D5A2C7B0D933932024/english.txt",
      content_sha256: "10b0aec18b83ea04aab2ab2835f5049d682448c11396cb7fcd19ec3beb42b110",
      byte_size: 1950
    });
    expect(lines.find((item) => item.work_id === "FC6143D97C4E4CE68E39D733DAB4061D")).toMatchObject({
      language: "english",
      title: "Epistle V. To Stephen, Bishop of Rome (On Baptism)",
      status: "ready",
      r2_key: "clavis/texts/FC6143D97C4E4CE68E39D733DAB4061D/english.txt",
      content_sha256: "b4512b6fe27fd613993991ea896550c78c1fe6944b32e7e5b6c2895c4ce7ab74",
      byte_size: 5211
    });
    expect(lines.find((item) => item.work_id === "EFA81D7852C04DEDB0355FCB9D800263")).toMatchObject({
      language: "english",
      title: "Epistle IX. To Sixtus II",
      status: "ready",
      r2_key: "clavis/texts/EFA81D7852C04DEDB0355FCB9D800263/english.txt",
      content_sha256: "7d0030382cf2757cfdf25f9cd6d8ef32868cf8ec9573375c222019345ef0e3cd",
      byte_size: 2183
    });
    expect(lines.find((item) => item.work_id === "B73079F37C9E44BC8EA5537537F4AA11")).toMatchObject({
      language: "english",
      title: "Epistle XIII. To Hierax, a Bishop in Egypt",
      status: "ready",
      r2_key: "clavis/texts/B73079F37C9E44BC8EA5537537F4AA11/english.txt",
      content_sha256: "d4d50a944fb99555cd99767de8d9bfade454bf54e786ef4f270479a8282299eb",
      byte_size: 4721
    });
    expect(lines.find((item) => item.work_id === "4E20EF5A1D3F4894938D735E0F2BE810")).toMatchObject({
      language: "english",
      title: "The Theophania (Divine Manifestation) of Eusebius",
      status: "ready",
      r2_key: "clavis/texts/4E20EF5A1D3F4894938D735E0F2BE810/english.txt",
      content_sha256: "fc5e03769701d36cd8d5d196b2bd63b50424f172807e2602cf097886ded8e1e0",
      byte_size: 702545
    });
    expect(lines.find((item) => item.work_id === "25CA749A2B1F4C00AA4984C66FDEA810")).toMatchObject({
      language: "english",
      title: "Concerning Free-Will",
      status: "ready",
      r2_key: "clavis/texts/25CA749A2B1F4C00AA4984C66FDEA810/english.txt",
      content_sha256: "ee28f438e7a104c1dc60972dfcbd33c20bc06969661230bd600ab6054ea7a057",
      byte_size: 37907
    });
    expect(lines.find((item) => item.work_id === "161926EE9AF54FC89BC0B2FDD2EBD5E3")).toMatchObject({
      language: "english",
      title: "The Life of St. Severinus",
      status: "ready",
      r2_key: "clavis/texts/161926EE9AF54FC89BC0B2FDD2EBD5E3/english.txt",
      content_sha256: "fc669f747481d11bbe0fc8d1da3ed7fd0954439ce7c35646781ce212f0a810ca",
      byte_size: 157702
    });
    expect(lines.find((item) => item.work_id === "162BDDB115E04CC6ABD2889194583274")).toMatchObject({
      language: "english",
      title: "Against Hierocles",
      status: "ready",
      r2_key: "clavis/texts/162BDDB115E04CC6ABD2889194583274/english.txt",
      content_sha256: "718228cdaf7aa7c17e471aaf8e2c912db79584ef734bf9cd5aaca490720d9cf5",
      byte_size: 96691
    });
    expect(lines.find((item) => item.work_id === "3A412CD85B6C40919973BE9057FA131B")).toMatchObject({
      language: "english",
      title: "On Virginity",
      status: "ready",
      r2_key: "clavis/texts/3A412CD85B6C40919973BE9057FA131B/english.txt",
      content_sha256: "b479c923c843b533d8d73b2b42d2c10cacef441f1694d4796b17ccfe3d0dc5ac",
      byte_size: 155816
    });
    expect(lines.find((item) => item.work_id === "E7ED39666E20450AB37D07C8DD4AD0E5")).toMatchObject({
      language: "english",
      title: "On the Baptism of Christ (In diem luminum)",
      status: "ready",
      r2_key: "clavis/texts/E7ED39666E20450AB37D07C8DD4AD0E5/english.txt",
      content_sha256: "471d09f191097e055c0a3542463f043c2d530fad9bab6811de1747147aea5eed",
      byte_size: 36641
    });
    expect(lines.find((item) => item.work_id === "4070CFFFF97949C3A3EE3C2D11355265")).toMatchObject({
      language: "english",
      title: "Funeral Oration on Meletius",
      status: "ready",
      r2_key: "clavis/texts/4070CFFFF97949C3A3EE3C2D11355265/english.txt",
      content_sha256: "61469b719b792bcaaeb00500447ca30b935b5bbf1f74c0102496ffb3cfa5c457",
      byte_size: 28790
    });
    expect(lines.find((item) => item.work_id === "504F5E8FF22540219ECE1BA9B7AFEAB4")).toMatchObject({
      language: "english",
      title: "A Sectional Confession of Faith",
      status: "ready",
      r2_key: "clavis/texts/504F5E8FF22540219ECE1BA9B7AFEAB4/english.txt",
      content_sha256: "df96c448e04df042120afad959620ac1ebe3eb88d0bd3e3589eeb770ad2869fc",
      byte_size: 37942
    });
    expect(lines.find((item) => item.work_id === "C853D73DF5E44DB0802ED23E5E6E0ECB")).toMatchObject({
      language: "english",
      title: "On the Seventy Apostles",
      status: "ready",
      r2_key: "clavis/texts/C853D73DF5E44DB0802ED23E5E6E0ECB/english.txt",
      content_sha256: "51f54d06cd3629cac935d96267793b0b93540763bd939dca973f604b2986cb65",
      byte_size: 14703
    });
    expect(lines.find((item) => item.work_id === "B45104619E7048E9BF18E42B3A3FB4C0")).toMatchObject({
      language: "english",
      title: "A Discourse on the End of the World, and on Antichrist, and on the Second Coming of Our Lord",
      status: "ready",
      r2_key: "clavis/texts/B45104619E7048E9BF18E42B3A3FB4C0/english.txt",
      content_sha256: "5040805dba1be6b978514d520bb21e72b05d1ab4122ace5b64a424bd153f7a24",
      byte_size: 65819
    });
    expect(lines.find((item) => item.work_id === "0CB230F34E754E2197104128D5DA7657")).toMatchObject({
      language: "english",
      title: "Discourse on the Holy Theophany",
      status: "ready",
      r2_key: "clavis/texts/0CB230F34E754E2197104128D5DA7657/english.txt",
      content_sha256: "f1c97696765ac7d79a07633cb370fd9fa0dfb1bf325e07c57a4dc42f4a9a76cb",
      byte_size: 16840
    });
    expect(lines.find((item) => item.work_id === "4C1757AD1A594469808D076673C1FBCF")).toMatchObject({
      language: "english",
      title: "Instructions to Catechumens (First and Second)",
      status: "ready",
      r2_key: "clavis/texts/4C1757AD1A594469808D076673C1FBCF/english.txt",
      content_sha256: "28b495220aaabb8b768848cf6c04c7d0fbef8f1c7520fa938e659cf9d0f22f34",
      byte_size: 63774
    });
    expect(lines.find((item) => item.work_id === "A326058D3F874AFD8E7099A092E1AF95")).toMatchObject({
      language: "english",
      title: "Homily on Matt. xxvi. 19 (“Father if it be possible…”) and against Marcionists and Manichæans",
      status: "ready",
      r2_key: "clavis/texts/A326058D3F874AFD8E7099A092E1AF95/english.txt",
      content_sha256: "294ce6f0caa26604702c9df2c1b4c6ac6e3029fb3719a190cadb40449c30d46d",
      byte_size: 31321
    });
    expect(lines.find((item) => item.work_id === "20DFB5397DD34C2BAF88CAB710E91379")).toMatchObject({
      language: "english",
      title: "Three Homilies Concerning the Power of Demons",
      status: "ready",
      r2_key: "clavis/texts/20DFB5397DD34C2BAF88CAB710E91379/english.txt",
      content_sha256: "03964b8034b487b4bfa698c6eb9a714b3945679c29e48b9e47ebe4aa0aeff8f9",
      byte_size: 100996
    });
    expect(lines.find((item) => item.work_id === "9F8F904CCA234681984E119C854342FC")).toMatchObject({
      language: "english",
      title: "Homily Concerning Lowliness of Mind (Phil. i. 18)",
      status: "ready",
      r2_key: "clavis/texts/9F8F904CCA234681984E119C854342FC/english.txt",
      content_sha256: "2dd5a3e4ac0a76713c2b501f6b9e3483ba7cb9512801c8cbd26f1d0433789028",
      byte_size: 44954
    });
    expect(lines.find((item) => item.work_id === "2285537B145044A0ACC951603F191F8B")).toMatchObject({
      language: "english",
      title: "Dialogue on the Life of St. John Chrysostom",
      status: "ready",
      r2_key: "clavis/texts/2285537B145044A0ACC951603F191F8B/english.txt",
      content_sha256: "eebbcd6e45b674a6ce16508784007410c218ba80ea1a51f93bc5b728d409c120",
      byte_size: 296024
    });
    expect(lines.find((item) => item.work_id === "FD3E42D7895E4DE0B66E4353981B134E")).toMatchObject({
      language: "english",
      title: "Letter from St. John Chrysostom to Innocent, Bishop of Rome (first letter, Easter 404)",
      status: "ready",
      r2_key: "clavis/texts/FD3E42D7895E4DE0B66E4353981B134E/english.txt",
      content_sha256: "634ff5f326ffadc877fe63fd7379a31c6d9d6a05b3beb28b6b151c2682a2cba2",
      byte_size: 15955
    });
    expect(lines.find((item) => item.work_id === "04E3176013F84194B93F64D83FD3F907")).toMatchObject({
      language: "english",
      title: "Letter from St. John Chrysostom to Innocent, Bishop of Rome (second letter, from exile)",
      status: "ready",
      r2_key: "clavis/texts/04E3176013F84194B93F64D83FD3F907/english.txt",
      content_sha256: "fc975d8d0831b3d898ce787ee3cb3eacd320a23324e1629a83d8abd3d59d7f80",
      byte_size: 4272
    });
    expect(lines.find((item) => item.work_id === "E589B526D82644D98E99BC43CAAB1E33")).toMatchObject({
      language: "english",
      title: "No One Can Harm the Man Who Does Not Injure Himself",
      status: "ready",
      r2_key: "clavis/texts/E589B526D82644D98E99BC43CAAB1E33/english.txt",
      content_sha256: "458f2d11e43be669a859503ed26a7384aa77737b03f3eba7dbe4b2d19d54a731",
      byte_size: 72387
    });
    expect(lines.find((item) => item.work_id === "E8DF4CCC2D27478CAA8A7F479054E649")).toMatchObject({
      language: "english",
      title: "Homily on the Holy Martyr Saint Babylas",
      status: "ready",
      r2_key: "clavis/texts/E8DF4CCC2D27478CAA8A7F479054E649/english.txt",
      content_sha256: "58ecd21eee31134b1d2e417093aef5cb700af8f322c190a993243d74f32c934f",
      byte_size: 15101
    });
    expect(lines.find((item) => item.work_id === "974E6635A2814A87B2568A6E2A662CE4")).toMatchObject({
      language: "english",
      title: "Two Homilies on Eutropius",
      status: "ready",
      r2_key: "clavis/texts/974E6635A2814A87B2568A6E2A662CE4/english.txt",
      content_sha256: "b961da5eb7f09cf87180ca6f1a394decae4bb683ecf430e478648cfb778eb575",
      byte_size: 93835
    });
    expect(lines.find((item) => item.work_id === "1AC9653AD1CB4F8F894E74C9F1B4028F")).toMatchObject({
      language: "english",
      title: "Homily to Those Who Had Not Attended the Assembly (Rom. xii. 20)",
      status: "ready",
      r2_key: "clavis/texts/1AC9653AD1CB4F8F894E74C9F1B4028F/english.txt",
      content_sha256: "655d69beb0b3f2c313a63dbc32b2f752f4602664be5eef9db8ec32e6d77c02fe",
      byte_size: 48962
    });
    expect(lines.find((item) => item.work_id === "3CD66F4D4EC94BEAABC401FC580F8C4D")).toMatchObject({
      language: "english",
      title: "Homily on the Paralytic Let Down Through the Roof",
      status: "ready",
      r2_key: "clavis/texts/3CD66F4D4EC94BEAABC401FC580F8C4D/english.txt",
      content_sha256: "dcaa58d52adfa01a1475a31f0ec9948c92b416d5244f69d9c0600e4ecff818bc",
      byte_size: 50868
    });
    expect(lines.find((item) => item.work_id === "75C9E198F70F4D928E0CF4B6F04B9587")).toMatchObject({
      language: "english",
      title: "Homily Against Publishing the Errors of the Brethren",
      status: "ready",
      r2_key: "clavis/texts/75C9E198F70F4D928E0CF4B6F04B9587/english.txt",
      content_sha256: "aa2ba13659a0556407ce708093d499fe65cd6119520fdf0ce87bed8af8f52b67",
      byte_size: 37739
    });
    expect(lines.find((item) => item.work_id === "910FBBACBECD4735AF15D6C719150402")).toMatchObject({
      language: "english",
      title: "Oration Concerning Simeon and Anna",
      status: "ready",
      r2_key: "clavis/texts/910FBBACBECD4735AF15D6C719150402/english.txt",
      content_sha256: "79a911b89464373c96de408be088fdae8a8ca5ca8cc561b7799f42127b2e7381",
      byte_size: 57063
    });
    expect(lines.find((item) => item.work_id === "DC9BEEC40FA740F78C9ACF8893B4BB68")).toMatchObject({
      language: "english",
      title: "Oration on the Palms",
      status: "ready",
      r2_key: "clavis/texts/DC9BEEC40FA740F78C9ACF8893B4BB68/english.txt",
      content_sha256: "834546f6642836e6b309aaa9ebe4affddbe22e10828dd2d16afc8c98330c3671",
      byte_size: 21680
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
