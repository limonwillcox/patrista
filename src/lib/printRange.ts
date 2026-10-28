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
