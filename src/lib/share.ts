import { copyText } from "./clipboard";

/** What is handed to the system share sheet: a name, the words, and the page they are on. */
export type SharePayload = { title: string; text: string; url: string };

export type ShareOutcome = "shared" | "copied" | "cancelled" | "failed";

/**
 * Share through the system sheet (Messages, Mail, AirDrop and the rest) where the browser has one.
 * Where it has none, the words and the link are copied instead. The reading pages never grow a
 * homemade menu of apps.
 */
export async function shareOrCopy(payload: SharePayload): Promise<ShareOutcome> {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share(payload);
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
      /* the sheet refused: copy instead */
    }
  }
  return (await copyText(payload.text + "\n" + payload.url)) ? "copied" : "failed";
}

/** The line to show after a share, or null when the system sheet has already said enough. */
export function shareToast(outcome: ShareOutcome): string | null {
  if (outcome === "copied") return "Copied, ready to paste";
  if (outcome === "failed") return "Could not copy";
  return null;
}

/** A verse or a run of verses with its reference under it: “…”, a blank line, "Matthew 5:3 (KJV)". */
export function verseShareText(verses: string[], reference: string, translation?: string): string {
  const words = verses
    .map((v) => v.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(" ");
  return "“" + words + "”\n\n" + reference + (translation ? " (" + translation + ")" : "");
}

/** A Father's words on a verse: the words, a blank line, "John Chrysostom, Homilies on Matthew, on Matthew 5:3". */
export function quoteShareText(quote: string, father: string, work: string, on?: string): string {
  const clean = quote.replace(/\s+/g, " ").trim();
  const who = [father, work].filter(Boolean).join(", ");
  return "“" + clean + "”\n\n" + who + (on ? ", on " + on : "");
}
