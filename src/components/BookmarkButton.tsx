import { useApp } from "../context/AppContext";
import { toggleBookmark, useBookmarks, type Bookmark } from "../lib/bookmarks";

/** A ribbon that keeps this place, filled when it is kept. Press again to let it go. */
export function BookmarkButton({ mark, className }: { mark: Omit<Bookmark, "at">; className?: string }) {
  const { showToast } = useApp();
  const kept = useBookmarks().some((b) => b.id === mark.id);
  const label = kept ? "Remove the bookmark on " + mark.title : "Bookmark " + mark.title;
  return (
    <button
      type="button"
      className={"bookmark-btn" + (kept ? " is-on" : "") + (className ? " " + className : "")}
      aria-pressed={kept}
      aria-label={label}
      title={kept ? "Bookmarked: press to remove" : "Bookmark this place"}
      onClick={() => showToast(toggleBookmark(mark) ? "Bookmarked: find it under Bookmarks" : "Bookmark removed")}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill={kept ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" aria-hidden="true">
        <path d="M6.5 3.5h11a1 1 0 0 1 1 1V21l-6.5-4.6L5.5 21V4.5a1 1 0 0 1 1-1z" />
      </svg>
    </button>
  );
}
