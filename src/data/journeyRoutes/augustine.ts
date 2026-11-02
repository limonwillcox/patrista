import type { Journey } from "../journeys";

const conf = (n: number) => "/fathers/augustine/confessions/chapter-" + n + "/";
const ep = (n: number) => "/fathers/augustine/augustine-letters/chapter-" + n + "/";
const aug = (work: string) => "/fathers/augustine/" + work + "/chapter-1/";
const gennadius = (n: number) => "/fathers/gennadius/lives-of-illustrious-men/chapter-" + n + "/";

export const journey: Journey = {
  authorId: "augustine",
  title: "From Thagaste to Hippo",
  summary:
    "Augustine tells his own road in the Confessions: from a small African town to Carthage, across the sea to Rome and Milan, to a garden and a font, and home again to Africa, where he served the church of Hippo for almost forty years.",
  note: "Stops and journeys up to Monnica's death at Ostia are as Augustine tells them in the Confessions; the later years rest on his Letters. Dates are the usual scholarly ones. The roads are not recorded. Dashed lines mark the voyage home and the move to Hippo, which the texts here do not describe. His death at Hippo in 430 is told by his friend Possidius, whose Life is not in this library.",
  stops: [
    {
      id: "thagaste",
      name: "Thagaste",
      today: "Souk Ahras, Algeria",
      lat: 36.29,
      lon: 7.95,
      label: "right",
      when: "354",
      text: "Born here in 354 to Monnica and Patricius, “a poor freeman of Thagaste”.",
      sources: [
        { label: "Confessions II", href: conf(2) },
        { label: "Confessions IX", href: conf(9) }
      ]
    },
    {
      id: "madauros",
      name: "Madauros",
      today: "M'Daourouch, Algeria",
      lat: 36.08,
      lon: 7.82,
      label: "left",
      when: "Boyhood",
      text: "He is sent to “a neighbour city” to learn grammar and rhetoric, then idles a year at home while his father scrapes together the money for Carthage.",
      sources: [{ label: "Confessions II", href: conf(2) }]
    },
    {
      id: "carthage",
      name: "Carthage",
      today: "near Tunis, Tunisia",
      lat: 36.85,
      lon: 10.32,
      when: "From about 371",
      text: "“To Carthage I came, where there sang all around me in my ears a cauldron of unholy loves.” Here he falls in with the Manichees, and later teaches rhetoric.",
      sources: [
        { label: "Confessions III", href: conf(3) },
        { label: "Confessions IV", href: conf(4) },
        { label: "Confessions V", href: conf(5) }
      ]
    },
    {
      id: "rome",
      name: "Rome",
      today: "Rome, Italy",
      lat: 41.89,
      lon: 12.49,
      label: "right",
      when: "383",
      text: "He slips away by night while Monnica prays at Cyprian's shrine by the harbour: “The wind blew and swelled our sails, and withdrew the shore from our sight”. In Rome he nearly dies of fever.",
      sources: [{ label: "Confessions V", href: conf(5) }]
    },
    {
      id: "milan",
      name: "Milan",
      today: "Milan, Italy",
      lat: 45.46,
      lon: 9.19,
      label: "left",
      when: "384–386",
      text: "Sent as the city's teacher of rhetoric: “To Milan I came, to Ambrose the Bishop”. In a garden in 386 a child's voice chants “Take up and read”, and he opens Paul and is turned.",
      sources: [
        { label: "Confessions V", href: conf(5) },
        { label: "Confessions VIII", href: conf(8) }
      ]
    },
    {
      id: "cassiciacum",
      name: "Cassiciacum",
      today: "probably Cassago Brianza, Italy",
      lat: 45.73,
      lon: 9.29,
      label: "above",
      when: "Autumn 386",
      text: "He gives up his chair and retires with Monnica, his son and his friends to Verecundus's country house, “where from the fever of the world we reposed in Thee”. His first Christian books are written here.",
      wrote: [
        { label: "Soliloquies", href: aug("soliloquies") },
        { label: "Letter I, to Hermogenianus", href: ep(1) },
        { label: "Letter III, to Nebridius", href: ep(3) }
      ],
      sources: [
        { label: "Confessions IX", href: conf(9) },
        { label: "Letter III", href: ep(3) }
      ]
    },
    {
      id: "milan-2",
      name: "Milan",
      today: "Milan, Italy",
      lat: 45.46,
      lon: 9.19,
      label: "below",
      when: "Easter 387",
      text: "He comes back to the city to be baptised with his son Adeodatus and his friend Alypius: “we were baptised, and anxiety for our past life vanished from us.”",
      sources: [{ label: "Confessions IX", href: conf(9) }]
    },
    {
      id: "ostia",
      name: "Ostia",
      today: "Ostia Antica, Italy",
      lat: 41.76,
      lon: 12.29,
      label: "left",
      when: "Autumn 387",
      text: "Waiting for a ship to Africa, he and Monnica stand “leaning in a certain window” and speak of eternal life. Days later she dies, asking only that he “remember me at the Lord's altar”.",
      sources: [{ label: "Confessions IX", href: conf(9) }]
    },
    {
      id: "thagaste-2",
      name: "Thagaste",
      today: "Souk Ahras, Algeria",
      lat: 36.29,
      lon: 7.95,
      label: "below",
      when: "388–391",
      text: "Home again, he lives a quiet common life with his friends, though Nebridius chides him for “spending your strength and patience on the affairs of your fellow-citizens”.",
      wrote: [{ label: "Letter X, to Nebridius", href: ep(10) }],
      sources: [
        { label: "Letter V", href: ep(5) },
        { label: "Letter X", href: ep(10) }
      ]
    },
    {
      id: "hippo",
      name: "Hippo Regius",
      today: "Annaba, Algeria",
      lat: 36.88,
      lon: 7.75,
      label: "above",
      when: "391–430",
      text: "Made presbyter in tears, given “the second place at the helm, when as yet I knew not how to handle an oar”, then bishop. As invaders overrun Africa he urges bishops “not to forsake the churches”. By tradition he dies here in 430, during the Vandal siege.",
      wrote: [
        { label: "The Confessions", href: conf(1) },
        { label: "On the Holy Trinity", href: aug("on-the-holy-trinity") },
        { label: "The City of God", href: aug("city-of-god") }
      ],
      sources: [
        { label: "Letter XXI", href: ep(21) },
        { label: "Letter CCXXVIII", href: ep(158) },
        { label: "Gennadius, Lives 39", href: gennadius(39) }
      ]
    }
  ],
  legs: [
    { from: "thagaste", to: "madauros", by: "land", certainty: "attested" },
    // He went home to Thagaste before Carthage (Confessions II); the road east by Sicca is the usual way, not recorded.
    {
      from: "madauros",
      to: "carthage",
      by: "land",
      certainty: "attested",
      via: [[36.29, 7.95], [36.18, 8.71], [36.34, 9.15], [36.55, 9.6]]
    },
    // The voyage is recorded (Confessions V); the course round Cape Bon and west of Sicily is the usual one.
    {
      from: "carthage",
      to: "rome",
      by: "sea",
      certainty: "attested",
      via: [[37.3, 10.6], [38.0, 11.6], [39.5, 12.0], [41.0, 12.0], [41.73, 12.25]]
    },
    // Sent from Rome to Milan at public expense (Confessions V); drawn along the Via Flaminia and Via Aemilia.
    {
      from: "rome",
      to: "milan",
      by: "land",
      certainty: "attested",
      via: [[42.52, 12.52], [43.3, 12.8], [43.84, 13.02], [44.06, 12.57], [44.49, 11.34], [45.05, 9.69]]
    },
    { from: "milan", to: "cassiciacum", by: "land", certainty: "attested" },
    { from: "cassiciacum", to: "milan-2", by: "land", certainty: "attested" },
    // "Returning to Africa: whitherward being as far as Ostia" (Confessions IX); the road south is not recorded.
    {
      from: "milan-2",
      to: "ostia",
      by: "land",
      certainty: "attested",
      via: [[45.05, 9.69], [44.49, 11.34], [44.06, 12.57], [43.84, 13.02], [43.3, 12.8], [42.52, 12.52], [41.89, 12.49]]
    },
    // Probable: after Monnica's death he stayed on in Rome, then sailed home in 388, by Carthage and the road inland.
    // The Confessions stop at Ostia, and no text here records the voyage.
    {
      from: "ostia",
      to: "thagaste-2",
      by: "sea",
      certainty: "probable",
      via: [[41.6, 12.1], [40.5, 12.0], [39.0, 11.9], [38.0, 11.6], [37.3, 10.6], [36.85, 10.32], [36.55, 9.6], [36.34, 9.15], [36.18, 8.71]]
    },
    // Probable: Letter XXI places him at Hippo in 391, but not the journey there.
    { from: "thagaste-2", to: "hippo", by: "land", certainty: "probable", via: [[36.6, 7.85]] }
  ]
};
