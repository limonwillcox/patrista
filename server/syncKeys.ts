/**
 * The browser storage keys that hold a reader's own marks, and so follow them to their account:
 * Bible highlights, saved connections, highlights in a writing, and notes.
 * Shared by the site (what to send) and the API worker (what to accept).
 */
export const BIBLE_HIGHLIGHTS_KEY = "patrista-bible-highlights-v1";
export const SAVED_CONNECTIONS_KEY = "patrista-cx-saved-v1";
export const WORK_HIGHLIGHTS_PREFIX = "fg-hl-";
export const NOTE_PREFIX = "fg-note-";

export const SYNC_KEY_MAX = 200;

export function isSyncedKey(key: string): boolean {
  if (!key || key.length > SYNC_KEY_MAX) return false;
  if (key === BIBLE_HIGHLIGHTS_KEY || key === SAVED_CONNECTIONS_KEY) return true;
  return (
    (key.startsWith(WORK_HIGHLIGHTS_PREFIX) && key.length > WORK_HIGHLIGHTS_PREFIX.length) ||
    (key.startsWith(NOTE_PREFIX) && key.length > NOTE_PREFIX.length)
  );
}
