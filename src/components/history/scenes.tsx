import type { CSSProperties, ReactNode } from "react";

/**
 * The cinematic shots for /church-history, Act I: Pentecost to Nicaea.
 *
 * Theatre owns one sticky stage. Global `--p` on `.ch-theatre` maps to a local
 * `--p` per `[data-shot]` (see src/lib/scrollScene.ts). Elements carry `--start`
 * and `--dur` on a 0s–1s timeline plus one of the shared keyframe classes in
 * styles.css, so a new shot needs artwork and timings only — no CSS.
 *
 * All of it is decoration. The facts it shows are stated in the timeline below, so the
 * theatre is aria-hidden and the crawler reads each fact once. The `note` fields
 * on figures are not rendered.
 */

type Timing = { start?: string; dur?: string; stagger?: string; i?: number; len?: number };

/** Timing values as custom properties. */
function t(v: Timing): CSSProperties {
  const out: Record<string, string | number> = {};
  if (v.start !== undefined) out["--start"] = v.start;
  if (v.dur !== undefined) out["--dur"] = v.dur;
  if (v.stagger !== undefined) out["--stagger"] = v.stagger;
  if (v.i !== undefined) out["--i"] = v.i;
  if (v.len !== undefined) out["--len"] = v.len;
  return out as CSSProperties;
}

/** Gradients shared by every scene. Rendered once per page, not once per scene. */
export function SceneDefs() {
  return (
    <svg className="ch-defs" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="chFlameGlow">
          <stop offset="0%" stopColor="#ffb765" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#ffb765" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="chBlazeGlow">
          <stop offset="0%" stopColor="#ff8a3c" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ff8a3c" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function Shot({
  id,
  art,
  caption,
  className
}: {
  id: string;
  art?: ReactNode;
  caption: ReactNode;
  className?: string;
}) {
  return (
    <div className={"ch-shot" + (className ? " " + className : "")} data-shot={id}>
      {art != null ? (
        <svg className="ch-svg" viewBox="0 0 800 360" role="presentation" focusable="false">
          {art}
        </svg>
      ) : null}
      <div className="ch-cap">{caption}</div>
    </div>
  );
}

/* ---------------------------------------------------------------- Pentecost */

const FLAME_COUNT = 12;
const WIND_LINES = [72, 116, 160, 204];
const FLAME_OUTER = "M0 0 C-13 -13 -14 -32 0 -60 C14 -32 13 -13 0 0 Z";
const FLAME_INNER = "M0 -7 C-6 -15 -6 -28 0 -41 C6 -28 6 -15 0 -7 Z";

/**
 * The order follows the text: a *sound* as of a rushing mighty wind (v.2) comes
 * first — there is no light in Acts 2 — then fire, and the fire is *cloven*,
 * resting upon each of them (v.3). Hence separate tongues, not one; twelve are drawn
 * for legibility, not as a count (Acts gives the company as about 120, 1:15).
 */
function PentecostScene() {
  return (
    <Shot
      id="pentecost"
      art={
        <>
          <g>
            {WIND_LINES.map((y, i) => (
              <path
                key={y}
                className="ch-anim ch-sweep ch-wind-line"
                style={t({ start: "0.04s", dur: "0.3s", stagger: "0.03s", i })}
                d={"M-160 " + y + " C 90 " + (y - 26) + ", 300 " + (y + 26) + ", 560 " + y}
              />
            ))}
          </g>
          <g>
            {Array.from({ length: FLAME_COUNT }, (_, i) => {
              const p = i / (FLAME_COUNT - 1);
              const x = 96 + p * 608;
              const y = 330 - Math.sin(p * Math.PI) * 44;
              return (
                <g key={i} transform={"translate(" + x.toFixed(1) + " " + y.toFixed(1) + ")"}>
                  <g className="ch-anim ch-rise" style={t({ start: "0.3s", dur: "0.2s", stagger: "0.018s", i })}>
                    <ellipse className="ch-flame-glow" cx="0" cy="-30" rx="30" ry="46" />
                    <path className="ch-flame-outer" d={FLAME_OUTER} />
                    <path className="ch-flame-inner" d={FLAME_INNER} />
                  </g>
                </g>
              );
            })}
          </g>
        </>
      }
      caption={
        <>
          <p className="ch-cap-ref ch-anim ch-fade-up" style={t({ start: "0.12s", dur: "0.12s" })}>
            Acts 2
          </p>
          <p className="ch-cap-date ch-anim ch-fade-up" style={t({ start: "0.18s", dur: "0.11s" })}>
            AD 33
          </p>
          <p className="ch-cap-count ch-anim ch-fade-up" style={t({ start: "0.24s", dur: "0.12s" })}>
            <strong>c. 3,000</strong>
            <span>added that day</span>
          </p>
        </>
      }
    />
  );
}

/* ------------------------------------------------------ Acts 2 through 28 */

const CHAPTERS = Array.from({ length: 26 }, (_, i) => i + 2); // 2 … 27, then 28 lands

/** Chapters flip 2 → 28; Paul in Rome, c. AD 62. The book art is gone — type only. */
function ActsBookScene() {
  return (
    <Shot
      id="acts-book"
      className="ch-shot--text"
      caption={
        <>
          <p className="ch-cap-ref ch-chapters">
            <span className="ch-anim ch-blip ch-chapter ch-chapter-first" style={t({ start: "0.06s", dur: "0.18s" })}>
              Acts 2
            </span>
            {CHAPTERS.filter((n) => n !== 2).map((n, i) => (
              <span key={n} className="ch-anim ch-blip ch-chapter" style={t({ start: "0.22s", dur: "0.05s", stagger: "0.018s", i })}>
                Acts {n}
              </span>
            ))}
            <span className="ch-anim ch-fade-up ch-chapter ch-chapter-last" style={t({ start: "0.74s", dur: "0.12s" })}>
              Acts 28
            </span>
          </p>
          <p className="ch-cap-date ch-anim ch-fade-up" style={t({ start: "0.22s", dur: "0.11s" })}>
            c. AD 62
          </p>
        </>
      }
    />
  );
}

/* ----------------------------------------------------- Shared stick Caesar */

/**
 * Small classical wreath: a thin band with a forehead gap, leaves only at the
 * temples — the familiar Caesar look, not a full leafy helmet.
 */
function LaurelWreath() {
  // SVG y-down: π=left, 3π/2=up, 2π=right. Gap across the brow (near 3π/2).
  const side = (from: number, to: number, key: string) =>
    Array.from({ length: 4 }, (_, i) => {
      const u = i / 3;
      const ang = from + (to - from) * u;
      const r = 19;
      const cx = Math.cos(ang) * r;
      const cy = Math.sin(ang) * r - 40;
      const rot = (ang * 180) / Math.PI + 90;
      return (
        <ellipse
          key={key + i}
          className="ch-wreath-leaf"
          cx={cx}
          cy={cy}
          rx="2.4"
          ry="6.2"
          transform={"rotate(" + rot.toFixed(1) + " " + cx.toFixed(1) + " " + cy.toFixed(1) + ")"}
        />
      );
    });
  return (
    <g className="ch-wreath">
      {/* Thin side bands; open gap at the forehead */}
      <path className="ch-wreath-band" d="M-16 -50 A19 19 0 0 0 -18 -32" />
      <path className="ch-wreath-band" d="M16 -50 A19 19 0 0 1 18 -32" />
      {/* Left temple: mid-left up toward (but not across) the brow */}
      {side(Math.PI * 0.95, Math.PI * 1.32, "L")}
      {/* Right temple */}
      {side(Math.PI * 1.68, Math.PI * 2.05, "R")}
    </g>
  );
}

/**
 * Stance and green laurel are shared so Nero's red horns rhyme with Constantine's
 * gold halo. Empty hands; Nero's left arm waves later to raise the crosses.
 * Halo sits above the head (angel ring), not behind it.
 */
function CaesarFigure({ mode }: { mode: "nero" | "constantine" }) {
  const leftArm = <path className="ch-mark" d="M0 -8 L-42 8" />;
  return (
    <g transform="translate(400 190)">
      <g className="ch-anim ch-fade-up" style={t({ start: "0.1s", dur: "0.16s" })}>
        <circle className="ch-figure" cx="0" cy="-40" r="17" />
        <path className="ch-mark" d="M0 -23 L0 34 M-22 100 L0 34 L22 100 M0 -8 L38 12" />
        {mode === "constantine" ? leftArm : null}
        <LaurelWreath />
      </g>
      {mode === "nero" ? (
        <>
          <g className="ch-anim ch-rise" style={t({ start: "0.3s", dur: "0.14s" })}>
            {/* Short horns: thick at the brow, taper to a sharper inward tip. */}
            <path className="ch-horn" d="M-13 -52 C-23 -55 -26 -63 -15 -74 L-11 -66 C-10 -60 -10 -55 -13 -52 Z" />
            <path className="ch-horn" d="M13 -52 C23 -55 26 -63 15 -74 L11 -66 C10 -60 10 -55 13 -52 Z" />
          </g>
          <g className="ch-anim ch-fade-up" style={t({ start: "0.34s", dur: "0.12s" })}>
            {leftArm}
          </g>
        </>
      ) : (
        // Flat ring above the head: wide on X, short on Y (tilted halo).
        <ellipse
          className="ch-anim ch-pop ch-oc ch-halo"
          style={t({ start: "0.3s", dur: "0.16s" })}
          cx="0"
          cy="-78"
          rx="26"
          ry="7"
        />
      )}
    </g>
  );
}

/* --------------------------------------------------------------- Nero, 64 */

const NERO_CROSSES: [number, number][] = [
  [92, 310],
  [198, 324],
  [298, 302],
  [502, 304],
  [602, 322],
  [708, 308]
];

/** Laurel first, then red horns; the left-hand wave raises occupied crosses. */
function NeroScene() {
  return (
    <Shot
      id="nero"
      art={
        <>
          <CaesarFigure mode="nero" />
          <g>
            {NERO_CROSSES.map(([x, y], i) => (
              <g key={x} transform={"translate(" + x + " " + y + ")"}>
                <g className="ch-anim ch-rise" style={t({ start: "0.48s", dur: "0.14s", stagger: "0.03s", i })}>
                  <path className="ch-mark" d="M0 32 L0 -48 M-18 -22 L18 -22" />
                  <circle className="ch-figure" cx="0" cy="-34" r="6" />
                  <path className="ch-mark" d="M0 -28 L0 10 M-15 -20 L15 -20 M0 10 L-8 26 M0 10 L8 26" />
                </g>
              </g>
            ))}
          </g>
        </>
      }
      caption={
        <>
          <p className="ch-cap-ref ch-anim ch-fade-up" style={t({ start: "0.12s", dur: "0.12s" })}>
            Rome Under Nero
          </p>
          <p className="ch-cap-date ch-anim ch-fade-up" style={t({ start: "0.18s", dur: "0.11s" })}>
            AD 64
          </p>
          <p className="ch-cap-count ch-anim ch-fade-up" style={t({ start: "0.24s", dur: "0.12s" })}>
            <span>the first known persecution by Rome</span>
          </p>
        </>
      }
    />
  );
}

/* ---------------------------------------------------------- Jerusalem, 70 */

const STARS: [number, number][] = [
  [150, 70],
  [232, 120],
  [318, 62],
  [404, 108],
  [486, 58],
  [566, 112],
  [648, 74],
  [96, 150],
  [712, 140]
];

/**
 * Sun, moon and stars darken and fall — the prophets' picture of a nation's fall
 * (Isaiah 13:10). Decoration only: the timeline text makes no claim about Matthew 24:29.
 */
function JerusalemScene() {
  return (
    <Shot
      id="jerusalem"
      art={
        <>
          <g transform="translate(196 96)">
            <g className="ch-anim ch-fall ch-oc" style={t({ start: "0.74s", dur: "0.3s" })}>
              <g className="ch-anim ch-pop ch-oc" style={t({ start: "0.08s", dur: "0.14s" })}>
                <circle className="ch-anim ch-darken ch-body" style={t({ start: "0.44s", dur: "0.16s" })} r="30" />
                <path className="ch-ray" d="M0 -46 L0 -58 M0 46 L0 58 M-46 0 L-58 0 M46 0 L58 0 M-33 -33 L-41 -41 M33 33 L41 41 M-33 33 L-41 41 M33 -33 L41 -41" />
              </g>
            </g>
          </g>
          <g transform="translate(604 92)">
            <g className="ch-anim ch-fall ch-oc" style={t({ start: "0.78s", dur: "0.3s" })}>
              <g className="ch-anim ch-pop ch-oc" style={t({ start: "0.13s", dur: "0.14s" })}>
                <path className="ch-anim ch-darken ch-body" style={t({ start: "0.46s", dur: "0.16s" })} d="M0 -30 A30 30 0 1 0 0 30 A24 24 0 1 1 0 -30 Z" />
              </g>
            </g>
          </g>
          <g>
            {STARS.map(([x, y], i) => (
              <g key={x + "-" + y} transform={"translate(" + x + " " + y + ")"}>
                <g className="ch-anim ch-fall ch-oc" style={t({ start: "0.72s", dur: "0.32s", stagger: "0.012s", i })}>
                  <path
                    className="ch-anim ch-pop ch-oc ch-body ch-star"
                    style={t({ start: "0.18s", dur: "0.14s", stagger: "0.012s", i })}
                    d="M0 -13 L3.4 -3.4 L13 0 L3.4 3.4 L0 13 L-3.4 3.4 L-13 0 L-3.4 -3.4 Z"
                  />
                </g>
              </g>
            ))}
          </g>
          <g className="ch-anim ch-fade ch-city" style={t({ start: "0.3s", dur: "0.16s" })}>
            <path d="M120 320 L120 268 L180 268 L180 320 Z M198 320 L198 250 L258 250 L258 320 Z" />
            <path d="M520 320 L520 254 L580 254 L580 320 Z M600 320 L600 274 L660 274 L660 320 Z" />
          </g>
          <g transform="translate(400 265)">
            <g className="ch-anim ch-topple ch-oc" style={t({ start: "0.78s", dur: "0.2s" })}>
              <g className="ch-anim ch-fade ch-city" style={t({ start: "0.3s", dur: "0.16s" })}>
                <path d="M-100 55 L-100 -39 L-82 -55 L82 -55 L100 -39 L100 55 Z" />
                <path d="M-70 -55 L-70 -7 M-30 -55 L-30 -7 M10 -55 L10 -7 M50 -55 L50 -7 M70 -55 L70 -7" />
              </g>
            </g>
          </g>
        </>
      }
      caption={
        <>
          <p className="ch-cap-ref ch-anim ch-fade-up" style={t({ start: "0.12s", dur: "0.12s" })}>
            The temple falls
          </p>
          <p className="ch-cap-date ch-anim ch-fade-up" style={t({ start: "0.18s", dur: "0.11s" })}>
            AD 70
          </p>
        </>
      }
    />
  );
}

/* ------------------------------------------- Apostolic Fathers, 96 to 155 */

const FATHERS = [
  { x: 172, name: "Clement", note: "to Corinth, c. 96" },
  { x: 400, name: "Ignatius", note: "seven letters, c. 110" },
  { x: 628, name: "Polycarp", note: "martyred, c. 156" }
];

/** The generation that had known the apostles, writing to steady the churches. */
function ApostolicFathersScene() {
  return (
    <Shot
      id="apostolic-fathers"
      art={
        <g>
          {FATHERS.map((f, i) => (
            <g key={f.name} transform={"translate(" + f.x + " 178)"}>
              <g className="ch-anim ch-fade-up" style={t({ start: "0.16s", dur: "0.16s", stagger: "0.13s", i })}>
                <path className="ch-scroll" d="M-72 -86 L72 -86 L72 86 L-72 86 Z" />
                <path className="ch-scroll-line" d="M-46 -50 L46 -50 M-46 -22 L46 -22 M-46 6 L46 6 M-46 34 L10 34" />
                <circle className="ch-seal" cx="0" cy="70" r="12" />
              </g>
              <text className="ch-anim ch-fade-up ch-figure-name" style={t({ start: "0.24s", dur: "0.14s", stagger: "0.13s", i })} x="0" y="132">
                {f.name}
              </text>
            </g>
          ))}
        </g>
      }
      caption={
        <>
          <p className="ch-cap-ref ch-anim ch-fade-up" style={t({ start: "0.12s", dur: "0.12s" })}>
            The Apostolic Fathers
          </p>
          <p className="ch-cap-date ch-anim ch-fade-up" style={t({ start: "0.18s", dur: "0.11s" })}>
            c. AD 96–156
          </p>
        </>
      }
    />
  );
}

/* ------------------------------------------------ Persecution, Decius 250 */

const DECIAN_FATHERS = [
  { x: 172, name: "Origen", note: "tortured, c. 250" },
  { x: 400, name: "Cyprian", note: "Carthage" },
  { x: 628, name: "Fabian", note: "martyred, 250" }
];

/** Origen, Cyprian, Fabian — the same scroll marks as the Apostolic Fathers. */
function PersecutionScene() {
  return (
    <Shot
      id="persecution"
      art={
        <g>
          {DECIAN_FATHERS.map((f, i) => (
            <g key={f.name} transform={"translate(" + f.x + " 178)"}>
              <g className="ch-anim ch-fade-up" style={t({ start: "0.16s", dur: "0.16s", stagger: "0.13s", i })}>
                <path className="ch-scroll" d="M-72 -86 L72 -86 L72 86 L-72 86 Z" />
                <path className="ch-scroll-line" d="M-46 -50 L46 -50 M-46 -22 L46 -22 M-46 6 L46 6 M-46 34 L10 34" />
                <circle className="ch-seal" cx="0" cy="70" r="12" />
              </g>
              <text className="ch-anim ch-fade-up ch-figure-name" style={t({ start: "0.24s", dur: "0.14s", stagger: "0.13s", i })} x="0" y="132">
                {f.name}
              </text>
            </g>
          ))}
        </g>
      }
      caption={
        <>
          <p className="ch-cap-ref ch-anim ch-fade-up" style={t({ start: "0.12s", dur: "0.12s" })}>
            Sacrifice to the gods
          </p>
          <p className="ch-cap-date ch-anim ch-fade-up" style={t({ start: "0.18s", dur: "0.11s" })}>
            AD 250
          </p>
          <p className="ch-cap-count ch-anim ch-fade-up" style={t({ start: "0.24s", dur: "0.12s" })}>
            <span>Under Decius</span>
            <span>the first empire-wide order to sacrifice</span>
          </p>
        </>
      }
    />
  );
}

/* ------------------------------------ The Great Persecution, 303 to 313 */

/** Diocletian: the churches pulled down, the Scriptures burned. */
function GreatPersecutionScene() {
  return (
    <Shot
      id="great-persecution"
      art={
        <>
          <ellipse className="ch-anim ch-fade ch-blaze-glow ch-oc" style={t({ start: "0.3s", dur: "0.24s" })} cx="252" cy="220" rx="180" ry="120" />
          <g transform="translate(252 236)">
            <g className="ch-anim ch-fade" style={t({ start: "0.1s", dur: "0.14s" })}>
              <path className="ch-scroll" d="M-84 -64 L84 -64 L84 64 L-84 64 Z" />
              <path className="ch-scroll-line" d="M-56 -30 L56 -30 M-56 -2 L56 -2 M-56 26 L20 26" />
            </g>
          </g>
          <g>
            {Array.from({ length: 6 }, (_, i) => (
              <g key={i} transform={"translate(" + (168 + i * 34) + " 176) scale(1.2)"}>
                <path
                  className="ch-anim ch-rise ch-flame-outer"
                  style={t({ start: "0.34s", dur: "0.2s", stagger: "0.02s", i })}
                  d={FLAME_OUTER}
                />
              </g>
            ))}
          </g>
          <g transform="translate(580 0)">
            <g className="ch-anim ch-topple ch-oc" style={t({ start: "0.56s", dur: "0.26s" })}>
              <g className="ch-anim ch-fade ch-city" style={t({ start: "0.12s", dur: "0.14s" })}>
                <path d="M-90 320 L-90 168 L0 104 L90 168 L90 320 Z" />
                <path d="M0 104 L0 56 M-22 78 L22 78" />
                <path d="M-30 320 L-30 234 C-30 214, 30 214, 30 234 L30 320 Z" />
              </g>
            </g>
          </g>
        </>
      }
      caption={
        <>
          <p className="ch-cap-ref ch-anim ch-fade-up" style={t({ start: "0.12s", dur: "0.12s" })}>
            The Great Persecution
          </p>
          <p className="ch-cap-date ch-anim ch-fade-up" style={t({ start: "0.18s", dur: "0.11s" })}>
            AD 303–313
          </p>
          <p className="ch-cap-count ch-anim ch-fade-up" style={t({ start: "0.24s", dur: "0.12s" })}>
            <span>Under Emperor Diocletian</span>
          </p>
        </>
      }
    />
  );
}

/* --------------------------------------------------- Edict of Milan, 313 */

/** The same Caesar as Nero, halo instead of horns — toleration at Milan, not the battle. */
function MilanScene() {
  return (
    <Shot
      id="milan"
      art={<CaesarFigure mode="constantine" />}
      caption={
        <>
          <p className="ch-cap-ref ch-anim ch-fade-up" style={t({ start: "0.12s", dur: "0.12s" })}>
            Freedom of worship for all
          </p>
          <p className="ch-cap-date ch-anim ch-fade-up" style={t({ start: "0.18s", dur: "0.11s" })}>
            AD 313
          </p>
          <p className="ch-cap-count ch-anim ch-fade-up" style={t({ start: "0.24s", dur: "0.12s" })}>
            <span>Edict of Milan</span>
          </p>
        </>
      }
    />
  );
}

/* ----------------------------------------------------------- Nicaea, 325 */

const BISHOPS = 15;

/** The hinge. Everything before is ante-Nicene, everything after post-Nicene. */
function NicaeaScene() {
  return (
    <Shot
      id="nicaea"
      art={
        <>
          <g>
            {Array.from({ length: BISHOPS }, (_, i) => {
              const a = Math.PI * (0.06 + (i / (BISHOPS - 1)) * 0.88);
              const x = 400 - Math.cos(a) * 336;
              const y = 236 - Math.sin(a) * 118;
              return (
                <g key={i} transform={"translate(" + x.toFixed(1) + " " + y.toFixed(1) + ")"}>
                  <g className="ch-anim ch-fade-up ch-figure" style={t({ start: "0.12s", dur: "0.16s", stagger: "0.022s", i })}>
                    <circle cy="-26" r="11" />
                    <path d="M-16 0 C-16 -14, 16 -14, 16 0 Z" />
                  </g>
                </g>
              );
            })}
          </g>
          <text className="ch-anim ch-fade-up ch-greek" style={t({ start: "0.22s", dur: "0.16s" })} x="400" y="330">
            ὁμοούσιον
          </text>
        </>
      }
      caption={
        <>
          <p className="ch-cap-ref ch-anim ch-fade-up" style={t({ start: "0.12s", dur: "0.12s" })}>
            Of one substance
          </p>
          <p className="ch-cap-date ch-anim ch-fade-up" style={t({ start: "0.18s", dur: "0.11s" })}>
            AD 325
          </p>
          <p className="ch-cap-count ch-anim ch-fade-up" style={t({ start: "0.24s", dur: "0.12s" })}>
            <span>The Council of Nicaea rejects the teaching of Arius.</span>
          </p>
        </>
      }
    />
  );
}

/** Shot id (from server/churchHistory.ts) to component. */
export const SCENES: Record<string, () => ReactNode> = {
  pentecost: PentecostScene,
  "acts-book": ActsBookScene,
  nero: NeroScene,
  jerusalem: JerusalemScene,
  "apostolic-fathers": ApostolicFathersScene,
  persecution: PersecutionScene,
  "great-persecution": GreatPersecutionScene,
  milan: MilanScene,
  nicaea: NicaeaScene
};

export function Theatre({ shots }: { shots: string[] }) {
  return (
    <section className="ch-theatre" data-scene="act-one" aria-hidden="true" style={{ ["--shot-count" as string]: shots.length }}>
      <div className="ch-stage">
        <div className="ch-backdrop" />
        {shots.map((id) => {
          const Comp = SCENES[id];
          return Comp ? <Comp key={id} /> : null;
        })}
      </div>
    </section>
  );
}
