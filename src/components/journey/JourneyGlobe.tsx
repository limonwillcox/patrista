import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Journey } from "../../data/journeys";
import { buildGlobe, type GlobeHandle } from "../../three/globe";
import { createStage, prefersReducedMotion } from "../../three/stage";

/** A Father's travels on a globe: the route, the stops, what he wrote where, and the sources. Lazy-loaded. */
export default function JourneyGlobe({ journey }: { journey: Journey }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const handle = useRef<GlobeHandle | null>(null);
  const [at, setAt] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const stop = journey.stops[at];

  useEffect(() => {
    const host = hostRef.current;
    const labels = labelsRef.current;
    if (!host || !labels) return;
    let live = true;
    const stage = createStage(host, { fov: 30, near: 0.01 });
    buildGlobe(stage, journey, { labels, onPick: (i) => choose(i) }).then((h) => {
      if (!live) {
        h.dispose();
        return;
      }
      handle.current = h;
      h.goTo(0);
      setReady(true);
    });
    return () => {
      live = false;
      handle.current?.dispose();
      handle.current = null;
      stage.dispose();
    };
  }, [journey]);

  function choose(i: number) {
    setPlaying(false);
    setAt(i);
  }

  useEffect(() => {
    handle.current?.goTo(at);
  }, [at, ready]);

  // "Follow the journey": a stop every few seconds, then stop at the end.
  useEffect(() => {
    if (!playing) return;
    if (at >= journey.stops.length - 1) {
      setPlaying(false);
      return;
    }
    const t = window.setTimeout(() => setAt((i) => i + 1), prefersReducedMotion() ? 2500 : 4200);
    return () => window.clearTimeout(t);
  }, [playing, at, journey.stops.length]);

  function play() {
    if (at >= journey.stops.length - 1) setAt(0);
    setPlaying(true);
  }

  return (
    <section className="journey" aria-labelledby="journey-title">
      <header className="journey-head">
        <div>
          <h2 id="journey-title">{journey.title}</h2>
          <p>{journey.summary}</p>
        </div>
        <button type="button" className="journey-play" onClick={() => (playing ? setPlaying(false) : play())}>
          {playing ? "Pause" : at > 0 && at < journey.stops.length - 1 ? "Continue the journey" : "Follow the journey"}
        </button>
      </header>
      <div className="journey-body">
        <div className={"journey-stage" + (ready ? " is-ready" : "")}>
          <div className="journey-canvas" ref={hostRef} aria-label={"Globe showing " + journey.title} role="img" />
          <div className="journey-labels" ref={labelsRef} />
          {!ready ? <p className="journey-loading">Drawing the map…</p> : null}
          <p className="journey-tip">Drag to turn the globe · scroll to zoom</p>
        </div>
        <article className="journey-card" aria-live="polite">
          <p className="journey-when">
            {at + 1} of {journey.stops.length} · {stop.when}
          </p>
          <h3>{stop.name}</h3>
          <p className="journey-today">Today: {stop.today}</p>
          <p className="journey-text">{stop.text}</p>
          {stop.wrote?.length ? (
            <div className="journey-wrote">
              <h4>Written here</h4>
              <ul>
                {stop.wrote.map((w) => (
                  <li key={w.label + w.href}>
                    <Link to={w.href}>{w.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <p className="journey-sources">
            Source:{" "}
            {stop.sources.map((s, i) => (
              <span key={s.label + s.href}>
                {i ? ", " : ""}
                <Link to={s.href}>{s.label}</Link>
              </span>
            ))}
          </p>
          <div className="journey-nav">
            <button type="button" disabled={at === 0} onClick={() => choose(at - 1)}>
              ← Back
            </button>
            <button type="button" disabled={at === journey.stops.length - 1} onClick={() => choose(at + 1)}>
              Next stop →
            </button>
          </div>
        </article>
      </div>
      <ol className="journey-steps">
        {journey.stops.map((s, i) => (
          <li key={s.id}>
            <button type="button" aria-current={i === at ? "step" : undefined} className={i <= at ? "is-reached" : ""} onClick={() => choose(i)}>
              <span className="journey-step-n">{i + 1}</span>
              <span className="journey-step-name">{s.name}</span>
            </button>
          </li>
        ))}
      </ol>
      <p className="journey-note">{journey.note}</p>
    </section>
  );
}
