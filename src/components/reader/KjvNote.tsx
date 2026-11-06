import { useState } from "react";

/** The KJV translators' abbreviations, spelled out on hover. */
const ABBR: [RegExp, string][] = [
  [/\bHeb\./g, "Hebrew"],
  [/\bGr\./g, "Greek"],
  [/\bChald\./g, "Chaldee (Aramaic)"]
];

/**
 * What a margin note is. Most are the 1611 translators' own (other readings, the Hebrew or Greek word for
 * word, coins and measures in English money). Two kinds are not: the conversions into American cents that
 * later American printings added to the coin notes ("…seven pence halfpenny; about fourteen cents"), and
 * the subscriptions printed after Paul's letters and Hebrews in «guillemets» ("Written to the Romans from
 * Corinthus…"), which come from late Greek manuscripts and are not part of the verse.
 */
export function kjvNoteParts(note: string): { kind: "margin" | "american" | "subscription"; text: string }[] {
  const out: { kind: "margin" | "american" | "subscription"; text: string }[] = [];
  for (const piece of note.split(/(«[^»]*»)/)) {
    const text = piece.trim();
    if (!text) continue;
    if (text.startsWith("«")) {
      out.push({ kind: "subscription", text: text.replace(/^«|»$/g, "") });
      continue;
    }
    // "; about fourteen cents": the American addition, apart from the 1611 note it was added to.
    const cents = text.match(/^(.*?)[;,]?\s*(about [^;]*?\bcents?)\s*$/);
    if (cents && cents[1].trim()) {
      out.push({ kind: "margin", text: cents[1].trim() });
      out.push({ kind: "american", text: cents[2] });
    } else {
      out.push({ kind: /\bcents?\b/.test(text) ? "american" : "margin", text });
    }
  }
  return out;
}

const LABEL = {
  margin: "Margin note",
  american: "Added in American printings",
  subscription: "Subscription"
};

const EXPLAIN = {
  margin: "A note printed in the margin of the King James Version, most of them the 1611 translators' own.",
  american: "Not the 1611 translators': a conversion into American money added by later American printings.",
  subscription:
    "Printed after the letter in the King James Version. It comes from late Greek manuscripts and is not part of the text of Scripture."
};

/**
 * A margin note on a verse ("he goats: Heb. great he goats"): a dagger after the verse, as in a printed KJV,
 * that opens the note beneath it. The note is never read as Scripture.
 */
export function KjvNote({ note }: { note: string }) {
  const [open, setOpen] = useState(false);
  const parts = kjvNoteParts(note);
  const plain = ABBR.reduce((t, [rx, word]) => t.replace(rx, word + ":"), note).replace(/::/g, ":");
  const onlySubscription = parts.every((p) => p.kind === "subscription");
  return (
    <span className="kjv-note">
      <button
        type="button"
        className="kjv-note-mark"
        aria-expanded={open}
        aria-label={onlySubscription ? "The subscription to the letter" : "The margin note"}
        title={(onlySubscription ? "Subscription: " : "Margin note: ") + plain}
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
          {parts.map((p, i) => (
            <span key={i} className={"kjv-note-part is-" + p.kind}>
              {i ? " " : null}
              <span className="kjv-note-label" title={EXPLAIN[p.kind]}>
                {LABEL[p.kind]}
              </span>{" "}
              {p.text}
            </span>
          ))}
        </span>
      ) : null}
    </span>
  );
}
