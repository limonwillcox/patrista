import { useEffect, useRef, useState } from "react";
import {
  dictionaryBarClick,
  lookupWebster,
  reportDictionaryMiss,
  WEBSTER_SOURCE,
  wordFromPoint,
  type DictionaryMode,
  type WebsterEntry
} from "../lib/dictionary";
import { announceReadDock, subscribeReadDock } from "../lib/readDocks";

export function DictionaryDock({ workId }: { workId?: string }) {
  const [mode, setMode] = useState<DictionaryMode>("idle");
  const [entry, setEntry] = useState<WebsterEntry | null>(null);
  const [query, setQuery] = useState("");
  const req = useRef(0);

  useEffect(() => {
    document.body.classList.toggle("read-dict-pick", mode === "pick");
    return () => document.body.classList.remove("read-dict-pick");
  }, [mode]);

  useEffect(
    () =>
      subscribeReadDock((dock) => {
        if (dock === "chapter") {
          setMode("idle");
          setEntry(null);
          setQuery("");
        }
      }),
    []
  );

  useEffect(() => {
    if (mode === "pick" || mode === "show") announceReadDock("dictionary");
  }, [mode]);

  useEffect(() => {
    if (mode !== "pick") return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMode(entry ? "show" : "idle");
    }
    function onClick(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (t.closest(".read-dict-dock")) return;
      if (!t.closest(".para")) {
        setMode(entry ? "show" : "idle");
        return;
      }
      const word = wordFromPoint(e.clientX, e.clientY);
      if (!word) return;
      e.preventDefault();
      e.stopPropagation();
      const id = ++req.current;
      setQuery(word);
      setMode("load");
      lookupWebster(word).then((found) => {
        if (id !== req.current) return;
        setEntry(found);
        setMode(found ? "show" : "miss");
        if (!found) reportDictionaryMiss(word, workId);
      });
    }
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [mode, entry, workId]);

  function toggle() {
    const next = dictionaryBarClick(mode);
    if (next === "idle") {
      setEntry(null);
      setQuery("");
    }
    if (next === "pick") announceReadDock("dictionary");
    setMode(next);
  }

  const barText =
    mode === "pick"
      ? "Click a word"
      : mode === "load"
        ? "Looking up…"
        : mode === "miss"
          ? "No entry for " + query + " — queued"
          : entry
            ? entry.headword.toLowerCase()
            : "Look up a word";

  return (
    <div className="read-dict-dock">
      <div className="read-dict-field">
        <span className="read-dict-label">Dictionary</span>
        <button
          type="button"
          className={"read-dict-bar" + (mode === "pick" ? " is-pick" : "")}
          onClick={toggle}
          aria-pressed={mode === "pick"}
        >
          {barText}
        </button>
      </div>
      {mode === "show" && entry ? (
        <div className="read-dict-senses">
          {entry.senses.map((sense, i) => (
            <p key={i}>{sense}</p>
          ))}
          <p className="read-dict-source">{WEBSTER_SOURCE}</p>
        </div>
      ) : null}
    </div>
  );
}
