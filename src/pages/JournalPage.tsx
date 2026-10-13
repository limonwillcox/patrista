import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { NotesBar } from "../components/NotesBar";
import { useApp } from "../context/AppContext";
import { fatherDate, journalPages, journalTree, toRoman, type JournalPage as JournalLeafData } from "../lib/journal";
import { loadNoteHtml, noteIsEmpty } from "../lib/readerNotes";

const FLIP_MS = 340;

export function JournalPage() {
  const { catalog, user, setLoginOpen } = useApp();
  const [leaf, setLeaf] = useState(0);
  const [turning, setTurning] = useState<null | "next" | "prev">(null);
  const [workId, setWorkId] = useState<string | null>(null);
  const [noteTick, setNoteTick] = useState(0);
  const flipTimer = useRef<number>(0);

  useEffect(() => {
    document.body.classList.add("journal-page");
    return () => {
      document.body.classList.remove("journal-page");
      window.clearTimeout(flipTimer.current);
    };
  }, []);

  const tree = useMemo(() => {
    if (!catalog) return [];
    return journalTree(catalog.authors, catalog.works, (id) => !noteIsEmpty(loadNoteHtml(id)));
  }, [catalog, user, workId, noteTick]);

  const pages = useMemo(() => journalPages(tree), [tree]);

  const selectedWork = useMemo(() => {
    if (!workId || !catalog) return null;
    const work = catalog.works.find((w) => w.id === workId);
    if (!work) return null;
    const father = catalog.authors.find((a) => a.id === work.author) || null;
    return { work, father };
  }, [workId, catalog]);

  const loggedIn = Boolean(user);
  const canNext = !workId && !turning && leaf + 2 < pages.length;
  const canPrev = !turning && (workId ? true : leaf > 0);

  function turn(dir: "next" | "prev") {
    if (workId) {
      if (dir === "prev") setWorkId(null);
      return;
    }
    if (turning) return;
    if (dir === "next" && leaf + 2 >= pages.length) return;
    if (dir === "prev" && leaf <= 0) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setLeaf((n) => n + (dir === "next" ? 2 : -2));
      return;
    }
    setTurning(dir);
    window.clearTimeout(flipTimer.current);
    flipTimer.current = window.setTimeout(() => {
      setLeaf((n) => n + (dir === "next" ? 2 : -2));
      setTurning(null);
    }, FLIP_MS);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && t.closest("[contenteditable], input, textarea")) return;
      if (e.key === "ArrowRight") turn("next");
      if (e.key === "ArrowLeft") turn("prev");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const left = pages[leaf] ?? null;
  const right = pages[leaf + 1] ?? null;
  const nextLeft = pages[leaf + 2] ?? null;
  const nextRight = pages[leaf + 3] ?? null;
  const prevLeft = pages[leaf - 2] ?? null;
  const prevRight = pages[leaf - 1] ?? null;

  return (
    <div className={"journal" + (loggedIn ? " is-open" : " is-closed")}>
      {loggedIn ? (
        <div
          className={
            "journal-book journal-book--open" + (turning ? " is-turning is-turning-" + turning : "")
          }
          aria-label="Journal"
        >
          <div className="journal-stage">
            {selectedWork ? (
              <>
                <div className="journal-leaf journal-leaf--left">
                  <p className="journal-kicker">Notes</p>
                  <h2 className="journal-father-name">{selectedWork.father ? selectedWork.father.name : "Work"}</h2>
                  <div className="journal-work-head">
                    <h1 className="journal-work-title">{selectedWork.work.title}</h1>
                    <Link className="journal-read" to={"/read?work=" + encodeURIComponent(selectedWork.work.id)}>
                      Read
                    </Link>
                  </div>
                </div>
                <div className="journal-leaf journal-leaf--right">
                  <NotesBar workId={selectedWork.work.id} onSave={() => setNoteTick((n) => n + 1)} />
                </div>
              </>
            ) : (
              <>
                <JournalLeaf page={turning === "prev" ? prevLeft : left} side="left" onWork={setWorkId} />
                <JournalLeaf page={turning === "next" ? nextRight : right} side="right" onWork={setWorkId} />
                {turning === "next" ? (
                  <div className="journal-flip journal-flip--right is-turning" aria-hidden="true">
                    <div className="journal-flip-face journal-flip-face--front">
                      <JournalLeaf page={right} side="right" onWork={setWorkId} />
                    </div>
                    <div className="journal-flip-face journal-flip-face--back">
                      <JournalLeaf page={nextLeft} side="left" onWork={setWorkId} />
                    </div>
                  </div>
                ) : null}
                {turning === "prev" ? (
                  <div className="journal-flip journal-flip--left is-turning" aria-hidden="true">
                    <div className="journal-flip-face journal-flip-face--front">
                      <JournalLeaf page={left} side="left" onWork={setWorkId} />
                    </div>
                    <div className="journal-flip-face journal-flip-face--back">
                      <JournalLeaf page={prevRight} side="right" onWork={setWorkId} />
                    </div>
                  </div>
                ) : null}
              </>
            )}
            <div className="journal-spine" aria-hidden="true" />
          </div>
          {canPrev ? (
            <button type="button" className="journal-turn journal-turn--prev" aria-label="Previous page" onClick={() => turn("prev")}>
              <TurnChevron dir="prev" />
            </button>
          ) : null}
          {canNext ? (
            <button type="button" className="journal-turn journal-turn--next" aria-label="Next page" onClick={() => turn("next")}>
              <TurnChevron dir="next" />
            </button>
          ) : null}
        </div>
      ) : (
        <div className="journal-book journal-book--closed">
          <div className="journal-cover">
            <img className="journal-cover-mark" src="/assets/chi-rho-gold.png" alt="" width={48} height={48} />
            <span className="journal-cover-title">Journal</span>
            <div className="journal-cover-copy">
              <p>Make an account to save notes</p>
              <button type="button" className="journal-login" onClick={() => setLoginOpen(true, "create")}>
                Log in
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function JournalLeaf({
  page,
  side,
  onWork
}: {
  page: JournalLeafData | null;
  side: "left" | "right";
  onWork: (id: string) => void;
}) {
  return (
    <div className={"journal-leaf journal-leaf--" + side}>
      {page ? (
        <div className="journal-toc">
          {page.blocks.map((b, i) => {
            if (b.kind === "chapter") {
              return (
                <h2 key={"c" + b.n + "-" + i} className="journal-toc-chapter">
                  {b.title}
                </h2>
              );
            }
            if (b.kind === "author") {
              return (
                <h3 key={"a" + b.id + "-" + i} className="journal-toc-author">
                  <span>
                    {b.name} ({fatherDate(b.deathYear)})
                  </span>
                  {b.hasNote ? <i className="journal-dot" aria-hidden="true" /> : null}
                </h3>
              );
            }
            return (
              <button
                key={b.id}
                type="button"
                className="journal-toc-work"
                onClick={() => onWork(b.id)}
              >
                <span>{b.title}</span>
                {b.hasNote ? <i className="journal-dot" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
      {page ? <p className="journal-folio">{toRoman(page.folio).toLowerCase()}</p> : null}
    </div>
  );
}

function TurnChevron({ dir }: { dir: "next" | "prev" }) {
  const d = dir === "next" ? "M7 4l8 8-8 8" : "M17 4l-8 8 8 8";
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
