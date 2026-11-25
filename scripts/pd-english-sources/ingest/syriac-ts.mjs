// Ingest script: Syriac-related Texts and Studies / Horae Semiticae / Studia Sinaitica /
// Text and Translation Society volumes (Archive.org OCR) -> Fathers/English works.
//
// Sources (data/pd-english-sources/cache/):
//   s5-ts-narsai.txt             Connolly, The Liturgical Homilies of Narsai (1909)
//   s5-ts-odes-harris-mingana.txt Harris & Mingana, Odes and Psalms of Solomon II (1920)
//   s5-hs-didascalia.txt         Gibson, The Didascalia Apostolorum in English (1903)
//   s5-cowper-miscellanies.txt   Cowper, Syriac Miscellanies (1861)
//   s5-tts-euphemia.txt          Burkitt, Euphemia and the Goth (1913)
//   s5-ss-holy-women.txt         Lewis, Select Narratives of Holy Women (1900)
//   s5-hs-forty-martyrs.txt      Lewis, The Forty Martyrs of the Sinai Desert (1912)
//   s5-ss-apocrypha-sinaitica.txt Gibson, Apocrypha Sinaitica (1896)
//
// Usage: node scripts/pd-english-sources/ingest/syriac-ts.mjs [workId ...]
//   (no args = all). Work ids: narsai odes psalms didascalia cowper euphemia
//   holywomen fortymartyrs apocrypha

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..', '..');
const CACHE_DIR = path.join(ROOT, 'data', 'pd-english-sources', 'cache');
const OUT_ROOT = path.join(ROOT, 'Fathers', 'English');
const EXTRACTED = '2026-11-18';

// ---------------------------------------------------------------- utilities

function readCache(id) {
  const raw = fs.readFileSync(path.join(CACHE_DIR, id + '.txt'), 'utf8');
  return raw.replace(/\r\n/g, '\n').split('\n').map((l) => l.replace(/\s+$/, ''));
}

function findLine(lines, re, from = 0) {
  for (let i = from; i < lines.length; i++) if (re.test(lines[i])) return i;
  return -1;
}

const HEADING = ''; // sentinel prefix: line is a structural heading

function collapse(s) {
  return s
    .replace(/[ \t ]+/g, ' ')
    .replace(/ ([,.;:!?])/g, '$1')
    .trim();
}

// conservative, verifiable OCR misread fixes
function fixOcr(s) {
  return s
    .replace(/\btbe\b/g, 'the')
    .replace(/\bTbe\b/g, 'The')
    .replace(/\bancl\b/g, 'and')
    .replace(/\baud\b/g, 'and')
    .replace(/\bwbich\b/g, 'which')
    .replace(/\bwbo\b/g, 'who');
}

// lines -> paragraphs. '' = paragraph break; HEADING-prefixed line = its own paragraph.
function reflow(lines) {
  const paras = [];
  let cur = '';
  const push = () => {
    const p = collapse(fixOcr(cur));
    if (p) paras.push(p);
    cur = '';
  };
  for (const line of lines) {
    if (line === '') {
      push();
      continue;
    }
    if (line.startsWith(HEADING)) {
      push();
      paras.push(HEADING + collapse(line.slice(1)));
      continue;
    }
    const t = line.trim();
    if (!cur) {
      cur = t;
    } else if (/[¬]$/.test(cur)) {
      cur = cur.slice(0, -1) + t; // printed soft hyphen
    } else if (/[A-Za-z]-$/.test(cur) && /^[a-z]/.test(t)) {
      cur = cur.slice(0, -1) + t; // end-of-line hyphenation
    } else {
      cur += ' ' + t;
    }
  }
  push();
  // A page break is a blank line in the middle of a sentence.
  const merged = [];
  for (const p of paras) {
    const prev = merged[merged.length - 1];
    if (
      prev &&
      !prev.startsWith(HEADING) &&
      !p.startsWith(HEADING) &&
      !/[.!?:;"'”’)\]]$/.test(prev) &&
      /^[a-z‘“("']/.test(p)
    ) {
      merged[merged.length - 1] = (prev.endsWith('-') ? prev.slice(0, -1) : prev + ' ') + p;
    } else {
      merged.push(p);
    }
  }
  return merged;
}

function writeWork({ folder, file, header, paragraphs }) {
  const dir = path.join(OUT_ROOT, folder);
  fs.mkdirSync(dir, { recursive: true });
  const body = paragraphs
    .map((p) => (p.startsWith(HEADING) ? p.slice(1) : p))
    .join('\n\n');
  const content = header.join('\n') + '\n\n' + body + '\n';
  fs.writeFileSync(path.join(dir, file), content, 'utf8');
  const words = body.split(/\s+/).length;
  const units = paragraphs.filter((p) => p.startsWith(HEADING)).length;
  console.log(`${folder}/${file}: ${units} headings, ${words} words, ${paragraphs.length} paragraphs`);
}

function header({ source, series, father, work, translator, rowId, url, year }) {
  const h = [
    `# source: ${source}`,
    ...(series ? [`# series: ${series}`] : []),
    `# father: ${father}`,
    `# work: ${work}`,
    ...(translator ? [`# translator: ${translator}`] : []),
    `# extracted: ${EXTRACTED}`,
    `# origin: data/pd-english-sources/cache/${rowId}.txt (${url})`,
    `# note: Public-domain ${year} translation. Machine-cleaned from the Archive.org OCR scan; page furniture removed; footnotes not restored. Some scanner misreadings may remain.`,
  ];
  return h;
}

// Split a run of lines into "pages": a new page starts at each line matching one
// of the running-head regexes (the matching line itself is discarded).
function splitPages(lines, headRes) {
  const pages = [[]];
  for (const line of lines) {
    if (headRes.some((re) => re.test(line.trim()))) {
      pages.push([]);
      continue;
    }
    pages[pages.length - 1].push(line);
  }
  return pages;
}

// Drop blank-line-separated blocks (within a list of lines) whose first line
// matches any of the given regexes.
function dropBlocks(lines, blockRes) {
  const out = [];
  let dropping = false;
  let atBlockStart = true;
  for (const line of lines) {
    if (line.trim() === '') {
      dropping = false;
      atBlockStart = true;
      out.push('');
      continue;
    }
    if (atBlockStart) {
      dropping = blockRes.some((re) => re.test(line.trim()));
      atBlockStart = false;
    }
    if (!dropping) out.push(line);
  }
  return out;
}

const ROMAN = { i: 1, v: 5, x: 10, l: 50, c: 100, d: 500, m: 1000 };
function romanToInt(s) {
  s = s.toLowerCase();
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const v = ROMAN[s[i]] || 0;
    const nx = ROMAN[s[i + 1]] || 0;
    n += v < nx ? -v : v;
  }
  return n;
}

// ---------------------------------------------------------------- 1. Narsai

function buildNarsai() {
  const lines = readCache('s5-ts-narsai');
  const start = findLine(lines, /^HOMILY XVII \(A\)\.?\s*$/);
  const end = findLine(lines, /^ADDITIONAL NOTES\s*$/, start);
  if (start < 0 || end < 0) throw new Error('narsai anchors not found');
  const slice = lines.slice(start, end);

  const TITLES = {
    XVII: 'An Exposition of the Mysteries',
    XXII: 'On Baptism',
    XXI: 'On the Mysteries of the Church and on Baptism',
    XXXII: 'On the Church and on the Priesthood',
  };

  const out = [];
  let skipSubtitle = 0;
  for (let raw of slice) {
    let line = raw.trim();
    const hm = line.match(/^HOMILY ([IVXL]+) \(([A-D])\)\.?\s*$/);
    if (hm) {
      out.push('');
      out.push(`${HEADING}Homily ${hm[1]}.--${TITLES[hm[1]]} (${hm[2]}).`);
      out.push('');
      skipSubtitle = 8; // skip the printed caps subtitle lines just after
      continue;
    }
    if (line === '') {
      out.push('');
      continue;
    }
    // Printed subtitle under the homily heading is a short capitals line.
    // Do not treat a prose line that happens to begin with those words as a subtitle
    // ("On the Mysteries of the Church my thoughts mystically...").
    const capsSubtitle =
      skipSubtitle > 0 &&
      line.length < 55 &&
      !/[a-z]/.test(line) &&
      /EXPOSITION|BAPTISM|MYSTERIES|CHURCH|PRIESTHOOD|vol\./i.test(line);
    if (capsSubtitle || (skipSubtitle > 0 && /^vol\.?\s*i+\.?$/i.test(line))) {
      skipSubtitle--;
      continue;
    }
    skipSubtitle = 0;
    if (/^\d*\s*(AN EXPOSITION|ON BAPTISM|ON THE MYSTERIES|ON THE CHURCH AND|HOMILY [IVXL]+)/.test(line)) continue;
    if (/^\d+\s+HOMILY/.test(line)) continue;
    if (/^(vol\.? ?i+\.?|p\. ?\d+|[σς]\. ?\d*|[A-Z]\. ?\d*|\d+|[ivxlc]+)$/.test(line)) continue;
    // marginal page refs glued to line ends
    line = line.replace(/\s+(vol\. ?i+|p\. ?\d+)\s*$/g, '');
    line = line.replace(/\s+(vol\. ?i+|p\. ?\d+)(?=\s)/g, '');
    out.push(line);
  }

  // footnote blocks: paragraph starting with a digit / * / † / : marker
  const cleaned = dropBlocks(out, [/^[0-9*†‡:] ?\S/]);
  const paragraphs = reflow(cleaned);
  writeWork({
    folder: 'Narsai_English',
    file: 'The Liturgical Homilies.txt',
    header: header({
      source: 'R. H. Connolly, The Liturgical Homilies of Narsai (Cambridge: Cambridge University Press, 1909)',
      series: 'Texts and Studies VIII.1',
      father: 'Narsai',
      work: 'The Liturgical Homilies',
      translator: 'R. H. Connolly',
      rowId: 's5-ts-narsai',
      url: 'https://archive.org/details/liturgicalhomili00narsuoft',
      year: 1909,
    }),
    paragraphs,
  });
}

// ---------------------------------------------------------------- 2. Odes / Psalms of Solomon

function odesCommonStrip(line) {
  // marginal cross-references glued into verse lines
  let l = line;
  // trailing "Cf. ..." / "cf. ..." reference
  l = l.replace(/\s+C[fi!1]\.?\s+[A-Za-z].*$/, (m) => (/^\s+C[fi!1]\.?\s/.test(m) ? '' : m));
  l = l.replace(/\s+cf\.?\s+\S.*$/, '');
  l = l.replace(/\s+p\.\s*\S{0,16}$/i, '');
  l = l.replace(/\s+Ps\*.*$/i, '');
  l = l.replace(/\s+Ephr\..*$/, '');
  l = l.replace(/\s+\^.*$/, '');
  l = l.replace(/\s*Ephr\.?\s*R\.?\s*E\.?\s*[ivxlcdm.\d\s]*/gi, ' ');
  l = l.replace(/\s*cf>\s*Ephr#\s*\S+\s*/gi, ' ');
  l = l.replace(/\s*Hymn['’]?\s*[ivx]+-?\s*\d+-?/gi, ' ');
  l = l.replace(/^[I1]\^a\.\s*[ivxlc.\d,\s]+and\s+/i, '');
  // leading "Cf. Ps. xxi. 12." style reference before the verse
  l = l.replace(/^(?:C[fi]\.?\s+)?(?:[1-3]\s+)?(?:Ps|Prov|Isa?|Is|Matt|Mark|Luke|John|Acts|Rom|Cor|Gal|Eph|Phil|Col|Thess|Tim|Tit|Heb|Jas|Pet|Apoc|Rev|Gen|Ex|Exod|Deut|Sap|Sir|Jer|Ezek|Lam|Hos|Joel|Zech|Mal|Cant|Eccl[eu]s)\.?\s+[ivxlc]+[.,]?\s*(?:\d+[.,]?\s*)*(?:and\s*)?(?=\d|\()/, '');
  return l;
}

function buildOdes() {
  const lines = readCache('s5-ts-odes-harris-mingana');
  const start = findLine(lines, /^ODES\s+OF\s+SOLOMON\s*$/, 9000);
  const end = findLine(lines, /^THE\s+PSALMS\s+OF\s+SOLOMON\s*$/, start);
  if (start < 0 || end < 0) throw new Error('odes anchors not found');
  const slice = lines.slice(start + 1, end);

  // Running heads: "208  ODES OF SOLOMON  [i" / "i]  ODES OF SOLOMON  209"
  const headRe = /ODES\s+OF\.?\s+SOLOMON/;

  const out = [];
  let inText = false; // between "ODE N" and "Expository Notes."
  let pendingFootnote = false;
  for (let raw of slice) {
    let line = raw.trim().replace(/\s{2,}/g, ' ');
    // Uppercase only: the notes quote "Ode xviii." as a sentence-case line.
    const om = line.match(/^ODE\s+([IVXL]+)\s*\.?\s*$/);
    if (om) {
      const n = romanToInt(om[1]);
      out.push('');
      out.push(`${HEADING}Chapter ${n}.--Ode ${n}.`);
      out.push('');
      inText = true;
      pendingFootnote = false;
      continue;
    }
    if (!inText) continue;
    // "Expository Xotcs." is the same heading with the N misread.
    // "Critical Notes." is the textual apparatus that precedes the exposition.
    if (/^Expository\b/i.test(line) || /^Critic\w*\s+\w+/i.test(line)) {
      inText = false;
      continue;
    }
    if (line === '') {
      out.push('');
      pendingFootnote = false;
      continue;
    }
    if (headRe.test(line)) continue;
    // a marginal citation sharing the verse's line: "Cf. 1 Cor. xiv. 7. 23b And..."
    line = line.replace(/^(?:Cf\.?|C[fi]\.?|Euseb\.)\s+.{0,60}?\.\s+(?=\d{1,2}[a-z]?\s)/, '');
    if (/^(?:Cf\.?|C[fi]\.?|Euseb\.|\(?LXX\)?\.?)$/.test(line)) continue;
    if (/^(?:Cf\.?|C[fi]\.?|Euseb\.)\s/.test(line) && line.length < 80) continue;
    if (/^\d+\s+MS\.\s/i.test(line) || /^\d+\s+Perhaps\b/.test(line) || /^\d+\s+Lit\b/.test(line)) continue;
    // verse-notes printed in the margin ("v. 4. Labourt proposes...")
    if (/^v+\.?\s*\d/i.test(line)) continue;
    // footnote blocks (translator apparatus) inside the ode text
    if (/^[0-9*†] ?(Or|Lit|See|Reading|Syr|Cf|cf|i\.? ?e|Omitting|Pointing|Frankenberg|Schulthess|Harnack|The (text|Syriac)|Lacuna|Perhaps|lit)/.test(line)) {
      pendingFootnote = true;
      continue;
    }
    if (pendingFootnote && !/^\(?\d+\)?\s/.test(line)) continue; // footnote continuation
    pendingFootnote = false;
    line = odesCommonStrip(line);
    // standalone marginal citation fragments
    if (/^(v|vv|and|or|p|Ci|Cf|cf)[.,]? [\S ]{0,20}$/.test(line) && !/^(and|or) [a-z]{3,}/.test(line)) continue;
    if (/^[^a-z]{1,14}$/.test(line) && /\d/.test(line)) continue; // e.g. XIX" 23'
    if (line === '') continue;
    out.push(line);
  }

  // verse-aware reflow: a line starting with a verse number begins a new paragraph
  const verseLines = [];
  for (const line of out) {
    if (line === '' || line.startsWith(HEADING)) {
      verseLines.push(line);
      continue;
    }
    const vm = line.match(/^(\d{1,2})\s+(.*)$/);
    const rm = line.match(/^([ivx]{1,4})\s+([A-Z“"'].*)$/);
    if (vm) {
      verseLines.push('');
      verseLines.push(`${vm[1]}. ${vm[2]}`);
    } else if (rm && romanToInt(rm[1]) > 0 && romanToInt(rm[1]) < 40) {
      verseLines.push('');
      verseLines.push(`${romanToInt(rm[1])}. ${rm[2]}`);
    } else {
      verseLines.push(line);
    }
  }
  const paragraphs = reflow(verseLines);
  writeWork({
    folder: 'Odes_Solomon_English',
    file: 'The Odes of Solomon.txt',
    header: header({
      source: 'J. Rendel Harris and A. Mingana, The Odes and Psalms of Solomon, Vol. II: The Translation (Manchester: University Press, 1920)',
      series: 'John Rylands Library edition',
      father: 'Odes of Solomon',
      work: 'The Odes of Solomon',
      translator: 'J. Rendel Harris; A. Mingana',
      rowId: 's5-ts-odes-harris-mingana',
      url: 'https://archive.org/details/odespsalmsofsolo02harruoft',
      year: 1920,
    }),
    paragraphs,
  });
}

function buildPsalms() {
  const lines = readCache('s5-ts-odes-harris-mingana');
  const start = findLine(lines, /^THE\s+PSALMS\s+OF\s+SOLOMON\s*$/, 9000);
  const end = findLine(lines, /^A\s+NEW\s+FRAGMENT\s+OF\s+THE\s+PSALMS/, start);
  if (start < 0 || end < 0) throw new Error('psalms anchors not found');
  const slice = lines.slice(start + 1, end);

  const out = [];
  let count = 0;
  for (let raw of slice) {
    let line = raw.trim().replace(/\s{2,}/g, ' ');
    const pm = line.match(/^PSALM\s+([IVXL]+)(\s*\(.*\))?\s*$/);
    if (pm) {
      count++;
      out.push('');
      out.push(`${HEADING}Chapter ${count}.--Psalm ${count}.`);
      out.push('');
      continue;
    }
    if (/^Psalms\s+of\s+Solomon\s+[IVXL]+\.?\s*$/i.test(line)) continue; // subtitle folded into heading
    if (line === '') {
      out.push('');
      continue;
    }
    if (/PSALMS\s+OF\s+SOLOMON/.test(line)) continue; // running heads
    if (/^[0-9*†‡] ?(Or|Lit|See|Reading|Syr|Cf|cf|i\.? ?e|Omitting|lit|The text)/.test(line)) continue; // footnotes
    if (/^(\d+|[ivxlc]+|[0-9]+ ?F ?f?|F f)$/.test(line)) continue; // page numbers, signatures
    if (/^Caetera desunt\.?$/i.test(line)) continue; // editor's Latin note
    line = line.replace(/([a-z,;:.!?'")\]])\d{1,2}(?=[\s.,;:]|$)/g, '$1'); // glued footnote markers
    out.push(line);
  }
  const paragraphs = reflow(out);
  writeWork({
    folder: 'Odes_Solomon_English',
    file: 'The Psalms of Solomon.txt',
    header: header({
      source: 'J. Rendel Harris and A. Mingana, The Odes and Psalms of Solomon, Vol. II: The Translation (Manchester: University Press, 1920)',
      series: 'John Rylands Library edition',
      father: 'Odes of Solomon',
      work: 'The Psalms of Solomon',
      translator: 'J. Rendel Harris; A. Mingana',
      rowId: 's5-ts-odes-harris-mingana',
      url: 'https://archive.org/details/odespsalmsofsolo02harruoft',
      year: 1920,
    }),
    paragraphs,
  });
}

// ---------------------------------------------------------------- 3. Didascalia

function buildDidascalia() {
  const lines = readCache('s5-hs-didascalia');
  const start = findLine(lines, /^CHAPTER\s+I\.?\s*$/, 1500);
  const end = findLine(lines, /^APPENDIX\.?\s*$/, start);
  if (start < 0 || end < 0) throw new Error('didascalia anchors not found');
  const slice = lines.slice(start, end);

  const BOOKS = '(?:[1-3] )?(?:Gen|Ex|Exod|Lev|Num|Deut|Josh|Judg|Ruth|Sam|Kings|Chron|Ezra|Neh|Esth|Job|Ps|Prov|Eccl[eu]s?|Cant|Isa?|Jer|Lam|Ezek|Dan|Hos|Joel|Amos|Obad|Jon|Mic|Nah|Hab|Zeph|Hag|Zech|Mal|Tob|Wisd|Sir|Bar|Macc|Matt|Mark|Luke|John|Acts|Rom|Cor|Gal|Eph|Phil|Col|Thess|Tim|Tit|Philem|Heb|Jas|Pet|Jude|Rev|Apoc)';
  const refNum = '[ivxlc]+\\.? ?[0-9]*[.,]? ?[0-9]*';
  const leadRef = new RegExp(`^(?:Ap\\. con\\.|Ezekiel|Isaiah|Jeremiah|${BOOKS}\\.? ${refNum})\\s+(?=[a-z"'(])`);
  const tailRef = new RegExp(`\\s+(?:Ap\\. con\\.|${BOOKS}\\.? ${refNum})\\s*$`);

  const out = [];
  let skipArgument = false; // Gibson's one-line chapter argument under Chapter I
  for (let raw of slice) {
    let line = raw.trim().replace(/\s{2,}/g, ' ');
    const cm = line.match(/^CHAPTER\s+([IVXL]+)\.?\s*$/);
    if (cm) skipArgument = false;
    if (cm) {
      out.push('');
      out.push(`${HEADING}Chapter ${cm[1]}.`);
      out.push('');
      continue;
    }
    if (line === '') {
      out.push('');
      continue;
    }
    if (/DIDASCALIA/i.test(line) && line.length < 32 && !/[a-z]/.test(line)) continue; // running heads
    if (/^(\d+|[ivxlc]+)$/.test(line)) continue; // bare page numbers
    // Page-bottom Syriac-variant notes ("1 S. Churches.", "S. om. God.").
    if (/^\d+\s+S\.\s/.test(line) || (/^S\.\s/.test(line) && line.length < 180)) continue;
    if (/^G\. ?D\.?$/.test(line)) continue; // signature marks
    line = line.replace(/\bf\. ?\d+ ?[ab]\b\.?/g, ' '); // folio marks
    line = line.replace(tailRef, '');
    line = line.replace(leadRef, '');
    // The codex repeats "Chapter I. [About ...]" at the start of the text.
    // Leave it in and the site's chapter splitter sees a second Chapter I.
    line = line.replace(/^Chapter\s+[IVXLCDM]+\.?\s+\\.+?J\]\s*/i, '');
    if (/^Teaches all men in general\b/.test(line)) {
      skipArgument = true;
      continue;
    }
    if (skipArgument) {
      if (/^["“]/.test(line) || /^The Didascalia\b/.test(line) || /^Chapter\s+[IVXL]+/i.test(line)) skipArgument = false;
      else continue;
    }
    if (/^\(?Codex Sangerman\b/.test(line)) continue;
    line = line.replace(/^\d{1,2}\s+(?=[A-Za-z"'(])/, ''); // marginal verse numbers
    line = line.replace(/([a-z,;:.!?'")\]])\d{1,2}(?=[\s.,;:]|$)/g, '$1'); // glued footnote markers
    line = line.replace(/(^|\s)\d([a-z]{3,})/g, '$1$2'); // marker glued before a word
    line = collapse(line);
    if (line === '') continue;
    out.push(line);
  }

  // footnote blocks at page bottoms: "1 S. Churches." / "2 S. are ..." etc.
  const cleaned = dropBlocks(out, [/^[0-9*†‡] ?(S\.|Cod|Lagarde|Syr|Omit|[Ll]it\.|Reading|See|Ap\. con|is wanting)/]);
  const paragraphs = reflow(cleaned);
  writeWork({
    folder: 'Didascalia_English',
    file: 'The Didascalia Apostolorum.txt',
    header: header({
      source: 'Margaret Dunlop Gibson, The Didascalia Apostolorum in English (London: C. J. Clay and Sons, 1903)',
      series: 'Horae Semiticae II',
      father: 'Didascalia',
      work: 'The Didascalia Apostolorum',
      translator: 'Margaret Dunlop Gibson',
      rowId: 's5-hs-didascalia',
      url: 'https://archive.org/details/didascaliaaposto00gibsuoft',
      year: 1903,
    }),
    paragraphs,
  });
}

// ---------------------------------------------------------------- 4. Cowper, Syriac Miscellanies

function buildCowper() {
  const lines = readCache('s5-cowper-miscellanies');
  const start = findLine(lines, /^THE\s+COUNCIL\s+OF\s+NICEA\.?\s*$/, 290);
  const end = findLine(lines, /^OBSE[RK]VATIONS\.?\s*$/, start);
  if (start < 0 || end < 0) throw new Error('cowper anchors not found');
  const slice = lines.slice(start, end);

  const chapters = [
    [/^THE\s+COUNCIL\s+OF\s+NICEA\.?$/, 'The Council of Nicea (Paris MS.).', 2],
    [/^EXTRACTS\s+FROM\s+THE\s+SYRIAC\s+MS\.?\s+NO\.?\s+14,?528/, 'Extracts from the Syriac MS. 14528 in the British Museum.', 1],
    [/^GREEK\s+LIST\s+O[EF]\s+THEODORUS\.?$/, 'Nicene Catalogue of Theodorus Lector.', 0],
    [/^COPTIC\s+LIST\.?$/, 'Fragments of a Coptic List of the Nicene Fathers.', 0],
    [/^COUNCIL\s+OF\s+CONSTANTINOPLE/, 'The Council of Constantinople.', 0],
    [/^COUNCILS\s+OF\s+ANTIOCH,?\s+ANCY[RK]A/, 'The Councils of Antioch, Ancyra, Caesarea, Gangra, and Laodicea.', 0],
    [/^FRAGMENT\s*:?\s*CONTAINING\s+EXTRACTS\s+FROM\s+GREEK\s+AUTHORS\.?$/, 'Fragments of Greek Authors.', 0],
    [/^DIOCLES\./, 'Diocles on the Origin of Rome.', 0],
    [/^EXTRACTS\s+FROM\s+CHRISTIAN\s+AUTHORS\.?$/, 'Extracts from Christian Authors.', 0],
    [/^CH[ER]ONOLOGICAL\s+ITEMS/, 'Miscellaneous Chronological Items.', 0],
    [/^EXTRACTS\s+FROM\s+CHRONICLE\.?$/, 'Extracts from a Chronicle.', 0],
    [/^NOTICE\s+OF\s+COUNCILS\.?$/, 'Notice of Early Councils.', 0],
    [/^MAHOMET\s+AND\s+HIS\s+SUCCESSO/, 'Mahomet and His Successors.', 0],
    [/^PORTIONS\s+OF\s+TWO\s+MARTYROLOGIES\.?$/, 'Portions of Two Martyrologies.', 0],
  ];

  const out = [];
  let chapIdx = 0;
  let skipCaps = 0; // caps subtitle lines to skip after a chapter heading
  for (let raw of slice) {
    let line = raw.trim();
    if (chapIdx < chapters.length && chapters[chapIdx][0].test(line)) {
      const [, title, skip] = chapters[chapIdx];
      chapIdx++;
      out.push('');
      out.push(`${HEADING}Chapter ${chapIdx}.--${title}`);
      out.push('');
      skipCaps = skip;
      continue;
    }
    if (line === '') {
      out.push('');
      continue;
    }
    if (skipCaps > 0 && /^[A-Z0-9 .,;:'()-]+$/.test(line)) {
      skipCaps--;
      continue;
    }
    skipCaps = 0;
    if (/S[YV1I]+[RIU1]+[AI]+N\s+\.?M[I1]SCELLAN[I1E]+S/i.test(line) && line.length < 40) continue; // running heads
    if (/^(\d+|[ivxlc]+|[A-Z])$/.test(line)) continue; // bare page numbers
    if (/^NAMES\s+OF\s+THE\s+BISHOPS\.?$/.test(line)) {
      out.push('');
      out.push('Names of the Bishops.');
      out.push('');
      continue;
    }
    if (/^AT\s+ANTI/.test(line)) {
      out.push('');
      out.push(collapse(line.replace(/0/g, 'O').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())));
      out.push('');
      continue;
    }
    line = line.replace(/([a-z,;:.!?'")\]])\d{1,3}(?=[\s.,;:]|$)/g, '$1'); // glued footnote markers
    line = line.replace(/\s*[*#]+\s*$/, '.').replace(/\.\.$/, '.'); // name-list markers
    out.push(line);
  }

  const cleaned = dropBlocks(out, [/^[*†‡§] ?\S/]);
  const paragraphs = reflow(cleaned);
  writeWork({
    folder: 'Apostolic_English',
    file: 'Syriac Miscellanies.txt',
    header: header({
      source: 'B. Harris Cowper, Syriac Miscellanies; or Extracts Relating to the First and Second General Councils (London: Williams and Norgate, 1861)',
      series: null,
      father: 'Apostolic and Early Documents',
      work: 'Syriac Miscellanies',
      translator: 'B. Harris Cowper',
      rowId: 's5-cowper-miscellanies',
      url: 'https://archive.org/details/syriacmiscellani00cowp',
      year: 1861,
    }),
    paragraphs,
  });
}

// ---------------------------------------------------------------- 5. Euphemia and the Goth

function buildEuphemia() {
  const lines = readCache('s5-tts-euphemia');
  const start = findLine(lines, /^I\.\s+MARTYRDOM\s+OF\s+SHMONA\s+AND\s+GURIA,?\s*$/, 4000);
  const end = findLine(lines, /^APPENDIX\s+I\.?\s*$/, start);
  if (start < 0 || end < 0) throw new Error('euphemia anchors not found');
  const slice = lines.slice(start, end);

  // page segmentation: running heads
  const headRes = [
    /^TRANSLATIONS[.,]?\s*\d*$/,
    /^S[IH]+MONA\s+AND\s+GU[RT]+[I1l]A[.,]?\s*\d*$/,
    /^HABB[I1]B[.,]?\s*\d*$/,
    /^EUPHEM[I1]A[.,]?\s*[0-9IJl]*\s*$/,
    /^[0-9IJlOo]{1,4}$/, // bare page numbers (OCR often garbles digits)
  ];
  const pages = splitPages(slice, headRes);

  const apparatusStart = (l) => {
    const t = l.trim();
    if (/^(Variants|Title in P|Subscription in P|The Doctrine of Addai)/.test(t)) return true;
    if (/^\d+(\s*[—–-]+\s*\d+)?\s+\S.*\]/.test(t)) return true; // "12 Martyrs ....] P ..."
    if (/^[*^]?\d+\)\s/.test(t)) return true; // "1) What follows..."
    if (/^[*†‡]\s?\S/.test(t)) return true;
    return false;
  };

  const pieceHeading = (line) =>
    /^I\.\s+MARTYRDOM\s+OF\s+SHMONA/.test(line) ||
    /^(II\.\s+)?MARTYRDOM\s+OF\s+HABBIB\s+THE/.test(line) ||
    /^THE\s+STORY\s+OF\s+EUPHEM/.test(line);

  const out = [];
  for (const page of pages) {
    // cut page at first apparatus line. A new piece's title is sometimes
    // OCR'd after that page's footnotes, so keep those title lines.
    let cut = page.length;
    for (let i = 0; i < page.length; i++) {
      if (page[i].trim() !== '' && apparatusStart(page[i])) {
        cut = i;
        break;
      }
    }
    const rescued = page.slice(cut).map((l) => l.trim()).filter(pieceHeading);
    for (let raw of page.slice(0, cut).concat(rescued)) {
      let line = raw.trim();
      if (line === '') {
        out.push('');
        continue;
      }
      if (/^I\.\s+MARTYRDOM\s+OF\s+SHMONA/.test(line)) {
        out.push('');
        out.push(`${HEADING}Chapter 1.--The Martyrdom of Shmona and Guria, Confessors of Edessa.`);
        out.push('');
        continue;
      }
      if (/^CONFESSORS\s+OF\s+EDESSA\.?\s*$/.test(line)) continue;
      if (/^(II\.\s+)?MARTYRDOM\s+OF\s+HABBIB\s+THE(\s+DEACON\.?)?\s*$/.test(line)) {
        if (/^II\./.test(line)) {
          out.push('');
          out.push(`${HEADING}Chapter 2.--The Martyrdom of Habbib the Deacon.`);
          out.push('');
        }
        continue;
      }
      if (/^DEACON\.?\s*$/.test(line)) continue;
      if (/^THE\s+STORY\s+OF\s+EUPHEM[I1]A\.?\s*$/.test(line)) {
        out.push('');
        out.push(`${HEADING}Chapter 3.--The Story of Euphemia and the Goth.`);
        out.push('');
        continue;
      }
      if (/^(I{1,3}\.\s+)?(SHMONA AND GURIA|HABBIB|EUPHEMIA AND THE GOTH)\.?\s*$/.test(line)) continue; // list of contents on part title
      // marginal line counters (multiples of 5) at start or end of line
      const lead = line.match(/^(\d{1,3})\s+(.*)$/);
      if (lead && (Number(lead[1]) % 5 === 0 || Number(lead[1]) <= 9)) line = lead[2];
      const tail = line.match(/^(.*\S)\s+(\d{1,3})$/);
      if (tail && Number(tail[2]) % 5 === 0 && Number(tail[2]) > 0) line = tail[1];
      line = line.replace(/([a-z,;:.!?’'")\]])\d{1,2}(?=[\s.,;:]|$)/g, '$1'); // glued markers
      line = line.replace(/\s\d\)\s/g, ' '); // inline "1)" markers
      out.push(line);
    }
  }
  const paragraphs = reflow(out);
  writeWork({
    folder: 'Apostolic_English',
    file: 'Euphemia and the Goth.txt',
    header: header({
      source: 'F. C. Burkitt, Euphemia and the Goth, with the Acts of Martyrdom of the Confessors of Edessa (London: Williams and Norgate, 1913)',
      series: 'Text and Translation Society',
      father: 'Apostolic and Early Documents',
      work: 'Euphemia and the Goth',
      translator: 'F. C. Burkitt',
      rowId: 's5-tts-euphemia',
      url: 'https://archive.org/details/euphemiagothwith00burk',
      year: 1913,
    }),
    paragraphs,
  });
}

// ---------------------------------------------------------------- 6. Select Narratives of Holy Women

function buildHolyWomen() {
  const lines = readCache('s5-ss-holy-women');
  const start = findLine(lines, /^SELECT NARRATIVES\.?\s*$/, 1400);
  if (start < 0) throw new Error('holywomen start not found');
  const slice = lines.slice(start + 1);

  const NAMES = [
    'Eugenia',
    'Mary, called Marinus',
    'Euphrosyne',
    'Onesima',
    'Drusis',
    'Barbara',
    'Mary, Slave of Tertullius',
    'Irene',
    'Euphemia',
    'Sophia',
    'Cyprian and Justa',
  ];

  const out = [];
  for (let raw of slice) {
    let line = raw.trim();
    if (line === '') {
      out.push('');
      continue;
    }
    if (/^[A-Z][A-Z .,':0-9-]{2,60}$/.test(line) && !/[a-z]/.test(line)) continue; // caps running heads
    if (/^(\d+|[ivxlc]+|[A-Z]|L\. ?E\. ?\*? ?[A-Z0-9]*)$/.test(line)) continue; // page nos, signatures
    if (/^[\d\s]{1,7}$/.test(line)) continue; // "4 8" page numbers
    if (/^L\.?\s*E\.?\b/i.test(line)) continue; // signature marks
    if (/^[0O]NES[I1]MA\.?$/i.test(line)) continue; // garbled running head
    if (/^SI$/.test(line)) continue;
    if (/google/i.test(line) || /Hosted by/.test(line)) continue;
    line = line.replace(/\bf\. ?\d+ ?[ab]\b\.?/g, ' '); // folio marks
    line = line.replace(/([a-z,;:.!?'")\]])\d{1,2}(?=[\s.,;:]|$)/g, '$1'); // glued markers
    line = collapse(line);
    if (line === '') continue;
    out.push(line);
  }

  const cleaned = dropBlocks(out, [/^[0-9*†‡] ?(Cod|Sic|See|Lit|lit|Or|Syr|Gk|i\.? ?e|MS|Erased|In the)/]);
  let paragraphs = reflow(cleaned);

  // cut at the scribe's closing sentence, keeping it
  const endIdx = paragraphs.findIndex((p) => /^Here endeth this book of the Select Narratives/.test(p));
  if (endIdx >= 0) paragraphs = paragraphs.slice(0, endIdx + 1);

  // insert chapter headings: ch.1 after the opening invocation paragraph,
  // ch.N+1 after each "Here endeth" paragraph
  const withHeads = [];
  let n = 0;
  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    withHeads.push(p);
    const isInvocation = i === 0 && /I begin, I the sinner/.test(p);
    const isEnd = /Here endeth/.test(p) && n < NAMES.length;
    if ((isInvocation || isEnd) && n < NAMES.length) {
      // only start a new chapter if more text follows
      if (i + 1 < paragraphs.length - 0 && !(i + 1 === paragraphs.length)) {
        withHeads.push(`${HEADING}Chapter ${n + 1}.--${NAMES[n]}.`);
        n++;
      }
    }
  }
  writeWork({
    folder: 'Apostolic_English',
    file: 'Select Narratives of Holy Women.txt',
    header: header({
      source: 'Agnes Smith Lewis, Select Narratives of Holy Women (London: C. J. Clay and Sons, 1900)',
      series: 'Studia Sinaitica X',
      father: 'Apostolic and Early Documents',
      work: 'Select Narratives of Holy Women',
      translator: 'Agnes Smith Lewis',
      rowId: 's5-ss-holy-women',
      url: 'https://archive.org/details/SelectNarrativesOfHolyWomen10',
      year: 1900,
    }),
    paragraphs: withHeads,
  });
}

// ---------------------------------------------------------------- 7. Forty Martyrs

function buildFortyMartyrs() {
  const lines = readCache('s5-hs-forty-martyrs');
  const start = findLine(lines, /^THE.FORTY MARTYRS OF THE SINAI DESERT\s*$/, 300);
  const end = findLine(lines, /^GLOSSARY\s*$/, start);
  if (start < 0 || end < 0) throw new Error('fortymartyrs anchors not found');
  const slice = lines.slice(start, end);

  const out = [];
  let dropTail = false;
  for (let raw of slice) {
    let line = raw.trim();
    if (dropTail) continue;
    if (/^The continuation of this tale/.test(line)) {
      dropTail = true; // editorial note closing the volume's translations
      continue;
    }
    if (/^THE.FORTY MARTYRS OF/.test(line) || /^PART ?I?I?\s*$/.test(line) || /FORTY MARTYRS OF THE SINA[TI] DESERT/.test(line)) {
      if (out.length === 0) {
        out.push(`${HEADING}Chapter 1.--The Forty Martyrs of the Sinai Desert.`);
        out.push('');
      }
      continue;
    }
    if (/^THE LIFE OF EULOGIOS/.test(line)) {
      out.push('');
      out.push(`${HEADING}Chapter 2.--The Life of Eulogios the Egyptian, the Stone-Cutter.`);
      out.push('');
      continue;
    }
    if (/^WAS A STONE-CUTTER\s*$/.test(line) || /^EULOGIOS THE STONE-CUTTER\s*$/.test(line)) continue;
    if (/^WHAT FATHER DANIEL RELATED/.test(line)) {
      out.push('');
      out.push(`${HEADING}Chapter 3.--What Father Daniel Related about Patricia.`);
      out.push('');
      continue;
    }
    if (/^ABOUT PATRICIA\s*$/.test(line)) continue;
    if (line === '') {
      out.push('');
      continue;
    }
    if (/^[A-Z][A-Z .,':0-9-]{2,60}$/.test(line) && !/[a-z]/.test(line)) continue; // caps running heads
    if (/^(H\. ?S\. ?IX\.? ?\d*|P[:;] ?\d+|p[.-] ?\d+|\d+|[ivxlc]+)$/.test(line)) continue; // sigs, p-marks, page nos
    if (/^\d\s+(Literally|Or\b|Lit\b|See|Gk|i\.? ?e|Cf|Sic|Perhaps|Reading|MS|Cod|‘|“)/.test(line)) continue; // footnotes
    if (/^[*†]/.test(line)) continue;
    line = line.replace(/\(f\. ?\d+ ?[ab]?\)/g, ' '); // inline folio marks
    line = line.replace(/([a-z,;:.!?’'")\]])\d{1,2}(?=[\s.,;:]|$)/g, '$1'); // glued markers
    line = collapse(line);
    if (line === '') continue;
    out.push(line);
  }
  const paragraphs = reflow(out);
  writeWork({
    folder: 'Apostolic_English',
    file: 'The Forty Martyrs of the Sinai Desert.txt',
    header: header({
      source: 'Agnes Smith Lewis, The Forty Martyrs of the Sinai Desert and the Story of Eulogios (Cambridge: Cambridge University Press, 1912)',
      series: 'Horae Semiticae IX',
      father: 'Apostolic and Early Documents',
      work: 'The Forty Martyrs of the Sinai Desert',
      translator: 'Agnes Smith Lewis',
      rowId: 's5-hs-forty-martyrs',
      url: 'https://archive.org/details/fortymartyrsofsi0000unse',
      year: 1912,
    }),
    paragraphs,
  });
}

// ---------------------------------------------------------------- 8. Apocrypha Sinaitica (optional)

function buildApocrypha() {
  const lines = readCache('s5-ss-apocrypha-sinaitica');
  // English translations run from the Syriac Anaphora to the Latin texts.
  const start = findLine(lines, /^TRANSLATION OF THE SYRIAC\s*$/, 800);
  const end = findLine(lines, /^MARTYRIUM SIMONIS\.?\s*$/, start);
  if (start < 0 || end < 0) throw new Error('apocrypha anchors not found');
  const slice = lines.slice(start, end);

  // A running head names the piece and carries a page number or "(SINAI.)" /
  // "(BRIT. MUS.)". The piece title itself is the same words with no page number.
  function sectionOf(line) {
    const t = line.trim();
    // Running heads are capitals plus a page number. OCR slips a letter
    // ("MARTYRDOM OF JAMES. 6l"), so allow a couple of lowercase characters.
    const lower = (t.match(/[a-z]/g) || []).length;
    if (t.length > 65 || lower > 2) return null;
    if (/(ANAPHORA|PARADOSIS)\s+PILATI/.test(t)) return /PARADOSIS/.test(t) ? 'paradosis' : 'anaphora';
    if (/RECOGNITIONS OF CLEMENT/.test(t)) return /BRIT/.test(t) ? 'rec-bm' : /SINAI|SINA[IL]/.test(t) ? 'rec-sinai' : 'rec';
    if (/MARTYRDOM OF CLEMENT/.test(t)) return 'clem';
    if (/PREACHING OF PETER/.test(t)) return 'peter';
    if (/MARTYRDOM OF JAMES/.test(t)) return 'james';
    if (/PREACHING OF SIMON/.test(t)) return 'simon-preach';
    if (/MARTYRDOM OF SIMON/.test(t)) return 'simon-mart';
    return null;
  }
  const SECTION_TITLE = {
    anaphora: 'The Anaphora of Pilate.',
    paradosis: 'The Paradosis of Pilate.',
    'rec-sinai': 'The Recognitions of Clement (Sinai Text).',
    rec: 'The Recognitions of Clement (Sinai Text).',
    'rec-bm': 'The Recognitions of Clement (British Museum Text).',
    clem: 'The Martyrdom of Clement.',
    peter: 'The Preaching of Peter.',
    james: 'The Martyrdom of James the Son of Alphaeus.',
    'simon-preach': 'The Preaching of Simon Son of Cleophas.',
    'simon-mart': 'The Martyrdom of Simon Son of Cleophas.',
  };

  const final = [`${HEADING}Chapter 0.--${SECTION_TITLE.anaphora}`, ''];
  let section = 'anaphora';
  let recSeen = 0;
  for (const raw of slice) {
    let line = raw.trim();
    const sec = sectionOf(line);
    if (sec) {
      let key = sec;
      // The bare title "RECOGNITIONS OF CLEMENT." opens Sinai, then the British Museum text.
      if (sec === 'rec') key = ++recSeen === 1 ? 'rec-sinai' : 'rec-bm';
      if (key !== section) {
        section = key;
        final.push('');
        final.push(`${HEADING}Chapter ${0}.--${SECTION_TITLE[key]}`);
        final.push('');
      }
      continue;
    }
    if (line === '') {
      final.push('');
      continue;
    }
    if (/^TRANSLATION OF THE (SYRIAC|ARABIC)\.?\s*$/.test(line)) continue;
    if (/^[\[{]From a MS/i.test(line)) continue;
    // leftover running heads ("PREACHING OP PETER.", "A. P. 9")
    if (line.length < 45 && !/[a-z]{3,}/.test(line) && /[A-Z]{5,}/.test(line)) continue;
    line = line.replace(/^[*†‡^\u005E]+\s*/, '');
    if (/^[*†‡]/.test(line)) continue; // footnote
    if (/^['']?\s*om\./i.test(line)) continue;
    if (/^A\. ?P[.,]?\s*\S{0,3}$/.test(line)) continue; // signature
    if (/^[0-9IJlOo]{1,4}$/.test(line)) continue;
    const letters = (line.match(/[A-Za-z]/g) || []).length;
    if (line.length >= 18 && letters / line.length < 0.5) continue; // unread scan line
    line = line.replace(/\bf\. ?\d+ ?[ab]?\b/g, ' ');
    line = line.replace(/([a-z,;:.!?'")\]])\d{1,2}(?=[\s.,;:]|$)/g, '$1');
    line = collapse(line);
    if (line === '') continue;
    final.push(line);
  }
  // number the chapters in the order they were opened
  let n = 0;
  for (let i = 0; i < final.length; i++) {
    if (final[i].startsWith(`${HEADING}Chapter 0.--`)) {
      n++;
      final[i] = final[i].replace('Chapter 0.--', `Chapter ${n}.--`);
    }
  }
  const paragraphs = reflow(final);
  writeWork({
    folder: 'Apostolic_English',
    file: 'Apocrypha Sinaitica.txt',
    header: header({
      source: 'Margaret Dunlop Gibson, Apocrypha Sinaitica (London: C. J. Clay and Sons, 1896)',
      series: 'Studia Sinaitica V',
      father: 'Apostolic and Early Documents',
      work: 'Apocrypha Sinaitica',
      translator: 'Margaret Dunlop Gibson',
      rowId: 's5-ss-apocrypha-sinaitica',
      url: 'https://archive.org/details/apocryphasinait00gibsgoog',
      year: 1896,
    }),
    paragraphs,
  });
}

// ---------------------------------------------------------------- main

const BUILDERS = {
  narsai: buildNarsai,
  odes: buildOdes,
  psalms: buildPsalms,
  didascalia: buildDidascalia,
  cowper: buildCowper,
  euphemia: buildEuphemia,
  holywomen: buildHolyWomen,
  fortymartyrs: buildFortyMartyrs,
  apocrypha: buildApocrypha,
};

const args = process.argv.slice(2);
const ids = args.length ? args : Object.keys(BUILDERS);
for (const id of ids) {
  if (!BUILDERS[id]) {
    console.error(`unknown work id: ${id}`);
    process.exit(1);
  }
  BUILDERS[id]();
}
