/**
 * Compute the themes of the types map from the data and write public/connections/themes.json.
 *
 *   npx tsx scripts/connections/build_themes.ts
 *
 * Run it after pack_public.py, since it reads the types it writes. The editor chooses the words
 * (data/connections/themes.json); which types belong to each is computed (src/lib/typeThemes.ts).
 * tests/typeThemes.test.ts recomputes the file and fails if it was edited by hand or is out of date.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadThemeInputs, themesFromInputs } from "../../src/lib/typeThemesData";

const ROOT = join(import.meta.dirname, "..", "..");
const themes = themesFromInputs(loadThemeInputs(ROOT));
writeFileSync(join(ROOT, "public", "connections", "themes.json"), JSON.stringify(themes) + "\n");
for (const t of themes) console.log(String(t.members.length).padStart(3), t.id.padEnd(11), t.name, "·", t.xlit, t.greek.length ? "· " + t.greek.join(", ") : "");
const typeCount = loadThemeInputs(ROOT).types.length;
const inSome = new Set(themes.flatMap((t) => t.members.map((m) => m.type))).size;
console.log(`${inSome} of ${typeCount} types are in at least one theme.`);
