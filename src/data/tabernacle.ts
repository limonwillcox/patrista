/*
 * The tabernacle of Exodus 25–40, in cubits, from the KJV in Bibles/KJV/ex.json.
 *
 * Every number says where it comes from: "from Exod x:y" when the text gives it, "not given; chosen" when
 * it does not. Each chosen value is also listed in GUESSES, which the page shows as "What the text does not
 * say". tests/tabernacle.test.ts checks the stated numbers against the text, so a later edit cannot drift.
 *
 * Axes for the model and the plan: x runs east (the court gate is on the east, 27:13–16), y is up, z runs
 * south. North is −z. One unit is one cubit.
 */

/* ------------------------------------------------------------------ references */

export type BookId = "gn" | "ex";
const BOOK_NUMBER: Record<BookId, number> = { gn: 1, ex: 2 };
const BOOK_SHORT: Record<BookId, string> = { gn: "Gen", ex: "Exod" };

/** A verse or a run of verses in one chapter. */
export type Ref = { book: BookId; chapter: number; verse: number; to?: number };

const ex = (chapter: number, verse: number, to?: number): Ref => ({ book: "ex", chapter, verse, to });
const gn = (chapter: number, verse: number, to?: number): Ref => ({ book: "gn", chapter, verse, to });

export function refLabel(r: Ref): string {
  return BOOK_SHORT[r.book] + " " + r.chapter + ":" + r.verse + (r.to ? "–" + r.to : "");
}

/** The Bible reader opens at the first verse (it takes one verse, not a range). */
export function refHref(r: Ref): string {
  return "/bible?book=" + r.book + "&chapter=" + r.chapter + "&verse=" + r.verse;
}

/** First and last verse id, in the numbering of public/connections (book × 1e6 + chapter × 1e3 + verse). */
export function refVids(r: Ref): [number, number] {
  const base = BOOK_NUMBER[r.book] * 1_000_000 + r.chapter * 1000;
  return [base + r.verse, base + (r.to ?? r.verse)];
}

/* ------------------------------------------------------------------ what the text measures */

/** The court. */
export const COURT = {
  length: 100, // from Exod 27:18 (and 27:9, 27:11: an hundred cubits on the south and north)
  breadth: 50, // from Exod 27:18 (27:12–13: fifty on the west and east)
  height: 5, // from Exod 27:18 "the height five cubits"
  gate: 20, // from Exod 27:16 "an hanging of twenty cubits"
  gateHeight: 5, // from Exod 38:18 "the height in the breadth was five cubits"
  gateSide: 15, // from Exod 27:14–15: fifteen cubits of hangings each side of the gate
  pillars: { south: 20, north: 20, west: 10, eachSideOfGate: 3, gate: 4 }, // from Exod 27:10–16
  pillarSpacing: 5, // not given; chosen: 60 pillars every 5 cubits round the 300-cubit fence
  pillarRadius: 0.25 // not given; chosen
};

/** The boards of the tent. */
export const BOARD = {
  height: 10, // from Exod 26:16 "Ten cubits shall be the length of a board"
  breadth: 1.5, // from Exod 26:16 "a cubit and a half shall be the breadth"
  thickness: 1, // not given; chosen
  south: 20, // from Exod 26:18
  north: 20, // from Exod 26:20
  west: 6, // from Exod 26:22
  corners: 2, // from Exod 26:23
  socketsPerBoard: 2 // from Exod 26:19 "two sockets under one board for his two tenons"
};

/** Bars: five on each of the three walls, the middle one end to end. */
export const BARS = {
  perWall: 5, // from Exod 26:26–27
  middleHeight: 5, // not given; chosen (26:28 says "in the midst of the boards")
  otherHeights: [2.5, 7.5], // not given; chosen: two short bars above and below, each half the wall
  radius: 0.15 // not given; chosen
};

/** The inner covering: ten curtains of fine twined linen, blue, purple and scarlet. */
export const LINEN = {
  count: 10, // from Exod 26:1
  length: 28, // from Exod 26:2
  breadth: 4, // from Exod 26:2
  perSet: 5 // from Exod 26:3: five coupled to five, joined by the taches (26:6)
};

/** The goats' hair covering. */
export const GOATS_HAIR = {
  count: 11, // from Exod 26:7
  length: 30, // from Exod 26:8
  breadth: 4, // from Exod 26:8
  frontFold: 2 // from Exod 26:9 "double the sixth curtain in the forefront": half of a 4-cubit curtain
};

/** The tent as built from the boards. */
export const TENT = {
  innerLength: BOARD.south * BOARD.breadth, // 30: from Exod 26:16, 26:18 (twenty boards of a cubit and a half)
  innerBreadth: 10, // not given; chosen: six boards make 9 (26:22), the two corner boards add half a cubit each
  height: BOARD.height, // 10: from Exod 26:16
  veilFromDoor: LINEN.perSet * LINEN.breadth, // 20: the vail hangs "under the taches" (26:33), five 4-cubit curtains in
  hangingHeight: 10, // not given; chosen: the door hanging and the vail as high as the boards
  pillarRadius: 0.25, // not given; chosen
  doorPillars: 5, // from Exod 26:37
  veilPillars: 4 // from Exod 26:32
};

/** The most holy place, behind the vail. Its size follows from the choices above (10 × 10 × 10). */
export const MOST_HOLY = {
  length: TENT.innerLength - TENT.veilFromDoor,
  breadth: TENT.innerBreadth,
  height: TENT.height
};

export const ARK = {
  length: 2.5, // from Exod 25:10
  breadth: 1.5, // from Exod 25:10
  height: 1.5, // from Exod 25:10
  staveLength: 5 // not given; chosen
};

export const MERCY_SEAT = {
  length: 2.5, // from Exod 25:17
  breadth: 1.5, // from Exod 25:17
  thickness: 0.25, // not given; chosen
  cherubHeight: 1.25 // not given; chosen
};

export const TABLE = {
  length: 2, // from Exod 25:23
  breadth: 1, // from Exod 25:23
  height: 1.5, // from Exod 25:23
  border: 1 / 6, // "an hand breadth" (25:25); a handbreadth as a sixth of a cubit is not given; chosen
  staveLength: 4 // not given; chosen
};

export const INCENSE_ALTAR = {
  length: 1, // from Exod 30:2
  breadth: 1, // from Exod 30:2
  height: 2, // from Exod 30:2
  staveLength: 3 // not given; chosen
};

export const BRASEN_ALTAR = {
  length: 5, // from Exod 27:1
  breadth: 5, // from Exod 27:1
  height: 3, // from Exod 27:1
  grateHeight: 1.5, // from Exod 27:5: the net "even to the midst of the altar"
  staveLength: 8 // not given; chosen
};

/** The laver has no measures in the text (30:18, 38:8). */
export const LAVER = {
  diameter: 3, // not given; chosen
  height: 2.5 // not given; chosen (bowl on its foot)
};

/** The candlestick has no measures in the text (25:31–40), only its parts and a talent of gold. */
export const LAMPSTAND = {
  branches: 6, // from Exod 25:32
  lamps: 7, // from Exod 25:37
  height: 3, // not given; chosen
  span: 2.4 // not given; chosen
};

/** Where things stand: centre points [x, z] in cubits. Door of the tent at x = 0. */
export const PLACE = {
  // The court: the most holy place centred in the western half (not given; chosen), which puts the door of
  // the tent on the court's middle line.
  courtCentre: [0, 0] as [number, number],
  courtEast: COURT.length / 2,
  door: 0,
  veil: -TENT.veilFromDoor,
  westWall: -TENT.innerLength,
  ark: [-25, 0] as [number, number], // within the vail (26:33, 40:21); centred: not given; chosen
  table: [-10, -3] as [number, number], // north side, without the vail (26:35, 40:22); distances chosen
  lampstand: [-10, 3] as [number, number], // south side, over against the table (26:35, 40:24); distances chosen
  incenseAltar: [-18, 0] as [number, number], // before the vail (30:6, 40:26); 2 cubits from it: chosen
  laver: [12, 0] as [number, number], // between the tent and the altar (30:18, 40:30); the spot: chosen
  brasenAltar: [25, 0] as [number, number] // before the door of the tent (40:6, 40:29); the spot: chosen
};

/* ------------------------------------------------------------------ what the text does not say */

export type Guess = { what: string; chosen: string; refs: Ref[]; why: string };

export const GUESSES: Guess[] = [
  {
    what: "How long a cubit is",
    chosen: "The model is in cubits. Only the priest's height assumes a cubit of about 45 cm.",
    refs: [ex(25, 10)],
    why: "Every measure is in cubits; the text never says how long one is."
  },
  {
    what: "How thick the boards are",
    chosen: "1 cubit.",
    refs: [ex(26, 16)],
    why: "A board's length and breadth are given, not its thickness."
  },
  {
    what: "How wide the tent is inside",
    chosen: "10 cubits, which makes the most holy place a 10-cubit cube.",
    refs: [ex(26, 22, 24)],
    why: "Six boards at the back make 9 cubits; the two corner boards are taken to add half a cubit each."
  },
  {
    what: "How the corner boards join",
    chosen: "Each corner board shows half a cubit inside and covers the 1-cubit end of the side wall.",
    refs: [ex(26, 23, 24)],
    why: "They are \"coupled together beneath, and … above the head of it unto one ring\"; the joint is not drawn."
  },
  {
    what: "Where the vail hangs",
    chosen: "20 cubits in from the door, leaving 10 behind it.",
    refs: [ex(26, 33), ex(26, 3, 6)],
    why: "It hangs \"under the taches\", which join five curtains of 4 cubits to five more. This assumes the linen begins at the door."
  },
  {
    what: "How the linen covering lies",
    chosen: "Front edge at the door; 8 cubits down each side, 9 down the back.",
    refs: [ex(26, 1, 6)],
    why: "Its size is given (ten curtains, 28 × 4), not how it lies on the boards."
  },
  {
    what: "How the goats' hair covering lies",
    chosen: "A 2-cubit fold over the front, 9 cubits down each side, to the ground at the back.",
    refs: [ex(26, 9), ex(26, 12, 13)],
    why: "The doubled sixth curtain, the half curtain over the back and the cubit over each side are given; the full lie is not."
  },
  {
    what: "The rams' skins and badgers' skins",
    chosen: "Drawn over the roof only, in plain dark colours.",
    refs: [ex(26, 14)],
    why: "No size is given for either, and no colour for the badgers' skins."
  },
  {
    what: "Where the tent stands in the court",
    chosen: "The most holy place in the middle of the western half; the door on the court's middle line.",
    refs: [ex(27, 9, 18)],
    why: "The court's size is given, not where the tent stands in it."
  },
  {
    what: "How the court's pillars are spaced",
    chosen: "Every 5 cubits: 60 pillars round the 300-cubit fence, the gate between the pillars 10 cubits each side of the middle.",
    refs: [ex(27, 10, 16)],
    why: "The counts are given (20, 20, 10, 3 + 4 + 3), not the spacing or how the corner pillars are counted."
  },
  {
    what: "Pillars and sockets",
    chosen: "Pillars a quarter cubit thick; sockets small blocks; the door's five and the vail's four pillars evenly spaced.",
    refs: [ex(26, 32), ex(26, 37), ex(27, 10)],
    why: "The text gives their number and metal, not their size or spacing."
  },
  {
    what: "How high the door hanging and the vail are",
    chosen: "10 cubits, the height of the boards.",
    refs: [ex(26, 31, 37)],
    why: "No height is given for either (the court gate's 5 cubits is given, 38:18)."
  },
  {
    what: "The bars",
    chosen: "Outside the boards: the middle bar end to end at 5 cubits, two short bars above and two below, each half the wall.",
    refs: [ex(26, 26, 29)],
    why: "Five bars a wall and a middle bar \"from end to end\" are given; the rest is not."
  },
  {
    what: "Which way the ark faces",
    chosen: "Its length across the room, the staves running north and south.",
    refs: [ex(25, 12, 15)],
    why: "The rings and staves are on two sides; which two, and the ark's turn in the room, are not said."
  },
  {
    what: "The mercy seat's thickness and the cherubim",
    chosen: "A quarter cubit thick; the cherubim drawn as simple figures a cubit and a quarter high.",
    refs: [ex(25, 17, 20)],
    why: "The length and breadth are given; the thickness and the cherubim's form and size are not."
  },
  {
    what: "The candlestick's size and shape",
    chosen: "3 cubits high, 2.4 across, its branches drawn as round arcs.",
    refs: [ex(25, 31, 39)],
    why: "Its parts are given and its weight (a talent of gold), not its measures or the shape of the branches."
  },
  {
    what: "The laver's size",
    chosen: "A bowl 3 cubits across on a foot, 2.5 cubits high.",
    refs: [ex(30, 18), ex(38, 8)],
    why: "It is of brass, with a foot; no measure is given."
  },
  {
    what: "Where the furniture stands in the holy place",
    chosen: "Table and candlestick 10 cubits in from the door and 3 off the middle line; the incense altar 2 cubits before the vail.",
    refs: [ex(26, 35), ex(30, 6), ex(40, 22, 26)],
    why: "The sides are given (table north, candlestick south, altar before the vail), not the distances."
  },
  {
    what: "Where the altar and laver stand in the court",
    chosen: "The altar 25 cubits inside the gate; the laver 12 cubits before the door.",
    refs: [ex(40, 6, 7), ex(40, 29, 30)],
    why: "The altar is \"before the door\" and the laver \"between the tent … and the altar\"; no distances are given."
  },
  {
    what: "The staves' lengths, and the table's border",
    chosen: "Staves 3 to 8 cubits; the border a sixth of a cubit (a handbreadth).",
    refs: [ex(25, 13), ex(25, 25), ex(27, 6)],
    why: "No stave is measured, and Exodus does not say how a handbreadth relates to a cubit."
  },
  {
    what: "The horns of the altars",
    chosen: "Small blocks at the corners, standing above the stated height.",
    refs: [ex(27, 2), ex(30, 2)],
    why: "The horns are \"of the same\" piece; their size, and whether the height includes them, is not said."
  },
  {
    what: "The bread on the table",
    chosen: "Not drawn.",
    refs: [ex(25, 30)],
    why: "Exodus says \"shewbread … alway\" but not how many loaves (Leviticus 24:5–6 gives twelve)."
  },
  {
    what: "The needlework",
    chosen: "Blue, purple, scarlet and linen drawn as plain bands.",
    refs: [ex(26, 1), ex(26, 31), ex(26, 36), ex(27, 16)],
    why: "The colours are given; the pattern (and the cherubim worked into the vail and curtains) is not drawn."
  }
];

/* ------------------------------------------------------------------ the pieces */

export type PieceId =
  | "court"
  | "gate"
  | "brasenAltar"
  | "laver"
  | "tent"
  | "coverings"
  | "door"
  | "table"
  | "lampstand"
  | "incenseAltar"
  | "veil"
  | "ark"
  | "priest";

export type Piece = {
  id: PieceId;
  name: string;
  /** One plain sentence: what the thing is, from the text. Never a meaning. */
  about: string;
  refs: Ref[];
  /**
   * A type in public/connections/types.json, only when the Fathers draw one from this very thing: the
   * type's own passages must include one of `refs` (the test checks it). We never name a type ourselves.
   */
  typeId?: string;
};

export const PIECES: Piece[] = [
  {
    id: "court",
    name: "The court",
    about: "A fence of fine twined linen five cubits high, a hundred cubits by fifty, hung on pillars set in sockets of brass.",
    refs: [ex(27, 9, 19), ex(38, 9, 20), ex(40, 8)]
  },
  {
    id: "gate",
    name: "The gate of the court",
    about: "A hanging of blue, purple, scarlet and fine twined linen, twenty cubits wide, on the east side.",
    refs: [ex(27, 13, 16), ex(38, 18, 19)]
  },
  {
    id: "brasenAltar",
    name: "The altar of burnt offering",
    about: "A hollow altar of shittim wood overlaid with brass, five cubits square and three high, with a horn at each corner.",
    refs: [ex(27, 1, 8), ex(38, 1, 7), ex(40, 6), ex(40, 29)]
  },
  {
    id: "laver",
    name: "The laver",
    about: "A basin of brass on a foot of brass, where Aaron and his sons washed their hands and feet.",
    refs: [ex(30, 17, 21), ex(38, 8), ex(40, 7), ex(40, 30, 32)]
  },
  {
    id: "tent",
    name: "The tabernacle",
    about: "Forty-eight boards of shittim wood overlaid with gold, each standing in two sockets of silver, held together by bars.",
    refs: [ex(26, 15, 30), ex(36, 20, 34), ex(38, 27), ex(40, 17, 18)]
  },
  {
    id: "coverings",
    name: "The coverings",
    about: "Curtains of linen with cherubim, then goats' hair, then rams' skins dyed red, then badgers' skins above.",
    refs: [ex(26, 1, 14), ex(36, 8, 19), ex(40, 19)]
  },
  {
    id: "door",
    name: "The door of the tent",
    about: "A hanging of blue, purple, scarlet and fine twined linen on five pillars overlaid with gold, in sockets of brass.",
    refs: [ex(26, 36, 37), ex(36, 37, 38), ex(40, 28)]
  },
  {
    id: "table",
    name: "The table of shewbread",
    about: "A table of shittim wood overlaid with gold, two cubits long, a cubit broad and a cubit and a half high, on the north side.",
    refs: [ex(25, 23, 30), ex(37, 10, 16), ex(40, 22, 23)]
  },
  {
    id: "lampstand",
    name: "The candlestick",
    about: "A lampstand of beaten pure gold with six branches and seven lamps, on the south side over against the table.",
    refs: [ex(25, 31, 40), ex(37, 17, 24), ex(40, 24, 25)]
  },
  {
    id: "incenseAltar",
    name: "The altar of incense",
    about: "A golden altar a cubit square and two high, before the vail, where sweet incense was burnt morning and evening.",
    refs: [ex(30, 1, 10), ex(37, 25, 28), ex(40, 26, 27)]
  },
  {
    id: "veil",
    name: "The vail",
    about: "A curtain of blue, purple, scarlet and fine twined linen with cherubim, dividing the holy place from the most holy.",
    refs: [ex(26, 31, 33), ex(36, 35, 36), ex(40, 21)],
    typeId: "04:temple-veil"
  },
  {
    id: "ark",
    name: "The ark of the testimony",
    about: "A chest of shittim wood overlaid with gold, holding the testimony, under the mercy seat and its two cherubim.",
    refs: [ex(25, 10, 22), ex(26, 34), ex(37, 1, 9), ex(40, 20, 21)],
    typeId: "04:ark-of-the-covenant"
  },
  {
    id: "priest",
    name: "The high priest",
    about: "Aaron, brought to the door of the tent, washed with water, clothed in the holy garments and anointed.",
    refs: [ex(28, 1, 4), ex(29, 4, 9), ex(40, 12, 15)],
    typeId: "04:anointed-one"
  }
];

export const pieceById = (id: PieceId): Piece => PIECES.find((p) => p.id === id)!;

/* ------------------------------------------------------------------ the priest's path */

export type Step = {
  piece: PieceId;
  /** Where the priest stands, [x, z]. */
  stand: [number, number];
  /** Points he walks through on the way, so he goes round things rather than through them. */
  via?: [number, number][];
  /** The camera: compass bearing it looks from (degrees, 0 = from the east, 90 = from the south), height angle, distance. */
  view: { from: number; up: number; dist: number };
  /** Inside the tent: lift the coverings to see in. */
  inside?: boolean;
  /** One line from the text, with its verse. */
  line: string;
  lineRef: Ref;
};

export const PATH: Step[] = [
  {
    piece: "gate",
    stand: [53, 0],
    view: { from: 25, up: 28, dist: 46 },
    line: "The gate is on the east side, the only way into the court.",
    lineRef: ex(27, 13, 16)
  },
  {
    piece: "brasenAltar",
    stand: [29.5, 1.5],
    view: { from: 35, up: 38, dist: 26 },
    line: "\"Thou shalt set the altar of the burnt offering before the door of the tabernacle\"",
    lineRef: ex(40, 6)
  },
  {
    piece: "laver",
    stand: [14.5, 0],
    view: { from: 40, up: 34, dist: 16 },
    line: "\"When they go into the tabernacle … they shall wash with water, that they die not.\"",
    lineRef: ex(30, 20)
  },
  {
    piece: "door",
    stand: [2, 0],
    view: { from: 20, up: 22, dist: 30 },
    line: "The hanging for the door of the tent, on five pillars.",
    lineRef: ex(26, 36, 37)
  },
  {
    piece: "table",
    stand: [-10, -1.5],
    view: { from: -10, up: 64, dist: 13 },
    inside: true,
    line: "\"Thou shalt set upon the table shewbread before me alway.\"",
    lineRef: ex(25, 30)
  },
  {
    piece: "lampstand",
    stand: [-10, 1.5],
    via: [[-8.5, 0]],
    view: { from: 10, up: 64, dist: 13 },
    inside: true,
    line: "\"They shall light the lamps thereof, that they may give light over against it.\"",
    lineRef: ex(25, 37)
  },
  {
    piece: "incenseAltar",
    stand: [-16.6, 0],
    view: { from: 30, up: 60, dist: 11 },
    inside: true,
    line: "\"Aaron shall burn thereon sweet incense every morning.\"",
    lineRef: ex(30, 7)
  },
  {
    piece: "veil",
    stand: [-19.3, 1.8],
    via: [[-17, 1.8]],
    view: { from: 35, up: 45, dist: 18 },
    inside: true,
    line: "\"The vail shall divide unto you between the holy place and the most holy.\"",
    lineRef: ex(26, 33)
  },
  {
    piece: "ark",
    stand: [-23, 0],
    view: { from: 0, up: 70, dist: 13 },
    inside: true,
    line: "\"There I will meet with thee, and I will commune with thee from above the mercy seat.\"",
    lineRef: ex(25, 22)
  }
];

/** Where the priest waits before the walk: outside the gate. */
export const PRIEST_START: [number, number] = [58, 3];

/** The view of the whole court. */
export const OVERVIEW = { target: [0, 0, 0] as [number, number, number], view: { from: 35, up: 45, dist: 150 } };

/* ------------------------------------------------------------------ the creation in the text */

/** A verse quoted from the KJV. `text` must be found in the verse as written (the test checks). */
export type Quote = { ref: Ref; text: string };

/**
 * A word both verses share: the English form in each, and the Strong's number both carry in
 * public/strongs/kjv when the same Hebrew word stands behind them.
 */
export type Shared = { a: string; b: string; strongs?: string };

export type Pair = { a: Quote; b: Quote; shared: Shared[] };

/** The seven times the LORD speaks to Moses in Exodus 25–31, and what each speech is about. */
export const SPEECHES: { quote: Quote; about: string; span: Ref }[] = [
  { quote: { ref: ex(25, 1), text: "And the LORD spake unto Moses" }, about: "The tabernacle, its furniture and the priesthood", span: ex(25, 1) },
  { quote: { ref: ex(30, 11), text: "And the LORD spake unto Moses" }, about: "The ransom of half a shekel", span: ex(30, 11, 16) },
  { quote: { ref: ex(30, 17), text: "And the LORD spake unto Moses" }, about: "The laver", span: ex(30, 17, 21) },
  { quote: { ref: ex(30, 22), text: "Moreover the LORD spake unto Moses" }, about: "The anointing oil", span: ex(30, 22, 33) },
  { quote: { ref: ex(30, 34), text: "And the LORD said unto Moses" }, about: "The incense", span: ex(30, 34, 38) },
  { quote: { ref: ex(31, 1), text: "And the LORD spake unto Moses" }, about: "Bezaleel, filled with the spirit of God, to make it all", span: ex(31, 1, 11) },
  { quote: { ref: ex(31, 12), text: "And the LORD spake unto Moses" }, about: "The sabbath", span: ex(31, 12, 17) }
];

/** The seventh speech and the seventh day. */
export const SABBATH_PAIR: Pair = {
  a: { ref: gn(2, 2), text: "on the seventh day God ended his work which he had made; and he rested on the seventh day" },
  b: { ref: ex(31, 17), text: "for in six days the LORD made heaven and earth, and on the seventh day he rested" },
  shared: [
    { a: "seventh", b: "seventh", strongs: "H7637" },
    { a: "rested", b: "rested", strongs: "H7673" }
  ]
};

/** When the work is done, the words of Genesis 1:31–2:3 come back. */
export const FINISHED_PAIRS: Pair[] = [
  {
    a: { ref: gn(1, 31), text: "And God saw every thing that he had made, and, behold, it was very good." },
    b: { ref: ex(39, 43), text: "And Moses did look upon all the work, and, behold, they had done it as the LORD had commanded" },
    shared: [{ a: "saw", b: "look", strongs: "H7200" }, { a: "behold", b: "behold" }]
  },
  {
    a: { ref: gn(2, 1), text: "Thus the heavens and the earth were finished, and all the host of them." },
    b: { ref: ex(39, 32), text: "Thus was all the work of the tabernacle of the tent of the congregation finished" },
    shared: [{ a: "finished", b: "finished", strongs: "H3615" }]
  },
  {
    a: { ref: gn(2, 2), text: "And on the seventh day God ended his work which he had made" },
    b: { ref: ex(40, 33), text: "So Moses finished the work." },
    shared: [
      { a: "ended", b: "finished", strongs: "H3615" },
      { a: "work", b: "work", strongs: "H4399" }
    ]
  },
  {
    a: { ref: gn(2, 3), text: "And God blessed the seventh day, and sanctified it" },
    b: { ref: ex(39, 43), text: "and Moses blessed them." },
    shared: [{ a: "blessed", b: "blessed", strongs: "H1288" }]
  }
];
