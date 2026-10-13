/** Office line and profile copy for the Fathers tab. Keyed by catalog author id. */
export type FatherProfile = {
  office: string;
  paragraphs: string[];
  /** Named section instead of a death-century. */
  section?: string;
};

export const FATHER_PROFILES: Record<string, FatherProfile> = {
  clement_rome: {
    office: "Bishop of Rome",
    paragraphs: [
      "Clement of Rome (fl. c. 96) was bishop of Rome at the end of the first century. The church remembered him among the first successors of Peter.",
      "His Letter to the Corinthians urges a divided church back to order, repentance, and the resurrection. It is the earliest Christian writing outside the New Testament that we can place in a known church."
    ]
  },
  ignatius: {
    office: "Bishop of Antioch",
    paragraphs: [
      "Ignatius of Antioch (d. c. 110) was bishop of Antioch in Syria. Arrested as a Christian, he was taken to Rome to die.",
      "On the road he wrote seven letters: to churches in Asia and to Polycarp. They are the early church’s plainest witness to the bishop, the eucharist, and a martyr’s hope."
    ]
  },
  polycarp: {
    office: "Bishop of Smyrna",
    paragraphs: [
      "Polycarp of Smyrna (c. 69–155) was bishop of Smyrna and a hearer of the apostle John. Irenaeus remembered him as a link to the apostles.",
      "His letter to the Philippians is pastoral and scriptural. The Martyrdom of Polycarp, written by his church, is the earliest account of a Christian martyrdom outside the New Testament."
    ]
  },
  papias: {
    office: "Bishop of Hierapolis",
    paragraphs: [
      "Papias of Hierapolis (fl. early 2nd c.) was bishop of Hierapolis in Asia. He collected what the elders said about the Lord’s words and the Gospels.",
      "His Expositions survive only in fragments, quoted by Irenaeus and Eusebius. Those fragments are a main early witness to how the church received Mark and Matthew."
    ]
  },
  hermas: {
    office: "Author of the Shepherd",
    paragraphs: [
      "Hermas (fl. 2nd c.) is the name given to the author of the Shepherd, a Roman apocalypse widely read in the early church.",
      "The book is a series of visions, mandates, and parables about repentance after baptism. It shows what a second-century Roman congregation was taught about sin, the church, and the Son of God."
    ]
  },
  barnabas: {
    office: "Early Christian letter",
    paragraphs: [
      "The Epistle of Barnabas (fl. 1st–2nd c.) is an early Christian letter, not a work of the apostle Barnabas. Its author is unknown.",
      "It reads Israel’s Scripture as speaking of Christ, and it closes with a teaching on the two ways. The early church copied it beside the Apostolic Fathers."
    ]
  },
  didache: {
    office: "Church order",
    paragraphs: [
      "The Didache (fl. 1st–2nd c.), or Teaching of the Twelve Apostles, is a short church manual, likely from Syria. No author’s name is attached to it.",
      "It gives the two ways, instructions for baptism, fasting, the eucharist, and traveling apostles, and a closing word on the end. It is the earliest church order we have."
    ]
  },
  mathetes: {
    office: "Author to Diognetus",
    paragraphs: [
      "Mathetes (fl. 2nd c.) is the unnamed disciple who wrote the Epistle to Diognetus. The name means “a disciple.”",
      "The letter tells a pagan inquirer how Christians live in the world without belonging to it, and why the Son was sent. It is one of the most finished pieces of early Christian prose."
    ]
  },
  justin: {
    office: "Christian apologist",
    paragraphs: [
      "Justin Martyr (c. 100–165) taught in Rome after a search through the philosophical schools. He was beheaded under the prefect Rusticus.",
      "His First Apology addresses the emperor in defense of Christians, and it describes their baptism and Sunday worship. The Dialogue with Trypho argues from Scripture that Jesus is the Christ."
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
      "Athenagoras (fl. late 2nd c.) was a Christian philosopher in Athens. He wrote to the emperors Marcus Aurelius and Commodus.",
      "A Plea for the Christians answers the charges of atheism, cannibalism, and incest. On the Resurrection argues that God can raise the body he made."
    ]
  },
  theophilus: {
    office: "Bishop of Antioch",
    paragraphs: [
      "Theophilus of Antioch (fl. late 2nd c.) was bishop of Antioch. He wrote three books to Autolycus, a pagan friend.",
      "The books defend the Christian God, tell the history of the world from Scripture, and answer Greek myth. Theophilus is an early writer to use the word “Trinity” of God."
    ]
  },
  irenaeus: {
    office: "Bishop of Lyons",
    paragraphs: [
      "Irenaeus of Lyons (c. 130–c. 202) was bishop of Lyons in Gaul. He had known Polycarp in Asia, and he wrote against teachers who split the God of Jesus from the Creator.",
      "Against Heresies sets out what the apostles preached and what the churches hold in common. His shorter Demonstration of the Apostolic Preaching walks the same faith from Scripture."
    ]
  },
  clement_alexandria: {
    office: "Teacher at Alexandria",
    paragraphs: [
      "Clement of Alexandria (c. 150–c. 215) taught in the catechetical school of Alexandria. He read Greek philosophy as a preparation for the Gospel.",
      "The Exhortation, the Instructor, and the Miscellanies lead a reader from conversion to a disciplined Christian life. He is the teacher who stands just before Origen."
    ]
  },
  hippolytus: {
    office: "Roman presbyter",
    paragraphs: [
      "Hippolytus (c. 170–c. 235) was a learned presbyter in Rome, later remembered as a martyr. A statue and a set of Greek writings preserve his name.",
      "The Refutation of All Heresies traces Christian errors to pagan philosophy. His commentaries and church order show how Scripture and liturgy were taught in the Roman church."
    ]
  },
  tertullian: {
    office: "Christian apologist",
    paragraphs: [
      "Tertullian (c. 155–c. 240) of Carthage was the first major Christian author to write in Latin. Trained as an advocate, he wrote with a lawyer’s edge.",
      "His Apology answers Roman charges against the church. Later works on baptism, repentance, the resurrection, and the Trinity shaped Latin theology, even where the church did not follow his rigorism."
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
      "Origen (c. 185–c. 254) succeeded Clement as the great teacher of Alexandria, and later taught in Caesarea. He learned Hebrew, collated the Hexapla, and preached through much of Scripture.",
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
      "Cyprian of Carthage (d. 258) was bishop of Carthage within a few years of his baptism. He led the North African church through plague and the Decian persecution, and he was beheaded in 258.",
      "His letters and treatises deal with the lapsed, baptism, and the unity of the church. On the Unity of the Church is his argument that the bishop and the one church belong together."
    ]
  },
  commodianus: {
    office: "Christian poet",
    paragraphs: [
      "Commodianus (fl. 3rd–5th c.) wrote Latin Christian verse of an uncertain date. The poems instruct pagans and believers in a rough, urgent style.",
      "The Instructions and the Carmen apologeticum warn of judgment and call readers to leave the gods. They show popular Christian teaching in the western churches."
    ]
  },
  dionysius: {
    office: "Third-century bishops",
    paragraphs: [
      "The Dionysius collection gathers letters and fragments from third-century bishops, above all Dionysius of Alexandria, a student of Origen. Related pieces from Rome and elsewhere sit with them.",
      "The letters treat persecution, the lapsed, the date of Easter, and how to speak of the Son. They are a bishop’s correspondence from the decades before Nicaea."
    ]
  },
  gregory_thaumaturgus: {
    office: "Bishop of Neocaesarea",
    paragraphs: [
      "Gregory Thaumaturgus (c. 213–c. 270) was bishop of Neocaesarea in Pontus. He had studied with Origen in Caesarea.",
      "His Declaration of Faith is a short rule of belief. The Panegyric to Origen thanks his teacher. Later churches remembered Gregory as the apostle of Pontus."
    ]
  },
  methodius: {
    office: "Bishop of Olympus",
    paragraphs: [
      "Methodius of Olympus (d. c. 311) was a bishop in Lycia, remembered as a martyr in the last persecution. He wrote in Greek against Origen on some points, and with him on others.",
      "The Symposium pictures virginity as a feast of ten virgins. On the Resurrection and On Free Will defend the body and human choice."
    ]
  },
  arnobius: {
    office: "Christian apologist",
    paragraphs: [
      "Arnobius of Sicca (fl. c. 300) taught rhetoric in North Africa and wrote Against the Nations after his conversion. His student Lactantius became the more lasting Latin apologist.",
      "The seven books attack the pagan gods and answer the claim that Christian neglect of the old cults had brought disaster on the empire."
    ]
  },
  lactantius: {
    office: "Christian rhetor",
    paragraphs: [
      "Lactantius (c. 250–325) taught rhetoric under Diocletian and later served Constantine. Jerome called him the Christian Cicero.",
      "The Divine Institutes is a full defense of Christian worship and justice. On the Deaths of the Persecutors tells how the emperors who attacked the church came to their ends."
    ]
  },
  eusebius: {
    office: "Bishop of Caesarea",
    paragraphs: [
      "Eusebius of Caesarea (c. 260–c. 339) was bishop of Caesarea and keeper of its library. He lived through the Great Persecution and the reign of Constantine.",
      "His Church History is the first large narrative of the Christian movement, built from documents he quotes. The Life of Constantine and the Preparation for the Gospel stand beside it."
    ]
  },
  aphrahat: {
    office: "Persian sage",
    paragraphs: [
      "Aphrahat (fl. 4th c.) was a Persian Christian sage who wrote in Syriac under the Persian kings. He is called the Persian Sage.",
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
      "Hilary of Poitiers (c. 310–c. 367) was bishop of Poitiers. Exiled to the East for defending the Nicene faith, he learned the Greek controversy at first hand.",
      "On the Trinity is the major Latin account of the Nicene faith in his generation. His commentaries on the Psalms and on Matthew brought eastern exegesis west."
    ]
  },
  athanasius: {
    office: "Bishop of Alexandria",
    paragraphs: [
      "Athanasius of Alexandria (c. 296–373) was bishop of Alexandria for forty-five years, many of them spent in exile. He defended the creed of Nicaea against the claim that the Son was a creature.",
      "On the Incarnation, written early, explains why the Word became man. The Life of Antony carried monasticism to the Latin world. His letters mark the twenty-seven books of the New Testament."
    ]
  },
  basil: {
    office: "Bishop of Caesarea",
    paragraphs: [
      "Basil the Great (c. 330–379) was bishop of Caesarea in Cappadocia. He organized monastic communities, cared for the poor, and argued for the divinity of the Holy Spirit.",
      "On the Holy Spirit and the treatise against Eunomius defend Nicene worship. His Longer and Shorter Rules, and his letters, shaped eastern monastic life."
    ]
  },
  cyril_jerusalem: {
    office: "Bishop of Jerusalem",
    paragraphs: [
      "Cyril of Jerusalem (c. 313–386) was bishop of Jerusalem. He catechized those preparing for baptism in the Church of the Holy Sepulchre.",
      "The Catechetical Lectures walk through the creed before baptism. The Mystagogical Lectures, after baptism, explain the rites the newly baptized had just received."
    ]
  },
  gregory_nazianzen: {
    office: "Bishop of Constantinople",
    paragraphs: [
      "Gregory Nazianzen (c. 329–390) was a Cappadocian bishop who briefly presided at Constantinople during the council of 381. He called himself a man made for contemplation more than for courts.",
      "The Theological Orations are the classic Greek account of the Trinity. His poems and funeral orations, including the one for Basil, are among the finest Greek of the fourth century."
    ]
  },
  gregory_nyssa: {
    office: "Bishop of Nyssa",
    paragraphs: [
      "Gregory of Nyssa (c. 335–c. 395) was bishop of Nyssa and the brother of Basil. He wrote the most speculative theology of the Cappadocians.",
      "Against Eunomius, the Great Catechism, and the Life of Moses set out how a finite mind speaks of the infinite God. His homilies on the Song of Songs read Scripture as the soul’s ascent."
    ]
  },
  ambrose: {
    office: "Bishop of Milan",
    paragraphs: [
      "Ambrose of Milan (c. 340–397) was governor of Liguria when the people of Milan demanded him as bishop. He baptized Augustine and stood up to emperors over the church’s independence.",
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
      "John Cassian (c. 360–c. 435) trained among the monks of Egypt and settled at Marseille. He founded the abbey of Saint Victor.",
      "The Institutes and the Conferences brought Egyptian monastic practice to Gaul: the eight thoughts, prayer, and the sayings of the desert fathers. The western rule of life learned its shape partly from him."
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
      "The history covers Constantine to about 425, with a particular interest in monks and in the churches of the East. It is a companion volume to Socrates and Theodoret."
    ]
  },
  theodoret: {
    office: "Bishop of Cyrrhus",
    paragraphs: [
      "Theodoret of Cyrrhus (c. 393–c. 458) was bishop of Cyrrhus in Syria. He was a theologian of the Antiochene school and a correspondent in the debates that led to Chalcedon.",
      "His Church History, the Religious History of Syrian monks, and commentaries on Paul and the prophets are major Greek sources. Eranistes is his dialogue on the person of Christ."
    ]
  },
  leo: {
    office: "Bishop of Rome",
    paragraphs: [
      "Leo the Great (c. 400–461) was bishop of Rome from 440. He met Attila, dealt with the collapse of imperial order in the West, and taught a clear doctrine of Christ.",
      "The Tome to Flavian, read at Chalcedon, states that Christ is one person in two natures. His sermons for the liturgical year are the finest Latin preaching of the fifth century."
    ]
  },
  councils: {
    office: "The great councils",
    section: "Councils",
    paragraphs: [
      "The ecumenical councils (325–787) were gatherings of bishops that the wider church received as decisive. Nicaea, Constantinople, Ephesus, Chalcedon, and the later councils in Constantinople and Nicaea settled how the church speaks of the Trinity and of Christ.",
      "Patrista files their creeds, canons, and related acts together. They are not the work of one father. They are the church’s common decisions, and the fathers on this page wrote, argued, and preached around them."
    ]
  },
  gregory: {
    office: "Bishop of Rome",
    paragraphs: [
      "Gregory the Great (c. 540–604) was bishop of Rome from 590. He had been prefect of the city and a monk, and he governed a church in a Italy broken by war and plague.",
      "The Pastoral Rule became the western handbook for bishops. The homilies on the Gospels and on Ezekiel, the Dialogues, and the letters show a pastor who also sent a mission to the English."
    ]
  },
  john_damascus: {
    office: "Monk of Mar Saba",
    paragraphs: [
      "John of Damascus (c. 675–749) was a monk at Mar Saba near Jerusalem. He had served in the fiscal administration of the caliph before he left for the monastery.",
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
    office: "Early Christian writings",
    paragraphs: [
      "Apostolic Fathers (misc.) gathers early Christian pieces that sit with the Apostolic Fathers but are not filed under one named author.",
      "They are short, early, and close to the New Testament in time. Open a title to read the English text with the rest of the library."
    ]
  },
  unknown: {
    office: "Collected writings",
    paragraphs: [
      "Unknown / Collected holds works in the library that cannot be assigned to one father with confidence.",
      "The English text is still readable here. Where a traditional name is disputed, the work’s own page says so."
    ]
  }
};
