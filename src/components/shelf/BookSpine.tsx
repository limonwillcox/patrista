import { useEffect, useRef, useState, type MouseEvent } from "react";
import { defaultBinWidthPx, spineBandPlace, type ShelfPeriodId, type SpineBin } from "../../../server/shelf";
import type { Author, Work } from "../../../server/types";
import { manuscriptForm } from "../../lib/manuscriptForm";

/** Gold Chi-Rho from the Patrista logo (no red plate). Square box + PNG so it never squashes. */
function SpineMark() {
  return <img className="lib-spine-mark" src="/assets/chi-rho-gold.png" alt="" width={16} height={16} draggable={false} />;
}

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

function spineFontPx(binWidth: number, title: string): number {
  const base = Math.min(20, Math.max(13, Math.round(binWidth * 0.42)));
  if (title.length > 42) return Math.max(10, base - 5);
  if (title.length > 32) return Math.max(11, base - 3);
  if (title.length > 22) return Math.max(12, base - 1);
  return base;
}

function hashOf(id: string, mod: number): number {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n * 31 + id.charCodeAt(i)) % 9973;
  return n % mod;
}

/** Leather colours for `authorHue`, matching the `.lib-book[data-hue]` spines in styles.css. */
export const HUE_LEATHER = ["#8a2a12", "#3d4f3a", "#4a2c1a", "#3d2463", "#1f4a5c", "#6b1c1c", "#5a3a08", "#2a2a2a"] as const;

/** Spine colour per Father, so one Father's shelf reads as a matched set. */
export function authorHue(id: string): number {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n + id.charCodeAt(i) * (i + 3)) % 8;
  return n;
}

export function BookSpine({
  work,
  author,
  bin,
  century,
  periodId,
  hue,
  selected,
  keyWork,
  carry = false,
  onSelect,
  onDeselect,
  onOpen
}: {
  work: Work;
  author: Author;
  bin: SpineBin;
  century: number;
  periodId: ShelfPeriodId;
  hue: number;
  selected: boolean;
  keyWork?: boolean;
  /** A 3D model of this book takes over on the shelf: the spine itself does no motion. */
  carry?: boolean;
  onSelect: (el: HTMLElement) => void;
  onDeselect: () => void;
  /**
   * Open the book. `from` is where its spine stands, `el` the spine itself; `quick` is a click (take it
   * at once) rather than a long point.
   */
  onOpen: (from: DOMRect | null, el: HTMLElement | null, quick: boolean) => void;
}) {
  const boxRef = useRef<HTMLSpanElement>(null);
  const [pulling, setPulling] = useState(false);
  /** A click takes the book off the shelf at once: the same pull, quicker, then the flight. */
  const [taking, setTaking] = useState(false);
  const takeTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(takeTimer.current), []);
  // Pointing at a book long enough takes it off the shelf: it slides out, then opens.
  useEffect(() => {
    setPulling(false);
    // A carried book's motion belongs to the 3D layer, which also decides when it leaves the shelf.
    if (!selected || taking || carry || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const pull = carry ? 0 : window.setTimeout(() => setPulling(true), 350);
    const take = window.setTimeout(() => onOpen(boxRef.current?.getBoundingClientRect() ?? null, boxRef.current, false), 1350);
    return () => {
      window.clearTimeout(pull);
      window.clearTimeout(take);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);
  const href = "/read?work=" + encodeURIComponent(work.id);
  // Before about 300 a codex had a soft leather cover wrapped round it, not stiff boards.
  const limp = manuscriptForm(work, author) === "papyrus-codex";
  const bandPlace = spineBandPlace(century);
  const binW = defaultBinWidthPx(bin);
  // Real shelves are uneven: each book stands 88–100% of the shelf height.
  const height = 88 + hashOf(work.id, 13);
  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    if (taking) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onOpen(null, null, true);
      return;
    }
    if (carry) {
      onOpen(boxRef.current?.getBoundingClientRect() ?? null, boxRef.current, true);
      return;
    }
    setTaking(true);
    takeTimer.current = window.setTimeout(() => {
      onOpen(boxRef.current?.getBoundingClientRect() ?? null, boxRef.current, true);
      setTaking(false);
    }, 420);
  }
  return (
    <a
      className={"lib-book" + (selected ? " is-selected" : "") + (pulling || taking ? " is-pulling" : "") + (taking ? " is-taking" : "") + (keyWork ? " is-key" : "") + (limp ? " lib-book--limp" : "") + (carry ? " can-carry" : "")}
      href={href}
      data-period={periodId}
      data-century={century}
      data-band-place={bandPlace}
      data-hue={hue}
      data-bin={bin}
      style={{
        width: binW,
        height: height + "%",
        ["--spine-size" as string]: spineFontPx(binW, work.title) + "px",
        ["--spine-mark" as string]: Math.max(10, Math.min(16, Math.round(binW * 0.48))) + "px",
        // Each volume was bound on its own: the same leather, a shade lighter or darker.
        ["--tone" as string]: String(0.84 + hashOf(work.id + "~", 9) * 0.035)
      }}
      aria-label={work.title + " — " + author.name}
      onMouseEnter={() => boxRef.current && onSelect(boxRef.current)}
      onMouseLeave={onDeselect}
      onFocus={() => boxRef.current && onSelect(boxRef.current)}
      onBlur={onDeselect}
      onClick={onClick}
    >
      <span className="lib-book-scene">
        <span className="lib-book-box" ref={boxRef}>
          <span className="lib-face lib-face-spine">
            <span className="lib-spine-band" aria-hidden="true" />
            <SpineMark />
            <span className="lib-spine-title">{work.title}</span>
            <span className="lib-spine-century" title={ROMAN[century] + " century"} aria-hidden="true">
              {ROMAN[century] || century}
            </span>
            <span className="lib-spine-band" aria-hidden="true" />
          </span>
          <span className="lib-face lib-face-front">
            <span className="lib-front-title">{work.title}</span>
            <span className="lib-front-author">{author.name}</span>
          </span>
          <span className="lib-face lib-face-pages" />
          <span className="lib-face lib-face-top" aria-hidden="true" />
        </span>
      </span>
    </a>
  );
}
