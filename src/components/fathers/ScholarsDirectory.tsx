import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { adDates } from "../../lib/adDates";
import { fatherProfilePath } from "../../lib/fatherPageMeta";
import { scholarCenturyId, scholarShelves, shelfCountLine, shelfPreview } from "../../lib/scholarShelves";

type LoadedCatalog = NonNullable<ReturnType<typeof useApp>["catalog"]>;

function ScholarsVerse() {
  return (
    <header className="fx-hero">
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
  );
}

export function ScholarsDirectory({ catalog }: { catalog: LoadedCatalog }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const shelves = useMemo(
    () => scholarShelves(catalog.authors, catalog.works),
    [catalog.authors, catalog.works]
  );
  const requested = scholarCenturyId(searchParams.toString());
  const open = shelves.find((shelf) => shelf.id === requested) ?? null;

  if (open) {
    return (
      <div className="fathers-page fathers-index scholars-page">
        <ScholarsVerse />
        <div className="scholars-wrap">
          <button type="button" className="scholars-back" onClick={() => setSearchParams({})}>
            ← All centuries
          </button>
          <header className="scholars-open-head">
            <h2 className="scholars-shelf-title">{open.title}</h2>
            <p className="scholars-shelf-count">{shelfCountLine(open)}</p>
          </header>
          <ul className="scholars-grid">
            {open.fathers.map((father) => {
              const works = catalog.works.filter((work) => work.author === father.id).length;
              const meta = [father.dates ? adDates(father.dates) : "", father.office].filter(Boolean).join(" · ");
              return (
                <li key={father.id}>
                  <Link className="scholars-person" to={fatherProfilePath(father.id)}>
                    <span className="scholars-person-line">
                      <span className="scholars-person-name">{father.name}</span>
                      <span className="scholars-person-works">
                        {works} {works === 1 ? "work" : "works"}
                      </span>
                    </span>
                    {meta ? <span className="scholars-person-meta">{meta}</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="fathers-page fathers-index scholars-page">
      <ScholarsVerse />
      <div className="scholars-wrap">
        <ul className="scholars-shelves">
          {shelves.map((shelf) => (
            <li key={shelf.id}>
              <button
                type="button"
                className="scholars-shelf"
                onClick={() => setSearchParams({ century: shelf.id })}
              >
                <span className="scholars-shelf-main">
                  <span className="scholars-shelf-title">{shelf.title}</span>
                  <span className="scholars-shelf-count">{shelfCountLine(shelf)}</span>
                </span>
                <span className="scholars-shelf-side">
                  <span className="scholars-preview">{shelfPreview(shelf)}</span>
                  <svg
                    className="scholars-chevron"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
