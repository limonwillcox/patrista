import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchCatalog } from "../api/client";
import { fetchMeta, fetchTypes, type Meta, type TypeEntry } from "../api/connections";
import { TypeMap } from "../components/typeMap/TypeMap";
import { computeGatherings, nameGatherings, type NamedGathering } from "../lib/typeGatherings";
import { fathersOnMap, placeFromParam, typesThrough } from "../lib/typeMap";
import { describeShare, typeSlug } from "../lib/typeShare";
import { stopFromParam, trailLength, typeFathers } from "../lib/typeTrail";
import "../styles/types.css";
import "../styles/share.css";

/*
 * The types map on its own, for another site to frame (/embed/types, with the same ?type= / ?at= / ?theme= /
 * ?father= as /types). The map works as it does on the site: drag, zoom, point at an arc, pick a type. Under
 * it one line says what is showing and opens it on Patrista in a new tab. What the visitor picks stays inside
 * the frame; the address of the frame does not change.
 */
export function EmbedTypesPage() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [types, setTypes] = useState<TypeEntry[] | null>(null);
  const [themes, setThemes] = useState<NamedGathering[]>([]);
  const [failed, setFailed] = useState(false);
  const [params] = useSearchParams();

  const [typeId, setTypeId] = useState<string | null>(params.get("type"));
  const [stop, setStop] = useState<string | null>(params.get("stop"));
  const [at, setAt] = useState<string | null>(params.get("at"));
  const theme0 = params.get("theme");
  const father0 = params.get("father");

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
    document.documentElement.classList.add("is-embed");
    return () => document.documentElement.classList.remove("is-embed");
  }, []);

  const fathers = useMemo(() => (types ? fathersOnMap(types) : []), [types]);

  if (failed) return <div className="embed"><p className="embed-state">The types could not be loaded.</p></div>;
  if (!meta || !types) return <div className="embed"><p className="embed-state">Loading the types…</p></div>;

  const chosen = types.find((t) => typeSlug(t.id) === typeId) ?? null;
  const place = placeFromParam(meta, at);
  const theme = theme0 ? themes.find((t) => t.id === theme0) ?? null : null;
  const father = father0 && fathers.some((f) => f.name === father0) ? father0 : null;

  const drawn = chosen
    ? [chosen]
    : place
      ? typesThrough(types, place.book, place.chapter)
      : theme
        ? types.filter((t) => theme.members.some((m) => m.type === t.id))
        : father
          ? types.filter((t) => typeFathers(t).includes(father))
          : types;
  const share = describeShare(meta, { type: chosen, place, theme, father, drawn });

  return (
    <div className="embed">
      <div className="embed-map">
        <TypeMap
          meta={meta}
          types={types}
          themes={themes}
          chosen={chosen}
          stop={chosen ? stopFromParam(stop, trailLength(chosen)) : 0}
          theme={theme?.id ?? null}
          father={father}
          place={place}
          onPick={(t) => {
            setTypeId(typeSlug(t.id));
            setStop(null);
          }}
          onStop={(n) => setStop(n === 0 ? null : String(n))}
          onPlace={(p) => setAt(p ? meta.books[p.book - 1].id + "." + p.chapter : null)}
        />
      </div>
      <a className="embed-foot" href={share.path} target="_blank" rel="noopener">
        <span className="embed-foot-text">
          <strong>{share.title}</strong>
          <span className="embed-foot-sub">{share.subtitle}</span>
        </span>
        <span className="embed-foot-go">Open in Patrista ↗</span>
      </a>
    </div>
  );
}
