import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";

export function AboutPage() {
  const { setActivePassage, catalog } = useApp();
  useEffect(() => {
    setActivePassage(null);
  }, [setActivePassage]);

  const workCount = catalog?.works.length ?? null;
  const authorCount = catalog?.authors.length ?? null;

  return (
    <div className="prose">
      <h1>About Patrista</h1>
      <p>
        Patrista is a free, searchable library of the Church Fathers — the public-domain English of the Ante-Nicene Fathers and
        Nicene and Post-Nicene Fathers series, with Latin originals where we have them. Read a whole work as one scroll, flip
        between Translation and Original, or open Split to keep both columns on the page.
      </p>

      <h2>What is here</h2>
      <p>
        {workCount != null && authorCount != null ? (
          <>
            The library currently holds <strong>{workCount}</strong> works from <strong>{authorCount}</strong> authors, from the
            apostolic age through the early medieval West and East.{" "}
          </>
        ) : null}
        Augustine&apos;s <em>Confessions</em> ships with Pusey&apos;s English beside the Latin <em>Confessiones</em>. Many other
        titles are English-only for now; Original and Split light up when a source text is present.
      </p>
      <p>
        <Link to="/church-fathers">Browse the writings</Link> · <Link to="/read?work=confessions">Open the Confessions</Link> ·{" "}
        <Link to="/church-history/timeline#nativity">Church history timeline</Link>
      </p>

      <h2 id="editions">Editions</h2>
      <p>
        English texts come chiefly from the Ante-Nicene Fathers and Nicene and Post-Nicene Fathers series (ed. Roberts, Donaldson,
        Schaff) and related nineteenth-century editions in the public domain in the United States. The Confessions English is
        Pusey&apos;s 1838 translation (Project Gutenberg eBook #3296); the Latin sits under <code>Fathers/Latin/</code>. License
        notes for Gutenberg material are kept in <code>Regulations/Project GutenBerg</code>.
      </p>

      <h2>How to use it</h2>
      <ul>
        <li>
          <strong>Read</strong> — open a work, jump by chapter strip, resize the type, and toggle night mode.
        </li>
        <li>
          <strong>Search</strong> — find a father, a title and chapter (<em>Confessions 8</em>), or a phrase across the corpus.
        </li>
        <li>
          <strong>History</strong> — a short cinematic from Pentecost to Nicaea; <strong>Timeline</strong> is the dated eras with
          links into the reader.
        </li>
        <li>
          <strong>Study</strong> — a short desk of paths into the library.
        </li>
      </ul>

    </div>
  );
}
