/**
 * Writers the historic churches commemorate as saints. The share line and the citation
 * then read "Saint Augustine of Hippo". Everyone else keeps the catalog name.
 * Origen, Tertullian, and the historians are not in this set.
 */
const SAINTS = new Set([
  "ambrose",
  "athanasius",
  "augustine",
  "basil",
  "cassian",
  "chrysostom",
  "clement_rome",
  "cyprian",
  "cyril_jerusalem",
  "dionysius",
  "ephraim",
  "gregory",
  "gregory_nazianzen",
  "gregory_nyssa",
  "gregory_thaumaturgus",
  "hilary",
  "hippolytus",
  "ignatius",
  "irenaeus",
  "jerome",
  "john_damascus",
  "justin",
  "leo",
  "methodius",
  "papias",
  "polycarp",
  "theophilus",
  "vincent"
]);

/** "Saint Augustine of Hippo" when this shelf is a saint and the citation names him. */
export function saintName(authorId: string, citedName: string, shelfName: string): string {
  if (!citedName || citedName !== shelfName || !SAINTS.has(authorId)) return citedName;
  if (/^saint\b/i.test(citedName)) return citedName;
  return "Saint " + citedName;
}
