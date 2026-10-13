export const WEBSTER_SOURCE = "Webster's Revised Unabridged Dictionary (1913)";

export const WEBSTER_WORD_URL =
  "https://raw.githubusercontent.com/ParitoshKumarTripathi/Free-Dictionary-API/main/dictionary/";

export type WebsterEntry = {
  headword: string;
  senses: string[];
};

export function normalizeHeadword(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[“”]/g, '"')
    .replace(/[^a-z'-]/g, "")
    .replace(/^'+|'+$/g, "");
}

export type DictionaryMode = "idle" | "pick" | "load" | "show" | "miss";

export function dictionaryBarClick(mode: DictionaryMode): DictionaryMode {
  return mode === "idle" ? "pick" : "idle";
}

export function missQueueWord(raw: string): string | null {
  const word = normalizeHeadword(raw);
  if (word.length < 2 || word.length > 40) return null;
  return word;
}

const reportedMisses = new Set<string>();

export function reportDictionaryMiss(raw: string, work?: string | null): void {
  const word = missQueueWord(raw);
  if (!word || reportedMisses.has(word)) return;
  reportedMisses.add(word);
  const base = (import.meta.env.VITE_DONATE_API_BASE || "").replace(/\/+$/, "");
  fetch(base + "/api/dictionary/miss", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ word: raw, work: work || undefined }),
    keepalive: true
  }).catch(() => {});
}

export function headwordCandidates(raw: string): string[] {
  const n = normalizeHeadword(raw);
  if (!n) return [];
  const out: string[] = [n];
  const add = (w: string) => {
    if (w && w !== n && w.length >= 2 && !out.includes(w)) out.push(w);
  };
  if (n.endsWith("'s") && n.length > 4) add(n.slice(0, -2));
  if (n.endsWith("ies") && n.length > 5) add(n.slice(0, -3) + "y");
  else {
    if (n.endsWith("es") && n.length > 4) add(n.slice(0, -2));
    if (n.endsWith("s") && !n.endsWith("ss") && n.length > 3) add(n.slice(0, -1));
  }
  if (n.endsWith("ed") && n.length > 4) {
    add(n.slice(0, -2));
    add(n.slice(0, -1));
  }
  if (n.endsWith("ing") && n.length > 5) add(n.slice(0, -3));
  return out;
}

export function wordAtOffset(text: string, offset: number): string | null {
  if (!text || offset < 0 || offset > text.length) return null;
  let i = Math.min(offset, text.length - 1);
  if (i < 0) return null;
  const isWord = (ch: string) => /[A-Za-z']/.test(ch);
  if (!isWord(text[i] || "") && i > 0 && isWord(text[i - 1] || "")) i -= 1;
  if (!isWord(text[i] || "")) return null;
  let a = i;
  let b = i + 1;
  while (a > 0 && isWord(text[a - 1] || "")) a -= 1;
  while (b < text.length && isWord(text[b] || "")) b += 1;
  const word = text.slice(a, b);
  return normalizeHeadword(word) ? word : null;
}

export function parseWebsterEntry(raw: string): WebsterEntry | null {
  const text = String(raw || "").replace(/\r/g, "").trim();
  if (!text || /^404\b/i.test(text)) return null;
  const first = text.split("=====")[0] || text;
  const headLine = first.split("\n").find((line) => /[A-Za-z]/.test(line)) || "";
  const headword = headLine.replace(/[^A-Za-z'-].*$/, "").trim() || headLine.trim();
  const senses: string[] = [];
  const numbered = first.matchAll(
    /(?:^|\n)\s*(\d+)\.\s+(\S[\s\S]*?)(?=\n\s*\d+\.\s+|\nDefn:|\n=====|$)/g
  );
  for (const m of numbered) {
    const sense = tidySense(m[2] || "");
    if (sense) senses.push(sense);
    if (senses.length >= 3) break;
  }
  if (!senses.length) {
    const defns = first.matchAll(/Defn:\s*(\S[\s\S]*?)(?=\nDefn:|\n\s*\d+\.\s+|\n=====|$)/g);
    for (const m of defns) {
      const sense = tidySense(m[1] || "");
      if (sense) senses.push(sense);
      if (senses.length >= 3) break;
    }
  }
  if (!headword || !senses.length) return null;
  return { headword, senses };
}

function tidySense(raw: string): string {
  const line = raw
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s*Defn:\s*/g, " ")
    .trim();
  if (line.length < 8) return "";
  const sentence = firstSentence(line);
  return sentence.length > 320 ? sentence.slice(0, 317).replace(/\s+\S*$/, "") + "…" : sentence;
}

function firstSentence(text: string): string {
  const m = text.match(/^[\s\S]*?[.!?](?=\s+[A-Z]|$)/);
  return m ? m[0] : text;
}

export function wordFromPoint(x: number, y: number): string | null {
  const doc = document as Document & {
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
  };
  let node: Node | null = null;
  let offset = 0;
  if (typeof doc.caretPositionFromPoint === "function") {
    const pos = doc.caretPositionFromPoint(x, y);
    if (pos) {
      node = pos.offsetNode;
      offset = pos.offset;
    }
  } else if (typeof doc.caretRangeFromPoint === "function") {
    const range = doc.caretRangeFromPoint(x, y);
    if (range) {
      node = range.startContainer;
      offset = range.startOffset;
    }
  }
  if (!node) return null;
  if (node.nodeType !== Node.TEXT_NODE) {
    const el = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
    if (!el?.closest(".para")) return null;
    return null;
  }
  const el = node.parentElement;
  if (!el?.closest(".para")) return null;
  return wordAtOffset(node.textContent || "", offset);
}

const cache = new Map<string, WebsterEntry | null>();

export async function lookupWebster(raw: string): Promise<WebsterEntry | null> {
  const candidates = headwordCandidates(raw);
  for (const word of candidates) {
    if (cache.has(word)) {
      const hit = cache.get(word);
      if (hit) return hit;
      continue;
    }
    const url = WEBSTER_WORD_URL + encodeURIComponent(word) + ".txt";
    const res = await fetch(url);
    if (!res.ok) {
      cache.set(word, null);
      continue;
    }
    const entry = parseWebsterEntry(await res.text());
    cache.set(word, entry);
    if (entry) return entry;
  }
  return null;
}
