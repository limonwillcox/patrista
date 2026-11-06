import { describe, expect, it } from "vitest";
import {
  discoverEnglishWorkSpecs,
  extractSchaffNotes,
  parseEnglishWork,
  stripEditorialSections,
  type EnglishWorkSpec
} from "../server/englishWorks";
import { join } from "path";

const ROOT = join(import.meta.dirname, "..");

describe("stripEditorialSections", () => {
  it("drops Introductory Notice until the next chapter heading", () => {
    const raw = [
      "THE TEACHING.",
      "",
      "  Introductory Notice",
      "",
      "   Schaff says many things about Bryennios.",
      "     __________________________________________________________________",
      "",
      "  Chapter I.--The Two Ways.",
      "",
      "   There are two ways, one of life and one of death."
    ].join("\n");
    const out = stripEditorialSections(raw);
    expect(out).not.toMatch(/Introductory Notice/i);
    expect(out).not.toMatch(/Bryennios/);
    expect(out).not.toMatch(/_{5,}/);
    expect(out).toMatch(/Chapter I/);
    expect(out).toMatch(/two ways/i);
  });

  it("drops Elucidations at the end of a block", () => {
    const raw = [
      "   Father text remains.",
      "",
      "  Elucidations.",
      "",
      "   [1] Editor talks about the treatise."
    ].join("\n");
    const out = stripEditorialSections(raw);
    expect(out).toMatch(/Father text remains/);
    expect(out).not.toMatch(/Elucidations/i);
    expect(out).not.toMatch(/Editor talks/);
  });

  it("does not resume Elucidations at the next Book of a glued-on work", () => {
    const raw = [
      "   Then shall the world see the Lord coming upon the clouds of heaven.",
      "",
      "  Elucidations.",
      "",
      "   (Thus baptize ye.)",
      "",
      "  Book I.",
      "",
      "   Concerning the Laity."
    ].join("\n");
    const out = stripEditorialSections(raw);
    expect(out).toMatch(/clouds of heaven/);
    expect(out).not.toMatch(/Elucidations/i);
    expect(out).not.toMatch(/Concerning the Laity/);
    expect(out).not.toMatch(/Book I/);
  });
});

describe("extractSchaffNotes", () => {
  it("moves matched footnote bodies into footnotes and strips markers", () => {
    const paras = [
      'Reason directs those who are truly pious to honour only what is true, declining traditional opinions, [1768] if these be worthless.',
      '[1768] Literally, "the opinions of the ancients."',
      "Next father paragraph with no note."
    ];
    const { paras: cleaned, footnotes } = extractSchaffNotes(paras);
    expect(cleaned).toHaveLength(2);
    expect(cleaned[0]).not.toMatch(/\[1768\]/);
    expect(cleaned[0]).toMatch(/traditional opinions,/);
    expect(cleaned[1]).toBe("Next father paragraph with no note.");
    expect(footnotes).toEqual([
      { n: "1768", text: 'Literally, "the opinions of the ancients."', para: 0 }
    ]);
  });

  it("discards orphan footnote bodies and strips unmatched markers", () => {
    const paras = [
      "A line with a ghost marker [9999] in it.",
      "[8888] Orphan body with no marker in the unit."
    ];
    const { paras: cleaned, footnotes } = extractSchaffNotes(paras);
    expect(footnotes).toEqual([]);
    expect(cleaned).toEqual(["A line with a ghost marker in it."]);
  });

  it("does not treat chapter-title remnants as footnote bodies", () => {
    const paras = [
      "[2389] --The Second Commandment: Gross Sin Forbidden.",
      "Thou shalt not commit murder."
    ];
    const { paras: cleaned, footnotes } = extractSchaffNotes(paras);
    expect(footnotes).toEqual([]);
    expect(cleaned[0]).toMatch(/Second Commandment/);
  });
});

describe("parseEnglishWork cleanup integration", () => {
  it("extracts Justin First Apology footnotes and drops decorative rules", () => {
    const spec: EnglishWorkSpec = {
      id: "first-apology",
      author: "justin",
      title: "The First Apology",
      short: "1 Apol.",
      series: "ANF",
      path: "Fathers/English/Justin_English/The First Apology.txt",
      chunk: "chapter"
    };
    const { passages } = parseEnglishWork(spec, ROOT);
    expect(passages.length).toBeGreaterThan(5);
    const joined = passages.flatMap((p) => p.versions.schaff || []).join("\n");
    expect(joined).not.toMatch(/_{5,}/);
    expect(joined).not.toMatch(/^\s*\[\d+\]\s+Literally/m);

    const withNotes = passages.find((p) => (p.footnotes || []).some((f) => f.n === "1768"));
    expect(withNotes).toBeTruthy();
    const note = withNotes!.footnotes.find((f) => f.n === "1768")!;
    expect(note.text).toMatch(/opinions of the ancients/i);
    const para = (withNotes!.versions.schaff || [])[note.para] || "";
    expect(para).not.toMatch(/\[1768\]/);
    expect(para).toMatch(/traditional opinions/i);
  }, 60_000);

  it("does not open Didache on Schaff Introductory Notice", () => {
    const spec: EnglishWorkSpec = {
      id: "didache",
      author: "didache",
      title: "Didache",
      short: "Didache",
      series: "ANF",
      path: "Fathers/English/Didache_English/Teaching of the Twelve Apostles.txt",
      chunk: "chapter",
      expectUnits: 16,
      endAt: /^\s*Elucidations\.?\s*$/im
    };
    const { passages } = parseEnglishWork(spec, ROOT);
    expect(passages.length).toBeGreaterThan(3);
    const opening = passages
      .slice(0, 3)
      .flatMap((p) => p.versions.schaff || [])
      .join(" ");
    expect(opening).not.toMatch(/Bryennios/i);
    expect(opening).not.toMatch(/Introductory Notice/i);
    expect(opening).toMatch(/two ways|way of life|first commandment/i);
  }, 60_000);

  it("Word-Check: Hermas drops Coxe intro and opens on the Visions", () => {
    const spec = discoverEnglishWorkSpecs(ROOT).find((s) => s.id === "pastor-of-hermas");
    const { passages } = parseEnglishWork(spec!, ROOT);
    expect(passages).toHaveLength(3);
    const opening = (passages[0]!.versions.schaff || []).join(" ");
    expect(opening).not.toMatch(/Muratorian Canon/i);
    expect(opening).not.toMatch(/Introductory Note/i);
    expect(opening).toMatch(/Rhode|Tiber|Hermas/i);
  }, 60_000);

  it("Word-Check: Martyrdom of Justin is 5 chapters and does not swallow Irenaeus", () => {
    const spec = discoverEnglishWorkSpecs(ROOT).find((s) => s.id === "martyrdom-of-justin");
    const { passages } = parseEnglishWork(spec!, ROOT);
    expect(passages).toHaveLength(5);
    const body = passages.flatMap((p) => p.versions.schaff || []).join("\n");
    expect(body).not.toMatch(/Against Heresies/i);
    expect(body).toMatch(/Rusticus/i);
  }, 60_000);

  it("Word-Check: Clementine Homilies open on Homily I, not the editor's edition history", () => {
    const spec = discoverEnglishWorkSpecs(ROOT).find((s) => s.id === "clementine-homilies");
    const { passages } = parseEnglishWork(spec!, ROOT);
    expect(passages.length).toBeGreaterThan(10);
    const opening = (passages[0]!.versions.schaff || []).join(" ");
    expect(opening).not.toMatch(/Cotelerius/i);
    expect(opening).toMatch(/Clement/i);
  }, 60_000);

  it("Word-Check: Justin First Apology does not trail into the Second via CCEL slug", () => {
    const spec = discoverEnglishWorkSpecs(ROOT).find((s) => s.id === "first-apology");
    const { passages } = parseEnglishWork(spec!, ROOT);
    const body = passages.flatMap((p) => p.versions.schaff || []).join("\n");
    expect(body).not.toMatch(/ccel\.org/i);
    expect(body).not.toMatch(/second_apology/i);
    expect(body).toMatch(/Antoninus|Marcus Aurelius|Christians/i);
  }, 60_000);

  it("Word-Check: Apostolic extracts do not swallow the next Father's intro", () => {
    const cases = [
      ["epistle-of-barnabas", /Papias|Fragments of Papias/i, /Amen|children of love/i],
      ["first-epistle-of-clement", /Mathetes|Diognetus/i, /Clement|grace/i],
      ["epistle-to-diognetus", /Polycarp/i, /Amen|Diognetus/i]
    ] as const;
    for (const [id, extra, keep] of cases) {
      const spec = discoverEnglishWorkSpecs(ROOT).find((s) => s.id === id);
      expect(spec, id).toBeTruthy();
      const { passages } = parseEnglishWork(spec!, ROOT);
      const body = passages.flatMap((p) => p.versions.schaff || []).join("\n");
      expect(body, id + " extra").not.toMatch(extra);
      expect(body, id + " keep").toMatch(keep);
    }
  }, 60_000);

  it("Word-Check: Didache is 16 chapters and does not swallow Constitutions", () => {
    const spec = discoverEnglishWorkSpecs(ROOT).find((s) => s.id === "didache");
    expect(spec).toBeTruthy();
    const { passages } = parseEnglishWork(spec!, ROOT);
    expect(passages).toHaveLength(16);
    const body = passages.flatMap((p) => p.versions.schaff || []).join("\n");
    expect(body).not.toMatch(/Concerning the Laity/i);
    expect(body).not.toMatch(/Constitutions of the Holy Apostles/i);
    expect(body).not.toMatch(/Philip Schaff/i);
    const last = (passages[15]!.versions.schaff || []).join(" ");
    expect(last).toMatch(/clouds of heaven/i);
    expect(last).toMatch(/Watch for your life/i);
  }, 60_000);
});

describe("discoverEnglishWorkSpecs cache", () => {
  it("returns the same array instance for the same root", () => {
    const a = discoverEnglishWorkSpecs(ROOT);
    const b = discoverEnglishWorkSpecs(ROOT);
    expect(a).toBe(b);
    expect(a.length).toBeGreaterThan(0);
  }, 60_000);
});


describe("Nov 2026 library audit", () => {
  const parse = (id: string) => {
    const spec = discoverEnglishWorkSpecs(ROOT).find((s) => s.id === id);
    expect(spec, id).toBeTruthy();
    return parseEnglishWork(spec!, ROOT);
  };
  const text = (p: { versions: Record<string, string[]> }) => (Object.values(p.versions)[0] || []).join(" ");

  it("parses NPNF's double numbering 'Chapter 1 [I.]--' and keeps the opening chapters", () => {
    for (const id of ["on-grace-and-free-will", "on-rebuke-and-grace", "on-the-spirit-and-the-letter", "on-the-predestination-of-the-saints"]) {
      expect(parse(id).passages[0]!.heading, id).toMatch(/^Chapter 1 — /);
    }
  }, 60_000);

  it("shows each wrongly filled work's own text", () => {
    expect(text(parse("instructions-of-commodianus").passages[0]!)).toMatch(/My preface sets forth the way/);
    expect(parse("instructions-of-commodianus").passages.map(text).join(" ")).not.toMatch(/De Principiis|Origen/);
    const fuga = parse("de-fuga-in-persecutione");
    expect(fuga.work.title).toBe("On Flight in Persecution");
    expect(fuga.passages).toHaveLength(14);
    expect(text(fuga.passages[0]!)).toMatch(/^My brother Fabius/);
    const martyrs = parse("ad-martyras").passages;
    expect(martyrs).toHaveLength(6);
    expect(martyrs.map(text).join(" ")).not.toMatch(/Perpetua/);
    expect(parse("passion-of-the-holy-martyrs-perpetua-and-felicitas").passages.map(text).join(" ")).toMatch(/Vivia Perpetua/);
    expect(parse("commentary-on-john").passages.map((p) => p.heading)).not.toContain("Book XII");
    expect(parse("commentary-on-matthew").passages.map((p) => p.heading)).toContain("Book XII");
    const peter = parse("gospel-of-peter").passages;
    expect(peter).toHaveLength(14);
    expect(peter.map(text).join(" ")).not.toMatch(/Then answered all the people/);
    const inst = parse("divine-institutes").passages.map((p) => p.heading);
    for (const b of ["I", "II", "III", "IV", "V", "VI", "VII"]) expect(inst.some((h) => h.startsWith("Book " + b + " · ")), b).toBe(true);
    expect(parse("oration-of-eusebius").work.title).toBe("Oration in Praise of Constantine");
    expect(parse("life-of-constantine").passages).toHaveLength(4);
    expect(parse("extant-fragments-of-dionysius").passages.map(text).join(" ")).not.toMatch(/Manes|Manichæ/);
  }, 120_000);

  it("fixes units: Stromata I–VIII, Hilary's twelve books, the Great Catechism's forty chapters", () => {
    expect(parse("stromata").passages.map((p) => p.heading)).toEqual(["I", "II", "III", "IV", "V", "VI", "VII", "VIII"].map((n) => "Book " + n));
    expect(parse("on-the-trinity").passages).toHaveLength(12);
    const cat = parse("great-catechism").passages;
    expect(cat[0]!.heading).toBe("Prologue");
    expect(cat).toHaveLength(41);
  }, 60_000);

  it("keeps only the shorter Ignatian recension, chapter numbers unchanged", () => {
    const ign = parse("epistles-of-ignatius").passages;
    expect(ign).toHaveLength(92);
    expect(ign[0]!.heading).toBe("Ephesians · Chapter I — Praise of the Ephesians.");
    expect(ign[0]!.versions.schaff).toHaveLength(1);
    expect(text(ign[0]!)).toMatch(/your name, much-beloved in God/);
    expect(text(ign[0]!)).not.toMatch(/greatly-desired name/);
    expect(ign[20]!.heading).toMatch(/longer recension only/);
  }, 60_000);

  it("names the work in Chrysostom's multi-series volumes", () => {
    const h = parse("homilies-on-acts-and-romans").passages.map((p) => p.heading);
    expect(h[0]).toBe("Homilies on Acts · Homily I");
    expect(h[55]).toBe("Homilies on Romans · Homily I");
  }, 60_000);

  it("drops CCEL navigation and volume indexes", () => {
    for (const id of ["against-celsus", "homilies-on-matthew", "shows", "plea-for-the-christians"]) {
      const body = parse(id).passages.map(text).join(" ");
      expect(body, id).not.toMatch(/file:\/\/\/ccel|\/ccel\/schaff\//);
    }
  }, 60_000);

  it("takes the translator and edition from the source", () => {
    const w = parse("ad-martyras").work;
    expect(w.translator).toBe("S. Thelwall");
    expect(w.edition).toBe("Ante-Nicene Fathers, vol. III");
    expect(parse("on-lying").work.translator).toBe("H. Browne");
  }, 60_000);

  it("labels NPNF's one-line abridgements", () => {
    const basil = parse("basil-letters").passages;
    expect(basil.find((p) => p.heading.startsWith("Letter CCXCVII"))!.heading).toMatch(/summary only in this edition/);
    expect(basil[0]!.heading).toBe("Letter I");
  }, 60_000);
});
