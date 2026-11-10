import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { HERO_SIZES, TILE_SIZES, fatherImage, type FatherImage, type FatherImageCredit } from "../lib/fatherImages";
import { Bookcase } from "../components/shelf/Bookcase";
import { ScholarsDirectory } from "../components/fathers/ScholarsDirectory";
import { JOURNEYS, type Journey } from "../data/journeys";
import { webglAvailable } from "../three/support";
import { SECTION_NOTES, fatherEntry, fatherSections, sectionMark, type FatherEntry } from "../lib/fathersDirectory";
import { centuryBlocks } from "../lib/centuries";
import { readLinks, type HistoryEra } from "../../server/churchHistory";
import { formatWords } from "../lib/keyWorks";
import { FATHER_PROFILES } from "../lib/fatherProfiles";
import {
  FATHERS_INDEX_DESCRIPTION,
  FATHERS_INDEX_PATH,
  FATHERS_INDEX_TITLE,
  answerFirstBio,
  fatherProfileDescription,
  fatherProfileJsonLd,
  fatherProfilePath,
  fatherProfileTitle,
  fathersIndexJsonLd
} from "../lib/fatherPageMeta";
import { useScholarsUi } from "../lib/scholarsUi";
import sameAsData from "../data/fatherSameAs.json";

const SAME_AS = sameAsData as Record<string, string[]>;

const JourneyGlobe = lazy(() => import("../components/journey/JourneyGlobe"));

/** Without WebGL the journey is a plain list of stops, with the same sources. */
function JourneyList({ journey }: { journey: Journey }) {
  return (
    <section className="journey journey--list" aria-labelledby="journey-title">
      <h2 id="journey-title">{journey.title}</h2>
      <p>{journey.summary}</p>
      <ol>
        {journey.stops.map((s) => (
          <li key={s.id}>
            <strong>{s.name}</strong> ({s.today}) — {s.text}{" "}
            {s.sources.map((src, i) => (
              <span key={src.label + src.href}>
                {i ? ", " : ""}
                <Link to={src.href}>{src.label}</Link>
              </span>
            ))}
          </li>
        ))}
      </ol>
      <p className="journey-note">{journey.note}</p>
    </section>
  );
}

function Portrait({ image, variant, eager }: { image: FatherImage | null; variant: "tile" | "hero"; eager: boolean }) {
  const [failed, setFailed] = useState(false);
  if (!image || failed) return null;
  const spec = variant === "tile" ? image.tile : image.hero;
  return (
    <img
      className={variant === "tile" ? "fathers-portrait" : "fathers-hero-photo"}
      alt={image.alt}
      src={spec.src}
      srcSet={spec.srcset}
      sizes={variant === "tile" ? TILE_SIZES : HERO_SIZES}
      width={spec.width}
      height={spec.height}
      decoding="async"
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      onError={() => setFailed(true)}
    />
  );
}

function CreditLine({ credit, className }: { credit: FatherImageCredit | null; className: string }) {
  if (!credit || !credit.attributionRequired) return null;
  return (
    <p className={className}>
      {credit.artist || "Unknown artist"},{" "}
      {credit.licenseUrl ? <a href={credit.licenseUrl}>{credit.license || "license"}</a> : credit.license || "license"},
      via {credit.source ? <a href={credit.source}>Wikimedia Commons</a> : "Wikimedia Commons"}.
    </p>
  );
}

function Facts({ dates, office, region }: { dates: string; office: string; region: string }) {
  const rows: [string, string][] = [];
  if (dates) rows.push(["Dates", dates]);
  if (office) rows.push(["Role", office]);
  if (region) rows.push(["Region", region]);
  if (!rows.length) return null;
  return (
    <dl className="fathers-facts">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function setHead(title: string, description: string, canonicalHref: string) {
  document.title = title;
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute("content", description);
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("href", canonicalHref);
}

export function FathersPage() {
  const { authorId } = useParams();
  const { catalog, catalogError, setActivePassage } = useApp();
  const [scholarsOn] = useScholarsUi();
  const { hash } = useLocation();

  useEffect(() => {
    setActivePassage(null);
  }, [setActivePassage]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [authorId]);

  useEffect(() => {
    const origin = window.location.origin;
    const prevTitle = document.title;
    const meta = document.querySelector('meta[name="description"]');
    const prevDescription = meta?.getAttribute("content") ?? "";
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    const prevCanonical = existingCanonical?.getAttribute("href") ?? "";
    let title = FATHERS_INDEX_TITLE;
    let description = FATHERS_INDEX_DESCRIPTION;
    let canonicalHref = origin + FATHERS_INDEX_PATH;
    let json: unknown = fathersIndexJsonLd(origin, []);
    if (catalog && !authorId) {
      const people = fatherSections(catalog.authors).flatMap((section) =>
        section.fathers.map((father) => ({
          name: father.name,
          path: fatherProfilePath(father.id)
        }))
      );
      json = fathersIndexJsonLd(origin, people);
    } else if (catalog && authorId) {
      const author = catalog.authors.find((item) => item.id === authorId);
      if (author) {
        const entry = fatherEntry(author, FATHER_PROFILES[author.id]);
        const bio = answerFirstBio(entry.paragraphs);
        title = fatherProfileTitle(entry.name, entry.dates);
        description = fatherProfileDescription(bio.lede || entry.name);
        const path = fatherProfilePath(author.id);
        canonicalHref = origin + path;
        json = fatherProfileJsonLd({
          origin,
          name: entry.name,
          path,
          description,
          dates: entry.dates,
          office: entry.office,
          region: entry.region,
          sameAs: SAME_AS[author.id] || [],
          kind: FATHER_PROFILES[author.id]?.kind
        });
      }
    }
    setHead(title, description, canonicalHref);
    let script = document.getElementById("father-jsonld");
    if (!script) {
      script = document.createElement("script");
      script.id = "father-jsonld";
      script.setAttribute("type", "application/ld+json");
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(json);
    return () => {
      document.title = prevTitle;
      if (meta) meta.setAttribute("content", prevDescription);
      const link = document.querySelector('link[rel="canonical"]');
      if (!existingCanonical) link?.remove();
      else if (link) link.setAttribute("href", prevCanonical);
      script?.remove();
    };
  }, [authorId, catalog]);

  if (catalogError) return <p className="empty">{catalogError}</p>;
  if (!catalog) return <p className="empty">Loading library…</p>;
  if (authorId) return <FatherProfile catalog={catalog} authorId={authorId} />;
  if (scholarsOn && !hash) return <ScholarsDirectory catalog={catalog} />;
  return <FathersIndex catalog={catalog} />;
}

type LoadedCatalog = NonNullable<ReturnType<typeof useApp>["catalog"]>;

function FatherProfile({ catalog, authorId }: { catalog: LoadedCatalog; authorId: string }) {
  const author = catalog.authors.find((item) => item.id === authorId);
  const ordered = useMemo(() => fatherSections(catalog.authors).flatMap((s) => s.fathers), [catalog.authors]);
  const has3d = useMemo(() => webglAvailable(), []);
  const journey = JOURNEYS[authorId];
  if (!author) {
    return (
      <div className="fathers-page">
        <p className="fathers-missing">
          This name is not in the library. <Link to={FATHERS_INDEX_PATH}>Back to Fathers</Link>
        </p>
      </div>
    );
  }
  const entry = fatherEntry(author, FATHER_PROFILES[author.id]);
  const bio = answerFirstBio(entry.paragraphs);
  const image = fatherImage(author.id);
  const at = ordered.findIndex((f) => f.id === author.id);
  const before = at > 0 ? ordered[at - 1] : null;
  const after = at >= 0 && at < ordered.length - 1 ? ordered[at + 1] : null;
  return (
    <div className="fathers-page fathers-page--profile">
      <header className="fathers-hero">
        <div className="fathers-hero-inner">
          <div className="fathers-hero-photo-wrap">
            <Portrait image={image} variant="hero" eager />
            <CreditLine credit={image?.credit ?? null} className="fathers-hero-credit" />
          </div>
          <div className="fathers-hero-copy">
            <p className="fathers-back">
              <Link to={FATHERS_INDEX_PATH}>Fathers</Link>
            </p>
            <h1>{entry.name}</h1>
            <p className="fathers-hero-office">{entry.office}</p>
            {bio.lede ? <p className="fathers-lede">{bio.lede}</p> : null}
            <Facts dates={entry.dates} office={entry.office} region={entry.region} />
          </div>
        </div>
      </header>
      {bio.rest.length ? (
        <article className="fathers-bio">
          <div className="fathers-bio-col">
            {bio.rest.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </article>
      ) : null}
      {journey ? (
        has3d ? (
          <Suspense fallback={<JourneyList journey={journey} />}>
            <JourneyGlobe journey={journey} />
          </Suspense>
        ) : (
          <JourneyList journey={journey} />
        )
      ) : null}
      <Bookcase catalog={catalog} author={author} />
      <nav className="fathers-neighbours" aria-label="Fathers before and after">
        {before ? <NeighbourLink father={before} label="Earlier" /> : <span />}
        {after ? <NeighbourLink father={after} label="Later" /> : <span />}
      </nav>
    </div>
  );
}

function NeighbourLink({ father, label }: { father: FatherEntry; label: string }) {
  return (
    <Link className={"fathers-neighbour fathers-neighbour--" + label.toLowerCase()} to={fatherProfilePath(father.id)}>
      <span className="fathers-neighbour-label">{label}</span>
      <span className="fathers-neighbour-name">{father.name}</span>
      <span className="fathers-neighbour-dates">{father.dates}</span>
    </Link>
  );
}

/** What happened in a century: the church history timeline, folded into the Fathers page. */
function CenturyEvents({ events, catalog }: { events: HistoryEra[]; catalog: LoadedCatalog }) {
  return (
    <details className="fx-events">
      <summary className="fx-events-title">
        What happened{" "}
        <span>
          {events.length} {events.length === 1 ? "event" : "events"}
        </span>
      </summary>
      <ol className="fx-events-list">
        {events.map((era) => {
          const links = readLinks(catalog, era);
          return (
            <li className="fx-event" id={era.id} key={era.id}>
              <p className="fx-event-date">
                {era.datetime ? <time dateTime={era.datetime}>{era.display}</time> : era.display}
              </p>
              <h4 className="fx-event-title">{era.title}</h4>
              <p className="fx-event-body">{era.body}</p>
              {era.refs && era.refs.length ? <p className="fx-event-refs">{era.refs.join(" · ")}</p> : null}
              {links.length ? (
                <p className="fx-event-read">
                  <span>Read</span>{" "}
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
    </details>
  );
}

function FathersIndex({ catalog }: { catalog: LoadedCatalog }) {
  const sections = useMemo(() => centuryBlocks(catalog.authors), [catalog.authors]);
  const location = useLocation();
  // Old timeline links (/church-history/timeline#council-of-nicaea) land here with the event's id.
  useEffect(() => {
    const id = decodeURIComponent(location.hash.replace(/^#/, ""));
    if (!id) return;
    const t = window.setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;
      // An event sits in a folded century: unfold it before scrolling to the event.
      const fold = el.closest("details");
      if (fold) fold.open = true;
      el.scrollIntoView({ block: "start", inline: "start" });
    }, 60);
    return () => window.clearTimeout(t);
  }, [location.hash]);
  const stats = useMemo(() => {
    const works = new Map<string, number>();
    const words = new Map<string, number>();
    for (const w of catalog.works) {
      works.set(w.author, (works.get(w.author) || 0) + 1);
      words.set(w.author, (words.get(w.author) || 0) + w.wordCount);
    }
    return { works, words };
  }, [catalog.works]);
  const eagerIds = new Set(
    sections
      .flatMap((s) => s.fathers)
      .slice(0, 4)
      .map((f) => f.id)
  );

  return (
    <div className="fathers-page fathers-index">
      <header className="fx-hero">
        <p className="fx-kicker">Patrista</p>
        <blockquote className="fx-verse">
          <p>Knowing this first, that no prophecy of the scripture is of any private interpretation.</p>
          <p>
            For the prophecy came not in old time by the will of man: but holy men of God spake as they were moved by
            the Holy Ghost.
          </p>
          <cite>2 Peter 1:20–21</cite>
        </blockquote>
        <h1 className="sr-only">The Church Fathers</h1>
      </header>

      {sections.map((section) => {
        const workCount = section.fathers.reduce((n, f) => n + (stats.works.get(f.id) || 0), 0);
        return (
          <section key={section.id} id={"sec-" + section.id} className="fathers-section" aria-labelledby={section.id}>
            <div className="fathers-section-inner">
              <header className="fx-century-head">
                <span className="fx-century-mark" aria-hidden="true">
                  {sectionMark(section.id)}
                </span>
                <div>
                  <h2 id={section.id} className="fathers-century">
                    {section.title}
                  </h2>
                  <p className="fx-century-meta">
                    {[
                      section.fathers.length
                        ? section.fathers.length + (section.fathers.length === 1 ? " Father" : " Fathers")
                        : "",
                      workCount ? workCount + (workCount === 1 ? " work" : " works") : "",
                      section.events.length
                        ? section.events.length + (section.events.length === 1 ? " event" : " events")
                        : ""
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {SECTION_NOTES[section.id] ? <p className="fx-century-note">{SECTION_NOTES[section.id]}</p> : null}
                </div>
              </header>
              {section.fathers.length ? (
                <ul className="fathers-grid">
                  {section.fathers.map((father) => {
                    const image = fatherImage(father.id);
                    const n = stats.works.get(father.id) || 0;
                    return (
                      <li key={father.id} className="fathers-card">
                        <Link className="fathers-card-link" to={fatherProfilePath(father.id)}>
                          <span className="fathers-portrait-frame">
                            <Portrait image={image} variant="tile" eager={eagerIds.has(father.id)} />
                          </span>
                          <h3 className="fathers-name">{father.name}</h3>
                          <p className="fathers-office">{father.office}</p>
                          <p className="fathers-card-meta">
                            {father.dates ? <span>{father.dates}</span> : null}
                            {n ? (
                              <span>
                                {n} {n === 1 ? "work" : "works"} · {formatWords(stats.words.get(father.id) || 0)}
                              </span>
                            ) : null}
                          </p>
                        </Link>
                        <CreditLine credit={image?.credit ?? null} className="fathers-tile-credit" />
                      </li>
                    );
                  })}
                </ul>
              ) : null}
              {section.events.length ? <CenturyEvents events={section.events} catalog={catalog} /> : null}
            </div>
          </section>
        );
      })}
      <p className="fathers-credit">
        Portraits from <a href="https://commons.wikimedia.org/">Wikimedia Commons</a>.
      </p>
    </div>
  );
}
