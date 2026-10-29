/** Static-page <title> and meta description rules (SEO desk spec, Oct 2026). */

export const TITLE_TARGET = 60;
export const TITLE_MAX = 65;
export const DESCRIPTION_MIN = 100;
export const DESCRIPTION_MAX = 155;

/** Short author names for titles ("Confessions by Augustine"). Keyed by catalog author name. */
const AUTHOR_SHORT: Record<string, string> = {
  "Augustine of Hippo": "Augustine",
  "Ambrose of Milan": "Ambrose",
  "Apostolic Fathers (misc.)": "the Apostolic Fathers",
  "Arnobius of Sicca": "Arnobius",
  "Athanasius of Alexandria": "Athanasius",
  "Barnabas (Epistle)": "Barnabas",
  "Basil the Great": "Basil",
  "John Cassian": "Cassian",
  "John Chrysostom": "Chrysostom",
  "Ecumenical Councils": "the Councils",
  "Cyprian of Carthage": "Cyprian",
  Didache: "the Apostles",
  "Ephraim the Syrian": "Ephraim",
  "Eusebius of Caesarea": "Eusebius",
  "Hilary of Poitiers": "Hilary",
  "Ignatius of Antioch": "Ignatius",
  "Irenaeus of Lyons": "Irenaeus",
  "Flavius Josephus": "Josephus",
  "Mathetes (to Diognetus)": "Mathetes",
  "Methodius of Olympus": "Methodius",
  "Papias of Hierapolis": "Papias",
  "Polycarp of Smyrna": "Polycarp",
  "Rufinus of Aquileia": "Rufinus",
  "Socrates Scholasticus": "Socrates",
  "Theodoret of Cyrus": "Theodoret",
  "Theophilus of Antioch": "Theophilus"
};

export function authorShortName(name: string): string {
  return AUTHOR_SHORT[name] ?? name;
}

/** Possessive for descriptions: "Augustine's", "the Councils'". */
export function possessive(name: string): string {
  return /s$/.test(name) ? name + "'" : name + "'s";
}

function clean(text: string): string {
  return text
    .replace(/\[\d+\]/g, "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/[*_^~|<>{}\\]/g, "")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** Cut at a word boundary to at most `max` chars; no ellipsis, no trailing punctuation. */
export function cutAtWord(text: string, max: number): string {
  const s = clean(text);
  if (s.length <= max) return s.replace(/[\s,;:—–-]+$/, "");
  const cut = s.slice(0, max + 1);
  const space = cut.lastIndexOf(" ");
  return (space > 0 ? cut.slice(0, space) : "").replace(/[\s,;:.—–(-]+$/, "");
}

const SMALL = /^(of|the|and|on|in|to|a|an|for|by|with|against|concerning)$/i;

/** Shorter forms of a work title, from mild to aggressive; never cut mid-word. */
export function shortenWorkTitle(title: string, max: number): string {
  let t = clean(title).replace(/^The\s+/, "");
  if (t.length <= max) return t;
  t = t.replace(/\s*\([^)]*\)\s*/g, " ").trim();
  if (t.length <= max) return t;
  t = t.replace(/\s*[:;—–].*$/, "").trim();
  if (t.length <= max) return t;
  const words = t.split(" ");
  while (words.length > 1 && words.join(" ").length > max) words.pop();
  while (words.length > 1 && SMALL.test(words[words.length - 1]!)) words.pop();
  return words.join(" ");
}

export function workSeoTitle(workTitle: string, authorName: string): string {
  const by = " by " + authorShortName(authorName);
  return shortenWorkTitle(workTitle, TITLE_TARGET - by.length) + by;
}

export function chapterSeoTitle(n: number, workShort: string, authorName: string): string {
  const head = "Chapter " + n + " - ";
  const by = " by " + authorShortName(authorName);
  return head + shortenWorkTitle(workShort, TITLE_TARGET - head.length - by.length) + by;
}

/** Work title as it reads after "Augustine's": no leading "The". */
function workInProse(title: string): string {
  return clean(title).replace(/^The\s+/, "");
}

/** Opening text for a description: the first real sentence-paragraph, not a note or a section mark. */
export function pickOpening(paras: string[]): string {
  const good = paras
    .map((p) => clean(p).replace(/^(?:§\s*\d+\.?|\[[^\]]*\]\.?|\d+\.)\s*/, ""))
    .find((p) => p.length >= 40 && /^["'“‘(]?[A-Z]/.test(p) && !/^(?:p\.|cf\.|see )/i.test(p));
  return good ?? clean(paras.join(" "));
}

const DANGLING = /\s+(?:and|or|but|the|a|an|of|to|in|on|for|with|by|as|at|that|which|who|from|his|her|their|our|my|is|was|St|Mt|I|O|[A-Z])\.?$/;

/** Opening words for a description: a whole sentence when one fits, else cut at a word without a dangling tail. */
export function ledeOf(text: string, room: number): string {
  const s = clean(text);
  if (s.length <= room) return s.replace(/[\s.!?;:,]+$/, "");
  const window = s.slice(0, room + 1);
  let best = -1;
  for (const m of window.matchAll(/[.!?;](?=\s)/g)) {
    const i = m.index!;
    const before = window.slice(0, i);
    if (i >= 40 && !/\b(?:St|Mt|Dr|Mr|cf|ch|vol|p|[A-Z])$/i.test(before)) best = i;
  }
  if (best > 0) return window.slice(0, best);
  let cut = cutAtWord(s, room);
  for (let k = 0; k < 4 && DANGLING.test(cut); k++) cut = cut.replace(DANGLING, "");
  return cut.replace(/[\s,;:—–(-]+$/, "");
}

export function chapterSeoDescription(n: number, authorName: string, workTitle: string, opening: string): string {
  const head = "Read Chapter " + n + " of " + possessive(authorShortName(authorName)) + " " + workInProse(workTitle) + ": ";
  const tail = ". Free, full text.";
  const room = Math.min(100, DESCRIPTION_MAX - head.length - tail.length);
  let lede = ledeOf(opening, room);
  if (!lede) lede = "the complete chapter in English";
  let out = head + lede + tail;
  const pad = " Free, full English text, with links to the previous and next chapter.";
  if (out.length < 120 && out.length - tail.length + pad.length <= DESCRIPTION_MAX) out = head + lede + "." + pad;
  return out;
}

export type UnitNoun = "books" | "chapters" | "homilies" | "letters" | "sermons" | "parts";

export function unitNoun(headings: string[]): UnitNoun {
  const counts: Record<string, number> = {};
  for (const h of headings) {
    const m = h.match(/^(Book|Homily|Letter|Sermon)\b/);
    const k = m ? m[1]! : "Chapter";
    counts[k] = (counts[k] || 0) + 1;
  }
  const [top, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? ["Chapter", 0];
  if (n < headings.length * 0.8) return "chapters";
  return ({ Book: "books", Homily: "homilies", Letter: "letters", Sermon: "sermons" } as Record<string, UnitNoun>)[top] ?? "chapters";
}

export function workSeoDescription(opts: {
  authorName: string;
  workTitle: string;
  units: number;
  noun: UnitNoun;
  series?: string;
  opening?: string;
}): string {
  const who = possessive(authorShortName(opts.authorName)) + " " + workInProse(opts.workTitle);
  let s =
    opts.units > 1
      ? "Read " + who + " free online. Full text, all " + opts.units + " " + opts.noun + ", with chapter-by-chapter navigation."
      : "Read " + who + " free online, the full text on one page.";
  const extras: string[] = [];
  if (opts.units <= 1 && opts.opening) {
    const room = DESCRIPTION_MAX - s.length - 3;
    const lede = cutAtWord(opts.opening, Math.min(90, room)).replace(/[.!?]+$/, "");
    if (lede.length > 20) extras.push("It opens: " + lede + ".");
  }
  if (opts.series) extras.push("Public-domain " + opts.series + " translation.");
  extras.push("English translation, public domain.");
  for (const e of extras) {
    if (s.length >= 140) break;
    if (s.length + 1 + e.length <= DESCRIPTION_MAX) s += " " + e;
  }
  return s;
}
