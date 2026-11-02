import type { Journey } from "../journeys";

const fa = (n: number) => "/fathers/justin/first-apology/chapter-" + n + "/";
const sa = (n: number) => "/fathers/justin/second-apology/chapter-" + n + "/";
const dial = (n: number) => "/fathers/justin/dialogue-with-trypho/chapter-" + n + "/";
const mart = (n: number) => "/fathers/justin/martyrdom-of-justin/chapter-" + n + "/";
// Eusebius, Church History: the reader holds each book as one chapter, so Book IV is chapter 4.
const eusebius = (book: number) => "/fathers/eusebius/church-history/chapter-" + book + "/";

export const journey: Journey = {
  authorId: "justin",
  title: "The philosopher's search",
  summary:
    "Born in Samaria, Justin went from one school of philosophy to another looking for God, until an old man by the sea sent him to the prophets. He kept the philosopher's cloak, argued for the faith at Ephesus and Rome, and died a martyr at Rome.",
  note: "Justin names his birthplace, tells of his search and conversion, and records the debate with Crescens; Eusebius sets the dialogue with Trypho at Ephesus, and the Acts of his martyrdom record his trial at Rome. He never says where he studied or where he met the old man, and no road he travelled is recorded, so every line here is dashed and drawn along the usual way.",
  stops: [
    {
      id: "neapolis",
      name: "Flavia Neapolis",
      today: "Nablus, West Bank",
      lat: 32.21,
      lon: 35.27,
      when: "Early 2nd century",
      text: "Justin is born in Samaria, one of the “natives of Flavia Neapolis in Palestine”. As a young man he tries a Stoic, a Peripatetic, a Pythagorean and a Platonist in turn, looking for knowledge of God; he does not say in which cities.",
      sources: [
        { label: "First Apology 1", href: fa(1) },
        { label: "Dialogue 2", href: dial(2) },
        { label: "Dialogue 120", href: dial(120) }
      ]
    },
    {
      id: "by-the-sea",
      name: "A field by the sea",
      today: "unknown; perhaps near Kuşadası, Turkey",
      lat: 37.86,
      lon: 27.26,
      label: "left",
      when: "Conversion",
      text: "Walking alone “into a certain field not far from the sea”, he meets an old man who points him from Plato to the prophets: “straightway a flame was kindled in my soul”. He does not say where; it is often placed near Ephesus.",
      sources: [
        { label: "Dialogue 3", href: dial(3) },
        { label: "Dialogue 8", href: dial(8) }
      ]
    },
    {
      id: "ephesus",
      name: "Ephesus",
      today: "near Selçuk, Turkey",
      lat: 37.94,
      lon: 27.34,
      label: "right",
      when: "About 135",
      text: "Still wearing the philosopher's cloak, he debates in the Xystus with Trypho, a Jew “having escaped from the war lately carried on there”. Eusebius says the dialogue was held at Ephesus; it ends with Justin about to set sail.",
      sources: [
        { label: "Dialogue 1", href: dial(1) },
        { label: "Dialogue 142", href: dial(142) },
        { label: "Eusebius, Church History IV.18", href: eusebius(4) }
      ]
    },
    {
      id: "rome",
      name: "Rome",
      today: "Rome, Italy",
      lat: 41.89,
      lon: 12.49,
      when: "About 150–165",
      text: "He teaches “above one Martinus, at the Timiotinian Bath” and addresses his Apologies to Antoninus Pius and the Senate. He expects to be plotted against “perhaps by Crescens” the Cynic; about 165 the prefect Rusticus has him and his companions scourged and beheaded.",
      wrote: [
        { label: "The First Apology", href: fa(1) },
        { label: "The Second Apology", href: sa(1) }
      ],
      sources: [
        { label: "First Apology 1", href: fa(1) },
        { label: "Second Apology 3", href: sa(3) },
        { label: "Martyrdom of Justin 2", href: mart(2) },
        { label: "Martyrdom of Justin 5", href: mart(5) },
        { label: "Eusebius, Church History IV.16", href: eusebius(4) }
      ]
    }
  ],
  legs: [
    // How Justin came west is not recorded. Drawn as a voyage from Caesarea, south of Cyprus and Rhodes, up the Asian coast.
    {
      from: "neapolis",
      to: "by-the-sea",
      by: "sea",
      certainty: "probable",
      via: [[32.5, 34.88], [33.6, 32.5], [35.6, 28.5], [36.3, 27.55], [36.93, 27.4], [37.4, 27.05], [37.69, 27.03]]
    },
    // The field is not placed in the text; a short walk up the coast to the city.
    { from: "by-the-sea", to: "ephesus", by: "land", certainty: "probable" },
    // Dialogue 142 has him about to sail, but not where. Drawn through the Cyclades, round Cape Malea and the Strait of Messina to Ostia.
    {
      from: "ephesus",
      to: "rome",
      by: "sea",
      certainty: "probable",
      via: [
        [37.69, 27.03],
        [37.45, 26.4],
        [37.3, 25.6],
        [36.6, 24.0],
        [36.3, 23.1],
        [36.6, 21.0],
        [38.2, 15.62],
        [39.6, 15.0],
        [40.4, 14.0],
        [41.1, 12.8],
        [41.74, 12.29]
      ]
    }
  ]
};
