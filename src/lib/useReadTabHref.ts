import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { loadLastRead, readTabHref } from "./lastRead";

/** Study tab target: the Father's work last open, at its chapter. Recomputed on every navigation. */
export function useReadTabHref(): string {
  const { catalog } = useApp();
  const location = useLocation();
  const ids = useMemo(() => (catalog ? new Set(catalog.works.map((w) => w.id)) : null), [catalog]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => readTabHref(loadLastRead(), ids), [ids, location.key]);
}
