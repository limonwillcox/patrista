import { lazy, Suspense, useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { fetchTypes, type TypeEntry } from "../api/connections";
import { TabernaclePlan } from "../components/tabernacle/TabernaclePlan";
import {
  FINISHED_PAIRS,
  GUESSES,
  PATH,
  SABBATH_PAIR,
  SPEECHES,
  pieceById,
  refHref,
  refLabel,
  type Pair,
  type PieceId,
  type Ref
} from "../data/tabernacle";
import { webglAvailable } from "../three/support";
import "../styles/tabernacle.css";

const TabernacleStage = lazy(() => import("../components/tabernacle/TabernacleStage"));

/*
 * /tabernacle: the tabernacle of Exodus built to the text's own measures, with the priest's way in from the
 * gate to the ark. One thing on screen at a time: the model, the step, the piece. What the text leaves open
 * and the creation echoes sit below, closed. Data and every choice: src/data/tabernacle.ts.
 */

function RefLink({ r }: { r: Ref }) {
  return (
    <Link className="tb-ref" to={refHref(r)}>
      {refLabel(r)}
    </Link>
  );
}

export function TabernaclePage() {
  const [has3d] = useState(() => webglAvailable());
  const [step, setStep] = useState(-1);
  const [selected, setSelected] = useState<PieceId | null>(null);
  const [lifted, setLifted] = useState(false);

  useEffect(() => {
    document.title = "The tabernacle · Patrista";
  }, []);

  function go(i: number) {
    const next = Math.max(-1, Math.min(PATH.length - 1, i));
    const s = PATH[next];
    setStep(next);
    setSelected(s ? s.piece : null);
    // Inside the tent the coverings come off so the furniture can be seen; outside they go back on.
    setLifted(Boolean(s?.inside));
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === "ArrowRight") go(step + 1);
    else if (e.key === "ArrowLeft") go(step - 1);
    else if (e.key === "Escape") setSelected(null);
    else return;
    e.preventDefault();
  }

  const current = PATH[step];
  const atStep = current && current.piece === selected;

  return (
    <div className="tb-page">
      <header className="tb-hero">
        <p className="tb-kicker">Exodus 25–40</p>
        <h1>The tabernacle</h1>
        <p className="tb-lede">
          Built to the measures the text gives, in cubits. Tap any part to read where Scripture describes it, or walk the
          priest's way in from the gate.
        </p>
      </header>

      <section className="tb-view" aria-label="The tabernacle">
        <div className={"tb-stage" + (has3d ? "" : " tb-stage--plan")} role="group" tabIndex={0} onKeyDown={onKey} aria-label="The tabernacle. Left and right arrow keys walk the priest's way in.">
          {has3d ? (
            <Suspense fallback={<p className="tb-loading">Setting up the tabernacle…</p>}>
              <TabernacleStage step={step} selected={selected} lifted={lifted} onPick={setSelected} />
            </Suspense>
          ) : (
            <TabernaclePlan step={step} selected={selected} onPick={setSelected} />
          )}
          {has3d ? (
            <>
              <button type="button" className="tb-lift" aria-pressed={lifted} onClick={() => setLifted(!lifted)}>
                {lifted ? "Cover the tent" : "Lift the coverings"}
              </button>
              <p className="tb-tip">Drag to turn · pinch or scroll to zoom</p>
            </>
          ) : null}
        </div>

        <nav className="tb-walk" aria-label="The priest's way in">
          <button type="button" onClick={() => go(step - 1)} disabled={step < 0} aria-label="Back a step">
            ←
          </button>
          <p className="tb-walk-at" aria-live="polite">
            {current ? (
              <>
                <span>
                  {step + 1} of {PATH.length}
                </span>{" "}
                {pieceById(current.piece).name}
              </>
            ) : (
              "The whole court"
            )}
          </p>
          {step >= PATH.length - 1 ? (
            <button type="button" onClick={() => go(-1)} aria-label="Back to the whole court">
              ↺
            </button>
          ) : (
            <button type="button" className={step < 0 ? "tb-walk-start" : ""} onClick={() => go(step + 1)} aria-label={step < 0 ? undefined : "Next step"}>
              {step < 0 ? "Walk in →" : "→"}
            </button>
          )}
        </nav>

        <aside className="tb-panel" aria-live="polite">
          {atStep ? (
            <p className="tb-step-line">
              {current.line} <RefLink r={current.lineRef} />
            </p>
          ) : null}
          {selected ? (
            <PiecePanel id={selected} onClose={() => setSelected(null)} />
          ) : (
            <div className="tb-intro">
              <p>
                A court a hundred cubits by fifty, and in it a tent of gold-covered boards ten cubits high.
              </p>
              <p>Tap a part of the tabernacle, or walk in.</p>
              {step >= 0 ? (
                <button type="button" className="tb-link-button" onClick={() => go(-1)}>
                  Back to the whole court
                </button>
              ) : null}
            </div>
          )}
        </aside>
      </section>

      <details className="tb-more">
        <summary>
          What the text does not say <span>{GUESSES.length} choices</span>
        </summary>
        <p className="tb-more-lede">
          Where Exodus gives no number, the model has to choose one. Each choice is here, with the verse that leaves it open.
        </p>
        <ul className="tb-guesses">
          {GUESSES.map((g) => (
            <li key={g.what}>
              <h3>{g.what}</h3>
              <p>
                <b>Drawn:</b> {g.chosen}
              </p>
              <p className="tb-muted">
                {g.why}{" "}
                {g.refs.map((r, i) => (
                  <span key={refLabel(r)}>
                    {i ? ", " : ""}
                    <RefLink r={r} />
                  </span>
                ))}
              </p>
            </li>
          ))}
        </ul>
      </details>

      <details className="tb-more">
        <summary>The creation in the text</summary>
        <p className="tb-more-lede">
          Echoes in the wording of Scripture itself, not types drawn by the Fathers. Where the same Hebrew word stands behind
          both verses (by the Strong's numbers in this site's KJV), it is marked.
        </p>

        <h3 className="tb-sub">Seven speeches</h3>
        <p>In Exodus 25–31 the LORD speaks to Moses seven times. The seventh is about the sabbath.</p>
        <ol className="tb-speeches">
          {SPEECHES.map((s) => (
            <li key={refLabel(s.quote.ref)}>
              <RefLink r={s.quote.ref} /> <span className="tb-muted">“{s.quote.text}”</span> — {s.about}
            </li>
          ))}
        </ol>
        <PairView pair={SABBATH_PAIR} />

        <h3 className="tb-sub">The work finished</h3>
        <p>When the work is done, the words of Genesis 1:31–2:3 come back.</p>
        {FINISHED_PAIRS.map((p) => (
          <PairView key={refLabel(p.a.ref) + refLabel(p.b.ref)} pair={p} />
        ))}
      </details>
    </div>
  );
}

/** The clicked piece: its name, one plain sentence, its verses, and the Fathers' type if the atlas has one. */
function PiecePanel({ id, onClose }: { id: PieceId; onClose: () => void }) {
  const p = pieceById(id);
  const [type, setType] = useState<TypeEntry | null>(null);
  useEffect(() => {
    setType(null);
    if (!p.typeId) return;
    let live = true;
    fetchTypes().then((all) => {
      if (live) setType(all?.find((t) => t.id === p.typeId) ?? null);
    });
    return () => {
      live = false;
    };
  }, [p.typeId]);

  return (
    <article className="tb-piece">
      <header>
        <h2>{p.name}</h2>
        <button type="button" className="tb-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </header>
      <p>{p.about}</p>
      <p className="tb-refs">
        <span>Read it:</span>
        {p.refs.map((r) => (
          <RefLink key={refLabel(r)} r={r} />
        ))}
      </p>
      {type ? (
        <p className="tb-type">
          <span>A type the Fathers draw</span>
          <Link to={"/types?type=" + encodeURIComponent(type.id.replace(/^\d+:/, ""))}>{type.label} →</Link>
        </p>
      ) : null}
    </article>
  );
}

/** "behold" → <mark>behold</mark>, whole words only. */
function marked(text: string, words: string[]): ReactNode {
  const re = new RegExp("\\b(" + words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")\\b", "gi");
  return text.split(re).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part));
}

function PairView({ pair }: { pair: Pair }) {
  const hebrew = pair.shared.filter((w) => w.strongs);
  const english = pair.shared.filter((w) => !w.strongs);
  return (
    <figure className="tb-pair">
      <div className="tb-pair-verses">
        <blockquote>
          <RefLink r={pair.a.ref} />
          <p>{marked(pair.a.text, pair.shared.map((w) => w.a))}</p>
        </blockquote>
        <blockquote>
          <RefLink r={pair.b.ref} />
          <p>{marked(pair.b.text, pair.shared.map((w) => w.b))}</p>
        </blockquote>
      </div>
      <figcaption>
        {hebrew.length ? <>Same Hebrew word: {hebrew.map((w) => (w.a === w.b ? w.a : w.a + " / " + w.b)).join("; ")}</> : null}
        {hebrew.length && english.length ? ". " : null}
        {english.length ? <>Same English word: {english.map((w) => w.a).join("; ")}</> : null}
      </figcaption>
    </figure>
  );
}
