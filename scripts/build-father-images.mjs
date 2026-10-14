/**
 * Build hashed WebP portraits for the Fathers pages.
 * Tiles are cropped to 230×178 (and 2×). Heroes are cropped to the 489×336 frame.
 * Sources narrower than a target are not enlarged. Re-running is a no-op when
 * the JPEGs and credits.json are unchanged.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC_DIR = join(ROOT, "public", "assets", "fathers");
const OUT_DIR = join(ROOT, "public", "assets", "father-img");
const MANIFEST = join(ROOT, "src", "generated", "fatherImageManifest.json");
const CREDITS = join(SRC_DIR, "credits.json");
const STAMP = join(OUT_DIR, "stamp.json");
const VERSION = 1;

const TILE_ASPECT = 178 / 230;
const HERO_ASPECT = 336 / 489;

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

function namesFromEnglishWorks() {
  const text = readFileSync(join(ROOT, "server", "englishWorks.ts"), "utf8");
  const names = {};
  for (const match of text.matchAll(/^\s{2}([a-z0-9_]+):\s*\{[^}]*?name:\s*"([^"]+)"/gm)) {
    names[match[1]] = match[2];
  }
  return names;
}

function loadCredits() {
  if (!existsSync(CREDITS)) return {};
  return JSON.parse(readFileSync(CREDITS, "utf8"));
}

function creditOf(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (!raw.license && !raw.artist) return null;
  return {
    artist: String(raw.artist || ""),
    license: String(raw.license || ""),
    licenseUrl: String(raw.licenseUrl || ""),
    source: String(raw.commonsPage || raw.source || ""),
    attributionRequired: raw.attributionRequired === true
  };
}

async function encode(input, width, height, targetBytes) {
  let quality = 64;
  let buf = Buffer.alloc(0);
  for (;;) {
    buf = await sharp(input)
      .resize(width, height, { fit: "cover", position: "attention" })
      .webp({ quality })
      .toBuffer();
    if (buf.length <= targetBytes || quality <= 42) break;
    quality -= 6;
  }
  return buf;
}

function plannedWidths(srcWidth, maxWidth) {
  const half = Math.round(maxWidth / 2);
  const widths = [half, maxWidth].filter((width) => width <= srcWidth);
  if (widths.length) return widths;
  return srcWidth > 0 ? [srcWidth] : [];
}

async function variants(input, srcWidth, maxWidth, aspect, targetBytes) {
  const widths = plannedWidths(srcWidth, maxWidth);
  const files = [];
  for (const width of widths) {
    const height = Math.max(1, Math.round(width * aspect));
    const bytes = await encode(input, width, height, width >= maxWidth ? targetBytes : Math.round(targetBytes * 0.55));
    const hash = sha256(bytes).slice(0, 10);
    files.push({ width, height, hash, bytes });
  }
  return files;
}

function writeVariant(id, file) {
  const name = id + "-" + file.width + "-" + file.hash + ".webp";
  const dest = join(OUT_DIR, name);
  if (!existsSync(dest)) writeFileSync(dest, file.bytes);
  return { name, width: file.width, height: file.height };
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const names = namesFromEnglishWorks();
  const credits = loadCredits();
  const jpgs = readdirSync(SRC_DIR)
    .filter((name) => name.endsWith(".jpg"))
    .sort();
  const fingerprint = sha256(
    Buffer.from(
      VERSION +
        "\n" +
        jpgs
          .map((name) => {
            const st = statSync(join(SRC_DIR, name));
            return name + ":" + st.size + ":" + st.mtimeMs;
          })
          .join("\n") +
        "\n" +
        (existsSync(CREDITS) ? readFileSync(CREDITS) : "")
    )
  );
  if (existsSync(STAMP) && existsSync(MANIFEST)) {
    const previous = JSON.parse(readFileSync(STAMP, "utf8"));
    if (previous.fingerprint === fingerprint) {
      console.log("[father-img] up to date (" + jpgs.length + " portraits)");
      return;
    }
  }

  const manifest = {};
  const keep = new Set(["stamp.json"]);
  for (const fileName of jpgs) {
    const id = fileName.replace(/\.jpg$/, "");
    const input = readFileSync(join(SRC_DIR, fileName));
    const meta = await sharp(input).metadata();
    const srcWidth = meta.width || 0;
    const tiles = await variants(input, srcWidth, 460, TILE_ASPECT, 30 * 1024);
    const heroes = await variants(input, srcWidth, 720, HERO_ASPECT, 70 * 1024);
    if (!tiles.length || !heroes.length) {
      console.log("[father-img] skip " + id + " (no pixels)");
      continue;
    }
    const tileFiles = tiles.map((file) => writeVariant(id, file));
    const heroFiles = heroes.map((file) => writeVariant(id, file));
    for (const file of [...tileFiles, ...heroFiles]) keep.add(file.name);
    const tileSrc = tileFiles[tileFiles.length - 1];
    const heroSrc = heroFiles[heroFiles.length - 1];
    const url = (name) => "/assets/father-img/" + name;
    manifest[id] = {
      alt: "Portrait of " + (names[id] || credits[id]?.title || id),
      tile: {
        src: url(tileSrc.name),
        srcset: tileFiles.map((file) => url(file.name) + " " + file.width + "w").join(", "),
        width: 230,
        height: 178
      },
      hero: {
        src: url(heroSrc.name),
        srcset: heroFiles.map((file) => url(file.name) + " " + file.width + "w").join(", "),
        width: 489,
        height: 336
      },
      credit: creditOf(credits[id])
    };
    const largest = tiles[tiles.length - 1];
    console.log(
      "[father-img] " + id + " tile " + Math.round(largest.bytes.length / 1024) + "KB @" + largest.width + "w"
    );
  }

  for (const name of readdirSync(OUT_DIR)) {
    if (name.endsWith(".webp") && !keep.has(name)) unlinkSync(join(OUT_DIR, name));
  }

  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
  writeFileSync(STAMP, JSON.stringify({ version: VERSION, fingerprint, count: jpgs.length }, null, 2) + "\n");
  console.log("[father-img] wrote " + Object.keys(manifest).length + " portraits");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
