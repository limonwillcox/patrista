# Patrista

A searchable public-domain Church Fathers library, laid out like [Bible Gateway](https://www.biblegateway.com/): search bar, writings list, a reading column, and page options.

The live work is Augustine’s *Confessions*: E. B. Pusey’s English (Project Gutenberg eBook #3296) and the Latin *Confessiones*, both read from files under `Fathers/`. This is not affiliated with Bible Gateway or HarperCollins Christian Publishing.

## Live site

Public repo: [limonwillcox/piblia](https://github.com/limonwillcox/piblia) (repo name unchanged; product domain is **patrista.com**). GitHub Pages deploys from `main` via `pnpm build` → `dist/`.

Until DNS is pointed, the site is at **https://limonwillcox.github.io/piblia/**.

Phone visitors are sent to **`get-app.html`** (App Store mock-up). The old web phone shell is archived in **`archive/ios-web/`**. Native SwiftUI app: **`PibliaIOS/`** — plan and goals in `PibliaIOS/docs/PLAN.md`. Feature parking lot: **`docs/FEATURES.md`**.

Custom domain **patrista.com** is set in `CNAME`. At your registrar, use:

**Apex `patrista.com` (A records)**

| Type | Name | Value |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |

**`www.patrista.com` (CNAME)**

| Type | Name | Value |
| --- | --- | --- |
| CNAME | `www` | `limonwillcox.github.io` |

Optional IPv6 AAAA records: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`.

After DNS propagates, GitHub will issue HTTPS for `patrista.com`. Enforce HTTPS in **Settings → Pages**.

Keep **piblia.com** registered and set a registrar **301 URL forward** from `piblia.com` → `https://patrista.com` so old links keep working.

## Run it locally

Requires [pnpm](https://pnpm.io/) (Node 18+).

```powershell
pnpm install
pnpm dev
```

Then open http://127.0.0.1:5173/

| Script | What it does |
| --- | --- |
| `pnpm dev` | Vite dev server + catalog/read/search API |
| `pnpm build` | Typecheck and production build into `dist/` |
| `pnpm preview` | Serve the production build (http://127.0.0.1:4173/) |
| `pnpm start` | Same as `pnpm preview` |
| `pnpm test` | Vitest against the shipped parse / search / read functions |
| `pnpm parse-confessions` | Re-parse `Fathers/` Confessions sources |

The React app talks to `/api/catalog`, `/api/works/:id`, `/api/works/:id/chapters/:n`, and `/api/search?q=`. Those handlers live in `server/` so they can later be wrapped by a Cloudflare Worker; this repo does not require a Cloudflare account to run.

## What to click

| Action | What it does |
| --- | --- |
| **Fathers** (`/fathers/`) | Every Father by century. Jump bar, a filter box, and work counts on each card |
| A Father's page | Life, then a bookcase of their works grouped by kind (Start here, Treatises, Letters…). **Shelf** / **List** toggle |
| A book on the shelf | Opens the book viewer: first page, contents, length and reading time, the era it belongs to, Start / Continue reading. ← → step along the shelf |
| Header search, Enter | Full-text search (`/search?q=`). A title and number (`Confessions 1`) opens the reader; a Father's name opens their page |
| Search filters | One chip per Father, with counts. Results open the reader at the chapter with the words marked |
| Paragraph number (margin) | Copy a link to that paragraph, a citation, or the paragraph with its citation |
| **notes** button after a paragraph | The translator's footnotes. Bible references in them link to that verse on `/bible` |
| **English** / **Latin** / **Side by side** | Shown when the work has the original (the *Confessions*) |
| Writings list (header) | Era → father → work/chapter; with a query, a "Search every text" row on top |
| The book viewer's 3D object | The work in the form it had in its own time, carrying its real text: letters as a papyrus roll (drag to unroll), books as a papyrus codex before 300 and a parchment codex after (tap to turn pages). Rule in `src/lib/manuscriptForm.ts` |
| **The road to Rome** (on `/fathers/ignatius/`) | A globe with Ignatius's route, the letters written at each stop, and the chapter each fact comes from. Data in `src/data/journeys.ts`; a test checks every quotation against the chapter it cites |
| **See the manuscript** | A real manuscript page from the holding library's IIIF server, as a leaf you can tilt and light. Only libraries that allow any use and send CORS headers. Data in `src/data/manuscripts.ts` |

All 3D is three.js, loaded only when a 3D view opens (`src/three/`). Without WebGL each feature falls back to plain HTML. "Reduce motion" turns the animations off.

Search on the static site is a [Pagefind](https://pagefind.app/) index written to `dist/pagefind/` at build time (about 100 seconds). Set `SKIP_SEARCH_INDEX=1` for a faster local build without search. The dev server answers `/api/search` from the files on disk instead.

Reading plans and audio are archived under `archive/`.

## Corpus and ingest

Keep `Fathers/` (English, Latin, Greek) and `Regulations/` as the source texts:

- `scripts/parse-confessions.mjs` — English + Latin Confessions → structured books
- `scripts/ccel-english/download.mjs` — Schaff ANF/NPNF volume dumps from CCEL
- `scripts/english-by-father/split-aligned.mjs` — father/work English extracts + Latin overlap report
- `scripts/latin-library/scrape.mjs` — Latin Library harvest

## Cloudflare (later)

The production build is a static SPA (`dist/`) plus JSON API handlers in `server/api.ts`. A later Cloudflare Pages deploy can serve the SPA with `public/_redirects` (`/* → /index.html`), and a Worker can reuse `server/worker.ts` for `/api/*`. No live Cloudflare account is required to develop or verify this repo.
