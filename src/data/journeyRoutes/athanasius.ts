import type { Journey } from "../journeys";

const ath = (work: string, n: number) => "/fathers/athanasius/" + work + "/chapter-" + n + "/";
// Defence Against the Arians, reader chapters: 1 the Introduction, 2 the Encyclical of the Council of Egypt (to 20), 3 Julius (21–36),
// 4 Sardica (37–50), 5 Acts after Sardica (51–58), 6 the Meletian charges (59–70), 7 the Council of Tyre (71–90).
const apol = (n: number) => ath("defense-against-the-arians-apologia-contra-arianos", n);
const apolConst = ath("defense-before-constantius-apologia-ad-constantium", 1);
const fuga = ath("defense-of-his-flight-apologia-de-fuga", 1);
const festal = (n: number) => ath("festal-letters-and-index", n);
const acephala = ath("historia-acephala", 3);
const socrates = (n: number) => "/fathers/socrates/ecclesiastical-history/chapter-" + n + "/";
const gregory = "/fathers/gregory_nazianzen/panegyric-on-st-athanasius-oration-xxi/chapter-1/";

// Sea lane through the Hellespont and the Aegean, north to south, threading between the islands.
const AEGEAN: [number, number][] = [
  [40.0, 26.15],
  [39.65, 25.75],
  [38.95, 25.6],
  [38.35, 25.72],
  [37.75, 25.75],
  [37.2, 25.85],
  [36.95, 26.15],
  [36.45, 26.05],
  [35.9, 26.4]
];
// The Sea of Marmara, east to west, from Constantinople to the Hellespont.
const MARMARA: [number, number][] = [
  [40.95, 28.6],
  [40.75, 27.3],
  [40.42, 26.75]
];
// The coast road south from Antioch to Egypt.
const SYRIA_TO_EGYPT: [number, number][] = [
  [36.2, 36.16],
  [35.52, 35.78],
  [34.43, 35.84],
  [33.27, 35.2],
  [32.5, 34.9],
  [31.5, 34.45],
  [31.04, 32.55],
  [30.95, 31.3]
];
// Down the Nile, Hermopolis to Alexandria.
const NILE: [number, number][] = [
  [28.5, 30.85],
  [29.3, 31.2],
  [30.1, 31.2],
  [30.9, 30.45]
];

export const journey: Journey = {
  authorId: "athanasius",
  title: "Five exiles",
  summary:
    "Bishop of Alexandria for forty-five years, Athanasius was driven from his city five times, by four emperors, for holding to the faith of Nicaea. His exiles took him from Gaul to the Egyptian desert, and each time he came home to Alexandria.",
  note: "Places and dates are as Athanasius records them in his own defences and letters, with the Historia Acephala (an Alexandrian chronicle of his episcopate) and the historian Socrates. The texts usually say where he went but almost never by which road: the routes drawn follow the usual ways. Dashed lines mark journeys the texts do not record. Where he hid in 356–362 is not known; the desert marker stands at Hermopolis, where he went in 362–363. Alexandria appears four times, once for each homecoming.",
  stops: [
    {
      id: "nicaea",
      name: "Nicaea",
      today: "İznik, Turkey",
      lat: 40.43,
      lon: 29.72,
      label: "right",
      when: "325",
      text: "A deacon of the church of Alexandria, he comes to the great council at the side of his bishop, Alexander, who “brought him to Nicæa to assist him in the disputations there”.",
      sources: [{ label: "Socrates, Church History I.8, I.15", href: socrates(1) }]
    },
    {
      id: "alexandria",
      name: "Alexandria",
      today: "Alexandria, Egypt",
      lat: 31.2,
      lon: 29.92,
      label: "above",
      when: "Bishop, 328",
      text: "He succeeds Alexander as bishop in 328. Meletian enemies accuse him of breaking a chalice and of murdering a bishop, Arsenius, until Arsenius is “found to be alive”.",
      sources: [
        { label: "Socrates, Church History I.15", href: socrates(1) },
        { label: "Defence Against the Arians 59–70", href: apol(6) },
        { label: "Historia Acephala 17", href: acephala }
      ]
    },
    {
      id: "tyre",
      name: "Tyre",
      today: "Tyre (Sour), Lebanon",
      lat: 33.27,
      lon: 35.2,
      when: "Summer 335",
      text: "Summoned before a council packed with his enemies, he and the Egyptian bishops protest, then withdraw “as from an assembly of treacherous men”. The council judges him in his absence.",
      sources: [{ label: "Defence Against the Arians 77–85", href: apol(7) }]
    },
    {
      id: "constantinople",
      name: "Constantinople",
      today: "Istanbul, Turkey",
      lat: 41.01,
      lon: 28.98,
      label: "above",
      when: "Autumn 335",
      text: "He hurries to the capital and stops Constantine in the street; the emperor writes that Athanasius “approached me in the middle of the road”. Then a new charge, that he threatened the grain ships from Alexandria, turns Constantine against him.",
      sources: [{ label: "Defence Against the Arians 86–87", href: apol(7) }]
    },
    {
      id: "trier",
      name: "Trier",
      today: "Trier, Germany",
      lat: 49.75,
      lon: 6.64,
      when: "First exile, 335–337",
      text: "Constantine “sent me away into Gaul”. At Treveri the emperor's son keeps him “supplied abundantly with all necessaries” until Constantine's death in 337 frees him to go home.",
      sources: [
        { label: "Defence Against the Arians 87", href: apol(7) },
        { label: "Historia Acephala 17", href: acephala }
      ]
    },
    {
      id: "alexandria-2",
      name: "Alexandria, 337",
      today: "Alexandria, Egypt",
      lat: 31.2,
      lon: 29.92,
      label: "left",
      when: "Home, 337–339",
      text: "The younger Constantine sends him home. Within two years the Arians install Gregory of Cappadocia as bishop, and as soldiers sack the churches, “I withdrew myself from among them”.",
      wrote: [{ label: "Encyclical Letter to Bishops", href: ath("encyclical-letter-to-bishops-throughout-the-world", 1) }],
      sources: [
        { label: "Defence Against the Arians 87", href: apol(7) },
        { label: "Encyclical Letter 2–5", href: ath("encyclical-letter-to-bishops-throughout-the-world", 1) }
      ]
    },
    {
      id: "rome",
      name: "Rome",
      today: "Rome, Italy",
      lat: 41.89,
      lon: 12.49,
      when: "Second exile, 339–346",
      text: "He goes “only to Rome”, where Bishop Julius takes up his cause, and writes his Easter letter home “even from Rome”. Later he follows the court to Milan, Gaul, the Council of Sardica (343) and Aquileia.",
      wrote: [{ label: "Festal Letter XIII", href: festal(10) }],
      sources: [
        { label: "Defence Before Constantius 4", href: apolConst },
        { label: "Festal Letter XIII", href: festal(10) },
        { label: "Julius to the Eusebians", href: apol(3) },
        { label: "Letters of the Council of Sardica", href: apol(4) }
      ]
    },
    {
      id: "alexandria-3",
      name: "Alexandria, 346",
      today: "Alexandria, Egypt",
      lat: 31.2,
      lon: 29.92,
      label: "below",
      when: "Home, 346–356",
      text: "Recalled by Constantius, he sees the emperor at Antioch and the bishops at Jerusalem, and enters Alexandria on 21 October 346. Ten years later “more than five thousand soldiers” surround his church by night, and monks drag him to safety.",
      wrote: [{ label: "Defence of the Nicene Definition", href: ath("defense-of-the-nicene-definition-de-decretis", 1) }],
      sources: [
        { label: "Defence Against the Arians 51–57", href: apol(5) },
        { label: "History of the Arians 21–22", href: ath("history-of-the-arians-historia-arianorum", 4) },
        { label: "Defence Before Constantius 5", href: apolConst },
        { label: "Historia Acephala 1–5", href: acephala },
        { label: "Defence of His Flight 24", href: fuga }
      ]
    },
    {
      id: "desert",
      name: "The Egyptian desert",
      today: "El Ashmunein (Hermopolis), Egypt",
      lat: 27.78,
      lon: 30.8,
      label: "right",
      when: "Third and fourth exiles, 356–363",
      text: "He “turned back again into the desert”. The Historia Acephala counts these six years as spent at Alexandria and “in uncertain places in hiding”; just where is not recorded. Recalled under Julian, he was back in his church on 21 February 362, but after eight months Julian banished him again (“it is but a small cloud which will soon pass away”, he told his friends), and in October 362 he went up the Nile as far as Hermopolis.",
      wrote: [
        { label: "Defence Before Constantius", href: apolConst },
        { label: "Defence of His Flight", href: fuga },
        { label: "History of the Arians", href: ath("history-of-the-arians-historia-arianorum", 1) },
        { label: "On the Councils of Ariminum and Seleucia", href: ath("on-the-councils-of-ariminum-and-seleucia-de-synodis", 1) }
      ],
      sources: [
        { label: "Defence Before Constantius 32", href: apolConst },
        { label: "Gregory Nazianzen, Oration 21.19", href: gregory },
        { label: "Socrates, Church History III.14", href: socrates(3) },
        { label: "Historia Acephala 10–13, 17", href: acephala }
      ]
    },
    {
      id: "alexandria-4",
      name: "Alexandria, 364",
      today: "Alexandria, Egypt",
      lat: 31.2,
      lon: 29.92,
      label: "right",
      when: "Home, 364–373",
      text: "When Julian dies he sails to Antioch to meet the new emperor, Jovian, and is home early in 364. Apart from four months hiding at a villa by the river in 365, he stays with his people until he dies on 2 May 373 (3 May in the Historia Acephala).",
      sources: [
        { label: "Historia Acephala 13–19", href: acephala },
        { label: "Letter to the Emperor Jovian", href: ath("letter-to-the-emperor-jovian", 1) }
      ]
    }
  ],
  legs: [
    // The way home from Nicaea is not recorded; drawn by sea through the Hellespont and the Aegean.
    { from: "nicaea", to: "alexandria", by: "sea", certainty: "probable", via: [[40.42, 29.1], [40.8, 28.0], ...MARMARA.slice(1), ...AEGEAN, [35.45, 26.6], [34.5, 27.6]] },
    // The Egyptian bishops "came from Egypt to Tyre" (Apol. c. Ar. 78); the sea route along the coast is assumed.
    { from: "alexandria", to: "tyre", by: "sea", certainty: "attested", via: [[31.9, 31.0], [32.3, 33.0], [33.0, 34.7]] },
    // "I went up and represented to the Emperor" (Apol. c. Ar. 86). The sea route is assumed.
    {
      from: "tyre",
      to: "constantinople",
      by: "sea",
      certainty: "attested",
      via: [[33.6, 34.2], [34.2, 32.0], [34.6, 29.0], [35.2, 26.9], [35.45, 26.6], ...[...AEGEAN].reverse(), ...[...MARMARA].reverse()]
    },
    // "He sent me away into Gaul" (Apol. c. Ar. 87). The road is not recorded; drawn along the Danube highway.
    {
      from: "constantinople",
      to: "trier",
      by: "land",
      certainty: "attested",
      via: [[41.68, 26.56], [42.15, 24.75], [42.7, 23.32], [43.32, 21.9], [44.82, 20.46], [44.97, 19.6], [46.42, 15.87], [47.8, 13.04], [48.37, 10.9], [49.0, 8.4]]
    },
    // Sent home by Constantine II (Apol. c. Ar. 87). The road is not recorded; he probably met Constantius at
    // Viminacium and at Caesarea in Cappadocia on the way (Apol. ad Const. 5), so it is drawn through both.
    {
      from: "trier",
      to: "alexandria-2",
      by: "land",
      certainty: "attested",
      via: [[49.0, 8.4], [48.37, 10.9], [47.8, 13.04], [46.42, 15.87], [44.97, 19.6], [44.74, 21.21], [43.32, 21.9], [42.7, 23.32], [41.68, 26.56], [41.01, 28.98], [40.77, 29.92], [39.93, 32.86], [38.72, 35.49], [37.28, 34.78], [36.92, 34.9], ...SYRIA_TO_EGYPT]
    },
    // "When I left Alexandria, I did not go ... but only to Rome" (Apol. ad Const. 4). The sea route is assumed.
    { from: "alexandria-2", to: "rome", by: "sea", certainty: "attested", via: [[33.5, 27.0], [34.3, 24.5], [36.0, 20.5], [37.5, 16.5], [38.2, 15.62], [39.0, 14.8], [40.5, 13.4], [41.6, 12.25]] },
    // Julius writes that "he returns to you" (Apol. c. Ar. 52-53); Antioch and Jerusalem are recorded on the way
    // (Apol. ad Const. 5; Apol. c. Ar. 57). The roads between are not, drawn here by the Via Egnatia and Asia Minor.
    {
      from: "rome",
      to: "alexandria-3",
      by: "land",
      certainty: "attested",
      via: [[41.5, 14.0], [41.1, 16.0], [40.64, 17.94], [41.32, 19.45], [41.1, 20.8], [40.64, 22.94], [40.85, 25.9], [41.01, 28.98], [40.77, 29.92], [39.93, 32.86], [37.83, 34.6], [37.28, 34.78], [36.92, 34.9], [36.2, 36.16], [35.52, 35.78], [34.43, 35.84], [33.27, 35.2], [32.5, 34.9], [31.78, 35.23], [31.5, 34.45], [31.04, 32.55], [30.95, 31.3]]
    },
    // Where he hid in 356-362 is not recorded; drawn up the Nile to Hermopolis, where he went in 362-363.
    { from: "alexandria-3", to: "desert", by: "land", certainty: "probable", via: [...NILE].reverse() },
    // He "entered Alexandria secretly" on Julian's death (Historia Acephala 13). Down the Nile.
    { from: "desert", to: "alexandria-4", by: "land", certainty: "attested", via: NILE }
  ]
};
