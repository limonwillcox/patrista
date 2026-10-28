import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchChapter, fetchWork } from "../api/client";
import type { Passage, WorkOutline } from "../../server/types";
import { formatChapterRange, parseChapterRange } from "../lib/printRange";
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

  const max = outline?.chapters.length ?? 0;
  const selected = useMemo(() => parseChapterRange(params.get("ch"), max), [params, max]);

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

  function update(next: { ch?: number[]; paper?: Paper }) {
    const p = new URLSearchParams(params);
    if (next.ch) {
      if (next.ch.length === max) p.delete("ch");
      else p.set("ch", formatChapterRange(next.ch) || "none");
    }
    if (next.paper) {
      if (next.paper === "letter") p.delete("paper");
      else p.set("paper", next.paper);
    }
    setParams(p, { replace: true });
  }

  function toggle(n: number) {
    update({ ch: selected.includes(n) ? selected.filter((x) => x !== n) : [...selected, n] });
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
          <button type="button" onClick={() => update({ ch: outline.chapters.map((c) => c.chapter) })}>Select all</button>
          <button type="button" onClick={() => update({ ch: [] })}>None</button>
          <span className="print-paper" role="group" aria-label="Paper size">
            <button type="button" aria-pressed={paper === "letter"} onClick={() => update({ paper: "letter" })}>Letter</button>
            <button type="button" aria-pressed={paper === "a4"} onClick={() => update({ paper: "a4" })}>A4</button>
          </span>
          <button type="button" className="print-go" disabled={!selected.length || !ready} onClick={() => void document.fonts.ready.then(() => window.print())}>
            {ready ? "Print / Save as PDF" : "Loading…"}
          </button>
        </div>
        <ul className="print-chapters">
          {outline.chapters.map((c) => (
            <li key={c.chapter}>
              <label>
                <input type="checkbox" checked={selected.includes(c.chapter)} onChange={() => toggle(c.chapter)} />
                {c.heading}
              </label>
            </li>
          ))}
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
          return (
            <section className="print-chapter" key={n}>
              <h2>{meta?.heading}</h2>
              {paras.map((p, i) => (
                <p className="para" key={i}>{p.replace(/\s*\[\d+\]/g, "")}</p>
              ))}
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
