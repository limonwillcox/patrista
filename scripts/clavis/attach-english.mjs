#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { applySchema, defaultSchemaPath, openDatabase, root } from "./import-works.mjs";
import { attachText } from "./attach-text.mjs";

/**
 * High-confidence English → Clavis links.
 * A file is ready only when its folder's author tokens and this Latin title
 * hit exactly one imported work, and exactly one file claims that work
 * (a reviewed standalone plan row may pick between two files).
 * Collection files and multi-matches are reported and left unattached.
 */
export const ENGLISH_ALIASES = [
  ["Augustine_English/The City of God.txt", ["augustinus", "hippon"], "De Ciuitate Dei"],
  ["Augustine_English/The Confessions (NPNF Pilkington).txt", ["augustinus", "hippon"], "Confessiones"],
  ["Augustine_English/The Confessions of St. Augustine. Augustine.txt", ["augustinus", "hippon"], "Confessiones"],
  ["Augustine_English/On the Holy Trinity.txt", ["augustinus", "hippon"], "De Trinitate"],
  ["Augustine_English/On Christian Doctrine.txt", ["augustinus", "hippon"], "De doctrina christiana"],
  ["Augustine_English/Reply to Faustus the Manichaean.txt", ["augustinus", "hippon"], "Contra Faustum Manichaeum"],
  ["Augustine_English/Against Fortunatus.txt", ["augustinus", "hippon"], "Contra Fortunatum Manichaeum"],
  ["Augustine_English/Soliloquies.txt", ["augustinus", "hippon"], "Soliloquia"],
  ["Augustine_English/On Faith and the Creed.txt", ["augustinus", "hippon"], "De fide et symbolo"],
  ["Augustine_English/On Catechising of the Uninstructed.txt", ["augustinus", "hippon"], "De catechizandis rudibus"],
  ["Augustine_English/On Nature and Grace.txt", ["augustinus", "hippon"], "De natura et gratia"],
  ["Augustine_English/On Grace and Free Will.txt", ["augustinus", "hippon"], "De gratia et libero arbitrio"],
  ["Augustine_English/On Rebuke and Grace.txt", ["augustinus", "hippon"], "De correptione et gratia"],
  ["Augustine_English/On the Gift of Perseverance.txt", ["augustinus", "hippon"], "De dono perseuerantiae"],
  ["Augustine_English/On the Predestination of the Saints.txt", ["augustinus", "hippon"], "De praedestinatione sanctorum"],
  ["Augustine_English/On the Spirit and the Letter.txt", ["augustinus", "hippon"], "De spiritu et littera"],
  ["Augustine_English/On the Grace of Christ and Original Sin.txt", ["augustinus", "hippon"], "De gratia Christi et de peccato originali"],
  ["Augustine_English/On the Merits and Forgiveness of Sins.txt", ["augustinus", "hippon"], "De peccatorum meritis et remissione et de baptismo paruulorum"],
  ["Augustine_English/Concerning the Nature of Good.txt", ["augustinus", "hippon"], "De natura boni"],
  ["Augustine_English/Concerning Two Souls.txt", ["augustinus", "hippon"], "De duabus animabus"],
  ["Augustine_English/Expositions on the Psalms.txt", ["augustinus", "hippon"], "Enarrationes in psalmos"],
  ["Augustine_English/On Baptism Against the Donatists.txt", ["augustinus", "hippon"], "De baptismo contra Donatistas libri vii"],
  ["Augustine_English/On the Soul and its Origin.txt", ["augustinus", "hippon"], "De natura et origine animae"],
  ["Augustine_English/Our Lord's Sermon on the Mount.txt", ["augustinus", "hippon"], "De sermone Domini in monte libri ii"],
  ["Augustine_English/The Harmony of the Gospels.txt", ["augustinus", "hippon"], "De consensu Euangelistarum libri iv"],
  ["Augustine_English/Homilies on the Gospel of John.txt", ["augustinus", "hippon"], "Tractatus in Euangelium Ioannis"],
  ["Augustine_English/Homilies on the First Epistle of John.txt", ["augustinus", "hippon"], "In Ioannis epistulam ad Parthos tractatus x"],
  ["Augustine_English/Against the Epistle of Manichaeus Called Fundamental.txt", ["augustinus", "hippon"], "Contra epistulam fundamenti Manichaeorum"],
  ["Augustine_English/Answer to Letters of Petilian.txt", ["augustinus", "hippon"], "Contra litteras Petiliani libri iii"],
  ["Augustine_English/Against Two Letters of the Pelagians.txt", ["augustinus", "hippon"], "Contra duas epistulas Pelagianorum"],
  ["Ambrose_English/Exposition of the Christian Faith.txt", ["ambrosius", "mediolan"], "De fide"],
  ["Ambrose_English/On the Holy Spirit.txt", ["ambrosius", "mediolan"], "De Spiritu Sancto"],
  ["Ambrose_English/On the Mysteries.txt", ["ambrosius", "mediolan"], "De mysteriis"],
  ["Ambrose_English/On the Duties of the Clergy.txt", ["ambrosius", "mediolan"], "De officiis ministrorum"],
  ["Ambrose_English/Concerning Virgins.txt", ["ambrosius", "mediolan"], "De uirginibus"],
  ["Ambrose_English/Concerning Widows.txt", ["ambrosius", "mediolan"], "De uiduis"],
  ["Jerome_English/The Life of Malchus, the Captive Monk.txt", ["hieronymus"], "Vita Malchi"],
  ["Jerome_English/The Life of Paulus the First Hermit.txt", ["hieronymus"], "Vita Sancti Pauli"],
  ["Tertullian_English/The Apology.txt", ["tertullian"], "Apologeticum"],
  ["Tertullian_English/Ad Martyras.txt", ["tertullian"], "Ad martyras"],
  ["Tertullian_English/Ad Nationes.txt", ["tertullian"], "Ad nationes libri ii"],
  ["Tertullian_English/To Scapula.txt", ["tertullian"], "Ad Scapulam"],
  ["Tertullian_English/To His Wife.txt", ["tertullian"], "Ad uxorem"],
  ["Tertullian_English/An Answer to the Jews.txt", ["tertullian"], "Liber aduersus Iudaeos"],
  ["Tertullian_English/The Five Books Against Marcion.txt", ["tertullian"], "Aduersus Marcionem"],
  ["Tertullian_English/Against Praxeas.txt", ["tertullian"], "Aduersus Praxean"],
  ["Tertullian_English/Against Hermogenes.txt", ["tertullian"], "Aduersus Hermogenem"],
  ["Tertullian_English/Against the Valentinians.txt", ["tertullian"], "Aduersus Valentinianos"],
  ["Tertullian_English/Against All Heresies.txt", ["tertullian"], "Aduersus omnes haereses"],
  ["Tertullian_English/On Baptism.txt", ["tertullian"], "De baptismo"],
  ["Tertullian_English/On Prayer.txt", ["tertullian"], "De oratione"],
  ["Tertullian_English/Of Patience.txt", ["tertullian"], "De patientia"],
  ["Tertullian_English/On Repentance.txt", ["tertullian"], "De paenitentia"],
  ["Tertullian_English/On Modesty.txt", ["tertullian"], "De pudicitia"],
  ["Tertullian_English/On Fasting.txt", ["tertullian"], "De ieiunio adversus Psychicos"],
  ["Tertullian_English/On Idolatry.txt", ["tertullian"], "De idololatria"],
  ["Tertullian_English/The Chaplet (De Corona).txt", ["tertullian"], "De corona militis"],
  ["Tertullian_English/On the Pallium.txt", ["tertullian"], "De pallio"],
  ["Tertullian_English/On the Flesh of Christ.txt", ["tertullian"], "De carne Christi"],
  ["Tertullian_English/On the Resurrection of the Flesh.txt", ["tertullian"], "De resurrectione mortuorum"],
  ["Tertullian_English/On the Veiling of Virgins.txt", ["tertullian"], "De uirginibus uelandis"],
  ["Tertullian_English/On the Apparel of Women.txt", ["tertullian"], "De cultu feminarum"],
  ["Tertullian_English/On Monogamy.txt", ["tertullian"], "De monogamia"],
  ["Tertullian_English/On Exhortation to Chastity.txt", ["tertullian"], "De exhortatione castitatis"],
  ["Tertullian_English/The Shows (De Spectaculis).txt", ["tertullian"], "De spectaculis"],
  ["Tertullian_English/A Treatise on the Soul.txt", ["tertullian"], "De anima"],
  ["Tertullian_English/The Soul's Testimony.txt", ["tertullian"], "De testimonio animae"],
  ["Tertullian_English/Scorpiace.txt", ["tertullian"], "Scorpiace"],
  ["Tertullian_English/The Prescription Against Heretics.txt", ["tertullian"], "De praescriptione haereticorum"],
  ["Tertullian_English/De Fuga in Persecutione.txt", ["tertullian"], "De fuga in persecutione"],
  ["Lactantius_English/The Divine Institutes.txt", ["lactantius"], "Diuinae Institutiones"],
  ["Lactantius_English/Of the Manner in Which the Persecutors Died.txt", ["lactantius"], "De mortibus persecutorum"],
  ["Lactantius_English/On the Anger of God.txt", ["lactantius"], "De ira Dei"],
  ["Lactantius_English/On the Workmanship of God.txt", ["lactantius"], "De opificio Dei"],
  ["Cyril_Jerusalem_English/Catechetical Lectures.txt", ["cyrillus", "hierosolym"], "Catecheses"],
  ["Gregory_English/The Book of Pastoral Rule.txt", ["gregorius", "magnus"], "Regula pastoralis"],
  ["Arnobius_English/Against the Heathen.txt", ["arnobius"], "Aduersus nationes"],
  ["Athanasius_English/Against the Heathen.txt", ["athanasius", "alexandrin"], "Oratio contra gentes"],
  ["Athanasius_English/On the Incarnation of the Word.txt", ["athanasius", "alexandrin"], "Oratio de incarnatione Verbi"],
  ["Novatian_English/A Treatise Concerning the Trinity.txt", ["novatianus"], "De Trinitate"],
  ["Novatian_English/On the Jewish Meats.txt", ["novatianus"], "De cibis iudaicis"],
  ["Commodianus_English/Instructions of Commodianus.txt", ["commodianus"], "Instructiones"],
  ["Minucius_Felix_English/The Octavius.txt", ["minucius"], "Octauius"],
  ["Vincent_English/The Commonitory.txt", ["vincentius"], "Commonitorium"],
  ["Polycarp_English/Epistle to the Philippians.txt", ["polycarpus"], "Epistula ad Philippenses"],
  ["Polycarp_English/Martyrdom of Polycarp.txt", ["polycarpus"], "Epistula Ecclesiae Smyrnensis de martyrio sancti Polycarpi"],
  ["Hermas_English/The Pastor of Hermas.txt", ["hermas"], "Pastor Hermae"],
  ["Theophilus_English/To Autolycus.txt", ["theophilus", "antioch"], "Ad Autolycum libri III"],
  ["Methodius_English/Banquet of the Ten Virgins.txt", ["methodius", "olymp"], "Conuiuium decem uirginum"],
  ["Hippolytus_English/The Refutation of All Heresies.txt", ["hippolytus"], "Refutatio omnium haeresium"],
  ["Clement_Alexandria_English/The Instructor.txt", ["clemens", "alexandrin"], "Paedagogus"],
  ["Clement_Alexandria_English/The Stromata.txt", ["clemens", "alexandrin"], "Stromata"],
  ["Clement_Alexandria_English/Exhortation to the Heathen.txt", ["clemens", "alexandrin"], "Protrepticus"],
  ["Clement_Alexandria_English/Who is the Rich Man that Shall Be Saved.txt", ["clemens", "alexandrin"], "Quis diues saluetur"],
  ["Clement_Alexandria_English/Excerpts of Theodotus.txt", ["clemens", "alexandrin"], "Excerpta e Theodoto"],
  ["Clement_Rome_English/The First Epistle of Clement.txt", ["clemens", "roman"], "Epistula ad Corinthios"],
  ["Eusebius_English/Church History.txt", ["eusebius", "caesarien"], "Historia ecclesiastica"],
  ["Socrates_English/Ecclesiastical History.txt", ["socrates"], "Historia ecclesiastica"],
  ["Sozomen_English/Ecclesiastical History.txt", ["sozomenus"], "Historia ecclesiastica"],
  ["John_Damascus_English/Exposition of the Orthodox Faith.txt", ["iohannes", "damascen"], "Expositio fidei"],
  ["Basil_English/Homilies on the Hexaemeron.txt", ["basilius", "caesarien"], "Homiliae in hexaemeron"],
  ["Irenaeus_English/Against Heresies.txt", ["irenaeus"], "Aduersus haereses"],
  ["Justin_English/The First Apology.txt", ["iustinus"], "Apologia"],
  ["Justin_English/Dialogue with Trypho.txt", ["iustinus"], "Dialogus cum Tryphone Iudaeo"],
  ["Ignatius_English/Epistles of Ignatius.txt", ["ignatius", "antioch"], "Epistulae vii genuinae"],
  ["Ignatius_English/Spurious Epistles of Ignatius.txt", ["ignatius", "antioch"], "Epistulae interpolatae et epistulae suppositiciae"],
  ["Ignatius_English/Martyrdom of Ignatius.txt", ["ignatius", "antioch"], "Martyrium S. Ignatii ep. Antiocheni m."],
  ["Chrysostom_English/Homilies on Matthew.txt", ["chrysostom"], "In Matthaeum homiliae 1-90"],
  ["Gregory_Thaumaturgus_English/Canonical Epistle.txt", ["neocaesarien"], "Epistula canonica"],
  ["Gregory_Thaumaturgus_English/Metaphrase of Ecclesiastes.txt", ["neocaesarien"], "Methaphrasis in Ecclesiasten"],
  ["Gregory_Thaumaturgus_English/On the Subject of the Soul.txt", ["neocaesarien"], "Opusculum de anima"],
  ["Gregory_Thaumaturgus_English/Oration and Panegyric to Origen.txt", ["neocaesarien"], "In Origenem oratio panegyrica"],
  ["Gregory_Thaumaturgus_English/Declaration of Faith.txt", ["neocaesarien"], "Confessio fidei"]
];

const COLLECTION_NAME = /select |selected |fragments|remainder|treatises of|questionable|and dialogues|and conferences|writings of|extant works|four homilies|letters\.txt$|epistles of /i;

// These paths are named like one work but the extract also holds other works.
const MULTI_WORK_FILES = new Set([
  "Augustine_English/On Faith and the Creed.txt",
  "Athanasius_English/On the Incarnation of the Word.txt",
  "Cyril_Jerusalem_English/Catechetical Lectures.txt",
  "Ignatius_English/Epistles of Ignatius.txt",
  "Commodianus_English/Instructions of Commodianus.txt",
  "Gregory_English/The Book of Pastoral Rule.txt"
]);

export function trimCcelIndex(text) {
  const lines = String(text).split(/\n/);
  let end = lines.length;
  while (end > 0 && lines[end - 1].trim() === "") end--;
  let indexStart = end;
  while (indexStart > 0 && /file:\/\/\/ccel\//.test(lines[indexStart - 1])) indexStart--;
  if (end - indexStart < 40) return String(text);
  return lines.slice(0, indexStart).join("\n").replace(/\s+$/, "") + "\n";
}

export function normTitle(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[«»]/g, " ")
    .toLowerCase()
    .replace(/v/g, "u")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function authorMatches(name, tokens) {
  const n = normTitle(name);
  return tokens.every((token) => n.includes(normTitle(token)));
}

function englishTitle(relPath) {
  const base = relPath.split("/").pop() || relPath;
  return base.replace(/\.txt$/i, "").replace(/\s+/g, " ").trim();
}

function planAgrees(plan, workId) {
  if (!plan || plan.match !== "standalone" || plan.extract !== "whole-file") return false;
  if (/wrong author/i.test(String(plan.notes || ""))) return false;
  return String(plan.work_id || "").toUpperCase() === workId;
}

export function planEnglishAttaches(works, filePaths, planRows = []) {
  const files = new Set(filePaths.map((path) => path.replace(/\\/g, "/")));
  const planByPath = new Map();
  const collectionPaths = new Set();
  for (const row of planRows) {
    const path = String(row.path || "").replace(/^Fathers\/English\//, "");
    if (!path) continue;
    const list = planByPath.get(path) || [];
    list.push(row);
    planByPath.set(path, list);
    if (row.match === "collection") collectionPaths.add(path);
  }

  const ready = [];
  const skipped = [];
  const claimed = new Map();

  const groups = new Map();
  for (const [file, tokens, title] of ENGLISH_ALIASES) {
    const key = tokens.join("|") + "\n" + normTitle(title);
    const list = groups.get(key) || [];
    list.push({ file, tokens, title });
    groups.set(key, list);
  }

  for (const group of groups.values()) {
    const { tokens, title } = group[0];
    const hits = works.filter((work) => authorMatches(work.author_name, tokens) && normTitle(work.title_latin) === normTitle(title));
    const present = group.filter((item) => files.has(item.file));
    if (!present.length) continue;
    const usable = [];
    for (const item of present) {
      if (!MULTI_WORK_FILES.has(item.file)) {
        usable.push(item);
        continue;
      }
      skipped.push({
        source_path: "Fathers/English/" + item.file,
        reason: "collection",
        note: "extract contains more than one work"
      });
    }
    if (!usable.length) continue;
    if (hits.length !== 1) {
      const elsewhere = hits.length === 0
        ? works.filter((work) => normTitle(work.title_latin) === normTitle(title)).slice(0, 4)
        : [];
      for (const item of usable) {
        skipped.push({
          source_path: "Fathers/English/" + item.file,
          reason: hits.length === 0 ? (elsewhere.length ? "author_mismatch" : "no_title_match") : "ambiguous_works",
          title_latin: title,
          hits: (hits.length ? hits : elsewhere).map((hit) => ({
            work_id: hit.work_id,
            title_latin: hit.title_latin,
            author: hit.author_name
          }))
        });
      }
      continue;
    }
    const hit = hits[0];
    const partBlocked = usable.filter((item) => {
      const plans = planByPath.get(item.file) || [];
      const standalone = plans.find((plan) => planAgrees(plan, hit.work_id));
      return collectionPaths.has(item.file) && !standalone;
    });
    for (const item of partBlocked) {
      skipped.push({
        source_path: "Fathers/English/" + item.file,
        reason: "collection",
        work_id: hit.work_id,
        title_latin: hit.title_latin
      });
    }
    const candidates = usable.filter((item) => !partBlocked.includes(item));
    if (!candidates.length) continue;
    let chosen = candidates;
    if (candidates.length > 1) {
      const agreed = candidates.filter((item) => (planByPath.get(item.file) || []).some((plan) => planAgrees(plan, hit.work_id)));
      if (agreed.length === 1) {
        chosen = agreed;
        for (const item of candidates) {
          if (item === agreed[0]) continue;
          skipped.push({
            source_path: "Fathers/English/" + item.file,
            reason: "duplicate_file",
            work_id: hit.work_id,
            kept: "Fathers/English/" + agreed[0].file
          });
        }
      } else {
        for (const item of candidates) {
          skipped.push({
            source_path: "Fathers/English/" + item.file,
            reason: "ambiguous_files",
            work_id: hit.work_id,
            title_latin: hit.title_latin
          });
        }
        continue;
      }
    }
    const item = chosen[0];
    const plans = planByPath.get(item.file) || [];
    const conflict = plans.find((plan) => plan.match === "standalone" && String(plan.work_id || "").toUpperCase() !== hit.work_id);
    if (conflict && !/wrong author/i.test(String(conflict.notes || ""))) {
      skipped.push({
        source_path: "Fathers/English/" + item.file,
        reason: "plan_conflict",
        work_id: hit.work_id,
        plan_work_id: String(conflict.work_id || "").toUpperCase()
      });
      continue;
    }
    const sourcePath = "Fathers/English/" + item.file;
    if (claimed.has(hit.work_id)) {
      skipped.push({
        source_path: sourcePath,
        reason: "duplicate_file",
        work_id: hit.work_id,
        kept: claimed.get(hit.work_id)
      });
      continue;
    }
    claimed.set(hit.work_id, sourcePath);
    ready.push({
      work_id: hit.work_id,
      language: "english",
      status: "ready",
      title: englishTitle(item.file),
      title_latin: hit.title_latin,
      author: hit.author_name,
      clavis: hit.clavis,
      source_path: sourcePath,
      plan_note: conflict ? String(conflict.notes || "") : null
    });
  }

  for (const path of collectionPaths) {
    const sourcePath = "Fathers/English/" + path;
    if (ready.some((row) => row.source_path === sourcePath)) continue;
    if (skipped.some((row) => row.source_path === sourcePath)) continue;
    skipped.push({ source_path: sourcePath, reason: "collection" });
  }

  for (const file of files) {
    const sourcePath = "Fathers/English/" + file;
    if (ready.some((row) => row.source_path === sourcePath)) continue;
    if (skipped.some((row) => row.source_path === sourcePath)) continue;
    const reason = COLLECTION_NAME.test(file) ? "collection" : "unmatched";
    skipped.push({ source_path: sourcePath, reason });
  }

  return { ready, skipped };
}

export function loadWorks(db) {
  return db
    .prepare(`
      SELECT w.work_id, w.title_latin, w.clavis_codes, a.name_latin AS author_name
      FROM works w
      JOIN authors a ON a.author_id = w.author_id
    `)
    .all()
    .map((row) => ({
      work_id: String(row.work_id),
      title_latin: String(row.title_latin),
      author_name: String(row.author_name),
      clavis: JSON.parse(String(row.clavis_codes || "[]"))
    }));
}

export function listEnglishFiles(englishRoot) {
  const out = [];
  function walk(dir, prefix) {
    for (const name of readdirSync(dir)) {
      if (name.startsWith("_")) continue;
      const abs = join(dir, name);
      const rel = prefix ? prefix + "/" + name : name;
      if (statSync(abs).isDirectory()) walk(abs, rel);
      else if (name.endsWith(".txt")) out.push(rel);
    }
  }
  walk(englishRoot, "");
  return out;
}

export function attachReadyBatch(options) {
  const db = options.db;
  const updatedAt = options.updatedAt || new Date().toISOString();
  const attached = [];
  for (const row of options.ready) {
    const abs = join(options.repoRoot, row.source_path);
    if (!existsSync(abs)) {
      throw new Error("missing English file " + row.source_path);
    }
    const result = attachText({
      db,
      workId: row.work_id,
      language: "english",
      body: trimCcelIndex(readFileSync(abs, "utf8")),
      title: row.title,
      status: "ready",
      sourcePath: row.source_path,
      bodiesRoot: options.bodiesRoot,
      updatedAt
    });
    attached.push({ ...row, ...result, status: "ready" });
  }
  return attached;
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
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

export function runEnglishAttach(options) {
  const db = openDatabase(options.sqlitePath);
  try {
    applySchema(db, options.schemaPath || defaultSchemaPath);
    const works = loadWorks(db);
    const files = options.files || listEnglishFiles(options.englishRoot);
    const plan = options.plan || [];
    const planned = planEnglishAttaches(works, files, plan);
    if (options.dryRun) return { ...planned, attached: [] };
    const attached = attachReadyBatch({
      db,
      ready: planned.ready,
      repoRoot: options.repoRoot,
      bodiesRoot: options.bodiesRoot,
      updatedAt: options.updatedAt
    });
    return { ...planned, attached };
  } finally {
    db.close();
  }
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n");
}

function seedLine(row) {
  return JSON.stringify({
    work_id: row.work_id,
    language: "english",
    title: row.title,
    status: "ready",
    r2_key: row.r2_key,
    source_path: row.source_path,
    content_sha256: row.content_sha256,
    byte_size: row.byte_size,
    updated_at: row.updated_at
  });
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = parseArgs(process.argv.slice(2));
  const sqlitePath = resolve(root, args.sqlite || "data/clavis/clavis.sqlite");
  const englishRoot = resolve(root, args.english || "Fathers/English");
  const planPath = resolve(root, args.plan || "data/clavis/imports/batch-001-promote-plan.json");
  const plan = existsSync(planPath) ? JSON.parse(readFileSync(planPath, "utf8")) : [];
  const result = runEnglishAttach({
    sqlitePath,
    englishRoot,
    plan,
    repoRoot: root,
    bodiesRoot: resolve(root, args.bodies || "data/clavis/bodies"),
    dryRun: args["dry-run"] === true
  });
  const report = {
    ready: result.attached.length ? result.attached.map((row) => ({
      work_id: row.work_id,
      title: row.title,
      title_latin: row.title_latin,
      author: row.author,
      clavis: row.clavis,
      source_path: row.source_path,
      r2_key: row.r2_key,
      content_sha256: row.content_sha256,
      byte_size: row.byte_size,
      plan_note: row.plan_note
    })) : result.ready,
    skipped: result.skipped
  };
  if (args.report) writeJson(resolve(root, args.report), report);
  if (args.seed && result.attached.length) {
    const seedPath = resolve(root, args.seed);
    mkdirSync(dirname(seedPath), { recursive: true });
    writeFileSync(seedPath, result.attached.map(seedLine).join("\n") + "\n");
  }
  const byReason = {};
  for (const row of result.skipped) byReason[row.reason] = (byReason[row.reason] || 0) + 1;
  const readyCount = args["dry-run"] === true ? result.ready.length : result.attached.length;
  console.log("ready", readyCount);
  console.log("skipped", JSON.stringify(byReason));
}
