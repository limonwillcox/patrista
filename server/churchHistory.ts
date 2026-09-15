import type { Catalog } from "./types";

/**
 * The eras of church history, 4 BC to 1054.
 *
 * This array is the single source of truth for three renderers: the React page
 * (src/pages/ChurchHistoryPage.tsx), the build-time prerender that emits the
 * crawlable HTML (vite.config.ts), and the JSON-LD. Adding an era means adding
 * one object here and nothing else.
 *
 * Dates follow Ussher's chronology — Nativity 4 BC, Passion AD 33 — the
 * reckoning printed in the margins of English Bibles since the 17th century.
 */

export type HistoryPeriod = "pre-nicene" | "post-nicene";

/**
 * A catalog work id, or that id with link text of its own. The override exists
 * because a few catalog titles are generic on their own — Jerome's is just
 * "Letters" — and generic anchor text is wasted on both readers and crawlers.
 */
export type WorkRef = string | { id: string; label: string };

export type HistoryEra = {
  id: string;
  /** Signed year, used for ordering. Negative is BC. */
  year: number;
  /** Visible date label, e.g. "AD 33" or "4 BC". */
  display: string;
  /**
   * Machine-readable value for <time datetime>. Omitted for BC dates: HTML only
   * permits a year greater than zero in a valid date string, so a BC entry
   * renders as plain text rather than as invalid markup.
   */
  datetime?: string;
  title: string;
  /** The crawlable prose. This is the page's SEO payload. */
  body: string;
  period: HistoryPeriod;
  /** Scripture references listed under the entry. */
  refs?: string[];
  /**
   * Catalog work ids, rendered as deep links into the reader.
   *
   * Named per work rather than per author on purpose: picking an author's first
   * work gives wrong results (Clement of Rome's is the pseudo-Clementine
   * Recognitions, Tertullian's is On the Soul), and the work title is stronger
   * anchor text than the author's name. The test suite fails if an id stops
   * resolving, so a corpus rename is caught at build time rather than in search.
   */
  works?: WorkRef[];
  /** Cinematic shot id, for the eras that have one. */
  scene?: string;
};

/** Router path. React Router ignores the trailing slash, so this form is used for links. */
export const CHURCH_HISTORY_PATH = "/church-history";
/**
 * Canonical path. The build emits church-history/index.html, which GitHub Pages
 * serves at the trailing-slash URL and 301s the bare form to — so the canonical
 * and the sitemap must both carry the slash, or every crawl takes a redirect hop.
 */
export const CHURCH_HISTORY_CANONICAL_PATH = "/church-history/";
export const CHURCH_HISTORY_TIMELINE_PATH = "/church-history/timeline";
export const CHURCH_HISTORY_TITLE = "Church History Timeline: Pentecost to the Great Schism";
export const CHURCH_HISTORY_HEADING = "Church history timeline";
export const CHURCH_HISTORY_DESCRIPTION =
  "A timeline of church history from Pentecost to the Great Schism of 1054 — the persecutions, Nicaea, and the councils, linked to the Church Fathers' own words.";

export const PERIOD_LABELS: Record<HistoryPeriod, string> = {
  "pre-nicene": "Before Nicaea",
  "post-nicene": "After Nicaea"
};

export const PERIOD_BLURBS: Record<HistoryPeriod, string> = {
  "pre-nicene":
    "From the Nativity to the council of 325: a church without legal standing, spreading under an empire that periodically tried to end it.",
  "post-nicene":
    "From 325 to the Great Schism of 1054: a church with creeds, councils, and imperial backing, working out what it had confessed — and slowly dividing."
};

export const ERAS: HistoryEra[] = [
  {
    id: "nativity",
    year: -4,
    display: "4 BC",
    title: "The Birth of Christ",
    period: "pre-nicene",
    refs: ["Matthew 2:1–18", "Luke 2:1–20"],
    body:
      "Ussher's chronology places the Nativity in 4 BC, before the death of Herod the Great, which is generally dated from Josephus to that year. Matthew's account of the children of Bethlehem two years old and under points to a birth slightly earlier still, so the range usually given is 6 to 4 BC."
  },
  {
    id: "ministry",
    year: 29,
    display: "AD 29",
    datetime: "0029",
    title: "The Ministry Begins",
    period: "pre-nicene",
    refs: ["Luke 3:1–23"],
    body:
      "Luke dates the preaching of John the Baptist to the fifteenth year of Tiberius Caesar, and Jesus was baptised soon after. The public ministry runs about three years from here to the Passion."
  },
  {
    id: "crucifixion",
    year: 33,
    display: "3 April, AD 33",
    datetime: "0033-04-03",
    title: "The Crucifixion and Resurrection",
    period: "pre-nicene",
    refs: ["Matthew 27–28", "1 Corinthians 15:3–8"],
    body:
      "Ussher places the Passion in AD 33; astronomically that falls on Friday 3 April, with the Resurrection on the Sunday following. AD 30 and AD 33 are the two years most commonly defended, being the ones where a Friday Passover fits the Gospel chronology."
  },
  {
    id: "pentecost",
    year: 33,
    display: "24 May, AD 33",
    datetime: "0033-05-24",
    title: "Pentecost",
    period: "pre-nicene",
    scene: "pentecost",
    refs: ["Acts 1:15", "Acts 2:1–4", "Acts 2:41"],
    body:
      "On the fiftieth day, counted from the Resurrection, the Spirit fell on about a hundred and twenty gathered in Jerusalem — first a sound as of a rushing mighty wind, then cloven tongues like as of fire, divided, resting upon each of them. Peter preached, and three thousand were added that day. The church begins here."
  },
  {
    id: "acts-ends",
    year: 62,
    display: "c. AD 62",
    datetime: "0062",
    title: "Acts Closes in Rome",
    period: "pre-nicene",
    scene: "acts-book",
    refs: ["Acts 28:30–31"],
    body:
      "The narrative of Acts runs out with Paul in Rome, under house arrest but preaching without hindrance — twenty-nine years from Pentecost. Its silence about Nero's persecution, the deaths of Peter and Paul, and the fall of Jerusalem is the principal argument for an early date of composition."
  },
  {
    id: "nero",
    year: 64,
    display: "AD 64",
    datetime: "0064",
    title: "Nero and the First Persecution",
    period: "pre-nicene",
    scene: "nero",
    body:
      "After the Great Fire of Rome, Nero fastened the blame on the Christians; Tacitus describes them wrapped in skins and torn by dogs, or set alight to light his gardens. Tradition places the martyrdoms of Peter and Paul in the years that followed. This is the first persecution by the Roman state — and it happens before the Colosseum was built."
  },
  {
    id: "jerusalem",
    year: 70,
    display: "AD 70",
    datetime: "0070",
    title: "The Fall of Jerusalem",
    period: "pre-nicene",
    scene: "jerusalem",
    refs: ["Matthew 24:1–2", "Matthew 24:29", "Isaiah 13:10"],
    body:
      "Titus took Jerusalem after a siege of five months and the Second Temple burned in the month of Av — on the ninth by Jewish reckoning, the tenth according to Josephus. Christ had foretold that not one stone would be left upon another, in the language the prophets had used for the fall of a nation — the sun darkened, the moon without light, the stars falling from heaven."
  },
  {
    id: "apostolic-fathers",
    year: 96,
    display: "AD 96–155",
    datetime: "0096",
    title: "The Apostolic Fathers",
    period: "pre-nicene",
    scene: "apostolic-fathers",
    works: ["first-epistle-of-clement", "epistles-of-ignatius", "martyrdom-of-polycarp"],
    body:
      "The generation that had known the apostles wrote to steady the churches. Clement of Rome wrote to Corinth about 96. Ignatius of Antioch wrote seven letters on the road to his death at Rome about 110. Polycarp of Smyrna, who had heard John, was burned at the stake about 155, aged eighty-six."
  },
  {
    id: "apologists",
    year: 150,
    display: "c. AD 150–200",
    datetime: "0150",
    title: "Apologists and the Rule of Faith",
    period: "pre-nicene",
    works: ["first-apology", "against-heresies", "apology"],
    body:
      "Justin Martyr defended the faith to the emperor himself and died for it about 165. Marcion, the Gnostics, and the Montanists pressed the churches to say what they actually held; Irenaeus answered in Against Heresies about 180, setting out the rule of faith and the four Gospels — the pressure that shaped the New Testament canon. Tertullian, writing about 197, gave the age the line it is remembered by: the blood of the martyrs is the seed of the church."
  },
  {
    id: "alexandria",
    year: 190,
    display: "c. AD 190–254",
    datetime: "0190",
    title: "The School of Alexandria",
    period: "pre-nicene",
    works: ["stromata", "against-celsus"],
    body:
      "Clement of Alexandria and then Origen turned the catechetical school of Alexandria into the first Christian university, reading Scripture alongside Greek philosophy. Origen's Hexapla set six versions of the Old Testament in parallel columns. He was tortured under Decius and died of it about 254."
  },
  {
    id: "decian",
    year: 250,
    display: "AD 250",
    datetime: "0250",
    title: "The Decian Persecution",
    period: "pre-nicene",
    scene: "persecution",
    works: ["treatises-of-cyprian", "epistles-of-cyprian"],
    body:
      "Decius required every citizen to sacrifice and produce a certificate proving it. This was the first empire-wide, systematic persecution, and it broke a great many. What to do with the lapsed occupied Cyprian of Carthage for the rest of his life; he was beheaded in 258."
  },
  {
    id: "diocletian",
    year: 303,
    display: "AD 303–313",
    datetime: "0303",
    title: "The Great Persecution",
    period: "pre-nicene",
    scene: "great-persecution",
    works: ["church-history", "of-the-manner-in-which-the-persecutors-died"],
    body:
      "Diocletian ordered the churches pulled down, the Scriptures burned, and the clergy imprisoned. It was the longest and severest persecution the church had faced, and it ended in exhaustion: Galerius issued an edict of toleration from his deathbed in 311, two years before Milan."
  },
  {
    id: "milvian",
    year: 312,
    display: "AD 312",
    datetime: "0312",
    title: "The Milvian Bridge",
    period: "pre-nicene",
    works: ["church-history", "of-the-manner-in-which-the-persecutors-died"],
    body:
      "Before the battle for Rome, Constantine marked his army with the chi-rho, the first two letters of Christ. The two witnesses disagree about how it came to him: Lactantius, writing within a few years, says he was warned in a dream to mark the shields; Eusebius, much later, describes a cross of light in the sky with the words by this, conquer — in hoc signo vinces in the Latin it is remembered by. Maxentius drowned in the Tiber, and Constantine took Rome."
  },
  {
    id: "milan",
    year: 313,
    display: "AD 313",
    datetime: "0313",
    title: "The Edict of Milan",
    period: "pre-nicene",
    scene: "milan",
    body:
      "Constantine and Licinius granted Christians — and everyone else — the free exercise of religion, and ordered confiscated property returned. Two hundred and fifty years of persecution ended by decree."
  },
  {
    id: "nicaea",
    year: 325,
    display: "AD 325",
    datetime: "0325",
    title: "The Council of Nicaea",
    period: "pre-nicene",
    scene: "nicaea",
    works: ["seven-ecumenical-councils", "on-the-incarnation-of-the-word", "church-history"],
    body:
      "Constantine summoned the bishops to settle whether the Son was of one substance with the Father or a creature. Against Arius the council said homoousios, of one substance, and the creed that carries Nicaea's name begins here. Athanasius spent five exiles defending it. This is the hinge: everything before is ante-Nicene, everything after post-Nicene."
  },
  {
    id: "constantinople",
    year: 381,
    display: "AD 381",
    datetime: "0381",
    title: "The First Council of Constantinople",
    period: "post-nicene",
    works: ["seven-ecumenical-councils", "select-orations", "dogmatic-treatises-select-writings-and-letters"],
    body:
      "A second council confirmed Nicaea and completed the creed, adding the articles on the Holy Spirit. The Nicene Creed as it is actually recited is the creed of 381, shaped by the Cappadocians — the two Gregorys, who were there, and Basil, whose work on the Spirit had prepared the ground before his death two years earlier."
  },
  {
    id: "vulgate",
    year: 382,
    display: "c. AD 382–405",
    datetime: "0382",
    title: "Jerome's Vulgate",
    period: "post-nicene",
    works: [{ id: "jerome-letters", label: "Jerome's Letters" }],
    body:
      "Commissioned by Pope Damasus, Jerome translated the Bible into Latin, taking the Old Testament from the Hebrew rather than the Greek — a decision that alarmed Augustine. The Vulgate was the Bible of the West for a thousand years."
  },
  {
    id: "sack-of-rome",
    year: 410,
    display: "AD 410",
    datetime: "0410",
    title: "The Sack of Rome",
    period: "post-nicene",
    works: ["city-of-god"],
    body:
      "Alaric's Goths took the city, and pagans said Rome had fallen because it had abandoned its gods. Augustine answered over thirteen years with The City of God, setting two cities against each other and reframing how the West would read history."
  },
  {
    id: "ephesus",
    year: 431,
    display: "AD 431",
    datetime: "0431",
    title: "The Council of Ephesus",
    period: "post-nicene",
    works: ["seven-ecumenical-councils"],
    body:
      "The council condemned Nestorius and affirmed Mary as Theotokos, God-bearer — a statement about Christ before it is one about his mother. The Church of the East did not accept it, and separated."
  },
  {
    id: "chalcedon",
    year: 451,
    display: "AD 451",
    datetime: "0451",
    title: "The Council of Chalcedon",
    period: "post-nicene",
    works: ["seven-ecumenical-councils"],
    body:
      "Chalcedon defined Christ as one person in two natures, without confusion and without division, following Leo's Tome. The churches that rejected it — Coptic, Syriac, Armenian, Ethiopian — separated permanently: a division six centuries older than 1054, and never healed."
  },
  {
    id: "fall-west",
    year: 476,
    display: "AD 476",
    datetime: "0476",
    title: "The Western Empire Ends",
    period: "post-nicene",
    body:
      "Odoacer deposed Romulus Augustulus and sent the imperial regalia to Constantinople. In the West the church inherited the administration, the language, and the schools of an empire that no longer existed."
  },
  {
    id: "benedict",
    year: 530,
    display: "c. AD 530",
    datetime: "0530",
    title: "The Rule of St Benedict",
    period: "post-nicene",
    body:
      "Benedict wrote a short and notably moderate rule for his monastery at Monte Cassino: prayer, work, and stability under an abbot. It became the pattern for Western monasticism, and the monasteries became the copyists who preserved the texts."
  },
  {
    id: "hagia-sophia",
    year: 537,
    display: "AD 537",
    datetime: "0537",
    title: "Hagia Sophia",
    period: "post-nicene",
    body:
      "Justinian rebuilt the great church of Constantinople in five years, roofing it with a dome that seemed to Procopius to hang from heaven by a golden chain. It held the largest interior in the world for nearly a thousand years."
  },
  {
    id: "gregory-great",
    year: 590,
    display: "AD 590–604",
    datetime: "0590",
    title: "Gregory the Great",
    period: "post-nicene",
    works: ["book-of-pastoral-rule"],
    body:
      "Gregory administered a Rome the empire had abandoned, wrote the Pastoral Rule for bishops, and in 597 sent Augustine of Canterbury to the English. The medieval papacy takes its shape from him."
  },
  {
    id: "eastern-sees",
    year: 637,
    display: "AD 637–641",
    datetime: "0637",
    title: "The Eastern Sees Are Lost",
    period: "post-nicene",
    body:
      "Antioch fell in 637, Jerusalem in 638, Alexandria in 641, and North Africa followed. Three of the five ancient patriarchates passed out of Christian rule within a generation, leaving Rome and Constantinople facing one another alone. The road to 1054 runs through this."
  },
  {
    id: "iconoclasm",
    year: 726,
    display: "AD 726–843",
    datetime: "0726",
    title: "The Iconoclast Controversy",
    period: "post-nicene",
    works: ["exposition-of-the-orthodox-faith", "seven-ecumenical-councils"],
    body:
      "Twice the emperors ordered the images destroyed, and twice they were restored — at the Second Council of Nicaea in 787, and finally in 843. John of Damascus, writing safely outside the empire, argued that because God had taken flesh, matter could now be depicted."
  },
  {
    id: "charlemagne",
    year: 800,
    display: "AD 800",
    datetime: "0800",
    title: "Charlemagne Crowned",
    period: "post-nicene",
    body:
      "On Christmas Day Leo III crowned Charlemagne emperor — in Byzantine eyes, the theft of an office that already had a holder. The Frankish church also recited the creed with filioque, 'and the Son', a word Constantinople had never agreed to. The political and the doctrinal roots of the schism are both here."
  },
  {
    id: "slavs",
    year: 863,
    display: "AD 863",
    datetime: "0863",
    title: "Cyril and Methodius",
    period: "post-nicene",
    body:
      "Sent from Constantinople to Moravia, the brothers devised an alphabet and translated the liturgy and the Scriptures into Slavonic. The conversion of the Slavs followed, and with the baptism of Rus' in 988 the Eastern church gained the north."
  },
  {
    id: "photian",
    year: 863,
    display: "AD 863–867",
    datetime: "0863",
    title: "The Photian Schism",
    period: "post-nicene",
    body:
      "Rome and Constantinople excommunicated one another over the patriarchate of Photius, the mission field of Bulgaria, and the filioque. It was patched up within a decade — a rehearsal for the breach that would not be."
  },
  {
    id: "great-schism",
    year: 1054,
    display: "16 July, AD 1054",
    datetime: "1054-07-16",
    title: "The Great Schism",
    period: "post-nicene",
    scene: "schism",
    body:
      "Cardinal Humbert laid a bull of excommunication on the altar of Hagia Sophia during the liturgy, and Patriarch Michael Cerularius excommunicated the legates in return. Neither side thought it final. It was."
  }
];

export function erasByPeriod(period: HistoryPeriod): HistoryEra[] {
  return ERAS.filter((e) => e.period === period);
}

/**
 * Scene ids for Act I, in narrative order. The page renders these from the
 * registry in src/components/history/scenes.tsx; the prerender reserves one
 * theatre for the whole act. Adding `scene` to an era is the only data edit a
 * new shot needs.
 */
export const ACT_ONE_SCENES: string[] = ERAS.filter(
  (e) => e.period === "pre-nicene" && e.scene
).map((e) => e.scene as string);

export type ReadLink = { href: string; name: string };

export function workRefId(ref: WorkRef): string {
  return typeof ref === "string" ? ref : ref.id;
}

/** Resolve a work reference to a deep link into the reader, or null if absent. */
export function workLink(catalog: Catalog | null, ref: WorkRef): ReadLink | null {
  if (!catalog) return null;
  const id = workRefId(ref);
  const work = catalog.works.find((w) => w.id === id);
  if (!work) return null;
  const name = typeof ref === "string" ? work.title : ref.label;
  return { href: "/read?work=" + encodeURIComponent(work.id), name };
}

export function readLinks(catalog: Catalog | null, era: HistoryEra): ReadLink[] {
  return (era.works || []).map((ref) => workLink(catalog, ref)).filter((l): l is ReadLink => l !== null);
}

export function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * The timeline as a static HTML string, for the build-time prerender.
 *
 * The React page renders the same data as JSX. Only the markup is written twice;
 * the content has one home, above.
 */
/** Cinematic-only shell for /church-history (Act I). Timeline lives on its own route. */
export function renderChurchHistoryCinematicHtml(): string {
  const out: string[] = [];
  out.push("<div class=\"ch-page ch-page--cinematic\">");
  out.push("<div class=\"ch-cinematic\">");
  out.push(
    "<div class=\"ch-theatre\" data-scene-placeholder=\"act-one\" aria-hidden=\"true\"></div>"
  );
  out.push("</div>");
  out.push("</div>");
  return out.join("\n");
}

/**
 * The timeline as a static HTML string, for the build-time prerender.
 *
 * The React page renders the same data as JSX. Only the markup is written twice;
 * the content has one home, above.
 */
export function renderChurchHistoryHtml(catalog: Catalog | null): string {
  const out: string[] = [];
  out.push("<div class=\"ch-page ch-page--timeline\">");
  out.push("<h1>" + escapeHtml(CHURCH_HISTORY_HEADING) + "</h1>");
  out.push("<p class=\"ch-lede\">" + escapeHtml(CHURCH_HISTORY_DESCRIPTION) + "</p>");

  for (const period of ["pre-nicene", "post-nicene"] as HistoryPeriod[]) {
    out.push("<section class=\"ch-period\" aria-labelledby=\"" + period + "\">");
    out.push("<h2 id=\"" + period + "\">" + escapeHtml(PERIOD_LABELS[period]) + "</h2>");
    out.push("<p class=\"ch-period-blurb\">" + escapeHtml(PERIOD_BLURBS[period]) + "</p>");
    out.push("<ol class=\"ch-timeline\">");
    for (const era of erasByPeriod(period)) {
      out.push("<li class=\"ch-era\" id=\"" + escapeHtml(era.id) + "\">");
      out.push(
        era.datetime
          ? "<p class=\"ch-era-date\"><time datetime=\"" +
              escapeHtml(era.datetime) +
              "\">" +
              escapeHtml(era.display) +
              "</time></p>"
          : "<p class=\"ch-era-date\">" + escapeHtml(era.display) + "</p>"
      );
      out.push("<h3>" + escapeHtml(era.title) + "</h3>");
      out.push("<p class=\"ch-era-body\">" + escapeHtml(era.body) + "</p>");
      if (era.refs && era.refs.length) {
        out.push("<p class=\"ch-era-refs\">" + escapeHtml(era.refs.join(" · ")) + "</p>");
      }
      const links = readLinks(catalog, era);
      if (links.length) {
        out.push(
          "<p class=\"ch-era-read\"><span class=\"ch-era-read-label\">Read:</span> " +
            links
              .map((l) => "<a href=\"" + escapeHtml(l.href) + "\">" + escapeHtml(l.name) + "</a>")
              .join(", ") +
            "</p>"
        );
      }
      out.push("</li>");
    }
    out.push("</ol>");
    out.push("</section>");
  }
  out.push("</div>");
  return out.join("\n");
}

/** Article + BreadcrumbList + ItemList, as a JSON-LD object graph. */
export function churchHistoryJsonLd(origin: string): unknown {
  const url = origin + CHURCH_HISTORY_TIMELINE_PATH;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": url + "#article",
        headline: CHURCH_HISTORY_TITLE,
        description: CHURCH_HISTORY_DESCRIPTION,
        mainEntityOfPage: url,
        inLanguage: "en",
        publisher: { "@type": "Organization", name: "Patrista", url: origin + "/" }
      },
      {
        "@type": "BreadcrumbList",
        "@id": url + "#breadcrumbs",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Patrista", item: origin + "/" },
          { "@type": "ListItem", position: 2, name: CHURCH_HISTORY_HEADING, item: url }
        ]
      },
      {
        "@type": "ItemList",
        "@id": url + "#eras",
        name: CHURCH_HISTORY_HEADING,
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        numberOfItems: ERAS.length,
        itemListElement: ERAS.map((era, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: era.title + " (" + era.display + ")",
          url: url + "#" + era.id
        }))
      }
    ]
  };
}
