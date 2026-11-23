/**
 * Short overviews for static work pages and the reader. Keyed by catalog work id.
 * Works with no entry show no Overview row. Add further works here; do not hardcode copy in components.
 */
import { escapeHtml } from "./fatherPaths";

export type WorkOverview = {
  /** Two to four plain sentences: what the work is, what it covers, why it matters. */
  text: string;
  /** author · approximate date · books/chapters · translator (year), when known. */
  facts: string;
};

/** The Confessions reference text from issue #304, item 9. */
export const CONFESSIONS_OVERVIEW_TEXT =
  "Augustine tells the story of his life, from infancy in North Africa to his conversion in a garden at Milan in 386 and the death of his mother Monica at Ostia, written throughout as a prayer addressed to God. Books I–IX are the story; Books X–XIII turn to memory, time, and the opening chapters of Genesis. It is the first great autobiography of the Christian West, and the source of \"Thou madest us for Thyself, and our heart is restless, until it repose in Thee.\"";

export const CONFESSIONS_OVERVIEW_FACTS =
  "Augustine of Hippo · written c. 397–400 · 13 books · tr. E. B. Pusey (1838)";

export const OVERVIEW_OPEN_KEY = "fg-overview-open";

export const WORK_OVERVIEWS: Record<string, WorkOverview> = {
  // --- Confessions (approved reference) ---
  confessions: {
    text: CONFESSIONS_OVERVIEW_TEXT,
    facts: CONFESSIONS_OVERVIEW_FACTS
  },

  // --- Apostolic Fathers ---
  didache: {
    text: "The Didache, or Teaching of the Twelve Apostles, is a short anonymous church order, probably from Syria. It sets out the Two Ways, and gives instructions for baptism, fasting, prayer, the eucharist, traveling teachers, and the community's life together. It is the earliest surviving church manual, and a main witness to worship and discipline in the generation after the apostles.",
    facts: "Anonymous · late 1st or early 2nd c. · 16 chapters"
  },
  "first-epistle-of-clement": {
    text: "The letter known as 1 Clement is sent from the church at Rome to the church at Corinth, urging an end to a revolt against the established presbyters. It argues from Scripture for order, repentance, and hope in the resurrection, and it appeals to the examples of Peter and Paul. It is among the earliest Christian writings outside the New Testament, and a chief witness to the Roman church at the end of the first century.",
    facts: "the church of Rome · written c. 96 · 59 chapters"
  },
  "clement-rome-the-homily": {
    text: "The work traditionally called 2 Clement is an early Christian homily, not a letter from Clement of Rome. It calls its hearers to repentance, to purity, and to hope in the resurrection, and it quotes sayings of Jesus alongside the Scriptures. It is one of the oldest surviving Christian sermons.",
    facts: "Anonymous · mid-2nd c. · 20 chapters · traditionally ascribed to Clement"
  },
  "epistles-of-ignatius": {
    text: "On the road to martyrdom in Rome, Ignatius of Antioch wrote seven letters: to Ephesus, Magnesia, Tralles, Rome, Philadelphia, Smyrna, and to Polycarp. They insist on the one bishop, the reality of Christ's flesh, and the eucharist as the flesh of Christ, and they show a bishop going to his death. They are the early church's plainest witness to episcopacy and to a martyr's hope.",
    facts: "Ignatius of Antioch · written c. 110 · seven letters"
  },
  "epistle-to-the-philippians": {
    text: "Polycarp's letter to the church at Philippi is a pastoral exhortation, dense with Scripture, on righteousness, endurance, and the care of widows and the young. It mentions Ignatius's letters and the recent deaths of martyrs. It is a chief surviving writing of a man Irenaeus says had known apostles.",
    facts: "Polycarp of Smyrna · early 2nd c. · 14 chapters"
  },
  "martyrdom-of-polycarp": {
    text: "The Martyrdom of Polycarp is a letter from the church of Smyrna describing the arrest, trial, and burning of its aged bishop. It presents his death as a witness conformed to Christ's, and it is the earliest surviving account of a Christian martyrdom outside the New Testament. Later copies add a few editorial notes; the core narrative is early.",
    facts: "the church of Smyrna · written c. 155–160 · 22 chapters"
  },
  "epistle-of-barnabas": {
    text: "The Epistle of Barnabas is an anonymous early Christian letter, not the work of the apostle Barnabas. It reads Israel's Scriptures as speaking of Christ, and it closes with a teaching on the Two Ways. Some churches copied it with the New Testament: Codex Sinaiticus places it after Revelation.",
    facts: "Anonymous · often dated c. 130 · 21 chapters"
  },
  "pastor-of-hermas": {
    text: "The Shepherd of Hermas is a Roman apocalypse: a series of visions, mandates, and parables on repentance after baptism. The author names himself Hermas. It was widely read in the second and third centuries, and the Muratorian fragment places its composition while Pius was bishop of Rome.",
    facts: "Hermas · mid-2nd c. · Visions, Mandates, and Similitudes"
  },
  "epistle-to-diognetus": {
    text: "The Epistle to Diognetus is an anonymous apology, written to a pagan inquirer named Diognetus. It describes how Christians live in the world without belonging to it, and why the Son was sent. Chapters 11 and 12 differ in style and are likely a later piece joined to it; the whole is among the most finished short works of early Christian prose.",
    facts: "Anonymous · often placed in the late 2nd c. · 12 chapters"
  },
  "fragments-of-papias": {
    text: "Papias of Hierapolis collected what the elders said about the Lord's words and the Gospels. His Expositions survive only in fragments, quoted chiefly by Irenaeus and Eusebius. Those fragments are a main early witness to how the church received Mark and Matthew.",
    facts: "Papias of Hierapolis · early 2nd c. · fragments"
  },

  // --- Apologists and the second–third centuries ---
  "first-apology": {
    text: "Justin's First Apology addresses the emperor in defense of Christians against charges of atheism and immorality. It describes their baptism and Sunday worship, and it argues that the prophets foretold Christ. It is the fullest early account of how a mid-second-century Roman congregation prayed and broke bread.",
    facts: "Justin Martyr · written c. 155 · 68 chapters"
  },
  "dialogue-with-trypho": {
    text: "The Dialogue with Trypho is Justin's long conversation with a Jewish teacher, set after the Bar Kokhba war. It argues from the Scriptures that Jesus is the Christ, and it discusses circumcision, the law, and the conversion of the nations. It is the earliest surviving Christian–Jewish dialogue of any length.",
    facts: "Justin Martyr · after the First Apology · 142 chapters"
  },
  "against-heresies": {
    text: "Against Heresies sets out the teaching Irenaeus received from the churches, against Valentinian and other gnostic systems that split the Father of Jesus from the Creator. It argues from the rule of faith, the succession of the bishops, and a reading of Scripture that keeps the one God. It is the chief surviving account of second-century gnostic teaching, and the classic statement of the apostolic tradition in the West.",
    facts: "Irenaeus of Lyons · written c. 180 · 5 books"
  },
  apology: {
    text: "Tertullian's Apology answers Roman charges against the Christians: atheism, treason, incest, and cannibalism. It argues that the church is harmless, that persecution is unjust, and that the soul itself bears witness to God. It is the great Latin defense of the church under the Severan age.",
    facts: "Tertullian · written c. 197 · 50 chapters"
  },
  "prescription-against-heretics": {
    text: "The Prescription against Heretics argues that heretics have no right to the Scriptures, because the rule of faith and the apostolic churches already settle what the churches hold. Tertullian traces error to philosophy and to later teachers, and he points to the churches founded by the apostles. It is his short, sharp case for tradition as the gate of interpretation.",
    facts: "Tertullian · written c. 200 · 44 chapters · tr. Peter Holmes"
  },
  "who-is-the-rich-man-that-shall-be-saved": {
    text: "Clement of Alexandria's sermon on Mark 10 asks how a rich Christian can be saved. It reads the command to sell all as a command to strip the soul of its passions, not as a ban on property as such. It is a chief early treatment of wealth, almsgiving, and the rich young man.",
    facts: "Clement of Alexandria · early 3rd c. · one sermon"
  },
  stromata: {
    text: "The Stromata, or Miscellanies, is Clement of Alexandria's long, deliberately unsystematic work of Christian philosophy. It treats Scripture, Greek learning, knowledge, and the true gnostic as the mature believer. Together with the Exhortation and the Instructor, it leads a reader from conversion toward a disciplined Christian life.",
    facts: "Clement of Alexandria · early 3rd c. · 8 books"
  },
  "against-celsus": {
    text: "Against Celsus answers the True Word, a pagan philosopher's attack on Christianity that Origen quotes at length. It defends the incarnation, the resurrection, and the church's appeal to the simple as well as to the learned. It is the great third-century apology, and the chief surviving record of an informed pagan case against the church.",
    facts: "Origen · written c. 248 · 8 books"
  },
  "de-principiis": {
    text: "On First Principles (De Principiis) is Origen's attempt at a connected Christian theology: God, the rational creatures, the world, and the interpretation of Scripture. The Greek is largely lost; it survives mainly in Rufinus's Latin, which softens some of Origen's bolder speculations. It is the first large Christian systematic work, and later controversy over Origen turned on it.",
    facts: "Origen · written c. 220–230 · 4 books"
  },
  "on-the-unity-of-the-church": {
    text: "On the Unity of the Church is Cyprian's tract, written in the aftermath of the Decian persecution, on the one episcopate and the one church. It argues that schism is as deadly as apostasy, and that the chair of Peter is the source of unity. Two forms of a famous paragraph on Rome survive; both are early.",
    facts: "Cyprian of Carthage · written 251 · one treatise"
  },
  "divine-institutes": {
    text: "The Divine Institutes is Lactantius's large Latin apology, written through the Great Persecution and dedicated, in a later form, to Constantine. It attacks pagan religion and philosophy, and it sets out providence, justice, and the true worship of God. It is the first Christian work in Latin on that scale, by a teacher of rhetoric at the imperial court.",
    facts: "Lactantius · written c. 304–313 · 7 books · tr. William Fletcher"
  },

  // --- Church histories and related ---
  "church-history": {
    text: "Eusebius's Church History traces the church from the apostles to his own day, through persecutions, bishops, writers, and the peace under Constantine. It preserves quotations from many works now lost, including Papias, Hegesippus, and letters of Dionysius of Alexandria. It is the foundational narrative of early church history, completed in the form we have after Constantine's victory.",
    facts: "Eusebius of Caesarea · completed c. 324 · 10 books"
  },
  "ecclesiastical-history": {
    text: "Socrates Scholasticus continues Eusebius from Constantine to the seventeenth consulate of Theodosius II. A lawyer at Constantinople, he writes of councils, bishops, and the Arian and Nestorian controversies with an eye for documents and for the city's public life. His history is the most straightforward of the fifth-century Greek church histories.",
    facts: "Socrates Scholasticus · written c. 439 · 7 books"
  },
  "sozomen-ecclesiastical-history": {
    text: "Sozomen's Ecclesiastical History covers much the same ground as Socrates, from Constantine to the early fifth century, and is dedicated to Theodosius II. A lawyer from Palestine writing at Constantinople, he makes more room for monks, miracles, and the conversion of peoples on the empire's edge. He used Socrates and other sources, and he often preserves details Socrates omits.",
    facts: "Sozomen · written in the 440s · 9 books"
  },
  "theodoret-ecclesiastical-history": {
    text: "Theodoret's Ecclesiastical History runs from Constantine to the death of Theodore of Mopsuestia. Bishop of Cyrrhus and a leading Antiochene theologian, he writes with the documents of the eastern controversies at hand. The work is one of the four great fifth-century Greek church histories, alongside Eusebius's continuators Socrates and Sozomen.",
    facts: "Theodoret of Cyrrhus · mid-5th c. · 5 books"
  },
  "jerome-lives-of-illustrious-men": {
    text: "Jerome's Lives of Illustrious Men is a catalogue of Christian writers, from Peter to Jerome himself, with brief notices of their books. It was written at Bethlehem as a Christian counterpart to Suetonius, and it became the starting-point for later literary history of the church. Gennadius of Marseilles later added a continuation.",
    facts: "Jerome · written 392–393 · 135 notices"
  },
  conferences: {
    text: "The Conferences report John Cassian's conversations with Egyptian abbots on the inner life: prayer, discretion, purity of heart, and the eight principal faults. Written for monks in Gaul, they transmit desert teaching to the Latin West. Benedict later named them among the books a monastery should hear.",
    facts: "John Cassian · written c. 426–429 · 24 conferences"
  },
  "on-the-making-of-man": {
    text: "On the Making of Man is Gregory of Nyssa's sequel to his brother Basil's Hexaemeron. It treats humanity in the image of God, resurrection, and the dignity of the body. It is a chief Cappadocian account of what it is to be human.",
    facts: "Gregory of Nyssa · written c. 379 · one treatise"
  },

  // --- Athanasius, Cappadocians, Chrysostom, Cyril ---
  "on-the-incarnation-of-the-word": {
    text: "On the Incarnation argues that the Word became man to undo death and restore the image of God in human beings, against both pagan mockery and Arian denial of the Son. It pairs with Against the Heathen as Athanasius's early double work on the faith. It remains the most widely read short statement of Nicene Christianity.",
    facts: "Athanasius of Alexandria · often dated c. 318 · one treatise"
  },
  "four-discourses-against-the-arians": {
    text: "The Discourses against the Arians are Athanasius's long scriptural case that the Son is true God, not a creature. They examine the Arian slogans and the verses on which they rested, especially from Proverbs, the Gospels, and Paul. They are the central dogmatic work of his anti-Arian writings.",
    facts: "Athanasius of Alexandria · 4th c. · four discourses"
  },
  "life-of-antony": {
    text: "The Life of Antony tells the story of the Egyptian hermit Antony, his withdrawal to the desert, his contests with demons, and his teaching. Written soon after Antony's death, it spread the monastic ideal through East and West; Augustine records its effect on Latin readers. It is the classic life of a Christian monk.",
    facts: "Athanasius of Alexandria · written c. 356–362 · one Life"
  },
  "catechetical-lectures": {
    text: "Cyril of Jerusalem's Catechetical Lectures were delivered to those preparing for baptism, and they expound the Jerusalem creed clause by clause. They describe the city's liturgy and the holy places, and they warn against heresy. They are a principal witness to fourth-century baptismal teaching in Jerusalem.",
    facts: "Cyril of Jerusalem · delivered c. 350 · Procatechesis and 18 lectures"
  },
  "basil-on-the-holy-spirit": {
    text: "On the Holy Spirit defends the full divinity of the Spirit against those who numbered him with the creatures. Basil argues from the church's doxology, from baptism, and from Scripture that the Spirit is worshiped with the Father and the Son. It is the classic Cappadocian treatise on the Spirit, written for Amphilochius of Iconium.",
    facts: "Basil the Great · written 375 · 30 chapters"
  },
  "five-theological-orations-orations-xxvii-xxxi": {
    text: "The Five Theological Orations were preached at Constantinople against Eunomian and Macedonian teaching. Gregory Nazianzen treats the limits of theology, the Son, and the Holy Spirit, in the years around the council of 381. They are the most famous short statement of Cappadocian trinitarian doctrine.",
    facts: "Gregory Nazianzen · preached c. 380 · five orations"
  },
  "great-catechism": {
    text: "The Great Catechism is Gregory of Nyssa's handbook for catechists on the Trinity, the incarnation, baptism, and the eucharist. It answers pagan and Jewish objections in a connected argument. It is his most systematic short work of doctrine.",
    facts: "Gregory of Nyssa · late 4th c. · one catechism"
  },
  "on-the-priesthood": {
    text: "On the Priesthood is a dialogue on the burden and dignity of the priest's office, the care of souls, and the danger of ambition. Chrysostom wrote it at Antioch, before his years as bishop of Constantinople. It became the standard Greek treatise on the pastoral office.",
    facts: "John Chrysostom · written at Antioch · 6 books · tr. W. R. W. Stephens"
  },
  "homilies-on-matthew": {
    text: "The Homilies on Matthew are Chrysostom's consecutive sermons on the First Gospel, preached at Antioch. They combine close reading of the text with moral exhortation on almsgiving, oaths, anger, and the life of the city. They are his longest Gospel commentary, and a chief monument of Antiochene preaching.",
    facts: "John Chrysostom · preached at Antioch · 90 homilies · tr. Sir George Prevost"
  },

  // --- Augustine ---
  "city-of-god": {
    text: "The City of God answers those who blamed Christianity for the sack of Rome in 410. Augustine traces two cities, of God and of the world, through biblical history and Roman religion, and he treats providence, last things, and the meaning of an earthly empire. It is his largest work, and the great Latin meditation on church and world.",
    facts: "Augustine of Hippo · written c. 413–426 · 22 books · tr. Marcus Dods"
  },
  "on-the-holy-trinity": {
    text: "On the Trinity is Augustine's long inquiry into the one God who is Father, Son, and Spirit. The early books gather the scriptural faith; the later books seek created images of the Trinity in the human mind, especially memory, understanding, and will. It is the principal Latin work on the Trinity in the centuries after Nicaea.",
    facts: "Augustine of Hippo · written c. 399–419 · 15 books · tr. Arthur West Haddan"
  },
  "on-christian-doctrine": {
    text: "On Christian Doctrine is Augustine's handbook for interpreting and preaching Scripture. It treats things and signs, the double command of love as the end of the law, and, in a book added years later, the manner of Christian eloquence. It shaped Latin exegesis and preaching through the Middle Ages.",
    facts: "Augustine of Hippo · begun 396, Book IV 426 · 4 books · tr. J. F. Shaw"
  },
  "on-the-spirit-and-the-letter": {
    text: "On the Spirit and the Letter answers the claim that human nature can keep God's law without grace. Augustine reads Paul on letter and Spirit, on the law that convicts and the Spirit that gives life. It is a central statement of his teaching on grace, written early in the Pelagian controversy.",
    facts: "Augustine of Hippo · written 412 · 67 chapters"
  },
  "on-nature-and-grace": {
    text: "On Nature and Grace replies to Pelagius's book On Nature. Augustine argues that nature is not enough after the fall, and that grace heals the will as well as forgives guilt. It is one of his chief anti-Pelagian treatises.",
    facts: "Augustine of Hippo · written 415 · 85 chapters"
  },
  "on-the-merits-and-forgiveness-of-sins": {
    text: "On the Merits and Forgiveness of Sins, and on the Baptism of Infants, is Augustine's first large anti-Pelagian work. It defends infant baptism and original sin from Scripture, against those who said newborns have no guilt. It opened the controversy that occupied his last two decades.",
    facts: "Augustine of Hippo · written 411–412 · 3 books"
  },
  "against-two-letters-of-the-pelagians": {
    text: "Against Two Letters of the Pelagians answers letters from Julian of Eclanum and other Pelagian bishops. Augustine defends grace, original sin, and the condemnation of Pelagius at Carthage and in Italy. It is a major work of the later, more technical stage of the controversy.",
    facts: "Augustine of Hippo · written 420 · 4 books"
  },
  "on-grace-and-free-will": {
    text: "On Grace and Free Will was written to monks at Hadrumetum who feared that Augustine's teaching on grace destroyed human willing. He argues that free will is real and that it is grace which makes it good. It belongs with On Rebuke and Grace as his answer to that monastery.",
    facts: "Augustine of Hippo · written 426–427 · 47 chapters"
  },
  "on-the-predestination-of-the-saints": {
    text: "On the Predestination of the Saints, with its companion On the Gift of Perseverance, answers Gallic monks who accepted grace but hesitated at predestination. Augustine argues that faith itself is a gift, and that those who are saved are saved by God's prior choice. It is his last major statement on the subject.",
    facts: "Augustine of Hippo · written 428–429 · 43 chapters"
  },

  // --- Later Latin and Greek classics ---
  commonitory: {
    text: "The Commonitory of Vincent of Lérins offers a rule for distinguishing catholic teaching from novelty: what has been believed everywhere, always, and by all. Written under the name Peregrinus, it is a Gallic response to the controversies of the early fifth century. It became the classic Latin slogan for tradition, whatever its later uses.",
    facts: "Vincent of Lérins · written 434 · 33 chapters · tr. C. A. Heurtley"
  },
  "book-of-pastoral-rule": {
    text: "The Book of Pastoral Rule is Gregory the Great's handbook for bishops: who should be called to rule, how they should live, and how they should admonish different kinds of hearers. Written as he took up the see of Rome, it was translated into Greek in his lifetime and became a standard of pastoral care in East and West.",
    facts: "Gregory the Great · written c. 590 · one book"
  },
  "exposition-of-the-orthodox-faith": {
    text: "The Exposition of the Orthodox Faith is John of Damascus's summary of Christian doctrine, the third part of his Fountain of Knowledge. It gathers the Greek Fathers on the Trinity, the incarnation, the two natures, and the sacraments, including a defense of the holy images. It is the standard medieval handbook of Eastern Orthodox dogma.",
    facts: "John of Damascus · early 8th c. · 4 books"
  },

  // --- Ecumenical councils ---
  "first-ecumenical-council-nicea-i-325": {
    text: "The First Council of Nicaea, called by Constantine in 325, condemned Arius and confessed the Son as true God, of one substance with the Father. Its creed, its twenty canons, and the paschal settlement are the first ecumenical acts of the church. Later councils treated its faith as the standard they expanded.",
    facts: "the bishops at Nicaea · 325 · creed and 20 canons"
  },
  "second-ecumenical-council-constantinople-i-381": {
    text: "The First Council of Constantinople, in 381, reaffirmed Nicaea and confessed the Holy Spirit as Lord and life-giver, worshiped with the Father and the Son. Its creed is the form now commonly called Nicene. It also settled the see of Constantinople and addressed remaining Arian and Macedonian teaching in the East.",
    facts: "the bishops at Constantinople · 381 · the Constantinopolitan creed"
  },
  "third-ecumenical-council-ephesus-431": {
    text: "The Council of Ephesus, in 431, upheld Cyril of Alexandria against Nestorius of Constantinople, and confessed Mary as Theotokos, God-bearer. It received Cyril's second letter to Nestorius and condemned a division of Christ into two persons. It is the third of the seven councils this library holds.",
    facts: "the bishops at Ephesus · 431 · the Theotokos and the condemnation of Nestorius"
  },
  "fourth-ecumenical-council-chalcedon-451": {
    text: "The Council of Chalcedon, in 451, confessed Christ as one person in two natures, without confusion, change, division, or separation. It received Leo's Tome and Cyril's letters, and it deposed Dioscorus of Alexandria. Its definition became the Christological standard of the imperial church, and a lasting cause of division with those who rejected it.",
    facts: "the bishops at Chalcedon · 451 · the Chalcedonian definition"
  },
  "fifth-ecumenical-council-constantinople-ii-553": {
    text: "The Second Council of Constantinople, in 553, under Justinian, condemned the Three Chapters and certain propositions associated with Origen. It meant to hold Chalcedon while satisfying opponents of Theodore of Mopsuestia, Theodoret's anti-Cyrilline writings, and Ibas's letter to Maris. It is the fifth of the seven ecumenical councils.",
    facts: "the bishops at Constantinople · 553 · the Three Chapters"
  },
  "sixth-ecumenical-council-and-trullo-680-692": {
    text: "The Third Council of Constantinople, in 680–681, condemned monoenergism and monothelitism and confessed two natural wills in Christ. The canons often joined with it are those of the Quinisext Council in Trullo (692), which legislated for eastern church order. Together they form the sixth-century cluster in this library's council shelf.",
    facts: "the bishops at Constantinople · 680–681 and 692 · two wills in Christ, and the Trullan canons"
  },
  "seventh-ecumenical-council-nicea-ii-787": {
    text: "The Second Council of Nicaea, in 787, restored the veneration of holy images after the first period of imperial iconoclasm. It distinguished veneration from the worship due to God alone, and it ordered the return of icons to the churches. It is the last of the seven councils this library holds.",
    facts: "the bishops at Nicaea · 787 · the restoration of the holy images"
  }
};

export function workOverview(workId: string): WorkOverview | undefined {
  return WORK_OVERVIEWS[workId];
}

export function workOverviewIds(): string[] {
  return Object.keys(WORK_OVERVIEWS);
}

/** First sentence of the overview, for meta and JSON-LD descriptions. */
export function workOverviewFirstSentence(workId: string): string {
  const o = WORK_OVERVIEWS[workId];
  return o ? firstSentence(o.text) : "";
}

export function firstSentence(text: string): string {
  const re = /[.!?](?=["”']?(?:\s|$))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const end = m.index + 1;
    const before = text.slice(0, end);
    if (/\b(?:c|St|Mt|Dr|Mr|Mrs|cf|ch|vol|pp|AD|BC|[A-Z])\.$/.test(before)) continue;
    return before.trim();
  }
  return text.trim();
}

export function workOverviewHtml(workId: string): string {
  const o = WORK_OVERVIEWS[workId];
  if (!o) return "";
  return [
    '<details class="work-overview">',
    "<summary>Overview</summary>",
    "<p>" + escapeHtml(o.text) + "</p>",
    '<p class="work-overview-facts">' + escapeHtml(o.facts) + "</p>",
    "</details>"
  ].join("\n");
}

/** Restore the reader's last open/closed choice on a static work page. */
export function workOverviewScript(): string {
  return (
    "<script>(function(){try{var d=document.querySelector('details.work-overview');if(!d)return;" +
    "if(localStorage.getItem('" +
    OVERVIEW_OPEN_KEY +
    "')==='on')d.setAttribute('open','');" +
    "d.addEventListener('toggle',function(){localStorage.setItem('" +
    OVERVIEW_OPEN_KEY +
    "',d.open?'on':'off')})}catch(e){}})();</script>"
  );
}

export function storedOverviewOpen(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(OVERVIEW_OPEN_KEY) === "on";
}

export function setStoredOverviewOpen(open: boolean): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(OVERVIEW_OPEN_KEY, open ? "on" : "off");
}
