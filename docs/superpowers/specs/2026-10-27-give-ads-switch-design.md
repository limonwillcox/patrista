# Give page: ads switch + Stripe removal

Date: 2026-10-27

## Goal

Rework `/give` around personal funding and an ads opt-in switch. Remove Stripe donations from the product path. Persist the ads preference for a later ads layout; do not load ads yet.

## Give page UI

- Hero `h1`: single line **This is 100% personally funded**
- Below it, one centered row at the same type size as the hero (~42–45px serif, same family/weight as `.give-quote`):
  **The easiest way to support the site is to enable ads by flipping this switch ->** immediately followed by a toggle
- Remove the Stripe donation form (cadence, amounts, fee cover, submit, legal fineprint)
- Remove `?thanks` / `?canceled` banners and search-param handling
- Keep the existing hero fade/grow animation and `give-chrome-dim` while the hero is in view
- Switch: accessible `role="switch"` control; burgundy when on; no ad slots or ads layout chrome (that comes later)

## Ads preference

- Module: `src/lib/adsPreference.ts`
  - Storage key: `piblia-ads-enabled` in `localStorage`
  - `loadAdsEnabled(): boolean` — default `false` when missing/invalid
  - `saveAdsEnabled(on: boolean): void`
- Give page owns switch state; flip → save
- No AppContext, no ad scripts, no other pages reading the flag in this change
- Unit test: default off, round-trip on/off

## Stripe / donate strip

Remove donate checkout end-to-end:

- `GivePage.tsx`: no imports from `server/donate`; no checkout fetch
- Delete `server/donate.ts` (or equivalent full removal of checkout helpers)
- Delete `tests/donate.test.ts`
- `server/donate-worker.ts` and `server/worker.ts`: stop calling `handleDonateFetch`
- `server/plugin.ts`: remove donate middleware / checkout wiring
- `.env.example`: remove `STRIPE_SECRET_KEY`; keep `DONATE_PUBLIC_ORIGIN` / `VITE_DONATE_API_BASE` (Fixes + Bible still use that API base) and update comments so they no longer say “Give + Stripe”
- Do not rename `VITE_DONATE_API_BASE` in this change
- Leave local `.env` secrets alone in git; operator can delete Stripe keys manually

Out of scope:

- Actual ad network scripts or placement layout
- Renaming the shared Worker API base env
- Changing About page wording beyond the existing `/give` link still working

## Success criteria

- `/give` shows the two lines of copy and a working switch that survives reload
- No Stripe checkout UI or `/api/donate/checkout` path
- Fixes and Bible API calls via `VITE_DONATE_API_BASE` still work
- Prefer-reduced-motion still skips hero animation as today
