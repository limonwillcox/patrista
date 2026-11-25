// Ingest: Evagrius Scholasticus, Ecclesiastical History (anonymous tr., Bagster 1846)
// Source: data/pd-english-sources/cache/s4-bagster-06.txt (Archive.org OCR,
//         "Greek Ecclesiastical Historians", vol. 6, London: Samuel Bagster and Sons, 1846)
// Output: Fathers/English/Evagrius_Scholasticus_English/Ecclesiastical History.txt
//
// Six books. Chapters renumbered sequentially per book (the OCR garbles many
// roman numerals); parseable printed numerals are used to detect skipped
// headings. Running heads, page numbers and the page-bottom footnotes
// (introduced by "*") are stripped; hard-wrapped lines rejoined.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const srcPath = path.join(root, 'data', 'pd-english-sources', 'cache', 's4-bagster-06.txt');
const outDir = path.join(root, 'Fathers', 'English', 'Evagrius_Scholasticus_English');
const outPath = path.join(outDir, 'Ecclesiastical History.txt');

const raw = fs.readFileSync(srcPath, 'utf8').replace(/\r\n/g, '\n');
const lines = raw.split('\n');

const BOOKS = { FIRST: 'I', SECOND: 'II', THIRD: 'III', FOURTH: 'IV', FIFTH: 'V', SIXTH: 'VI' };
const bookRe = /^\s*THE\s+(F\s*IRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH)\s+BOOK\b/;

// Body region: first "THE FIRST BOOK." line to "THE END." before the index.
let start = -1;
let end = -1;
for (let i = 0; i < lines.length; i++) {
  if (start < 0 && bookRe.test(lines[i]) && /FIRST/.test(lines[i].replace(/\s+/g, ''))) start = i;
  if (start >= 0 && /^\s*THE\s+END\.?\s*$/.test(lines[i])) { end = i; break; }
}
if (start < 0 || end < 0) throw new Error(`markers not found: start=${start} end=${end}`);

const toArabic = (r) => {
  const vals = { I: 1, V: 5, X: 10, L: 50, C: 100 };
  let n = 0;
  for (let i = 0; i < r.length; i++) {
    const v = vals[r[i]];
    if (!v) return null;
    n += (i + 1 < r.length && vals[r[i + 1]] > v) ? -v : v;
  }
  return n;
};
const toRoman = (n) => {
  const map = [[50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let out = '';
  for (const [v, s] of map) { while (n >= v) { out += s; n -= v; } }
  return out;
};
// Parse an OCR-garbled roman numeral; null when not confidently parseable.
const parseOcrRoman = (tok) => {
  let t = tok.replace(/[\s.,'']/g, '');
  t = t.replace(/Y/g, 'V').replace(/y/g, 'V').replace(/l/g, 'I').replace(/1/g, 'I');
  t = t.replace(/^H/, 'II').replace(/U/g, 'II').replace(/m$/, 'III');
  if (/L$/.test(t) && toArabic(t) === null) t = t.replace(/L$/, 'I');
  const n = toArabic(t);
  return n && n >= 1 && n <= 50 ? n : null;
};

// ---- pass 1: strip page furniture, mark page boundaries, drop footnote tails
const isEvenHead = (l) =>
  (/\[\s*[bB]/.test(l) && /[oO]{2}[kK]/.test(l)) ||
  (/E\W?C\W?C\W?L/i.test(l) && /[HI]+[Il]?STO?[RK]/i.test(l) && l.trim().length < 70);
const isOddHead = (l) => /^\s*CH\s?A\s?P[.,']?\s*\S{0,10}\s*[.,]?\s*\]/.test(l) || (/\]/.test(l.slice(0, 25)) && /^\s*CHAP/.test(l));
const isPageNum = (l) => /^\s*[0-9lI]{1,3}\s*$/.test(l) && /\d/.test(l);
const isJunk = (l) => {
  const t = l.trim();
  if (!t) return false;
  if (t.length <= 2 && !/^(a|A|I|O)$/.test(t)) return true; // stray marks; keep real one-letter words? none start lines alone
  const letters = (t.match(/[A-Za-z]/g) || []).length;
  return letters === 0 || letters / t.length < 0.4;
};

const tokens = []; // {type:'text'|'break'|'pagebrk'|'book'|'chapterline', ...}
let inFootnote = false;
for (let i = start; i < end; i++) {
  const l = lines[i];
  if (/^\s*THE\s+END\s+OF\s+THE/.test(l)) { tokens.push({ type: 'pagebrk' }); inFootnote = false; continue; }
  if (isEvenHead(l) || isOddHead(l) || isPageNum(l)) { tokens.push({ type: 'pagebrk' }); inFootnote = false; continue; }
  if (/^\s*$/.test(l)) { tokens.push({ type: 'break' }); continue; }
  if (inFootnote) continue; // footnotes run to the bottom of the page
  if (/^\s*\*/.test(l)) { inFootnote = true; continue; }
  let m;
  if ((m = l.match(bookRe))) {
    tokens.push({ type: 'book', numeral: BOOKS[m[1].replace(/\s+/g, '')] });
    continue;
  }
  if ((m = l.match(/^\s*CHAPTER\s+([A-Za-z \.,'']{1,12})\s*$/))) {
    tokens.push({ type: 'chapter', tok: m[1].trim() });
    continue;
  }
  if (isJunk(l)) continue;
  tokens.push({ type: 'text', text: l.trim() });
}

// ---- pass 2: assemble paragraphs, chapter titles, headings
const isCapsLine = (t) => {
  const letters = t.match(/[A-Za-z]/g) || [];
  if (letters.length < 3) return false;
  const upper = letters.filter((c) => c >= 'A' && c <= 'Z').length;
  return upper / letters.length > 0.7;
};
const sentenceCase = (t) => {
  const low = t.toLowerCase();
  return low.charAt(0).toUpperCase() + low.slice(1);
};
const cleanInline = (t) =>
  t.replace(/[*†‡]/g, '').replace(/ f /g, ' ').replace(/\s+/g, ' ').trim();

const paragraphs = [];
const stats = { books: 0, chapters: 0, perBook: {}, resyncs: [], unparsed: 0 };
let curBook = null;
let chapNo = 0;
let i = 0;
let paraBuf = []; // lines of current paragraph
let pendingBoundary = null; // 'page' when paragraph was interrupted by a page break

const flushPara = () => {
  if (!paraBuf.length) return;
  let text = paraBuf.join(' ');
  text = text.replace(/(\w)-\s+(?=[a-z])/g, '$1'); // de-hyphenate wraps
  text = cleanInline(text);
  if (text) paragraphs.push(text);
  paraBuf = [];
};

while (i < tokens.length) {
  const tk = tokens[i];
  if (tk.type === 'book') {
    flushPara();
    curBook = tk.numeral;
    chapNo = 0;
    stats.books++;
    stats.perBook[curBook] = 0;
    paragraphs.push(`Book ${curBook}.`);
    i++;
    // Book I opens with Evagrius' own preface headed PREFACE. / DESIGN OF THE WORK.
    continue;
  }
  if (tk.type === 'chapter') {
    flushPara();
    const parsed = parseOcrRoman(tk.tok);
    let n = chapNo + 1;
    if (parsed !== null && parsed !== n && parsed === chapNo + 2) {
      stats.resyncs.push(`${curBook}: printed ${parsed} after ${chapNo} (a heading is missing in the OCR)`);
      n = parsed;
    } else if (parsed === null) {
      stats.unparsed++;
    } else if (parsed !== n) {
      stats.resyncs.push(`${curBook}: printed ${parsed} where ${n} expected (kept ${n})`);
    }
    chapNo = n;
    stats.chapters++;
    stats.perBook[curBook] = chapNo;
    // Collect following all-caps title lines.
    let j = i + 1;
    const title = [];
    while (j < tokens.length) {
      const t2 = tokens[j];
      if (t2.type === 'break' || t2.type === 'pagebrk') { j++; if (title.length) break; continue; }
      if (t2.type === 'text' && isCapsLine(t2.text)) { title.push(t2.text); j++; continue; }
      break;
    }
    const titleText = cleanInline(title.join(' '));
    paragraphs.push(`Chapter ${toRoman(chapNo)}.${titleText ? '--' + sentenceCase(titleText) : ''}`);
    i = j;
    continue;
  }
  if (tk.type === 'text') {
    if (isCapsLine(tk.text) && /^PREFACE/.test(tk.text.trim())) {
      // Evagrius' own preface heading at the start of Book I.
      flushPara();
      let j = i + 1;
      const title = [];
      while (j < tokens.length) {
        const t2 = tokens[j];
        if (t2.type === 'break') { j++; if (title.length) break; continue; }
        if (t2.type === 'text' && isCapsLine(t2.text)) { title.push(t2.text); j++; continue; }
        break;
      }
      const titleText = cleanInline(title.join(' '));
      paragraphs.push(`Preface.${titleText ? '--' + sentenceCase(titleText) : ''}`);
      i = j;
      continue;
    }
    if (pendingBoundary === 'page' && paraBuf.length) {
      // Decide whether the page break was also a paragraph break.
      const prev = paraBuf[paraBuf.length - 1];
      const endsSentence = /[.!?"']\s*$/.test(prev) && !/-\s*$/.test(prev);
      const startsUpper = /^["'(]?[A-Z]/.test(tk.text);
      if (endsSentence && startsUpper) flushPara();
    } else if (pendingBoundary === 'blank') {
      flushPara();
    }
    pendingBoundary = null;
    paraBuf.push(tk.text);
    i++;
    continue;
  }
  if (tk.type === 'break') {
    if (pendingBoundary !== 'page') pendingBoundary = 'blank';
    i++;
    continue;
  }
  if (tk.type === 'pagebrk') {
    pendingBoundary = 'page';
    i++;
    continue;
  }
  i++;
}
flushPara();

const header = [
  '# source: A History of the Church in Six Books, from A.D. 431 to A.D. 594, by Evagrius, Greek Ecclesiastical Historians, vol. VI (London: Samuel Bagster and Sons, 1846)',
  '# series: Bagster Greek Ecclesiastical Historians',
  '# father: Evagrius Scholasticus',
  '# work: Ecclesiastical History',
  '# extracted: 2026-11-18',
  '# origin: data/pd-english-sources/cache/s4-bagster-06.txt (https://archive.org/details/greekecclesiasti06lond)',
  '# note: Public-domain 1846 translation (translator anonymous). Machine-cleaned from the Archive.org OCR scan; page furniture removed; footnotes not restored. Some scanner misreadings may remain.',
].join('\n');

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, header + '\n\n' + paragraphs.join('\n\n') + '\n', 'utf8');

const words = paragraphs.join(' ').split(/\s+/).length;
console.log(JSON.stringify({ out: path.relative(root, outPath), ...stats, paragraphs: paragraphs.length, words }, null, 2));
