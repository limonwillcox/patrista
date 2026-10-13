import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { fatherEntry, fatherSections } from "../lib/fathersDirectory";
import { FATHER_PROFILES } from "../lib/fatherProfiles";

function FatherPortrait({ id, variant }: { id: string; variant: "tile" | "hero" }) {
  const [failed, setFailed] = useState(false);
  const className = variant === "tile" ? "fathers-portrait" : "fathers-hero-photo";
  if (failed) {
    return (
      <div className={className + " fathers-portrait-fallback"} aria-hidden="true">
        <svg viewBox="0 0 64 48">
          <path d="M6 30c8-2 14-10 18-16 3-6 10-8 18-8 1 6-2 11-7 14 6 2 12 6 15 11-8 1-14-2-19-6-2 6-7 11-13 13l-4 8 1-8C10 36 6 33 6 30z" />
          <circle cx="40" cy="14" r="1.4" fill="currentColor" stroke="none" />
        </svg>
      </div>
    );
  }
  return (
    <img
      className={className}
      alt=""
      src={"/assets/fathers/" + id + ".jpg"}
      onError={() => setFailed(true)}
    />
  );
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
    const previous = document.title;
    if (!authorId) document.title = "Fathers — Patrista";
    else if (catalog) {
      const author = catalog.authors.find((a) => a.id === authorId);
      document.title = (author ? author.name : "Fathers") + " — Patrista";
    }
    return () => {
      document.title = previous;
    };
  }, [authorId, catalog]);

  if (catalogError) return <p className="empty">{catalogError}</p>;
  if (!catalog) return <p className="empty">Loading library…</p>;

  if (authorId) {
    const author = catalog.authors.find((a) => a.id === authorId);
    if (!author) {
      return (
        <div className="fathers-page">
          <p className="fathers-missing">
            This name is not in the library. <Link to="/fathers">Back to Fathers</Link>
          </p>
        </div>
      );
    }
    const entry = fatherEntry(author, FATHER_PROFILES[author.id]);
    const works = catalog.works
      .filter((w) => w.author === author.id)
      .slice()
      .sort((a, b) => a.title.localeCompare(b.title));
    return (
      <div className="fathers-page fathers-page--profile">
        <header className="fathers-hero">
          <div className="fathers-hero-inner">
            <FatherPortrait id={author.id} variant="hero" />
            <div className="fathers-hero-copy">
              <p className="fathers-back">
                <Link to="/fathers">Fathers</Link>
              </p>
              <h1>{entry.name}</h1>
              <p className="fathers-hero-office">{entry.office}</p>
            </div>
          </div>
        </header>
        <article className="fathers-bio">
          <div className="fathers-bio-col">
            {entry.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {works.length > 0 ? (
              <>
                <h2 className="fathers-writings-title">Writings</h2>
                <ul className="fathers-writings">
                  {works.map((work) => (
                    <li key={work.id}>
                      <Link to={"/read?work=" + encodeURIComponent(work.id)}>{work.title}</Link>
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
              {section.fathers.map((father) => (
                <li key={father.id} className="fathers-card">
                  <Link className="fathers-card-link" to={"/fathers/" + father.id}>
                    <FatherPortrait id={father.id} variant="tile" />
                    <h3 className="fathers-name">{father.name}</h3>
                    <p className="fathers-office">{father.office}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}
      <p className="fathers-credit">
        Portraits from{" "}
        <a href="https://commons.wikimedia.org/" rel="noreferrer">
          Wikimedia Commons
        </a>
        .
      </p>
    </div>
  );
}
