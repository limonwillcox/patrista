import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { ManuscriptPage } from "../../data/manuscripts";
import { useManuscripts } from "../../lib/useManuscripts";
import { webglAvailable } from "../../three/support";
import "../../styles/manuscript-stage.css";

const loadView = () => import("./ManuscriptView");
const ManuscriptView = lazy(loadView);

/**
 * Library image servers build each image on request and often take several seconds. Start the
 * download before the click, with the same URL and CORS mode as the viewer's texture loader, so
 * the browser hands the viewer the finished image. Returns a function that cancels the download.
 */
function prefetch(src: string): () => void {
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (conn?.saveData) return () => {};
  void loadView();
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  return () => {
    // An image that has not finished yet stops downloading when its source is cleared.
    if (!img.complete) img.src = "";
  };
}

/**
 * "See the manuscript", for works we have a real manuscript page for. Without WebGL it links to the library.
 * `prefetchOn`: "mount" starts the image download when the button appears (the book viewer, where the
 * reader is already looking at this one book); "hover" waits for the pointer or keyboard focus.
 */
export function ManuscriptButton({
  workId,
  title,
  className,
  prefetchOn = "hover"
}: {
  workId: string;
  title: string;
  className?: string;
  prefetchOn?: "mount" | "hover";
}) {
  const [open, setOpen] = useState(false);
  const manuscripts = useManuscripts();
  const page: ManuscriptPage | undefined = manuscripts?.MANUSCRIPTS[workId];
  const has3d = webglAvailable();
  const started = useRef<string | null>(null);
  const cancel = useRef<() => void>(() => {});

  function warm() {
    if (!page || !manuscripts || !has3d || started.current === workId) return;
    started.current = workId;
    cancel.current = prefetch(manuscripts.manuscriptImage(page, manuscripts.MANUSCRIPT_VIEW_WIDTH));
  }

  useEffect(() => {
    if (prefetchOn !== "mount" || !page || !has3d) return;
    // Wait a moment: someone stepping quickly through books should not start a download for each.
    const t = window.setTimeout(warm, 700);
    return () => {
      window.clearTimeout(t);
      if (started.current === workId) {
        cancel.current();
        started.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workId, prefetchOn, page]);

  if (!page) return null;
  if (!has3d) {
    return (
      <a className={className} href={page.viewer} target="_blank" rel="noopener">
        See the manuscript ↗
      </a>
    );
  }
  return (
    <>
      <button type="button" className={className} onPointerEnter={warm} onFocus={warm} onClick={() => setOpen(true)}>
        See the manuscript
      </button>
      {open ? (
        <Suspense fallback={null}>
          <ManuscriptView page={page} title={title} onClose={() => setOpen(false)} />
        </Suspense>
      ) : null}
    </>
  );
}
