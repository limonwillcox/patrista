/**
 * Per-work facts that the source files do not carry: who really wrote a work, and how sure that is.
 *
 * The catalog shelves a work under the Father whose folder holds its file, so a work's URL never moves.
 * When that Father did not write it, or scholars doubt that he did, the entry here says so, and every
 * place that names an author (the book viewer, the reader, page titles, search-engine text) uses
 * `attribution` instead of "by <Father>".
 *
 * An entry with `attribution` but no `authorship` is a work by another known writer (a letter the Father
 * preserved, a life of him by his deacon). It is neither pseudonymous nor anonymous; it is simply not his.
 *
 * Keyed by catalog work id.
 */

export type Authorship =
  /** Scholars dispute whether the named Father wrote it. */
  | "disputed"
  /** Written under the Father's name by someone else (pseudepigraphal). */
  | "spurious"
  /** No author is known; the work is shelved with a Father for convenience. */
  | "anonymous";

export type WorkMeta = {
  authorship?: Authorship;
  /**
   * One plain line naming the real or likely author, shown wherever an author is named.
   * Example: "Anonymous bishop (3rd c.), written against Novatian".
   */
  attribution?: string;
  /**
   * Short author for page titles and the book's cover ("Pseudo-Clement", "Pontius the Deacon").
   * Omit it when the title should name no author (anonymous works, or a title that already names him).
   */
  by?: string;
  /** `by` names a body (a church), not a person. */
  group?: boolean;
};

export const WORK_META: Record<string, WorkMeta> = {
  // --- Apostolic Fathers and other early documents ---
  didache: {
    authorship: "anonymous",
    attribution: "Anonymous church order (late 1st or early 2nd c.)"
  },
  "epistle-of-barnabas": {
    authorship: "anonymous",
    attribution: "Anonymous (c. 96–135, often dated c. 130); not by the apostle Barnabas"
  },
  "epistle-to-diognetus": {
    authorship: "anonymous",
    attribution:
      "Anonymous (date uncertain, perhaps late 2nd c.); “Mathetes” (“a disciple”) is not a name, and chs. 11–12 are likely a separate piece"
  },
  "martyrdom-of-polycarp": {
    attribution: "The church of Smyrna, in a letter written soon after his death (c. 155–160)",
    by: "the Church of Smyrna",
    group: true
  },
  "martyrdom-of-ignatius": {
    authorship: "anonymous",
    attribution: "Anonymous acts, written long after his death (probably 4th–5th c.)"
  },
  "spurious-epistles-of-ignatius": {
    authorship: "spurious",
    attribution: "Pseudo-Ignatius: letters added to the Ignatian collection, probably in the later 4th c.",
    by: "Pseudo-Ignatius"
  },
  "recognitions-of-clement": {
    authorship: "spurious",
    attribution: "Pseudo-Clementine (3rd–4th c.)",
    by: "Pseudo-Clement"
  },
  "clementine-homilies": {
    authorship: "spurious",
    attribution: "Pseudo-Clementine (3rd–4th c.)",
    by: "Pseudo-Clement"
  },
  "clement-rome-the-homily": {
    authorship: "spurious",
    attribution: "Anonymous homily (2nd c.), traditionally ascribed to Clement",
    by: "Pseudo-Clement"
  },

  // --- Apologists ---
  "discourse-to-the-greeks": {
    authorship: "spurious",
    attribution: "Pseudo-Justin (date uncertain)",
    by: "Pseudo-Justin"
  },
  "hortatory-address-to-the-greeks": {
    authorship: "spurious",
    attribution: "Pseudo-Justin (3rd or 4th c.)",
    by: "Pseudo-Justin"
  },
  "on-the-sole-government-of-god": {
    authorship: "spurious",
    attribution: "Pseudo-Justin; not the book on God’s sole rule that Eusebius lists among Justin’s works",
    by: "Pseudo-Justin"
  },
  "fragments-on-the-resurrection": {
    authorship: "disputed",
    attribution: "Ascribed to Justin in the Sacra Parallela; authorship disputed"
  },
  "martyrdom-of-justin": {
    authorship: "anonymous",
    attribution: "Anonymous acts of his trial before the prefect Rusticus"
  },
  "on-the-resurrection-of-the-dead": {
    authorship: "disputed",
    attribution: "Ascribed to Athenagoras in the manuscripts; some scholars date it later"
  },

  // --- Third century ---
  "against-all-heresies": {
    authorship: "spurious",
    attribution: "Pseudo-Tertullian (3rd c.), author unknown",
    by: "Pseudo-Tertullian"
  },
  "answer-to-the-jews": {
    authorship: "disputed",
    attribution: "Tertullian (chs. 1–8); chs. 9–14 are often thought a later compilation from Against Marcion III"
  },
  "discourse-on-the-end-of-the-world-and-antichrist": {
    authorship: "spurious",
    attribution: "Pseudo-Hippolytus (a later Byzantine work)",
    by: "Pseudo-Hippolytus"
  },
  "canons-of-hippolytus": {
    authorship: "spurious",
    attribution: "Egyptian church order (4th c.?), not by Hippolytus"
  },
  "discourse-on-the-holy-theophany": {
    authorship: "disputed",
    attribution: "Authorship disputed; often thought later than Hippolytus"
  },
  "treatise-against-the-heretic-novatian": {
    authorship: "anonymous",
    attribution: "Anonymous bishop (3rd c.), written against Novatian"
  },
  "treatise-on-re-baptism": {
    authorship: "anonymous",
    attribution: "Anonymous writer (mid-3rd c.), arguing against Cyprian’s position"
  },
  "treatises-of-questionable-authority": {
    authorship: "spurious",
    attribution:
      "Pseudo-Cyprian (3rd c.); the treatises on the shows and on chastity are now usually assigned to Novatian",
    by: "Pseudo-Cyprian"
  },
  "life-and-passion-of-cyprian": {
    attribution: "Pontius the Deacon, written soon after Cyprian’s death in 258",
    by: "Pontius the Deacon"
  },
  "fragments-of-caius": {
    attribution: "Caius, Roman presbyter (early 3rd c.), with other anonymous Roman fragments, including the Muratorian Fragment"
  },
  "four-homilies": {
    authorship: "spurious",
    attribution: "Later homilies circulated under Gregory’s name",
    by: "Pseudo-Gregory Thaumaturgus"
  },
  "sectional-confession-of-faith": {
    authorship: "spurious",
    attribution: "Apollinaris of Laodicea (4th c.), circulated under Gregory’s name",
    by: "Apollinaris of Laodicea"
  },
  "on-the-subject-of-the-soul": {
    authorship: "disputed",
    attribution: "Authorship doubtful; ascribed to Gregory in the manuscripts"
  },
  "oration-concerning-simeon-and-anna": {
    authorship: "spurious",
    attribution: "Pseudo-Methodius (a later Greek homily)",
    by: "Pseudo-Methodius"
  },
  "oration-on-the-palms": {
    authorship: "spurious",
    attribution: "Pseudo-Methodius (a later Greek homily)",
    by: "Pseudo-Methodius"
  },
  "discourse-to-the-greeks-concerning-hades": {
    authorship: "disputed",
    attribution: "Pseudo-Josephus; often ascribed to Hippolytus",
    by: "Pseudo-Josephus"
  },

  "doubtful-letters-of-sulpicius-severus": {
    authorship: "disputed",
    attribution: "Letters transmitted under Sulpicius Severus’s name; his authorship is doubted"
  },
  "five-books-in-reply-to-marcion-poem": {
    authorship: "spurious",
    attribution: "Pseudo-Tertullian: an anonymous Latin poem of uncertain date (3rd–5th c.)",
    by: "Pseudo-Tertullian"
  },

  // --- Fourth century ---
  "oration-of-constantine-to-the-assembly-of-the-saints": {
    attribution: "The Emperor Constantine, preserved by Eusebius; its authenticity, once doubted, is now widely accepted"
  },
  "letter-of-eusebius-on-the-council-of-nicaea": {
    attribution: "Eusebius of Caesarea (preserved by Athanasius)"
  },
  "historia-acephala": {
    authorship: "anonymous",
    attribution: "Anonymous Alexandrian chronicle (late 4th c.)"
  },
  "deposition-of-arius": {
    authorship: "disputed",
    attribution: "Issued by Alexander of Alexandria; Athanasius, then his deacon, may have drafted it",
    by: "Alexander of Alexandria"
  },
  "fourth-discourse-against-the-arians": {
    authorship: "disputed",
    attribution: "Authorship disputed; many scholars assign it to another 4th-c. writer"
  },
  "letter-to-his-brother-peter-on-the-difference-between-ousia-and-hypostasis-lette": {
    authorship: "disputed",
    attribution: "Widely attributed to Gregory of Nyssa"
  },
  "against-those-who-calumniate-us-as-saying-three-gods-letter-189-to-eustathius": {
    authorship: "disputed",
    attribution: "Now generally assigned to Gregory of Nyssa"
  },
  "letters-between-emperor-julian-and-basil-letter-360": {
    authorship: "spurious",
    attribution: "A later forgery in Basil’s name, probably from the iconoclast controversy (8th c.)",
    by: "Pseudo-Basil"
  },
  "mystagogical-lectures": {
    authorship: "disputed",
    attribution: "Cyril of Jerusalem or his successor John; authorship disputed"
  },

  // --- Apostolic Fathers (misc.): a mixed collection, dated per work ---
  "constitutions-of-the-holy-apostles": {
    authorship: "spurious",
    attribution: "Compiled in Syria c. 380, presented as the apostles’ own teaching"
  },
  "early-liturgies": {
    authorship: "anonymous",
    attribution: "Anonymous liturgies under the names of James, Mark, and the apostles Addai and Mari (4th c. and later in their present form)"
  },
  "memoirs-of-edessa": {
    attribution: "Anonymous Syriac documents on the church of Edessa (3rd–5th c.), with fragments of 2nd- and 3rd-c. writers"
  },
  "testaments-of-the-twelve-patriarchs": {
    authorship: "spurious",
    attribution: "Pseudepigraphon in the patriarchs’ names (2nd c. BC–2nd c. AD?); Jewish material in a Christian form, origin debated"
  },
  "acts-of-xanthippe-and-polyxena": {
    authorship: "anonymous",
    attribution: "Anonymous Greek romance (3rd c.?)"
  },
  "apocalypse-of-peter": {
    authorship: "spurious",
    attribution: "Pseudonymous apocalypse (2nd c.)"
  },
  "apocalypse-of-sedrach": {
    authorship: "spurious",
    attribution: "Pseudonymous Greek apocalypse (date uncertain; Byzantine in its present form)"
  },
  "apocalypse-of-the-virgin": {
    authorship: "anonymous",
    attribution: "Anonymous Greek apocalypse (9th c.?)"
  },
  "apology-of-aristides": {
    attribution: "Aristides of Athens (2nd c.)"
  },
  decretals: {
    authorship: "spurious",
    attribution: "Pseudo-Isidorian forgeries (9th c.) in the names of early popes",
    by: "Pseudo-Isidore"
  },
  "gospel-of-peter": {
    authorship: "spurious",
    attribution: "Pseudonymous gospel (2nd c.)"
  },
  "narrative-of-zosimus": {
    authorship: "anonymous",
    attribution: "Anonymous (date uncertain); Jewish material with Christian additions"
  },
  "passion-of-the-holy-martyrs-perpetua-and-felicitas": {
    attribution: "Perpetua’s own prison account and Saturus’s vision, framed by an anonymous editor (c. 203)"
  },
  "passion-of-the-scillitan-martyrs": {
    authorship: "anonymous",
    attribution: "Anonymous acts of the trial at Carthage (180)"
  },
  "testament-of-abraham": {
    authorship: "anonymous",
    attribution: "Anonymous Jewish work (1st–2nd c. AD?), kept by Christians"
  },
  "vision-of-paul": {
    authorship: "spurious",
    attribution: "Pseudonymous apocalypse (late 4th c.)"
  }
};

export function workMeta(id: string): WorkMeta {
  return WORK_META[id] ?? {};
}

/** Shelves that are collections, not one writer: they name no author of their own. */
export const COLLECTION_SHELVES: ReadonlySet<string> = new Set(["apostolic", "councils", "unknown"]);

type Credited = { id: string; authorship?: Authorship; attribution?: string };

function metaOf(work: Credited): WorkMeta {
  const table = workMeta(work.id);
  return {
    ...table,
    authorship: work.authorship ?? table.authorship,
    attribution: work.attribution ?? table.attribution
  };
}

/** True when the work names someone other than the shelf Father, or doubts that he wrote it. */
export function hasAttribution(work: Credited): boolean {
  const m = metaOf(work);
  return Boolean(m.authorship || m.attribution);
}

/**
 * The small honest label beside an attributed work: "Attributed", "Not by Justin Martyr", "Anonymous".
 * Empty for a work the shelf Father wrote, and for a collection shelf's work by a known writer.
 */
export function attributionLabel(work: Credited, shelf: { id: string; name: string }): string {
  const m = metaOf(work);
  const collection = COLLECTION_SHELVES.has(shelf.id);
  if (m.authorship === "disputed") return "Attributed";
  if (m.authorship === "anonymous") return "Anonymous";
  if (m.authorship === "spurious") return collection ? "Pseudonymous" : "Not by " + shelf.name;
  if (m.attribution && !collection) return "Not by " + shelf.name;
  return "";
}

/** Who to name as the work's author: the attribution line when there is one, else the shelf Father. */
export function authorLine(work: Credited, shelf: { name: string }): string {
  return metaOf(work).attribution || shelf.name;
}

/**
 * The author to put at the head of a citation: the real author's short name, the traditional author of
 * a disputed work (as scholars cite "Basil, Ep. 38"), "Anonymous", or nothing. Never "Not by …".
 */
export function citationAuthor(work: Credited, shelf: { id: string; name: string }): string {
  const m = metaOf(work);
  if (m.by) return m.by;
  if (m.authorship === "disputed") return shelf.name;
  const s = shortAuthor(work, shelf);
  return s.startsWith("Not by ") ? "" : s;
}

/**
 * The label and the attribution as one line of prose, without saying "Anonymous" twice:
 * "Not by Cyprian. Pontius the Deacon, written soon after Cyprian’s death in 258".
 */
export function attributionText(work: Credited, shelf: { id: string; name: string }): string {
  const label = attributionLabel(work, shelf);
  const line = metaOf(work).attribution ?? "";
  if (!label) return line;
  if (!line || line.toLowerCase().startsWith(label.toLowerCase())) return line || label;
  return label + ". " + line;
}

/**
 * A short author for a cover, a running head, or a hover readout: `by`, else "Anonymous", else a
 * plain hedge ("Attributed to Basil the Great"). Empty when no short form is honest; then show none.
 * A work the shelf Father wrote gets his name (or nothing, on a collection shelf).
 */
export function shortAuthor(work: Credited, shelf: { id: string; name: string }): string {
  const m = metaOf(work);
  const collection = COLLECTION_SHELVES.has(shelf.id);
  if (m.by) return m.by;
  if (m.authorship === "anonymous") return "Anonymous";
  if (m.attribution && !m.authorship) {
    // A known writer: the name that opens the attribution ("Eusebius of Caesarea (preserved by …)").
    const head = m.attribution.split(/[,;(]/)[0]!.trim();
    return head.length <= 32 ? head : "";
  }
  if (m.authorship === "spurious") return collection ? "" : "Not by " + shelf.name;
  if (m.authorship === "disputed") return "Attributed to " + shelf.name;
  return collection ? "" : shelf.name;
}
