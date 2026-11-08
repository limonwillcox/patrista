import { lazy, Suspense, useState } from "react";
import type { ManuscriptPage } from "../../data/manuscripts";
import type { LeafState } from "./ManuscriptLeaf";
import "../../styles/manuscript-stage.css";

const ManuscriptLeaf = lazy(() => import("./ManuscriptLeaf"));

/** Library servers can take several seconds; past this the viewer stays with the generated book. */
const GIVE_UP_MS = 30000;

/**
 * A real manuscript page on the book viewer's stage, with a short caption: where the book is kept,
 * when it was written, what the page shows, and the library's rights statement.
 */
export function ManuscriptFigure({ page, onState }: { page: ManuscriptPage; onState: (state: LeafState) => void }) {
  const [ready, setReady] = useState(false);
  return (
    <figure className={"ms-stage ms-stage--leaf" + (ready ? " is-ready" : "")}>
      <Suspense fallback={<div className="ms-canvas" />}>
        <ManuscriptLeaf
          className="ms-canvas"
          page={page}
          timeout={GIVE_UP_MS}
          onState={(s) => {
            setReady(s === "ready");
            onState(s);
          }}
        />
      </Suspense>
      <figcaption className="ms-caption msl-caption">
        <strong>The manuscript · {page.language}</strong>
        <span className="msl-where">
          {page.shelfmark} · {page.date}
          {page.place ? ", " + page.place : ""}
        </span>
        <span className="msl-shows">{page.shows}</span>
        <span className="msl-credit">
          {page.library} ·{" "}
          <a href={page.rights.href} target="_blank" rel="noopener">
            {page.rights.label}
          </a>{" "}
          ·{" "}
          <a href={page.viewer} target="_blank" rel="noopener">
            Whole book ↗
          </a>
        </span>
        <span className="ms-hint msl-hint">Drag to tilt · scroll to look closer</span>
      </figcaption>
    </figure>
  );
}
