import { load } from "cheerio";
import { describe, expect, it } from "vitest";
import { getLibrary } from "../server/corpus";
import {
  AUTHOR_SHELF_MAX,
  SHELF_PERIODS,
  deathCentury,
  inspectTimelineEra,
  packAuthorCatalog,
  packCatalog,
  packShelves,
  periodIdForAuthor,
  renderChurchFathersHtml,
  spineBandPlace,
  spineBin,
  spineScale
} from "../server/shelf";

describe("periodIdForAuthor", () => {
  it("places a death in 155 in the Apostolic era", () => {
    expect(periodIdForAuthor({ id: "polycarp", deathYear: 155 })).toBe("apostolic");
  });

  it("places Irenaeus (202) with the Apologists", () => {
    expect(periodIdForAuthor({ id: "irenaeus", deathYear: 202 })).toBe("apologists");
  });

  it("places a death in 270 in Alexandria and Carthage", () => {
    expect(periodIdForAuthor({ id: "gregory_thaumaturgus", deathYear: 270 })).toBe("alexandria-carthage");
  });

  it("places Lactantius (325) in the Great Persecution", () => {
    expect(periodIdForAuthor({ id: "lactantius", deathYear: 325 })).toBe("great-persecution");
  });

  it("places Eusebius (339) in After Nicaea, not with Augustine", () => {
    expect(periodIdForAuthor({ id: "eusebius", deathYear: 339 })).toBe("after-nicaea");
  });

  it("places Athanasius (373) in After Nicaea", () => {
    expect(periodIdForAuthor({ id: "athanasius", deathYear: 373 })).toBe("after-nicaea");
  });

  it("places Augustine (430) in the Golden Age", () => {
    expect(periodIdForAuthor({ id: "augustine", deathYear: 430 })).toBe("golden-age");
  });

  it("places John of Damascus (749) in After the West", () => {
    expect(periodIdForAuthor({ id: "john_damascus", deathYear: 749 })).toBe("after-the-west");
  });

  it("places Councils in the Councils period regardless of death year", () => {
    expect(periodIdForAuthor({ id: "councils", deathYear: 787 })).toBe("councils");
  });

  it("places Commodianus with Alexandria and Carthage", () => {
    expect(periodIdForAuthor({ id: "commodianus", deathYear: 260 })).toBe("alexandria-carthage");
  });
});

describe("spineBin", () => {
  const counts = [100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600, 51200, 100000];
  const scale = spineScale(counts);

  it("clamps empty and tiny works to bin 1", () => {
    expect(spineBin(0, scale)).toBe(1);
    expect(spineBin(1, scale)).toBe(1);
  });

  it("clamps the largest works to bin 10", () => {
    expect(spineBin(1_000_000, scale)).toBe(10);
  });

  it("is monotone in word count", () => {
    let prev = 1;
    for (const n of [50, 200, 800, 3000, 12000, 40000, 90000]) {
      const bin = spineBin(n, scale);
      expect(bin).toBeGreaterThanOrEqual(prev);
      prev = bin;
    }
  });
});

function author(id: string, deathYear: number) {
  return { id, deathYear };
}

function worksOf(authorId: string, count: number, wordCount = 1000) {
  return Array.from({ length: count }, (_, i) => ({
    id: authorId + "-" + (i + 1),
    author: authorId,
    wordCount
  }));
}

describe("packShelves", () => {
  const scale = spineScale([1000]);
  const opts = { shelfWidthPx: 100, binWidthPx: () => 10, scale };

  it("puts two authors on one shelf when both sets fit", () => {
    const packed = packShelves(
      [...worksOf("a", 3), ...worksOf("b", 6)],
      [author("a", 100), author("b", 110)],
      opts
    );
    expect(packed).toHaveLength(1);
    expect(packed[0].runs.map((r) => r.authorId)).toEqual(["a", "b"]);
    expect(packed[0].runs.every((r) => !r.continued)).toBe(true);
  });

  it("starts the next author on a new shelf rather than splitting them into leftover slots", () => {
    // 4 books = 40px used; next author of 7 books = 70px will not fit in 60 leftover.
    const packed = packShelves(
      [...worksOf("a", 4), ...worksOf("b", 7)],
      [author("a", 100), author("b", 110)],
      opts
    );
    expect(packed).toHaveLength(2);
    expect(packed[0].runs.map((r) => r.authorId)).toEqual(["a"]);
    expect(packed[1].runs.map((r) => r.authorId)).toEqual(["b"]);
    expect(packed[0].runs[0].books).toHaveLength(4);
    expect(packed[1].runs[0].books).toHaveLength(7);
  });

  it("continues an author who overflows a whole shelf", () => {
    const packed = packShelves(worksOf("augustine", 12), [author("augustine", 430)], opts);
    expect(packed.length).toBeGreaterThanOrEqual(2);
    expect(packed[0].runs[0].authorId).toBe("augustine");
    expect(packed[0].runs[0].continued).toBe(false);
    expect(packed[1].runs[0].continued).toBe(true);
    expect(packed.reduce((n, s) => n + s.runs[0].books.length, 0)).toBe(12);
  });

  it("marks the last shelf of a period with the next period name", () => {
    const packed = packShelves(
      [...worksOf("polycarp", 2), ...worksOf("justin", 2)],
      [author("polycarp", 155), author("justin", 165)],
      opts
    );
    const polyShelf = packed.find((s) => s.runs.some((r) => r.authorId === "polycarp"));
    const justinShelf = packed.find((s) => s.runs.some((r) => r.authorId === "justin"));
    expect(polyShelf?.periodId).toBe("apostolic");
    expect(polyShelf?.isPeriodEnd).toBe(true);
    expect(polyShelf?.nextPeriodLabel).toBe("Apologists");
    expect(justinShelf?.periodId).toBe("apologists");
  });

  it("does not put a next-period name on a mid-period leftover", () => {
    const packed = packShelves(
      [...worksOf("a", 4), ...worksOf("b", 7)],
      [author("a", 210), author("b", 220)],
      opts
    );
    expect(packed[0].nextPeriodLabel).toBeUndefined();
    expect(packed[0].isPeriodEnd).toBe(false);
  });
});

describe("deathCentury", () => {
  it("rounds up to the century and clamps the band range", () => {
    expect(deathCentury(96)).toBe(1);
    expect(deathCentury(100)).toBe(1);
    expect(deathCentury(101)).toBe(2);
    expect(deathCentury(430)).toBe(5);
    expect(deathCentury(749)).toBe(8);
    expect(spineBandPlace(1)).toBe("upper");
    expect(spineBandPlace(5)).toBe("upper");
    expect(spineBandPlace(7)).toBe("lower");
  });
});

describe("packAuthorCatalog", () => {
  it("keeps one author per shelf, death-year order, and caps a shelf at AUTHOR_SHELF_MAX", () => {
    const catalog = {
      authors: [author("late", 430), author("early", 110)],
      works: [...worksOf("late", 3, 800), ...worksOf("early", AUTHOR_SHELF_MAX + 3, 800)]
    };
    const packed = packAuthorCatalog(catalog);
    expect(packed.map((a) => a.authorId)).toEqual(["early", "late"]);
    expect(packed[0].shelves.length).toBe(2);
    expect(packed[0].shelves[0]).toHaveLength(AUTHOR_SHELF_MAX);
    expect(packed[0].shelves[1]).toHaveLength(3);
    expect(packed[0].shelves.every((s) => s.every((b) => b.authorId === "early"))).toBe(true);
    expect(packed[1].shelves).toHaveLength(1);
    expect(packed[1].shelves[0]).toHaveLength(3);
  });
});

describe("inspectTimelineEra", () => {
  it("uses the timeline era that lists the work, nearest to the author's death", () => {
    const era = inspectTimelineEra("city-of-god", "golden-age", 430);
    expect(era.id).toBe("sack-of-rome");
    expect(era.body).toMatch(/City of God/);
  });

  it("falls back to the period's home timeline era when the work is not linked", () => {
    const era = inspectTimelineEra("on-prayer", "alexandria-carthage", 240);
    expect(era.id).toBe("alexandria");
  });
});

describe("catalog shelf fields", () => {
  it("gives every author a deathYear and every work a wordCount", () => {
    const lib = getLibrary();
    expect(lib.catalog.authors.length).toBeGreaterThan(10);
    for (const a of lib.catalog.authors) {
      expect(a.deathYear, a.id).toEqual(expect.any(Number));
      expect(a.bio, a.id).toEqual(expect.any(String));
    }
    for (const w of lib.catalog.works) {
      expect(w.wordCount, w.id).toBeGreaterThan(0);
    }
    const city = lib.catalog.works.find((w) => w.id === "city-of-god");
    const papias = lib.catalog.works.find((w) => w.id === "fragments-of-papias");
    expect(city).toBeTruthy();
    expect(papias).toBeTruthy();
    expect(city!.wordCount).toBeGreaterThan(papias!.wordCount);
    const commodianus = lib.catalog.authors.find((a) => a.id === "commodianus");
    expect(commodianus).toBeTruthy();
    expect(periodIdForAuthor(commodianus!)).toBe("alexandria-carthage");
    const councils = lib.catalog.authors.find((a) => a.id === "councils");
    expect(councils).toBeTruthy();
    expect(periodIdForAuthor(councils!)).toBe("councils");
  }, 120_000);

  it("packs every live work once and keeps Athanasius off Augustine's period", () => {
    const lib = getLibrary();
    const packed = packCatalog(lib.catalog, 1100);
    const seen = new Set<string>();
    const byPeriod = new Map<string, { authors: string[]; works: number; shelves: number }>();
    for (const period of SHELF_PERIODS) {
      byPeriod.set(period.id, { authors: [], works: 0, shelves: 0 });
    }
    for (const shelf of packed) {
      const row = byPeriod.get(shelf.periodId)!;
      row.shelves += 1;
      for (const run of shelf.runs) {
        if (!run.continued && !row.authors.includes(run.authorId)) row.authors.push(run.authorId);
        for (const book of run.books) {
          expect(seen.has(book.workId), "duplicate " + book.workId).toBe(false);
          seen.add(book.workId);
          row.works += 1;
        }
      }
    }
    expect(seen.size).toBe(lib.catalog.works.length);
    let lastPeriod = -1;
    for (const shelf of packed) {
      const idx = SHELF_PERIODS.findIndex((p) => p.id === shelf.periodId);
      expect(idx).toBeGreaterThanOrEqual(lastPeriod);
      lastPeriod = idx;
    }

    const athanasius = lib.catalog.authors.find((a) => a.id === "athanasius")!;
    const augustine = lib.catalog.authors.find((a) => a.id === "augustine")!;
    expect(periodIdForAuthor(athanasius)).toBe("after-nicaea");
    expect(periodIdForAuthor(augustine)).toBe("golden-age");

    const city = packed.flatMap((s) => s.runs.flatMap((r) => r.books)).find((b) => b.workId === "city-of-god");
    expect(city).toBeTruthy();
    expect(city!.bin).toBeGreaterThanOrEqual(8);

    const augustineShelves = packed.filter((s) => s.runs.some((r) => r.authorId === "augustine"));
    expect(augustineShelves.length).toBeGreaterThan(1);
    expect(augustineShelves.slice(1).every((s) => s.runs[0].continued)).toBe(true);

    for (const period of SHELF_PERIODS) {
      expect(byPeriod.get(period.id)!.works, period.id + " empty").toBeGreaterThan(0);
    }

    const html = renderChurchFathersHtml(lib.catalog);
    expect(html).toContain("Apostolic era");
    expect(html).toContain("The Golden Age");
    const $ = load(html);
    for (const w of lib.catalog.works) {
      expect(html).toContain("/fathers/" + w.author + "/" + w.id + ".html");
      const link = $('a[href="/fathers/' + w.author + '/' + w.id + '.html"]');
      expect(link).toHaveLength(1);
      expect(link.text()).toBe(w.title);
    }
  }, 120_000);
});

