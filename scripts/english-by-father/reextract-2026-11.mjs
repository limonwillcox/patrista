/**
 * Re-extract works whose per-Father file held the wrong text (Nov 2026 library audit).
 *
 * Each entry cuts one work out of its CCEL volume dump (Fathers/English/ANF|NPNF1|NPNF2) between
 * heading lines, and writes Fathers/English/<Father>_English/<file> with the usual "# source" header.
 * `start` is a list of patterns found in turn (each search begins after the previous hit), so a
 * heading that occurs several times can be reached through the ones before it. `end` is the first
 * line after the start that matches; that line is not included.
 *
 * Nothing is rewritten: the text between the two lines is copied as it stands in the volume.
 *
 * Usage: node scripts/english-by-father/reextract-2026-11.mjs [--dry]
 */
import { existsSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "fs";
import { dirname, join, relative } from "path";
import { fileURLToPath } from "url";
// The volume dumps still carry double-encoded UTF-8 ("CÃ¦sar"); the extracts were repaired with this.
import { repairMojibake } from "../fix-mojibake.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const englishRoot = join(root, "Fathers", "English");
const dry = process.argv.includes("--dry");

const JOBS = [
  {
    // The old file ran on from Commodian into Origen's De Principiis, which the parser showed instead.
    father: "Commodianus",
    file: "Instructions of Commodianus.txt",
    work: "Instructions of Commodianus",
    latin: "Instructiones",
    series: "ANF",
    volume: "Volume IV.",
    start: [/^  Commodianus\s*$/],
    end: /^  Origen\s*$/
  },
  {
    // The old file ran on into the pseudo-Tertullian poems of the Appendix; only the poems' "Book" headings
    // were found, so the treatise itself was lost.
    father: "Tertullian",
    file: "De Fuga in Persecutione.txt",
    work: "De Fuga in Persecutione",
    latin: "de Fuga in Persecutione",
    series: "ANF",
    volume: "Volume IV.",
    start: [/^  De Fuga in Persecutione\s*$/],
    end: /^   X\.\s*$/
  },
  {
    // ANF IV Appendix, poem 5: "Author Uncertain". Kept as its own work, not as Tertullian's treatise.
    father: "Tertullian",
    file: "Five Books in Reply to Marcion (poem).txt",
    work: "Five Books in Reply to Marcion (poem)",
    series: "ANF",
    volume: "Volume IV.",
    start: [/^   5\.  Five Books in Reply to Marcion\.\s*$/],
    end: /^  Minucius Felix\s*$/
  },
  {
    // The old file ran on into the Passion of Perpetua and Felicitas (now its own work).
    father: "Tertullian",
    file: "Ad Martyras.txt",
    work: "Ad Martyras",
    latin: "ad Martyres",
    series: "ANF",
    volume: "Volume III.",
    start: [/^  Ad Martyras\s*$/],
    end: /^  The Passion of the Holy Martyrs Perpetua and Felicitas\s*$/
  },
  {
    father: "Apostolic",
    file: "The Passion of the Holy Martyrs Perpetua and Felicitas.txt",
    work: "The Passion of the Holy Martyrs Perpetua and Felicitas",
    latin: "Passio Sanctarum Perpetuae et Felicitatis",
    series: "ANF",
    volume: "Volume III.",
    start: [/^  The Passion of the Holy Martyrs Perpetua and Felicitas\s*$/],
    end: /^  Of Patience\s*$/
  },
  {
    // The old file ran on into the Commentary on Matthew (Books X–XIV were shown as John's).
    father: "Origen",
    file: "Commentary on John.txt",
    work: "Commentary on John",
    series: "ANF",
    volume: "Volume IX.",
    start: [/^   Origen's Commentary on the Gospel of John\.\s*$/],
    end: /^   Origen's Commentary\s*$/
  },
  {
    father: "Origen",
    file: "Commentary on Matthew.txt",
    work: "Commentary on Matthew",
    series: "ANF",
    volume: "Volume IX.",
    start: [/^   Origen's Commentary on the Gospel of John\.\s*$/, /^   Origen's Commentary\s*$/],
    end: /^\s{12,}Indexes\s*$/
  },
  {
    // NPNF2 I holds three works after the Church History; the old "Oration of Eusebius" file held all three.
    father: "Eusebius",
    file: "Life of Constantine.txt",
    work: "Life of Constantine",
    latin: "Vita Constantini",
    series: "NPNF2",
    volume: "Volume I.",
    start: [/^   III\. The Oration of Eusebius\.\s*$/, /^   The Life\s*$/],
    end: /^   The Oration\s*$/
  },
  {
    father: "Eusebius",
    file: "Oration of Constantine to the Assembly of the Saints.txt",
    work: "Oration of Constantine to the Assembly of the Saints",
    latin: "Oratio ad Sanctorum Coetum",
    series: "NPNF2",
    volume: "Volume I.",
    start: [/^   III\. The Oration of Eusebius\.\s*$/, /^   The Life\s*$/, /^   The Oration\s*$/],
    end: /^   The Oration\s*$/
  },
  {
    father: "Eusebius",
    file: "Oration of Eusebius.txt",
    work: "Oration in Praise of Constantine",
    latin: "De Laudibus Constantini",
    series: "NPNF2",
    volume: "Volume I.",
    start: [/^   III\. The Oration of Eusebius\.\s*$/, /^   The Life\s*$/, /^   The Oration\s*$/, /^   The Oration\s*$/],
    end: /^\s*THE CHURCH HISTORY OF EUSEBIUS\.\s*$/
  },
  {
    // The old file was the whole synoptical table (KJV Gospel columns) and the Diatessaron's introduction.
    father: "Apostolic",
    file: "The Gospel of Peter.txt",
    work: "The Gospel of Peter",
    series: "ANF",
    volume: "Volume IX.",
    start: [/^   The Gospel of Peter\.\s*$/],
    end: /^   Synoptical Table\s*$/
  },
  {
    // The old file began at Book VII; Books I–VI were missing.
    father: "Lactantius",
    file: "The Divine Institutes.txt",
    work: "The Divine Institutes",
    latin: "Divinae institutiones",
    series: "ANF",
    volume: "Volume VII.",
    start: [/^the divine institutes\s*$/],
    end: /^  The Epitome of the Divine Institutes\.\s*$/
  },
  {
    father: "Lactantius",
    file: "The Epitome of the Divine Institutes.txt",
    work: "The Epitome of the Divine Institutes",
    latin: "Epitome divinarum institutionum",
    series: "ANF",
    volume: "Volume VII.",
    start: [/^  The Epitome of the Divine Institutes\.\s*$/],
    end: /^A Treatise on the Anger of God\s*$/
  },
  {
    // The old file ran on through Julius Africanus, the minor Alexandrians, Archelaus and Alexander of Lycopolis.
    father: "Dionysius",
    file: "Extant Fragments of Dionysius.txt",
    work: "Extant Fragments of Dionysius",
    series: "ANF",
    volume: "Volume VI.",
    start: [/^  Extant Fragments\s*$/],
    end: /^  Julius Africanus\s*$/
  }
];

/** Files that the jobs above replace and that no longer hold a work of their own. */
const REMOVE = [];

function findVolume(series, prefix) {
  const dir = join(englishRoot, series);
  const hit = readdirSync(dir).find((n) => n.startsWith(prefix + " "));
  if (!hit) throw new Error(`Missing ${series}/${prefix}*`);
  return join(dir, hit);
}

function lineAfter(lines, re, from) {
  for (let i = from; i < lines.length; i++) if (re.test(lines[i])) return i;
  return -1;
}

function existingHeader(dest) {
  if (!existsSync(dest)) return {};
  const out = {};
  for (const line of readFileSync(dest, "utf8").split(/\r?\n/)) {
    const m = line.match(/^#\s*([a-z_]+)\s*:\s*(.*)$/i);
    if (!m) break;
    out[m[1].toLowerCase()] = m[2];
  }
  return out;
}

for (const job of JOBS) {
  const volume = findVolume(job.series, job.volume);
  const lines = readFileSync(volume, "utf8").replace(/\r\n/g, "\n").split("\n");
  let at = -1;
  for (const re of job.start) {
    at = lineAfter(lines, re, at + 1);
    if (at < 0) throw new Error(`${job.file}: start ${re} not found`);
  }
  const end = lineAfter(lines, job.end, at + 1);
  if (end < 0) throw new Error(`${job.file}: end ${job.end} not found`);
  const body = repairMojibake(lines.slice(at, end).join("\n").trim()).text;
  const dest = join(englishRoot, `${job.father}_English`, job.file);
  const old = existingHeader(dest);
  const header = [
    `# source: ${relative(root, volume).replace(/\\/g, "/")}`,
    `# series: ${job.series}`,
    `# volume: ${job.volume}`,
    `# father: ${job.father}`,
    `# work: ${job.work}`,
    ...(old.clavis ? [`# clavis: ${old.clavis}`] : []),
    `# latin_match_candidate: ${job.latin || old.latin_match_candidate || "(none)"}`,
    `# extracted: 2026-11-06 (lines ${at + 1}-${end} of the volume; scripts/english-by-father/reextract-2026-11.mjs)`,
    `# note: Public-domain Schaff English extract. Volume archives retained under ANF/NPNF1/NPNF2.`,
    ""
  ].join("\n");
  console.log(`${dry ? "DRY " : ""}${job.father}/${job.file}  L${at + 1}-L${end}  (${body.length} chars)`);
  if (!dry) writeFileSync(dest, header + body + "\n");
}

for (const rel of REMOVE) {
  const abs = join(englishRoot, rel);
  if (existsSync(abs)) {
    console.log(`${dry ? "DRY " : ""}remove ${rel}`);
    if (!dry) unlinkSync(abs);
  }
}
