import { describe, expect, it } from "vitest";
import { getCatalog, getWork } from "../server/api";
import { assignChapterSlugs, englishParagraphs } from "../src/lib/fatherPaths";
import {
  DESCRIPTION_MAX,
  DESCRIPTION_MIN,
  SHORT_TITLE_KEYS,
  handShortTitle,
  shortTitleKey,
  TITLE_MAX,
  chapterSeoDescription,
  chapterSeoTitle,
  pickOpening,
  unitNoun,
  workSeoDescription,
  workSeoTitle
} from "../src/lib/seoMeta";

/** Every static work and chapter page: unique titles and descriptions within the length rules. */
describe("SEO titles and descriptions across the catalog", () => {
  it("has no duplicates, no long titles, no short descriptions, and chapter slugs 1..N", () => {
    const cat = getCatalog();
    const titles = new Map<string, string>();
    const descs = new Map<string, string>();
    const problems: string[] = [];
    const add = (page: string, title: string, desc: string) => {
      if (title.length > TITLE_MAX) problems.push("title>" + TITLE_MAX + " " + page + ": " + title);
      if (desc.length < DESCRIPTION_MIN) problems.push("desc<" + DESCRIPTION_MIN + " " + page + ": " + desc);
      if (desc.length > DESCRIPTION_MAX) problems.push("desc>" + DESCRIPTION_MAX + " " + page + ": " + desc);
      if (/…\./.test(desc)) problems.push("period after a cut " + page + ": " + desc);
      if (/(?: -|,|:|;)$|\bby the Apostolic Fathers$/.test(title)) problems.push("bad title ending " + page + ": " + title);
      if (((title.match(/["“”]/g) || []).length % 2) !== 0) problems.push("unmatched quote " + page + ": " + title);
      if (/[\[\]¶]/.test(desc)) problems.push("bracket or pilcrow in desc " + page + ": " + desc);
      if (titles.has(title)) problems.push("dup title " + page + " = " + titles.get(title) + ": " + title);
      if (descs.has(desc)) problems.push("dup desc " + page + " = " + descs.get(desc) + ": " + desc);
      titles.set(title, page);
      descs.set(desc, page);
    };
    const catalogTitles = new Set<string>();
    let pages = 0;
    for (const w of cat.works) {
      const p = getWork(w.id);
      if (!p) continue;
      catalogTitles.add(p.work.title);
      const prose = (i: number) => pickOpening(englishParagraphs(p.chapters[i]!.versions), [p.work.title, p.chapters[i]!.heading]);
      add(
        w.id,
        workSeoTitle(p.work.title, p.author.name),
        workSeoDescription({
          authorName: p.author.name,
          workTitle: p.work.title,
          units: p.chapters.length,
          noun: unitNoun(p.chapters.map((c) => c.heading)),
          series: p.work.series,
          opening: p.chapters[0] ? prose(0) : ""
        })
      );
      pages++;
      if (p.chapters.length < 2) continue;
      const slugs = assignChapterSlugs(p.chapters);
      p.chapters.forEach((c, i) => {
        const slug = slugs.get(c.chapter)!;
        if (slug !== "chapter-" + (i + 1)) problems.push("slug " + w.id + " " + slug);
        if (slug.length > 20) problems.push("slug>20 " + w.id + " " + slug);
        add(
          w.id + "/" + slug,
          chapterSeoTitle(i + 1, p.work.title, p.author.name),
          chapterSeoDescription(i + 1, p.author.name, p.work.title, prose(i))
        );
        pages++;
      });
    }
    // Match the map keys the way the lookup does, and check each such work really gets its short form.
    const keyed = new Map([...catalogTitles].map((t) => [shortTitleKey(t), t]));
    for (const k of SHORT_TITLE_KEYS) if (!keyed.has(k)) problems.push("short-title entry matches no work: " + k);
    for (const w of cat.works) {
      const p = getWork(w.id);
      if (!p) continue;
      const hand = handShortTitle(p.work.title);
      if (hand && !workSeoTitle(p.work.title, p.author.name).startsWith(hand)) problems.push("short title not used: " + w.id);
      if (/Ecumenical Council -/.test(workSeoTitle(p.work.title, p.author.name))) problems.push("long council title: " + w.id);
    }
    for (const [desc, page] of descs) {
      const t = cat.works.find((w) => w.id === page)?.title;
      if (t && desc.trim().toLowerCase() === t.trim().toLowerCase()) problems.push("description is the work title: " + page);
    }
    console.log("SEO pages checked", pages, "problems", problems.length);
    for (const k of ["confessions/chapter-3", "on-the-mysteries/chapter-8", "homilies-on-matthew/chapter-32", "jerome-letters/chapter-57"]) console.log("SAMPLE", k, [...titles].find(([, v]) => v === k)?.[0], "|", [...descs].find(([, v]) => v === k)?.[0]);
    expect(problems.slice(0, 40)).toEqual([]);
  }, 120_000);
});
