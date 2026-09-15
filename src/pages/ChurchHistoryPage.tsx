import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { SceneDefs, Theatre } from "../components/history/scenes";
import { mountChromeCover, mountTheatreScroll } from "../lib/scrollScene";
import {
  ACT_ONE_SCENES as ACT_ONE,
  CHURCH_HISTORY_CANONICAL_PATH,
  CHURCH_HISTORY_DESCRIPTION,
  CHURCH_HISTORY_TITLE
} from "../../server/churchHistory";
import { useApp } from "../context/AppContext";

/**
 * Point the document title, meta description and canonical at this route, and
 * put them back on the way out.
 */
function useDocumentMeta(title: string, description: string, canonical: string): void {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    const foundDesc = document.head.querySelector('meta[name="description"]');
    const desc = foundDesc instanceof HTMLMetaElement ? foundDesc : document.createElement("meta");
    const madeDesc = desc !== foundDesc;
    if (madeDesc) {
      desc.setAttribute("name", "description");
      document.head.appendChild(desc);
    }
    const prevDesc = desc.getAttribute("content");
    desc.setAttribute("content", description);

    const foundLink = document.head.querySelector('link[rel="canonical"]');
    const link = foundLink instanceof HTMLLinkElement ? foundLink : document.createElement("link");
    const madeLink = link !== foundLink;
    if (madeLink) {
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    const prevHref = link.getAttribute("href");
    link.setAttribute("href", canonical);

    return () => {
      document.title = prevTitle;
      if (madeDesc) desc.remove();
      else if (prevDesc !== null) desc.setAttribute("content", prevDesc);
      if (madeLink) link.remove();
      else if (prevHref !== null) link.setAttribute("href", prevHref);
    };
  }, [title, description, canonical]);
}

export function ChurchHistoryPage() {
  const { setActivePassage } = useApp();
  const cinematicRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const sentToTimeline = useRef(false);

  useEffect(() => {
    setActivePassage(null);
  }, [setActivePassage]);

  useEffect(() => {
    document.body.classList.add("ch-history-cinematic");
    return () => {
      document.body.classList.remove("ch-history-cinematic", "ch-dark", "ch-dark-peek");
    };
  }, []);

  useEffect(() => {
    const el = cinematicRef.current;
    if (!el) return;
    const theatre = el.querySelector<HTMLElement>(".ch-theatre");
    if (!theatre) return;
    const stopScenes = mountTheatreScroll(theatre);
    const stopCover = mountChromeCover(theatre);
    // Enter already in the black: no eras header above the stage.
    document.body.classList.add("ch-dark");
    return () => {
      stopScenes();
      stopCover();
    };
  }, []);

  useEffect(() => {
    const hint = hintRef.current;
    if (!hint) return;
    function onScroll() {
      hint!.classList.toggle("ch-scroll-hint--gone", window.scrollY > 48);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = cinematicRef.current;
    if (!el) return;
    const exit = el.parentElement?.querySelector<HTMLElement>("[data-ch-exit]");
    if (!exit) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (sentToTimeline.current) return;
        if (entry.isIntersecting && entry.intersectionRatio > 0.2) {
          sentToTimeline.current = true;
          navigate("/church-history/timeline", { replace: false });
        }
      },
      { threshold: [0, 0.2, 0.5] }
    );
    io.observe(exit);
    return () => io.disconnect();
  }, [navigate]);

  const origin = typeof window === "undefined" ? "https://patrista.com" : window.location.origin;
  useDocumentMeta(CHURCH_HISTORY_TITLE, CHURCH_HISTORY_DESCRIPTION, origin + CHURCH_HISTORY_CANONICAL_PATH);

  return (
    <div className="ch-page ch-page--cinematic">
      <div className="ch-scroll-hint" ref={hintRef} aria-hidden="true">
        <span className="ch-scroll-hint-label">Scroll</span>
        <svg className="ch-scroll-hint-arrow" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M6 13l6 6 6-6" />
        </svg>
      </div>
      <div className="ch-cinematic" ref={cinematicRef}>
        <SceneDefs />
        <Theatre shots={ACT_ONE} />
      </div>
      {/* Room past the Act so the stage can leave the viewport; intersecting this hands off to Timeline. */}
      <div className="ch-cinematic-exit" data-ch-exit aria-hidden="true" />
    </div>
  );
}
