import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { chapterOffsets, type Meta, type TypeEntry } from "../../api/connections";
import { THEMES, themeLabel, themeOf, type ThemeId } from "../../data/typeThemes";
import {
  FULL,
  PLACES,
  arcHeight,
  arcPath,
  arcPoint,
  chapterAt,
  clampView,
  chapterSpan,
  frame,
  frameForStop,
  levelFor,
  nearestArc,
  panBy,
  pickFeatured,
  placeLabels,
  positioner,
  toP,
  toX,
  typeArcs,
  typesThrough,
  viewTransform,
  visiblePieces,
  zoomAt,
  type Arc,
  type View
} from "../../lib/typeMap";
import { drawnBy, trailPassages, typeFathers } from "../../lib/typeTrail";
import "../../styles/type-map.css";

/*
 * The types map, and the page's introduction. At rest it is a calm picture: the arcs of every type as soft
 * coloured bands over the line of the Bible, with the page's title and one type to follow. Point at it (or
 * tap it) and the bands sharpen into single arcs to explore: drag along the Bible, scroll or pinch to zoom,
 * point at an arc to see its type, click it to follow it. Click the line under a passage to see the types
 * through that chapter. When a type is open, the map flies to each stop of its trail.
 *
 * Speed: the arcs are painted on a canvas, which redraws all of them in about a millisecond; zoomed in, a tall
 * arc is cut down to the ends that show (visiblePieces in src/lib/typeMap.ts), since stroking the whole of an
 * arc tens of thousands of pixels long stalls the browser. Labels, stops and the line stay in SVG.
 */

type Place = { book: number; chapter: number };
type BaseArc = Arc & { x0: number; x1: number; h: number; theme: ThemeId; d: string };
type ScreenArc = BaseArc;

export function TypeMap({
  meta,
  types,
  chosen,
  stop,
  theme,
  father,
  place,
  onPick,
  onStop,
  onPlace,
  tools,
  legend
}: {
  meta: Meta;
  types: TypeEntry[];
  chosen: TypeEntry | null;
  stop: number;
  /** A theme to bring forward; the others fade. */
  theme: ThemeId | null;
  /** Only the types this Father drew stay bright. */
  father: string | null;
  place: Place | null;
  onPick: (t: TypeEntry) => void;
  onStop: (n: number) => void;
  onPlace: (p: Place | null) => void;
  /** Controls shown in the map's top corner, beside the zoom buttons (finding a type, a Father). */
  tools?: ReactNode;
  /** The map's key, along its foot (the themes). */
  legend?: ReactNode;
}) {
  const navigate = useNavigate();
  const offsets = useMemo(() => chapterOffsets(meta), [meta]);
  const total = offsets[offsets.length - 1];
  const pos = useMemo(() => positioner(meta, offsets), [meta, offsets]);
  const arcs = useMemo(() => typeArcs(types, pos), [types, pos]);
  const fathersOf = useMemo(() => new Map(types.map((t) => [t.id, new Set(typeFathers(t))])), [types]);
  // The type drawn clearly on the resting map, as a first thing to follow: a different one each visit.
  const [featuredType] = useState(() => pickFeatured(types));

  // The map fills its box; the SVG draws at 1:1, so text and strokes keep their size.
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 1000, h: 520 });
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) =>
      setSize({ w: Math.max(280, Math.round(e.contentRect.width)), h: Math.max(260, Math.round(e.contentRect.height)) })
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const width = size.w;
  const H = size.h;
  const narrow = width < 560;
  const PAD = narrow ? 18 : 34;
  // Room under the line for its labels (and the tabernacle's bracket), and below them for the key.
  const BASE = H - (narrow ? 60 : 66) - (legend ? (narrow ? 46 : 50) : 0);
  const inner = width - 2 * PAD;
  // The tallest arc: the map's height, but no taller than three quarters of its width, so on a tall phone
  // screen the arcs stay arcs rather than thin arches.
  const MAXH = Math.min(BASE - 44, inner * 0.75);

  // The view, and flights from one view to another.
  const [view, setView] = useState<View>(FULL);
  const viewRef = useRef(view);
  viewRef.current = view;
  const anim = useRef<number | null>(null);
  const [travel, setTravel] = useState<{ from: number; to: number; t: number } | null>(null);
  const stopFlight = () => {
    if (anim.current != null) cancelAnimationFrame(anim.current);
    anim.current = null;
    setTravel(null);
  };
  /**
   * Fly the view to `target`. With a `path` (one stop of a trail to the next) the flight has three steps, so
   * the eye can follow the point from one passage to the next: the camera pulls back until both ends of the
   * hop are on screen; it holds still while the point travels up the arc and down into its stop; then it
   * settles on `target` (going forward that view already holds the hop, so this step is still).
   */
  function flyTo(target: View, path?: { from: number; to: number }) {
    if (anim.current != null) cancelAnimationFrame(anim.current);
    const start = viewRef.current;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setView(target);
      setTravel(null);
      return;
    }
    const ease = (x: number) => 0.5 - Math.cos(Math.PI * Math.min(1, Math.max(0, x))) / 2;
    const between = (v0: View, v1: View, e: number): View => {
      const span = Math.exp(Math.log(v0.b - v0.a) + (Math.log(v1.b - v1.a) - Math.log(v0.b - v0.a)) * e);
      const c = (v0.a + v0.b) / 2 + ((v1.a + v1.b) / 2 - (v0.a + v0.b) / 2) * e;
      return clampView({ a: c - span / 2, b: c + span / 2 }, total);
    };
    // The view that holds the whole hop, and the target, with a margin.
    let hop = target;
    if (path) {
      const m = Math.abs(path.to - path.from) * 0.15;
      hop = clampView(
        { a: Math.min(target.a, Math.min(path.from, path.to) - m), b: Math.max(target.b, Math.max(path.from, path.to) + m) },
        total
      );
    }
    const t0 = performance.now();
    const dur = path ? 1900 + Math.min(900, Math.abs(path.to - path.from) * 2000) : 700;
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      if (!path) setView(between(start, target, ease(k)));
      else {
        // Camera: to the hop (first 30%), still, then to the target (last 15%). Point: from 22% to 90%.
        setView(k < 0.85 ? between(start, hop, ease(k / 0.3)) : between(hop, target, ease((k - 0.85) / 0.15)));
        setTravel({ ...path, t: ease((k - 0.22) / 0.68) });
      }
      if (k < 1) anim.current = requestAnimationFrame(step);
      else {
        anim.current = null;
        setView(target);
        setTravel(null);
      }
    };
    anim.current = requestAnimationFrame(step);
  }
  useEffect(
    () => () => {
      if (anim.current != null) cancelAnimationFrame(anim.current);
    },
    []
  );

  // Fly to each stop of the open trail; along the arc when the reader steps to the next or previous passage.
  const chosenPs = useMemo(() => (chosen ? trailPassages(chosen).map((r) => pos(r[0])) : []), [chosen, pos]);
  const last = useRef<{ id: string | null; stop: number }>({ id: null, stop: 0 });
  useEffect(() => {
    const before = last.current;
    last.current = { id: chosen?.id ?? null, stop };
    if (!chosen) {
      if (before.id) flyTo(FULL);
      return;
    }
    const n = chosenPs.length;
    const along =
      before.id === chosen.id && Math.abs(stop - before.stop) === 1 && stop >= 1 && stop <= n && before.stop >= 1 && before.stop <= n
        ? { from: chosenPs[before.stop - 1], to: chosenPs[stop - 1] }
        : undefined;
    flyTo(frameForStop(chosenPs, stop, total), along);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosen?.id, stop]);

  // A chapter picked on the line: bring it into view if it is off screen, or zoom in from the whole Bible.
  useEffect(() => {
    if (!place || chosen) return;
    const [p0, p1] = chapterSpan(offsets, place.book, place.chapter);
    const v = viewRef.current;
    if (p0 < v.a || p1 > v.b || levelFor(v, total) === "groups") flyTo(frame(p0, p1, total, 60, 0.5));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place?.book, place?.chapter]);

  // Resting or exploring. The map rests until it is pointed at, tapped or focused, and goes back to rest
  // when the pointer leaves it with nothing chosen and the whole Bible in view.
  const [engaged, setEngaged] = useState(false);
  const leaveTimer = useRef<number | null>(null);
  const isFull = view.b - view.a > 0.999;
  const exploring = engaged || Boolean(chosen) || Boolean(place) || Boolean(theme) || Boolean(father) || !isFull;
  const engage = () => {
    if (leaveTimer.current != null) window.clearTimeout(leaveTimer.current);
    leaveTimer.current = null;
    setEngaged(true);
  };
  const wakeTimer = useRef<number | null>(null);
  const wakeSoon = () => {
    if (engaged || wakeTimer.current != null) return;
    wakeTimer.current = window.setTimeout(() => {
      wakeTimer.current = null;
      engage();
    }, 250);
  };
  const cancelWake = () => {
    if (wakeTimer.current != null) window.clearTimeout(wakeTimer.current);
    wakeTimer.current = null;
  };
  const disengageSoon = () => {
    if (leaveTimer.current != null) window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => setEngaged(false), 700);
  };
  useEffect(
    () => () => {
      if (leaveTimer.current != null) window.clearTimeout(leaveTimer.current);
      if (wakeTimer.current != null) window.clearTimeout(wakeTimer.current);
    },
    []
  );
  // The blurred resting picture is costly to paint, so it leaves the page once its fade is over.
  const [restShown, setRestShown] = useState(true);
  useEffect(() => {
    if (!exploring) {
      setRestShown(true);
      return;
    }
    const id = window.setTimeout(() => setRestShown(false), 600);
    return () => window.clearTimeout(id);
  }, [exploring]);

  // The arcs, drawn once for the whole Bible.
  const base: BaseArc[] = useMemo(
    () =>
      arcs.map((a) => {
        const x0 = PAD + a.p0 * inner;
        const x1 = PAD + a.p1 * inner;
        const h = arcHeight(x1 - x0, MAXH, inner);
        return { ...a, x0, x1, h, theme: themeOf(a.t.id), d: arcPath(x0, x1, BASE, h) };
      }),
    [arcs, PAD, inner, MAXH, BASE]
  );
  const inFilter = (t: TypeEntry) => (!theme || themeOf(t.id) === theme) && (!father || Boolean(fathersOf.get(t.id)?.has(father)));
  const restEls = useMemo(() => base.map((a, i) => <path key={i} d={a.d} className={"tm-rest-arc th-" + a.theme} />), [base]);

  // From the drawing to the screen.
  const T = viewTransform(view, width, PAD, BASE);
  const onScreen = (a: BaseArc): ScreenArc => ({ ...a, x0: T.s * a.x0 + T.tx, x1: T.s * a.x1 + T.tx, h: T.s * a.h });
  const X = (p: number) => toX(view, p, width, PAD);

  // Pointing, dragging and pinching.
  const [hover, setHover] = useState<{ x: number; y: number; arc: ScreenArc | null; chapter: Place | null; n: number } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef<{ x: number; view: View; moved: boolean; pinch?: { d: number; mid: number; view: View } } | null>(null);
  const local = (e: { clientX: number; clientY: number }) => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * width) / r.width, y: ((e.clientY - r.top) * H) / r.height };
  };
  const lineHit = (y: number, touch: boolean) => y > BASE - (touch ? 26 : 16) && y < BASE + (touch ? 30 : 20);

  /** What is under a point: an arc, else a chapter of the line that some type passes through. */
  function look(x: number, y: number, touch: boolean) {
    const candidates = base.filter((a) => inFilter(a.t) || a.t.id === chosen?.id).map(onScreen);
    const arc = nearestArc(candidates, x, y, BASE, touch ? 22 : 12);
    if (arc || !lineHit(y, touch)) return { arc, chapter: null, n: 0 };
    const chapter = chapterAt(meta, offsets, toP(view, x, width, PAD));
    const n = typesThrough(types, chapter.book, chapter.chapter).length;
    return { arc: null, chapter: n ? chapter : null, n };
  }

  // Hover is worked out once a frame, however fast the mouse moves.
  const pending = useRef<{ x: number; y: number } | null>(null);
  const hoverFrame = useRef<number | null>(null);
  const lookRef = useRef(look);
  lookRef.current = look;
  function queueHover(p: { x: number; y: number }) {
    pending.current = p;
    if (hoverFrame.current != null) return;
    hoverFrame.current = requestAnimationFrame(() => {
      hoverFrame.current = null;
      const q = pending.current;
      if (!q) return;
      const got = lookRef.current(q.x, q.y, false);
      setHover(got.arc || got.chapter ? { x: q.x, y: q.y, ...got } : null);
    });
  }
  useEffect(
    () => () => {
      if (hoverFrame.current != null) cancelAnimationFrame(hoverFrame.current);
    },
    []
  );

  function onPointerDown(e: ReactPointerEvent<SVGSVGElement>) {
    cancelWake();
    engage();
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const p = local(e);
    pointers.current.set(e.pointerId, p);
    svgRef.current?.setPointerCapture(e.pointerId);
    if (pointers.current.size === 1) drag.current = { x: p.x, view: viewRef.current, moved: false };
    else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const mid = toP(viewRef.current, (a.x + b.x) / 2, width, PAD);
      drag.current = { x: p.x, view: viewRef.current, moved: true, pinch: { d: Math.max(20, Math.abs(a.x - b.x)), mid, view: viewRef.current } };
    }
  }

  function onPointerMove(e: ReactPointerEvent<SVGSVGElement>) {
    const p = local(e);
    if (pointers.current.has(e.pointerId)) {
      pointers.current.set(e.pointerId, p);
      const d = drag.current;
      if (!d) return;
      if (d.pinch && pointers.current.size >= 2) {
        const [a, b] = [...pointers.current.values()];
        stopFlight();
        setView(zoomAt(d.pinch.view, d.pinch.mid, d.pinch.d / Math.max(20, Math.abs(a.x - b.x)), total));
        return;
      }
      const dx = p.x - d.x;
      if (!d.moved && Math.abs(dx) > 5) d.moved = true;
      if (d.moved) {
        stopFlight();
        if (hover) setHover(null);
        setView(panBy(d.view, (-dx / inner) * (d.view.b - d.view.a), total));
      }
      return;
    }
    if (e.pointerType === "mouse") {
      wakeSoon();
      queueHover(p);
    }
  }

  function onPointerUp(e: ReactPointerEvent<SVGSVGElement>) {
    const had = pointers.current.delete(e.pointerId);
    const d = drag.current;
    if (pointers.current.size === 1 && d?.pinch) {
      // A pinch ended with one finger still down: carry on as a drag from there, without a click.
      const [q] = [...pointers.current.values()];
      drag.current = { x: q.x, view: viewRef.current, moved: true };
      return;
    }
    if (pointers.current.size) return;
    drag.current = null;
    if (!had || !d || d.moved) return;
    const p = local(e);
    const { arc, chapter } = look(p.x, p.y, e.pointerType !== "mouse");
    if (arc) {
      if (arc.t.id !== chosen?.id) onPick(arc.t);
    } else if (chapter) onPlace(chapter);
  }

  function onPointerCancel(e: ReactPointerEvent<SVGSVGElement>) {
    pointers.current.delete(e.pointerId);
    if (!pointers.current.size) drag.current = null;
  }

  // Wheel: up zooms in about the pointer, down zooms out; sideways scrolls along. At the whole Bible a
  // further zoom out is left to the page, so the page still scrolls past the map.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    function onWheel(e: WheelEvent) {
      const r = svg!.getBoundingClientRect();
      const scale = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? r.height : 1;
      const dx = e.deltaX * scale;
      const dy = e.deltaY * scale;
      const v = viewRef.current;
      if (Math.abs(dx) > Math.abs(dy)) {
        if ((dx < 0 && v.a <= 0) || (dx > 0 && v.b >= 1)) return;
        e.preventDefault();
        stopFlight();
        setView(panBy(v, (dx / r.width) * (v.b - v.a), total));
        return;
      }
      if (dy > 0 && v.b - v.a > 0.999) return;
      e.preventDefault();
      stopFlight();
      setEngaged(true);
      const p = toP(v, ((e.clientX - r.left) * width) / r.width, width, PAD);
      setView(zoomAt(v, p, Math.exp(dy * 0.0022), total));
    }
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, total, PAD]);

  function zoomBy(factor: number, at?: number) {
    const v = viewRef.current;
    flyTo(zoomAt(v, at ?? (v.a + v.b) / 2, factor, total));
  }

  function onKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget || e.altKey || e.ctrlKey || e.metaKey) return;
    const v = viewRef.current;
    const span = v.b - v.a;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      if (chosen) return; // the trail's own keys move along it
      flyTo(panBy(v, (e.key === "ArrowLeft" ? -0.25 : 0.25) * span, total));
    } else if (e.key === "+" || e.key === "=") zoomBy(0.5);
    else if (e.key === "-" || e.key === "_") zoomBy(2);
    else if (e.key === "0") flyTo(FULL);
    else return;
    e.preventDefault();
  }

  // Which arcs are lit: the type pointed at, else the open type, else the types through the picked chapter.
  const [inviteOn, setInviteOn] = useState(false);
  const hoverId = hover?.arc?.t.id ?? (inviteOn && featuredType ? featuredType.id : null);
  const through = useMemo(() => (place ? new Set(typesThrough(types, place.book, place.chapter).map((t) => t.id)) : null), [place, types]);
  const lit = (id: string) => (hoverId ? id === hoverId : chosen ? id === chosen.id : through ? through.has(id) : false);
  const anyLit = Boolean(hoverId || chosen || (through && through.size));

  // The theme colours, read from the page's CSS so night mode is followed.
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [colors, setColors] = useState<Record<string, string>>({});
  useEffect(() => {
    const read = () => {
      const cs = getComputedStyle(wrapRef.current ?? document.documentElement);
      setColors(Object.fromEntries(THEMES.map((th) => [th.id, cs.getPropertyValue("--th-" + th.id).trim() || "#888"])));
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
    return () => mo.disconnect();
  }, []);

  // What of each arc shows in this view; if nothing does, the map says so rather than sit blank.
  const drawn = base.map((b) => {
    const a = onScreen(b);
    return { b, pieces: visiblePieces(a.x0, a.x1, BASE, a.h, width, H) };
  });
  const empty = !drawn.some((d) => d.pieces.length);

  // Paint the arcs: the dim and faded first, the lit ones on top.
  useLayoutEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const pw = Math.round(width * dpr);
    const ph = Math.round(H * dpr);
    if (cv.width !== pw || cv.height !== ph) {
      cv.width = pw;
      cv.height = ph;
    }
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, H);
    ctx.lineCap = "round";
    const stroke = ({ b, pieces }: (typeof drawn)[number], alpha: number, lineWidth: number) => {
      if (!pieces.length) return;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = colors[b.theme] ?? "#888";
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      for (const c of pieces) {
        ctx.moveTo(c[0][0], c[0][1]);
        ctx.bezierCurveTo(c[1][0], c[1][1], c[2][0], c[2][1], c[3][0], c[3][1]);
      }
      ctx.stroke();
    };
    const dim = chosen ? 0.07 : 0.12;
    const on: (typeof drawn)[number][] = [];
    for (const d of drawn) {
      if (anyLit && lit(d.b.t.id)) on.push(d);
      else stroke(d, !inFilter(d.b.t) ? 0.05 : anyLit ? dim : 0.42, 1.3);
    }
    for (const d of on) stroke(d, 1, 3);
  });
  const level = levelFor(view, total);

  // Names over the arcs: for a theme brought forward, each of its types at the top of its widest arc on screen.
  const names: { id: string; t: TypeEntry; x: number; y: number }[] = [];
  if (theme && !chosen && !place) {
    const widest = new Map<string, ScreenArc>();
    for (const b of base) {
      if (!inFilter(b.t)) continue;
      const a = onScreen(b);
      const mid = (a.x0 + a.x1) / 2;
      if (a.h > BASE - 24 || mid < 0 || mid > width) continue;
      const w = widest.get(a.t.id);
      if (!w || Math.abs(a.x1 - a.x0) > Math.abs(w.x1 - w.x0)) widest.set(a.t.id, a);
    }
    const boxes: { x: number; y: number; w: number }[] = [];
    for (const a of [...widest.values()].sort((p, q) => q.h - p.h)) {
      const label = shortLabel(a.t.label);
      const w = label.length * 6.4 + 8;
      const x = Math.min(width - PAD - w / 2, Math.max(PAD + w / 2, (a.x0 + a.x1) / 2));
      const y = BASE - a.h - 6;
      if (boxes.some((b) => Math.abs(b.x - x) < (b.w + w) / 2 + 4 && Math.abs(b.y - y) < 15)) continue;
      boxes.push({ x, y, w });
      names.push({ id: a.t.id, t: a.t, x, y });
    }
  }

  // The line beneath: book groups, books or chapters, by zoom.
  const groups = useMemo(() => {
    const out: { id: string; x0: number; x1: number }[] = [];
    meta.books.forEach((b) => {
      const p0 = offsets[b.n - 1] / total;
      const p1 = offsets[b.n] / total;
      const prev = out[out.length - 1];
      if (prev && prev.id === b.group) prev.x1 = p1;
      else out.push({ id: b.group, x0: p0, x1: p1 });
    });
    return out;
  }, [meta, offsets, total]);
  const groupName = (id: string) => meta.groups.find((g) => g.id === id)?.label ?? id;
  const visibleBooks = meta.books
    .map((b) => ({ b, x0: X(offsets[b.n - 1] / total), x1: X(offsets[b.n] / total) }))
    .filter((s) => s.x1 > 0 && s.x0 < width);
  const chapterW = inner / ((view.b - view.a) * total);
  const chapterStep = [1, 2, 5, 10, 25, 50].find((s) => s * chapterW >= 26) ?? 50;
  const ntX = X(offsets[39] / total);

  const bookNames =
    level === "groups"
      ? []
      : placeLabels(
          visibleBooks.map((s) => {
            const name = s.x1 - s.x0 > s.b.name.length * 6.6 + 8 ? s.b.name : s.b.id.toUpperCase();
            const left = Math.max(s.x0, PAD);
            const right = Math.min(s.x1, width - PAD);
            return { ...s, name, x: (left + right) / 2, w: name.length * 6.6 + 4 };
          }),
          4
        );

  const featured = !exploring && featuredType ? base.filter((a) => a.t.id === featuredType.id) : [];
  const touchy = typeof window !== "undefined" && window.matchMedia?.("(hover: none)").matches;

  // The point that travels along the arc during a flight.
  let dot: [number, number] | null = null;
  if (travel) {
    const x0 = X(travel.from);
    const x1 = X(travel.to);
    dot = arcPoint(x0, x1, BASE, arcHeight(x1 - x0, MAXH, inner), travel.t);
  }
  const placeSpan = place ? chapterSpan(offsets, place.book, place.chapter) : null;
  const showHelp = exploring && !chosen && !place && !theme;

  return (
    <div
      ref={wrapRef}
      className={"tm" + (exploring ? " is-exploring" : " is-resting") + (anyLit ? " has-lit" : "") + (chosen ? " has-chosen" : "")}
      tabIndex={0}
      role="group"
      aria-label="Map of the types, Genesis to Revelation. Arrow keys move along it; plus and minus zoom; 0 shows the whole Bible."
      onKeyDown={onKeyDown}
      onFocus={(e) => e.target === e.currentTarget && engage()}
      onPointerLeave={(e) => {
        if (e.pointerType !== "mouse") return;
        pending.current = null;
        setHover(null);
        disengageSoon();
      }}
    >
      {/* At rest: soft bands of colour, painted once and blurred as one layer. */}
      {restShown ? (
        <svg className="tm-rest" width={width} height={H} viewBox={`0 0 ${width} ${H}`} aria-hidden="true">
          {restEls}
        </svg>
      ) : null}

      {/* Exploring: each arc on its own. */}
      <canvas ref={canvasRef} className="tm-canvas" style={{ width, height: H }} aria-hidden="true" />

      <svg
        ref={svgRef}
        className="tm-svg"
        width={width}
        height={H}
        viewBox={`0 0 ${width} ${H}`}
        role="img"
        aria-label="Each type as arcs joining its passages, Genesis to Revelation"
        onPointerEnter={(e) => e.pointerType === "mouse" && wakeSoon()}
        onPointerLeave={(e) => e.pointerType === "mouse" && cancelWake()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onDoubleClick={(e) => {
          const p = local(e);
          if (!look(p.x, p.y, false).arc) zoomBy(0.4, toP(view, p.x, width, PAD));
        }}
        style={{ cursor: hover ? "pointer" : "grab" }}
      >
        {/* The Testaments, at the widest view. */}
        {level === "groups" && ntX > 0 && ntX < width ? (
          <g className="tm-testaments">
            <line x1={ntX} x2={ntX} y1={18} y2={BASE} className="tm-divide" />
            <text x={ntX - 8} y={68} textAnchor="end">
              Old Testament
            </text>
            <text x={ntX + 8} y={68}>New</text>
          </g>
        ) : null}

        {featured.length ? (
          <g className="tm-featured">
            {featured.map((a) => (
              <path key={a.i} d={a.d} className={"tm-featured-arc th-" + a.theme} pathLength={1} />
            ))}
          </g>
        ) : null}

        {names.map((n) => (
          <text key={n.id} x={n.x} y={n.y} textAnchor="middle" className={"tm-name th-" + themeOf(n.id)}>
            {shortLabel(n.t.label)}
          </text>
        ))}

        {/* The line of the Bible. */}
        <line x1={0} x2={width} y1={BASE} y2={BASE} className="tm-base" />
        {placeSpan ? (
          <rect
            x={X(placeSpan[0]) - 1}
            y={BASE - 4}
            width={Math.max(4, X(placeSpan[1]) - X(placeSpan[0]) + 2)}
            height={8}
            rx={3}
            className="tm-place"
          />
        ) : null}

        {level === "groups"
          ? groups.map((g, i) => {
              const x0 = X(g.x0);
              const x1 = X(g.x1);
              return (
                <g key={g.id + i} className="tm-group">
                  <rect x={x0} y={BASE + 6} width={Math.max(1, x1 - x0 - 2)} height={6} rx={2} className={i % 2 ? "is-odd" : ""} />
                  {x1 - x0 > groupName(g.id).length * 6 + 6 ? (
                    <text x={(x0 + x1) / 2} y={BASE + 28} textAnchor="middle">
                      {groupName(g.id)}
                    </text>
                  ) : null}
                </g>
              );
            })
          : null}

        {level !== "groups" ? (
          <g className="tm-books">
            {visibleBooks.map((s) => (
              <line key={s.b.id} x1={s.x0} x2={s.x0} y1={BASE - 4} y2={BASE + 12} />
            ))}
            {bookNames.map((s) => (
              <text key={s.b.id} x={s.x} y={BASE + 28} textAnchor="middle">
                {s.name}
              </text>
            ))}
          </g>
        ) : null}

        {level === "chapters" ? (
          <g className="tm-chapters">
            {visibleBooks.flatMap((s) =>
              Array.from({ length: s.b.chapters }, (_, i) => i + 1)
                .filter((c) => c % chapterStep === 0 || c === 1)
                .map((c) => {
                  const x = X((offsets[s.b.n - 1] + c - 1) / total) + chapterW / 2;
                  if (x < 0 || x > width) return null;
                  return (
                    <text key={s.b.id + c} x={x} y={BASE + 15} textAnchor="middle">
                      {c}
                    </text>
                  );
                })
            )}
          </g>
        ) : null}

        {level !== "groups"
          ? PLACES.map((pl) => {
              const x0 = X(pos(pl.from));
              const x1 = X(pos(pl.to));
              if (x1 - x0 < 36 || x1 < 0 || x0 > width) return null;
              const mid = (Math.max(x0, PAD) + Math.min(x1, width - PAD)) / 2;
              return (
                <a
                  key={pl.href}
                  href={pl.href}
                  className="tm-placelink"
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(pl.href);
                  }}
                >
                  <path d={`M${x0},${BASE + 36} v4 H${x1} v-4`} />
                  <text x={mid} y={BASE + 55} textAnchor="middle">
                    {pl.label} ↗
                  </text>
                </a>
              );
            })
          : null}

        {/* The open trail: a numbered stop for each passage, and the point that travels between them. */}
        {chosen
          ? chosenPs.map((p, i) => {
              const x = X(p);
              if (x < -10 || x > width + 10) return null;
              const current = stop === i + 1;
              return (
                <g
                  key={i}
                  className={"tm-stop" + (current ? " is-here" : "")}
                  transform={`translate(${x},${BASE})`}
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                  onClick={() => onStop(i + 1)}
                >
                  <circle r={10} />
                  <text y={3.5} textAnchor="middle">
                    {i + 1}
                  </text>
                </g>
              );
            })
          : null}
        {dot ? (
          <g className="tm-traveller" transform={`translate(${dot[0]},${dot[1]})`}>
            <circle r={15} className="tm-traveller-halo" />
            <circle r={7} />
          </g>
        ) : null}
      </svg>

      {/* The page's introduction, while the map rests, with the featured type as a first thing to follow. */}
      <div className="tm-caption">
        <p className="tm-kicker">Types of Christ</p>
        <h1 className="tm-title">What the Fathers saw in the Old Testament</h1>
        <p className="tm-caption-main">Every arc joins passages the Fathers read as one pattern, from Genesis to Revelation.</p>
        <p className="tm-caption-sub">{touchy ? "Tap the map to explore it, or start here:" : "Point at the map to explore it, or start here:"}</p>
        {/* The button outlasts the rest of the caption: it stays while exploring, until something is open. */}
        {featuredType && !chosen && !place && !theme ? (
          <button
            type="button"
            className={"tm-invite th-" + themeOf(featuredType.id)}
            onClick={() => {
              setInviteOn(false);
              onPick(featuredType);
            }}
            onMouseEnter={() => setInviteOn(true)}
            onMouseLeave={() => setInviteOn(false)}
            onFocus={() => setInviteOn(true)}
            onBlur={() => setInviteOn(false)}
          >
            {shortLabel(featuredType.label)}: follow it →
          </button>
        ) : null}
      </div>
      <p className={"tm-help" + (showHelp ? " is-on" : "")} aria-hidden={!showHelp}>
        {touchy
          ? "Drag to move along the Bible · pinch to zoom · tap an arc to follow it · tap the line to see a chapter"
          : "Drag to move along the Bible · scroll to zoom · click an arc to follow it · click the line to see a chapter"}
      </p>

      {legend ? <div className="tm-legend">{legend}</div> : null}

      {exploring && empty ? <p className="tm-empty">No type passes through this stretch. Drag along the Bible, or zoom out.</p> : null}

      {hover && !drag.current?.moved ? <HoverCard hover={hover} meta={meta} width={width} chosen={chosen} /> : null}

      <div className="tm-controls">
        {tools}
        {!isFull ? (
          <button type="button" onClick={() => flyTo(FULL)} className="tm-whole">
            Whole Bible
          </button>
        ) : null}
        <button type="button" onClick={() => zoomBy(2)} aria-label="Zoom out" disabled={isFull}>
          −
        </button>
        <button type="button" onClick={() => zoomBy(0.5)} aria-label="Zoom in">
          +
        </button>
      </div>
    </div>
  );
}

/** The label under the pointer: a type, or a chapter of the line. */
function HoverCard({
  hover,
  meta,
  width,
  chosen
}: {
  hover: { x: number; y: number; arc: ScreenArc | null; chapter: Place | null; n: number };
  meta: Meta;
  width: number;
  chosen: TypeEntry | null;
}) {
  const left = Math.min(width - 130, Math.max(130, hover.x));
  const style = { left, top: hover.y };
  if (hover.arc) {
    const t = hover.arc.t;
    return (
      <div className="tm-hover" style={style} role="tooltip">
        <span className={"tm-hover-theme th-" + hover.arc.theme}>{themeLabel(hover.arc.theme)}</span>
        <strong>{t.label}</strong>
        <span className="tm-hover-meta">
          {t.ranges.length} passages · {drawnBy(t)}
        </span>
        {t.id !== chosen?.id ? <span className="tm-hover-go">Click to follow it</span> : null}
      </div>
    );
  }
  if (hover.chapter) {
    return (
      <div className="tm-hover is-chapter" style={style} role="tooltip">
        <strong>
          {meta.books[hover.chapter.book - 1]?.name} {hover.chapter.chapter}
        </strong>
        <span className="tm-hover-meta">{hover.n === 1 ? "1 type passes through" : hover.n + " types pass through"}</span>
        <span className="tm-hover-go">Click to see them</span>
      </div>
    );
  }
  return null;
}

/** A type's name without its gloss in brackets: "Dove (herald of peace; the Spirit)" → "Dove". */
export function shortLabel(label: string): string {
  return label.replace(/\s*\(.*\)\s*$/, "").trim();
}
