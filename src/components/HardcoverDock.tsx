import { AMAZON_DISCLOSURE, PRINT_EDITIONS, amazonUrl } from "../lib/printEditions";

export function HardcoverDock({ workId }: { workId: string }) {
  const edition = PRINT_EDITIONS[workId];
  if (!edition) return null;
  return (
    <div className="read-hardcover-dock">
      <div className="read-dict-field">
        <span className="read-dict-label">Hardcover</span>
        <a
          className="read-dict-bar read-hardcover-bar"
          href={amazonUrl(edition.asin)}
          target="_blank"
          rel="sponsored nofollow noopener"
        >
          Get the Hardcover
        </a>
        {edition.label ? <span className="read-hardcover-note">{edition.label}</span> : null}
        <span className="read-hardcover-note">{AMAZON_DISCLOSURE}</span>
      </div>
    </div>
  );
}
