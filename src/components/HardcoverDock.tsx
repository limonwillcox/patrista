import { PRINT_EDITIONS, amazonUrl } from "../lib/printEditions";

export function HardcoverDock({ workId }: { workId: string }) {
  const edition = PRINT_EDITIONS[workId];
  if (!edition) return null;
  return (
    <div className="read-hardcover-dock">
      <a
        className="read-dict-bar read-hardcover-bar"
        href={amazonUrl(edition.asin)}
        target="_blank"
        rel="sponsored nofollow noopener"
      >
        Get the Hardcover
      </a>
    </div>
  );
}
