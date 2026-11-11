import type { Author } from "./types";

/**
 * People named on the Migne volumes being fetched (PG 3–4 and 25–117, PL 9–139).
 * They join the Fathers catalog with a life and no works. The OCR stays in
 * Fathers/Migne and is not a book on the shelf.
 *
 * Left out, because the volume is not one person:
 * Egyptian Fathers (PG 40), the Paschal Chronicle (PG 92), Theophanes Continuatus (PG 109),
 * Lives of the Fathers (PL 73–74), the Mozarabic liturgy (PL 85–86),
 * "Authors of the sixth and seventh centuries" (PL 80), "Authors of the seventh century" (PL 87),
 * Pseudo-Isidore (PL 130), and the forged chronicle of Flavius Lucius Dexter (PL 31).
 * Volumes labeled "and others" contribute only the named lead.
 * People already in the catalog (Ambrose, Augustine, Jerome, and the rest) are not repeated.
 */
export type MigneFather = {
  id: string;
  name: string;
  dates: string;
  region: string;
  deathYear: number;
  office: string;
  paragraphs: string[];
};

export const MIGNE_FATHERS: MigneFather[] = [
  {
    id: "pseudo_dionysius",
    name: "Pseudo-Dionysius the Areopagite",
    dates: "fl. c. 500",
    region: "Syria",
    deathYear: 520,
    office: "Unknown writer",
    paragraphs: [
      "The works that bear the name of Dionysius the Areopagite were written in Greek by an unknown author, usually placed in the late fifth or early sixth century. He wrote as if he were the Athenian convert of Acts 17.",
      "The Divine Names, the Mystical Theology, the Celestial Hierarchy, and the Ecclesiastical Hierarchy became a standard way for later Greek and Latin writers to speak of God and of the church’s worship. Patrologia Graeca 3–4 prints them."
    ]
  },
  {
    id: "macarius_egypt",
    name: "Macarius of Egypt",
    dates: "c. 300–390",
    region: "Egypt",
    deathYear: 390,
    office: "Monk of Scetis",
    paragraphs: [
      "Macarius of Egypt (c. 300–390), called the Great, was a monk in Scetis. The sayings of the desert remember him as a teacher of prayer.",
      "The fifty homilies printed under his name are a later ascetic collection. They are not his sermons. Migne files them with him in Patrologia Graeca 34."
    ]
  },
  {
    id: "didymus",
    name: "Didymus the Blind",
    dates: "c. 313–398",
    region: "Egypt",
    deathYear: 398,
    office: "Teacher at Alexandria",
    paragraphs: [
      "Didymus the Blind (c. 313–398) lost his sight as a child and taught in Alexandria for most of the fourth century. Jerome and Rufinus studied with him.",
      "He wrote commentaries and a treatise On the Holy Spirit, which survives in Jerome’s Latin. Later councils condemned him with Origen. Patrologia Graeca 39 prints what Migne had of him."
    ]
  },
  {
    id: "epiphanius",
    name: "Epiphanius of Salamis",
    dates: "c. 315–403",
    region: "Cyprus",
    deathYear: 403,
    office: "Bishop of Salamis",
    paragraphs: [
      "Epiphanius of Salamis (c. 315–403) was bishop of Constantia, the city also called Salamis, on Cyprus. He had been a monk in Palestine and Egypt.",
      "The Panarion is his catalogue of heresies, from the early sects through the arguments of his own day. The Ancoratus is a shorter statement of the faith. Both are in Patrologia Graeca 41–43."
    ]
  },
  {
    id: "severian",
    name: "Severian of Gabala",
    dates: "fl. c. 400",
    region: "Syria",
    deathYear: 408,
    office: "Bishop of Gabala",
    paragraphs: [
      "Severian of Gabala (fl. c. 400) was bishop of Gabala in Syria and a preacher in Constantinople. He and John Chrysostom fell out, and Severian took the side of the court against him.",
      "Homilies survive under his name, some of them long attributed to Chrysostom. Patrologia Graeca 65 prints him with other short Greek pieces of the same years."
    ]
  },
  {
    id: "theodore_mopsuestia",
    name: "Theodore of Mopsuestia",
    dates: "c. 350–428",
    region: "Cilicia",
    deathYear: 428,
    office: "Bishop of Mopsuestia",
    paragraphs: [
      "Theodore of Mopsuestia (c. 350–428) was bishop of Mopsuestia in Cilicia and a leading teacher of the school of Antioch. John Chrysostom was his fellow student.",
      "He commented on much of Scripture and wrote on the incarnation. The council of Constantinople in 553 condemned him. Patrologia Graeca 66 holds the Greek and Latin that Migne could gather."
    ]
  },
  {
    id: "cyril_alexandria",
    name: "Cyril of Alexandria",
    dates: "c. 376–444",
    region: "Egypt",
    deathYear: 444,
    office: "Bishop of Alexandria",
    paragraphs: [
      "Cyril of Alexandria (c. 376–444) was bishop of Alexandria from 412. He led the case against Nestorius at the council of Ephesus in 431.",
      "His letters, the commentaries on John and Luke, and the treatises on the right faith in Christ are among the main Greek sources for that debate. They fill Patrologia Graeca 68–77."
    ]
  },
  {
    id: "isidore_pelusium",
    name: "Isidore of Pelusium",
    dates: "d. c. 450",
    region: "Egypt",
    deathYear: 450,
    office: "Monk of Pelusium",
    paragraphs: [
      "Isidore of Pelusium (d. c. 450) was a monk near the eastern mouth of the Nile. He had been trained in rhetoric.",
      "About two thousand of his letters survive. They answer questions of Scripture, church order, and conduct, and they are a main source for Egyptian church life in his generation. Migne prints them in Patrologia Graeca 78."
    ]
  },
  {
    id: "nilus",
    name: "Nilus of Ancyra",
    dates: "d. c. 430",
    region: "Asia Minor",
    deathYear: 430,
    office: "Monk of Ancyra",
    paragraphs: [
      "Nilus of Ancyra (d. c. 430) was a monk and a correspondent of his generation. Later tradition called him Nilus of Sinai, which is the name on Migne’s title page.",
      "Ascetic treatises and a large letter collection circulate under his name. Some of the letters are later. Patrologia Graeca 79 is his volume."
    ]
  },
  {
    id: "basil_seleucia",
    name: "Basil of Seleucia",
    dates: "d. c. 468",
    region: "Isauria",
    deathYear: 468,
    office: "Bishop of Seleucia",
    paragraphs: [
      "Basil of Seleucia (d. c. 468) was bishop of Seleucia in Isauria. He took part in the councils of Ephesus in 449 and Chalcedon in 451, and he changed sides between them.",
      "Sermons of his survive, including a series on the life of Christ. Patrologia Graeca 85 prints him with other Greek homilies of the fifth century."
    ]
  },
  {
    id: "procopius_gaza",
    name: "Procopius of Gaza",
    dates: "c. 465–c. 528",
    region: "Palestine",
    deathYear: 528,
    office: "Teacher at Gaza",
    paragraphs: [
      "Procopius of Gaza (c. 465–c. 528) taught rhetoric at Gaza. He is not the historian Procopius of Caesarea.",
      "He wrote commentaries on the Octateuch, Kings, Isaiah, and the Song of Songs, often by collecting earlier remarks, and a description of a clock in Gaza. Patrologia Graeca 87 is his volume."
    ]
  },
  {
    id: "olympiodorus",
    name: "Olympiodorus of Alexandria",
    dates: "fl. early 6th c.",
    region: "Egypt",
    deathYear: 530,
    office: "Deacon of Alexandria",
    paragraphs: [
      "Olympiodorus of Alexandria (fl. early 6th c.) was a deacon. He is one of the commentators Migne groups in Patrologia Graeca 93.",
      "Commentaries on Job, Ecclesiastes, and Jeremiah survive under his name. They gather earlier Greek remarks on those books."
    ]
  },
  {
    id: "hesychius",
    name: "Hesychius of Jerusalem",
    dates: "d. c. 451",
    region: "Palestine",
    deathYear: 451,
    office: "Priest of Jerusalem",
    paragraphs: [
      "Hesychius of Jerusalem (d. after 451) was a priest and preacher in Jerusalem. He was alive at the time of Chalcedon.",
      "Commentaries and sermons of his survive, in Greek and in later translations. Migne prints him with Olympiodorus and Leontius in Patrologia Graeca 93."
    ]
  },
  {
    id: "john_climacus",
    name: "John Climacus",
    dates: "c. 579–649",
    region: "Sinai",
    deathYear: 649,
    office: "Abbot of Sinai",
    paragraphs: [
      "John Climacus (traditionally c. 579–649) was a monk and then abbot at Sinai. The dates are the ones later writers give him.",
      "The Ladder of Divine Ascent is his guide for monks, in thirty steps. It became a standard book of Greek monastic life. Patrologia Graeca 88 prints it."
    ]
  },
  {
    id: "anastasius_sinai",
    name: "Anastasius of Sinai",
    dates: "d. c. 700",
    region: "Sinai",
    deathYear: 700,
    office: "Monk of Sinai",
    paragraphs: [
      "Anastasius of Sinai (d. c. 700) was a monk at Sinai in the late seventh century. He wrote after the Arab conquest of the East.",
      "The Hodegos is his guide against Monophysite teaching. Questions and answers, and sermons, also bear his name. They are in Patrologia Graeca 89."
    ]
  },
  {
    id: "maximus",
    name: "Maximus the Confessor",
    dates: "c. 580–662",
    region: "Constantinople",
    deathYear: 662,
    office: "Monk and confessor",
    paragraphs: [
      "Maximus the Confessor (c. 580–662) was a monk who opposed the imperial attempt to settle the argument over Christ by forbidding talk of one or two wills. He died in exile after mutilation.",
      "The Ambigua, the questions to Thalassius, and the short theological works are his main books. Patrologia Graeca 90–91 prints them."
    ]
  },
  {
    id: "john_malalas",
    name: "John Malalas",
    dates: "d. c. 578",
    region: "Antioch",
    deathYear: 578,
    office: "Chronicler",
    paragraphs: [
      "John Malalas (d. c. 578) wrote a Greek chronicle in Antioch and Constantinople. It runs from creation into the reign of Justinian.",
      "The chronicle is a main, if uneven, source for how a sixth-century city told the past. Migne prints it with Andrew of Crete in Patrologia Graeca 97."
    ]
  },
  {
    id: "andrew_crete",
    name: "Andrew of Crete",
    dates: "c. 660–740",
    region: "Crete",
    deathYear: 740,
    office: "Bishop of Crete",
    paragraphs: [
      "Andrew of Crete (c. 660–740) was bishop of Gortyna. He had served in Jerusalem and Constantinople.",
      "The Great Canon, sung in Lent, is his best-known work, with sermons for the feasts. Patrologia Graeca 97 prints him with the chronicle of John Malalas."
    ]
  },
  {
    id: "germanus",
    name: "Germanus of Constantinople",
    dates: "c. 634–c. 740",
    region: "Constantinople",
    deathYear: 740,
    office: "Bishop of Constantinople",
    paragraphs: [
      "Germanus of Constantinople (c. 634–c. 740) was bishop of Constantinople from 715 until Emperor Leo III deposed him in 730 over the icons.",
      "Sermons and letters of his survive, including a defense of the images. On the Divine Liturgy explains the service. Patrologia Graeca 98 is his volume."
    ]
  },
  {
    id: "theodore_studite",
    name: "Theodore the Studite",
    dates: "759–826",
    region: "Constantinople",
    deathYear: 826,
    office: "Abbot of the Studion",
    paragraphs: [
      "Theodore the Studite (759–826) was abbot of the Studion monastery in Constantinople. He resisted imperial interference in the church and the ban on icons, and he was exiled more than once.",
      "His catecheses, letters, and poems organized Studite monastic life and argued for the images. They fill Patrologia Graeca 99."
    ]
  },
  {
    id: "theophanes",
    name: "Theophanes the Confessor",
    dates: "c. 760–818",
    region: "Constantinople",
    deathYear: 818,
    office: "Monk and chronicler",
    paragraphs: [
      "Theophanes the Confessor (c. 760–818) was a monk near Constantinople. He kept the defense of the icons and died in exile.",
      "His Chronicle continues that of George Syncellus from Diocletian to 813. It is a main Greek source for those centuries. Patrologia Graeca 108 prints it."
    ]
  },
  {
    id: "nikephoros",
    name: "Nikephoros of Constantinople",
    dates: "c. 758–828",
    region: "Constantinople",
    deathYear: 828,
    office: "Bishop of Constantinople",
    paragraphs: [
      "Nikephoros of Constantinople (c. 758–828) was bishop of Constantinople from 806 until the iconoclast emperor Leo V deposed him in 815.",
      "He wrote a short history of the years after 602 and treatises against the iconoclasts. Patrologia Graeca 100 is his volume."
    ]
  },
  {
    id: "photius",
    name: "Photius of Constantinople",
    dates: "c. 810–c. 893",
    region: "Constantinople",
    deathYear: 893,
    office: "Bishop of Constantinople",
    paragraphs: [
      "Photius of Constantinople (c. 810–c. 893) was bishop of Constantinople in two periods, 858–867 and 877–886. His tenure strained relations with Rome.",
      "The Bibliotheca reviews books he had read. The Amphilochia answers questions of Scripture and theology, and his letters deal with the mission to the Slavs and with the Roman see. Patrologia Graeca 101–104 prints him."
    ]
  },
  {
    id: "joseph_hymnographer",
    name: "Joseph the Hymnographer",
    dates: "c. 816–886",
    region: "Constantinople",
    deathYear: 886,
    office: "Hymn writer",
    paragraphs: [
      "Joseph the Hymnographer (c. 816–886) was a Sicilian who became a monk in Constantinople. He spent part of his life in captivity.",
      "He wrote canons for the saints’ days of the Greek church year. Patrologia Graeca 105 prints a portion of them."
    ]
  },
  {
    id: "george_monk",
    name: "George the Monk",
    dates: "fl. mid-9th c.",
    region: "Constantinople",
    deathYear: 867,
    office: "Chronicler",
    paragraphs: [
      "George the Monk, also called Hamartolos, wrote in the middle of the ninth century. Little else is known of his life.",
      "His chronicle runs from creation to 842 and was widely copied and continued. Patrologia Graeca 110 prints it."
    ]
  },
  {
    id: "nicholas_mystikos",
    name: "Nicholas Mystikos",
    dates: "852–925",
    region: "Constantinople",
    deathYear: 925,
    office: "Bishop of Constantinople",
    paragraphs: [
      "Nicholas Mystikos (852–925) was bishop of Constantinople from 901 to 907 and again from 912 until his death. He had been a friend of Photius.",
      "His letters deal with the emperor, with Symeon of Bulgaria, and with the sack of Thessalonica in 904. Patrologia Graeca 111 prints them."
    ]
  },
  {
    id: "arethas",
    name: "Arethas of Caesarea",
    dates: "c. 860–c. 939",
    region: "Cappadocia",
    deathYear: 939,
    office: "Bishop of Caesarea",
    paragraphs: [
      "Arethas of Caesarea (c. 860–c. 939) was bishop of Caesarea in Cappadocia. He had studied in Constantinople and commissioned important manuscripts of classical and Christian authors.",
      "Commentaries on the Apocalypse and on Plato, and a set of letters and speeches, survive. Patrologia Graeca 106 is his volume."
    ]
  },
  {
    id: "leo_vi",
    name: "Leo VI",
    dates: "866–912",
    region: "Constantinople",
    deathYear: 912,
    office: "Emperor",
    paragraphs: [
      "Leo VI (866–912), called the Wise, was emperor in Constantinople from 886. He is the author of the legal and homiletic texts Migne prints under his name, not a bishop.",
      "Novels, a military manual, hymns, and sermons are attributed to him. Patrologia Graeca 107 prints the ecclesiastical part of that set."
    ]
  },
  {
    id: "constantine_vii",
    name: "Constantine VII",
    dates: "905–959",
    region: "Constantinople",
    deathYear: 959,
    office: "Emperor",
    paragraphs: [
      "Constantine VII Porphyrogenitus (905–959) was emperor in Constantinople. He wrote and commissioned books of court and provincial administration.",
      "On the Themes, On the Administration of the Empire, and the Book of Ceremonies are the works associated with him. Patrologia Graeca 112–113 prints them."
    ]
  },
  {
    id: "symeon_metaphrastes",
    name: "Symeon Metaphrastes",
    dates: "d. c. 1000",
    region: "Constantinople",
    deathYear: 1000,
    office: "Hagiographer",
    paragraphs: [
      "Symeon Metaphrastes (d. c. 1000) worked in Constantinople in the later tenth century. Few facts of his life are secure. He is not the same man as the earlier chronicler Symeon the Logothete.",
      "His menologion retells saints’ lives in a uniform style for the church year. It is the standard medieval Greek collection of those lives. Patrologia Graeca 114–116 prints it."
    ]
  },
  {
    id: "basil_ii",
    name: "Basil II",
    dates: "958–1025",
    region: "Constantinople",
    deathYear: 1025,
    office: "Emperor",
    paragraphs: [
      "Basil II (958–1025) was emperor in Constantinople. The menologion that bears his name was made for his reign.",
      "Patrologia Graeca 117 prints that collection of short saints’ lives. Basil is the patron named on the volume, not the writer of each life."
    ]
  },
  {
    id: "zeno_verona",
    name: "Zeno of Verona",
    dates: "d. c. 371",
    region: "Italy",
    deathYear: 371,
    office: "Bishop of Verona",
    paragraphs: [
      "Zeno of Verona (d. c. 371) was bishop of Verona in the middle of the fourth century. He was a contemporary of the Arian controversy in Italy.",
      "About ninety sermons survive, many of them short notes for baptismal instruction. Patrologia Latina 11 prints them."
    ]
  },
  {
    id: "eusebius_vercelli",
    name: "Eusebius of Vercelli",
    dates: "c. 283–371",
    region: "Italy",
    deathYear: 371,
    office: "Bishop of Vercelli",
    paragraphs: [
      "Eusebius of Vercelli (c. 283–371) was bishop of Vercelli. He was exiled for refusing the Arianizing creed pressed at Milan in 355.",
      "Three letters of his survive, with a treatise on the Trinity that later manuscripts attribute to him. Patrologia Latina 12 prints that set."
    ]
  },
  {
    id: "damasus",
    name: "Damasus I",
    dates: "c. 305–384",
    region: "Rome",
    deathYear: 384,
    office: "Bishop of Rome",
    paragraphs: [
      "Damasus I (c. 305–384) was bishop of Rome from 366. His election was contested, and he spent his episcopate consolidating the Roman see.",
      "He composed verse inscriptions for the martyrs’ tombs and corresponded with Jerome, whom he set to work revising the Latin Bible. Patrologia Latina 13 prints the poems and letters."
    ]
  },
  {
    id: "ulfilas",
    name: "Ulfilas",
    dates: "c. 311–383",
    region: "The Goths",
    deathYear: 383,
    office: "Bishop of the Goths",
    paragraphs: [
      "Ulfilas (c. 311–383) was bishop among the Goths and an Arian. He translated the Bible into Gothic, leaving out the books of Kings, which he thought too warlike.",
      "What remains of that translation, and the Arian creed associated with him, is printed in Patrologia Latina 18. He is not a catholic father."
    ]
  },
  {
    id: "juvencus",
    name: "Juvencus",
    dates: "fl. c. 330",
    region: "Spain",
    deathYear: 330,
    office: "Priest and poet",
    paragraphs: [
      "Juvencus (fl. c. 330) was a priest in Spain. He wrote under Constantine.",
      "His Evangeliorum libri retells the Gospel story in Latin hexameters, the first long Christian biblical epic. Patrologia Latina 19 prints it."
    ]
  },
  {
    id: "marius_mercator",
    name: "Marius Mercator",
    dates: "fl. c. 430",
    region: "Latin West",
    deathYear: 450,
    office: "Lay theologian",
    paragraphs: [
      "Marius Mercator (fl. c. 430) was a Latin writer, active against Pelagian and Nestorian teaching. He seems to have lived for a time in Thrace.",
      "He translated Greek dossiers of those controversies into Latin. Patrologia Latina 48 prints his memoranda and translations."
    ]
  },
  {
    id: "prosper",
    name: "Prosper of Aquitaine",
    dates: "c. 390–c. 455",
    region: "Gaul",
    deathYear: 455,
    office: "Theologian",
    paragraphs: [
      "Prosper of Aquitaine (c. 390–c. 455) was a layman of Aquitaine who defended Augustine’s teaching on grace against the monks of Marseille. He later served in Rome under Leo.",
      "The poem On the Ungrateful, the chronicle, and the book of sentences drawn from Augustine are his main works. Patrologia Latina 51 prints them."
    ]
  },
  {
    id: "peter_chrysologus",
    name: "Peter Chrysologus",
    dates: "c. 380–c. 450",
    region: "Italy",
    deathYear: 450,
    office: "Bishop of Ravenna",
    paragraphs: [
      "Peter Chrysologus (c. 380–c. 450) was bishop of Ravenna. The name means “golden-worded” and was given for his preaching.",
      "More than a hundred short sermons survive, most of them on the Gospels and the creed. Patrologia Latina 52 prints them."
    ]
  },
  {
    id: "claudianus_mamertus",
    name: "Claudianus Mamertus",
    dates: "d. c. 474",
    region: "Gaul",
    deathYear: 474,
    office: "Priest of Vienne",
    paragraphs: [
      "Claudianus Mamertus (d. c. 474) was a priest at Vienne in Gaul and the brother of Bishop Mamertus. Sidonius Apollinaris corresponded with him.",
      "On the State of the Soul argues that the soul is incorporeal. Patrologia Latina 53 prints it with other short Gallic pieces."
    ]
  },
  {
    id: "maximus_turin",
    name: "Maximus of Turin",
    dates: "d. c. 420",
    region: "Italy",
    deathYear: 420,
    office: "Bishop of Turin",
    paragraphs: [
      "Maximus of Turin (d. between 408 and 423) was bishop of Turin. He preached through the years when Gothic armies were in Italy.",
      "A large sermon collection survives. Later copyists mixed other preachers into it. Patrologia Latina 57 prints the collection Migne had."
    ]
  },
  {
    id: "hilary_rome",
    name: "Hilary of Rome",
    dates: "d. 468",
    region: "Rome",
    deathYear: 468,
    office: "Bishop of Rome",
    paragraphs: [
      "Hilary of Rome (d. 468) was bishop of Rome from 461. He is not Hilary of Poitiers.",
      "Letters of his survive from the arguments over bishops in Gaul and Spain. Patrologia Latina 58 prints them."
    ]
  },
  {
    id: "gelasius",
    name: "Gelasius I",
    dates: "d. 496",
    region: "Rome",
    deathYear: 496,
    office: "Bishop of Rome",
    paragraphs: [
      "Gelasius I (d. 496) was bishop of Rome from 492. He wrote during the Acacian schism between Rome and Constantinople.",
      "His letters distinguish the work of priests and emperors, and a list of received and rejected books circulated under his name. Patrologia Latina 59 prints that set."
    ]
  },
  {
    id: "prudentius",
    name: "Prudentius",
    dates: "348–c. 413",
    region: "Spain",
    deathYear: 413,
    office: "Poet",
    paragraphs: [
      "Prudentius (348–c. 413) was a Spanish official who turned to Christian poetry late in life. He published a collected edition of his poems in 405.",
      "The Cathemerinon, the Peristephanon on the martyrs, and the Psychomachia are the main books. Patrologia Latina 60 prints them."
    ]
  },
  {
    id: "paulinus_nola",
    name: "Paulinus of Nola",
    dates: "c. 354–431",
    region: "Italy",
    deathYear: 431,
    office: "Bishop of Nola",
    paragraphs: [
      "Paulinus of Nola (c. 354–431) gave up a senatorial career and settled at Nola in Campania, at the tomb of St Felix. He later became bishop there.",
      "Poems and letters survive, including a long correspondence with Ausonius, Sulpicius Severus, and Augustine. Patrologia Latina 61 prints them."
    ]
  },
  {
    id: "paschasius_deacon",
    name: "Paschasius the Deacon",
    dates: "d. c. 512",
    region: "Rome",
    deathYear: 512,
    office: "Deacon of Rome",
    paragraphs: [
      "Paschasius (d. c. 512) was a deacon of the Roman church. He is not Paschasius Radbertus of Corbie, who lived three centuries later.",
      "Two books on the Holy Spirit survive. Patrologia Latina 62 prints them."
    ]
  },
  {
    id: "boethius",
    name: "Boethius",
    dates: "c. 480–524",
    region: "Italy",
    deathYear: 524,
    office: "Philosopher",
    paragraphs: [
      "Boethius (c. 480–524) was a Roman senator and a minister of Theodoric. He was imprisoned and executed at Pavia.",
      "The Consolation of Philosophy was written in prison. Five short theological tractates on the Trinity and the person of Christ also survive. Patrologia Latina 63–64 prints them."
    ]
  },
  {
    id: "fulgentius",
    name: "Fulgentius of Ruspe",
    dates: "c. 467–533",
    region: "North Africa",
    deathYear: 533,
    office: "Bishop of Ruspe",
    paragraphs: [
      "Fulgentius of Ruspe (c. 467–533) was bishop of Ruspe in North Africa under Vandal rule. He was exiled to Sardinia with other catholic bishops.",
      "He wrote against Arian teaching and in defense of Augustine on grace. The letters and treatises are in Patrologia Latina 65."
    ]
  },
  {
    id: "benedict",
    name: "Benedict of Nursia",
    dates: "c. 480–c. 547",
    region: "Italy",
    deathYear: 547,
    office: "Abbot of Monte Cassino",
    paragraphs: [
      "Benedict of Nursia (c. 480–c. 547) founded monasteries in Italy, the last of them at Monte Cassino. Gregory the Great’s Dialogues are the main early account of his life, and they are not a contemporary report.",
      "The Rule is a short order for a monastery: prayer, work, and stability under an abbot. Patrologia Latina 66 prints it."
    ]
  },
  {
    id: "dionysius_exiguus",
    name: "Dionysius Exiguus",
    dates: "c. 470–c. 544",
    region: "Rome",
    deathYear: 544,
    office: "Monk and computist",
    paragraphs: [
      "Dionysius Exiguus (c. 470–c. 544) was a Scythian monk who worked in Rome. He is the calculator who numbered years from the incarnation.",
      "He translated Greek canons and papal letters into Latin and drew up Easter tables. Patrologia Latina 67 prints that work."
    ]
  },
  {
    id: "primasius",
    name: "Primasius of Hadrumetum",
    dates: "d. c. 560",
    region: "North Africa",
    deathYear: 560,
    office: "Bishop of Hadrumetum",
    paragraphs: [
      "Primasius of Hadrumetum (d. c. 560) was bishop of Hadrumetum in North Africa. He took part in the Three Chapters controversy.",
      "A commentary on the Apocalypse survives, drawing on Augustine and Tyconius. Patrologia Latina 68 prints it."
    ]
  },
  {
    id: "cassiodorus",
    name: "Cassiodorus",
    dates: "c. 485–c. 585",
    region: "Italy",
    deathYear: 585,
    office: "Statesman and monk",
    paragraphs: [
      "Cassiodorus (c. 485–c. 585) served the Gothic kings in Italy and then founded the monastery of Vivarium. He set his monks to copy books.",
      "The Institutions, the commentary on the Psalms, and the Tripartite History are his main Christian works. Patrologia Latina 69–70 prints them."
    ]
  },
  {
    id: "gregory_tours",
    name: "Gregory of Tours",
    dates: "c. 538–594",
    region: "Gaul",
    deathYear: 594,
    office: "Bishop of Tours",
    paragraphs: [
      "Gregory of Tours (c. 538–594) was bishop of Tours from 573. He wrote through the wars of the Frankish kings.",
      "The History of the Franks is the main Latin narrative of sixth-century Gaul. He also wrote lives of Martin and of local saints. Patrologia Latina 71 prints them."
    ]
  },
  {
    id: "pelagius_ii",
    name: "Pelagius II",
    dates: "d. 590",
    region: "Rome",
    deathYear: 590,
    office: "Bishop of Rome",
    paragraphs: [
      "Pelagius II (d. 590) was bishop of Rome from 579. He is not Pelagius, the teacher Augustine opposed.",
      "Letters of his survive from the Lombard wars and the Three Chapters dispute. Gregory the Great, then a deacon, served him. Patrologia Latina 72 prints the letters."
    ]
  },
  {
    id: "eutropius",
    name: "Eutropius",
    dates: "fl. late 6th c.",
    region: "Spain",
    deathYear: 600,
    office: "Bishop",
    paragraphs: [
      "Eutropius (fl. late 6th c.) is the bishop whose short ascetic pieces open Patrologia Latina 79. His see is not secure.",
      "The same volume also prints excerpts from Gregory the Great and later compilers. Those pieces are not his."
    ]
  },
  {
    id: "isidore",
    name: "Isidore of Seville",
    dates: "c. 560–636",
    region: "Spain",
    deathYear: 636,
    office: "Bishop of Seville",
    paragraphs: [
      "Isidore of Seville (c. 560–636) was bishop of Seville and presided at the fourth council of Toledo in 633. He succeeded his brother Leander.",
      "The Etymologies is his encyclopedia of the learning he could gather. He also wrote a chronicle, sentences, and works on the church’s offices. Patrologia Latina 81–84 prints them."
    ]
  },
  {
    id: "venantius",
    name: "Venantius Fortunatus",
    dates: "c. 530–c. 609",
    region: "Gaul",
    deathYear: 609,
    office: "Bishop of Poitiers",
    paragraphs: [
      "Venantius Fortunatus (c. 530–c. 609) was an Italian poet who settled in Gaul and became bishop of Poitiers. He knew Gregory of Tours and the nuns of the Holy Cross.",
      "Hymns, including Vexilla regis and Pange lingua, and lives of saints, are his. Patrologia Latina 88 prints the collection."
    ]
  },
  {
    id: "sergius_i",
    name: "Sergius I",
    dates: "d. 701",
    region: "Rome",
    deathYear: 701,
    office: "Bishop of Rome",
    paragraphs: [
      "Sergius I (d. 701) was bishop of Rome from 687. He refused to accept the canons of the Quinisext council.",
      "Little of his own writing survives beyond letters. Patrologia Latina 89 prints what Migne assigned to his years."
    ]
  },
  {
    id: "bede",
    name: "Bede",
    dates: "c. 673–735",
    region: "England",
    deathYear: 735,
    office: "Monk of Jarrow",
    paragraphs: [
      "Bede (c. 673–735) was a monk at Wearmouth-Jarrow in Northumbria. He spent his life in that house as a teacher and writer.",
      "The Ecclesiastical History of the English People is his narrative of the English churches. Commentaries, homilies, and books on time and meter also survive. Patrologia Latina 90–95 prints the set Migne had."
    ]
  },
  {
    id: "ildefonsus",
    name: "Ildefonsus of Toledo",
    dates: "c. 607–667",
    region: "Spain",
    deathYear: 667,
    office: "Bishop of Toledo",
    paragraphs: [
      "Ildefonsus of Toledo (c. 607–667) was bishop of Toledo from 657. He had been a monk at Agali.",
      "On the Perpetual Virginity of Mary and a continuation of the notices of illustrious men are his main works. Patrologia Latina 96 prints them."
    ]
  },
  {
    id: "charlemagne",
    name: "Charlemagne",
    dates: "742–814",
    region: "Gaul",
    deathYear: 814,
    office: "King of the Franks",
    paragraphs: [
      "Charlemagne (742–814) was king of the Franks and, from 800, emperor. The volumes under his name hold the capitularies, letters, and liturgical books of his court.",
      "Patrologia Latina 97–98 prints that collection."
    ]
  },
  {
    id: "paulinus_aquileia",
    name: "Paulinus of Aquileia",
    dates: "c. 730–802",
    region: "Italy",
    deathYear: 802,
    office: "Bishop of Aquileia",
    paragraphs: [
      "Paulinus of Aquileia (c. 730–802) was bishop of Aquileia and a member of Charlemagne’s circle of scholars. He is not Paulinus of Nola.",
      "He wrote against adoptionist teaching in Spain and composed a book of exhortation for a duke. Patrologia Latina 99 prints them."
    ]
  },
  {
    id: "alcuin",
    name: "Alcuin of York",
    dates: "c. 735–804",
    region: "England",
    deathYear: 804,
    office: "Teacher",
    paragraphs: [
      "Alcuin of York (c. 735–804) was a teacher from Northumbria who led the school at Charlemagne’s court and later served as abbot of St Martin’s at Tours.",
      "Letters, commentaries, and schoolbooks survive in great number. Patrologia Latina 100–101 prints them."
    ]
  },
  {
    id: "smaragdus",
    name: "Smaragdus of Saint-Mihiel",
    dates: "d. c. 840",
    region: "Gaul",
    deathYear: 840,
    office: "Abbot of Saint-Mihiel",
    paragraphs: [
      "Smaragdus (d. c. 840) was abbot of Saint-Mihiel in Lorraine. He wrote for monks and for a king.",
      "A commentary on the Rule of Benedict, the Via regia, and a commentary on the lectionary survive. Patrologia Latina 102 prints them."
    ]
  },
  {
    id: "benedict_aniane",
    name: "Benedict of Aniane",
    dates: "c. 747–821",
    region: "Gaul",
    deathYear: 821,
    office: "Abbot of Aniane",
    paragraphs: [
      "Benedict of Aniane (c. 747–821) was a Gothic nobleman who became a monk and then the leading monastic reformer under Louis the Pious. He is not Benedict of Nursia.",
      "His Concordia regularum sets the Rule of Benedict beside other monastic rules. Patrologia Latina 103 prints it."
    ]
  },
  {
    id: "agobard",
    name: "Agobard of Lyon",
    dates: "c. 769–840",
    region: "Gaul",
    deathYear: 840,
    office: "Bishop of Lyon",
    paragraphs: [
      "Agobard of Lyon (c. 769–840) was bishop of Lyon. He opposed trial by ordeal, the cult of images as he met it, and popular accusations of weather-magic.",
      "Treatises and letters survive. Patrologia Latina 104 prints them."
    ]
  },
  {
    id: "theodulf",
    name: "Theodulf of Orléans",
    dates: "c. 760–821",
    region: "Gaul",
    deathYear: 821,
    office: "Bishop of Orléans",
    paragraphs: [
      "Theodulf of Orléans (c. 760–821) was a Visigothic scholar who became bishop of Orléans under Charlemagne. He was deposed after Louis the Pious succeeded.",
      "The first seven books of his poem on the Holy Spirit, his statutes for priests, and the hymn Gloria, laus et honor survive. Patrologia Latina 105 prints them."
    ]
  },
  {
    id: "gregory_iv",
    name: "Gregory IV",
    dates: "d. 844",
    region: "Rome",
    deathYear: 844,
    office: "Bishop of Rome",
    paragraphs: [
      "Gregory IV (d. 844) was bishop of Rome from 827. He is not Gregory the Great and not Gregory of Tours.",
      "A small set of letters survives. Patrologia Latina 106 prints what Migne assigned to him."
    ]
  },
  {
    id: "rabanus",
    name: "Rabanus Maurus",
    dates: "c. 780–856",
    region: "Gaul",
    deathYear: 856,
    office: "Archbishop of Mainz",
    paragraphs: [
      "Rabanus Maurus (c. 780–856) was a monk of Fulda, then its abbot, and from 847 archbishop of Mainz. He had studied with Alcuin.",
      "Commentaries on much of the Bible, a handbook On the Universe, and poems survive. Patrologia Latina 107–112 prints them."
    ]
  },
  {
    id: "walafrid",
    name: "Walafrid Strabo",
    dates: "c. 808–849",
    region: "Gaul",
    deathYear: 849,
    office: "Abbot of Reichenau",
    paragraphs: [
      "Walafrid Strabo (c. 808–849) was a monk and then abbot of Reichenau. He had been tutor at the imperial court.",
      "The Glossa ordinaria later circulated under his name, but the commentary set in Patrologia Latina 113–114 is not his work as a whole. His own poems and shorter works are the secure part of the volume."
    ]
  },
  {
    id: "leo_iv",
    name: "Leo IV",
    dates: "d. 855",
    region: "Rome",
    deathYear: 855,
    office: "Bishop of Rome",
    paragraphs: [
      "Leo IV (d. 855) was bishop of Rome from 847. He is not Leo the Great and not the emperor Leo VI.",
      "He walled the quarter of Rome across the Tiber after the Arab raid of 846. Sermons and letters survive. Patrologia Latina 115 prints them."
    ]
  },
  {
    id: "haymo",
    name: "Haymo of Halberstadt",
    dates: "d. 853",
    region: "Germany",
    deathYear: 853,
    office: "Bishop of Halberstadt",
    paragraphs: [
      "Haymo of Halberstadt (d. 853) was bishop of Halberstadt and a pupil of Alcuin. He wrote homilies and at least some biblical commentary.",
      "Migne prints a large commentary set under his name in Patrologia Latina 116–118. Much of that set is now credited to Haymo of Auxerre. The two are not sorted on this page."
    ]
  },
  {
    id: "nicholas_i",
    name: "Nicholas I",
    dates: "c. 820–867",
    region: "Rome",
    deathYear: 867,
    office: "Bishop of Rome",
    paragraphs: [
      "Nicholas I (c. 820–867) was bishop of Rome from 858. He is not Nicholas Mystikos of Constantinople.",
      "His letters deal with the divorce of Lothar II, with Photius, and with the mission in Bulgaria. Patrologia Latina 119 prints them."
    ]
  },
  {
    id: "paschasius_radbertus",
    name: "Paschasius Radbertus",
    dates: "c. 785–c. 865",
    region: "Gaul",
    deathYear: 865,
    office: "Abbot of Corbie",
    paragraphs: [
      "Paschasius Radbertus (c. 785–c. 865) was a monk and, for a time, abbot of Corbie. He is not the Roman deacon Paschasius.",
      "On the Body and Blood of the Lord is his account of the eucharist. He also wrote commentaries and a life of Adalhard. Patrologia Latina 120 prints them."
    ]
  },
  {
    id: "ratramnus",
    name: "Ratramnus of Corbie",
    dates: "d. c. 868",
    region: "Gaul",
    deathYear: 868,
    office: "Monk of Corbie",
    paragraphs: [
      "Ratramnus of Corbie (d. c. 868) was a monk of Corbie in the same years as Paschasius Radbertus. He answered the same questions differently.",
      "His book on the body and blood of the Lord, and treatises on predestination and on the soul, survive. Patrologia Latina 121 prints them."
    ]
  },
  {
    id: "eriugena",
    name: "John Scotus Eriugena",
    dates: "c. 800–c. 877",
    region: "Gaul",
    deathYear: 877,
    office: "Teacher",
    paragraphs: [
      "John Scotus Eriugena (c. 800–c. 877) was an Irish teacher at the court of Charles the Bald. He knew Greek, which was rare in the West of his day.",
      "On the Division of Nature is his major work. He also translated Pseudo-Dionysius into Latin. Patrologia Latina 122 prints them."
    ]
  },
  {
    id: "ado",
    name: "Ado of Vienne",
    dates: "c. 800–875",
    region: "Gaul",
    deathYear: 875,
    office: "Bishop of Vienne",
    paragraphs: [
      "Ado of Vienne (c. 800–875) was bishop of Vienne. He compiled a martyrology and a world chronicle.",
      "Both were widely copied. Patrologia Latina 123 prints them."
    ]
  },
  {
    id: "usuard",
    name: "Usuard",
    dates: "d. c. 877",
    region: "Gaul",
    deathYear: 877,
    office: "Monk of Saint-Germain",
    paragraphs: [
      "Usuard (d. c. 877) was a monk of Saint-Germain-des-Prés in Paris. He traveled to Spain to collect notices of martyrs.",
      "His martyrology became the one most often copied in the medieval West. Patrologia Latina 124 prints it."
    ]
  },
  {
    id: "hincmar",
    name: "Hincmar of Rheims",
    dates: "c. 806–882",
    region: "Gaul",
    deathYear: 882,
    office: "Archbishop of Rheims",
    paragraphs: [
      "Hincmar of Rheims (c. 806–882) was archbishop of Rheims from 845. He advised the West Frankish kings and wrote at length on church order.",
      "Treatises on the divorce of Lothar, on predestination, and on the rights of metropolitans survive, with many letters. Patrologia Latina 125–126 prints them."
    ]
  },
  {
    id: "anastasius_librarian",
    name: "Anastasius the Librarian",
    dates: "c. 810–c. 878",
    region: "Rome",
    deathYear: 878,
    office: "Librarian of the Roman church",
    paragraphs: [
      "Anastasius the Librarian (c. 810–c. 878) was librarian of the Roman church and a translator from Greek. He is not Anastasius of Sinai.",
      "He translated acts of councils and lives of saints, and he compiled a chronicle. Patrologia Latina 127–129 prints that set."
    ]
  },
  {
    id: "remigius_auxerre",
    name: "Remigius of Auxerre",
    dates: "c. 841–c. 908",
    region: "Gaul",
    deathYear: 908,
    office: "Teacher",
    paragraphs: [
      "Remigius of Auxerre (c. 841–c. 908) taught at Auxerre, Rheims, and Paris. He commented on both the Bible and the school authors.",
      "Commentaries on Genesis, the Psalms, and the Mass survive. Patrologia Latina 131 prints them."
    ]
  },
  {
    id: "regino",
    name: "Regino of Prüm",
    dates: "d. 915",
    region: "Gaul",
    deathYear: 915,
    office: "Abbot of Prüm",
    paragraphs: [
      "Regino of Prüm (d. 915) was abbot of Prüm until he was deposed in 899. He finished his life at St Maximin in Trier.",
      "A chronicle and a collection of canons for episcopal visitation survive. Patrologia Latina 132 prints them."
    ]
  },
  {
    id: "odo_cluny",
    name: "Odo of Cluny",
    dates: "c. 878–942",
    region: "Gaul",
    deathYear: 942,
    office: "Abbot of Cluny",
    paragraphs: [
      "Odo of Cluny (c. 878–942) was the second abbot of Cluny. He reformed other houses on the Cluniac pattern.",
      "A life of Gerald of Aurillac, sermons, and the long poem Occupatio survive. Patrologia Latina 133 prints them."
    ]
  },
  {
    id: "atto",
    name: "Atto of Vercelli",
    dates: "c. 885–961",
    region: "Italy",
    deathYear: 961,
    office: "Bishop of Vercelli",
    paragraphs: [
      "Atto of Vercelli (c. 885–961) was bishop of Vercelli in Lombardy. He wrote for the clergy of a disorderly time.",
      "A commentary on the Pauline letters, a book of canon law, and sermons survive. Patrologia Latina 134 prints them."
    ]
  },
  {
    id: "flodoard",
    name: "Flodoard of Rheims",
    dates: "c. 894–966",
    region: "Gaul",
    deathYear: 966,
    office: "Canon of Rheims",
    paragraphs: [
      "Flodoard of Rheims (c. 894–966) was a canon of Rheims and for a time in charge of its archives. He kept a record of his own years.",
      "The History of the Church of Rheims and the Annals are his main works. Patrologia Latina 135 prints them."
    ]
  },
  {
    id: "ratherius",
    name: "Ratherius of Verona",
    dates: "c. 890–974",
    region: "Italy",
    deathYear: 974,
    office: "Bishop of Verona",
    paragraphs: [
      "Ratherius of Verona (c. 890–974) was bishop of Verona three times and was driven out each time. He also held the see of Liège briefly.",
      "The Praeloquia and a set of bitter letters and sermons survive. Patrologia Latina 136 prints them."
    ]
  },
  {
    id: "hrotsvitha",
    name: "Hrotsvitha of Gandersheim",
    dates: "c. 935–c. 973",
    region: "Germany",
    deathYear: 973,
    office: "Canoness of Gandersheim",
    paragraphs: [
      "Hrotsvitha of Gandersheim (c. 935–c. 973) was a canoness of the Saxon house of Gandersheim. She is the first named woman whose Latin plays survive.",
      "She wrote legends in verse, plays on the model of Terence, and a poem on the deeds of Otto I. Patrologia Latina 137 prints them."
    ]
  },
  {
    id: "richer",
    name: "Richer of Reims",
    dates: "fl. c. 998",
    region: "Gaul",
    deathYear: 998,
    office: "Monk of Saint-Remi",
    paragraphs: [
      "Richer of Reims (fl. c. 998) was a monk of Saint-Remi. He studied at Chartres and wrote for his teacher Gerbert.",
      "The Historiae cover West Frankish politics from 888 into the 990s. Patrologia Latina 138 prints them."
    ]
  },
  {
    id: "gerbert",
    name: "Gerbert of Aurillac",
    dates: "c. 946–1003",
    region: "Gaul",
    deathYear: 1003,
    office: "Bishop of Rome",
    paragraphs: [
      "Gerbert of Aurillac (c. 946–1003) taught at Rheims, became archbishop there, and was bishop of Rome as Sylvester II from 999.",
      "Letters and works on the abacus, astronomy, and logic survive. Patrologia Latina 139 prints them."
    ]
  }
];

export const MIGNE_FATHER_PROFILES: Record<string, { office: string; paragraphs: string[] }> = Object.fromEntries(
  MIGNE_FATHERS.map((father) => [father.id, { office: father.office, paragraphs: father.paragraphs }])
);

export function migneAuthors(): Author[] {
  return MIGNE_FATHERS.map((father) => ({
    id: father.id,
    name: father.name,
    dates: father.dates,
    era: "post-nicene",
    region: father.region,
    deathYear: father.deathYear,
    bio: ""
  }));
}
