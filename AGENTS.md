# AGENTS.md

## Cursor Cloud specific instructions

This repo is primarily a **static, client-side web app** ("Fathers Gateway" / Piblia) — plain HTML/CSS/vanilla JS with no backend, no database, and no build step. Content is bundled as JS globals (`js/data.js`, `js/confessions-data.js`, `js/kjv.js`). There is also a native SwiftUI iOS app in `PibliaIOS/` that is **macOS/Xcode-only and cannot be built or run in this Linux cloud environment** (out of scope here).

### Services

| Service | Required | Run command | Notes |
| --- | --- | --- | --- |
| Static web server | Yes | `npm start` (→ `npx --yes http-server -p 8080 -c-1`) | Serves the whole app at `http://127.0.0.1:8080/`. No build step; edit files and refresh. |
| Playwright verify (the only test) | Optional | `npm run verify` | End-to-end smoke test against a server already running on `:8080`. |

### Non-obvious gotchas

- **Phone gate:** `js/gate.js` redirects narrow/phone-width viewports to `get-app.html` (App Store mock). When testing in a browser, use a normal desktop-width window, or append `?desk=1` to bypass the gate.
- **Playwright is not declared in `package.json`.** `scripts/verify.mjs` imports `playwright`, but it is not a listed dependency. To run `npm run verify` you must first install it and the Chromium browser in this environment:
  `npm install --no-save playwright` then `npx playwright install chromium`.
  The verify script requires the static server to already be running on port 8080; it writes screenshots to `scripts/shots/` (gitignored).
- **No lint step** is configured (no ESLint/Prettier). **No unit-test framework** — `npm run verify` is the closest thing to a test suite.
- Optional data tooling (not needed to run the app): `npm run latin-library:dry` (safe scrape dry-run), `npm run latin-library`, and `node scripts/parse-confessions.mjs` (regenerates `js/confessions-data.js`).
