/**
 * Repair double-encoded UTF-8 in Father source texts.
 *
 * A file was decoded as Latin-1 / Windows-1252 and saved as UTF-8 again, so
 * "Æ" became "Ã†" and "é" became "Ã©". Each suspicious span is turned back
 * into bytes and decoded as UTF-8 only when that decode is valid and contains
 * fewer suspicious spans than the original. Text that is already UTF-8 is left
 * alone.
 *
 *   node --experimental-strip-types scripts/fix-mojibake.ts          # write
 *   node --experimental-strip-types scripts/fix-mojibake.ts --dry    # report
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

/** Unicode scalar to the byte Windows-1252 used for 0x80–0x9F. */
const CP1252_BYTE = new Map<number, number>([
  [0x20ac, 0x80],
  [0x201a, 0x82],
  [0x0192, 0x83],
  [0x201e, 0x84],
  [0x2026, 0x85],
  [0x2020, 0x86],
  [0x2021, 0x87],
  [0x02c6, 0x88],
  [0x2030, 0x89],
  [0x0160, 0x8a],
  [0x2039, 0x8b],
  [0x0152, 0x8c],
  [0x017d, 0x8e],
  [0x2018, 0x91],
  [0x2019, 0x92],
  [0x201c, 0x93],
  [0x201d, 0x94],
  [0x2022, 0x95],
  [0x2013, 0x96],
  [0x2014, 0x97],
  [0x02dc, 0x98],
  [0x2122, 0x99],
  [0x0161, 0x9a],
  [0x203a, 0x9b],
  [0x0153, 0x9c],
  [0x017e, 0x9e],
  [0x0178, 0x9f]
]);

export function byteOf(code: number): number | null {
  if (code >= 0 && code <= 0xff) return code;
  return CP1252_BYTE.get(code) ?? null;
}

function continuationCount(lead: number): number {
  if (lead >= 0xc2 && lead <= 0xdf) return 1;
  if (lead >= 0xe0 && lead <= 0xef) return 2;
  if (lead >= 0xf0 && lead <= 0xf4) return 3;
  return 0;
}

/** Decode bytes as UTF-8. Null when the bytes are not a single valid sequence. */
export function decodeUtf8(bytes: number[]): string | null {
  const buf = Buffer.from(bytes);
  const text = buf.toString("utf8");
  if (text.includes("\uFFFD")) return null;
  if (!Buffer.from(text, "utf8").equals(buf)) return null;
  return text;
}

type Span = { fixed: string; end: number };

/** A byte sequence at `index` that is valid UTF-8, before the "fewer spans" check. */
function rawSpanAt(text: string, index: number): Span | null {
  const leadCode = text.codePointAt(index);
  if (leadCode === undefined) return null;
  const lead = byteOf(leadCode);
  if (lead === null) return null;
  const extra = continuationCount(lead);
  if (!extra) return null;

  const bytes = [lead];
  let cursor = index + (leadCode > 0xffff ? 2 : 1);
  for (let n = 0; n < extra; n += 1) {
    const code = text.codePointAt(cursor);
    if (code === undefined) return null;
    const byte = byteOf(code);
    if (byte === null || byte < 0x80 || byte > 0xbf) return null;
    bytes.push(byte);
    cursor += code > 0xffff ? 2 : 1;
  }

  const fixed = decodeUtf8(bytes);
  if (fixed === null) return null;
  if (fixed === text.slice(index, cursor)) return null;
  return { fixed, end: cursor };
}

export function countMojibake(text: string): number {
  let count = 0;
  for (let i = 0; i < text.length; ) {
    const hit = rawSpanAt(text, i);
    if (!hit) {
      const code = text.codePointAt(i) ?? 0;
      i += code > 0xffff ? 2 : 1;
      continue;
    }
    count += 1;
    i = hit.end;
  }
  return count;
}

/**
 * If `text` has a double-encoded UTF-8 sequence at `index`, return the repaired
 * character(s) and the index just after the sequence.
 */
export function mojibakeAt(text: string, index: number): Span | null {
  const hit = rawSpanAt(text, index);
  if (!hit) return null;
  const original = text.slice(index, hit.end);
  if (countMojibake(hit.fixed) >= countMojibake(original)) return null;
  return hit;
}

export function repairMojibake(text: string): { text: string; replacements: number } {
  let current = text;
  let replacements = 0;
  // A second layer ("ÃƒÂ©" -> "Ã©" -> "é") needs another pass.
  for (let pass = 0; pass < 4; pass += 1) {
    let next = "";
    let found = 0;
    for (let i = 0; i < current.length; ) {
      const hit = mojibakeAt(current, i);
      if (!hit) {
        const code = current.codePointAt(i) ?? 0;
        next += current[i];
        if (code > 0xffff) next += current[i + 1];
        i += code > 0xffff ? 2 : 1;
        continue;
      }
      next += hit.fixed;
      found += 1;
      i = hit.end;
    }
    replacements += found;
    current = next;
    if (!found) break;
  }
  return { text: current, replacements };
}

function sourceFiles(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      const stat = statSync(path);
      if (stat.isDirectory()) {
        walk(path);
        continue;
      }
      if (name.endsWith(".txt")) out.push(path);
    }
  };
  walk(root);
  out.sort();
  return out;
}

function main() {
  const dry = process.argv.includes("--dry");
  const root = join(process.cwd(), "Fathers");
  const files = sourceFiles(root);
  let changedFiles = 0;
  let replacements = 0;
  const examples: string[] = [];
  for (const path of files) {
    const original = readFileSync(path, "utf8");
    const repaired = repairMojibake(original);
    if (!repaired.replacements) continue;
    changedFiles += 1;
    replacements += repaired.replacements;
    if (examples.length < 12) {
      for (let i = 0; i < original.length && examples.length < 12; ) {
        const hit = mojibakeAt(original, i);
        if (hit) {
          examples.push(
            relative(process.cwd(), path) + ": " + JSON.stringify(original.slice(i, hit.end)) + " -> " + JSON.stringify(hit.fixed)
          );
          break;
        }
        i += 1;
      }
    }
    if (!dry) writeFileSync(path, repaired.text);
  }
  console.log(
    (dry ? "[dry] " : "") +
      changedFiles +
      " files, " +
      replacements +
      " replacements, " +
      files.length +
      " scanned"
  );
  for (const line of examples) console.log("  " + line);

  if (!dry) {
    let left = 0;
    for (const path of files) left += countMojibake(readFileSync(path, "utf8"));
    console.log("remaining suspicious sequences: " + left);
  }
}

const invoked = process.argv[1] && process.argv[1].endsWith("fix-mojibake.ts");
if (invoked) main();
