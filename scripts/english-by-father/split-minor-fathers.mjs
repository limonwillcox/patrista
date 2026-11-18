/**
 * Cut works that sit in the ANF / NPNF volume dumps but were never split out:
 * Leo's Letters (NPNF2 XII) and the minor ante-Nicene writers of ANF VI, VII and VIII.
 *
 * Each work goes to Fathers/English/<Father>_English/<Work>.txt with the same header the other
 * splitters write. The editors' introductions and elucidations are left behind. A footnote the text
 * cites but whose body sits outside the cut (ANF VII prints notes after the elucidations) is copied
 * to the end of the file.
 *
 * Usage: node scripts/english-by-father/split-minor-fathers.mjs [--dry]
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { join, dirname, relative } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const englishRoot = join(root, "Fathers", "English");
const dry = process.argv.includes("--dry");

const VOLUMES = {
  ANF6: ["ANF", "Volume VI."],
  ANF7: ["ANF", "Volume VII."],
  ANF8: ["ANF", "Volume VIII."],
  NPNF2_12: ["NPNF2", "Volume XII."]
};

const volumeCache = new Map();
function volume(key) {
  if (volumeCache.has(key)) return volumeCache.get(key);
  const [series, prefix] = VOLUMES[key];
  const dir = join(englishRoot, series);
  const hit = readdirSync(dir).find((n) => n.startsWith(prefix));
  if (!hit) throw new Error(`Missing ${series}/${prefix}*`);
  const path = join(dir, hit);
  const v = { series, prefix, path, lines: readFileSync(path, "utf8").replace(/\r\n/g, "\n").split("\n") };
  volumeCache.set(key, v);
  return v;
}

/** 1-based line number of the first match at or after `from`, or -1. */
function first(lines, re, from = 1) {
  for (let i = from - 1; i < lines.length; i++) if (re.test(lines[i])) return i + 1;
  return -1;
}

const RULE_RE = /^\s*[_\-]{5,}\s*$/;
const NAV_URL_RE = /(?:\/ccel\/schaff\/|www\.ccel\.org\/ccel\/)\S*?\.html?\b/;
// "theonas epistle_to_lucianus anf06 theonas-epistle_to_lucianus The". Kept simple on purpose: a pattern
// with nested repeats backtracks for minutes on the volume's long rule lines of underscores.
const NAV_CODE_RE = /^\s*[a-z0-9_]+ [a-z0-9_ -]*\b(?:anf|npnf)\d+ /i;
const RUNNING_HEAD_RE = /^\s*Remains of the Second and Third Centuries\.?\s*$/;
const NOTE_BODY_RE = /^\s*\[(\d+)\]\s+\S/;

/** Drop the rules, running heads and "next work" link block left at the end of a cut. */
function trimTail(lines) {
  const out = lines.slice();
  const navAt = (() => {
    for (let i = out.length - 1; i >= Math.max(0, out.length - 14); i--) if (NAV_CODE_RE.test(out[i])) return i;
    return -1;
  })();
  if (navAt >= 0) out.length = navAt;
  while (out.length) {
    const l = out[out.length - 1];
    if (!l.trim() || RULE_RE.test(l) || NAV_URL_RE.test(l) || RUNNING_HEAD_RE.test(l)) out.pop();
    else break;
  }
  return out;
}

/** The body of footnote n in the volume: its first line and the lines up to the next blank one. */
function noteBody(lines, n, near) {
  const re = new RegExp("^\\s*\\[" + n + "\\]\\s+\\S");
  let at = first(lines, re, near);
  if (at < 0) at = first(lines, re, 1);
  if (at < 0) return null;
  const out = [];
  for (let i = at - 1; i < lines.length && lines[i].trim() && !RULE_RE.test(lines[i]); i++) out.push(lines[i]);
  return out;
}

function cut(spec) {
  const v = volume(spec.vol);
  const anchor = spec.anchor ? first(v.lines, spec.anchor) : 1;
  if (anchor < 0) throw new Error(`${spec.father}/${spec.work}: anchor not found`);
  const start = first(v.lines, spec.start, anchor);
  if (start < 0) throw new Error(`${spec.father}/${spec.work}: start not found`);
  const end = first(v.lines, spec.end, start + 1);
  if (end < 0) throw new Error(`${spec.father}/${spec.work}: end not found`);
  let body = trimTail(v.lines.slice(start - 1, end - 1));
  if (spec.fix) body = spec.fix(body);

  const have = new Set();
  const cited = new Set();
  for (const line of body) {
    const m = line.match(NOTE_BODY_RE);
    if (m) have.add(m[1]);
    for (const c of line.replace(NOTE_BODY_RE, "").matchAll(/\[(\d+)\]/g)) cited.add(c[1]);
  }
  const missing = [...cited].filter((n) => !have.has(n)).sort((a, b) => Number(a) - Number(b));
  const extra = [];
  for (const n of missing) {
    const note = noteBody(v.lines, n, start);
    if (note) extra.push("", ...note);
  }
  if (extra.length) body = [...body, "     __________________________________________________________________", ...extra];
  return { v, start, end, body, copiedNotes: missing.length };
}

function write(spec) {
  const { v, start, end, body, copiedNotes } = cut(spec);
  const folder = join(englishRoot, spec.father + "_English");
  const header = [
    `# source: ${relative(root, v.path).replace(/\\/g, "/")}`,
    `# series: ${v.series}`,
    `# volume: ${v.prefix}`,
    `# father: ${spec.father}`,
    `# work: ${spec.work}`,
    `# latin_match_candidate: (none)`,
    ...(translatorFor(spec) ? [`# translator: ${translatorFor(spec)}`] : []),
    `# extracted: ${new Date().toISOString().slice(0, 10)}`,
    `# note: Public-domain Schaff English extract. Volume archives retained under ANF/NPNF1/NPNF2.`,
    ""
  ].join("\n");
  const text = header + body.join("\n").replace(/\s+$/, "") + "\n";
  const words = body.join(" ").split(/\s+/).filter(Boolean).length;
  console.log(
    `${dry ? "DRY" : "OK "} ${spec.father} / ${spec.file}  L${start}-L${end - 1}  ${words} words` +
      (copiedNotes ? `  (+${copiedNotes} notes copied)` : "")
  );
  if (dry) return;
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, spec.file), text);
}

/** "from the first chapter." (CCEL lower-cases the small capitals) -> "From the First Chapter." */
function titleCaseChapterHeads(lines) {
  return lines.map((l) =>
    /^\s*from the [a-z -]+ chapters?\.(?:\s*\[\d+\])?\s*$/.test(l)
      ? l.replace(/\b([a-z])([a-z]*)/g, (w, a, b) => (/^(the|and)$/.test(w) ? w : a.toUpperCase() + b)).replace(/^(\s*)from/i, "$1From")
      : l
  );
}

/**
 * The translator each volume names for the section a work stands in. Sections with no printed credit
 * (Julius Africanus, Asterius Urbanus, Dionysius of Rome) get none.
 */
function translatorFor(spec) {
  if (spec.vol === "NPNF2_12") return "Charles Lett Feltoe";
  if (spec.vol === "ANF8") return "B. P. Pratten";
  if (spec.vol === "ANF6") {
    if (/^(Alexander_Lycopolis|Peter_Alexandria|Alexander_Alexandria)$/.test(spec.father)) return "James B. H. Hawkins";
    if (spec.father !== "Julius_Africanus") return "S. D. F. Salmond";
  }
  if (spec.vol === "ANF7") {
    if (spec.father === "Victorinus") return "Robert Ernest Wallis";
    if (spec.father === "Venantius") return "William Fletcher";
  }
  return "";
}

/** CCEL lower-cases Asterius's small-capital headings: "i. the exordium." -> "I. The Exordium." */
function asteriusHeads(lines) {
  return lines.map((l) => {
    const m = l.match(/^(\s*)([ivx]+)\. (the exordium|from book ([iv]+))\.\s*$/);
    if (!m) return l;
    return m[1] + m[2].toUpperCase() + ". " + (m[4] ? "From Book " + m[4].toUpperCase() : "The Exordium") + ".";
  });
}

const SPECS = [
  // ---- NPNF2 XII ----
  {
    vol: "NPNF2_12", father: "Leo", work: "Letters", file: "Letters.txt",
    start: /^ {3}Letters\.\s*$/, end: /^ {3}Sermons\.\s*$/
  },

  // ---- ANF VI: Julius Africanus ----
  {
    vol: "ANF6", father: "Julius_Africanus", work: "The Epistle to Aristides", file: "The Epistle to Aristides.txt",
    anchor: /^\s*Julius Africanus\s*$/, start: /^\s*I\.--The Epistle to Aristides\./, end: /^\s*II\.--Narrative of Events Happening in Persia/
  },
  {
    vol: "ANF6", father: "Julius_Africanus", work: "Narrative of Events Happening in Persia on the Birth of Christ",
    file: "Narrative of Events Happening in Persia on the Birth of Christ.txt",
    anchor: /^\s*Julius Africanus\s*$/, start: /^\s*II\.--Narrative of Events Happening in Persia/,
    end: /^\s*The Extant Fragments of the Five Books of the Chronography of Julius Africanus\s*$/
  },
  {
    vol: "ANF6", father: "Julius_Africanus", work: "Fragments of the Chronography", file: "Fragments of the Chronography.txt",
    anchor: /^\s*Julius Africanus\s*$/, start: /^\s*III\.--The Extant Fragments of the Five Books of the Chronography/,
    end: /^\s*IV\.--The Passion of St\. Symphorosa/
  },
  {
    vol: "ANF6", father: "Julius_Africanus", work: "The Passion of St. Symphorosa and Her Seven Sons",
    file: "The Passion of St. Symphorosa and Her Seven Sons.txt",
    anchor: /^\s*Julius Africanus\s*$/, start: /^\s*IV\.--The Passion of St\. Symphorosa/, end: /^\s*Elucidations\.\s*$/
  },

  // ---- ANF VI: Anatolius and the minor writers ----
  {
    vol: "ANF6", father: "Anatolius", work: "The Paschal Canon", file: "The Paschal Canon.txt",
    start: /^\s*The Paschal Canon of Anatolius of Alexandria\./, end: /^\s*Fragments of the Books on Arithmetic\./
  },
  {
    vol: "ANF6", father: "Anatolius", work: "Fragments of the Books on Arithmetic", file: "Fragments of the Books on Arithmetic.txt",
    start: /^\s*Fragments of the Books on Arithmetic\./, end: /^\s*Alexander of Cappadocia\s*$/
  },
  {
    vol: "ANF6", father: "Alexander_Jerusalem", work: "Fragments of the Epistles of Alexander", file: "Fragments of the Epistles of Alexander.txt",
    start: /^\s*From the Epistles of Alexander\.\s*$/, end: /^\s*Note by the American Editor\.\s*$/
  },
  {
    vol: "ANF6", father: "Theognostus", work: "Fragments of the Hypotyposes", file: "Fragments of the Hypotyposes.txt",
    start: /^\s*From His Seven Books of Hypotyposes or Outlines\.\s*$/, end: /^\s*Pierus of Alexandria\s*$/
  },
  {
    vol: "ANF6", father: "Pierius", work: "Fragments of Pierius", file: "Fragments of Pierius.txt",
    start: /^\s*I\.--A Fragment of a Work of Pierius/, end: /^\s*Theonas of Alexandria\s*$/
  },
  {
    vol: "ANF6", father: "Theonas", work: "Epistle to Lucianus, the Chief Chamberlain", file: "Epistle to Lucianus, the Chief Chamberlain.txt",
    start: /^\s*The Epistle of Theonas, Bishop of Alexandria, to Lucianus/, end: /^\s*Phileas\s*$/
  },
  {
    vol: "ANF6", father: "Phileas", work: "Epistle to the People of Thmuis", file: "Epistle to the People of Thmuis.txt",
    start: /^\s*Fragments of the Epistle of Phileas to the People of Thmuis\./,
    end: /^\s*The Epistle of the same Phileas of Thmuis to Meletius, Bishop of Lycopolis\s*$/
  },
  {
    vol: "ANF6", father: "Phileas", work: "Epistle to Meletius, Bishop of Lycopolis", file: "Epistle to Meletius, Bishop of Lycopolis.txt",
    start: /^\s*The Epistle of the Same Phileas of Thmuis to Meletius, Bishop of\s*$/, end: /^\s*Pamphilus\s*$/
  },
  {
    vol: "ANF6", father: "Pamphilus", work: "Exposition of the Chapters of the Acts of the Apostles",
    file: "Exposition of the Chapters of the Acts of the Apostles.txt",
    start: /^\s*An Exposition of the Chapters of the Acts of the Apostles\./, end: /^\s*Malchion\s*$/
  },
  {
    vol: "ANF6", father: "Malchion", work: "Epistle Against Paul of Samosata", file: "Epistle Against Paul of Samosata.txt",
    start: /^\s*I\.--The Epistle Written by Malchion,/, end: /^\s*Elucidations\.\s*$/
  },

  // ---- ANF VI: Archelaus, Alexander of Lycopolis, Peter and Alexander of Alexandria ----
  {
    vol: "ANF6", father: "Archelaus", work: "The Acts of the Disputation with the Heresiarch Manes",
    file: "The Acts of the Disputation with the Heresiarch Manes.txt",
    start: /^\s*The Acts of the Disputation \[\d+\] with the Heresiarch Manes\./, end: /^\s*Elucidations\.\s*$/
  },
  {
    vol: "ANF6", father: "Alexander_Lycopolis", work: "Of the Manichaeans", file: "Of the Manichaeans.txt",
    start: /^\s*Of the Manich\S{1,3}ans\. \[\d+\]/, end: /^\s*Elucidation\.\s*$/
  },
  {
    vol: "ANF6", father: "Peter_Alexandria", work: "The Genuine Acts of Peter", file: "The Genuine Acts of Peter.txt",
    start: /^\s*The Genuine Acts of Peter\./, end: /^\s*The Canonical Epistle, \[\d+\]/
  },
  {
    vol: "ANF6", father: "Peter_Alexandria", work: "The Canonical Epistle", file: "The Canonical Epistle.txt",
    start: /^\s*The Canonical Epistle, \[\d+\]/, end: /^\s*Note by the American Editor\.\s*$/
  },
  {
    vol: "ANF6", father: "Peter_Alexandria", work: "Fragments of Peter of Alexandria", file: "Fragments of Peter of Alexandria.txt",
    start: /^\s*Fragments from the Writings of Peter\.\s*$/, end: /^\s*Elucidations\.\s*$/
  },
  {
    vol: "ANF6", father: "Alexander_Alexandria", work: "Epistles on the Arian Heresy", file: "Epistles on the Arian Heresy.txt",
    start: /^\s*Epistles \[\d+\] on the Arian Heresy\s*$/, end: /^\s*Elucidations\.\s*$/
  },

  // ---- ANF VII ----
  {
    vol: "ANF7", father: "Venantius", work: "On Easter", file: "On Easter.txt",
    anchor: /^Venantius\s*$/, start: /^\s*On Easter\s*$/, end: /^\s*General Note\.\s*$/
  },
  {
    vol: "ANF7", father: "Asterius_Urbanus", work: "Extant Writings of Asterius Urbanus", file: "Extant Writings of Asterius Urbanus.txt",
    // The editor's "general note" comes before the Elucidation; both are left out.
    start: /^\s*The Extant Writings of Asterius Urbanus/, end: /^\s*(?:general note|elucidation)\.\s*$/i,
    fix: asteriusHeads
  },
  {
    vol: "ANF7", father: "Victorinus", work: "On the Creation of the World", file: "On the Creation of the World.txt",
    start: /^\s*ON THE CREATION OF THE WORLD/, end: /^\s*COMMENTARY ON THE APOCALYPSE OF THE BLESSED JOHN\s*$/,
    fix: (lines) => lines.map((l) => l.replace("ON THE CREATION OF THE WORLD", "On the Creation of the World"))
  },
  {
    vol: "ANF7", father: "Victorinus", work: "Commentary on the Apocalypse", file: "Commentary on the Apocalypse.txt",
    start: /^\s*COMMENTARY ON THE APOCALYPSE OF THE BLESSED JOHN\s*$/, end: /^\s*GENERAL NOTES BY THE AMERICAN EDITOR\s*$/,
    fix: (lines) =>
      titleCaseChapterHeads(lines).map((l) =>
        l.replace("COMMENTARY ON THE APOCALYPSE OF THE BLESSED JOHN", "Commentary on the Apocalypse of the Blessed John")
      )
  },
  {
    vol: "ANF7", father: "Dionysius_Rome", work: "Against the Sabellians", file: "Against the Sabellians.txt",
    anchor: /^DIONYSIUS, BISHOP OF ROME\.\s*$/, start: /^\s*Against the Sabellians\. \[\d+\]/, end: /^\s*elucidations\.\s*$/i
  },

  // ---- ANF VIII: Remains of the Second and Third Centuries (each cut starts after the editor's notice) ----
  {
    vol: "ANF8", father: "Quadratus", work: "Fragment of the Apology", file: "Fragment of the Apology.txt",
    anchor: /^\s*Quadratus, Bishop of Athens\./, start: /^\s*From the Apology for the Christian Religion\./, end: /^\s*Aristo of Pella\.\s*$/
  },
  {
    vol: "ANF8", father: "Aristo_Pella", work: "Fragments of the Disputation of Jason and Papiscus",
    file: "Fragments of the Disputation of Jason and Papiscus.txt",
    anchor: /^\s*Aristo of Pella\.\s*$/, start: /^\s*From the Disputation of Jason and Papiscus\./, end: /^\s*Melito, the Philosopher\.\s*$/
  },
  {
    vol: "ANF8", father: "Melito", work: "Remains of Melito", file: "Remains of Melito.txt",
    anchor: /^\s*Melito, the Philosopher\.\s*$/, start: /^\s*I\.\s*$/, end: /^\s*Hegesippus\. \[\d+\]\s*$/
  },
  {
    vol: "ANF8", father: "Hegesippus", work: "Fragments of the Commentaries on the Acts of the Church",
    file: "Fragments of the Commentaries on the Acts of the Church.txt",
    anchor: /^\s*Hegesippus\. \[\d+\]\s*$/, start: /^\s*Fragments from His Five Books of Commentaries on the Acts of the\s*$/,
    end: /^\s*Dionysius, Bishop of Corinth\.\s*$/
  },
  {
    vol: "ANF8", father: "Dionysius_Corinth", work: "Fragments of a Letter to the Roman Church",
    file: "Fragments of a Letter to the Roman Church.txt",
    anchor: /^\s*Dionysius, Bishop of Corinth\.\s*$/, start: /^\s*Fragments from a Letter to the Roman Church\./, end: /^\s*Rhodon\. \[\d+\]\s*$/
  },
  {
    vol: "ANF8", father: "Rhodon", work: "Fragment Against Marcion", file: "Fragment Against Marcion.txt",
    anchor: /^\s*Rhodon\. \[\d+\]\s*$/, start: /^\s*Wherefore also they \[\d+\] disagree among themselves/, end: /^\s*Maximus, Bishop of Jerusalem\.\s*$/
  },
  {
    vol: "ANF8", father: "Maximus_Jerusalem", work: "On Matter", file: "On Matter.txt",
    anchor: /^\s*Maximus, Bishop of Jerusalem\.\s*$/, start: /^\s*From the Book Concerning Matter, or in Defence of the Proposition that\s*$/,
    end: /^\s*Claudius Apollinaris, \[\d+\] Bishop of Hierapolis, and Apologist\.\s*$/
  },
  {
    vol: "ANF8", father: "Apollinaris_Hierapolis", work: "Fragments of Claudius Apollinaris", file: "Fragments of Claudius Apollinaris.txt",
    anchor: /^\s*Claudius Apollinaris, \[\d+\] Bishop of Hierapolis, and Apologist\.\s*$/, start: /^\s*From an Unknown Book\./,
    end: /^\s*Polycrates, \[\d+\] Bishop of Ephesus\.\s*$/
  },
  {
    vol: "ANF8", father: "Polycrates", work: "Epistle to Victor and the Roman Church", file: "Epistle to Victor and the Roman Church.txt",
    anchor: /^\s*Polycrates, \[\d+\] Bishop of Ephesus\.\s*$/, start: /^\s*From His Epistle to Victor and the Roman Church Concerning the Day of\s*$/,
    end: /^\s*Theophilus, Bishop of C\S{1,3}sarea in Palestine\.\s*$/
  },
  {
    vol: "ANF8", father: "Theophilus_Caesarea", work: "Epistle on the Question of the Passover", file: "Epistle on the Question of the Passover.txt",
    anchor: /^\s*Theophilus, Bishop of C\S{1,3}sarea in Palestine\.\s*$/, start: /^\s*From His Epistle on the Question of the Passover, Written in the Name\s*$/,
    end: /^\s*Serapion, \[\d+\] Bishop of Antioch\.\s*$/
  },
  {
    vol: "ANF8", father: "Serapion", work: "Fragments of Serapion", file: "Fragments of Serapion.txt",
    anchor: /^\s*Serapion, \[\d+\] Bishop of Antioch\.\s*$/, start: /^\s*I\.\s*$/, end: /^\s*Apollonius\. \[\d+\]\s*$/
  },
  {
    vol: "ANF8", father: "Apollonius", work: "Concerning Montanism", file: "Concerning Montanism.txt",
    anchor: /^\s*Apollonius\. \[\d+\]\s*$/, start: /^\s*Concerning Montanism\. \[\d+\]\s*$/, end: /^\s*Pant\S{1,3}nus, \[\d+\] the Alexandrian Philosopher\.\s*$/
  },
  {
    vol: "ANF8", father: "Pantaenus", work: "Fragments of Pantaenus", file: "Fragments of Pantaenus.txt",
    anchor: /^\s*Pant\S{1,3}nus, \[\d+\] the Alexandrian Philosopher\.\s*$/, start: /^\s*I\. \[\d+\]\s*$/, end: /^\s*Pseud-Iren\S{1,3}us\.\s*$/
  },
  {
    vol: "ANF8", father: "Apostolic", work: "The Letter of the Churches of Vienne and Lyons", file: "The Letter of the Churches of Vienne and Lyons.txt",
    anchor: /^\s*Pseud-Iren\S{1,3}us\.\s*$/, start: /^\s*The Letter of the Churches of Vienna and Lugdunum to the Churches of\s*$/,
    end: /^\s*Note by the American Editor\.\s*$/
  }
];

let n = 0;
for (const spec of SPECS) {
  write(spec);
  n++;
}
console.log(`\n${n} works ${dry ? "checked" : "written"}.`);
