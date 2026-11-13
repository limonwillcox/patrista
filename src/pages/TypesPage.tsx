import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchCatalog } from "../api/client";
import { bibleHrefFor, bookOf, fetchMeta, fetchTypes, vidOf, type Meta, type TypeEntry } from "../api/connections";
import { FatherRef, italics, splitWhere } from "../components/typeParts";
import { ShareButton } from "../components/ShareButton";
import { TypeTrail } from "../components/TypeTrail";
import { TypeMap, shortLabel } from "../components/typeMap/TypeMap";
import { firstThemeOf, themeColor, themesOf, themeTitle, useNight } from "../lib/themeColors";
import { computeGatherings, nameGatherings, type NamedGathering } from "../lib/typeGatherings";
import { fathersOnMap, placeFromParam, placeParam, typesThrough } from "../lib/typeMap";
import { describeShare, shareCardSvg } from "../lib/typeShare";
import { drawnBy, stopFromParam, trailLength, typeFathers } from "../lib/typeTrail";
import "../styles/types.css";
import "../styles/type-trail.css";

/*
 * The types: one map. The Bible runs as a line from Genesis to Revelation and each type is a chain of arcs
 * joining its passages (src/components/typeMap/TypeMap.tsx). At rest the map is a calm picture; point at it
 * and it opens for exploring. Under it is one thing at a time: the open type as a trail (?type=<slug>&stop=<n>,
 * src/lib/typeTrail.ts; the Fathers' words at &view=fathers), or a chapter picked on the line (&at=ex.14), or
 * a theme (&theme=tertullian-bapt-9), or a line on how to use the map. A Father (&father=Irenaeus) keeps only
 * his types bright. Data: public/connections/types.json. The themes are the Fathers' own gatherings, passages
 * that name several types together, computed from the types' quotations (src/lib/typeGatherings.ts).
 */

export function TypesPage() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [types, setTypes] = useState<TypeEntry[] | null>(null);
  const [themes, setThemes] = useState<NamedGathering[]>([]);
  const [failed, setFailed] = useState(false);
  const [params, setParams] = useSearchParams();
  const [preview, setPreview] = useState<string | null>(null);
  const night = useNight();

  useEffect(() => {
    Promise.all([fetchMeta(), fetchTypes(), fetchCatalog().catch(() => null)]).then(
      ([m, t, catalog]) => {
        if (!m || !t) return setFailed(true);
        setMeta(m);
        setTypes(t);
        setThemes(nameGatherings(computeGatherings(t), catalog));
      },
      () => setFailed(true)
    );
  }, []);

  useEffect(() => {
    document.title = "Types of Christ in Scripture · Patrista";
    // The page fits the screen, like an atlas, and never scrolls as a whole (styles in type-map.css).
    document.documentElement.classList.add("types-atlas");
    return () => document.documentElement.classList.remove("types-atlas");
  }, []);

  const chosenId = params.get("type");
  const chosen = types?.find((t) => slug(t.id) === chosenId) ?? null;
  const stop = chosen ? stopFromParam(params.get("stop"), trailLength(chosen)) : 0;
  const fathersView = params.get("view") === "fathers";
  const rawTheme = params.get("theme");
  const theme = rawTheme && themes.some((t) => t.id === rawTheme) ? rawTheme : null;
  const firstTheme = useMemo(() => firstThemeOf(themes), [themes]);
  /** A type's colour: that of the first theme it is in. */
  const colorOf = (typeId: string) => themeColor(firstTheme.get(typeId) ?? -1, themes.length, night);
  const fathers = useMemo(() => (types ? fathersOnMap(types) : []), [types]);
  const rawFather = params.get("father");
  const father = rawFather && fathers.some((f) => f.name === rawFather) ? rawFather : null;
  const place = meta ? placeFromParam(meta, params.get("at")) : null;

  function set(changes: Record<string, string | null>) {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v == null) p.delete(k);
      else p.set(k, v);
    }
    setParams(p, { replace: true });
  }

  const choose = (t: TypeEntry | null) => set({ type: t ? slug(t.id) : null, stop: null, view: null });
  /** Move the open type's trail to a stop; 0, the overview, leaves `stop` out of the URL. */
  const follow = (n: number) => set({ stop: n === 0 ? null : String(n), view: null });
  /** Show or hide the Fathers' words. The trail keeps its stop, so "back" returns to where the reader was. */
  const showFathers = (on: boolean) => set({ view: on ? "fathers" : null });

  // A new type, stop, chapter or theme starts at the top of the panel; on closing a type, focus goes back to the map.
  const mapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const wasOpen = useRef(false);
  const openKey = [chosen?.id, params.get("stop"), params.get("view"), params.get("at"), theme].join("|");
  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 });
    if (!chosen && wasOpen.current) mapRef.current?.querySelector<HTMLElement>(".tm")?.focus({ preventScroll: true });
    wasOpen.current = Boolean(chosen);
  }, [openKey]);

  if (failed) return <div className="ty-page"><p className="ty-state">The types could not be loaded.</p></div>;
  if (!meta || !types) return <div className="ty-page"><p className="ty-state">Loading the types…</p></div>;

  const open = Boolean(chosen || place || theme);

  // What Share sends: the open type, else the chapter, the theme or the Father the map is showing, else the whole map.
  const openTheme = theme ? themes.find((x) => x.id === theme) ?? null : null;
  const share = describeShare(meta, {
    type: chosen,
    place,
    theme: openTheme,
    father,
    drawn: chosen
      ? [chosen]
      : place
        ? typesThrough(types, place.book, place.chapter)
        : openTheme
          ? types.filter((t) => openTheme.members.some((m) => m.type === t.id))
          : father
            ? types.filter((t) => typeFathers(t).includes(father))
            : types
  });

  return (
    <div className="ty-page tm-page">
      {/* The map and, beside it on a wide screen (under it on a narrow one), whatever is open: both stay in view. */}
      <div className={"tm-stage" + (open ? " has-panel" : "")}>
        <div className="tm-map" ref={mapRef}>
          <TypeMap
            meta={meta}
            types={types}
            themes={themes}
            chosen={chosen}
            stop={fathersView ? 0 : stop}
            theme={preview ?? theme}
            father={father}
            place={place}
            onPick={choose}
            onStop={follow}
            onPlace={(p) => set({ at: p ? placeParam(meta, p.book, p.chapter) : null, theme: null })}
            tools={
              <div className="tm-find">
                <TypeFinder types={types} colorOf={colorOf} onPick={(t) => choose(t)} />
                <select
                  className="tm-father"
                  value={father ?? ""}
                  onChange={(e) => set({ father: e.target.value || null })}
                  aria-label="Through the eyes of one Father"
                >
                  <option value="">Every Father</option>
                  {fathers.map((f) => (
                    <option key={f.name} value={f.name}>
                      {f.name} ({f.count})
                    </option>
                  ))}
                </select>
                <ShareButton share={{ ...share, svg: () => shareCardSvg(meta, share, colorOf) }} />
              </div>
            }
            legend={
              <div className="tm-themes" role="group" aria-label="Themes: the colours of the map">
                {themes.map((th, i) => (
                  <button
                    type="button"
                    key={th.id}
                    className="tm-theme"
                    style={{ ["--th" as string]: themeColor(i, themes.length, night) }}
                    aria-pressed={theme === th.id}
                    onClick={() => set({ theme: theme === th.id ? null : th.id, at: null })}
                    onMouseEnter={() => setPreview(th.id)}
                    onMouseLeave={() => setPreview(null)}
                    onFocus={() => setPreview(th.id)}
                    onBlur={() => setPreview(null)}
                  >
                    {themeTitle(th)} <span>{th.members.length}</span>
                  </button>
                ))}
              </div>
            }
          />
        </div>
        {open ? (
          <aside className="tm-panel" ref={panelRef}>
        {chosen ? (
          <article className="ty-detail tt-detail" aria-label={chosen.label}>
            <button type="button" className="ty-close" onClick={() => choose(null)} aria-label={"Close " + chosen.label}>
              ×
            </button>
            {fathersView && chosen.where.length ? (
              <FathersWords t={chosen} onBack={() => showFathers(false)} />
            ) : (
              <TypeTrail
                t={chosen}
                meta={meta}
                stop={stop}
                kind="Type"
                span={spanLabel(meta, chosen)}
                onStop={follow}
                onFathers={() => showFathers(true)}
                onClose={() => choose(null)}
              />
            )}
          </article>
        ) : place ? (
          <PlaceCard meta={meta} types={types} place={place} colorOf={colorOf} onPick={choose} onClose={() => set({ at: null })} />
        ) : theme ? (
          <GatheringCard
            types={types}
            theme={themes.find((x) => x.id === theme)!}
            color={themeColor(themes.findIndex((x) => x.id === theme), themes.length, night)}
            onPick={choose}
            onClose={() => set({ theme: null })}
          />
        ) : null}
          </aside>
        ) : null}
      </div>
    </div>
  );
}

/** A type's id as it appears in the URL: "04:paschal-lamb" → "paschal-lamb". */
function slug(id: string): string {
  return id.replace(/^\d+:/, "");
}

/** "Genesis → John · 6 passages". */
function spanLabel(meta: Meta, t: TypeEntry): string {
  const sorted = [...t.ranges].sort((a, b) => a[0] - b[0]);
  if (!sorted.length) return "";
  const first = bookOf(meta, sorted[0][0])?.name ?? "";
  const last = bookOf(meta, sorted[sorted.length - 1][0])?.name ?? "";
  return (first === last ? first : first + " → " + last) + " · " + sorted.length + (sorted.length === 1 ? " passage" : " passages");
}

/** Find a type by name: a few matches under the box; Enter opens the first. */
function TypeFinder({ types, colorOf, onPick }: { types: TypeEntry[]; colorOf: (id: string) => string; onPick: (t: TypeEntry) => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const needle = q.trim().toLowerCase();
  const hits = needle
    ? types
        .filter((t) => (t.label + " " + t.def).toLowerCase().includes(needle))
        .sort((a, b) => Number(!a.label.toLowerCase().includes(needle)) - Number(!b.label.toLowerCase().includes(needle)))
        .slice(0, 7)
    : [];
  const pick = (t: TypeEntry) => {
    onPick(t);
    setQ("");
    setOpen(false);
  };
  return (
    <div className="tm-finder">
      <input
        type="search"
        placeholder="Find a type: lamb, water, Isaac…"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && hits[0]) pick(hits[0]);
          else if (e.key === "Escape") {
            setQ("");
            setOpen(false);
          }
        }}
        aria-label="Find a type"
      />
      {open && needle ? (
        <ul className="tm-finder-list">
          {hits.length ? (
            hits.map((t, i) => (
              <li key={t.id}>
                <button
                  type="button"
                  className={i === 0 ? "is-first" : undefined}
                  style={{ ["--th" as string]: colorOf(t.id) }}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(t)}
                >
                  {t.label}
                </button>
              </li>
            ))
          ) : (
            <li className="tm-finder-none">No type matches.</li>
          )}
        </ul>
      ) : null}
    </div>
  );
}

/** A chapter picked on the line: the types that pass through it. */
function PlaceCard({
  meta,
  types,
  place,
  colorOf,
  onPick,
  onClose
}: {
  meta: Meta;
  types: TypeEntry[];
  place: { book: number; chapter: number };
  colorOf: (id: string) => string;
  onPick: (t: TypeEntry) => void;
  onClose: () => void;
}) {
  const here = typesThrough(types, place.book, place.chapter);
  const name = meta.books[place.book - 1].name + " " + place.chapter;
  return (
    <section className="tm-card" aria-label={name}>
      <button type="button" className="ty-close" onClick={onClose} aria-label={"Close " + name}>
        ×
      </button>
      <p className="tm-card-kicker">A chapter</p>
      <h2>{name}</h2>
      <p className="tm-card-lede">
        {here.length === 0
          ? "No type passes through this chapter."
          : here.length === 1
            ? "One type passes through this chapter."
            : here.length + " types pass through this chapter."}
      </p>
      {here.length ? (
        <ul className="tm-picks">
          {here.map((t) => (
            <li key={t.id}>
              <button type="button" className="tm-pick" style={{ ["--th" as string]: colorOf(t.id) }} onClick={() => onPick(t)}>
                {shortLabel(t.label)}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <Link className="tm-card-read" to={bibleHrefFor(meta, vidOf(place.book, place.chapter, 0))}>
        Read {name} in the Bible →
      </Link>
    </section>
  );
}

/**
 * A theme brought forward: a Father's gathering. The types the passage names, in the order he names them, each
 * with its quotation from the passage, and a way into the passage in the reader.
 */
function GatheringCard({
  types,
  theme,
  color,
  onPick,
  onClose
}: {
  types: TypeEntry[];
  theme: NamedGathering;
  color: string;
  onPick: (t: TypeEntry) => void;
  onClose: () => void;
}) {
  const byId = new Map(types.map((t) => [t.id, t]));
  const title = themeTitle(theme);
  return (
    <section className="tm-card tm-theme-card" style={{ ["--th" as string]: color }} aria-label={title}>
      <button type="button" className="ty-close" onClick={onClose} aria-label={"Close " + title}>
        ×
      </button>
      <p className="tm-card-kicker">A Father&apos;s gathering · {theme.members.length} types</p>
      <h2>{title}</h2>
      <p className="tm-card-lede">
        In this passage {theme.father} names these types together. Here they are in the order he names them.
      </p>
      <Link className="tm-card-read" to={theme.members[0].href}>
        Read the passage →
      </Link>
      <ol className="tm-evidence">
        {theme.members.map((m) => {
          const t = byId.get(m.type);
          if (!t) return null;
          const { quote } = splitWhere(t.where[m.quote]);
          return (
            <li key={m.type}>
              <button type="button" className="tm-evidence-type" onClick={() => onPick(t)}>
                {shortLabel(t.label)}
              </button>
              <p className="tm-evidence-why">
                <Link to={m.href}>{italics(m.ref)}</Link>: <span className="tm-evidence-quote">{quote}</span>
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** Every quotation the type rests on, with a way back to the trail at the stop the reader left. */
function FathersWords({ t, onBack }: { t: TypeEntry; onBack: () => void }) {
  return (
    <div className="tt">
      <div className="tt-top">
        <button type="button" className="tt-back" onClick={onBack}>
          ← {t.label}
        </button>
      </div>
      <div className="ty-detail-words tt-words">
        <h3>
          In the Fathers&apos; words <span className="tt-drawn">· {drawnBy(t)}</span>
        </h3>
        <p className="ty-quote-ref">
          &ldquo;Ps.-&rdquo; marks a work once credited to that Father but not now held to be his; &ldquo;attributed&rdquo; marks
          a fragment whose author is uncertain. &para; is the paragraph in the reader.
        </p>
        <ul className="ty-quotes">
          {t.where.map((w, i) => {
            const { ref, quote } = splitWhere(w);
            const link = t.links?.[i];
            return (
              <li key={i}>
                {link ? (
                  <>
                    {/* The quotation opens the reader at its paragraph; the Father's name opens his page. */}
                    <Link to={link.href} className="ty-quote-link">
                      <blockquote>{quote}</blockquote>
                    </Link>
                    <p className="ty-quote-ref">
                      <FatherRef refText={ref} href={link.href} />{" "}
                      <Link to={link.href} className="ty-quote-go">
                        Read in context →
                      </Link>
                    </p>
                  </>
                ) : (
                  <>
                    <blockquote>{quote}</blockquote>
                    <p className="ty-quote-ref">{italics(ref)}</p>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
