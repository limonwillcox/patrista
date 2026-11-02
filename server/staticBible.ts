import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { getBibleChapterPayload, getBibleManifest } from "./bible";
import { getBibleTextChapter, localTextTranslations } from "./bibleText";
import { repoRoot } from "./corpus";

export function writeStaticBibleApi(dist: string, root = repoRoot()): string[] {
  const bibleDir = join(dist, "api", "bible");
  mkdirSync(bibleDir, { recursive: true });
  const manifest = getBibleManifest(root);
  writeFileSync(join(bibleDir, "manifest.json"), JSON.stringify(manifest));
  const redirects = ["/api/bible/manifest  /api/bible/manifest.json  200"];
  for (const book of manifest) {
    const bookDir = join(bibleDir, book.id);
    mkdirSync(bookDir, { recursive: true });
    for (let n = 1; n <= book.chapters; n++) {
      const payload = getBibleChapterPayload(root, book.id, n);
      if (!payload) continue;
      writeFileSync(join(bookDir, n + ".json"), JSON.stringify(payload));
      redirects.push(
        "/api/bible/" + book.id + "/" + n + "  /api/bible/" + book.id + "/" + n + ".json  200"
      );
    }
  }
  writeStaticBibleText(dist, root);
  return redirects;
}

/**
 * The local translations' text, one small file per chapter: /api/bible/text/<translation>/<book>/<n>.json.
 * The client always asks for the .json file on the static site, so these need no redirect lines.
 */
export function writeStaticBibleText(dist: string, root = repoRoot()): number {
  let written = 0;
  for (const translation of localTextTranslations()) {
    for (const book of getBibleManifest(root)) {
      const dir = join(dist, "api", "bible", "text", translation, book.id);
      for (let n = 1; n <= book.chapters; n++) {
        const text = getBibleTextChapter(root, translation, book.id, n);
        if (!text) continue;
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, n + ".json"), JSON.stringify(text));
        written++;
      }
    }
  }
  return written;
}
