import { bookIdToUsfm } from "./bibleTranslations";

const BIBLE_API_URL = "https://api.scripture.api.bible/v1";
const CACHE_PREFIX = "piblia_bible_cache_v1_";
// 14 days in milliseconds: 14 * 24 * 60 * 60 * 1000 = 1,209,600,000 ms
const CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

interface CachedChapter {
  timestamp: number;
  verses: string[];
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

    if (!isHeading && typeof n.text === "string" && n.text.trim()) {
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

/**
 * Fetches a chapter from API.Bible with 14-day local cache.
 */
export async function fetchRemoteBibleVerses(
  bibleId: string,
  bookId: string,
  chapter: number
): Promise<string[]> {
  const usfm = bookIdToUsfm(bookId);
  const cacheKey = `${CACHE_PREFIX}${bibleId}_${usfm}_${chapter}`;

  // 1. Check local cache (14-day TTL)
  if (typeof localStorage !== "undefined") {
    const cachedStr = localStorage.getItem(cacheKey);
    if (cachedStr) {
      try {
        const cached: CachedChapter = JSON.parse(cachedStr);
        const age = Date.now() - cached.timestamp;
        if (age < CACHE_TTL_MS && Array.isArray(cached.verses) && cached.verses.length > 0) {
          return cached.verses;
        }
      } catch {
        localStorage.removeItem(cacheKey);
      }
    }
  }

  const apiKey = getBibleApiKey();
  if (!apiKey) {
    throw new Error(
      "API.Bible key missing. Add VITE_BIBLE_API_KEY in your .env or configure your key in Settings."
    );
  }

  // 2. Fetch from API.Bible
  const chapterId = `${usfm}.${chapter}`;
  const url = `${BIBLE_API_URL}/bibles/${encodeURIComponent(bibleId)}/chapters/${encodeURIComponent(
    chapterId
  )}?content-type=json&include-verse-numbers=true`;

  const res = await fetch(url, {
    headers: {
      "api-key": apiKey
    }
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`API.Bible request failed (${res.status}): ${errText || res.statusText}`);
  }

  const json = await res.json();
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

  // 3. Store in 14-day cache
  if (typeof localStorage !== "undefined") {
    const cachePayload: CachedChapter = {
      timestamp: Date.now(),
      verses
    };
    try {
      localStorage.setItem(cacheKey, JSON.stringify(cachePayload));
    } catch {
      // localStorage may be full; gracefully continue
    }
  }

  return verses;
}
