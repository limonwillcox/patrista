import { useState, type ReactNode } from "react";
import { DOCKS_OPEN_MIN_WIDTH, readDockOpen, writeDockOpen } from "../lib/dockState";

/** A dock with an edge caret that slides it out of view and back. */
export function DockNotch({
  id,
  name,
  side = "right",
  children
}: {
  id: string;
  name: string;
  side?: "left" | "right";
  children: ReactNode;
}) {
  const [open, setOpen] = useState(() =>
    readDockOpen(id, undefined, typeof window === "undefined" || window.innerWidth >= DOCKS_OPEN_MIN_WIDTH)
  );
  const label = (open ? "Hide " : "Show ") + name;
  const pointsLeft = side === "right" ? !open : open;
  function toggle() {
    setOpen((was) => {
      writeDockOpen(id, !was);
      return !was;
    });
  }
  return (
    <div className={"dock-notched dock-notched--" + side + (open ? "" : " is-closed")}>
      <button type="button" className="dock-notch" aria-label={label} title={label} aria-expanded={open} onClick={toggle}>
        <Caret left={pointsLeft} />
      </button>
      <div className="dock-notched-body" aria-hidden={!open} inert={!open || undefined}>
        {children}
      </div>
    </div>
  );
}

function Caret({ left }: { left: boolean }) {
  return (
    <svg viewBox="0 0 16 16" width="10" height="10" aria-hidden="true">
      <path
        d={left ? "M10 3.5 5.5 8 10 12.5" : "M6 3.5 10.5 8 6 12.5"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
