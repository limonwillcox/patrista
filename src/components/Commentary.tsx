import { useEffect, useMemo, useState } from "react";
import { fetchVerseLinks, type Link as CommentaryLink } from "../api/links";
import { fetchChapterCitations } from "../api/scripture";
import { useApp } from "../context/AppContext";
import { commentaryPassages, mergeCites, mergeSources, Thread, type CitingPassage } from "./FathersThread";

function titleCase(id: string): string {
  return id.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * What the Fathers wrote on one verse, as one thread from two sources: the commentary collections (the
 * Gospels so far) and every work in the library that cites the verse (the whole Bible). Shown beside the
 * Bible text, open from the start.
 */
export function Commentary({
  book,
  bookName,
  chapter,
  verse,
  counts,
  onPickVerse,
  onClose
}: {
  book: string;
  bookName: string;
  chapter: number;
  verse: number;
  counts: Record<number, number> | null;
  onPickVerse: (n: number) => void;
  /** Phones: close the sheet. */
  onClose?: () => void;
}) {
  const { catalog } = useApp();
  /** Undefined while loading. */
  const [links, setLinks] = useState<CommentaryLink[] | undefined>(undefined);
  const [cites, setCites] = useState<CitingPassage[] | undefined>(undefined);

  useEffect(() => {
    let live = true;
    setLinks(undefined);
    setCites(undefined);
    fetchVerseLinks(book, chapter, verse)
      .then((d) => d.tree.flatMap((c) => c.fathers.flatMap((f) => f.works.flatMap((w) => w.links))))
      .catch(() => [] as CommentaryLink[])
      .then((l) => live && setLinks(l.filter((x) => x.status !== "rejected")));
    fetchChapterCitations(book, chapter).then((c) => live && setCites(mergeCites([[verse, c?.[chapter + ":" + verse] ?? []]])));
    return () => {
      live = false;
    };
  }, [book, chapter, verse]);

  const names = useMemo(() => new Map((catalog?.authors ?? []).map((a) => [a.id, a.name])), [catalog]);
  const byWork = useMemo(() => new Map((catalog?.works ?? []).map((w) => [w.id, w.author])), [catalog]);
  const loading = links === undefined || cites === undefined;
  const passages = useMemo(() => {
    if (!links || !cites) return [];
    const comments = commentaryPassages(links, verse, (id) => names.get(id) ?? titleCase(id), (w) => byWork.has(w));
    const authorOf = (p: CitingPassage) => p.author || (p.work && byWork.get(p.work)) || p.url.match(/^\/fathers\/([^/]+)\//)?.[1] || "";
    return mergeSources(cites, comments, authorOf);
  }, [links, cites, verse, names, byWork]);
  const fathers = new Set(passages.map((p) => p.father)).size;

  // The nearest verses that do have commentary, for an empty verse.
  const nearby = useMemo(() => {
    if (!counts) return [];
    return Object.keys(counts)
      .map(Number)
      .filter((n) => n !== verse && counts[n] > 0)
      .sort((a, b) => Math.abs(a - verse) - Math.abs(b - verse))
      .slice(0, 3)
      .sort((a, b) => a - b);
  }, [counts, verse]);

  return (
    <section className="cm" aria-labelledby="cm-title">
      <header className="cm-head">
        <div>
          <p className="cm-kicker">The Fathers on</p>
          <h2 id="cm-title" className="cm-title">
            {bookName} {chapter}:{verse}
          </h2>
          {!loading && passages.length ? (
            <p className="cm-sum">
              {passages.length} {passages.length === 1 ? "passage" : "passages"} · {fathers} {fathers === 1 ? "Father" : "Fathers"}
            </p>
          ) : null}
        </div>
        {onClose ? (
          <button type="button" className="icon-btn cm-close" aria-label="Close commentary" onClick={onClose}>
            ×
          </button>
        ) : null}
      </header>

      {loading ? (
        <div className="cm-loading" aria-busy="true">
          <span />
          <span />
          <span />
        </div>
      ) : !passages.length ? (
        <div className="cm-empty">
          <p>No Father in the library cites this verse.</p>
          {nearby.length ? (
            <p className="cm-goto">
              Try{" "}
              {nearby.map((n) => (
                <button key={n} type="button" onClick={() => onPickVerse(n)}>
                  verse {n}
                </button>
              ))}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="cm-list cm-thread">
          <Thread passages={passages} showVerses={false} />
        </div>
      )}
    </section>
  );
}
