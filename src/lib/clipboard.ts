/**
 * Copy plain text, and HTML when given, so italics, links and the rest survive paste
 * into Word, Docs and mail. Falls back to plain text when the rich clipboard is unavailable.
 */
export async function copyText(text: string, html?: string): Promise<boolean> {
  if (html && typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    try {
      const item = new ClipboardItem({
        "text/plain": blob(text, "text/plain"),
        "text/html": blob(wrapHtml(html), "text/html")
      });
      await navigator.clipboard.write([item]);
      return true;
    } catch {
      /* writeText next */
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

function blob(value: string, type: string): Blob {
  return new Blob([value], { type: type + ";charset=utf-8" });
}

/** Word and Docs look for the fragment markers when reading text/html from the clipboard. */
function wrapHtml(inner: string): string {
  return "<html><body><!--StartFragment-->" + inner + "<!--EndFragment--></body></html>";
}
