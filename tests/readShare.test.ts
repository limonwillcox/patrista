import { describe, expect, it } from "vitest";
import { bibliography, bibliographyHtml, editionFor, quoteWithCitation, quoteWithCitationHtml, shareText, translatorFor } from "../src/lib/readAnchors";
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

  it("treats a series as the edition, not as a translator", () => {
    expect(translatorFor("confessions")).toBe("E. B. Pusey");
    expect(translatorFor("apology")).toBe("");
    expect(editionFor("ANF")).toBe("Ante-Nicene Fathers, ed. Roberts & Donaldson");
    expect(editionFor("NPNF1")).toBe("Nicene and Post-Nicene Fathers, ed. Schaff");
    expect(bibliography({ ...augustine, translator: "", edition: editionFor("NPNF1") })).toBe(
      "Saint Augustine of Hippo. The Confessions. Book VIII, ¶12. Nicene and Post-Nicene Fathers, ed. Schaff. https://patrista.com/fathers/augustine/confessions/book-8/#ch-8-p12"
    );
    expect(bibliography({ ...augustine, translator: "", edition: editionFor("ANF") })).not.toContain("Translated by");
  });

  it("puts the work title in italics and the url in a link for rich paste", () => {
    const html = bibliographyHtml(augustine);
    expect(html).toContain('<i style="font-style: italic;">The Confessions</i>');
    expect(html).toContain('<a href="https://patrista.com/fathers/augustine/confessions/book-8/#ch-8-p12">');
    expect(visible(html)).toBe(bibliography(augustine));
    const quoted = quoteWithCitationHtml("You have made us for yourself.", augustine);
    expect(quoted).toContain("<p>“You have made us for yourself.”</p>");
    expect(quoted).toContain('<i style="font-style: italic;">The Confessions</i>');
    expect(visible(quoted)).toBe(quoteWithCitation("You have made us for yourself.", augustine).replace(/\n\n/g, ""));
  });
});

function visible(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
}
