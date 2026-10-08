# Writings search preview

## Goal

Typing in the header search opens the Writings panel as a live catalog preview. Fathers stay on the left; works fill the right, the way Bible.com fills chapters under a matching book. Enter does not search the texts. Word-in-body and quoted-phrase search are later work.

## UX

The Writings button and live search share one panel.

### Layout

Two columns. Each column scrolls on its own. Wheel over the left scrolls fathers. Wheel over the right scrolls works.

- **Left:** fathers grouped by era, same list style as today’s Writings list.
- **Right:** a continuous works list grouped by father. Each work keeps today’s row (title, short, series, chapter chips).

Click a father: the right list jumps to that father’s works. As the right list scrolls, the father whose works are in view lights up on the left (today’s active color). That scroll highlight is visual only. It does not count as a click.

### Clicks

1. First click on a father selects them and jumps the works list to that father.
2. Second click on the same father navigates to `/church-fathers?author={id}` and puts that father in view on the shelf.
3. A father highlighted only by scrolling still needs a real click, then a second click, before the shelf opens.

### Open and close

- First non-empty character opens the panel if it is closed.
- Clearing the box closes the panel when typing was the only reason it opened.
- Clearing the box restores the full unfiltered list when the Writings button opened the panel.
- The Writings button still toggles the panel. A non-empty query keeps the list filtered while the panel is open.
- Escape closes the panel.

### Filter while typing

Search looks only at the catalog: father display names, work titles, and work short names. Case does not matter. It does not walk passage text.

Ranking:

1. Prefix on a father name (full name or a word in the name)
2. Substring on a father name
3. Prefix on a work title or short name
4. Substring on a work title or short name

Fathers who match by name sit above fathers who only match through a work. A father who matches both is a name match.

Left-column style:

- **Name match (or both):** ordinary list row, same as today’s Writings list.
- **Work-only match:** Writings-button look — burgundy box, white type.

Right column:

- Name-match fathers: all of that father’s works.
- Work-only fathers: only the works that matched.
- Each matching work still shows chapter chips.

### Enter

Enter does not open `/search`.

- Exact work, or work plus chapter (`Confessions 1`): go to that work in the reader (existing `parseQuery` work refs).
- Exact father name: stay in the filtered panel. Do not treat the author as a work ref.
- Otherwise stay in the filtered panel.

### Did you mean

If nothing matches a father or a work, the panel stays open with **Did you mean [nearest catalog name]?** Nearest is the closest father name, then the closest work title, by edit distance. Clicking the suggestion fills the query with that name and runs the same filter.

### Empty query (Writings button)

Full dual-scroll catalog: every father on the left, every work on the right in era / catalog order.

## Architecture

Pure catalog preview lives in `src/lib/catalogPreview.ts` so ranking is unit-tested without the DOM.

`Booklist` in the header chrome consumes that preview. Lift the search-box string so the panel and the input share one query (suggestion clicks write back into the input).

`/church-fathers?author={id}` is the shelf deep link. The library page scrolls that author’s section into view.

Existing `/search` and `searchKeyword` stay as they are. The header no longer navigates there. Passage and quote search are out of this spec.

## Data flow

1. Keystroke updates the query string.
2. `previewCatalog(query, catalog)` returns groups `{ author, kind, works }[]` and an optional suggestion.
3. Left and right columns render those groups.
4. IntersectionObserver on the right column (root: works scroller) sets the scroll-spy father.
5. Click state is separate from scroll-spy state.
6. Work links still go to `/read?work=&chapter=`.

## Error handling

- Catalog not loaded: panel can open but shows the existing empty/loading nothing (no groups).
- No matches: suggestion row, empty works column.
- Unknown `?author=` on the shelf: ignore, keep default library view.
- Invalid chapter in a work ref: keep current `parseQuery` / reader behavior.

## Testing

Unit tests around `previewCatalog`:

- Empty query returns every author and every work, era order.
- Father prefix/substring is `kind: "name"` and lists all that father’s works.
- Work title/short match with no name match is `kind: "work"` and lists only matching works.
- A query that hits both name and work is `kind: "both"` (styled as name).
- Name matches sort above work-only matches.
- Zero matches yield a suggestion (nearest father preferred on a tie).
- `Confessions 1` still matches the Confessions work in the preview.

Browser check after UI lands: type, scroll both columns, click twice through to the shelf, Enter on a work ref, Writings toggle with empty vs filled query.

## Out of scope

- Searching inside the texts (keywords, per-word, quoted phrases)
- Changing `/search` results
- Autocomplete inside the input (ghost text)
- New father profile URLs
- Mobile app / iOS shell (Writings is desktop/web header chrome)
