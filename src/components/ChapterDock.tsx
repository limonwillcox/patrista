import { useEffect, useRef, useState } from "react";
import type { WorkChapterMeta } from "../../server/types";
import { announceReadDock, chapterDockLabel, subscribeReadDock } from "../lib/readDocks";

export function ChapterDock({
  chapters,
  currentChapter,
  onJump
}: {
  chapters: WorkChapterMeta[];
  currentChapter: number;
  onJump: (n: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const currentBtn = useRef<HTMLButtonElement>(null);
  const index = chapters.findIndex((c) => c.chapter === currentChapter);
  const current = index >= 0 ? chapters[index] : chapters[0];
  const prev = index > 0 ? chapters[index - 1] : null;
  const next = index >= 0 && index < chapters.length - 1 ? chapters[index + 1] : null;

  useEffect(
    () =>
      subscribeReadDock((dock) => {
        if (dock === "dictionary") setOpen(false);
      }),
    []
  );

  useEffect(() => {
    if (!open) return;
    announceReadDock("chapter");
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onClick(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (t.closest(".read-chapter-dock")) return;
      setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick, true);
    };
  }, [open]);

  if (chapters.length <= 1 || !current) return null;

  function openList() {
    setOpen(true);
  }

  function jump(n: number) {
    onJump(n);
    setOpen(false);
    queueMicrotask(() => currentBtn.current?.focus());
  }

  return (
    <div className="read-chapter-dock">
      <div className="read-chapter-field">
        <button type="button" className="read-dict-label" onClick={openList} aria-expanded={open}>
          Chapters
        </button>
        <div className="read-chapter-bar">
          <button
            type="button"
            className="read-chapter-prev"
            aria-label="Previous chapter"
            disabled={!prev}
            onClick={() => prev && onJump(prev.chapter)}
          >
            ‹
          </button>
          <button
            type="button"
            className="read-chapter-current"
            ref={currentBtn}
            aria-expanded={open}
            aria-controls="read-chapter-list"
            onClick={openList}
          >
            {chapterDockLabel(current.heading, current.chapter)}
          </button>
          <button
            type="button"
            className="read-chapter-next"
            aria-label="Next chapter"
            disabled={!next}
            onClick={() => next && onJump(next.chapter)}
          >
            ›
          </button>
        </div>
      </div>
      {open ? (
        <nav id="read-chapter-list" className="read-chapter-list" aria-label="Chapters">
          {chapters.map((p) => (
            <a
              key={p.chapter}
              href={"#ch-" + p.chapter}
              title={p.heading}
              className={p.chapter === current.chapter ? "is-current" : undefined}
              onClick={(e) => {
                e.preventDefault();
                jump(p.chapter);
              }}
            >
              {p.heading || String(p.chapter)}
            </a>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
