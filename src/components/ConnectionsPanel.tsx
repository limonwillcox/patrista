import { useEffect, useId, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { fetchBibleChapter } from "../api/client";
import { fetchStrongs, fetchTaggedChapter, type StrongsEntry, type Tagged } from "../api/strongs";
import {
  bibleHrefFor,
  bookOf,
  canonPosition,
  chapterOffsets,
  fetchChapterConnections,
  fetchCited,
  fetchGlosses,
  fetchMeta,
  fetchTypes,
  fetchWordInfo,
  GROUP_COLOR,
  rangeLabel,
  refLabel,
  splitVid,
  vidOf,
  type ChapterConnections,
  type CuratedLink,
  type Meta,
  type TypeEntry,
  type WordInfo
} from "../api/connections";
import { fetchChapterCitations, type ChapterCitations, type VerseCite } from "../api/scripture";
import { mergeCites, Thread, type CitingPassage } from "./FathersThread";
import { NotesBar } from "./NotesBar";
import { ShareButton, type Shareable } from "./ShareButton";
import { cardSvg, describeShare, shareCardSvg } from "../lib/typeShare";
import { SAVED_CONNECTIONS_KEY } from "../../server/syncKeys";
import { noteChange, onRemoteChange } from "../lib/accountSync";
import { findPatterns, groupCurated, overlaps, STRENGTH_TEXT, type Pattern, type Strength, type TypeLink } from "../lib/connectionPatterns";

/*
 * The Connections tab. It looks at one place at a time, set by the reader's last action:
 *  - a word (double-click):   where else the word appears, and which of those verses the Fathers discuss
 *  - a verse (click):         the types the Fathers draw from it, and the patterns it belongs to
 *  - a passage (select):      the same, with links from several verses grouped into larger patterns
 * Following a pattern opens it here without moving the reader; back and forward walk the trail.
 */

/** The reader's last action. Verse numbers are in the reader's chapter; n is new for every action. */
/** word: a Strong's code; text: the English word the reader chose for it ("affection" for G5426, whose usual gloss is "mind"). */
export type CxFocus = { from: number; to: number; word?: string; text?: string; codes?: string[]; n: number };

/** A place the tab looks at. Verse ids, so a place can be in any chapter. */
type Place = {
  from: number;
  to: number;
  word?: string;
  /** the English word chosen in the reader, shown as the heading */
  text?: string;
  codes?: string[];
  /** a type the Fathers draw, opened from this place */
  type?: string;
  /** followed the reader, not chosen */
  auto?: boolean;
};
const samePlace = (a: Place, b: Place) =>
  a.from === b.from && a.to === b.to && a.word === b.word && a.type === b.type && (a.codes ?? []).join() === (b.codes ?? []).join();

/** Where the tab has been. Kept outside the component, so it survives switching study tabs. */
const trail: { list: Place[]; at: number; seenAction: number; readerKey: string } = { list: [], at: -1, seenAction: 0, readerKey: "" };

/* ---------- small helpers ---------- */

const plural = (n: number, one: string, many = one + "s") => n + " " + (n === 1 ? one : many);

const chapters = new Map<string, Promise<string[] | null>>();
/** The KJV text of a verse. */
function useVerseText(meta: Meta | null, vid: number): string | null {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    if (!meta) return;
    const { chapter, verse } = splitVid(vid);
    const book = bookOf(meta, vid)?.id;
    if (!book) return;
    const key = book + "/" + chapter;
    let p = chapters.get(key);
    if (!p) {
      p = fetchBibleChapter(book, chapter, { translation: "kjv" })
        .then((c) => c.verses)
        .catch(() => null);
      chapters.set(key, p);
    }
    let live = true;
    setText(null);
    p.then((vs) => live && setText(vs?.[verse - 1] ?? null));
    return () => {
      live = false;
    };
  }, [meta, vid]);
  return text;
}

/**
 * Where the English words behind `codes` sit in the verse text, as [start, end] character spans. The
 * tagged text lists the verse's words in order with their codes ("+" carries on the word before). It
 * also holds formatting markers ("nd", "p", "q") and footnotes that are not in the text, so each word is
 * found as the text's nth copy of it, the way the reader finds a double-clicked word.
 */
function markSpans(text: string, tokens: Tagged[], codes: Set<string>): [number, number][] {
  const fold = (w: string) => w.toLowerCase().replace(/[’']/g, "").replace(/æ/g, "ae");
  // Every word of the text, by its folded spelling ("Cæsar" whole, not "C" and "sar").
  const where = new Map<string, [number, number][]>();
  for (const m of text.matchAll(/[A-Za-zÆæ’']+/g)) {
    const k = fold(m[0]);
    where.set(k, [...(where.get(k) ?? []), [m.index!, m.index! + m[0].length]]);
  }
  const seen = new Map<string, number>();
  const spans: [number, number][] = [];
  let prevHit = false;
  for (const [w, c] of tokens) {
    const hit: boolean = codes.has(c) || (c === "+" && prevHit);
    for (const part of w.split(/\s+/).filter(Boolean)) {
      const k = fold(part);
      const n = seen.get(k) ?? 0;
      seen.set(k, n + 1);
      const at = where.get(k)?.[n];
      if (hit && at) spans.push([...at]);
    }
    prevHit = hit;
  }
  // Words side by side make one mark: "as calves".
  spans.sort((a, b) => a[0] - b[0]);
  const out: [number, number][] = [];
  for (const s of spans) {
    const last = out[out.length - 1];
    if (last && text.slice(last[1], s[0]).trim() === "") last[1] = s[1];
    else out.push(s);
  }
  return out;
}

/** A verse's text, cut to about `max` letters around its first marked word, with the marks. */
function MarkedVerse({ meta, vid, codes, max = 170 }: { meta: Meta; vid: number; codes: string[]; max?: number }) {
  const text = useVerseText(meta, vid);
  const [tokens, setTokens] = useState<Tagged[] | null>(null);
  useEffect(() => {
    const book = bookOf(meta, vid)?.id;
    const { chapter, verse } = splitVid(vid);
    if (!book) return;
    let live = true;
    fetchTaggedChapter(book, chapter).then((v) => live && setTokens(v?.[String(verse)] ?? null));
    return () => {
      live = false;
    };
  }, [meta, vid]);
  if (!text) return null;
  const spans = tokens ? markSpans(text, tokens, new Set(codes)) : [];
  // Start the cut so the first mark shows.
  let from = 0;
  if (text.length > max && spans.length && spans[0][1] > max - 20) from = Math.max(0, text.lastIndexOf(" ", spans[0][0] - 40) + 1);
  const to = Math.min(text.length, from + max);
  const out: ReactNode[] = [];
  let at = from;
  for (const [a, b] of spans) {
    if (b <= from || a >= to) continue;
    out.push(text.slice(at, Math.max(at, a)));
    out.push(<mark key={a}>{text.slice(Math.max(a, from), Math.min(b, to))}</mark>);
    at = Math.min(b, to);
  }
  out.push(text.slice(at, to));
  return (
    <p className="cx-snippet">
      {from > 0 ? "…" : ""}
      {out}
      {to < text.length ? "…" : ""}
    </p>
  );
}

function useLex(codes: string[]): Record<string, StrongsEntry | null> {
  const [lex, setLex] = useState<Record<string, StrongsEntry | null>>({});
  const key = codes.join(",");
  useEffect(() => {
    let live = true;
    Promise.all(codes.map(async (c) => [c, await fetchStrongs(c)] as const)).then((pairs) => {
      if (live) setLex(Object.fromEntries(pairs));
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return lex;
}

/** Load a shared JSON file once and keep it for the session. */
function useShared<T>(load: () => Promise<T | null>, slot: { v: T | null; p: Promise<T> | null }): T | null {
  const [v, setV] = useState(slot.v);
  useEffect(() => {
    if (slot.v) return;
    slot.p ??= load().then((x) => (slot.v = x ?? ({} as T)));
    let live = true;
    slot.p.then((x) => live && setV(x));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return v;
}
const glossSlot: { v: Record<string, string> | null; p: Promise<Record<string, string>> | null } = { v: null, p: null };
const citedSlot: { v: Record<string, number> | null; p: Promise<Record<string, number>> | null } = { v: null, p: null };
const typesSlot: { v: TypeEntry[] | null; p: Promise<TypeEntry[]> | null } = { v: null, p: null };
/** Every type the Fathers draw. */
const useTypes = () => useShared(fetchTypes, typesSlot);
/** The English word the KJV most often uses for each Hebrew/Greek word. */
const useGlosses = () => useShared(fetchGlosses, glossSlot);
/** How many times the Fathers cite each verse. */
const useCited = () => useShared(fetchCited, citedSlot);

function gloss(code: string, e: StrongsEntry | null | undefined, glosses: Record<string, string> | null): string {
  if (glosses?.[code]) return glosses[code];
  if (!e) return "";
  const first = e.def.replace(/\{[GH]\d+\}/g, "").replace(/\([^)]*\)/g, "").split(/[,;.]/)[0].trim();
  return first.length > 22 ? first.slice(0, 21) + "…" : first;
}

function WordChip({ code, lex, onWord }: { code: string; lex: Record<string, StrongsEntry | null>; onWord?: (c: string) => void }) {
  const e = lex[code];
  const g = gloss(code, e, useGlosses());
  return (
    <button type="button" className="cx-chip" title={(e?.lemma ?? "") + " · " + (e?.def ?? code)} onClick={() => onWord?.(code)}>
      <i>{e?.xlit ?? code}</i>
      {g ? <span>{g}</span> : null}
    </button>
  );
}

/* ---------- saved connections ---------- */

type Saved = { a: [number, number]; b: [number, number]; why: string; at: number };
const SAVED_KEY = SAVED_CONNECTIONS_KEY;
let savedCache: Saved[] | null = null;
const savedListeners = new Set<() => void>();
function loadSaved(): Saved[] {
  if (savedCache) return savedCache;
  try {
    savedCache = JSON.parse(localStorage.getItem(SAVED_KEY) || "[]") as Saved[];
  } catch {
    savedCache = [];
  }
  return savedCache;
}
function writeSaved(list: Saved[]) {
  savedCache = list;
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(list));
  } catch {
    /* private window: saved for this visit only */
  }
  savedListeners.forEach((f) => f());
  noteChange(SAVED_KEY);
}
// Saved connections arrived from the account: drop the copy in memory and redraw.
onRemoteChange((key) => {
  if (key !== SAVED_KEY) return;
  savedCache = null;
  savedListeners.forEach((f) => f());
});
function useSaved(): Saved[] {
  const [, rerender] = useState(0);
  useEffect(() => {
    const f = () => rerender((x) => x + 1);
    savedListeners.add(f);
    return () => {
      savedListeners.delete(f);
    };
  }, []);
  return loadSaved();
}
function findSaved(list: Saved[], a: [number, number], b: [number, number]): Saved | undefined {
  return list.find((s) => (overlaps(s.a, a) && overlaps(s.b, b)) || (overlaps(s.a, b) && overlaps(s.b, a)));
}
function toggleSaved(a: [number, number], b: [number, number], why: string) {
  const list = loadSaved();
  const hit = findSaved(list, a, b);
  writeSaved(hit ? list.filter((s) => s !== hit) : [{ a, b, why, at: Date.now() }, ...list]);
}

function Star({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button type="button" className={"cx-star" + (on ? " is-on" : "")} aria-pressed={on} title={on ? "Saved. Click to remove" : "Save this connection"} onClick={onClick}>
      {on ? "★" : "☆"}
    </button>
  );
}

/* ---------- sections that fold away ---------- */

const OPEN_KEY = "patrista-cx-open-v2";
function readOpen(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(OPEN_KEY) || "{}") as Record<string, boolean>;
  } catch {
    return {};
  }
}

/**
 * A section of the tab that folds away under its heading. The heading shows how many things are inside,
 * so a folded section still says what it holds. Open or shut is remembered per section, in this browser.
 */
function Fold({ id, title, count, defaultOpen = true, className, children }: { id: string; title: ReactNode; count?: ReactNode; defaultOpen?: boolean; className?: string; children: ReactNode }) {
  const [open, setOpen] = useState(() => readOpen()[id] ?? defaultOpen);
  return (
    <details
      className={"cx-section cx-fold" + (className ? " " + className : "")}
      open={open}
      onToggle={(e) => {
        const now = e.currentTarget.open;
        if (now === open) return;
        setOpen(now);
        try {
          localStorage.setItem(OPEN_KEY, JSON.stringify({ ...readOpen(), [id]: now }));
        } catch {
          /* storage blocked: remembered for this visit only */
        }
      }}
    >
      <summary>
        <h3>{title}</h3>
        {count != null && count !== "" ? <span className="cx-count">{count}</span> : null}
      </summary>
      <div className="cx-fold-body">{children}</div>
    </details>
  );
}

/* ---------- patterns: links grouped into passages, and how strong each is ---------- */

/** Patterns listed before "Show more". */
const PATTERNS_SHOWN = 6;

function PatternRow({
  p,
  here,
  meta,
  lex,
  saved,
  onExplore,
  onWord,
  onType,
  onHot
}: {
  p: Pattern;
  here: [number, number];
  meta: Meta;
  lex: Record<string, StrongsEntry | null>;
  saved: Saved[];
  onExplore: (from: number, to: number) => void;
  onWord: (c: string) => void;
  onType: (entry: string) => void;
  onHot: (key: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const text = useVerseText(meta, p.from);
  const isSaved = !!findSaved(saved, here, [p.from, p.to]);
  const words = [...p.codes];
  return (
    <li className={"cx-link" + (isSaved ? " is-saved" : "")} onMouseEnter={() => onHot("p" + p.from)} onMouseLeave={() => onHot(null)}>
      <div className="cx-link-head">
        <button type="button" className="cx-ref" onClick={() => onExplore(p.from, p.to)} title="See its connections">
          {rangeLabel(meta, p.from, p.to)}
        </button>
        <span className={"cx-strength is-" + p.strength} title={STRENGTH_TEXT[p.strength]}>
          {p.strength}
        </span>
        <Star on={isSaved} onClick={() => toggleSaved(here, [p.from, p.to], p.types[0]?.label ?? (words.length ? plural(words.length, "shared word") : "cited together"))} />
      </div>
      {text ? <p className="cx-snippet">{text.length > 170 ? text.slice(0, 168) + "…" : text}</p> : null}
      {p.types.length ? (
        <p className="cx-why is-type">
          A type the Fathers draw:{" "}
          {p.types.map((t, i) => (
            <span key={t.entry}>
              {i ? "; " : ""}
              <button type="button" className="cx-inline" onClick={() => onType(t.entry)}>
                {t.label}
              </button>
            </span>
          ))}
        </p>
      ) : null}
      {words.length ? (
        <div className="cx-why">
          <span className="cx-chips">
            {words.slice(0, 5).map((c) => (
              <WordChip key={c} code={c} lex={lex} onWord={onWord} />
            ))}
          </span>
        </div>
      ) : null}
      {p.fathers.size ? (
        <div className="cx-why is-fathers">
          <button type="button" className="cx-witness-btn" aria-expanded={open} onClick={() => setOpen(!open)}>
            Cited together by {[...p.fathers].slice(0, 3).join(", ")}
            {p.fathers.size > 3 ? " and " + (p.fathers.size - 3) + " more" : ""}
          </button>
          {open ? <Together here={here} p={p} meta={meta} /> : null}
        </div>
      ) : null}
    </li>
  );
}

/** The paragraphs where the Fathers cite this place and the pattern's passage together, as a thread. */
function Together({ here, p, meta }: { here: [number, number]; p: Pattern; meta: Meta }) {
  const [list, setList] = useState<CitingPassage[] | undefined>(undefined);
  useEffect(() => {
    let live = true;
    const hb = bookOf(meta, here[0])?.id;
    const tb = bookOf(meta, p.from)?.id;
    const hc = splitVid(here[0]).chapter;
    const tc = splitVid(p.from).chapter;
    const keys = (a: number, b: number, ch: number) => {
      const out: string[] = [];
      for (let v = a; v <= b; v++) if (splitVid(v).chapter === ch) out.push(ch + ":" + splitVid(v).verse);
      return out;
    };
    if (!hb || !tb) {
      setList([]);
      return;
    }
    Promise.all([fetchChapterCitations(hb, hc), fetchChapterCitations(tb, tc)]).then(([a, b]) => {
      if (live) setList(citedTogether(a, keys(here[0], here[1], hc), b, keys(p.from, p.to, tc)));
    });
    return () => {
      live = false;
    };
  }, [here, p, meta]);
  if (list === undefined) return <p className="cx-meta">Loading…</p>;
  // Found by the older scan of the raw texts but not in the site's chapters: its short sample.
  if (!list.length) return p.sample ? <p className="cx-comment-text">{p.sample}…</p> : null;
  return <Thread passages={list} showVerses={false} />;
}

/* ---------- the chart: Genesis to Revelation, seen from above; drag to move, zoom in and out ---------- */

const W = 360;
const PAD = 6;
const SPAN = W - 2 * PAD;
const MAX_ZOOM = 400;

/** An arc from this place (or from `s`) to the passage a–b. */
type Arc = { key: string; a: number; b: number; s?: [number, number]; cls: string; width: number; title: string; onPick: () => void };
type Dot = { key: string; vid: number; cls: string; title: string; onPick: () => void };

function CxChart({ meta, here, arcs, dots, hot, onHot }: { meta: Meta; here: [number, number]; arcs: Arc[]; dots: Dot[]; hot: string | null; onHot: (k: string | null) => void }) {
  const clip = useId();
  // Arcs need height above the line; dots alone (a word) need only a strip.
  const BASE = arcs.length ? 100 : 34;
  const H = BASE + 32;
  const offsets = useMemo(() => chapterOffsets(meta), [meta]);
  const pos = (vid: number) => canonPosition(meta, vid, offsets);
  const [view, setView] = useState({ k: 1, o: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; o: number; moved: boolean; id: number } | null>(null);
  const pinch = useRef(new Map<number, number>());
  const pinchStart = useRef<{ d: number; k: number } | null>(null);

  const X = (p: number) => PAD + (p - view.o) * view.k * SPAN;
  const clampO = (k: number, o: number) => Math.min(Math.max(0, o), 1 - 1 / k);
  const units = (clientX: number) => {
    const r = svgRef.current!.getBoundingClientRect();
    return ((clientX - r.left) / r.width) * W;
  };
  const zoomAt = (sx: number, f: number) =>
    setView((v) => {
      const k = Math.min(MAX_ZOOM, Math.max(1, v.k * f));
      const p = v.o + (sx - PAD) / (v.k * SPAN);
      return { k, o: clampO(k, p - (sx - PAD) / (k * SPAN)) };
    });

  // Keep this place in view when it changes.
  const hereP = pos(here[0]);
  useEffect(() => {
    setView((v) => (hereP >= v.o && hereP <= v.o + 1 / v.k ? v : { k: v.k, o: clampO(v.k, hereP - 0.5 / v.k) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hereP]);

  // Ctrl/⌘ + scroll, or a trackpad pinch, zooms; a plain scroll still scrolls the panel.
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      zoomAt(units(e.clientX), Math.exp(-e.deltaY * 0.004));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onDown(e: ReactPointerEvent<SVGSVGElement>) {
    pinch.current.set(e.pointerId, e.clientX);
    if (pinch.current.size === 2) {
      const [a, b] = [...pinch.current.values()];
      pinchStart.current = { d: Math.abs(a - b) || 1, k: view.k };
      drag.current = null;
      return;
    }
    drag.current = { x: e.clientX, o: view.o, moved: false, id: e.pointerId };
  }
  function onMove(e: ReactPointerEvent<SVGSVGElement>) {
    if (pinch.current.has(e.pointerId)) pinch.current.set(e.pointerId, e.clientX);
    if (pinchStart.current && pinch.current.size === 2) {
      const [a, b] = [...pinch.current.values()];
      const target = pinchStart.current.k * (Math.abs(a - b) / pinchStart.current.d);
      zoomAt(units((a + b) / 2), target / view.k);
      return;
    }
    const d = drag.current;
    if (!d) return;
    const r = svgRef.current!.getBoundingClientRect();
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 4) {
      d.moved = true;
      svgRef.current!.setPointerCapture(d.id);
    }
    if (d.moved) setView((v) => ({ k: v.k, o: clampO(v.k, d.o - ((dx / r.width) * W) / (v.k * SPAN)) }));
  }
  function onUp(e: ReactPointerEvent<SVGSVGElement>) {
    pinch.current.delete(e.pointerId);
    if (pinch.current.size < 2) pinchStart.current = null;
    // A drag that moved is not a click on the arc under it.
    if (drag.current?.moved) window.setTimeout(() => (drag.current = null), 0);
    else drag.current = null;
  }
  const picked = (f: () => void) => () => {
    if (!drag.current?.moved) f();
  };

  const arcPath = (a: number, b: number, s: [number, number] = here) => {
    const x1 = X(pos(s[0]) / 2 + pos(s[1]) / 2);
    const x2 = X(pos(a) / 2 + pos(b) / 2);
    const dx = Math.max(1, Math.abs(x2 - x1));
    const ry = Math.max(6, (BASE - 10) * Math.sqrt(Math.min(1, dx / SPAN)));
    return `M ${x1.toFixed(1)} ${BASE} A ${(dx / 2).toFixed(1)} ${ry.toFixed(1)} 0 0 ${x2 > x1 ? 1 : 0} ${x2.toFixed(1)} ${BASE}`;
  };

  // Arcs to draw: one per path; hidden when both ends are off screen, faint when one is.
  const shownArcs: { a: Arc; d: string; away: boolean }[] = [];
  const seenPaths = new Set<string>();
  const onScreen = (x: number) => x >= 0 && x <= W;
  for (const a of arcs) {
    const s = a.s ?? here;
    const x1 = X(pos(s[0]) / 2 + pos(s[1]) / 2);
    const d = arcPath(a.a, a.b, s);
    const x2 = X(pos(a.a) / 2 + pos(a.b) / 2);
    if (seenPaths.has(d) || (!onScreen(x1) && !onScreen(x2))) continue;
    seenPaths.add(d);
    shownArcs.push({ a, d, away: !onScreen(x1) || !onScreen(x2) });
  }

  // Book bands and the names that fit.
  const books = meta.books.map((b) => ({ b, x0: X(pos(vidOf(b.n, 1, 1))), x1: X(pos(vidOf(b.n, b.chapters, 999))) }));
  const labels: { name: string; x: number }[] = [];
  let lastX = -1e9;
  for (const { b, x0, x1 } of books) {
    const x = Math.max(PAD, x0);
    const width = b.name.length * 4.6; // about 4.6 units a letter at this size
    if (x1 < PAD || x < lastX || x + width > W - PAD) continue;
    labels.push({ name: b.name, x });
    lastX = x + width + 8;
  }

  return (
    <figure className="cx-map">
      <div className="cx-zoom">
        <button type="button" onClick={() => zoomAt(W / 2, 1 / 2)} disabled={view.k <= 1} aria-label="Zoom out">
          −
        </button>
        <button type="button" onClick={() => zoomAt(X(hereP), 2)} disabled={view.k >= MAX_ZOOM} aria-label="Zoom in">
          +
        </button>
        <button type="button" onClick={() => setView({ k: 1, o: 0 })} disabled={view.k <= 1} title="The whole Bible">
          Whole Bible
        </button>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Where the links lead, from Genesis to Revelation"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onDoubleClick={(e) => zoomAt(units(e.clientX), 2.5)}
      >
        <defs>
          <clipPath id={clip}>
            <rect x={PAD - 1} y="0" width={SPAN + 2} height={H} />
          </clipPath>
        </defs>
        <rect x="0" y="0" width={W} height={H} fill="transparent" />
        <g clipPath={`url(#${clip})`}>
          {books.map(({ b, x0, x1 }) =>
            x1 < 0 || x0 > W ? null : (
              <rect key={b.id} x={x0} y={BASE - 2} width={Math.max(0.5, x1 - x0 - (view.k > 6 ? 0.6 : 0))} height="4" fill={GROUP_COLOR[b.group]} opacity="0.55">
                <title>{b.name}</title>
              </rect>
            )
          )}
          {shownArcs.map(({ a, d, away }) => (
            <path
              key={a.key}
              d={d}
              className={"cx-arc " + a.cls + (hot === a.key ? " is-hot" : away ? " is-away" : "")}
              strokeWidth={hot === a.key ? a.width + 1.2 : a.width}
            />
          ))}
          {/* wide invisible copies, so a thin arc is easy to point at */}
          {shownArcs.map(({ a, d }) => (
            <path key={"hit" + a.key} d={d} className="cx-arc-hit" onMouseEnter={() => onHot(a.key)} onMouseLeave={() => onHot(null)} onClick={picked(a.onPick)}>
              <title>{a.title}</title>
            </path>
          ))}
          {dots.map((d) => (
            <circle key={d.key} cx={X(pos(d.vid))} cy={BASE} r={hot === d.key ? 3.2 : 2} className={"cx-dot " + d.cls} onMouseEnter={() => onHot(d.key)} onMouseLeave={() => onHot(null)} onClick={picked(d.onPick)}>
              <title>{d.title}</title>
            </circle>
          ))}
          <circle cx={X(hereP)} cy={BASE} r="3.6" className="cx-map-here" />
        </g>
        {labels.map((l) => (
          <text key={l.name} x={l.x} y={H - 6} className="cx-map-label">
            {l.name}
          </text>
        ))}
      </svg>
    </figure>
  );
}

/* ---------- a word: where else it appears, and which of those verses the Fathers discuss ---------- */

function WordView({ code, home, meta, info, family, onExplore, onWord, onHot }: {
  code: string;
  home: number;
  meta: Meta;
  info: WordInfo | null;
  family: { code: string; info: WordInfo }[];
  onExplore: (from: number, to: number) => void;
  /** Open another word here. */
  onWord: (code: string) => void;
  onHot: (k: string | null) => void;
}) {
  const cited = useCited();
  const lex = useLex([code, ...family.map((f) => f.code)]);
  const [all, setAll] = useState(false);
  if (!info) return <p className="empty">Loading the word…</p>;
  const byBook = new Map<number, number[]>();
  for (const vid of info.o) byBook.set(Math.floor(vid / 1_000_000), [...(byBook.get(Math.floor(vid / 1_000_000)) ?? []), vid]);
  const most = [...byBook.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 3);
  const everywhere = [...new Set([...info.o, ...family.flatMap((f) => f.info.o)])];
  const discussed = everywhere
    .filter((v) => v !== home && (cited?.[String(v)] ?? 0) > 0)
    .sort((a, b) => (cited?.[String(b)] ?? 0) - (cited?.[String(a)] ?? 0) || a - b);
  const famAdds = family.reduce((s, f) => s + f.info.o.length, 0);
  const e = lex[code];
  const def = e?.def.replace(/\{([GH]\d+)\}/g, "$1").trim();
  const uses = (e?.uses ?? []).slice(0, 5);
  const marks = [code, ...family.map((f) => f.code)];
  return (
    <>
      <section className="cx-section">
        {def ? <p className="cx-def">{def.length > 260 ? def.slice(0, 258) + "…" : def}</p> : null}
        {uses.length ? (
          <p className="cx-meta">
            The KJV renders it {uses.map(([w, n]) => "“" + w + "” " + n + "×").join(", ")}
            {(e?.uses?.length ?? 0) > uses.length ? ", and more" : ""}.
          </p>
        ) : null}
        <p className="cx-meta">
          In {plural(info.n, "verse")}
          {most.length > 1 ? ", most often in " + most.map(([b, v]) => meta.books[b - 1]?.name + " (" + v.length + ")").join(", ") : ""}.
          {family.length ? " " + (code.startsWith("H") ? "The Greek for it" : "The Hebrew behind it") + " adds " + plural(famAdds, "verse") + ":" : ""}
        </p>
        {family.length ? (
          <span className="cx-chips">
            {family.map((f) => (
              <WordChip key={f.code} code={f.code} lex={lex} onWord={onWord} />
            ))}
          </span>
        ) : null}
      </section>
      <Fold id="word-fathers" title="Where the Fathers look" count={cited ? discussed.length || "" : ""}>
        {cited === null ? (
          <p className="empty">Loading…</p>
        ) : discussed.length === 0 ? (
          <p className="cx-meta">The Fathers in the library cite none of these verses by reference.</p>
        ) : (
          <>
            <p className="cx-meta">The verses with this word that the Fathers cite most.</p>
            <ul className="cx-links">
              {discussed.slice(0, all ? 40 : 8).map((v) => (
                <DiscussedRow key={v} vid={v} n={cited?.[String(v)] ?? 0} meta={meta} codes={marks} onExplore={onExplore} onHot={onHot} />
              ))}
            </ul>
            {discussed.length > 8 ? (
              <button type="button" className="cx-more" onClick={() => setAll(!all)}>
                {all ? "Show fewer" : "Show " + (Math.min(40, discussed.length) - 8) + " more"}
              </button>
            ) : null}
          </>
        )}
        <details className="cx-occ">
          <summary>All {plural(info.n, "verse")}, by book</summary>
          {[...byBook.entries()].map(([b, vids]) => (
            <p key={b}>
              <b>{meta.books[b - 1]?.name}</b>{" "}
              {vids.slice(0, 80).map((v, i) => (
                <span key={v}>
                  {i ? ", " : ""}
                  <button type="button" className="cx-inline" onClick={() => onExplore(v, v)}>
                    {splitVid(v).chapter + ":" + splitVid(v).verse}
                  </button>
                </span>
              ))}
              {vids.length > 80 ? " …" : ""}
            </p>
          ))}
        </details>
      </Fold>
    </>
  );
}

function DiscussedRow({ vid, n, meta, codes, onExplore, onHot }: { vid: number; n: number; meta: Meta; codes: string[]; onExplore: (a: number, b: number) => void; onHot: (k: string | null) => void }) {
  return (
    <li className="cx-link" onMouseEnter={() => onHot("d" + vid)} onMouseLeave={() => onHot(null)}>
      <div className="cx-link-head">
        <button type="button" className="cx-ref" onClick={() => onExplore(vid, vid)}>
          {refLabel(meta, vid)}
        </button>
        <span className="cx-meta">cited {n === 1 ? "once" : n + " times"}</span>
      </div>
      <MarkedVerse meta={meta} vid={vid} codes={codes} />
    </li>
  );
}

/* ---------- a type the Fathers draw: its meaning, their words, and every passage in it ---------- */

/** "Tertullian, *Bapt.* 8" with the work in italics. */
function italics(text: string): ReactNode {
  return text.split(/\*([^*]+)\*/).map((part, i) => (i % 2 ? <i key={i}>{part}</i> : part));
}

function TypeStop({ r, i, here, meta, onExplore, onHot }: { r: [number, number]; i: number; here: [number, number]; meta: Meta; onExplore: (a: number, b: number) => void; onHot: (k: string | null) => void }) {
  const text = useVerseText(meta, r[0]);
  return (
    <li className="cx-link" onMouseEnter={() => onHot("c" + i)} onMouseLeave={() => onHot(null)}>
      <div className="cx-link-head">
        <button type="button" className="cx-ref" onClick={() => onExplore(r[0], r[1])} title="See its connections">
          {rangeLabel(meta, r[0], r[1])}
        </button>
        {overlaps(r, here) ? <span className="cx-strength">you came from here</span> : null}
      </div>
      {text ? <p className="cx-snippet">{text.length > 170 ? text.slice(0, 168) + "…" : text}</p> : null}
    </li>
  );
}

function TypeView({ t, here, meta, onExplore, onHot }: { t: TypeEntry; here: [number, number]; meta: Meta; onExplore: (a: number, b: number) => void; onHot: (k: string | null) => void }) {
  const stops = [...t.ranges].sort((a, b) => a[0] - b[0]);
  return (
    <>
      <section className="cx-section">
        <p className="cx-type-def">{t.def}</p>
        {t.christ ? (
          <p className="cx-type-def">
            <b>In Christ:</b> {italics(t.christ)}
          </p>
        ) : null}
        <p className="cx-type-def">
          <Link to={"/types?type=" + encodeURIComponent(t.id.replace(/^\d+:/, ""))}>See it among all the types →</Link>
        </p>
      </section>
      <Fold id="type-where" title="Where it appears, first to last" count={stops.length}>
        <ul className="cx-links">
          {stops.map((r, i) => (
            <TypeStop key={r[0] + "-" + r[1]} r={r} i={i} here={here} meta={meta} onExplore={onExplore} onHot={onHot} />
          ))}
        </ul>
      </Fold>
      {t.where.length ? (
        <Fold id="type-words" title="In the Fathers' words" count={t.where.length}>
          <ul className="cx-quotes">
            {t.where.map((w, i) => (
              <li key={i}>{italics(w)}</li>
            ))}
          </ul>
        </Fold>
      ) : null}
    </>
  );
}

/* ---------- verses that share several selected words ---------- */

function SharedWords({ codes, meta, here, onExplore }: { codes: string[]; meta: Meta; here: [number, number]; onExplore: (a: number, b: number) => void }) {
  const [hits, setHits] = useState<number[] | null>(null);
  const lex = useLex(codes);
  useEffect(() => {
    let live = true;
    Promise.all(codes.map(fetchWordInfo)).then((infos) => {
      if (!live) return;
      const sets = infos.filter((i): i is WordInfo => !!i).map((i) => new Set(i.o));
      if (!sets.length) return setHits([]);
      sets.sort((a, b) => a.size - b.size);
      setHits([...sets[0]].filter((v) => sets.every((s) => s.has(v)) && (v < here[0] || v > here[1])).sort((a, b) => a - b));
    });
    return () => {
      live = false;
    };
  }, [codes, here]);
  return (
    <Fold id="shared" title="Other verses with all of these words" count={hits?.length || ""}>
      <div className="cx-chips">
        {codes.map((c) => (
          <WordChip key={c} code={c} lex={lex} />
        ))}
      </div>
      {hits === null ? (
        <p className="empty">Searching…</p>
      ) : hits.length === 0 ? (
        <p className="cx-meta">No other verse has all of them. Try selecting fewer words.</p>
      ) : (
        <p className="cx-meta">
          {plural(hits.length, "verse")}:{" "}
          {hits.slice(0, 80).map((v, i) => (
            <span key={v}>
              {i ? ", " : ""}
              <button type="button" className="cx-inline" onClick={() => onExplore(v, v)}>
                {refLabel(meta, v)}
              </button>
            </span>
          ))}
          {hits.length > 80 ? " …" : ""}
        </p>
      )}
    </Fold>
  );
}

/* ---------- passages the Fathers cite together ---------- */

/**
 * The paragraphs where a Father cites both passages of a pattern: the same paragraph of the same
 * chapter appears in the citations of a verse here and of a verse there.
 */
function citedTogether(here: ChapterCitations | null, hereKeys: string[], there: ChapterCitations | null, thereKeys: string[]): CitingPassage[] {
  const near = new Map<string, Set<number>>();
  for (const k of hereKeys) for (const c of here?.[k] ?? []) for (const i of c[8] ?? []) (near.get(c[0]) ?? near.set(c[0], new Set()).get(c[0])!).add(i);
  const lists: [number, VerseCite[]][] = [];
  for (const k of thereKeys) {
    const v = Number(k.split(":")[1]);
    const both = (there?.[k] ?? [])
      .map((c): VerseCite => [c[0], c[1], c[2], c[3], c[4], c[5], c[6], c[7], (c[8] ?? []).filter((i) => near.get(c[0])?.has(i)), c[9]])
      .filter((c) => (c[8] ?? []).length > 0);
    lists.push([v, both]);
  }
  return mergeCites(lists);
}

/** One row per typological link the Fathers draw, listing every other passage it ties to this one. */

/* ---------- saved connections ---------- */

function SavedSection({ saved, meta, onExplore }: { saved: Saved[]; meta: Meta; onExplore: (a: number, b: number) => void }) {
  if (!saved.length) return null;
  return (
    <details className="cx-saved">
      <summary>Your saved connections ({saved.length})</summary>
      <ul>
        {saved.map((s) => (
          <li key={s.at}>
            <button type="button" className="cx-inline" onClick={() => onExplore(s.a[0], s.a[1])}>
              {rangeLabel(meta, s.a[0], s.a[1])}
            </button>
            {" ↔ "}
            <button type="button" className="cx-inline" onClick={() => onExplore(s.b[0], s.b[1])}>
              {rangeLabel(meta, s.b[0], s.b[1])}
            </button>
            <span className="cx-meta"> · {s.why}</span>
            <button type="button" className="cx-remove" aria-label="Remove" onClick={() => writeSaved(loadSaved().filter((x) => x !== s))}>
              ×
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}

/* ---------- the panel ---------- */

export function ConnectionsPanel({
  book,
  chapter,
  verse,
  focus,
  onStudyWord,
  onClose
}: {
  book: string;
  chapter: number;
  /** The reader's current verse, used until the reader picks something. */
  verse: number;
  focus: CxFocus | null;
  /** Open a word in the Word tab: its code, its English, and the verse it was found in. */
  onStudyWord?: (code: string, text: string, where: string) => void;
  onClose?: () => void;
}) {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [, rerender] = useState(0);
  const [data, setData] = useState<ChapterConnections | null | undefined>(undefined);
  const [info, setInfo] = useState<WordInfo | null>(null);
  const [family, setFamily] = useState<{ code: string; info: WordInfo }[]>([]);
  const [hot, setHot] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const saved = useSaved();
  const glosses = useGlosses();

  useEffect(() => {
    fetchMeta().then(setMeta);
  }, []);

  const push = (p: Place) => {
    const cur = trail.list[trail.at];
    if (cur && samePlace(cur, p)) return;
    let list = trail.list.slice(0, trail.at + 1);
    // The reader settles in steps (a new chapter, then its verse): keep only where it settled.
    if (p.auto && cur?.auto) list = list.slice(0, -1);
    const prev = list[list.length - 1];
    if (!prev || !samePlace(prev, p)) list.push(p);
    trail.list = list.slice(-100);
    trail.at = trail.list.length - 1;
    rerender((x) => x + 1);
  };
  const move = (d: 1 | -1) => {
    trail.at = Math.min(trail.list.length - 1, Math.max(0, trail.at + d));
    rerender((x) => x + 1);
  };

  // Follow the reader: each new action there becomes the next place on the trail.
  const bookNumber = meta?.books.find((b) => b.id === book)?.n ?? 0;
  useEffect(() => {
    if (!bookNumber) return;
    const at = (n: number) => vidOf(bookNumber, chapter, n);
    if (focus && focus.n !== trail.seenAction) {
      trail.seenAction = focus.n;
      push({ from: at(focus.from), to: at(focus.to), word: focus.word, text: focus.text, codes: focus.codes?.length ? focus.codes : undefined });
      return;
    }
    const key = book + "." + chapter + "." + verse;
    if (!focus && (trail.at < 0 || trail.readerKey !== key)) push({ from: at(verse), to: at(verse), auto: true });
    trail.readerKey = key;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookNumber, book, chapter, verse, focus?.n]);

  const place: Place | null = trail.list[trail.at] ?? null;
  const here: [number, number] = place ? [place.from, place.to] : [0, 0];
  const placeBook = meta && place ? bookOf(meta, place.from)?.id : undefined;
  const placeChapter = place ? splitVid(place.from).chapter : 0;
  const explore = (from: number, to: number) => push({ from, to });
  const studyWord = (code: string) => place && push({ from: place.from, to: place.from, word: code });
  const openType = (entry: string) => place && push({ from: place.from, to: place.to, type: entry });

  useEffect(() => {
    if (!placeBook) return;
    let live = true;
    setData(undefined);
    setMore(false);
    fetchChapterConnections(placeBook, placeChapter).then((d) => live && setData(d));
    return () => {
      live = false;
    };
  }, [placeBook, placeChapter]);

  const word = place?.word;
  useEffect(() => {
    let live = true;
    setInfo(null);
    setFamily([]);
    if (!word) return;
    fetchWordInfo(word).then(async (i) => {
      if (!live) return;
      setInfo(i);
      const across = (i?.r ?? []).filter(([, k]) => k === "lxx" || k === "lxx-of").slice(0, 3);
      const fam = await Promise.all(across.map(async ([c]) => ({ code: c, info: await fetchWordInfo(c) })));
      if (live) setFamily(fam.filter((f): f is { code: string; info: WordInfo } => !!f.info));
    });
    return () => {
      live = false;
    };
  }, [word]);
  const wordLex = useLex(word ? [word] : []);

  const types = useMemo(
    () => groupCurated((data?.c ?? []).filter(([, , , , a0, a1, b0, b1]) => overlaps([a0, a1], here) || overlaps([b0, b1], here)), here),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, here[0], here[1]]
  );
  const patterns = useMemo(() => (data && !word ? findPatterns(data, here, types) : []), [data, here[0], here[1], types, word]); // eslint-disable-line react-hooks/exhaustive-deps
  const lex = useLex(useMemo(() => [...new Set(patterns.slice(0, 20).flatMap((p) => [...p.codes]))], [patterns]));
  const firstText = useVerseText(meta, here[0]);
  const cited = useCited();
  const allTypes = useTypes();

  if (!meta || !place) return <div className="cx-panel"><p className="empty">Loading…</p></div>;

  const inReader = placeBook === book && placeChapter === chapter;
  const typeEntry = place.type ? allTypes?.find((t) => t.id === place.type) : undefined;
  const mode: "type" | "word" | "verse" | "passage" = place.type ? "type" : word ? "word" : place.from === place.to ? "verse" : "passage";
  const we = word ? wordLex[word] : null;

  // What the chart draws.
  const arcs: Arc[] = [];
  const dots: Dot[] = [];
  if (mode === "type") {
    // The type's path through Scripture: each passage joined to the next, first to last.
    const stops = [...(typeEntry?.ranges ?? [])].sort((a, b) => a[0] - b[0]);
    stops.forEach((r, i) => {
      if (i)
        arcs.push({ key: "c" + i, s: stops[i - 1], a: r[0], b: r[1], cls: "is-type", width: 2, title: rangeLabel(meta, r[0], r[1]), onPick: () => explore(r[0], r[1]) });
    });
  } else if (mode === "word" && info) {
    const own = new Set(info.o);
    const all = [...new Set([...info.o, ...family.flatMap((f) => f.info.o)])];
    for (const v of all)
      if (v !== place.from)
        dots.push({
          key: "d" + v,
          vid: v,
          cls: (own.has(v) ? "" : "is-family") + ((cited?.[String(v)] ?? 0) > 0 ? " is-cited" : ""),
          title: refLabel(meta, v) + ((cited?.[String(v)] ?? 0) > 0 ? " · cited " + cited![String(v)] + "×" : ""),
          onPick: () => explore(v, v)
        });
  } else {
    for (const t of types)
      for (const o of t.others)
        arcs.push({ key: "t" + t.entry + o[0], a: o[0], b: o[1], cls: "is-type", width: 2.2, title: t.label + " · " + rangeLabel(meta, o[0], o[1]), onPick: () => explore(o[0], o[1]) });
    for (const p of patterns.slice(0, 20)) {
      const isSaved = !!findSaved(saved, here, [p.from, p.to]);
      arcs.push({
        key: "p" + p.from,
        a: p.from,
        b: p.to,
        cls: (p.types.length ? "is-type" : p.fathers.size ? "is-fathers" : "is-words") + (isSaved ? " is-saved" : ""),
        width: p.strength === "strong" ? 2.4 : p.strength === "moderate" ? 1.5 : 0.9,
        title: rangeLabel(meta, p.from, p.to) + " · " + p.strength,
        onPick: () => explore(p.from, p.to)
      });
    }
  }

  const title =
    mode === "type" ? (
      <>
        Connections <span>{typeEntry?.label ?? "a type"}</span>
      </>
    ) : mode === "word" ? (
      <>
        Connections <span>{place.text || gloss(word!, we, glosses) || word}</span>
      </>
    ) : (
      <>
        Connections <span>{rangeLabel(meta, here[0], here[1])}</span>
      </>
    );
  // What Share sends. A type is shared as its page on the types map (with the live diagram to embed);
  // a verse, a passage or a word as this place in the Bible reader, with the chart above as its picture.
  const TYPE_COLOR = "#b98317";
  let shareable: Shareable | null = null;
  if (mode === "type") {
    if (typeEntry) {
      const share = describeShare(meta, { type: typeEntry, drawn: [typeEntry] });
      shareable = { ...share, svg: () => shareCardSvg(meta, share, () => TYPE_COLOR) };
    }
  } else if (data !== undefined) {
    const wordText = word ? place.text || gloss(word, we, glosses) || word : "";
    const shareTitle = word ? "“" + wordText + "” in " + refLabel(meta, place.from) : rangeLabel(meta, here[0], here[1]);
    const shareSub = word ? plural(dots.length, "other verse") + " with this word" : plural(arcs.length, "connection") + " across Scripture";
    const drawing = {
      kicker: "Connections across Scripture",
      arcs: arcs.map((a) => ({
        from: a.s ? a.s[0] : here[0],
        to: a.a,
        color: a.cls.includes("is-type") ? TYPE_COLOR : a.cls.includes("is-fathers") ? "#952004" : "#6b645a"
      })),
      dots: [...dots.map((d) => ({ vid: d.vid, color: d.cls.includes("is-cited") ? "#952004" : "#a39d93" })), { vid: here[0], color: "#1f1f1f" }],
      bold: !word && arcs.length <= 3
    };
    shareable = {
      title: shareTitle,
      path: bibleHrefFor(meta, place.from) + "&panel=connections",
      svg: () => cardSvg(meta, shareTitle, shareSub, drawing)
    };
  }

  // Notes on a word or a type live here; a verse's note is written in the reader's margin.
  const noteKey = place.type ? "bible-cx-t-" + place.type : word ? "bible-cx-w-" + word : null;
  const shown = patterns.slice(0, more ? 30 : PATTERNS_SHOWN);
  const strongCount = patterns.filter((p) => p.strength === "strong").length;

  return (
    <div className="cx-panel">
      <header className="cx-head">
        <div className="cx-nav">
          <button type="button" onClick={() => move(-1)} disabled={trail.at <= 0} aria-label="Back" title="Back">
            ←
          </button>
          <button type="button" onClick={() => move(1)} disabled={trail.at >= trail.list.length - 1} aria-label="Forward" title="Forward">
            →
          </button>
        </div>
        <h2>{title}</h2>
        {shareable ? <ShareButton small share={shareable} /> : null}
        {onClose ? (
          <button type="button" className="cx-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        ) : null}
      </header>

      <div className="cx-where">
        {mode === "type" ? null : mode === "word" ? (
          <>
            <span className="cx-lemma" lang={word!.startsWith("H") ? "he" : "grc"}>
              {we?.lemma}
            </span>{" "}
            <i>{we?.xlit}</i> · in {refLabel(meta, place.from)}{" "}
            <button type="button" className="cx-more" onClick={() => explore(place.from, place.from)}>
              The whole verse
            </button>
            {onStudyWord ? (
              <button type="button" className="cx-more" onClick={() => onStudyWord(word!, place.text || gloss(word!, we, glosses) || word!, refLabel(meta, place.from))}>
                Study this word
              </button>
            ) : null}
          </>
        ) : !inReader ? (
          <>
            {firstText ? <span className="cx-snippet">{firstText.length > 200 ? firstText.slice(0, 198) + "…" : firstText}</span> : null}
            <Link className="cx-more" to={bibleHrefFor(meta, place.from) + "&panel=connections"}>
              Open in the reader
            </Link>
          </>
        ) : null}
      </div>

      {data !== undefined ? <CxChart meta={meta} here={here} arcs={arcs} dots={dots} hot={hot} onHot={setHot} /> : null}
      {data === undefined ? <p className="empty">Loading connections…</p> : null}
      {data === null ? <p className="empty">No connection data for this chapter yet.</p> : null}

      {mode === "type" ? (
        typeEntry ? <TypeView t={typeEntry} here={here} meta={meta} onExplore={explore} onHot={setHot} /> : <p className="empty">Loading the type…</p>
      ) : mode === "word" ? (
        <WordView code={word!} home={place.from} meta={meta} info={info} family={family} onExplore={explore} onWord={studyWord} onHot={setHot} />
      ) : (
        <>
          {place.codes && place.codes.length > 1 ? <SharedWords codes={place.codes} meta={meta} here={here} onExplore={explore} /> : null}
          {types.length ? (
            <Fold id="types" title="Types the Fathers draw" count={types.length}>
              <ul className="cx-links">
                {types.map((g) => (
                  <li key={g.entry} className="cx-link" onMouseEnter={() => setHot("t" + g.entry + g.others[0][0])} onMouseLeave={() => setHot(null)}>
                    <div className="cx-link-head">
                      <button type="button" className="cx-type" onClick={() => openType(g.entry)} title="See every passage in this type">
                        {g.label}
                      </button>
                      <Star on={g.others.some((o) => !!findSaved(saved, here, o))} onClick={() => toggleSaved(here, g.others[0], g.label)} />
                    </div>
                    <p className="cx-meta">
                      {g.others.map(([o0, o1], i) => (
                        <span key={o0}>
                          {i ? " · " : ""}
                          <button type="button" className="cx-inline" onClick={() => explore(o0, o1)}>
                            {rangeLabel(meta, o0, o1)}
                          </button>
                        </span>
                      ))}
                    </p>
                  </li>
                ))}
              </ul>
            </Fold>
          ) : null}

          {patterns.length ? (
            <Fold id="patterns" title="Patterns" count={patterns.length + (strongCount ? " · " + strongCount + " strong" : "")}>
              <ul className="cx-links">
                {shown.map((p) => (
                  <PatternRow key={p.from} p={p} here={here} meta={meta} lex={lex} saved={saved} onExplore={explore} onWord={studyWord} onType={openType} onHot={setHot} />
                ))}
              </ul>
              {patterns.length > PATTERNS_SHOWN ? (
                <button type="button" className="cx-more" onClick={() => setMore(!more)}>
                  {more ? "Show fewer" : "Show " + (Math.min(30, patterns.length) - PATTERNS_SHOWN) + " more"}
                </button>
              ) : null}
            </Fold>
          ) : null}
        </>
      )}

      {noteKey ? (
        <Fold id="notes" className="cx-notes" title={"Your notes on " + (mode === "type" ? "this type" : "this word")}>
          <NotesBar workId={noteKey} />
        </Fold>
      ) : null}

      <SavedSection saved={saved} meta={meta} onExplore={explore} />

      <details className="cx-how">
        <summary>How this works</summary>
        <ul>
          <li>
            <b>Double-click a word</b> to see where else it appears. <b>Click a verse</b> to see its connections.{" "}
            <b>Select a passage</b> and press Connections to find larger patterns: places where several of its verses
            link to several verses together.
          </li>
          <li>
            <b>Patterns</b> come from shared Hebrew and Greek words (including the Greek the Septuagint uses for a Hebrew
            word) and from the Fathers citing two passages in one paragraph. <b>Strong</b>: a type two or more
            Fathers draw, two or more Fathers citing both, or a Father and shared words together. <b>Moderate</b>:
            a type one Father draws, one Father citing both, or rare words in common. <b>Weak</b>: a few common
            words. Shared words alone never count as strong, since many are chance, not even when several verses share them. Several verses linking
            together raise a pattern a step.
          </li>
          <li>
            <b>The Fathers' own words</b> on a verse are in the Commentary tab. Here they count as evidence: a Father
            citing two passages in one paragraph links them.
          </li>
          <li>
            <b>The chart</b>: gold arcs are types the Fathers draw, red ones passages the Fathers cite together,
            grey ones shared words. Drag to move; double-click, pinch or Ctrl + scroll to zoom.
          </li>
          <li>
            <b>Moving around</b>: clicking a pattern opens it here without moving the reader. The arrows go back and
            forward; "Open in the reader" takes the text there. The star saves a connection.
          </li>
        </ul>
      </details>
    </div>
  );
}
