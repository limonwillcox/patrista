import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchChapter, fetchWork } from "../api/client";
import type { Footnote, Passage, WorkOutline } from "../../server/types";
import { formatSelection, parseSelection, type PrintUnit } from "../lib/printRange";
import { readPath, resolveWorkId } from "../lib/workSlugs";
import { attributionText, citationAuthor, hasAttribution } from "../../server/workMeta";
import "../styles/print.css";

type Paper = "letter" | "a4";

/** Full names of the collections most works come from. */
const SERIES_NAMES: Record<string, string> = {
  ANF: "the Ante-Nicene Fathers",
  NPNF1: "the Nicene and Post-Nicene Fathers, First Series",
  NPNF2: "the Nicene and Post-Nicene Fathers, Second Series"
};
/** Series named after their translator: the fallback when the work carries no translator of its own. */
const SERIES_TRANSLATORS: Record<string, string> = { Pusey: "E. B. Pusey", Whiston: "William Whiston" };

/** Average words per chapter above which each chapter starts on a new page. */
const LONG_CHAPTER_WORDS = 1500;

/**
 * Print view: a settings panel and a paper preview on screen; on paper, a title page and book-set chapters.
 * The browser's print dialog saves the PDF.
 */
export function PrintPage() {
  const [params, setParams] = useSearchParams();
  const workId = resolveWorkId(params.get("work") || "");
  const paper: Paper = params.get("paper") === "a4" ? "a4" : "letter";
  const numbers = params.get("num") !== "0";
  const withNotes = params.get("notes") === "1";
  const [outline, setOutline] = useState<WorkOutline | null>(null);
  const [error, setError] = useState("");
  const [texts, setTexts] = useState<Map<number, Passage>>(new Map());

  useEffect(() => {
    document.body.classList.add("print-route");
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex";
    document.head.appendChild(meta);
    return () => {
      document.body.classList.remove("print-route");
      meta.remove();
    };
  }, []);

  useEffect(() => {
    setOutline(null);
    setTexts(new Map());
    if (!workId) return;
    fetchWork(workId).then(setOutline, () => setError("Work not found."));
  }, [workId]);

  const units: PrintUnit[] = useMemo(
    () => (outline?.chapters ?? []).map((c) => ({ chapter: c.chapter, subs: c.subs?.length ?? 0 })),
    [outline]
  );
  const sel = useMemo(() => parseSelection(params.get("ch"), units), [params, units]);
  const allKeys = useMemo(() => parseSelection(null, units), [units]);
  /** Books (top-level units) with anything selected. */
  const selected = useMemo(
    () => units.filter((u) => (u.subs ? [...sel].some((k) => k.startsWith(u.chapter + ".")) : sel.has(String(u.chapter)))).map((u) => u.chapter),
    [sel, units]
  );

  useEffect(() => {
    if (!outline) return;
    for (const n of selected) {
      if (texts.has(n)) continue;
      fetchChapter(outline.work.id, n).then((p) => setTexts((m) => new Map(m).set(n, p)));
    }
  }, [outline, selected, texts]);

  useEffect(() => {
    if (!outline) return;
    document.title = outline.work.title + " (PDF) · Patrista";
  }, [outline]);

  function update(next: { sel?: Set<string>; paper?: Paper; numbers?: boolean; notes?: boolean }) {
    const p = new URLSearchParams(params);
    if (next.sel) {
      if (next.sel.size === allKeys.size && [...allKeys].every((k) => next.sel!.has(k))) p.delete("ch");
      else p.set("ch", formatSelection(next.sel, units) || "none");
    }
    if (next.paper) {
      if (next.paper === "letter") p.delete("paper");
      else p.set("paper", next.paper);
    }
    if (next.numbers !== undefined) {
      if (next.numbers) p.delete("num");
      else p.set("num", "0");
    }
    if (next.notes !== undefined) {
      if (next.notes) p.set("notes", "1");
      else p.delete("notes");
    }
    setParams(p, { replace: true });
  }

  function keysOf(book: number): string[] {
    const u = units.find((x) => x.chapter === book);
    if (!u) return [];
    return u.subs ? Array.from({ length: u.subs }, (_, i) => book + "." + (i + 1)) : [String(book)];
  }

  function toggleKeys(keys: string[]) {
    const next = new Set(sel);
    const allOn = keys.every((k) => next.has(k));
    keys.forEach((k) => (allOn ? next.delete(k) : next.add(k)));
    update({ sel: next });
  }

  if (!workId) return <div className="pv-state">Choose a work to print.</div>;
  if (error) return <div className="pv-state">{error}</div>;
  if (!outline) return <div className="pv-state">Loading…</div>;

  const work = outline.work;
  const translator = work.translator || findTranslator(texts.get(selected[0] ?? 1)) || SERIES_TRANSLATORS[work.series] || "";
  const series = work.edition || SERIES_NAMES[work.series] || "";
  // A work the shelf Father did not (certainly) write is printed under its real author, with the note.
  const attributed = hasAttribution(work);
  const byline = attributed ? citationAuthor(work, outline.author) : outline.author.name;
  const attribution = attributed ? attributionText(work, outline.author) : "";
  const ready = selected.every((n) => texts.has(n));
  const noteCount = selected.reduce((sum, n) => sum + (texts.get(n)?.footnotes?.length ?? 0), 0);
  const pagePerChapter = units.some((u) => u.subs > 0) || work.wordCount / Math.max(1, work.chapters) >= LONG_CHAPTER_WORDS;
  const whole = sel.size === allKeys.size;
  const unitWord = outline.chapters.length === 1 ? "chapter" : "chapters";

  return (
    <div className={"pv pv--" + paper}>
      <style>{pageCss(paper, work.title, byline, numbers)}</style>

      <aside className="pv-panel" aria-label="PDF settings">
        <Link to={readPath(work.id)} className="pv-back">
          ← Back to reading
        </Link>
        <p className="pv-kicker">Download PDF</p>
        <h1 className="pv-title">{work.title}</h1>
        <p className="pv-author">{attributed ? attribution : outline.author.name}</p>

        {outline.chapters.length > 1 ? (
          <section className="pv-group">
            <div className="pv-group-head">
              <h2>Contents</h2>
              <span className="pv-count">
                {whole ? "All " + outline.chapters.length + " " + unitWord : selected.length + " of " + outline.chapters.length}
              </span>
            </div>
            <div className="pv-quick">
              <button type="button" onClick={() => update({ sel: new Set(allKeys) })} disabled={whole}>
                Select all
              </button>
              <button type="button" onClick={() => update({ sel: new Set() })} disabled={!sel.size}>
                Clear
              </button>
            </div>
            <ul className="pv-chapters">
              {outline.chapters.map((c) => {
                const keys = keysOf(c.chapter);
                const on = keys.filter((k) => sel.has(k)).length;
                return (
                  <li key={c.chapter}>
                    <label className="pv-check">
                      <input
                        type="checkbox"
                        checked={on === keys.length && on > 0}
                        ref={(el) => {
                          if (el) el.indeterminate = on > 0 && on < keys.length;
                        }}
                        onChange={() => toggleKeys(keys)}
                      />
                      <span>{c.heading}</span>
                    </label>
                    {c.subs?.length ? (
                      <ul className="pv-subs">
                        {c.subs.map((sub) => (
                          <li key={sub.n}>
                            <label className="pv-check">
                              <input
                                type="checkbox"
                                checked={sel.has(c.chapter + "." + sub.n)}
                                onChange={() => toggleKeys([c.chapter + "." + sub.n])}
                              />
                              <span>
                                {sub.label}
                                {sub.title ? " — " + sub.title : ""}
                              </span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <section className="pv-group">
          <div className="pv-group-head">
            <h2>Paper</h2>
          </div>
          <div className="pv-seg" role="group" aria-label="Paper size">
            <button type="button" aria-pressed={paper === "letter"} onClick={() => update({ paper: "letter" })}>
              US Letter
            </button>
            <button type="button" aria-pressed={paper === "a4"} onClick={() => update({ paper: "a4" })}>
              A4
            </button>
          </div>
        </section>

        <section className="pv-group">
          <div className="pv-group-head">
            <h2>Include</h2>
          </div>
          <label className="pv-check">
            <input type="checkbox" checked={numbers} onChange={() => update({ numbers: !numbers })} />
            <span>Paragraph numbers</span>
          </label>
          <label className="pv-check">
            <input type="checkbox" checked={withNotes} onChange={() => update({ notes: !withNotes })} disabled={ready && !noteCount} />
            <span>
              Footnotes
              {ready ? (
                <span className="pv-dim">
                  {" · "}
                  {noteCount ? noteCount + (noteCount === 1 ? " note" : " notes") + ", after each chapter" : "none in this selection"}
                </span>
              ) : null}
            </span>
          </label>
        </section>

        <button
          type="button"
          className="btn-burgundy pv-go"
          disabled={!selected.length || !ready}
          onClick={() => void document.fonts.ready.then(() => window.print())}
        >
          {!selected.length ? "Choose something to print" : ready ? "Save as PDF" : "Loading text…"}
        </button>
        <p className="pv-hint">This opens your browser's print window. Choose “Save as PDF” as the destination.</p>
      </aside>

      <div className="pv-preview" aria-label="Preview">
        <article className="pv-doc" lang="en">
          <header className="pv-sheet pv-cover">
            <img className="pv-cover-logo" src="/assets/patrista-logo-102.webp" alt="" width={44} height={44} />
            <div className="pv-cover-main">
              {byline ? <p className="pv-cover-author">{byline}</p> : null}
              {attributed ? (
                <p className="pv-cover-dates">{attribution}</p>
              ) : outline.author.dates ? (
                <p className="pv-cover-dates">{outline.author.dates}</p>
              ) : null}
              <h1 className="pv-cover-title">{work.title}</h1>
              <Ornament />
              {translator ? <p className="pv-cover-tr">Translated by {translator}</p> : null}
              {series ? <p className="pv-cover-series">From {series}</p> : null}
              {!whole && selected.length ? <p className="pv-cover-part">{partLabel(outline, selected)}</p> : null}
            </div>
            <footer className="pv-cover-foot">
              <p>
                <strong>Patrista</strong> · patrista.com
              </p>
              <p>This translation is in the public domain. You may copy, print and share it freely.</p>
            </footer>
          </header>

          <div className={"pv-sheet pv-body" + (numbers ? " has-nums" : "")}>
            {selected.map((n, idx) => {
              const passage = texts.get(n);
              return (
                <section
                  className={"pv-chapter" + (pagePerChapter && idx > 0 ? " pv-chapter--page" : "")}
                  key={n}
                >
                  <h2 className="pv-chapter-head">
                    <span className="pv-chapter-rule" aria-hidden="true" />
                    {outline.chapters[n - 1]?.heading}
                  </h2>
                  {passage ? (
                    <ChapterText
                      passage={passage}
                      keepAll={keysOf(n).every((k) => sel.has(k))}
                      isKept={(sub) => sel.has(n + "." + sub)}
                      numbers={numbers}
                      notes={withNotes}
                    />
                  ) : (
                    <p className="pv-loading">Loading…</p>
                  )}
                </section>
              );
            })}
            {selected.length && ready ? (
              <footer className="pv-colophon">
                <Ornament />
                <p>
                  {work.title}
                  {byline ? " · " + byline : ""}
                </p>
                <p>Printed from Patrista, the library of the Church Fathers · patrista.com</p>
              </footer>
            ) : null}
          </div>
        </article>
      </div>
    </div>
  );
}

/** One chapter: sub-headings, paragraphs with optional numbers, and its footnotes at the end. */
function ChapterText({
  passage,
  keepAll,
  isKept,
  numbers,
  notes
}: {
  passage: Passage;
  keepAll: boolean;
  isKept: (sub: number) => boolean;
  numbers: boolean;
  notes: boolean;
}) {
  const paras = Object.values(passage.versions)[0] ?? [];
  const subs = passage.sections ?? [];
  const subAt = new Map(subs.map((x) => [x.para, x]));
  const notesAt = new Map<number, Footnote[]>();
  for (const note of passage.footnotes ?? []) notesAt.set(note.para, [...(notesAt.get(note.para) ?? []), note]);

  const out: ReactNode[] = [];
  const printed: { num: number; notes: Footnote[] }[] = [];
  let num = 0;
  let first = true;
  let owner = 0;
  paras.forEach((raw, i) => {
    const sub = subAt.get(i);
    if (sub) owner = sub.n;
    // Partly selected book: keep only paragraphs inside the chosen chapters.
    const keep = keepAll || !subs.length || (owner > 0 && isKept(owner));
    const heading = sub && !sub.inline && !sub.hidden;
    if (!heading) num += 1;
    if (!keep) return;
    if (sub && !sub.hidden) {
      out.push(
        <h3 className="pv-sub" key={i + "h"}>
          {sub.label}
          {sub.title ? " — " + sub.title : ""}
        </h3>
      );
      first = true;
    }
    if (heading) return;
    const text = raw.replace(/\s*\[\d+\]/g, "");
    // A drop cap only on a real paragraph, not on a stray title line.
    const drop = first && text.length > 120 && /^[A-Za-z]/.test(text);
    out.push(
      <p className={"pv-para" + (first ? " pv-para--first" : "") + (drop ? " pv-drop" : "")} key={i}>
        {numbers ? <span className="pv-num">{num}</span> : null}
        {text}
      </p>
    );
    first = false;
    const here = notesAt.get(i);
    if (here) printed.push({ num, notes: here });
  });

  return (
    <>
      {out}
      {notes && printed.length ? (
        <aside className="pv-notes">
          <h4>Notes</h4>
          <ol>
            {/* One line per paragraph: most notes are a short reference, and a line each wastes paper. */}
            {printed.map(({ num: at, notes: list }) => (
              <li key={list[0].n}>
                <span className="pv-note-at">¶ {at}</span>
                <span>
                  {list.map((note, j) => (
                    <span className="pv-note" key={note.n}>
                      {j ? <span className="pv-note-sep" aria-hidden="true"> · </span> : null}
                      {note.text}
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ol>
        </aside>
      ) : null}
    </>
  );
}

function Ornament() {
  return (
    <svg className="pv-ornament" viewBox="0 0 120 12" aria-hidden="true">
      <path d="M2 6h44M74 6h44" />
      <path d="M60 1.5 64.5 6 60 10.5 55.5 6z" />
      <circle cx="50" cy="6" r="1.3" />
      <circle cx="70" cy="6" r="1.3" />
    </svg>
  );
}

/** "Book I – Book III" for a run, or the list of headings, for a partial printing. */
function partLabel(outline: WorkOutline, selected: number[]): string {
  const name = (n: number) => outline.chapters[n - 1]?.heading ?? String(n);
  const run = selected.every((n, i) => i === 0 || n === selected[i - 1] + 1);
  if (selected.length === 1) return name(selected[0]);
  if (run) return name(selected[0]) + " – " + name(selected[selected.length - 1]);
  if (selected.length <= 4) return selected.map(name).join(", ");
  return selected.length + " of " + outline.chapters.length + " parts";
}

/** With numbers on, the left margin gives up the 8mm the number gutter takes, so the text keeps even margins. */
function pageCss(paper: Paper, title: string, author: string, numbers: boolean): string {
  const head = 'font: 600 7.5pt "Source Sans 3", "Segoe UI", sans-serif; letter-spacing: 0.12em; text-transform: uppercase; color: #8a8174;';
  return (
    "@page { size: " + (paper === "a4" ? "A4" : "letter") + "; margin: 20mm 22mm 20mm " + (numbers ? "14mm" : "22mm") + ";" +
    " @top-left { content: " + JSON.stringify(author) + "; " + head + " vertical-align: bottom; padding-bottom: 4mm; }" +
    " @top-right { content: " + JSON.stringify(title) + "; " + head + " vertical-align: bottom; padding-bottom: 4mm; }" +
    ' @bottom-center { content: counter(page); font: 9pt "Source Serif 4", Georgia, serif; color: #8a8174; vertical-align: top; padding-top: 4mm; } }' +
    " @page :first { @top-left { content: none; } @top-right { content: none; } @bottom-center { content: none; } }"
  );
}

function findTranslator(passage: Passage | undefined): string {
  if (!passage) return "";
  for (const p of Object.values(passage.versions)[0] ?? []) {
    const m = p.match(/Translated by\s+(?:the\s+)?([^\]\n]{3,80}?)[\].]?\s*$/i);
    if (m) return m[1].replace(/\.$/, "");
  }
  return "";
}

