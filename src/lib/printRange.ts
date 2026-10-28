/** "1-3,7" <-> sorted chapter numbers, clamped to 1..max. */
export function parseChapterRange(spec: string | null, max: number): number[] {
  if (!spec) return Array.from({ length: max }, (_, i) => i + 1);
  const out = new Set<number>();
  for (const part of spec.split(",")) {
    const m = part.trim().match(/^(\d+)(?:-(\d+))?$/);
    if (!m) continue;
    const a = Number(m[1]);
    const b = m[2] ? Number(m[2]) : a;
    for (let n = Math.min(a, b); n <= Math.max(a, b); n++) if (n >= 1 && n <= max) out.add(n);
  }
  return [...out].sort((x, y) => x - y);
}

export function formatChapterRange(chapters: number[]): string {
  const sorted = [...new Set(chapters)].sort((a, b) => a - b);
  const parts: string[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const start = sorted[i];
    while (i + 1 < sorted.length && sorted[i + 1] === sorted[i] + 1) i++;
    parts.push(start === sorted[i] ? String(start) : start + "-" + sorted[i]);
  }
  return parts.join(",");
}

/**
 * Nested selection for two-level works. Tokens: "2" = whole book 2, "1-3" = books 1..3,
 * "2.3" = book 2 chapter 3, "2.3-2.7" (or "2.3-7") = book 2 chapters 3..7. Keys are "b" or "b.n".
 */
export type PrintUnit = { chapter: number; subs: number };

export function parseSelection(spec: string | null, units: PrintUnit[]): Set<string> {
  const out = new Set<string>();
  const byNum = new Map(units.map((u) => [u.chapter, u]));
  const addBook = (b: number) => {
    const u = byNum.get(b);
    if (!u) return;
    if (u.subs) for (let n = 1; n <= u.subs; n++) out.add(b + "." + n);
    else out.add(String(b));
  };
  if (!spec) {
    units.forEach((u) => addBook(u.chapter));
    return out;
  }
  for (const raw of spec.split(",")) {
    const part = raw.trim();
    let m = part.match(/^(\d+)\.(\d+)(?:-(?:(\d+)\.)?(\d+))?$/);
    if (m) {
      const b = Number(m[1]);
      const u = byNum.get(b);
      if (!u || !u.subs) continue;
      const a = Number(m[2]);
      const z = m[4] ? Number(m[4]) : a;
      for (let n = Math.max(1, Math.min(a, z)); n <= Math.min(u.subs, Math.max(a, z)); n++) out.add(b + "." + n);
      continue;
    }
    m = part.match(/^(\d+)(?:-(\d+))?$/);
    if (m) {
      const a = Number(m[1]);
      const z = m[2] ? Number(m[2]) : a;
      for (let b = Math.min(a, z); b <= Math.max(a, z); b++) addBook(b);
    }
  }
  return out;
}

export function formatSelection(sel: Set<string>, units: PrintUnit[]): string {
  const wholeBooks: number[] = [];
  const parts: string[] = [];
  for (const u of units) {
    if (!u.subs) {
      if (sel.has(String(u.chapter))) wholeBooks.push(u.chapter);
      continue;
    }
    const picked: number[] = [];
    for (let n = 1; n <= u.subs; n++) if (sel.has(u.chapter + "." + n)) picked.push(n);
    if (picked.length === u.subs) wholeBooks.push(u.chapter);
    else if (picked.length) {
      for (const r of formatChapterRange(picked).split(",")) {
        const [a, z] = r.split("-");
        parts.push(u.chapter + "." + a + (z ? "-" + z : ""));
      }
    }
  }
  const books = wholeBooks.length ? formatChapterRange(wholeBooks).split(",") : [];
  return [...books, ...parts].join(",");
}
