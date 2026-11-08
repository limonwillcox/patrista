import type { KeyboardEvent, ReactNode } from "react";
import {
  ARK,
  BOARD,
  BRASEN_ALTAR,
  COURT,
  INCENSE_ALTAR,
  LAMPSTAND,
  LAVER,
  PATH,
  PLACE,
  PRIEST_START,
  TABLE,
  TENT,
  pieceById,
  type PieceId
} from "../../data/tabernacle";

/*
 * The floor plan, seen from above, from the same numbers as the 3D model. Shown when the browser cannot
 * draw WebGL. East is to the right (the gate), north is up; one SVG unit is one cubit.
 */

type Props = { step: number; selected: PieceId | null; onPick: (id: PieceId | null) => void };

const E = COURT.length / 2;
const S = COURT.breadth / 2;
const L = TENT.innerLength;
const W2 = TENT.innerBreadth / 2;
const T = BOARD.thickness;

export function TabernaclePlan({ step, selected, onPick }: Props) {
  const stand = PATH[step]?.stand ?? PRIEST_START;

  /** One clickable piece of the plan. */
  const part = (id: PieceId, children: ReactNode) => (
    <g
      className={"tb-plan-part" + (selected === id ? " is-on" : "")}
      role="button"
      tabIndex={0}
      aria-label={pieceById(id).name}
      aria-pressed={selected === id}
      onClick={(e) => {
        e.stopPropagation();
        onPick(id);
      }}
      onKeyDown={(e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPick(id);
        }
      }}
    >
      <title>{pieceById(id).name}</title>
      {children}
    </g>
  );

  const pillars: [number, number][] = [];
  for (let x = -E; x <= E; x += COURT.pillarSpacing) pillars.push([x, S], [x, -S]);
  for (let z = -S + COURT.pillarSpacing; z < S; z += COURT.pillarSpacing) pillars.push([E, z], [-E, z]);
  const rect = (cx: number, cz: number, w: number, d: number, cls: string) => (
    <rect className={cls} x={cx - w / 2} y={cz - d / 2} width={w} height={d} />
  );
  const lampStep = LAMPSTAND.span / 6;

  return (
    <div className="tb-plan">
      <svg viewBox={`${-E - 6} ${-S - 5} ${COURT.length + 12} ${COURT.breadth + 10}`} role="group" aria-label="Floor plan of the tabernacle and its court">
        <rect className="tb-plan-ground" x={-E - 6} y={-S - 5} width={COURT.length + 12} height={COURT.breadth + 10} onClick={() => onPick(null)} />
        {part(
          "court",
          <>
            <rect className="tb-plan-court" x={-E} y={-S} width={COURT.length} height={COURT.breadth} />
            <path className="tb-plan-fence" d={`M${E},${-COURT.gate / 2} V${-S} H${-E} V${S} H${E} V${COURT.gate / 2}`} />
            {pillars.map(([x, z]) => (
              <circle key={x + "," + z} className="tb-plan-pillar" cx={x} cy={z} r={0.55} />
            ))}
          </>
        )}
        {part("gate", <line className="tb-plan-hanging" x1={E} y1={-COURT.gate / 2} x2={E} y2={COURT.gate / 2} />)}
        {part("brasenAltar", rect(PLACE.brasenAltar[0], PLACE.brasenAltar[1], BRASEN_ALTAR.length, BRASEN_ALTAR.breadth, "tb-plan-brass"))}
        {part("laver", <circle className="tb-plan-brass" cx={PLACE.laver[0]} cy={PLACE.laver[1]} r={LAVER.diameter / 2} />)}
        {part(
          "tent",
          <path
            className="tb-plan-boards"
            fillRule="evenodd"
            d={`M0,${-W2 - T} H${-L - T} V${W2 + T} H0 V${W2} H${-L} V${-W2} H0 Z`}
          />
        )}
        <rect className="tb-plan-holy" x={-L} y={-W2} width={L} height={TENT.innerBreadth} />
        {part("veil", <line className="tb-plan-hanging" x1={PLACE.veil} y1={-W2} x2={PLACE.veil} y2={W2} />)}
        {part("door", <line className="tb-plan-hanging" x1={0} y1={-W2} x2={0} y2={W2} />)}
        {part("table", rect(PLACE.table[0], PLACE.table[1], TABLE.length, TABLE.breadth, "tb-plan-gold"))}
        {part(
          "lampstand",
          <>
            <rect className="tb-plan-hit" x={PLACE.lampstand[0] - 1.6} y={PLACE.lampstand[1] - 0.8} width={3.2} height={1.6} />
            <line className="tb-plan-stem" x1={PLACE.lampstand[0] - LAMPSTAND.span / 2} y1={PLACE.lampstand[1]} x2={PLACE.lampstand[0] + LAMPSTAND.span / 2} y2={PLACE.lampstand[1]} />
            {[-3, -2, -1, 0, 1, 2, 3].map((k) => (
              <circle key={k} className="tb-plan-gold" cx={PLACE.lampstand[0] + k * lampStep} cy={PLACE.lampstand[1]} r={0.16} />
            ))}
          </>
        )}
        {part("incenseAltar", rect(PLACE.incenseAltar[0], PLACE.incenseAltar[1], INCENSE_ALTAR.length, INCENSE_ALTAR.breadth, "tb-plan-gold"))}
        {part("ark", rect(PLACE.ark[0], PLACE.ark[1], ARK.breadth, ARK.length, "tb-plan-gold"))}
        {part("priest", <circle className="tb-plan-priest" cx={stand[0]} cy={stand[1]} r={1} />)}
        <g className="tb-plan-key" aria-hidden="true">
          <text x={-E} y={-S - 1.6}>N ↑</text>
          <text x={E} y={-S - 1.6} textAnchor="end">
            E → gate
          </text>
          <line x1={-E} y1={S + 2.5} x2={-E + 10} y2={S + 2.5} />
          <text x={-E + 11} y={S + 3.4}>
            10 cubits
          </text>
        </g>
      </svg>
    </div>
  );
}
