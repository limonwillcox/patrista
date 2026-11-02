import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { fetchChapter } from "../api/client";
import { citeRank, type VerseCite } from "../api/scripture";
import type { Link as CommentaryLink } from "../api/links";
import { useApp } from "../context/AppContext";
import { fatherImage } from "../lib/fatherImages";
import { englishParagraphs } from "../lib/fatherPaths";
import { paraAnchor } from "../lib/readAnchors";
import { readPath } from "../lib/workSlugs";

/*
 * The Fathers' words on a verse, shown like the comments under a post. Two sources feed it:
 *  - citations: every chapter of a work in the library that cites the verse (server/scriptureIndex.ts)
 *  - commentary: passages the commentary collections tie to the verse (data/links), mostly real
 *    commentaries and homilies on the book
 * The same passage often comes from both; mergeSources keeps one.
 */

/** One passage of a Father on the verses. */
export type CitingPassage = {
  /** Unique within a thread. */
  key: string;
  /** The chapter in the library, or "" when the passage is not in the library. */
  url: string;
  title: string;
  /** The Father's name. */
  father: string;
  n: number;
  /** The text shown folded: the sentence that quotes the verse, or the start of a commentary passage. */
  excerpt: string;
  verses: number[];
  /** Higher comes first. */
  rank: number;
  /** Where to load the library paragraphs from: missing in data built before they were kept. */
  work?: string;
  chapter?: number;
  paras: number[];
  /** Other Fathers (ids) that its paragraphs name. */
  mentions: string[];
  /** The Father's id, when the source gives it. */
  author?: string;
  /** The whole passage, when the source gives it (commentary). */
  full?: string;
  /** A page outside the site that holds the passage. */
  source?: string;
  /** True when it comes from a commentary collection: a passage written on this verse. */
  commentary?: boolean;
};

export const CITE_PAGE = 6;
const REPLIES_SHOWN = 2;
/** A commentary passage outranks a passing citation by this much. */
const COMMENTARY_RANK = 8;
const FOLD_AT = 360;

/** The Father who wrote a passage, for his portrait: given, from the work, or from a /fathers/<id>/ link. */
function useAuthorOf(): (p: CitingPassage) => string {
  const { catalog } = useApp();
  const byWork = useMemo(() => new Map((catalog?.works ?? []).map((w) => [w.id, w.author])), [catalog]);
  return (p) => p.author || (p.work && byWork.get(p.work)) || p.url.match(/^\/fathers\/([^/]+)\//)?.[1] || "";
}

/** Merge citations of several verses into one entry per chapter of the Fathers, best first. */
export function mergeCites(lists: [number, VerseCite[]][]): CitingPassage[] {
  const by = new Map<string, CitingPassage>();
  for (const [v, cites] of lists)
    for (const c of cites) {
      const p = by.get(c[0]) ?? {
        key: c[0],
        url: c[0],
        title: c[1],
        father: c[2],
        n: 0,
        excerpt: c[4],
        verses: [],
        rank: 0,
        work: c[6],
        chapter: c[7],
        paras: [],
        mentions: []
      };
      for (const i of c[8] ?? []) if (!p.paras.includes(i)) p.paras.push(i);
      for (const m of c[9] ?? []) if (!p.mentions.includes(m)) p.mentions.push(m);
      p.n += c[3];
      p.rank += citeRank(c);
      if (!p.verses.includes(v)) p.verses.push(v);
      by.set(c[0], p);
    }
  return [...by.values()].sort((a, b) => b.rank - a.rank || a.title.localeCompare(b.title));
}

/** Footnote markers ("[12]") left in the text by the editions. */
const stripMarks = (t: string) => t.replace(/\s*\[\d+\]/g, "");

/** "HOMILY ON CHRIST'S ANCESTRY 2.6" reads as "Homily on Christ's Ancestry 2.6". */
function tidyTitle(t: string): string {
  if (!/[A-Z]/.test(t) || t !== t.toUpperCase()) return t;
  const small = new Set(["a", "an", "and", "in", "of", "on", "the", "to", "for", "by", "against"]);
  return t
    .toLowerCase()
    .split(" ")
    .map((w, i) => (/^[ivxl]+$/.test(w) ? w.toUpperCase() : i && small.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

/** The start of a long passage, cut at a word. */
function opening(text: string): string {
  if (text.length <= FOLD_AT) return text;
  const cut = text.slice(0, FOLD_AT);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:]$/, "") + "…";
}

/** The commentary collections' passages on one verse, as thread entries. */
export function commentaryPassages(links: CommentaryLink[], verse: number, nameOf: (id: string) => string, inLibrary: (work: string) => boolean): CitingPassage[] {
  return links.map((l) => {
    const text = stripMarks(l.excerpt).replace(/\s+/g, " ").trim();
    return {
      key: "cm:" + l.id,
      url: inLibrary(l.workId) ? readPath(l.workId) : "",
      title: tidyTitle(l.workTitle),
      father: nameOf(l.fatherId),
      n: 1,
      excerpt: opening(text),
      full: text.length > FOLD_AT ? text : undefined,
      verses: [verse],
      rank: COMMENTARY_RANK + Math.min(text.length / 400, 4),
      paras: [],
      mentions: [],
      author: l.fatherId,
      source: l.sourceUrl || undefined,
      commentary: true
    };
  });
}

const words = (t: string) => t.toLowerCase().replace(/[’']/g, "").match(/[a-z]+/g) ?? [];
/** Runs of four words: two passages that share most of them hold the same text. */
function shingles(t: string): Set<string> {
  const w = words(t);
  const out = new Set<string>();
  for (let i = 0; i + 4 <= w.length; i++) out.add(w.slice(i, i + 4).join(" "));
  return out;
}
/** How much of `a` appears in `b`, from 0 to 1. */
function within(a: Set<string>, b: Set<string>): number {
  if (a.size < 3) return 0;
  let n = 0;
  for (const s of a) if (b.has(s)) n++;
  return n / a.size;
}

/**
 * One list from both sources. A commentary passage whose text holds a library citation's quoted sentence
 * (or is held in it) is the same passage: the library's copy stays, since it opens in place and links to
 * the paragraph, and it takes the commentary's rank. Commentary passages that repeat each other go too.
 */
export function mergeSources(cites: CitingPassage[], comments: CitingPassage[], authorOf: (p: CitingPassage) => string): CitingPassage[] {
  const kept: CitingPassage[] = [];
  const keptSh: Set<string>[] = [];
  // The longest first, so a cut-short copy finds the whole one already kept.
  for (const c of [...comments].sort((a, b) => (b.full ?? b.excerpt).length - (a.full ?? a.excerpt).length)) {
    const sh = shingles(c.full ?? c.excerpt);
    if (keptSh.some((k, i) => kept[i].author === c.author && within(sh, k) >= 0.6)) continue;
    kept.push(c);
    keptSh.push(sh);
  }
  const out = cites.map((p) => ({ ...p }));
  const citeSh = out.map((p) => shingles(p.excerpt.replace(/…$/, "")));
  const authors = out.map(authorOf);
  const extra: CitingPassage[] = [];
  kept.forEach((c, ci) => {
    const at = out.findIndex((p, i) => authors[i] === c.author && (within(citeSh[i], keptSh[ci]) >= 0.5 || within(keptSh[ci], citeSh[i]) >= 0.5));
    if (at < 0) {
      extra.push(c);
      return;
    }
    const p = out[at];
    p.rank = Math.max(p.rank, c.rank) + 1;
    p.commentary = true;
    if (!p.work || !p.paras.length) p.full ??= c.full;
  });
  return [...out, ...extra].sort((a, b) => b.rank - a.rank || a.title.localeCompare(b.title));
}

type ThreadNode = { p: CitingPassage; author: string; replies: { p: CitingPassage; author: string; to: string }[] };

/**
 * Comments and replies. A passage whose paragraphs name an earlier Father who also speaks on these
 * verses is shown under that Father's first comment, as a reply that names him. Nothing else is taken to
 * be a reply: Fathers who simply wrote on the same verse stand side by side.
 */
function buildThread(passages: CitingPassage[], authorOf: (p: CitingPassage) => string, died: (id: string) => number): ThreadNode[] {
  const authors = passages.map(authorOf);
  const firstOf = new Map<string, number>();
  authors.forEach((a, i) => {
    if (a && !firstOf.has(a)) firstOf.set(a, i);
  });
  // Each passage's parent: the first comment of the earliest-ranked earlier Father it names.
  const parent = passages.map((p, i) => {
    const me = authors[i];
    const named = p.mentions.filter((m) => m !== me && firstOf.has(m) && died(m) < died(me));
    const at = named.map((m) => firstOf.get(m)!).filter((j) => j !== i);
    return at.length ? Math.min(...at) : -1;
  });
  // Replies hang one level deep, under the comment that starts the conversation.
  const root = (i: number) => {
    let r = i;
    for (let n = 0; parent[r] >= 0 && n < 50; n++) r = parent[r];
    return r;
  };
  const nodes = new Map<number, ThreadNode>();
  passages.forEach((p, i) => {
    if (parent[i] < 0) nodes.set(i, { p, author: authors[i], replies: [] });
  });
  passages.forEach((p, i) => {
    if (parent[i] >= 0) nodes.get(root(i))?.replies.push({ p, author: authors[i], to: passages[parent[i]].father });
  });
  for (const n of nodes.values()) n.replies.sort((a, b) => died(a.author) - died(b.author));
  return [...nodes.values()];
}

/**
 * A list of the Fathers' words, like the comments under a post. A dropdown hears one Father; another puts
 * the most to the point first, or the earliest first.
 */
export function Thread({ passages, showVerses }: { passages: CitingPassage[]; showVerses: boolean }) {
  const [who, setWho] = useState("");
  const [oldest, setOldest] = useState(false);
  const [shown, setShown] = useState(CITE_PAGE);
  const authorOf = useAuthorOf();
  const { catalog } = useApp();
  const died = useMemo(() => {
    const by = new Map((catalog?.authors ?? []).map((a) => [a.id, a.deathYear ?? 9999]));
    return (id: string) => by.get(id) ?? 9999;
  }, [catalog]);
  const fathers = useMemo(() => {
    const by = new Map<string, number>();
    for (const p of passages) by.set(p.father, (by.get(p.father) ?? 0) + 1);
    return [...by].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [passages]);
  useEffect(() => {
    setWho("");
    setShown(CITE_PAGE);
  }, [passages]);
  // One Father chosen: his passages alone, no replies.
  const nodes = useMemo(() => {
    const list: ThreadNode[] = who
      ? passages.filter((p) => p.father === who).map((p) => ({ p, author: authorOf(p), replies: [] }))
      : buildThread(passages, authorOf, died);
    return oldest ? [...list].sort((a, b) => died(a.author) - died(b.author)) : list;
  }, [who, oldest, passages, authorOf, died]);
  return (
    <>
      {passages.length > 2 ? (
        <div className="cx-thread-tools">
          {fathers.length > 1 ? (
            <select
              className="cx-who-select"
              aria-label="Show one Father"
              value={who}
              onChange={(e) => {
                setWho(e.target.value);
                setShown(CITE_PAGE);
              }}
            >
              <option value="">All Fathers ({fathers.length})</option>
              {fathers.map(([f, n]) => (
                <option key={f} value={f}>
                  {f} ({n})
                </option>
              ))}
            </select>
          ) : null}
          <select className="cx-who-select" aria-label="Order" value={oldest ? "old" : "best"} onChange={(e) => setOldest(e.target.value === "old")}>
            <option value="best">Most on this verse first</option>
            <option value="old">Earliest first</option>
          </select>
        </div>
      ) : null}
      <ol className="cx-thread">
        {nodes.slice(0, shown).map((n) => (
          <FatherComment key={n.p.key} p={n.p} authorId={n.author} showVerses={showVerses}>
            {n.replies.length ? <Replies replies={n.replies} showVerses={showVerses} /> : null}
          </FatherComment>
        ))}
      </ol>
      {nodes.length > shown ? (
        <button type="button" className="cx-more" onClick={() => setShown(shown + CITE_PAGE)}>
          Show more ({nodes.length - shown})
        </button>
      ) : null}
    </>
  );
}

/** The replies under a comment: the first few, then the rest on request. */
function Replies({ replies, showVerses }: { replies: ThreadNode["replies"]; showVerses: boolean }) {
  const [all, setAll] = useState(false);
  const list = all ? replies : replies.slice(0, REPLIES_SHOWN);
  return (
    <>
      <ol className="cx-replies">
        {list.map((r) => (
          <FatherComment key={r.p.key} p={r.p} authorId={r.author} showVerses={showVerses} replyTo={r.to} />
        ))}
      </ol>
      {replies.length > list.length ? (
        <button type="button" className="cx-comment-more cx-replies-more" onClick={() => setAll(true)}>
          View {replies.length - list.length} more {replies.length - list.length === 1 ? "reply" : "replies"}
        </button>
      ) : null}
    </>
  );
}

/**
 * One passage of a Father, shown like a comment: his portrait and name, the sentence that quotes the
 * verse, and on request the whole passage: every paragraph of the library chapter that cites it (the
 * sentence marked), or the commentary's full text. The title links to the passage in its place.
 */
function FatherComment({ p, authorId, showVerses, replyTo, children }: { p: CitingPassage; authorId: string; showVerses: boolean; replyTo?: string; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [paras, setParas] = useState<string[] | null | undefined>(undefined);
  const inLibrary = !!p.work && p.chapter != null && p.paras.length > 0;
  const canOpen = inLibrary || !!p.full;
  useEffect(() => {
    if (!open || paras !== undefined || !inLibrary) return;
    let live = true;
    fetchChapter(p.work!, p.chapter!)
      .then((ch) => {
        if (!live) return;
        const all = englishParagraphs(ch.versions);
        setParas([...p.paras].sort((a, b) => a - b).map((i) => all[i]).filter((t): t is string => !!t));
      })
      .catch(() => live && setParas(null));
    return () => {
      live = false;
    };
  }, [open, paras, inLibrary, p]);
  const first = p.paras.length ? Math.min(...p.paras) : null;
  const href = p.url + (first != null && p.chapter != null ? "#" + paraAnchor(p.chapter, first + 1) : "");
  const img = fatherImage(authorId);
  // Only a Father in the library has a page to go to.
  const { catalog } = useApp();
  const profile = authorId && catalog?.authors.some((a) => a.id === authorId) ? "/fathers/" + authorId + "/" : null;
  const avatar = img ? (
    <img className="cx-avatar" src={img.tile.src} srcSet={img.tile.srcset} sizes="40px" alt="" width={40} height={40} loading="lazy" />
  ) : (
    <span className="cx-avatar" />
  );
  // The quoted sentence, marked inside the full paragraph.
  const key = p.excerpt.replace(/…$/, "").trim();
  const marked = (t: string): ReactNode => {
    const clean = stripMarks(t).replace(/\s+/g, " ");
    const at = key.length > 20 ? clean.indexOf(key) : -1;
    if (at < 0) return clean;
    return (
      <>
        {clean.slice(0, at)}
        <mark>{key}</mark>
        {clean.slice(at + key.length)}
      </>
    );
  };
  const title = p.url ? (
    <Link className="cx-comment-src" to={href} title="Read it in its place">
      {p.title}
    </Link>
  ) : p.source ? (
    <a className="cx-comment-src" href={p.source} target="_blank" rel="noreferrer" title="Not in the library: read it at the source">
      {p.title} ↗
    </a>
  ) : (
    <span className="cx-comment-src">{p.title}</span>
  );
  let text: ReactNode;
  if (open && inLibrary && paras && paras.length)
    text = (
      <div className="cx-comment-text is-full">
        {paras.map((t, i) => (
          <p key={i}>{marked(t)}</p>
        ))}
      </div>
    );
  else if (open && inLibrary && paras === undefined) text = <p className="cx-comment-text">Loading…</p>;
  else if (open && p.full && !(inLibrary && paras?.length)) text = <p className="cx-comment-text is-full">{p.full}</p>;
  else text = <p className="cx-comment-text">{p.excerpt}</p>;
  return (
    <li className={"cx-comment" + (replyTo ? " is-reply" : "")}>
      {profile ? (
        // The portrait and the name open the Father's page, with the books he wrote.
        <Link className="cx-avatar-link" to={profile} aria-label={p.father + ": his page and writings"} tabIndex={-1}>
          {avatar}
        </Link>
      ) : (
        avatar
      )}
      <div className="cx-comment-body">
        <div className="cx-comment-head">
          {profile ? (
            <Link className="cx-comment-father" to={profile} title={"About " + p.father + " and his writings"}>
              {p.father}
            </Link>
          ) : (
            <b>{p.father}</b>
          )}
          {replyTo ? (
            <span className="cx-reply-to" title={"This passage names " + replyTo + ", who also wrote on this verse"}>
              @{replyTo}
            </span>
          ) : null}
          {title}
          {showVerses ? (
            <span className="cx-comment-v">
              {p.verses.length > 1 ? "vv. " : "v. "}
              {p.verses.join(", ")}
            </span>
          ) : null}
        </div>
        {text}
        {canOpen ? (
          <button type="button" className="cx-comment-more" aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? "Show less" : "Read more"}
          </button>
        ) : null}
        {children}
      </div>
    </li>
  );
}
