// Shared helpers for pd-english-sources ingestion scripts.
// Each per-volume script reads data/pd-english-sources/cache/<row-id>.txt and
// writes final Fathers/English/<Father>_English/<Work>.txt files.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export function readCache(rowId) {
  const p = path.join(repoRoot, 'data', 'pd-english-sources', 'cache', `${rowId}.txt`);
  return fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n').replace(/\f/g, '\n');
}

export function writeWork(folder, filename, header, body) {
  const dir = path.join(repoRoot, 'Fathers', 'English', folder);
  fs.mkdirSync(dir, { recursive: true });
  const out = header.trimEnd() + '\n\n' + body.trim() + '\n';
  fs.writeFileSync(path.join(dir, filename), out, 'utf8');
  const words = body.trim().split(/\s+/).length;
  console.log(`wrote ${folder}/${filename}: ${words} words`);
  return words;
}

export function buildHeader({ source, series, father, work, translator, origin, note }) {
  const lines = [
    `# source: ${source}`,
    `# series: ${series}`,
    `# father: ${father}`,
    `# work: ${work}`,
  ];
  if (translator) lines.push(`# translator: ${translator}`);
  lines.push(`# extracted: 2026-11-18`);
  lines.push(`# origin: ${origin}`);
  lines.push(`# note: ${note}`);
  return lines.join('\n');
}

// --- text utilities -------------------------------------------------------

export const ROMAN = { i: 1, v: 5, x: 10, l: 50, c: 100, d: 500, m: 1000 };

export function romanToInt(s) {
  s = s.toLowerCase().replace(/[^ivxlcdm]/g, '');
  if (!s) return NaN;
  let total = 0;
  for (let i = 0; i < s.length; i++) {
    const v = ROMAN[s[i]];
    const next = ROMAN[s[i + 1]] || 0;
    total += v < next ? -v : v;
  }
  return total;
}

export function intToRoman(n) {
  const table = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
    [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let out = '';
  for (const [v, sym] of table) while (n >= v) { out += sym; n -= v; }
  return out;
}

// Parse a chapter-number token that may be OCR-garbled. Returns int or NaN.
// Handles arabic with common substitutions and roman with common substitutions.
export function parseOcrNumber(tok) {
  if (!tok) return NaN;
  let t = tok.replace(/[.,:;^'"()\[\]{}*\s-]/g, '');
  if (!t) return NaN;
  // arabic with substitutions
  if (/^[0-9oOiIlGUtj\\]+$/.test(t) && /[0-9]/.test(t)) {
    const a = t.replace(/[oO]/g, '0').replace(/[iIl]/g, '1').replace(/G/g, '6')
      .replace(/U/g, '4').replace(/[tj\\]/g, '');
    const n = parseInt(a, 10);
    if (!isNaN(n)) return n;
  }
  // pure roman-ish
  const r = t.replace(/H/g, 'II').replace(/U/g, 'II').replace(/n/g, 'ii').replace(/1/g, 'I');
  const n = romanToInt(r);
  return n;
}

// Collapse runs of spaces; trim.
export function tidySpaces(s) {
  return s.replace(/[ \t]+/g, ' ').trim();
}

// Join an array of raw OCR lines (one printed line each) into paragraph text,
// de-hyphenating across line breaks.
export function joinLines(lines) {
  let out = '';
  for (const raw of lines) {
    const line = tidySpaces(raw);
    if (!line) continue;
    if (out.endsWith('-') && /^[a-z]/.test(line)) {
      out = out.slice(0, -1) + line; // de-hyphenate judg-/ment
    } else if (out) {
      out += ' ' + line;
    } else {
      out = line;
    }
  }
  return out;
}

// Split cleaned line stream into blocks on blank lines.
export function toBlocks(lines) {
  const blocks = [];
  let cur = [];
  for (const line of lines) {
    if (tidySpaces(line) === '') {
      if (cur.length) { blocks.push(cur); cur = []; }
    } else {
      cur.push(line);
    }
  }
  if (cur.length) blocks.push(cur);
  return blocks;
}

// Merge paragraph list where a page break split a sentence: previous paragraph
// does not end in sentence-final punctuation and the next starts lowercase.
export function mergeBrokenParagraphs(paras) {
  const out = [];
  for (const p of paras) {
    const prev = out[out.length - 1];
    if (
      prev && !prev.isHeading && !p.isHeading &&
      !/[.!?:;"'”’)\]]$/.test(prev.text) &&
      (/^[a-z‘“("']/.test(p.text) || /[-—]$/.test(prev.text))
    ) {
      if (prev.text.endsWith('-')) prev.text = prev.text.slice(0, -1) + p.text;
      else prev.text += ' ' + p.text;
    } else {
      out.push(p);
    }
  }
  return out;
}

export function greekRatio(s) {
  const letters = s.replace(/[^A-Za-zͰ-Ͽἀ-῿]/g, '');
  if (!letters.length) return 0;
  const greek = letters.replace(/[A-Za-z]/g, '');
  return greek.length / letters.length;
}

const COMMON_WORDS = new Set(('the of and to in that is was he for it with as his on be at by i this had not are but from or ' +
  'have an they which one you were her all she there would their we him been has when who will more no if out so said what up its ' +
  'about into than them can only other new some could time these two may then do first any my now such like our over man me even ' +
  'most made after also did many before must through back years where much your way well down should because each just those people ' +
  'god him christ lord jesus holy men shall unto thee thou thy hath upon us against things therefore himself say').split(/\s+/));

// Fraction of whitespace-separated tokens that are common English words.
export function englishScore(s) {
  const toks = s.toLowerCase().split(/[^a-z]+/).filter(t => t.length > 0);
  if (!toks.length) return 0;
  let hits = 0;
  for (const t of toks) if (COMMON_WORDS.has(t)) hits++;
  return hits / toks.length;
}

// Conservative systematic OCR fixes, safe across these volumes.
export function fixOcrWords(s) {
  return s
    .replace(/\btbe\b/g, 'the').replace(/\bTbe\b/g, 'The')
    .replace(/\bancl\b/g, 'and')
    .replace(/\bbis\b/g, 'his')
    .replace(/\bwbich\b/g, 'which')
    .replace(/\bAVho\b/g, 'Who').replace(/\bAVhen\b/g, 'When')
    .replace(/’’/g, '”').replace(/‘‘/g, '“');
}

// Render final body text from paragraph objects {text, isHeading}.
export function renderParas(paras) {
  return paras.map(p => tidySpaces(p.text)).filter(t => t.length).join('\n\n');
}

export function assert(cond, msg) {
  if (!cond) { throw new Error('ASSERT: ' + msg); }
}
