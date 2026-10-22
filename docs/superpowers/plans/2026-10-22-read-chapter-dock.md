# Read-tab Chapter Dock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a wood Chapter dock above the Dictionary dock on `/read` so readers can prev/next and pick any chapter without scrolling back to the top, without covering the prose column.

**Architecture:** Pure helpers in `src/lib/readDocks.ts` (chapter label, reading-line chapter pick, mutual-exclusion dock events). New `ChapterDock` component. Both docks mount inside one shared fixed `.read-docks` stack on `ReadPage`. Dictionary listens for exclusion events. Existing `jumpToChapter` stays the only jump path.

**Tech Stack:** React 19, Vite, existing `src/styles.css` wood tokens, vitest (pure helpers + source scans; no RTL).

## Global Constraints

- Never shift or overlay the ~860px prose column; dock stays in the right gutter overlay like Dictionary.
- Wood materials match Dictionary: `#24150c`, `#f3e2a8`, gold-tint border, uppercase muted label.
- Chapter dock stacks **above** Dictionary in one shared fixed container.
- Keep top `details.chapter-index` for landing/crawlability.
- Remove inert toolbar `‹` `›` spans.
- Hide Chapter dock when `outline.chapters.length <= 1`.
- Reuse `jumpToChapter` / `loadAround` / pin-until-loaded; no second jump mechanism.
- Only one dock panel open at a time (chapter list vs dictionary senses/pick).
- No keyboard shortcuts this pass; no API/corpus changes; no static father HTML changes.

## File map

| File | Role |
|------|------|
| `src/lib/readDocks.ts` | Pure helpers + dock open/close event bus |
| `tests/readDocks.test.ts` | Unit tests for helpers |
| `src/components/ChapterDock.tsx` | Chapter wood dock UI |
| `src/components/DictionaryDock.tsx` | Exclusion listener; drop own fixed wrapper class ownership |
| `src/pages/ReadPage.tsx` | Shared stack, current-chapter state, wire jump, remove toolbar nav |
| `src/styles.css` | `.read-docks` stack; chapter dock styles; move fixed pos off `.read-dict-dock` |
| `tests/readWorkToc.test.ts` | Source-scan: ChapterDock mount, no inert nav-chap |

---

### Task 1: Pure helpers + dock events

**Files:**
- Create: `src/lib/readDocks.ts`
- Create: `tests/readDocks.test.ts`

**Interfaces:**
- Produces:
  - `chapterDockLabel(heading: string, chapter: number): string` — trimmed heading if non-empty, else `"Ch. " + chapter`
  - `chapterAtReadingLine(sections: { chapter: number; top: number; bottom: number }[], lineY: number): number | null` — same rule as ReadPage URL updater: prefer section where `top <= lineY && bottom > lineY`, else last with `top <= lineY`, else first, else null
  - `READ_DOCK_EVENT = "piblia:read-dock"`
  - `type ReadDockId = "chapter" | "dictionary"`
  - `announceReadDock(dock: ReadDockId): void` — `window.dispatchEvent(new CustomEvent(READ_DOCK_EVENT, { detail: { dock } }))`
  - `type ReadDockListener = (dock: ReadDockId) => void`
  - `subscribeReadDock(listener: ReadDockListener): () => void` — listens on `window`, ignores non-matching events

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it, vi } from "vitest";
import {
  announceReadDock,
  chapterAtReadingLine,
  chapterDockLabel,
  READ_DOCK_EVENT,
  subscribeReadDock
} from "../src/lib/readDocks";

describe("chapterDockLabel", () => {
  it("uses heading when present", () => {
    expect(chapterDockLabel("Book II", 2)).toBe("Book II");
  });
  it("falls back to Ch. N when heading empty", () => {
    expect(chapterDockLabel("", 3)).toBe("Ch. 3");
    expect(chapterDockLabel("   ", 3)).toBe("Ch. 3");
  });
});

describe("chapterAtReadingLine", () => {
  const sections = [
    { chapter: 1, top: 0, bottom: 400 },
    { chapter: 2, top: 400, bottom: 900 },
    { chapter: 3, top: 900, bottom: 1400 }
  ];
  it("returns containing section", () => {
    expect(chapterAtReadingLine(sections, 500)).toBe(2);
  });
  it("returns last above the line when none contain", () => {
    expect(chapterAtReadingLine(sections, 400)).toBe(2);
  });
  it("returns first when line is above all", () => {
    expect(chapterAtReadingLine(sections, -10)).toBe(1);
  });
  it("returns null for empty list", () => {
    expect(chapterAtReadingLine([], 100)).toBe(null);
  });
});

describe("read dock events", () => {
  it("notifies subscribers of the opening dock", () => {
    const seen: string[] = [];
    const stop = subscribeReadDock((dock) => seen.push(dock));
    announceReadDock("chapter");
    announceReadDock("dictionary");
    stop();
    announceReadDock("chapter");
    expect(seen).toEqual(["chapter", "dictionary"]);
  });
  it("uses the READ_DOCK_EVENT name", () => {
    expect(READ_DOCK_EVENT).toBe("piblia:read-dock");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run tests/readDocks.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `src/lib/readDocks.ts`**

```ts
export type ReadDockId = "chapter" | "dictionary";

export const READ_DOCK_EVENT = "piblia:read-dock";

export function chapterDockLabel(heading: string, chapter: number): string {
  const t = heading.trim();
  return t || "Ch. " + chapter;
}

export function chapterAtReadingLine(
  sections: { chapter: number; top: number; bottom: number }[],
  lineY: number
): number | null {
  if (!sections.length) return null;
  let containing: number | null = null;
  let above: number | null = null;
  for (const sec of sections) {
    if (sec.top <= lineY && sec.bottom > lineY) containing = sec.chapter;
    if (sec.top <= lineY) above = sec.chapter;
  }
  return containing ?? above ?? sections[0].chapter;
}

export function announceReadDock(dock: ReadDockId): void {
  window.dispatchEvent(new CustomEvent(READ_DOCK_EVENT, { detail: { dock } }));
}

export type ReadDockListener = (dock: ReadDockId) => void;

export function subscribeReadDock(listener: ReadDockListener): () => void {
  function onEvent(e: Event) {
    const ce = e as CustomEvent<{ dock?: ReadDockId }>;
    const dock = ce.detail?.dock;
    if (dock === "chapter" || dock === "dictionary") listener(dock);
  }
  window.addEventListener(READ_DOCK_EVENT, onEvent);
  return () => window.removeEventListener(READ_DOCK_EVENT, onEvent);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm exec vitest run tests/readDocks.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/readDocks.ts tests/readDocks.test.ts
git commit -m "feat: add read dock helpers and mutual-exclusion events"
```

---

### Task 2: CSS stack + chapter dock chrome

**Files:**
- Modify: `src/styles.css` (around `.read-dict-dock` ~718 and ios-shell block ~1846)

**Interfaces:**
- Produces classes: `.read-docks`, `.read-chapter-dock`, `.read-chapter-field`, `.read-chapter-bar`, `.read-chapter-prev`, `.read-chapter-next`, `.read-chapter-current`, `.read-chapter-list`
- Moves `position: fixed` / top / right / z-index / width from `.read-dict-dock` onto `.read-docks`
- `.read-dict-dock` becomes an in-flow flex child (`display: flex; flex-direction: column; gap: 8px; pointer-events: none` — no fixed)

- [ ] **Step 1: Replace `.read-dict-dock` fixed block with shared stack**

Replace the existing `.read-dict-dock { position: fixed; ... }` rule with:

```css
.read-docks {
  position: fixed;
  top: calc(var(--header) + 12px);
  right: 16px;
  z-index: 32;
  width: min(280px, calc(100vw - var(--rail) - 32px));
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  pointer-events: none;
}
.read-dict-dock {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  pointer-events: none;
}
.read-chapter-dock {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  pointer-events: none;
}
.read-chapter-field {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
  pointer-events: auto;
}
.read-chapter-bar {
  display: flex;
  align-items: stretch;
  min-height: 36px;
  width: 100%;
  box-sizing: border-box;
  border: 1px solid rgba(232, 212, 154, 0.4);
  background: #24150c;
  color: #f3e2a8;
  font-family: var(--serif);
  font-size: 15px;
  font-weight: 600;
  line-height: 1.25;
}
.read-chapter-prev,
.read-chapter-next,
.read-chapter-current {
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
  padding: 6px 10px;
}
.read-chapter-prev,
.read-chapter-next {
  flex: 0 0 auto;
  min-width: 2rem;
}
.read-chapter-prev:disabled,
.read-chapter-next:disabled {
  opacity: 0.35;
  cursor: default;
}
.read-chapter-current {
  flex: 1 1 auto;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}
.read-chapter-list {
  pointer-events: auto;
  padding: 4px 0;
  border: 1px solid rgba(232, 212, 154, 0.4);
  background: #24150c;
  color: #f3e2a8;
  max-height: min(42vh, 320px);
  overflow: auto;
}
.read-chapter-list a {
  display: block;
  height: 2.2em;
  line-height: 2.2em;
  padding: 0 12px;
  color: #f3e2a8;
  font-family: var(--serif);
  font-size: 14px;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.read-chapter-list a:hover,
.read-chapter-list a.is-current {
  background: rgba(243, 226, 168, 0.12);
  color: #fff;
  text-decoration: none;
}
```

Keep `.read-dict-field`, `.read-dict-label`, `.read-dict-bar`, `.read-dict-senses` as they are (they already set `pointer-events: auto` on interactive pieces). Reuse `.read-dict-label` for the Chapters label (same class on the chapter label span).

- [ ] **Step 2: Confirm ios-shell does not hide `.read-docks`**

Do **not** add `.read-docks` or `.read-chapter-dock` to the `body.ios-shell … { display: none }` list. Chapter dock must remain available when `.chapter-index` is hidden.

- [ ] **Step 3: Commit**

```bash
git add src/styles.css
git commit -m "style: shared read-docks stack and chapter wood chrome"
```

---

### Task 3: `ChapterDock` component

**Files:**
- Create: `src/components/ChapterDock.tsx`
- Modify: `tests/readWorkToc.test.ts` (add source expectations once mounted in Task 4; this task only creates the component — optional local source scan of the new file)

**Interfaces:**
- Consumes: `chapterDockLabel`, `announceReadDock`, `subscribeReadDock` from `../lib/readDocks`; `WorkChapterMeta` from `../../server/types`
- Produces: `export function ChapterDock(props: { chapters: WorkChapterMeta[]; currentChapter: number; onJump: (n: number) => void }): JSX.Element | null`
  - Returns `null` when `chapters.length <= 1`
  - Internal `open` state for the list panel
  - On open → `announceReadDock("chapter")`
  - On `subscribeReadDock`: if other dock is `"dictionary"`, set `open` false
  - Escape / outside click (outside `.read-chapter-dock`) closes list when open
  - Prev/next call `onJump` with neighbor chapter numbers; disabled at ends
  - List links: `href={"#ch-" + p.chapter}`, `preventDefault`, `onJump`, close, focus return to current-title button via ref

- [ ] **Step 1: Implement `ChapterDock.tsx`**

```tsx
import { useEffect, useRef, useState } from "react";
import type { WorkChapterMeta } from "../../server/types";
import { announceReadDock, chapterDockLabel, subscribeReadDock } from "../lib/readDocks";

export function ChapterDock({
  chapters,
  currentChapter,
  onJump
}: {
  chapters: WorkChapterMeta[];
  currentChapter: number;
  onJump: (n: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const currentBtn = useRef<HTMLButtonElement>(null);
  const index = chapters.findIndex((c) => c.chapter === currentChapter);
  const current = index >= 0 ? chapters[index] : chapters[0];
  const prev = index > 0 ? chapters[index - 1] : null;
  const next = index >= 0 && index < chapters.length - 1 ? chapters[index + 1] : null;

  useEffect(() => subscribeReadDock((dock) => {
    if (dock === "dictionary") setOpen(false);
  }), []);

  useEffect(() => {
    if (!open) return;
    announceReadDock("chapter");
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onClick(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (t.closest(".read-chapter-dock")) return;
      setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick, true);
    };
  }, [open]);

  if (chapters.length <= 1 || !current) return null;

  function openList() {
    setOpen(true);
  }

  function jump(n: number) {
    onJump(n);
    setOpen(false);
    queueMicrotask(() => currentBtn.current?.focus());
  }

  return (
    <div className="read-chapter-dock">
      <div className="read-chapter-field">
        <button type="button" className="read-dict-label" onClick={openList} aria-expanded={open}>
          Chapters
        </button>
        <div className="read-chapter-bar">
          <button
            type="button"
            className="read-chapter-prev"
            aria-label="Previous chapter"
            disabled={!prev}
            onClick={() => prev && onJump(prev.chapter)}
          >
            ‹
          </button>
          <button
            type="button"
            className="read-chapter-current"
            ref={currentBtn}
            aria-expanded={open}
            aria-controls="read-chapter-list"
            onClick={openList}
          >
            {chapterDockLabel(current.heading, current.chapter)}
          </button>
          <button
            type="button"
            className="read-chapter-next"
            aria-label="Next chapter"
            disabled={!next}
            onClick={() => next && onJump(next.chapter)}
          >
            ›
          </button>
        </div>
      </div>
      {open ? (
        <nav id="read-chapter-list" className="read-chapter-list" aria-label="Chapters">
          {chapters.map((p) => (
            <a
              key={p.chapter}
              href={"#ch-" + p.chapter}
              title={p.heading}
              className={p.chapter === current.chapter ? "is-current" : undefined}
              onClick={(e) => {
                e.preventDefault();
                jump(p.chapter);
              }}
            >
              {p.heading || String(p.chapter)}
            </a>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
```

Note: `.read-dict-label` is a `<span>` style today. Add a CSS rule so `button.read-dict-label` resets button chrome (border/background/padding inherit the label look, `text-align: left`, `cursor: pointer`, `width: 100%` or `align-self: start`). Put that one-liner in this task’s CSS touch if not already done in Task 2:

```css
button.read-dict-label {
  border: 0;
  background: transparent;
  padding: 0;
  text-align: left;
  cursor: pointer;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ChapterDock.tsx src/styles.css
git commit -m "feat: add ChapterDock wood component"
```

---

### Task 4: Wire Dictionary exclusion + ReadPage stack

**Files:**
- Modify: `src/components/DictionaryDock.tsx`
- Modify: `src/pages/ReadPage.tsx`
- Modify: `tests/readWorkToc.test.ts`

**Interfaces:**
- Consumes: `ChapterDock`, `chapterAtReadingLine`, `announceReadDock`, `subscribeReadDock`
- Dictionary: on entering `pick` or `show` (or bar click that leaves idle toward pick), call `announceReadDock("dictionary")`; subscribe and if `dock === "chapter"` then force mode toward idle/clear show panel (set mode idle, clear entry when closing for exclusion — match “close senses/pick”)
- ReadPage: wrap docks in `<div className="read-docks">`; track `currentChapter` state from scroll + after jumps; pass `outline.chapters`, `currentChapter`, `jumpToChapter`; remove the two inert `.nav-chap` spans

- [ ] **Step 1: Update source-scan test (fail first)**

In `tests/readWorkToc.test.ts`, extend:

```ts
it("mounts ChapterDock in a shared read-docks stack and drops inert toolbar nav", () => {
  const src = readFileSync(join(here, "../src/pages/ReadPage.tsx"), "utf8");
  expect(src).toContain("ChapterDock");
  expect(src).toContain('className="read-docks"');
  expect(src).not.toMatch(/className="nav-chap"/);
});
```

- [ ] **Step 2: Run to verify fail**

Run: `pnpm exec vitest run tests/readWorkToc.test.ts`
Expected: FAIL on missing ChapterDock / read-docks

- [ ] **Step 3: Update `DictionaryDock`**

- Import `announceReadDock`, `subscribeReadDock`
- In `toggle()`, when next mode is `"pick"`, call `announceReadDock("dictionary")` before `setMode`
- When rendering senses (`mode === "show"`), ensure announce happened: call `announceReadDock("dictionary")` in a `useEffect` when `mode === "show" || mode === "pick"`
- `useEffect(() => subscribeReadDock((dock) => { if (dock === "chapter") { setMode("idle"); setEntry(null); setQuery(""); } }), []);`
- Outside-click handler already uses `.read-dict-dock` — keep that; stack wrapper is `.read-docks` and should not swallow chapter clicks

- [ ] **Step 4: Update `ReadPage`**

1. Import `ChapterDock` and `chapterAtReadingLine`.
2. Add `const [currentChapter, setCurrentChapter] = useState(1);`
3. After outline loads / entry chapter known, seed `setCurrentChapter(entryChapter || outline.chapters[0].chapter)`.
4. Refactor the existing scroll URL-updater effect (the one with `line = window.innerHeight * 0.33`) to also:
   - Build `{ chapter, top, bottom }[]` from `.book-chapter` getBoundingClientRect
   - `const n = chapterAtReadingLine(rects, line); if (n != null) setCurrentChapter(n);`
   - Keep existing path replaceState behavior when `onChapterRoute`
5. In `jumpToChapter`, after setting pending jump, also `setCurrentChapter(n)`.
6. Replace:

```tsx
<DictionaryDock workId={workId} />
```

with:

```tsx
<div className="read-docks">
  <ChapterDock
    chapters={outline.chapters}
    currentChapter={currentChapter}
    onJump={jumpToChapter}
  />
  <DictionaryDock workId={workId} />
</div>
```

(Only render this after `outline` is non-null — it already is in the success return.)

7. Remove the two inert `<span className="nav-chap" …>` blocks from `.read-toolbar`; leave the title/download block.

- [ ] **Step 5: Run tests**

Run: `pnpm exec vitest run tests/readDocks.test.ts tests/readWorkToc.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/DictionaryDock.tsx src/pages/ReadPage.tsx tests/readWorkToc.test.ts
git commit -m "feat: wire chapter dock above dictionary on /read"
```

---

### Task 5: Browser verification

**Files:** none (manual / Chrome DevTools)

- [ ] **Step 1: Start or reuse the Vite dev server**

Run: `pnpm dev` (if not already running). Note the local URL.

- [ ] **Step 2: Multi-chapter work — dock chrome**

Open a multi-chapter work (e.g. Confessions). Confirm:
- Chapter wood bar sits above Dictionary in the top-right gutter
- Prose column is not shifted; dock does not cover paragraph text
- Label shows current chapter; `‹` disabled on chapter 1

- [ ] **Step 3: Jump from top list, then use dock**

Open top `Chapters` details, jump to a mid chapter. Confirm:
- Viewport lands on that chapter
- Dock label updates
- `‹` / `›` move to neighbors without scrolling to top
- Center opens list; picking another chapter jumps and closes list
- Escape closes list; click outside closes list

- [ ] **Step 4: Mutual exclusion**

Open chapter list, then click Dictionary bar → chapter list closes. Enter dictionary pick, then open chapter list → dictionary leaves pick/show.

- [ ] **Step 5: Single-chapter work**

Open a one-chapter work. Confirm Chapter dock is absent; Dictionary still present.

- [ ] **Step 6: Narrow / ios if easy**

At a narrow width, confirm dock width clamp still keeps text readable. If ios-shell is toggleable, confirm chapter dock still shows while top chapter-index is hidden.

- [ ] **Step 7: Commit only if verification prompted CSS tweaks; otherwise done**

If CSS needed a fix during verification, commit it:

```bash
git add src/styles.css
git commit -m "fix: chapter dock gutter/clamp after browser check"
```

---

## Spec coverage check

| Spec requirement | Task |
|------------------|------|
| Fixed gutter twin above Dictionary | 2, 4 |
| Shared fixed stack (no dual fixed tops) | 2, 4 |
| Wood materials | 2, 3 |
| `‹` / current / `›` | 3 |
| Center/label opens list | 3 |
| Jump closes list; Escape/outside | 3 |
| One panel at a time with Dictionary | 1, 3, 4 |
| Hide when ≤1 chapter | 3 |
| Current chapter via reading line | 1, 4 |
| Reuse `jumpToChapter` | 4 |
| Keep top `chapter-index` | 4 (untouched) |
| Remove inert toolbar nav | 4 |
| ios-shell keeps dock | 2 |
| A11y buttons / aria-expanded / nav / focus return | 3 |
| No sticky-over-prose / no API / no keyboard shortcuts | Global + out of scope |
