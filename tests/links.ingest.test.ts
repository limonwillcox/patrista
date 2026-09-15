// @ts-nocheck
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import {
  decodeLoc,
  isCopyrightedSource,
  loadAuthorMap,
  mapAuthor,
  mapAuthorExact,
  mapBook,
  mapWork,
  refsFromLocs,
  slugWorkTitle
} from "../scripts/links/map.mjs";
import { hcfRowToLink } from "../scripts/links/ingest-hcf.mjs";
import { parseEcatenaHtml } from "../scripts/links/ingest-ecana.mjs";
import { reportLinks } from "../scripts/links/report.mjs";
import type { Link } from "../src/links/types";

const ROOT = join(import.meta.dirname, "..");

const CATALOG_WORKS = [
  { id: "commentary-on-john", author: "origen", title: "Commentary on John" },
  { id: "against-celsus", author: "origen", title: "Against Celsus" },
  { id: "instructor", author: "clement_alexandria", title: "The Instructor" },
  { id: "prescription-against-heretics", author: "tertullian", title: "The Prescription Against Heretics" },
  { id: "treatises-of-cyprian", author: "cyprian", title: "The Treatises of Cyprian" },
  { id: "homilies-on-matthew", author: "chrysostom", title: "Homilies on Matthew" }
];

describe("author map", () => {
  const map = loadAuthorMap(ROOT);

  it("maps HCF long names and short e-Catena names to catalog ids", () => {
    expect(mapAuthor(map, "Origen of Alexandria")?.id).toBe("origen");
    expect(mapAuthor(map, "Origen")?.id).toBe("origen");
    expect(mapAuthor(map, "John Chrysostom")?.id).toBe("chrysostom");
    expect(mapAuthor(map, "Gregory the Dialogist")?.id).toBe("gregory");
    expect(mapAuthor(map, "Gregory of Neocaesarea")?.id).toBe("gregory_thaumaturgus");
    expect(mapAuthor(map, "Tertullian")?.id).toBe("tertullian");
    expect(mapAuthor(map, "Clement of Alexandria")?.id).toBe("clement_alexandria");
  });

  it("leaves unmapped / modern names as orphans", () => {
    expect(mapAuthor(map, "CS Lewis")).toBeNull();
    expect(mapAuthor(map, "Thomas Aquinas")).toBeNull();
    expect(mapAuthor(map, "John Calvin")).toBeNull();
    expect(mapAuthor(map, "Basil of Seleucia")).toBeNull();
    expect(mapAuthor(map, "Gregory Palamas")).toBeNull();
    expect(mapAuthorExact(map, "Basil of Seleucia")).toBeNull();
    expect(mapAuthorExact(map, "Origen of Alexandria")?.id).toBe("origen");
  });

  it("splits an e-Catena 'Father Work Title' pointer on the longest mapped name", () => {
    const hit = mapAuthor(map, "Tertullian The Prescription Against Heretics");
    expect(hit?.id).toBe("tertullian");
    expect(hit?.rest).toBe("The Prescription Against Heretics");
  });
});

describe("book and loc mapping", () => {
  it("maps HCF book slugs and KJV names onto our bookIds", () => {
    expect(mapBook(ROOT, "matthew")?.bookId).toBe("mt");
    expect(mapBook(ROOT, "john")?.bookId).toBe("jo");
    expect(mapBook(ROOT, "romans")?.bookId).toBe("rm");
    expect(mapBook(ROOT, "Song of Solomon")?.bookId).toBe("so");
    expect(mapBook(ROOT, "1corinthians")?.bookId).toBe("1co");
  });

  it("skips deuterocanon books that are not in the KJV 66", () => {
    expect(mapBook(ROOT, "wisdom")).toBeUndefined();
    expect(mapBook(ROOT, "sirach")).toBeUndefined();
  });

  it("decodes HCF loc (chapter * 1_000_000 + verse) and splits cross-chapter spans", () => {
    expect(decodeLoc(16_000_018)).toEqual({ chapter: 16, verse: 18 });
    const mt = mapBook(ROOT, "matthew")!;
    const same = refsFromLocs(mt, 16_000_016, 16_000_018);
    expect(same).toHaveLength(1);
    expect(same[0]).toMatchObject({
      bookId: "mt",
      chapter: 16,
      verseStart: 16,
      verseEnd: 18,
      locStart: 16_000_016,
      locEnd: 16_000_018
    });
    const split = refsFromLocs(mt, 19_000_010, 20_000_003);
    expect(split.map((r) => r.chapter)).toEqual([19, 20]);
    expect(split[0]!.verseStart).toBe(10);
    expect(split[1]!.verseStart).toBe(1);
    expect(split[1]!.verseEnd).toBe(3);
  });
});

describe("work title mapping", () => {
  it("stores a catalog workId when the title maps, otherwise a slug — never a paragraph index", () => {
    expect(mapWork(CATALOG_WORKS, "origen", "Commentary on John Book VI")).toBe("commentary-on-john");
    expect(mapWork(CATALOG_WORKS, "origen", "Against Celsus")).toBe("against-celsus");
    expect(mapWork(CATALOG_WORKS, "clement_alexandria", "The Instructor Book II")).toBe(
      "instructor"
    );
    expect(mapWork(CATALOG_WORKS, "origen", "Catena Aurea by Aquinas")).toBe(
      slugWorkTitle("Catena Aurea by Aquinas")
    );
    expect(mapWork(CATALOG_WORKS, "origen", "Catena Aurea by Aquinas")).not.toMatch(/p\.\d+|para/);
  });
});

describe("copyright filter", () => {
  it("rejects ACCS / IVP / CatenaBible / neuu-org and keeps ANF/NPNF/CCEL/HCF/Catena Aurea", () => {
    expect(isCopyrightedSource("https://ivpress.com/accs", "Ancient Christian Commentary")).toBe(
      true
    );
    expect(isCopyrightedSource("https://catenabible.com/mt/16", "Catena Bible")).toBe(true);
    expect(
      isCopyrightedSource("https://github.com/neuu-org/bible-commentaries-dataset", "dataset")
    ).toBe(true);
    expect(
      isCopyrightedSource(
        "https://historicalchristian.faith/by_father.php?file=Origen",
        "Catena Aurea by Aquinas"
      )
    ).toBe(false);
    expect(isCopyrightedSource("https://www.ccel.org/ccel/schaff/anf09.html", "ANF9")).toBe(false);
  });
});

describe("HCF row → Link", () => {
  const map = loadAuthorMap(ROOT);

  it("emits a verse-keyed verified hcf link with sectionId null", () => {
    const link = hcfRowToLink(
      {
        id: "abc-uuid",
        father_name: "Origen of Alexandria",
        file_name: "Matthew 16_18.toml",
        append_to_author_name: "",
        ts: 253,
        book: "matthew",
        location_start: 16_000_018,
        location_end: 16_000_018,
        txt: "And if we too have said like Peter, Thou art the Christ.",
        source_url: "https://www.ccel.org/ccel/schaff/anf09.html",
        source_title: "Commentary on Matthew"
      },
      { root: ROOT, authorMap: map, catalogWorks: CATALOG_WORKS }
    );
    expect(link).toBeTruthy();
    expect(link!.sectionId).toBeNull();
    expect(link!.fatherId).toBe("origen");
    expect(link!.provenance).toBe("hcf");
    expect(link!.status).toBe("verified");
    expect(link!.confidence).toBe(1);
    expect(link!.century).toBe(3);
    expect(link!.deathYear).toBe(254);
    expect(link!.refs[0]).toMatchObject({ bookId: "mt", chapter: 16, verseStart: 18, verseEnd: 18 });
    expect(link!.workTitle).toBe("Commentary on Matthew");
  });

  it("drops unmapped fathers and copyrighted sources", () => {
    const opts = { root: ROOT, authorMap: map, catalogWorks: CATALOG_WORKS };
    expect(
      hcfRowToLink(
        {
          id: "1",
          father_name: "CS Lewis",
          file_name: "Matthew 1_1.toml",
          append_to_author_name: "",
          ts: 1963,
          book: "matthew",
          location_start: 1_000_001,
          location_end: 1_000_001,
          txt: "modern",
          source_url: "",
          source_title: "Mere Christianity"
        },
        opts
      )
    ).toBeNull();
    expect(
      hcfRowToLink(
        {
          id: "2",
          father_name: "Augustine of Hippo",
          file_name: "Matthew 1_1.toml",
          append_to_author_name: "",
          ts: 430,
          book: "matthew",
          location_start: 1_000_001,
          location_end: 1_000_001,
          txt: "excerpt from ACCS",
          source_url: "https://www.ivpress.com/accs",
          source_title: "Ancient Christian Commentary on Scripture"
        },
        opts
      )
    ).toBeNull();
  });
});

describe("e-Catena HTML parse", () => {
  const map = loadAuthorMap(ROOT);
  const html = `<html><body>
<P><FONT SIZE=+1>Matt. 16:18 - <A HREF=http://bible.gospelcom.net/x>NIV</A>, <A HREF=http://nab.example/x>NAB</A> - in <A HREF=http://ccel.org/fathers2/ANF-03/anf03-24.htm#P3413>Tertullian The Prescription Against Heretics</A></FONT></P>
<BLOCKQUOTE>Peter, who is called "the rock on which the church should be built,"[225]</BLOCKQUOTE>
<P><FONT SIZE=+1>Matt. 16:18 - <A HREF=http://bible.gospelcom.net/x>NIV</A>, <A HREF=http://nab.example/x>NAB</A> - in <A HREF=http://ccel.org/fathers2/ANF-10/anf10-48.htm>Origen Commentary on Matthew Book XII</A></FONT></P>
<BLOCKQUOTE>And if we too have said like Peter, "Thou art the Christ, the Son of the living God."</BLOCKQUOTE>
</body></html>`;

  it("parses verse + work-title pointers as verified allusions at confidence 0.7", () => {
    const links = parseEcatenaHtml(html, {
      root: ROOT,
      authorMap: map,
      catalogWorks: CATALOG_WORKS,
      sourcePage: "https://www.earlychristianwritings.com/e-catena/matthew16.html"
    });
    expect(links.length).toBe(2);
    expect(links.every((l) => l.provenance === "ecatena")).toBe(true);
    expect(links.every((l) => l.confidence === 0.7)).toBe(true);
    expect(links.every((l) => l.status === "verified")).toBe(true);
    expect(links.every((l) => l.sectionId === null)).toBe(true);
    expect(links.map((l) => l.fatherId).sort()).toEqual(["origen", "tertullian"]);
    const tert = links.find((l) => l.fatherId === "tertullian")!;
    expect(tert.workTitle).toMatch(/Prescription Against Heretics/i);
    expect(tert.workId).toBe("prescription-against-heretics");
    expect(tert.refs[0]).toMatchObject({ bookId: "mt", chapter: 16, verseStart: 18 });
    expect(tert.excerpt).toMatch(/rock/i);
    expect(tert.sourceUrl).toContain("ccel.org");
  });
});

describe("report", () => {
  it("counts by book, lists orphan fathers, and flags empty vs dense verses", () => {
    const links: Link[] = [
      {
        id: "a",
        sectionId: null,
        workId: "commentary-on-john",
        fatherId: "origen",
        workTitle: "Commentary on John",
        excerpt: "In the beginning was the Word.",
        sourceUrl: "https://www.ccel.org/",
        sourceWork: "ANF",
        deathYear: 254,
        century: 3,
        provenance: "hcf",
        confidence: 1,
        status: "verified",
        refs: [
          {
            bookId: "jo",
            bookNum: 43,
            canon: "nt",
            chapter: 1,
            verseStart: 1,
            verseEnd: 1,
            locStart: 1_000_001,
            locEnd: 1_000_001
          }
        ]
      }
    ];
    const out = reportLinks(links, {
      root: ROOT,
      orphanNames: ["Thomas Aquinas", "CS Lewis", "Thomas Aquinas"],
      remainingBooks: ["psalms", "acts", "genesis"]
    });
    expect(out.byBook.find((b) => b.bookId === "jo")?.links).toBe(1);
    expect(out.orphans[0]).toEqual({ name: "Thomas Aquinas", count: 2 });
    expect(out.emptyVsDense.find((b) => b.bookId === "jo")).toMatchObject({
      bookId: "jo",
      linkedVerses: 1
    });
    expect(out.remainingBooks).toEqual(["psalms", "acts", "genesis"]);
  });
});

describe("map-authors coverage", () => {
  it("covers the top catalog Fathers (~40 names)", () => {
    const raw = JSON.parse(readFileSync(join(ROOT, "scripts/links/map-authors.json"), "utf8"));
    const ids = new Set(raw.authors.map((a: { id: string }) => a.id));
    for (const id of [
      "origen",
      "augustine",
      "chrysostom",
      "tertullian",
      "irenaeus",
      "cyprian",
      "jerome",
      "ambrose",
      "basil",
      "athanasius",
      "clement_alexandria",
      "justin",
      "leo",
      "gregory",
      "hilary"
    ]) {
      expect(ids.has(id), id).toBe(true);
    }
    expect(ids.size).toBeGreaterThanOrEqual(40);
  });
});
