/** Works worth reading first. A Father's bookcase shelves these first and marks them "Start here". */
export const KEY_WORKS: ReadonlySet<string> = new Set([
  "didache",
  "first-epistle-of-clement",
  "epistles-of-ignatius",
  "martyrdom-of-polycarp",
  "epistle-to-diognetus",
  "first-apology",
  "dialogue-with-trypho",
  "against-heresies",
  "apology",
  "who-is-the-rich-man-that-shall-be-saved",
  "stromata",
  "against-celsus",
  "on-the-unity-of-the-church",
  "divine-institutes",
  "church-history",
  "on-the-incarnation-of-the-word",
  "life-of-antony",
  "catechetical-lectures",
  "basil-on-the-holy-spirit",
  "five-theological-orations-orations-xxvii-xxxi",
  "great-catechism",
  "on-the-priesthood",
  "homilies-on-matthew",
  "confessions",
  "city-of-god",
  "on-the-holy-trinity",
  "on-christian-doctrine",
  "conferences",
  "commonitory",
  "book-of-pastoral-rule",
  "exposition-of-the-orthodox-faith"
]);

/** About 230 words a minute, rounded to something a reader can plan around. */
export function readingTime(words: number): string {
  const minutes = Math.max(1, Math.round(words / 230));
  if (minutes < 60) return minutes + " min";
  const hours = minutes / 60;
  return (hours < 10 ? Math.round(hours * 2) / 2 : Math.round(hours)) + " hr";
}

export function formatWords(n: number): string {
  if (n >= 10000) return Math.round(n / 1000) + "k words";
  return n.toLocaleString("en-US") + " words";
}
