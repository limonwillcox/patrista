const ALLOWED_TAGS = new Set(["b", "strong", "u", "ul", "ol", "li", "br", "p", "div", "em", "i"]);

export function notesStorageKey(workId: string): string {
  return "fg-note-" + workId;
}

export function noteEnterIntent(e: { key: string; shiftKey: boolean }): "finish" | "newline" | null {
  if (e.key !== "Enter") return null;
  return e.shiftKey ? "newline" : "finish";
}

export function sanitizeNoteHtml(html: string): string {
  let out = String(html || "");
  out = out.replace(/\u200b/g, "");
  out = out.replace(/<script[\s\S]*?<\/script>/gi, "");
  out = out.replace(/<style[\s\S]*?<\/style>/gi, "");
  out = out.replace(
    /<span\b[^>]*style="[^"]*font-weight:\s*(bold|700)[^"]*"[^>]*>([\s\S]*?)<\/span>/gi,
    "<b>$2</b>"
  );
  out = out.replace(
    /<span\b[^>]*style="[^"]*text-decoration:\s*[^"]*underline[^"]*"[^>]*>([\s\S]*?)<\/span>/gi,
    "<u>$1</u>"
  );
  out = out.replace(/\n/g, "<br>");
  out = out.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (full, tag: string) => {
    const name = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(name)) return "";
    if (name === "br") return "<br>";
    if (/^<\//.test(full)) return `</${name}>`;
    return `<${name}>`;
  });
  return out;
}

export function notePreview(html: string): string {
  const text = sanitizeNoteHtml(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
  return text.split("\n").map((s) => s.trim()).find(Boolean) || "";
}

export function noteIsEmpty(html: string): boolean {
  return !sanitizeNoteHtml(html)
    .replace(/<br\s*\/?>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

export function loadNoteHtml(workId: string): string {
  if (typeof localStorage === "undefined") return "";
  try {
    const raw = localStorage.getItem(notesStorageKey(workId));
    if (!raw) return "";
    const parsed = JSON.parse(raw) as { html?: string };
    return sanitizeNoteHtml(parsed.html || "");
  } catch {
    return "";
  }
}

export function saveNoteHtml(workId: string, html: string): void {
  if (typeof localStorage === "undefined") return;
  const clean = sanitizeNoteHtml(html);
  if (noteIsEmpty(clean)) {
    localStorage.removeItem(notesStorageKey(workId));
    return;
  }
  localStorage.setItem(notesStorageKey(workId), JSON.stringify({ v: 1, html: clean }));
}

export function insertNoteNewline(): void {
  if (document.execCommand("insertLineBreak")) return;
  document.execCommand("insertHTML", false, "<br>");
}

export function selectionHasFormat(kind: "bold" | "underline" | "list"): boolean {
  const sel = window.getSelection();
  if (!sel || !sel.anchorNode) return false;
  let node: Node | null = sel.anchorNode;
  if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
  const el = node as Element | null;
  if (!el) return false;
  if (kind === "bold") return Boolean(el.closest("b, strong"));
  if (kind === "underline") return Boolean(el.closest("u"));
  return Boolean(el.closest("ul"));
}

export function toggleNoteFormat(command: "bold" | "underline" | "insertUnorderedList"): void {
  if (command === "insertUnorderedList") {
    document.execCommand("insertUnorderedList");
    return;
  }
  const tagName = command === "bold" ? "b" : "u";
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  const inTag = selectionHasFormat(command);

  if (range.collapsed) {
    if (inTag) {
      const holder = range.startContainer.parentElement?.closest(tagName);
      if (holder) {
        const after = document.createRange();
        after.setStartAfter(holder);
        after.collapse(true);
        sel.removeAllRanges();
        sel.addRange(after);
      }
      return;
    }
    const el = document.createElement(tagName);
    el.appendChild(document.createTextNode("\u200b"));
    range.insertNode(el);
    const inner = document.createRange();
    inner.setStart(el.firstChild as Text, 1);
    inner.collapse(true);
    sel.removeAllRanges();
    sel.addRange(inner);
    return;
  }

  if (inTag) {
    document.execCommand(command === "bold" ? "bold" : "underline");
    return;
  }
  try {
    const el = document.createElement(tagName);
    range.surroundContents(el);
  } catch {
    document.execCommand("styleWithCSS", false, "false");
    document.execCommand(command === "bold" ? "bold" : "underline");
  }
}
