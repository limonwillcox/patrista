import type { Journey } from "../journeys";

/** Sulpicius Severus, On the Life of St. Martin: reader chapter n is the Life's own Chapter n. */
const life = (n: number) => "/fathers/sulpicius_severus/on-the-life-of-st-martin/chapter-" + n + "/";

export const journey: Journey = {
  authorId: "sulpicius_severus",
  title: "The life of Martin of Tours",
  summary:
    "Sulpicius Severus knew Martin, travelled to meet him, and wrote this Life before Martin died. It follows the soldier who cut his cloak for a beggar from Pannonia across the empire to Gaul, where he became a monk and bishop of Tours.",
  note: "Places are as Sulpicius's Life records them. Ligugé and Marmoutier are the traditional names of the two monasteries the Life describes without naming. Martin's death at Candes comes from Sulpicius's letter to Bassula, not from the Life. The roads themselves are not recorded; dashed lines mark stretches where the Life gives no journey at all, drawn along the usual Roman roads.",
  stops: [
    {
      id: "sabaria",
      name: "Sabaria",
      today: "Szombathely, Hungary",
      lat: 47.23,
      lon: 16.62,
      label: "below",
      when: "316 or 336",
      text: "Martin is born at Sabaria in Pannonia, in 316 or in 336: the year is disputed, as Sulpicius's own figures do not agree. His parents are heathens; his father is a soldier who rises to be a military tribune.",
      sources: [{ label: "Life 2", href: life(2) }]
    },
    {
      id: "ticinum",
      name: "Ticinum",
      today: "Pavia, Italy",
      lat: 45.19,
      lon: 9.16,
      label: "below",
      when: "Boyhood",
      text: "He grows up at Ticinum. At ten he goes to the church against his parents' wish to become a catechumen; at fifteen, as a veteran's son, he is put in chains and made to take the military oath.",
      sources: [{ label: "Life 2", href: life(2) }]
    },
    {
      id: "amiens",
      name: "Amiens",
      today: "Amiens, France",
      lat: 49.89,
      lon: 2.3,
      label: "left",
      when: "A hard winter",
      text: "At the city gate he cuts his cloak in two with his sword for a freezing beggar. That night Christ appears wearing the half he gave away: “Martin, who is still but a catechumen, clothed me with this robe.”",
      sources: [{ label: "Life 3", href: life(3) }]
    },
    {
      id: "worms",
      name: "Borbetomagus",
      today: "Worms, Germany",
      lat: 49.63,
      lon: 8.36,
      label: "right",
      when: "About 356",
      text: "On the eve of battle Julian Caesar hands out a bounty to the army. Martin asks for his discharge instead: “I am the soldier of Christ: it is not lawful for me to fight.”",
      sources: [{ label: "Life 4", href: life(4) }]
    },
    {
      id: "poitiers",
      name: "Poitiers",
      today: "Poitiers, France",
      lat: 46.58,
      lon: 0.34,
      label: "above",
      when: "Out of the army",
      text: "He seeks out Hilary, bishop of Poitiers, and stays with him. Hilary wants to make him a deacon, but Martin will only take the humble office of exorcist.",
      sources: [{ label: "Life 5", href: life(5) }]
    },
    {
      id: "pannonia",
      name: "Pannonia",
      today: "around Szombathely, Hungary",
      lat: 47.23,
      lon: 16.62,
      label: "above",
      when: "Going home",
      text: "A dream sends him home to his heathen parents. In the Alps robbers seize him, and one is converted. He wins his mother but not his father, and for opposing the Arians he is publicly scourged and driven out.",
      sources: [
        { label: "Life 5", href: life(5) },
        { label: "Life 6", href: life(6) }
      ]
    },
    {
      id: "milan",
      name: "Milan",
      today: "Milan, Italy",
      lat: 45.46,
      lon: 9.19,
      label: "above",
      when: "While Hilary was in exile",
      text: "He sets up a monastery for himself at Milan, but Auxentius, the leader of the Arians, attacks him and drives him out of the city.",
      sources: [{ label: "Life 6", href: life(6) }]
    },
    {
      id: "gallinaria",
      name: "Gallinaria",
      today: "Isola Gallinara, off Albenga, Italy",
      lat: 44.03,
      lon: 8.23,
      label: "below",
      when: "In retreat",
      text: "With one priest for company he withdraws to the island of Gallinaria and lives on roots. He eats poisonous hellebore by mistake and is saved by prayer.",
      sources: [{ label: "Life 6", href: life(6) }]
    },
    {
      id: "liguge",
      name: "Ligugé",
      today: "Ligugé, France",
      lat: 46.52,
      lon: 0.33,
      label: "below",
      when: "About 361",
      text: "When Hilary is allowed home from exile, Martin follows him and builds a monastery “not far from the town”, traditionally Ligugé. Here he raises a catechumen who had died unbaptized.",
      sources: [
        { label: "Life 6", href: life(6) },
        { label: "Life 7", href: life(7) }
      ]
    },
    {
      id: "tours",
      name: "Tours",
      today: "Tours, France",
      lat: 47.39,
      lon: 0.69,
      label: "right",
      when: "About 371",
      text: "The people of Tours lure him out with a false sick call and make him bishop over some bishops' protests. Wanting quiet, he builds a monastery two miles out by the Loire, later called Marmoutier.",
      sources: [
        { label: "Life 9", href: life(9) },
        { label: "Life 10", href: life(10) }
      ]
    },
    {
      id: "candes",
      name: "Candes",
      today: "Candes-Saint-Martin, France",
      lat: 47.21,
      lon: 0.08,
      label: "left",
      when: "397",
      text: "Old and knowing his end is near, he goes to make peace among the quarrelling clergy of Candes, and dies there. Sulpicius tells this in a letter to Bassula, not in the Life; the date is traditional.",
      // Letter 3 (to Bassula) is its own reader chapter, the third of the Letters.
      sources: [{ label: "Sulpicius, Letter 3 to Bassula", href: "/fathers/sulpicius_severus/letters-of-sulpicius-severus/chapter-3/" }]
    }
  ],
  legs: [
    // The Life says only that he was born at Sabaria and brought up at Ticinum; drawn along the road by Aquileia.
    { from: "sabaria", to: "ticinum", by: "land", certainty: "probable", via: [[46.05, 14.51], [45.77, 13.37], [45.44, 10.99]] },
    // His postings in the guard are not recorded; drawn over the Great St Bernard and up through Gaul.
    {
      from: "ticinum",
      to: "amiens",
      by: "land",
      certainty: "probable",
      via: [[45.74, 7.32], [45.87, 7.17], [46.46, 6.84], [47.24, 6.02], [47.86, 5.33], [49.26, 4.03]]
    },
    // Amiens and Worms are both in the Life, but not the march between them; drawn by Reims and Metz.
    { from: "amiens", to: "worms", by: "land", certainty: "probable", via: [[49.26, 4.03], [49.12, 6.18]] },
    // Life 5: leaving the army he goes to Hilary at Poitiers. The road is not recorded.
    { from: "worms", to: "poitiers", by: "land", certainty: "attested", via: [[49.12, 6.18], [48.68, 5.89], [48.3, 4.08], [47.9, 1.91], [47.2, 0.9]] },
    // Life 5–6: through the Alps and past Milan to his homeland. Which pass he took is not recorded.
    {
      from: "poitiers",
      to: "pannonia",
      by: "land",
      certainty: "attested",
      via: [[45.83, 1.26], [45.78, 3.08], [45.76, 4.84], [44.93, 6.72], [45.07, 7.69], [45.46, 9.19], [45.44, 10.99], [45.77, 13.37], [46.05, 14.51]]
    },
    // Life 6: "again betaking himself to Italy" he settles at Milan.
    { from: "pannonia", to: "milan", by: "land", certainty: "attested", via: [[46.05, 14.51], [45.77, 13.37], [45.44, 10.99]] },
    // Life 6: expelled from Milan, he withdraws to Gallinaria; drawn by Genoa and the coast.
    { from: "milan", to: "gallinaria", by: "land", certainty: "attested", via: [[44.9, 8.86], [44.41, 8.93], [44.25, 8.45]] },
    // Life 6–7: he set out for Rome to meet Hilary, found him gone, and followed him back to Gaul.
    // Whether he reached Rome, and his road, are not recorded; drawn along the coast road and over the Massif Central.
    {
      from: "gallinaria",
      to: "liguge",
      by: "land",
      certainty: "probable",
      via: [[43.7, 7.27], [43.43, 6.74], [43.53, 5.45], [43.68, 4.63], [43.84, 4.36], [45.78, 3.08], [45.83, 1.26]]
    },
    // Life 9: he is drawn out of his monastery and escorted to Tours.
    { from: "liguge", to: "tours", by: "land", certainty: "attested", via: [[46.58, 0.34], [46.82, 0.55]] },
    // Not in the Life (Letter 3 to Bassula); drawn down the Loire.
    { from: "tours", to: "candes", by: "land", certainty: "probable", via: [[47.33, 0.41]] }
  ]
};
