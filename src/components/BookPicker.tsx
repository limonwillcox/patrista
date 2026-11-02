import { useEffect, useRef, useState } from "react";
import type { BibleManifestBook } from "../api/client";

/** Genesis to Malachi: the first 39 books of the manifest. */
const OT_COUNT = 39;

/**
 * Choose a book, then a chapter: one popover under the chapter title instead of a row of selects.
 */
export function BookPicker({
  manifest,
  book,
  chapter,
  onPick,
  onClose
}: {
  manifest: BibleManifestBook[];
  book: string;
  chapter: number;
  onPick: (book: string, chapter: number) => void;
  onClose: () => void;
}) {
  const [shown, setShown] = useState(book);
  const ref = useRef<HTMLDivElement>(null);
  const meta = manifest.find((b) => b.id === shown);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && !(e.target as HTMLElement).closest(".bible-title-btn")) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const list = (books: BibleManifestBook[]) =>
    books.map((b) => (
      <li key={b.id}>
        <button
          type="button"
          className={(b.id === shown ? "is-shown" : "") + (b.id === book ? " is-current" : "")}
          onClick={() => (b.chapters === 1 ? onPick(b.id, 1) : setShown(b.id))}
        >
          {b.name}
        </button>
      </li>
    ));

  return (
    <div className="book-picker" ref={ref} role="dialog" aria-label="Choose a book and chapter">
      <div className="book-picker-books">
        <p className="book-picker-label">Old Testament</p>
        <ul>{list(manifest.slice(0, OT_COUNT))}</ul>
        <p className="book-picker-label">New Testament</p>
        <ul>{list(manifest.slice(OT_COUNT))}</ul>
      </div>
      <div className="book-picker-chapters">
        <p className="book-picker-label">{meta?.name ?? ""}</p>
        <ol>
          {Array.from({ length: meta?.chapters ?? 0 }, (_, i) => i + 1).map((n) => (
            <li key={n}>
              <button
                type="button"
                className={shown === book && n === chapter ? "is-current" : ""}
                onClick={() => onPick(shown, n)}
              >
                {n}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
