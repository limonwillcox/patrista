# Read-tab chapter dock

## Goal

After jumping to a chapter from the top Chapters list, a reader can move prev/next or pick any other chapter without scrolling back to the top. The control must not cover the prose column or sit as a sticky bar over the reading text. It should read as a twin of the Dictionary wood dock.

## Approach

Add a fixed **Chapter dock** in the same top-right overlay zone as `DictionaryDock`, stacked **above** Dictionary. Collapsed bar: `‹` · current chapter · `›`. Center title or `Chapters` label opens a wood panel with the full chapter list. Reuse existing `jumpToChapter` / `loadAround` / scroll-pinning. No new data API.

Mount both docks in one shared fixed stack container on `ReadPage` (Chapter first, Dictionary second) so width, right inset, and gap stay one place. Do not leave two independent `position: fixed` tops that can drift.

## Placement and chrome

- Fixed under the site header, right gutter, same overlay family as today’s `.read-dict-dock`.
- Vertical stack: Chapter dock first, Dictionary below.
- Shared materials with Dictionary: dark wood ground `#24150c`, gold type `#f3e2a8`, gold-tint border, uppercase muted label (`Chapters`), serif bar text.
- Width clamp matches Dictionary so the ~860px prose column never shifts and the dock never overlays the text block.
- Pointer-events only on the dock chrome; page background stays pass-through like Dictionary.

## Interaction

**Collapsed (default)**

- Bar shows the current chapter heading, single-line with ellipsis. If the outline has no heading, show `Ch. N`.
- `‹` / `›` jump to previous / next chapter. Dim and disable at first / last.
- Clicking the center title or the `Chapters` label opens the list panel.

**Open**

- Wood panel under the bar (same pattern as `.read-dict-senses`): scrollable full chapter list, max-height capped.
- Choosing a chapter calls `jumpToChapter`, then closes the panel.
- Escape or click outside the chapter dock closes the panel.
- Only one dock panel open at a time: opening the chapter list closes any Dictionary senses / pick UI; entering Dictionary pick or showing a definition closes the chapter list. Coordinate with a small shared callback or custom event between the two dock components — no global app store.

**Single-chapter works**

- Hide the Chapter dock (same rule as `details.chapter-index`).

## Current chapter tracking

Reuse the existing “chapter at reading line” logic already used to update chapter-route URLs (~33% viewport line over `.book-chapter` sections). The dock label updates on scroll and after jumps so it stays honest.

## Loading

Prev/next and list picks use the existing `jumpToChapter` path (instant `scrollIntoView`, `loadAround`, pin-until-loaded while placeholders resize). Do not invent a second jump mechanism.

## Existing UI

- Keep top `details.chapter-index` for first landing and crawlable chapter links in the DOM.
- Remove the inert dimmed `‹` `›` spans in `.read-toolbar` so mid-read navigation has one clear control.
- `ios-shell` already hides `.chapter-index`; the Chapter dock remains available there as the chapter UI. Apply the same width clamp as Dictionary if the gutter is tight.

## Accessibility

- Prev / next are buttons.
- List toggle uses `aria-expanded` (and a clear accessible name).
- Open panel is a `nav` of chapter links (or equivalent buttons that update hash/path).
- After a jump from the list, focus returns to the dock bar.

## Out of scope

- Sticky header or any chrome over the prose column.
- Changes to titles, meta, static father HTML pages, or non-`/read` routes.
- Keyboard shortcuts (can be a later pass).
- New APIs or corpus changes.
