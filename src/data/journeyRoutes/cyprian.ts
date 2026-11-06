import type { Journey } from "../journeys";

const ep = (n: number) => "/fathers/cyprian/epistles-of-cyprian/chapter-" + n + "/";
const work = (id: string) => "/fathers/cyprian/" + id + "/chapter-1/";
const life = work("life-and-passion-of-cyprian");

export const journey: Journey = {
  authorId: "cyprian",
  title: "Never far from Carthage",
  summary:
    "Bishop of Carthage for barely ten years, Cyprian led his church by letter from hiding through one persecution, stayed with it through the plague, and was beheaded at Carthage in the next.",
  note: "The hiding, the exile at Curubis, the gardens and the martyrdom are as Cyprian's letters and his deacon Pontius record them. Where he hid in 250–251 is not known: that marker is set near Carthage only to show him away from the city, and the dashed lines to and from it are guesses. The years of his exile (257) and death (14 September 258) are the traditional ones; the Acts of his trial that give them are not in this library.",
  stops: [
    {
      id: "carthage",
      name: "Carthage",
      today: "Carthage, near Tunis, Tunisia",
      lat: 36.85,
      lon: 10.32,
      label: "above",
      when: "About 246–249",
      text: "A man of learning and means, he is converted by the presbyter Caecilius, sells even his gardens, and is chosen bishop “while still a neophyte”, probably in 248 or 249.",
      wrote: [{ label: "To Donatus", href: work("to-donatus") }],
      sources: [{ label: "Pontius, Life 4–5, 15", href: life }]
    },
    {
      id: "hiding",
      name: "In hiding",
      today: "Site unknown; somewhere near Carthage, Tunisia",
      lat: 36.6,
      lon: 9.95,
      label: "left",
      when: "250–251",
      text: "When the persecution of Decius breaks out and the crowd calls for him, he “withdrew for a while”. From a hiding place no one has found, he guides his church by letter, “although absent in body”.",
      wrote: [
        { label: "To his clergy, Epistle V (modern Ep. 14)", href: ep(1) },
        { label: "To the confessors, Epistle VI (modern Ep. 13)", href: ep(2) },
        { label: "To the clergy at Rome, Epistle XIV (modern Ep. 20)", href: ep(3) },
        { label: "To the people, Epistle XXXIX (modern Ep. 43)", href: ep(7) }
      ],
      sources: [
        { label: "Epistle XIV (modern Ep. 20)", href: ep(3) },
        { label: "Pontius, Life 7", href: life }
      ]
    },
    {
      id: "carthage-2",
      name: "Carthage",
      today: "Carthage, near Tunis, Tunisia",
      lat: 36.85,
      lon: 10.32,
      label: "below",
      when: "251–256",
      text: "Back after Easter 251, he tells his people “peace is restored to the Church”. When “a dreadful plague” strikes he has Christians care for pagans as well as their own, and letters go back and forth with the bishops of Rome, Cornelius and later Stephen.",
      wrote: [
        { label: "On the Lapsed", href: work("on-the-lapsed") },
        { label: "On the Unity of the Church", href: work("on-the-unity-of-the-church") },
        { label: "On the Mortality", href: work("on-the-mortality") },
        { label: "To Cornelius, Epistle XL (modern Ep. 44)", href: ep(7) },
        { label: "To Stephen, Epistle LXXI (modern Ep. 72)", href: ep(14) }
      ],
      sources: [
        { label: "On the Lapsed 1", href: work("on-the-lapsed") },
        { label: "Epistle XXXIX (modern Ep. 43)", href: ep(7) },
        { label: "Pontius, Life 9–10", href: life }
      ]
    },
    {
      id: "curubis",
      name: "Curubis",
      today: "Korba, Tunisia",
      lat: 36.58,
      lon: 10.86,
      label: "right",
      when: "Exile, 257–258",
      text: "Banished by the proconsul, he is sent to Curubis, “a sunny and suitable spot”, with Pontius beside him. On the first day he sees in a vision a youth whose hand, “flattened like a blade”, foretells his death.",
      wrote: [{ label: "To the martyrs in the mines, Epistle LXXVI (modern Ep. 76)", href: ep(16) }],
      sources: [{ label: "Pontius, Life 11–13", href: life }]
    },
    {
      id: "carthage-3",
      name: "Carthage",
      today: "Carthage, near Tunis, Tunisia",
      lat: 36.85,
      lon: 10.32,
      label: "right",
      when: "14 September 258",
      text: "Back at his gardens near the city, he hides rather than be taken to Utica, asking to “confess among you, and there suffer”. Seized at last, he is tried at Carthage and beheaded, “having with his own hands bound his eyes”.",
      wrote: [{ label: "His last letter, Epistle LXXXII (modern Ep. 81)", href: ep(17) }],
      sources: [
        { label: "Epistle LXXXII (modern Ep. 81)", href: ep(17) },
        { label: "Pontius, Life 15–19", href: life }
      ]
    }
  ],
  legs: [
    // Where he hid is unknown, so both roads to and from the hiding place are guesses.
    { from: "carthage", to: "hiding", by: "land", certainty: "probable", via: [[36.75, 10.15]] },
    { from: "hiding", to: "carthage-2", by: "land", certainty: "probable", via: [[36.75, 10.15]] },
    // Pontius records the exile to Curubis; the road is the usual one round the Gulf of Tunis and across the neck of Cap Bon.
    { from: "carthage-2", to: "curubis", by: "land", certainty: "attested", via: [[36.77, 10.27], [36.6, 10.5]] },
    // Pontius and Epistle LXXXII place him back at his gardens near Carthage; the road is not recorded.
    { from: "curubis", to: "carthage-3", by: "land", certainty: "attested", via: [[36.62, 10.55], [36.79, 10.3]] }
  ]
};
