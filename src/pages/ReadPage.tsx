import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { originalOf, translationsOf } from "../../server/query";
import { saveLastRead } from "../lib/lastRead";
import type { Passage, WorkChapterMeta, WorkOutline } from "../../server/types";
import { fetchChapter, fetchWork } from "../api/client";
import { ChapterDock } from "../components/ChapterDock";
import { DictionaryDock } from "../components/DictionaryDock";
import { HardcoverDock } from "../components/HardcoverDock";
import { ManuscriptButton } from "../components/manuscript/ManuscriptButton";
import { MANUSCRIPTS } from "../data/manuscripts";
import { BookIcon, DockNotch } from "../components/DockNotch";
import { readPath, resolveWorkId, staticWorkId, workIdForReadPath } from "../lib/workSlugs";
import { useApp } from "../context/AppContext";
import { chapterNumberForSlug, chapterPublicPath, parseFatherChapterPath } from "../lib/fatherPaths";
import { chapterAtReadingLine } from "../lib/readDocks";
import { OriginalParas, TranslationParas, type ParaMenuTarget } from "../components/reader/Paragraphs";
import { citation, hashChapter, hashParagraph, paraAnchor, quoteWithCitation, translatorFor } from "../lib/readAnchors";
import { attributionText, citationAuthor, hasAttribution } from "../../server/workMeta";
import { noteChange } from "../lib/accountSync";

const HL_COLORS = ["hl-yellow", "hl-green", "hl-blue", "hl-pink"] as const;

function versionLabel(id: string, versions: { id: string; label: string }[]): string {
  return versions.find((v) => v.id === id)?.label || id.toUpperCase();
}

function ChapterMount({ workId, children }: { workId: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) restoreHighlights(workId, ref.current);
  }, [workId, children]);
  return (
    <div className="chapter-mount" ref={ref}>
      {children}
    </div>
  );
}

type LangView = "translation" | "original" | "parallel";

function ChapterBody({
  passage,
  preferred,
  versions,
  view,
  onMenu
}: {
  passage: Passage;
  preferred: string;
  versions: { id: string; label: string; short: string; group: "translation" | "original" }[];
  view: LangView;
  onMenu: (t: ParaMenuTarget) => void;
}) {
  const transList = translationsOf(passage, versions);
  const trans = transList.find((v) => v.id === preferred) || transList[0];
  const orig = originalOf(passage);
  const lang = orig?.id === "grk" ? "grc" : "la";
  if (orig && view === "original") {
    return (
      <div className="passage">
        <OriginalParas paras={orig.paras} lang={lang} />
      </div>
    );
  }
  if (!trans) return <p className="empty">No text available.</p>;
  const english = <TranslationParas passage={passage} version={trans.id} onMenu={onMenu} />;
  if (orig && view === "parallel") {
    return (
      <div className="passage passage--parallel">
        <div className="passage-col">{english}</div>
        <div className="passage-col passage-col--orig">
          <OriginalParas paras={orig.paras} lang={lang} />
        </div>
      </div>
    );
  }
  return <div className="passage">{english}</div>;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

const FIND_STOP = new Set(["the", "and", "of", "to", "in", "a", "is", "that", "for", "his", "her", "with", "not", "but", "was", "are"]);

/** What to mark for a search: the whole phrase, and its words in case the phrase is not on the page. */
function findNeedles(term: string): { phrase: string; words: string[] } {
  const phrase = term.replace(/["“”]/g, "").trim().toLowerCase();
  const words = phrase.split(/\s+/).filter((w) => w.length > 2 && !FIND_STOP.has(w));
  return { phrase, words: words.length > 1 ? words : [] };
}

function rangesFor(root: HTMLElement, needle: string): Range[] {
  const ranges: Range[] = [];
  root.querySelectorAll<HTMLElement>(".para").forEach((para) => {
    const walker = document.createTreeWalker(para, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      if (node.parentElement?.closest(".pnum, .fn, .para-notes-btn")) continue;
      const hay = (node.nodeValue || "").toLowerCase();
      let at = hay.indexOf(needle);
      while (at !== -1) {
        const r = document.createRange();
        r.setStart(node, at);
        r.setEnd(node, at + needle.length);
        ranges.push(r);
        at = hay.indexOf(needle, at + needle.length);
      }
    }
  });
  return ranges;
}

/** Marks search matches inside `root` with the CSS Highlight API (no DOM changes). Returns the needle it used. */
function markFindHits(root: HTMLElement, term: string): string | null {
  const { phrase, words } = findNeedles(term);
  if (phrase.length < 2) return null;
  let used: string | null = phrase;
  let ranges = rangesFor(root, phrase);
  if (!ranges.length && words.length) {
    ranges = words.flatMap((w) => rangesFor(root, w));
    used = words[0];
  }
  const reg = (globalThis as { CSS?: { highlights?: Map<string, unknown> } }).CSS?.highlights;
  const HighlightCtor = (globalThis as { Highlight?: new (...r: Range[]) => unknown }).Highlight;
  if (reg && HighlightCtor && ranges.length) reg.set("find-hit", new HighlightCtor(...ranges));
  return ranges.length ? used : null;
}

function paraTextNodes(para: HTMLElement): Text[] {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(para, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const p = (node as Text).parentElement;
      if (!p || p.closest(".pnum, .fn, .para-notes-btn") || !node.nodeValue) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  return nodes;
}

function offsetsOfElement(para: HTMLElement, el: Element): { start: number; end: number } | null {
  const nodes = paraTextNodes(para);
  let pos = 0;
  let start: number | null = null;
  let end: number | null = null;
  nodes.forEach((n) => {
    const inside = el.contains(n);
    if (inside && start == null) start = pos;
    pos += n.nodeValue?.length || 0;
    if (inside) end = pos;
  });
  return start == null || end == null ? null : { start, end };
}

function wrapParaOffsets(para: HTMLElement, start: number, end: number, color: string) {
  const nodes = paraTextNodes(para);
  const ops: { node: Text; a: number; b: number }[] = [];
  let pos = 0;
  nodes.forEach((n) => {
    const len = n.nodeValue?.length || 0;
    const a = Math.max(0, start - pos);
    const b = Math.min(len, end - pos);
    if (b > a) ops.push({ node: n, a, b });
    pos += len;
  });
  ops.reverse().forEach((op) => {
    const mid = op.a ? op.node.splitText(op.a) : op.node;
    mid.splitText(op.b - op.a);
    const span = document.createElement("span");
    span.className = "w " + color;
    mid.parentNode?.insertBefore(span, mid);
    span.appendChild(mid);
  });
}

function saveHighlights(work: string, root: HTMLElement) {
  const list: { key: string; start: number; end: number; color: string }[] = [];
  root.querySelectorAll(".para .w").forEach((el) => {
    const para = el.closest(".para") as HTMLElement | null;
    const color = HL_COLORS.find((c) => el.classList.contains(c));
    if (!para || !color) return;
    const off = offsetsOfElement(para, el);
    if (off && para.dataset.key) list.push({ key: para.dataset.key, start: off.start, end: off.end, color });
  });
  localStorage.setItem("fg-hl-" + work, JSON.stringify({ v: 2, list }));
  noteChange("fg-hl-" + work);
}

function aroundChapter(chapters: WorkChapterMeta[], n: number): number[] {
  const index = chapters.findIndex((c) => c.chapter === n);
  if (index < 0) return [];
  const nums = [chapters[index].chapter];
  if (index > 0) nums.push(chapters[index - 1].chapter);
  if (index + 1 < chapters.length) nums.push(chapters[index + 1].chapter);
  return nums;
}

function restoreHighlights(work: string, root: HTMLElement) {
  try {
    const raw = JSON.parse(localStorage.getItem("fg-hl-" + work) || "{}") as { v?: number; list?: { key: string; start: number; end: number; color: string }[] };
    const list = raw.v === 2 ? raw.list || [] : [];
    list.forEach((item) => {
      const para = root.querySelector('.para[data-key="' + item.key + '"]') as HTMLElement | null;
      if (!para || HL_COLORS.indexOf(item.color as (typeof HL_COLORS)[number]) === -1) return;
      wrapParaOffsets(para, item.start, item.end, item.color);
    });
  } catch {
    /* ignore */
  }
}

export function ReadPage() {
  const { catalog, version, setVersion, setActivePassage, mode, setMode, parallel, setParallel, showToast } = useApp();
  const location = useLocation();
  const chapterRoute = parseFatherChapterPath(location.pathname);
  const onChapterRoute = chapterRoute != null;
  const routeSlug = chapterRoute?.chapterSlug || "";
  const [params] = useSearchParams();
  const workId = resolveWorkId(
    chapterRoute?.workId || workIdForReadPath(location.pathname) || staticWorkId(location.pathname) || params.get("work") || "confessions"
  );
  const jumpChapter = params.get("chapter") || "";
  const findTerm = params.get("hl") || "";
  const [paraMenu, setParaMenu] = useState<ParaMenuTarget | null>(null);
  const langView: LangView = mode === "original" ? "original" : parallel ? "parallel" : "translation";
  const [outline, setOutline] = useState<WorkOutline | null>(null);
  const [texts, setTexts] = useState<Map<number, Passage>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const textsRef = useRef(texts);
  const inflightRef = useRef<Set<number>>(new Set());
  const inflightPromises = useRef(new Map<number, Promise<void>>());
  const generationRef = useRef(0);
  const [hl, setHl] = useState<{ x: number; y: number; para: HTMLElement; range: Range } | null>(null);
  const [currentChapter, setCurrentChapter] = useState(1);
  const jumpedRef = useRef<string | null>(null);
  const pendingJump = useRef<number | null>(null);
  textsRef.current = texts;

  function jumpToChapter(n: number) {
    pendingJump.current = n;
    setCurrentChapter(n);
    loadAround(n);
    jumpedRef.current = `${workId}:${n}`;
    const el = document.getElementById("ch-" + n);
    if (el) el.scrollIntoView({ behavior: "auto", block: "start" });
    const hash = "#ch-" + n;
    if (window.location.hash !== hash) {
      window.history.replaceState(window.history.state, "", hash);
    }
  }

  function jumpToSub(book: number, n: number) {
    jumpToChapter(book);
    const id = "ch-" + book + "-" + n;
    const tryScroll = (tries: number) => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "auto", block: "start" });
      if (tries < 30 && (!el || pendingJump.current === book)) window.setTimeout(() => tryScroll(tries + 1), 100);
    };
    tryScroll(0);
  }

  useEffect(() => {
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    setOutline(null);
    setTexts(new Map());
    textsRef.current = new Map();
    inflightRef.current = new Set();
    inflightPromises.current = new Map();
    setError(null);
    const hashTarget = onChapterRoute ? null : hashChapter(location.hash);
    const hinted = hashTarget ?? Number(onChapterRoute ? "" : jumpChapter);
    if (!onChapterRoute) loadChapter(hinted || 1);
    fetchWork(workId)
      .then((data) => {
        if (generationRef.current === generation) setOutline(data);
      })
      .catch((err: unknown) => {
        if (generationRef.current === generation) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      if (generationRef.current === generation) generationRef.current += 1;
    };
  }, [workId, onChapterRoute, location.hash, jumpChapter]);

  const versions = catalog?.versions || [];
  const sample = useMemo(() => {
    if (!outline) return null;
    for (const ch of outline.chapters) {
      const passage = texts.get(ch.chapter);
      if (passage) return passage;
    }
    return null;
  }, [outline, texts]);
  const trans = sample ? translationsOf(sample, versions) : [];
  const hasOriginal = Boolean(sample && originalOf(sample));
  const preferred = useMemo(() => {
    if (!trans.length) return version;
    return trans.some((v) => v.id === version) ? version : trans[0].id;
  }, [trans, version]);

  const entryChapter = useMemo(() => {
    if (!outline) return null;
    if (onChapterRoute) {
      const fromSlug = chapterNumberForSlug(outline.chapters, routeSlug);
      if (fromSlug) return fromSlug;
    }
    const n = hashChapter(location.hash) ?? Number(jumpChapter);
    if (n && outline.chapters.some((c) => c.chapter === n)) return n;
    return outline.chapters[0]?.chapter ?? null;
  }, [outline, onChapterRoute, routeSlug, location.hash, jumpChapter]);

  const loadChapter = useCallback((n: number) => {
    if (textsRef.current.has(n)) return Promise.resolve();
    const existing = inflightPromises.current.get(n);
    if (existing) return existing;
    const generation = generationRef.current;
    inflightRef.current.add(n);
    const pending = fetchChapter(workId, n)
      .then((passage) => {
        if (generationRef.current !== generation) return;
        inflightRef.current.delete(n);
        setTexts((prev) => {
          if (prev.has(n)) return prev;
          const next = new Map(prev);
          next.set(n, passage);
          textsRef.current = next;
          return next;
        });
      })
      .catch(() => {
        if (generationRef.current === generation) inflightRef.current.delete(n);
      })
      .finally(() => {
        inflightPromises.current.delete(n);
      });
    inflightPromises.current.set(n, pending);
    return pending;
  }, [workId]);

  const loadAround = useCallback((n: number) => {
    if (!outline) return;
    aroundChapter(outline.chapters, n).forEach(loadChapter);
  }, [outline, loadChapter]);

  useEffect(() => {
    if (preferred && preferred !== version) setVersion(preferred);
  }, [preferred, version, setVersion]);

  useEffect(() => {
    const passage = entryChapter != null ? texts.get(entryChapter) || null : null;
    setActivePassage(passage);
    return () => setActivePassage(null);
  }, [entryChapter, texts, setActivePassage]);

  useEffect(() => {
    jumpedRef.current = null;
  }, [workId]);

  // Load the entry chapter (and its neighbours) as soon as the outline is known. This must not wait
  // for the entry chapter's own text: on a cold landing at /fathers/<author>/<work>/<chapter>/ nothing
  // else fetches it, so gating on texts.has(entryChapter) left every chapter body blank.
  useEffect(() => {
    if (entryChapter == null) return;
    loadAround(entryChapter);
  }, [entryChapter, loadAround]);

  useLayoutEffect(() => {
    if (!outline || !onChapterRoute || entryChapter == null) return;
    const jumpKey = workId + ":path:" + entryChapter;
    if (jumpedRef.current === jumpKey) return;
    const el = document.getElementById("ch-" + entryChapter);
    if (!el) return;
    jumpedRef.current = jumpKey;
    // Keep the chapter pinned while its text and the chapter above it load in.
    pendingJump.current = entryChapter;
    el.scrollIntoView({ behavior: "auto", block: "start" });
  }, [outline, onChapterRoute, entryChapter, workId]);

  // Remember the open work and chapter so the Read tab returns here.
  useEffect(() => {
    if (!outline || outline.work.id !== workId) return;
    saveLastRead(workId, currentChapter);
  }, [outline, workId, currentChapter]);

  useEffect(() => {
    if (!outline) return;
    if (entryChapter != null) setCurrentChapter(entryChapter);
    else if (outline.chapters[0]) setCurrentChapter(outline.chapters[0].chapter);
  }, [outline, entryChapter]);

  useEffect(() => {
    if (!outline || !pageRef.current) return;
    const slugs = new Map(outline.chapters.map((c) => [c.chapter, c.slug]));
    const authorId = outline.work.author;
    const id = outline.work.id;
    const update = () => {
      const root = pageRef.current;
      if (!root) return;
      const line = window.innerHeight * 0.33;
      const sections = root.querySelectorAll<HTMLElement>(".book-chapter");
      if (!sections.length) return;
      const rects = Array.from(sections).map((sec) => {
        const rect = sec.getBoundingClientRect();
        return { chapter: Number(sec.dataset.ch), top: rect.top, bottom: rect.bottom };
      });
      const n = chapterAtReadingLine(rects, line);
      if (n != null) setCurrentChapter(n);
      if (!onChapterRoute || n == null) return;
      const slug = slugs.get(n);
      if (!slug) return;
      const path = chapterPublicPath(authorId, id, slug);
      if (window.location.pathname !== path) {
        window.history.replaceState(window.history.state, "", path);
      }
    };
    update();
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [outline, onChapterRoute]);

  useEffect(() => {
    if (!outline || entryChapter == null || !texts.has(entryChapter) || !pageRef.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const ch = Number((en.target as HTMLElement).dataset.ch);
          if (ch) loadAround(ch);
        });
      },
      { rootMargin: "900px 0px" }
    );
    pageRef.current.querySelectorAll(".book-chapter").forEach((sec) => io.observe(sec));
    return () => io.disconnect();
  }, [outline, entryChapter, texts, loadAround]);

  useEffect(() => {
    if (onChapterRoute || !outline) return;
    // A paragraph link scrolls to its paragraph (below), not to the top of its chapter.
    if (hashParagraph(location.hash)) return;
    const target = String(hashChapter(location.hash) ?? jumpChapter);
    if (!target) return;
    const jumpKey = `${workId}:${target}`;
    if (jumpedRef.current === jumpKey) return;
    const el = document.getElementById("ch-" + target);
    if (!el) return;
    jumpedRef.current = jumpKey;
    const n = Number(target);
    if (n) {
      pendingJump.current = n;
      loadAround(n);
    }
    const t = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "auto", block: "start" });
    }, 50);
    return () => window.clearTimeout(t);
  }, [jumpChapter, location.hash, workId, outline, onChapterRoute, loadAround]);

  useLayoutEffect(() => {
    const n = pendingJump.current;
    if (n == null || !texts.has(n)) return;
    const el = document.getElementById("ch-" + n);
    if (!el) return;
    const pin = () => {
      if (pendingJump.current !== n) return;
      el.scrollIntoView({ behavior: "auto", block: "start" });
    };
    pin();
    const observer = new ResizeObserver(pin);
    observer.observe(document.body);
    const timer = window.setTimeout(() => {
      if (pendingJump.current === n) pendingJump.current = null;
      observer.disconnect();
    }, 1200);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [texts]);

  useEffect(() => {
    const stop = () => {
      pendingJump.current = null;
    };
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchmove", stop, { passive: true });
    return () => {
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchmove", stop);
    };
  }, []);

  // Keep one element centred while chapters above it load and push it down; stop when the reader scrolls.
  const pinStop = useRef<(() => void) | null>(null);
  const pinElement = useCallback((el: HTMLElement) => {
    pinStop.current?.();
    pendingJump.current = null;
    const pin = () => el.scrollIntoView({ behavior: "auto", block: "center" });
    pin();
    const ro = new ResizeObserver(pin);
    ro.observe(document.body);
    const stop = () => {
      ro.disconnect();
      window.clearTimeout(timer);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchmove", stop);
      if (pinStop.current === stop) pinStop.current = null;
    };
    const timer = window.setTimeout(stop, 1500);
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchmove", stop, { passive: true });
    pinStop.current = stop;
  }, []);
  useEffect(() => () => pinStop.current?.(), []);

  useEffect(() => {
    document.body.classList.add("route-read");
    return () => document.body.classList.remove("route-read");
  }, []);

  // A paragraph link (#ch-3-p12): scroll to that paragraph once its chapter is on the page, and flash it.
  const paraJumped = useRef<string | null>(null);
  useLayoutEffect(() => {
    const target = hashParagraph(location.hash);
    if (!target || !texts.has(target.chapter)) return;
    const key = workId + location.hash;
    if (paraJumped.current === key) return;
    const el = document.getElementById(paraAnchor(target.chapter, target.n));
    if (!el) return;
    paraJumped.current = key;
    pinElement(el);
    const para = el.closest(".para");
    para?.classList.add("para-flash");
    window.setTimeout(() => para?.classList.remove("para-flash"), 2600);
  }, [texts, location.hash, workId, pinElement]);

  // From search (?hl=word): mark every match on the page and bring the first one in the target chapter into view.
  const findJumped = useRef<string | null>(null);
  useEffect(() => {
    const root = pageRef.current;
    if (!findTerm || !root || entryChapter == null || !texts.has(entryChapter)) return;
    const needle = markFindHits(root, findTerm);
    const key = workId + ":" + entryChapter + ":" + findTerm;
    if (!needle || findJumped.current === key) return;
    const scope = document.getElementById("ch-" + entryChapter);
    const hit = Array.from(scope?.querySelectorAll<HTMLElement>(".para") ?? []).find((p) =>
      (p.textContent || "").toLowerCase().includes(needle)
    );
    if (!hit) return;
    findJumped.current = key;
    pinElement(hit);
  }, [texts, findTerm, workId, entryChapter, langView, pinElement]);
  useEffect(
    () => () => {
      (globalThis as { CSS?: { highlights?: Map<string, unknown> } }).CSS?.highlights?.delete("find-hit");
    },
    [findTerm]
  );

  function onMouseUp(e: React.MouseEvent) {
    if (document.body.classList.contains("read-dict-pick")) return;
    if ((e.target as HTMLElement).closest("#hlBar")) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      setHl(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const startEl = range.startContainer.nodeType === 1 ? (range.startContainer as Element) : range.startContainer.parentElement;
    const endEl = range.endContainer.nodeType === 1 ? (range.endContainer as Element) : range.endContainer.parentElement;
    const para = startEl?.closest?.(".para") as HTMLElement | null;
    const para2 = endEl?.closest?.(".para") as HTMLElement | null;
    if (!para || para !== para2) {
      setHl(null);
      return;
    }
    setHl({
      para,
      range: range.cloneRange(),
      x: Math.min(e.clientX, window.innerWidth - 170),
      y: Math.max(8, e.clientY - 44)
    });
  }

  function applyHighlight(color: string) {
    if (!hl || !outline) return;
    if (!color) {
      hl.para.querySelectorAll(".w").forEach((el) => {
        const text = document.createTextNode(el.textContent || "");
        el.parentNode?.replaceChild(text, el);
      });
      hl.para.normalize();
    } else {
      try {
        const span = document.createElement("span");
        span.className = "w " + color;
        hl.range.surroundContents(span);
      } catch {
        const span = document.createElement("span");
        span.className = "w " + color;
        span.appendChild(hl.range.extractContents());
        hl.range.insertNode(span);
      }
    }
    if (pageRef.current) saveHighlights(outline.work.id, pageRef.current);
    window.getSelection()?.removeAllRanges();
    setHl(null);
  }

  function paraUrl(chapter: number, n: number): string {
    if (!outline) return window.location.href;
    const meta = outline.chapters.find((c) => c.chapter === chapter);
    const base =
      outline.chapters.length > 1 && meta?.slug
        ? chapterPublicPath(outline.author.id, outline.work.id, meta.slug)
        : readPath(outline.work.id);
    return window.location.origin + base + "#" + paraAnchor(chapter, n);
  }

  function citeParts(chapter: number, n: number) {
    const meta = outline?.chapters.find((c) => c.chapter === chapter);
    return {
      // A work the shelf Father did not (certainly) write is cited under its real author, or none.
      author: outline ? citationAuthor(outline.work, outline.author) : "",
      work: outline?.work.title || "",
      chapter: outline && outline.chapters.length > 1 ? meta?.heading || "" : "",
      n,
      translator: outline ? outline.work.translator || translatorFor(outline.work.id, outline.work.series) : "",
      url: paraUrl(chapter, n)
    };
  }

  async function paraAction(kind: "link" | "cite" | "quote" | "share") {
    if (!paraMenu) return;
    const parts = citeParts(paraMenu.chapter, paraMenu.n);
    setParaMenu(null);
    if (kind === "share" && navigator.share) {
      try {
        await navigator.share({ title: parts.work, text: citation(parts), url: parts.url });
      } catch {
        /* share sheet closed */
      }
      return;
    }
    const text = kind === "link" ? parts.url : kind === "cite" ? citation(parts) : quoteWithCitation(paraMenu.text, parts);
    const ok = await copyText(text);
    showToast(ok ? (kind === "link" ? "Link copied" : kind === "cite" ? "Citation copied" : "Quote copied") : "Could not copy");
  }

  function chooseLang(next: LangView) {
    setMode(next === "original" ? "original" : "translation");
    setParallel(next === "parallel");
  }

  if (error) return <p className="empty">{error}</p>;
  if (!outline) return <p className="empty">Loading…</p>;
  if (!outline.chapters.length) return <p className="empty">This work did not load.</p>;

  const isConfessions = outline.work.id === "confessions";
  const subCount = outline.chapters.reduce((n, c) => n + (c.subs?.length ?? 0), 0);
  const firstWord = (outline.chapters[0]?.heading.split(" ")[0] || "").toLowerCase();
  const unitLabel = subCount
    ? (firstWord === "homily" ? "homilies" : "books") + " · " + subCount + " chapters"
    : isConfessions
      ? "books"
      : outline.chapters.length === 1
        ? "part"
        : "chapters";
  const editionNote = preferred ? versionLabel(preferred, versions) : "";
  const attributed = hasAttribution(outline.work);
  const sampleOriginal = sample ? originalOf(sample) : null;
  const originalName = sampleOriginal?.id === "grk" ? "Greek" : "Latin";

  return (
    <div ref={pageRef} className={"read-page" + (hasOriginal && langView === "parallel" ? " is-parallel" : "")} onMouseUp={onMouseUp}>
      <div className="read-docks">
        {outline.chapters.length > 1 ? (
          <DockNotch id="chapters" name="chapters" icon={BookIcon}>
            <ChapterDock
              chapters={outline.chapters}
              currentChapter={currentChapter}
              onJump={jumpToChapter}
              onJumpSub={jumpToSub}
            />
          </DockNotch>
        ) : null}
        <DockNotch id="dictionary" name="dictionary" icon="α">
          <DictionaryDock workId={workId} />
        </DockNotch>
      </div>
      <div className="read-toolbar">
        <div>
          <h1 className="read-title">{outline.work.title}</h1>
          <div className="version-name">
            {attributed ? <span className="read-attribution">{attributionText(outline.work, outline.author)} · </span> : null}
            <Link className="read-author-link" to={"/fathers/" + encodeURIComponent(outline.author.id) + "/"}>
              {attributed ? "Shelved with " + outline.author.name : outline.author.name}
            </Link>{" "}
            · {outline.chapters.length} {unitLabel}
            {" · "}
            <Link className="read-print-link" to={"/print?work=" + encodeURIComponent(outline.work.id)}>
              Download PDF
            </Link>
            {MANUSCRIPTS[outline.work.id] ? (
              <>
                {" · "}
                <ManuscriptButton className="read-print-link read-ms-link" workId={outline.work.id} title={outline.work.title} />
              </>
            ) : null}
          </div>
          <HardcoverDock workId={outline.work.id} />
        </div>
        {hasOriginal ? (
          <div className="read-lang" role="group" aria-label="Language">
            <button type="button" aria-pressed={langView === "translation"} onClick={() => chooseLang("translation")}>
              English
            </button>
            <button type="button" aria-pressed={langView === "original"} onClick={() => chooseLang("original")}>
              {originalName}
            </button>
            <button type="button" aria-pressed={langView === "parallel"} onClick={() => chooseLang("parallel")}>
              Side by side
            </button>
          </div>
        ) : null}
      </div>
      {outline.chapters.map((p) => {
        const passage = texts.get(p.chapter);
        return (
          <section
            className={"book-chapter" + (passage ? "" : " is-unloaded")}
            id={"ch-" + p.chapter}
            data-ch={p.chapter}
            key={p.chapter}
          >
            <h2 className="heading">{p.heading}</h2>
            <ChapterMount workId={outline.work.id}>
              {passage ? (
                <ChapterBody passage={passage} preferred={preferred} versions={versions} view={hasOriginal ? langView : "translation"} onMenu={setParaMenu} />
              ) : (
                <div className="chapter-placeholder" />
              )}
            </ChapterMount>
          </section>
        );
      })}
      <p className="copyright">
        <strong>{editionNote}</strong>
        . {englishCredit(outline.work)}{" "}
        Highlighting is stored only in this browser.{" "}
        <Link className="read-full" to={readPath(outline.work.id)}>
          The whole work
        </Link>
      </p>
      {paraMenu ? (
        <ParaMenu
          target={paraMenu}
          canShare={typeof navigator !== "undefined" && typeof navigator.share === "function"}
          onAction={paraAction}
          onClose={() => setParaMenu(null)}
        />
      ) : null}
      <div
        className={"hl-bar" + (hl ? " open" : "")}
        id="hlBar"
        style={hl ? { left: hl.x, top: hl.y } : undefined}
      >
        <button data-hl="hl-yellow" style={{ background: "#ffe566" }} title="Yellow" onClick={() => applyHighlight("hl-yellow")} />
        <button data-hl="hl-green" style={{ background: "#7dcc70" }} title="Green" onClick={() => applyHighlight("hl-green")} />
        <button data-hl="hl-blue" style={{ background: "#7eb6ff" }} title="Blue" onClick={() => applyHighlight("hl-blue")} />
        <button data-hl="hl-pink" style={{ background: "#ff8fb8" }} title="Pink" onClick={() => applyHighlight("hl-pink")} />
        <button data-hl="" style={{ background: "#fff", color: "#000" }} title="Clear" onClick={() => applyHighlight("")}>
          ×
        </button>
      </div>
    </div>
  );
}

function ParaMenu({
  target,
  canShare,
  onAction,
  onClose
}: {
  target: ParaMenuTarget;
  canShare: boolean;
  onAction: (kind: "link" | "cite" | "quote" | "share") => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector("button")?.focus({ preventScroll: true });
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function onDown(e: PointerEvent) {
      if (!ref.current?.contains(e.target as Node)) onClose();
    }
    function onScroll() {
      onClose();
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown, true);
    window.addEventListener("scroll", onScroll, { passive: true, once: true });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("scroll", onScroll);
    };
  }, [onClose]);
  const left = Math.max(8, Math.min(target.x, window.innerWidth - 228));
  return (
    <div className="para-menu" ref={ref} role="menu" aria-label={"Paragraph " + target.n} style={{ left, top: target.y }}>
      <p className="para-menu-head">¶ {target.n}</p>
      <button type="button" role="menuitem" onClick={() => onAction("link")}>
        Copy link
      </button>
      <button type="button" role="menuitem" onClick={() => onAction("cite")}>
        Copy citation
      </button>
      <button type="button" role="menuitem" onClick={() => onAction("quote")}>
        Copy paragraph with citation
      </button>
      {canShare ? (
        <button type="button" role="menuitem" onClick={() => onAction("share")}>
          Share…
        </button>
      ) : null}
    </div>
  );
}

/** Where the English comes from: the work's own translator and edition when the catalog has them. */
function englishCredit(work: WorkOutline["work"]): string {
  if (work.translator || work.edition) {
    return "English: " + [work.translator ? "tr. " + work.translator : "", work.edition || ""].filter(Boolean).join(", ") + ".";
  }
  if (work.id === "confessions") return "English: E. B. Pusey (1838), Project Gutenberg eBook #3296.";
  if (work.series === "Whiston") return "English: William Whiston (1737), public domain.";
  if (/^(?:ANF|NPNF)/.test(work.series || "")) {
    return "Public-domain English from the Schaff ANF/NPNF editions. Series: " + work.series + ".";
  }
  return "Public-domain English translation" + (work.series ? " (" + work.series + ")" : "") + ".";
}
