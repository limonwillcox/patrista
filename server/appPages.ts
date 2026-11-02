/** App routes that are pages of their own in the static build, so GitHub Pages answers them with a 200. */
export type AppPage = {
  path: string;
  title: string;
  description: string;
  bodyHtml: string;
  /** Tools and result pages: keep them out of the index. */
  noindex?: boolean;
};

export const APP_PAGES: AppPage[] = [
  {
    path: "/about",
    title: "About Patrista — the Church Fathers, free to read",
    description:
      "Patrista is a free, searchable library of the Church Fathers in public-domain English, with the Latin where we have it and links to the Bible.",
    bodyHtml:
      '<div class="prose"><h1>About Patrista</h1><p>Patrista is a free, searchable library of the Church Fathers in public-domain English translations, with the Latin where we have it.</p><p><a href="/fathers/">Browse the Fathers by century</a> · <a href="/search">Search the texts</a></p></div>'
  },
  {
    path: "/study",
    title: "Study Desk: how to read the Church Fathers on Patrista",
    description:
      "A short map of the Patrista library: how to open a Father, how search works, and a few first paths through the Church Fathers.",
    bodyHtml:
      '<div class="prose"><h1>Study desk</h1><p>How to open a Father, how search works, and a few first paths through the library.</p><p><a href="/fathers/">The Church Fathers</a></p></div>'
  },
  {
    path: "/bible",
    title: "The Bible with the Church Fathers' commentary",
    description:
      "Read the Bible chapter by chapter, with what the Church Fathers wrote on each verse beside it.",
    bodyHtml:
      '<div class="prose"><h1>The Bible with the Fathers</h1><p>Read a chapter of Scripture with the Church Fathers on each verse beside it.</p></div>'
  },
  {
    path: "/search",
    title: "Search the Church Fathers — Patrista",
    description: "Search the full text of the Church Fathers on Patrista.",
    bodyHtml: '<div class="prose"><h1>Search the Church Fathers</h1></div>',
    noindex: true
  },
  {
    path: "/journal",
    title: "Journal — Patrista",
    description: "Your reading notes on the Church Fathers, kept in this browser.",
    bodyHtml: '<div class="prose"><h1>Journal</h1></div>',
    noindex: true
  },
  {
    path: "/fixes",
    title: "Report a problem — Patrista",
    description: "Report a typo, a broken chapter, or anything else wrong on Patrista.",
    bodyHtml: '<div class="prose"><h1>Report a problem</h1></div>',
    noindex: true
  },
  {
    path: "/types",
    title: "Types of Christ in Scripture — Patrista",
    description:
      "Every type of Christ the Church Fathers draw from Scripture, from Isaac on Moriah to the bronze serpent, with their own words and every passage, Genesis to Revelation.",
    bodyHtml: '<div class="prose"><h1>Types of Christ in Scripture</h1></div>'
  },
  {
    path: "/print",
    title: "Print or save as PDF — Patrista",
    description: "Print a work of the Church Fathers, or save it as a PDF.",
    bodyHtml: '<div class="prose"><h1>Print</h1></div>',
    noindex: true
  }
];
