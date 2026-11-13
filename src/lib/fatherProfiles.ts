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
  unknown: {
    office: "Collected writings",
    kind: "collection",
    paragraphs: [
      "This shelf holds works that cannot be assigned to one father with confidence. Each work’s page gives what is known of its date and author."
    ]
  },
  ...MIGNE_FATHER_PROFILES
};
