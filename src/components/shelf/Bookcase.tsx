import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  deathCentury,
  defaultBinWidthPx,
  periodIdForAuthor,
  spineBin,
  spineScale,
  type SpineBin
} from "../../../server/shelf";
import type { Author, Catalog, Work } from "../../../server/types";
import { formatWords, readingTime } from "../../lib/keyWorks";
import { writingCategory } from "../../lib/libraryHover";
import { shelfGroups } from "../../lib/shelfGroups";
import { BookSpine, HUE_LEATHER, authorHue } from "./BookSpine";
import { loadBookText } from "../../lib/bookText";
import { manuscriptForm, workCentury } from "../../lib/manuscriptForm";
import { attributionLabel, hasAttribution, shortAuthor } from "../../../server/workMeta";
import { webglAvailable } from "../../three/support";
import type { BookSpec, ShelfFlight } from "../../three/shelfFlight";
import { BookViewer } from "./BookViewer";
import { RollSlot } from "./RollSlot";

const BOOK_GAP = 4;

/** Split one group into rows that fit the shelf width. */
function packRows(works: Work[], bins: Map<string, SpineBin>, width: number): Work[][] {
  const rows: Work[][] = [];
  let row: Work[] = [];
  let used = 0;
  for (const w of works) {
    const bw = defaultBinWidthPx(bins.get(w.id) ?? 5) + BOOK_GAP;
    if (row.length && used + bw > width) {
      rows.push(row);
      row = [];
      used = 0;
    }
    row.push(w);
    used += bw;
  }
  if (row.length) rows.push(row);
  return rows;
}

type ViewMode = "shelf" | "list";
const VIEW_KEY = "patrista.bookcase.view";

function readView(): ViewMode {
  try {
    return localStorage.getItem(VIEW_KEY) === "list" ? "list" : "shelf";
  } catch {
    return "shelf";
  }
}

export function Bookcase({ catalog, author }: { catalog: Catalog; author: Author }) {
  const [params, setParams] = useSearchParams();
  const openId = params.get("work");
  const [view, setView] = useState<ViewMode>(readView);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [width, setWidth] = useState(900);
  const trackRef = useRef<HTMLDivElement>(null);

  const works = useMemo(() => catalog.works.filter((w) => w.author === author.id), [catalog.works, author.id]);
  const groups = useMemo(() => shelfGroups(works), [works]);
  const ordered = useMemo(() => groups.flatMap((g) => g.works), [groups]);
  const bins = useMemo(() => {
    const scale = spineScale(catalog.works.map((w) => w.wordCount));
    return new Map(catalog.works.map((w) => [w.id, spineBin(w.wordCount, scale)]));
  }, [catalog.works]);
  const century = deathCentury(author.deathYear);
  const periodId = periodIdForAuthor(author);
  const hue = authorHue(author.id);
  const totalWords = works.reduce((n, w) => n + w.wordCount, 0);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => setWidth(Math.max(200, Math.floor(el.clientWidth) - 24));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [view]);

  function chooseView(next: ViewMode) {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      /* storage blocked */
    }
  }

  // True while the open book came from a click here, so closing can step Back instead of adding history.
  const pushedRef = useRef(false);

  /** Where the opened book stood on the shelf, for its flight into the viewer. */
  const [origin, setOrigin] = useState<DOMRect | null>(null);

  // One 3D layer carries a book off the shelf and into the viewer (codices only; rolls fly as before).
  const canCarry = useMemo(
    () => typeof window !== "undefined" && webglAvailable() && !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );
  const flightRef = useRef<Promise<ShelfFlight> | null>(null);
  const stageElRef = useRef<HTMLElement | null>(null);
  const [carriedId, setCarriedId] = useState<string | null>(null);
  const flight = () => (flightRef.current ??= import("../../three/shelfFlight").then((m) => m.createShelfFlight()));
  useEffect(() => () => void flightRef.current?.then((f) => f.dispose()), []);
  const carries = (_w: Work) => canCarry;
  /** Pointing, leaving and taking, the same for a book on a shelf and a roll in its pigeonhole. */
  const handlers = (w: Work) => ({
    selected: hoverId === w.id,
    carry: carries(w),
    onSelect: (el: HTMLElement) => {
      setHoverId(w.id);
      if (carries(w))
        void flight().then((f) =>
          f.hover(spec(w), el, () => stageElRef.current, () => {
            setHoverId(null);
            setCarriedId(w.id);
            open(w.id, null);
          })
        );
      else void loadBookText(w);
    },
    onDeselect: () => {
      setHoverId((was) => (was === w.id ? null : was));
      if (carries(w)) void flightRef.current?.then((f) => f.unhover(w.id));
    },
    onOpen: (from: DOMRect | null, el: HTMLElement | null, quick: boolean) => {
      setHoverId(null);
      if (carries(w) && el) {
        // The viewer opens as the book leaves the shelf; the book flies into it.
        void flight().then((f) =>
          f.take(spec(w), el, () => stageElRef.current, quick, () => {
            setCarriedId(w.id);
            open(w.id, null);
          })
        );
      } else open(w.id, from);
    }
  });
  const isRoll = (w: Work) => manuscriptForm(w, author) === "roll";

  const spec = (w: Work): BookSpec => ({
    key: w.id,
    title: w.title,
    author: hasAttribution(w) ? shortAuthor(w, author) : author.name,
    cover: HUE_LEATHER[hue],
    surface: manuscriptForm(w, author) === "papyrus-codex" ? "papyrus" : "parchment",
    form: manuscriptForm(w, author) === "roll" ? "roll" : "codex",
    paras: () => loadBookText(w).then((t) => t.paras)
  });

  function open(id: string | null, from: DOMRect | null = null) {
    setOrigin(from);
    if (!id && pushedRef.current) {
      pushedRef.current = false;
      window.history.back();
      return;
    }
    const next = new URLSearchParams(params);
    if (id) next.set("work", id);
    else next.delete("work");
    // Opening pushes history so Back closes the book; stepping between books replaces it.
    const replace = Boolean(openId) || !id;
    if (id && !openId) pushedRef.current = true;
    setParams(next, { replace, preventScrollReset: true });
  }

  useEffect(() => {
    if (!openId) pushedRef.current = false;
  }, [openId]);

  const hovered = hoverId ? works.find((w) => w.id === hoverId) : undefined;
  const openWork = openId ? works.find((w) => w.id === openId) : undefined;

  if (!works.length) return null;

  return (
    <section className="bookcase" aria-labelledby="bookcase-title">
      <header className="bookcase-head">
        <div>
          <h2 id="bookcase-title">Writings</h2>
          <p className="bookcase-sum">
            {works.length} {works.length === 1 ? "work" : "works"} · {formatWords(totalWords)} · about{" "}
            {readingTime(totalWords)} of reading
          </p>
        </div>
        <div className="bookcase-view" role="group" aria-label="Show writings as">
          <button type="button" aria-pressed={view === "shelf"} onClick={() => chooseView("shelf")}>
            Shelf
          </button>
          <button type="button" aria-pressed={view === "list"} onClick={() => chooseView("list")}>
            List
          </button>
        </div>
      </header>

      {view === "shelf" ? (
        <div className="bookcase-frame" ref={trackRef}>
          <p className="bookcase-caption" aria-live="polite">
            {hovered ? (
              <>
                <strong>{hovered.title}</strong>
                <span>
                  {attributionLabel(hovered, author) ? attributionLabel(hovered, author) + " · " : ""}
                  {writingCategory(hovered.title)} · {formatWords(hovered.wordCount)} · {readingTime(hovered.wordCount)}
                </span>
              </>
            ) : (
              <span>Pick a book off the shelf.</span>
            )}
          </p>
          {groups.map((group) => (
            <div className="bookcase-group" key={group.id}>
              <p className="bookcase-label">
                {group.label}
                <span>{group.works.length}</span>
              </p>
              {packRows(group.works.filter((w) => !isRoll(w)), bins, width).map((row, i) => (
                <div className="bookcase-shelf" key={group.id + i}>
                  <div className="lib-shelf-books">
                    {row.map((w) => (
                      <BookSpine
                        key={w.id}
                        work={w}
                        author={author}
                        bin={bins.get(w.id) ?? 5}
                        century={workCentury(w, author) ?? century}
                        centuryKnown={workCentury(w, author) !== null}
                        periodId={periodId}
                        hue={hue}
                        keyWork={group.id === "start-here"}
                        {...handlers(w)}
                      />
                    ))}
                  </div>
                  <div className="lib-plank" aria-hidden="true" />
                </div>
              ))}
              {group.works.some(isRoll) ? (
                <div className="bookcase-shelf">
                  <div className="lib-shelf-books roll-shelf">
                    {group.works.filter(isRoll).map((w) => (
                      <RollSlot key={w.id} work={w} author={author} {...handlers(w)} />
                    ))}
                  </div>
                  <div className="lib-plank" aria-hidden="true" />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="bookcase-list">
          {groups.map((group) => (
            <div className="bookcase-list-group" key={group.id}>
              <h3>{group.label}</h3>
              <ul>
                {group.works.map((w) => (
                  <li key={w.id}>
                    <button type="button" onClick={() => open(w.id)}>
                      <span className="bookcase-list-title">{w.title}</span>
                      <span className="bookcase-list-meta">
                        {attributionLabel(w, author) ? attributionLabel(w, author) + " · " : ""}
                        {w.chapters > 1 ? w.chapters + " parts · " : ""}
                        {formatWords(w.wordCount)} · {readingTime(w.wordCount)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {openWork ? (
        <BookViewer
          work={openWork}
          author={author}
          works={ordered}
          periodId={periodId}
          origin={origin}
          carried={carriedId === openWork.id}
          onStageEl={(el) => (stageElRef.current = el)}
          onTurn={(dir) => void flightRef.current?.then((f) => f.turn(dir))}
          onHandOver={() => {
            // The book landed and the manuscript page has faded in over it: the carried book goes.
            void flightRef.current?.then((f) => f.close());
            setCarriedId(null);
          }}
          onClose={() => {
            void flightRef.current?.then((f) => f.close());
            setCarriedId(null);
            open(null);
          }}
          onStep={(id) => {
            // Stepping to another book: the carried one goes; the viewer draws the next itself.
            void flightRef.current?.then((f) => f.close());
            setCarriedId(null);
            open(id);
          }}
        />
      ) : null}
    </section>
  );
}
