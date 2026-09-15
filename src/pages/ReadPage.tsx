import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { originalOf, translationsOf } from "../../server/query";
import type { Passage, WorkPayload } from "../../server/types";
import { fetchWork } from "../api/client";
import { useApp } from "../context/AppContext";

const HL_COLORS = ["hl-yellow", "hl-green", "hl-blue", "hl-pink"] as const;

function versionLabel(id: string, versions: { id: string; label: string }[]): string {
  return versions.find((v) => v.id === id)?.label || id.toUpperCase();
}

function renderParas(passage: Passage, version: string) {
  const paras = passage.versions[version] || [];
  return paras.map((text, i) => {
    const notes = (passage.footnotes || []).filter((f) => f.para === i);
    const key = passage.work + "-" + passage.chapter + "-" + version + "-" + i;
    const section = `${passage.work}:${passage.chapter}:p${i}`;
    return (
      <p className="para" data-key={key} data-section={section} key={key}>
        <span className="pnum">{i + 1}</span> {text}
        {notes.map((f) => (
          <sup className="fn" key={f.n}>
            ({f.n})
          </sup>
        ))}
      </p>
    );
  });
}

function Notes({ passage }: { passage: Passage }) {
  const notes = passage.footnotes || [];
  return (
    <aside className="chapter-notes" aria-label="Notes">
      <p className="notes-label">Notes</p>
      {notes.length ? (
        notes.map((f) => (
          <p className="note-item" key={f.n}>
            <sup className="fn">({f.n})</sup> {f.text}
          </p>
        ))
      ) : (
        <p className="notes-empty">No notes for this book.</p>
      )}
    </aside>
  );
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
  mode,
  preferred,
  split,
  versions
}: {
  passage: Passage;
  mode: "translation" | "original";
  preferred: string;
  split: boolean;
  versions: { id: string; label: string; short: string; group: "translation" | "original" }[];
}) {
  const orig = originalOf(passage);
  const transList = translationsOf(passage, versions);
  const trans = transList.find((v) => v.id === preferred) || transList[0];

  if (mode === "original") {
    const main = !orig ? (
      <div className="trans-pane">
        <p className="empty">No original-language text for this book is in the library yet.</p>
      </div>
    ) : (
      <div className="trans-pane">
        <p className="pane-label">{versionLabel(orig.id, versions)} · original</p>
        <div className="passage">{renderParas(passage, orig.id)}</div>
      </div>
    );
    return (
      <div className="chapter-row">
        {main}
        <Notes passage={passage} />
      </div>
    );
  }

  if (split && orig && trans) {
    return (
      <div className="chapter-row has-orig">
        <div className="trans-pane">
          <p className="pane-label">{versionLabel(trans.id, versions)}</p>
          <div className="passage">{renderParas(passage, trans.id)}</div>
        </div>
        <div className="orig-pane">
          <p className="pane-label">{versionLabel(orig.id, versions)} · original</p>
          <div className="passage">{renderParas(passage, orig.id)}</div>
        </div>
        <Notes passage={passage} />
      </div>
    );
  }

  if (trans) {
    return (
      <div className="chapter-row">
        <div className="trans-pane">
          <p className="pane-label">{versionLabel(trans.id, versions)}</p>
          <div className="passage">{renderParas(passage, trans.id)}</div>
        </div>
        <Notes passage={passage} />
      </div>
    );
  }

  return (
    <div className="chapter-row">
      <p className="empty">No text available.</p>
      <Notes passage={passage} />
    </div>
  );
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
  const { catalog, mode, setMode, version, setVersion, parallel, setActivePassage } = useApp();
  const [params] = useSearchParams();
  const workId = params.get("work") || "confessions";
  const modeParam = params.get("mode");
  const jumpChapter = params.get("chapter") || "";
  const [payload, setPayload] = useState<WorkPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState<Set<number>>(new Set());
  const pageRef = useRef<HTMLDivElement>(null);
  const [hl, setHl] = useState<{ x: number; y: number; para: HTMLElement; range: Range } | null>(null);
  const jumpedRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPayload(null);
    fetchWork(workId)
      .then((data) => {
        if (!cancelled) setPayload(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [workId]);

  const first = payload?.chapters[0] || null;
  const versions = catalog?.versions || [];
  const trans = first ? translationsOf(first, versions) : [];
  const preferred = useMemo(() => {
    if (!trans.length) return version;
    return trans.some((v) => v.id === version) ? version : trans[0].id;
  }, [trans, version]);

  useEffect(() => {
    if (modeParam === "original" || modeParam === "translation") setMode(modeParam);
  }, [modeParam, setMode]);

  useEffect(() => {
    if (preferred && preferred !== version) setVersion(preferred);
  }, [preferred, version, setVersion]);

  useEffect(() => {
    setActivePassage(first);
    return () => setActivePassage(null);
  }, [first, setActivePassage]);

  useEffect(() => {
    setReady(new Set());
    jumpedRef.current = null;
  }, [workId]);

  useEffect(() => {
    if (!payload) return;
    const hashTarget = location.hash.replace(/^#ch-/, "");
    const target = hashTarget || jumpChapter;
    const openCh = Number(target) || payload.chapters[0]?.chapter || 1;
    setReady((prev) => {
      const next = new Set(prev);
      next.add(openCh);
      if (payload.chapters.some((c) => c.chapter === openCh - 1)) next.add(openCh - 1);
      if (payload.chapters.some((c) => c.chapter === openCh + 1)) next.add(openCh + 1);
      return next;
    });
  }, [payload, jumpChapter, location.hash]);

  useEffect(() => {
    if (!payload || !pageRef.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const ch = Number((en.target as HTMLElement).dataset.ch);
          if (ch) {
            setReady((prev) => {
              if (prev.has(ch)) return prev;
              const next = new Set(prev);
              next.add(ch);
              return next;
            });
          }
        });
      },
      { rootMargin: "900px 0px" }
    );
    pageRef.current.querySelectorAll(".book-chapter").forEach((sec) => io.observe(sec));
    return () => io.disconnect();
  }, [payload]);

  useEffect(() => {
    const hashTarget = location.hash.replace(/^#ch-/, "");
    const target = hashTarget || jumpChapter;
    if (!target) return;
    const jumpKey = `${workId}:${target}`;
    if (jumpedRef.current === jumpKey) return;

    const targetNum = Number(target);
    if (targetNum && !ready.has(targetNum)) return;

    const el = document.getElementById("ch-" + target);
    if (el) {
      jumpedRef.current = jumpKey;
      const t = window.setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
      return () => window.clearTimeout(t);
    }
  }, [jumpChapter, location.hash, workId, payload, ready]);

  function onMouseUp(e: React.MouseEvent) {
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
    if (!hl || !payload) return;
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
    if (pageRef.current) saveHighlights(payload.work.id, pageRef.current);
    window.getSelection()?.removeAllRanges();
    setHl(null);
  }

  if (error) return <p className="empty">{error}</p>;
  if (!payload) return <p className="empty">Loading…</p>;
  if (!payload.chapters.length) return <p className="empty">This work did not load.</p>;

  const showParallelOrig = mode === "translation" && parallel && !!originalOf(payload.chapters[0]);
  const isConfessions = payload.work.id === "confessions";
  const unitLabel = isConfessions ? "books" : payload.chapters.length === 1 ? "part" : "chapters";
  const origLabel = (() => {
    const o = originalOf(payload.chapters[0]);
    return o ? versionLabel(o.id, versions) + " · original" : "Original";
  })();
  const editionNote =
    mode === "original"
      ? isConfessions
        ? "Latin text of the Confessiones"
        : origLabel
      : preferred
        ? versionLabel(preferred, versions) + (showParallelOrig ? " · " + origLabel : "")
        : "";

  return (
    <div ref={pageRef} onMouseUp={onMouseUp}>
      <div className="read-toolbar">
        <span className="nav-chap" style={{ opacity: 0.35, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          ‹
        </span>
        <span className="nav-chap" style={{ opacity: 0.35, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          ›
        </span>
        <div>
          <h1 className="read-title">{payload.work.title}</h1>
          <div className="version-name">
            {payload.author.name} · {payload.chapters.length} {unitLabel}
          </div>
        </div>
      </div>
      <nav className="book-toc" aria-label="Chapters">
        {payload.chapters.map((p) => {
          const label = (p.heading || "").replace(/^Book\s+/i, "") || String(p.chapter);
          return (
            <a
              key={p.chapter}
              href={"#ch-" + p.chapter}
              onClick={() => {
                setReady((prev) => {
                  if (prev.has(p.chapter)) return prev;
                  const next = new Set(prev);
                  next.add(p.chapter);
                  return next;
                });
                jumpedRef.current = `${workId}:${p.chapter}`;
                const el = document.getElementById("ch-" + p.chapter);
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              {label}
            </a>
          );
        })}
      </nav>
      {payload.chapters.map((p) => (
        <section className="book-chapter" id={"ch-" + p.chapter} data-ch={p.chapter} key={p.chapter}>
          <h2 className="heading">{p.heading}</h2>
          <ChapterMount workId={payload.work.id}>
            {ready.has(p.chapter) ? (
              <ChapterBody passage={p} mode={mode} preferred={preferred} split={showParallelOrig} versions={versions} />
            ) : null}
          </ChapterMount>
        </section>
      ))}
      <p className="copyright">
        <strong>{editionNote}</strong>
        {isConfessions ? (
          <>
            . English: E. B. Pusey (1838), Project Gutenberg eBook #3296. Latin: the Confessiones under <code>Fathers/Latin/</code>.
          </>
        ) : (
          <>
            . Public-domain English from the Schaff ANF/NPNF editions. Series: {payload.work.series || "Schaff"}.
          </>
        )}{" "}
        Highlighting is stored only in this browser.{" "}
        <Link className="read-full" to={"/read?work=" + encodeURIComponent(payload.work.id)}>
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
