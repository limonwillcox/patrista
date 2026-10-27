import { useState, type ReactNode } from "react";
import { readDockOpen, writeDockOpen } from "../lib/dockState";

/** A dock with a tiny edge notch that slides it out of view and back. */
export function DockNotch({
  id,
  icon,
  name,
  side = "right",
  children
}: {
  id: string;
  icon: ReactNode;
  name: string;
  side?: "left" | "right";
  children: ReactNode;
}) {
  const [open, setOpen] = useState(() => readDockOpen(id));
  const label = (open ? "Hide " : "Show ") + name;
  function toggle() {
    setOpen((was) => {
      writeDockOpen(id, !was);
      return !was;
    });
  }
  return (
    <div className={"dock-notched dock-notched--" + side + (open ? "" : " is-closed")}>
      <button type="button" className="dock-notch" aria-label={label} title={label} aria-expanded={open} onClick={toggle}>
        {icon}
      </button>
      <div className="dock-notched-body" aria-hidden={!open} inert={!open || undefined}>
        {children}
      </div>
    </div>
  );
}

export const BookIcon = (
  <svg viewBox="0 0 16 16" width="10" height="10" aria-hidden="true">
    <path d="M2.5 3c2-.8 3.8-.6 5.5.6 1.7-1.2 3.5-1.4 5.5-.6v10c-2-.8-3.8-.6-5.5.6-1.7-1.2-3.5-1.4-5.5-.6zM8 3.6v10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);

export const GlassesIcon = (
  <svg viewBox="0 0 16 16" width="10" height="10" aria-hidden="true">
    <path d="M1.5 9a2.6 2.6 0 1 0 5.2 0 2.6 2.6 0 1 0-5.2 0zm7.8 0a2.6 2.6 0 1 0 5.2 0 2.6 2.6 0 1 0-5.2 0zM6.7 8.6c.8-.6 1.8-.6 2.6 0M1.6 8.4 2.6 5m11.8 3.4L13.4 5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);
