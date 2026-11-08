import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { FORM_NOTES, type ManuscriptForm } from "../../lib/manuscriptForm";
import { buildCodex, type CodexHandle } from "../../three/codex";
import { buildRoll, type RollHandle } from "../../three/roll";
import { createStage } from "../../three/stage";

/**
 * The work as the object it was in its own century, drawn with three.js and carrying its real text.
 * Loaded lazily: three.js is only fetched when a book is opened.
 */
export default function ManuscriptStage({
  title,
  author,
  paras,
  form,
  cover,
  holdCover = false,
  onReady
}: {
  title: string;
  author: string;
  paras: string[];
  form: ManuscriptForm;
  /** Leather colour of the book's cover, to match its spine on the shelf. */
  cover?: string;
  /** Keep the cover shut until this turns false: the book is still flying in from the shelf. */
  holdCover?: boolean;
  /** Called once the object is drawn, with the element that holds it (for the flight from the shelf). */
  onReady?: (el: HTMLElement) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const handle = useRef<RollHandle | CodexHandle | null>(null);
  const [page, setPage] = useState<{ n: number; total: number } | null>(null);
  const [ready, setReady] = useState(false);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const holdRef = useRef(holdCover);
  holdRef.current = holdCover;
  useEffect(() => {
    const h = handle.current;
    if (!holdCover && h && "openCover" in h) h.openCover();
  }, [holdCover, ready]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !paras.length) return;
    let live = true;
    const stage = createStage(host, { fov: 32 });
    setReady(false);
    const build =
      form === "roll"
        ? buildRoll(stage, { title, paras })
        : buildCodex(stage, {
            title,
            author,
            paras,
            surface: form === "papyrus-codex" ? "papyrus" : "parchment",
            cover,
            holdCover: holdRef.current,
            onSpread: (n, total) => live && setPage({ n, total })
          });
    // three.js's compileAsync keeps polling the materials it compiles and throws if they are disposed
    // meanwhile, so a stage closed mid-build is disposed only once the build has finished.
    let built = false;
    build
      .then(async (h) => {
        // The codex compiles its shaders first, so the cover opening never waits on one (CodexHandle.prewarm).
        if ("prewarm" in h) await h.prewarm().catch(() => {});
        if (!live) {
          h.dispose();
          return;
        }
        handle.current = h;
        setReady(true);
        if (hostRef.current) onReadyRef.current?.(hostRef.current);
      })
      .finally(() => {
        built = true;
        if (!live) stage.dispose();
      });
    return () => {
      live = false;
      handle.current?.dispose();
      handle.current = null;
      if (built) stage.dispose();
    };
  }, [title, author, paras, form, cover]);

  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    const h = handle.current;
    if (!h || (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "PageDown" && e.key !== "PageUp")) return;
    // Inside the object, arrows move through the text; the viewer's arrows (next book) stay outside it.
    e.stopPropagation();
    e.preventDefault();
    const dir = e.key === "ArrowRight" || e.key === "PageDown" ? 1 : -1;
    if ("turn" in h) h.turn(dir);
    else h.move(dir * 0.12);
  }

  const note = FORM_NOTES[form];
  return (
    <figure className={"ms-stage ms-stage--" + form + (ready ? " is-ready" : "")}>
      <div
        className="ms-canvas"
        ref={hostRef}
        tabIndex={0}
        role="img"
        aria-label={note.label + " of " + title + ". " + note.hint + "; arrow keys work too."}
        onKeyDownCapture={onKey}
      />
      <figcaption className="ms-caption">
        <strong>{note.label}</strong>
        <span className="ms-hint">
          {note.hint}
          {page && page.total > 1 ? " · " + (page.n + 1) + " / " + page.total : ""}
        </span>
        <span className="ms-note">{note.note} The words are the English translation you read here.</span>
      </figcaption>
    </figure>
  );
}
