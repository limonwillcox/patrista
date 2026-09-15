import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  CHURCH_HISTORY_DESCRIPTION,
  CHURCH_HISTORY_TIMELINE_PATH,
  CHURCH_HISTORY_TITLE,
  PERIOD_BLURBS,
  PERIOD_LABELS,
  churchHistoryJsonLd,
  erasByPeriod,
  readLinks,
  type HistoryPeriod
} from "../../server/churchHistory";
import { useApp } from "../context/AppContext";

const PERIODS: HistoryPeriod[] = ["pre-nicene", "post-nicene"];

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

export function TimelinePage() {
  const { setActivePassage, catalog } = useApp();
  const location = useLocation();
  const jumpedHashRef = useRef<string | null>(null);

  useEffect(() => {
    setActivePassage(null);
  }, [setActivePassage]);

  useEffect(() => {
    const id = location.hash.replace(/^#/, "");
    if (!id) return;
    if (jumpedHashRef.current === id) return;
    const el = document.getElementById(id);
    if (el) {
      jumpedHashRef.current = id;
      const t = window.setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
      return () => window.clearTimeout(t);
    }
  }, [location.hash, catalog]);

  const origin = typeof window === "undefined" ? "https://piblia.com" : window.location.origin;
  useDocumentMeta(CHURCH_HISTORY_TITLE, CHURCH_HISTORY_DESCRIPTION, origin + CHURCH_HISTORY_TIMELINE_PATH);

  return (
    <div className="ch-page ch-page--timeline">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(churchHistoryJsonLd(origin)) }}
      />

      <h1>Church history timeline</h1>
      <p className="ch-lede">{CHURCH_HISTORY_DESCRIPTION}</p>

      {PERIODS.map((period) => (
        <section className="ch-period" key={period} aria-labelledby={period}>
          <h2 id={period}>{PERIOD_LABELS[period]}</h2>
          <p className="ch-period-blurb">{PERIOD_BLURBS[period]}</p>

          <ol className="ch-timeline">
            {erasByPeriod(period).map((era) => {
              const links = readLinks(catalog, era);
              return (
                <li className="ch-era" id={era.id} key={era.id}>
                  <p className="ch-era-date">
                    {era.datetime ? <time dateTime={era.datetime}>{era.display}</time> : era.display}
                  </p>
                  <h3>{era.title}</h3>
                  <p className="ch-era-body">{era.body}</p>
                  {era.refs && era.refs.length ? (
                    <p className="ch-era-refs">{era.refs.join(" · ")}</p>
                  ) : null}
                  {links.length ? (
                    <p className="ch-era-read">
                      <span className="ch-era-read-label">Read:</span>{" "}
                      {links.map((l, i) => (
                        <span key={l.href}>
                          {i > 0 ? ", " : null}
                          <Link to={l.href}>{l.name}</Link>
                        </span>
                      ))}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
