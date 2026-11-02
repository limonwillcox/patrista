import { KEY_WORKS } from "./keyWorks";
import { writingCategory } from "./libraryHover";

type Titled = { id: string; title: string };

export type ShelfGroup<W extends Titled = Titled> = { id: string; label: string; works: W[] };

const PLURAL: Record<string, string> = {
  Homily: "Homilies",
  Epistle: "Letters",
  Apology: "Apologies",
  Commentary: "Commentaries",
  History: "Histories",
  Catechesis: "Catechetical works",
  Martyrdom: "Martyrdoms",
  Dialogue: "Dialogues",
  Treatise: "Treatises",
  Sermon: "Sermons",
  Oration: "Orations",
  Creed: "Creeds",
  Council: "Councils",
  Canon: "Canons",
  Hymn: "Hymns",
  Rule: "Rules"
};

/** Key works first, then one shelf per kind of writing, biggest kind first. */
export function shelfGroups<W extends Titled>(works: W[]): ShelfGroup<W>[] {
  const byTitle = (a: W, b: W) => a.title.replace(/^The /, "").localeCompare(b.title.replace(/^The /, ""));
  const key = works.filter((w) => KEY_WORKS.has(w.id)).sort(byTitle);
  const kinds = new Map<string, W[]>();
  for (const w of works) {
    if (KEY_WORKS.has(w.id)) continue;
    const kind = writingCategory(w.title);
    const list = kinds.get(kind);
    if (list) list.push(w);
    else kinds.set(kind, [w]);
  }
  const groups: ShelfGroup<W>[] = [];
  if (key.length) groups.push({ id: "start-here", label: "Start here", works: key });
  [...kinds.entries()]
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .forEach(([kind, list]) => {
      const label = PLURAL[kind] || kind;
      groups.push({ id: kind.toLowerCase(), label: key.length || kinds.size > 1 ? label : "Writings", works: list.sort(byTitle) });
    });
  return groups;
}
