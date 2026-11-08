import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { fetchBibleChapter } from "../api/client";
import { bibleHrefFor, bookOf, rangeLabel, splitVid, type Meta, type TypeEntry } from "../api/connections";
import { fetchChapterCitations, type ChapterCitations } from "../api/scripture";
import { fatherNames } from "../lib/connectionPatterns";
import { drawnBy, passageChapters, quoteForPassage, trailPassages, verseWindow } from "../lib/typeTrail";
import { FatherRef, italics, splitWhere } from "./typeParts";
import "../styles/type-trail.css";

/*
 * A type walked as a trail: one passage at a time, Genesis to Revelation, then what it points to in Christ.
 * Previous / Next, the arrow keys, or a dot for each stop move along it; the page keeps the stop in the URL.
 */

export function TypeTrail({ t, meta, stop, onStop }: { t: TypeEntry; meta: Meta; stop: number; onStop: (n: number | null) => void }) {
  const passages = useMemo(() => trailPassages(t), [t]);
  const length = passages.length + 1;
  const r = passages[stop - 1];
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if ((e.target as HTMLElement | null)?.closest?.("input, textarea, select, [contenteditable='true']")) return;
      if (e.key === "ArrowRight" && stop < length) onStop(stop + 1);
      else if (e.key === "ArrowLeft" && stop > 1) onStop(stop - 1);
      else if (e.key === "Escape") onStop(null);
      else return;
      e.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stop, length, onStop]);

  // A long stop may leave the next one's top off screen: bring it back.
  useEffect(() => {
    const el = rootRef.current;
    if (el && el.getBoundingClientRect().top < 0) {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    }
  }, [stop]);

  const stopName = (n: number) => (n <= passages.length ? rangeLabel(meta, passages[n - 1][0], passages[n - 1][1]) : "In Christ");

  return (
    <div className="tt" ref={rootRef}>
      <div className="tt-top">
        <button type="button" className="tt-back" onClick={() => onStop(null)}>
          ← {t.label}
        </button>
      </div>

      <div className="tt-progress">
        <span className="tt-count" aria-live="polite">
          {stop} of {length}
        </span>
        <ol className="tt-dots" aria-label="Stops on the trail">
          {Array.from({ length }, (_, i) => i + 1).map((n) => (
            <li key={n}>
              <button
                type="button"
                className={"tt-dot" + (n === length ? " is-end" : "") + (n < stop ? " is-past" : "")}
                aria-current={n === stop ? "step" : undefined}
                aria-label={n + ". " + stopName(n)}
                title={stopName(n)}
                onClick={() => onStop(n)}
              />
            </li>
          ))}
        </ol>
      </div>

      <section className="tt-stop" key={stop}>
        {r ? <PassageStop t={t} meta={meta} r={r} /> : <ChristStop t={t} />}
      </section>

      <nav className="tt-nav" aria-label="Trail">
        <button type="button" className="tt-prev" onClick={() => onStop(stop - 1)} disabled={stop <= 1}>
          ← Previous
        </button>
        {stop < length ? (
          <button type="button" className="tt-next" onClick={() => onStop(stop + 1)}>
            {stop + 1 === length ? "In Christ →" : "Next →"}
          </button>
        ) : (
          <button type="button" className="tt-next" onClick={() => onStop(null)}>
            Back to the type
          </button>
        )}
      </nav>
    </div>
  );
}

type Loaded = { verses: string[]; window: ReturnType<typeof verseWindow>; quote: number | null };

/** One passage: its reference (into the Bible), a few verses of the KJV, and a Father's line on it if one is tied. */
function PassageStop({ t, meta, r }: { t: TypeEntry; meta: Meta; r: [number, number] }) {
  const [got, setGot] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState(false);
  const book = bookOf(meta, r[0])?.id;

  useEffect(() => {
    if (!book) return;
    let live = true;
    const chapters = passageChapters(r);
    // The Scripture index and the passage's first chapter together; another chapter only if the Father's
    // verse lies in it.
    const first = fetchBibleChapter(book, splitVid(r[0]).chapter);
    Promise.all(chapters.map((c) => fetchChapterCitations(book, c).then((x): [number, ChapterCitations | null] => [c, x])))
      .then((pairs) => quoteForPassage(t, r, new Map(pairs)))
      .catch(() => null)
      .then(async (q) => {
        const window = verseWindow(r, q?.vid);
        const chapter = window.chapter === splitVid(r[0]).chapter ? await first : await fetchBibleChapter(book, window.chapter);
        if (live) setGot({ verses: chapter.verses, window, quote: q?.index ?? null });
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [t, book, r]);

  const w = got?.window;
  const shown = w && got ? got.verses.slice(w.from - 1, w.to) : [];
  const a = splitVid(r[0]);
  const b = splitVid(r[1]);
  // The whole passage is shown when the window holds it, or holds all of a passage that runs to its chapter's end.
  const whole = !w || !w.more || (w.from === a.verse && w.chapter === a.chapter && b.chapter === a.chapter && w.to >= got!.verses.length);
  const quote = got?.quote != null ? splitWhere(t.where[got.quote]) : null;
  const link = got?.quote != null ? t.links?.[got.quote] : null;

  return (
    <>
      <h3 className="tt-ref">
        <Link to={bibleHrefFor(meta, r[0])}>{rangeLabel(meta, r[0], r[1])}</Link>
      </h3>
      {failed ? (
        <p className="tt-note">The text could not be loaded.</p>
      ) : !got ? (
        <p className="tt-note">Loading…</p>
      ) : (
        <>
          <p className="tt-text">
            {shown.map((v, i) => (
              <span key={i}>
                <sup>{w!.from + i}</sup>
                {v}{" "}
              </span>
            ))}
            {whole ? null : (
              <Link className="tt-more" to={bibleHrefFor(meta, r[0])}>
                Read it all in the Bible →
              </Link>
            )}
          </p>
          {quote && link ? (
            <figure className="tt-father">
              <blockquote>{quote.quote}</blockquote>
              <figcaption>
                <FatherRef refText={quote.ref} href={link.href} />{" "}
                <Link to={link.href} className="ty-quote-go">
                  Read in context →
                </Link>
              </figcaption>
            </figure>
          ) : null}
        </>
      )}
    </>
  );
}

/** The last stop: what the type points to in Christ, with the Fathers who say so. */
function ChristStop({ t }: { t: TypeEntry }) {
  const fathers = fatherLinks(t);
  return (
    <>
      <h3 className="tt-ref">In Christ</h3>
      {t.christ ? <p className="tt-christ">{linkCitations(t)}</p> : null}
      <p className="tt-fathers">
        {drawnBy(t)}:{" "}
        {fathers.map((f, i) => (
          <span key={f.name}>
            {i ? " · " : null}
            {f.href ? (
              <Link to={f.href} className="ty-father">
                {f.name}
              </Link>
            ) : (
              f.name
            )}
          </span>
        ))}
      </p>
    </>
  );
}

/**
 * Each Father once, linked to his page. A citation with a note after the name ("Ambrose (quoted in Cassian")
 * links to another man's work, so that name is left plain.
 */
function fatherLinks(t: TypeEntry): { name: string; href: string | null }[] {
  const out = new Map<string, string | null>();
  t.where.forEach((w, i) => {
    const raw = w.split(",")[0];
    const [name] = fatherNames([raw]);
    const author = t.links?.[i]?.href.match(/^\/fathers\/([^/]+)\//)?.[1];
    const href = author && !raw.includes("(") ? "/fathers/" + author + "/" : null;
    if (name && (!out.has(name) || (!out.get(name) && href))) out.set(name, href);
  });
  return [...out].map(([name, href]) => ({ name, href }));
}

/**
 * The "in Christ" line with its citations linked: "(Chrysostom, *Hom. Heb.* 32)" opens that paragraph; a
 * Father named on his own ("(Gregory of Nyssa)") opens his page. Each is linked once.
 */
function linkCitations(t: TypeEntry): ReactNode[] {
  const targets: { text: string; href: string; father: string }[] = [];
  t.where.forEach((w, i) => {
    const href = t.links?.[i]?.href;
    if (href) targets.push({ text: splitWhere(w).ref, href, father: fatherNames([w])[0] ?? "" });
  });
  for (const f of fatherLinks(t)) if (f.href) targets.push({ text: f.name, href: f.href, father: f.name });
  const text = t.christ;
  const used = new Set<string>();
  const out: ReactNode[] = [];
  let pos = 0;
  const isWordEdge = (at: number) => at < 0 || at >= text.length || !/[A-Za-z]/.test(text[at]);
  for (;;) {
    let hit: { at: number; target: (typeof targets)[number] } | null = null;
    for (const target of targets) {
      if (!target.text || used.has(target.father + "|" + (target.text === target.father ? "name" : target.text))) continue;
      let at = text.indexOf(target.text, pos);
      while (at >= 0 && !(isWordEdge(at - 1) && isWordEdge(at + target.text.length))) at = text.indexOf(target.text, at + 1);
      if (at < 0) continue;
      if (!hit || at < hit.at || (at === hit.at && target.text.length > hit.target.text.length)) hit = { at, target };
    }
    if (!hit) break;
    out.push(<span key={out.length}>{italics(text.slice(pos, hit.at))}</span>);
    out.push(
      <Link key={out.length} to={hit.target.href} className="ty-father">
        {italics(hit.target.text)}
      </Link>
    );
    used.add(hit.target.father + "|" + (hit.target.text === hit.target.father ? "name" : hit.target.text));
    // A Father whose work is linked is not linked again by his bare name.
    used.add(hit.target.father + "|name");
    pos = hit.at + hit.target.text.length;
  }
  out.push(<span key={out.length}>{italics(text.slice(pos))}</span>);
  return out;
}
