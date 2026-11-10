import { describe, expect, it } from "vitest";
import { bibliography, shareText } from "../src/lib/readAnchors";
import { saintName } from "../src/lib/saintName";

const augustine = {
  author: "Saint Augustine of Hippo",
  work: "The Confessions",
  chapter: "Book VIII",
  n: 12 as number | null,
  translator: "E. B. Pusey",
  edition: "",
  url: "https://patrista.com/fathers/augustine/confessions/book-8/#ch-8-p12"
};

describe("study selection share and citation", () => {
  it("names a saint and leaves the others as the catalog names them", () => {
    expect(saintName("augustine", "Augustine of Hippo", "Augustine of Hippo")).toBe("Saint Augustine of Hippo");
    expect(saintName("tertullian", "Tertullian", "Tertullian")).toBe("Tertullian");
    expect(saintName("origen", "Origen", "Origen")).toBe("Origen");
    expect(saintName("augustine", "Pseudo-Augustine", "Augustine of Hippo")).toBe("Pseudo-Augustine");
  });

  it("copies a bibliography entry and not the quotation", () => {
    expect(bibliography(augustine)).toBe(
      "Saint Augustine of Hippo. The Confessions. Book VIII, ¶12. Translated by E. B. Pusey. https://patrista.com/fathers/augustine/confessions/book-8/#ch-8-p12"
    );
    expect(bibliography(augustine)).not.toContain("“");
    expect(bibliography({ ...augustine, n: null, edition: "Nicene and Post-Nicene Fathers, vol. I" })).toBe(
      "Saint Augustine of Hippo. The Confessions. Book VIII. Translated by E. B. Pusey. Nicene and Post-Nicene Fathers, vol. I. https://patrista.com/fathers/augustine/confessions/book-8/#ch-8-p12"
    );
  });

  it("shares the quote, the name, and the book, and stops there", () => {
    expect(shareText("You have made us for yourself.", "Saint Augustine of Hippo", "The Confessions")).toBe(
      "“You have made us for yourself.”\n\nSaint Augustine of Hippo, The Confessions"
    );
  });
});
