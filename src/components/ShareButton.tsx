import { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { CARD_H, CARD_W } from "../lib/typeShare";
import "../styles/share.css";

/** The share picture as a PNG, drawn in the browser from the same SVG the build uses for link previews. */
function cardPng(svg: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = CARD_W;
      canvas.height = CARD_H;
      canvas.getContext("2d")?.drawImage(img, 0, 0, CARD_W, CARD_H);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("no picture"))), "image/png");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("no picture"));
    };
    img.src = url;
  });
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** What is shared: its name, its page, and its picture as SVG. */
export type Shareable = { title: string; path: string; svg: () => string };

/**
 * Share a diagram, two ways only: copy its link (a type's link shows its diagram where it is pasted),
 * or save the diagram as a picture.
 */
export function ShareButton({ share, small }: { share: Shareable; /** icon only, for a narrow panel */ small?: boolean }) {
  const { showToast } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const link = window.location.origin + share.path;

  function done(message: string) {
    setOpen(false);
    showToast(message);
  }

  async function savePicture() {
    try {
      const url = URL.createObjectURL(await cardPng(share.svg()));
      const a = document.createElement("a");
      a.href = url;
      a.download = "patrista-" + (share.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "share") + ".png";
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
      done("Picture saved");
    } catch {
      done("The picture could not be made");
    }
  }

  return (
    <div className={"share" + (small ? " is-small" : "")} ref={ref}>
      <button type="button" className="share-btn" title="Share" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 15V3M7.5 7.5 12 3l4.5 4.5M5 12v7a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-7" />
        </svg>
        Share
      </button>
      {open ? (
        <div className="share-menu" role="menu" aria-label={"Share " + share.title}>
          <p className="share-what">{share.title}</p>
          <button type="button" role="menuitem" onClick={async () => done((await copyText(link)) ? "Link copied" : "Could not copy the link")}>
            Copy link
          </button>
          <button type="button" role="menuitem" onClick={savePicture}>
            Save picture
          </button>
        </div>
      ) : null}
    </div>
  );
}
