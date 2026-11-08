import { useEffect, useRef, useState } from "react";
import type { PieceId } from "../../data/tabernacle";
import { buildTabernacle, type TabernacleHandle } from "../../three/tabernacle";
import { createStage } from "../../three/stage";

type Props = {
  /** Index into PATH, or -1 for the whole court. */
  step: number;
  selected: PieceId | null;
  lifted: boolean;
  onPick: (id: PieceId | null) => void;
};

/** The tabernacle in 3D. Lazy-loaded, so three.js stays out of the page shell. */
export default function TabernacleStage({ step, selected, lifted, onPick }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const handle = useRef<TabernacleHandle | null>(null);
  const pick = useRef(onPick);
  pick.current = onPick;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const stage = createStage(host, { fov: 40, near: 0.1, far: 1200 });
    handle.current = buildTabernacle(stage, { onPick: (id) => pick.current(id) });
    setReady(true);
    return () => {
      handle.current?.dispose();
      handle.current = null;
      stage.dispose();
    };
  }, []);

  useEffect(() => handle.current?.view(step), [step, ready]);
  useEffect(() => handle.current?.select(selected), [selected, ready]);
  useEffect(() => handle.current?.setLifted(lifted), [lifted, ready]);

  return <div className="tb-canvas" ref={hostRef} role="img" aria-label="A model of the tabernacle and its court, to scale in cubits" />;
}
