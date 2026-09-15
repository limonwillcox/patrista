import { existsSync, readFileSync } from "fs";
import { join } from "path";

const OT_COUNT = 39;
const COPYRIGHT_RE =
  /ancient christian commentary|\baccs\b|intervarsity|ivpress|ivp academic|catenabible\.com|neuu-org|bible-commentaries-dataset/i;

const BOOK_ABBR = {
  matt: "mt",
  matthew: "mt",
  mark: "mk",
  luke: "lk",
  john: "jo",
  rom: "rm",
  romans: "rm",
  acts: "act",
  "1cor": "1co",
  "1corinthians": "1co",
  "2cor": "2co",
  "2corinthians": "2co",
  gal: "gl",
  galatians: "gl",
  eph: "eph",
  ephesians: "eph",
  phil: "ph",
  philippians: "ph",
  col: "cl",
  colossians: "cl",
  "1thess": "1ts",
  "1thessalonians": "1ts",
  "2thess": "2ts",
  "2thessalonians": "2ts",
  "1tim": "1tm",
  "1timothy": "1tm",
  "2tim": "2tm",
  "2timothy": "2tm",
  tit: "tt",
  titus: "tt",
  phlm: "phm",
  philemon: "phm",
  heb: "hb",
  hebrews: "hb",
  jas: "jm",
  james: "jm",
  "1pet": "1pe",
  "1peter": "1pe",
  "2pet": "2pe",
  "2peter": "2pe",
  "1john": "1jo",
  "2john": "2jo",
  "3john": "3jo",
  jude: "jd",
  rev: "re",
  revelation: "re"
};

let authorMapCache = null;
const bookCache = new Map();

export function normName(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function bookKey(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function slugWorkTitle(title) {
  return String(title || "untitled")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^(the|a|an)-/, "")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "untitled";
}

export function centuryFromDeathYear(deathYear) {
  const c = Math.ceil(deathYear / 100);
  return Math.min(6, Math.max(1, c));
}

export function decodeLoc(loc) {
  return { chapter: Math.floor(loc / 1_000_000), verse: loc % 1_000_000 };
}

export function isCopyrightedSource(url, title) {
  return COPYRIGHT_RE.test(String(url || "")) || COPYRIGHT_RE.test(String(title || ""));
}

export function loadAuthorMap(root) {
  if (authorMapCache && authorMapCache.root === root) return authorMapCache.map;
  const raw = JSON.parse(readFileSync(join(root, "scripts/links/map-authors.json"), "utf8"));
  const byName = [];
  const byId = new Map();
  for (const a of raw.authors) {
    byId.set(a.id, a);
    for (const name of a.names) {
      byName.push({
        name,
        words: name.trim().split(/\s+/).length,
        norm: normName(name),
        id: a.id,
        deathYear: a.deathYear
      });
    }
  }
  byName.sort((a, b) => b.norm.length - a.norm.length);
  const map = { byName, byId };
  authorMapCache = { root, map };
  return map;
}

export function mapAuthorExact(map, text) {
  if (!text) return null;
  const norm = normName(text);
  for (const entry of map.byName) {
    if (norm === entry.norm) {
      return { id: entry.id, deathYear: entry.deathYear, rest: "" };
    }
  }
  return null;
}

export function mapAuthor(map, text) {
  if (!text) return null;
  const origWords = String(text).trim().split(/\s+/);
  const norm = origWords.map((w) => normName(w)).join(" ");
  for (const entry of map.byName) {
    if (norm === entry.norm) {
      return { id: entry.id, deathYear: entry.deathYear, rest: "" };
    }
    if (norm.startsWith(entry.norm + " ")) {
      const rest = origWords.slice(entry.words).join(" ");
      const restNorm = normName(rest);
      // HCF-style other people: "Basil of Seleucia", "Gregory Palamas".
      // e-Catena work titles: "The Prescription Against Heretics", "Commentary on Matthew".
      if (/^of\b/.test(restNorm) || /^[a-z]+$/.test(restNorm)) continue;
      return {
        id: entry.id,
        deathYear: entry.deathYear,
        rest
      };
    }
  }
  return null;
}

function loadBookIndex(root) {
  const hit = bookCache.get(root);
  if (hit) return hit;
  const raw = JSON.parse(readFileSync(join(root, "Bibles/KJV/manifest.json"), "utf8"));
  const byKey = new Map();
  const byId = new Map();
  raw.forEach((b, i) => {
    const bookNum = i + 1;
    const meta = {
      bookId: b.id,
      bookNum,
      canon: bookNum <= OT_COUNT ? "ot" : "nt",
      name: b.name,
      chapters: b.chapters
    };
    byId.set(b.id, meta);
    byKey.set(bookKey(b.id), meta);
    byKey.set(bookKey(b.name), meta);
  });
  for (const [abbr, id] of Object.entries(BOOK_ABBR)) {
    const meta = byId.get(id);
    if (meta) byKey.set(bookKey(abbr), meta);
  }
  const index = { byKey, byId };
  bookCache.set(root, index);
  return index;
}

export function mapBook(root, nameOrId) {
  if (!nameOrId) return undefined;
  const index = loadBookIndex(root);
  return index.byId.get(nameOrId) || index.byKey.get(bookKey(nameOrId));
}

export function makeRef(book, chapter, verseStart, verseEnd) {
  return {
    bookId: book.bookId,
    bookNum: book.bookNum,
    canon: book.canon,
    chapter,
    verseStart,
    verseEnd,
    locStart: chapter * 1_000_000 + verseStart,
    locEnd: chapter * 1_000_000 + verseEnd
  };
}

export function refsFromLocs(book, locStart, locEnd) {
  const a = decodeLoc(locStart);
  const b = decodeLoc(locEnd);
  if (a.chapter === b.chapter) {
    const vs = Math.min(a.verse, b.verse);
    const ve = Math.max(a.verse, b.verse);
    return [makeRef(book, a.chapter, vs, ve)];
  }
  const refs = [makeRef(book, a.chapter, a.verse, 200)];
  for (let ch = a.chapter + 1; ch < b.chapter; ch++) {
    refs.push(makeRef(book, ch, 1, 200));
  }
  refs.push(makeRef(book, b.chapter, 1, b.verse));
  return refs;
}

function stripUnitNumbers(title) {
  return String(title || "")
    .replace(/\b(book|homily|epistle|treatise|chapter|sermon|oration|lecture)\s+[ivxlcdm0-9]+\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function mapWork(catalogWorks, fatherId, title) {
  const cleaned = stripUnitNumbers(title);
  if (!cleaned) return slugWorkTitle(title || "untitled");
  const n = normName(cleaned);
  let best = null;
  for (const w of catalogWorks) {
    if (w.author !== fatherId) continue;
    const wn = normName(w.title);
    if (!wn) continue;
    if (n === wn || n.includes(wn) || wn.includes(n)) {
      if (!best || wn.length > best.len) best = { id: w.id, len: wn.length };
    }
  }
  return best ? best.id : slugWorkTitle(cleaned);
}

export function loadCatalogWorks(root) {
  const path = join(root, "dist/api/catalog.json");
  if (!existsSync(path)) return [];
  const parsed = JSON.parse(readFileSync(path, "utf8"));
  return parsed.works || [];
}

export function mergeByProvenance(existing, incoming, provenance) {
  return (existing || []).filter((l) => l.provenance !== provenance).concat(incoming);
}

export function parseBooksArg(raw, fallback) {
  if (!raw || raw === "default") return fallback;
  if (raw === "all") return null;
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export const DEFAULT_BOOKS = ["mt", "mk", "lk", "jo", "rm"];
