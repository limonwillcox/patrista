/**
 * List, re-verify, or opt-in fetch rows from data/pd-english-sources/catalog.jsonl.
 *
 * Usage:
 *   node scripts/pd-english-sources/run.mjs list [--coverage in_patrista|overlap|not_in_patrista|hub] [--section N] [--type TXT|Book Scan|Web Library]
 *   node scripts/pd-english-sources/run.mjs stats
 *   node scripts/pd-english-sources/run.mjs check [--id ID] [--coverage ...] [--section N]
 *   node scripts/pd-english-sources/run.mjs fetch --yes [--id ID] [--coverage not_in_patrista] [--type TXT] [--format txt|djvu-txt|pdf]
 *
 * Fetch never runs on clone. Without --yes it only prints what it would download.
 * Downloads land in data/pd-english-sources/cache/ (gitignored).
 */
import { createReadStream, existsSync, mkdirSync, writeFileSync } from "fs";
import { createInterface } from "readline";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const catalogPath = join(root, "data", "pd-english-sources", "catalog.jsonl");
const cacheDir = join(root, "data", "pd-english-sources", "cache");
const UA = "Patrista/pd-english-sources (personal library; public-domain catalog)";

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (key === "yes") {
        args.yes = true;
      } else if (next && !next.startsWith("--")) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else {
      args._.push(a);
    }
  }
  return args;
}

async function loadCatalog() {
  if (!existsSync(catalogPath)) {
    throw new Error(`Missing ${catalogPath}. Run: python3 scripts/pd-english-sources/build_catalog.py`);
  }
  const rows = [];
  const rl = createInterface({ input: createReadStream(catalogPath, "utf8"), crlfDelay: Infinity });
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    rows.push(JSON.parse(trimmed));
  }
  return rows;
}

function filterRows(rows, args) {
  return rows.filter((row) => {
    if (args.id && row.id !== args.id) return false;
    if (args.coverage && row.coverage !== args.coverage) return false;
    if (args.section && String(row.section) !== String(args.section)) return false;
    if (args.type && row.type !== args.type) return false;
    if (args.group && row.group !== args.group) return false;
    return true;
  });
}

function printTable(rows) {
  for (const row of rows) {
    console.log(`${row.id}\t§${row.section}\t${row.coverage}\t${row.type}\t${row.url}\t${row.name}`);
  }
  console.log(`# ${rows.length} row(s)`);
}

function stats(rows) {
  const byCoverage = {};
  const bySection = {};
  const byType = {};
  for (const row of rows) {
    byCoverage[row.coverage] = (byCoverage[row.coverage] || 0) + 1;
    bySection[row.section] = (bySection[row.section] || 0) + 1;
    byType[row.type] = (byType[row.type] || 0) + 1;
  }
  console.log(JSON.stringify({ total: rows.length, byCoverage, bySection, byType }, null, 2));
}

async function fetchUrl(url, { method = "GET", maxBytes = null } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch(url, {
      method,
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "User-Agent": UA },
    });
    if (maxBytes != null && res.body) {
      const reader = res.body.getReader();
      let seen = 0;
      while (seen < maxBytes) {
        const { done, value } = await reader.read();
        if (done) break;
        seen += value.byteLength;
      }
      try { await reader.cancel(); } catch {}
    }
    return { status: res.status, ok: res.ok, url: res.url };
  } finally {
    clearTimeout(timer);
  }
}

async function checkRows(rows) {
  let ok = 0;
  let fail = 0;
  for (const row of rows) {
    try {
      let result = await fetchUrl(row.url, { method: "HEAD" });
      if (!result.ok) {
        result = await fetchUrl(row.url, { method: "GET", maxBytes: 2048 });
      }
      const mark = result.ok ? "OK  " : "FAIL";
      if (result.ok) ok++;
      else fail++;
      console.log(`${mark} ${result.status} ${row.id} ${row.url}`);
    } catch (err) {
      fail++;
      console.log(`FAIL ERR ${row.id} ${row.url} ${err.message || err}`);
    }
  }
  console.log(`# checked ${rows.length}: ${ok} ok, ${fail} fail`);
  return fail === 0;
}

function safeName(id) {
  return String(id).replace(/[^a-zA-Z0-9._-]+/g, "-");
}

async function iaFileUrl(iaId, format) {
  const metaUrl = `https://archive.org/metadata/${iaId}`;
  const res = await fetch(metaUrl, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`metadata HTTP ${res.status} for ${iaId}`);
  const meta = await res.json();
  const files = Array.isArray(meta.files) ? meta.files : [];
  const want = format === "pdf" ? "pdf" : "djvu-txt";
  const match = files.find((f) => {
    const name = String(f.name || "").toLowerCase();
    const fmt = String(f.format || "").toLowerCase();
    if (want === "pdf") return fmt === "text pdf" || fmt === "pdf" || name.endsWith(".pdf");
    return fmt === "djvutxt" || name.endsWith("_djvu.txt");
  });
  if (!match) {
    const names = files.map((f) => f.name).filter(Boolean).slice(0, 12).join(", ");
    throw new Error(`no ${want} file in ${iaId} (have: ${names})`);
  }
  return {
    url: `https://archive.org/download/${iaId}/${encodeURIComponent(match.name)}`,
    filename: match.name,
  };
}

async function downloadTo(url, dest) {
  const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, buf);
  return buf.length;
}

async function fetchRows(rows, args) {
  const format = args.format || (args.type === "TXT" ? "txt" : "djvu-txt");
  mkdirSync(cacheDir, { recursive: true });
  let done = 0;
  let skipped = 0;
  let failed = 0;
  for (const row of rows) {
    if (row.type === "Web Library") {
      console.log(`SKIP  ${row.id} web library (not a volume file)`);
      skipped++;
      continue;
    }
    let url = row.url;
    let dest;
    try {
      if (row.type === "TXT" && format === "txt") {
        dest = join(cacheDir, `${safeName(row.id)}.txt`);
      } else if (row.ia_id) {
        if (format === "txt") {
          console.log(`SKIP  ${row.id} Book Scan has no CCEL txt; use --format djvu-txt or pdf`);
          skipped++;
          continue;
        }
        const file = await iaFileUrl(row.ia_id, format);
        url = file.url;
        const ext = format === "pdf" ? ".pdf" : ".txt";
        dest = join(cacheDir, `${safeName(row.id)}${ext}`);
      } else {
        console.log(`SKIP  ${row.id} no fetchable file for type=${row.type}`);
        skipped++;
        continue;
      }
      if (existsSync(dest)) {
        console.log(`HAVE  ${row.id} ${dest}`);
        skipped++;
        continue;
      }
      if (!args.yes) {
        console.log(`DRY   ${row.id} ${url} -> ${dest}`);
        continue;
      }
      console.log(`GET   ${row.id} ${url}`);
      const bytes = await downloadTo(url, dest);
      console.log(`OK    ${row.id} ${bytes} bytes -> ${dest}`);
      done++;
    } catch (err) {
      failed++;
      console.error(`FAIL  ${row.id}: ${err.message || err}`);
    }
  }
  if (!args.yes) {
    console.log("# dry run; pass --yes to download into data/pd-english-sources/cache/");
  }
  console.log(`# fetch ${rows.length}: ${done} downloaded, ${skipped} skipped, ${failed} fail`);
  return failed === 0;
}

function help() {
  console.log(`PD English source catalog

Commands:
  list    Print id, section, coverage, type, url, name
  stats   JSON counts by coverage / section / type
  check   Re-verify URLs (HEAD, then GET). Archive.org often fails HEAD.
  fetch   Opt-in download into data/pd-english-sources/cache/

Filters (all commands):
  --id ID
  --coverage in_patrista|overlap|not_in_patrista|hub
  --section 1..6
  --type "TXT"|"Book Scan"|"Web Library"
  --group ANF|LFC|SPCK|Budge|...

Fetch flags:
  --yes              actually write files (otherwise dry run)
  --format txt       CCEL .txt (default for type TXT)
  --format djvu-txt  Archive.org OCR text (default for Book Scan)
  --format pdf       Archive.org PDF

Examples:
  node scripts/pd-english-sources/run.mjs list --coverage not_in_patrista
  node scripts/pd-english-sources/run.mjs check --section 1
  node scripts/pd-english-sources/run.mjs fetch --coverage not_in_patrista --type TXT
  node scripts/pd-english-sources/run.mjs fetch --yes --id s1-bede-sellar
  node scripts/pd-english-sources/run.mjs fetch --yes --id s5-james-ant --format djvu-txt

ANF / NPNF volume dumps already live in Fathers/English/. Re-download those with:
  node scripts/ccel-english/download.mjs
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];
  if (!cmd || cmd === "help" || args.help) {
    help();
    return;
  }
  const rows = filterRows(await loadCatalog(), args);
  if (cmd === "list") {
    printTable(rows);
    return;
  }
  if (cmd === "stats") {
    stats(rows);
    return;
  }
  if (cmd === "check") {
    const ok = await checkRows(rows);
    process.exitCode = ok ? 0 : 1;
    return;
  }
  if (cmd === "fetch") {
    const ok = await fetchRows(rows, args);
    process.exitCode = ok ? 0 : 1;
    return;
  }
  console.error(`unknown command: ${cmd}`);
  help();
  process.exitCode = 2;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
