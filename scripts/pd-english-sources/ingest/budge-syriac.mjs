// Ingest four E. A. Wallis Budge translations from Archive.org OCR cache files:
//   s5-budge-philoxenus-02  -> Fathers/English/Philoxenus_English/The Discourses.txt
//   s5-budge-cave           -> Fathers/English/Apostolic_English/The Book of the Cave of Treasures.txt
//   s5-budge-contendings-02 -> Fathers/English/Apostolic_English/The Contendings of the Apostles.txt
//   s5-budge-bvm-02         -> Fathers/English/Apostolic_English/The History of the Blessed Virgin Mary.txt
//
// Usage: node scripts/pd-english-sources/ingest/budge-syriac.mjs [--verbose]
// Reproducible: reads only the cache files, writes only the four output files.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const CACHE = path.join(ROOT, 'data', 'pd-english-sources', 'cache');
const VERBOSE = process.argv.includes('--verbose');
const EXTRACTED = '2026-11-18';

function log(...a) { console.log(...a); }
function vlog(...a) { if (VERBOSE) console.log(...a); }

function readCache(id) {
  return fs.readFileSync(path.join(CACHE, id + '.txt'), 'utf8').split(/\r?\n/);
}

// ---------- generic helpers ----------

function lettersOf(s) { return s.replace(/[^A-Za-z]/g, ''); }

function isCapsLine(line) {
  const letters = lettersOf(line);
  if (letters.length < 3) return false;
  const upper = letters.replace(/[^A-Z]/g, '').length;
  return upper / letters.length >= 0.8;
}

// A standalone page number / signature mark / tiny junk line.
function isJunkLine(line) {
  const t = line.trim();
  if (t === '') return false;
  if (/^[\d\s.*'^|~\-—_:;,()\[\]{}<>«»•]+$/.test(t)) return true; // no letters at all
  if (lettersOf(t).length <= 2 && t.length <= 12) return true;     // "a aa ch", "I", "k"
  return false;
}

// Decorative-type (Ethiopic/blackletter) OCR garble, e.g. "3n t§e (Tlame of t§e fat§er".
function garbleScore(line) {
  const hits = line.match(/[§^~©«»{}<>]|\(\w|\w\)|\[\w+\s*$|\d(?=[a-z])|[a-z](?=\d)|\bt\?|\bl\?/g) || [];
  return hits.length;
}
function isGarbleLine(line) {
  const t = line.trim();
  if (t.length < 8) return false;
  const score = garbleScore(t);
  return score >= 3 && score / t.length > 0.03;
}

// Join hard-wrapped OCR lines into one paragraph string, de-hyphenating.
function joinLines(lines) {
  let out = '';
  for (const raw of lines) {
    const l = raw.trim();
    if (l === '') continue;
    if (out === '') { out = l; continue; }
    if (/[A-Za-z]-$/.test(out)) out = out.slice(0, -1) + l;
    else out += ' ' + l;
  }
  return out.replace(/\s+/g, ' ').trim();
}

// Merge paragraphs wrongly split by page breaks: previous does not end a sentence
// and the next starts lowercase (or an opening quote followed by lowercase).
function mergeContinuations(paras) {
  const out = [];
  for (const p of paras) {
    if (p.heading) { out.push(p); continue; }
    const prev = out.length ? out[out.length - 1] : null;
    if (
      prev && !prev.heading &&
      !/[.!?:;"'”’]\]?\s*$/.test(prev.text) &&
      /^["“‘']?[a-z]/.test(p.text)
    ) {
      let t = prev.text;
      if (/[A-Za-z]-$/.test(t)) prev.text = t.slice(0, -1) + p.text;
      else prev.text = t + ' ' + p.text;
    } else out.push(p);
  }
  return out;
}

// Conservative, systematic OCR misread fixes only.
function ocrFixes(s) {
  return s
    .replace(/\btbe\b/g, 'the').replace(/\bTbe\b/g, 'The')
    .replace(/\btbat\b/g, 'that').replace(/\bTbat\b/g, 'That')
    .replace(/\bancl\b/g, 'and')
    .replace(/\baud\b/g, 'and')
    .replace(/\bwbich\b/g, 'which')
    .replace(/\bbim\b/g, 'him').replace(/\bbis\b/g, 'his')
    .replace(/‘|’/g, "'")
    .replace(/“|”/g, '"')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

// A paragraph that is a page-bottom footnote: starts with a reference mark.
function isFootnotePara(text) {
  if (/^[*^~`¹²³†‡]/.test(text)) return true;
  if (/^'\s?[A-Z0-9]/.test(text) && (/\d/.test(text.slice(0, 80)) || text.length < 160)) return true;
  if (/^\d\s*\*?\s/.test(text) && /^[\d\s*]*[A-Z]/.test(text)) return true;
  return false;
}

function stripInlineApparatus(s) {
  return s
    // folio / column / page markers of the original MS or printed text
    .replace(/\[?\(?[Pp]age\s*\d+[\]\)]?/g, ' ')
    .replace(/\[\s*(P|p)[-.— ]{0,3}\s*[0-9IloS]{1,4}\s*[\]\)I}]?/g, ' ')
    .replace(/\[?Fo[li1I)]+\.?\s*\d+\s*\w?\)?\s*,?\s*(col\.?\s*[12i]\.?)?\s*[\]\)}]?/g, ' ')
    .replace(/\b[ABC]\s*\.?\s*fo[li1I)]+\.?\s*\d*\s*\w?\.?/g, ' ')
    .replace(/\bcol\.\s*[12i]\.?/g, ' ')
    .replace(/\|/g, ' ')
    // orphan reference marks left in the text
    .replace(/[\^¹²³†‡]/g, '')
    .replace(/ [*~] /g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function toParagraphs(lines) {
  // lines -> array of {text} split on blank lines
  const paras = [];
  let cur = [];
  for (const l of lines) {
    if (l.trim() === '') {
      if (cur.length) { paras.push(joinLines(cur)); cur = []; }
    } else cur.push(l);
  }
  if (cur.length) paras.push(joinLines(cur));
  return paras;
}

function finishBody(paras) {
  // paras: [{heading?:bool, text}]
  let out = paras
    .map(p => p.heading ? p : { ...p, text: ocrFixes(stripInlineApparatus(p.text)) })
    .filter(p => p.heading || (p.text.length > 1 && lettersOf(p.text).length >= 2));
  out = mergeContinuations(out);
  return out.map(p => p.text).join('\n\n');
}

function writeWork(folder, filename, headerLines, body, stats) {
  const dir = path.join(ROOT, 'Fathers', 'English', folder);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, filename);
  const content = headerLines.map(h => '# ' + h).join('\n') + '\n\n' + body.trim() + '\n';
  fs.writeFileSync(file, content, 'utf8');
  const words = body.split(/\s+/).filter(Boolean).length;
  log(`WROTE ${folder}/${filename}: ${words} words, ${stats}`);
  return words;
}

// =========================================================================
// 1. Philoxenus, The Discourses (vol. 2, 1894)
// =========================================================================
function philoxenus() {
  const lines = readCache('s5-budge-philoxenus-02');

  const startIdx = lines.findIndex(l => /^TRANSLATION[,.]?\s*$/.test(l.trim()));
  const endIdx = lines.findIndex(l => /PRINTED\s+BY\s+W\.\s+DRUGULIN/.test(l));
  if (startIdx < 0 || endIdx < 0) throw new Error('philoxenus: anchors not found');
  const body = lines.slice(startIdx + 1, endIdx);

  // colophons ("Here endeth ...") end each discourse
  const colophons = [];
  body.forEach((l, i) => { if (/^Here\s+endeth/i.test(l.trim())) colophons.push(i); });
  if (colophons.length !== 13) throw new Error(`philoxenus: expected 13 colophons, got ${colophons.length}`);

  // starts of discourses 2..13: first "[P...] THE ... DISCOURSE" line after each colophon
  const isStartMarker = l => /^\[\s*P/i.test(l.trim()) && /DISCOURSE/i.test(l);
  const starts = [0]; // discourse 1 starts at the big title just after TRANSLATION
  for (let k = 0; k < 12; k++) {
    let i = colophons[k] + 1;
    while (i < body.length && !isStartMarker(body[i])) i++;
    if (i >= body.length) throw new Error(`philoxenus: start of discourse ${k + 2} not found`);
    starts.push(i);
  }

  const TITLES = [
    'the Prologue of the Volume', 'on Faith', 'on Faith', 'on Simplicity', 'on Simplicity',
    'on the Fear of God', 'on the Fear of God', 'on Poverty', 'on Poverty',
    'on the Lust of the Belly', 'on Abstinence', 'on Fornication', 'on Fornication',
  ];
  const ORD = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth',
    'Ninth', 'Tenth', 'Eleventh', 'Twelfth', 'Thirteenth'];

  const isRunningHead = l => {
    const t = l.trim();
    if (t.length > 70) return false;
    if (/^Here\s/i.test(t)) return false;
    if (/DISCOURSES?\s+OF\s+PHILOXENUS/i.test(t)) return true;
    if (/^[^A-Za-z]{0,8}(the\s+)?[a-z^*'—-]{2,12}\s+discourse\s*[.,]?\s*(on\s+[a-z .]+)?\s*$/i.test(t)
      && !/^\[/.test(t)) return true;
    return false;
  };

  const paras = [];
  for (let k = 0; k < 13; k++) {
    const from = starts[k];
    const to = k < 12 ? starts[k + 1] : body.length;
    // segment ends at its colophon paragraph; junk between colophon and next start is cut
    const col = colophons[k];
    const seg = body.slice(from, Math.min(to, col + 4));
    // find end of colophon paragraph (first blank after colophon line)
    let colEnd = col - from;
    while (colEnd < seg.length && seg[colEnd].trim() !== '') colEnd++;
    const segLines = seg.slice(0, colEnd);

    paras.push({ heading: true, text: `Chapter ${k + 1}.--The ${ORD[k]} Discourse, ${TITLES[k]}.` });

    // rubric: leading caps block (skipping blanks) becomes one paragraph
    let i = 0;
    const rubric = [];
    while (i < segLines.length && (segLines[i].trim() === '' || isCapsLine(segLines[i]) || /^\[/.test(segLines[i].trim()))) {
      if (segLines[i].trim() !== '') rubric.push(segLines[i]);
      i++;
    }
    if (rubric.length) paras.push({ text: joinLines(rubric) });

    const kept = [];
    for (; i < segLines.length; i++) {
      const l = segLines[i];
      if (l.trim() === '') { kept.push(l); continue; }
      if (isJunkLine(l) || isRunningHead(l) || isGarbleLine(l)) { kept.push(''); continue; }
      kept.push(l);
    }
    for (const p of toParagraphs(kept)) {
      if (isFootnotePara(p)) continue;
      paras.push({ text: p });
    }
    vlog(`  discourse ${k + 1}: lines ${startIdx + 1 + from}..${startIdx + 1 + from + colEnd}`);
  }

  const text = finishBody(paras);
  const words = writeWork('Philoxenus_English', 'The Discourses.txt', [
    'source: The Discourses of Philoxenus, Bishop of Mabbogh, A.D. 485-519, edited from Syriac manuscripts with an English translation by E. A. Wallis Budge, Vol. II (London: Asher & Co., 1894)',
    'series: Budge',
    'father: Philoxenus of Mabbug',
    'work: The Discourses',
    'translator: E. A. Wallis Budge',
    'extracted: ' + EXTRACTED,
    'origin: data/pd-english-sources/cache/s5-budge-philoxenus-02.txt (https://archive.org/details/discoursesofphil02philuoft)',
    'note: Public-domain 1894 translation. Machine-cleaned from the Archive.org OCR scan; page furniture removed; footnotes not restored. Some scanner misreadings may remain.',
  ], text, '13 discourses');
  return { file: 'The Discourses.txt', units: 13, words };
}

// =========================================================================
// 2. The Book of the Cave of Treasures (1927)
// =========================================================================
function cave() {
  const lines = readCache('s5-budge-cave');

  const startIdx = lines.findIndex(l => /^\[THE TITLE OF THE WORK/.test(l.trim()));
  const endIdx = lines.findIndex((l, i) => i > startIdx && /^TESTAMENTUM\s+ADAMI\.?\s*$/.test(l.trim()));
  if (startIdx < 0 || endIdx < 0) throw new Error('cave: anchors not found');
  const body = lines.slice(startIdx, endIdx);

  const paras = [];
  let dropped = 0, headings = 0;
  let i = 0;
  while (i < body.length) {
    const t = body[i].trim();
    if (t === '') { i++; continue; }

    // bracketed block: heading (short) or Budge's note (long) -- scan to closing bracket
    if (/^\[/.test(t) && !/^\[Fol/i.test(t)) {
      const block = [];
      let j = i;
      while (j < body.length && j - i < 80) {
        block.push(body[j]);
        if (/[\]}|)]\s*$/.test(body[j].trim()) && !/^\[$/.test(body[j].trim())) break;
        j++;
      }
      const blockText = joinLines(block).replace(/^\[\s*/, '').replace(/\s*[\]}|)]$/, '').trim();
      const isNote = /^No[tr&][eErR]?[sS]?\s*[.:——-]/i.test(blockText) || /^N\s?o\s?t\s?e/i.test(blockText);
      if (isNote || blockText.length > 130) { dropped++; }
      else { paras.push({ heading: true, text: blockText.replace(/\s*~\s*/g, ' ').replace(/\s+/g, ' ') }); headings++; }
      i = j + 1;
      continue;
    }

    // collect a paragraph run up to the next blank line
    const run = [];
    while (i < body.length && body[i].trim() !== '') { run.push(body[i]); i++; }

    // single caps line between blanks = running head; caps block of 2+ lines = real heading
    const capsRun = run.every(isCapsLine);
    if (capsRun && run.length === 1) { dropped++; continue; }
    if (capsRun && run.length >= 2 && joinLines(run).length < 130) {
      paras.push({ heading: true, text: joinLines(run) }); headings++;
      continue;
    }

    const kept = run.filter(l => !isJunkLine(l) && !(isCapsLine(l) && /\d/.test(l)));
    if (!kept.length) continue;
    const p = joinLines(kept);
    if (isFootnotePara(p)) { dropped++; continue; }
    paras.push({ text: p });
  }
  vlog(`  cave: ${headings} headings kept, ${dropped} note/head blocks dropped`);

  const text = finishBody(paras);
  const words = writeWork('Apostolic_English', 'The Book of the Cave of Treasures.txt', [
    'source: The Book of the Cave of Treasures, a history of patriarchs and kings translated from the Syriac by Sir E. A. Wallis Budge (London: The Religious Tract Society, 1927)',
    'series: Budge',
    'father: apostolic',
    'work: The Book of the Cave of Treasures',
    'translator: E. A. Wallis Budge',
    'extracted: ' + EXTRACTED,
    'origin: data/pd-english-sources/cache/s5-budge-cave.txt (https://archive.org/details/bookofcaveoftrea0000eawa)',
    'note: Public-domain 1927 translation. Anonymous Syriac work. Machine-cleaned from the Archive.org OCR scan; Budge\'s study, interleaved notes and supplementary translations removed; footnotes not restored. Some scanner misreadings may remain.',
  ], text, `${headings} section headings`);
  return { file: 'The Book of the Cave of Treasures.txt', units: headings, words };
}

// =========================================================================
// 3. The Contendings of the Apostles, Vol. 2 (1901)
// =========================================================================
function contendings() {
  const lines = readCache('s5-budge-contendings-02');

  const startIdx = lines.findIndex(l => /^IN\s+THE\s+NAME\s+OF\s+THE\s+FATHER,/.test(l.trim()));
  let endIdx = lines.findIndex((l, i) => i > startIdx && /So\s+be\s+it\.\s+So\s+be\s+it\./.test(l));
  if (startIdx < 0 || endIdx < 0) throw new Error('contendings: anchors not found');
  endIdx += 1;
  const body = lines.slice(startIdx, endIdx);

  const norm = l => l.trim().replace(/\s+/g, ' ');
  const SECTIONS = [
    { t: 'The History of Saint Peter', re: /^THE HISTORY OF SAINT PETER/ },
    { t: 'The Martyrdom of Saint Peter', re: /^THE MARTYRDOM OF SAINT PETER/ },
    { t: 'The Martyrdom of Saint Paul', re: /^THE MARTYRDOM OF SAINT PAUL/ },
    { t: 'The Genealogies of the Twelve Apostles', re: /^THE GENEALOGIES OF THE TWELVE/ },
    { t: 'The Epistle of Dionysius the Areopagite to Timothy', re: /^THE EPISTLE OF DIONYSIUS/ },
    { t: 'The Preaching of Simon, the Son of Cleopas', re: /^THE PREACHING OF SIMON/ },
    { t: 'The Martyrdom of Simon, the Son of Cleopas', re: /^THE MARTYRDOM OF SIMON/ },
    { t: 'The Preaching of Saint James the Just', re: /^THE PREACHING OF SAINT JAMES/ },
    { t: 'The Martyrdom of Saint James the Just', re: /^THE MARTYRDOM OF SAINT JAMES/ },
    { t: 'The Preaching of Saint Bartholomew in the Oasis', re: /^THE PREACHING\b/, look: /BARTHOLOMEW/ },
    { t: 'The Martyrdom of Saint Bartholomew in Naidas', re: /^THE MARTYRDOM\b/, look: /BARTHOLO/ },
    { t: 'The Acts of Saint Andrew and Saint Matthew in the City of Kahenat', re: /^THE ACTS OF SAINT ANDREW/ },
    { t: 'The Martyrdom of Saint Matthew in Parthia', re: /^THE MARTYRDOM OF SAINT MATTHEW/ },
    { t: 'The Martyrdom of Saint Luke', re: /^THE MARTYRDOM OF SAINT LUKE/ },
    { t: 'The Preaching of Saints Philip and Peter', re: /^THE PREACHING OF SAINTS? PHILIP/ },
    { t: 'The Martyrdom of Saint Philip in Phrygia', re: /^THE MARTYRDOM OF SAINT PHILIP/ },
    { t: 'The Preaching of Saints Andrew and Philemon among the Kurds', re: /^THE PREACHING OF SAINTS? ANDREW/ },
    { t: 'The Acts of Saints Andrew and Bartholomew among the Parthians', re: /^THE ACTS OF\b/, look: /ANDREW\s+AND\s+BAR/ },
    { t: 'The Martyrdom of Saint Andrew in Scythia', re: /^THE MARTYRDOM OF SAINT ANDREW/ },
    { t: 'The Preaching of Saint John the Evangelist', re: /^THE PREACHING OF SAINT JOHN/ },
    { t: 'The History of the Death of Saint John the Evangelist', re: /^THE HISTORY OF THE DEATH/ },
    { t: 'The Martyrdom of Saint James', re: /^THE MARTYRDOM OF SAINT JAMES/ },
    { t: 'The Preaching of Saint Matthias in the City of the Cannibals', re: /^THE PREACHING OF SAINT MATTHIAS/ },
    { t: 'The Martyrdom of Saint Matthias', re: /^THE MARTYRDOM OF SAINT MATTHIAS/ },
    { t: 'The Acts of Saint James in India', re: /^THE ACTS OF SAINT JAMES/ },
    { t: 'The Martyrdom of Saint James in India', re: /^THE MARTYRDOM OF SAINT JAMES/ },
    { t: 'The Martyrdom of Saint Mark the Evangelist in Alexandria', re: /^THE MARTYRDOM OF SAINT MARK/ },
    { t: 'The Preaching of Saint Thomas in India', re: /^THE PREACHING OF SAINT THOMAS/ },
    { t: 'The Martyrdom of Saint Thomas in India', re: /^THE MARTYRDOM OF (SAINT )?THOMAS/ },
    { t: 'The Preaching of Judas Thaddeus in Syria', re: /^THE PREACHING OF JUDAS/ },
    { t: 'The Preaching of Saint Matthias', re: /^THE PREACHING OF SAINT MATTHIAS/ },
    { t: 'The Acts of Saint Thomas in India', re: /^THE ACTS OF SAINT THOMAS/ },
    { t: 'The Acts of Saint Peter', re: /^THE ACTS OF SAINT PETER/ },
    { t: 'The History of the Contending of Saint Paul', garble: l => /contending/i.test(l) && /pau/i.test(l) && isGarbleLine(l) },
  ];

  // resolve section start line indices sequentially
  const startAt = [];
  let cursor = 1;
  for (const s of SECTIONS) {
    let found = -1;
    for (let i = cursor; i < body.length; i++) {
      const n = norm(body[i]);
      if (s.garble) { if (s.garble(n)) { found = i; break; } continue; }
      if (!isCapsLine(body[i]) || /\d/.test(n)) continue;
      if (!s.re.test(n)) continue;
      if (s.look) {
        const ahead = norm((body[i] || '') + ' ' + (body[i + 1] || '') + ' ' + (body[i + 2] || ''));
        if (!s.look.test(ahead)) continue;
      }
      found = i; break;
    }
    if (found < 0) throw new Error(`contendings: section not found: ${s.t}`);
    startAt.push(found);
    cursor = found + 1;
    vlog(`  ch ${startAt.length} @ cache line ${startIdx + 1 + found}: ${s.t}`);
  }

  const paras = [];
  // opening invocation (before first section) is the book's own rubric
  const inv = body.slice(0, startAt[0]).filter(l => l.trim() !== '' && !isJunkLine(l) && !isGarbleLine(l) && !/^PREFACE/.test(norm(l)) && !/ETHIOPIAN TRANSLATOR/.test(norm(l)));
  if (inv.length) paras.push({ text: joinLines(inv) });

  let droppedGarble = 0, droppedHeads = 0, droppedNotes = 0;
  for (let k = 0; k < SECTIONS.length; k++) {
    const from = startAt[k];
    const to = k + 1 < SECTIONS.length ? startAt[k + 1] : body.length;
    paras.push({ heading: true, text: `Chapter ${k + 1}.--${SECTIONS[k].t}.` });

    // skip the printed caps title lines at the start of the section
    let i = from;
    if (!SECTIONS[k].garble) {
      while (i < to && (body[i].trim() === '' || (isCapsLine(body[i]) && !/\d/.test(body[i])))) i++;
    } else i = from; // garbled rubric is dropped by the garble filter below

    const kept = [];
    for (; i < to; i++) {
      const l = body[i];
      const t = l.trim();
      if (t === '') { kept.push(''); continue; }
      if (isJunkLine(l)) { kept.push(''); continue; }
      if (isGarbleLine(l)) { droppedGarble++; kept.push(''); continue; }
      if (isCapsLine(l)) {
        // running heads: caps lines (almost all carry a page number; isolated ones are heads too)
        const prevBlank = i === 0 || body[i - 1].trim() === '' || isCapsLine(body[i - 1]) === false && false;
        const soloCaps = (i === 0 || !isCapsLine(body[i - 1]) ) && (i + 1 >= body.length || !isCapsLine(body[i + 1]));
        if (/\d/.test(t) || soloCaps) { droppedHeads++; kept.push(''); continue; }
        kept.push(l); continue; // multi-line caps block (e.g. CHAP. titles inside Acts of Peter)
      }
      kept.push(l);
    }
    for (const p of toParagraphs(kept)) {
      if (isFootnotePara(p)) { droppedNotes++; continue; }
      paras.push({ text: p });
    }
  }
  vlog(`  contendings: dropped ${droppedGarble} garbled lines, ${droppedHeads} heads, ${droppedNotes} footnotes`);

  const text = finishBody(paras);
  const words = writeWork('Apostolic_English', 'The Contendings of the Apostles.txt', [
    'source: The Contendings of the Apostles, being the histories of the lives and martyrdoms and deaths of the twelve apostles and evangelists, translated from the Ethiopic by E. A. Wallis Budge, Vol. II: The English Translation (London: Henry Frowde, 1901)',
    'series: Budge',
    'father: apostolic',
    'work: The Contendings of the Apostles',
    'translator: E. A. Wallis Budge',
    'extracted: ' + EXTRACTED,
    'origin: data/pd-english-sources/cache/s5-budge-contendings-02.txt (https://archive.org/details/contendingsofapo02budguoft)',
    'note: Public-domain 1901 translation. Anonymous Ethiopic apocryphal acts. Machine-cleaned from the Archive.org OCR scan; page furniture removed; footnotes and Ethiopic-type rubrics not restored. Some scanner misreadings may remain.',
  ], text, `${SECTIONS.length} chapters`);
  return { file: 'The Contendings of the Apostles.txt', units: SECTIONS.length, words };
}

// =========================================================================
// 4. The History of the Blessed Virgin Mary (+ Likeness of Christ), 1899
// =========================================================================
function bvm() {
  const lines = readCache('s5-budge-bvm-02');

  const start1 = lines.findIndex(l => /^BY\s+THE\s+I?MIGHT\s+OF\s+OUR\s+LORD/.test(l.trim().replace(/\s+/g, ' ')));
  // the Likeness rubric proper (the one carrying "Page 157"), after the half-title
  let start2 = -1;
  for (let i = start1 + 1; i < lines.length; i++) {
    if (/^THE\s+HISTORY\s+OF\s+THE\s+LIKENESS\s+OF\s+CHRIST/.test(lines[i].trim().replace(/\s+/g, ' ')) && /Page/.test(lines[i])) { start2 = i; break; }
  }
  let end2 = -1;
  for (let i = start2 + 1; i < lines.length; i++) {
    if (/^Here\s+endeth\s+the\s+History\s+of\s+the\s+Likeness/i.test(lines[i].trim().replace(/\s+/g, ' '))) {
      // include the whole colophon paragraph
      let j = i;
      while (j < lines.length && lines[j].trim() !== '') j++;
      end2 = j; break;
    }
  }
  if (start1 < 0 || start2 < 0 || end2 < 0) throw new Error('bvm: anchors not found');
  vlog(`  bvm: virgin @ ${start1 + 1}, likeness @ ${start2 + 1}, end @ ${end2}`);

  function processRange(from, to) {
    const out = [];
    const seg = lines.slice(from, to);
    let i = 0;
    // opening caps rubric
    const rubric = [];
    while (i < seg.length && (seg[i].trim() === '' || isCapsLine(seg[i]))) {
      if (seg[i].trim() !== '') rubric.push(seg[i]);
      i++;
    }
    if (rubric.length) out.push({ text: joinLines(rubric) });
    const kept = [];
    for (; i < seg.length; i++) {
      const l = seg[i];
      if (l.trim() === '') { kept.push(''); continue; }
      if (isJunkLine(l) || isGarbleLine(l)) { kept.push(''); continue; }
      if (isCapsLine(l)) { kept.push(''); continue; } // running heads (title-per-page, often numberless)
      kept.push(l);
    }
    for (const p of toParagraphs(kept)) {
      if (isFootnotePara(p)) continue;
      // Budge's own notes ("Chapter XII, no mention...", "Chapter XV.") would
      // be read as extra chapters by the site splitter.
      if (/^Chapter\s+([IVXLCDM]+|\d+)\b/i.test(p)) continue;
      if (/^Chapter ends with\b/i.test(p)) continue;
      out.push({ text: p });
    }
    return out;
  }

  const paras = [];
  paras.push({ heading: true, text: 'Chapter 1.--The History of the Blessed Virgin Mary.' });
  paras.push(...processRange(start1, start2));
  paras.push({ heading: true, text: 'Chapter 2.--The History of the Likeness of Christ.' });
  paras.push(...processRange(start2, end2));

  const text = finishBody(paras);
  const words = writeWork('Apostolic_English', 'The History of the Blessed Virgin Mary.txt', [
    'source: The History of the Blessed Virgin Mary and the History of the Likeness of Christ, translated from the Syriac by E. A. Wallis Budge, Vol. II: English Translations (London: Luzac & Co., 1899)',
    'series: Budge',
    'father: apostolic',
    'work: The History of the Blessed Virgin Mary',
    'translator: E. A. Wallis Budge',
    'extracted: ' + EXTRACTED,
    'origin: data/pd-english-sources/cache/s5-budge-bvm-02.txt (https://archive.org/details/historyofblessed02budg)',
    'note: Public-domain 1899 translation. Two anonymous Syriac works. Machine-cleaned from the Archive.org OCR scan; page furniture removed; footnotes not restored. Some scanner misreadings may remain.',
  ], text, '2 works as 2 chapters');
  return { file: 'The History of the Blessed Virgin Mary.txt', units: 2, words };
}

// ---------- run ----------
const results = {};
for (const [name, fn] of [['philoxenus', philoxenus], ['cave', cave], ['contendings', contendings], ['bvm', bvm]]) {
  try { results[name] = fn(); }
  catch (e) { console.error(`FAILED ${name}:`, e.message); process.exitCode = 1; }
}
