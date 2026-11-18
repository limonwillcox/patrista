import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { isSyncedKey, BOOKMARKS_KEY } from "../server/syncKeys";
import type { Link as CommentaryLink } from "../src/api/links";
import { commentaryPassages, mergeSources, type CitingPassage } from "../src/components/FathersThread";
import { bibleBookmarkId, mergeBookmarks, parseBookmarks, toggleIn, workBookmarkId, type Bookmark } from "../src/lib/bookmarks";
import { mergeMarks, countMarks } from "../src/lib/markMerge";
import { quoteShareText, shareToast, verseShareText } from "../src/lib/share";
import { storyAt, storyKicker, storyKind, type StoryRow } from "../src/lib/stories";
import { swipeDirection } from "../src/lib/swipe";

const root = join(__dirname, "..");
const rows = (book: string) => JSON.parse(readFileSync(join(root, "public", "stories", book + ".json"), "utf8")) as StoryRow[];
const at = (book: string, chapter: number, verse: number) => storyAt(rows(book), chapter, verse)!;

describe("what a section of the Bible is called", () => {
  it("calls a narrative a story, a parable a parable, and teaching a passage", () => {
    expect(storyKind("nm", at("nm", 16, 5))).toBe("story");
    expect(storyKind("mt", at("mt", 8, 24))).toBe("story");
    expect(storyKind("mt", at("mt", 13, 3))).toBe("parable");
    // The Sermon on the Mount is teaching inside a book that tells a story.
    expect(storyKind("mt", at("mt", 5, 3))).toBe("passage");
    expect(storyKind("jo", at("jo", 15, 1))).toBe("passage");
    // The letters, the psalms and the prophets teach.
    expect(storyKind("rm", at("rm", 8, 1))).toBe("passage");
    expect(storyKind("ps", at("ps", 23, 1))).toBe("passage");
    expect(storyKind("is", at("is", 53, 4))).toBe("passage");
  });

  it("heads the Fathers' words to match", () => {
    expect(storyKicker("story")).toBe("The Fathers on the story");
    expect(storyKicker("parable")).toBe("The Fathers on this parable");
    expect(storyKicker("passage")).toBe("The Fathers on this passage");
  });
});

describe("a flick across the Bible text", () => {
  it("turns forward on a flick left and back on a flick right", () => {
    expect(swipeDirection(-120, 10, 200)).toBe("next");
    expect(swipeDirection(120, -10, 200)).toBe("prev");
  });

  it("is not taken from a scroll, a short drag or a slow press", () => {
    expect(swipeDirection(-120, 90, 200)).toBeNull();
    expect(swipeDirection(-30, 0, 200)).toBeNull();
    expect(swipeDirection(-200, 0, 1200)).toBeNull();
  });
});

describe("bookmarks", () => {
  const mark = (id: string, at: number): Bookmark => ({ id, title: id, note: "", path: "/" + id, at });

  it("keeps a place once and lets it go on the second press", () => {
    const one = toggleIn([], mark("bible:mt:5", 1));
    expect(one.map((b) => b.id)).toEqual(["bible:mt:5"]);
    const two = toggleIn(one, mark("work:confessions:3", 2));
    expect(two.map((b) => b.id)).toEqual(["work:confessions:3", "bible:mt:5"]);
    expect(toggleIn(two, mark("bible:mt:5", 3)).map((b) => b.id)).toEqual(["work:confessions:3"]);
    expect(bibleBookmarkId("mt", 5)).toBe("bible:mt:5");
    expect(workBookmarkId("confessions", 3)).toBe("work:confessions:3");
  });

  it("reads only well-formed bookmarks from storage", () => {
    expect(parseBookmarks(null)).toEqual([]);
    expect(parseBookmarks("not json")).toEqual([]);
    expect(parseBookmarks('{"id":"x"}')).toEqual([]);
    const kept = parseBookmarks(JSON.stringify([mark("bible:mt:5", 1), { id: "x" }, { id: "y", title: "Y", path: "https://elsewhere.example/" }]));
    expect(kept.map((b) => b.id)).toEqual(["bible:mt:5"]);
  });

  it("joins two browsers' lists without losing or doubling a place", () => {
    const joined = mergeBookmarks([mark("a", 5), mark("b", 1)], [mark("b", 9), mark("c", 3)]);
    expect(joined.map((b) => b.id + "@" + b.at)).toEqual(["b@9", "a@5", "c@3"]);
  });

  it("follows the reader's account like their other marks", () => {
    expect(isSyncedKey(BOOKMARKS_KEY)).toBe(true);
    const local = JSON.stringify([mark("a", 5)]);
    const remote = JSON.stringify([mark("c", 3)]);
    expect((JSON.parse(mergeMarks(BOOKMARKS_KEY, local, remote)!) as Bookmark[]).map((b) => b.id)).toEqual(["a", "c"]);
    const storage = { length: 1, key: () => BOOKMARKS_KEY, getItem: () => local };
    expect(countMarks(storage)).toBe(1);
  });
});

describe("what is shared", () => {
  it("shares a verse as its words and its reference", () => {
    expect(verseShareText(["Blessed  are the poor in spirit:", "for theirs is the kingdom."], "Matthew 5:3", "KJV")).toBe(
      "“Blessed are the poor in spirit: for theirs is the kingdom.”\n\nMatthew 5:3 (KJV)"
    );
  });

  it("shares a Father's words with his name, the work and the verse", () => {
    expect(quoteShareText(" He blesses the humble. ", "John Chrysostom", "Homilies on Matthew", "Matthew 5:3")).toBe(
      "“He blesses the humble.”\n\nJohn Chrysostom, Homilies on Matthew, on Matthew 5:3"
    );
  });

  it("says something only when the words were copied or could not be", () => {
    expect(shareToast("shared")).toBeNull();
    expect(shareToast("cancelled")).toBeNull();
    expect(shareToast("copied")).toMatch(/Copied/);
    expect(shareToast("failed")).toMatch(/Could not/);
  });
});

describe("commentary passages on a verse", () => {
  const link = (id: string, excerpt: string, workId = "commentary-on-matthew"): CommentaryLink =>
    ({ id, excerpt, workId, workTitle: "Commentary on Matthew Book XIII", fatherId: "origen", sourceUrl: "http://example.org/x", status: "verified" }) as CommentaryLink;
  const name = () => "Origen";

  it("drops a scrap left by the splitting of its source", () => {
    const got = commentaryPassages([link("a", '? "[1]'), link("b", "Was it to the scribes in regard to whom the disciples inquired?")], 10, name, () => true);
    expect(got.map((p) => p.key)).toEqual(["cm:b"]);
  });

  it("drops a one-line extract when the library's own chapter of that work is already on the verse", () => {
    const cite: CitingPassage = {
      key: "/fathers/origen/commentary-on-matthew/chapter-6/",
      url: "/fathers/origen/commentary-on-matthew/chapter-6/",
      title: "Commentary on Matthew — Book XIII",
      father: "Origen",
      n: 1,
      excerpt: "“The disciples asked Him, saying, Why then say the scribes that Elijah must first come?”",
      verses: [10],
      rank: 2,
      work: "commentary-on-matthew",
      chapter: 6,
      paras: [1],
      mentions: []
    };
    const extracts = commentaryPassages(
      [link("b", "Was it to the scribes in regard to whom the disciples inquired and said these words?"), link("c", "A passage from a work the library does not hold at all.", "other-work")],
      10,
      name,
      (w) => w === "commentary-on-matthew"
    );
    const merged = mergeSources([cite], extracts, (p) => p.author || "origen");
    expect(merged.map((p) => p.key).sort()).toEqual([cite.key, "cm:c"].sort());
  });
});
