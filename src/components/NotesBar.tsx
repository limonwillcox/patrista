import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  insertNoteNewline,
  loadNoteHtml,
  noteEnterIntent,
  saveNoteHtml,
  sanitizeNoteHtml,
  selectionHasFormat,
  toggleNoteFormat
} from "../lib/readerNotes";

export function NotesBar({ workId, onSave, autoEdit }: { workId: string; onSave?: () => void; /** start in the editor */ autoEdit?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [formats, setFormats] = useState({ bold: false, underline: false, list: false });
  const editor = useRef<HTMLDivElement>(null);
  /** Opened in the editor from code: place the cursor once the box has become editable. */
  const focusWhenEditable = useRef(false);

  useEffect(() => {
    setEditing(!!autoEdit);
    focusWhenEditable.current = !!autoEdit;
    if (editor.current) editor.current.innerHTML = loadNoteHtml(workId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workId]);

  useEffect(() => {
    if (!editing || !focusWhenEditable.current) return;
    focusWhenEditable.current = false;
    focusEnd();
  }, [editing]);

  useEffect(() => {
    if (!editing) return;
    function sync() {
      setFormats({
        bold: selectionHasFormat("bold"),
        underline: selectionHasFormat("underline"),
        list: selectionHasFormat("list")
      });
    }
    document.addEventListener("selectionchange", sync);
    return () => document.removeEventListener("selectionchange", sync);
  }, [editing]);

  /** Focus the note with the cursor at its end. */
  function focusEnd() {
    const el = editor.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (!sel) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function startEdit() {
    setEditing(true);
    requestAnimationFrame(focusEnd);
  }

  function finish() {
    const el = editor.current;
    if (!el) return;
    const html = sanitizeNoteHtml(el.innerHTML);
    el.innerHTML = html;
    saveNoteHtml(workId, html);
    setEditing(false);
    onSave?.();
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      apply("bold");
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "u") {
      e.preventDefault();
      apply("underline");
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      finish();
      return;
    }
    const intent = noteEnterIntent(e);
    if (intent === "finish") {
      e.preventDefault();
      finish();
    } else if (intent === "newline") {
      e.preventDefault();
      insertNoteNewline();
    }
  }

  function apply(command: "bold" | "underline" | "insertUnorderedList") {
    editor.current?.focus();
    toggleNoteFormat(command);
    setFormats({
      bold: selectionHasFormat("bold"),
      underline: selectionHasFormat("underline"),
      list: selectionHasFormat("list")
    });
  }

  return (
    <div className="journal-notes">
      {editing ? (
        <div className="journal-note-tools">
          <button
            type="button"
            className={formats.bold ? "is-on" : ""}
            aria-label="Bold"
            aria-pressed={formats.bold}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => apply("bold")}
          >
            B
          </button>
          <button
            type="button"
            className={formats.underline ? "is-on" : ""}
            aria-label="Underline"
            aria-pressed={formats.underline}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => apply("underline")}
          >
            <span className="read-note-u">U</span>
          </button>
          <button
            type="button"
            className={formats.list ? "is-on" : ""}
            aria-label="Bullet list"
            aria-pressed={formats.list}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => apply("insertUnorderedList")}
          >
            •
          </button>
        </div>
      ) : null}
      <div
        ref={editor}
        className={"journal-note-editor" + (editing ? " is-editing" : "")}
        contentEditable={editing}
        role="textbox"
        aria-label="Notes"
        aria-multiline="true"
        data-placeholder="Write a note"
        suppressContentEditableWarning
        onClick={() => {
          if (!editing) startEdit();
        }}
        onKeyDown={onKeyDown}
        onBlur={(e) => {
          if (!editing) return;
          const next = e.relatedTarget as HTMLElement | null;
          if (next?.closest(".journal-note-tools")) return;
          finish();
        }}
      />
    </div>
  );
}
