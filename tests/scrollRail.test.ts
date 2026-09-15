import { beforeEach, describe, expect, it } from "vitest";
import {
  setStoredRailAutoCollapse,
  setStoredRailAutoFocus,
  setStoredScrollDark,
  storedRailAutoCollapse,
  storedRailAutoFocus,
  storedScrollDark
} from "../src/lib/prefs";
import { loadLinkStore } from "../src/links/store";

describe("Scroll rail preferences", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    globalThis.localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, String(v));
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
      clear: () => {
        store.clear();
      },
      length: 0,
      key: () => null
    } as unknown as Storage;
  });

  it("defaults autoFocus to true", () => {
    expect(storedRailAutoFocus()).toBe(true);
  });

  it("persists autoFocus preference changes", () => {
    setStoredRailAutoFocus(false);
    expect(storedRailAutoFocus()).toBe(false);
    setStoredRailAutoFocus(true);
    expect(storedRailAutoFocus()).toBe(true);
  });

  it("defaults autoCollapse to true", () => {
    expect(storedRailAutoCollapse()).toBe(true);
  });

  it("persists autoCollapse preference changes", () => {
    setStoredRailAutoCollapse(false);
    expect(storedRailAutoCollapse()).toBe(false);
    setStoredRailAutoCollapse(true);
    expect(storedRailAutoCollapse()).toBe(true);
  });

  it("defaults scrollDark to false and persists changes", () => {
    expect(storedScrollDark()).toBe(false);
    setStoredScrollDark(true);
    expect(storedScrollDark()).toBe(true);
    setStoredScrollDark(false);
    expect(storedScrollDark()).toBe(false);
  });
});

describe("Scroll rail active section auto-focus algorithm", () => {
  type SectionCandidate = {
    id: string;
    intersectionRatio: number;
    top: number;
  };

  function chooseActiveSection(
    candidates: SectionCandidate[],
    viewportHeight = 1000
  ): string | null {
    if (!candidates.length) return null;
    const targetY = viewportHeight * 0.3; // 30% from top

    let best: SectionCandidate | null = null;
    let minDistanceTo30 = Infinity;

    for (const c of candidates) {
      const dist = Math.abs(c.top - targetY);
      if (!best || c.intersectionRatio > best.intersectionRatio) {
        best = c;
        minDistanceTo30 = dist;
      } else if (
        Math.abs(c.intersectionRatio - best.intersectionRatio) < 0.05 &&
        dist < minDistanceTo30
      ) {
        best = c;
        minDistanceTo30 = dist;
      }
    }

    return best?.id ?? null;
  }

  it("selects the candidate with the highest intersection ratio", () => {
    const candidates = [
      { id: "confessions:1:p0", intersectionRatio: 0.2, top: 100 },
      { id: "confessions:1:p1", intersectionRatio: 0.85, top: 400 },
      { id: "confessions:1:p2", intersectionRatio: 0.3, top: 700 }
    ];
    expect(chooseActiveSection(candidates)).toBe("confessions:1:p1");
  });

  it("breaks ties by picking the candidate closest to 30% from top", () => {
    // 30% of 1000 = 300
    const candidates = [
      { id: "confessions:8:p10", intersectionRatio: 0.8, top: 100 }, // |100 - 300| = 200
      { id: "confessions:8:p11", intersectionRatio: 0.8, top: 320 }, // |320 - 300| = 20
      { id: "confessions:8:p12", intersectionRatio: 0.8, top: 600 }  // |600 - 300| = 300
    ];
    expect(chooseActiveSection(candidates, 1000)).toBe("confessions:8:p11");
  });
});

describe("Scroll rail tree unrolling data structures", () => {
  const store = loadLinkStore();

  it("provides 6 centuries for Matthew 16:18 with empty centuries identifiable", () => {
    const tree = store.getTreeForVerse("mt", 16, 18);
    const presentCenturies = new Set(tree.map((c) => c.century));

    // Matthew 16:18 has centuries 3, 4, 5, 6
    expect(presentCenturies.has(3)).toBe(true);
    expect(presentCenturies.has(4)).toBe(true);
    expect(presentCenturies.has(5)).toBe(true);
    expect(presentCenturies.has(6)).toBe(true);

    // Centuries 1 and 2 are empty for Mt 16:18 (should be muted in UI)
    const roman = [1, 2, 3, 4, 5, 6];
    const states = roman.map((num) => ({
      num,
      hasCommentary: presentCenturies.has(num)
    }));

    expect(states[0].hasCommentary).toBe(false); // Century I muted
    expect(states[1].hasCommentary).toBe(false); // Century II muted
    expect(states[2].hasCommentary).toBe(true);  // Century III active
  });

  it("unrolls century -> father -> work -> excerpts", () => {
    const tree = store.getTreeForVerse("mt", 16, 18);
    const c3 = tree.find((c) => c.century === 3);
    expect(c3).toBeDefined();

    // Fathers in Century 3
    const fatherIds = c3!.fathers.map((f) => f.fatherId);
    expect(fatherIds).toContain("origen");

    const origen = c3!.fathers.find((f) => f.fatherId === "origen")!;
    expect(origen.works.length).toBeGreaterThan(0);

    const work = origen.works[0];
    expect(work.links.length).toBeGreaterThan(0);
    expect(work.links[0].excerpt.length).toBeGreaterThan(20);
  });

  it("unrolls OT and NT testaments for section mt.16.peters-confession", () => {
    const tree = store.getTreeForSection("mt.16.peters-confession");
    const canons = tree.map((t) => t.canon);
    expect(canons).toContain("ot");
    expect(canons).toContain("nt");

    const nt = tree.find((t) => t.canon === "nt")!;
    const books = nt.books.map((b) => b.bookId);
    expect(books).toContain("mt");
  });
});
