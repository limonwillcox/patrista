import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { translationsOf } from "../../server/query";
import type { Passage, WorkChapterMeta, WorkOutline } from "../../server/types";
import { fetchChapter, fetchWork } from "../api/client";
import { ChapterDock } from "../components/ChapterDock";
import { DictionaryDock } from "../components/DictionaryDock";
import { HardcoverDock } from "../components/HardcoverDock";
import { BookIcon, DockNotch } from "../components/DockNotch";
import { readPath, resolveWorkId, staticWorkId, workIdForReadPath } from "../lib/workSlugs";
import { useApp } from "../context/AppContext";
import { chapterNumberForSlug, chapterPublicPath, parseFatherChapterPath } from "../lib/fatherPaths";
import { chapterAtReadingLine } from "../lib/readDocks";

const HL_COLORS = ["hl-yellow", "hl-green", "hl-blue", "hl-pink"] as const;

function versionLabel(id: string, versions: { id: string; label: string }[]): string {
  return versions.find((v) => v.id === id)?.label || id.toUpperCase();
}

function renderParas(passage: Passage, version: string) {
  const paras = passage.versions[version] || [];
  return paras.map((text, i) => {
    const key = passage.work + "-" + passage.chapter + "-" + version + "-" + i;
    const section = `${passage.work}:${passage.chapter}:p${i}`;
    return (
      <p className="para" data-key={key} data-section={section} key={key}>
        {text}
      </p>
    );
  });
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

function ChapterBody({
  passage,
  preferred,
  versions
}: {
  passage: Passage;
  preferred: string;
  versions: { id: string; label: string; short: string; group: "translation" | "original" }[];
}) {
  const transList = translationsOf(passage, versions);
  const trans = transList.find((v) => v.id === preferred) || transList[0];
  if (!trans) return <p className="empty">No text available.</p>;
  return <div className="passage">{renderParas(passage, trans.id)}</div>;
}

function paraTextNodes(para: HTMLElement): Text[] {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(para, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const p = (node as Text).parentElement;
      if (!p || p.closest(".pnum") || p.closest(".fn") || !node.nodeValue) return NodeFilter.FILTER_REJECT;
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
  const { catalog, version, setVersion, setActivePassage } = useApp();
  const location = useLocation();
  const chapterRoute = parseFatherChapterPath(location.pathname);
  const onChapterRoute = chapterRoute != null;
  const routeSlug = chapterRoute?.chapterSlug || "";
  const [params] = useSearchParams();
  const workId = resolveWorkId(
    chapterRoute?.workId || workIdForReadPath(location.pathname) || staticWorkId(location.pathname) || params.get("work") || "confessions"
  );
  const jumpChapter = params.get("chapter") || "";
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

  useEffect(() => {
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    setOutline(null);
    setTexts(new Map());
    textsRef.current = new Map();
    inflightRef.current = new Set();
    inflightPromises.current = new Map();
    setError(null);
    const hashTarget = onChapterRoute ? "" : location.hash.replace(/^#ch-/, "");
    const hinted = Number(hashTarget || (onChapterRoute ? "" : jumpChapter));
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
    const hashTarget = location.hash.replace(/^#ch-/, "");
    const target = hashTarget || jumpChapter;
    const n = Number(target);
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

  useEffect(() => {
    if (entryChapter == null || !texts.has(entryChapter)) return;
    loadAround(entryChapter);
  }, [entryChapter, texts, loadAround]);

  useLayoutEffect(() => {
    if (!outline || !onChapterRoute || entryChapter == null) return;
    const jumpKey = workId + ":path:" + entryChapter;
    if (jumpedRef.current === jumpKey) return;
    const el = document.getElementById("ch-" + entryChapter);
    if (!el) return;
    jumpedRef.current = jumpKey;
    el.scrollIntoView({ behavior: "auto", block: "start" });
  }, [outline, onChapterRoute, entryChapter, workId]);

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
    const hashTarget = location.hash.replace(/^#ch-/, "");
    const target = hashTarget || jumpChapter;
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

  if (error) return <p className="empty">{error}</p>;
  if (!outline) return <p className="empty">Loading…</p>;
  if (!outline.chapters.length) return <p className="empty">This work did not load.</p>;

  const isConfessions = outline.work.id === "confessions";
  const unitLabel = isConfessions ? "books" : outline.chapters.length === 1 ? "part" : "chapters";
  const editionNote = preferred ? versionLabel(preferred, versions) : "";

  return (
    <div ref={pageRef} onMouseUp={onMouseUp}>
      <div className="read-docks">
        {outline.chapters.length > 1 ? (
          <DockNotch id="chapters" name="chapters" icon={BookIcon}>
            <ChapterDock chapters={outline.chapters} currentChapter={currentChapter} onJump={jumpToChapter} />
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
            {outline.author.name} · {outline.chapters.length} {unitLabel}
          </div>
          <HardcoverDock workId={outline.work.id} />
        </div>
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
                <ChapterBody passage={passage} preferred={preferred} versions={versions} />
              ) : (
                <div className="chapter-placeholder" />
              )}
            </ChapterMount>
          </section>
        );
      })}
      <p className="copyright">
        <strong>{editionNote}</strong>
        {isConfessions ? (
          <>
            . English: E. B. Pusey (1838), Project Gutenberg eBook #3296.
          </>
        ) : (
          <>
            . Public-domain English from the Schaff ANF/NPNF editions. Series: {outline.work.series || "Schaff"}.
          </>
        )}{" "}
        Highlighting is stored only in this browser.{" "}
        <Link className="read-full" to={readPath(outline.work.id)}>
          The whole work
        </Link>
      </p>
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
