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
    path: "/privacy",
    title: "Privacy — Patrista",
    description:
      "What Patrista keeps about you: nothing unless you sign in, and then only your email address, your highlights and your notes. No ads, no tracking, nothing sold.",
    bodyHtml:
      '<div class="prose"><h1>Privacy</h1>' +
      "<p>Patrista is free to read without an account. We do not run ads, we do not use cookies to follow you, and we do not sell or share anything about you. Cloudflare, the company that hosts the site, counts page visits for us without cookies and without identifying anyone.</p>" +
      "<h2>If you do not sign in</h2><p>Your highlights, notes and settings are saved in your own browser, on your own device. They are never sent to us.</p>" +
      "<h2>If you sign in with Google</h2><p>Signing in is optional. We keep your email address, the account number Google gives us for you, your highlights, your notes and the connections you saved, and a record that you are signed in. We do not receive your Google password and we do not read anything else in your Google account. We do not send you email. This is stored with Cloudflare, the company that hosts the site.</p>" +
      "<h2>Deleting your account</h2><p>You can delete your account at any time from this page while signed in. That removes your email address and every highlight and note we hold for you.</p>" +
      '<p><a href="/about">About Patrista</a> · <a href="/fixes">Contact</a></p></div>'
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
    // The types map on its own, for another site to frame (src/pages/EmbedTypesPage.tsx).
    path: "/embed/types",
    title: "Types of Christ in Scripture — Patrista",
    description: "The types of Christ the Church Fathers saw, drawn over the Bible from Genesis to Revelation.",
    bodyHtml: '<div class="prose"><h1>Types of Christ in Scripture</h1><p><a href="/types">Open the map on Patrista</a></p></div>',
    noindex: true
  },
  {
    path: "/tabernacle",
    title: "The tabernacle of Exodus, to scale — Patrista",
    description:
      "The tabernacle of Exodus 25–40 built to the measures the text gives, in cubits, with the priest's way in from the gate to the ark.",
    bodyHtml: '<div class="prose"><h1>The tabernacle</h1></div>',
    // Not in the sitemap until the site links to it.
    noindex: true
  },
  {
    path: "/print",
    title: "Print or save as PDF — Patrista",
    description: "Print a work of the Church Fathers, or save it as a PDF.",
    bodyHtml: '<div class="prose"><h1>Print</h1></div>',
    noindex: true
  }
];
