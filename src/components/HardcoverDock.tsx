import { PRINT_EDITIONS } from "../lib/printEditions";
import { BookmarkIcon, DockNotch } from "./DockNotch";

export function HardcoverDock({ workId }: { workId: string }) {
  const edition = PRINT_EDITIONS[workId];
  if (!edition) return null;
  return (
    <div className="read-hardcover-dock">
      <DockNotch id="hardcover" name="hardcover link" icon={BookmarkIcon} side="left">
        <a
          className="read-dict-bar read-hardcover-bar"
          href={edition.url}
          target="_blank"
          rel="sponsored nofollow noopener"
        >
          Get the Hardcover
        </a>
      </DockNotch>
    </div>
  );
}
