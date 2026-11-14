import type { Meta, TypeEntry } from "../api/connections";

/*
 * Sharing the types map: what a share is called, where its link goes, and the picture that goes with it.
 * A type has a page of its own (/types/<slug>/), written at build time with its picture
 * (server/typeSharePages.ts), so a pasted link shows the diagram. A Father, a chapter or a theme is
 * shared as the map's own address (/types?father=…). The same picture is drawn here for "Copy picture".
 * Nothing in this file may load src/api/connections at run time: the build imports it too.
 */

/** A type's id as it appears in a URL: "04:paschal-lamb" → "paschal-lamb". */
export const typeSlug = (id: string) => id.replace(/^\d+:/, "");
export const typeSharePath = (t: TypeEntry) => "/types/" + typeSlug(t.id) + "/";
export const typeCardPath = (t: TypeEntry) => "/share/types/" + typeSlug(t.id) + ".png";

export type Share = {
  title: string;
  subtitle: string;
  /** The page to open, from the site root. */
  path: string;
  /** The same thing as a bare diagram for another site to frame. */
  embedPath: string;
  /** The types drawn on the picture. */
  drawn: TypeEntry[];
};

const bookName = (meta: Meta, vid: number) => meta.books[Math.floor(vid / 1_000_000) - 1]?.name ?? "";
const count = (n: number, one: string, many: string) => n + " " + (n === 1 ? one : many);

/** "Genesis → John · 6 passages". */
export function typeSpan(meta: Meta, t: TypeEntry): string {
  const sorted = [...t.ranges].sort((a, b) => a[0] - b[0]);
  if (!sorted.length) return "";
  const first = bookName(meta, sorted[0][0]);
  const last = bookName(meta, sorted[sorted.length - 1][0]);
  return (first === last ? first : first + " → " + last) + " · " + count(sorted.length, "passage", "passages");
}

/**
 * What the map is showing, as something to share. An open type comes first, then a chapter, a theme, a
 * Father; with none of them it is the whole map. `drawn` is the types that state keeps bright.
 */
export function describeShare(
  meta: Meta,
  s: {
    type?: TypeEntry | null;
    place?: { book: number; chapter: number } | null;
    theme?: { id: string; name: string } | null;
    father?: string | null;
    drawn: TypeEntry[];
  }
): Share {
  if (s.type) {
    return {
      title: s.type.label,
      subtitle: typeSpan(meta, s.type),
      path: typeSharePath(s.type),
      embedPath: "/embed/types?type=" + encodeURIComponent(typeSlug(s.type.id)),
      drawn: [s.type]
    };
  }
  const types = count(s.drawn.length, "type of Christ", "types of Christ");
  if (s.place) {
    const book = meta.books[s.place.book - 1];
    const q = "?at=" + book.id + "." + s.place.chapter;
    return { title: book.name + " " + s.place.chapter, subtitle: types + " the Fathers saw here", path: "/types" + q, embedPath: "/embed/types" + q, drawn: s.drawn };
  }
  if (s.theme) {
    const q = "?theme=" + encodeURIComponent(s.theme.id);
    return {
      title: s.theme.name.charAt(0).toUpperCase() + s.theme.name.slice(1),
      subtitle: types + " named together",
      path: "/types" + q,
      embedPath: "/embed/types" + q,
      drawn: s.drawn
    };
  }
  if (s.father) {
    const q = "?father=" + encodeURIComponent(s.father);
    return { title: "The types " + s.father + " saw", subtitle: types + ", Genesis to Revelation", path: "/types" + q, embedPath: "/embed/types" + q, drawn: s.drawn };
  }
  return {
    title: "Types of Christ in Scripture",
    subtitle: types + " the Church Fathers saw, Genesis to Revelation",
    path: "/types",
    embedPath: "/embed/types",
    drawn: s.drawn
  };
}

/** The snippet that puts the diagram on another site. */
export function embedCode(origin: string, share: Pick<Share, "title" | "embedPath">): string {
  const title = share.title.replace(/"/g, "&quot;");
  return (
    '<iframe src="' + origin + share.embedPath.replace(/&/g, "&amp;") + '" title="' + title + ' · Patrista" ' +
    'width="100%" height="460" style="border:0;max-width:900px" loading="lazy"></iframe>'
  );
}

/* ---------- the picture ---------- */

export const CARD_W = 1200;
export const CARD_H = 630;

/** "hsl(120 64% 43%)" as "#rrggbb": the picture is also drawn by tools that do not read every CSS colour form. */
export function hexColor(css: string): string {
  const m = css.match(/^hsl\(\s*([\d.]+)[,\s]+([\d.]+)%[,\s]+([\d.]+)%\s*\)$/);
  if (!m) return css;
  const h = Number(m[1]) / 360;
  const sat = Number(m[2]) / 100;
  const l = Number(m[3]) / 100;
  const q = l < 0.5 ? l * (1 + sat) : l + sat - l * sat;
  const p = 2 * l - q;
  const channel = (t: number) => {
    t = (t + 1) % 1;
    const v = t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p;
    return Math.round(v * 255).toString(16).padStart(2, "0");
  };
  return "#" + channel(h + 1 / 3) + channel(h) + channel(h - 1 / 3);
}

const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Break a title into at most `lines` lines of about `width` characters, ending with … if it is cut. */
export function wrapTitle(text: string, width: number, lines: number): string[] {
  const out: string[] = [];
  let line = "";
  const words = text.split(/\s+/).filter(Boolean);
  for (let i = 0; i < words.length; i++) {
    const next = line ? line + " " + words[i] : words[i];
    if (next.length <= width || !line) {
      line = next;
      continue;
    }
    if (out.length === lines - 1) {
      line = line.replace(/[\s,;:·→-]+$/, "") + "…";
      i = words.length;
      break;
    }
    out.push(line);
    line = words[i];
  }
  out.push(line);
  return out;
}

/** What a picture draws over the Bible's line. Verse ids; a colour for each. */
export type CardDrawing = {
  /** The small line above the title. */
  kicker: string;
  arcs: { from: number; to: number; color: string }[];
  dots: { vid: number; color: string }[];
  /** Few arcs are drawn bold with their ends marked; many are drawn fine. */
  bold: boolean;
};

/**
 * The share picture, 1200 × 630, as an SVG with every colour written out (it is drawn outside the page,
 * where the site's styles do not reach): the title, the Bible as a line, and arcs or dots over it.
 */
export function cardSvg(meta: Meta, title0: string, subtitle: string, drawing: CardDrawing): string {
  const offsets = [0];
  for (const b of meta.books) offsets.push(offsets[offsets.length - 1] + b.chapters);
  const total = offsets[offsets.length - 1];
  const PAD = 64;
  const BASE = 532;
  const inner = CARD_W - 2 * PAD;
  const x = (vid: number) => {
    const book = Math.floor(vid / 1_000_000);
    const chapter = Math.floor(vid / 1000) % 1000;
    const verse = vid % 1000;
    return PAD + ((offsets[book - 1] + chapter - 1 + Math.min(verse, 60) / 61) / total) * inner;
  };
  const r1 = (n: number) => Math.round(n * 10) / 10;

  const title = wrapTitle(title0, 40, 2);
  const titleSize = title.length > 1 || title0.length > 30 ? 46 : 56;
  const titleY = 152;
  const subY = titleY + (title.length - 1) * (titleSize + 8) + 44;
  const MAX_H = BASE - subY - 34;

  const spans = drawing.arcs.map((a) => [x(a.from), x(a.to)] as const);
  // Arcs rise in proportion to their span. The widest one drawn fills the room under the words, but none
  // rises more than about half its own width, so a short arc stays an arc and not a spike.
  const widest = Math.max(1, ...spans.map(([a, b]) => Math.abs(b - a)));
  const rise = Math.min(MAX_H / widest, 0.55);
  const bold = drawing.bold;
  const arcs = drawing.arcs.map((a, i) => {
    const [x0, x1] = spans[i];
    const k = (Math.abs(x1 - x0) * rise * 4) / 3;
    return `<path d="M${r1(x0)},${BASE} C${r1(x0)},${r1(BASE - k)} ${r1(x1)},${r1(BASE - k)} ${r1(x1)},${BASE}" fill="none" stroke="${xml(hexColor(a.color))}" stroke-width="${bold ? 3.5 : 1.6}" stroke-opacity="${bold ? 0.95 : 0.55}" stroke-linecap="round"/>`;
  });
  const dots = drawing.dots.map(
    (d) => `<circle cx="${r1(x(d.vid))}" cy="${BASE}" r="${bold ? 6 : 4}" fill="${xml(hexColor(d.color))}" stroke="#faf7f1" stroke-width="${bold ? 2 : 1}"/>`
  );

  const nt = PAD + (offsets[39] / total) * inner;
  const sans = "'Source Sans 3', 'Segoe UI', Helvetica, Arial, sans-serif";
  const serif = "'Source Serif 4', Georgia, 'Times New Roman', serif";
  const small = `font-family="${sans}" font-size="17" font-weight="700" letter-spacing="2.4" fill="#6b645a"`;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${CARD_H}" viewBox="0 0 ${CARD_W} ${CARD_H}">`,
    `<rect width="${CARD_W}" height="${CARD_H}" fill="#faf7f1"/>`,
    `<rect width="${CARD_W}" height="10" fill="#952004"/>`,
    `<text x="${PAD}" y="84" font-family="${sans}" font-size="19" font-weight="700" letter-spacing="2.6" fill="#952004">${xml(drawing.kicker.toUpperCase())}</text>`,
    `<text x="${CARD_W - PAD}" y="84" text-anchor="end" font-family="${serif}" font-size="26" font-weight="600" fill="#952004">patrista.com</text>`,
    ...title.map(
      (line, i) =>
        `<text x="${PAD}" y="${titleY + i * (titleSize + 8)}" font-family="${serif}" font-size="${titleSize}" font-weight="600" fill="#1f1f1f">${xml(line)}</text>`
    ),
    `<text x="${PAD}" y="${subY}" font-family="${sans}" font-size="26" fill="#6b645a">${xml(subtitle)}</text>`,
    ...arcs,
    `<line x1="${PAD}" y1="${BASE}" x2="${CARD_W - PAD}" y2="${BASE}" stroke="#1f1f1f" stroke-opacity="0.45" stroke-width="1.5"/>`,
    `<line x1="${r1(nt)}" y1="${BASE - 14}" x2="${r1(nt)}" y2="${BASE + 14}" stroke="#6b645a" stroke-width="1.5" stroke-dasharray="3 4"/>`,
    ...dots,
    `<text x="${PAD}" y="${BASE + 44}" ${small}>GENESIS</text>`,
    `<text x="${r1(nt)}" y="${BASE + 44}" text-anchor="middle" ${small}>MATTHEW</text>`,
    `<text x="${CARD_W - PAD}" y="${BASE + 44}" text-anchor="end" ${small}>REVELATION</text>`,
    "</svg>"
  ].join("");
}

/** The picture of types on the map: each type's passages joined in order, in its colour. */
export function shareCardSvg(meta: Meta, share: Share, color: (typeId: string) => string): string {
  const bold = share.drawn.length <= 3;
  const arcs: CardDrawing["arcs"] = [];
  const dots: CardDrawing["dots"] = [];
  for (const t of share.drawn) {
    const c = color(t.id);
    const ps = [...t.ranges].sort((a, b) => a[0] - b[0] || a[1] - b[1]).map((r) => r[0]);
    for (let i = 1; i < ps.length; i++) arcs.push({ from: ps[i - 1], to: ps[i], color: c });
    if (bold) for (const vid of ps) dots.push({ vid, color: c });
  }
  return cardSvg(meta, share.title, share.subtitle, { kicker: "Types of Christ in Scripture", arcs, dots, bold });
}
