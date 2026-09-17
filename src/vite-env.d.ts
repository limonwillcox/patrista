/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DONATE_API_BASE?: string;
  /** Optional origin for /api/links (and future Worker APIs). Empty = same origin. */
  readonly VITE_API_BASE?: string;
  /** Local/dev only. Production uses Worker secret BIBLE_API_KEY via /api/bible/remote. */
  readonly VITE_BIBLE_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
