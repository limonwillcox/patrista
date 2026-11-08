import { useEffect, useRef } from "react";
import { MANUSCRIPT_VIEW_WIDTH, manuscriptImage, type ManuscriptPage } from "../../data/manuscripts";
import { buildLeaf, type LeafHandle } from "../../three/leaf";
import { createStage } from "../../three/stage";

export type LeafState = "loading" | "ready" | "error";

/**
 * A real manuscript page drawn as a leaf you can tilt, zoom and light, filling `className`'s box.
 * Shared by the manuscript dialog and the book viewer's stage. Lazy-loaded with three.js.
 * `timeout`: give up after this many ms. Library servers sometimes never answer, and a caller
 * with something else to show is better off showing it.
 */
export default function ManuscriptLeaf({
  page,
  className,
  timeout,
  onState
}: {
  page: ManuscriptPage;
  className?: string;
  timeout?: number;
  onState: (state: LeafState) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const onStateRef = useRef(onState);
  onStateRef.current = onState;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let live = true;
    let failed = false;
    let handle: LeafHandle | null = null;
    const fail = () => {
      if (!live || failed) return;
      failed = true;
      onStateRef.current("error");
    };
    onStateRef.current("loading");
    const stage = createStage(host, { fov: 30, near: 0.05 });
    const timer = timeout ? window.setTimeout(fail, timeout) : 0;
    buildLeaf(stage, { url: manuscriptImage(page, MANUSCRIPT_VIEW_WIDTH), onError: fail }).then((h) => {
      handle = h;
      window.clearTimeout(timer);
      if (!live) h.dispose();
      // A page that arrives after the timeout stays unshown: the caller has moved on.
      else if (!failed) onStateRef.current("ready");
    });
    return () => {
      live = false;
      window.clearTimeout(timer);
      handle?.dispose();
      stage.dispose();
    };
  }, [page, timeout]);

  return <div className={className} ref={hostRef} role="img" aria-label={"Manuscript page: " + page.shows} />;
}
