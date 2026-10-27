# Give Ads Switch + Stripe Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Give page Stripe donation form with funding copy plus an ads opt-in switch that persists to `localStorage`, and delete Stripe checkout from the app and Worker.

**Architecture:** A tiny `adsPreference` helper owns load/save. `GivePage` becomes a static hero + ask row with an accessible switch. Donate checkout code (`server/donate.ts`, Vite donate middleware, Worker donate branch, donate tests) is removed. Shared API base env vars stay for Fixes and Bible.

**Tech Stack:** React 19, React Router, Vite, Cloudflare Worker (`server/donate-worker.ts`), vitest, existing `.give-*` / `.set-row button.switch` CSS patterns in `src/styles.css`.

## Global Constraints

- Hero copy exactly: `This is 100% personally funded`
- Ask copy exactly: `The easiest way to support the site is to enable ads by flipping this switch ->`
- Ask row type matches `.give-quote` (serif, weight 700, ~42–45px)
- Switch immediately after the arrow; `role="switch"`; burgundy when on
- Ads preference key: `piblia-ads-enabled`; default off; no ad scripts this pass
- Keep hero fade/grow + `give-chrome-dim`; keep reduced-motion skips
- Full Stripe strip: delete donate checkout path; do not rename `VITE_DONATE_API_BASE`
- Do not commit `.env` or Stripe secrets
- Spec: `docs/superpowers/specs/2026-10-27-give-ads-switch-design.md`

## File map

| File | Role |
|------|------|
| `src/lib/adsPreference.ts` | `loadAdsEnabled` / `saveAdsEnabled` |
| `tests/adsPreference.test.ts` | Default off + round-trip |
| `src/pages/GivePage.tsx` | Rewrite: copy + switch; drop Stripe form |
| `src/styles.css` | Ask-row + switch styles; drop unused give-form CSS |
| `server/donate.ts` | Delete |
| `tests/donate.test.ts` | Delete |
| `server/plugin.ts` | Remove donate middleware + path skip |
| `server/donate-worker.ts` | Remove donate fetch branch |
| `server/worker.ts` | Remove donate; assets-only |
| `.env.example` | Drop `STRIPE_SECRET_KEY`; update comments |
| `wrangler.toml` | Drop Stripe from header comments |

---

### Task 1: Ads preference helper

**Files:**
- Create: `src/lib/adsPreference.ts`
- Create: `tests/adsPreference.test.ts`

**Interfaces:**
- Produces:
  - `ADS_PREF_KEY = "piblia-ads-enabled"`
  - `loadAdsEnabled(): boolean` — `true` only when stored value is `"on"`; otherwise `false` (missing, empty, or other)
  - `saveAdsEnabled(on: boolean): void` — writes `"on"` or `"off"`

- [ ] **Step 1: Write the failing tests**

```ts
import { afterEach, describe, expect, it } from "vitest";
import { ADS_PREF_KEY, loadAdsEnabled, saveAdsEnabled } from "../src/lib/adsPreference";

afterEach(() => {
  localStorage.removeItem(ADS_PREF_KEY);
});

describe("loadAdsEnabled", () => {
  it("defaults to false when unset", () => {
    expect(loadAdsEnabled()).toBe(false);
  });

  it("defaults to false for garbage values", () => {
    localStorage.setItem(ADS_PREF_KEY, "yes");
    expect(loadAdsEnabled()).toBe(false);
  });
});

describe("saveAdsEnabled", () => {
  it("round-trips on and off", () => {
    saveAdsEnabled(true);
    expect(localStorage.getItem(ADS_PREF_KEY)).toBe("on");
    expect(loadAdsEnabled()).toBe(true);
    saveAdsEnabled(false);
    expect(localStorage.getItem(ADS_PREF_KEY)).toBe("off");
    expect(loadAdsEnabled()).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run tests/adsPreference.test.ts`

Expected: FAIL — module not found / cannot resolve `../src/lib/adsPreference`

- [ ] **Step 3: Implement the helper**

```ts
export const ADS_PREF_KEY = "piblia-ads-enabled";

export function loadAdsEnabled(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(ADS_PREF_KEY) === "on";
}

export function saveAdsEnabled(on: boolean): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(ADS_PREF_KEY, on ? "on" : "off");
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm exec vitest run tests/adsPreference.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/adsPreference.ts tests/adsPreference.test.ts
git commit -m "feat: add ads preference localStorage helper"
```

---

### Task 2: Rewrite Give page UI

**Files:**
- Modify: `src/pages/GivePage.tsx` (full rewrite)
- Modify: `src/styles.css` (give section ~2187–2354 and reduced-motion give rules)

**Interfaces:**
- Consumes: `loadAdsEnabled()`, `saveAdsEnabled(on: boolean)` from `src/lib/adsPreference.ts`
- Produces: `/give` shows funding hero + ask row with switch; no Stripe UI

- [ ] **Step 1: Replace `GivePage.tsx` with the ads-only page**

Full file:

```tsx
import { useEffect, useRef, useState } from "react";
import { loadAdsEnabled, saveAdsEnabled } from "../lib/adsPreference";
import { useApp } from "../context/AppContext";

export function GivePage() {
  const { setActivePassage } = useApp();
  const heroRef = useRef<HTMLElement>(null);
  const [adsOn, setAdsOn] = useState(() => loadAdsEnabled());

  useEffect(() => {
    setActivePassage(null);
  }, [setActivePassage]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const hero = heroRef.current;
    if (!hero) return;
    document.body.classList.add("give-chrome-dim");
    const io = new IntersectionObserver(
      ([entry]) => {
        const on = entry.isIntersecting && entry.intersectionRatio > 0.35;
        document.body.classList.toggle("give-chrome-dim", on);
      },
      { threshold: [0, 0.35, 0.6, 1] }
    );
    io.observe(hero);
    return () => {
      io.disconnect();
      document.body.classList.remove("give-chrome-dim");
    };
  }, []);

  function toggleAds() {
    const next = !adsOn;
    setAdsOn(next);
    saveAdsEnabled(next);
  }

  return (
    <div className="give-page">
      <section className="give-hero" ref={heroRef} aria-label="Patrista funding">
        <h1 className="give-quote">This is 100% personally funded</h1>
      </section>

      <div className="give-body">
        <p className="give-ask">
          <span>
            The easiest way to support the site is to enable ads by flipping this switch -&gt;
          </span>{" "}
          <button
            type="button"
            className={"give-ads-switch" + (adsOn ? " on" : "")}
            role="switch"
            aria-checked={adsOn}
            aria-label="Enable ads"
            onClick={toggleAds}
          />
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update Give CSS**

In `src/styles.css`, replace the `.give-ask` through `.give-legal` block (form styles) so ask matches quote size and hosts the switch. Keep `.give-page`, `.give-hero`, `.give-quote`, animations, `.give-body`.

Replace from `.give-ask {` through `.give-legal { margin: 0; }` with:

```css
.give-ask {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.35em 0.5em;
  text-align: center;
  font-family: var(--serif);
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.01em;
  color: var(--text);
  font-size: 45px;
  margin: 0 auto 28px;
  max-width: 52rem;
}
.give-ads-switch {
  flex: 0 0 auto;
  width: 48px;
  height: 30px;
  border-radius: 15px;
  border: 0;
  background: #c8c8c8;
  position: relative;
  cursor: pointer;
  vertical-align: middle;
}
.give-ads-switch.on { background: var(--burgundy); }
.give-ads-switch::after {
  content: "";
  position: absolute;
  top: 3px;
  left: 3px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.18s ease;
}
.give-ads-switch.on::after { transform: translateX(18px); }
```

Also:

- Delete unused rules: `.give-banner`, `.give-banner-thanks`, `.give-form`, `.give-fieldset`, `.give-cadence`, `.give-amounts`, `.give-other`, `.give-fee`, `.give-error`, `.give-submit-wrap`, `.give-submit`, `.give-legal`, and the mobile `.give-amounts` grid rule
- Keep `.give-page-static` removal: delete `.give-page-static .give-body` if nothing sets that class anymore
- In reduced-motion block, add `.give-ads-switch::after { transition: none; }` next to the existing `.set-row button.switch::after` rule

- [ ] **Step 3: Typecheck Give page**

Run: `pnpm exec tsc --noEmit`

Expected: PASS (or only pre-existing errors unrelated to Give/donate). If `GivePage` still imported donate helpers, fix until clean for this file.

- [ ] **Step 4: Manual browser check (dev server)**

Run: `pnpm dev` (if not already running). Open `/give`.

Verify:

1. Hero shows only `This is 100% personally funded`
2. Ask line matches hero size and ends with `->` plus switch
3. Flip switch → burgundy / `aria-checked="true"`
4. Reload → switch stays on
5. Flip off → reload stays off
6. No Stripe form, cadence, amounts, or Give submit button
7. Site chrome still dims while hero is in view (unless reduced motion)

- [ ] **Step 5: Commit**

```bash
git add src/pages/GivePage.tsx src/styles.css
git commit -m "feat: replace Give Stripe form with ads switch"
```

---

### Task 3: Strip Stripe donate checkout

**Files:**
- Delete: `server/donate.ts`
- Delete: `tests/donate.test.ts`
- Modify: `server/plugin.ts`
- Modify: `server/donate-worker.ts`
- Modify: `server/worker.ts`
- Modify: `.env.example`
- Modify: `wrangler.toml` (comment header only)

**Interfaces:**
- Consumes: none from donate
- Produces: no `/api/donate/checkout`; Worker still serves Fixes / Bible / Clavis / dictionary-miss

- [ ] **Step 1: Remove donate from `server/plugin.ts`**

1. Delete the import of `donateCorsHeaders`, `handleDonateCheckout`, `isDonateCheckoutPath` from `./donate`
2. Delete the entire `donateMiddleware` function
3. In `apiMiddleware`, remove `isDonateCheckoutPath(path) ||` from the early-`next()` condition so only Fixes / Bible / dictionary-miss skip the generic API handler
4. In `configureServer` and `configurePreviewServer`, remove `server.middlewares.use(donateMiddleware(env));`

- [ ] **Step 2: Update `server/donate-worker.ts`**

Replace file contents with:

```ts
import { handleBibleRemoteFetch, type BibleRemoteEnv } from "./bibleRemote";
import { handleClavisFetch, type ClavisEnv } from "./clavis-api";
import { handleDictionaryMissFetch, type DictionaryMissEnv } from "./dictionaryMiss";
import { handleFixesFetch, type FixesEnv } from "./fixes";

type Env = FixesEnv & BibleRemoteEnv & ClavisEnv & DictionaryMissEnv;

/**
 * Cloudflare Worker: Fixes → GitHub Issues + API.Bible proxy + Clavis reads.
 * Must not import Node fs corpus loaders.
 * Secret: BIBLE_API_KEY (wrangler secret put BIBLE_API_KEY)
 * Clavis: D1 CLAVIS_DB + R2 CLAVIS_TEXTS (commented in wrangler.toml until created).
 */
export default {
  async fetch(request: Request, env: Env = {}): Promise<Response> {
    const fixes = await handleFixesFetch(request, env);
    if (fixes) return fixes;
    const dictMiss = await handleDictionaryMissFetch(request, env);
    if (dictMiss) return dictMiss;
    const bible = await handleBibleRemoteFetch(request, env);
    if (bible) return bible;
    const clavis = await handleClavisFetch(request, env);
    if (clavis) return clavis;
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }
};
```

- [ ] **Step 3: Update `server/worker.ts`**

Replace with assets-only worker (no donate):

```ts
type Env = { ASSETS?: { fetch: (request: Request) => Promise<Response> } };

/**
 * Cloudflare Worker: static assets only.
 * Must not import Node fs corpus loaders.
 */
export default {
  async fetch(request: Request, env: Env = {}): Promise<Response> {
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response("Not found", { status: 404 });
  }
};
```

- [ ] **Step 4: Delete donate module and tests**

```bash
rm server/donate.ts tests/donate.test.ts
```

Confirm no remaining imports:

```bash
rg "server/donate|from \"./donate\"|handleDonate|isDonateCheckout|STRIPE_SECRET" --glob '!docs/**' --glob '!.env' --glob '!**/node_modules/**'
```

Expected: only docs / comments you are about to update (`.env.example`, `wrangler.toml`). Fix any leftover code imports.

- [ ] **Step 5: Update `.env.example` and `wrangler.toml` comments**

`.env.example` becomes:

```env
# Copy this file to `.env` and fill in real values.
DONATE_PUBLIC_ORIGIN=http://127.0.0.1:5173

# Optional. Production GitHub Pages should point at the Cloudflare Worker origin
# (wrangler.toml deploys server/donate-worker.ts). Used for Fixes + Bible proxy.
# VITE_DONATE_API_BASE=https://piblia.<your-subdomain>.workers.dev

# Local/dev: API.Bible key for Vite middleware /api/bible/remote (or direct client fetch).
# Production: put the key on the Worker instead — never bake it into the Pages JS.
#   npx wrangler secret put BIBLE_API_KEY
VITE_BIBLE_API_KEY=your_api_bible_key_here

# Worker secret (wrangler secret put GITHUB_TOKEN): issues + contents write for Fixes.
```

In `wrangler.toml`, change the top comments to:

```toml
# Fixes → GitHub Issues + API.Bible chapter proxy + Clavis reads.
# The public site stays on GitHub Pages.
# Do not attach dist/ as assets: Cloudflare rejects the SPA _redirects file.
# Secrets: GITHUB_TOKEN (issues + contents:write on limonwillcox/piblia),
#          BIBLE_API_KEY (API.Bible — keep server-side; never VITE_)
```

Leave `[vars] DONATE_PUBLIC_ORIGIN` as-is (Fixes/Bible CORS origin).

- [ ] **Step 6: Run targeted tests**

Run:

```bash
pnpm exec vitest run tests/adsPreference.test.ts tests/fixes.test.ts tests/bibleRemote.test.ts tests/clavis.test.ts
```

Expected: PASS. `tests/donate.test.ts` must not exist / not run.

- [ ] **Step 7: Commit**

```bash
git add -u server/donate.ts tests/donate.test.ts server/plugin.ts server/donate-worker.ts server/worker.ts .env.example wrangler.toml
git commit -m "chore: remove Stripe donate checkout"
```

---

### Task 4: Final verification

**Files:**
- None (verify only)

- [ ] **Step 1: Full unit pass for touched areas**

Run: `pnpm exec vitest run tests/adsPreference.test.ts tests/homeNav.test.ts tests/fixes.test.ts`

Expected: PASS

- [ ] **Step 2: Browser regression**

With `pnpm dev`:

1. `/give` — copy, switch persist, no Stripe
2. `/about` — “support this site” link still reaches `/give`
3. `/fixes` — page loads (API base unchanged)
4. Confirm `curl -s -o /dev/null -w "%{http_code}" -X POST http://127.0.0.1:5173/api/donate/checkout` is **404** (or non-donate handler), not a Stripe checkout JSON success

- [ ] **Step 3: Commit only if verification found fixes; otherwise done**

If Step 2 forced code fixes, commit them:

```bash
git add -u
git commit -m "fix: give ads switch verification follow-ups"
```

If nothing to fix, no commit.

---

## Spec coverage check

| Spec item | Task |
|-----------|------|
| Hero copy | Task 2 |
| Ask copy + same size + switch after arrow | Task 2 |
| Remove Stripe form / thanks-canceled | Task 2 |
| Keep hero animation + chrome dim | Task 2 |
| `adsPreference` + localStorage + tests | Task 1 |
| No ad scripts / no AppContext | Tasks 1–2 (omitted by design) |
| Delete donate.ts + donate tests | Task 3 |
| Worker + plugin strip | Task 3 |
| `.env.example` / keep API base name | Task 3 |
| Success criteria / browser check | Tasks 2 + 4 |
