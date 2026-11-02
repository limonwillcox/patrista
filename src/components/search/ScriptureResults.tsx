import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { fathersOn, findVerses, type FatherChapter, type VerseMatch } from "../../api/scripture";
import "../../styles/scripture-search.css";

/** Mark the matched words in a verse. */
function marked(text: string, marks: string[]): ReactNode {
  if (!marks.length) return text;
  const words = [...new Set(marks.flatMap((m) => m.split(" ")))].filter(Boolean);
  const re = new RegExp("\\b(" + words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")\\b", "gi");
  const parts = text.split(re);
  return parts.map((p, i) => (i % 2 ? <mark key={i}>{p}</mark> : p));
}

const verseHref = (v: VerseMatch) => `/bible?book=${v.book}&chapter=${v.chapter}&verse=${v.verse}&panel=connections`;
const label = (v: VerseMatch) => v.bookName + " " + v.chapter + ":" + v.verse;

/**
 * Above the full-text results: the verses behind the query, and the chapters of the Fathers that cite
 * them. "In the beginning" finds Genesis 1:1 and John 1:1, then the Fathers who comment on them.
 */
export function ScriptureResults({ q }: { q: string }) {
  const [verses, setVerses] = useState<VerseMatch[] | null>(null);
  const [picked, setPicked] = useState(0);
  const [fathers, setFathers] = useState<FatherChapter[] | null>(null);
  const [all, setAll] = useState(false);

  useEffect(() => {
    let live = true;
    setVerses(null);
    setPicked(0);
    setAll(false);
    findVerses(q).then((v) => live && setVerses(v));
    return () => {
      live = false;
    };
  }, [q]);

  const chosen = verses?.[picked];
  useEffect(() => {
    let live = true;
    setFathers(null);
    if (!chosen) return;
    fathersOn([chosen], 30).then((f) => live && setFathers(f));
    return () => {
      live = false;
    };
  }, [chosen]);

  if (!verses || !verses.length) return null;
  const shown = all ? verses : verses.slice(0, 4);
  return (
    <section className="sx" aria-label="In Scripture">
      <h2 className="sx-title">In Scripture</h2>
      <ul className="sx-verses">
        {shown.map((v, i) => (
          <li key={label(v)} className={i === picked ? "is-picked" : ""}>
            <button type="button" className="sx-verse" aria-pressed={i === picked} onClick={() => setPicked(i)}>
              <span className="sx-ref">{label(v)}</span>
              <span className="sx-text">{marked(v.text.replace(/\s\S+\.\.\.:.*$/, ""), v.marks)}</span>
              <span className="sx-cited">{v.cited ? "the Fathers cite it in " + v.cited + (v.cited === 1 ? " chapter" : " chapters") : "not cited by reference"}</span>
            </button>
            <Link className="sx-open" to={verseHref(v)} title="Read it with its connections">
              Read
            </Link>
          </li>
        ))}
      </ul>
      {verses.length > 4 ? (
        <button type="button" className="sx-more" onClick={() => setAll(!all)}>
          {all ? "Fewer verses" : verses.length - 4 + " more verses"}
        </button>
      ) : null}

      {chosen ? (
        <>
          <h2 className="sx-title">The Fathers on {label(chosen)}</h2>
          {fathers === null ? (
            <p className="empty">Loading…</p>
          ) : fathers.length === 0 ? (
            <p className="sx-none">No chapter of the Fathers in the library cites it by reference.</p>
          ) : (
            <ol className="sx-fathers">
              {fathers.slice(0, 8).map((f) => (
                <li key={f.url}>
                  <Link to={f.url} className="search-hit-title">
                    {f.title}
                  </Link>
                  <p className="search-hit-who">{f.father}</p>
                  {f.excerpt ? <p className="search-hit-text">{f.excerpt}</p> : null}
                </li>
              ))}
            </ol>
          )}
          {fathers && fathers.length > 8 ? (
            <p className="sx-none">
              And {fathers.length - 8} more chapters.{" "}
              <Link to={verseHref(chosen)}>See every Father on {label(chosen)}</Link>
            </p>
          ) : null}
        </>
      ) : null}
      <h2 className="sx-title">Everywhere the words appear</h2>
    </section>
  );
}
