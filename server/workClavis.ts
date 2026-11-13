/**
 * CPG / CPL numbers for works on the site, keyed by the work's source file.
 * Built by scripts/clavis/build_site_labels.py into data/clavis/site-labels.json.
 * Server-side only: the browser receives the numbers on each Work, not this file.
 */
import labels from "../data/clavis/site-labels.json";
import type { WorkClavis } from "./types";

const BY_PATH = labels as Record<string, WorkClavis>;

/** `path` is repo-relative with forward slashes, e.g. "Fathers/English/Augustine_English/The City of God.txt". */
export function clavisForPath(path: string): WorkClavis | undefined {
  return BY_PATH[path.replace(/\\/g, "/")];
}
