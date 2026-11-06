import type { Journey } from "../journeys";

// The library's Conferences have one reader chapter per Conference, with the three prefaces as chapters of their
// own: chapter 1 is the Preface to I–X, 2–11 are Conferences I–X, 12 the Preface to XI–XVII, 13–19 Conferences
// XI–XVII, 20 the Preface to XVIII–XXIV, and 21–27 Conferences XVIII–XXIV.
const conf = (n: number) => "/fathers/cassian/conferences/chapter-" + n + "/";
// Institutes reader chapters: 1 is the Preface, 2–13 are Books I–XII.
const inst = (n: number) => "/fathers/cassian/institutes-of-the-coenobia/chapter-" + n + "/";
const incarnation = (n: number) => "/fathers/cassian/on-the-incarnation-of-the-lord-against-nestorius/chapter-" + n + "/";
const gennadius = "/fathers/gennadius/lives-of-illustrious-men/chapter-62/";
const innocent = "/fathers/chrysostom/correspondence-with-pope-innocent-i/chapter-1/";

export const journey: Journey = {
  authorId: "cassian",
  title: "Into the desert and back",
  summary:
    "John Cassian and his friend Germanus left their monastery at Bethlehem to learn from the monks of Egypt, and stayed for years among the hermits of the Nile delta and Scete. Ordained deacon by John Chrysostom, he carried an appeal for him to Rome, and at last settled at Marseilles, where he wrote down what the desert fathers had taught him.",
  note: "Bethlehem, Thennesus, Panephysis, Diolcos, Scete and Cellae are named in Cassian's own Institutes and Conferences, and the Conferences say which elder spoke where; they were written down years later at Marseilles. Constantinople, Rome and Marseilles rest on Cassian's book against Nestorius, Pope Innocent's letter and Gennadius. Cassian does not say how he left Egypt or when he reached Gaul, so those two voyages are drawn dashed along the usual sea roads. The sites of Panephysis and Diolcos are not certain. Conferences XXI–XXIV (Theonas and Abraham) do not name their place, and his birthplace (Gennadius calls him “Scythian by race”) is disputed, so neither is marked.",
  stops: [
    {
      id: "bethlehem",
      name: "Bethlehem",
      today: "Bethlehem, Palestine",
      lat: 31.7,
      lon: 35.2,
      label: "right",
      when: "About 385",
      text: "With his friend Germanus he becomes a monk in a monastery beside the birthplace of Christ. Before leaving for Egypt they promise their elders to return, an oath sworn “in the cave where our Lord Himself shone forth from His chamber in the Virgin's womb”.",
      sources: [
        { label: "Conferences XI.5", href: conf(13) },
        { label: "Conferences XVII.5", href: conf(19) },
        { label: "Institutes III.4", href: inst(4) }
      ]
    },
    {
      id: "thennesus",
      name: "Thennesus",
      today: "Tell Tinnis, Lake Manzala, Egypt",
      lat: 31.2,
      lon: 32.23,
      label: "right",
      when: "Arriving in Egypt",
      text: "Longing to see the saints of Egypt, they come “by a very lengthy voyage” to this island town ringed by sea and salt lakes. Archebius, bishop of Panephysis, is there for an election and takes them in.",
      sources: [{ label: "Conferences XI.1–2", href: conf(13) }]
    },
    {
      id: "panephysis",
      name: "Panephysis",
      // Site uncertain: on the drowned western shore of Lake Manzala, near El Manzala.
      today: "near El Manzala, Egypt (site uncertain)",
      lat: 31.16,
      lon: 31.93,
      label: "below",
      when: "Among the islands",
      text: "Archebius leads them “as guide of our road to his own city”, where the sea has turned drowned villages into islands for hermits. Chaeremon, Nesteros and Joseph speak Conferences XI–XVII here, and Pinufius, abbot of a monastery nearby, speaks Conference XX.",
      sources: [
        { label: "Conferences XI.3", href: conf(13) },
        { label: "Conferences XVI.1", href: conf(18) },
        { label: "Conferences XX.1", href: conf(23) }
      ]
    },
    {
      id: "diolcos",
      name: "Diolcos",
      // Site uncertain: the Diolcos mouth lay between the Sebennytic and Phatnitic mouths of the Nile.
      today: "Nile coast between Baltim and Damietta, Egypt (site uncertain)",
      lat: 31.5,
      lon: 31.35,
      label: "above",
      when: "First steps as hermits",
      text: "They come to “a village named Diolcos, lying on one of the seven mouths of the river Nile”. Abba Piamun speaks Conference XVIII, and under him they make their “first start in solitary living”; a few days later Abba John speaks Conference XIX.",
      sources: [
        { label: "Conferences XVIII.1, 16", href: conf(21) },
        { label: "Conferences XIX.1", href: conf(22) },
        { label: "Institutes V.36", href: inst(6) }
      ]
    },
    {
      id: "scete",
      name: "Scete",
      today: "Wadi El Natrun, Egypt",
      lat: 30.33,
      lon: 30.35,
      label: "below",
      when: "To about 399",
      text: "Their desert home for years, under Moses, Paphnutius, Daniel, Serapion, Serenus and Isaac: “the ten Conferences of the fathers living in the desert of Scete”. After seven years they visit Bethlehem to keep their promise, then return “to the recesses of the desert of Scete”.",
      sources: [
        { label: "Conferences, Preface to XI–XVII", href: conf(12) },
        { label: "Conferences III.1", href: conf(4) },
        { label: "Conferences X.2", href: conf(11) },
        { label: "Conferences XVII.30", href: conf(19) },
        { label: "Institutes X.25", href: inst(11) }
      ]
    },
    {
      id: "kellia",
      name: "Cellae",
      today: "Kellia, near El Barnugi, Egypt",
      lat: 30.8,
      lon: 30.4,
      label: "left",
      when: "A journey from Scete",
      text: "Grieved that holy monks in Palestine have been killed by raiders, they cross “eighty intervening miles of desert” to Abba Theodore at Cellae, near Nitria. His answer is Conference VI.",
      sources: [{ label: "Conferences VI.1", href: conf(7) }]
    },
    {
      id: "constantinople",
      name: "Constantinople",
      today: "Istanbul, Turkey",
      lat: 41.01,
      lon: 28.98,
      label: "above",
      when: "About 400–404",
      text: "Probably leaving Egypt amid Theophilus's quarrel with the monks, he joins John Chrysostom, who makes him a deacon: “I was admitted into the sacred ministry by the Bishop John, of blessed memory”.",
      sources: [
        { label: "Against Nestorius VII.31", href: incarnation(7) },
        { label: "Gennadius, Lives 62", href: gennadius }
      ]
    },
    {
      id: "rome",
      name: "Rome",
      today: "Rome, Italy",
      lat: 41.89,
      lon: 12.49,
      label: "below",
      when: "405",
      text: "After John is driven into exile, Cassian and Germanus carry his clergy's appeal to Pope Innocent, who answers letters sent “by the hands of Germanus the presbyter, and Casianus the deacon”.",
      sources: [{ label: "Innocent to the clergy of Constantinople", href: innocent }]
    },
    {
      id: "marseilles",
      name: "Massilia",
      today: "Marseille, France",
      lat: 43.3,
      lon: 5.37,
      label: "left",
      when: "About 415–435",
      text: "A priest at Marseilles, he founds “two monasteries, that is to say one for men and one for women”, and writes the desert's teaching down for the monks of Gaul. Here he dies, probably about 435.",
      wrote: [
        { label: "The Institutes", href: inst(1) },
        { label: "The Conferences", href: conf(1) },
        { label: "On the Incarnation, Against Nestorius", href: incarnation(1) }
      ],
      sources: [
        { label: "Gennadius, Lives 62", href: gennadius },
        { label: "Conferences, Preface to XI–XVII", href: conf(12) },
        { label: "Conferences, Preface to XVIII–XXIV", href: conf(20) }
      ]
    }
  ],
  legs: [
    // Conferences XI.1 records the voyage from their monastery to Thennesus; the port they sailed from is not named.
    // Drawn from Bethlehem to the coast at Ascalon, then along the shore past Gaza and Pelusium.
    { from: "bethlehem", to: "thennesus", by: "sea", certainty: "attested", via: [[31.67, 34.57], [31.45, 34.2], [31.2, 33.4], [31.25, 32.6]] },
    // Archebius leads them from Thennesus to his own city (Conferences XI.3).
    { from: "thennesus", to: "panephysis", by: "land", certainty: "attested" },
    // "After visiting ... those three Elders ... we came ... to a village named Diolcos" (Conferences XVIII.1).
    { from: "panephysis", to: "diolcos", by: "land", certainty: "attested", via: [[31.3, 31.65]] },
    // The move on to Scete is recorded (Conferences XVIII.16, XX.12); the road is not. Drawn up the delta and across to the Wadi Natrun.
    { from: "diolcos", to: "scete", by: "land", certainty: "attested", via: [[31.1, 31.0], [30.7, 30.75]] },
    // "We came to the holy Theodore ... living in Cellae ... eighty intervening miles of desert from ... Scete" (Conferences VI.1).
    { from: "scete", to: "kellia", by: "land", certainty: "attested" },
    // Not recorded. Drawn by way of Alexandria and the usual sea road through the Aegean and the Hellespont.
    {
      from: "kellia",
      to: "constantinople",
      by: "sea",
      certainty: "probable",
      via: [[31.2, 29.9], [33.5, 28.6], [35.9, 27.6], [36.3, 26.8], [37.4, 25.9], [38.2, 25.5], [39.3, 25.6], [40.0, 26.05], [40.15, 26.4], [40.4, 26.7], [40.7, 27.8], [40.95, 28.8]]
    },
    // Innocent's letter records that they brought the clergy's letters to Rome; the route is not recorded.
    // Drawn as the usual sea road: the Hellespont, round Cape Malea and through the Strait of Messina to Ostia.
    {
      from: "constantinople",
      to: "rome",
      by: "sea",
      certainty: "attested",
      via: [[40.95, 28.8], [40.7, 27.8], [40.4, 26.7], [40.15, 26.4], [40.0, 26.0], [39.3, 25.3], [38.05, 24.65], [37.5, 24.1], [36.9, 23.6], [36.0, 23.3], [36.3, 21.5], [37.8, 17.0], [38.2, 15.62], [39.5, 14.5], [40.6, 13.3], [41.5, 12.2], [41.74, 12.29]]
    },
    // Not recorded: when and how Cassian came to Gaul is unknown. Drawn by sea from Ostia past Corsica to Marseilles.
    {
      from: "rome",
      to: "marseilles",
      by: "sea",
      certainty: "probable",
      via: [[41.74, 12.29], [42.2, 11.0], [42.5, 9.8], [43.3, 9.6], [43.6, 8.3], [43.4, 7.0], [42.9, 6.0], [43.2, 5.3]]
    }
  ]
};
