import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  bibleHrefFor,
  fetchChapterConnections,
  fetchMeta,
  fetchTypes,
  rangeLabel,
  vidOf,
  type ChapterConnections,
  type Meta,
  type TypeEntry
} from "../../api/connections";
import { findPatterns, groupCurated, overlaps, STRENGTH_TEXT, type Pattern, type Strength } from "../../lib/connectionPatterns";
import { findScriptureRefs } from "../../lib/scriptureRefs";
import "../../styles/connection-search.css";

const TYPES_SHOWN = 6;
const LINKS_SHOWN = 8;
const STRENGTH_LABEL: Record<Strength, string> = { strong: "Strong", moderate: "Moderate", weak: "Weak" };

/** The words of a query worth matching on (three letters or more). */
const queryWords = (q: string) => (q.toLowerCase().match(/[a-z']{3,}/g) ?? []).filter((w) => !["the", "and", "of", "for"].includes(w));

/**
 * Connections in the search results:
 *  - the types of Christ whose name or meaning matches the query ("lamb", "Isaac", "water");
 *  - when the query names a passage ("John 3:14"), the types drawn from it and every passage it connects to,
 *    marked strong, moderate or weak as in the Bible's Connections tab.
 */
export function ConnectionResults({ q }: { q: string }) {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [types, setTypes] = useState<TypeEntry[] | null>(null);
  const [data, setData] = useState<ChapterConnections | null>(null);
  const [all, setAll] = useState(false);
  // People type "john 3:14"; the parser wants book names capitalised, as they are in the Fathers' text.
  const ref = useMemo(() => findScriptureRefs(q.replace(/(^|\s)([a-z])/g, (_, sp: string, c: string) => sp + c.toUpperCase()))[0] ?? null, [q]);

  useEffect(() => {
    Promise.all([fetchMeta(), fetchTypes()]).then(([m, t]) => {
      setMeta(m);
      setTypes(t);
    });
  }, []);

  useEffect(() => {
    setData(null);
    setAll(false);
    if (!ref) return;
    let live = true;
    fetchChapterConnections(ref.book, ref.chapter).then((d) => live && setData(d));
    return () => {
      live = false;
    };
  }, [ref]);

  const bookNumber = meta && ref ? meta.books.find((b) => b.id === ref.book)?.n ?? 0 : 0;
  const here: [number, number] | null =
    ref && bookNumber ? [vidOf(bookNumber, ref.chapter, ref.verse), vidOf(bookNumber, ref.chapter, ref.endVerse ?? ref.verse)] : null;

  // Types that match the words, or that run through the passage searched for.
  const matched = useMemo(() => {
    if (!types) return [];
    const words = queryWords(q);
    return types.filter(
      (t) =>
        (here && t.ranges.some((r) => overlaps(r, here))) ||
        (words.length > 0 && words.every((w) => (t.label + " " + t.def + " " + t.christ).toLowerCase().includes(w)))
    );
  }, [types, q, here?.[0], here?.[1]]); // eslint-disable-line react-hooks/exhaustive-deps

  const patterns: Pattern[] = useMemo(() => {
    if (!data || !here) return [];
    const curated = (data.c ?? []).filter(([, , , , a0, a1, b0, b1]) => overlaps([a0, a1], here) || overlaps([b0, b1], here));
    return findPatterns(data, here, groupCurated(curated, here));
  }, [data, here?.[0], here?.[1]]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!meta || (!matched.length && !patterns.length)) return null;
  const counts = { strong: 0, moderate: 0, weak: 0 } as Record<Strength, number>;
  patterns.forEach((p) => (counts[p.strength] += 1));
  const shown = all ? patterns : patterns.slice(0, LINKS_SHOWN);
  const placeLabel = here ? rangeLabel(meta, here[0], here[1]) : "";

  return (
    <section className="cs" aria-label="Connections">
      <h2 className="cs-title">Connections</h2>

      {matched.length ? (
        <div className="cs-block">
          <h3>{here ? "Types that include " + placeLabel : "Types of Christ"}</h3>
          <ul className="cs-types">
            {matched.slice(0, TYPES_SHOWN).map((t) => (
              <li key={t.id}>
                <Link to={"/types?type=" + encodeURIComponent(t.id.replace(/^\d+:/, ""))} className="cs-type">
                  <span className="cs-type-label">{t.label}</span>
                  <span className="cs-type-def">{t.def}</span>
                </Link>
              </li>
            ))}
          </ul>
          {matched.length > TYPES_SHOWN ? (
            <Link className="cs-more" to="/types">
              {matched.length - TYPES_SHOWN} more in Types →
            </Link>
          ) : null}
        </div>
      ) : null}

      {here && patterns.length ? (
        <div className="cs-block">
          <h3>
            {placeLabel} connects to{" "}
            {(["strong", "moderate", "weak"] as Strength[])
              .filter((s) => counts[s])
              .map((s) => counts[s] + " " + s)
              .join(", ")}
          </h3>
          <ol className="cs-links">
            {shown.map((p) => (
              <li key={p.from + "-" + p.to} className={"cs-link is-" + p.strength}>
                <span className={"cs-strength is-" + p.strength} title={STRENGTH_TEXT[p.strength]}>
                  {STRENGTH_LABEL[p.strength]}
                </span>
                <Link to={bibleHrefFor(meta, p.from) + "&panel=connections"} className="cs-link-ref">
                  {rangeLabel(meta, p.from, p.to)}
                </Link>
                <span className="cs-why">{reasons(p)}</span>
              </li>
            ))}
          </ol>
          <p className="cs-foot">
            {patterns.length > LINKS_SHOWN ? (
              <button type="button" className="cs-more" onClick={() => setAll(!all)}>
                {all ? "Show fewer" : "Show all " + patterns.length}
              </button>
            ) : null}
            <Link className="cs-more" to={bibleHrefFor(meta, here[0]) + "&panel=connections"}>
              Open {placeLabel} in Connections →
            </Link>
          </p>
        </div>
      ) : null}
    </section>
  );
}

/** Why a link holds, in a few words: "type: The bronze serpent · 3 Fathers · 4 shared words". */
function reasons(p: Pattern): string {
  const out: string[] = [];
  if (p.types.length) out.push("type: " + p.types.map((t) => t.label).join(", "));
  if (p.fathers.size) out.push(p.fathers.size === 1 ? "a Father cites both" : p.fathers.size + " Fathers cite both");
  if (p.codes.size) out.push(p.codes.size === 1 ? "a shared Hebrew or Greek word" : p.codes.size + " shared Hebrew or Greek words");
  return out.join(" · ");
}
