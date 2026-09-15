import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  deathCentury,
  defaultBinWidthPx,
  inspectTimelineEra,
  packAuthorCatalog,
  periodIdForAuthor,
  spineBandPlace,
  type PackedBook,
  type ShelfPeriodId
} from "../../../server/shelf";
import type { Author, Catalog, Work } from "../../../server/types";

const DESKTOP_MQ = "(min-width: 761px)";

export function useDesktopLibrary(): boolean {
  const [on, setOn] = useState(() => typeof window !== "undefined" && window.matchMedia(DESKTOP_MQ).matches);
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MQ);
    const onChange = () => setOn(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return on;
}

function formatWords(n: number): string {
  if (n >= 10000) return Math.round(n / 1000) + "k words";
  return n.toLocaleString() + " words";
}

function authorTint(id: string): number {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n + id.charCodeAt(i) * (i + 1)) % 5;
  return n;
}

/** Well-known shelf form. Full enough to read; no ellipsis. */
const SHELF_NAMES: Record<string, string> = {
  ambrose: "Ambrose",
  arnobius: "Arnobius",
  augustine: "Augustine",
  commodianus: "Commodianus",
  gregory: "Gregory the Great",
  gregory_thaumaturgus: "Gregory Thaumaturgus",
  methodius: "Methodius",
  jerome: "Jerome",
  lactantius: "Lactantius",
  leo: "Leo",
  minucius_felix: "Minucius Felix",
  novatian: "Novatian",
  sulpicius_severus: "Sulpicius",
  tertullian: "Tertullian",
  vincent: "Vincent",
  justin: "Justin",
  irenaeus: "Irenaeus",
  clement_rome: "Clement of Rome",
  ignatius: "Ignatius",
  polycarp: "Polycarp",
  hermas: "Hermas",
  barnabas: "Barnabas",
  didache: "Didache",
  papias: "Papias",
  mathetes: "Mathetes",
  tatian: "Tatian",
  theophilus: "Theophilus",
  athenagoras: "Athenagoras",
  clement_alexandria: "Clement of Alexandria",
  origen: "Origen",
  hippolytus: "Hippolytus",
  cyprian: "Cyprian",
  dionysius: "Dionysius",
  eusebius: "Eusebius",
  athanasius: "Athanasius",
  basil: "Basil",
  gregory_nazianzen: "Gregory Nazianzen",
  gregory_nyssa: "Gregory of Nyssa",
  chrysostom: "Chrysostom",
  cyril_jerusalem: "Cyril",
  hilary: "Hilary",
  john_damascus: "John of Damascus",
  socrates: "Socrates",
  sozomen: "Sozomen",
  theodoret: "Theodoret",
  rufinus: "Rufinus",
  cassian: "Cassian",
  ephraim: "Ephraim",
  aphrahat: "Aphrahat",
  councils: "Councils",
  apostolic: "Apostolic Fathers",
  unknown: "Unknown"
};

function shelfName(author: Author | undefined, id: string): string {
  return SHELF_NAMES[id] || author?.name || id;
}

function spineFontPx(binWidth: number, title: string): number {
  const base = Math.min(20, Math.max(13, Math.round(binWidth * 0.42)));
  if (title.length > 42) return Math.max(10, base - 5);
  if (title.length > 32) return Math.max(11, base - 3);
  if (title.length > 22) return Math.max(12, base - 1);
  return base;
}

function centuryLabel(n: number): string {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return n + "th";
}

/** Gold Chi-Rho from the Piblia logo (no red plate). Square box + PNG so it never squashes. */
function SpineMark() {
  return (
    <img
      className="lib-spine-mark"
      src="/assets/chi-rho-gold.png"
      alt=""
      width={16}
      height={16}
      draggable={false}
    />
  );
}

function SpineBands({ century, half }: { century: number; half?: "a" | "b" }) {
  const pairs =
    half === "a" ? Math.ceil(century / 2) : half === "b" ? Math.floor(century / 2) : century;
  return (
    <span className="lib-spine-bands" aria-hidden="true">
      {Array.from({ length: pairs }, (_, i) => (
        <span className="lib-spine-pair" key={i}>
          <i />
          <i />
        </span>
      ))}
    </span>
  );
}

type LibraryProps = { catalog: Catalog };

export function Library({ catalog }: LibraryProps) {
  const navigate = useNavigate();
  const trackRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1100);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inspectId, setInspectId] = useState<string | null>(null);
  const [coverOpen, setCoverOpen] = useState(false);
  const [expanding, setExpanding] = useState(false);
  const [activeCentury, setActiveCentury] = useState(1);

  const authorPacked = useMemo(() => packAuthorCatalog(catalog), [catalog]);
  const authors = useMemo(() => new Map(catalog.authors.map((a) => [a.id, a])), [catalog.authors]);
  const works = useMemo(() => new Map(catalog.works.map((w) => [w.id, w])), [catalog.works]);

  const byCentury = useMemo(() => {
    const map = new Map<number, typeof authorPacked>();
    for (const block of authorPacked) {
      const who = authors.get(block.authorId);
      if (!who) continue;
      const c = deathCentury(who.deathYear);
      const list = map.get(c);
      if (list) list.push(block);
      else map.set(c, [block]);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [authorPacked, authors]);

  const centuries = useMemo(() => byCentury.map(([c]) => c), [byCentury]);

  const flat = useMemo(
    () =>
      authorPacked.flatMap((a) => {
        const who = authors.get(a.authorId);
        const periodId = who ? periodIdForAuthor(who) : ("apostolic" as ShelfPeriodId);
        return a.shelves.flatMap((shelf) => shelf.map((book) => ({ book, periodId })));
      }),
    [authorPacked, authors]
  );

  useEffect(() => {
    document.body.classList.add("browse-library");
    return () => document.body.classList.remove("browse-library");
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => setWidth(Math.floor(el.clientWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!centuries.length) return;
    setActiveCentury((prev) => (centuries.includes(prev) ? prev : centuries[0]));
  }, [centuries]);

  useEffect(() => {
    const rows = trackRef.current?.querySelectorAll<HTMLElement>("[data-century-section]");
    if (!rows?.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        const raw = hit?.target.getAttribute("data-century-section");
        const n = raw ? Number(raw) : NaN;
        if (Number.isFinite(n)) setActiveCentury(n);
      },
      { rootMargin: "-140px 0px -45% 0px", threshold: 0.12 }
    );
    rows.forEach((row) => io.observe(row));
    return () => io.disconnect();
  }, [byCentury.length]);

  function indexOf(id: string | null): number {
    if (!id) return -1;
    return flat.findIndex((x) => x.book.workId === id);
  }

  function selectAt(i: number) {
    const item = flat[(i + flat.length) % flat.length];
    if (!item) return;
    setSelectedId(item.book.workId);
    if (inspectId) {
      setInspectId(item.book.workId);
      setCoverOpen(false);
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (inspectId) {
          setInspectId(null);
          setCoverOpen(false);
          setExpanding(false);
        }
        return;
      }
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const cur = indexOf(inspectId || selectedId);
        const next = cur < 0 ? 0 : cur + (e.key === "ArrowRight" ? 1 : -1);
        selectAt(next);
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const cur = indexOf(inspectId || selectedId);
        const dir = e.key === "ArrowDown" ? 1 : -1;
        const approxPerShelf = Math.max(6, Math.round(width / 64));
        selectAt(cur < 0 ? 0 : cur + dir * approxPerShelf);
      }
      if ((e.key === "Enter" || e.key === " ") && selectedId && !inspectId) {
        e.preventDefault();
        setInspectId(selectedId);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [flat, inspectId, selectedId, width]);

  function openInspect(id: string) {
    setSelectedId(id);
    setInspectId(id);
    setCoverOpen(false);
    setExpanding(false);
  }

  function goRead(id: string) {
    const href = "/read?work=" + encodeURIComponent(id);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      navigate(href);
      return;
    }
    setExpanding(true);
    window.setTimeout(() => navigate(href), 420);
  }

  function jumpToCentury(n: number) {
    setActiveCentury(n);
    const el = trackRef.current?.querySelector<HTMLElement>('[data-century-section="' + n + '"]');
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const inspectBook = inspectId ? works.get(inspectId) : undefined;
  const inspectAuthor = inspectBook ? authors.get(inspectBook.author) : undefined;
  const inspectPeriod = inspectId ? flat.find((x) => x.book.workId === inspectId)?.periodId : undefined;
  const inspectBin = inspectId ? flat.find((x) => x.book.workId === inspectId)?.book.bin : 5;

  return (
    <div className="library library--authors">
      <div className="lib-toolbar">
        <div className="lib-mode" role="tablist" aria-label="Century">
          {centuries.map((c) => (
            <button
              key={c}
              type="button"
              className={activeCentury === c ? "is-on" : ""}
              onClick={() => jumpToCentury(c)}
            >
              {centuryLabel(c)}
            </button>
          ))}
        </div>
        <p className="lib-century-caption">Century AD</p>
      </div>
      <div className="lib-track" ref={trackRef}>
        {byCentury.map(([century, blocks]) => (
          <div key={century} className="lib-century-block" data-century-section={century} id={"century-" + century}>
            {blocks.map((block) => {
              const author = authors.get(block.authorId);
              if (!author) return null;
              return (
                <AuthorSection
                  key={block.authorId}
                  author={author}
                  shelves={block.shelves}
                  catalogWorks={works}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onOpen={openInspect}
                />
              );
            })}
          </div>
        ))}
      </div>
      {inspectBook && inspectAuthor && inspectPeriod ? (
        <InspectOverlay
          work={inspectBook}
          author={inspectAuthor}
          periodId={inspectPeriod}
          bin={inspectBin || 5}
          coverOpen={coverOpen}
          expanding={expanding}
          onHoverBook={setCoverOpen}
          onClose={() => {
            setInspectId(null);
            setCoverOpen(false);
            setExpanding(false);
          }}
          onRead={() => goRead(inspectBook.id)}
        />
      ) : null}
    </div>
  );
}

function authorHue(id: string): number {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n + id.charCodeAt(i) * (i + 3)) % 8;
  return n;
}

function AuthorSection({
  author,
  shelves,
  catalogWorks,
  selectedId,
  onSelect,
  onOpen
}: {
  author: Author;
  shelves: PackedBook[][];
  catalogWorks: Map<string, Work>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onOpen: (id: string) => void;
}) {
  const hue = authorHue(author.id);
  const periodId = periodIdForAuthor(author);
  return (
    <section className="lib-author-section" data-author={author.id}>
      <header className="lib-author-head">
        <h2>{shelfName(author, author.id)}</h2>
        {author.dates ? <p>{author.dates}</p> : null}
      </header>
      {shelves.map((books, i) => (
        <div className="lib-poem-shelf" key={author.id + "-" + i}>
          <div className="lib-poem-line">
            <div className="lib-shelf-books">
              {books.map((book) => {
                const work = catalogWorks.get(book.workId);
                if (!work) return null;
                return (
                  <BookSpine
                    key={book.workId}
                    work={work}
                    author={author}
                    book={book}
                    periodId={periodId}
                    hue={hue}
                    selected={selectedId === book.workId}
                    onSelect={() => onSelect(book.workId)}
                    onDeselect={() => onSelect(null)}
                    onOpen={() => onOpen(book.workId)}
                  />
                );
              })}
            </div>
            <div className="lib-plank" aria-hidden="true" />
          </div>
        </div>
      ))}
    </section>
  );
}

function BookSpine({
  work,
  author,
  book,
  periodId,
  hue,
  selected,
  onSelect,
  onDeselect,
  onOpen
}: {
  work: Work;
  author: Author;
  book: PackedBook;
  periodId: ShelfPeriodId;
  hue?: number;
  selected: boolean;
  onSelect: () => void;
  onDeselect: () => void;
  onOpen: () => void;
}) {
  const href = "/read?work=" + encodeURIComponent(work.id);
  const century = deathCentury(author.deathYear);
  const bandPlace = spineBandPlace(century);
  const binW = defaultBinWidthPx(book.bin);
  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onOpen();
  }
  return (
    <a
      className={"lib-book" + (selected ? " is-selected" : "")}
      href={href}
      data-period={periodId}
      data-century={century}
      data-band-place={bandPlace}
      data-hue={hue == null ? undefined : hue}
      data-tint={hue == null ? authorTint(author.id) : undefined}
      data-bin={book.bin}
      style={{
        width: binW,
        ["--spine-size" as string]: spineFontPx(binW, work.title) + "px",
        ["--spine-mark" as string]: Math.max(10, Math.min(16, Math.round(binW * 0.48))) + "px"
      }}
      aria-label={work.title + " — " + author.name}
      onMouseEnter={onSelect}
      onMouseLeave={onDeselect}
      onFocus={onSelect}
      onBlur={onDeselect}
      onClick={onClick}
    >
      <span className="lib-book-scene">
        <span className="lib-book-box">
          <span className="lib-face lib-face-spine">
            <span className="lib-spine-head">
              <SpineMark />
              <span className="lib-spine-rule lib-spine-rule--crown" aria-hidden="true" />
              {bandPlace === "upper" ? <SpineBands century={century} /> : null}
              {bandPlace === "split" ? <SpineBands century={century} half="a" /> : null}
            </span>
            <span className="lib-spine-title">{work.title}</span>
            {bandPlace === "lower" ? (
              <span className="lib-spine-foot">
                <SpineBands century={century} />
              </span>
            ) : null}
            {bandPlace === "split" ? (
              <span className="lib-spine-foot">
                <SpineBands century={century} half="b" />
              </span>
            ) : null}
          </span>
          <span className="lib-face lib-face-front">
            {work.cover ? <img src={work.cover} alt="" /> : null}
            <span className="lib-front-title">{work.title}</span>
            <span className="lib-front-author">{author.name}</span>
          </span>
          <span className="lib-face lib-face-pages" />
        </span>
      </span>
    </a>
  );
}

function InspectOverlay({
  work,
  author,
  periodId,
  bin,
  coverOpen,
  expanding,
  onHoverBook,
  onClose,
  onRead
}: {
  work: Work;
  author: Author;
  periodId: ShelfPeriodId;
  bin: number;
  coverOpen: boolean;
  expanding: boolean;
  onHoverBook: (open: boolean) => void;
  onClose: () => void;
  onRead: () => void;
}) {
  const era = inspectTimelineEra(work.id, periodId, author.deathYear);
  return (
    <div className="lib-inspect" role="dialog" aria-modal="true" aria-labelledby="lib-inspect-title">
      <button type="button" className="lib-inspect-back" aria-label="Close" onClick={onClose} />
      <div className="lib-inspect-grid">
        <aside className="lib-inspect-author">
          <h2>{author.name}</h2>
          <p className="lib-inspect-meta">
            {author.dates}
            {author.region ? " · " + author.region : ""}
          </p>
          {author.bio ? <p>{author.bio}</p> : null}
        </aside>
        <div className="lib-inspect-stage">
          <button
            type="button"
            className={
              "lib-inspect-book" + (coverOpen ? " is-open" : "") + (expanding ? " is-expanding" : "")
            }
            data-period={periodId}
            style={{ ["--bin" as string]: String(bin) }}
            onMouseEnter={() => onHoverBook(true)}
            onMouseLeave={() => onHoverBook(false)}
            onClick={onRead}
          >
            <span className="lib-inspect-3d">
              <span className="lib-inspect-front">
                {work.cover ? <img src={work.cover} alt="" /> : null}
                <span className="lib-front-title">{work.title}</span>
                <span className="lib-front-author">{author.name}</span>
              </span>
              <span className="lib-inspect-page">
                <span id="lib-inspect-title">{work.title}</span>
                <span>{author.name}</span>
                <strong>Click to read</strong>
              </span>
            </span>
          </button>
        </div>
        <aside className="lib-inspect-era">
          <p className="lib-inspect-date">{era.display}</p>
          <h2>{era.title}</h2>
          <p>{era.body}</p>
        </aside>
        <div className="lib-inspect-blurb">
          {work.authorshipDisputed ? (
            <p className="lib-inspect-disputed">BE AWARE: Authorship Disputed</p>
          ) : null}
          <p>
            <strong>{work.title}</strong>
            {" · "}
            {work.series}
            {" · "}
            {work.chapters} {work.chapters === 1 ? "part" : "parts"}
            {" · "}
            {formatWords(work.wordCount)}
          </p>
          {work.blurb ? <p>{work.blurb}</p> : null}
        </div>
      </div>
    </div>
  );
}
