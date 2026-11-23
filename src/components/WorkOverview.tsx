import { useState } from "react";
import { setStoredOverviewOpen, storedOverviewOpen, workOverview } from "../lib/workOverviews";

/** Collapsible Overview on a work, styled like the Chapters toggle. Absent when the work has no copy. */
export function WorkOverview({ workId }: { workId: string }) {
  const overview = workOverview(workId);
  const [open, setOpen] = useState(storedOverviewOpen);

  if (!overview) return null;

  return (
    <details
      className="work-overview"
      open={open}
      onToggle={(e) => {
        const next = e.currentTarget.open;
        if (next === open) return;
        setOpen(next);
        setStoredOverviewOpen(next);
      }}
    >
      <summary>Overview</summary>
      <p>{overview.text}</p>
      <p className="work-overview-facts">{overview.facts}</p>
    </details>
  );
}
