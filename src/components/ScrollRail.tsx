import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchExcerpt,
  fetchSectionLinks,
  fetchVerseLinks,
  type BibleRef,
  type CenturyNode,
  type Link,
  type SectionLinksResponse,
  type TestamentNode,
  type VerseLinksResponse
} from "../api/links";
import { useApp } from "../context/AppContext";
import { setStoredScrollDark, storedScrollDark } from "../lib/prefs";

type Props = {
  mode: "father-first" | "bible-first";
  workId?: string;
  chapter?: number;
  book?: string;
  verse?: number;
  activeSection?: string;
  onActiveSectionChange?: (section: string) => void;
  isOpen?: boolean;
  onToggleOpen?: (open: boolean) => void;
};

const ROMAN_CENTURIES = [
  { num: 1, label: "I" },
  { num: 2, label: "II" },
  { num: 3, label: "III" },
  { num: 4, label: "IV" },
  { num: 5, label: "V" },
  { num: 6, label: "VI" }
];

export function ScrollRail({
  mode,
  workId = "",
  chapter = 1,
  book = "mt",
  verse = 1,
  activeSection = "",
  onActiveSectionChange,
  isOpen: controlledIsOpen,
  onToggleOpen
}: Props) {
  const { railAutoFocus, railAutoCollapse } = useApp();

  const [scrollDark, setScrollDark] = useState<boolean>(() => storedScrollDark());
  const toggleScrollDark = () => {
    setScrollDark((prev) => {
      const next = !prev;
      setStoredScrollDark(next);
      return next;
    });
  };

  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const setIsOpen = (next: boolean) => {
    if (!isControlled) {
      setInternalIsOpen(next);
    }
    onToggleOpen?.(next);
  };
  const [peekRef, setPeekRef] = useState<{ bookId: string; chapter: number; verse: number } | null>(null);
  const [currentSection, setCurrentSection] = useState(activeSection);

  useEffect(() => {
    if (activeSection) setCurrentSection(activeSection);
  }, [activeSection]);

  // Father-first state
  const [sectionData, setSectionData] = useState<SectionLinksResponse | null>(null);
  const [loadingSection, setLoadingSection] = useState(false);
  const [selectedCanon, setSelectedCanon] = useState<"ot" | "nt" | null>(null);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedRefKey, setSelectedRefKey] = useState<string | null>(null);
  const [refExcerpts, setRefExcerpts] = useState<Link[]>([]);
  const [loadingExcerpts, setLoadingExcerpts] = useState(false);

  // Bible-first state
  const [verseData, setVerseData] = useState<VerseLinksResponse | null>(null);
  const [loadingVerse, setLoadingVerse] = useState(false);
  const [selectedCentury, setSelectedCentury] = useState<number | null>(null);
  const [selectedFather, setSelectedFather] = useState<string | null>(null);
  const [selectedWork, setSelectedWork] = useState<string | null>(null);

  // Data swap fade effect when autoCollapse is false
  const [isSwapping, setIsSwapping] = useState(false);

  // Auto-focus IntersectionObserver on [data-section]
  useEffect(() => {
    if (!railAutoFocus) {
      document.querySelectorAll(".section-dim").forEach((el) => el.classList.remove("section-dim"));
      return;
    }

    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-section]"));
    if (!sections.length) return;

    let activeEl: HTMLElement | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        let bestEntry: IntersectionObserverEntry | null = null;
        let minDistanceTo30 = Infinity;
        const targetY = window.innerHeight * 0.3;

        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const rect = entry.boundingClientRect;
          const dist = Math.abs(rect.top - targetY);

          if (!bestEntry || entry.intersectionRatio > bestEntry.intersectionRatio) {
            bestEntry = entry;
            minDistanceTo30 = dist;
          } else if (
            Math.abs(entry.intersectionRatio - bestEntry.intersectionRatio) < 0.05 &&
            dist < minDistanceTo30
          ) {
            bestEntry = entry;
            minDistanceTo30 = dist;
          }
        }

        if (bestEntry && bestEntry.target instanceof HTMLElement) {
          activeEl = bestEntry.target;
          const sec = activeEl.getAttribute("data-section") || "";
          if (sec) {
            setCurrentSection(sec);
            onActiveSectionChange?.(sec);
          }
          for (const s of sections) {
            if (s === activeEl) {
              s.classList.remove("section-dim");
            } else {
              s.classList.add("section-dim");
            }
          }
        }
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: [0.1, 0.3, 0.5, 0.7, 1.0]
      }
    );

    sections.forEach((s) => observer.observe(s));

    return () => {
      observer.disconnect();
      sections.forEach((el) => el.classList.remove("section-dim"));
    };
  }, [railAutoFocus, workId, chapter, onActiveSectionChange]);

  // Section data fetch on currentSection change
  useEffect(() => {
    if (mode !== "father-first" || !currentSection) return;

    if (railAutoCollapse) {
      setSelectedCanon(null);
      setSelectedBook(null);
      setSelectedRefKey(null);
      setPeekRef(null);
      setRefExcerpts([]);
    } else {
      setIsSwapping(true);
      const timer = setTimeout(() => setIsSwapping(false), 200);
      return () => clearTimeout(timer);
    }

    let cancelled = false;
    setLoadingSection(true);

    fetchSectionLinks(currentSection)
      .then((data) => {
        if (!cancelled) {
          setSectionData(data);
          setLoadingSection(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSectionData({
            sectionId: currentSection,
            tree: [],
            counts: { links: 0, total: 0, fathers: 0, books: 0, refs: 0 }
          });
          setLoadingSection(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [mode, currentSection, railAutoCollapse]);

  // Bible verse data fetch on book/verse change or peekRef
  const activeBook = peekRef ? peekRef.bookId : book;
  const activeCh = peekRef ? peekRef.chapter : chapter;
  const activeVs = peekRef ? peekRef.verse : verse;

  useEffect(() => {
    if (mode !== "bible-first" && !peekRef) return;

    if (railAutoCollapse) {
      setSelectedCentury(null);
      setSelectedFather(null);
      setSelectedWork(null);
    } else {
      setIsSwapping(true);
      const timer = setTimeout(() => setIsSwapping(false), 200);
      return () => clearTimeout(timer);
    }

    let cancelled = false;
    setLoadingVerse(true);

    fetchVerseLinks(activeBook, activeCh, activeVs)
      .then((data) => {
        if (!cancelled) {
          setVerseData(data);
          setLoadingVerse(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setVerseData(null);
          setLoadingVerse(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [mode, activeBook, activeCh, activeVs, peekRef, railAutoCollapse]);

  // Handle Esc key to close rail
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  // Fetch excerpts for a selected verse reference in father-first mode
  function handleSelectRef(ref: BibleRef) {
    const key = `${ref.bookId}:${ref.chapter}:${ref.verseStart}-${ref.verseEnd}`;
    if (selectedRefKey === key) {
      setSelectedRefKey(null);
      setRefExcerpts([]);
      return;
    }
    setSelectedRefKey(key);
    setLoadingExcerpts(true);

    fetchVerseLinks(ref.bookId, ref.chapter, ref.verseStart)
      .then((vData) => {
        const links = vData.tree.flatMap((c) => c.fathers.flatMap((f) => f.works.flatMap((w) => w.links)));
        setRefExcerpts(links);
        setLoadingExcerpts(false);
      })
      .catch(() => {
        setRefExcerpts([]);
        setLoadingExcerpts(false);
      });
  }

  // Render Bible-first (Centuries I-VI squares)
  function renderBibleFirstTree() {
    if (loadingVerse) {
      return <div className="rail-loading">Unrolling century commentary…</div>;
    }

    const tree = verseData?.tree || [];
    if (!tree.length && !loadingVerse) {
      return <p className="rail-empty">No verified commentary for this verse yet.</p>;
    }

    const treeByCentury = new Map<number, CenturyNode>(tree.map((c) => [c.century, c]));
    const activeCenturyNode = selectedCentury ? treeByCentury.get(selectedCentury) : null;
    const fathersList = activeCenturyNode?.fathers || [];
    const activeFatherNode = selectedFather ? fathersList.find((f) => f.fatherId === selectedFather) : null;
    const worksList = activeFatherNode?.works || [];
    const activeWorkNode = selectedWork ? worksList.find((w) => w.workId === selectedWork) : null;

    return (
      <div className={`rail-tree-container ${isSwapping ? "fade-swap" : ""}`}>
        {peekRef ? (
          <div className="rail-peek-nav">
            <button
              type="button"
              className="rail-back-btn"
              onClick={() => {
                setPeekRef(null);
                setSelectedCentury(null);
                setSelectedFather(null);
                setSelectedWork(null);
              }}
            >
              ← Back to section
            </button>
            <span className="rail-peek-title">
              {peekRef.bookId.toUpperCase()} {peekRef.chapter}:{peekRef.verse}
            </span>
          </div>
        ) : null}

        {/* Stacked Horizontal Bars Container */}
        <div className="rail-stacked-bars">
          {/* LEVEL 1: Century Horizontal Bar (shows when selectedCentury !== null) */}
          {selectedCentury !== null ? (
            <div className="rail-bar-row century-bar" role="group" aria-label="Centuries Bar">
              {ROMAN_CENTURIES.map(({ num, label }) => {
                const node = treeByCentury.get(num);
                const count = node
                  ? node.fathers.reduce((acc, f) => acc + f.works.reduce((wAcc, w) => wAcc + w.links.length, 0), 0)
                  : 0;
                const isSelected = selectedCentury === num;
                const isMuted = count === 0;

                return (
                  <button
                    key={num}
                    type="button"
                    className={`rail-bar-pill ${isMuted ? "muted" : ""} ${isSelected ? "selected" : ""}`}
                    disabled={isMuted}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedCentury(null);
                        setSelectedFather(null);
                        setSelectedWork(null);
                      } else {
                        setSelectedCentury(num);
                        setSelectedFather(null);
                        setSelectedWork(null);
                      }
                    }}
                    title={`Century ${label}: ${count} excerpts`}
                  >
                    <span className="pill-num">{label}</span>
                    <span className="pill-count">{count}</span>
                  </button>
                );
              })}
            </div>
          ) : null}

          {/* LEVEL 2: Author Horizontal Bar (shows when selectedFather !== null) */}
          {selectedCentury !== null && selectedFather !== null ? (
            <div className="rail-bar-row author-bar" role="group" aria-label="Authors Bar">
              {fathersList.map((father) => {
                const count = father.works.reduce((acc, w) => acc + w.links.length, 0);
                const isSelected = selectedFather === father.fatherId;
                const name = father.fatherId.replace(/_/g, " ");

                return (
                  <button
                    key={father.fatherId}
                    type="button"
                    className={`rail-bar-pill ${isSelected ? "selected" : ""}`}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedFather(null);
                        setSelectedWork(null);
                      } else {
                        setSelectedFather(father.fatherId);
                        setSelectedWork(null);
                      }
                    }}
                    title={`${name}: ${count} excerpts`}
                  >
                    <span className="pill-name capitalize">{name}</span>
                    <span className="pill-count">{count}</span>
                  </button>
                );
              })}
            </div>
          ) : null}

          {/* LEVEL 3: Work Horizontal Bar (shows when selectedWork !== null) */}
          {selectedFather !== null && selectedWork !== null ? (
            <div className="rail-bar-row work-bar" role="group" aria-label="Works Bar">
              {worksList.map((work) => {
                const isSelected = selectedWork === work.workId;
                return (
                  <button
                    key={work.workId}
                    type="button"
                    className={`rail-bar-pill ${isSelected ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedWork(isSelected ? null : work.workId);
                    }}
                    title={`${work.workTitle}: ${work.links.length} excerpts`}
                  >
                    <span className="pill-name">{work.workTitle}</span>
                    <span className="pill-count">{work.links.length}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* CONTENT EXPANSIONS BELOW BARS */}

        {/* LEVEL 1 CARDS: Centuries 3x2 Grid (when no century selected) */}
        {selectedCentury === null ? (
          <div className="rail-centuries-grid" role="group" aria-label="Centuries">
            {ROMAN_CENTURIES.map(({ num, label }) => {
              const centuryNode = treeByCentury.get(num);
              const count = centuryNode
                ? centuryNode.fathers.reduce(
                    (acc, f) => acc + f.works.reduce((wAcc, w) => wAcc + w.links.length, 0),
                    0
                  )
                : 0;
              const isMuted = count === 0;

              return (
                <button
                  key={num}
                  type="button"
                  className={`century-square ${isMuted ? "muted" : "active"}`}
                  disabled={isMuted}
                  onClick={() => {
                    setSelectedCentury(num);
                    setSelectedFather(null);
                    setSelectedWork(null);
                  }}
                  title={count > 0 ? `Century ${label}: ${count} commentary excerpts` : `Century ${label}: 0 links`}
                >
                  <span className="century-num">{label}</span>
                  <span className="century-count">{count}</span>
                </button>
              );
            })}
          </div>
        ) : null}

        {/* LEVEL 2 CARDS: Church Fathers Cards (when century selected, no author selected) */}
        {selectedCentury !== null && selectedFather === null ? (
          <div className="rail-level-cards unroll-in">
            <h4 className="rail-node-heading">
              Century {ROMAN_CENTURIES.find((c) => c.num === selectedCentury)?.label} Fathers
            </h4>
            <div className="rail-cards-list">
              {fathersList.map((father) => {
                const count = father.works.reduce((acc, w) => acc + w.links.length, 0);
                const name = father.fatherId.replace(/_/g, " ");

                return (
                  <button
                    key={father.fatherId}
                    type="button"
                    className="rail-big-card"
                    onClick={() => {
                      setSelectedFather(father.fatherId);
                      setSelectedWork(null);
                    }}
                  >
                    <span className="card-title capitalize">{name}</span>
                    <span className="card-badge">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* LEVEL 3 CARDS: Works Cards (when author selected, no work selected) */}
        {selectedFather !== null && selectedWork === null ? (
          <div className="rail-level-cards unroll-in">
            <h4 className="rail-node-heading">
              Works of {selectedFather.replace(/_/g, " ")}
            </h4>
            <div className="rail-cards-list">
              {worksList.map((work) => (
                <button
                  key={work.workId}
                  type="button"
                  className="rail-big-card"
                  onClick={() => setSelectedWork(work.workId)}
                >
                  <span className="card-title">{work.workTitle}</span>
                  <span className="card-badge">{work.links.length}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* LEVEL 4 EXCERPTS: Quotes (when work selected) */}
        {selectedWork !== null && activeWorkNode ? (
          <div className="rail-excerpts-container unroll-in">
            <div className="rail-excerpts-list">
              {activeWorkNode.links.map((link) => (
                <blockquote key={link.id} className="rail-excerpt">
                  <p className="excerpt-text">“{link.excerpt}”</p>
                  <footer className="excerpt-meta">
                    <span className="excerpt-source">
                      {link.sourceWork || link.workTitle}
                    </span>
                    {link.sourceUrl ? (
                      <a
                        href={link.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="excerpt-url"
                      >
                        CCEL ↗
                      </a>
                    ) : null}
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  // Render Father-first (OT | NT squares)
  function renderFatherFirstTree() {
    if (peekRef) {
      return renderBibleFirstTree();
    }

    if (loadingSection) {
      return <div className="rail-loading">Unrolling scripture links…</div>;
    }

    const tree = sectionData?.tree || [];
    if (!tree.length) {
      return <p className="rail-empty">No verified commentary for this verse yet.</p>;
    }

    const otNode = tree.find((t) => t.canon === "ot");
    const ntNode = tree.find((t) => t.canon === "nt");
    const otCount = otNode ? otNode.books.reduce((acc, b) => acc + b.refs.length, 0) : 0;
    const ntCount = ntNode ? ntNode.books.reduce((acc, b) => acc + b.refs.length, 0) : 0;

    return (
      <div className={`rail-tree-container ${isSwapping ? "fade-swap" : ""}`}>
        <div className="rail-testaments-grid" role="group" aria-label="Testaments">
          <button
            type="button"
            className={`testament-square ${otCount === 0 ? "muted" : "active"} ${selectedCanon === "ot" ? "selected" : ""}`}
            disabled={otCount === 0}
            onClick={() => {
              if (selectedCanon === "ot") {
                setSelectedCanon(null);
                setSelectedBook(null);
                setSelectedRefKey(null);
              } else {
                setSelectedCanon("ot");
                setSelectedBook(null);
                setSelectedRefKey(null);
              }
            }}
            aria-expanded={selectedCanon === "ot"}
          >
            <span className="testament-label">OT</span>
            <span className="testament-sub">Old Testament</span>
            <span className="testament-count">{otCount}</span>
          </button>

          <button
            type="button"
            className={`testament-square ${ntCount === 0 ? "muted" : "active"} ${selectedCanon === "nt" ? "selected" : ""}`}
            disabled={ntCount === 0}
            onClick={() => {
              if (selectedCanon === "nt") {
                setSelectedCanon(null);
                setSelectedBook(null);
                setSelectedRefKey(null);
              } else {
                setSelectedCanon("nt");
                setSelectedBook(null);
                setSelectedRefKey(null);
              }
            }}
            aria-expanded={selectedCanon === "nt"}
          >
            <span className="testament-label">NT</span>
            <span className="testament-sub">New Testament</span>
            <span className="testament-count">{ntCount}</span>
          </button>
        </div>

        {selectedCanon ? (
          <div className="rail-level-node unroll-in">
            <h4 className="rail-node-heading">
              {selectedCanon === "ot" ? "Old Testament Books" : "New Testament Books"}
            </h4>
            <div className="rail-books-list">
              {(selectedCanon === "ot" ? otNode : ntNode)?.books.map((b) => {
                const isBookSelected = selectedBook === b.bookId;
                return (
                  <div key={b.bookId} className="rail-node-item">
                    <button
                      type="button"
                      className={`rail-node-btn ${isBookSelected ? "open" : ""}`}
                      onClick={() => {
                        if (isBookSelected) {
                          setSelectedBook(null);
                          setSelectedRefKey(null);
                        } else {
                          setSelectedBook(b.bookId);
                          setSelectedRefKey(null);
                        }
                      }}
                      aria-expanded={isBookSelected}
                    >
                      <span className="node-title uppercase">{b.bookId}</span>
                      <span className="node-badge">{b.refs.length}</span>
                    </button>

                    {isBookSelected ? (
                      <div className="rail-subnode unroll-in">
                        <div className="rail-refs-list">
                          {b.refs.map((r) => {
                            const refKey = `${r.bookId}:${r.chapter}:${r.verseStart}-${r.verseEnd}`;
                            const isRefSelected = selectedRefKey === refKey;
                            return (
                              <div key={refKey} className="rail-ref-item">
                                <div className="rail-ref-row">
                                  <button
                                    type="button"
                                    className={`rail-ref-btn ${isRefSelected ? "active" : ""}`}
                                    onClick={() => handleSelectRef(r)}
                                  >
                                    <span className="ref-label">
                                      {r.bookId.toUpperCase()} {r.chapter}:
                                      {r.verseStart === r.verseEnd
                                        ? r.verseStart
                                        : `${r.verseStart}–${r.verseEnd}`}
                                    </span>
                                  </button>
                                  <button
                                    type="button"
                                    className="rail-peek-btn"
                                    title="Peek century commentary for this verse"
                                    onClick={() =>
                                      setPeekRef({
                                        bookId: r.bookId,
                                        chapter: r.chapter,
                                        verse: r.verseStart
                                      })
                                    }
                                  >
                                    Fathers ↗
                                  </button>
                                </div>

                                {isRefSelected ? (
                                  <div className="rail-excerpts-list unroll-in">
                                    {loadingExcerpts ? (
                                      <p className="rail-loading-small">Loading excerpts…</p>
                                    ) : refExcerpts.length === 0 ? (
                                      <p className="rail-empty-small">No excerpts stored.</p>
                                    ) : (
                                      refExcerpts.map((l) => (
                                        <blockquote key={l.id} className="rail-excerpt">
                                          <p className="excerpt-text">“{l.excerpt}”</p>
                                          <footer className="excerpt-meta">
                                            <span className="excerpt-author">
                                              {l.fatherId.replace(/_/g, " ")} · {l.workTitle}
                                            </span>
                                          </footer>
                                        </blockquote>
                                      ))
                                    )}
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <aside
      className={`scroll-rail-container ${isOpen ? "open" : "idle"} ${scrollDark ? "scroll-dark" : ""}`}
      aria-label="Commentary"
    >
      {/* Idle thin vertical rail button */}
      {!isOpen ? (
        <button
          type="button"
          className="scroll-rail-idle"
          aria-label="Open commentary"
          title="Open commentary"
          onClick={() => setIsOpen(true)}
        >
          <span className="rail-line" />
          <span className="rail-tab">Commentary</span>
        </button>
      ) : (
        <div className={`scroll-unrolled ${scrollDark ? "scroll-dark" : ""}`} role="region" aria-label="Commentary content">
          <header className="scroll-header">
            <div className="scroll-title-wrap">
              <h3 className="scroll-title">Commentary</h3>
            </div>
            <div className="scroll-header-actions">
              <button
                type="button"
                className="scroll-theme-btn"
                aria-label={scrollDark ? "Switch to light theme" : "Switch to dark theme"}
                title={scrollDark ? "Light theme" : "Dark theme"}
                onClick={toggleScrollDark}
              >
                {scrollDark ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>
              <button
                type="button"
                className="scroll-close-btn"
                aria-label="Close commentary"
                title="Close (Esc)"
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </div>
          </header>

          <div className="scroll-body">
            {mode === "father-first" ? renderFatherFirstTree() : renderBibleFirstTree()}
          </div>

          {/* Far-right slim bar that closes the commentary */}
          <button
            type="button"
            className="scroll-rail-slim-bar"
            aria-label="Close commentary"
            title="Close"
            onClick={() => setIsOpen(false)}
          />
        </div>
      )}
    </aside>
  );
}
