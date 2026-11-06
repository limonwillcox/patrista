import type { Catalog } from "./types";

/**
 * The eras of church history, 4 BC to 1054.
 *
 * This array is the single source of truth for three renderers: the React page
 * (src/pages/ChurchHistoryPage.tsx), the build-time prerender that emits the
 * crawlable HTML (vite.config.ts), and the JSON-LD. Adding an era means adding
 * one object here and nothing else.
 *
 * Dates are the conventional ones: the Nativity about 4 BC (before Herod's death)
 * and the Passion in AD 33, one of the two years most often defended (the other
 * is AD 30). Where a date is uncertain, the era's prose says so.
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
export const CHURCH_HISTORY_TITLE = "Church History Timeline: From Christ to the Great Schism";
/** The /church-history/ intro page; distinct from the timeline so the two never share a title or description. */
export const CHURCH_HISTORY_INTRO_TITLE = "Church History: Pentecost to the Great Schism";
export const CHURCH_HISTORY_INTRO_DESCRIPTION =
  "The story of the early Church from Pentecost to the Great Schism of 1054, told era by era, with the Church Fathers' own words at each turning point.";
export const CHURCH_HISTORY_HEADING = "Church history timeline";
export const CHURCH_HISTORY_DESCRIPTION =
  "A timeline of church history from the birth of Christ to the Great Schism of 1054: persecutions, Nicaea, and the councils, linked to the Fathers' own words.";

export const PERIOD_LABELS: Record<HistoryPeriod, string> = {
  "pre-nicene": "Before Nicaea",
  "post-nicene": "After Nicaea"
};

export const PERIOD_BLURBS: Record<HistoryPeriod, string> = {
  "pre-nicene":
    "From the Nativity to the council of 325: a church without legal standing for most of this time, spreading under an empire that at times tried to end it.",
  "post-nicene":
    "From 325 to the Great Schism of 1054: a church with imperial support, working out in creeds and councils what it had confessed, and slowly dividing."
};

export const ERAS: HistoryEra[] = [
  {
    id: "nativity",
    year: -4,
    display: "c. 4 BC",
    title: "The Birth of Christ",
    period: "pre-nicene",
    refs: ["Matthew 2:1–18", "Luke 2:1–20"],
    body:
      "The Nativity is usually dated about 6 to 4 BC. Matthew and Luke place it before the death of Herod the Great, which most historians date to 4 BC on the evidence of Josephus, and Matthew's account of the children of Bethlehem two years old and under points to a birth a little earlier still."
  },
  {
    id: "ministry",
    year: 29,
    display: "c. AD 28–29",
    datetime: "0029",
    title: "The Ministry Begins",
    period: "pre-nicene",
    refs: ["Luke 3:1–23"],
    body:
      "Luke dates the preaching of John the Baptist to the fifteenth year of Tiberius Caesar, usually reckoned as AD 28 or 29, and Jesus was baptised soon after. John's Gospel, with its several Passovers, suggests a public ministry of two to three years."
  },
  {
    id: "crucifixion",
    year: 33,
    display: "AD 33 (or 30)",
    datetime: "0033",
    title: "The Crucifixion and Resurrection",
    period: "pre-nicene",
    refs: ["Matthew 27–28", "1 Corinthians 15:3–8"],
    body:
      "AD 30 and AD 33 are the two years most often defended for the Passion, because in those years the Passover could fall on a Friday as the Gospels require. This timeline follows AD 33, in which the Friday would be 3 April, with the Resurrection on the Sunday following."
  },
  {
    id: "pentecost",
    year: 33,
    display: "AD 33",
    datetime: "0033",
    title: "Pentecost",
    period: "pre-nicene",
    scene: "pentecost",
    refs: ["Acts 1:15", "Acts 2:1–4", "Acts 2:41"],
    body:
      "On the day of Pentecost, fifty days after the Passover, the Spirit came upon the disciples gathered in Jerusalem — a company Acts numbers at about a hundred and twenty a few days before. First came a sound as of a rushing mighty wind, then cloven tongues like as of fire, resting upon each of them. Peter preached, and about three thousand were added that day. Christian tradition counts this as the birthday of the church."
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
      "The narrative of Acts runs out with Paul in Rome, under house arrest but preaching without hindrance, about thirty years after Pentecost. Its silence about Nero's persecution, the deaths of Peter and Paul, and the fall of Jerusalem is the main argument for an early date of composition, though many scholars date the book later."
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
      "After the Great Fire of Rome, Nero fastened the blame on the Christians; Tacitus describes them wrapped in the skins of beasts and torn by dogs, or set alight to light his gardens. Tradition places the martyrdoms of Peter and Paul in the years that followed. It is the first known persecution of Christians by the Roman state."
  },
  {
    id: "jerusalem",
    year: 70,
    display: "AD 70",
    datetime: "0070",
    title: "The Fall of Jerusalem",
    period: "pre-nicene",
    scene: "jerusalem",
    refs: ["Matthew 24:1–2", "Luke 21:20–24"],
    works: ["wars-of-the-jews", "church-history"],
    body:
      "Titus took Jerusalem after a siege of five months, and the Second Temple burned in the month of Av — on the ninth by Jewish reckoning, the tenth according to Josephus, who was there and wrote the history of the war. Christ had foretold that not one stone of the Temple would be left upon another, and the Fathers, Eusebius among them, read the siege as the fulfilment of that warning."
  },
  {
    id: "apostolic-fathers",
    year: 96,
    display: "c. AD 96–156",
    datetime: "0096",
    title: "The Apostolic Fathers",
    period: "pre-nicene",
    scene: "apostolic-fathers",
    works: ["first-epistle-of-clement", "epistles-of-ignatius", "martyrdom-of-polycarp"],
    body:
      "The generation after the apostles wrote to steady the churches. Clement of Rome wrote to Corinth, traditionally about 96. Ignatius of Antioch wrote seven letters on the road to his death at Rome, traditionally about 110. Polycarp of Smyrna, whom Irenaeus remembered as a hearer of John, was put to death about 155–156. Told to curse Christ, he answered, “Eighty and six years have I served Him”; when the fire did not consume him, an executioner killed him with a dagger."
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
      "Justin Martyr addressed his defence of the faith to the emperor himself and died for it about 165. Marcion, the Gnostics, and the Montanists pressed the churches to say what they actually held; Irenaeus answered in Against Heresies about 180, setting out the rule of faith and the four Gospels, and that pressure helped to shape the New Testament canon. Tertullian, writing about 197, gave the age its best-known line: “the blood of Christians is seed”, remembered as “the blood of the martyrs is the seed of the church.”"
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
      "Clement of Alexandria taught there at the end of the second century, and Origen after him led the catechetical school, as Eusebius tells it, reading Scripture alongside Greek philosophy. Origen's Hexapla set the Hebrew Old Testament, a Greek transliteration, and four Greek versions side by side in six columns. He was tortured in the Decian persecution, survived it, and died a few years later, about 254."
  },
  {
    id: "decian",
    year: 250,
    display: "AD 250",
    datetime: "0250",
    title: "The Decian Persecution",
    period: "pre-nicene",
    scene: "persecution",
    works: ["on-the-lapsed", "epistles-of-cyprian"],
    body:
      "Decius required every inhabitant of the empire to sacrifice to the gods and to obtain a certificate saying so. The order was not aimed at Christians alone, but it was the first empire-wide demand of its kind, and a great many Christians lapsed. Refusal brought prison, exile, and for some, death. How to receive the lapsed back occupied Cyprian of Carthage for years; he was beheaded under Valerian in 258."
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
    works: ["life-of-constantine", "of-the-manner-in-which-the-persecutors-died", "church-history"],
    body:
      "Before the battle for Rome, Constantine marked his soldiers' shields with a Christian sign, formed from the first letters of Christ's name in Greek. The two witnesses disagree about how it came to him. Lactantius, writing within a few years, says he was told in a dream to mark the shields. Eusebius, in the Life of Constantine written after the emperor's death, describes a cross of light seen in the sky with the words “by this, conquer” — in hoc signo vinces in the Latin it is remembered by. Maxentius drowned in the Tiber, and Constantine took Rome."
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
      "Constantine and Licinius agreed to grant Christians, and everyone else, the free exercise of religion, and ordered confiscated church property returned. The text survives as a letter Licinius issued in 313. Persecution had come and gone for two and a half centuries; in the West it did not return, though Licinius later turned against the Christians of the East."
  },
  {
    id: "nicaea",
    year: 325,
    display: "AD 325",
    datetime: "0325",
    title: "The Council of Nicaea",
    period: "pre-nicene",
    scene: "nicaea",
    works: ["first-ecumenical-council-nicea-i-325", "defense-of-the-nicene-definition-de-decretis", "four-discourses-against-the-arians"],
    body:
      "Constantine summoned the bishops to settle the dispute over Arius, who taught that the Son was a creature. The council answered that the Son is homoousios, of one substance with the Father, and ruled also on the date of Easter. It did not end the controversy: parties opposed to Nicaea held the upper hand for much of the next fifty years, and Athanasius was exiled five times for defending it. Historians date the ante-Nicene and post-Nicene Fathers from this council."
  },
  {
    id: "constantinople",
    year: 381,
    display: "AD 381",
    datetime: "0381",
    title: "The First Council of Constantinople",
    period: "post-nicene",
    works: ["second-ecumenical-council-constantinople-i-381", "basil-on-the-holy-spirit", "last-farewell-in-the-presence-of-the-one-hundred-and-fifty-bishops-oration-xlii"],
    body:
      "A second council, at Constantinople, reaffirmed the faith of Nicaea. The creed recited today as the Nicene Creed is traditionally assigned to this council, though it is first recorded in the acts of Chalcedon in 451; it enlarges the article on the Holy Spirit. Gregory of Nazianzus presided for a time and Gregory of Nyssa attended. Basil, whose book On the Holy Spirit had prepared the ground, had died shortly before."
  },
  {
    id: "vulgate",
    year: 382,
    display: "c. AD 382–405",
    datetime: "0382",
    title: "Jerome's Vulgate",
    period: "post-nicene",
    works: ["prefaces-to-the-books-of-the-vulgate", { id: "jerome-letters", label: "Jerome's Letters" }],
    body:
      "Pope Damasus asked Jerome to revise the Latin Gospels, about 383. After Damasus died, Jerome went on at Bethlehem to translate most of the Old Testament from the Hebrew rather than the Greek, a decision that troubled Augustine. The Vulgate that grew from his work, with books revised or left by other hands, was the Bible of the West for a thousand years."
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
      "Alaric's Goths took the city, and pagans said Rome had fallen because it had abandoned its gods. Augustine answered with The City of God, written over some thirteen years, which sets the earthly city against the city of God and reads all history in their light."
  },
  {
    id: "ephesus",
    year: 431,
    display: "AD 431",
    datetime: "0431",
    title: "The Council of Ephesus",
    period: "post-nicene",
    works: ["third-ecumenical-council-ephesus-431"],
    body:
      "The council condemned Nestorius and affirmed Mary as Theotokos, God-bearer — a statement about Christ before it is one about his mother. The Church of the East, already organised apart from the churches of the Roman Empire, never accepted the council, and by the 480s had adopted its own teaching about Christ."
  },
  {
    id: "chalcedon",
    year: 451,
    display: "AD 451",
    datetime: "0451",
    title: "The Council of Chalcedon",
    period: "post-nicene",
    works: ["fourth-ecumenical-council-chalcedon-451"],
    body:
      "Chalcedon defined Christ as one person in two natures, without confusion and without division, following Leo's Tome. The churches that rejected it — today the Coptic, Syriac, Armenian, and Ethiopian Orthodox — drew apart over the following century. That division is older than 1054 and has not been healed, though modern joint statements have found much agreement about Christ."
  },
  {
    id: "fall-west",
    year: 476,
    display: "AD 476",
    datetime: "0476",
    title: "The Western Empire Ends",
    period: "post-nicene",
    body:
      "Odoacer deposed Romulus Augustulus and sent the imperial regalia to Constantinople. In the West, bishops increasingly took on the work of civic leaders, and much of Latin learning survived in the church."
  },
  {
    id: "benedict",
    year: 530,
    display: "c. AD 530",
    datetime: "0530",
    title: "The Rule of St Benedict",
    period: "post-nicene",
    body:
      "Benedict wrote a short and notably moderate rule for his monastery at Monte Cassino: prayer, work, and stability under an abbot. It was one rule among several in its day; under the Carolingians, from the ninth century, it became the standard rule of Western monasticism. Monastic copying, urged also by Cassiodorus at Vivarium, preserved much of ancient literature."
  },
  {
    id: "hagia-sophia",
    year: 537,
    display: "AD 537",
    datetime: "0537",
    title: "Hagia Sophia",
    period: "post-nicene",
    body:
      "Justinian rebuilt the great church of Constantinople in under six years, roofing it with a dome that seemed to Procopius to hang from heaven by a golden chain. That first dome fell in 558 and was rebuilt. Hagia Sophia remained the largest cathedral in the world for nearly a thousand years."
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
      "Gregory governed a Rome that the emperors in Constantinople could barely defend, wrote the Pastoral Rule for bishops, and in 596 sent Augustine of Canterbury with a mission to the English, who landed in Kent in 597. Later popes looked back to him as their model."
  },
  {
    id: "eastern-sees",
    year: 637,
    display: "AD 637–641",
    datetime: "0637",
    title: "The Eastern Sees Are Lost",
    period: "post-nicene",
    body:
      "Antioch fell to the Arab armies in 637, Jerusalem in 638, Alexandria in 641, and North Africa by the end of the century. Christians and their patriarchs lived on under Muslim rule, but three of the five ancient patriarchates passed out of the empire, and Rome and Constantinople were left as the two great centres of Christendom."
  },
  {
    id: "iconoclasm",
    year: 726,
    display: "c. AD 726–843",
    datetime: "0726",
    title: "The Iconoclast Controversy",
    period: "post-nicene",
    works: ["seventh-ecumenical-council-nicea-ii-787", "exposition-of-the-orthodox-faith"],
    body:
      "Iconoclasm began under Leo III in the 720s or 730s. Twice the emperors ordered the images destroyed, and twice they were restored — at the Second Council of Nicaea in 787, and finally in 843. John of Damascus, writing safely outside the empire, argued that the invisible God, having become visible in the flesh, may be depicted, and that matter is to be honoured because God worked our salvation through it."
  },
  {
    id: "charlemagne",
    year: 800,
    display: "AD 800",
    datetime: "0800",
    title: "Charlemagne Crowned",
    period: "post-nicene",
    body:
      "On Christmas Day Leo III crowned Charlemagne emperor — in Byzantine eyes, the theft of an office that already had a holder. The Frankish church also sang the creed with filioque, “and the Son”, a word Constantinople had never agreed to; Leo himself refused to add it to the creed at Rome, which did not adopt it until 1014. Both the political and the doctrinal quarrels that later divided East and West are visible here."
  },
  {
    id: "slavs",
    year: 863,
    display: "AD 863",
    datetime: "0863",
    title: "Cyril and Methodius",
    period: "post-nicene",
    body:
      "Sent from Constantinople to Moravia, the brothers devised an alphabet and translated the liturgy and the Scriptures into Slavonic. The Moravian mission did not outlast the 880s, but their disciples carried Slavonic Christianity to Bulgaria, and the baptism of Rus' in 988 brought the East Slavs into the church of Constantinople."
  },
  {
    id: "photian",
    year: 863,
    display: "AD 863–867",
    datetime: "0863",
    title: "The Photian Schism",
    period: "post-nicene",
    body:
      "Rome and Constantinople excommunicated one another over the patriarchate of Photius, the mission field of Bulgaria, and the filioque. The breach was settled at a council in Constantinople in 879–880."
  },
  {
    id: "great-schism",
    year: 1054,
    display: "AD 1054",
    datetime: "1054",
    title: "The Great Schism",
    period: "post-nicene",
    scene: "schism",
    body:
      "Cardinal Humbert laid a bull of excommunication on the altar of Hagia Sophia during the liturgy, and Patriarch Michael Cerularius excommunicated the legates in return. The sentences fell on persons, not churches, and the pope who sent the legates had already died, so few at the time saw the breach as final. It hardened over the following centuries, above all after the Crusaders sacked Constantinople in 1204. The excommunications were lifted in 1965."
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
