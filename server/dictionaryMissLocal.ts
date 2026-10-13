import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { parseMissRecord, type DictMissRecord } from "./dictionaryMiss";

export function dictionaryInboxDir(root: string): string {
  return join(root, "data", "dictionary", "inbox");
}

export function readLocalMiss(root: string, word: string): DictMissRecord | null {
  try {
    return parseMissRecord(readFileSync(join(dictionaryInboxDir(root), word + ".json"), "utf8"));
  } catch {
    return null;
  }
}

export function writeLocalMiss(root: string, record: DictMissRecord): { path: string } {
  const inbox = dictionaryInboxDir(root);
  mkdirSync(inbox, { recursive: true });
  const path = join(inbox, record.word + ".json");
  writeFileSync(path, JSON.stringify(record, null, 2) + "\n");
  return { path };
}

export function listLocalMisses(root: string): DictMissRecord[] {
  let names: string[] = [];
  try {
    names = readdirSync(dictionaryInboxDir(root));
  } catch {
    return [];
  }
  const out: DictMissRecord[] = [];
  for (const name of names) {
    if (!name.endsWith(".json")) continue;
    try {
      const rec = parseMissRecord(readFileSync(join(dictionaryInboxDir(root), name), "utf8"));
      if (rec) out.push(rec);
    } catch {
      /* skip */
    }
  }
  return out;
}
