# Bible Multi-Translation & 14-Day Caching Architecture

## Overview

Piblia supports multi-translation Bible reading by combining:
1. **Local Offline Translation**: King James Version (KJV) bundled locally in the repository (0 API calls, offline-first).
2. **Remote API.Bible Integration**: External translations (CSB, NIV, NASB, etc.) fetched on demand via the API.Bible REST API.

---

## 14-Day Caching Specification

To comply with API.Bible licensing rules and provide fast, offline-resilient reading:

- **Cache Store**: Browser `localStorage` using keys formatted as:
  `piblia_bible_cache_v3_<translationId>_<USFM_BOOK>_<chapter>`
  *(e.g., `piblia_bible_cache_v3_a556c5305ee15c3f-01_JHN_1`)*
- **Cache Payload Structure**:
  ```ts
  interface CachedChapter {
    timestamp: number; // Unix timestamp in milliseconds when fetched
    verses: string[];  // Array of verse strings (1-indexed mapping)
    copyright?: string; // API.Bible: the publisher's copyright line (data.copyright)
    fumsToken?: string; // API.Bible: the token each view is reported with (meta.fumsToken)
  }
  ```
- **TTL (Time To Live)**: Exactly 14 days (`14 * 24 * 60 * 60 * 1000` ms = 1,209,600,000 ms).
- **Eviction / Refresh Logic**:
  1. On chapter request, check if `Date.now() - cached.timestamp < CACHE_TTL_MS`.
  2. If fresh (< 14 days), immediately return cached verses without network activity.
  3. If expired (≥ 14 days) or corrupt, trigger a fresh API.Bible fetch, overwrite the cached chapter, and update the timestamp.
- **Graceful Quota Handling**: `localStorage.setItem` calls are wrapped in `try/catch` to ensure reading continues seamlessly even if a user's browser storage quota is reached.

---

## Copyright lines and usage reporting

Each translation in `BIBLE_TRANSLATIONS` carries a `credit`: the copyright or licence line the reader prints
under the text. For the licensed translations this is the publisher's required notice (Crossway for the ESV,
Holman for the CSB, Biblica for the NIV, Lockman for the NASB); for an API.Bible text the reader prefers the
`data.copyright` line API.Bible sends with the chapter. The ESV also keeps its "(ESV)" mark after the last
verse shown. The KJV is credited as public domain outside the United Kingdom, where it is under Crown copyright.

API.Bible's licence requires its Fair Use Management System (FUMS) on websites: every chapter is requested
with `fums-version=3` (by the browser and by the Worker proxy), the `meta.fumsToken` is cached with the
verses, and each time the chapter is shown the reader loads `https://pkg.api.bible/fumsV3.min.js` and calls
`fums("trackView", token)` (`reportFumsView` in `src/api/bibleApi.ts`). The tracker records an anonymous
view; it collects no names or emails.

A translation laid on the KJV's numbering may have no text for a verse. The reader prints "—" there, with
the reason on hover (`missingVerseReason`): the verse is not in the oldest Greek manuscripts (BSB, ASV, WEB),
the WEB has it elsewhere (Romans 16:25-27 at 14:24-26), or the Vulgate divides the passage differently (DRA).
The DRA also shows a short note on what differs from the KJV layout (`notice`).

---

## Resilience & Error Fallbacks

- **Missing Key / API Failure**: If the API key is missing, network is down, or API.Bible returns an error, the UI displays an error notice with an immediate action:
  > **"Switch back to King James Version (KJV)"**
- **Offline Mode**: Any previously fetched chapter viewed within the past 14 days remains fully readable without an active internet connection.

---

## Adding / Customizing Translations

Translations and book code mappings are configured in [`src/api/bibleTranslations.ts`](../src/api/bibleTranslations.ts):

```ts
export const BIBLE_TRANSLATIONS: BibleTranslation[] = [
  {
    id: "kjv",
    name: "King James Version",
    abbreviation: "KJV",
    isLocal: true,
    description: "Public domain local translation",
    credit: "King James Version, 1769 standard text (eBible.org). Public domain, except in the United Kingdom, ..."
  },
  {
    id: "a556c5305ee15c3f-01",
    name: "Christian Standard Bible",
    abbreviation: "CSB",
    isLocal: false,
    description: "Christian Standard Bible via API.Bible",
    credit: "Scripture quotations marked CSB have been taken from the Christian Standard Bible®, ..."
  },
  ...
];
```

To add a new translation:
1. Locate the translation ID in your [API.Bible Developer Portal](https://scripture.api.bible/).
2. Add the entry to `BIBLE_TRANSLATIONS`, with the publisher's required copyright line as `credit`.
3. The USFM book mapping in `BOOK_ID_TO_USFM` maps internal IDs (e.g. `jo`, `rm`, `1co`) to standard 3-letter USFM identifiers (`JHN`, `ROM`, `1CO`).

---

## Production Deployment Checklist

1. **API Key Setup** (server-side — do **not** use `VITE_BIBLE_API_KEY` on Pages):
   ```bash
   npx wrangler secret put BIBLE_API_KEY
   npx wrangler deploy
   ```
   The site calls `GET {VITE_DONATE_API_BASE}/api/bible/remote?bibleId=…&chapterId=JHN.1`.
   Local Vite uses the same path via middleware and reads `VITE_BIBLE_API_KEY` / `BIBLE_API_KEY` from `.env`.
2. **Build Verification**:
   - Run `pnpm test`.
   - Run `pnpm build` (tsc and vite production build succeed).
3. **Deploy**:
   - Worker: `npx wrangler deploy`
   - Site: Git push to `main` (GitHub Pages). Ensure `VITE_DONATE_API_BASE` is set as a repo Actions variable.
