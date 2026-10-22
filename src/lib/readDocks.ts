export type ReadDockId = "chapter" | "dictionary";

export const READ_DOCK_EVENT = "piblia:read-dock";

export function chapterDockLabel(heading: string, chapter: number): string {
  const t = heading.trim();
  return t || "Ch. " + chapter;
}

export function chapterAtReadingLine(
  sections: { chapter: number; top: number; bottom: number }[],
  lineY: number
): number | null {
  if (!sections.length) return null;
  let containing: number | null = null;
  let above: number | null = null;
  for (const sec of sections) {
    if (sec.top <= lineY && sec.bottom > lineY) containing = sec.chapter;
    if (sec.top <= lineY) above = sec.chapter;
  }
  return containing ?? above ?? sections[0].chapter;
}

const listeners = new Set<ReadDockListener>();

export function announceReadDock(dock: ReadDockId): void {
  listeners.forEach((listener) => listener(dock));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(READ_DOCK_EVENT, { detail: { dock } }));
  }
}

export type ReadDockListener = (dock: ReadDockId) => void;

export function subscribeReadDock(listener: ReadDockListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
