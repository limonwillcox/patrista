import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchBibleChapter } from "../api/client";
import {
  bibleHrefFor,
  bookOf,
  canonPosition,
  chapterOffsets,
  fetchMeta,
  fetchTypes,
  GROUP_COLOR,
  rangeLabel,
  splitVid,
  type Meta,
  type TypeEntry
} from "../api/connections";
import "../styles/types.css";

/*
 * The atlas of types: every type the Fathers draw from Scripture on one page. A strip runs from Genesis to
 * Revelation; each type is a chain of arcs joining its passages, first to last. Pick one to read what it is,
 * what it points to in Christ, every passage, and the Fathers' own words. The chosen type opens in the list
 * itself, across its full width, where it was picked. Data: public/connections/types.json.
 */

const KINDS: { id: string; label: string }[] = [
  { id: "role", label: "Figures" },
  { id: "object", label: "Things" },
  { id: "sequence", label: "Events" },
  { id: "zone", label: "Places" },
  { id: "number", label: "Numbers" },
  { id: "axis", label: "Directions" }
];
const kindLabel = (k?: string) => KINDS.find((x) => x.id === k)?.label ?? "Other";

/** The strip's drawing units. */
const W = 1000;
const PAD = 12;
const BASE = 168;
const H = 214;

function italics(text: string): ReactNode {
  return text.split(/\*([^*]+)\*/).map((part, i) => (i % 2 ? <i key={i}>{part}</i> : part));
}

/** "Cyril, *Cat.* 13.20 — “…”" → the reference and the quotation. */
function splitWhere(w: string): { ref: string; quote: string } {
  const at = w.indexOf(" — ");
  return at < 0 ? { ref: "", quote: w } : { ref: w.slice(0, at), quote: w.slice(at + 3) };
}

export function TypesPage() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [types, setTypes] = useState<TypeEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [params, setParams] = useSearchParams();
  const [kind, setKind] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [book, setBook] = useState<number>(0); // book number, 0 = every book
  const [hot, setHot] = useState<string | null>(null);
  const chosenId = params.get("type");

  useEffect(() => {
    Promise.all([fetchMeta(), fetchTypes()]).then(
      ([m, t]) => {
        setMeta(m);
        setTypes(t);
      },
      () => setFailed(true)
    );
  }, []);

  useEffect(() => {
    document.title = "Types of Christ in Scripture · Patrista";
  }, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const inBook = (t: TypeEntry) =>
      !book || t.ranges.some(([a, b]) => Math.floor(a / 1_000_000) <= book && Math.floor(b / 1_000_000) >= book);
    return (types ?? []).filter(
      (t) =>
        (kind === "all" || t.kind === kind) &&
        inBook(t) &&
        (!q || (t.label + " " + t.def + " " + t.christ).toLowerCase().includes(q))
    );
  }, [types, kind, query, book]);
  const chosen = types?.find((t) => slug(t.id) === chosenId) ?? null;
  // A type opened from the URL or the strip may be one the filters hide: it still shows, first.
  const listed = chosen && !shown.includes(chosen) ? [chosen, ...shown] : shown;

  // Bring the opened type into view, and on closing put focus back on its card.
  const openRef = useRef<HTMLLIElement>(null);
  const closedRef = useRef<string | null>(null);
  const loaded = Boolean(types);
  useEffect(() => {
    if (chosen && openRef.current) {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      openRef.current.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    } else if (!chosen && closedRef.current) {
      document.querySelector<HTMLElement>(`[data-type="${CSS.escape(closedRef.current)}"]`)?.focus({ preventScroll: true });
      closedRef.current = null;
    }
  }, [chosen?.id, loaded]);

  function choose(t: TypeEntry | null) {
    if (!t && chosen) closedRef.current = chosen.id;
    const p = new URLSearchParams(params);
    if (t) p.set("type", slug(t.id));
    else p.delete("type");
    setParams(p, { replace: true });
  }

  if (failed) return <div className="ty-page"><p className="ty-state">The types could not be loaded.</p></div>;
  if (!meta || !types) return <div className="ty-page"><p className="ty-state">Loading the types…</p></div>;

  const counts = new Map<string, number>();
  for (const t of types) counts.set(t.kind ?? "", (counts.get(t.kind ?? "") ?? 0) + 1);
  // How many types touch each book, for the book menu.
  const perBook = new Map<number, number>();
  for (const t of types) {
    const books = new Set<number>();
    for (const [a, b] of t.ranges) for (let n = Math.floor(a / 1_000_000); n <= Math.floor(b / 1_000_000); n++) books.add(n);
    books.forEach((n) => perBook.set(n, (perBook.get(n) ?? 0) + 1));
  }

  return (
    <div className="ty-page">
      <header className="ty-hero">
        <p className="ty-kicker">Types of Christ</p>
        <h1>What the Fathers saw in the Old Testament</h1>
      </header>

      <Strip meta={meta} types={shown} hot={hot ?? (chosen ? chosen.id : null)} onHot={setHot} onPick={choose} />

      <div className="ty-tools">
        <div className="ty-kinds" role="group" aria-label="Kind of type">
          <button type="button" aria-pressed={kind === "all"} onClick={() => setKind("all")}>
            All <span>{types.length}</span>
          </button>
          {KINDS.filter((k) => counts.get(k.id)).map((k) => (
            <button type="button" key={k.id} aria-pressed={kind === k.id} onClick={() => setKind(k.id)}>
              {k.label} <span>{counts.get(k.id)}</span>
            </button>
          ))}
        </div>
        <div className="ty-find">
        <select className="ty-book" value={book} onChange={(e) => setBook(Number(e.target.value))} aria-label="Types in a book">
          <option value={0}>Every book</option>
          {meta.books
            .filter((b) => perBook.get(b.n))
            .map((b) => (
              <option key={b.id} value={b.n}>
                {b.name} ({perBook.get(b.n)})
              </option>
            ))}
        </select>
        <input
          className="ty-search"
          type="search"
          placeholder="Find a type: lamb, water, Isaac…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Find a type"
        />
        </div>
      </div>

      <ul className="ty-list">
        {listed.map((t) =>
          chosen?.id === t.id ? (
            <li key={t.id} className="ty-open" ref={openRef}>
              <TypeDetail t={t} meta={meta} onClose={() => choose(null)} />
            </li>
          ) : (
            <li key={t.id}>
              <button
                type="button"
                data-type={t.id}
                className={"ty-card" + (hot === t.id ? " is-hot" : "")}
                onClick={() => choose(t)}
                onMouseEnter={() => setHot(t.id)}
                onMouseLeave={() => setHot(null)}
                aria-expanded={false}
              >
                <span className="ty-card-kind">{kindLabel(t.kind)}</span>
                <span className="ty-card-label">{t.label}</span>
                <span className="ty-card-def">{t.def}</span>
                <span className="ty-card-span">{spanLabel(meta, t)}</span>
              </button>
            </li>
          )
        )}
        {!listed.length ? <li className="ty-state">No type matches.</li> : null}
      </ul>
    </div>
  );
}

/** A type's id as it appears in the URL: "04:paschal-lamb" → "paschal-lamb". */
function slug(id: string): string {
  return id.replace(/^\d+:/, "");
}

/** "Genesis → John · 6 passages". */
function spanLabel(meta: Meta, t: TypeEntry): string {
  const sorted = [...t.ranges].sort((a, b) => a[0] - b[0]);
  if (!sorted.length) return "";
  const first = bookOf(meta, sorted[0][0])?.name ?? "";
  const last = bookOf(meta, sorted[sorted.length - 1][0])?.name ?? "";
  return (first === last ? first : first + " → " + last) + " · " + sorted.length + (sorted.length === 1 ? " passage" : " passages");
}

/** Genesis to Revelation, the book groups beneath, and each type as a chain of arcs. */
function Strip({
  meta,
  types,
  hot,
  onHot,
  onPick
}: {
  meta: Meta;
  types: TypeEntry[];
  hot: string | null;
  onHot: (id: string | null) => void;
  onPick: (t: TypeEntry) => void;
}) {
  const offsets = useMemo(() => chapterOffsets(meta), [meta]);
  const X = (vid: number) => PAD + canonPosition(meta, vid, offsets) * (W - 2 * PAD);
  // Book groups as bands under the line, each labelled where it is wide enough.
  const bands = useMemo(() => {
    const out: { group: string; x0: number; x1: number }[] = [];
    meta.books.forEach((b) => {
      const x0 = PAD + (offsets[b.n - 1] / offsets[offsets.length - 1]) * (W - 2 * PAD);
      const x1 = PAD + (offsets[b.n] / offsets[offsets.length - 1]) * (W - 2 * PAD);
      const last = out[out.length - 1];
      if (last && last.group === b.group) last.x1 = x1;
      else out.push({ group: b.group, x0, x1 });
    });
    return out;
  }, [meta, offsets]);
  const groupName = (id: string) => meta.groups.find((g) => g.id === id)?.label ?? id;
  const ntStart = PAD + (offsets[39] / offsets[offsets.length - 1]) * (W - 2 * PAD);

  const arcs = types.flatMap((t) => {
    const xs = [...t.ranges].sort((a, b) => a[0] - b[0]).map((r) => X(r[0]));
    return xs.slice(1).map((x, i) => ({ id: t.id, t, x0: xs[i], x1: x }));
  });
  const lift = (x0: number, x1: number) => Math.min(BASE - 14, 10 + Math.abs(x1 - x0) * 0.32);

  return (
    <figure className="ty-strip">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Each type as arcs joining its passages, Genesis to Revelation">
        <line x1={ntStart} x2={ntStart} y1={18} y2={BASE} className="ty-strip-divide" />
        <text x={ntStart - 6} y={26} textAnchor="end" className="ty-strip-testament">Old Testament</text>
        <text x={ntStart + 6} y={26} className="ty-strip-testament">New</text>
        {arcs.map((a, i) => {
          const on = hot === a.id;
          const h = lift(a.x0, a.x1);
          return (
            <path
              key={a.id + i}
              d={`M${a.x0},${BASE} C${a.x0},${BASE - h * 1.33} ${a.x1},${BASE - h * 1.33} ${a.x1},${BASE}`}
              className={"ty-arc" + (on ? " is-on" : hot ? " is-dim" : "")}
              onMouseEnter={() => onHot(a.id)}
              onMouseLeave={() => onHot(null)}
              onClick={() => onPick(a.t)}
            >
              <title>{a.t.label}</title>
            </path>
          );
        })}
        <line x1={PAD} x2={W - PAD} y1={BASE} y2={BASE} className="ty-strip-base" />
        {bands.map((b) => (
          <g key={b.group + b.x0}>
            <rect x={b.x0} y={BASE + 4} width={Math.max(1, b.x1 - b.x0 - 1.5)} height={7} rx={2} fill={GROUP_COLOR[b.group] ?? "#999"} />
            {b.x1 - b.x0 > 46 ? (
              <text x={(b.x0 + b.x1) / 2} y={BASE + 28} textAnchor="middle" className="ty-strip-group">
                {groupName(b.group)}
              </text>
            ) : null}
          </g>
        ))}
      </svg>
    </figure>
  );
}

function TypeDetail({ t, meta, onClose }: { t: TypeEntry; meta: Meta; onClose: () => void }) {
  const stops = [...t.ranges].sort((a, b) => a[0] - b[0]);
  return (
    <article className="ty-detail" aria-label={t.label}>
      <button type="button" className="ty-close" onClick={onClose} aria-label={"Close " + t.label} aria-expanded={true}>
        ×
      </button>
      <div className="ty-detail-main">
        <p className="ty-detail-kind">{kindLabel(t.kind)}</p>
        <h2>{t.label}</h2>
        <p className="ty-detail-def">{t.def}</p>
        {t.christ ? (
          <p className="ty-detail-christ">
            <b>In Christ.</b> {italics(t.christ)}
          </p>
        ) : null}

        <h3>Where it appears, first to last</h3>
        <ol className="ty-passages">
          {stops.map((r) => (
            <Passage key={r[0] + "-" + r[1]} meta={meta} r={r} />
          ))}
        </ol>
      </div>

      {t.where.length ? (
        <div className="ty-detail-words">
          <h3>In the Fathers&apos; words</h3>
          <p className="ty-quote-ref">
            &ldquo;Ps.-&rdquo; marks a work once credited to that Father but not now held to be his; &ldquo;attributed&rdquo; marks
            a fragment whose author is uncertain. &para; is the paragraph in the reader.
          </p>
          <ul className="ty-quotes">
            {t.where.map((w, i) => {
              const { ref, quote } = splitWhere(w);
              const link = t.links?.[i];
              return (
                <li key={i}>
                  {link ? (
                    <>
                      {/* The quotation opens the reader at its paragraph; the Father's name opens his page. */}
                      <Link to={link.href} className="ty-quote-link">
                        <blockquote>{quote}</blockquote>
                      </Link>
                      <p className="ty-quote-ref">
                        <FatherRef refText={ref} href={link.href} />{" "}
                        <Link to={link.href} className="ty-quote-go">
                          Read in context →
                        </Link>
                      </p>
                    </>
                  ) : (
                    <>
                      <blockquote>{quote}</blockquote>
                      <p className="ty-quote-ref">{italics(ref)}</p>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

/** "Cyril, *Cat.* 13.20" with "Cyril" linked to his page (the author is read from the passage's link). */
function FatherRef({ refText, href }: { refText: string; href: string }) {
  const author = href.match(/^\/fathers\/([^/]+)\//)?.[1];
  const at = refText.indexOf(",");
  if (!author || at < 0) return <>{italics(refText)}</>;
  return (
    <>
      <Link to={"/fathers/" + author + "/"} className="ty-father">
        {refText.slice(0, at)}
      </Link>
      {italics(refText.slice(at))}
    </>
  );
}

/** One passage: its reference (into the Bible reader) and the opening of its first verse. */
function Passage({ meta, r }: { meta: Meta; r: [number, number] }) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    const { chapter, verse } = splitVid(r[0]);
    const book = bookOf(meta, r[0])?.id;
    if (!book) return;
    let live = true;
    fetchBibleChapter(book, chapter).then(
      (p) => live && setText(p.verses[Math.max(0, Math.min(verse, p.verses.length) - 1)] ?? null),
      () => {}
    );
    return () => {
      live = false;
    };
  }, [meta, r]);
  return (
    <li>
      <Link to={bibleHrefFor(meta, r[0])} className="ty-passage-ref">
        {rangeLabel(meta, r[0], r[1])}
      </Link>
      {text ? <p className="ty-passage-text">{text.length > 160 ? text.slice(0, 158) + "…" : text}</p> : null}
    </li>
  );
}
