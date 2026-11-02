import type { Journey } from "../journeys";

const letter = (n: number) => "/fathers/jerome/jerome-letters/chapter-" + n + "/";
const apology = (book: number) => "/fathers/jerome/apology-against-rufinus/chapter-" + book + "/";
/** Lives of Illustrious Men: the reader's chapter numbers run two behind the book's (ch. 135 is chapter-133). */
const lives = (n: number) => "/fathers/jerome/jerome-lives-of-illustrious-men/chapter-" + n + "/";

export const journey: Journey = {
  authorId: "jerome",
  title: "From Stridon to Bethlehem",
  summary:
    "Born on the edge of Dalmatia, Jerome studied at Rome, tried the ascetic life in Gaul, Italy and the Syrian desert, served Pope Damasus at Rome, and spent his last thirty-four years in a monastery at Bethlehem.",
  note: "Stops are as Jerome himself records them in his Letters, his Apology Against Rufinus and his Lives of Illustrious Men. His road east in 373 and his voyage from Rome to Cyprus and on to Bethlehem in 385 are in his own words; the other roads are not recorded and are drawn dashed along the usual routes. Dates are the usual scholarly ones. The site of Stridon is lost, so its marker is approximate.",
  stops: [
    {
      id: "stridon",
      name: "Stridon",
      today: "Site lost; probably western Slovenia",
      lat: 45.8,
      lon: 14.3,
      label: "right",
      when: "About 347",
      text: "Jerome is born at Stridon, a town “on the border of Dalmatia and Pannonia” that the Goths later destroyed. No one now knows exactly where it stood.",
      sources: [{ label: "Lives of Illustrious Men 135", href: lives(133) }]
    },
    {
      id: "rome",
      name: "Rome",
      today: "Rome, Italy",
      lat: 41.89,
      lon: 12.49,
      label: "left",
      when: "Student years",
      text: "He studies at Rome with his boyhood friend Bonosus, builds up a library, and is baptised there; later he writes, “I, who have received Christ's garb in Rome”.",
      sources: [
        { label: "Letter 16", href: letter(16) },
        { label: "Letter 3", href: letter(3) },
        { label: "Letter 22", href: letter(22) }
      ]
    },
    {
      id: "trier",
      name: "Trier",
      today: "Trier, Germany",
      lat: 49.75,
      lon: 6.64,
      when: "About 367",
      text: "With Bonosus he goes north to the imperial city, “by the half savage banks of the Rhine”, and copies out Hilary's book on the Synods “with my own hand”.",
      sources: [
        { label: "Letter 3", href: letter(3) },
        { label: "Letter 5", href: letter(5) }
      ]
    },
    {
      id: "aquileia",
      name: "Aquileia",
      today: "Aquileia, Italy",
      lat: 45.77,
      lon: 13.37,
      label: "left",
      when: "About 370",
      text: "Back near home he joins a circle of friends living for God, among them Rufinus, Chromatius and Bonosus, until “that sudden whirlwind” scatters them.",
      sources: [
        { label: "Letter 3", href: letter(3) },
        { label: "Letter 7", href: letter(7) },
        { label: "Letter 8", href: letter(8) }
      ]
    },
    {
      id: "antioch",
      name: "Antioch",
      today: "Antakya, Turkey",
      lat: 36.2,
      lon: 36.16,
      label: "left",
      when: "374",
      text: "Worn out by “Thrace, Pontus, Bithynia, the whole of Galatia and Cappadocia”, he falls ill in Syria. In a fever, probably here, he dreams he is judged: “thou art a follower of Cicero and not of Christ.”",
      wrote: [{ label: "Letter 3, to Rufinus", href: letter(3) }],
      sources: [
        { label: "Letter 3", href: letter(3) },
        { label: "Letter 22", href: letter(22) }
      ]
    },
    {
      id: "chalcis",
      name: "Desert of Chalcis",
      today: "near Qinnasrin, Syria",
      lat: 35.99,
      lon: 37.05,
      label: "right",
      when: "About 375–377",
      text: "He lives as a hermit in “the corner of the desert which stretches between the Syrians and the Saracens”, and learns Hebrew from a converted Jew to tame his thoughts.",
      wrote: [
        { label: "Letter 15, to Damasus", href: letter(15) },
        { label: "Letter 16, to Damasus", href: letter(16) }
      ],
      sources: [
        { label: "Letter 7", href: letter(7) },
        { label: "Letter 22", href: letter(22) },
        { label: "Letter 125", href: letter(125) }
      ]
    },
    {
      id: "constantinople",
      name: "Constantinople",
      today: "Istanbul, Turkey",
      lat: 41.01,
      lon: 28.98,
      when: "About 380",
      text: "Ordained priest by Paulinus of Antioch, he studies Scripture under Gregory of Nazianzus, “my instructor in the Scriptures”.",
      wrote: [{ label: "Letter 18, on Isaiah's vision", href: letter(18) }],
      sources: [
        { label: "Lives of Illustrious Men 117", href: lives(115) },
        { label: "Letter 52", href: letter(52) },
        { label: "Against John of Jerusalem", href: "/fathers/jerome/to-pammachius-against-john-of-jerusalem/chapter-1/" }
      ]
    },
    {
      id: "rome-2",
      name: "Rome",
      today: "Rome, Italy",
      lat: 41.89,
      lon: 12.49,
      label: "below",
      when: "382–385",
      text: "He comes back with Paulinus and Epiphanius and stays as Damasus's secretary, revising the Latin Gospels and teaching Marcella and Paula. Slandered, he sails in August 385: “I write this in haste, dear Lady Asella, as I go on board”.",
      wrote: [
        { label: "Letter 22, to Eustochium", href: letter(22) },
        { label: "The Perpetual Virginity of Mary", href: "/fathers/jerome/perpetual-virginity-of-blessed-mary/chapter-1/" },
        { label: "Letter 45, to Asella", href: letter(45) }
      ],
      sources: [
        { label: "Letter 127", href: letter(127) },
        { label: "Letter 123", href: letter(123) },
        { label: "Letter 45", href: letter(45) },
        { label: "Lives of Illustrious Men 135", href: lives(133) }
      ]
    },
    {
      id: "salamis",
      name: "Salamis",
      today: "near Famagusta, Cyprus",
      lat: 35.18,
      lon: 33.9,
      label: "left",
      when: "Autumn 385",
      text: "By Rhegium and “by Malea and the Cyclades to Cyprus”, he is welcomed by Bishop Epiphanius. Paula follows the same sea road and stays ten days.",
      sources: [
        { label: "Apology Against Rufinus III", href: apology(3) },
        { label: "Letter 108", href: letter(108) }
      ]
    },
    {
      id: "bethlehem",
      name: "Bethlehem",
      today: "Bethlehem, Palestine",
      lat: 31.7,
      lon: 35.2,
      label: "right",
      when: "386–420",
      text: "After Antioch, a cold winter in Jerusalem and the monks of Egypt, he settles at “Bethlehem, which is now my home”. With Paula he builds monasteries, translates the Old Testament from the Hebrew, and dies here, traditionally in 420.",
      wrote: [
        { label: "Lives of Illustrious Men", href: lives(1) },
        { label: "Letter 108, Paula's life", href: letter(108) },
        { label: "Apology Against Rufinus", href: apology(1) },
        { label: "Against the Pelagians", href: "/fathers/jerome/against-the-pelagians/chapter-1/" }
      ],
      sources: [
        { label: "Apology Against Rufinus III", href: apology(3) },
        { label: "Letter 108", href: letter(108) },
        { label: "Lives of Illustrious Men 135", href: lives(133) }
      ]
    }
  ],
  legs: [
    // The road to Rome is not recorded; drawn by Aquileia, the coast road to Ariminum and the Via Flaminia.
    {
      from: "stridon",
      to: "rome",
      by: "land",
      certainty: "probable",
      via: [[45.77, 13.37], [45.55, 12.4], [44.42, 12.2], [44.06, 12.57], [43.84, 13.02], [42.73, 12.74], [42.52, 12.51]]
    },
    // Letter 3 says he went from Rome to the Rhine with Bonosus, but not by which road; drawn over the Great St Bernard.
    {
      from: "rome",
      to: "trier",
      by: "land",
      certainty: "probable",
      via: [[43.77, 11.25], [44.49, 11.34], [45.05, 9.69], [45.46, 9.19], [45.74, 7.32], [45.87, 7.17], [46.1, 7.07], [46.46, 6.84], [47.24, 6.02], [49.12, 6.18]]
    },
    // The way back to Aquileia is not recorded; drawn by the Rhine, Augsburg and the Brenner.
    {
      from: "trier",
      to: "aquileia",
      by: "land",
      certainty: "probable",
      via: [[48.58, 7.75], [48.37, 10.9], [47.0, 11.5], [46.07, 11.12], [45.44, 10.99], [45.66, 12.24]]
    },
    // Letter 3 names the provinces in order: Thrace, Pontus, Bithynia, Galatia, Cappadocia, Cilicia, Syria.
    // The stretch from Aquileia to Thrace is not named; it follows the usual highway by Sirmium and Serdica.
    {
      from: "aquileia",
      to: "antioch",
      by: "land",
      certainty: "attested",
      via: [
        [46.05, 14.51], [45.48, 16.37], [44.97, 19.61], [44.82, 20.46], [43.32, 21.9], [42.7, 23.32], [42.15, 24.75],
        [41.68, 26.56], [41.01, 28.98], [40.77, 29.92], [39.93, 32.86], [38.72, 35.48], [37.83, 34.61], [37.28, 34.8],
        [36.92, 34.89], [36.6, 36.17]
      ]
    },
    // The desert lay east of Antioch; the road is not recorded.
    { from: "antioch", to: "chalcis", by: "land", certainty: "probable", via: [[36.15, 36.6]] },
    // He was ordained at Antioch, then went on to Constantinople; the road is not recorded, drawn back across Asia Minor.
    {
      from: "chalcis",
      to: "constantinople",
      by: "land",
      certainty: "probable",
      via: [[36.2, 36.16], [36.6, 36.17], [36.92, 34.89], [37.28, 34.8], [37.83, 34.61], [38.72, 35.48], [39.93, 32.86], [40.77, 29.92]]
    },
    // Letter 127 says he came to Rome with Paulinus and Epiphanius, but not how; drawn by sea round Greece.
    {
      from: "constantinople",
      to: "rome-2",
      by: "sea",
      certainty: "probable",
      via: [
        [40.85, 28.0], [40.2, 26.4], [39.5, 25.5], [38.5, 25.3], [37.3, 24.1], [36.7, 23.6], [36.3, 23.2], [36.6, 21.5],
        [37.8, 16.0], [38.2, 15.63], [38.8, 15.3], [40.3, 14.0], [41.2, 12.8], [41.78, 12.25]
      ]
    },
    // Apology III.22: from the port of Rome to Rhegium, then “by Malea and the Cyclades to Cyprus”.
    {
      from: "rome-2",
      to: "salamis",
      by: "sea",
      certainty: "attested",
      via: [
        [41.78, 12.25], [41.2, 12.8], [40.3, 14.0], [38.8, 15.3], [38.1, 15.6], [37.8, 16.0], [36.6, 21.5], [36.3, 23.2],
        [36.9, 25.0], [36.4, 27.0], [36.0, 29.0], [35.0, 31.0], [34.5, 32.3], [34.5, 33.4], [34.85, 34.12]
      ]
    },
    // Apology III.22: on to Antioch, then to Jerusalem, then Egypt, then Bethlehem. The short crossing to Seleucia
    // is drawn with the land road, which makes up most of the leg; the Egyptian tour is told in the text, not drawn.
    {
      from: "salamis",
      to: "bethlehem",
      by: "land",
      certainty: "attested",
      via: [
        [35.2, 34.4], [35.7, 35.4], [36.12, 35.93], [36.2, 36.16], [35.9, 35.95], [35.52, 35.78], [34.43, 35.83],
        [33.89, 35.5], [33.56, 35.37], [33.27, 35.2], [32.92, 35.08], [32.5, 34.89], [31.95, 34.89], [31.78, 35.23]
      ]
    }
  ]
};
