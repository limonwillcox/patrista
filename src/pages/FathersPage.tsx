import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { readPath } from "../lib/workSlugs";
import { HERO_SIZES, TILE_SIZES, fatherImage, type FatherImage, type FatherImageCredit } from "../lib/fatherImages";
import { fatherEntry, fatherSections } from "../lib/fathersDirectory";
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
import sameAsData from "../data/fatherSameAs.json";

const SAME_AS = sameAsData as Record<string, string[]>;

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
      {credit.licenseUrl ? <a href={credit.licenseUrl}>{credit.license || "license"}</a> : credit.license || "license"}
      , via {credit.source ? <a href={credit.source}>Wikimedia Commons</a> : "Wikimedia Commons"}.
    </p>
  );
}

function Facts({ dates, office, region }: { dates: string; office: string; region: string }) {
  const rows: [string, string][] = [];
  if (dates) rows.push(["Dates", dates]);
  if (office) rows.push(["Role", office]);
  if (region) rows.push(["See", region]);
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
        section.fathers.map((father) => ({ name: father.name, path: fatherProfilePath(father.id) }))
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
          sameAs: SAME_AS[author.id] || []
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

  if (authorId) {
    const author = catalog.authors.find((item) => item.id === authorId);
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
    const works = catalog.works
      .filter((work) => work.author === author.id)
      .slice()
      .sort((a, b) => a.title.localeCompare(b.title));
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
        <article className="fathers-bio">
          <div className="fathers-bio-col">
            {bio.rest.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {works.length > 0 ? (
              <>
                <h2 className="fathers-writings-title">Writings</h2>
                <ul className="fathers-writings">
                  {works.map((work) => (
                    <li key={work.id}>
                      <Link to={readPath(work.id)}>{work.title}</Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        </article>
      </div>
    );
  }

  const sections = fatherSections(catalog.authors);
  const eagerIds = new Set<string>();
  for (const section of sections) {
    for (const father of section.fathers) {
      if (eagerIds.size < 4) eagerIds.add(father.id);
    }
  }
  return (
    <div className="fathers-page">
      <h1 className="fathers-sr">Fathers</h1>
      {sections.map((section) => (
        <section key={section.id} className="fathers-section" aria-labelledby={section.id}>
          <div className="fathers-section-inner">
            <h2 id={section.id} className="fathers-century">
              {section.title}
            </h2>
            <ul className="fathers-grid">
              {section.fathers.map((father) => {
                const image = fatherImage(father.id);
                return (
                  <li key={father.id} className="fathers-card">
                    <Link className="fathers-card-link" to={fatherProfilePath(father.id)}>
                      <Portrait image={image} variant="tile" eager={eagerIds.has(father.id)} />
                      <h3 className="fathers-name">{father.name}</h3>
                      <p className="fathers-office">{father.office}</p>
                    </Link>
                    <CreditLine credit={image?.credit ?? null} className="fathers-tile-credit" />
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ))}
      <p className="fathers-credit">
        Portraits from <a href="https://commons.wikimedia.org/">Wikimedia Commons</a>.
      </p>
    </div>
  );
}
