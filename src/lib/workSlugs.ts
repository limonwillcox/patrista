/** Old work ids kept working after a rename. */
export const WORK_ID_ALIASES: Record<string, string> = {
  "teaching-of-the-twelve-apostles": "didache",
  "apology-in-defence-of-himself": "rufinus-apology-in-defence-of-himself"
};

/**
 * Works removed because they were filed under the wrong Father. The build sends each old URL to the
 * same chapter of the copy that stays. Rufinus wrote the Apology against Jerome; an import also put
 * it in Jerome's folder. Jerome's reply is his own work, "apology-against-rufinus".
 */
export const MOVED_WORKS: { from: { author: string; work: string }; to: { author: string; work: string } }[] = [
  {
    from: { author: "jerome", work: "apology-in-defence-of-himself" },
    to: { author: "rufinus", work: "rufinus-apology-in-defence-of-himself" }
  }
];

/** Works with their own reader path instead of /read?work=<id>. */
export const WORK_READ_PATHS: Record<string, string> = {
  confessions: "/augustines-confessions"
};

export function resolveWorkId(id: string): string {
  return WORK_ID_ALIASES[id] || id;
}

export function workIdForReadPath(pathname: string): string | null {
  const path = pathname.replace(/\/+$/, "");
  for (const [id, p] of Object.entries(WORK_READ_PATHS)) if (p === path) return id;
  return null;
}

/** Work id for a static work page like /fathers/<author>/<work>.html, else null. */
export function staticWorkId(pathname: string): string | null {
  const m = pathname.match(/^\/fathers\/[^/]+\/([^/]+)\.html$/);
  return m ? resolveWorkId(decodeURIComponent(m[1])) : null;
}

export function readPath(id: string): string {
  return WORK_READ_PATHS[id] || "/read?work=" + encodeURIComponent(id);
}
