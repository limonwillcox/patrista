import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { getBibleChapterPayload, getBibleManifest } from "./bible";
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
  return redirects;
}
