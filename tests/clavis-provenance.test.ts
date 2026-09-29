// @ts-nocheck
import { spawnSync } from "child_process";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, describe, expect, it } from "vitest";
import { attachTextFile } from "../scripts/clavis/attach-text.mjs";
import { overlayProvenance } from "../scripts/clavis/attach-english.mjs";
import { backfillProvenance, parseProvenanceCsv } from "../scripts/clavis/backfill-provenance.mjs";
import { applySchema, openDatabase } from "../scripts/clavis/import-works.mjs";
import { packClavisSqlite } from "../scripts/clavis/pack-sqlite.mjs";
import { attributionFor } from "../server/clavis-api";

const ROOT = join(import.meta.dirname, "..");
const FIXTURE = join(ROOT, "data/clavis/fixtures/works.jsonl");
const ENGLISH = join(ROOT, "data/clavis/fixtures/retractationes-english.txt");
const AUGUSTINE = "E84EBB53FD524B8F8CD332CC55C805D1";

const dirs = [];

function tempDir() {
  const dir = mkdtempSync(join(tmpdir(), "clavis-prov-"));
  dirs.push(dir);
  return dir;
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop(), { recursive: true, force: true });
});

function readyFields(extra = {}) {
  return {
    translator: "X",
    edition: "Schaff",
    editionYear: 1889,
    sourceUrl: "https://example.test/retractationes",
    license: "us-public-domain",
    ...extra
  };
}

describe("provenance migrations", () => {
  it("adds columns to an old work_texts table once", () => {
    const dir = tempDir();
    const db = openDatabase(join(dir, "old.sqlite"));
    try {
      db.exec(`
        CREATE TABLE work_texts (
          work_id TEXT NOT NULL,
          language TEXT NOT NULL CHECK (language IN ('english', 'original')),
          title TEXT,
          status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready')),
          r2_key TEXT,
          source_path TEXT,
          content_sha256 TEXT,
          byte_size INTEGER,
          updated_at TEXT,
          PRIMARY KEY (work_id, language)
        )
      `);
      db.prepare("INSERT INTO work_texts (work_id, language, status) VALUES ('READY1', 'english', 'ready')").run();
      db.prepare("INSERT INTO work_texts (work_id, language, status) VALUES ('DRAFT1', 'english', 'draft')").run();
      applySchema(db);
      const names = db.prepare("PRAGMA table_info(work_texts)").all().map((row) => row.name);
      expect(names).toEqual(expect.arrayContaining([
        "translator", "edition", "edition_year", "source_url", "license", "quality"
      ]));
      expect(db.prepare("SELECT id FROM schema_migrations ORDER BY id").all().map((row) => row.id)).toEqual([
        "0001_text_provenance",
        "0002_ready_quality_clean"
      ]);
      expect(db.prepare("SELECT quality FROM work_texts WHERE work_id = 'READY1'").get().quality).toBe("clean");
      expect(db.prepare("SELECT quality FROM work_texts WHERE work_id = 'DRAFT1'").get().quality).toBe("needs-cleanup");
      expect(db.prepare(
        "SELECT translator, edition, edition_year, source_url, license FROM work_texts WHERE work_id = 'READY1'"
      ).get()).toEqual({
        translator: null,
        edition: null,
        edition_year: null,
        source_url: null,
        license: null
      });
      db.prepare("UPDATE work_texts SET quality = 'verified' WHERE work_id = 'READY1'").run();
      db.prepare("INSERT INTO work_texts (work_id, language, status, quality) VALUES ('READY2', 'english', 'ready', 'needs-cleanup')").run();
      db.prepare("DELETE FROM schema_migrations WHERE id = '0002_ready_quality_clean'").run();
      applySchema(db);
      expect(db.prepare("SELECT quality FROM work_texts WHERE work_id = 'READY1'").get().quality).toBe("verified");
      expect(db.prepare("SELECT quality FROM work_texts WHERE work_id = 'READY2'").get().quality).toBe("clean");
      expect(db.prepare("SELECT COUNT(*) AS n FROM schema_migrations").get().n).toBe(2);
      expect(() => {
        db.prepare("INSERT INTO work_texts (work_id, language, quality) VALUES ('X', 'english', 'nope')").run();
      }).toThrow(/CHECK constraint failed/);
    } finally {
      db.close();
    }
  });
});

describe("ready provenance", () => {
  it("refuses a ready English text that is missing a required field", () => {
    const dir = tempDir();
    const sqlitePath = join(dir, "clavis.sqlite");
    packClavisSqlite(FIXTURE, sqlitePath);
    expect(() => attachTextFile({
      sqlitePath,
      filePath: ENGLISH,
      workId: AUGUSTINE,
      language: "english",
      status: "ready",
      bodiesRoot: join(dir, "bodies"),
      license: "us-public-domain",
      translator: "X"
    })).toThrow(/status=ready requires source_url/);

    expect(() => attachTextFile({
      sqlitePath,
      filePath: ENGLISH,
      workId: AUGUSTINE,
      language: "english",
      status: "ready",
      bodiesRoot: join(dir, "bodies"),
      sourceUrl: "https://example.test/retractationes",
      license: "us-public-domain"
    })).toThrow(/translator/);

    const na = attachTextFile({
      sqlitePath,
      filePath: ENGLISH,
      workId: AUGUSTINE,
      language: "english",
      status: "ready",
      bodiesRoot: join(dir, "bodies"),
      ...readyFields({ translator: "n/a" })
    });
    expect(na.translator).toBe("n/a");
    expect(na.status).toBe("ready");
  });

  it("accepts anonymous and original text, and keeps filled fields on a later body update", () => {
    const dir = tempDir();
    const sqlitePath = join(dir, "clavis.sqlite");
    const bodies = join(dir, "bodies");
    packClavisSqlite(FIXTURE, sqlitePath);
    const anonymous = attachTextFile({
      sqlitePath,
      filePath: ENGLISH,
      workId: AUGUSTINE,
      language: "english",
      status: "ready",
      bodiesRoot: bodies,
      ...readyFields({ translator: "anonymous" })
    });
    expect(anonymous.translator).toBe("anonymous");
    expect(anonymous.quality).toBe("needs-cleanup");

    const again = attachTextFile({
      sqlitePath,
      filePath: ENGLISH,
      workId: AUGUSTINE,
      language: "english",
      status: "ready",
      bodiesRoot: bodies,
      ...readyFields()
    });
    expect(again.translator).toBe("X");

    const kept = attachTextFile({
      sqlitePath,
      filePath: ENGLISH,
      workId: AUGUSTINE,
      language: "english",
      status: "draft",
      bodiesRoot: bodies
    });
    expect(kept.translator).toBe("X");
    expect(kept.license).toBe("us-public-domain");
    expect(kept.quality).toBe("needs-cleanup");

    const original = attachTextFile({
      sqlitePath,
      filePath: ENGLISH,
      workId: AUGUSTINE,
      language: "original",
      status: "ready",
      bodiesRoot: bodies,
      sourceUrl: "https://example.test/latin",
      license: "us-public-domain"
    });
    expect(original.translator).toBeNull();
    expect(original.status).toBe("ready");

    expect(() => attachTextFile({
      sqlitePath,
      filePath: ENGLISH,
      workId: AUGUSTINE,
      language: "english",
      status: "draft",
      bodiesRoot: bodies,
      quality: "shiny"
    })).toThrow(/quality must be/);
  });
});

describe("provenance backfill", () => {
  function setup() {
    const dir = tempDir();
    const sqlitePath = join(dir, "clavis.sqlite");
    packClavisSqlite(FIXTURE, sqlitePath);
    attachTextFile({
      sqlitePath,
      filePath: ENGLISH,
      workId: AUGUSTINE,
      language: "english",
      status: "draft",
      bodiesRoot: join(dir, "bodies")
    });
    return { sqlitePath, db: openDatabase(sqlitePath) };
  }

  const csv = [
    "work_id,translator,edition,edition_year,source_url,license",
    AUGUSTINE + ',X,Schaff,1889,https://example.test/retractationes,us-public-domain',
    "DEADBEEFDEADBEEFDEADBEEFDEADBEEF,Nobody,,,https://example.test/missing,us-public-domain"
  ].join("\n");

  it("fills empty English fields, skips conflicts, and can be forced", () => {
    const rows = parseProvenanceCsv(csv);
    expect(rows[0].edition_year).toBe(1889);
    const { db } = setup();
    try {
      const first = backfillProvenance(db, rows, { updatedAt: "2026-09-29T00:00:00.000Z" });
      expect(first.updated).toEqual([AUGUSTINE]);
      expect(first.unmatched.map((row) => row.work_id)).toEqual(["DEADBEEFDEADBEEFDEADBEEFDEADBEEF"]);
      const stored = db.prepare("SELECT translator, edition, edition_year, license FROM work_texts WHERE work_id = ?").get(AUGUSTINE);
      expect(stored).toMatchObject({ translator: "X", edition: "Schaff", edition_year: 1889, license: "us-public-domain" });

      const second = backfillProvenance(db, rows, { updatedAt: "2026-09-29T00:00:00.000Z" });
      expect(second.updated).toEqual([]);
      expect(second.unchanged).toEqual([AUGUSTINE]);
      expect(second.conflicts).toEqual([]);

      const clash = parseProvenanceCsv(
        "work_id,translator,edition,edition_year,source_url,license\n" +
        AUGUSTINE + ",Someone Else,NPNF,1887,https://example.test/other,us-public-domain\n"
      );
      const blocked = backfillProvenance(db, clash);
      expect(blocked.conflicts.map((row) => row.field).sort()).toEqual([
        "edition", "edition_year", "source_url", "translator"
      ]);
      expect(blocked.updated).toEqual([]);
      const still = db.prepare("SELECT translator FROM work_texts WHERE work_id = ?").get(AUGUSTINE);
      expect(still.translator).toBe("X");

      const forced = backfillProvenance(db, clash, { force: true });
      expect(forced.conflicts.every((row) => row.applied)).toBe(true);
      const overwritten = db.prepare("SELECT translator, edition_year FROM work_texts WHERE work_id = ?").get(AUGUSTINE);
      expect(overwritten).toMatchObject({ translator: "Someone Else", edition_year: 1887 });
    } finally {
      db.close();
    }
  });

  it("prints each field before --force replaces it on a ready row", () => {
    const dir = tempDir();
    const sqlitePath = join(dir, "clavis.sqlite");
    packClavisSqlite(FIXTURE, sqlitePath);
    attachTextFile({
      sqlitePath,
      filePath: ENGLISH,
      workId: AUGUSTINE,
      language: "english",
      status: "ready",
      bodiesRoot: join(dir, "bodies"),
      ...readyFields()
    });
    const db = openDatabase(sqlitePath);
    const lines = [];
    try {
      const clash = parseProvenanceCsv(
        "work_id,translator,edition,edition_year,source_url,license\n" +
        AUGUSTINE + ",Someone Else,NPNF,1887,https://example.test/other,us-public-domain\n"
      );
      const blocked = backfillProvenance(db, clash, { log: (...args) => lines.push(args.join(" ")) });
      expect(blocked.updated).toEqual([]);
      expect(lines).toEqual([]);
      const still = db.prepare("SELECT translator FROM work_texts WHERE work_id = ?").get(AUGUSTINE);
      expect(still.translator).toBe("X");

      const forced = backfillProvenance(db, clash, {
        force: true,
        log: (...args) => {
          const mid = db.prepare(
            "SELECT translator, edition, edition_year, source_url FROM work_texts WHERE work_id = ?"
          ).get(AUGUSTINE);
          expect(mid).toMatchObject({
            translator: "X",
            edition: "Schaff",
            edition_year: 1889,
            source_url: "https://example.test/retractationes"
          });
          lines.push(args.join(" "));
        }
      });
      expect(forced.updated).toEqual([AUGUSTINE]);
      expect(lines).toEqual([
        'force ready ' + AUGUSTINE + ' translator: "X" -> "Someone Else"',
        'force ready ' + AUGUSTINE + ' edition: "Schaff" -> "NPNF"',
        'force ready ' + AUGUSTINE + ' edition_year: 1889 -> 1887',
        'force ready ' + AUGUSTINE + ' source_url: "https://example.test/retractationes" -> "https://example.test/other"'
      ]);
      const stored = db.prepare("SELECT translator, edition, edition_year, source_url, license FROM work_texts WHERE work_id = ?").get(AUGUSTINE);
      expect(stored).toMatchObject({
        translator: "Someone Else",
        edition: "NPNF",
        edition_year: 1887,
        source_url: "https://example.test/other",
        license: "us-public-domain"
      });
    } finally {
      db.close();
    }
  });

  it("reports a work that has no English row and a bad year", () => {
    const dir = tempDir();
    const sqlitePath = join(dir, "clavis.sqlite");
    packClavisSqlite(FIXTURE, sqlitePath);
    const db = openDatabase(sqlitePath);
    try {
      const rows = parseProvenanceCsv(
        "work_id,translator,edition,edition_year,source_url,license\n" +
        AUGUSTINE + ",X,Schaff,not-a-year,https://example.test/x,us-public-domain\n" +
        "6F4F6BC373DE46C0B5C6093B651B0EAE,X,,,https://example.test/a,us-public-domain\n"
      );
      const report = backfillProvenance(db, rows);
      expect(report.conflicts).toEqual([
        expect.objectContaining({ work_id: AUGUSTINE, field: "edition_year", applied: false })
      ]);
      expect(report.noText).toEqual([
        expect.objectContaining({ work_id: "6F4F6BC373DE46C0B5C6093B651B0EAE" })
      ]);
      expect(report.updated).toEqual([]);
    } finally {
      db.close();
    }
  });

  it("exits cleanly when the provenance CSV is missing", () => {
    const missing = join(tempDir(), "no-such-provenance.csv");
    const result = spawnSync(process.execPath, [
      join(ROOT, "scripts/clavis/backfill-provenance.mjs"),
      "--csv",
      missing
    ], { encoding: "utf8" });
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/provenance CSV not found/);
    expect(result.stdout).toMatch(/Leaving provenance fields empty/);
  });
});

describe("attribution", () => {
  it("builds the reader line from the stored fields", () => {
    expect(attributionFor({
      language: "english",
      license: "us-public-domain",
      translator: "X",
      edition: "Schaff",
      edition_year: 1889
    })).toBe("Public domain. Translated by X (Schaff, 1889)");
    expect(attributionFor({
      language: "english",
      license: "us-public-domain",
      translator: "anonymous",
      edition: null,
      edition_year: null
    })).toBe("Public domain. Anonymous");
    expect(attributionFor({
      language: "original",
      license: "us-public-domain",
      translator: null,
      edition: "CSEL",
      edition_year: 1896
    })).toBe("Public domain. (CSEL, 1896)");
    expect(attributionFor({
      language: "english",
      license: null,
      translator: "n/a",
      edition: null,
      edition_year: null
    })).toBe("");
  });
});

describe("attach provenance overlay", () => {
  it("copies CSV fields onto planned rows and drops a conflicting duplicate", () => {
    const ready = [{ work_id: AUGUSTINE, source_path: "Fathers/English/x.txt" }];
    const overlaid = overlayProvenance(ready, parseProvenanceCsv(
      "work_id,translator,edition,edition_year,source_url,license\n" +
      AUGUSTINE + ",X,Schaff,1889,https://example.test/retractationes,us-public-domain\n"
    ));
    expect(overlaid.rows[0]).toMatchObject({
      translator: "X",
      edition: "Schaff",
      edition_year: 1889,
      source_url: "https://example.test/retractationes",
      license: "us-public-domain"
    });

    const dropped = overlayProvenance(ready, [
      { work_id: AUGUSTINE, translator: "X", edition: "Schaff", edition_year: 1889, source_url: "https://a", license: "us-public-domain" },
      { work_id: AUGUSTINE, translator: "Y", edition: "Schaff", edition_year: 1889, source_url: "https://a", license: "us-public-domain" }
    ]);
    expect(dropped.duplicates).toEqual([AUGUSTINE]);
    expect(dropped.rows[0].translator).toBeUndefined();
  });
});
