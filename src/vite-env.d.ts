/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DONATE_API_BASE?: string;
  /** Optional origin for /api/links (and future Worker APIs). Empty = same origin. */
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
