# Read-tab work download

## Goal

A desktop reader can take the English on `/read` and download it as a plain handout: `.txt`, PDF, or Word. The file is the work’s text as it appears in the HTML, not the site chrome.

## Approach

Scrape the rendered DOM. Load every chosen chapter first, then read `innerText` from `.para` nodes. The download always follows later reader edits. Do not serialize the API payload.

## Placement

- Download control sits on the same row as `h1.read-title`, immediately after the title.
- Icon is a small download mark, quiet next to the serif title.
- Desktop only. Do not add a phone layout, touch toggle, or `ios-shell` styles. Hide the control at the existing 760px reader breakpoint.

## Flow

1. Hover the icon. A small menu appears: **Whole work** / **Certain chapters**.
2. Hover **Whole work** to open a nested list: **.txt** / **PDF** / **Word**. Choosing one starts the whole-work download.
3. **Certain chapters** opens a large centered dialog: the existing chapter list, enlarged, with a checkbox on each chapter, plus Select all and Select none. **.txt** / **PDF** / **Word** buttons sit in that dialog and stay disabled until at least one chapter is checked. Chosen chapters stitch in outline order.
4. Clicking outside the hover menu closes it. Escape closes the menu and the dialog. The dialog does not use hover for formats.

## What goes in the file

**Whole work**

- Paragraph text only (`p.para` innerText).
- No our `h2.heading` chapter labels, no toolbar, no dictionary, no edition footer, no work title in the body.
- Filename may use author and work title (`Augustine-Confessions.txt`).

**Certain chapters**

- Same paragraph scrape, in checked-chapter order.
- Include our `h2.heading` above each chosen chapter so the handout is labeled.
- Skip unchecked and still-unloaded chapters after the fetch step.

**All formats**

- Strip highlight wrappers (`.w`) by using text, not HTML, from each `.para`.
- Blank line between paragraphs.
- Do not include placeholder copy from `.chapter-placeholder`.

## Loading

Chapters on `/read` load as they scroll into view. Before scrape, fetch every selected chapter with the existing `fetchChapter` path, wait until those `.book-chapter` sections have `.para` nodes, then scrape. Whole work selects every chapter in the outline.

## File types

- **.txt** — UTF-8 blob download.
- **PDF** — open a print window with only the extracted text, site serif, generous margins, then `window.print()`. The browser Save as PDF is the PDF. No jsPDF.
- **Word** — a small `.docx` (plain paragraphs). No new PDF/Word vendor library. A tiny ZIP writer in-repo is allowed.

Print/Word body uses the same extracted string as `.txt`. PDF and Word may set page margins and a serif face. They do not add site navigation or extra editorial copy.

## Out of scope

- Phone / touch download UI.
- Latin, Greek, notes, or non-English versions.
- Server-side file generation.
- Email or share-sheet export.
- Static `/fathers/...html` pages (in-app `/read` only).
