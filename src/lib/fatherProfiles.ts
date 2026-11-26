import { MIGNE_FATHER_PROFILES } from "../../server/migneFathers";

/** Office line and profile copy for the Fathers tab. Keyed by catalog author id. */
export type FatherProfile = {
  office: string;
  paragraphs: string[];
  /** Named section instead of a death-century. */
  section?: string;
  /**
   * What the shelf is, for structured data: a person (the default), a single anonymous document
   * (the Didache), or a collection of works by many hands (the councils).
   */
  kind?: "person" | "document" | "collection";
};

/**
 * Writers whose work survives here only as fragments, mostly quoted by Eusebius. They are listed
 * together after the centuries so the century grids keep to the Fathers with whole works.
 */
export const FRAGMENTS_SECTION = "Known from Fragments";

export const FATHER_PROFILES: Record<string, FatherProfile> = {
  clement_rome: {
    office: "Bishop of Rome (by tradition)",
    paragraphs: [
      "Clement of Rome (fl. c. 96) is named in the early lists as the third bishop of Rome after the apostles. Whether Rome had a single presiding bishop this early is disputed, and the letter that bears his name speaks for the church at Rome as a whole.",
      "That letter, known as 1 Clement, urges the divided church at Corinth back to order, repentance, and hope in the resurrection. It is traditionally dated c. 96 and is among the earliest Christian writings outside the New Testament. Later works also circulated under his name, among them the Pseudo-Clementine Recognitions and Homilies."
    ]
  },
  ignatius: {
    office: "Bishop of Antioch",
    paragraphs: [
      "Ignatius (d. c. 110) was bishop of Antioch in Syria. Arrested as a Christian, he was taken under guard to Rome to die.",
      "On the road he wrote seven letters: to five churches in Asia Minor (Ephesus, Magnesia, Tralles, Philadelphia, and Smyrna), to the church at Rome, and to Polycarp of Smyrna. They are the early church’s plainest witness to the bishop, the eucharist, and a martyr’s hope. Later writers expanded these letters and added others in his name."
    ]
  },
  polycarp: {
    office: "Bishop of Smyrna",
    paragraphs: [
      "Polycarp (c. 69–c. 155) led the church at Smyrna as its bishop. Irenaeus, who heard him preach as a boy, says that Polycarp had known the apostle John and others who had seen the Lord.",
      "His letter to the Philippians is pastoral and full of Scripture. The Martyrdom of Polycarp, a letter from the church of Smyrna written soon after his death, is the earliest account of a Christian martyrdom outside the New Testament."
    ]
  },
  papias: {
    office: "Bishop of Hierapolis",
    paragraphs: [
      "Papias (fl. early 2nd c.) was bishop of Hierapolis in Phrygia. He collected what the elders said about the Lord’s words and the Gospels.",
      "His Expositions survive only in fragments, quoted by Irenaeus and Eusebius. Those fragments are a main early witness to how the church received Mark and Matthew."
    ]
  },
  hermas: {
    office: "Author of the Shepherd",
    paragraphs: [
      "Hermas (fl. 2nd c.) is the name the author of the Shepherd gives himself. The book is a Roman apocalypse, widely read in the early church.",
      "It is a series of visions, mandates, and parables about repentance after baptism. It shows what a second-century Roman congregation was taught about sin, the church, and the Son of God."
    ]
  },
  barnabas: {
    office: "Anonymous early letter",
    kind: "document",
    paragraphs: [
      "The Epistle of Barnabas (c. 96–135, often dated c. 130) is an anonymous early Christian letter. Tradition linked it with the apostle Barnabas, but it is not his work.",
      "It reads Israel’s Scripture as speaking of Christ, and it closes with a teaching on the two ways. Some early churches read it with the Scriptures: Codex Sinaiticus copies it with the New Testament, after Revelation."
    ]
  },
  didache: {
    office: "Church order",
    kind: "document",
    paragraphs: [
      "The Didache, or Teaching of the Twelve Apostles, is a short anonymous church manual, probably from Syria. It is usually dated to the late first or early second century.",
      "It gives the two ways, instructions for baptism, fasting, the eucharist, and traveling apostles and prophets, and a closing word on the end. It is the earliest church order that survives."
    ]
  },
  mathetes: {
    office: "Unknown author",
    kind: "document",
    paragraphs: [
      "The Epistle to Diognetus is an anonymous Christian apology of uncertain date, often placed in the late second century. “Mathetes,” the name under which it is sometimes filed, is not a name: it comes from the writer’s description of himself as a disciple (Greek mathētēs) in chapter 11.",
      "The letter tells a pagan inquirer how Christians live in the world without belonging to it, and why the Son was sent. Chapters 11 and 12 differ in style and are likely a separate piece joined to it. It is one of the most finished pieces of early Christian prose."
    ]
  },
  justin: {
    office: "Christian apologist",
    paragraphs: [
      "Justin Martyr (c. 100–c. 165) taught in Rome after a search through the philosophical schools. He was beheaded under the prefect Rusticus.",
      "His First Apology addresses the emperor in defense of Christians, and it describes their baptism and Sunday worship. The Dialogue with Trypho argues from Scripture that Jesus is the Christ. Several other works on his shelf were later ascribed to him and are marked as such."
    ]
  },
  tatian: {
    office: "Christian apologist",
    section: "Other Authors",
    paragraphs: [
      "Tatian (fl. mid-2nd c.) was a Syrian student of Justin in Rome. He later returned east and was remembered as a rigorist.",
      "His Address to the Greeks defends the barbarian wisdom of Christianity against Greek contempt. He also composed the Diatessaron, a single narrative woven from the four Gospels."
    ]
  },
  athenagoras: {
    office: "Christian apologist",
    paragraphs: [
      "Athenagoras (fl. late 2nd c.) was a Christian philosopher of Athens. His Plea for the Christians is addressed to the emperors Marcus Aurelius and Commodus.",
      "The Plea answers the charges of atheism, cannibalism, and incest. A treatise On the Resurrection, which argues that God can raise the body he made, is ascribed to him in the manuscripts, though some scholars date it later."
    ]
  },
  theophilus: {
    office: "Bishop of Antioch",
    paragraphs: [
      "Theophilus (fl. late 2nd c.) was bishop of Antioch in Syria. He wrote three books to Autolycus, a pagan friend.",
      "The books defend the Christian God, tell the history of the world from Scripture, and answer Greek myth. Theophilus is the first known writer to use the Greek word trias (“triad”) of God."
    ]
  },
  irenaeus: {
    office: "Bishop of Lyons",
    paragraphs: [
      "Irenaeus (c. 130–c. 202) came from Asia Minor, where as a young man he heard Polycarp, and became bishop of Lyons in Gaul. He wrote against teachers who split the God of Jesus from the Creator.",
      "Against Heresies sets out what the apostles preached and what the churches hold in common. His shorter Demonstration of the Apostolic Preaching, which survives in Armenian, presents the same faith briefly as a reading of Scripture."
    ]
  },
  clement_alexandria: {
    office: "Teacher at Alexandria",
    paragraphs: [
      "Clement of Alexandria (c. 150–c. 215) taught in Alexandria and read Greek philosophy as a preparation for the Gospel. Eusebius places him at the head of the city’s catechetical school, though how formal that school was is debated.",
      "The Exhortation, the Instructor, and the Miscellanies lead a reader from conversion to a disciplined Christian life. He left Alexandria during the persecution of about 202 and died elsewhere."
    ]
  },
  hippolytus: {
    office: "Roman presbyter",
    paragraphs: [
      "Hippolytus (c. 170–c. 235) was a learned presbyter in Rome who opposed Bishop Callistus. He was exiled to Sardinia with Bishop Pontian in 235 and was later honored as a martyr.",
      "Which writings are his is debated, and some scholars divide the Greek works under his name between two or more authors. The Refutation of All Heresies traces Christian errors to Greek philosophy, and the Commentary on Daniel is the oldest surviving Christian commentary on a book of Scripture.",
      "The church order once called his Apostolic Tradition is now widely held not to be his. A statue found in Rome in 1551, restored as a seated bishop and long taken as his portrait, carries a list of writings on its chair, but the figure was originally a woman’s."
    ]
  },
  tertullian: {
    office: "Christian apologist",
    section: "Other Authors",
    paragraphs: [
      "Tertullian (c. 155–c. 240) of Carthage was the first major Christian author to write in Latin. He wrote with a lawyer’s edge; whether he was the jurist Tertullian cited in Roman law is disputed.",
      "His Apology answers Roman charges against the church. Later works on baptism, repentance, the resurrection, and the Trinity shaped Latin theology, even where the church did not follow his rigorism or his sympathy with the New Prophecy (Montanism)."
    ]
  },
  minucius_felix: {
    office: "Christian apologist",
    paragraphs: [
      "Minucius Felix (fl. 2nd–3rd c.) was a Roman advocate and a Christian. Almost nothing else is known of his life.",
      "Octavius is a dialogue on the shore at Ostia. A pagan and a Christian argue about providence, the gods, and the resurrection, and the pagan is persuaded."
    ]
  },
  origen: {
    office: "Teacher at Alexandria",
    paragraphs: [
      "Origen (c. 185–c. 254) taught in Alexandria and later in Caesarea. Eusebius (Church History 6.6) makes him Clement’s pupil and successor as the city’s Christian teacher, an account historians treat with some caution. He learned Hebrew, collated the Hexapla, and preached through much of Scripture.",
      "On First Principles is the first large Christian theology. Against Celsus answers a philosopher’s attack. His homilies and commentaries taught the church to read Scripture on more than one level."
    ]
  },
  novatian: {
    office: "Roman presbyter",
    section: "Other Authors",
    paragraphs: [
      "Novatian (fl. mid-3rd c.) was a Roman presbyter and a strict opponent of restoring Christians who had lapsed in persecution. A minority in Rome chose him as a rival bishop.",
      "His book On the Trinity is a clear Latin account of the Father, the Son, and the Holy Spirit, written before the controversies of the fourth century."
    ]
  },
  cyprian: {
    office: "Bishop of Carthage",
    paragraphs: [
      "Cyprian (d. 258) became bishop of Carthage within a few years of his baptism. He led the North African church through the Decian persecution and a plague, and he was beheaded in 258 under Valerian.",
      "His letters and treatises deal with the lapsed, baptism, and the unity of the church. On the Unity of the Church is his argument that the bishop and the one church belong together."
    ]
  },
  commodianus: {
    office: "Christian poet",
    paragraphs: [
      "Commodianus (fl. 3rd–5th c.) wrote Latin Christian verse of an uncertain date. The poems instruct pagans and believers in a rough, urgent style.",
      "The Instructions warn of judgment and call readers to leave the gods. They show popular Christian teaching in the western churches."
    ]
  },
  dionysius: {
    office: "Bishop of Alexandria",
    paragraphs: [
      "Dionysius of Alexandria (d. c. 264) was a pupil of Origen and became bishop of Alexandria in 247 or 248. He survived the Decian and Valerian persecutions by flight and exile.",
      "His letters survive mostly in fragments, many of them quoted by Eusebius. They treat persecution, the lapsed, rebaptism, the date of Easter, and how to speak of the Son; one argues from style that Revelation was not written by the author of the Gospel of John. This shelf also holds the Fragments of Caius, a Roman presbyter of the early third century."
    ]
  },
  gregory_thaumaturgus: {
    office: "Bishop of Neocaesarea",
    paragraphs: [
      "Gregory Thaumaturgus (c. 213–c. 270) studied with Origen in Caesarea and became bishop of Neocaesarea in Pontus.",
      "His Declaration of Faith is a short rule of belief, and the Panegyric to Origen thanks his teacher. Later churches remembered him as the apostle of Pontus, and several later works circulated under his name."
    ]
  },
  methodius: {
    office: "Bishop in Lycia",
    paragraphs: [
      "Methodius (d. c. 311), traditionally bishop of Olympus in Lycia, is remembered as a martyr of the last persecution. Little about his life is certain.",
      "He wrote in Greek, against Origen on some points and with him on others. The Symposium pictures virginity as a feast of ten virgins. On the Resurrection and On Free Will defend the body and human choice."
    ]
  },
  arnobius: {
    office: "Christian apologist",
    paragraphs: [
      "Arnobius of Sicca (fl. c. 300) taught rhetoric in North Africa and wrote Against the Heathen after his conversion. Jerome names Lactantius as his pupil.",
      "The seven books attack the pagan gods and answer the claim that Christian neglect of the old cults had brought disaster on the empire."
    ]
  },
  lactantius: {
    office: "Christian rhetor",
    paragraphs: [
      "Lactantius (c. 250–c. 325) taught Latin rhetoric at Nicomedia under Diocletian and later tutored Constantine’s son Crispus. Jerome called him “a river of Ciceronian eloquence” (Letter 58.10); Renaissance humanists named him the Christian Cicero.",
      "The Divine Institutes is a full defense of Christian worship and justice. On the Deaths of the Persecutors tells how the emperors who attacked the church came to their ends."
    ]
  },
  eusebius: {
    office: "Bishop of Caesarea",
    paragraphs: [
      "Eusebius (c. 260–c. 339) became bishop of Caesarea in Palestine and kept its library. He lived through the Great Persecution and the reign of Constantine.",
      "His Church History is the first large narrative of the Christian movement, built from documents he quotes. The Life of Constantine and the Preparation for the Gospel stand beside it."
    ]
  },
  aphrahat: {
    office: "Syriac writer",
    paragraphs: [
      "Aphrahat (fl. 4th c.), known as the Persian Sage, wrote in Syriac within the Persian empire.",
      "The Demonstrations are twenty-three discourses on faith, love, fasting, war, and the resurrection. They are the earliest extended Christian theology in Syriac."
    ]
  },
  ephraim: {
    office: "Deacon of Edessa",
    paragraphs: [
      "Ephraim the Syrian (c. 306–373) was a deacon and teacher in Nisibis and then Edessa. He wrote in Syriac, mostly in verse.",
      "His hymns on faith, the Nativity, and Paradise teach doctrine by song. The church east and west received him as a master of Scripture and a poet of the incarnation."
    ]
  },
  hilary: {
    office: "Bishop of Poitiers",
    paragraphs: [
      "Hilary (c. 310–c. 367) became bishop of Poitiers in Gaul. Exiled to Asia Minor in 356 for defending the Nicene faith, he learned the Greek controversy at first hand.",
      "On the Trinity is the major Latin account of the Nicene faith in his generation. His commentary on Matthew was written before the exile; his later Tractates on the Psalms draw heavily on Origen."
    ]
  },
  athanasius: {
    office: "Bishop of Alexandria",
    paragraphs: [
      "Athanasius (c. 296–373) was bishop of Alexandria from 328 until his death, and was sent into exile five times. He defended the creed of Nicaea against the claim that the Son was a creature.",
      "On the Incarnation, written early, explains why the Word became man. The Life of Antony was widely read, in Greek and in Latin translation, as a portrait of the desert monk. His Festal Letter 39 (367) is the earliest surviving list of exactly the twenty-seven books of the New Testament."
    ]
  },
  basil: {
    office: "Bishop of Caesarea",
    paragraphs: [
      "Basil the Great (c. 330–379) became bishop of Caesarea in Cappadocia in 370. He organized monastic communities, cared for the poor, and argued for the divinity of the Holy Spirit.",
      "On the Holy Spirit and the treatise against Eunomius defend Nicene worship. His Longer and Shorter Rules, and his letters, shaped eastern monastic life. He died in 379 by the traditional date; some scholars argue for 377 or 378."
    ]
  },
  cyril_jerusalem: {
    office: "Bishop of Jerusalem",
    paragraphs: [
      "Cyril (c. 313–386) was bishop of Jerusalem from about 350. He catechized those preparing for baptism in the Church of the Holy Sepulchre.",
      "The Catechetical Lectures walk through the creed before baptism. The Mystagogical Lectures, given after baptism, explain the rites the newly baptized had just received; some scholars assign them to his successor John."
    ]
  },
  gregory_nazianzen: {
    office: "Bishop of Constantinople",
    paragraphs: [
      "Gregory Nazianzen (c. 329–c. 390) was a Cappadocian theologian and, briefly, bishop of Constantinople. He presided for a time at the council of 381 before resigning. He accepted church office reluctantly and preferred a life of study and retreat.",
      "The Theological Orations are the classic Greek account of the Trinity. His poems and funeral orations, including the one for Basil, are major works of fourth-century Greek literature."
    ]
  },
  gregory_nyssa: {
    office: "Bishop of Nyssa",
    paragraphs: [
      "Gregory of Nyssa (c. 335–c. 395), the younger brother of Basil, became bishop of Nyssa in Cappadocia. He wrote the most speculative theology of the Cappadocians.",
      "Against Eunomius, the Great Catechism, and the Life of Moses set out how a finite mind speaks of the infinite God. His homilies on the Song of Songs read Scripture as the soul’s ascent."
    ]
  },
  ambrose: {
    office: "Bishop of Milan",
    paragraphs: [
      "Ambrose of Milan (c. 340–397) was governor of Aemilia-Liguria when the people of Milan demanded him as bishop. He baptized Augustine and stood up to emperors over the church’s independence.",
      "He preached, wrote hymns, and treated ethics, virginity, and the duties of clergy. On the Mysteries and the sacramental catecheses show how Milan baptized and celebrated the eucharist."
    ]
  },
  jerome: {
    office: "Priest and translator",
    paragraphs: [
      "Jerome (c. 347–420) was a priest, ascetic, and scholar who settled in Bethlehem. He revised the Latin Bible from the Hebrew and Greek.",
      "The Vulgate Old Testament is his great work. His letters, the Lives of the monks, and Against Jovinian, Rufinus, and others show a fierce and learned correspondent."
    ]
  },
  chrysostom: {
    office: "Bishop of Constantinople",
    paragraphs: [
      "John Chrysostom (c. 347–407) preached in Antioch and then served as bishop of Constantinople. His plain speech offended the court, and he died in exile.",
      "The homilies on Matthew, John, Acts, and the letters of Paul are the largest set of early Greek sermons on Scripture. On the Priesthood is his dialogue on the weight of the pastoral office."
    ]
  },
  rufinus: {
    office: "Monk and translator",
    paragraphs: [
      "Rufinus of Aquileia (c. 345–411) was a monk and translator who lived in Egypt, Jerusalem, and Italy. He put Greek theology into Latin, above all Origen.",
      "His translations of Origen, Eusebius, and the Sentences of Sextus, together with his own commentary on the Apostles’ Creed, carried eastern books to Latin readers."
    ]
  },
  augustine: {
    office: "Bishop of Hippo",
    paragraphs: [
      "Augustine of Hippo (354–430) was bishop of Hippo in North Africa. He came to baptism in Milan under Ambrose, after years as a teacher of rhetoric and a hearer of the Manichees.",
      "The Confessions tell that conversion. The City of God answers the sack of Rome. On the Trinity, the homilies on the Psalms and John, and the anti-Pelagian writings shaped Latin Christianity more than any other single father."
    ]
  },
  sulpicius_severus: {
    office: "Christian historian",
    paragraphs: [
      "Sulpicius Severus (c. 363–c. 425) was a lawyer in Aquitaine who left public life for an ascetic household. He knew Martin of Tours and Paulinus of Nola.",
      "The Life of Martin and the Dialogues about Martin spread the saint’s story through the Latin west. His Chronicle is a short sacred history from creation to his own day."
    ]
  },
  cassian: {
    office: "Monk of Marseille",
    paragraphs: [
      "John Cassian (c. 360–c. 435) trained among the monks of Egypt and settled at Marseille. Gennadius says he founded two monasteries there, one for men and one for women; the link with the abbey of Saint Victor is later tradition.",
      "The Institutes and the Conferences brought Egyptian monastic practice to Gaul: the eight thoughts, prayer, and the sayings of the desert fathers. The Rule of Benedict tells its monks to read them."
    ]
  },
  socrates: {
    office: "Church historian",
    paragraphs: [
      "Socrates Scholasticus (c. 380–c. 439) was a lawyer in Constantinople who continued the church history of Eusebius. He wrote in Greek for a lay reader.",
      "His history runs from Constantine to Theodosius II. He quotes documents, notes where his sources disagree, and is one of three fifth-century historians of the same years."
    ]
  },
  vincent: {
    office: "Monk of Lérins",
    paragraphs: [
      "Vincent of Lérins (d. c. 450) was a monk on the island of Lérins off the coast of Gaul. He wrote under the name Peregrinus.",
      "The Commonitory asks how a reader tells the catholic faith from novelty. His test — what has been believed everywhere, always, and by all — became a standard citation in later controversies."
    ]
  },
  sozomen: {
    office: "Church historian",
    paragraphs: [
      "Sozomen (c. 400–c. 450) was a lawyer in Constantinople who wrote a church history dedicated to Theodosius II. He used Socrates and added material of his own.",
      "The history covers Constantine to about 425, with a particular interest in monks and in the churches of the East. With Socrates and Theodoret, he is one of the three Greek historians who continued Eusebius."
    ]
  },
  theodoret: {
    office: "Bishop of Cyrrhus",
    paragraphs: [
      "Theodoret of Cyrrhus (c. 393–c. 458) became bishop of the small Syrian city of Cyrrhus in 423. A theologian of the Antiochene school, he opposed Cyril of Alexandria in the debates that led to Chalcedon.",
      "His Church History, the Religious History of Syrian monks, and commentaries on Paul and the prophets are major Greek sources. Eranistes is his dialogue on the person of Christ."
    ]
  },
  leo: {
    office: "Bishop of Rome",
    paragraphs: [
      "Leo the Great (c. 400–461) was bishop of Rome from 440. He met Attila in 452 and dealt with the collapse of imperial order in the West.",
      "The Tome to Flavian, read at Chalcedon, states that Christ is one person in two natures. Nearly a hundred of his sermons for the church year survive, with many of his letters."
    ]
  },
  gennadius: {
    office: "Presbyter of Marseille",
    paragraphs: [
      "Gennadius (d. c. 496) was a presbyter of Marseille in southern Gaul.",
      "He continued Jerome’s Lives of Illustrious Men with notices of about a hundred Christian writers of the later fourth and fifth centuries. For many of them his notice is the main record of their life and works. He wrote as a Gallic churchman of his day, sometimes reserved about Augustine’s teaching on grace."
    ]
  },
  councils: {
    office: "The great councils",
    section: "Councils",
    kind: "collection",
    paragraphs: [
      "The seven councils counted as ecumenical by the Orthodox and Catholic churches met between 325 and 787. Nicaea (325) and Constantinople (381) set out the faith in the Trinity; Ephesus (431), Chalcedon (451), and the councils of Constantinople in 553 and 680–681 treated the person of Christ; the second council of Nicaea (787) defended the veneration of icons.",
      "Not every church received them all: the Church of the East did not accept Ephesus, and the Oriental Orthodox churches did not accept Chalcedon or the councils after it. Patrista files their creeds, canons, and related acts together. They are not the work of one father; the fathers on this page wrote, argued, and preached around them."
    ]
  },
  gregory: {
    office: "Bishop of Rome",
    paragraphs: [
      "Gregory the Great (c. 540–604) was bishop of Rome from 590. He had been prefect of the city and then a monk, and he governed a church in an Italy broken by war and plague.",
      "The Pastoral Rule became the western handbook for bishops. The homilies on the Gospels and on Ezekiel, the Dialogues, and the letters show a pastor who also sent a mission to the English."
    ]
  },
  john_damascus: {
    office: "Monk of Mar Saba",
    paragraphs: [
      "John of Damascus (c. 675–c. 749) was a monk at Mar Saba near Jerusalem. By tradition he served, as his father had, in the caliph’s financial administration before he left for the monastery.",
      "The Fount of Knowledge sums up Greek theology for a new age, and its third part, On the Orthodox Faith, became a standard handbook. Three treatises defend the holy images against the imperial ban."
    ]
  },
  josephus: {
    office: "Jewish historian",
    section: "Other Authors",
    paragraphs: [
      "Flavius Josephus (c. 37–c. 100) was a Jewish historian of the first century. A priest and a commander in the war against Rome, he later wrote in the capital under Flavian patronage.",
      "The Jewish War and the Antiquities of the Jews are primary sources for Second Temple Judaism and the fall of Jerusalem. Christian readers kept him because he describes the world of Jesus, John, James, and the early mission."
    ]
  },
  apostolic: {
    office: "Miscellaneous writings",
    kind: "collection",
    paragraphs: [
      "This shelf holds a mixed collection of anonymous and pseudonymous writings, from the first century to the ninth, printed with the Ante-Nicene Fathers. They are not by one author, and each work’s page gives its own date and what is known of its origin.",
      "Some are early, such as the homily known as Second Clement and the Apology of Aristides. Others are much later: the Apostolic Constitutions (c. 380), Greek apocalypses of the Byzantine period, the Pseudo-Isidorian Decretals (9th century), and Jewish writings such as the Testament of Abraham that Christians preserved."
    ]
  },
  // --- Minor ante-Nicene writers (ANF VI–VIII). Most are known only from fragments, chiefly in Eusebius. ---
  quadratus: {
    office: "Christian apologist",
    section: FRAGMENTS_SECTION,
    paragraphs: [
      "Quadratus (fl. c. 125) wrote the earliest known defence of Christianity, addressed to the emperor Hadrian. Eusebius calls him a disciple of the apostles; whether he was also the bishop of Athens of that name is uncertain.",
      "One sentence of the Apology survives, quoted by Eusebius. It says that some of those whom the Saviour healed and raised were still living in the writer’s own day."
    ]
  },
  aristo_pella: {
    office: "Christian apologist",
    section: FRAGMENTS_SECTION,
    paragraphs: [
      "Aristo of Pella (fl. c. 140) was a Jewish Christian from Pella, east of the Jordan. Eusebius cites him for the story of the Bar Kokhba war and Hadrian’s edict against the Jews.",
      "He is credited with the Disputation of Jason and Papiscus, a lost dialogue in which a Jewish Christian persuades an Alexandrian Jew from the Scriptures that Jesus is the Christ. Only a few lines and later descriptions remain."
    ]
  },
  dionysius_corinth: {
    office: "Bishop of Corinth",
    section: FRAGMENTS_SECTION,
    paragraphs: [
      "Dionysius (fl. c. 170) was bishop of Corinth. He wrote letters of counsel to churches from Sparta and Athens to Crete, Pontus, and Rome, which were gathered into a collection.",
      "Eusebius preserves a few passages of his letter to the Roman church. They thank Rome for its gifts to other churches, say that Clement’s letter was still read at Corinth, and state that Peter and Paul both taught in Italy and died there."
    ]
  },
  melito: {
    office: "Bishop of Sardis",
    paragraphs: [
      "Melito (d. c. 180) was bishop of Sardis in Asia Minor. Polycrates of Ephesus counts him among the great lights of Asia who kept Easter on the fourteenth day of the moon.",
      "He addressed an apology to Marcus Aurelius and drew up the earliest Christian list of the books of the Old Testament, after a journey to Palestine. Only fragments are printed here; several pieces under his name, among them the Syriac discourse and The Key, are later."
    ]
  },
  hegesippus: {
    office: "Church chronicler",
    section: FRAGMENTS_SECTION,
    paragraphs: [
      "Hegesippus (c. 110–c. 180) was probably a Jewish Christian from the East. He travelled by way of Corinth to Rome, noting in each church its succession of bishops and its agreement in teaching.",
      "His five books of Memoirs are lost. Eusebius quotes their accounts of the death of James the Lord’s brother, of the kinsmen of Jesus brought before Domitian, and of the first sects."
    ]
  },
  apollinaris_hierapolis: {
    office: "Bishop of Hierapolis",
    section: FRAGMENTS_SECTION,
    paragraphs: [
      "Claudius Apollinaris (fl. c. 175) was bishop of Hierapolis in Phrygia, the city of Papias a generation before. He addressed a defence of the faith to Marcus Aurelius and wrote against the Montanists.",
      "His books are lost. The few lines that survive speak of the Passover and of the legion whose prayers were said to have brought rain."
    ]
  },
  rhodon: {
    office: "Christian teacher at Rome",
    section: FRAGMENTS_SECTION,
    paragraphs: [
      "Rhodon (fl. c. 180) came from Asia Minor and studied at Rome under Tatian. He wrote against Marcion’s followers and on the six days of creation.",
      "Eusebius quotes his account of how the Marcionites had split into parties, and of his own debate with the aged Apelles, who held that those who hope in the Crucified will be saved if they are found in good works."
    ]
  },
  theophilus_caesarea: {
    office: "Bishop of Caesarea",
    section: FRAGMENTS_SECTION,
    paragraphs: [
      "Theophilus (fl. c. 190) was bishop of Caesarea in Palestine. With Narcissus of Jerusalem he presided over a synod on the date of Easter.",
      "A few lines of the synod’s letter survive in Eusebius. They ask that copies be sent to every church, and say that Palestine and Alexandria keep the feast on the same day."
    ]
  },
  maximus_jerusalem: {
    office: "Christian writer",
    section: FRAGMENTS_SECTION,
    paragraphs: [
      "Maximus (fl. late 2nd c.) is named by Eusebius as a writer of the time of Commodus and Severus. Later tradition made him a bishop of Jerusalem.",
      "Eusebius quotes a long passage under his name on the origin of evil and on whether matter is uncreated. The same passage is found in Methodius, On Free Will, so its author is disputed."
    ]
  },
  polycrates: {
    office: "Bishop of Ephesus",
    section: FRAGMENTS_SECTION,
    paragraphs: [
      "Polycrates (c. 130–c. 196) was bishop of Ephesus, the eighth bishop in his own family. He led the churches of Asia in the dispute over the date of Easter.",
      "His letter to Victor of Rome defends the Asian custom of keeping the feast on the fourteenth day of the moon. He appeals to the apostles Philip and John, to Polycarp, and to Melito, all buried in Asia."
    ]
  },
  pantaenus: {
    office: "Teacher at Alexandria",
    section: FRAGMENTS_SECTION,
    paragraphs: [
      "Pantaenus (d. c. 200) was a Stoic philosopher who became a Christian and headed the school for catechumens at Alexandria. Eusebius reports that he travelled as far as India to preach.",
      "He was the teacher of Clement of Alexandria, who calls him the best of his masters. He left almost nothing in writing; two short remarks on Scripture are preserved by Clement and by Maximus the Confessor."
    ]
  },
  asterius_urbanus: {
    office: "Writer against the Montanists",
    section: FRAGMENTS_SECTION,
    paragraphs: [
      "Asterius Urbanus is the name the older editions gave to an anonymous writer of Asia Minor (c. 192). The name comes from a phrase in the text itself, which most scholars now take to refer to a Montanist collection of oracles and not to the author, whose own name is unknown.",
      "His three books against the New Prophecy, addressed to Avircius Marcellus, are lost. Eusebius quotes their account of how Montanus began to prophesy and of the deaths of his first followers."
    ]
  },
  apollonius: {
    office: "Writer against the Montanists",
    section: FRAGMENTS_SECTION,
    paragraphs: [
      "Apollonius (fl. c. 200–210) was a churchman of Asia Minor, by later tradition of Ephesus. He wrote about forty years after Montanus first prophesied.",
      "His book is lost. The passages Eusebius quotes attack the conduct of the Montanist prophets: their taking of gifts, their paid preachers, and their claims to be martyrs."
    ]
  },
  serapion: {
    office: "Bishop of Antioch",
    section: FRAGMENTS_SECTION,
    paragraphs: [
      "Serapion (d. c. 211) was bishop of Antioch from about 190. He wrote against the Montanists and to Christians who had wavered under persecution.",
      "His best-known letter is to the church at Rhossus. He had at first let them read the Gospel of Peter, then examined it, found teaching in it that he could not accept, and withdrew his leave."
    ]
  },
  julius_africanus: {
    office: "Christian chronographer",
    paragraphs: [
      "Julius Africanus (c. 160–c. 240) was a soldier, a traveller, and a man of letters who lived at Emmaus (Nicopolis) in Palestine. He served the emperor Severus Alexander, for whom he arranged a library at Rome.",
      "His Chronography, in five books, was the first Christian history of the world from the creation; later chroniclers built on it. Two letters survive: one to Origen doubting the story of Susanna, and one to Aristides reconciling the genealogies of Jesus in Matthew and Luke."
    ]
  },
  alexander_jerusalem: {
    office: "Bishop of Jerusalem",
    section: FRAGMENTS_SECTION,
    paragraphs: [
      "Alexander (d. 251) was first a bishop in Cappadocia and then bishop of Jerusalem, where he founded a library that Eusebius later used. He had studied at Alexandria under Pantaenus and Clement.",
      "He was a friend and defender of Origen, whom he let preach while still a layman. He died in prison at Caesarea in the persecution of Decius. Fragments of four letters remain."
    ]
  },
  dionysius_rome: {
    office: "Bishop of Rome",
    section: FRAGMENTS_SECTION,
    paragraphs: [
      "Dionysius (d. 268) was bishop of Rome from 259, after the persecution of Valerian. He reorganised the Roman church and sent help to the churches of Cappadocia after a Gothic raid.",
      "When Dionysius of Alexandria was accused of dividing the Godhead, a Roman synod answered. The surviving passage, kept by Athanasius, rejects both the Sabellian merging of Father and Son and any talk of three separate gods."
    ]
  },
  malchion: {
    office: "Presbyter of Antioch",
    section: FRAGMENTS_SECTION,
    paragraphs: [
      "Malchion (fl. c. 268) was a presbyter of Antioch and the head of a school of rhetoric there. At the synod of 268 he questioned Paul of Samosata, the bishop of Antioch, and exposed his teaching.",
      "The synod deposed Paul and sent a letter to the bishops of Rome and Alexandria, which Malchion is said to have drafted. Parts of that letter and of the debate survive."
    ]
  },
  archelaus: {
    office: "Bishop in Mesopotamia",
    paragraphs: [
      "Archelaus (fl. c. 277) appears as a bishop of Carchar in Mesopotamia who met Mani in public debate and defeated him. Outside this account nothing is known of him.",
      "The Acts of the Disputation were written in the fourth century, probably by one Hegemonius, and survive in an old Latin translation. They are the earliest full Christian report of Mani’s life and teaching, and later writers against the Manichaeans drew on them."
    ]
  },
  theognostus: {
    office: "Teacher at Alexandria",
    section: FRAGMENTS_SECTION,
    paragraphs: [
      "Theognostus (fl. c. 265–282) taught at the school of Alexandria in the generation after Origen and Dionysius. He followed Origen closely.",
      "His Hypotyposes, in seven books, set out Christian doctrine in order; Photius read them and summarised their contents. Athanasius quotes him with approval on the Son’s being from the substance of the Father. Three short passages survive."
    ]
  },
  anatolius: {
    office: "Bishop of Laodicea",
    paragraphs: [
      "Anatolius (d. c. 283) was an Alexandrian, learned in arithmetic, geometry, astronomy, and philosophy, whom his fellow citizens asked to found a school of Aristotle’s teaching. He became bishop of Laodicea in Syria about 268.",
      "He wrote on the reckoning of Easter and proposed a nineteen-year cycle; Eusebius quotes a passage. The Paschal Canon printed under his name survives only in Latin, and its authenticity is disputed."
    ]
  },
  theonas: {
    office: "Bishop of Alexandria",
    paragraphs: [
      "Theonas (d. 300) was bishop of Alexandria from about 282. In his time the first church building in the city is said to have been raised, and Pierius and Achillas taught there.",
      "No genuine writing of his is known. The letter to Lucianus, the emperor’s chamberlain, on how Christians at court should behave, was published in the seventeenth century and is generally held to be a forgery of that date."
    ]
  },
  victorinus: {
    office: "Bishop of Pettau",
    paragraphs: [
      "Victorinus (d. c. 304) was bishop of Pettau in Pannonia, now Ptuj in Slovenia. He died a martyr in the persecution of Diocletian.",
      "He was the first to write commentaries on Scripture in Latin, drawing on Papias, Irenaeus, Hippolytus, and Origen. His commentary on the Apocalypse survives, in part as revised by Jerome, together with a short piece on the days of creation."
    ]
  },
  alexander_lycopolis: {
    office: "Philosopher",
    paragraphs: [
      "Alexander of Lycopolis (fl. c. 300) was a Platonist philosopher of Upper Egypt. Later tradition called him a bishop, but his book reads as the work of a pagan who respected the simple moral teaching of the Christians.",
      "His treatise against the Manichaeans is one of the earliest descriptions of their system by an outsider. It argues from philosophy, not from Scripture, that their account of matter, of the sun and moon, and of Christ cannot stand."
    ]
  },
  phileas: {
    office: "Bishop of Thmuis",
    section: FRAGMENTS_SECTION,
    paragraphs: [
      "Phileas (d. c. 306) was a wealthy and learned man who became bishop of Thmuis in the Nile Delta. He was beheaded at Alexandria in the Great Persecution.",
      "From prison he wrote to his flock about the tortures the martyrs of Alexandria endured; Eusebius quotes the letter. With three other imprisoned bishops he also wrote to Meletius of Lycopolis, rebuking him for ordaining in other bishops’ dioceses."
    ]
  },
  pamphilus: {
    office: "Presbyter of Caesarea",
    paragraphs: [
      "Pamphilus (d. 309) was a presbyter of Caesarea in Palestine. He built up the library that Origen had begun there, copied and corrected manuscripts of Scripture, and taught Eusebius, who took the name “Eusebius of Pamphilus” in his honour.",
      "In prison he wrote, with Eusebius, a Defence of Origen, of which the first book survives in Latin. He was martyred in 309. The summary of the chapters of Acts printed here is ascribed to him, though it is also handed down under another name."
    ]
  },
  pierius: {
    office: "Presbyter of Alexandria",
    section: FRAGMENTS_SECTION,
    paragraphs: [
      "Pierius (d. after 309) was a presbyter of Alexandria and head of its school under Bishop Theonas. He was famed for his learning, his preaching, and his poverty, and was called “the younger Origen.”",
      "He taught Pamphilus and is said to have spent his last years in Rome. His sermons are lost; a few remarks survive in Jerome and in Photius, who read a volume of twelve discourses."
    ]
  },
  peter_alexandria: {
    office: "Bishop of Alexandria",
    paragraphs: [
      "Peter (d. 311) became bishop of Alexandria in 300, after heading its school. He led the church through the Great Persecution and was beheaded in 311; the Egyptian church calls him “the seal of the martyrs.”",
      "His Canonical Epistle of 306 sets the terms on which Christians who had lapsed under persecution might be restored. It became part of the canon law of the Eastern churches. During his time in hiding, Meletius of Lycopolis began the schism that bears his name."
    ]
  },
  alexander_alexandria: {
    office: "Bishop of Alexandria",
    paragraphs: [
      "Alexander (d. 328) was bishop of Alexandria from about 313. When his presbyter Arius taught that the Son was a creature, Alexander called a synod of Egyptian bishops, which condemned Arius about 320.",
      "His two long letters warn other bishops against Arius and set out the faith that the Council of Nicaea confirmed in 325, where Alexander was a leading figure. His deacon and successor was Athanasius."
    ]
  },
  venantius: {
    office: "Bishop of Poitiers and poet",
    paragraphs: [
      "Venantius Fortunatus (c. 530–c. 609) was an Italian poet, educated at Ravenna, who settled in Gaul. He became chaplain to the convent of Queen Radegund at Poitiers and, late in life, bishop of the city.",
      "He wrote the hymns Vexilla regis and Pange lingua for the arrival of a relic of the cross, and many occasional poems and saints’ lives. The Easter poem printed here was long copied among the works of Lactantius."
    ]
  },
  unknown: {
    office: "Collected writings",
    kind: "collection",
    paragraphs: [
      "This shelf holds works that cannot be assigned to one father with confidence. Each work’s page gives what is known of its date and author."
    ]
  },
  ...MIGNE_FATHER_PROFILES
};
