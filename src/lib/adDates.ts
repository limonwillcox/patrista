/**
 * Catalog dates use "c." for circa ("c. 340–397"). On the Fathers pages a year
 * reads as Anno Domini: "AD 340–397", and a bare year "354–430" the same way.
 * A date that is already BC is left as it is. "2nd c." is a century, not a year.
 */
export function adDates(dates: string): string {
  const raw = dates.trim();
  if (!raw || /\bBC\b/.test(raw)) return dates;
  let next = raw.replace(/\bc\.(?=\s*\d)/gi, "AD");
  next = next.replace(/\bAD\s+(\d+)\s*([–-])\s*AD\s+/g, "AD $1$2");
  if (/\bAD\b/.test(next) || !/\d{2,4}/.test(next)) return next;
  return next.replace(/(\d{2,4})/, "AD $1");
}
