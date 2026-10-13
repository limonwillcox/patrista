import { describe, expect, it } from "vitest";
import {
  dictionaryBarClick,
  headwordCandidates,
  missQueueWord,
  normalizeHeadword,
  parseWebsterEntry,
  wordAtOffset
} from "../src/lib/dictionary";

describe("normalizeHeadword", () => {
  it("lowercases and strips punctuation", () => {
    expect(normalizeHeadword("Charity,")).toBe("charity");
    expect(normalizeHeadword("“Wherefore”")).toBe("wherefore");
    expect(normalizeHeadword("God's")).toBe("god's");
  });
});

describe("dictionaryBarClick", () => {
  it("starts pick from idle and returns to idle from a definition", () => {
    expect(dictionaryBarClick("idle")).toBe("pick");
    expect(dictionaryBarClick("show")).toBe("idle");
    expect(dictionaryBarClick("miss")).toBe("idle");
    expect(dictionaryBarClick("pick")).toBe("idle");
  });
});

describe("missQueueWord", () => {
  it("keeps a real headword and drops crumbs", () => {
    expect(missQueueWord("Wherefore,")).toBe("wherefore");
    expect(missQueueWord("O")).toBeNull();
    expect(missQueueWord("!!")).toBeNull();
  });
});

describe("headwordCandidates", () => {
  it("tries the plural then the singular", () => {
    expect(headwordCandidates("charities")).toEqual(["charities", "charity"]);
    expect(headwordCandidates("walked")).toContain("walk");
  });
});

describe("wordAtOffset", () => {
  it("expands to the word under the caret", () => {
    const text = "Love; universal benevolence.";
    expect(wordAtOffset(text, 0)).toBe("Love");
    expect(wordAtOffset(text, 8)).toBe("universal");
    expect(wordAtOffset(text, 5)).toBeNull();
  });
});

const CHARITY = `CHARITY
Char"i*ty, n.; pl. Charities. Etym: [F. charité fr. L. caritas
dearness, high regard, love, from carus dear, costly, loved.]

1. Love; universal benevolence; good will.

Defn:
Now abideth faith, hope, charity, three; but the greatest of these is
charity. 1. Cor. xiii. 13.

2. Liberality in judging of men and their actions; a disposition
which inclines men to put the best construction on the words and
actions of others.

3. Liberality to the poor and the suffering
`;

describe("parseWebsterEntry", () => {
  it("takes numbered senses from a Webster 1913 dump", () => {
    const entry = parseWebsterEntry(CHARITY);
    expect(entry?.headword.toLowerCase()).toBe("charity");
    expect(entry?.senses[0]).toMatch(/Love; universal benevolence/i);
    expect(entry?.senses.length).toBeGreaterThanOrEqual(2);
  });

  it("returns null for an empty or missing dump", () => {
    expect(parseWebsterEntry("")).toBeNull();
    expect(parseWebsterEntry("404: Not Found")).toBeNull();
  });

  it("keeps a wrapped definition and drops the quotation", () => {
    const entry = parseWebsterEntry(MAN);
    expect(entry?.senses[0]).toMatch(/human being/i);
    expect(entry?.senses[0]).not.toMatch(/These men went about/i);
    expect(entry?.senses[1]).toMatch(/distinguished from a woman/i);
    expect(entry?.senses[1]).not.toMatch(/childish things/i);
    expect(entry?.senses[2]).toBe("The human race; mankind.");
    expect(entry?.senses[2]).not.toMatch(/And God said/i);
  });
});

const MAN = `MAN
Man, n.; pl. Men. Etym: [AS. mann, man, monn, mon; akin to OS., D., &
OHG. man, G. mann, Icel. maedhr, for mannr, Dan. Mand, Sw. man, Goth.
manna, Skr. manu, manus, and perh. to Skr. man to think, and E. mind.
sq. root104. Cf. Minx a pert girl.]

1. A human being; -- opposed tobeast.
These men went about wide, and man found they none, But fair country,
and wild beast many [a] one. R. of Glouc.

2. Especially: An adult male person; a grown-up male person, as
distinguished from a woman or a child.
When I became a man, I put away childish things. I Cor. xiii. 11.

3. The human race; mankind.
And God said, Let us make man in our image, after our likeness, and
let them have dominion. Gen. i. 26.
`;
