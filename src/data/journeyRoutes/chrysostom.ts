import type { Journey } from "../journeys";

const olympias = "/fathers/chrysostom/letters-to-olympias/chapter-1/";
const innocent = "/fathers/chrysostom/correspondence-with-pope-innocent-i/chapter-1/";
const statues = (n: number) => "/fathers/chrysostom/homilies-on-the-statues/chapter-" + n + "/";
const priesthood = "/fathers/chrysostom/on-the-priesthood/chapter-1/";
const eutropius = "/fathers/chrysostom/two-homilies-on-eutropius/chapter-1/";
// The church histories are one reader chapter per book.
const socrates = (book: number) => "/fathers/socrates/ecclesiastical-history/chapter-" + book + "/";
const sozomen = (book: number) => "/fathers/sozomen/sozomen-ecclesiastical-history/chapter-" + book + "/";
const theodoret = (book: number) => "/fathers/theodoret/theodoret-ecclesiastical-history/chapter-" + book + "/";

export const journey: Journey = {
  authorId: "chrysostom",
  title: "The last road",
  summary:
    "The preacher of Antioch was made bishop of Constantinople, then driven out by his enemies and marched across Asia Minor into the Armenian hills. He wrote to his friends from exile for three years, and died on the road to a harsher one.",
  note: "Antioch, Constantinople, Caesarea, Cucusus, Arabissus and Comana are recorded by Chrysostom's own letters or by Socrates, Sozomen and Theodoret. Nicaea is not named in any text in this library; it is drawn as the usual road east from Bithynia. Palladius's Dialogue on his life is not in the library, so his last words are given as tradition. Where Chrysostom set out from in 407, Cucusus or Arabissus, is not recorded here. Dashed lines mark roads that are not recorded, drawn along the usual way.",
  stops: [
    {
      id: "antioch",
      name: "Antioch",
      today: "Antakya, Turkey",
      lat: 36.2,
      lon: 36.16,
      label: "below",
      when: "386–397",
      text: "Born here, he becomes the city's great preacher. When riot breaks the emperor's statues in 387 he begins, “What shall I say, or what shall I speak of?” Late in 397 he is hurried off by chariot before the people can stop it.",
      wrote: [
        { label: "On the Priesthood", href: priesthood },
        { label: "Homilies on the Statues", href: statues(1) }
      ],
      sources: [
        { label: "Socrates, Church History VI.3", href: socrates(6) },
        { label: "Sozomen, Church History VIII.2", href: sozomen(8) },
        { label: "On the Statues, Homily II", href: statues(2) }
      ]
    },
    {
      id: "constantinople",
      name: "Constantinople",
      today: "Istanbul, Turkey",
      lat: 41.01,
      lon: 28.98,
      label: "above",
      when: "397–404",
      text: "Brought there late in 397 and consecrated on 26 February 398, he angers the court with his preaching. Deposed in 403, he is recalled within days as “the whole population lighted up waxen torches and came forth to meet him”. Deposed again, he slips away in June 404 as the great church burns.",
      wrote: [
        { label: "Homilies on Eutropius", href: eutropius },
        { label: "First letter to Innocent of Rome", href: innocent }
      ],
      sources: [
        { label: "Socrates, Church History VI.2, 15–18", href: socrates(6) },
        { label: "Sozomen, Church History VIII.18, 22", href: sozomen(8) },
        { label: "Theodoret, Church History V.34", href: theodoret(5) }
      ]
    },
    {
      id: "nicaea",
      name: "Nicaea",
      today: "İznik, Turkey",
      lat: 40.43,
      lon: 29.72,
      label: "below",
      when: "Summer 404",
      text: "He is “conveyed in a little bark to Bithynia, and thence immediately continued his journey”. His road east probably ran through Nicaea.",
      sources: [{ label: "Sozomen, Church History VIII.22", href: sozomen(8) }]
    },
    {
      id: "caesarea",
      name: "Caesarea",
      today: "Kayseri, Turkey",
      lat: 38.72,
      lon: 35.49,
      label: "left",
      when: "Summer 404",
      text: "He arrives “in the very height of a burning fever”, and clergy, monks and physicians nurse him. But the bishop Pharetrius turns against him, and with Isaurian raiders in the district he is driven out on “a dark, murky night without a moon”.",
      sources: [{ label: "To Olympias, from Cucusus", href: olympias }]
    },
    {
      id: "cucusus",
      name: "Cucusus",
      today: "Göksun, Turkey",
      lat: 37.98,
      lon: 36.5,
      label: "left",
      when: "Exile, 404–407",
      text: "Theodoret calls it “a petty and lonely town in Armenia”. His host Dioscorus gives him a warm house, and at first he finds the climate “no less than that of Antioch”. From exile he writes to Olympias, to Rome and to friends everywhere.",
      wrote: [
        { label: "Letters to Olympias", href: olympias },
        { label: "To Innocent, in the third year of exile", href: innocent }
      ],
      sources: [
        { label: "To Olympias, from Cucusus", href: olympias },
        { label: "Sozomen, Church History VIII.22", href: sozomen(8) },
        { label: "Theodoret, Church History V.34", href: theodoret(5) }
      ]
    },
    {
      id: "arabissus",
      name: "Arabissus",
      today: "Afşin, Turkey",
      lat: 38.24,
      lon: 36.92,
      label: "right",
      when: "Probably 405–406",
      text: "He writes of his “removal from Cucusus” and his “sojourn in Arabissus”, probably for safety from the Isaurian raiders. A winter in these hills, at Cucusus or Arabissus (the letter does not say which), nearly kills him: “day and dawn and noon were all one night to me”.",
      sources: [
        { label: "To Olympias, on the winter", href: olympias },
        { label: "To Innocent: “Isaurian swords”", href: innocent }
      ]
    },
    {
      id: "comana",
      name: "Comana",
      today: "near Tokat, Turkey",
      lat: 40.36,
      lon: 36.64,
      label: "above",
      when: "14 September 407",
      text: "Ordered on to Pityus at the far end of the Black Sea, he is marched through the summer heat until “he could not prosecute his journey, but closed his life in that town”. He is buried beside the martyr Basiliscus. Tradition gives his last words as Glory to God for all things.",
      sources: [
        { label: "Socrates, Church History VI.21", href: socrates(6) },
        { label: "Sozomen, Church History VIII.28", href: sozomen(8) },
        { label: "Theodoret, Church History V.34", href: theodoret(5) }
      ]
    }
  ],
  legs: [
    // Sozomen records only the chariot ride to Pagras; the rest follows the main road through the Cilician Gates and Ancyra.
    {
      from: "antioch",
      to: "constantinople",
      by: "land",
      certainty: "probable",
      via: [[36.43, 36.25], [36.92, 34.9], [37.83, 34.6], [39.93, 32.86], [40.77, 29.92], [40.99, 29.03]]
    },
    // The boat to Bithynia is recorded (Sozomen VIII.22); Nicaea is not named in any library text.
    { from: "constantinople", to: "nicaea", by: "land", certainty: "probable", via: [[40.95, 29.12], [40.72, 29.45]] },
    // The road is not recorded, though he mentions escaping "that man of Galatia" on the way; drawn through Ancyra.
    {
      from: "nicaea",
      to: "caesarea",
      by: "land",
      certainty: "probable",
      via: [[40.2, 30.6], [40.2, 31.7], [39.93, 32.86], [39.45, 34.0], [39.0, 34.9]]
    },
    // He records leaving Caesarea for Cucusus, though not the road.
    { from: "caesarea", to: "cucusus", by: "land", certainty: "attested", via: [[38.4, 35.9], [38.15, 36.25]] },
    { from: "cucusus", to: "arabissus", by: "land", certainty: "attested" },
    // The road toward Pityus is not recorded; drawn north through Sebasteia.
    { from: "arabissus", to: "comana", by: "land", certainty: "probable", via: [[38.9, 37.15], [39.75, 37.02]] }
  ]
};
