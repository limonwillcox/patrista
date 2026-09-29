#!/usr/bin/env node
import { readFileSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { applySchema, openDatabase, root } from "./import-works.mjs";

const FIELDS = ["translator", "edition", "edition_year", "source_url", "license"];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((line) => line.some((value) => String(value).trim() !== ""));
}

function emptyToNull(value) {
  if (value == null) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
}

export function parseProvenanceCsv(text) {
  const table = parseCsv(text);
  if (!table.length) throw new Error("provenance CSV is empty");
  const header = table[0].map((cell) => String(cell).trim().toLowerCase());
  for (const key of ["work_id", ...FIELDS]) {
    if (!header.includes(key)) throw new Error("provenance CSV missing column " + key);
  }
  const idx = Object.fromEntries(header.map((name, index) => [name, index]));
  const rows = [];
  for (let i = 1; i < table.length; i++) {
    const cells = table[i];
    const pick = (key) => emptyToNull(cells[idx[key]] ?? "");
    const yearRaw = pick("edition_year");
    let editionYear = null;
    let yearError = null;
    if (yearRaw != null) {
      if (!/^\d{1,4}$/.test(yearRaw)) yearError = yearRaw;
      else editionYear = Number(yearRaw);
    }
    rows.push({
      line: i + 1,
      work_id: String(cells[idx.work_id] || "").trim().toUpperCase(),
      translator: pick("translator"),
      edition: pick("edition"),
      edition_year: editionYear,
      edition_year_error: yearError,
      source_url: pick("source_url"),
      license: pick("license")
    });
  }
  return rows;
}

function sameValue(field, have, want) {
  if (have == null || String(have).trim() === "") return false;
  if (field === "edition_year") return Number(have) === Number(want);
  return String(have).trim() === String(want).trim();
}

function isEmpty(value) {
  return value == null || String(value).trim() === "";
}

export function backfillProvenance(db, rows, options = {}) {
  const force = options.force === true;
  const report = {
    updated: [],
    unchanged: [],
    unmatched: [],
    noText: [],
    conflicts: []
  };
  const workExists = db.prepare("SELECT 1 AS ok FROM works WHERE work_id = ?");
  const textRow = db.prepare(`
    SELECT work_id, language, translator, edition, edition_year, source_url, license
    FROM work_texts
    WHERE work_id = ? AND language = 'english'
  `);
  const update = db.prepare(`
    UPDATE work_texts
    SET translator = ?, edition = ?, edition_year = ?, source_url = ?, license = ?,
        updated_at = ?
    WHERE work_id = ? AND language = 'english'
  `);
  const seen = new Map();

  db.exec("BEGIN");
  try {
    for (const row of rows) {
      if (!row.work_id) {
        report.unmatched.push({ line: row.line, work_id: "", reason: "blank work_id" });
        continue;
      }
      if (row.edition_year_error) {
        report.conflicts.push({
          line: row.line,
          work_id: row.work_id,
          field: "edition_year",
          have: null,
          csv: row.edition_year_error,
          applied: false
        });
        continue;
      }
      const prev = seen.get(row.work_id);
      if (prev) {
        if (FIELDS.some((field) => prev[field] !== row[field])) {
          report.conflicts.push({
            line: row.line,
            work_id: row.work_id,
            field: "csv",
            have: "earlier row " + prev.line,
            csv: "line " + row.line,
            applied: false
          });
        }
        continue;
      }
      seen.set(row.work_id, row);
      if (!workExists.get(row.work_id)) {
        report.unmatched.push({ line: row.line, work_id: row.work_id, reason: "not in works" });
        continue;
      }
      const current = textRow.get(row.work_id);
      if (!current) {
        report.noText.push({ line: row.line, work_id: row.work_id, reason: "no english work_texts row" });
        continue;
      }

      const next = {
        translator: current.translator,
        edition: current.edition,
        edition_year: current.edition_year,
        source_url: current.source_url,
        license: current.license
      };
      let changed = false;
      let blocked = false;
      for (const field of FIELDS) {
        const want = row[field];
        if (want == null) continue;
        if (isEmpty(current[field])) {
          next[field] = want;
          changed = true;
          continue;
        }
        if (sameValue(field, current[field], want)) continue;
        blocked = true;
        report.conflicts.push({
          line: row.line,
          work_id: row.work_id,
          field,
          have: current[field],
          csv: want,
          applied: force
        });
        if (force) {
          next[field] = want;
          changed = true;
        }
      }
      if (changed) {
        update.run(
          next.translator == null ? null : String(next.translator),
          next.edition == null ? null : String(next.edition),
          next.edition_year == null ? null : Number(next.edition_year),
          next.source_url == null ? null : String(next.source_url),
          next.license == null ? null : String(next.license),
          options.updatedAt || new Date().toISOString(),
          row.work_id
        );
        report.updated.push(row.work_id);
      } else if (!blocked) {
        report.unchanged.push(row.work_id);
      }
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
  return report;
}

export function printProvenanceReport(report) {
  for (const row of report.unmatched) {
    console.log("unmatched", row.work_id || "(blank)", row.reason, "line", row.line);
  }
  for (const row of report.noText) {
    console.log("no-text", row.work_id, row.reason, "line", row.line);
  }
  for (const row of report.conflicts) {
    const action = row.applied ? "overwritten" : "kept";
    console.log(
      "conflict",
      row.work_id,
      row.field + ":",
      "database",
      JSON.stringify(row.have),
      "csv",
      JSON.stringify(row.csv),
      action,
      "line",
      row.line
    );
  }
  console.log(
    "updated",
    report.updated.length,
    "unchanged",
    report.unchanged.length,
    "conflicts",
    report.conflicts.length,
    "unmatched",
    report.unmatched.length,
    "no-text",
    report.noText.length
  );
}

export function provenanceProblemCount(report) {
  const openConflicts = report.conflicts.filter((row) => !row.applied).length;
  return report.unmatched.length + report.noText.length + openConflicts;
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--force") out.force = true;
    else if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next == null || next.startsWith("--")) out[key] = true;
      else {
        out[key] = next;
        i++;
      }
    } else out._.push(arg);
  }
  return out;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = parseArgs(process.argv.slice(2));
  const csvPath = resolve(root, args.csv || args._[0] || "data/clavis/provenance-backfill.csv");
  const sqlitePath = resolve(root, args.sqlite || "data/clavis/clavis.sqlite");
  let text;
  try {
    text = readFileSync(csvPath, "utf8");
  } catch (err) {
    const code = err && err.code;
    if (code === "ENOENT") {
      console.error("provenance CSV not found: " + csvPath);
      console.error("Expected columns: work_id,translator,edition,edition_year,source_url,license");
      process.exit(1);
    }
    throw err;
  }
  const rows = parseProvenanceCsv(text);
  const db = openDatabase(sqlitePath);
  try {
    applySchema(db);
    const report = backfillProvenance(db, rows, { force: args.force === true });
    printProvenanceReport(report);
    process.exit(provenanceProblemCount(report) ? 1 : 0);
  } finally {
    db.close();
  }
}
