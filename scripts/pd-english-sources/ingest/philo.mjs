// Ingest: Philo of Alexandria — The Works of Philo Judaeus, trans. C. D. Yonge
// (London: Henry G. Bohn, 4 vols., 1854-1855), from Archive.org OCR.
// Produces Fathers/English/Philo_English/Works, Volume {I..IV}.txt with one
// `Chapter N.--<Treatise Title>.` heading per treatise (per the printed TOC).
//
// Usage: node scripts/pd-english-sources/ingest/philo.mjs
// Treatise boundaries are anchored to fixed line numbers of the cache files and
// asserted against expected text, so the extraction fails loudly if the cache
// files ever change.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', '..', '..');
const CACHE = path.join(ROOT, 'data', 'pd-english-sources', 'cache');
const OUT_DIR = path.join(ROOT, 'Fathers', 'English', 'Philo_English');

const EXTRACTED = '2026-11-18';

// ---------------------------------------------------------------------------
// Volume specifications.  `line` values are 1-based line numbers in the cache
// file; `expect` is a whitespace-collapsed substring the line must contain.
// `extraSkip` consumes that many additional non-blank heading lines that the
// generic heading-consumer would not recognise (mixed-case printed headings).
// ---------------------------------------------------------------------------
const VOLUMES = [
  {
    row: 's4-bohn-philo-01',
    file: 'Works, Volume I.txt',
    work: 'Works, Volume I',
    year: 1854,
    volRoman: 'I',
    url: 'https://archive.org/details/worksofphilojuda01phil',
    bodyStart: 275,
    bodyEnd: 24854, // line "END OF VOL. I." (exclusive)
    endExpect: 'END OF VOL. I.',
    chapters: [
      { line: 275, expect: 'A TEEATISE', title: 'On the Creation of the World' },
      { line: 2718, expect: 'THE FIRST BOOK', title: 'Allegories of the Sacred Laws, Book I' },
      { line: 4061, expect: 'THE SECOND BOOK', title: 'Allegories of the Sacred Laws, Book II' },
      { line: 5341, expect: 'THE THIRD BOOK', title: 'Allegories of the Sacred Laws, Book III' },
      { line: 8589, expect: 'A TREATISE ON THE CHERUBIM', title: 'On the Cherubim, and the Flaming Sword' },
      { line: 9063, expect: 'PART II.', title: 'On Cain and His Birth' },
      { line: 10100, expect: 'A TREATISE', title: 'On the Sacrifices of Abel and Cain' },
      { line: 11740, expect: 'A TREATISE', title: 'That the Worse Is Accustomed to Plot Against the Better' },
      { line: 13902, expect: 'A TREATISE', title: 'On the Posterity of Cain' },
      { line: 16006, expect: 'A TREATISE ON THE GIANTS', title: 'On the Giants' },
      { line: 16616, expect: 'A TEEATISE', title: 'On the Unchangeableness of God' },
      { line: 18311, expect: 'A TREATISE', title: 'On the Tilling of the Earth by Noah' },
      { line: 20090, expect: 'THE SECOND PAET', title: 'About the Planting of Noah' },
      { line: 21863, expect: 'A TREATISE ON DRUNKENNESS', title: 'On Drunkenness' },
      { line: 24138, expect: 'A TREATISE', title: 'On Sobriety' },
    ],
    headCandidates: [
      'on the creation of the world', 'on the allegories of the sacred laws',
      'allegories of the sacred laws', 'on the cherubim', 'of cain and his birth',
      'on the sacrifices of abel and cain', 'on the posterity of cain',
      'the worse plotting against the better', 'on the giants',
      'on the unchangeableness of god', 'on the tilling of the earth by noah',
      'about the planting of noah', 'on drunkenness', 'on sobriety',
    ],
  },
  {
    row: 's4-bohn-philo-02',
    file: 'Works, Volume II.txt',
    work: 'Works, Volume II',
    year: 1854,
    volRoman: 'II',
    url: 'https://archive.org/details/worksofphilojuda02phil',
    bodyStart: 88,
    bodyEnd: 25031, // "END OF VOL. II."
    endExpect: 'END OF VOL. II.',
    chapters: [
      { line: 88, expect: 'A TKEATISE', title: 'On the Confusion of Languages' },
      { line: 2125, expect: 'A TllEATISE', title: 'On the Migration of Abraham' },
      { line: 4596, expect: 'A TREATISE', title: 'Who Is the Heir of Divine Things' },
      { line: 7676, expect: 'A TREATISE', title: 'On the Meeting for the Sake of Receiving Instruction' },
      { line: 9440, expect: 'A TREATISE ON FUGITIVES', title: 'On Fugitives' },
      { line: 11615, expect: 'A TREATISE', title: 'On the Change of Scripture Names' },
      { line: 14275, expect: 'A TREATISE', title: 'On the Doctrine That Dreams Are Sent from God, Book I' },
      { line: 16815, expect: 'A TEEATISE', title: 'On the Doctrine That Dreams Are Sent from God, Book II' },
      { line: 19538, expect: 'A TREATISE', title: 'On Abraham' },
      { line: 22320, expect: 'A TEEATISE', title: 'On Joseph' },
    ],
    headCandidates: [
      'on the confusion of languages', 'on the migration of abraham',
      'who is the heir of divine things', 'on the meeting for the sake of receiving instruction',
      'on the meeting for the sake of seeking instruction', 'on fugitives',
      'on the change of scripture names', 'on dreams', 'on abraham', 'on joseph',
      'on the doctrine that dreams are sent from god',
      'on the life of the wise man', 'on the life of a man occupied with affairs of state',
    ],
  },
  {
    row: 's4-bohn-philo-03',
    file: 'Works, Volume III.txt',
    work: 'Works, Volume III',
    year: 1855,
    volRoman: 'III',
    url: 'https://archive.org/details/worksphilojudaeu03philuoft',
    bodyStart: 955,
    bodyEnd: 27246, // last body line is 27245 'To live in conformity to nature."'
    endExpect: null,
    chapters: [
      { line: 955, expect: 'A TEEATISE', title: 'On the Life of Moses, Book I' },
      { line: 4514, expect: 'A TEEATISE', title: 'On the Life of Moses, Book II' },
      { line: 5181, expect: 'A TREATISE', title: 'On the Life of Moses, Book III' },
      { line: 7517, expect: 'A TEEATISE', title: 'Concerning the Ten Commandments' },
      { line: 9389, expect: 'A TEEATISE', title: 'On Circumcision' },
      { line: 9500, expect: 'A TEEATISE', title: 'On Monarchy, Book I' },
      { line: 10117, expect: 'A TltEATISE', title: 'On Monarchy, Book II' },
      { line: 10803, expect: 'A TEEATISE', title: 'On the Rewards and Honours Belonging to the Priests' },
      { line: 11141, expect: 'A TEEATISE', title: 'On Animals Fit for Sacrifice' },
      { line: 12018, expect: 'A TREATISE', title: 'On Those Who Offer Sacrifice' },
      { line: 12958, expect: 'A TEEATISE', title: 'On the Wages of a Harlot' },
      { line: 13256, expect: 'A TEEATISE', title: 'On the Special Laws (Third, Fourth, and Fifth Commandments)' },
      { line: 13699, expect: 'A TREATISE', title: 'On the Number Seven' },
      { line: 13748, expect: 'A TEEATISE', title: 'That the Festivals Are Ten in Number' },
      { line: 15018, expect: 'A TREATISE', title: 'On the Festival of the Basket of First-Fruits' },
      { line: 15120, expect: 'A TJiEATISE', title: 'On the Honour Commanded to Be Paid to Parents' },
      { line: 15582, expect: 'A. TEEATISE', title: 'On the Special Laws (Sixth and Seventh Commandments)' },
      { line: 18066, expect: 'A TEEATISE', title: 'On the Special Laws (Eighth, Ninth, and Tenth Commandments)' },
      { line: 19701, expect: 'A TEEATISE', title: 'On Justice' },
      { line: 19882, expect: 'A TREATISE', title: 'On the Creation of Magistrates' },
      { line: 20862, expect: 'A TEEATISE', title: 'On Three Virtues, Courage, Humanity, and Repentance' },
      { line: 23047, expect: 'A TREATISE', title: 'On Rewards and Punishments' },
      { line: 24435, expect: 'A TEEATISE', title: 'On Curses' },
      { line: 25014, expect: 'A TREATISE', title: 'On Nobility' },
      { line: 25522, expect: 'A TEEATISE', title: 'That Every Man Who Is Virtuous Is Also Free' },
    ],
    headCandidates: [
      'on the life of moses', 'concerning the ten commandments', 'on circumcision',
      'on monarchy', 'on animals fit for sacrifice', 'or on victims',
      'on those who offer sacrifice', 'on the wages of a harlot', 'on the special laws',
      'on the number seven', 'the festivals are ten in number',
      'on the festival of the basket of first fruits', 'on the honour due to parents',
      'on justice', 'on the creation of magistrates', 'on courage', 'on humanity',
      'on repentance', 'on three virtues', 'on rewards and punishments', 'on curses',
      'on nobility', 'every man who is virtuous is also free', 'on the ten festivals',
    ],
  },
  {
    row: 's4-bohn-philo-04',
    file: 'Works, Volume IV.txt',
    work: 'Works, Volume IV',
    year: 1855,
    volRoman: 'IV',
    url: 'https://archive.org/details/theworksofphiloj04yonguoft',
    bodyStart: 98,
    bodyEnd: 22726, // "INDEX." — the four-volume index is dropped
    endExpect: 'INDEX.',
    chapters: [
      { line: 98, expect: 'A TEEATISE', title: 'On a Contemplative Life' },
      { line: 1054, expect: 'A TREATISE', title: 'On the Incorruptibility of the World' },
      { line: 3017, expect: 'A TEEATISE', title: 'Against Flaccus' },
      { line: 4843, expect: 'A TEEATISE', title: 'On the Virtues and Office of Ambassadors' },
      { line: 8718, expect: 'A TEEATISE', title: 'Concerning the World' },
      { line: 10160, expect: 'THE FRAGMENTS', title: 'Fragments of the Lost Works' },
      { line: 11732, expect: 'FRAGMENTS,', title: 'Fragments from the Parallels of John of Damascus' },
      { line: 12509, expect: 'FRAGMENTS FROM A MONKISH MANUSCRIPT', title: 'Fragments from a Monkish Manuscript' },
      { line: 13202, expect: 'FRAGMENTS PRESERVED BY ANTONIUS', title: 'Fragments Preserved by Antonius' },
      { line: 13456, expect: 'The following Fragments', extraSkip: 2, title: 'Fragments from an Anonymous Collection in the Bodleian Library' },
      { line: 13513, expect: 'The following Fragments', extraSkip: 2, title: 'Fragments from a Manuscript in the Library of the French King' },
      { line: 13843, expect: 'A VOLUME', title: 'Questions and Solutions in Genesis, Book I' },
      { line: 16635, expect: 'QUESTIONS, AND SOLUTIONS', title: 'Questions and Solutions in Genesis, Book II' },
      { line: 19888, expect: 'QUESTIONS, AND SOLUTIONS', title: 'Questions and Solutions in Genesis, Book III' },
    ],
    headCandidates: [
      'on a contemplative life', 'on the incorruptibility of the world',
      'against flaccus', 'on the virtues and on the office of ambassadors',
      'on the office of ambassadors', 'concerning the world', 'on the world',
      'fragments', 'questions and solutions', 'the fragments of the lost works',
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const collapse = (s) => s.replace(/\s+/g, ' ').trim();
const lettersOnly = (s) => s.toLowerCase().replace(/[^a-z]/g, '');

function capsRatio(line) {
  const letters = line.replace(/[^A-Za-z]/g, '');
  if (!letters.length) return 0;
  const upper = letters.replace(/[^A-Z]/g, '').length;
  return upper / letters.length;
}
const letterCount = (line) => line.replace(/[^A-Za-z]/g, '').length;

function bigrams(s) {
  const set = new Map();
  for (let i = 0; i < s.length - 1; i++) {
    const b = s.slice(i, i + 2);
    set.set(b, (set.get(b) || 0) + 1);
  }
  return set;
}
function diceSim(a, b) {
  if (a.length < 2 || b.length < 2) return a === b ? 1 : 0;
  const A = bigrams(a), B = bigrams(b);
  let overlap = 0, total = 0;
  for (const [g, n] of A) { overlap += Math.min(n, B.get(g) || 0); total += n; }
  for (const [, n] of B) total += n;
  return (2 * overlap) / total;
}

const PHILO_HEAD_RE = /(ph|rn|pi|m)[i1l.]*lo\s+ju[dm]/i;
const SIG_RE = /^[^a-z]{0,4}[VTY]OL\.?\s*[A-Zl1IVXU.]{1,5}\.?(\s+[A-Z]{1,2}){0,2}\.?\s*$/;
const SIG2_RE = /^[A-Za-z]{1,2}\s+(li|[0-9]{1,2})\s*$/;
const FOOTNOTE_START_RE = /^\s*[*•†‡]/;
const DAGGER_LETTER_RE = /^[fJjtX±+]\s+(?=[A-Z"'])/;

function isGarbageLine(line) {
  const t = line.trim();
  if (!t) return false;
  if (/digitized\s+by|internet\s+archive|archive\.org\/details/i.test(t)) return true;
  if (SIG_RE.test(t) && t.length < 22) return true;
  if (SIG2_RE.test(t)) return true;
  // No real word content: no two consecutive lowercase letters AND no 3+ caps word
  if (!/[a-z]{2}/.test(t) && !/[A-Z]{3}/.test(t)) return true;
  // very short junk like "O D JO", "/7", "8"
  if (t.length < 10 && !/[a-z]{2}/.test(t)) return true;
  return false;
}

function isHeadingish(line) {
  const t = line.trim();
  if (!t) return false;
  if (letterCount(t) < 2) return true;
  if (capsRatio(t) >= 0.7 && /[A-Z]/.test(t)) return true;
  return false;
}

function buildHeadMatcher(vol) {
  const candidates = new Set();
  for (const c of vol.headCandidates) candidates.add(lettersOnly(c));
  for (const ch of vol.chapters) candidates.add(lettersOnly(ch.title));
  candidates.add('philojudaeus');
  candidates.add('theworksofphilojudaeus');
  const candList = [...candidates].filter((c) => c.length >= 4);
  return (norm) => {
    if (norm.length < 4) return false;
    for (const c of candList) {
      if (c.includes(norm) || norm.includes(c)) return true;
      if (diceSim(norm, c) >= 0.72) return true;
    }
    return false;
  };
}

// Count normalized caps-line frequencies across the volume body (running heads
// repeat; genuine one-off caps subheadings do not).
function capsFrequencies(lines) {
  const freq = new Map();
  for (const line of lines) {
    const t = line.trim();
    if (!t || !isHeadingish(t)) continue;
    const norm = lettersOnly(t);
    if (norm.length < 4) continue;
    freq.set(norm, (freq.get(norm) || 0) + 1);
  }
  return freq;
}

function cleanInline(text) {
  let t = text;
  t = t.replace(/[*†‡]/g, '');
  // standalone or trailing dagger OCR'd as +
  t = t.replace(/(^|\s)\+(\s|$)/g, '$1$2').replace(/(?<=[a-zA-Z.,;:!?'")\]])\+/g, '');
  t = t.replace(/\btbe\b/g, 'the').replace(/\bTbe\b/g, 'The').replace(/\bancl\b/g, 'and');
  t = t.replace(/\s+([,.;:!?])/g, '$1');
  t = t.replace(/\s{2,}/g, ' ');
  return t.trim();
}

// Join hard-wrapped lines of one block into a single paragraph string,
// de-hyphenating across line breaks.
function joinBlock(blockLines) {
  let out = '';
  for (const raw of blockLines) {
    const line = raw.trim();
    if (!line) continue;
    if (!out) { out = line; continue; }
    if (/[A-Za-z]-$/.test(out)) {
      const stripped = out.replace(/-$/, '');
      if (/^[a-z]/.test(line)) out = stripped + line;       // judg- ment -> judgment
      else out = out + line;                                 // keep hyphen for compounds
    } else {
      out = out + ' ' + line;
    }
  }
  return cleanInline(out);
}

const endsSentence = (s) => /[.?!:;]['")\]]*$/.test(s) || /["'”’]$/.test(s);

function processSegment(lines, vol, freq, headMatch, extraSkip) {
  // 1. Consume the printed treatise-title block at the top of the segment.
  let i = 0;
  const isBodyStart = (t) =>
    (/[a-z].*[a-z].*[a-z]/.test(t) && t.trim().length >= 20) ||
    /^[IVXLC]+\.\s+\S/.test(t.trim());
  while (i < lines.length) {
    const t = lines[i].trim();
    if (!t) { i++; continue; }
    if (isGarbageLine(t) || isHeadingish(t) || !isBodyStart(t)) { i++; continue; }
    break;
  }
  let skipped = extraSkip || 0;
  while (skipped > 0 && i < lines.length) {
    if (lines[i].trim()) skipped--;
    i++;
    while (i < lines.length && !lines[i].trim()) i++;
  }

  // 2. Filter furniture lines.
  const kept = [];
  for (; i < lines.length; i++) {
    const raw = lines[i];
    const t = raw.trim();
    if (!t) { kept.push(''); continue; }
    if (isGarbageLine(t)) continue;
    if (PHILO_HEAD_RE.test(t) && t.length < 40) continue;
    if (isHeadingish(t)) {
      const norm = lettersOnly(t);
      if ((freq.get(norm) || 0) >= 2) continue;        // repeating running head
      if (headMatch(norm)) continue;                    // matches a known title
      kept.push(t);                                     // genuine caps subheading
      kept.push('');                                    // keep it its own paragraph
      continue;
    }
    kept.push(t);
  }

  // 3. Group into blocks; drop footnote blocks.
  const blocks = [];
  let cur = [];
  const flush = () => { if (cur.length) { blocks.push(cur); cur = []; } };
  for (const line of kept) {
    if (!line) { flush(); continue; }
    cur.push(line);
  }
  flush();

  const paragraphs = [];
  for (const block of blocks) {
    const first = block[0];
    if (FOOTNOTE_START_RE.test(first) || DAGGER_LETTER_RE.test(first)) continue;
    const para = joinBlock(block);
    if (!para) continue;
    paragraphs.push(para);
  }

  // 4. Merge continuation paragraphs (page breaks split paragraphs).
  const merged = [];
  for (const p of paragraphs) {
    if (!merged.length) { merged.push(p); continue; }
    const prev = merged[merged.length - 1];
    const prevHyphen = /[A-Za-z]-$/.test(prev);
    const startsLower = /^[a-z]/.test(p);
    if (prevHyphen) {
      const stripped = prev.replace(/-$/, '');
      merged[merged.length - 1] = startsLower ? stripped + p : prev + p;
    } else if (startsLower || !endsSentence(prev)) {
      merged[merged.length - 1] = prev + ' ' + p;
    } else {
      merged.push(p);
    }
  }
  return merged;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
fs.mkdirSync(OUT_DIR, { recursive: true });
const report = [];

for (const vol of VOLUMES) {
  const srcPath = path.join(CACHE, `${vol.row}.txt`);
  const lines = fs.readFileSync(srcPath, 'utf8').split(/\r?\n/);

  // assert anchors
  for (const ch of vol.chapters) {
    const got = collapse(lines[ch.line - 1] || '');
    if (!got.includes(collapse(ch.expect))) {
      throw new Error(`${vol.row}: anchor mismatch at line ${ch.line}: expected "${ch.expect}", got "${got}"`);
    }
  }
  if (vol.endExpect) {
    const got = collapse(lines[vol.bodyEnd - 1] || '');
    if (!got.includes(collapse(vol.endExpect))) {
      throw new Error(`${vol.row}: end anchor mismatch at line ${vol.bodyEnd}: got "${got}"`);
    }
  }

  const freq = capsFrequencies(lines.slice(vol.bodyStart - 1, vol.bodyEnd - 1));
  const headMatch = buildHeadMatcher(vol);

  const pieces = [];
  let totalWords = 0;
  for (let c = 0; c < vol.chapters.length; c++) {
    const ch = vol.chapters[c];
    const from = ch.line - 1;
    const to = c + 1 < vol.chapters.length ? vol.chapters[c + 1].line - 1 : vol.bodyEnd - 1;
    const seg = lines.slice(from, to);
    const paragraphs = processSegment(seg, vol, freq, headMatch, ch.extraSkip);
    if (paragraphs.length < 3) {
      throw new Error(`${vol.row}: chapter ${c + 1} ("${ch.title}") produced only ${paragraphs.length} paragraphs`);
    }
    const heading = `Chapter ${c + 1}.--${ch.title}.`;
    pieces.push(heading, ...paragraphs);
    totalWords += paragraphs.join(' ').split(/\s+/).length;
  }

  const header = [
    `# source: The Works of Philo Judaeus, the Contemporary of Josephus, tr. C. D. Yonge, Vol. ${vol.volRoman} (London: Henry G. Bohn, ${vol.year})`,
    `# series: Bohn's Ecclesiastical Library`,
    `# father: Philo of Alexandria`,
    `# work: ${vol.work}`,
    `# translator: C. D. Yonge`,
    `# extracted: ${EXTRACTED}`,
    `# origin: data/pd-english-sources/cache/${vol.row}.txt (${vol.url})`,
    `# note: Public-domain ${vol.year} translation. Machine-cleaned from the Archive.org OCR scan; page furniture removed; footnotes not restored. Some scanner misreadings may remain.`,
  ].join('\n');

  const outPath = path.join(OUT_DIR, vol.file);
  fs.writeFileSync(outPath, header + '\n\n' + pieces.join('\n\n') + '\n', 'utf8');
  const stat = { file: vol.file, chapters: vol.chapters.length, words: totalWords };
  report.push(stat);
  console.log(`${vol.file}: ${stat.chapters} chapters, ~${stat.words} words -> ${outPath}`);
}

console.log('Done.');
