import { useEffect, useRef, useState } from "react";
import type { WorkChapterMeta } from "../../server/types";
import { announceReadDock, chapterDockLabel, subscribeReadDock } from "../lib/readDocks";

export function ChapterDock({
  chapters,
  currentChapter,
  onJump,
  onJumpSub
}: {
  chapters: WorkChapterMeta[];
  currentChapter: number;
  onJump: (n: number) => void;
  onJumpSub?: (book: number, n: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set([currentChapter]));
  const nested = chapters.some((c) => c.subs?.length);
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

  function toggleList() {
    if (!open) setExpanded((was) => new Set(was).add(current.chapter));
    setOpen((was) => !was);
  }

  function toggleBook(n: number) {
    setExpanded((was) => {
      const next = new Set(was);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  }

  function jumpSub(book: number, n: number) {
    setOpen(false);
    onJumpSub?.(book, n);
  }

  function jump(n: number) {
    if (n === current.chapter) {
      setOpen(false);
      queueMicrotask(() => currentBtn.current?.focus());
      return;
    }
    onJump(n);
    setOpen(false);
    queueMicrotask(() => currentBtn.current?.focus());
  }

  return (
    <div className="read-chapter-dock">
      <div className="read-chapter-field">
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
            onClick={toggleList}
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
          {nested
            ? chapters.map((p) => {
                const isOpen = expanded.has(p.chapter);
                return (
                  <div className="read-chapter-book" key={p.chapter}>
                    <div className="read-chapter-book-row">
                      {p.subs?.length ? (
                        <button
                          type="button"
                          className="read-chapter-disclose"
                          aria-expanded={isOpen}
                          aria-label={(isOpen ? "Hide chapters of " : "Show chapters of ") + p.heading}
                          onClick={() => toggleBook(p.chapter)}
                        >
                          {isOpen ? "▾" : "▸"}
                        </button>
                      ) : (
                        <span className="read-chapter-disclose" aria-hidden="true" />
                      )}
                      <a
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
                    </div>
                    {isOpen
                      ? p.subs?.map((s) => (
                          <a
                            key={s.n}
                            className="read-chapter-sub"
                            href={"#ch-" + p.chapter + "-" + s.n}
                            title={s.label + (s.title ? " — " + s.title : "")}
                            onClick={(e) => {
                              e.preventDefault();
                              jumpSub(p.chapter, s.n);
                            }}
                          >
                            {s.label}
                            {s.title ? " — " + s.title : ""}
                          </a>
                        ))
                      : null}
                  </div>
                );
              })
            : chapters.map((p) => (
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
