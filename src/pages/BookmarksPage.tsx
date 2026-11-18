import { useEffect } from "react";
import { Link } from "react-router-dom";
import { accountsEnabled, useAccount } from "../lib/account";
import { removeBookmark, useBookmarks } from "../lib/bookmarks";
import { useApp } from "../context/AppContext";

/** The places a reader has kept, newest first. */
export function BookmarksPage() {
  const marks = useBookmarks();
  const account = useAccount();
  const { setLoginOpen } = useApp();
  useEffect(() => {
    document.title = "Bookmarks · Patrista";
  }, []);
  return (
    <div className="prose bookmarks-page">
      <h1>Bookmarks</h1>
      {marks.length ? (
        <ul className="bookmarks-list">
          {marks.map((b) => (
            <li key={b.id}>
              <Link className="bookmarks-link" to={b.path}>
                <span className="bookmarks-title">{b.title}</span>
                {b.note ? <span className="bookmarks-note">{b.note}</span> : null}
              </Link>
              <button type="button" className="icon-btn bookmarks-remove" aria-label={"Remove the bookmark on " + b.title} title="Remove" onClick={() => removeBookmark(b.id)}>
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>
          Nothing kept yet. Press the ribbon beside a chapter of the <Link to="/bible">Bible</Link> or of a Father&apos;s work to
          keep your place.
        </p>
      )}
      {accountsEnabled && !account ? (
        <p className="bookmarks-hint">
          Bookmarks are kept in this browser.{" "}
          <button type="button" className="link-btn" onClick={() => setLoginOpen(true)}>
            Sign in
          </button>{" "}
          to have them on every device.
        </p>
      ) : null}
    </div>
  );
}
