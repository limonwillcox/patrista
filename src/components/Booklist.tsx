import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { previewCatalog, type CatalogPreviewGroup } from "../lib/catalogPreview";
import { useApp } from "../context/AppContext";
import { bibleHref } from "../lib/lastRead";
import { attributionLabel } from "../../server/workMeta";

type BooklistProps = {
  query: string;
  onQueryChange: (q: string) => void;
};

export function Booklist({ query, onQueryChange }: BooklistProps) {
  const { catalog, booklistOpen, setBooklistOpen } = useApp();
  const navigate = useNavigate();
  const worksRef = useRef<HTMLDivElement>(null);
  const [spyId, setSpyId] = useState<string | null>(null);
  const [clickedId, setClickedId] = useState<string | null>(null);

  const preview = useMemo(() => (catalog ? previewCatalog(query, catalog) : null), [catalog, query]);
  const groups = preview?.groups ?? [];
  const onOpenWork = useCallback(() => setBooklistOpen(false), [setBooklistOpen]);

  useEffect(() => {
    setClickedId(null);
  }, [query]);

  useEffect(() => {
    if (!clickedId || !booklistOpen) return;
    const root = worksRef.current;
    const el = root?.querySelector('[data-author-group="' + CSS.escape(clickedId) + '"]');
    if (!root || !(el instanceof HTMLElement)) return;
    const top = el.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop;
    root.scrollTo({ top, behavior: "auto" });
  }, [clickedId, booklistOpen]);

  useEffect(() => {
    const root = worksRef.current;
    if (!root || !booklistOpen) return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        const id = hit?.target.getAttribute("data-author-group");
        if (id) setSpyId(id);
      },
      { root, rootMargin: "0px 0px -55% 0px", threshold: 0.05 }
    );
    root.querySelectorAll("[data-author-group]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [groups, booklistOpen]);

  if (!catalog || !booklistOpen) {
    return <div className="booklist" id="booklist" hidden />;
  }

  function onAuthorClick(id: string) {
    if (clickedId === id) {
      navigate("/fathers/" + encodeURIComponent(id) + "/");
      setBooklistOpen(false);
      return;
    }
    setClickedId(id);
  }

  const eraLabel = (id: string) => catalog.eras.find((e) => e.id === id)?.label || id;

  const trimmed = query.trim();
  // Scripture sits at the top of the list, so the Bible is always one click from search.
  const showBible = !trimmed || /^(the\s+)?(holy\s+)?(bi|bib|bibl|bible|scr|scripture|gospels?)/i.test(trimmed);
  return (
    <div className="booklist open" id="booklist">
      {trimmed ? (
        <Link className="booklist-fulltext" to={"/search?q=" + encodeURIComponent(trimmed)} onClick={onOpenWork}>
          Search every text for <strong>“{trimmed}”</strong> <span aria-hidden="true">→</span>
        </Link>
      ) : null}
      <div className="booklist-eras">
        {showBible ? (
          <div>
            <div className="era-label">Scripture</div>
            <Link className="booklist-bible" to={bibleHref()} onClick={onOpenWork}>
              The Bible <span>with the Fathers' commentary</span>
            </Link>
          </div>
        ) : null}
        {groups.map((g, i) => {
          const showEra = i === 0 || groups[i - 1].author.era !== g.author.era;
          return (
            <div key={g.author.id}>
              {showEra ? <div className="era-label">{eraLabel(g.author.era)}</div> : null}
              <AuthorButton
                group={g}
                active={g.author.id === spyId || g.author.id === clickedId}
                onClick={() => onAuthorClick(g.author.id)}
              />
            </div>
          );
        })}
        {preview?.suggestion ? (
          <p className="booklist-suggest">
            Did you mean{" "}
            <button type="button" onClick={() => onQueryChange(preview.suggestion!.label)}>
              {preview.suggestion.label}
            </button>
            ?
          </p>
        ) : null}
      </div>
      <WorksColumn groups={groups} worksRef={worksRef} onOpenWork={onOpenWork} />
    </div>
  );
}

const WorksColumn = memo(function WorksColumn({
  groups,
  worksRef,
  onOpenWork
}: {
  groups: CatalogPreviewGroup[];
  worksRef: { current: HTMLDivElement | null };
  onOpenWork: () => void;
}) {
  return (
    <div className="booklist-works" id="booklistWorks" ref={worksRef}>
      {groups.map((g) => (
        <section key={g.author.id} className="booklist-works-group" data-author-group={g.author.id}>
          <h3>{g.author.name}</h3>
          <div className="meta">
            {g.author.dates} · {g.author.region}
          </div>
          {g.works.map((w) => (
            <div key={w.id}>
              <Link className="work-link" to={"/read?work=" + w.id} onClick={onOpenWork}>
                <strong>{w.title}</strong>{" "}
                <span className="meta">
                  ({w.short} · {w.series}
                  {attributionLabel(w, g.author) ? " · " + attributionLabel(w, g.author) : ""})
                </span>
              </Link>
              <div className="chapters">
                {Array.from({ length: w.chapters }, (_, i) => i + 1).map((n) => (
                  <Link
                    key={n}
                    to={"/read?work=" + w.id + "&chapter=" + n + "#ch-" + n}
                    onClick={onOpenWork}
                  >
                    {n}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
});

function AuthorButton({
  group,
  active,
  onClick
}: {
  group: CatalogPreviewGroup;
  active: boolean;
  onClick: () => void;
}) {
  const workHit = group.kind === "work";
  return (
    <button
      type="button"
      data-author={group.author.id}
      className={(workHit ? "work-hit" : "") + (active ? " active" : "")}
      onClick={onClick}
    >
      {group.author.name}
    </button>
  );
}
