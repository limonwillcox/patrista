import { useEffect, useMemo, useState } from "react";
import { fetchVerseLinks, type Link as CommentaryLink } from "../api/links";
import { fetchChapterCitations } from "../api/scripture";
import { useApp } from "../context/AppContext";
import { commentaryPassages, mergeCites, mergeSources, Thread, type CitingPassage } from "./FathersThread";

function titleCase(id: string): string {
  return id.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * What the Fathers wrote on one verse, or a few verses of one chapter, as one thread from two sources: the
 * commentary collections (the Gospels so far) and every work in the library that cites the verse (the whole
 * Bible). Shown beside the Bible text, open from the start, and under each passage of a type's trail.
 */
export function Commentary({
  book,
  bookName,
  chapter,
  verse,
  toVerse,
  counts,
  onPickVerse,
  onClose,
  className
}: {
  book: string;
  bookName: string;
  chapter: number;
  verse: number;
  /** The last verse, for a few verses of the chapter (a trail's passage); the thread then marks each verse. */
  toVerse?: number;
  /** Extra classes, for a place other than the Bible's side panel. */
  className?: string;
  counts: Record<number, number> | null;
  onPickVerse: (n: number) => void;
  /** Phones: close the sheet. */
  onClose?: () => void;
}) {
  const { catalog } = useApp();
  const last = toVerse && toVerse > verse ? toVerse : verse;
  const verses = useMemo(() => Array.from({ length: last - verse + 1 }, (_, i) => verse + i), [verse, last]);
  /** Per verse, the commentary links on it. Undefined while loading. */
  const [links, setLinks] = useState<[number, CommentaryLink[]][] | undefined>(undefined);
  const [cites, setCites] = useState<CitingPassage[] | undefined>(undefined);

  useEffect(() => {
    let live = true;
    setLinks(undefined);
    setCites(undefined);
    // The links come a chapter at a time and are cached, so several verses of a chapter cost one load.
    Promise.all(
      verses.map((v) =>
        fetchVerseLinks(book, chapter, v)
          .then((d) => d.tree.flatMap((c) => c.fathers.flatMap((f) => f.works.flatMap((w) => w.links))))
          .catch(() => [] as CommentaryLink[])
          .then((l): [number, CommentaryLink[]] => [v, l.filter((x) => x.status !== "rejected")])
      )
    ).then((all) => live && setLinks(all));
    fetchChapterCitations(book, chapter).then((c) => live && setCites(mergeCites(verses.map((v) => [v, c?.[chapter + ":" + v] ?? []]))));
    return () => {
      live = false;
    };
  }, [book, chapter, verses]);

  const names = useMemo(() => new Map((catalog?.authors ?? []).map((a) => [a.id, a.name])), [catalog]);
  const byWork = useMemo(() => new Map((catalog?.works ?? []).map((w) => [w.id, w.author])), [catalog]);
  const loading = links === undefined || cites === undefined;
  const passages = useMemo(() => {
    if (!links || !cites) return [];
    const comments = links.flatMap(([v, l]) => commentaryPassages(l, v, (id) => names.get(id) ?? titleCase(id), (w) => byWork.has(w)));
    const authorOf = (p: CitingPassage) => p.author || (p.work && byWork.get(p.work)) || p.url.match(/^\/fathers\/([^/]+)\//)?.[1] || "";
    return mergeSources(cites, comments, authorOf);
  }, [links, cites, names, byWork]);
  const fathers = new Set(passages.map((p) => p.father)).size;

  // The nearest verses that do have commentary, for an empty verse.
  const nearby = useMemo(() => {
    if (!counts || verses.length > 1) return [];
    return Object.keys(counts)
      .map(Number)
      .filter((n) => n !== verse && counts[n] > 0)
      .sort((a, b) => Math.abs(a - verse) - Math.abs(b - verse))
      .slice(0, 3)
      .sort((a, b) => a - b);
  }, [counts, verse, verses.length]);

  return (
    <section className={"cm" + (className ? " " + className : "")} aria-labelledby="cm-title">
      <header className="cm-head">
        <div>
          <p className="cm-kicker">The Fathers on</p>
          <h2 id="cm-title" className="cm-title">
            {bookName} {chapter}:{verse}
            {last > verse ? "–" + last : ""}
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
          <p>{verses.length > 1 ? "No Father in the library cites these verses." : "No Father in the library cites this verse."}</p>
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
          <Thread passages={passages} showVerses={verses.length > 1} />
        </div>
      )}
    </section>
  );
}
