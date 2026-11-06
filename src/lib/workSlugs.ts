/** Old work ids kept working after a rename. */
export const WORK_ID_ALIASES: Record<string, string> = {
  "teaching-of-the-twelve-apostles": "didache",
  "apology-in-defence-of-himself": "rufinus-apology-in-defence-of-himself",
  homily: "clement-rome-the-homily",
  demonstrations: "select-demonstrations"
};

/**
 * Works removed because they were filed under the wrong Father. The build sends each old URL to the
 * same chapter of the copy that stays. Rufinus wrote the Apology against Jerome; an import also put
 * it in Jerome's folder. Jerome's reply is his own work, "apology-against-rufinus".
 */
export type MovedWork = {
  from: { author: string; work: string };
  to: { author: string; work: string };
  /**
   * When the old and new chapters do not line up one to one: the old work's chapter count, and
   * old chapter number -> new chapter number. An old chapter not in the map goes to the work page.
   */
  oldChapters?: number;
  chapters?: Record<number, number>;
};

export const MOVED_WORKS: MovedWork[] = [
  {
    from: { author: "jerome", work: "apology-in-defence-of-himself" },
    to: { author: "rufinus", work: "rufinus-apology-in-defence-of-himself" }
  },
  // 2 Clement was listed twice; the copy under Clement of Rome stays (same 20 chapters).
  { from: { author: "apostolic", work: "homily" }, to: { author: "clement_rome", work: "clement-rome-the-homily" } },
  // "Demonstrations" was mostly Ephrem's hymns under Aphrahat's name; Aphrahat's own text is in Select Demonstrations.
  {
    from: { author: "aphrahat", work: "demonstrations" },
    to: { author: "aphrahat", work: "select-demonstrations" },
    oldChapters: 59,
    chapters: {}
  },
  // Single Basil letters that duplicated chapters of the Letters collection.
  {
    from: { author: "basil", work: "canonical-letters-to-amphilochius-letters-188-199-217" },
    to: { author: "basil", work: "basil-letters" },
    oldChapters: 8,
    chapters: { 1: 188, 2: 199, 3: 200, 4: 201, 5: 202, 6: 203, 7: 204, 8: 217 }
  },
  {
    from: { author: "basil", work: "letter-to-bishop-optimus-letter-260" },
    to: { author: "basil", work: "basil-letters" },
    oldChapters: 1,
    chapters: { 1: 260 }
  },
  {
    from: { author: "basil", work: "letter-to-the-italians-and-gauls-letter-92" },
    to: { author: "basil", work: "basil-letters" },
    oldChapters: 1,
    chapters: { 1: 92 }
  }
];

/**
 * Chapters cut out of a work that stays, because their text belonged to another work. Only chapter
 * numbers the old work no longer has can redirect; the rest are live pages of the corrected work.
 */
export const MOVED_CHAPTERS: { from: { author: string; work: string; chapter: number }; to: { author: string; work: string; chapter: number } }[] = [
  // Ad Martyras chapters VII–XII were the Passion of Perpetua and Felicitas.
  ...[7, 8, 9, 10, 11, 12].map((n) => ({
    from: { author: "tertullian", work: "ad-martyras", chapter: n },
    to: { author: "apostolic", work: "passion-of-the-holy-martyrs-perpetua-and-felicitas", chapter: n - 5 }
  })),
  // Origen's "Commentary on John" ended with books of the Commentary on Matthew.
  { from: { author: "origen", work: "commentary-on-john", chapter: 7 }, to: { author: "origen", work: "commentary-on-matthew", chapter: 6 } },
  { from: { author: "origen", work: "commentary-on-john", chapter: 8 }, to: { author: "origen", work: "commentary-on-matthew", chapter: 7 } }
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
