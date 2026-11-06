/**
 * Journeys of the Fathers, for the globe on a Father's page. Every stop cites the text it rests on,
 * linked into the reader. Legs whose road is not recorded are marked "probable" and drawn dashed.
 */

export type JourneyLink = { label: string; href: string };

export type JourneyStop = {
  id: string;
  name: string;
  /** Present-day place, for readers who want to find it on a modern map. */
  today: string;
  lat: number;
  lon: number;
  /** Which side of the marker its name sits, so neighbouring names do not overlap. */
  label?: "left" | "right" | "above" | "below";
  when: string;
  text: string;
  /** Works written at this stop. */
  wrote?: JourneyLink[];
  sources: JourneyLink[];
};

export type JourneyLeg = { from: string; to: string; by: "land" | "sea"; certainty: "attested" | "probable"; via?: [number, number][] };

export type Journey = {
  authorId: string;
  title: string;
  summary: string;
  stops: JourneyStop[];
  legs: JourneyLeg[];
  note: string;
};

const ign = (n: number) => "/fathers/ignatius/epistles-of-ignatius/chapter-" + n + "/";
const polycarp = (n: number) => "/fathers/polycarp/epistle-to-the-philippians/chapter-" + n + "/";

export const JOURNEYS: Record<string, Journey> = {
  ignatius: {
    authorId: "ignatius",
    title: "The road to Rome",
    summary:
      "Arrested at Antioch, Ignatius was taken under guard across Asia Minor and Greece to die in the arena at Rome. He wrote all seven of his letters on the way.",
    note: "Stops and letters are as Ignatius and Polycarp record them. The roads themselves are not recorded. Dashed lines mark stretches where even the stops are unknown, drawn along the usual way.",
    stops: [
      {
        id: "antioch",
        name: "Antioch",
        today: "Antakya, Turkey",
        lat: 36.2,
        lon: 36.16,
        when: "Setting out",
        text: "Bishop of Antioch in Syria. He is sent to Rome in chains, guarded by ten soldiers he calls “ten leopards”.",
        sources: [{ label: "Romans 5", href: ign(55) }]
      },
      {
        id: "philadelphia",
        name: "Philadelphia",
        today: "Alaşehir, Turkey",
        lat: 38.35,
        lon: 28.52,
        label: "below",
        when: "On the way",
        text: "He passes through and speaks to the church: “Give heed to the bishop, and to the presbytery and deacons.”",
        sources: [{ label: "Philadelphians 7", href: ign(67) }]
      },
      {
        id: "smyrna",
        name: "Smyrna",
        today: "İzmir, Turkey",
        lat: 38.42,
        lon: 27.14,
        label: "left",
        when: "A halt with Polycarp",
        text: "He stays with Polycarp, bishop of Smyrna, and delegates from nearby churches come to him. He writes four letters here.",
        wrote: [
          { label: "To the Ephesians", href: ign(1) },
          { label: "To the Magnesians", href: ign(23) },
          { label: "To the Trallians", href: ign(38) },
          { label: "To the Romans", href: ign(51) }
        ],
        sources: [
          { label: "Ephesians 21", href: ign(22) },
          { label: "Magnesians 15", href: ign(37) },
          { label: "Trallians 12", href: ign(49) },
          { label: "Romans 10", href: ign(60) }
        ]
      },
      {
        id: "troas",
        name: "Troas",
        today: "near Dalyan, Turkey",
        lat: 39.75,
        lon: 26.16,
        label: "left",
        when: "Waiting for a ship",
        text: "News reaches him that the church at Antioch is at peace. He writes three more letters, then must sail suddenly for Neapolis.",
        wrote: [
          { label: "To the Philadelphians", href: ign(61) },
          { label: "To the Smyrnaeans", href: ign(72) },
          { label: "To Polycarp", href: ign(85) }
        ],
        sources: [
          { label: "Philadelphians 10", href: ign(70) },
          { label: "Philadelphians 11", href: ign(71) },
          { label: "Smyrnaeans 12", href: ign(83) },
          { label: "To Polycarp 8", href: ign(92) }
        ]
      },
      {
        id: "philippi",
        name: "Philippi",
        today: "near Kavala, Greece",
        lat: 41.01,
        lon: 24.29,
        label: "above",
        when: "Across the sea",
        text: "Landing at Neapolis, he is taken through Philippi. The Philippians see him in chains and later ask Polycarp for copies of his letters.",
        sources: [
          { label: "Polycarp, Philippians 9", href: polycarp(9) },
          { label: "Polycarp, Philippians 13", href: polycarp(13) }
        ]
      },
      {
        id: "rome",
        name: "Rome",
        today: "Rome, Italy",
        lat: 41.89,
        lon: 12.49,
        when: "About 110",
        text: "Tradition holds that he died in the arena, as he had asked the Romans to let him: “I am the wheat of God, and let me be ground by the teeth of the wild beasts”. The letters tell of the request, not the death; the date is traditional.",
        sources: [{ label: "Romans 4", href: ign(54) }]
      }
    ],
    legs: [
      // The overland road across Asia Minor is not recorded; this follows the main route west.
      { from: "antioch", to: "philadelphia", by: "land", certainty: "probable", via: [[37.0, 35.3], [37.6, 32.5], [38.3, 30.3]] },
      { from: "philadelphia", to: "smyrna", by: "land", certainty: "attested" },
      { from: "smyrna", to: "troas", by: "land", certainty: "attested", via: [[39.1, 26.9]] },
      { from: "troas", to: "philippi", by: "sea", certainty: "attested", via: [[40.3, 25.4], [40.93, 24.41]] },
      // From Philippi the record stops. The usual way on was the Via Egnatia to Dyrrachium, then across to Italy.
      {
        from: "philippi",
        to: "rome",
        by: "land",
        certainty: "probable",
        via: [[40.64, 22.94], [41.1, 20.8], [41.32, 19.45], [40.64, 17.94], [41.1, 16.0], [41.5, 14.0]]
      }
    ]
  }
};

// Each further journey lives in its own file under journeyRoutes/.
import { journey as augustineJourney } from "./journeyRoutes/augustine";
import { journey as athanasiusJourney } from "./journeyRoutes/athanasius";
import { journey as chrysostomJourney } from "./journeyRoutes/chrysostom";
import { journey as jeromeJourney } from "./journeyRoutes/jerome";
import { journey as cassianJourney } from "./journeyRoutes/cassian";
import { journey as sulpiciusseverusJourney } from "./journeyRoutes/sulpicius_severus";
import { journey as justinJourney } from "./journeyRoutes/justin";
import { journey as cyprianJourney } from "./journeyRoutes/cyprian";
JOURNEYS.augustine = augustineJourney;
JOURNEYS.athanasius = athanasiusJourney;
JOURNEYS.chrysostom = chrysostomJourney;
JOURNEYS.jerome = jeromeJourney;
JOURNEYS.cassian = cassianJourney;
JOURNEYS.sulpicius_severus = sulpiciusseverusJourney;
JOURNEYS.justin = justinJourney;
JOURNEYS.cyprian = cyprianJourney;
