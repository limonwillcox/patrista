import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import sharp from "sharp";
import type { Meta, TypeEntry } from "../src/api/connections";
import { firstThemeOf, themeColor } from "../src/lib/themeColors";
import { computeGatherings, nameGatherings } from "../src/lib/typeGatherings";
import { describeShare, shareCardSvg, typeCardPath, typeSharePath } from "../src/lib/typeShare";
import { prerenderShell } from "./staticFathers";

/**
 * A page and a picture for each type, so a shared link (/types/<slug>/) shows the type's own diagram where
 * it is pasted. The page is the app's shell with the type's title, description and picture in its head;
 * the app then opens the type on the map. Two files per type: about 200 in all, well inside the host's limit.
 */

type CatalogLike = Parameters<typeof nameGatherings>[1];

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** "Lactantius, *The Divine Institutes* 91.12 — “…”" without the emphasis marks. */
const plain = (s: string) => s.replace(/\*/g, "");

/** The page title, inside the 60 characters a search result shows. */
export function typeTitle(t: TypeEntry): string {
  for (const tail of [" · Types of Christ · Patrista", " · Patrista", ""]) {
    if (t.label.length + tail.length <= 60) return t.label + tail;
  }
  return t.label.slice(0, 59).replace(/\s+\S*$/, "") + "…";
}

/** The description, kept between the 100 and 160 characters a search result shows. */
export function typeDescription(meta: Meta, t: TypeEntry): string {
  const share = describeShare(meta, { type: t, drawn: [t] });
  let text = [t.def, share.subtitle + "."].filter(Boolean).join(" ");
  if (text.length < 100) text = "A type of Christ the Church Fathers saw in Scripture: " + t.label + ". " + text;
  if (text.length < 100) text += " Read it with the Fathers' own words on Patrista.";
  return text.length > 160 ? text.slice(0, 157).replace(/\s+\S*$/, "") + "…" : text;
}

export function typeBodyHtml(t: TypeEntry): string {
  const quotes = t.where
    .slice(0, 6)
    .map((w) => "<li>" + esc(plain(w)) + "</li>")
    .join("");
  return (
    '<div class="prose"><h1>' + esc(t.label) + "</h1>" +
    (t.def ? "<p>" + esc(t.def) + "</p>" : "") +
    (t.christ ? "<p>" + esc(t.christ) + "</p>" : "") +
    (quotes ? "<ul>" + quotes + "</ul>" : "") +
    '<p><a href="/types">Every type of Christ in Scripture</a></p></div>'
  );
}

export async function writeTypeSharePages(
  dist: string,
  shell: string,
  origin: string,
  connectionsDir: string,
  catalog: CatalogLike
): Promise<{ urls: string[] }> {
  const meta = readJson<Meta>(join(connectionsDir, "meta.json"));
  const types = readJson<TypeEntry[]>(join(connectionsDir, "types.json"));
  // The same colours as the map: a type takes the colour of the first theme it is in.
  const themes = nameGatherings(computeGatherings(types), catalog);
  const firstTheme = firstThemeOf(themes);
  const color = (id: string) => themeColor(firstTheme.get(id) ?? -1, themes.length, false);

  const urls: string[] = [];
  for (const t of types) {
    const share = describeShare(meta, { type: t, drawn: [t] });
    const path = typeSharePath(t);
    const image = join(dist, typeCardPath(t));
    mkdirSync(dirname(image), { recursive: true });
    await sharp(Buffer.from(shareCardSvg(meta, share, color))).png({ compressionLevel: 9 }).toFile(image);

    const page = join(dist, path, "index.html");
    mkdirSync(dirname(page), { recursive: true });
    writeFileSync(
      page,
      prerenderShell(shell, origin, {
        canonicalPath: path,
        title: typeTitle(t),
        description: typeDescription(meta, t),
        bodyHtml: typeBodyHtml(t),
        imagePath: typeCardPath(t)
      })
    );
    urls.push(origin + path);
  }
  return { urls };
}
