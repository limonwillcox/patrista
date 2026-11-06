import { Fragment, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { saveLastBible } from "../lib/lastRead";
import { fetchBibleChapter, fetchBibleManifest, type BibleChapterPayload, type BibleManifestBook } from "../api/client";
import { fetchChapterCounts } from "../api/links";
import { fetchChapterCitations } from "../api/scripture";
import { codeFor, fetchTaggedChapter, occurrenceAt, WORD_RE } from "../api/strongs";
import { BIBLE_TRANSLATIONS, missingVerseReason } from "../api/bibleTranslations";
import { remoteChapterExtras, reportFumsView } from "../api/bibleApi";
import { BookPicker } from "../components/BookPicker";
import { Commentary } from "../components/Commentary";
import { KjvNote } from "../components/reader/KjvNote";
import { ConnectionsPanel, type CxFocus } from "../components/ConnectionsPanel";
import { NotesBar } from "../components/NotesBar";
import { HIGHLIGHT_COLORS, setHighlight, useHighlights, verseKey, verseNoteId } from "../lib/bibleMarks";
import { loadNoteHtml, noteIsEmpty } from "../lib/readerNotes";
import { WordPanel } from "../components/WordPanel";
import { storedBibleTranslation, setStoredBibleTranslation } from "../lib/prefs";

/** Below this width the study panel is a sheet that opens from the bottom, not a column. */
const SHEET_QUERY = "(max-width: 1099px)";
/** Where the reader last left the divider between the text and the study panel, as a percent. */
const SPLIT_KEY = "patrista-bible-split";
const VIEW_KEY = "patrista-bible-view";
const SPLIT_MIN = 28;
const SPLIT_MAX = 72;
/** Dragging the divider this close to an edge hides that side. */
const HIDE_AT = 14;

type View = "both" | "text" | "study";

function stored<T>(key: string, ok: (v: string) => boolean, fallback: T, read: (v: string) => T): T {
  try {
    const v = localStorage.getItem(key);
    return v !== null && ok(v) ? read(v) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

/**
 * The word at a point in a verse, and which occurrence of it in that verse (so "I … I" in one verse
 * each find their own Greek word). The verse number and the comment count are not part of the text.
 */
function wordInVerse(verseEl: HTMLElement, node: Node | null, offset: number): { word: string; occurrence: number } | null {
  if (!node || node.nodeType !== Node.TEXT_NODE) return null;
  const walker = document.createTreeWalker(verseEl, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement?.closest(".vnum, .verse-notes") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT)
  });
  let text = "";
  let at = -1;
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n === node) at = text.length + offset;
    text += n.textContent ?? "";
  }
  if (at < 0) return null;
  const re = new RegExp(WORD_RE.source, "g");
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (at >= m.index && at <= m.index + m[0].length) return { word: m[0], occurrence: occurrenceAt(text, m[0], m.index) };
  }
  return null;
}

/**
 * The verses whose words a selection holds. A drag may start or end between verses, in the margin or on
 * a note, so each verse is tested rather than the two ends of the selection.
 */
function versesIn(range: Range): number[] {
  const hit: number[] = [];
  document.querySelectorAll<HTMLElement>(".bible-verses .bible-verse").forEach((el) => {
    if (!range.intersectsNode(el)) return;
    const part = document.createRange();
    part.selectNodeContents(el);
    if (part.compareBoundaryPoints(Range.START_TO_START, range) < 0) part.setStart(range.startContainer, range.startOffset);
    if (part.compareBoundaryPoints(Range.END_TO_END, range) > 0) part.setEnd(range.endContainer, range.endOffset);
    if (/[A-Za-z]/.test(part.toString())) hit.push(Number(el.id.replace("v-", "")));
  });
  return hit;
}

export function BiblePage() {
  const [params, setParams] = useSearchParams();
  const book = params.get("book") || "jo";
  const chapter = Math.max(1, Number(params.get("chapter") || 1));
  const section = params.get("section") || "";
  const translation = params.get("version") || storedBibleTranslation() || "kjv";
  const verseParam = Number(params.get("verse") || 0);

  const [manifest, setManifest] = useState<BibleManifestBook[] | null>(null);
  const [payload, setPayload] = useState<BibleChapterPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Passages per verse; undefined while loading, null when the book has no commentary yet. */
  const [counts, setCounts] = useState<Record<number, number> | null | undefined>(undefined);
  const [verse, setVerse] = useState<number>(verseParam || 1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isSheet, setIsSheet] = useState(() => typeof window !== "undefined" && window.matchMedia(SHEET_QUERY).matches);
  const [picker, setPicker] = useState(false);
  /** The study panel: what the Fathers said about the verse, or one word studied. */
  const [panel, setPanel] = useState<"commentary" | "word" | "connections">(() =>
    params.get("panel") === "connections" ? "connections" : "commentary"
  );
  const [word, setWord] = useState<{ text: string; code?: string; verse: number; where?: string } | null>(null);
  /** Verses chosen for Connections: one verse, or a passage selected across verses. */
  const [span, setSpan] = useState<{ from: number; to: number; codes: string[] } | null>(null);
  /** What the Connections tab looks at, from the reader's last action: a verse, a passage or a word. */
  const [cxFocus, setCxFocus] = useState<CxFocus | null>(null);
  const focusOn = (f: Omit<CxFocus, "n">) => setCxFocus((old) => ({ ...f, n: Math.max(Date.now(), (old?.n ?? 0) + 1) }));
  /** The "Connections" button shown beside a text selection. */
  const [selTip, setSelTip] = useState<{ x: number; y: number; from: number; to: number; codes: string[]; text?: string } | null>(null);
  /** The verse whose margin note is open for writing. */
  const [noteOpen, setNoteOpen] = useState<number | null>(null);
  const [, setNoteTick] = useState(0);
  const highlights = useHighlights();
  const [split, setSplit] = useState(() =>
    stored(SPLIT_KEY, (v) => Number(v) >= SPLIT_MIN && Number(v) <= SPLIT_MAX, 50, Number)
  );
  const [view, setView] = useState<View>(() =>
    stored<View>(VIEW_KEY, (v) => v === "both" || v === "text" || v === "study", "both", (v) => v as View)
  );
  const layoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => save(SPLIT_KEY, String(Math.round(split))), [split]);
  useEffect(() => save(VIEW_KEY, view), [view]);

  useEffect(() => {
    const mq = window.matchMedia(SHEET_QUERY);
    const on = () => setIsSheet(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchBibleManifest()
      .then((m) => !cancelled && setManifest(m))
      .catch((e) => !cancelled && setError(String(e)));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setPayload(null);
    setError(null);
    setPicker(false);
    fetchBibleChapter(book, chapter, { section: section || undefined, translation })
      .then((p) => !cancelled && setPayload(p))
      .catch((e) => !cancelled && setError(String(e)));
    return () => {
      cancelled = true;
    };
  }, [book, chapter, section, translation]);

  // Which verses the Fathers wrote on. The first such verse is open in the commentary from the start.
  useEffect(() => {
    let cancelled = false;
    setCounts(undefined);
    // Both sources: the commentary collections and the library's citations. The larger count of the two
    // stands for the verse, since the Commentary tab drops the passages they share.
    Promise.all([fetchChapterCounts(book, chapter).catch(() => null), fetchChapterCitations(book, chapter)])
      .then(([curated, cites]) => {
        const c: Record<number, number> = { ...curated };
        for (const [k, list] of Object.entries(cites ?? {})) {
          const [ch, v] = k.split(":").map(Number);
          if (ch === chapter) c[v] = Math.max(c[v] ?? 0, list.length);
        }
        return curated || cites ? c : null;
      })
      .then((c) => {
        if (cancelled) return;
        setCounts(c);
        if (!verseParam) {
          const withNotes = c ? Object.keys(c).map(Number).filter((n) => c[n] > 0) : [];
          setVerse(withNotes.length ? Math.min(...withNotes) : 1);
        }
      })
      .catch(() => !cancelled && setCounts(null));
    return () => {
      cancelled = true;
    };
  }, [book, chapter, verseParam]);

  // The selection button follows the text; scrolling or a new chapter hides it.
  useEffect(() => {
    if (!selTip) return;
    const hide = () => setSelTip(null);
    window.addEventListener("scroll", hide, { passive: true, once: true });
    return () => window.removeEventListener("scroll", hide);
  }, [selTip]);
  // While a drag covers more than one verse, whole verses are shaded and the browser's own highlight of
  // the words is hidden: a passage is chosen by verses, not by letters.
  const [picking, setPicking] = useState<{ from: number; to: number } | null>(null);
  useEffect(() => {
    let frame = 0;
    function onChange() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const sel = window.getSelection();
        const range = sel && !sel.isCollapsed && sel.rangeCount ? sel.getRangeAt(0) : null;
        const hit = range ? versesIn(range) : [];
        // A selection that runs out of the verses (up into the heading) is choosing verses too.
        const box = document.querySelector(".bible-verses");
        const leaves = !!range && !!box && (!box.contains(range.startContainer) || !box.contains(range.endContainer));
        const next = hit.length > 1 || (hit.length === 1 && leaves) ? { from: Math.min(...hit), to: Math.max(...hit) } : null;
        setPicking((cur) => (cur?.from === next?.from && cur?.to === next?.to ? cur : next));
      });
    }
    document.addEventListener("selectionchange", onChange);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("selectionchange", onChange);
    };
  }, []);

  // A drag that selects verses often ends outside them (in the margin, past the last line), so the
  // mouse-up is heard on the whole page. The toolbar, the pen and the notes act on their own clicks.
  const textUp = useRef(onTextMouseUp);
  textUp.current = onTextMouseUp;
  useEffect(() => {
    function up(e: MouseEvent) {
      if ((e.target as Element | null)?.closest?.(".cx-seltip, .verse-pen, .verse-margin-note, .kjv-note")) return;
      void textUp.current();
    }
    document.addEventListener("mouseup", up);
    return () => document.removeEventListener("mouseup", up);
  }, []);
  useEffect(() => {
    setSelTip(null);
    setSpan(null);
    setCxFocus(null);
    setNoteOpen(null);
  }, [book, chapter]);

  // Remember the chapter, so the Bible tab reopens here.
  useEffect(() => saveLastBible(params), [params]);

  // A link from a Father's footnote (?verse=4): open that verse and its commentary once the chapter is in.
  useEffect(() => {
    if (!payload || !verseParam || verseParam > payload.verses.length) return;
    setVerse(verseParam);
    if (window.matchMedia(SHEET_QUERY).matches) setSheetOpen(true);
    const el = document.getElementById("v-" + verseParam);
    if (el) {
      el.scrollIntoView({ behavior: "auto", block: "center" });
      el.classList.add("para-flash");
      window.setTimeout(() => el.classList.remove("para-flash"), 2600);
    }
  }, [payload, verseParam]);

  // The sheet holds the page still while it is open.
  useEffect(() => {
    if (!(isSheet && sheetOpen)) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheetOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [isSheet, sheetOpen]);

  /** Drag the divider. Past the edges it hides a side; the text takes the share left of the pointer. */
  function onDividerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("button")) return;
    const box = layoutRef.current?.getBoundingClientRect();
    if (!box) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    document.body.classList.add("is-resizing");
    const move = (ev: PointerEvent) => {
      const pct = ((ev.clientX - box.left) / box.width) * 100;
      if (pct < HIDE_AT) setView("study");
      else if (pct > 100 - HIDE_AT) setView("text");
      else {
        setView("both");
        setSplit(Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, pct)));
      }
    };
    const up = () => {
      document.body.classList.remove("is-resizing");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  const bookIndex = manifest ? manifest.findIndex((b) => b.id === book) : -1;
  const bookMeta = useMemo(() => manifest?.find((b) => b.id === book) || payload?.book, [manifest, book, payload]);
  const bookName = bookMeta?.name || book;
  const chapterCount = bookMeta?.chapters || 1;
  const activeTranslation = BIBLE_TRANSLATIONS.find((t) => t.id === translation);
  /** An API.Bible text: the publisher's own copyright line, and the token its licence asks us to report views with. */
  const remote = payload && activeTranslation && !activeTranslation.isLocal ? remoteChapterExtras(translation, book, chapter) : undefined;
  useEffect(() => {
    if (payload && translation !== "esv") reportFumsView(remote?.fumsToken);
    // One report per chapter shown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload]);

  function go(next: { book?: string; chapter?: number; section?: string; version?: string }, replace = false) {
    const p: Record<string, string> = { book: next.book ?? book, chapter: String(next.chapter ?? chapter) };
    if (next.section) p.section = next.section;
    const v = next.version ?? translation;
    if (v && v !== "kjv") p.version = v;
    setParams(p, { replace });
    window.scrollTo({ top: 0 });
  }

  /** The chapter before or after this one, across book boundaries. */
  function step(dir: 1 | -1): { book: string; chapter: number } | null {
    if (!manifest || bookIndex < 0) return null;
    const c = chapter + dir;
    if (c >= 1 && c <= chapterCount) return { book, chapter: c };
    const nb = manifest[bookIndex + dir];
    if (!nb) return null;
    return { book: nb.id, chapter: dir === 1 ? 1 : nb.chapters };
  }
  const prev = step(-1);
  const next = step(1);
  const label = (s: { book: string; chapter: number }) =>
    (manifest?.find((b) => b.id === s.book)?.name || s.book) + " " + s.chapter;

  function setTranslation(id: string) {
    setStoredBibleTranslation(id);
    go({ section, version: id }, true);
  }

  function showStudy() {
    if (isSheet) setSheetOpen(true);
    else if (view === "text") setView("both");
  }

  function pickVerse(n: number) {
    setVerse(n);
    setSpan(null);
    focusOn({ from: n, to: n });
    if (panel !== "connections") setPanel("commentary");
    showStudy();
  }

  /**
   * A selection in the text: which verses it covers and which Hebrew/Greek words it holds. Offers a
   * "Connections" button beside it; nothing changes until the reader presses it.
   */
  async function onTextMouseUp() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      setSelTip(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const hit = versesIn(range);
    if (!hit.length) {
      setSelTip(null);
      return;
    }
    const from = Math.min(...hit);
    const to = Math.max(...hit);
    const rect = range.getBoundingClientRect();
    const words = sel.toString().match(new RegExp(WORD_RE.source, "g")) ?? [];
    let codes: string[] = [];
    // The Strong's tagging is of the KJV's words; another translation's words would find the wrong ones.
    if (from === to && words.length <= 12 && translation === "kjv") {
      const tags = await fetchTaggedChapter(book, chapter);
      const tokens = tags?.[String(from)] ?? [];
      codes = [...new Set(words.map((w) => codeFor(tokens, w, 0)).filter((c): c is string => !!c && /^[GH]\d+$/.test(c)))];
    }
    // One word selected: keep it, so Connections is headed by that word, not the Greek or Hebrew word's usual gloss.
    setSelTip({ x: rect.left + rect.width / 2, y: rect.top, from, to, codes, text: words.length === 1 ? words[0] : undefined });
  }

  function openConnections(from: number, to: number, codes: string[] = [], text?: string) {
    setSpan({ from, to, codes });
    // A single word selected is studied as that word, the same as a double-click.
    focusOn(text && codes.length === 1 ? { from, to, word: codes[0], text } : { from, to, codes });
    setVerse(from);
    setPanel("connections");
    setSelTip(null);
    window.getSelection()?.removeAllRanges();
    showStudy();
  }

  /**
   * Study the double-clicked word: find the Hebrew or Greek behind that very occurrence of it. The
   * word is found from the pointer, so a double-click never selects text (selection is for notes).
   */
  async function openWord(n: number, el: HTMLElement, x: number, y: number) {
    const doc = document as Document & {
      caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
    };
    const pos = doc.caretPositionFromPoint?.(x, y);
    const range = pos ? null : document.caretRangeFromPoint?.(x, y);
    const node = pos?.offsetNode ?? range?.startContainer ?? null;
    const offset = pos?.offset ?? range?.startOffset ?? 0;
    const hit = wordInVerse(el, node, offset);
    if (!hit) return;
    setWord({ text: hit.word, verse: n });
    setVerse(n);
    setSpan(null);
    // In the Connections tab, a double-clicked word shows where else it occurs; elsewhere it opens the word study.
    setPanel((p) => (p === "connections" ? "connections" : "word"));
    showStudy();
    const tags = translation === "kjv" ? await fetchTaggedChapter(book, chapter) : null;
    const tokens = tags?.[String(n)];
    const code = tokens ? codeFor(tokens, hit.word, hit.occurrence) : undefined;
    setWord({ text: hit.word, verse: n, code });
    if (code && /^[GH]\d+$/.test(code)) focusOn({ from: n, to: n, word: code, text: hit.word });
  }

  if (error) {
    return (
      <div className="bible-page">
        <div className="bible-main">
          <p className="empty bible-error">{error}</p>
          {translation !== "kjv" ? (
            <button type="button" className="btn-primary" onClick={() => setTranslation("kjv")}>
              Switch back to the King James Version
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  const where = word?.where ?? bookName + " " + chapter + ":" + (word?.verse ?? verse);
  const study =
    panel === "word" ? (
      <WordPanel word={word?.text ?? null} code={word?.code} where={where} onClose={isSheet ? () => setSheetOpen(false) : undefined} />
    ) : panel === "connections" ? (
      <ConnectionsPanel
        book={book}
        chapter={chapter}
        verse={verse}
        focus={cxFocus}
        onStudyWord={(code, text, at) => {
          setWord({ text, code, verse, where: at });
          setPanel("word");
        }}
        onClose={isSheet ? () => setSheetOpen(false) : undefined}
      />
    ) : (
      <Commentary
        book={book}
        bookName={bookName}
        chapter={chapter}
        verse={verse}
        counts={counts ?? null}
        onClose={isSheet ? () => setSheetOpen(false) : undefined}
        onPickVerse={(n) => {
          setVerse(n);
          document.getElementById("v-" + n)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }}
      />
    );
  const tabs = (
    <div className="side-tabs" role="tablist" aria-label="Study">
      <button type="button" role="tab" aria-selected={panel === "commentary"} onClick={() => setPanel("commentary")}>
        Commentary
      </button>
      <button type="button" role="tab" aria-selected={panel === "word"} onClick={() => setPanel("word")}>
        Word{word ? <span>{word.text}</span> : null}
      </button>
      <button type="button" role="tab" aria-selected={panel === "connections"} onClick={() => setPanel("connections")}>
        Connections
        {span && span.from !== span.to ? <span>{span.from + "–" + span.to}</span> : null}
      </button>
    </div>
  );
  const columns =
    view === "text"
      ? "minmax(0, 1fr) 14px 0px"
      : view === "study"
        ? "0px 14px minmax(0, 1fr)"
        : `minmax(0, ${split}fr) 14px minmax(0, ${100 - split}fr)`;

  return (
    <div className={"bible-page is-" + view}>
      <div className="bible-layout" ref={layoutRef} style={isSheet ? undefined : { gridTemplateColumns: columns }}>
        <div className="bible-main" hidden={!isSheet && view === "study"}>
          <header className="bible-head">
            <button
              type="button"
              className="bible-step"
              disabled={!prev}
              aria-label={prev ? "Previous chapter: " + label(prev) : "Previous chapter"}
              onClick={() => prev && go(prev)}
            >
              ‹
            </button>
            <div className="bible-title-wrap">
              <h1 className="bible-title">
                <button
                  type="button"
                  className="bible-title-btn"
                  aria-expanded={picker}
                  aria-haspopup="dialog"
                  onClick={() => setPicker(!picker)}
                >
                  {bookName} {chapter}
                  <span className="bible-title-chev" aria-hidden="true" />
                </button>
              </h1>
              {picker && manifest ? (
                <BookPicker
                  manifest={manifest}
                  book={book}
                  chapter={chapter}
                  onClose={() => setPicker(false)}
                  onPick={(b, c) => go({ book: b, chapter: c })}
                />
              ) : null}
              <div className="bible-meta">
                <label className="ghost-select">
                  <span className="sr-only">Translation</span>
                  <select value={translation} onChange={(e) => setTranslation(e.target.value)} aria-label="Translation">
                    {BIBLE_TRANSLATIONS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.abbreviation} · {t.name}
                      </option>
                    ))}
                  </select>
                  <span aria-hidden="true">{activeTranslation?.abbreviation ?? translation.toUpperCase()}</span>
                </label>
                {payload?.sections && payload.sections.length > 0 ? (
                  <label className="ghost-select">
                    <span className="sr-only">Section</span>
                    <select value={section} onChange={(e) => go({ section: e.target.value })} aria-label="Section">
                      <option value="">Whole chapter</option>
                      {payload.sections.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <span aria-hidden="true">{payload.sections.find((s) => s.id === section)?.label ?? "Whole chapter"}</span>
                  </label>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              className="bible-step"
              disabled={!next}
              aria-label={next ? "Next chapter: " + label(next) : "Next chapter"}
              onClick={() => next && go(next)}
            >
              ›
            </button>
          </header>

          <article className="bible-text">
            {!payload ? (
              <p className="empty">Loading…</p>
            ) : (
              <>
              {activeTranslation?.notice ? <p className="bible-translation-note">{activeTranslation.notice}</p> : null}
              <div
                className={"bible-verses" + (picking ? " is-picking" : "")}
                onKeyUp={(e) => e.shiftKey && onTextMouseUp()}
              >
                {selTip ? (
                  <div className="cx-seltip" role="toolbar" aria-label="Mark these verses" style={{ left: selTip.x, top: selTip.y }} onMouseDown={(e) => e.preventDefault()}>
                    {HIGHLIGHT_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={"hl-swatch hl-" + color}
                        aria-label={"Highlight " + color}
                        title={"Highlight " + color}
                        onClick={() => {
                          setHighlight(book, chapter, selTip.from, selTip.to, color);
                          setSelTip(null);
                          window.getSelection()?.removeAllRanges();
                        }}
                      />
                    ))}
                    {Array.from({ length: selTip.to - selTip.from + 1 }, (_, i) => selTip.from + i).some((v) => highlights[verseKey(book, chapter, v)]) ? (
                      <button
                        type="button"
                        className="hl-clear"
                        aria-label="Remove highlight"
                        title="Remove highlight"
                        onClick={() => {
                          setHighlight(book, chapter, selTip.from, selTip.to, null);
                          setSelTip(null);
                        }}
                      >
                        ×
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        setNoteOpen(selTip.to);
                        setSelTip(null);
                        window.getSelection()?.removeAllRanges();
                      }}
                    >
                      Note
                    </button>
                    <button type="button" onClick={() => openConnections(selTip.from, selTip.to, selTip.codes, selTip.text)}>
                      Connections
                      {selTip.codes.length > 1 ? " · " + selTip.codes.length + " words" : ""}
                      {selTip.from !== selTip.to ? " · " + selTip.from + "–" + selTip.to : ""}
                    </button>
                  </div>
                ) : null}
                {payload.verses.map((text, i) => {
                  const n = i + 1;
                  const inSection =
                    !section || payload.sections?.some((s) => s.id === section && n >= s.verses.start && n <= s.verses.end);
                  const c = counts?.[n] ?? 0;
                  const hl = highlights[verseKey(book, chapter, n)];
                  const noteId = verseNoteId(book, chapter, n);
                  const hasNote = !noteIsEmpty(loadNoteHtml(noteId));
                  return (
                    <Fragment key={n}>
                    <p
                      className={
                        "bible-verse" +
                        (section && !inSection ? " dim" : "") +
                        (verse === n ? " is-active" : "") +
                        (span && panel === "connections" && n >= span.from && n <= span.to && span.to > span.from ? " in-span" : "") +
                        (picking && n >= picking.from && n <= picking.to ? " is-picked" : "") +
                        (c ? " has-notes" : "") +
                        (hl ? " hl-" + hl : "")
                      }
                      id={"v-" + n}
                      tabIndex={0}
                      aria-label={c ? "Verse " + n + ", " + c + " passages from the Fathers" : undefined}
                      onClick={(e) => {
                        if (e.detail > 1) return;
                        // The end of a drag that selected words is not a click on the verse.
                        if (window.getSelection()?.toString().trim()) return;
                        pickVerse(n);
                      }}
                      onMouseDown={(e) => {
                        if (e.detail === 2) {
                          e.preventDefault();
                          openWord(n, e.currentTarget, e.clientX, e.clientY);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          pickVerse(n);
                        }
                      }}
                    >
                      <button
                        type="button"
                        className="verse-pen"
                        aria-label={"Highlight or add a note to verse " + n}
                        title="Highlight or note"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          const r = e.currentTarget.getBoundingClientRect();
                          setSelTip({ x: Math.max(160, r.right - 130), y: r.top, from: n, to: n, codes: [] });
                        }}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M14.5 5.5 18.5 9.5" />
                          <path d="M4 20l1.4-4.6L16.2 4.6a2 2 0 0 1 2.8 0l.4.4a2 2 0 0 1 0 2.8L8.6 18.6 4 20z" />
                        </svg>
                      </button>
                      <sup className="vnum">{n}</sup>{" "}
                      {text ? (
                        text
                      ) : (
                        <span className="verse-missing" title={missingVerseReason(translation, book, chapter, n)}>
                          —<span className="sr-only"> {missingVerseReason(translation, book, chapter, n)}</span>
                        </span>
                      )}
                      {translation === "esv" && n === payload.verses.length ? <span className="esv-mark"> (ESV)</span> : null}
                      {payload.notes?.[n] ? <KjvNote note={payload.notes[n]} /> : null}
                      {c ? (
                        <span className="verse-notes" aria-hidden="true">
                          {c}
                        </span>
                      ) : null}
                    </p>
                    {hasNote || noteOpen === n ? (
                      <div className="verse-margin-note">
                        <NotesBar
                          workId={noteId}
                          autoEdit={noteOpen === n && !hasNote}
                          onSave={() => {
                            setNoteOpen(null);
                            setNoteTick((t) => t + 1);
                          }}
                        />
                      </div>
                    ) : null}
                    </Fragment>
                  );
                })}
              </div>
              {activeTranslation ? (
                <p className="bible-credit">
                  {/* API.Bible sends the publisher's current line with the text; ours is the fallback. */}
                  {remote?.copyright || activeTranslation.credit}
                </p>
              ) : null}
              </>
            )}
            <nav className="bible-pager" aria-label="Chapters">
              {prev ? (
                <button type="button" onClick={() => go(prev)}>
                  ‹ {label(prev)}
                </button>
              ) : (
                <span />
              )}
              {next ? (
                <button type="button" onClick={() => go(next)}>
                  {label(next)} ›
                </button>
              ) : null}
            </nav>
          </article>
        </div>

        {isSheet ? (
          sheetOpen ? (
            <div className="cm-sheet" role="dialog" aria-modal="true" aria-label="Study">
              <button
                type="button"
                className="cm-sheet-backdrop"
                tabIndex={-1}
                aria-label="Close"
                onClick={() => setSheetOpen(false)}
              />
              <div className="cm-sheet-panel">
                {tabs}
                {study}
              </div>
            </div>
          ) : null
        ) : (
          <>
            <div
              className="bible-divider"
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize the text and the study panel"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={view === "text" ? 100 : view === "study" ? 0 : Math.round(split)}
              tabIndex={0}
              title="Drag to resize · double-click to even out"
              onPointerDown={onDividerDown}
              onDoubleClick={(e) => {
                if ((e.target as HTMLElement).closest("button")) return;
                setView("both");
                setSplit(50);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft") view === "text" ? setView("both") : setSplit((v) => Math.max(SPLIT_MIN, v - 2));
                if (e.key === "ArrowRight") view === "study" ? setView("both") : setSplit((v) => Math.min(SPLIT_MAX, v + 2));
              }}
            >
              <div className="bible-divider-tools">
                {view !== "study" ? (
                  <button
                    type="button"
                    aria-label={view === "text" ? "Show the study panel" : "Hide the text"}
                    title={view === "text" ? "Show the study panel" : "Hide the text"}
                    onClick={() => setView(view === "text" ? "both" : "study")}
                  >
                    ‹
                  </button>
                ) : null}
                <span className="bible-divider-grip" aria-hidden="true" />
                {view !== "text" ? (
                  <button
                    type="button"
                    aria-label={view === "study" ? "Show the text" : "Hide the study panel"}
                    title={view === "study" ? "Show the text" : "Hide the study panel"}
                    onClick={() => setView(view === "study" ? "both" : "text")}
                  >
                    ›
                  </button>
                ) : null}
              </div>
            </div>
            <aside className="bible-aside" hidden={view === "text"}>
              {tabs}
              {study}
            </aside>
          </>
        )}
      </div>
    </div>
  );
}
