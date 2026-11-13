import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { inspectTimelineEra, type ShelfPeriodId } from "../../../server/shelf";
import { attributionLabel, authorLine, hasAttribution, shortAuthor } from "../../../server/workMeta";
import type { Author, Work, WorkOutline } from "../../../server/types";
import { fetchChapter, fetchWork } from "../../api/client";
import { chapterPublicPath, englishParagraphs } from "../../lib/fatherPaths";
import { clavisUrl, formatClavisNumber } from "../../lib/clavis";
import { KEY_WORKS, formatWords, readingTime } from "../../lib/keyWorks";
import { loadLastRead } from "../../lib/lastRead";
import { formatCentury, writingCategory } from "../../lib/libraryHover";
import { readPath } from "../../lib/workSlugs";
import { FORM_NOTES, manuscriptForm, workCentury } from "../../lib/manuscriptForm";
import { ManuscriptButton } from "../manuscript/ManuscriptButton";
import { ManuscriptFigure } from "../manuscript/ManuscriptFigure";
import type { LeafState } from "../manuscript/ManuscriptLeaf";
import { useManuscripts } from "../../lib/useManuscripts";
import { setStoredBookStage, storedBookStage, type BookStage } from "../../lib/prefs";
import { loadBookText } from "../../lib/bookText";
import { PRINT_EDITIONS } from "../../lib/printEditions";
import { webglAvailable } from "../../three/support";
import { HUE_LEATHER, authorHue } from "./BookSpine";

const ManuscriptStage = lazy(() => import("../manuscript/ManuscriptStage"));

/** A book carried from the shelf has landed and mostly opened its cover this long after the viewer opens. */
const LANDED_MS = 2000;
/** The cross-fade from the generated book to the manuscript page (manuscript-stage.css). */
const HANDOVER_MS = 520;

/** The paragraphs from the first real one onward: drops a repeated title or heading at the top. */
export function bodyParagraphs(paras: string[], skip: string[]): string[] {
  const lowerSkip = skip.map((s) => s.trim().toLowerCase().replace(/[.\s]+$/, ""));
  const start = paras.findIndex((p) => {
    const t = p.trim();
    return t.length >= 60 && !lowerSkip.includes(t.toLowerCase().replace(/[.\s]+$/, ""));
  });
  return start < 0 ? paras : paras.slice(start);
}

/** First real paragraph of a work, cut on a word near `max` characters. */
export function openingLines(paras: string[], skip: string[], max = 420): string {
  const lowerSkip = skip.map((s) => s.trim().toLowerCase().replace(/[.\s]+$/, ""));
  const para = paras.find((p) => {
    const t = p.trim();
    if (t.length < 80) return false;
    return !lowerSkip.includes(t.toLowerCase().replace(/[.\s]+$/, ""));
  });
  if (!para) return "";
  const clean = para.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return (space > 200 ? cut.slice(0, space) : cut).replace(/[,;:]+$/, "") + "…";
}

function chapterHref(outline: WorkOutline, slug: string): string {
  if (outline.chapters.length > 1 && slug) return chapterPublicPath(outline.author.id, outline.work.id, slug);
  return readPath(outline.work.id);
}

export function BookViewer({
  work,
  author,
  works,
  periodId,
  onClose,
  onStep,
  origin,
  carried = false,
  onStageEl,
  onTurn,
  onHandOver
}: {
  work: Work;
  author: Author;
  /** Every book on this Father's shelves, in shelf order, for Previous / Next. */
  works: Work[];
  periodId: ShelfPeriodId;
  onClose: () => void;
  onStep: (id: string) => void;
  /** Where the book stood on the shelf. It flies out from there into the viewer, with no cut. */
  origin?: DOMRect | null;
  /** The book flew in from the shelf on the 3D layer: keep an empty stage for it, and pass page turns. */
  carried?: boolean;
  onStageEl?: (el: HTMLElement | null) => void;
  onTurn?: (dir: 1 | -1) => void;
  /** The manuscript page has taken the stage: the carried book can go. */
  onHandOver?: () => void;
}) {
  const navigate = useNavigate();
  const [outline, setOutline] = useState<WorkOutline | null>(null);
  const [opening, setOpening] = useState<{ heading: string; text: string } | null>(null);
  const [paras, setParas] = useState<string[]>([]);
  const has3d = useMemo(() => typeof window !== "undefined" && webglAvailable(), []);
  const form = manuscriptForm(work, author);
  const [coverOpen, setCoverOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const index = works.findIndex((w) => w.id === work.id);
  const prev = index > 0 ? works[index - 1] : null;
  const next = index >= 0 && index < works.length - 1 ? works[index + 1] : null;
  const era = inspectTimelineEra(work.id, periodId, author.deathYear);
  const last = loadLastRead();
  const resume = last && last.work === work.id && last.chapter && last.chapter > 1 ? last.chapter : null;
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [flying, setFlying] = useState(() => Boolean(origin) && !reduced);
  const flightRef = useRef<Animation | null>(null);
  useEffect(() => () => flightRef.current?.cancel(), []);

  /*
   * Works with a real manuscript page show that page on the stage; the generated book is the fallback
   * and the reader's other choice. The book stays on the stage while the page downloads (library
   * servers often take seconds), then the page fades in over it. A page that fails never shows.
   */
  const manuscripts = useManuscripts();
  const msPage = has3d ? manuscripts?.MANUSCRIPTS[work.id] : undefined;
  const [stagePref, setStagePref] = useState<BookStage>(storedBookStage);
  const [leaf, setLeaf] = useState<{ id: string; state: LeafState }>({ id: "", state: "loading" });
  const leafState: LeafState = leaf.id === work.id ? leaf.state : "loading";
  const leafWanted = Boolean(msPage) && stagePref === "manuscript" && leafState !== "error";
  // A carried book lands and opens before it hands over, so the flight is never cut short.
  const [landed, setLanded] = useState(!carried);
  useEffect(() => {
    if (!carried) return;
    const t = window.setTimeout(() => setLanded(true), reduced ? 0 : LANDED_MS);
    return () => window.clearTimeout(t);
  }, [carried, reduced]);
  // The work whose book has left the stage for its manuscript page.
  const [bookGone, setBookGone] = useState<string | null>(null);
  const phase: "book" | "waiting" | "handing" | "leaf" = !leafWanted
    ? "book"
    : leafState !== "ready" || (carried && !landed)
      ? "waiting"
      : bookGone === work.id
        ? "leaf"
        : "handing";
  const handOverRef = useRef(onHandOver);
  handOverRef.current = onHandOver;
  const carriedRef = useRef(carried);
  carriedRef.current = carried;
  useEffect(() => {
    if (phase !== "handing") return;
    const id = work.id;
    const t = window.setTimeout(
      () => {
        setBookGone(id);
        setFlying(false);
        if (carriedRef.current) handOverRef.current?.();
      },
      reduced ? 0 : HANDOVER_MS
    );
    return () => window.clearTimeout(t);
  }, [phase, work.id, reduced]);

  function chooseStage(next: BookStage) {
    setStagePref(next);
    setStoredBookStage(next);
    // Coming back to the manuscript loads the page afresh and fades it in over the book again.
    setLeaf({ id: "", state: "loading" });
    setBookGone(null);
  }

  /**
   * The book taken off the shelf flies here as itself: the 3D object starts small where the spine
   * stood, grows to its place in the viewer, and opens its cover as it lands. Scaling the whole
   * drawing evenly keeps the book in proportion all the way.
   */
  function fly(el: HTMLElement) {
    if (!flying || !origin) return;
    const r = el.getBoundingClientRect();
    const s = Math.min(1, origin.height / (r.height * 0.7));
    const dx = origin.left + origin.width / 2 - (r.left + r.width / 2);
    const dy = origin.top + origin.height / 2 - (r.top + r.height / 2);
    const anim = el.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${s})`, opacity: 0 },
        { transform: `translate(${dx * 0.9}px, ${dy * 0.9}px) scale(${s * 1.08})`, opacity: 1, offset: 0.12 },
        { transform: "none", opacity: 1 }
      ],
      { duration: 760, easing: "cubic-bezier(0.25, 0.7, 0.2, 1)" }
    );
    flightRef.current = anim;
    // The cover starts to open just before the book lands, so landing and opening are one motion.
    window.setTimeout(() => setFlying(false), 520);
  }

  // Load the contents and the first page; open the cover once the page has words on it.
  useEffect(() => {
    let live = true;
    setOutline(null);
    setOpening(null);
    setParas([]);
    setCoverOpen(false);
    setLeaving(false);
    // Shared with the shelf, which starts this while the reader is still pointing at the book.
    loadBookText(work)
      .then((t) => {
        if (!live) return;
        setOutline(t.outline);
        setOpening(t.opening);
        setParas(t.paras);
      })
      .catch(() => {
        /* the panel still shows the catalog facts */
      });
    const t = window.setTimeout(() => live && setCoverOpen(true), reduced ? 0 : 650);
    return () => {
      live = false;
      window.clearTimeout(t);
    };
  }, [work.id, work.title, reduced]);

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && prev) onStep(prev.id);
      else if (e.key === "ArrowRight" && next) onStep(next.id);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, onStep, prev, next]);

  function read(href: string) {
    if (reduced) {
      navigate(href);
      return;
    }
    setLeaving(true);
    window.setTimeout(() => navigate(href), 380);
  }

  const startHref = readPath(work.id);
  const resumeMeta = resume && outline ? outline.chapters.find((c) => c.chapter === resume) : undefined;
  // The work's own century where it differs from its shelf Father's; none when it is not known.
  const century = workCentury(work, author);
  const attributed = hasAttribution(work);
  const label = attributionLabel(work, author);
  const coverAuthor = attributed ? shortAuthor(work, author) : author.name;

  return (
    <div
      className={"bv" + (leaving ? " is-leaving" : "") + ((origin || carried) && !reduced ? " is-from-shelf" : "") + (flying ? " is-flying" : "")}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bv-title"
    >
      <button type="button" className="bv-backdrop" aria-label="Close book" tabIndex={-1} onClick={onClose} />
      <div className="bv-card">
        <button type="button" className="bv-close" ref={closeRef} aria-label="Close book" onClick={onClose}>
          ×
        </button>
        {prev ? (
          <button type="button" className="bv-step bv-step--prev" aria-label={"Previous: " + prev.title} onClick={() => onStep(prev.id)}>
            ‹
          </button>
        ) : null}
        {next ? (
          <button type="button" className="bv-step bv-step--next" aria-label={"Next: " + next.title} onClick={() => onStep(next.id)}>
            ›
          </button>
        ) : null}

        <div className={"bv-stage" + (has3d && (paras.length || leafWanted) ? " bv-stage--3d" : "")}>
          <div className={"bv-swap is-" + phase}>
            {phase === "leaf" ? null : carried ? (
              <figure className="ms-stage ms-stage--carried is-ready">
                <div
                  className="ms-canvas"
                  ref={onStageEl}
                  tabIndex={0}
                  role="img"
                  aria-label={FORM_NOTES[form].label + " of " + work.title + ". Tap a page to turn it; arrow keys work too."}
                  onClick={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    onTurn?.(e.clientX - r.left > r.width / 2 ? 1 : -1);
                  }}
                  onKeyDownCapture={(e) => {
                    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                    e.stopPropagation();
                    e.preventDefault();
                    onTurn?.(e.key === "ArrowRight" ? 1 : -1);
                  }}
                />
                <figcaption className="ms-caption">
                  <strong>{FORM_NOTES[form].label}</strong>
                  <span className="ms-hint">{FORM_NOTES[form].hint}</span>
                  <span className="ms-note">{FORM_NOTES[form].note} The words are the English translation you read here.</span>
                </figcaption>
              </figure>
            ) : has3d && paras.length ? (
              <Suspense fallback={<p className="bv-count">Opening…</p>}>
                <ManuscriptStage
                  title={work.title}
                  author={coverAuthor}
                  paras={paras}
                  form={form}
                  cover={HUE_LEATHER[authorHue(author.id)]}
                  holdCover={flying}
                  onReady={fly}
                />
              </Suspense>
            ) : (
              <button
                type="button"
                className={"bv-book" + (coverOpen ? " is-open" : "")}
                data-hue={authorHue(author.id)}
                aria-label={"Start reading " + work.title}
                onMouseEnter={() => setCoverOpen(true)}
                onFocus={() => setCoverOpen(true)}
                onClick={() => read(startHref)}
              >
                <span className="bv-3d">
                  <span className="bv-edge" aria-hidden="true" />
                  <span className="bv-page">
                    {opening?.heading ? <span className="bv-page-head">{opening.heading}</span> : null}
                    {opening?.text ? (
                      <span className="bv-page-text">{opening.text}</span>
                    ) : (
                      <span className="bv-page-text bv-page-text--wait">{work.title}</span>
                    )}
                    <span className="bv-page-cta">Read on →</span>
                  </span>
                  <span className="bv-cover">
                    <span className="bv-cover-front">
                      <img className="bv-cover-mark" src="/assets/chi-rho-gold.png" alt="" width={28} height={28} />
                      <span className="bv-cover-title">{work.title}</span>
                      <span className="bv-cover-rule" aria-hidden="true" />
                      {coverAuthor ? <span className="bv-cover-author">{coverAuthor}</span> : null}
                    </span>
                    <span className="bv-cover-inside" aria-hidden="true">
                      <span>Ex libris</span>
                      <strong>Patrista</strong>
                    </span>
                  </span>
                </span>
              </button>
            )}
            {leafWanted && msPage ? (
              <ManuscriptFigure key={work.id} page={msPage} onState={(state) => setLeaf({ id: work.id, state })} />
            ) : null}
          </div>
          {msPage && leafState !== "error" ? (
            phase === "book" ? (
              <button type="button" className="bv-swap-control" onClick={() => chooseStage("manuscript")}>
                See the manuscript
              </button>
            ) : phase === "waiting" ? (
              // Quiet, and hidden until a carried book has landed: the flight is the thing to watch until then.
              // It keeps its room meanwhile, so nothing below moves when it shows.
              <p className={"bv-swap-control bv-swap-status" + (landed ? "" : " is-hidden")} role="status">
                Fetching the manuscript page…
              </p>
            ) : (
              <button type="button" className="bv-swap-control" onClick={() => chooseStage("book")}>
                Open as a book
              </button>
            )
          ) : null}
          {works.length > 1 ? (
            <p className="bv-count">
              {index + 1} of {works.length}
            </p>
          ) : null}
        </div>

        <div className="bv-info">
          <p className="bv-kicker">
            {KEY_WORKS.has(work.id) ? <span className="bv-badge">Start here</span> : null}
            {writingCategory(work.title)}
            {century ? " · " + formatCentury(century) + " century" : ""}
          </p>
          <h2 id="bv-title">{work.title}</h2>
          {attributed ? (
            <>
              {label ? <p className="bv-disputed">{label}</p> : null}
              <p className="bv-author">{authorLine(work, author)}</p>
            </>
          ) : (
            <p className="bv-author">
              {author.name}
              {author.dates ? " · " + author.dates : ""}
            </p>
          )}
          <dl className="bv-stats">
            <div>
              <dt>Length</dt>
              <dd>{formatWords(work.wordCount)}</dd>
            </div>
            <div>
              <dt>Reading time</dt>
              <dd>{readingTime(work.wordCount)}</dd>
            </div>
            <div>
              <dt>Parts</dt>
              <dd>{work.chapters}</dd>
            </div>
            <div>
              <dt>Edition</dt>
              <dd>{work.edition || work.series || "Schaff"}</dd>
            </div>
            {work.translator ? (
              <div>
                <dt>Translator</dt>
                <dd>{work.translator}</dd>
              </div>
            ) : null}
            {work.clavis ? (
              <div>
                <dt>Clavis</dt>
                <dd>
                  <a href={clavisUrl(work.clavis.id)} target="_blank" rel="noopener noreferrer" title="This work's entry in Clavis Clavium">
                    {work.clavis.numbers.map(formatClavisNumber).join(", ")}
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
          {work.blurb ? <p className="bv-blurb">{work.blurb}</p> : null}
          <div className="bv-actions">
            <button type="button" className="bv-primary" onClick={() => read(startHref)}>
              Start reading
            </button>
            {resume ? (
              <button
                type="button"
                className="bv-secondary"
                onClick={() =>
                  read(
                    outline && resumeMeta
                      ? chapterHref(outline, resumeMeta.slug)
                      : startHref + (startHref.includes("?") ? "&" : "?") + "chapter=" + resume
                  )
                }
              >
                Continue{resumeMeta ? ": " + resumeMeta.heading : ""}
              </button>
            ) : null}
            <Link className="bv-link" to={"/print?work=" + encodeURIComponent(work.id)}>
              PDF
            </Link>
            {/* The stage offers the manuscript itself. The link stays without WebGL (it goes to the library) and after a failed page. */}
            {msPage && leafState !== "error" ? null : (
              <ManuscriptButton className="bv-link" workId={work.id} title={work.title} prefetchOn={msPage ? "hover" : "mount"} />
            )}
            {PRINT_EDITIONS[work.id] ? (
              <a className="bv-link" href={PRINT_EDITIONS[work.id].url} target="_blank" rel="sponsored nofollow noopener">
                Get the hardcover ↗
              </a>
            ) : null}
          </div>
          {outline && outline.chapters.length > 1 ? (
            <details className="bv-toc">
              <summary>Contents · {outline.chapters.length}</summary>
              <ol>
                {outline.chapters.map((c) => (
                  <li key={c.chapter}>
                    <Link to={chapterHref(outline, c.slug)}>{c.heading}</Link>
                  </li>
                ))}
              </ol>
            </details>
          ) : null}
          <aside className="bv-era">
            <p className="bv-era-date">{era.display}</p>
            <h3>{era.title}</h3>
            <p>{era.body}</p>
          </aside>
        </div>
      </div>
    </div>
  );
}
