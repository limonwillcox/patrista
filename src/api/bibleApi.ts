import { bookIdToUsfm, esvQuery, parseEsvPassage } from "./bibleTranslations";

const BIBLE_API_URL = "https://api.scripture.api.bible/v1";
// v2: verses saved by v1 lost the space between poetry lines, and ESV verses after an omitted one were misnumbered.
// v3: API.Bible chapters keep the copyright line and the FUMS token that came with them.
const CACHE_PREFIX = "piblia_bible_cache_v3_";
/** API.Bible's usage reporting (FUMS v3), a condition of its licence for Scripture shown on the web. */
const FUMS_SCRIPT = "https://pkg.api.bible/fumsV3.min.js";
// 14 days in milliseconds: 14 * 24 * 60 * 60 * 1000 = 1,209,600,000 ms
const CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

interface CachedChapter {
  timestamp: number;
  verses: string[];
  /** API.Bible only: the copyright line the publisher requires beside the text (data.copyright). */
  copyright?: string;
  /** API.Bible only: the token to report each view of this text with (meta.fumsToken). */
  fumsToken?: string;
}

/** What came with each remote chapter besides its verses, by cache key. */
const extras = new Map<string, { copyright?: string; fumsToken?: string }>();

/** The copyright line and FUMS token of a remote chapter fetched (or read from the cache) in this session. */
export function remoteChapterExtras(
  bibleId: string,
  bookId: string,
  chapter: number
): { copyright?: string; fumsToken?: string } | undefined {
  return extras.get(`${CACHE_PREFIX}${bibleId}_${bookIdToUsfm(bookId)}_${chapter}`);
}

type FumsWindow = Window & { fumsData?: unknown[]; fums?: (...args: unknown[]) => void };

/**
 * Report one view of an API.Bible text to its Fair Use Management System, as API.Bible's licence requires
 * for Scripture shown on a website (https://docs.api.bible, "Fair Use"). The tracker records an anonymous
 * view event for the publisher; calls made before the script loads wait in window.fumsData.
 */
export function reportFumsView(fumsToken: string | undefined): void {
  if (!fumsToken || typeof window === "undefined" || typeof document === "undefined") return;
  const w = window as FumsWindow;
  w.fumsData = w.fumsData || [];
  w.fums =
    w.fums ||
    function (...args: unknown[]) {
      w.fumsData!.push(args);
    };
  if (!document.querySelector(`script[src="${FUMS_SCRIPT}"]`)) {
    const script = document.createElement("script");
    script.src = FUMS_SCRIPT;
    script.async = true;
    document.head.appendChild(script);
  }
  w.fums("trackView", fumsToken);
}

export function getBibleApiKey(): string {
  if (typeof localStorage !== "undefined") {
    const userKey = localStorage.getItem("fg-bible-api-key");
    if (userKey) return userKey.trim();
  }
  return import.meta.env.VITE_BIBLE_API_KEY || "";
}

export function setBibleApiKey(key: string): void {
  if (typeof localStorage !== "undefined") {
    if (key) localStorage.setItem("fg-bible-api-key", key.trim());
    else localStorage.removeItem("fg-bible-api-key");
  }
}

/**
 * Parses API.Bible JSON content tree into an array of verse strings.
 */
function parseJsonTreeVerses(content: unknown[]): string[] {
  const verseMap: Map<number, string[]> = new Map();
  let currentVerse = 0;

  function walk(node: unknown, inHeading: boolean) {
    if (!node || typeof node !== "object") return;
    const n = node as Record<string, unknown>;

    let isHeading = inHeading;
    // A new paragraph or poetry line: the text before it ends there. Without this space the lines run
    // together ("sound the alarm on my holy mountain" after "Blow the trumpet in Zion;").
    if (n.name === "para" && currentVerse > 0 && verseMap.has(currentVerse)) verseMap.get(currentVerse)!.push(" ");
    if (n.name === "para" && n.attrs && typeof n.attrs === "object") {
      const style = String((n.attrs as Record<string, unknown>).style || "");
      if (
        style.startsWith("s") ||
        style.startsWith("ms") ||
        style.startsWith("r") ||
        style.startsWith("d") ||
        style.startsWith("qa")
      ) {
        isHeading = true;
      }
    }

    if (n.name === "verse" && n.attrs && typeof n.attrs === "object") {
      const attrs = n.attrs as Record<string, unknown>;
      const numStr = String(attrs.number || attrs.sid || "").replace(/\D/g, "");
      const num = parseInt(numStr, 10);
      if (!isNaN(num) && num > 0) {
        currentVerse = num;
      }
      return; // Skip verse number label inside verse element
    }

    // A text that is only a space still parts two words ("descending" | " " | "on the Son of Man").
    if (!isHeading && typeof n.text === "string" && n.text !== "") {
      let vNum = currentVerse;
      if (n.attrs && typeof n.attrs === "object" && typeof (n.attrs as Record<string, unknown>).verseId === "string") {
        const verseId = (n.attrs as Record<string, unknown>).verseId as string;
        const parts = verseId.split(".");
        const parsed = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(parsed) && parsed > 0) vNum = parsed;
      }
      if (vNum > 0) {
        const parts = verseMap.get(vNum) || [];
        parts.push(n.text);
        verseMap.set(vNum, parts);
      }
    }

    if (Array.isArray(n.items)) {
      for (const item of n.items) {
        walk(item, isHeading);
      }
    }
  }

  for (const node of content) {
    walk(node, false);
  }

  if (verseMap.size === 0) return [];

  const maxVerse = Math.max(...Array.from(verseMap.keys()), 0);
  const verses: string[] = [];
  for (let i = 1; i <= maxVerse; i++) {
    const parts = verseMap.get(i) || [];
    verses.push(parts.join("").replace(/[\u00A0\s]+/g, " ").trim());
  }
  return verses;
}

/**
 * Parses HTML format from API.Bible as a fallback.
 */
function parseHtmlVerses(html: string): string[] {
  if (typeof DOMParser !== "undefined") {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const verseMap: Map<number, string[]> = new Map();
    let currentVerse = 1;

    function walkDom(node: Node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const numAttr = el.getAttribute("data-number");
        if (numAttr) {
          const n = parseInt(numAttr, 10);
          if (!isNaN(n) && n > 0) currentVerse = n;
        } else if (el.classList.contains("v")) {
          const n = parseInt(el.textContent || "", 10);
          if (!isNaN(n) && n > 0) currentVerse = n;
        }
      }

      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || "";
        if (text.trim()) {
          const parts = verseMap.get(currentVerse) || [];
          parts.push(text);
          verseMap.set(currentVerse, parts);
        }
      }

      for (let i = 0; i < node.childNodes.length; i++) {
        walkDom(node.childNodes[i]);
      }
    }

    walkDom(doc.body);

    if (verseMap.size > 0) {
      const maxVerse = Math.max(...Array.from(verseMap.keys()), 0);
      const verses: string[] = [];
      for (let i = 1; i <= maxVerse; i++) {
        const parts = verseMap.get(i) || [];
        verses.push(parts.join("").replace(/[\u00A0\s]+/g, " ").trim());
      }
      return verses;
    }
  }

  // Pure string regex fallback
  const clean = html.replace(/<[^>]+>/g, " ").replace(/[\u00A0\s]+/g, " ").trim();
  return clean ? [clean] : [];
}

export function getEsvApiKey(): string {
  if (typeof localStorage !== "undefined") {
    const userKey = localStorage.getItem("fg-esv-api-key");
    if (userKey) return userKey.trim();
  }
  return import.meta.env.VITE_ESV_API_KEY || "";
}

/**
 * Fetches a chapter from API.Bible or ESV API with local cache.
 */
export async function fetchRemoteBibleVerses(
  bibleId: string,
  bookId: string,
  chapter: number
): Promise<string[]> {
  const usfm = bookIdToUsfm(bookId);
  const cacheKey = `${CACHE_PREFIX}${bibleId}_${usfm}_${chapter}`;

  // 1. Check local cache
  if (typeof localStorage !== "undefined") {
    const cachedStr = localStorage.getItem(cacheKey);
    if (cachedStr) {
      try {
        const cached: CachedChapter = JSON.parse(cachedStr);
        const age = Date.now() - cached.timestamp;
        if (age < CACHE_TTL_MS && Array.isArray(cached.verses) && cached.verses.length > 0) {
          extras.set(cacheKey, { copyright: cached.copyright, fumsToken: cached.fumsToken });
          return cached.verses;
        }
      } catch {
        localStorage.removeItem(cacheKey);
      }
    }
  }

  // 2. Fetch ESV directly if key exists; otherwise fallback to Worker proxy
  if (bibleId.toLowerCase() === "esv") {
    const esvKey = getEsvApiKey();
    let passageText = "";

    if (esvKey) {
      const query = esvQuery(usfm, chapter);
      const url = `https://api.esv.org/v3/passage/text/?q=${encodeURIComponent(query)}&include-passage-references=false&include-verse-numbers=true&include-first-verse-numbers=true&include-footnotes=false&include-headings=false`;
      const res = await fetch(url, { headers: { Authorization: `Token ${esvKey}` } });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`ESV API request failed (${res.status}): ${errText || res.statusText}`);
      }
      const data = await res.json();
      passageText = data.passages?.[0] || "";
    } else {
      // Fallback to Worker proxy
      const base = (import.meta.env.VITE_DONATE_API_BASE || "").replace(/\/+$/, "");
      const proxyUrl = `${base}/api/bible/remote?bibleId=esv&chapterId=${encodeURIComponent(`${usfm}.${chapter}`)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) {
        let errMsg = "";
        try {
          const errJson = (await res.json()) as { error?: string };
          errMsg = errJson.error || "";
        } catch {
          errMsg = await res.text().catch(() => "");
        }
        if (res.status === 503) {
          throw new Error("ESV API key missing. Add ESV_API_KEY on your Cloudflare Worker, or enter an API key in Settings.");
        }
        throw new Error(`ESV fetch failed (${res.status}): ${errMsg || res.statusText}`);
      }
      const data = await res.json();
      passageText = data.passages?.[0] || "";
    }

    if (!passageText) {
      throw new Error(`Could not fetch ESV text for ${usfm} ${chapter}`);
    }
    
    const verses = parseEsvPassage(passageText);

    if (typeof localStorage !== "undefined" && verses.length > 0) {
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), verses }));
      } catch {
        /* storage full */
      }
    }
    return verses;
  }

  // 3. Fetch API.Bible
  const chapterId = `${usfm}.${chapter}`;
  const apiKey = getBibleApiKey();
  let json: { data?: { content?: unknown; copyright?: unknown }; meta?: { fumsToken?: unknown } };

  if (apiKey) {
    const url = `${BIBLE_API_URL}/bibles/${encodeURIComponent(bibleId)}/chapters/${encodeURIComponent(
      chapterId
    )}?content-type=json&include-verse-numbers=true&fums-version=3`;
    const res = await fetch(url, { headers: { "api-key": apiKey } });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`API.Bible request failed (${res.status}): ${errText || res.statusText}`);
    }
    json = await res.json();
  } else {
    const base = (import.meta.env.VITE_DONATE_API_BASE || "").replace(/\/+$/, "");
    const proxyUrl =
      `${base}/api/bible/remote?bibleId=${encodeURIComponent(bibleId)}` +
      `&chapterId=${encodeURIComponent(chapterId)}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) {
      let errMsg = "";
      try {
        const errJson = (await res.json()) as { error?: string };
        errMsg = errJson.error || "";
      } catch {
        errMsg = await res.text().catch(() => "");
      }
      if (res.status === 503) {
        throw new Error(
          "API.Bible key missing. Add BIBLE_API_KEY on the Worker, or VITE_BIBLE_API_KEY locally."
        );
      }
      throw new Error(`API.Bible request failed (${res.status}): ${errMsg || res.statusText}`);
    }
    json = await res.json();
  }

  const rawContent = json?.data?.content;

  let verses: string[] = [];
  if (Array.isArray(rawContent)) {
    verses = parseJsonTreeVerses(rawContent);
  } else if (typeof rawContent === "string") {
    verses = parseHtmlVerses(rawContent);
  }

  if (verses.length === 0) {
    throw new Error(`Could not parse verses from API.Bible response for ${chapterId}`);
  }

  const copyright = typeof json?.data?.copyright === "string" ? json.data.copyright.replace(/\s+/g, " ").trim() : undefined;
  const fumsToken = typeof json?.meta?.fumsToken === "string" ? json.meta.fumsToken : undefined;
  extras.set(cacheKey, { copyright, fumsToken });

  // 3. Store in 14-day cache
  if (typeof localStorage !== "undefined") {
    const cachePayload: CachedChapter = {
      timestamp: Date.now(),
      verses,
      copyright,
      fumsToken
    };
    try {
      localStorage.setItem(cacheKey, JSON.stringify(cachePayload));
    } catch {
      // localStorage may be full; gracefully continue
    }
  }

  return verses;
}
