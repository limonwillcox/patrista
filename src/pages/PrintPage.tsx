import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchChapter, fetchWork } from "../api/client";
import type { Passage, WorkOutline } from "../../server/types";
import { formatSelection, parseSelection, type PrintUnit } from "../lib/printRange";
import { readPath, resolveWorkId } from "../lib/workSlugs";

type Paper = "letter" | "a4";

/** Print view: pick chapters and paper, then the browser's print dialog saves the PDF. */
export function PrintPage() {
  const [params, setParams] = useSearchParams();
  const workId = resolveWorkId(params.get("work") || "");
  const paper: Paper = params.get("paper") === "a4" ? "a4" : "letter";
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
    document.title = outline.work.title + " (print) · Patrista";
  }, [outline]);

  function update(next: { sel?: Set<string>; paper?: Paper }) {
    const p = new URLSearchParams(params);
    if (next.sel) {
      const all = parseSelection(null, units);
      if (next.sel.size === all.size && [...all].every((k) => next.sel!.has(k))) p.delete("ch");
      else p.set("ch", formatSelection(next.sel, units) || "none");
    }
    if (next.paper) {
      if (next.paper === "letter") p.delete("paper");
      else p.set("paper", next.paper);
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

  if (!workId) return <div className="print-view"><p>Choose a work to print.</p></div>;
  if (error) return <div className="print-view"><p>{error}</p></div>;
  if (!outline) return <div className="print-view"><p>Loading…</p></div>;

  const translator = findTranslator(texts.get(selected[0] ?? 1));
  const ready = selected.every((n) => texts.has(n));

  return (
    <div className={"print-view print-view--" + paper}>
      <style>{pageCss(paper, outline.work.title)}</style>
      <div className="print-controls">
        <Link to={readPath(outline.work.id)} className="print-back">← Back to reading</Link>
        <div className="print-actions">
          <button type="button" onClick={() => update({ sel: parseSelection(null, units) })}>Select all</button>
          <button type="button" onClick={() => update({ sel: new Set() })}>None</button>
          <span className="print-paper" role="group" aria-label="Paper size">
            <button type="button" aria-pressed={paper === "letter"} onClick={() => update({ paper: "letter" })}>Letter</button>
            <button type="button" aria-pressed={paper === "a4"} onClick={() => update({ paper: "a4" })}>A4</button>
          </span>
          <button type="button" className="print-go" disabled={!selected.length || !ready} onClick={() => void document.fonts.ready.then(() => window.print())}>
            {ready ? "Print / Save as PDF" : "Loading…"}
          </button>
        </div>
        <ul className="print-chapters">
          {outline.chapters.map((c) => {
            const keys = keysOf(c.chapter);
            const on = keys.filter((k) => sel.has(k)).length;
            return (
              <li key={c.chapter} className={c.subs?.length ? "print-book" : undefined}>
                <label>
                  <input
                    type="checkbox"
                    checked={on === keys.length && on > 0}
                    ref={(el) => {
                      if (el) el.indeterminate = on > 0 && on < keys.length;
                    }}
                    onChange={() => toggleKeys(keys)}
                  />
                  {c.heading}
                </label>
                {c.subs?.length ? (
                  <ul className="print-subs">
                    {c.subs.map((sub) => (
                      <li key={sub.n}>
                        <label>
                          <input
                            type="checkbox"
                            checked={sel.has(c.chapter + "." + sub.n)}
                            onChange={() => toggleKeys([c.chapter + "." + sub.n])}
                          />
                          {sub.label}
                          {sub.title ? " — " + sub.title : ""}
                        </label>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>

      <article className="print-doc" data-title={outline.work.title}>
        <header className="print-title-page">
          <h1>{outline.work.title}</h1>
          <p className="print-author">{outline.author.name}</p>
          {translator ? <p className="print-translator">Translated by {translator}</p> : null}
          <p className="print-pd">
            This translation is in the public domain. Printed from Patrista, patrista.com
          </p>
        </header>
        {selected.map((n) => {
          const meta = outline.chapters[n - 1];
          const passage = texts.get(n);
          const paras = passage ? Object.values(passage.versions)[0] ?? [] : [];
          const subs = passage?.sections ?? [];
          const subAt = new Map(subs.map((x) => [x.para, x]));
          // Partly selected book: keep only paragraphs inside the chosen chapters.
          const keep = (i: number) => {
            if (!subs.length || keysOf(n).every((k) => sel.has(k))) return true;
            let owner = 0;
            for (const x of subs) if (x.para <= i) owner = x.n;
            return owner > 0 && sel.has(n + "." + owner);
          };
          return (
            <section className="print-chapter" key={n}>
              <h2>{meta?.heading}</h2>
              {paras.map((p, i) => {
                if (!keep(i)) return null;
                const sub = subAt.get(i);
                if (sub) return <h3 key={i}>{sub.label}{sub.title ? " — " + sub.title : ""}</h3>;
                return <p className="para" key={i}>{p.replace(/\s*\[\d+\]/g, "")}</p>;
              })}
            </section>
          );
        })}
      </article>
    </div>
  );
}

function pageCss(paper: Paper, title: string): string {
  const quoted = JSON.stringify(title);
  return (
    "@page { size: " + (paper === "a4" ? "A4" : "letter") + "; margin: 22mm 20mm 20mm;" +
    " @top-center { content: " + quoted + "; font: italic 9pt Georgia, serif; color: #666; }" +
    " @bottom-center { content: counter(page); font: 9pt Georgia, serif; color: #666; } }" +
    " @page :first { @top-center { content: none; } @bottom-center { content: none; } }"
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
