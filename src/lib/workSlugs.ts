/** Old work ids kept working after a rename. */
export const WORK_ID_ALIASES: Record<string, string> = {
  "teaching-of-the-twelve-apostles": "didache"
};

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

/** Reader path for a static work page like /fathers/<author>/<work>.html, else null. */
export function readPathForStaticWork(pathname: string): string | null {
  const m = pathname.match(/^\/fathers\/[^/]+\/([^/]+)\.html$/);
  return m ? readPath(resolveWorkId(decodeURIComponent(m[1]))) : null;
}

export function readPath(id: string): string {
  return WORK_READ_PATHS[id] || "/read?work=" + encodeURIComponent(id);
}
