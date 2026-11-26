import { beforeAll, describe, expect, it } from "vitest";
import { getCatalog, getWork } from "../server/api";

// Reading the whole library takes longer than one test's time limit; do it once, before the tests.
beforeAll(() => {
  getCatalog();
}, 180_000);

/**
 * Nov 2026 audit of the authors with one or two works (scripts/english-by-father/split-small-authors.mjs):
 * works the Schaff volumes print that the library lacked, fragments that sat unseen at the end of another
 * work's last chapter, and two sets of lectures that were cut every forty paragraphs.
 */

type Chapter = { heading: string; versions: Record<string, string[]>; footnotes?: { n: string; text: string; para: number }[] };

function chapters(id: string): Chapter[] {
  const work = getWork(id);
  if (!work) throw new Error("no work " + id);
  return work.chapters as Chapter[];
}
const text = (c: Chapter) => c.versions.schaff ?? [];
const title = (id: string) => getCatalog().works.find((w) => w.id === id)?.title;

/** No footnote mark, rule or CCEL link is left in the reader's text. */
function expectClean(id: string) {
  for (const c of chapters(id)) {
    expect(text(c).length, id + " " + c.heading).toBeGreaterThan(0);
    for (const p of text(c)) {
      expect(p, p.slice(0, 60)).not.toMatch(/\[\d+\]/);
      expect(p, p.slice(0, 60)).not.toMatch(/_{5,}|ccel\.org|\b(?:anf|npnf)\d+\b/i);
    }
  }
}

describe("Irenaeus", () => {
  it("has the fragments of his lost writings as a work of fifty-five fragments", () => {
    const frags = chapters("fragments-from-the-lost-writings-of-irenaeus");
    expect(frags).toHaveLength(55);
    expect(frags[0].heading).toBe("Fragment I");
    expect(frags[54].heading).toBe("Fragment LV");
    expect(text(frags[0])[0]).toMatch(/^I adjure thee, who shalt transcribe this book/);
    // The two fragments whose numeral carries the note keep it.
    expect(frags[29].footnotes?.map((f) => f.n)).toContain("4846");
    expectClean("fragments-from-the-lost-writings-of-irenaeus");
  });

  it("ends Against Heresies with Book V chapter XXXVI, not with the fragments", () => {
    const last = chapters("against-heresies").at(-1)!;
    expect(last.heading).toBe("Chapter XXXVI");
    expect(text(last)).toHaveLength(4);
    expect(text(last).join(" ")).not.toMatch(/Lost Writings|I adjure thee/);
  });

  it("has the Demonstration of the Apostolic Preaching in a hundred chapters", () => {
    const d = chapters("demonstration-of-the-apostolic-preaching");
    expect(d).toHaveLength(100);
    expect(d[0].heading).toBe("Chapter 1");
    expect(d[99].heading).toBe("Chapter 100");
    expect(text(d[0])[0]).toMatch(/^Knowing, my beloved Marcianus/);
    expect(text(d[24]).join(" ")).toMatch(/^And when famine had come upon all the earth/);
    expect(text(d[99]).join(" ")).toMatch(/attain the redemption that is from Him/);
    expect(getCatalog().works.find((w) => w.id === "demonstration-of-the-apostolic-preaching")?.author).toBe("irenaeus");
    expectClean("demonstration-of-the-apostolic-preaching");
  });
});

describe("Aristides", () => {
  it("shelves the Apology under Aristides, in the Greek and Syriac recensions", () => {
    const a = chapters("apology-of-aristides");
    expect(a).toHaveLength(2);
    expect(a[0].heading).toBe("Greek (Barlaam and Josaphat)");
    expect(a[1].heading).toBe("Syriac");
    expect(text(a[0]).join(" ")).toMatch(/I, O King in the providence of God came into the world/);
    expect(getCatalog().works.find((w) => w.id === "apology-of-aristides")?.author).toBe("aristides");
    expect(getCatalog().authors.find((x) => x.id === "aristides")?.name).toBe("Aristides of Athens");
  });
});

describe("Fragmentary second-century writers", () => {
  it("keeps Quadratus's one surviving sentence of the Apology", () => {
    const q = chapters("fragment-of-the-apology");
    expect(q.length).toBeGreaterThanOrEqual(1);
    expect(text(q[0]).join(" ")).toMatch(/Our Saviour's works, moreover, were always present/);
    expect(getCatalog().works.find((w) => w.id === "fragment-of-the-apology")?.author).toBe("quadratus");
  });

  it("splits Hegesippus's Memoirs into the four extracts from Eusebius", () => {
    const h = chapters("fragments-of-the-commentaries-on-the-acts-of-the-church");
    expect(h).toHaveLength(4);
    expect(h.map((c) => c.heading)).toEqual([
      "The Martyrdom of James",
      "The Relatives of Our Saviour",
      "The Martyrdom of Symeon son of Clopas",
      "Journey to Rome and the Jewish Sects"
    ]);
    expect(text(h[0]).join(" ")).toMatch(/James, the Lord's brother/);
    expectClean("fragments-of-the-commentaries-on-the-acts-of-the-church");
  });

  it("splits Dionysius of Corinth's letter to Rome into four fragments", () => {
    const d = chapters("fragments-of-a-letter-to-the-roman-church");
    expect(d).toHaveLength(4);
    expect(d[0].heading).toBe("Fragment I");
    expect(text(d[0]).join(" ")).toMatch(/this has been your custom from the beginning/);
    expect(getCatalog().works.find((w) => w.id === "fragments-of-a-letter-to-the-roman-church")?.author).toBe(
      "dionysius_corinth"
    );
    expectClean("fragments-of-a-letter-to-the-roman-church");
  });

  it("keeps Aristo of Pella's testimonia to the lost Dialogue of Jason and Papiscus", () => {
    const a = chapters("fragments-of-the-disputation-of-jason-and-papiscus");
    expect(a).toHaveLength(5);
    expect(a[0].heading).toMatch(/From the Disputation of Jason and Papiscus/);
    expect(text(a[0]).join(" ")).toMatch(/execration of God is he that is hanged/);
    expect(getCatalog().works.find((w) => w.id === "fragments-of-the-disputation-of-jason-and-papiscus")?.author).toBe(
      "aristo_pella"
    );
    expectClean("fragments-of-the-disputation-of-jason-and-papiscus");
  });

  it("keeps Minucius Felix's Octavius in forty-one chapters", () => {
    const o = chapters("octavius");
    expect(o).toHaveLength(41);
    expect(o[0].heading).toMatch(/^Chapter I/);
    expect(o[40].heading).toMatch(/^Chapter XLI/);
    expect(text(o[0]).join(" ")).toMatch(/When I consider and mentally review my remembrance of Octavius/);
    expect(getCatalog().works.find((w) => w.id === "octavius")?.author).toBe("minucius_felix");
    expectClean("octavius");
  });
});

describe("Tatian", () => {
  it("has the Diatessaron: the opening notes, fifty-five sections and the subscriptions", () => {
    const d = chapters("diatessaron");
    expect(d).toHaveLength(57);
    expect(d[0].heading).toBe("Introductory Notes");
    expect(d[1].heading).toBe("Section I");
    expect(d[55].heading).toBe("Section LV");
    expect(d[56].heading).toBe("Subscriptions");
    expect(text(d[1])[0]).toMatch(/^\(1\) In the beginning was the Word/);
    expect(text(d[1]).join(" ")).not.toMatch(/The Text of the Diatessaron/);
  });

  it("keeps the Diatessaron's verse numbers and footnotes apart", () => {
    const d = chapters("diatessaron");
    expectClean("diatessaron");
    for (const c of d) expect(text(c).join(" "), c.heading).not.toMatch(/\[Arabic/);
    // Every section's verses run from (1); its footnotes give the Gospel each one comes from.
    for (const c of d.slice(1, 56)) {
      expect(text(c).join(" "), c.heading).toMatch(/\(1(?:, \d+)*\) /);
      expect(c.footnotes?.length ?? 0, c.heading).toBeGreaterThan(20);
    }
    expect(d[1].footnotes?.[0]).toMatchObject({ n: "75", text: "John i. 1.", para: 0 });
    // A footnote on a section's heading is kept, and the section's first paragraph with it.
    expect(text(d[28])[0]).toMatch(/^\(1, 2\) And at that time the feast of tabernacles/);
    expect(d[28].footnotes?.map((f) => f.n)).toContain("1932");
  });

  it("has his twelve fragments as a work, each note with the fragment that cites it", () => {
    const frags = chapters("fragments-of-tatian");
    expect(frags).toHaveLength(12);
    expect(frags[3].footnotes?.map((f) => f.text)).toEqual(["i.e., Justin Martyr."]);
    expectClean("fragments-of-tatian");
  });

  it("ends the Address to the Greeks with its own last chapter", () => {
    const last = chapters("address-to-the-greeks").at(-1)!;
    expect(last.heading).toMatch(/^Chapter XLII/);
    expect(text(last)).toHaveLength(1);
  });
});

describe("Gregory the Great", () => {
  it("has all fourteen books of the Register", () => {
    const books = chapters("selected-epistles");
    expect(books.map((b) => b.heading)).toEqual(
      ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV"].map((n) => "Book " + n)
    );
    expect(text(books[8])[1]).toBe("To Januarius, Bishop of Caralis (Cagliari).");
    // NPNF2 XIII numbers its notes from 1 again: each book keeps its own.
    expect(books[8].footnotes?.[0]).toMatchObject({ n: "1", para: 3 });
    expectClean("selected-epistles");
  });
});

describe("Rufinus", () => {
  it("names the two books against Jerome for what they are, under the same id", () => {
    expect(title("rufinus-apology-in-defence-of-himself")).toBe("Apology Against Jerome");
    expect(chapters("rufinus-apology-in-defence-of-himself").map((c) => c.heading)).toEqual(["Book I", "Book II"]);
  });

  it("has the Apology to Anastasius, with the letter Anastasius wrote about him", () => {
    const a = chapters("apology-to-anastasius");
    expect(a.map((c) => c.heading)).toEqual(["Apology to Anastasius", "The Letter of Anastasius to John, Bishop of Jerusalem"]);
    expect(text(a[0]).join(" ")).toMatch(/It has been brought to my knowledge that certain persons/);
    expectClean("apology-to-anastasius");
  });

  it("has the book on the adulteration of Origen's works, without its title page", () => {
    const b = chapters("on-the-adulteration-of-the-works-of-origen");
    expect(b).toHaveLength(1);
    expect(text(b[0])[0]).toBe("Addressed to Macarius at Pinetum a.d. 397.");
    expectClean("on-the-adulteration-of-the-works-of-origen");
  });

  it("has his twelve prefaces, each under its own heading", () => {
    const p = chapters("prefaces");
    expect(p).toHaveLength(12);
    expect(p[0].heading).toBe("Preface to the Commentary on the Benedictions of the Twelve Patriarchs");
    expect(p[3].heading).toBe("Preface to the Translation of Origen's Peri Archon");
    expect(p[11].heading).toBe("Preface to Origen's Homilies on Numbers");
    expectClean("prefaces");
  });
});

describe("Cyril of Jerusalem", () => {
  it("gives the Procatechesis and each of the eighteen lectures as a unit", () => {
    const c = chapters("catechetical-lectures");
    expect(c).toHaveLength(19);
    expect(c[0].heading).toBe("Procatechesis");
    expect(c[1].heading).toBe("Lecture I — To Those Who Are to Be Enlightened");
    expect(c[3].heading).toBe("Lecture III — On Baptism");
    expect(c[18].heading).toMatch(/^Lecture XVIII — On the Words, And in One Holy Catholic Church/);
    expect(text(c[0])[0]).toMatch(/^1\. Already there is an odour of blessedness upon you/);
    expect(text(c[3]).slice(0, 2)).toEqual(["On Baptism.", "Romans vi. 3, 4"]);
    for (const ch of c) for (const p of text(ch)) expect(p).not.toMatch(/^Lecture [IVX]+\.?$/);
    expectClean("catechetical-lectures");
  });

  it("gives the five lectures on the mysteries as lectures XIX to XXIII", () => {
    const m = chapters("mystagogical-lectures");
    expect(m.map((c) => c.heading.split(" — ")[0])).toEqual(["Lecture XIX", "Lecture XX", "Lecture XXI", "Lecture XXII", "Lecture XXIII"]);
    expectClean("mystagogical-lectures");
  });
});
