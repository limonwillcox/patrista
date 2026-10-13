import { describe, expect, it } from "vitest";
import {
  noteEnterIntent,
  noteIsEmpty,
  notePreview,
  notesStorageKey,
  sanitizeNoteHtml
} from "../src/lib/readerNotes";

describe("noteEnterIntent", () => {
  it("finishes on Enter and inserts a line on Shift+Enter", () => {
    expect(noteEnterIntent({ key: "Enter", shiftKey: false })).toBe("finish");
    expect(noteEnterIntent({ key: "Enter", shiftKey: true })).toBe("newline");
    expect(noteEnterIntent({ key: "a", shiftKey: false })).toBeNull();
  });
});

describe("sanitizeNoteHtml", () => {
  it("keeps bold, underline, and lists, and drops scripts", () => {
    const html = sanitizeNoteHtml(
      '<b>bold</b><u>under</u><ul><li>one</li></ul><script>alert(1)</script><img src=x onerror=alert(1)>'
    );
    expect(html).toContain("<b>bold</b>");
    expect(html).toContain("<u>under</u>");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>one</li>");
    expect(html).not.toMatch(/script/i);
    expect(html).not.toMatch(/img/i);
    expect(html).not.toMatch(/onerror/i);
  });

  it("turns browser bold and underline spans into tags", () => {
    const html = sanitizeNoteHtml(
      '<span style="font-weight: bold">bold</span> and <span style="text-decoration: underline">under</span>'
    );
    expect(html).toContain("<b>bold</b>");
    expect(html).toContain("<u>under</u>");
    expect(html).not.toMatch(/span/i);
  });
});

describe("notePreview", () => {
  it("flattens markup to the first line of plain text", () => {
    expect(notePreview("<b>Silence</b> in Rome<br>next")).toBe("Silence in Rome");
    expect(noteIsEmpty("<br>")).toBe(true);
    expect(noteIsEmpty("<b>hi</b>")).toBe(false);
  });
});

describe("notesStorageKey", () => {
  it("is per work", () => {
    expect(notesStorageKey("confessions")).toBe("fg-note-confessions");
  });
});
