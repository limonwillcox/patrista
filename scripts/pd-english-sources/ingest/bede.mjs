// Ingest: Bede, Ecclesiastical History of the English Nation (A. M. Sellar, 1907)
// Source: data/pd-english-sources/cache/s1-bede-sellar.txt (clean Project Gutenberg text, ebook #38326)
// Output: Fathers/English/Bede_English/Ecclesiastical History of the English Nation.txt
//
// Keeps Bede's own Preface and Books I-V. Drops the Gutenberg header/footer and
// license, Sellar's editor's preface / introduction / Life of Bede / errata, the
// table of contents, the index, and the FOOTNOTES block at the end. Inline
// footnote markers "(123)" / "(_123_)" are removed; italic underscores stripped.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const srcPath = path.join(root, 'data', 'pd-english-sources', 'cache', 's1-bede-sellar.txt');
const outDir = path.join(root, 'Fathers', 'English', 'Bede_English');
const outPath = path.join(outDir, 'Ecclesiastical History of the English Nation.txt');

const raw = fs.readFileSync(srcPath, 'utf8').replace(/^﻿/, '').replace(/\r\n/g, '\n');
const lines = raw.split('\n');

// Body = from the all-caps PREFACE heading (Bede's own preface) to the INDEX heading.
const start = lines.findIndex((l) => /^PREFACE\s*$/.test(l));
let end = -1;
for (let i = start + 1; i < lines.length; i++) {
  if (/^INDEX\s*$/.test(lines[i])) { end = i; break; }
}
if (start < 0 || end < 0) throw new Error(`markers not found: start=${start} end=${end}`);
// Bede's history ends before the anonymous CONTINUATION (annals 731-766), which
// is a different work; cut there if present.
let cut = end;
for (let i = start + 1; i < end; i++) {
  if (/^CONTINUATION\s*$/.test(lines[i])) { cut = i; break; }
}
const body = lines.slice(start, cut);

// Split into blank-line-separated blocks; indented blocks (verse/epitaph quotes)
// become their own paragraphs.
const blocks = [];
let cur = [];
for (const line of body) {
  if (/^\s*$/.test(line)) {
    if (cur.length) { blocks.push(cur); cur = []; }
  } else {
    cur.push(line);
  }
}
if (cur.length) blocks.push(cur);

const roman = (s) => s; // headings keep the printed roman numerals

const paragraphs = [];
const stats = { books: 0, chapters: 0, chaptersPerBook: {} };
let curBook = null;

for (const block of blocks) {
  // Separate indented (quote/verse) runs from flush runs inside a block.
  const parts = [];
  let part = null;
  for (const l of block) {
    const indented = /^\s{2,}\S/.test(l);
    if (!part || part.indented !== indented) {
      part = { indented, lines: [] };
      parts.push(part);
    }
    part.lines.push(l.trim());
  }
  for (const p of parts) {
    let text = p.lines.join(' ').replace(/\s+/g, ' ').trim();
    if (!text) continue;

    // Remove footnote markers (123) and (_123_); strip italic underscores.
    text = text.replace(/\((_)?\d{1,4}(_)?\)/g, '');
    text = text.replace(/_/g, '');
    // Sellar's marginal cross-references, e.g. [I, 2.], [Ibid.], [Ib.] (editorial).
    text = text.replace(/\s*\[(?:Ibid|Ib\.)[^\]]*\]/g, '');
    text = text.replace(/\s*\[[IVX]+, [^\]]*\]/g, '');
    text = text.replace(/\s+([,.;:!?)”])/g, '$1').replace(/\s+/g, ' ').trim();
    if (!text) continue;

    let m;
    if ((m = text.match(/^BOOK ([IVX]+)$/))) {
      curBook = m[1];
      stats.books++;
      stats.chaptersPerBook[curBook] = 0;
      paragraphs.push(`Book ${roman(m[1])}.`);
      continue;
    }
    if (/^PREFACE$/.test(text)) {
      paragraphs.push('Preface.');
      continue;
    }
    if ((m = text.match(/^Chap\. ([IVXLC]+)\.\s*(.*)$/))) {
      stats.chapters++;
      if (curBook) stats.chaptersPerBook[curBook]++;
      const title = m[2].trim();
      paragraphs.push(`Chapter ${roman(m[1])}.${title ? ' ' + title : ''}`);
      continue;
    }
    paragraphs.push(text);
  }
}

const header = [
  '# source: Bede, Ecclesiastical History of England: A Revised Translation, tr. A. M. Sellar (London: George Bell and Sons, 1907)',
  '# series: Standalone translation (Project Gutenberg ebook #38326)',
  '# father: Bede',
  '# work: Ecclesiastical History of the English Nation',
  '# translator: A. M. Sellar',
  '# extracted: 2026-11-18',
  '# origin: data/pd-english-sources/cache/s1-bede-sellar.txt (https://www.ccel.org/ccel/bede/history.txt)',
  '# note: Public-domain 1907 translation. Machine-cleaned from a clean Project Gutenberg/CCEL text; editorial matter and footnotes removed.',
].join('\n');

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, header + '\n\n' + paragraphs.join('\n\n') + '\n', 'utf8');

const words = paragraphs.join(' ').split(/\s+/).length;
console.log(JSON.stringify({ out: path.relative(root, outPath), ...stats, paragraphs: paragraphs.length, words }, null, 2));
