import { useRef, type MouseEvent } from "react";
import type { Author, Work } from "../../../server/types";

function hashOf(id: string, mod: number): number {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n * 31 + id.charCodeAt(i)) % 9973;
  return n % mod;
}

/**
 * A letter roll standing on the shelf, as rolls stood in their round cases: rolled papyrus tied with a
 * cord, the turned knobs of its rod at head and foot, a title tag (a sillybos) hanging from the head.
 */
export function RollSlot({
  work,
  author,
  selected,
  carry,
  onSelect,
  onDeselect,
  onOpen
}: {
  work: Work;
  author: Author;
  selected: boolean;
  carry: boolean;
  onSelect: (el: HTMLElement) => void;
  onDeselect: () => void;
  onOpen: (from: DOMRect | null, el: HTMLElement | null, quick: boolean) => void;
}) {
  const bodyRef = useRef<HTMLSpanElement>(null);
  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    const el = bodyRef.current;
    onOpen(el?.getBoundingClientRect() ?? null, carry ? el : null, true);
  }
  return (
    <a
      className={"lib-roll" + (selected ? " is-selected" : "")}
      href={"/read?work=" + encodeURIComponent(work.id)}
      aria-label={work.title + " — " + author.name}
      style={{
        // Rolls differ a little in height and girth, as real ones do.
        ["--rh" as string]: String(0.58 + hashOf(work.id, 6) * 0.02),
        ["--rw" as string]: 36 + hashOf(work.id + "~", 5) * 2 + "px"
      }}
      onMouseEnter={() => bodyRef.current && onSelect(bodyRef.current)}
      onMouseLeave={onDeselect}
      onFocus={() => bodyRef.current && onSelect(bodyRef.current)}
      onBlur={onDeselect}
      onClick={onClick}
    >
      <span className="lib-roll-body" ref={bodyRef} aria-hidden="true" />
      <span className="lib-roll-tag">{work.title}</span>
    </a>
  );
}
