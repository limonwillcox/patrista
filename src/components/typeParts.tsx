import type { ReactNode } from "react";
import { Link } from "react-router-dom";

/* Small pieces shared by the Types atlas and its trails. */

export function italics(text: string): ReactNode {
  return text.split(/\*([^*]+)\*/).map((part, i) => (i % 2 ? <i key={i}>{part}</i> : part));
}

/** "Cyril, *Cat.* 13.20 — “…”" → the reference and the quotation. */
export function splitWhere(w: string): { ref: string; quote: string } {
  const at = w.indexOf(" — ");
  return at < 0 ? { ref: "", quote: w } : { ref: w.slice(0, at), quote: w.slice(at + 3) };
}

/** "Cyril, *Cat.* 13.20" with "Cyril" linked to his page (the author is read from the passage's link). */
export function FatherRef({ refText, href }: { refText: string; href: string }) {
  const author = href.match(/^\/fathers\/([^/]+)\//)?.[1];
  const at = refText.indexOf(",");
  if (!author || at < 0) return <>{italics(refText)}</>;
  return (
    <>
      <Link to={"/fathers/" + author + "/"} className="ty-father">
        {refText.slice(0, at)}
      </Link>
      {italics(refText.slice(at))}
    </>
  );
}
