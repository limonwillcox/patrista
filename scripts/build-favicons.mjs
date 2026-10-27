// Builds favicons from the original chi-rho artwork (assets/chi-rho-gold.png, 1024px, transparent).
// The glyph silhouette is trimmed, centered by its bounding box, and drawn white on the logo red.
// Run: node scripts/build-favicons.mjs
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const SRC = "assets/chi-rho-gold.png";
const RED = "#b22028";
const GLYPH = 0.64; // glyph height as a share of the canvas: even padding on all sides
const MASTER = 1024;

async function master() {
  const { data, info } = await sharp(SRC).ensureAlpha().extractChannel(3).raw().toBuffer({ resolveWithObject: true });
  // Hard threshold strips the soft edge fringe, then trim to the glyph's bounding box.
  for (let i = 0; i < data.length; i++) data[i] = data[i] > 140 ? 255 : 0;
  const mask = await sharp(data, { raw: { width: info.width, height: info.height, channels: 1 } }).trim({ threshold: 1 }).png().toBuffer();
  const glyph = await sharp(mask).resize({ height: Math.round(MASTER * GLYPH) }).toBuffer({ resolveWithObject: true });
  const white = await sharp({ create: { width: glyph.info.width, height: glyph.info.height, channels: 3, background: "#fff" } })
    .joinChannel(await sharp(glyph.data).toColourspace("b-w").raw().toBuffer(), { raw: { width: glyph.info.width, height: glyph.info.height, channels: 1 } })
    .png().toBuffer();
  return sharp({ create: { width: MASTER, height: MASTER, channels: 4, background: RED } })
    .composite([{ input: white, left: Math.round((MASTER - glyph.info.width) / 2), top: Math.round((MASTER - glyph.info.height) / 2) }])
    .png().toBuffer();
}

const big = await master();
const png = (s) => sharp(big).resize(s, s, { kernel: "lanczos3" }).png().toBuffer();
for (const [s, n] of [[48, "favicon-48x48.png"], [96, "favicon-96x96.png"], [192, "icon-192.png"], [512, "icon-512.png"], [180, "apple-touch-icon.png"]]) writeFileSync("public/" + n, await png(s));

const icoSizes = [16, 32, 48];
const imgs = await Promise.all(icoSizes.map(png));
const head = Buffer.alloc(6); head.writeUInt16LE(1, 2); head.writeUInt16LE(imgs.length, 4);
let off = 6 + 16 * imgs.length; const dir = [];
imgs.forEach((b, i) => { const e = Buffer.alloc(16); e[0] = e[1] = icoSizes[i]; e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(b.length, 8); e.writeUInt32LE(off, 12); off += b.length; dir.push(e); });
writeFileSync("public/favicon.ico", Buffer.concat([head, ...dir, ...imgs]));

// SVG wraps the 512 raster so browsers that prefer SVG still get the original artwork.
const b64 = (await png(512)).toString("base64");
writeFileSync("public/favicon.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><image width="512" height="512" href="data:image/png;base64,${b64}"/></svg>\n`);

if (process.argv.includes("--preview")) {
  const sizes = [16, 32, 48, 96, 180, 192, 512]; const tiles = []; let x = 10;
  for (const s of sizes) {
    const b = await png(s);
    tiles.push({ input: await sharp(b).resize(160, 160, { kernel: "nearest" }).png().toBuffer(), left: x, top: 10 });
    tiles.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="160" height="24"><text x="80" y="18" font-size="16" text-anchor="middle" font-family="sans-serif">${s}px</text></svg>`), left: x, top: 176 });
    tiles.push({ input: s <= 96 ? b : await sharp(b).resize(96).png().toBuffer(), left: x, top: 210 });
    x += 170;
  }
  await sharp({ create: { width: x, height: 320, channels: 4, background: "#fff" } }).composite(tiles).png().toFile(process.argv[process.argv.indexOf("--preview") + 1]);
}
