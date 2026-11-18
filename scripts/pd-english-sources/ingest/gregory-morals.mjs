// Ingest: Gregory the Great, "Morals on the Book of Job" (Library of the Fathers,
// Oxford: John Henry Parker, 1844-1850), assembled from four Archive.org OCR volumes:
//   s3-lfc-18  Pt. 1, Books  1-10  (1844)
//   s3-lfc-21  Pt. 2, Books 11-22  (1845)
//   s3-lfc-23  Pt. 3, Books 23-29  (1847; the scan also contains Books 30-35 + index,
//                                   which we do NOT take from this file)
//   s3-lfc-31  Pt. 4, Books 30-35  (1850; followed by indexes + publisher ads, dropped)
//
// Output: Fathers/English/Gregory_English/Morals on the Book of Job.txt
// Usage:  node scripts/pd-english-sources/ingest/gregory-morals.mjs [--debug]

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', '..', '..');
const CACHE = path.join(ROOT, 'data', 'pd-english-sources', 'cache');
const OUT = path.join(ROOT, 'Fathers', 'English', 'Gregory_English', 'Morals on the Book of Job.txt');
const DEBUG = process.argv.includes('--debug');
const dbg = { droppedBlocks: [], droppedLines: [], heads: [] };

// ---------------------------------------------------------------- helpers

function toRoman(n) {
  const m = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
  let s = '';
  for (const [v, r] of m) while (n >= v) { s += r; n -= v; }
  return s;
}

const ABBR = '(?:Gen|Exod|Ex|Lev|Num|Deut|Josh|Judg|Ruth|Sam|Kings?|Chron|Ezra|Neh|Esth|Job|Psalms?|Ps|Prov|Eccles|Ecclus|Eccl|Ecc|Eco|Cant|Isa|Is|Jer|Lam|Ezek|Ez|Dan|Hos|Joel|Amos|Obad|Jonah|Jon|Micah|Mic|Nah|Hab|Zeph|Hag|Zech|Mal|Matt|Mat|Mark|Mar|Luke|John|Joh|Acts|Rom|Cor|Gal|Ephes|Eph|Philipp|Phil|Col|Thess|Thes|Tim|Tit|Philem|Hebr|Heb|James|Jam|Pet|Jude|Rev|Apoc|Wisd|Wis|Tob|Macc)';
// marginal scripture citation, e.g. "Job 30," / "2 Pet. 2," / "Mat.io," / "Johnl5," / "Ps. 118, 3."
const LEAD_CIT = new RegExp(`^(?:[1-3]\\s?)?${ABBR}\\s?\\.?\\s?[0-9lioOJ]{1,4}\\s?[,.]\\s?(?:[0-9lioO]{1,3}\\s?[.,]?)?\\s+`);
const TRAIL_CIT = new RegExp(`\\s(?:[1-3]\\s?)?${ABBR}\\s?\\.?\\s?[0-9lioOJ]{1,4}\\s?,\\s?(?:[0-9lioO]{1,3}\\s?[.,]?)?\\s*$`);

const BOOK_HEAD = /^\s*BOOK[\s.,]+([A-Za-z]{1,8})\s*[.,]?\s*$/;      // single roman-ish token
const EPISTLE_HEAD = /^\s*THE\s+EPISTLE\s*[,.]?\s*$/;
const PREFACE_HEAD = /^\s*THE\s+PREFACE\s*[,.]?\s*$/;

const hasLower = (s) => /[a-z]/.test(s);

// ---------------------------------------------------------------- volume specs

const VOLUMES = [
  { id: 's3-lfc-18', books: range(1, 10), keep: range(1, 10), startMode: 'epistle',
    endRe: /PLEASE\s+DO\s+NOT\s+REMOVE/ },
  { id: 's3-lfc-21', books: range(11, 22), keep: range(11, 22), startMode: 'firstBook' },
  { id: 's3-lfc-23', books: range(23, 35), keep: range(23, 29), startMode: 'firstBook' }, // cut at Book 30
  { id: 's3-lfc-31', books: range(30, 35), keep: range(30, 35), startMode: 'firstBook',
    endRe: /^\s*INDEX\s+OF\s+TEXTS/ },
];

function range(a, b) { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; }

// ---------------------------------------------------------------- structure finding

function findStructure(lines, vol) {
  // candidate "BOOK <tok>." lines; contents entries come first, the real headings are
  // the LAST vol.books.length candidates (verified by spacing assertions below).
  const cands = [];
  lines.forEach((l, i) => { if (BOOK_HEAD.test(l)) cands.push(i); });
  const n = vol.books.length;
  if (cands.length < n) throw new Error(`${vol.id}: only ${cands.length} BOOK heading candidates, need >= ${n}`);
  const real = cands.slice(-n);
  for (let i = 1; i < real.length; i++) {
    if (real[i] - real[i - 1] < 400) {
      throw new Error(`${vol.id}: suspicious BOOK heading spacing at lines ${real[i - 1]} -> ${real[i]} (contents not excluded?)`);
    }
  }
  // headings before the first real one must all sit in the front matter (contents)
  const contentsEnd = cands.length > n ? cands[cands.length - n - 1] : -1;
  if (contentsEnd >= real[0]) throw new Error(`${vol.id}: contents/real heading overlap`);

  const headAt = new Map(); // line index -> book number
  real.forEach((li, k) => headAt.set(li, vol.books[k]));

  let start;
  if (vol.startMode === 'epistle') {
    start = -1;
    for (let i = 0; i < lines.length; i++) {
      if (EPISTLE_HEAD.test(lines[i])) {
        const ctx = lines.slice(i, i + 8).join(' ');
        if (/Wherein\s+he\s+explains/.test(ctx)) { start = i; break; }
      }
    }
    if (start < 0) throw new Error(`${vol.id}: could not find THE EPISTLE anchor`);
  } else {
    start = real[0];
  }

  let end = lines.length;
  const lastKeepBook = vol.keep[vol.keep.length - 1];
  if (lastKeepBook < vol.books[vol.books.length - 1]) {
    // truncate before the first book we do not keep (vol 3: stop at Book XXX)
    const cutBook = lastKeepBook + 1;
    const cutIdx = real[vol.books.indexOf(cutBook)];
    end = cutIdx;
  } else if (vol.endRe) {
    for (let i = start; i < lines.length; i++) {
      if (vol.endRe.test(lines[i])) { end = i; break; }
    }
  }
  if (end <= real[vol.books.indexOf(vol.keep[vol.keep.length - 1])]) {
    throw new Error(`${vol.id}: end anchor falls before last kept book heading`);
  }
  return { start, end, headAt };
}

// ---------------------------------------------------------------- block classification

function isFurnitureBlock(block) {
  // block: array of raw lines (non-empty)
  const joined = block.join(' ');
  // all-caps blocks: title pages, part dividers, library stamps, bare numbers
  if (!hasLower(joined)) return 'allcaps';
  // footnote columns: narrow lines (two-column small print ~38-45 chars wide)
  if (block.length >= 4) {
    const widths = block.slice(0, -1).map((l) => l.trim().length);
    const avg = widths.reduce((a, b) => a + b, 0) / widths.length;
    if (avg < 47) return 'footnote-narrow';
  }
  // footnote block opened by a reference symbol
  if (block.length >= 2 && /^[\s]*[•*^«»†‡]/.test(block[0])) {
    const widths = block.slice(0, -1).map((l) => l.trim().length);
    const avg = widths.reduce((a, b) => a + b, 0) / widths.length;
    if (avg < 58) return 'footnote-symbol';
  }
  return null;
}

function isRunningHeadLine(line, isBlockFirst) {
  const t = line.trim();
  if (!isBlockFirst || t.length > 100) return false;
  if (/^-?\d{1,4}\s+\S/.test(t) && !/^\d{1,3}\s?\.\s/.test(t)) return true;   // "34 Job's life ..."
  if (/[a-zA-Z.,;:'"’”)\]]\s+-?\d{1,4}\s*[.,']?\s*$/.test(t)) return true; // "... Zeal. 33"
  return false;
}

const MARGIN_WORD = /^(?:Book|Bock|Boox|Book|Mor|Mob|Moral|Ep|Pref|Ver|Vol)\s*[.,]?\s*(?:[IVXLivxl1l]{0,7}\s*[.,]?)?$/;

function isGarbageShortLine(t) {
  if (t.length > 14) return false;
  if (!/[a-zA-Z]/.test(t)) return true;                         // digits / punctuation only
  if (/[\[\]{}^«»•=~\\|_]/.test(t)) return true;                // OCR junk chars
  if (/^[ivxl]{1,6}\s?[.,]$/.test(t)) return true;              // marginal roman section no.
  if (MARGIN_WORD.test(t)) return true;                         // "Book", "Ep.", "Mor." margins
  if (new RegExp(`^(?:[1-3]\\s?)?${ABBR}\\s?\\.?\\s?[0-9lioOJ]{0,4}\\s?[,.]?$`).test(t)) return true;
  if (/[a-z][A-Z]/.test(t)) return true;                        // "jvioR.", "soVuig." type garble
  if (!/[aeiouyAEIOUY]/.test(t)) return true;                   // no vowels
  if (/^[A-Z]{1,6}\.?$/.test(t) && !/^(?:I|O|A)\.?$/.test(t)) return true; // stray caps
  return false;
}

function cleanLine(raw) {
  let t = raw.replace(/\s+$/g, '').replace(/^\s+/, '');
  if (!t) return null;
  // strip leading marginal citations (may stack: "Job 30," then roman)
  for (let i = 0; i < 2; i++) {
    const before = t;
    t = t.replace(LEAD_CIT, '');
    t = t.replace(/^[ivxl]{1,5}\s?\.\s{2,}/, '');                    // lowercase roman margin
    t = t.replace(/^ver\.\s?\d{1,3}\s?\.?\s+/, '');                  // lowercase "ver. 10."
    t = t.replace(/^[^\sa-zA-Z]{0,2}[a-z]+[A-Z]\S{0,8}\s{2,}/, '');  // "'soVuig.  " garble margin
    t = t.replace(/^(?:ib|ibid|lb)\s?\.\s{2,}/, '');
    if (t === before) break;
  }
  // strip trailing marginal glue
  t = t.replace(TRAIL_CIT, '');
  t = t.replace(/([a-z][,;:.!?'"’”]?)\s+[ivxl]{1,5}\s?\.\s*$/, '$1'); // trailing roman margin
  t = t.replace(/\s+[«»^•]+\s?\S{0,10}\s*$/, '');                   // "«sEcc. 2," / "he^*" tails
  // kill OCR junk characters inline
  t = t.replace(/[•^«»†‡|]/g, '');
  t = t.replace(/\s{2,}/g, ' ').trim();
  if (!t) return null;
  if (isGarbageShortLine(t)) { if (DEBUG) dbg.droppedLines.push(t); return null; }
  return t;
}

// paragraph-start tests on a cleaned line
const SECTION_START = /^\d{1,3}\s?\.\s+["'(\[]?[A-Z]/;
const VERSE_START = /^(?:\[?E\.\s?V\.\s?)?Ver\.\s/;

// ---------------------------------------------------------------- volume processing

function processVolume(vol) {
  const file = path.join(CACHE, `${vol.id}.txt`);
  const text = fs.readFileSync(file, 'utf8').replace(/\r\n?/g, '\n').replace(/­/g, '');
  const lines = text.split('\n');
  const { start, end, headAt } = findStructure(lines, vol);

  // build blocks (blank-line separated), remembering heading lines
  const paras = []; // each: {type:'head'|'text', text}
  let buf = [];     // current paragraph words/lines (joined progressively)
  let cur = '';     // current paragraph string

  const flush = () => { if (cur.trim()) paras.push({ type: 'text', text: cur.trim() }); cur = ''; };

  let block = [];
  let blockFirstKept = true;

  const emitHead = (label) => { flush(); paras.push({ type: 'head', text: label }); };

  const appendLine = (t, newBlock) => {
    let startNew = false;
    if (SECTION_START.test(t) || VERSE_START.test(t)) startNew = true;
    else if (newBlock && /[.!?][’”'")\]]?$/.test(cur) && /^["'(\[]?[A-Z]/.test(t)) startNew = true;
    if (startNew) flush();
    if (!cur) { cur = t; return; }
    if (/[A-Za-z]-$/.test(cur) && /^[a-z]/.test(t)) cur = cur.slice(0, -1) + t; // de-hyphenate
    else cur += ' ' + t;
  };

  const processBlock = (blk) => {
    if (!blk.length) return;
    const fur = isFurnitureBlock(blk);
    if (fur) { if (DEBUG) dbg.droppedBlocks.push([vol.id, fur, blk.join(' / ').slice(0, 160)]); return; }
    // single-line mixed-case running head without page number: interrupts a paragraph
    if (blk.length === 1) {
      const t = blk[0].trim();
      if (t.length < 90 && /^[A-Z]/.test(t) && /\.$/.test(t) && cur && !/[.!?][’”'")\]]?$/.test(cur)
          && !SECTION_START.test(t) && !VERSE_START.test(t) && t.split(/\s+/).length >= 3) {
        if (DEBUG) dbg.droppedBlocks.push([vol.id, 'head-nonum', t]);
        return;
      }
    }
    let first = true;
    for (const raw of blk) {
      if (first && isRunningHeadLine(raw, true)) {
        if (DEBUG) dbg.droppedBlocks.push([vol.id, 'head-num', raw.trim().slice(0, 120)]);
        first = false; continue;
      }
      const t = cleanLine(raw);
      if (t == null) { continue; }
      appendLine(t, first);
      first = false;
    }
  };

  for (let i = start; i < end; i++) {
    const raw = lines[i];
    if (headAt.has(i)) {
      processBlock(block); block = [];
      const bn = headAt.get(i);
      if (vol.keep.includes(bn)) emitHead(`Book ${toRoman(bn)}.`);
      if (DEBUG) dbg.heads.push([vol.id, bn, i]);
      continue;
    }
    if (EPISTLE_HEAD.test(raw)) { processBlock(block); block = []; emitHead('The Epistle.'); continue; }
    if (PREFACE_HEAD.test(raw)) { processBlock(block); block = []; emitHead('The Preface.'); continue; }
    if (!raw.trim()) { processBlock(block); block = []; continue; }
    block.push(raw);
  }
  processBlock(block);
  flush();
  return paras;
}

// ---------------------------------------------------------------- OCR word fixes

const WORD_FIXES = [
  [/\btbe\b/g, 'the'], [/\btlie\b/g, 'the'], [/\bTlie\b/g, 'The'], [/\bTbe\b/g, 'The'],
  [/\baud\b/g, 'and'], [/\bancl\b/g, 'and'],
  [/\bAvhich\b/g, 'which'], [/\bAvho\b/g, 'who'], [/\bAvith\b/g, 'with'],
  [/\bAvhen\b/g, 'when'], [/\bAvhat\b/g, 'what'], [/\bAvould\b/g, 'would'],
];

function fixWords(s) {
  for (const [re, rep] of WORD_FIXES) s = s.replace(re, rep);
  return s;
}

// ---------------------------------------------------------------- main

const allParas = [];
for (const vol of VOLUMES) {
  const paras = processVolume(vol);
  const heads = paras.filter((p) => p.type === 'head').map((p) => p.text);
  console.log(`${vol.id}: ${paras.length} paragraphs; headings: ${heads.length} [${heads.slice(0, 4).join(' | ')} ... ${heads.slice(-2).join(' | ')}]`);
  allParas.push(...paras);
}

// sanity: 35 book headings, in order, plus Epistle + Preface
const bookHeads = allParas.filter((p) => p.type === 'head' && /^Book /.test(p.text)).map((p) => p.text);
const expected = range(1, 35).map((n) => `Book ${toRoman(n)}.`);
if (bookHeads.length !== 35 || bookHeads.some((h, i) => h !== expected[i])) {
  throw new Error(`book heading sequence wrong: got ${bookHeads.length} [${bookHeads.join(', ')}]`);
}
if (allParas[0].type !== 'head' || allParas[0].text !== 'The Epistle.') throw new Error('missing The Epistle. at start');
if (!allParas.some((p) => p.type === 'head' && p.text === 'The Preface.')) throw new Error('missing The Preface.');

const header = [
  '# source: Morals on the Book of Job by S. Gregory the Great, in four volumes (Oxford: John Henry Parker, 1844-1850)',
  '# series: Library of Fathers of the Holy Catholic Church (Oxford)',
  '# father: Gregory the Great',
  '# work: Morals on the Book of Job',
  '# extracted: 2026-11-18',
  '# origin: data/pd-english-sources/cache/s3-lfc-18.txt, s3-lfc-21.txt, s3-lfc-23.txt, s3-lfc-31.txt (https://archive.org)',
  '# note: Public-domain 1844-1850 translation by an anonymous member of the English Church (Library of the Fathers). Machine-cleaned from the Archive.org OCR scans of the four printed volumes; page furniture and marginal citations removed; footnotes not restored. Some scanner misreadings may remain.',
].join('\n');

const body = allParas.map((p) => fixWords(p.text)).join('\n\n');
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, header + '\n\n' + body + '\n', 'utf8');

const words = body.split(/\s+/).length;
console.log(`Wrote ${OUT}`);
console.log(`paragraphs=${allParas.length} bookHeadings=${bookHeads.length} words=${words}`);

if (DEBUG) {
  const dir = process.env.GREG_DEBUG_DIR || path.join(ROOT, 'scripts', 'pd-english-sources', 'ingest');
  fs.writeFileSync(path.join(dir, 'gregory-morals.debug.json'), JSON.stringify(dbg, null, 1), 'utf8');
  console.log(`debug: ${dbg.droppedBlocks.length} dropped blocks, ${dbg.droppedLines.length} dropped short lines`);
}
