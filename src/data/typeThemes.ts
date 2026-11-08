/*
 * The themes of the types map (/types): seven families of things in Scripture, each a colour on the map.
 * A theme is our own grouping, by the thing in the Old Testament (water, wood, blood, ...), in the spirit of
 * James Jordan's *Through New Eyes*. It makes no typological claim of its own: every claim stays with the
 * type and its Fathers (public/connections/types.json). Each type has exactly one theme; tests/typeMap.test.ts
 * checks that every type in the data has one.
 */

export type ThemeId = "waters" | "wood" | "blood" | "table" | "places" | "people" | "patterns";

export const THEMES: { id: ThemeId; label: string; blurb: string }[] = [
  { id: "waters", label: "Waters", blurb: "The waters of the beginning, the flood, the sea, the Jordan, the well and the font." },
  { id: "wood", label: "Trees and wood", blurb: "The tree, the wood that saves, the pole and the outstretched arms." },
  { id: "blood", label: "Blood and sacrifice", blurb: "The lamb, the heifer, the goats, Isaac, Abel and the scarlet cord." },
  { id: "table", label: "Bread, oil and robes", blurb: "Bread from heaven, Melchizedek's bread and wine, anointing and the new garment." },
  { id: "places", label: "Garden, mountain and house", blurb: "Paradise, the mountain, the ark, the veil, the gate and Jerusalem above." },
  { id: "people", label: "People", blurb: "Adam, Eve, Joseph, Moses, Joshua, Samson, David, the forerunner, the bride and the Bridegroom." },
  { id: "patterns", label: "Days, numbers and directions", blurb: "Three, six, seven, eight, twelve and forty; down and up; west to east; night to day." }
];

/** Each type's theme, by its id in types.json. */
export const THEME_OF: Record<string, ThemeId> = {
  // Waters
  "04:primordial-waters": "waters",
  "04:hovering-spirit": "waters",
  "04:deluge-and-dove": "waters",
  "04:ark": "waters",
  "04:righteous-remnant": "waters",
  "04:dove": "waters",
  "04:waters-of-judgment": "waters",
  "04:sea-monster": "waters",
  "04:jonah-descent": "waters",
  "04:exodus-through-water": "waters",
  "04:tyrant-in-the-waters": "waters",
  "04:water-then-wilderness": "waters",
  "04:jordan": "waters",
  "04:voice-from-heaven": "waters",
  "04:mediator-from-above": "waters",
  "04:water-chain": "waters",
  "04:well": "waters",
  "04:healing-pool": "waters",
  "04:font": "waters",
  "04:fish": "waters",
  "04:smitten-rock": "waters",
  "04:fire-from-water": "waters",
  "04:gideons-fleece": "waters",
  "04:burial-and-rising": "waters",
  // Trees and wood
  "04:cross": "wood",
  "04:saving-wood": "wood",
  "04:axe-head-raised": "wood",
  "04:moses-outstretched-arms": "wood",
  "04:bronze-serpent": "wood",
  "04:serpent": "wood",
  "04:thorns": "wood",
  "04:fig-tree": "wood",
  "04:olive": "wood",
  // Blood and sacrifice
  "04:paschal-lamb": "blood",
  "04:red-heifer": "blood",
  "04:two-goats": "blood",
  "04:isaac-on-moriah": "blood",
  "04:abel": "blood",
  "04:rahabs-scarlet-cord": "blood",
  "04:pierced-side": "blood",
  // Bread, oil and robes
  "04:manna": "table",
  "04:priest-king-with-bread": "table",
  "04:anointed-one": "table",
  "04:garment": "table",
  // Garden, mountain and house
  "04:garden": "places",
  "04:holy-mountain": "places",
  "04:heavenly-jerusalem": "places",
  "04:egypt": "places",
  "04:ark-of-the-covenant": "places",
  "04:temple-veil": "places",
  "04:jacobs-ladder": "places",
  "04:closed-gate": "places",
  "04:burning-bush": "places",
  "04:pillar-and-cloud": "places",
  "04:stone-cut-without-hands": "places",
  // People
  "04:first-and-last-adam": "people",
  "04:eve-and-mary": "people",
  "04:joseph": "people",
  "04:deliverer-sent": "people",
  "04:joshua": "people",
  "04:samson": "people",
  "04:david": "people",
  "04:forerunner": "people",
  "04:bridegroom": "people",
  "04:bride": "people",
  // Days, numbers and directions
  "04:three-third-day": "patterns",
  "04:sixth-day": "patterns",
  "04:seven": "patterns",
  "04:eighth-day": "patterns",
  "04:twelve": "patterns",
  "04:forty": "patterns",
  "04:heaven-earth-axis": "patterns",
  "04:descent-ascent": "patterns",
  "04:darkness-to-light": "patterns",
  "04:west-to-east": "patterns",
  "04:figure-to-truth": "patterns",
  "04:recapitulative-reversal": "patterns",
  "04:new-creation": "patterns"
};

export const themeOf = (id: string): ThemeId => THEME_OF[id] ?? "patterns";
export const themeLabel = (id: ThemeId) => THEMES.find((t) => t.id === id)?.label ?? id;
