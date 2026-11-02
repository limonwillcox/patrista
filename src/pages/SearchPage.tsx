import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { parseQuery } from "../../server/query";
import { hitHref, searchTexts, type TextHit, type TextSearch } from "../api/search";
import { ScriptureResults } from "../components/search/ScriptureResults";
import { ConnectionResults } from "../components/search/ConnectionResults";
import { useApp } from "../context/AppContext";
import { readPath } from "../lib/workSlugs";

const PAGE = 20;
const SUGGESTIONS = ["restless heart", "wheat of God", "image of God", "Eucharist", "grace", "virginity", "the Logos"];

export function SearchPage() {
  const { catalog, setActivePassage } = useApp();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const q = (params.get("q") || "").trim();
  const father = params.get("father") || "";
  const [draft, setDraft] = useState(q);
  const [search, setSearch] = useState<TextSearch | null>(null);
  const [hits, setHits] = useState<TextHit[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = useRef(0);

  useEffect(() => {
    setActivePassage(null);
  }, [setActivePassage]);

  useEffect(() => setDraft(q), [q]);

  useEffect(() => {
    document.title = q ? q + " — Search the Fathers — Patrista" : "Search the Church Fathers — Patrista";
  }, [q]);

  // "Confessions 8" or a work title opens the reader instead of searching.
  const ref = useMemo(() => (catalog && q ? parseQuery(q, catalog) : null), [catalog, q]);
  useEffect(() => {
    if (ref?.type !== "ref") return;
    const base = readPath(ref.work);
    const ch = ref.chapter;
    navigate(base + (ch != null ? (base.includes("?") ? "&" : "?") + "chapter=" + ch + "#ch-" + ch : ""), { replace: true });
  }, [ref, navigate]);

  useEffect(() => {
    if (!q || ref?.type === "ref") {
      setSearch(null);
      setHits([]);
      return;
    }
    const id = ++run.current;
    setBusy(true);
    setError(null);
    searchTexts(q, father)
      .then(async (s) => {
        if (id !== run.current) return;
        setSearch(s);
        const first = await s.page(0, PAGE);
        if (id === run.current) setHits(first);
      })
      .catch((err: unknown) => {
        if (id === run.current) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (id === run.current) setBusy(false);
      });
  }, [q, father, ref]);

  async function more() {
    if (!search) return;
    const id = run.current;
    setBusy(true);
    const next = await search.page(hits.length, hits.length + PAGE);
    if (id === run.current) setHits((was) => [...was, ...next]);
    setBusy(false);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const next = draft.trim();
    if (!next) return;
    setParams({ q: next });
  }

  function chooseFather(name: string) {
    const next: Record<string, string> = { q };
    if (name) next.father = name;
    setParams(next);
  }

  const fatherCounts = Object.entries(search?.filters.father || {})
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  return (
    <div className="search-page">
      <form className="search-head" role="search" onSubmit={submit}>
        <h1>Search the Fathers</h1>
        <div className="search-box">
          <input
            type="search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="A word or phrase: grace, image of God, restless heart…"
            aria-label="Search the full text"
            autoFocus={!q}
          />
          <button type="submit">Search</button>
        </div>
        <p className="search-hint">
          Searches every chapter of the English texts. Put a phrase in quotes to find those exact words. A title and number,
          like <em>Confessions 8</em>, opens that chapter.
        </p>
      </form>

      {q && ref?.type !== "ref" ? <ScriptureResults q={q} /> : null}
      {q && ref?.type !== "ref" ? <ConnectionResults q={q} /> : null}

      {q && !error ? (
        <p className="search-count" aria-live="polite">
          {busy && !search ? (
            "Searching…"
          ) : (
            <>
              <strong>{(search?.total ?? 0).toLocaleString("en-US")}</strong> {search?.total === 1 ? "chapter" : "chapters"}{" "}
              mention <strong>{q}</strong>
              {father ? " in " + father : ""}
            </>
          )}
        </p>
      ) : null}
      {error ? <p className="empty">{error}</p> : null}

      {fatherCounts.length > 1 || father ? (
        <div className="search-fathers" role="group" aria-label="Filter by Father">
          <button type="button" aria-pressed={!father} onClick={() => chooseFather("")}>
            All Fathers
          </button>
          {fatherCounts.slice(0, father ? fatherCounts.length : 14).map(([name, n]) => (
            <button key={name} type="button" aria-pressed={father === name} onClick={() => chooseFather(father === name ? "" : name)}>
              {name} <span>{n}</span>
            </button>
          ))}
        </div>
      ) : null}

      <ol className="search-results">
        {hits.map((h) => (
          <li key={h.url} className="search-hit">
            <Link to={hitHref(h, q)} className="search-hit-title">
              {h.work}
              {h.chapter ? <span> · {h.chapter}</span> : null}
            </Link>
            <p className="search-hit-who">{h.author}</p>
            <p className="search-hit-text" dangerouslySetInnerHTML={{ __html: h.excerptHtml }} />
          </li>
        ))}
      </ol>
      {search && hits.length < search.total ? (
        <button type="button" className="search-more" disabled={busy} onClick={more}>
          {busy ? "Loading…" : "Show " + Math.min(PAGE, search.total - hits.length) + " more"}
        </button>
      ) : null}

      {q && search && !search.total && !busy ? (
        <p className="empty">
          Nothing matched <strong>{q}</strong>. Try a shorter phrase or another spelling (these translations use older English:
          <em> shew</em>, <em>Saviour</em>, <em>baptise</em>).
        </p>
      ) : null}

      {!q ? (
        <div className="search-start">
          <p>Try:</p>
          <ul>
            {SUGGESTIONS.map((s) => (
              <li key={s}>
                <Link to={"/search?q=" + encodeURIComponent(s)}>{s}</Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
