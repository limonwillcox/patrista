/**
 * Catalog dates on the Fathers pages, written as Anno Domini.
 * "354" becomes "AD 354". "c. 185" becomes "c. AD 185": an approximate date stays approximate.
 * "3rd c." becomes "3rd century AD". "d. 258" is read out as "died AD 258".
 * A BC date is left as written.
 */
export function adDates(dates: string): string {
  const raw = dates.trim();
  if (!raw || /\bBC\b/.test(raw)) return dates;
  const century =
    /((?:early |mid |late |early-|mid-|late-)?\d(?:st|nd|rd|th)(?:\s*[–-]\s*(?:early |mid |late |early-|mid-|late-)?\d(?:st|nd|rd|th))?)\s+c\./gi;
  let next = raw.replace(century, (_, span: string) => {
    const plural = /\d(?:st|nd|rd|th)\s*[–-]\s*/i.test(span);
    return span + (plural ? " centuries AD" : " century AD");
  });
  // AD goes before the first year only: "c. 213–c. 270" reads "c. AD 213–c. 270".
  if (!/\bAD\b/.test(next)) next = next.replace(/\b\d{1,4}\b/, "AD $&");
  return next.replace(/\bd\.\s+(?=c\.|AD\b)/g, "died ");
}
