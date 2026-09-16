# Fixes feedback → GitHub Issues

## Goal

Let readers report problems from the site. Submissions become labeled GitHub Issues so an admin (and later a Grok bot) can triage where the work already lives.

## UX

- Primary rail: **Fixes** under **Give**, wrench icon → `/fixes`
- Form fields:
  - First name (required)
  - Last name (required)
  - Paste screenshot (optional): click/focus zone, Ctrl/Cmd-V image, show preview + clear
  - Problem (required textarea)
- Submit → success state with link to “we got it”; errors stay on the form

## Backend

- `POST /api/fixes` on the existing Cloudflare Worker (same origin pattern as donate: `VITE_DONATE_API_BASE` / empty locally)
- Body: `{ firstName, lastName, problem, screenshot?: { mime, base64 } }`
- Worker:
  1. Validate + trim; reject empty / oversized screenshot (~1.5MB decoded)
  2. If screenshot: `PUT` to repo `data/fixes/screenshots/{id}.{ext}` via GitHub Contents API
  3. `POST` GitHub Issue titled `[Fixes] {First} {Last}` with structured markdown body + label `fixes`
- Secrets: `GITHUB_TOKEN` (issues + contents write on `limonwillcox/piblia`)
- Local vite: same path writes `data/fixes/inbox/{id}.json` (+ optional screenshot file) when no token

## Admin grab

Filter Issues by label **`fixes`**. Screenshots live under `data/fixes/screenshots/` (gitignored from normal workflows if needed, or committed as assets).

## Out of scope

- Admin UI on the site
- Email / Slack
- Editing issues from the form
