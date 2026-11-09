/**
 * Catalog dates on the Fathers pages, written as Anno Domini.
 * "c. 185" and "354" become "AD 185" and "AD 354". "3rd c." becomes "3rd century AD".
 * "d. 258" is read out as "died AD 258", so it does not sit on the card as "d. AD 258".
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
  next = next.replace(/\bc\.(?=\s*\d)/gi, "AD");
  next = next.replace(/\bAD\s+(\d+)\s*([–-])\s*AD\s+/g, "AD $1$2");
  if (!/\bAD\b/.test(next) && /\d{2,4}/.test(next)) next = next.replace(/(\d{2,4})/, "AD $1");
  return next.replace(/\bd\.\s+AD\b/g, "died AD");
}
