import { useEffect, useRef, useState } from "react";
import type { ManuscriptPage } from "../../data/manuscripts";
import ManuscriptLeaf, { type LeafState } from "./ManuscriptLeaf";

/** A real manuscript page, as a leaf you can tilt, zoom and light. Lazy-loaded with three.js. */
export default function ManuscriptView({ page, title, onClose }: { page: ManuscriptPage; title: string; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [state, setState] = useState<LeafState>("loading");

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey, true);
    };
  }, [onClose]);

  return (
    <div className="mv" role="dialog" aria-modal="true" aria-labelledby="mv-title">
      <button type="button" className="mv-backdrop" tabIndex={-1} aria-label="Close" onClick={onClose} />
      <div className="mv-card">
        <button type="button" className="bv-close" ref={closeRef} aria-label="Close manuscript" onClick={onClose}>
          ×
        </button>
        <div className={"mv-stage is-" + state}>
          <ManuscriptLeaf className="mv-canvas" page={page} onState={setState} />
          {state === "loading" ? <p className="mv-status">Fetching the page from {page.library}…</p> : null}
          {state === "error" ? (
            <p className="mv-status">
              The library's image server did not answer. <a href={page.viewer}>Open it in their viewer</a> instead.
            </p>
          ) : null}
          {state === "ready" ? <p className="mv-tip">Move the pointer to move the lamp · drag to tilt · scroll to look closer</p> : null}
        </div>
        <aside className="mv-info">
          <p className="bv-kicker">The manuscript</p>
          <h2 id="mv-title">{title}</h2>
          <p className="mv-shows">{page.shows}</p>
          <dl className="mv-facts">
            <div>
              <dt>Library</dt>
              <dd>{page.library}</dd>
            </div>
            <div>
              <dt>Shelfmark</dt>
              <dd>{page.shelfmark}</dd>
            </div>
            <div>
              <dt>Written</dt>
              <dd>
                {page.date}
                {page.place ? ", " + page.place : ""}
              </dd>
            </div>
            <div>
              <dt>Language</dt>
              <dd>{page.language}</dd>
            </div>
          </dl>
          <p className="mv-why">
            This is how the text actually reached us: copied by hand, page by page, centuries after it was written. The
            English you read on Patrista was translated from copies like this one.
          </p>
          <p className="mv-links">
            <a href={page.viewer} target="_blank" rel="noopener">
              See the whole book at the library ↗
            </a>
          </p>
          <p className="mv-rights">
            Image: {page.library}.{" "}
            <a href={page.rights.href} target="_blank" rel="noopener">
              {page.rights.label}
            </a>
            .
          </p>
        </aside>
      </div>
    </div>
  );
}
