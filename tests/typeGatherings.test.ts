import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { TypeEntry } from "../src/api/connections";
import { computeGatherings, GATHER_MIN, nameGatherings, passageOf } from "../src/lib/typeGatherings";

const types = JSON.parse(readFileSync(join(__dirname, "..", "public", "connections", "types.json"), "utf8")) as TypeEntry[];

describe("a Father's passage", () => {
  it("is his own unit: every number but the last, or the only one", () => {
    expect(passageOf("Cyril, *Cat.* 3.10")?.passage).toBe("Cyril, *Cat.* 3");
    expect(passageOf("Irenaeus, *AH* 3.22.4")?.passage).toBe("Irenaeus, *AH* 3.22");
    expect(passageOf("Tertullian, *Bapt.* 9")?.passage).toBe("Tertullian, *Bapt.* 9");
    expect(passageOf("Tertullian, *Bapt.* 8 (Jacob's crossed hands)")?.passage).toBe("Tertullian, *Bapt.* 8");
    expect(passageOf("Gregory of Nyssa, *Bapt. Chr.* §8")?.passage).toBe("Gregory of Nyssa, *Bapt. Chr.* §8");
    expect(passageOf("Ambrose, *De Myst.* 8.49a")?.passage).toBe("Ambrose, *De Myst.* 8");
  });
});

describe("gatherings", () => {
  const gs = computeGatherings(types);
  const byId = new Map(types.map((t) => [t.id, t]));

  it("each name at least GATHER_MIN types, each type once", () => {
    expect(gs.length).toBeGreaterThan(0);
    for (const g of gs) {
      expect(g.members.length).toBeGreaterThanOrEqual(GATHER_MIN);
      expect(new Set(g.members.map((m) => m.type)).size).toBe(g.members.length);
    }
  });

  it("rest every member on its own quotation from that passage", () => {
    for (const g of gs) {
      for (const m of g.members) {
        const t = byId.get(m.type)!;
        const w = t.where[m.quote];
        expect(w.startsWith(m.ref + " — "), g.id + " " + m.type).toBe(true);
        expect(passageOf(m.ref)?.passage).toBe(g.ref);
        expect(t.links?.[m.quote]?.href).toBe(m.href);
      }
    }
  });

  it("list the types in the order the Father names them", () => {
    const at = (href: string) => [Number(href.match(/\/chapter-(\d+)\//)![1]), Number(href.match(/-p(\d+)$/)![1])];
    for (const g of gs) {
      const pos = g.members.map((m) => at(m.href));
      for (let i = 1; i < pos.length; i++) {
        const [a, b] = [pos[i - 1], pos[i]];
        expect(a[0] < b[0] || (a[0] === b[0] && a[1] <= b[1]), g.id).toBe(true);
      }
    }
  });

  it("are named from the catalogue and run through history", () => {
    const catalog = {
      authors: [
        { id: "augustine", deathYear: 430 },
        { id: "tertullian", deathYear: 220 }
      ],
      works: [{ id: "on-baptism", title: "On Baptism" }]
    };
    const one = (author: string, father: string, work: string, unit: string) => ({
      id: author + unit,
      ref: father + ", *" + work + "* " + unit,
      father,
      author,
      work,
      unit,
      href: "",
      members: []
    });
    const named = nameGatherings([one("augustine", "Augustine", "city-of-god", "16"), one("tertullian", "Tertullian", "on-baptism", "9")], catalog);
    expect(named.map((g) => g.name)).toEqual(["Tertullian, On Baptism 9", "Augustine, city-of-god 16"]);
  });
});
