import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  fetchBibleChapter,
  fetchBibleManifest,
  type BibleChapterPayload,
  type BibleManifestBook
} from "../api/client";
import { BIBLE_TRANSLATIONS, type BibleTranslation } from "../api/bibleTranslations";
import { ScrollRail } from "../components/ScrollRail";
import {
  setStoredBibleSplitView,
  storedBibleSplitView,
  storedBibleTranslation,
  setStoredBibleTranslation
} from "../lib/prefs";

export function BiblePage() {
  const [params, setParams] = useSearchParams();
  const book = params.get("book") || "jo";
  const chapter = Math.max(1, Number(params.get("chapter") || 1));
  const section = params.get("section") || "";
  const translation = params.get("version") || storedBibleTranslation() || "kjv";

  const [manifest, setManifest] = useState<BibleManifestBook[] | null>(null);
  const [payload, setPayload] = useState<BibleChapterPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeVerse, setActiveVerse] = useState<number>(1);
  const [railOpen, setRailOpen] = useState(false);
  const [splitView, setSplitView] = useState(() => storedBibleSplitView());
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number | null>(null);

  const toggleSplitView = (next: boolean) => {
    setSplitView(next);
    setStoredBibleSplitView(next);
    if (next) setRailOpen(true);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    startXRef.current = e.clientX;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (startXRef.current === null) return;
    const deltaX = e.clientX - startXRef.current;
    if (deltaX < -15 && !splitView) {
      toggleSplitView(true);
      startXRef.current = null;
    } else if (deltaX > 15 && splitView) {
      toggleSplitView(false);
      startXRef.current = null;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (startXRef.current !== null) {
      const deltaX = e.clientX - startXRef.current;
      if (Math.abs(deltaX) < 10) {
        toggleSplitView(!splitView);
      }
    }
    startXRef.current = null;
  };

  // Dynamically compute available space and clamp scroll container to bible-scroll-track bounds
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    let rafId: number | null = null;

    function update() {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const space = Math.max(0, window.innerWidth - rect.left);
      const visibleTop = Math.max(74, rect.top);
      const visibleBottom = Math.min(window.innerHeight - 16, rect.bottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);

      el.style.setProperty("--available-right-space", `${space}px`);
      el.style.setProperty("--track-left", `${rect.left}px`);
      el.style.setProperty("--track-top", `${visibleTop}px`);
      el.style.setProperty("--track-height", `${visibleHeight}px`);
      el.style.setProperty("--track-opacity", visibleHeight < 30 ? "0" : "1");
      el.style.setProperty("--track-pointer-events", visibleHeight < 30 ? "none" : "auto");
    }

    function onScrollOrResize() {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        update();
      });
    }

    update();
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(onScrollOrResize);
      ro.observe(document.body);
    }

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize);
      ro?.disconnect();
    };
  }, [railOpen, payload]);

  useEffect(() => {
    let cancelled = false;
    fetchBibleManifest()
      .then((m) => {
        if (!cancelled) setManifest(m);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setPayload(null);
    setError(null);
    fetchBibleChapter(book, chapter, {
      section: section || undefined,
      translation
    })
      .then((p) => {
        if (!cancelled) setPayload(p);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [book, chapter, section, translation]);

  const bookMeta = useMemo(
    () => manifest?.find((b) => b.id === book) || payload?.book,
    [manifest, book, payload]
  );
  const chapterCount = bookMeta?.chapters || payload?.verses.length || 1;

  const activeTranslation = useMemo(
    () =>
      BIBLE_TRANSLATIONS.find((t) => t.id === translation) || {
        id: translation,
        name: translation,
        abbreviation: translation.toUpperCase().slice(0, 4),
        isLocal: false
      },
    [translation]
  );

  function setBook(id: string) {
    const next: Record<string, string> = { book: id, chapter: "1" };
    if (translation && translation !== "kjv") next.version = translation;
    setParams(next);
  }

  function setChapter(n: number) {
    const next: Record<string, string> = { book, chapter: String(n) };
    if (translation && translation !== "kjv") next.version = translation;
    setParams(next);
  }

  function setSection(id: string) {
    const next: Record<string, string> = { book, chapter: String(chapter) };
    if (id) next.section = id;
    if (translation && translation !== "kjv") next.version = translation;
    setParams(next);
  }

  function setTranslation(id: string) {
    setStoredBibleTranslation(id);
    const next: Record<string, string> = { book, chapter: String(chapter) };
    if (section) next.section = section;
    if (id && id !== "kjv") next.version = id;
    setParams(next, { replace: true });
  }

  if (error) {
    return (
      <div className="bible-page">
        <p className="empty" style={{ color: "var(--burgundy, #b3261e)", marginBottom: 16 }}>
          {error}
        </p>
        {translation !== "kjv" && (
          <button
            type="button"
            className="btn"
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              background: "var(--burgundy, #6b1d2a)",
              color: "#fff",
              border: "none",
              cursor: "pointer"
            }}
            onClick={() => setTranslation("kjv")}
          >
            Switch back to King James Version (KJV)
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={"bible-page" + (splitView ? " is-split" : "")}>
      <div className="bible-toolbar">
        <label className="bible-pick">
          <span className="sr-only">Translation</span>
          <select
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
            aria-label="Translation"
          >
            {BIBLE_TRANSLATIONS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.abbreviation} - {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="bible-pick">
          <span className="sr-only">Book</span>
          <select
            value={book}
            onChange={(e) => {
              const next: Record<string, string> = { book: e.target.value, chapter: "1" };
              if (translation && translation !== "kjv") next.version = translation;
              setParams(next, { replace: true });
            }}
            aria-label="Book"
          >
            {manifest?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label className="bible-pick">
          <span className="sr-only">Chapter</span>
          <select
            value={String(chapter)}
            onChange={(e) => {
              const next: Record<string, string> = { book, chapter: e.target.value };
              if (translation && translation !== "kjv") next.version = translation;
              setParams(next, { replace: true });
            }}
            aria-label="Chapter"
          >
            {Array.from({ length: chapterCount }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        {payload?.sections && payload.sections.length > 0 ? (
          <label className="bible-pick">
            <span className="sr-only">Section</span>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              aria-label="Section"
            >
              <option value="">Whole chapter</option>
              {payload.sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <h1 className="bible-title">
          {bookMeta?.name || book} {chapter}
          <span className="bible-edition">{activeTranslation.abbreviation}</span>
        </h1>
      </div>

      <div className={"bible-content-frame" + (splitView ? " is-split" : "")}>
        <div className="bible-text">
          {!payload ? (
            <p className="empty">Loading…</p>
          ) : (
            <div className="bible-verses">
              {payload.verses.map((text, i) => {
                const n = i + 1;
                const inSection =
                  !section ||
                  payload.sections?.some(
                    (s) =>
                      s.id === section && n >= s.verses.start && n <= s.verses.end
                  );
                return (
                  <p
                    key={n}
                    className={"bible-verse" + (section && !inSection ? " dim" : "") + (activeVerse === n ? " active-verse" : "")}
                    id={"v-" + n}
                    data-section={`${book}:${chapter}:v${n}`}
                    title="Click verse to open commentary scroll"
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      setActiveVerse(n);
                      setRailOpen(true);
                    }}
                  >
                    <sup className="vnum">{n}</sup> {text}
                  </p>
                );
              })}
            </div>
          )}
        </div>

        <div ref={trackRef} className={`bible-scroll-track ${railOpen ? "is-open" : ""} ${splitView ? "is-split" : ""}`}>
          {(railOpen || splitView) ? (
            <button
              type="button"
              className={`bible-split-handle ${splitView ? "is-split" : ""}`}
              title={splitView ? "Drag right or click for normal view" : "Drag left or click for 50/50 split view"}
              aria-label={splitView ? "Switch to normal view" : "Switch to 50/50 split view"}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              <span className="handle-symbol">&lt;&nbsp;&gt;</span>
            </button>
          ) : null}

          <ScrollRail
            mode="bible-first"
            book={book}
            chapter={chapter}
            verse={activeVerse}
            isOpen={splitView || railOpen}
            onToggleOpen={(open) => {
              if (!open) {
                setSplitView(false);
                setStoredBibleSplitView(false);
                setRailOpen(false);
              } else {
                setRailOpen(true);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
