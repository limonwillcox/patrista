import { useState } from "react";

/** The KJV translators' abbreviations, spelled out on hover. */
const ABBR: [RegExp, string][] = [
  [/\bHeb\./g, "Hebrew"],
  [/\bGr\./g, "Greek"],
  [/\bChald\./g, "Chaldee (Aramaic)"]
];

/**
 * The KJV translators' margin note on a verse ("he goats: Heb. great he goats"): a dagger after the
 * verse, as in a printed KJV, that opens the note beneath it. The note is never read as Scripture.
 */
export function KjvNote({ note }: { note: string }) {
  const [open, setOpen] = useState(false);
  const plain = ABBR.reduce((t, [rx, word]) => t.replace(rx, word + ":"), note).replace(/::/g, ":");
  return (
    <span className="kjv-note">
      <button
        type="button"
        className="kjv-note-mark"
        aria-expanded={open}
        aria-label="The translators' margin note"
        title={"Translators' note: " + plain}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        †
      </button>
      {open ? (
        <span className="kjv-note-text" onClick={(e) => e.stopPropagation()}>
          <span className="kjv-note-label">Translators' margin note</span> {note}
        </span>
      ) : null}
    </span>
  );
}
