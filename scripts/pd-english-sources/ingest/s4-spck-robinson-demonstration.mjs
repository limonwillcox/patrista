// Irenaeus, The Demonstration of the Apostolic Preaching (trans. J. Armitage
// Robinson, SPCK 1920). Source OCR: s4-spck-robinson-demonstration.txt.
// ~100 numbered sections, continuous text; section numbers kept inline.
// Note: in this OCR the page order of text/footnotes is not reliable, so
// footnotes are dropped per-block (marker-led blocks), not per page region.

import {
  readCache, writeWork, buildHeader, toBlocks, joinLines, tidySpaces,
  greekRatio, englishScore, fixOcrWords, renderParas, assert,
} from './_lib.mjs';

const rowId = 's4-spck-robinson-demonstration';
const lines = readCache(rowId).split('\n');

// Body: from section 1 to INDEX LOCORUM.
const start = lines.findIndex(l => /^1\.\s+Knowing,?\s+my\s+beloved\s+Marcianus/.test(tidySpaces(l)));
const end = lines.findIndex(l => /^INDEX\s+LOCORUM/.test(tidySpaces(l)));
assert(start > 0 && end > start, `body anchors: start=${start} end=${end}`);

const isRunningHead = t =>
  /(DEMONSTRATION\s+OF|NSTRATION\s+OF|APOSTOLIC\s+PREACHING)/.test(t) && t === t.toUpperCase();
const isPageNum = t => /^[0-9]{1,3}$/.test(t);

// Pass 1: line-level cleanup.
const kept = [];
for (const raw of lines.slice(start, end)) {
  let t = tidySpaces(raw).replace(/^[_|~‘]+\s*/, '');
  if (t === '') { kept.push(''); continue; }
  if (isRunningHead(t) || isPageNum(t)) { kept.push(''); continue; }
  if (greekRatio(t) > 0.25) { kept.push(''); continue; }
  kept.push(t);
}

// Pass 2: block-level footnote/garbage removal.
const isFootnoteBlock = t =>
  /^(\d{1,2}\s+\S|\d{1,2}[.:]$|[*^]\s*\S|Cf\.\s|Lit\.\s)/.test(t) && !/^\d{1,3}\.\s+[A-Z“"‘]/.test(t);

let paras = [];
for (const block of toBlocks(kept)) {
  let text = joinLines(block);
  if (!text) continue;
  if (isFootnoteBlock(text)) continue;
  // short gibberish fragments (OCR smudge lines)
  if (text.length < 12 && englishScore(text) === 0 && !/^\d{1,3}\.\s/.test(text)) continue;
  paras.push({ text });
}

// Pass 3: merge paragraphs split by page breaks / OCR blank lines. A real
// paragraph break here always follows sentence-final punctuation.
const merged = [];
for (const p of paras) {
  const prev = merged[merged.length - 1];
  const sectionStart = /^\d{1,3}\.\s+[A-Z“"‘]/.test(p.text);
  if (prev && !sectionStart && !/[.!?:;”’"')\]]$/.test(prev.text)) {
    if (prev.text.endsWith('-')) prev.text = prev.text.slice(0, -1) + p.text;
    else prev.text += ' ' + p.text;
  } else {
    merged.push(p);
  }
}

// Pass 4: strip footnote reference marks glued to punctuation ("own.2", "; ?").
for (const p of merged) {
  p.text = fixOcrWords(p.text)
    .replace(/([a-z][,;:.!?”’)])\d{1,2}(?=\s|$)/g, '$1')
    .replace(/([,;:.])\s*\?(?=\s|$)/g, '$1')
    .replace(/\s+([,;:.])/g, '$1');
}

const text = renderParas(merged);

// Sanity: all 100 sections present.
const found = new Set();
for (const m of text.matchAll(/(?:^|\s)(\d{1,3})\.\s+[A-Z“"‘]/g)) found.add(parseInt(m[1], 10));
const missing = [];
for (let i = 1; i <= 100; i++) if (!found.has(i)) missing.push(i);
console.log('sections found:', found.size, 'missing:', missing.join(',') || '(none)');

const header = buildHeader({
  source: 'J. Armitage Robinson, St Irenaeus: The Demonstration of the Apostolic Preaching (London: SPCK, 1920)',
  series: 'Translations of Christian Literature (SPCK)',
  father: 'Irenaeus',
  work: 'The Demonstration of the Apostolic Preaching',
  translator: 'J. Armitage Robinson',
  origin: 'data/pd-english-sources/cache/s4-spck-robinson-demonstration.txt (https://archive.org/details/demonstrationofa00iren)',
  note: 'Public-domain 1920 translation. Machine-cleaned from the Archive.org OCR scan; page furniture removed; footnotes not restored. Some scanner misreadings may remain.',
});

writeWork('Irenaeus_English', 'The Demonstration of the Apostolic Preaching.txt', header, text);
