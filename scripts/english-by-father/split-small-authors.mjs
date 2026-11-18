/**
 * Fill the gaps found in the Nov 2026 audit of authors with one or two works.
 *
 * New works, cut out of the CCEL volume dumps (Fathers/English/ANF|NPNF2):
 *   - Tatian: The Diatessaron (ANF IX) and the Fragments (ANF II)
 *   - Irenaeus: Fragments from the Lost Writings (ANF I)
 *   - Rufinus: Apology to Anastasius, On the Adulteration of the Works of Origen, Prefaces (NPNF2 III)
 * An existing work made whole:
 *   - Gregory the Great: Books IX-XIV of the Register (NPNF2 XIII) appended to Selected Epistles,
 *     which held only Books I-VIII (NPNF2 XII)
 * And two files cut back, because the fragments above sat at their end and were shown as the tail of
 * the last chapter: Irenaeus' Against Heresies and Tatian's Address to the Greeks.
 *
 * Each new work goes to Fathers/English/<Father>_English/<Work>.txt with the usual "# source" header.
 * The text between the two heading lines is copied as it stands in the volume, with two exceptions for
 * the Diatessaron, described at diatessaron() below. Running it twice changes nothing.
 *
 * Usage: node scripts/english-by-father/split-small-authors.mjs [--dry]
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { dirname, join, relative } from "path";
import { fileURLToPath } from "url";
// The volume dumps still carry double-encoded UTF-8 ("CÃ¦sar"); the extracts are repaired with this.
import { repairMojibake } from "../fix-mojibake.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const englishRoot = join(root, "Fathers", "English");
const dry = process.argv.includes("--dry");
const SCRIPT = "scripts/english-by-father/split-small-authors.mjs";
const DATE = "2026-11-17";

const RULE_RE = /^\s*[_\-]{5,}\s*$/;
const NAV_URL_RE = /(?:\/ccel\/schaff\/|www\.ccel\.org\/ccel\/)\S*?\.html?\b/;
const NAV_CODE_RE = /^\s*[a-z0-9_]+ [a-z0-9_ -]*\b(?:anf|npnf)\d+(?: |$)/i;

const volumes = new Map();
function volume(series, prefix) {
  const key = series + "/" + prefix;
  if (volumes.has(key)) return volumes.get(key);
  const dir = join(englishRoot, series);
  const hit = readdirSync(dir).find((n) => n.startsWith(prefix));
  if (!hit) throw new Error(`Missing ${key}*`);
  const path = join(dir, hit);
  const v = { series, prefix, path, lines: readFileSync(path, "utf8").replace(/\r\n/g, "\n").split("\n") };
  volumes.set(key, v);
  return v;
}

/** 1-based line number of the first match at or after `from`, or -1. */
function first(lines, re, from = 1) {
  for (let i = from - 1; i < lines.length; i++) if (re.test(lines[i])) return i + 1;
  return -1;
}

/** Drop the blank lines, rules and "next work" link block left at the end of a cut. */
function trimTail(lines) {
  const out = lines.slice();
  for (let i = out.length - 1; i >= Math.max(0, out.length - 14); i--) {
    if (NAV_CODE_RE.test(out[i])) {
      out.length = i;
      break;
    }
  }
  while (out.length && (!out[out.length - 1].trim() || RULE_RE.test(out[out.length - 1]) || NAV_URL_RE.test(out[out.length - 1]))) out.pop();
  return out;
}

/**
 * Lines of the volume from the line matching the last of `start` (each pattern is looked for after the
 * one before it) up to, not including, the first later line matching `end`.
 */
function cut(v, start, end) {
  let at = 0;
  for (const re of start) {
    at = first(v.lines, re, at + 1);
    if (at < 0) throw new Error(`start ${re} not found in ${v.prefix}`);
  }
  const stop = first(v.lines, end, at + 1);
  if (stop < 0) throw new Error(`end ${end} not found in ${v.prefix}`);
  return { from: at, to: stop - 1, lines: trimTail(v.lines.slice(at - 1, stop - 1)) };
}

function header(v, job, ranges) {
  return [
    `# source: ${relative(root, v.path).replace(/\\/g, "/")}`,
    `# series: ${v.series}`,
    `# volume: ${v.prefix}`,
    `# father: ${job.father}`,
    `# work: ${job.work}`,
    `# latin_match_candidate: (none)`,
    ...(job.translator ? [`# translator: ${job.translator}`] : []),
    `# extracted: ${DATE} (lines ${ranges} of the volume; ${SCRIPT})`,
    `# note: ${job.note || "Public-domain Schaff English extract. Volume archives retained under ANF/NPNF1/NPNF2."}`,
    ""
  ].join("\n");
}

function save(job, v, parts) {
  let lines = parts.flatMap((p, i) => (i ? ["     __________________________________________________________________", "", ...p.lines] : p.lines));
  if (job.fix) lines = job.fix(lines);
  const body = repairMojibake(lines.join("\n").replace(/\s+$/, "")).text;
  const ranges = parts.map((p) => `${p.from}-${p.to}`).join(", ");
  const dest = join(englishRoot, job.father + "_English", job.file);
  const text = header(v, job, ranges) + body + "\n";
  const same = existsSync(dest) && readFileSync(dest, "utf8") === text;
  console.log(`${dry ? "DRY " : ""}${same ? "same " : "write"} ${job.father}/${job.file}  L${ranges}  ${body.split(/\s+/).length} words`);
  if (!dry && !same) writeFileSync(dest, text);
}

/**
 * The Diatessaron as CCEL prints it carries three kinds of bracketed marks in the running text: the
 * footnote numbers ("[136]", one series through the volume), the verse numbers of each section ("[52]",
 * "[58, 59]", from 1 in every section) and the pages of Ciasca's Arabic edition ("[Arabic, p. 5]").
 * A verse number in square brackets cannot be told from a footnote number by the reader, so here the
 * verse numbers are written "(52)" and the Arabic page numbers are left out. The first section's
 * heading, printed "[Section I]", is written like the others, and the footnote that two headings carry
 * goes after the first verse number of their text instead.
 *
 * A bracketed number is a footnote mark when it is the next number of the section's footnote series;
 * otherwise it is the verse number, which must follow the verse before it.
 */
function diatessaron(lines) {
  const out = [];
  const stats = { verses: 0, notes: 0, pages: 0, odd: [] };
  // Two sections carry a footnote on the heading ("Section XXVIII. [1932]"); the first is printed "[Section I]".
  lines = lines.map((l) => (/^ {3}\[Section I\]\s*$/.test(l) ? "   Section I." : l));
  const isHead = (l) => /^ {3}(?:Introductory Notes|Section [IVXL]+|Subscriptions)\.(?: \[\d+\])?\s*$/.test(l);
  let i = 0;
  while (i < lines.length) {
    let j = i + 1;
    while (j < lines.length && !isHead(lines[j])) j++;
    const block = lines.slice(i, j);
    const head = block[0].trim();
    // The notes follow a rule of underscores (a short rule of hyphens only sets off a heading).
    const ruleAt = block.findIndex((l) => /^\s*_{5,}\s*$/.test(l));
    const text = ruleAt < 0 ? block : block.slice(0, ruleAt);
    const rest = ruleAt < 0 ? [] : block.slice(ruleAt);
    const bodies = rest.map((l) => l.match(/^ {3}\[(\d+)\] /)).filter(Boolean).map((m) => Number(m[1]));
    let expected = bodies.length ? Math.min(...bodies) : Infinity;
    const last = bodies.length ? Math.max(...bodies) : -1;
    let verse = 0;
    const joined = text
      .join("\n")
      .replace(/\[Arabic,\s+p\.\s+\d+\][ \t]?/g, () => {
        stats.pages++;
        return "";
      })
      .replace(/\[(\d+(?:,\s*\d+)*)\]/g, (whole, inner) => {
        const nums = inner.split(/,\s*/).map(Number);
        if (nums.length === 1 && nums[0] === expected && expected <= last) {
          if (nums[0] === verse + 1) stats.odd.push(`${head}: [${inner}] could be verse or note; taken as note`);
          expected++;
          stats.notes++;
          return whole;
        }
        if (/^Section/.test(head) && nums[0] > verse && nums[0] <= verse + 3) {
          verse = nums[nums.length - 1];
          stats.verses++;
          return "(" + inner.replace(/,\s*/g, ", ") + ")";
        }
        if (nums.length === 1 && bodies.includes(nums[0])) {
          if (nums[0] > expected) stats.odd.push(`${head}: note [${inner}] comes before [${expected}]`);
          else stats.odd.push(`${head}: note [${inner}] cited again`);
          if (nums[0] >= expected) expected = nums[0] + 1;
          stats.notes++;
          return whole;
        }
        stats.odd.push(`${head}: [${inner}] is neither the next verse (${verse + 1}) nor a note of this section`);
        return whole;
      });
    if (expected <= last) stats.odd.push(`${head}: notes [${expected}]-[${last}] are not cited in the text`);
    // Lines emptied by a dropped page number, and the doubled blank lines they leave, are closed up.
    const textOut = joined.split("\n").map((l) => l.replace(/[ \t]+$/, ""));
    // A footnote on a section heading moves to the head of the section's text, so the heading stays plain.
    const onHead = textOut[0].match(/^( {3}Section [IVXL]+\.) (\[\d+\])\s*$/);
    if (onHead) {
      const firstText = textOut.findIndex((l, k) => k > 0 && l.trim());
      textOut[0] = onHead[1];
      // Not at the very start: a paragraph that opens with "[1932] " reads as the body of note 1932.
      textOut[firstText] = textOut[firstText].replace(/^(\s*(?:\(\d+(?:, \d+)*\) )?)/, "$1" + onHead[2] + " ");
      if (/^\s*\[/.test(textOut[firstText])) throw new Error("Diatessaron: no verse number to put " + onHead[2] + " after");
    }
    // The same for a line of verse that opens with its footnote ("[2309] The same came to be…"): the mark
    // goes after the first word.
    for (let k = 1; k < textOut.length; k++) {
      if (!textOut[k - 1].trim()) textOut[k] = textOut[k].replace(/^(\s*)(\[\d+\]) (\S+)/, "$1$3 $2");
    }
    out.push(...textOut, ...rest);
    i = j;
  }
  console.log(`     Diatessaron: ${stats.verses} verse numbers, ${stats.notes} footnote marks, ${stats.pages} Arabic page numbers dropped`);
  for (const o of stats.odd) console.log("     ? " + o);
  return ["   The Diatessaron of Tatian.", "", "   ------------------------", "", ...out];
}

/**
 * ANF II prints the notes of all Tatian's fragments together after the last one. A note is shown with the
 * unit that holds its body, so each body is moved to the end of the fragment that cites it, under a rule,
 * the way the volume sets the notes of every other section. A note cited only on the heading stays put.
 */
function notesUnderTheirFragment(lines) {
  const ruleAt = lines.findIndex((l) => /^\s*_{5,}\s*$/.test(l));
  if (ruleAt < 0) return lines;
  const text = lines.slice(0, ruleAt);
  const bodies = new Map();
  let n = null;
  for (const l of lines.slice(ruleAt + 1)) {
    const m = l.match(/^ {3}\[(\d+)\] /);
    if (m) bodies.set((n = m[1]), [l]);
    else if (n && l.trim()) bodies.get(n).push(l);
    else n = null;
  }
  const heads = text.map((l, i) => (/^ {6}[IVX]+\.\s*$/.test(l) ? i : -1)).filter((i) => i >= 0);
  const out = text.slice(0, heads[0]);
  const used = new Set();
  heads.forEach((h, k) => {
    const seg = text.slice(h, heads[k + 1] ?? text.length);
    while (seg.length && !seg[seg.length - 1].trim()) seg.pop();
    const cited = [...seg.join("\n").matchAll(/\[(\d+)\]/g)].map((m) => m[1]).filter((c) => bodies.has(c) && !used.has(c));
    out.push(...seg);
    if (cited.length) {
      out.push("     __________________________________________________________________");
      for (const c of cited) {
        used.add(c);
        out.push("", ...bodies.get(c));
      }
      out.push("     __________________________________________________________________");
    }
    out.push("");
  });
  const left = [...bodies.keys()].filter((c) => !used.has(c));
  if (left.length) {
    out.push("     __________________________________________________________________");
    for (const c of left) out.push("", ...bodies.get(c));
  }
  return out;
}

const ANF1 = () => volume("ANF", "Volume I.");
const ANF2 = () => volume("ANF", "Volume II.");
const ANF9 = () => volume("ANF", "Volume IX.");
const NPNF2_3 = () => volume("NPNF2", "Volume III.");
const NPNF2_13 = () => volume("NPNF2", "Volume XIII.");

const VOLUME_END = /^ {12,}Indexes\s*$|^\s*This document is from the Christian Classics Ethereal/;

const NEW_WORKS = [
  {
    vol: ANF1, father: "Irenaeus", work: "Fragments from the Lost Writings of Irenaeus",
    file: "Fragments from the Lost Writings of Irenaeus.txt",
    // Two fragments carry their source note on the numeral ("XXX. [4846]"): it goes into the fragment's text instead.
    fix: (lines) => {
      const out = lines.slice();
      for (let i = 0; i < out.length; i++) {
        const m = out[i].match(/^( {2}[IVXL]+\.) (\[\d+\])\s*$/);
        if (!m) continue;
        const next = out.findIndex((l, k) => k > i && l.trim());
        out[i] = m[1];
        // After the first word: a paragraph that opens with "[4846] " reads as the body of note 4846.
        out[next] = out[next].replace(/^(\s*\S+)/, "$1 " + m[2]);
      }
      return out;
    },
    parts: [{ start: [/^Fragments from the Lost Writings of Iren\S+us\s*$/], end: VOLUME_END }]
  },
  {
    vol: ANF2, father: "Tatian", work: "Fragments of Tatian", file: "Fragments of Tatian.txt", translator: "J. E. Ryland",
    parts: [{ start: [/^ {25}Tatian's Address to the Greeks\s*$/, /^ {2}Fragments\. \[\d+\]\s*$/], end: /^ {20,}Theophilus of Antioch\s*$/ }],
    fix: notesUnderTheirFragment
  },
  {
    vol: ANF9, father: "Tatian", work: "The Diatessaron", file: "The Diatessaron.txt", translator: "Hope W. Hogg",
    note:
      "Public-domain Schaff English extract (Hogg's translation of the Arabic Diatessaron). Verse numbers are written (12) to keep them apart from footnote numbers [12]; the page numbers of Ciasca's Arabic edition are left out. Hogg's Introduction is not included.",
    parts: [{ start: [/^ {3}The Diatessaron of Tatian\s*$/, /^ {3}Introductory Notes\.\s*$/], end: /^ {3}The Apocalypse of Peter\s*$/ }],
    fix: diatessaron
  },
  {
    vol: NPNF2_3, father: "Rufinus", work: "Apology to Anastasius", file: "Apology to Anastasius.txt",
    translator: "William Henry Fremantle",
    note: "Public-domain Fremantle / Schaff English translation of Apologia ad Anastasium, with the letter of Anastasius to John of Jerusalem that NPNF prints after it.",
    parts: [{ start: [/^ {3}Rufinus' Apology in Defence of Himself\.\s*$/], end: /^ {3}The Apology of Rufinus\.\s*$/ }]
  },
  {
    vol: NPNF2_3, father: "Rufinus", work: "On the Adulteration of the Works of Origen",
    file: "On the Adulteration of the Works of Origen.txt", translator: "William Henry Fremantle",
    note: "Public-domain Fremantle / Schaff English translation of De adulteratione librorum Origenis (the Epilogue to Pamphilus' Apology for Origen).",
    parts: [{ start: [/^ {3}Rufinus's Epilogue to Pamphilus the Martyr's Apology for Origen\s*$/], end: /^ {3}Preface to the Translations of Origen's Books Peri 'Archon\s*$/ }]
  },
  {
    vol: NPNF2_3, father: "Rufinus", work: "Prefaces", file: "Prefaces.txt", translator: "William Henry Fremantle",
    note: "Public-domain Fremantle / Schaff English translation of the prefaces Rufinus set before his own works and his translations, in the order NPNF prints them.",
    parts: [
      {
        start: [/^ {3}Writings of Rufinus\.\s*$/, /^ {3}Preface to the Commentary on the Benedictions of the Twelve Patriarchs\.\s*$/],
        end: /^ {3}Rufinus's Epilogue to Pamphilus the Martyr's Apology for Origen\s*$/
      },
      { start: [/^ {3}Preface to the Translations of Origen's Books Peri 'Archon\s*$/], end: /^ {3}Rufinus' Apology in Defence of Himself\.\s*$/ },
      { start: [/^ {3}A Commentary on the Apostles' Creed\.\s*$/, /^ {3}The Preface to the Books of Recognitions of St\. Clement\.\s*$/], end: VOLUME_END }
    ]
  }
];

for (const job of NEW_WORKS) {
  const v = job.vol();
  save(job, v, job.parts.map((p) => cut(v, p.start, p.end)));
}

// ---- Gregory the Great: Books IX-XIV of the Register, after Book VIII ----
{
  const dest = join(englishRoot, "Gregory_English", "Selected Epistles.txt");
  const old = readFileSync(dest, "utf8").replace(/\r\n/g, "\n");
  const v = NPNF2_13();
  const part = cut(v, [/^ {3}Selected Epistles\s*$/, /^ {3}Book IX\.\s*$/], /^ {3}Selections\s*$/);
  if (/^ {3}Book IX\.\s*$/m.test(old)) {
    console.log("same  Gregory/Selected Epistles.txt  (Books IX-XIV already there)");
  } else {
    const body = repairMojibake(part.lines.join("\n")).text;
    const kept = trimTail(old.split("\n")).join("\n")
      .replace(/^# volume: Volume XII$/m, "# volume: Volume XII (Books I-VIII), Volume XIII (Books IX-XIV)")
      .replace(/^(# extracted: 2026-09-25)$/m, `$1; Books IX-XIV added ${DATE} (lines ${part.from}-${part.to} of NPNF2 Volume XIII; ${SCRIPT})`);
    const text = kept + "\n     __________________________________________________________________\n\n" + body + "\n";
    console.log(`${dry ? "DRY " : ""}write Gregory/Selected Epistles.txt  + L${part.from}-${part.to} of NPNF2 XIII  ${body.split(/\s+/).length} words added`);
    if (!dry) writeFileSync(dest, text);
  }
}

// ---- Cut the fragments (now works of their own) off the end of the files that carried them ----
function cutBack(rel, at) {
  const dest = join(englishRoot, rel);
  const lines = readFileSync(dest, "utf8").replace(/\r\n/g, "\n").split("\n");
  const hit = first(lines, at);
  if (hit < 0) {
    console.log(`same  ${rel}  (already cut back)`);
    return;
  }
  const kept = trimTail(lines.slice(0, hit - 1));
  console.log(`${dry ? "DRY " : ""}cut   ${rel}  ${lines.length} -> ${kept.length} lines`);
  if (!dry) writeFileSync(dest, kept.join("\n") + "\n");
}
cutBack("Irenaeus_English/Against Heresies.txt", /^Fragments from the Lost Writings of Iren\S+us\s*$/);
cutBack("Tatian_English/Address to the Greeks.txt", /^ {2}Fragments\. \[\d+\]\s*$/);
