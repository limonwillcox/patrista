# Piblia iPhone app — plan

The website is for desks. The phone product is a native SwiftUI app.

Archived web phone UI (do not delete; copy from here): `archive/ios-web/`.

This folder is the Xcode app. It will not compile in the Linux sandbox. Open it on a Mac.

Logged ideas that are **not** a current goal live in `/docs/FEATURES.md` (author globe, life journey, world-events timeline). Do not start those until they are promoted here as a numbered goal.

## What we already decided (from the web mock)

- Bottom tabs: Read, Search, About, Give, Settings
- Top: Father, work, Liber — then Chi-Rho, parallel, focus cross
- Focus: hollow cross → filled wood; chrome collapses
- Parallel: landscape only; L and R cycle; skip what the other pane is showing
- Panes: English, Latin, Bible (KJV), Notes
- Bookmark by Liber (ribbon)
- Highlight: yellow / green / blue / pink
- Translator never in the bar — always the Father
- Schaff / Pusey structure for subsections

## Goals — pick one number

Say the number. That is the next slice. Later slices wait.

### 1. Reader v1 (smallest App Store app)
Confessions only. English. Liber picker. Focus. Bookmark Liber. Night + type size.
No parallel. No KJV. No notes. No search beyond the Liber list.
**Then:** TestFlight to your phone.

### 2. Latin + Chi-Rho
Same as 1, plus original text toggle. Offline both texts bundled.

### 3. Parallel
Landscape two panes. L / R cycle. English, Latin, KJV, Notes. Settings enable which sources.

### 4. Library + search
More Fathers as you upload. Search by father, work, keyword. Same Liber “whole book” rule.

### 5. Store listing
Icon, 6.7" and 6.1" screenshots, privacy nutrition, support URL (patrista.com), App Store copy, submit.

Recommended order: **1 → 2 → 5 (soft launch) → 3 → 4**.
Ship a thin reader first. Parallel is the hard UI. Search wants a real corpus.

## Apple checklist (not optional for a listing)

- Apple Developer Program, $99 / year
- Bundle ID, e.g. `com.piblia.app`
- App icon 1024², no alpha
- Privacy: highlights and notes stay on device in v1 (no account). Say that in the privacy form.
- TestFlight internal, then App Review
- Age rating, likely 4+
- Content: public-domain Schaff / Gutenberg / KJV. Keep a credits screen.

## What this repo folder is now

A SwiftUI skeleton that *looks* like v1: tabs, reader chrome, Liber I sample, focus, bookmark. Stubs for Search / Give / parallel. You open it in Xcode on a Mac.

## What I cannot do from here

- Run the iOS Simulator
- Sign, archive, or upload to App Store Connect
- Click “Submit for Review”

You (or Cursor on a Mac) do those last miles. I can keep writing Swift into this folder from chat.
