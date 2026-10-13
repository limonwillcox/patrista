export type LibraryHoverReadout = {
  author: string;
  work: string;
  century: string;
  category: string;
  topic: string;
};

export const LIBRARY_HOVER_FIELDS = [
  { key: "author", label: "Author" },
  { key: "work", label: "Work" },
  { key: "century", label: "Century" },
  { key: "category", label: "Writing category" },
  { key: "topic", label: "Topic" }
] as const;

export function formatCentury(n: number): string {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return n + "th";
}

const CATEGORY_RULES: { re: RegExp; label: string }[] = [
  { re: /\bhomil/i, label: "Homily" },
  { re: /\bsermon/i, label: "Sermon" },
  { re: /\bcreed/i, label: "Creed" },
  { re: /\bcouncil/i, label: "Council" },
  { re: /\bcanon/i, label: "Canon" },
  { re: /\bepistle|\bletter/i, label: "Epistle" },
  { re: /\bapolog/i, label: "Apology" },
  { re: /\bcatech/i, label: "Catechesis" },
  { re: /\bcommentar|\bexpos/i, label: "Commentary" },
  { re: /\bhistor/i, label: "History" },
  { re: /\bmartyr|\bpassion of\b/i, label: "Martyrdom" },
  { re: /\bhymn/i, label: "Hymn" },
  { re: /\boration|\borat\b/i, label: "Oration" },
  { re: /\bdialog/i, label: "Dialogue" },
  { re: /\brule\b/i, label: "Rule" }
];

export function writingCategory(title: string): string {
  for (const rule of CATEGORY_RULES) {
    if (rule.re.test(title)) return rule.label;
  }
  return "Treatise";
}

const TOPIC_RULES: { re: RegExp; label: string }[] = [
  { re: /\bincarnation/i, label: "Incarnation" },
  { re: /\bholy spirit|\bspiritus/i, label: "Holy Spirit" },
  { re: /\btrinity|\btrinit/i, label: "Trinity" },
  { re: /\barian/i, label: "Arianism" },
  { re: /\bresurrection/i, label: "Resurrection" },
  { re: /\bvirgin/i, label: "Virgin Mary" },
  { re: /\bbaptism/i, label: "Baptism" },
  { re: /\beucharist|\bsacrament/i, label: "Sacraments" },
  { re: /\bfaith\b/i, label: "Faith" }
];

export function writingTopic(title: string): string {
  for (const rule of TOPIC_RULES) {
    if (rule.re.test(title)) return rule.label;
  }
  return "";
}

export function libraryHoverReadout(
  workId: string | null | undefined,
  works: { get: (id: string) => { title: string; author: string } | undefined },
  authorInfo: (authorId: string) => { name: string; century: number } | undefined
): LibraryHoverReadout | null {
  if (!workId) return null;
  const work = works.get(workId);
  if (!work) return null;
  const who = authorInfo(work.author);
  if (!who) return null;
  return {
    author: who.name,
    work: work.title,
    century: formatCentury(who.century),
    category: writingCategory(work.title),
    topic: writingTopic(work.title)
  };
}

export type HoverBarMetrics = {
  widthCh: Record<keyof LibraryHoverReadout, number>;
  workLines: 2;
  workLenMin: number;
  workLenMax: number;
  workFontMinPx: number;
  workFontMaxPx: number;
};

const WORK_FONT_MIN = 14;
const WORK_FONT_MAX = 17;

function maxChars(rows: LibraryHoverReadout[], key: keyof LibraryHoverReadout): number {
  let n = 0;
  for (const row of rows) n = Math.max(n, (row[key] || "").length);
  return n;
}

export function libraryHoverBarMetrics(rows: LibraryHoverReadout[]): HoverBarMetrics {
  const workMax = maxChars(rows, "work");
  const workMin = rows.reduce((m, row) => {
    const n = (row.work || "").length;
    if (!n) return m;
    return m === 0 ? n : Math.min(m, n);
  }, 0);
  return {
    widthCh: {
      author: Math.max(8, maxChars(rows, "author")),
      work: Math.max(12, Math.ceil(workMax / 2) + 1),
      century: Math.max(5, maxChars(rows, "century")),
      category: Math.max(8, maxChars(rows, "category")),
      topic: Math.max(8, maxChars(rows, "topic"))
    },
    workLines: 2,
    workLenMin: workMin || 1,
    workLenMax: workMax || 1,
    workFontMinPx: WORK_FONT_MIN,
    workFontMaxPx: WORK_FONT_MAX
  };
}

export function workBarFontPx(title: string, metrics: HoverBarMetrics): number {
  const span = metrics.workLenMax - metrics.workLenMin;
  if (span <= 0) return metrics.workFontMaxPx;
  const t = Math.min(1, Math.max(0, (title.length - metrics.workLenMin) / span));
  return metrics.workFontMaxPx - t * (metrics.workFontMaxPx - metrics.workFontMinPx);
}
