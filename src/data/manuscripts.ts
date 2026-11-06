/**
 * Real manuscripts of works in the library, shown from the holding library's IIIF image server, and only from servers
 * that send CORS headers (so WebGL may draw the image). Every page shown is a public-domain work; what each `rights`
 * field records is the holding library's own statement, which is not always a licence:
 *  - most pages carry the Public Domain Mark 1.0 (Munich, Bamberg, Basel, Leiden, Berlin, Heidelberg, Mainz, Karlsruhe,
 *    LMU Munich, the Library Company of Philadelphia, and the OPenn images from Bryn Mawr and the Free Library of
 *    Philadelphia) or CC0 1.0 (Schaffhausen, via e-codices), which allow any use, including commercial;
 *  - Princeton gives rightsstatements.org "No Known Copyright" (NKC) and Penn "No Copyright – United States" (NoC-US):
 *    statements of copyright status, not licences, and NoC-US speaks for the United States only;
 *  - Yale, Harvard and the Newberry rely on their open-access policies for images of public-domain works (Yale's IIIF
 *    manifests carry only a general copyright caution);
 *  - the British Library's Codex Sinaiticus is "public domain in most countries other than the UK", an exception
 *    chosen on purpose, and Codex Alexandrinus is shown from the British Museum's photographic facsimile of 1909.
 * Each entry was checked in October 2026 (the catalogue or manifest names the work, the page was looked at, and the
 * info.json and a JPEG both answered with Access-Control-Allow-Origin). In November 2026 the rights, and the dates and
 * places where a manifest or catalogue records them, were checked again against the holding libraries' own records.
 */

export type ManuscriptPage = {
  workId: string;
  library: string;
  shelfmark: string;
  date: string;
  /** Empty when the library does not record it. */
  place: string;
  language: "Latin" | "Greek" | "Syriac";
  /** What the reader is looking at on this page. */
  shows: string;
  /** IIIF Image API base for the page; the viewer asks it for a sized JPEG. */
  imageService: string;
  /** IIIF region, when the photograph shows two facing pages and only one is this work. */
  region?: string;
  /** Largest width the image server will send, when it refuses the viewer's usual 2000px. */
  maxWidth?: number;
  /** The library's own viewer for the whole book. */
  viewer: string;
  rights: { label: string; href: string };
};

export const MANUSCRIPTS: Record<string, ManuscriptPage> = {
  "confessions": {
    "workId": "confessions",
    "library": "Beinecke Rare Book and Manuscript Library, Yale University",
    "shelfmark": "Beinecke MS 952",
    "date": "1469",
    "place": "Huysburg, Germany",
    "language": "Latin",
    "shows": "The opening of Book I, “Magnus es, Domine” (Great art Thou, O Lord), under a large painted M.",
    "imageService": "https://collections.library.yale.edu/iiif/2/11068104",
    "viewer": "https://collections.library.yale.edu/catalog/11007504",
    "rights": {
      "label": "Public-domain work; Yale's open-access policy allows any use of its images of such works (the IIIF manifest itself carries only a general copyright caution)",
      "href": "https://guides.library.yale.edu/openaccess"
    }
  },
  "concerning-repentance": {
    "workId": "concerning-repentance",
    "library": "Staatsbibliothek Bamberg (digitised by the Bayerische Staatsbibliothek / MDZ)",
    "shelfmark": "Staatsbibliothek Bamberg, Msc.Patr.6",
    "date": "end of the 10th century",
    "place": "Southern Germany",
    "language": "Latin",
    "shows": "Folio 40v: “Explicit de resurrectione”, then the red title “Incipit de paenitentia liber primus” where Concerning Repentance begins.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00140791_00084",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00140791?page=84",
    "rights": {
      "label": "Public Domain Mark 1.0 (stated in the MDZ IIIF manifest)",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "concerning-virgins": {
    "workId": "concerning-virgins",
    "library": "Staatsbibliothek Bamberg (digitised by the Bayerische Staatsbibliothek / MDZ)",
    "shelfmark": "Staatsbibliothek Bamberg, Msc.Patr.6",
    "date": "end of the 10th century",
    "place": "Southern Germany",
    "language": "Latin",
    "shows": "Folio 72r: the close of On Repentance and the start of On Virgins, Book I, “Si iuxta caelestem sententiam…”.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00140791_00147",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00140791?page=147",
    "rights": {
      "label": "Public Domain Mark 1.0 (stated in the MDZ IIIF manifest)",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "concerning-widows": {
    "workId": "concerning-widows",
    "library": "Staatsbibliothek Bamberg (digitised by the Bayerische Staatsbibliothek / MDZ)",
    "shelfmark": "Staatsbibliothek Bamberg, Msc.Patr.6",
    "date": "end of the 10th century",
    "place": "Southern Germany",
    "language": "Latin",
    "shows": "Folio 121r: “Incipit de viduis” and the opening words “Bene accidit, fratres…”, under a red B.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00140791_00245",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00140791?page=245",
    "rights": {
      "label": "Public Domain Mark 1.0 (stated in the MDZ IIIF manifest)",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "concerning-the-sacraments": {
    "workId": "concerning-the-sacraments",
    "library": "Staatsbibliothek Bamberg (digitised by the Bayerische Staatsbibliothek / MDZ)",
    "shelfmark": "Staatsbibliothek Bamberg, Msc.Patr.4",
    "date": "about 1000",
    "place": "Cluny",
    "language": "Latin",
    "shows": "Folio 6v: “Finit de initiandis feliciter” closes On the Mysteries, and the title “Incipit de sacramentis liber I” opens this work.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00140790_00018",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00140790?page=18",
    "rights": {
      "label": "Public Domain Mark 1.0 (stated in the MDZ IIIF manifest)",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "exposition-of-the-christian-faith": {
    "workId": "exposition-of-the-christian-faith",
    "library": "Bryn Mawr College Library, Special Collections (images via OPenn, served by the Internet Archive IIIF mirror)",
    "shelfmark": "Bryn Mawr College MS 39",
    "date": "mid-15th century",
    "place": "Italy",
    "language": "Latin",
    "shows": "Folio 1r, the opening of Book I in rustic capitals, “[R]egina austri venit audire sapientiam Salomonis”, with the space for the initial left blank.",
    "imageService": "https://iiif.archive.org/image/iiif/3/BMC_MS39%2FBMC_MS39_jp2.zip%2FBMC_MS39_jp2%2FBMC_MS39_0004.jp2",
    "viewer": "https://openn.library.upenn.edu/Data/0003/html/BMC_MS39.html",
    "rights": {
      "label": "Public Domain Mark 1.0 (free of known copyright restrictions)",
      "href": "https://openn.library.upenn.edu/Data/0003/html/BMC_MS39.html"
    }
  },
  "letters": {
    "workId": "letters",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "BSB Clm 10041",
    "date": "first half of the 10th century",
    "place": "Northern Italy",
    "language": "Latin",
    "shows": "Folio 3r, the start of Book I of the letters, “Ambrosius Iusto salutem”, with a large interlaced P framing a saint.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00047277_00015",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00047277?page=15",
    "rights": {
      "label": "Public Domain Mark 1.0 (stated in the MDZ IIIF manifest)",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "on-the-decease-of-his-brother-satyrus": {
    "workId": "on-the-decease-of-his-brother-satyrus",
    "library": "Staatsbibliothek Bamberg (digitised by the Bayerische Staatsbibliothek / MDZ)",
    "shelfmark": "Staatsbibliothek Bamberg, Msc.Patr.6",
    "date": "end of the 10th century",
    "place": "Southern Germany",
    "language": "Latin",
    "shows": "Folio 1r, the opening of the funeral oration for Satyrus, “Deduximus, fratres dilectissimi, hostiam meam”, under a large red D.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00140791_00005",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00140791?page=5",
    "rights": {
      "label": "Public Domain Mark 1.0 (stated in the MDZ IIIF manifest)",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "on-the-duties-of-the-clergy": {
    "workId": "on-the-duties-of-the-clergy",
    "library": "Staatsbibliothek Bamberg (digitised by the Bayerische Staatsbibliothek / MDZ)",
    "shelfmark": "Staatsbibliothek Bamberg, Msc.Patr.4",
    "date": "about 1000",
    "place": "Cluny",
    "language": "Latin",
    "shows": "Folio 18v, with the red title “In nomine sanctae Trinitatis incipit tractatus sancti Ambrosii episcopi de officiis, liber primus”.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00140790_00042",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00140790?page=42",
    "rights": {
      "label": "Public Domain Mark 1.0 (stated in the MDZ IIIF manifest)",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "on-the-holy-spirit": {
    "workId": "on-the-holy-spirit",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "BSB Clm 18164",
    "date": "1473",
    "place": "Tegernsee (provenance)",
    "language": "Latin",
    "shows": "Folio 164v: under the scribe's red title “Incipit liber beati Ambrosii episcopi de Gedeon”, the Gideon prologue that opens On the Holy Spirit, “Hierobaal cum sub arbore…”; the library's contents list gives only fols. 164v–166v, so this copy is probably partial.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00143106_00336",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00143106?page=336",
    "rights": {
      "label": "Public Domain Mark 1.0 (stated in the MDZ IIIF manifest)",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "on-the-mysteries": {
    "workId": "on-the-mysteries",
    "library": "Staatsbibliothek Bamberg (digitised by the Bayerische Staatsbibliothek / MDZ)",
    "shelfmark": "Staatsbibliothek Bamberg, Msc.Patr.4",
    "date": "about 1000",
    "place": "Cluny",
    "language": "Latin",
    "shows": "The title page in red and black capitals: “In nomine Domini nostri Iesu Christi incipit liber sancti Ambrosii de mysteriis et de sacramentis, liber I”.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00140790_00006",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00140790?page=6",
    "rights": {
      "label": "Public Domain Mark 1.0 (stated in the MDZ IIIF manifest)",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "testaments-of-the-twelve-patriarchs": {
    "workId": "testaments-of-the-twelve-patriarchs",
    "library": "Wissenschaftliche Stadtbibliothek Mainz (digitised by Heidelberg University Library)",
    "shelfmark": "Hs I 30",
    "date": "3rd quarter of the 15th century",
    "place": "",
    "language": "Latin",
    "shows": "Folio 162r: “Incipiunt testamenta duodecim patriarcharum…”, the rubric naming Robert Grosseteste as translator from Greek into Latin, then the Testament of Reuben under a red R.",
    "imageService": "https://digi.ub.uni-heidelberg.de/iiif/2/mzstb_hs_i_30%3Amzstb_hs_i_30_162r.jpg",
    "viewer": "https://digi.ub.uni-heidelberg.de/diglit/mzstb_hs_i_30",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "http://creativecommons.org/publicdomain/mark/1.0/deed.de"
    },
    "region": "pct:0,0,100,91.2"
  },
  "apology-of-aristides": {
    "workId": "apology-of-aristides",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Cod.graec. 41",
    "date": "1549/50 (this part)",
    "place": "",
    "language": "Greek",
    "shows": "Folio 418v, inside the Greek romance of Barlaam and Ioasaph: Nachor rises before the king and the Apology begins, “I, O King, by the providence of God came into the world…”; further down the page is its division of mankind into barbarians, Greeks, Jews and Christians.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00149671_00842",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00149671?page=842",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "decretals": {
    "workId": "decretals",
    "library": "Staatsbibliothek Bamberg (digitised by the Bayerische Staatsbibliothek)",
    "shelfmark": "Msc.Can.4",
    "date": "c. 1020",
    "place": "Milan? (library suggests)",
    "language": "Latin",
    "shows": "Folio 9r: the red heading “Incipiunt decreta pontificum a sancto Clemente usque ad Damasum” and the chapter list of Isidore’s preface, the opening of the Pseudo-Isidorian decretals.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00140699_00021",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00140699?page=21",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "vision-of-paul": {
    "workId": "vision-of-paul",
    "library": "Wissenschaftliche Stadtbibliothek Mainz (digitised by Heidelberg University Library)",
    "shelfmark": "Hs I 144",
    "date": "14th–15th century (composite manuscript)",
    "place": "",
    "language": "Latin",
    "shows": "Folio 93r: “De penis inferni crudelibus” in red, opening a shortened medieval Latin version of the Vision of Paul, “Interrogandum est quis primus rogavit ut animae in inferno requiem haberent…”.",
    "imageService": "https://digi.ub.uni-heidelberg.de/iiif/2/mzstb_hs_i_144%3Amzstb_hs_i_144_093r.jpg",
    "viewer": "https://digi.ub.uni-heidelberg.de/diglit/mzstb_hs_i_144/0205",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "http://creativecommons.org/publicdomain/mark/1.0/deed.de"
    },
    "region": "pct:0,0,100,91.1"
  },
  "athanasius-against-the-heathen": {
    "workId": "athanasius-against-the-heathen",
    "library": "Universitätsbibliothek Basel",
    "shelfmark": "UBH A III 4",
    "date": "13th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 7r: under a red headpiece, the title 'Discourse against the Greeks' by Athanasius, archbishop of Alexandria, and the opening words 'Hē men peri tēs theosebeias...'.",
    "imageService": "https://www.e-manuscripta.ch/i3f/v20/4730914",
    "viewer": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897"
    }
  },
  "encyclical-letter-to-bishops-throughout-the-world": {
    "workId": "encyclical-letter-to-bishops-throughout-the-world",
    "library": "Universitätsbibliothek Basel",
    "shelfmark": "UBH A III 4",
    "date": "13th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 167r: near the foot of the page, the title and opening lines of the Encyclical Letter, which runs on overleaf.",
    "imageService": "https://www.e-manuscripta.ch/i3f/v20/4731234",
    "viewer": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897"
    }
  },
  "defense-against-the-arians-apologia-contra-arianos": {
    "workId": "defense-against-the-arians-apologia-contra-arianos",
    "library": "Universitätsbibliothek Basel",
    "shelfmark": "UBH A III 4",
    "date": "13th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 346v: low on the page, the red title 'Of the same, second apology', and the opening of the Defence against the Arians.",
    "imageService": "https://www.e-manuscripta.ch/i3f/v20/4731593",
    "viewer": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897"
    }
  },
  "defense-before-constantius-apologia-ad-constantium": {
    "workId": "defense-before-constantius-apologia-ad-constantium",
    "library": "Universitätsbibliothek Basel",
    "shelfmark": "UBH A III 4",
    "date": "13th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 436r: halfway down, the red title 'Of the same Athanasius, archbishop of Alexandria, apology to the emperor Constantius', and its opening.",
    "imageService": "https://www.e-manuscripta.ch/i3f/v20/4731770",
    "viewer": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897"
    }
  },
  "defense-of-his-flight-apologia-de-fuga": {
    "workId": "defense-of-his-flight-apologia-de-fuga",
    "library": "Universitätsbibliothek Basel",
    "shelfmark": "UBH A III 4",
    "date": "13th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 339v: the red title of Athanasius' defence of his flight and the opening 'I hear that Leontius, now at Antioch...'.",
    "imageService": "https://www.e-manuscripta.ch/i3f/v20/4731579",
    "viewer": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897"
    }
  },
  "defense-of-the-nicene-definition-de-decretis": {
    "workId": "defense-of-the-nicene-definition-de-decretis",
    "library": "Universitätsbibliothek Basel",
    "shelfmark": "UBH A III 4",
    "date": "13th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 305v: the red title of the treatise on the Council of Nicaea and its opening 'Kalōs epoiēsas...' ('You did well...').",
    "imageService": "https://www.e-manuscripta.ch/i3f/v20/4731511",
    "viewer": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897"
    }
  },
  "deposition-of-arius": {
    "workId": "deposition-of-arius",
    "library": "Universitätsbibliothek Basel",
    "shelfmark": "UBH A III 4",
    "date": "13th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 330v: at the top, the red title 'Deposition of Arius and those with him, by Alexander archbishop of Alexandria', with Alexander's letters following below.",
    "imageService": "https://www.e-manuscripta.ch/i3f/v20/4731561",
    "viewer": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897"
    }
  },
  "four-discourses-against-the-arians": {
    "workId": "four-discourses-against-the-arians",
    "library": "Universitätsbibliothek Basel",
    "shelfmark": "UBH A III 4",
    "date": "13th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 78r: the red title 'Of the same, against the Arians, first discourse', and the opening 'Hai men haireseis...' under a red initial.",
    "imageService": "https://www.e-manuscripta.ch/i3f/v20/4731056",
    "viewer": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897"
    }
  },
  "festal-letters-and-index": {
    "workId": "festal-letters-and-index",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Cod.graec. 45",
    "date": "about 1550",
    "place": "",
    "language": "Greek",
    "shows": "Folio 293r: an excerpt from Festal Letter 39, the passage on the canonical books, copied in a canon-law collection; this is not the full set of Festal Letters (black-and-white microfilm scan).",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00130810_00585",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00130810?page=585",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "fourth-discourse-against-the-arians": {
    "workId": "fourth-discourse-against-the-arians",
    "library": "Universitätsbibliothek Basel",
    "shelfmark": "UBH A III 4",
    "date": "13th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 264r: the red title 'Of the same holy Athanasius, archbishop of Alexandria, against the Arians, discourse 4', and its opening.",
    "imageService": "https://www.e-manuscripta.ch/i3f/v20/4731428",
    "viewer": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897"
    }
  },
  "history-of-the-arians-historia-arianorum": {
    "workId": "history-of-the-arians-historia-arianorum",
    "library": "Universitätsbibliothek Basel",
    "shelfmark": "UBH A III 4",
    "date": "13th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 385r, where the library's catalogue begins the History of the Arians: a red heading addressed to those everywhere who live the solitary life, then the text under a red initial.",
    "imageService": "https://www.e-manuscripta.ch/i3f/v20/4731668",
    "viewer": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897"
    }
  },
  "letter-of-eusebius-on-the-council-of-nicaea": {
    "workId": "letter-of-eusebius-on-the-council-of-nicaea",
    "library": "Universitätsbibliothek Basel",
    "shelfmark": "UBH A III 4",
    "date": "13th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 320r: under a red headpiece, the title of Eusebius of Caesarea's letter to his own church, and its opening.",
    "imageService": "https://www.e-manuscripta.ch/i3f/v20/4731540",
    "viewer": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897"
    }
  },
  "letter-to-adelphius": {
    "workId": "letter-to-adelphius",
    "library": "Universitätsbibliothek Basel",
    "shelfmark": "UBH A III 4",
    "date": "13th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 231v: the title of the letter to Adelphius, bishop and confessor, against the Arians, and its opening 'Enetychomen...' ('We have read...').",
    "imageService": "https://www.e-manuscripta.ch/i3f/v20/4731363",
    "viewer": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897"
    }
  },
  "letter-to-amun": {
    "workId": "letter-to-amun",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Cod.graec. 45",
    "date": "about 1550",
    "place": "",
    "language": "Greek",
    "shows": "Folio 288v of a canon-law collection with Balsamon's commentary: the title 'Letter of the great Athanasius to Amun' stands at the foot of the page, the letter following overleaf (black-and-white microfilm scan).",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00130810_00576",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00130810?page=576",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "letter-to-dracontius": {
    "workId": "letter-to-dracontius",
    "library": "Universitätsbibliothek Basel",
    "shelfmark": "UBH A III 4",
    "date": "13th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 449r: the red title 'Of the same Athanasius, letter to Dracontius', and the opening 'Aporō ti grapsō...' ('I am at a loss what to write...').",
    "imageService": "https://www.e-manuscripta.ch/i3f/v20/4731796",
    "viewer": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897"
    }
  },
  "letter-to-epictetus": {
    "workId": "letter-to-epictetus",
    "library": "Universitätsbibliothek Basel",
    "shelfmark": "UBH A III 4",
    "date": "13th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 186v: the title 'Of the same, to Epictetus bishop of Corinth, against heretics', with the letter's opening under a large red initial.",
    "imageService": "https://www.e-manuscripta.ch/i3f/v20/4731273",
    "viewer": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897"
    }
  },
  "letter-to-john-and-antiochus": {
    "workId": "letter-to-john-and-antiochus",
    "library": "Universitätsbibliothek Basel",
    "shelfmark": "UBH A III 4",
    "date": "13th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 448v: at the top, the red title of the letter to the priests John and Antiochus and its greeting; the letter to Palladius starts lower on the same page.",
    "imageService": "https://www.e-manuscripta.ch/i3f/v20/4731795",
    "viewer": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897"
    }
  },
  "letter-to-maximus": {
    "workId": "letter-to-maximus",
    "library": "Universitätsbibliothek Basel",
    "shelfmark": "UBH A III 4",
    "date": "13th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 298r: the red title 'Letter of the same Athanasius to Maximus the philosopher', the greeting, and the letter's opening.",
    "imageService": "https://www.e-manuscripta.ch/i3f/v20/4731496",
    "viewer": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897"
    }
  },
  "letter-to-palladius": {
    "workId": "letter-to-palladius",
    "library": "Universitätsbibliothek Basel",
    "shelfmark": "UBH A III 4",
    "date": "13th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 448v: in the lower half, the red title 'Of the same Athanasius, to Palladius the priest' and the start of the letter (the letter to John and Antiochus fills the top of the page).",
    "imageService": "https://www.e-manuscripta.ch/i3f/v20/4731795",
    "viewer": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897"
    }
  },
  "letter-to-rufinianus": {
    "workId": "letter-to-rufinianus",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Cod.graec. 45",
    "date": "about 1550",
    "place": "",
    "language": "Greek",
    "shows": "Folio 294v, where the letter begins under the title 'Letter of the same to Rufinianus, bishop', in a canon-law collection (black-and-white microfilm scan).",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00130810_00588",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00130810?page=588",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "letter-to-serapion-on-the-death-of-arius": {
    "workId": "letter-to-serapion-on-the-death-of-arius",
    "library": "Universitätsbibliothek Basel",
    "shelfmark": "UBH A III 4",
    "date": "13th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 383v: in the lower half, the greeting 'Athanasius to Serapion, brother and fellow minister, greeting in the Lord' and the start of the letter.",
    "imageService": "https://www.e-manuscripta.ch/i3f/v20/4731665",
    "viewer": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897"
    }
  },
  "letter-to-the-emperor-jovian": {
    "workId": "letter-to-the-emperor-jovian",
    "library": "Universitätsbibliothek Basel",
    "shelfmark": "UBH A III 4",
    "date": "13th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 457r: halfway down, the red title 'Of the same, to Jovian, on the faith', and the opening 'Prepousa theophilei basilei...'.",
    "imageService": "https://www.e-manuscripta.ch/i3f/v20/4731810",
    "viewer": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897"
    }
  },
  "life-of-antony": {
    "workId": "life-of-antony",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Cod.graec. 155",
    "date": "first half of the 14th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 118r: under a red headpiece, the title 'Life and conduct of our holy father Antony the Great' and the opening 'Agathēn hamillan enestēsasthe...' ('You have entered on a noble rivalry...').",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00064978_00241",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00064978?page=241",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "on-luke-x-22-in-illud-omnia-mihi-tradita-sunt": {
    "workId": "on-luke-x-22-in-illud-omnia-mihi-tradita-sunt",
    "library": "Universitätsbibliothek Basel",
    "shelfmark": "UBH A III 4",
    "date": "13th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 275r: low on the page, the red title quoting 'All things were delivered unto me by my Father...' and the start of the treatise.",
    "imageService": "https://www.e-manuscripta.ch/i3f/v20/4731450",
    "viewer": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897"
    }
  },
  "on-the-councils-of-ariminum-and-seleucia-de-synodis": {
    "workId": "on-the-councils-of-ariminum-and-seleucia-de-synodis",
    "library": "Universitätsbibliothek Basel",
    "shelfmark": "UBH A III 4",
    "date": "13th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 410v: the red title 'Letter of the same holy Athanasius on what was done at Ariminum and at Seleucia', and the start of the text.",
    "imageService": "https://www.e-manuscripta.ch/i3f/v20/4731719",
    "viewer": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897"
    }
  },
  "on-the-incarnation-of-the-word": {
    "workId": "on-the-incarnation-of-the-word",
    "library": "Universitätsbibliothek Basel",
    "shelfmark": "UBH A III 4",
    "date": "13th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 29r, where On the Incarnation begins under its red title, 'Discourse of the same on the becoming-man of the Word and his appearing to us through a body'.",
    "imageService": "https://www.e-manuscripta.ch/i3f/v20/4730958",
    "viewer": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897"
    }
  },
  "on-the-opinion-of-dionysius-de-sententia-dionysii": {
    "workId": "on-the-opinion-of-dionysius-de-sententia-dionysii",
    "library": "Universitätsbibliothek Basel",
    "shelfmark": "UBH A III 4",
    "date": "13th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 321v: the red title 'Of blessed Athanasius, on Dionysius bishop of Alexandria, that he too thought against the Arian heresy...', and the opening.",
    "imageService": "https://www.e-manuscripta.ch/i3f/v20/4731543",
    "viewer": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897"
    }
  },
  "statement-of-faith": {
    "workId": "statement-of-faith",
    "library": "Universitätsbibliothek Basel",
    "shelfmark": "UBH A III 4",
    "date": "13th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 285v: the red title 'Of our holy father Athanasius, Exposition of faith', and the opening 'We believe in one unbegotten God, Father Almighty...'. The library's catalogue lists the piece as pseudo-Athanasian.",
    "imageService": "https://www.e-manuscripta.ch/i3f/v20/4731471",
    "viewer": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897"
    }
  },
  "to-the-bishops-of-africa-ad-afros-epistola-synodica": {
    "workId": "to-the-bishops-of-africa-ad-afros-epistola-synodica",
    "library": "Universitätsbibliothek Basel",
    "shelfmark": "UBH A III 4",
    "date": "13th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 451v: near the foot, the red title naming the ninety bishops of Egypt and Libya and blessed Athanasius, and the opening of the synodal letter to the Africans.",
    "imageService": "https://www.e-manuscripta.ch/i3f/v20/4731801",
    "viewer": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897"
    }
  },
  "to-the-bishops-of-egypt-and-libya": {
    "workId": "to-the-bishops-of-egypt-and-libya",
    "library": "Universitätsbibliothek Basel",
    "shelfmark": "UBH A III 4",
    "date": "13th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 68r: lower on the page, the red title 'Encyclical letter of the same to the bishops of Egypt and Libya, against the Arians', and the opening under a large red initial.",
    "imageService": "https://www.e-manuscripta.ch/i3f/v20/4731036",
    "viewer": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897"
    }
  },
  "tome-or-synodal-letter-to-the-people-of-antioch": {
    "workId": "tome-or-synodal-letter-to-the-people-of-antioch",
    "library": "Universitätsbibliothek Basel",
    "shelfmark": "UBH A III 4",
    "date": "13th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 287r: the red title 'The Tome to the Antiochenes of Athanasius, archbishop of Alexandria', and the greeting under a red initial.",
    "imageService": "https://www.e-manuscripta.ch/i3f/v20/4731474",
    "viewer": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://www.e-manuscripta.ch/bau/content/titleinfo/4730897"
    }
  },
  "plea-for-the-christians": {
    "workId": "plea-for-the-christians",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Cod.graec. 81",
    "date": "c. 1550",
    "place": "",
    "language": "Greek",
    "shows": "Folio 459r: the red title “Athenagoras of Athens, Christian philosopher, Embassy for the Christians” and the opening address “To the Emperors Marcus Aurelius Antoninus and Lucius Aurelius Commodus…”.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00083419_00937",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00083419?page=937",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "expositions-on-the-psalms": {
    "workId": "expositions-on-the-psalms",
    "library": "Stadtbibliothek Schaffhausen, Ministerialbibliothek (via e-codices)",
    "shelfmark": "Min. 15",
    "date": "around 1100",
    "place": "Allerheiligen Abbey, Schaffhausen",
    "language": "Latin",
    "shows": "Folio 3r: the exposition of Psalm 1 opens under a huge red pen-drawn interlace initial B, with the psalm verse in red and black display capitals, \"Beatus vir qui non abiit in consilio impiorum\", followed by Augustine's first words \"De domino nostro Iesu Christo\".",
    "imageService": "https://media.e-codices.ch/iip/sbs/sbs-min0015/sbs-min0015_003r.jp2",
    "viewer": "https://www.e-codices.unifr.ch/en/list/one/sbs/min0015",
    "rights": {
      "label": "CC0 1.0 (Public Domain Dedication)",
      "href": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
    }
  },
  "homilies-on-the-first-epistle-of-john": {
    "workId": "homilies-on-the-first-epistle-of-john",
    "library": "Badische Landesbibliothek, Karlsruhe",
    "shelfmark": "Cod. Aug. perg. 227",
    "date": "9th century",
    "place": "",
    "language": "Latin",
    "shows": "Folio 1v: the red heading \"Incipiunt omeliae beati Augustini episcopi in epistolas sancti Iohannis apostoli numero decim\" and the first homily, \"Meminit sanctitas vestra evangelium secundum Iohannem ex ordine lectionum nos solere tractare\".",
    "imageService": "https://digital.blb-karlsruhe.de/i3f/v20/3497953",
    "viewer": "https://digital.blb-karlsruhe.de/blbhs/content/titleinfo/3492539",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://digital.blb-karlsruhe.de/blbhs/content/titleinfo/3492539"
    },
    "region": "pct:0,0,100,94.2"
  },
  "homilies-on-the-gospel-of-john": {
    "workId": "homilies-on-the-gospel-of-john",
    "library": "Stadtbibliothek Schaffhausen, Ministerialbibliothek (via e-codices)",
    "shelfmark": "Min. 18",
    "date": "1080-1096",
    "place": "Allerheiligen Abbey, Schaffhausen",
    "language": "Latin",
    "shows": "Folio 2v: a framed page in gold and colour on a purple-red ground with a tall interlaced initial I, opening the first tractate in gold capitals: \"Intuentes quod modo audivimus ex lectione apostolica, quod animalis homo non percipit...\".",
    "imageService": "https://media.e-codices.ch/iip/sbs/sbs-min0018/sbs-min0018_002v.jp2",
    "viewer": "https://www.e-codices.unifr.ch/en/list/one/sbs/min0018",
    "rights": {
      "label": "CC0 1.0 (Public Domain Dedication)",
      "href": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
    }
  },
  "augustine-letters": {
    "workId": "augustine-letters",
    "library": "Stadtbibliothek Schaffhausen, Ministerialbibliothek (via e-codices)",
    "shelfmark": "Min. 35",
    "date": "1080-1096",
    "place": "Allerheiligen Abbey, Schaffhausen",
    "language": "Latin",
    "shows": "Folio 2r: the start of a collection of about thirty of Augustine's letters, under a 13-line red pen-drawn initial D, \"Domino beatissimo\" (the greeting of Letter 21 to Bishop Valerius).",
    "imageService": "https://media.e-codices.ch/iip/sbs/sbs-min0035/sbs-min0035_002r.jp2",
    "viewer": "https://www.e-codices.unifr.ch/en/list/one/sbs/min0035",
    "rights": {
      "label": "CC0 1.0 (Public Domain Dedication)",
      "href": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
    }
  },
  "of-holy-virginity": {
    "workId": "of-holy-virginity",
    "library": "Universitätsbibliothek Heidelberg",
    "shelfmark": "Cod. Sal. IX,34",
    "date": "1287",
    "place": "Salem, Germany",
    "language": "Latin",
    "shows": "Folio 91r: the opening under a red pen-drawn initial L, \"Librum de bono coniugali nuper edidimus\" (we lately published a book on the good of marriage).",
    "imageService": "https://digi.ub.uni-heidelberg.de/iiif/2/salIX34%3A091r.jpg",
    "viewer": "https://digi.ub.uni-heidelberg.de/diglit/salIX34",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "http://creativecommons.org/publicdomain/mark/1.0/deed.de"
    },
    "region": "pct:0,0,100,90.9"
  },
  "of-the-morals-of-the-catholic-church": {
    "workId": "of-the-morals-of-the-catholic-church",
    "library": "Stadtbibliothek Schaffhausen, Ministerialbibliothek (via e-codices)",
    "shelfmark": "Min. 35",
    "date": "1080-1096",
    "place": "Allerheiligen Abbey, Schaffhausen",
    "language": "Latin",
    "shows": "Folio 50v: the end of the letter collection, then the red display heading \"Incipit liber sancti Augustini de moribus sanctae ecclesiae catholicae\"; the text begins overleaf, \"In aliis libris\".",
    "imageService": "https://media.e-codices.ch/iip/sbs/sbs-min0035/sbs-min0035_050v.jp2",
    "viewer": "https://www.e-codices.unifr.ch/en/list/one/sbs/min0035",
    "rights": {
      "label": "CC0 1.0 (Public Domain Dedication)",
      "href": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
    }
  },
  "of-the-work-of-monks": {
    "workId": "of-the-work-of-monks",
    "library": "Stadtbibliothek Schaffhausen, Ministerialbibliothek (via e-codices)",
    "shelfmark": "Min. 31",
    "date": "1080-1096",
    "place": "Allerheiligen Abbey, Schaffhausen",
    "language": "Latin",
    "shows": "Folio 36v: the prologue from Augustine's Retractations, then the red heading \"Incipit liber beati Augustini de opere monachorum\" and the opening \"Iussioni tuae\" under a tall red initial I.",
    "imageService": "https://media.e-codices.ch/iip/sbs/sbs-min0031/sbs-min0031_036v.jp2",
    "viewer": "https://www.e-codices.unifr.ch/en/list/one/sbs/min0031",
    "rights": {
      "label": "CC0 1.0 (Public Domain Dedication)",
      "href": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
    }
  },
  "on-care-to-be-had-for-the-dead": {
    "workId": "on-care-to-be-had-for-the-dead",
    "library": "Badische Landesbibliothek, Karlsruhe",
    "shelfmark": "Cod. Aug. perg. 95",
    "date": "10th century",
    "place": "Reichenau (provenance)",
    "language": "Latin",
    "shows": "Folio 62v: the red heading \"Incipit liber sancti Augustini ad Paulinum\" and the opening under a red initial D, \"Diu sanctitati tuae, coepiscope venerande Pauline, rescriptorum debitor fui\".",
    "imageService": "https://digital.blb-karlsruhe.de/i3f/v20/3493340",
    "viewer": "https://digital.blb-karlsruhe.de/blbhs/content/titleinfo/3481864",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://digital.blb-karlsruhe.de/blbhs/content/titleinfo/3481864"
    },
    "region": "pct:0,0,100,93.6"
  },
  "on-christian-doctrine": {
    "workId": "on-christian-doctrine",
    "library": "Stadtbibliothek Schaffhausen, Ministerialbibliothek (via e-codices)",
    "shelfmark": "Min. 27",
    "date": "1080-1096",
    "place": "Allerheiligen Abbey, Schaffhausen",
    "language": "Latin",
    "shows": "Folio 1r: the opening page in large red and black display capitals, \"Aurelii Augustini de doctrina christiana libri quatuor\".",
    "imageService": "https://media.e-codices.ch/iip/sbs/sbs-min0027/sbs-min0027_001r.jp2",
    "viewer": "https://www.e-codices.unifr.ch/en/list/one/sbs/min0027",
    "rights": {
      "label": "CC0 1.0 (Public Domain Dedication)",
      "href": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
    }
  },
  "on-lying": {
    "workId": "on-lying",
    "library": "Stadtbibliothek Schaffhausen, Ministerialbibliothek (via e-codices)",
    "shelfmark": "Min. 33",
    "date": "about 1100",
    "place": "Allerheiligen Abbey, Schaffhausen",
    "language": "Latin",
    "shows": "Folio 35r: the red heading \"Incipit liber eiusdem de mendacio\" and the opening under a large red scroll initial M, \"Magna quaestio est de mendacio\".",
    "imageService": "https://media.e-codices.ch/iip/sbs/sbs-min0033/sbs-min0033_035r.jp2",
    "viewer": "https://www.e-codices.unifr.ch/en/list/one/sbs/min0033",
    "rights": {
      "label": "CC0 1.0 (Public Domain Dedication)",
      "href": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
    }
  },
  "on-the-gift-of-perseverance": {
    "workId": "on-the-gift-of-perseverance",
    "library": "Stadtbibliothek Schaffhausen, Ministerialbibliothek (via e-codices)",
    "shelfmark": "Min. 29",
    "date": "1080-1096",
    "place": "Schaffhausen, Allerheiligen",
    "language": "Latin",
    "shows": "Folio 29r: a page of On the Gift of Perseverance, copied here as the second book after On the Predestination of the Saints; the opening of this work is lost in this manuscript (two bifolia are missing).",
    "imageService": "https://media.e-codices.ch/iip/sbs/sbs-min0029/sbs-min0029_029r.jp2",
    "viewer": "https://www.e-codices.unifr.ch/en/list/one/sbs/min0029",
    "rights": {
      "label": "CC0 1.0 (Public Domain Dedication)",
      "href": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
    }
  },
  "on-the-good-of-marriage": {
    "workId": "on-the-good-of-marriage",
    "library": "Stadtbibliothek Schaffhausen, Ministerialbibliothek (via e-codices)",
    "shelfmark": "Min. 31",
    "date": "1080-1096",
    "place": "Allerheiligen Abbey, Schaffhausen",
    "language": "Latin",
    "shows": "Folio 3v: the red heading \"Augustinus de bono coniugali\" and the opening under a red pen-drawn scroll initial, \"Quoniam unusquisque homo humani generis pars est\".",
    "imageService": "https://media.e-codices.ch/iip/sbs/sbs-min0031/sbs-min0031_003v.jp2",
    "viewer": "https://www.e-codices.unifr.ch/en/list/one/sbs/min0031",
    "rights": {
      "label": "CC0 1.0 (Public Domain Dedication)",
      "href": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
    }
  },
  "on-the-good-of-widowhood": {
    "workId": "on-the-good-of-widowhood",
    "library": "Stadtbibliothek Schaffhausen, Ministerialbibliothek (via e-codices)",
    "shelfmark": "Min. 31",
    "date": "1080-1096",
    "place": "Allerheiligen Abbey, Schaffhausen",
    "language": "Latin",
    "shows": "Folio 21v: the end of On the Good of Marriage, then the red heading \"Augustinus de bono viduali\" with a red initial A and the opening greeting \"Augustinus episcopus servus Christi servorumque Christi religiosae famulae Dei Iulianae\".",
    "imageService": "https://media.e-codices.ch/iip/sbs/sbs-min0031/sbs-min0031_021v.jp2",
    "viewer": "https://www.e-codices.unifr.ch/en/list/one/sbs/min0031",
    "rights": {
      "label": "CC0 1.0 (Public Domain Dedication)",
      "href": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
    }
  },
  "on-the-holy-trinity": {
    "workId": "on-the-holy-trinity",
    "library": "Beinecke Rare Book and Manuscript Library, Yale University",
    "shelfmark": "Beinecke MS 481.20",
    "date": "second half of the 10th century",
    "place": "Southern Germany",
    "language": "Latin",
    "shows": "Folio 1v: the end of Augustine's covering letter to Aurelius, then the heading \"Incipiunt libri trinitatis\" and the opening of Book I, \"Lecturus haec quae de trinitate disserimus\", under a pen-drawn initial L ending in a bird's head.",
    "imageService": "https://collections.library.yale.edu/iiif/2/1015991",
    "viewer": "https://collections.library.yale.edu/catalog/2003601",
    "rights": {
      "label": "Public-domain work; Yale's open-access policy allows any use of its images of such works (the IIIF manifest itself carries only a general copyright caution)",
      "href": "https://guides.library.yale.edu/openaccess"
    }
  },
  "on-the-merits-and-forgiveness-of-sins": {
    "workId": "on-the-merits-and-forgiveness-of-sins",
    "library": "Badische Landesbibliothek, Karlsruhe",
    "shelfmark": "Cod. Aug. perg. 95",
    "date": "10th century",
    "place": "Reichenau (provenance)",
    "language": "Latin",
    "shows": "Folio 2r: the opening of Book I under a large red initial Q, \"Quamvis in mediis et magnis curarum aestibus\", addressed to \"Marcelline carissime\".",
    "imageService": "https://digital.blb-karlsruhe.de/i3f/v20/3493219",
    "viewer": "https://digital.blb-karlsruhe.de/blbhs/content/titleinfo/3481864",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://digital.blb-karlsruhe.de/blbhs/content/titleinfo/3481864"
    },
    "region": "pct:0,0,100,93.6"
  },
  "on-the-perfection-of-mans-righteousness": {
    "workId": "on-the-perfection-of-mans-righteousness",
    "library": "Universitätsbibliothek Heidelberg",
    "shelfmark": "Cod. Sal. IX,34",
    "date": "1287",
    "place": "Salem, Germany",
    "language": "Latin",
    "shows": "Folio 175v, right column: the end of On True Religion, then the red heading for the letter to Eutropius and Paulus on the perfection of righteousness and its opening, \"Sanctis fratribus et coepiscopis Eutropio et Paulo Augustinus\", under a painted initial S.",
    "imageService": "https://digi.ub.uni-heidelberg.de/iiif/2/salIX34%3A175v.jpg",
    "viewer": "https://digi.ub.uni-heidelberg.de/diglit/salIX34",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "http://creativecommons.org/publicdomain/mark/1.0/deed.de"
    },
    "region": "pct:0,0,100,90.9"
  },
  "on-the-predestination-of-the-saints": {
    "workId": "on-the-predestination-of-the-saints",
    "library": "Stadtbibliothek Schaffhausen, Ministerialbibliothek (via e-codices)",
    "shelfmark": "Min. 29",
    "date": "1080-1096",
    "place": "Schaffhausen, Allerheiligen",
    "language": "Latin",
    "shows": "Folio 3v: the opening of the text under a large red pen-drawn scroll initial D, \"Dixisse quidem apostolum...\"; the facing page 3r carries the display title \"Incipit liber I Aurelii Augustini de predestinatione sanctorum\".",
    "imageService": "https://media.e-codices.ch/iip/sbs/sbs-min0029/sbs-min0029_003v.jp2",
    "viewer": "https://www.e-codices.unifr.ch/en/list/one/sbs/min0029",
    "rights": {
      "label": "CC0 1.0 (Public Domain Dedication)",
      "href": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
    }
  },
  "on-the-soul-and-its-origin": {
    "workId": "on-the-soul-and-its-origin",
    "library": "Stadtbibliothek Schaffhausen, Ministerialbibliothek (via e-codices)",
    "shelfmark": "Min. 36",
    "date": "1080-1096",
    "place": "Allerheiligen Abbey, Schaffhausen",
    "language": "Latin",
    "shows": "Folio 46r: Augustine's Retractations note on the four books on the soul and its origin, then the red heading for the book to Vincentius Victor and its opening under a red initial Q, \"Quod mihi ad te scribendum putavi\". This manuscript has only the books to Vincentius Victor (Books III-IV).",
    "imageService": "https://media.e-codices.ch/iip/sbs/sbs-min0036/sbs-min0036_046r.jp2",
    "viewer": "https://www.e-codices.unifr.ch/en/list/one/sbs/min0036",
    "rights": {
      "label": "CC0 1.0 (Public Domain Dedication)",
      "href": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
    }
  },
  "on-the-spirit-and-the-letter": {
    "workId": "on-the-spirit-and-the-letter",
    "library": "Badische Landesbibliothek, Karlsruhe",
    "shelfmark": "Cod. Aug. perg. 95",
    "date": "10th century",
    "place": "Reichenau (provenance)",
    "language": "Latin",
    "shows": "Folio 41v: the red heading \"Incipit liber de spiritu et littera Augustini episcopi\" and the opening under a red initial L, \"Lectis opusculis quae ad te nuper elaboravi, fili carissime Marcelline\".",
    "imageService": "https://digital.blb-karlsruhe.de/i3f/v20/3493298",
    "viewer": "https://digital.blb-karlsruhe.de/blbhs/content/titleinfo/3481864",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://digital.blb-karlsruhe.de/blbhs/content/titleinfo/3481864"
    },
    "region": "pct:0,0,100,93.6"
  },
  "sermons-on-selected-lessons-of-the-new-testament": {
    "workId": "sermons-on-selected-lessons-of-the-new-testament",
    "library": "Badische Landesbibliothek, Karlsruhe",
    "shelfmark": "Cod. Aug. perg. 143",
    "date": "10th century",
    "place": "Reichenau (?)",
    "language": "Latin",
    "shows": "Folio 2v: the end of the list of contents, then the first sermon \"de verbis Domini\" under a red initial E, \"Evangelium audivimus et in eo Dominum eos arguentem qui faciem caeli norunt probare\" (Sermon 109 in the Benedictine numbering).",
    "imageService": "https://digital.blb-karlsruhe.de/i3f/v20/1923358",
    "viewer": "https://digital.blb-karlsruhe.de/blbhs/content/titleinfo/1634905",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://digital.blb-karlsruhe.de/blbhs/content/titleinfo/1634905"
    },
    "region": "pct:0,0,100,94.6"
  },
  "soliloquies": {
    "workId": "soliloquies",
    "library": "Badische Landesbibliothek, Karlsruhe",
    "shelfmark": "Cod. Aug. perg. 195",
    "date": "9th century",
    "place": "Reichenau (?)",
    "language": "Latin",
    "shows": "Folio 2r: the opening of Book I under a painted initial V, \"Volventi mihi multa ac varia mecum diu\", followed by Augustine's opening prayer.",
    "imageService": "https://digital.blb-karlsruhe.de/i3f/v20/3301508",
    "viewer": "https://digital.blb-karlsruhe.de/blbhs/content/titleinfo/3298726",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://digital.blb-karlsruhe.de/blbhs/content/titleinfo/3298726"
    },
    "region": "pct:0,0,100,94.6"
  },
  "city-of-god": {
    "workId": "city-of-god",
    "library": "Universitätsbibliothek Heidelberg",
    "shelfmark": "Cod. Sal. X,11",
    "date": "first quarter of the 13th century",
    "place": "Salem, Germany",
    "language": "Latin",
    "shows": "Folio 1r: Augustine's own note on the work from the Retractations (\"Interea cum Roma Gothorum irruptione...\"), then Book I opening, \"Gloriosissimam civitatem Dei\" (the most glorious city of God), under a large painted initial G.",
    "imageService": "https://digi.ub.uni-heidelberg.de/iiif/2/salX11%3A001r.jpg",
    "viewer": "https://digi.ub.uni-heidelberg.de/diglit/salX11",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "http://creativecommons.org/publicdomain/mark/1.0/deed.de"
    },
    "region": "pct:0,0,100,90.9"
  },
  "correction-of-the-donatists": {
    "workId": "correction-of-the-donatists",
    "library": "Kislak Center for Special Collections, University of Pennsylvania Libraries",
    "shelfmark": "Oversize Ms. Codex 708",
    "date": "mid-12th century",
    "place": "Pontigny, France",
    "language": "Latin",
    "shows": "Folio 43r: Augustine's retractation note in red, then the opening of the book under a red initial: \"Laudo et gratulor et ammiror, fili dilectissime Bonifaci\" (I praise and congratulate and admire you, my dearest son Boniface).",
    "imageService": "https://iiif-images.library.upenn.edu/iiif/2/747095f4-e491-4ee3-86df-18764757a13a",
    "viewer": "https://digitalcollections.library.upenn.edu/items/d4880cc7-401e-468b-9e32-6372c4bd3129",
    "rights": {
      "label": "No Copyright – United States (rightsstatements.org NoC-US)",
      "href": "http://rightsstatements.org/vocab/NoC-US/1.0/"
    }
  },
  "harmony-of-the-gospels": {
    "workId": "harmony-of-the-gospels",
    "library": "Badische Landesbibliothek, Karlsruhe",
    "shelfmark": "Cod. Aug. perg. 98",
    "date": "first third of the 9th century",
    "place": "",
    "language": "Latin",
    "shows": "Folio 1r: the title in red and black capitals, \"Aurelii Augustini episcopi de consensu evangelistarum incipit liber primus\", and the opening, \"Inter omnes divinas auctoritates quae sanctis litteris continentur, evangelium merito excellit\".",
    "imageService": "https://digital.blb-karlsruhe.de/i3f/v20/10238",
    "viewer": "https://digital.blb-karlsruhe.de/blbhs/content/titleinfo/20662",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://digital.blb-karlsruhe.de/blbhs/content/titleinfo/20662"
    },
    "region": "pct:0,0,100,94.7"
  },
  "against-lying-to-consentius": {
    "workId": "against-lying-to-consentius",
    "library": "Stadtbibliothek Schaffhausen, Ministerialbibliothek (via e-codices)",
    "shelfmark": "Min. 33",
    "date": "about 1100",
    "place": "Allerheiligen Abbey, Schaffhausen",
    "language": "Latin",
    "shows": "Folio 1v: the red heading \"Incipit liber Aurelii Augustini ad Consentium contra mendacium\" and the opening under a red scroll initial M, \"Multa mihi legenda...\".",
    "imageService": "https://media.e-codices.ch/iip/sbs/sbs-min0033/sbs-min0033_001v.jp2",
    "viewer": "https://www.e-codices.unifr.ch/en/list/one/sbs/min0033",
    "rights": {
      "label": "CC0 1.0 (Public Domain Dedication)",
      "href": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
    }
  },
  "address-to-young-men-on-reading-greek-literature-de-legendis-gentilium-libris": {
    "workId": "address-to-young-men-on-reading-greek-literature-de-legendis-gentilium-libris",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Cod.graec. 141",
    "date": "11th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 276r: under a red headpiece, the title 'Homily of the same to the young, on how they might profit from Greek literature' and the opening 'Many things urge me...'.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00054131_00557",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00054131?page=557",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "against-those-who-calumniate-us-as-saying-three-gods-letter-189-to-eustathius": {
    "workId": "against-those-who-calumniate-us-as-saying-three-gods-letter-189-to-eustathius",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Cod.graec. 47",
    "date": "1551",
    "place": "",
    "language": "Greek",
    "shows": "Folio 178r: the text known as Basil's Letter 189, here titled 'Of Gregory bishop of Nyssa, to Eustathius, on the Holy Trinity', with its opening under a large initial (black-and-white microfilm scan).",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00130812_00362",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00130812?page=362",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "homilies-on-the-hexaemeron": {
    "workId": "homilies-on-the-hexaemeron",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Cod.graec. 192",
    "date": "about 1370",
    "place": "",
    "language": "Greek",
    "shows": "Folio 1r: under a red and black headpiece, the red title of the first homily, on 'In the beginning God created the heaven and the earth', and its opening line.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00069340_00005",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00069340?page=5",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "letter-to-his-brother-peter-on-the-difference-between-ousia-and-hypostasis-lette": {
    "workId": "letter-to-his-brother-peter-on-the-difference-between-ousia-and-hypostasis-lette",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Cod.graec. 370",
    "date": "10th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 193v: in a codex of Gregory of Nyssa, the title 'Of the same, to Peter his own brother...'; a marginal note above it records that the piece is Basil's (black-and-white microfilm scan).",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00045505_00390",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00045505?page=390",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "basil-letters": {
    "workId": "basil-letters",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Cod.graec. 497",
    "date": "11th century (BSB dating; some parts 15th century)",
    "place": "",
    "language": "Greek",
    "shows": "Folio 1r: under a pen-drawn headpiece, the start of a collection of Basil's letters, beginning with a numbered list whose first entry is 'To Gregory, his companion'; the ink is faint (black-and-white microfilm scan).",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00109232_00008",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00109232?page=8",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "basil-on-the-holy-spirit": {
    "workId": "basil-on-the-holy-spirit",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Cod.graec. 466",
    "date": "12th/13th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 63r: the title 'Of holy Basil, to Amphilochius bishop of Iconium, on the Holy Spirit, in 30 chapters', followed by the list of chapters (black-and-white microfilm scan).",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00003573_00129",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00003573?page=129",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "conferences": {
    "workId": "conferences",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "BSB Clm 14463",
    "date": "before 1062",
    "place": "Regensburg, St Emmeram",
    "language": "Latin",
    "shows": "Folio 1v: “Incipit praefatio libri huius qui est prima pars collationum”, opening “Debitum quod beatissimo papae Castori…”.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00046444_00004",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00046444?page=4",
    "rights": {
      "label": "Public Domain Mark 1.0 (stated in the MDZ IIIF manifest)",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "institutes-of-the-coenobia": {
    "workId": "institutes-of-the-coenobia",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "BSB Clm 14349",
    "date": "end of the 11th / start of the 12th century",
    "place": "Regensburg, St Emmeram",
    "language": "Latin",
    "shows": "Folio 1v, the preface “Veteris instrumenti narrat historia…”; the scribe's red title calls it “Collationes Cassiani”, but the library catalogues the text as the Institutes.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00046576_00004",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00046576?page=4",
    "rights": {
      "label": "Public Domain Mark 1.0 (stated in the MDZ IIIF manifest)",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "exhortation-to-theodore-after-his-fall": {
    "workId": "exhortation-to-theodore-after-his-fall",
    "library": "Bryn Mawr College Library, Special Collections",
    "shelfmark": "Bryn Mawr College Library MS 18",
    "date": "12th–13th century",
    "place": "England",
    "language": "Latin",
    "shows": "Folio 115r: the heading “Crisostomi de reparatione lapsi” and the opening of the Exhortation in Latin, “Quis dabit capiti meo aquam et oculis meis fontes lacrimarum”.",
    "imageService": "https://iiif.archive.org/image/iiif/3/BMC_MS18%2FBMC_MS18_jp2.zip%2FBMC_MS18_jp2%2FBMC_MS18_0234.jp2",
    "viewer": "https://openn.library.upenn.edu/Data/0003/html/BMC_MS18.html",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "http://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "homilies-on-acts-and-romans": {
    "workId": "homilies-on-acts-and-romans",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "BSB Cod.graec. 457",
    "date": "9th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 1r, the first surviving leaf of the Homilies on Romans (its opening is lost): part of Chrysostom's introduction, where he discusses the order of Paul's letters. The Homilies on Acts are not in this book.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00120086_00009",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00120086?page=9",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "homilies-on-first-and-second-corinthians": {
    "workId": "homilies-on-first-and-second-corinthians",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "BSB Cod.graec. 6",
    "date": "first half of the 11th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 163v: Homily 9 on First Corinthians, copied here as a stand-alone sermon under a painted headpiece and titled “that punishment is eternal, and on the Apostle's words ‘If any man build on this foundation gold, silver, precious stones, wood, hay, stubble’”.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00130794_00329",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00130794?page=329",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "homilies-on-galatians-to-philemon": {
    "workId": "homilies-on-galatians-to-philemon",
    "library": "The Library Company of Philadelphia",
    "shelfmark": "Library Company of Philadelphia, MS 1 (“Codex Coxianus”)",
    "date": "first quarter of the 10th century",
    "place": "probably Constantinople",
    "language": "Greek",
    "shows": "Folio 129v: the boxed title of John Chrysostom's commentary on the Letter to the Galatians, the opening verses of Galatians, and the start of his commentary under a large initial Π.",
    "imageService": "https://iiif.archive.org/image/iiif/3/lcp_ms1%2Flcp_ms1_jp2.zip%2Flcp_ms1_jp2%2Flcp_ms1_0261.jp2",
    "viewer": "https://openn.library.upenn.edu/Data/0012/html/lcp_ms01.html",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "http://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "homilies-on-john-and-hebrews": {
    "workId": "homilies-on-john-and-hebrews",
    "library": "Bryn Mawr College Library, Special Collections",
    "shelfmark": "Bryn Mawr College Library MS 12",
    "date": "1462",
    "place": "Rome, Italy",
    "language": "Latin",
    "shows": "Folio 13r: “Omelia I”, the opening of the Homilies on the Gospel of John in Francesco Griffolini's Latin translation, “Qui agonum certamina spectare consueverunt…”, under a large painted initial Q.",
    "imageService": "https://iiif.archive.org/image/iiif/3/BMC_MS12%2FBMC_MS12_jp2.zip%2FBMC_MS12_jp2%2FBMC_MS12_0004.jp2",
    "viewer": "https://openn.library.upenn.edu/Data/0003/html/BMC_MS12.html",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "http://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "homilies-on-matthew": {
    "workId": "homilies-on-matthew",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "BSB Cod.graec. 20",
    "date": "second half of the 11th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 1r: under a red headpiece, the title “Of our father among the saints John, archbishop of Constantinople, Chrysostom: commentary on the holy Matthew the Evangelist”, and the opening of Homily 1, “Ἔδει μὲν ἡμᾶς μηδὲ δεῖσθαι τῆς ἀπὸ τῶν γραμμάτων βοηθείας”.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00069244_00019",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00069244?page=19",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "homilies-on-the-statues": {
    "workId": "homilies-on-the-statues",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "BSB Cod.graec. 349",
    "date": "11th century",
    "place": "",
    "language": "Greek",
    "shows": "The first page of the book: “Homily 1”, its title written inside a large decorated Π-shaped headpiece, opening the series.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00108682_00014",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00108682?page=14",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "homily-against-publishing-the-errors-of-the-brethren": {
    "workId": "homily-against-publishing-the-errors-of-the-brethren",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "BSB Cod.graec. 352",
    "date": "1001",
    "place": "",
    "language": "Greek",
    "shows": "Folio 44v: in the right column, the title “homily on not publishing the sins of the brethren, nor cursing one's enemies” and the opening of the homily under a large initial M.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00109044_00093",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00109044?page=93",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "homily-on-s-babylas": {
    "workId": "homily-on-s-babylas",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "BSB Cod.graec. 31",
    "date": "1546",
    "place": "",
    "language": "Greek",
    "shows": "Folio 230r: under a pen headpiece, the title “Of the same, on the holy hieromartyr Babylas” and the opening of the homily.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00130802_00463",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00130802?page=463",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "homily-on-s-ignatius": {
    "workId": "homily-on-s-ignatius",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "BSB Cod.graec. 31",
    "date": "1546",
    "place": "",
    "language": "Greek",
    "shows": "Folio 307r: after the end of the previous homily, the title of Chrysostom's encomium on the holy hieromartyr Ignatius and the opening of the homily under a decorated initial.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00130802_00617",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00130802?page=617",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "instructions-to-catechumens": {
    "workId": "instructions-to-catechumens",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "BSB Cod.graec. 190",
    "date": "11th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 225v: in the right column, under a red band, the title “first catechesis to those about to be illuminated, and why it is called the laver of regeneration … and that not only perjury but swearing at all is dangerous”, opening the first Instruction.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00072399_00456",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00072399?page=456",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "letter-to-a-young-widow": {
    "workId": "letter-to-a-young-widow",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "BSB Cod.graec. 352",
    "date": "1001",
    "place": "",
    "language": "Greek",
    "shows": "Folio 71r: under a band headpiece, the title “Of the same, discourse to a young widow” and the opening of the letter.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00109044_00146",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00109044?page=146",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "letters-to-olympias": {
    "workId": "letters-to-olympias",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "BSB Cod.graec. 416",
    "date": "13th/14th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 1r: under a pen headpiece, the first letter, addressed “to my lady the most reverend and God-loving deaconess Olympias, John greets you in the Lord”, beginning “Φέρε δή…” (“Come now…”).",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00108696_00005",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00108696?page=5",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "on-the-priesthood": {
    "workId": "on-the-priesthood",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "BSB Cod.graec. 354",
    "date": "10th/11th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 140r: the start of On the Priesthood, marked in the top margin “beginning of the discourses on the priesthood, discourse one”, with the title in the left column after the end of the previous text.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00109045_00282",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00109045?page=282",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "three-homilies-concerning-the-power-of-demons": {
    "workId": "three-homilies-concerning-the-power-of-demons",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "BSB Cod.graec. 6",
    "date": "first half of the 11th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 46v: in the right column, under a painted headpiece, the start of the first homily, titled “against those who say that demons govern human affairs”, beginning “Ἐγὼ μὲν ἤλπιζον…”.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00130794_00095",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00130794?page=95",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "treatise-that-no-one-can-harm-the-man-who-does-not-injure-himself": {
    "workId": "treatise-that-no-one-can-harm-the-man-who-does-not-injure-himself",
    "library": "Kislak Center for Special Collections, University of Pennsylvania Libraries",
    "shelfmark": "Oversize Ms. Codex 712",
    "date": "15th century",
    "place": "Italy",
    "language": "Latin",
    "shows": "Folio 140r: the opening of the treatise in Latin, “Scio quod crassioribus quibusdam…”, under a blue initial S (its title, “Neminem laedi nisi a se ipso”, stands at the foot of the page before).",
    "imageService": "https://iiif-images.library.upenn.edu/iiif/2/00efc4d3-9fbd-4905-b523-b07f85dc09cb",
    "viewer": "https://digitalcollections.library.upenn.edu/items/15fbf5c3-7d23-49af-86d4-1035a0c90f50",
    "rights": {
      "label": "No Copyright – United States (rightsstatements.org NoC-US)",
      "href": "http://rightsstatements.org/vocab/NoC-US/1.0/"
    }
  },
  "exhortation-to-the-heathen": {
    "workId": "exhortation-to-the-heathen",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Cod.graec. 97",
    "date": "c. 1550",
    "place": "",
    "language": "Greek",
    "shows": "Folio 321r: under a drawn headpiece, the title “Clement the Stromatist’s Exhortation to the Greeks” and the opening words “Amphion of Thebes and Arion of Methymna…” (black-and-white scan).",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00130910_00640",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00130910?page=640",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "recognitions-of-clement": {
    "workId": "recognitions-of-clement",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Clm 52",
    "date": "820–840",
    "place": "Regensburg",
    "language": "Latin",
    "shows": "Folio 6r: “Incipit prologus Rufini” in red, and Rufinus’ preface to the Recognitions, “Tibi quidem, papa Gaudenti…”, under a large interlaced T.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00047182_00023",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00047182?page=23",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "instructions-of-commodianus": {
    "workId": "instructions-of-commodianus",
    "library": "Staatsbibliothek zu Berlin – Preußischer Kulturbesitz",
    "shelfmark": "Ms. Phill. 1825",
    "date": "9th century",
    "place": "Angers, France",
    "language": "Latin",
    "shows": "Folio 1v, the start of the Instructions: the red heading PRAEFATIO and the acrostic preface “Praefatio nostra viam erranti demonstrat”, followed by the poems headed Indignatio Dei and Cultura daemonum.",
    "imageService": "https://ngcs-chula.staatsbibliothek-berlin.de/dc/896397998-0008",
    "viewer": "https://digital.staatsbibliothek-berlin.de/werkansicht/?PPN=PPN896397998",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "first-ecumenical-council-nicea-i-325": {
    "workId": "first-ecumenical-council-nicea-i-325",
    "library": "Princeton University Library",
    "shelfmark": "Princeton 31.8 (Scheide Library), Collectio Dionysio-Hadriana",
    "date": "about 900",
    "place": "probably Mainz, Germany",
    "language": "Latin",
    "shows": "Folio 6r: under the red heading “Incipit constitutio et fides Niceni concilii”, the note on when the synod met at Nicaea and the Nicene Creed, “Credimus in unum Deum patrem omnipotentem”.",
    "imageService": "https://iiif-cloud.princeton.edu/iiif/2/25%2Ff1%2Fab%2F25f1abc4291a4f2aa9c34127005598df%2Fintermediate_file",
    "viewer": "https://catalog.princeton.edu/catalog/9935119813506421",
    "rights": {
      "label": "No Known Copyright (rightsstatements.org NKC)",
      "href": "http://rightsstatements.org/vocab/NKC/1.0/"
    }
  },
  "fourth-ecumenical-council-chalcedon-451": {
    "workId": "fourth-ecumenical-council-chalcedon-451",
    "library": "Princeton University Library",
    "shelfmark": "Princeton 31.8 (Scheide Library), Collectio Dionysio-Hadriana",
    "date": "about 900",
    "place": "probably Mainz, Germany",
    "language": "Latin",
    "shows": "Folio 28r: the start of the canons of Chalcedon, headed “Incipiunt regulae ecclesiasticae promulgatae a Calchedonensi sancto concilio numero XXVII”.",
    "imageService": "https://iiif-cloud.princeton.edu/iiif/2/95%2Fc3%2F1e%2F95c31e8763d041b9b28986abac6517f1%2Fintermediate_file",
    "viewer": "https://catalog.princeton.edu/catalog/9935119813506421",
    "rights": {
      "label": "No Known Copyright (rightsstatements.org NKC)",
      "href": "http://rightsstatements.org/vocab/NKC/1.0/"
    }
  },
  "seven-ecumenical-councils": {
    "workId": "seven-ecumenical-councils",
    "library": "Princeton University Library",
    "shelfmark": "Princeton 31.8 (Scheide Library), Collectio Dionysio-Hadriana",
    "date": "about 900",
    "place": "probably Mainz, Germany",
    "language": "Latin",
    "shows": "Folio 1v: the book's table of contents in red, listing the canons of the councils (Nicaea, Constantinople, Chalcedon and Ephesus among them) beside the decrees of the popes.",
    "imageService": "https://iiif-cloud.princeton.edu/iiif/2/c4%2F0b%2Fea%2Fc40bea4d5710460db904f855ff57f066%2Fintermediate_file",
    "viewer": "https://catalog.princeton.edu/catalog/9935119813506421",
    "rights": {
      "label": "No Known Copyright (rightsstatements.org NKC)",
      "href": "http://rightsstatements.org/vocab/NKC/1.0/"
    }
  },
  "second-ecumenical-council-constantinople-i-381": {
    "workId": "second-ecumenical-council-constantinople-i-381",
    "library": "Princeton University Library",
    "shelfmark": "Princeton 31.8 (Scheide Library), Collectio Dionysio-Hadriana",
    "date": "about 900",
    "place": "probably Mainz, Germany",
    "language": "Latin",
    "shows": "Folio 25r: the end of the canons of Laodicea and the start of the canons of Constantinople, headed “Incipiunt regulae Constantinopolitanae … sub Theodosio piissimo imperatore”, beginning with the canon that the faith of Nicaea stand unchanged.",
    "imageService": "https://iiif-cloud.princeton.edu/iiif/2/b6%2F22%2F99%2Fb62299be9552485fb48eec10fb8926db%2Fintermediate_file",
    "viewer": "https://catalog.princeton.edu/catalog/9935119813506421",
    "rights": {
      "label": "No Known Copyright (rightsstatements.org NKC)",
      "href": "http://rightsstatements.org/vocab/NKC/1.0/"
    }
  },
  "seventh-ecumenical-council-nicea-ii-787": {
    "workId": "seventh-ecumenical-council-nicea-ii-787",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "BSB Cod.graec. 46",
    "date": "about 1550",
    "place": "",
    "language": "Greek",
    "shows": "Folio 112r: under a pen headpiece, “Canons of the holy ecumenical seventh synod”, with the note that the seventh synod met at Nicaea in Bithynia under Constantine and Irene against the iconoclasts.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00130811_00225",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00130811?page=225",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "sixth-ecumenical-council-and-trullo-680-692": {
    "workId": "sixth-ecumenical-council-and-trullo-680-692",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "BSB Cod.graec. 186",
    "date": "1446",
    "place": "",
    "language": "Greek",
    "shows": "Folio 131r: under a red headpiece, “Acts of the holy ecumenical sixth synod, volume one”, beginning with the emperor's letter (sacra) to Pope Donus of Rome.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00064998_00267",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00064998?page=267",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "third-ecumenical-council-ephesus-431": {
    "workId": "third-ecumenical-council-ephesus-431",
    "library": "Princeton University Library",
    "shelfmark": "Princeton 31.8 (Scheide Library), Collectio Dionysio-Hadriana",
    "date": "about 900",
    "place": "probably Mainz, Germany",
    "language": "Latin",
    "shows": "Folio 69r: the heading “Incipit synodus Ephesina prima ducentorum episcoporum”, the note that the synod met against Nestorius, and the start of Cyril of Alexandria's synodal letter to Nestorius with the twelve chapters.",
    "imageService": "https://iiif-cloud.princeton.edu/iiif/2/c6%2Fd4%2F6d%2Fc6d46d9d4dac4f789cdc115be6814287%2Fintermediate_file",
    "viewer": "https://catalog.princeton.edu/catalog/9935119813506421",
    "rights": {
      "label": "No Known Copyright (rightsstatements.org NKC)",
      "href": "http://rightsstatements.org/vocab/NKC/1.0/"
    }
  },
  "address-to-demetrianus": {
    "workId": "address-to-demetrianus",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Clm 208",
    "date": "about 800",
    "place": "Saint-Amand, France",
    "language": "Latin",
    "shows": "Folio 45v, where the red capitals close On the Unity of the Church and announce “Incipit ad Demetrianum”, with the opening “Oblatrantem te” under a large decorated initial O.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00024365_00110",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00024365?page=110",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "exhortation-to-martyrdom": {
    "workId": "exhortation-to-martyrdom",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Clm 208",
    "date": "about 800",
    "place": "Saint-Amand, France",
    "language": "Latin",
    "shows": "Folio 80v, where the red heading closes On Jealousy and Envy and announces “XI Incipit ad Fortunatum”, with the opening “Desiderasti, Fortunate carissime” under a decorated initial D.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00024365_00180",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00024365?page=180",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "on-jealousy-and-envy": {
    "workId": "on-jealousy-and-envy",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Clm 208",
    "date": "about 800",
    "place": "Saint-Amand, France",
    "language": "Latin",
    "shows": "Folio 75r, where the red heading “De bono patientiae explicit” is followed by “X Incipit de zelo et livore” and the opening “Zelare quod bonum videas”.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00024365_00169",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00024365?page=169",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "on-works-and-alms": {
    "workId": "on-works-and-alms",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Clm 208",
    "date": "about 800",
    "place": "Saint-Amand, France",
    "language": "Latin",
    "shows": "Folio 60r, where the red capitals “De mortalitate explicit” are followed by “VIII Incipit de opere et elymosinis” and the opening “Multa et magna sunt”.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00024365_00139",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00024365?page=139",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "on-the-advantage-of-patience": {
    "workId": "on-the-advantage-of-patience",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Clm 208",
    "date": "about 800",
    "place": "Saint-Amand, France",
    "language": "Latin",
    "shows": "Folio 68v, where the red capitals close On Works and Alms and announce “VIIII Incipit de bono patientiae”, with the opening words under a decorated initial.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00024365_00156",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00024365?page=156",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "on-the-dress-of-virgins": {
    "workId": "on-the-dress-of-virgins",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Clm 208",
    "date": "about 800",
    "place": "Saint-Amand, France",
    "language": "Latin",
    "shows": "Folio 8r, with the red capital heading “Incipit de habitu et de disciplina virginum” and the first words “Disciplina custos spei” under a decorated initial D.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00024365_00035",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00024365?page=35",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "on-the-lapsed": {
    "workId": "on-the-lapsed",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Clm 208",
    "date": "about 800",
    "place": "Saint-Amand, France",
    "language": "Latin",
    "shows": "Folio 15r, where the red capitals “De habitu et disciplina virginum explicit” are followed by “Incipit de lapsis” and the opening “Pax ecce, dilectissimi fratres” under a large initial P.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00024365_00049",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00024365?page=49",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "on-the-lord-s-prayer": {
    "workId": "on-the-lord-s-prayer",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Clm 208",
    "date": "about 800",
    "place": "Saint-Amand, France",
    "language": "Latin",
    "shows": "Folio 26r, where the red capitals “De lapsis explicit” are followed by “Incipit de dominica oratione” and the opening “Evangelica praecepta” under a large initial E.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00024365_00071",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00024365?page=71",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "on-the-mortality": {
    "workId": "on-the-mortality",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Clm 208",
    "date": "about 800",
    "place": "Saint-Amand, France",
    "language": "Latin",
    "shows": "Folio 53v, where the red capitals “Ad Demetrianum explicit” are followed by “VII Incipit de mortalitate” and the opening words of the treatise.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00024365_00126",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00024365?page=126",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "on-the-unity-of-the-church": {
    "workId": "on-the-unity-of-the-church",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Clm 208",
    "date": "about 800",
    "place": "Saint-Amand, France",
    "language": "Latin",
    "shows": "Folio 36v, with the red capital heading “Incipit de ecclesiae catholicae unitate” and the opening “Cum moneat Dominus” under a large initial C.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00024365_00092",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00024365?page=92",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "on-the-vanity-of-idols": {
    "workId": "on-the-vanity-of-idols",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Clm 208",
    "date": "about 800",
    "place": "Saint-Amand, France",
    "language": "Latin",
    "shows": "Folio 241v, where the red rubric closes the letter to Januarius on baptism and announces “Incipit quod idola dii non sint”, opening “Quod idola dii non sint” under a decorated initial Q.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00024365_00502",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00024365?page=502",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "seventh-council-of-carthage": {
    "workId": "seventh-council-of-carthage",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Clm 208",
    "date": "about 800",
    "place": "Saint-Amand, France",
    "language": "Latin",
    "shows": "Folio 200v, at the foot of the page, where the red capitals introduce the bishops' sentences and the text opens “Cum in unum Carthaginem convenissent”.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00024365_00420",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00024365?page=420",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "epistles-of-cyprian": {
    "workId": "epistles-of-cyprian",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Clm 208",
    "date": "about 800",
    "place": "Saint-Amand, France",
    "language": "Latin",
    "shows": "Folio 134v, where the red heading “Ad Quirinum liber III explicit” is followed by large capitals “Incipit ad Antonianum”, the start of the book's run of Cyprian's letters (Letter 55).",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00024365_00288",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00024365?page=288",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "three-books-of-testimonies-against-the-jews": {
    "workId": "three-books-of-testimonies-against-the-jews",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Clm 208",
    "date": "about 800",
    "place": "Saint-Amand, France",
    "language": "Latin",
    "shows": "Folio 91r, the opening of the preface to the Testimonies, “Cyprianus Quirino filio salutem. Obtemperandum fuit, fili carissime”, under a red initial C.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00024365_00201",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00024365?page=201",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "to-donatus": {
    "workId": "to-donatus",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Clm 208",
    "date": "about 800",
    "place": "Saint-Amand, France",
    "language": "Latin",
    "shows": "Folio 2v, the opening of To Donatus, “Bene admones, Donate carissime”, under a large red initial B; the book's first work after its list of contents.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00024365_00024",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00024365?page=24",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "treatises-of-questionable-authority": {
    "workId": "treatises-of-questionable-authority",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Clm 208",
    "date": "about 800",
    "place": "Saint-Amand, France",
    "language": "Latin",
    "shows": "Folio 167r, where the red capitals “Adversus aleatores explicit. Incipit de laude martyrii” introduce On the Glory of Martyrdom, opening “Etsi incongruens est, fratres carissimi”.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00024365_00353",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00024365?page=353",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "catechetical-lectures": {
    "workId": "catechetical-lectures",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Cod.graec. 278",
    "date": "16th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 1r: the title 'Catecheses of Cyril to those being enlightened' and the start of the first catechesis, 'Kainēs diathēkēs mathētai...' (black-and-white microfilm scan).",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00049964_00008",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00049964?page=8",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "church-history": {
    "workId": "church-history",
    "library": "Beinecke Rare Book and Manuscript Library, Yale University",
    "shelfmark": "Beinecke Marston MS 11",
    "date": "ca. 1250",
    "place": "Germany (presumably the Premonstratensian abbey of St. Peter at Weissenau)",
    "language": "Latin",
    "shows": "Folio 3v: the chapter list of Book I ends and, under the rubric “Incipit liber primus”, the text begins with a large red S: “Successiones sanctorum apostolorum”, in Rufinus's Latin translation.",
    "imageService": "https://collections.library.yale.edu/iiif/2/11395478",
    "viewer": "https://collections.library.yale.edu/catalog/10269809",
    "rights": {
      "label": "Public-domain work; Yale's open-access policy allows any use of its images of such works (the IIIF manifest itself carries only a general copyright caution)",
      "href": "https://guides.library.yale.edu/openaccess"
    }
  },
  "lives-of-illustrious-men": {
    "workId": "lives-of-illustrious-men",
    "library": "Staatsbibliothek Bamberg (digitised by the Bayerische Staatsbibliothek / MDZ)",
    "shelfmark": "Staatsbibliothek Bamberg, Msc.Patr.87",
    "date": "after 540",
    "place": "Castellum Lucullanum near Naples (scriptorium of Eugippius)",
    "language": "Latin",
    "shows": "Folio 33v: “Huc usque Hieronymus; abhinc Gennadius presbyter Massiliensis ecclesiae subrogavit”, then Gennadius' first entry, on James of Nisibis.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00140814_00070",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00140814?page=70",
    "rights": {
      "label": "Public Domain Mark 1.0 (stated in the MDZ IIIF manifest)",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "selected-epistles": {
    "workId": "selected-epistles",
    "library": "The Newberry Library, Chicago",
    "shelfmark": "VAULT oversize box Case MS Fragment 11",
    "date": "850–899",
    "place": "Italy",
    "language": "Latin",
    "shows": "A leaf from the Register of Gregory's letters in Caroline minuscule, with the letters numbered XXV, “Clerus ecclesiae Regitanae…”, and XXVI, “Fraternitatis scripta suscepi…”.",
    "imageService": "https://collections.newberry.org/IIIF3/Image/2KXJ8Z8P4FNID",
    "viewer": "https://collections.newberry.org/asset-management/2KXJ8Z8JMOPTS",
    "rights": {
      "label": "No Copyright – United States; Newberry open access (any lawful purpose, commercial or non-commercial)",
      "href": "https://collections.newberry.org/asset-management/2KXJ8Z8JMOPTS"
    }
  },
  "book-of-pastoral-rule": {
    "workId": "book-of-pastoral-rule",
    "library": "The Newberry Library, Chicago",
    "shelfmark": "Case MS Fragment 9",
    "date": "825–850",
    "place": "Verona, Italy",
    "language": "Latin",
    "shows": "A single leaf of the Pastoral Rule in Caroline minuscule. The library does not say which chapter.",
    "imageService": "https://collections.newberry.org/IIIF3/Image/2KXJ8Z8P4FM25",
    "viewer": "https://collections.newberry.org/asset-management/2KXJ8Z8JM6JHG",
    "rights": {
      "label": "No Copyright – United States; Newberry open access (any lawful purpose, commercial or non-commercial)",
      "href": "https://collections.newberry.org/asset-management/2KXJ8Z8JM6JHG"
    }
  },
  "last-farewell-in-the-presence-of-the-one-hundred-and-fifty-bishops-oration-xlii": {
    "workId": "last-farewell-in-the-presence-of-the-one-hundred-and-fifty-bishops-oration-xlii",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Cod.graec. 125",
    "date": "second half of the 11th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 180r, where Oration 42 begins under the title 'The farewell speech, in the presence of the 150 bishops, in the church'.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00069275_00363",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00069275?page=363",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "funeral-oration-on-the-great-st-basil-oration-xliii": {
    "workId": "funeral-oration-on-the-great-st-basil-oration-xliii",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Cod.graec. 125",
    "date": "second half of the 11th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 82v: under a red headpiece, the red title 'Funeral oration of the same on Basil, bishop of Caesarea in Cappadocia', followed by the opening words 'Emellen ara pollas...'.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00069275_00168",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00069275?page=168",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "in-defence-of-his-flight-to-pontus-oration-ii": {
    "workId": "in-defence-of-his-flight-to-pontus-oration-ii",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Cod.graec. 421",
    "date": "10th/11th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 1r: under a headpiece, the beginning of Oration 2, whose opening words the library's catalogue gives as 'Hēttēmai kai tēn hēttan homologō' ('I have been defeated, and I own my defeat'); the title and first lines are faded (black-and-white microfilm scan).",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00109094_00013",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00109094?page=13",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "letters-on-the-apollinarian-controversy-division-i-letters-101-102-202": {
    "workId": "letters-on-the-apollinarian-controversy-division-i-letters-101-102-202",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Cod.graec. 120",
    "date": "11th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 115v: the red title 'To Cledonius the priest, first letter' (Letter 101) and its greeting, then the opening 'We wish to learn...'.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00069269_00234",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00069269?page=234",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "panegyric-on-st-athanasius-oration-xxi": {
    "workId": "panegyric-on-st-athanasius-oration-xxi",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Cod.graec. 125",
    "date": "second half of the 11th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 218v: the title 'Funeral oration on Athanasius, bishop of Alexandria' and the opening 'In praising Athanasius, I shall praise virtue', under a red initial A.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00069275_00440",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00069275?page=440",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "select-orations": {
    "workId": "select-orations",
    "library": "Princeton University Library",
    "shelfmark": "Princeton MS. 18",
    "date": "11th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 3r: the start of Oration 39, On the Holy Lights.",
    "imageService": "https://iiif-cloud.princeton.edu/iiif/2/4a%2Fa7%2F1b%2F4aa71b3879fc48b88e3259ed99e8f33f%2Fintermediate_file",
    "viewer": "https://catalog.princeton.edu/catalog/99108928183506421",
    "rights": {
      "label": "No Known Copyright (rightsstatements.org NKC)",
      "href": "http://rightsstatements.org/vocab/NKC/1.0/"
    }
  },
  "five-theological-orations-orations-xxvii-xxxi": {
    "workId": "five-theological-orations-orations-xxvii-xxxi",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Cod.graec. 120",
    "date": "11th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 10v: under a red headpiece, the start of Oration 27, the first Theological Oration, 'Against the Eunomians', with its opening words 'My word is against those who are clever in speech'.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00069269_00024",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00069269?page=24",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "against-eunomius-books-i-xii": {
    "workId": "against-eunomius-books-i-xii",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Cod.graec. 92",
    "date": "1551/52",
    "place": "",
    "language": "Greek",
    "shows": "Folio 1r: under a headpiece, the title of the first book against Eunomius and its opening (black-and-white microfilm scan).",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00011281_00004",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00011281?page=4",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "answer-to-eunomius-second-book": {
    "workId": "answer-to-eunomius-second-book",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Cod.graec. 92",
    "date": "1551/52",
    "place": "",
    "language": "Greek",
    "shows": "Folio 282v: the title 'Of the same holy Gregory, refutation of the second book of the impious Eunomius' and the opening (black-and-white microfilm scan).",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00011281_00567",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00011281?page=567",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "funeral-oration-on-meletius": {
    "workId": "funeral-oration-on-meletius",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Cod.graec. 370",
    "date": "10th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 111v: in the right-hand column, the title 'Of the same, funeral oration on the great Meletius, bishop of Antioch', and the opening (black-and-white microfilm scan).",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00045505_00226",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00045505?page=226",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "on-infants-early-deaths-to-hierius": {
    "workId": "on-infants-early-deaths-to-hierius",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Cod.graec. 47",
    "date": "1551",
    "place": "",
    "language": "Greek",
    "shows": "Folio 120r: the title 'Gregory bishop of Nyssa to Hierius, on infants taken away before their time' and the opening 'Soi men, ō ariste...' (black-and-white microfilm scan).",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00130812_00246",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00130812?page=246",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "on-not-three-gods-to-ablabius": {
    "workId": "on-not-three-gods-to-ablabius",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Cod.graec. 370",
    "date": "10th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 182r: in the left-hand column, the title 'Of the same, that one should not think of saying three gods, to Ablabius' (black-and-white microfilm scan).",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00045505_00367",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00045505?page=367",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "on-virginity": {
    "workId": "on-virginity",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Cod.graec. 23",
    "date": "about 1550 (this part 1552)",
    "place": "",
    "language": "Greek",
    "shows": "Folio 69r: under a headpiece, the title of On Virginity ('Letter of the same... on virginity') and the opening 'Ho men skopos tou logou...' (black-and-white microfilm scan).",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00079189_00143",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00079189?page=143",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "on-the-baptism-of-christ-a-sermon-for-the-day-of-the-lights": {
    "workId": "on-the-baptism-of-christ-a-sermon-for-the-day-of-the-lights",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Cod.graec. 370",
    "date": "10th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 55r: in the right-hand column, the title 'Of the same, on holy baptism' and the opening 'Nyn gnōrizō tēn emēn agelēn' ('Now I recognise my own flock') (black-and-white microfilm scan).",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00045505_00113",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00045505?page=113",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "on-the-faith-to-simplicius": {
    "workId": "on-the-faith-to-simplicius",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Cod.graec. 370",
    "date": "10th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 222v: the title 'Of the same, to Simplicius, on the faith' and the opening lines (black-and-white microfilm scan).",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00045505_00446",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00045505?page=446",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "on-the-holy-trinity-and-of-the-godhead-of-the-holy-spirit-to-eustathius": {
    "workId": "on-the-holy-trinity-and-of-the-godhead-of-the-holy-spirit-to-eustathius",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Cod.graec. 370",
    "date": "10th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 174v: the title 'Of the same, to Eustathius, and against the Pneumatomachi, that the Holy Spirit is God', below lines of later notes (black-and-white microfilm scan).",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00045505_00352",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00045505?page=352",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "on-the-making-of-man": {
    "workId": "on-the-making-of-man",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Cod.graec. 192",
    "date": "about 1370",
    "place": "",
    "language": "Greek",
    "shows": "Folio 111v: below a red and black headpiece, the red title of On the Making of Man ('of the blessed Gregory, bishop of Nyssa...'), with the dedication to his brother Peter continuing in the right-hand column.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00069340_00226",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00069340?page=226",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "on-the-soul-and-the-resurrection": {
    "workId": "on-the-soul-and-the-resurrection",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Cod.graec. 192",
    "date": "about 1370",
    "place": "",
    "language": "Greek",
    "shows": "Folio 178r: under a headpiece, the red title 'Dialogue of the same on the soul, with his own sister Macrina', and the opening words about the death of Basil.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00069340_00359",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00069340?page=359",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "great-catechism": {
    "workId": "great-catechism",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Cod.graec. 23",
    "date": "about 1550 (this part 1552)",
    "place": "",
    "language": "Greek",
    "shows": "Folio 107r: under a headpiece, the title 'Of the same, catechetical discourse' and the opening 'Ho tēs katēchēseōs logos...' (black-and-white microfilm scan).",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00079189_00219",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00079189?page=219",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "canonical-epistle": {
    "workId": "canonical-epistle",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "BSB Cod.graec. 380",
    "date": "14th century (?)",
    "place": "",
    "language": "Greek",
    "shows": "Page 319 of a collection of church canons: the heading “Canonical Epistle of St Gregory, bishop of Neocaesarea, the Wonderworker, on those who ate food offered to idols during the barbarian invasion” and its opening “It is not the food that burdens us”, with notes in the margin; photographed from microfilm, in black and white.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00044648_00324",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00044648?page=324",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "declaration-of-faith": {
    "workId": "declaration-of-faith",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "BSB Cod.graec. 509",
    "date": "15th century",
    "place": "",
    "language": "Greek",
    "shows": "Halfway down the page, under “Of the same” (following a heading naming St Gregory the Wonderworker), the creed begins “One God, Father of the living Word, of subsistent Wisdom and Power”; photographed from microfilm, in black and white.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00109239_00373",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00109239?page=373",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "four-homilies": {
    "workId": "four-homilies",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "BSB Cod.graec. 534",
    "date": "15th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 1r: the opening of the Fourth Homily, On the Holy Theophany (“O ye who are the friends of Christ ... and the friends of the brethren”), under a green title that gives it to John Chrysostom; the library's catalogue notes that Fabricius assigns it to Gregory of Neocaesarea.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00004454_00005",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00004454?page=5",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "on-the-subject-of-the-soul": {
    "workId": "on-the-subject-of-the-soul",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "BSB Cod.graec. 478",
    "date": "12th century",
    "place": "",
    "language": "Greek",
    "shows": "Below a dotted band, with “On the soul” noted in the margin, the treatise begins in two columns at “First of all ... by what criterion the soul is apprehended”, without the letter to Tatian and with no author named (the library's record credits Gregory Thaumaturgus); photographed from microfilm, in black and white.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00109224_00581",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00109224?page=581",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "epistle-of-barnabas": {
    "workId": "epistle-of-barnabas",
    "library": "British Library, London",
    "date": "4th century (between about 325 and 375)",
    "place": "Eastern Mediterranean",
    "language": "Greek",
    "rights": {
      "label": "Public domain in most countries other than the UK (British Library usage terms)",
      "href": "https://www.bl.uk/help/how-to-reuse-images-of-unpublished-manuscripts"
    },
    "shelfmark": "Add MS 43725 (Codex Sinaiticus), f. 334r",
    "shows": "Folio 334r of Codex Sinaiticus, the oldest copy of Barnabas: the first column ends the Book of Revelation, and the second column begins the Epistle, “Χαίρετε, υἱοὶ καὶ θυγατέρες” (“Hail, sons and daughters”), under the running title “Epistle of Barnabas”.",
    "imageService": "https://bl.digirati.io/images/ark:/81055/81055/man_10000000.0x000668",
    "maxWidth": 1600,
    "viewer": "https://iiif.bl.uk/uv/#?manifest=https://bl.digirati.io/iiif/ark:/81055/man_10000000.0x000001&cv=666"
  },
  "pastor-of-hermas": {
    "workId": "pastor-of-hermas",
    "library": "British Library, London",
    "date": "4th century (between about 325 and 375)",
    "place": "Eastern Mediterranean",
    "language": "Greek",
    "rights": {
      "label": "Public domain in most countries other than the UK (British Library usage terms)",
      "href": "https://www.bl.uk/help/how-to-reuse-images-of-unpublished-manuscripts"
    },
    "shelfmark": "Add MS 43725 (Codex Sinaiticus), f. 341r",
    "shows": "Folio 341r of Codex Sinaiticus, the oldest copy of the Shepherd in Greek: the opening of the first Vision, “Ὁ θρέψας με πέπρακέν με Ῥόδῃ τινὶ εἰς Ῥώμην” (“He who brought me up sold me to one Rhoda in Rome”), at the top of the first column.",
    "imageService": "https://bl.digirati.io/images/ark:/81055/81055/man_10000000.0x000682",
    "maxWidth": 1600,
    "viewer": "https://iiif.bl.uk/uv/#?manifest=https://bl.digirati.io/iiif/ark:/81055/man_10000000.0x000001&cv=680"
  },
  "first-epistle-of-clement": {
    "workId": "first-epistle-of-clement",
    "library": "British Library, London (photograph from the British Museum's facsimile, 1909)",
    "date": "5th century",
    "place": "Eastern Mediterranean",
    "language": "Greek",
    "rights": {
      "label": "Public domain (photographic facsimile published by the British Museum in 1909)",
      "href": "https://archive.org/details/codexalexandrinu01unse"
    },
    "shelfmark": "Royal MS 1 D VIII (Codex Alexandrinus), f. 134r",
    "shows": "Folio 134r of Codex Alexandrinus, the oldest copy of First Clement: the damaged first page, where the title “to the Corinthians” is partly lost and the letter begins. The British Library has not yet put this book back online, so this is the 1909 photographic facsimile.",
    "imageService": "https://iiif.archive.org/image/iiif/3/codexalexandrinu01unse%2Fcodexalexandrinu01unse_jp2.zip%2Fcodexalexandrinu01unse_jp2%2Fcodexalexandrinu01unse_0281.jp2",
    "viewer": "https://archive.org/details/codexalexandrinu01unse/page/n280/mode/1up"
  },
  "clement-rome-the-homily": {
    "workId": "clement-rome-the-homily",
    "library": "British Library, London (photograph from the British Museum's facsimile, 1909)",
    "date": "5th century",
    "place": "Eastern Mediterranean",
    "language": "Greek",
    "rights": {
      "label": "Public domain (photographic facsimile published by the British Museum in 1909)",
      "href": "https://archive.org/details/codexalexandrinu01unse"
    },
    "shelfmark": "Royal MS 1 D VIII (Codex Alexandrinus), f. 143r",
    "shows": "Folio 143r of Codex Alexandrinus, the only early copy of this sermon: the first column ends First Clement under a decorated colophon, and the second column begins the Homily, “Brethren, it is fitting that you should think of Jesus Christ as of God”. The British Library has not yet put this book back online, so this is the 1909 photographic facsimile.",
    "imageService": "https://iiif.archive.org/image/iiif/3/codexalexandrinu01unse%2Fcodexalexandrinu01unse_jp2.zip%2Fcodexalexandrinu01unse_jp2%2Fcodexalexandrinu01unse_0299.jp2",
    "viewer": "https://archive.org/details/codexalexandrinu01unse/page/n298/mode/1up"
  },
  "on-the-trinity": {
    "workId": "on-the-trinity",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "BSB Clm 18107",
    "date": "1466",
    "place": "Tegernsee (provenance)",
    "language": "Latin",
    "shows": "Folio 3r: the red title “Incipit liber sancti Hilarii episcopi Pictaviensis de sancta Trinitate”, then Book I under a gilt initial C, “Circumspicienti mihi…”.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00142645_00009",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00142645?page=9",
    "rights": {
      "label": "Public Domain Mark 1.0 (stated in the MDZ IIIF manifest)",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "commentary-on-daniel": {
    "workId": "commentary-on-daniel",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "BSB Cod.graec. 610(8",
    "date": "9th century",
    "place": "",
    "language": "Greek",
    "shows": "A torn two-column parchment leaf from Book IV of the Commentary on Daniel, recovered from the binding of an Arabic manuscript (Cod.arab. 1065); the library's catalogue notes it was unknown to the modern editors.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00140523_00001",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00140523?page=1",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "discourse-on-the-end-of-the-world-and-antichrist": {
    "workId": "discourse-on-the-end-of-the-world-and-antichrist",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "BSB Cod.graec. 219",
    "date": "1410/1420",
    "place": "",
    "language": "Greek",
    "shows": "Folio 101v: under a knotwork band, the title “Of the most blessed Hippolytus, discourse on the end of the world, on the Antichrist, and on the second coming of our Lord Jesus Christ” and, beside a large ornamented E, the opening “Since the blessed prophets have been eyes to us”, in two columns; photographed from microfilm, in black and white.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00131037_00217",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00131037?page=217",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "epistles-of-ignatius": {
    "workId": "epistles-of-ignatius",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Cod.graec. 394",
    "date": "10th century (catalogue: “10. Jh. (?)”)",
    "place": "",
    "language": "Greek",
    "shows": "Folio 215r: the end of the letter to Mary, then the heading and opening of the letter to the Trallians, “Ignatius, who is also called Theophorus…” (black-and-white scan).",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00049969_00431",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00049969?page=431",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "spurious-epistles-of-ignatius": {
    "workId": "spurious-epistles-of-ignatius",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Cod.graec. 394",
    "date": "10th century (catalogue: “10. Jh. (?)”)",
    "place": "",
    "language": "Greek",
    "shows": "Folio 214r: the heading “Letter of the holy hieromartyr Ignatius, archbishop of Antioch, to Mary” and its opening, which begins the Ignatian letters in this codex (black-and-white scan).",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00049969_00429",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00049969?page=429",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "against-heresies": {
    "workId": "against-heresies",
    "library": "Staatsbibliothek zu Berlin – Preußischer Kulturbesitz",
    "shelfmark": "Ms. Phill. 1669 (Codex Claromontanus)",
    "date": "9th century",
    "place": "Corbie? (library suggests)",
    "language": "Latin",
    "shows": "Folio 1r: the red title “Hireneus Lugdunensis eps contra oms hereses” over the opening of the preface, “Quatenus veritatem…”, under a large painted Q.",
    "imageService": "https://ngcs-chula.staatsbibliothek-berlin.de/dc/662334035-0005",
    "viewer": "https://digital.staatsbibliothek-berlin.de/werkansicht?PPN=PPN662334035",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "against-jovinianus": {
    "workId": "against-jovinianus",
    "library": "Staatsbibliothek Bamberg (digitised by the Bayerische Staatsbibliothek / MDZ)",
    "shelfmark": "Staatsbibliothek Bamberg, Msc.Patr.86",
    "date": "first third of the 9th century (before 836)",
    "place": "Amiens",
    "language": "Latin",
    "shows": "Folio 1v, a title page in red and brown capitals: “Incipit Hieronimi presbiteri contra Iovinianum hereticum liber primus”.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00140813_00006",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00140813?page=6",
    "rights": {
      "label": "Public Domain Mark 1.0 (stated in the MDZ IIIF manifest)",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "against-vigilantius": {
    "workId": "against-vigilantius",
    "library": "Bryn Mawr College Library, Special Collections (images via OPenn, served by the Internet Archive IIIF mirror)",
    "shelfmark": "Bryn Mawr College MS 55",
    "date": "1435",
    "place": "Southern Germany, perhaps Regensburg",
    "language": "Latin",
    "shows": "Folio 97r, headed “Contra Vigilantium”: the red title “Hieronimus adversus Vigilantium” and the opening “Multa in orbe monstra generata sunt…”.",
    "imageService": "https://iiif.archive.org/image/iiif/3/BMC_MS55%2FBMC_MS55_jp2.zip%2FBMC_MS55_jp2%2FBMC_MS55_0194.jp2",
    "viewer": "https://openn.library.upenn.edu/Data/0003/html/BMC_MS55.html",
    "rights": {
      "label": "Public Domain Mark 1.0 (free of known copyright restrictions)",
      "href": "https://openn.library.upenn.edu/Data/0003/html/BMC_MS55.html"
    }
  },
  "against-the-pelagians": {
    "workId": "against-the-pelagians",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "BSB Clm 3085",
    "date": "15th century",
    "place": "",
    "language": "Latin",
    "shows": "The prologue of the Dialogue, headed “Incipit prologus dialogi Attici cognomento Hieronimi et Critobuli cognomento Pelagii”, opening “Scripta iam ad Ctesiphontem epistola…” (black-and-white scan from microfilm).",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00158753_00014",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00158753?page=14",
    "rights": {
      "label": "Public Domain Mark 1.0 (stated in the MDZ IIIF manifest)",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "apology-against-rufinus": {
    "workId": "apology-against-rufinus",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "BSB Clm 3085",
    "date": "15th century",
    "place": "",
    "language": "Latin",
    "shows": "The end of Epiphanius' letter to John, then “Liber sancti Ieronimi contra Rufinum”: the opening of Book III of the Apology, “Lectis litteris prudentiae tuae…” (black-and-white scan from microfilm).",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00158753_00074",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00158753?page=74",
    "rights": {
      "label": "Public Domain Mark 1.0 (stated in the MDZ IIIF manifest)",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "jerome-letters": {
    "workId": "jerome-letters",
    "library": "Badische Landesbibliothek, Karlsruhe",
    "shelfmark": "Cod. Aug. perg. 197",
    "date": "9th century",
    "place": "",
    "language": "Latin",
    "shows": "Folio 17r: the red title “Incipit ad Innocentium de muliere septies percussa” and Letter I, “Saepe a me, Innocenti carissime, postulasti…”.",
    "imageService": "https://digital.blb-karlsruhe.de/i3f/v20/15420",
    "viewer": "https://digital.blb-karlsruhe.de/blbhs/content/titleinfo/20806",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    },
    "region": "pct:0,0,100,94.4"
  },
  "jerome-lives-of-illustrious-men": {
    "workId": "jerome-lives-of-illustrious-men",
    "library": "Staatsbibliothek Bamberg (digitised by the Bayerische Staatsbibliothek / MDZ)",
    "shelfmark": "Staatsbibliothek Bamberg, Msc.Patr.87",
    "date": "after 540",
    "place": "Castellum Lucullanum near Naples (scriptorium of Eugippius)",
    "language": "Latin",
    "shows": "Folio 1r, headed “Illustrium virorum”: the opening of the preface to Dexter, “Hortaris, Dexter…”, in a sixth-century hand.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00140814_00005",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00140814?page=5",
    "rights": {
      "label": "Public Domain Mark 1.0 (stated in the MDZ IIIF manifest)",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "prefaces-to-the-books-of-the-vulgate": {
    "workId": "prefaces-to-the-books-of-the-vulgate",
    "library": "Free Library of Philadelphia, Rare Book Department (images via OPenn, served by the Internet Archive IIIF mirror)",
    "shelfmark": "Lewis E 33",
    "date": "1250",
    "place": "Paris, France",
    "language": "Latin",
    "shows": "Folio 2v of a Paris Bible: after Jerome's letter to Paulinus, a painted D opens his preface to the Pentateuch, “Desiderii mei…”.",
    "imageService": "https://iiif.archive.org/image/iiif/3/lewis_e_033%2Flewis_e_033_jp2.zip%2Flewis_e_033_jp2%2Flewis_e_033_0007.jp2",
    "viewer": "https://openn.library.upenn.edu/Data/0023/html/lewis_e_033.html",
    "rights": {
      "label": "Public Domain Mark 1.0 (free of known copyright restrictions)",
      "href": "https://openn.library.upenn.edu/Data/0023/html/lewis_e_033.html"
    }
  },
  "life-of-malchus": {
    "workId": "life-of-malchus",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "BSB Clm 6393",
    "date": "last quarter of the 8th century",
    "place": "Freising",
    "language": "Latin",
    "shows": "Folio 176r: the end of the Life of Hilarion and “Incipit sancti Malchi captivi”, opening “Qui navali proelio dimicaturi sunt…”.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00047273_00353",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00047273?page=353",
    "rights": {
      "label": "Public Domain Mark 1.0 (stated in the MDZ IIIF manifest)",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "life-of-paulus-the-first-hermit": {
    "workId": "life-of-paulus-the-first-hermit",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "BSB Clm 6393",
    "date": "last quarter of the 8th century",
    "place": "Freising",
    "language": "Latin",
    "shows": "Folio 188r: “Explicit vita vel captivitas beati Malchi. Incipit vita sancti Pauli”, opening “Inter multos saepe dubitatum est…”.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00047273_00377",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00047273?page=377",
    "rights": {
      "label": "Public Domain Mark 1.0 (stated in the MDZ IIIF manifest)",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "life-of-s-hilarion": {
    "workId": "life-of-s-hilarion",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "BSB Clm 6393",
    "date": "last quarter of the 8th century",
    "place": "Freising",
    "language": "Latin",
    "shows": "Folio 134r: “Incipit vita et actus sancti Hilarionis monachi” in red, green and black capitals, with an interlace initial.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00047273_00269",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00047273?page=269",
    "rights": {
      "label": "Public Domain Mark 1.0 (stated in the MDZ IIIF manifest)",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "perpetual-virginity-of-blessed-mary": {
    "workId": "perpetual-virginity-of-blessed-mary",
    "library": "Bryn Mawr College Library, Special Collections (images via OPenn, served by the Internet Archive IIIF mirror)",
    "shelfmark": "Bryn Mawr College MS 55",
    "date": "1435",
    "place": "Southern Germany, perhaps Regensburg",
    "language": "Latin",
    "shows": "Folio 125v: “Incipit liber sancti Hieronimi contra Helvidium de sanctae Mariae virginitate” and the opening “Nuper rogatus a fratribus…”.",
    "imageService": "https://iiif.archive.org/image/iiif/3/BMC_MS55%2FBMC_MS55_jp2.zip%2FBMC_MS55_jp2%2FBMC_MS55_0251.jp2",
    "viewer": "https://openn.library.upenn.edu/Data/0003/html/BMC_MS55.html",
    "rights": {
      "label": "Public Domain Mark 1.0 (free of known copyright restrictions)",
      "href": "https://openn.library.upenn.edu/Data/0003/html/BMC_MS55.html"
    }
  },
  "exposition-of-the-orthodox-faith": {
    "workId": "exposition-of-the-orthodox-faith",
    "library": "Princeton University Library",
    "shelfmark": "Princeton MS. 180",
    "date": "second half of the 13th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 61r, where the text begins: “No one hath seen God at any time.”",
    "imageService": "https://iiif-cloud.princeton.edu/iiif/2/34%2F33%2F59%2F3433597230154901a5e7c9d7e9ce88f7%2Fintermediate_file",
    "viewer": "https://catalog.princeton.edu/catalog/99108946763506421",
    "rights": {
      "label": "No Known Copyright (rightsstatements.org NKC)",
      "href": "http://rightsstatements.org/vocab/NKC/1.0/"
    }
  },
  "against-apion": {
    "workId": "against-apion",
    "library": "Staatsbibliothek zu Berlin – Preußischer Kulturbesitz",
    "shelfmark": "Ms. lat. fol. 625",
    "date": "14th century",
    "place": "",
    "language": "Latin",
    "shows": "Folio 168r (the library’s count; the old ink number on the page reads 167): a red heading for the book “against Manetho and many others” and the opening of Against Apion in Latin, “Sufficienter ut arbitror per libros antiquitatum…”, under a large red S.",
    "imageService": "https://ngcs-chula.staatsbibliothek-berlin.de/dc/662336054-0339",
    "viewer": "https://digital.staatsbibliothek-berlin.de/werkansicht?PPN=PPN662336054",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "antiquities-of-the-jews": {
    "workId": "antiquities-of-the-jews",
    "library": "Staatsbibliothek zu Berlin – Preußischer Kulturbesitz",
    "shelfmark": "Ms. lat. fol. 263",
    "date": "11th century",
    "place": "Franconia (Amorbach?)",
    "language": "Latin",
    "shows": "Folio 1v: the start of Book I in the Latin translation, “In principio creavit Deus caelum et terram”, under a tall red initial I.",
    "imageService": "https://ngcs-chula.staatsbibliothek-berlin.de/dc/819595527-0004",
    "viewer": "https://digital.staatsbibliothek-berlin.de/werkansicht?PPN=PPN819595527",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "wars-of-the-jews": {
    "workId": "wars-of-the-jews",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Cod.graec. 639",
    "date": "11th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 1r: the red heading of Josephus’ first book on the capture (of Jerusalem) and the opening words of the Jewish War, “Since the war of the Jews against the Romans…”.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00077168_00007",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00077168?page=7",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "on-the-anger-of-god": {
    "workId": "on-the-anger-of-god",
    "library": "Houghton Library, Harvard University",
    "shelfmark": "MS Typ 143",
    "date": "about 1450",
    "place": "Italy",
    "language": "Latin",
    "shows": "The opening of On the Anger of God, “Animadverti saepe, Donate, plurimos”, under a large gold initial A on a red and blue ground.",
    "imageService": "https://mps.lib.harvard.edu/assets/images/drs:17456254",
    "viewer": "https://id.lib.harvard.edu/alma/990095654450203941/catalog",
    "rights": {
      "label": "Public domain; Harvard Library waives copyright in reproductions of public-domain works",
      "href": "https://library.harvard.edu/policy-access-digital-reproductions-works-public-domain"
    }
  },
  "on-the-workmanship-of-god": {
    "workId": "on-the-workmanship-of-god",
    "library": "Leiden University Libraries",
    "shelfmark": "BPL 38",
    "date": "mid-15th century",
    "place": "France",
    "language": "Latin",
    "shows": "Folio 161r: the end of On the Anger of God and its chapter list, then the red heading of On the Workmanship of God and its first words, “Quam minime sim quietus”.",
    "imageService": "https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvNTMvOTIvQTgvQjEvNUEvOUUvQTkvQjUvQTEvMDgvN0QvMTQvOEYvRDMvQkQvNkIvMTg4N18xX2l0ZW1fMzEzMjgwNl8xNjguanAyIiwicmVwX2lkIjoiMTI1MjM2MjQzNjAwMDI3MTEiLCJpbnN0YW5jZSI6ImV1IiwiaW5zdGl0dXRpb24iOiIzMVVLQl9MRVUiLCJ3aWR0aCI6IjYxMjIiLCJoZWlnaHQiOiI0MTk3Iiwid21LZXkiOm51bGwsIndtV2lkdGgiOm51bGwsIndtSGVpZ2h0IjpudWxsLCJ3bVBvc2l0aW9uIjpudWxsLCJ3bVJlcGVhdCI6ZmFsc2UsIm5hOTEiOm51bGx9",
    "viewer": "https://hdl.handle.net/1887.1/item:3132806",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    },
    "region": "pct:51,3,47,94"
  },
  "divine-institutes": {
    "workId": "divine-institutes",
    "library": "Houghton Library, Harvard University",
    "shelfmark": "MS Typ 143",
    "date": "about 1450",
    "place": "Italy",
    "language": "Latin",
    "shows": "Folio 1v, the opening of Book I, “Magno et excellenti ingenio viri”, beside a historiated initial M and a border of flowers and beasts, below the end of the chapter list.",
    "imageService": "https://mps.lib.harvard.edu/assets/images/drs:17455773",
    "viewer": "https://id.lib.harvard.edu/alma/990095654450203941/catalog",
    "rights": {
      "label": "Public domain; Harvard Library waives copyright in reproductions of public-domain works",
      "href": "https://library.harvard.edu/policy-access-digital-reproductions-works-public-domain"
    }
  },
  "fragments-on-the-cross-and-passion": {
    "workId": "fragments-on-the-cross-and-passion",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "BSB Cod.graec. 498",
    "date": "10th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 81r: halfway down, after letters of Nilus, the heading of the first fragment, “Methodius, bishop, to those who say: What doth it profit us that the Son of God was made flesh upon earth ... and what was the advantage of the cross?”, and its opening lines; photographed from microfilm, in black and white.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00109233_00167",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00109233?page=167",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "treatise-against-the-heretic-novatian": {
    "workId": "treatise-against-the-heretic-novatian",
    "library": "Leiden University Libraries",
    "shelfmark": "VLF 40",
    "date": "9th century, first or second third",
    "place": "Northern France",
    "language": "Latin",
    "shows": "Folio 76v: the capitals “Explicit ad clerum de deprecando Domino pro peccatis nostris” and “XIII Incipit ad Novatianum”, then the opening “Cogitanti mihi et intolerabiliter animo aestuanti” under a large initial C.",
    "imageService": "https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvQzcvNzkvMzcvNjIvMEEvMEUvN0YvMzIvNzAvMzgvM0IvRTcvOEQvNzEvRjkvMzUvMTg4N18xX2l0ZW1fNDEyNTcxNF8wODMuanAyIiwicmVwX2lkIjoiMTI1MjM2MjQ3ODAwMDI3MTEiLCJpbnN0YW5jZSI6ImV1IiwiaW5zdGl0dXRpb24iOiIzMVVLQl9MRVUiLCJ3aWR0aCI6Ijc4NDYiLCJoZWlnaHQiOiI1MjU3Iiwid21LZXkiOm51bGwsIndtV2lkdGgiOm51bGwsIndtSGVpZ2h0IjpudWxsLCJ3bVBvc2l0aW9uIjpudWxsLCJ3bVJlcGVhdCI6ZmFsc2UsIm5hOTEiOm51bGx9",
    "viewer": "https://hdl.handle.net/1887.1/item:4125714",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    },
    "region": "pct:2,2,48,96"
  },
  "against-celsus": {
    "workId": "against-celsus",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "BSB Cod.graec. 64",
    "date": "about 1560/61",
    "place": "",
    "language": "Greek",
    "shows": "Folio 1r: under a decorated band, the title “Origen, Against Celsus, Book 1” and the opening of the preface, in a Renaissance copy descended from the Vatican manuscript (Vat. gr. 386); photographed from microfilm, in black and white.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00130822_00006",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00130822?page=6",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "commentary-on-john": {
    "workId": "commentary-on-john",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "BSB Cod.graec. 191",
    "date": "13th century (first half)",
    "place": "",
    "language": "Greek",
    "shows": "Folio 112r: under a decorated headpiece, the title and opening of Book I of the Commentary on John, where the John section of this codex (ff. 112-305v) begins after Origen's Commentary on Matthew; photographed from microfilm, in black and white.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00046889_00230",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00046889?page=230",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "de-principiis": {
    "workId": "de-principiis",
    "library": "Beinecke Rare Book and Manuscript Library, Yale University",
    "shelfmark": "Beinecke MS 481.7",
    "date": "between 865 and 900",
    "place": "Fulda, Germany",
    "language": "Latin",
    "shows": "The verso of a single surviving leaf in Caroline minuscule, from Book III, chapter 1 (on free will) of Rufinus's Latin translation; the leaf was later reused as a pastedown in a binding.",
    "imageService": "https://collections.library.yale.edu/iiif/2/1015957",
    "viewer": "https://collections.library.yale.edu/catalog/2003585",
    "rights": {
      "label": "Public-domain work; Yale's open-access policy allows any use of its images of such works (the IIIF manifest itself carries only a general copyright caution)",
      "href": "https://guides.library.yale.edu/openaccess"
    }
  },
  "letter-to-gregory": {
    "workId": "letter-to-gregory",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "BSB Cod.graec. 52",
    "date": "about 1550",
    "place": "",
    "language": "Greek",
    "shows": "Within a copy of the Philocalia (Origen anthology), the chapter heading “When and to whom the studies of philosophy are useful for explaining the sacred Scriptures” and, under a large X, the letter's opening greeting “Greeting in God, my most excellent sir and venerable son Gregory”; photographed from microfilm, in black and white.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00130815_00060",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00130815?page=60",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "epistle-to-the-philippians": {
    "workId": "epistle-to-the-philippians",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "Clm 14089",
    "date": "1502",
    "place": "",
    "language": "Latin",
    "shows": "Folio 286v: after the letters exchanged between Ignatius and the Virgin Mary, the heading and opening of Polycarp’s letter, “Polycarpus et qui cum eo sunt presbyteri ecclesiae Dei quae est Philippis…” (a hand copy of the printed edition GW 8409, per the catalogue; black-and-white scan).",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00034243_00576",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00034243?page=576",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "martyrdom-of-polycarp": {
    "workId": "martyrdom-of-polycarp",
    "library": "Universitätsbibliothek der Ludwig-Maximilians-Universität München",
    "shelfmark": "2° Cod. ms. 313",
    "date": "c. 1458",
    "place": "Southern Germany",
    "language": "Latin",
    "shows": "Folio 31v, second column: the red heading for Polycarp, bishop and martyr, and the opening of the Martyrdom in Latin, “Ecclesia Dei quae est apud Smyrnam ecclesiae Dei constitutae apud Filomelium…”.",
    "imageService": "https://image.ub.uni-muenchen.de:8182/iiif/2/BV049059852__BV049059852_tif__ublmu_005997_0064.tif",
    "viewer": "https://doi.org/10.5282/ubm/digi.5997",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "http://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "commentary-on-the-apostles-creed": {
    "workId": "commentary-on-the-apostles-creed",
    "library": "Staatsbibliothek Bamberg (digitised by the Bayerische Staatsbibliothek / MDZ)",
    "shelfmark": "Staatsbibliothek Bamberg, Msc.Patr.86",
    "date": "first third of the 9th century (before 836)",
    "place": "Amiens",
    "language": "Latin",
    "shows": "Folio 127v: “Explicit ad Iovinianum liber II”, then the capital title “Incipit expositio symboli” naming Rufinus, and the address to Laurentius.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00140813_00258",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00140813?page=258",
    "rights": {
      "label": "Public Domain Mark 1.0 (stated in the MDZ IIIF manifest)",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "on-the-life-of-st-martin": {
    "workId": "on-the-life-of-st-martin",
    "library": "Bryn Mawr College Library, Special Collections (images via OPenn, served by the Internet Archive IIIF mirror)",
    "shelfmark": "Bryn Mawr College MS 17",
    "date": "15th century",
    "place": "Verona?, Northern Italy",
    "language": "Latin",
    "shows": "Folio 1r, Sulpicius' prefatory letter, “Severus Desiderio fratri karissimo salutem. Ego quidem frater unanimis libellum quem de vita sancti Martini…”.",
    "imageService": "https://iiif.archive.org/image/iiif/3/BMC_MS17%2FBMC_MS17_jp2.zip%2FBMC_MS17_jp2%2FBMC_MS17_0004.jp2",
    "viewer": "https://openn.library.upenn.edu/Data/0003/html/BMC_MS17.html",
    "rights": {
      "label": "Public Domain Mark 1.0 (free of known copyright restrictions)",
      "href": "https://openn.library.upenn.edu/Data/0003/html/BMC_MS17.html"
    }
  },
  "ad-martyras": {
    "workId": "ad-martyras",
    "library": "Leiden University Libraries",
    "shelfmark": "BPL 2",
    "date": "about 1480",
    "place": "Florence, Italy",
    "language": "Latin",
    "shows": "Folio 48r, where the rubric closes The Chaplet and announces “Ad martyras liber incipit”, above a white-vine initial.",
    "imageService": "https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvRkMvRjMvN0UvMEUvMUEvRDQvOEIvMkMvMjgvOUUvRUIvMkEvODgvMzQvRDgvQzcvMTg4N18xX2l0ZW1fNzYwNDM5XzExMi5qcDIiLCJyZXBfaWQiOiIxMjUyNDAyODEwMDAwMjcxMSIsImluc3RhbmNlIjoiZXUiLCJpbnN0aXR1dGlvbiI6IjMxVUtCX0xFVSIsIndpZHRoIjoiMzY5MCIsImhlaWdodCI6IjU1MjkiLCJ3bUtleSI6bnVsbCwid21XaWR0aCI6bnVsbCwid21IZWlnaHQiOm51bGwsIndtUG9zaXRpb24iOm51bGwsIndtUmVwZWF0IjpmYWxzZSwibmE5MSI6bnVsbH0%3D",
    "viewer": "https://hdl.handle.net/1887.1/item:760439",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "against-all-heresies": {
    "workId": "against-all-heresies",
    "library": "Leiden University Libraries",
    "shelfmark": "BPL 2",
    "date": "about 1480",
    "place": "Florence, Italy",
    "language": "Latin",
    "shows": "Folio 261v, the opening of Against All Heresies, “Quorum haereticorum ut plura praeteream, pauca perstringam”, under a white-vine initial Q.",
    "imageService": "https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvRkMvRjMvN0UvMEUvMUEvRDQvOEIvMkMvMjgvOUUvRUIvMkEvODgvMzQvRDgvQzcvMTg4N18xX2l0ZW1fNzYwNDM5XzUzOS5qcDIiLCJyZXBfaWQiOiIxMjUyNDAyODEwMDAwMjcxMSIsImluc3RhbmNlIjoiZXUiLCJpbnN0aXR1dGlvbiI6IjMxVUtCX0xFVSIsIndpZHRoIjoiMzg0NCIsImhlaWdodCI6IjU0NDMiLCJ3bUtleSI6bnVsbCwid21XaWR0aCI6bnVsbCwid21IZWlnaHQiOm51bGwsIndtUG9zaXRpb24iOm51bGwsIndtUmVwZWF0IjpmYWxzZSwibmE5MSI6bnVsbH0%3D",
    "viewer": "https://hdl.handle.net/1887.1/item:760439",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "against-hermogenes": {
    "workId": "against-hermogenes",
    "library": "Leiden University Libraries",
    "shelfmark": "BPL 2",
    "date": "about 1480",
    "place": "Florence, Italy",
    "language": "Latin",
    "shows": "Folio 276r, the opening of Against Hermogenes under a white-vine initial, with the words “Hermogenis autem doctrina tam novella est” in its first lines.",
    "imageService": "https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvRkMvRjMvN0UvMEUvMUEvRDQvOEIvMkMvMjgvOUUvRUIvMkEvODgvMzQvRDgvQzcvMTg4N18xX2l0ZW1fNzYwNDM5XzU2OC5qcDIiLCJyZXBfaWQiOiIxMjUyNDAyODEwMDAwMjcxMSIsImluc3RhbmNlIjoiZXUiLCJpbnN0aXR1dGlvbiI6IjMxVUtCX0xFVSIsIndpZHRoIjoiMzczOCIsImhlaWdodCI6IjUzODEiLCJ3bUtleSI6bnVsbCwid21XaWR0aCI6bnVsbCwid21IZWlnaHQiOm51bGwsIndtUG9zaXRpb24iOm51bGwsIndtUmVwZWF0IjpmYWxzZSwibmE5MSI6bnVsbH0%3D",
    "viewer": "https://hdl.handle.net/1887.1/item:760439",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "against-praxeas": {
    "workId": "against-praxeas",
    "library": "Leiden University Libraries",
    "shelfmark": "BPL 2",
    "date": "about 1480",
    "place": "Florence, Italy",
    "language": "Latin",
    "shows": "Folio 111v, the opening of Against Praxeas, “Varie diabolus aemulatus est veritatem”, under a white-vine initial V.",
    "imageService": "https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvRkMvRjMvN0UvMEUvMUEvRDQvOEIvMkMvMjgvOUUvRUIvMkEvODgvMzQvRDgvQzcvMTg4N18xX2l0ZW1fNzYwNDM5XzIzOS5qcDIiLCJyZXBfaWQiOiIxMjUyNDAyODEwMDAwMjcxMSIsImluc3RhbmNlIjoiZXUiLCJpbnN0aXR1dGlvbiI6IjMxVUtCX0xFVSIsIndpZHRoIjoiMzg0NSIsImhlaWdodCI6IjU0NDQiLCJ3bUtleSI6bnVsbCwid21XaWR0aCI6bnVsbCwid21IZWlnaHQiOm51bGwsIndtUG9zaXRpb24iOm51bGwsIndtUmVwZWF0IjpmYWxzZSwibmE5MSI6bnVsbH0%3D",
    "viewer": "https://hdl.handle.net/1887.1/item:760439",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "against-the-valentinians": {
    "workId": "against-the-valentinians",
    "library": "Leiden University Libraries",
    "shelfmark": "BPL 2",
    "date": "about 1480",
    "place": "Florence, Italy",
    "language": "Latin",
    "shows": "Folio 129r, the opening of Against the Valentinians, “Valentiniani frequentissimum plane collegium inter haereticos”, under a white-vine initial V low on the page.",
    "imageService": "https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvRkMvRjMvN0UvMEUvMUEvRDQvOEIvMkMvMjgvOUUvRUIvMkEvODgvMzQvRDgvQzcvMTg4N18xX2l0ZW1fNzYwNDM5XzI3NC5qcDIiLCJyZXBfaWQiOiIxMjUyNDAyODEwMDAwMjcxMSIsImluc3RhbmNlIjoiZXUiLCJpbnN0aXR1dGlvbiI6IjMxVUtCX0xFVSIsIndpZHRoIjoiMzY5MCIsImhlaWdodCI6IjU1MjkiLCJ3bUtleSI6bnVsbCwid21XaWR0aCI6bnVsbCwid21IZWlnaHQiOm51bGwsIndtUG9zaXRpb24iOm51bGwsIndtUmVwZWF0IjpmYWxzZSwibmE5MSI6bnVsbH0%3D",
    "viewer": "https://hdl.handle.net/1887.1/item:760439",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "answer-to-the-jews": {
    "workId": "answer-to-the-jews",
    "library": "Leiden University Libraries",
    "shelfmark": "BPL 2",
    "date": "about 1480",
    "place": "Florence, Italy",
    "language": "Latin",
    "shows": "Folio 247r, the opening of An Answer to the Jews, “Proxime accidit disputatio habita Christiano et proselyto Iudaeo”, under a white-vine initial P.",
    "imageService": "https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvRkMvRjMvN0UvMEUvMUEvRDQvOEIvMkMvMjgvOUUvRUIvMkEvODgvMzQvRDgvQzcvMTg4N18xX2l0ZW1fNzYwNDM5XzUxMC5qcDIiLCJyZXBfaWQiOiIxMjUyNDAyODEwMDAwMjcxMSIsImluc3RhbmNlIjoiZXUiLCJpbnN0aXR1dGlvbiI6IjMxVUtCX0xFVSIsIndpZHRoIjoiMzczOCIsImhlaWdodCI6IjU0NzIiLCJ3bUtleSI6bnVsbCwid21XaWR0aCI6bnVsbCwid21IZWlnaHQiOm51bGwsIndtUG9zaXRpb24iOm51bGwsIndtUmVwZWF0IjpmYWxzZSwibmE5MSI6bnVsbH0%3D",
    "viewer": "https://hdl.handle.net/1887.1/item:760439",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "de-fuga-in-persecutione": {
    "workId": "de-fuga-in-persecutione",
    "library": "Leiden University Libraries",
    "shelfmark": "BPL 2",
    "date": "about 1480",
    "place": "Florence, Italy",
    "language": "Latin",
    "shows": "Folio 77r, where the rubric announces “Incipit eiusdem de fuga in persecutione” and the text opens “Quaesisti proxime, Fabi frater, fugiendum necne sit in persecutione”.",
    "imageService": "https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvRkMvRjMvN0UvMEUvMUEvRDQvOEIvMkMvMjgvOUUvRUIvMkEvODgvMzQvRDgvQzcvMTg4N18xX2l0ZW1fNzYwNDM5XzE3MC5qcDIiLCJyZXBfaWQiOiIxMjUyNDAyODEwMDAwMjcxMSIsImluc3RhbmNlIjoiZXUiLCJpbnN0aXR1dGlvbiI6IjMxVUtCX0xFVSIsIndpZHRoIjoiMzY5MCIsImhlaWdodCI6IjU1MjkiLCJ3bUtleSI6bnVsbCwid21XaWR0aCI6bnVsbCwid21IZWlnaHQiOm51bGwsIndtUG9zaXRpb24iOm51bGwsIndtUmVwZWF0IjpmYWxzZSwibmE5MSI6bnVsbH0%3D",
    "viewer": "https://hdl.handle.net/1887.1/item:760439",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "of-patience": {
    "workId": "of-patience",
    "library": "Leiden University Libraries",
    "shelfmark": "BPL 2",
    "date": "about 1480",
    "place": "Florence, Italy",
    "language": "Latin",
    "shows": "Folio 105v, where the rubric announces “Tertulliani presbiteri liber incipit de patientia Dei” and the text opens “Confiteor ad Dominum Deum satis temere me”.",
    "imageService": "https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvRkMvRjMvN0UvMEUvMUEvRDQvOEIvMkMvMjgvOUUvRUIvMkEvODgvMzQvRDgvQzcvMTg4N18xX2l0ZW1fNzYwNDM5XzIyNy5qcDIiLCJyZXBfaWQiOiIxMjUyNDAyODEwMDAwMjcxMSIsImluc3RhbmNlIjoiZXUiLCJpbnN0aXR1dGlvbiI6IjMxVUtCX0xFVSIsIndpZHRoIjoiMzc5NCIsImhlaWdodCI6IjUzNTgiLCJ3bUtleSI6bnVsbCwid21XaWR0aCI6bnVsbCwid21IZWlnaHQiOm51bGwsIndtUG9zaXRpb24iOm51bGwsIndtUmVwZWF0IjpmYWxzZSwibmE5MSI6bnVsbH0%3D",
    "viewer": "https://hdl.handle.net/1887.1/item:760439",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "on-exhortation-to-chastity": {
    "workId": "on-exhortation-to-chastity",
    "library": "Leiden University Libraries",
    "shelfmark": "BPL 2",
    "date": "about 1480",
    "place": "Florence, Italy",
    "language": "Latin",
    "shows": "Folio 86r, where the rubric announces “Eiusdem de exhortatione castitatis liber incipit feliciter” and the text opens “Non dubito, frater, te post uxorem in pace praemissam” under a white-vine initial N.",
    "imageService": "https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvRkMvRjMvN0UvMEUvMUEvRDQvOEIvMkMvMjgvOUUvRUIvMkEvODgvMzQvRDgvQzcvMTg4N18xX2l0ZW1fNzYwNDM5XzE4OC5qcDIiLCJyZXBfaWQiOiIxMjUyNDAyODEwMDAwMjcxMSIsImluc3RhbmNlIjoiZXUiLCJpbnN0aXR1dGlvbiI6IjMxVUtCX0xFVSIsIndpZHRoIjoiMzY5MCIsImhlaWdodCI6IjU1MjkiLCJ3bUtleSI6bnVsbCwid21XaWR0aCI6bnVsbCwid21IZWlnaHQiOm51bGwsIndtUG9zaXRpb24iOm51bGwsIndtUmVwZWF0IjpmYWxzZSwibmE5MSI6bnVsbH0%3D",
    "viewer": "https://hdl.handle.net/1887.1/item:760439",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "on-monogamy": {
    "workId": "on-monogamy",
    "library": "Leiden University Libraries",
    "shelfmark": "BPL 2",
    "date": "about 1480",
    "place": "Florence, Italy",
    "language": "Latin",
    "shows": "Folio 91r, where the rubric closes On Exhortation to Chastity and announces “Eiusdem de monogamia liber incipit”, above a white-vine initial.",
    "imageService": "https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvRkMvRjMvN0UvMEUvMUEvRDQvOEIvMkMvMjgvOUUvRUIvMkEvODgvMzQvRDgvQzcvMTg4N18xX2l0ZW1fNzYwNDM5XzE5OC5qcDIiLCJyZXBfaWQiOiIxMjUyNDAyODEwMDAwMjcxMSIsImluc3RhbmNlIjoiZXUiLCJpbnN0aXR1dGlvbiI6IjMxVUtCX0xFVSIsIndpZHRoIjoiMzY5MCIsImhlaWdodCI6IjU1MjkiLCJ3bUtleSI6bnVsbCwid21XaWR0aCI6bnVsbCwid21IZWlnaHQiOm51bGwsIndtUG9zaXRpb24iOm51bGwsIndtUmVwZWF0IjpmYWxzZSwibmE5MSI6bnVsbH0%3D",
    "viewer": "https://hdl.handle.net/1887.1/item:760439",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "on-repentance": {
    "workId": "on-repentance",
    "library": "Leiden University Libraries",
    "shelfmark": "BPL 2",
    "date": "about 1480",
    "place": "Florence, Italy",
    "language": "Latin",
    "shows": "Folio 50v, the opening of On Repentance, “Paenitentiam hoc genus hominum”, under a white-vine initial.",
    "imageService": "https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvRkMvRjMvN0UvMEUvMUEvRDQvOEIvMkMvMjgvOUUvRUIvMkEvODgvMzQvRDgvQzcvMTg4N18xX2l0ZW1fNzYwNDM5XzExNy5qcDIiLCJyZXBfaWQiOiIxMjUyNDAyODEwMDAwMjcxMSIsImluc3RhbmNlIjoiZXUiLCJpbnN0aXR1dGlvbiI6IjMxVUtCX0xFVSIsIndpZHRoIjoiMzczNSIsImhlaWdodCI6IjUzNTgiLCJ3bUtleSI6bnVsbCwid21XaWR0aCI6bnVsbCwid21IZWlnaHQiOm51bGwsIndtUG9zaXRpb24iOm51bGwsIndtUmVwZWF0IjpmYWxzZSwibmE5MSI6bnVsbH0%3D",
    "viewer": "https://hdl.handle.net/1887.1/item:760439",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "on-the-apparel-of-women": {
    "workId": "on-the-apparel-of-women",
    "library": "Leiden University Libraries",
    "shelfmark": "BPL 2",
    "date": "about 1480",
    "place": "Florence, Italy",
    "language": "Latin",
    "shows": "Folio 64r, the opening of On the Apparel of Women, “Si tanta in terris moraretur fides quanta merces eius expectatur in caelis”, under a white-vine initial S.",
    "imageService": "https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvRkMvRjMvN0UvMEUvMUEvRDQvOEIvMkMvMjgvOUUvRUIvMkEvODgvMzQvRDgvQzcvMTg4N18xX2l0ZW1fNzYwNDM5XzE0NC5qcDIiLCJyZXBfaWQiOiIxMjUyNDAyODEwMDAwMjcxMSIsImluc3RhbmNlIjoiZXUiLCJpbnN0aXR1dGlvbiI6IjMxVUtCX0xFVSIsIndpZHRoIjoiMzY5MCIsImhlaWdodCI6IjU1MjkiLCJ3bUtleSI6bnVsbCwid21XaWR0aCI6bnVsbCwid21IZWlnaHQiOm51bGwsIndtUG9zaXRpb24iOm51bGwsIndtUmVwZWF0IjpmYWxzZSwibmE5MSI6bnVsbH0%3D",
    "viewer": "https://hdl.handle.net/1887.1/item:760439",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "on-the-flesh-of-christ": {
    "workId": "on-the-flesh-of-christ",
    "library": "Leiden University Libraries",
    "shelfmark": "BPL 2",
    "date": "about 1480",
    "place": "Florence, Italy",
    "language": "Latin",
    "shows": "Folio 1r, the opening of the whole volume: On the Flesh of Christ begins “Qui fidem resurrectionis ante istos Sadducaeorum propinquos”, beside a gold-framed initial Q painted with the Annunciation, inside a full illuminated border.",
    "imageService": "https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvRkMvRjMvN0UvMEUvMUEvRDQvOEIvMkMvMjgvOUUvRUIvMkEvODgvMzQvRDgvQzcvMTg4N18xX2l0ZW1fNzYwNDM5XzAxOC5qcDIiLCJyZXBfaWQiOiIxMjUyNDAyODEwMDAwMjcxMSIsImluc3RhbmNlIjoiZXUiLCJpbnN0aXR1dGlvbiI6IjMxVUtCX0xFVSIsIndpZHRoIjoiMzcyMiIsImhlaWdodCI6IjUzODYiLCJ3bUtleSI6bnVsbCwid21XaWR0aCI6bnVsbCwid21IZWlnaHQiOm51bGwsIndtUG9zaXRpb24iOm51bGwsIndtUmVwZWF0IjpmYWxzZSwibmE5MSI6bnVsbH0%3D",
    "viewer": "https://hdl.handle.net/1887.1/item:760439",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "on-the-pallium": {
    "workId": "on-the-pallium",
    "library": "Leiden University Libraries",
    "shelfmark": "BPL 2",
    "date": "about 1480",
    "place": "Florence, Italy",
    "language": "Latin",
    "shows": "Folio 100r, with the white-vine initial that opens On the Pallium in the lower half of the page; the first lines read “…habitus denotare. Pacis haec et annona et otia ab imperio et a caelo”.",
    "imageService": "https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvRkMvRjMvN0UvMEUvMUEvRDQvOEIvMkMvMjgvOUUvRUIvMkEvODgvMzQvRDgvQzcvMTg4N18xX2l0ZW1fNzYwNDM5XzIxNi5qcDIiLCJyZXBfaWQiOiIxMjUyNDAyODEwMDAwMjcxMSIsImluc3RhbmNlIjoiZXUiLCJpbnN0aXR1dGlvbiI6IjMxVUtCX0xFVSIsIndpZHRoIjoiMzY5MCIsImhlaWdodCI6IjU1MjkiLCJ3bUtleSI6bnVsbCwid21XaWR0aCI6bnVsbCwid21IZWlnaHQiOm51bGwsIndtUG9zaXRpb24iOm51bGwsIndtUmVwZWF0IjpmYWxzZSwibmE5MSI6bnVsbH0%3D",
    "viewer": "https://hdl.handle.net/1887.1/item:760439",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "on-the-resurrection-of-the-flesh": {
    "workId": "on-the-resurrection-of-the-flesh",
    "library": "Leiden University Libraries",
    "shelfmark": "BPL 2",
    "date": "about 1480",
    "place": "Florence, Italy",
    "language": "Latin",
    "shows": "Folio 12v, where the red rubric closes On the Flesh of Christ and announces “Incipit liber de carnis resurrectione”, above a white-vine initial.",
    "imageService": "https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvRkMvRjMvN0UvMEUvMUEvRDQvOEIvMkMvMjgvOUUvRUIvMkEvODgvMzQvRDgvQzcvMTg4N18xX2l0ZW1fNzYwNDM5XzA0MS5qcDIiLCJyZXBfaWQiOiIxMjUyNDAyODEwMDAwMjcxMSIsImluc3RhbmNlIjoiZXUiLCJpbnN0aXR1dGlvbiI6IjMxVUtCX0xFVSIsIndpZHRoIjoiMzczNSIsImhlaWdodCI6IjUzNTgiLCJ3bUtleSI6bnVsbCwid21XaWR0aCI6bnVsbCwid21IZWlnaHQiOm51bGwsIndtUG9zaXRpb24iOm51bGwsIndtUmVwZWF0IjpmYWxzZSwibmE5MSI6bnVsbH0%3D",
    "viewer": "https://hdl.handle.net/1887.1/item:760439",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "on-the-veiling-of-virgins": {
    "workId": "on-the-veiling-of-virgins",
    "library": "Leiden University Libraries",
    "shelfmark": "BPL 2",
    "date": "about 1480",
    "place": "Florence, Italy",
    "language": "Latin",
    "shows": "Folio 56r, where the rubric closes On Repentance and announces “Incipit liber eiusdem de virginibus velandis”, above a white-vine initial.",
    "imageService": "https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvRkMvRjMvN0UvMEUvMUEvRDQvOEIvMkMvMjgvOUUvRUIvMkEvODgvMzQvRDgvQzcvMTg4N18xX2l0ZW1fNzYwNDM5XzEyOC5qcDIiLCJyZXBfaWQiOiIxMjUyNDAyODEwMDAwMjcxMSIsImluc3RhbmNlIjoiZXUiLCJpbnN0aXR1dGlvbiI6IjMxVUtCX0xFVSIsIndpZHRoIjoiMzY5MCIsImhlaWdodCI6IjU1MjkiLCJ3bUtleSI6bnVsbCwid21XaWR0aCI6bnVsbCwid21IZWlnaHQiOm51bGwsIndtUG9zaXRpb24iOm51bGwsIndtUmVwZWF0IjpmYWxzZSwibmE5MSI6bnVsbH0%3D",
    "viewer": "https://hdl.handle.net/1887.1/item:760439",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "apology": {
    "workId": "apology",
    "library": "Leiden University Libraries",
    "shelfmark": "VLF 108",
    "date": "11th/12th century",
    "place": "France (Bourges?)",
    "language": "Latin",
    "shows": "Folio 25r, the opening of the Apology under a tall red initial S: the rubric “Incipit liber Tertulliani” (a later hand adds “Apologeticus”) and the first words “Si non licet nobis, Romani imperii antistites”.",
    "imageService": "https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvODYvRTAvNDQvQjUvOTQvNTQvQUIvMEIvMkQvMjAvOUIvQkEvRjgvMDkvRTUvREIvMTg4N18xX2l0ZW1fNDIxNjYwN18wNTcuanAyIiwicmVwX2lkIjoiMTI1MjQwMjc2NjAwMDI3MTEiLCJpbnN0YW5jZSI6ImV1IiwiaW5zdGl0dXRpb24iOiIzMVVLQl9MRVUiLCJ3aWR0aCI6IjMyMjUiLCJoZWlnaHQiOiI0NjM2Iiwid21LZXkiOm51bGwsIndtV2lkdGgiOm51bGwsIndtSGVpZ2h0IjpudWxsLCJ3bVBvc2l0aW9uIjpudWxsLCJ3bVJlcGVhdCI6ZmFsc2UsIm5hOTEiOm51bGx9",
    "viewer": "https://hdl.handle.net/1887.1/item:4216607",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "chaplet": {
    "workId": "chaplet",
    "library": "Leiden University Libraries",
    "shelfmark": "BPL 2",
    "date": "about 1480",
    "place": "Florence, Italy",
    "language": "Latin",
    "shows": "Folio 41v, where the rubric announces “liber eiusdem de corona militis” and the text opens “Proxime factum est liberalitate praestantissimorum imperatorum” under a white-vine initial.",
    "imageService": "https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvRkMvRjMvN0UvMEUvMUEvRDQvOEIvMkMvMjgvOUUvRUIvMkEvODgvMzQvRDgvQzcvMTg4N18xX2l0ZW1fNzYwNDM5XzA5OS5qcDIiLCJyZXBfaWQiOiIxMjUyNDAyODEwMDAwMjcxMSIsImluc3RhbmNlIjoiZXUiLCJpbnN0aXR1dGlvbiI6IjMxVUtCX0xFVSIsIndpZHRoIjoiMzczNSIsImhlaWdodCI6IjUzNTgiLCJ3bUtleSI6bnVsbCwid21XaWR0aCI6bnVsbCwid21IZWlnaHQiOm51bGwsIndtUG9zaXRpb24iOm51bGwsIndtUmVwZWF0IjpmYWxzZSwibmE5MSI6bnVsbH0%3D",
    "viewer": "https://hdl.handle.net/1887.1/item:760439",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "five-books-against-marcion": {
    "workId": "five-books-against-marcion",
    "library": "Leiden University Libraries",
    "shelfmark": "BPL 2",
    "date": "about 1480",
    "place": "Florence, Italy",
    "language": "Latin",
    "shows": "Folio 138v, the opening of Book I Against Marcion, “Si quid retro gestum est nobis adversus Marcionem”, under a white-vine initial S.",
    "imageService": "https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvRkMvRjMvN0UvMEUvMUEvRDQvOEIvMkMvMjgvOUUvRUIvMkEvODgvMzQvRDgvQzcvMTg4N18xX2l0ZW1fNzYwNDM5XzI5My5qcDIiLCJyZXBfaWQiOiIxMjUyNDAyODEwMDAwMjcxMSIsImluc3RhbmNlIjoiZXUiLCJpbnN0aXR1dGlvbiI6IjMxVUtCX0xFVSIsIndpZHRoIjoiMzg0NCIsImhlaWdodCI6IjU0NDMiLCJ3bUtleSI6bnVsbCwid21XaWR0aCI6bnVsbCwid21IZWlnaHQiOm51bGwsIndtUG9zaXRpb24iOm51bGwsIndtUmVwZWF0IjpmYWxzZSwibmE5MSI6bnVsbH0%3D",
    "viewer": "https://hdl.handle.net/1887.1/item:760439",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "prescription-against-heretics": {
    "workId": "prescription-against-heretics",
    "library": "Leiden University Libraries",
    "shelfmark": "BPL 2",
    "date": "about 1480",
    "place": "Florence, Italy",
    "language": "Latin",
    "shows": "Folio 265r, where the rubric closes Against All Heresies and announces “Eiusdem de praescriptionibus haereticorum liber incipit”, and the text opens “Condicionem praesentium temporum etiam hanc admonitionem provocat”.",
    "imageService": "https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvRkMvRjMvN0UvMEUvMUEvRDQvOEIvMkMvMjgvOUUvRUIvMkEvODgvMzQvRDgvQzcvMTg4N18xX2l0ZW1fNzYwNDM5XzU0Ni5qcDIiLCJyZXBfaWQiOiIxMjUyNDAyODEwMDAwMjcxMSIsImluc3RhbmNlIjoiZXUiLCJpbnN0aXR1dGlvbiI6IjMxVUtCX0xFVSIsIndpZHRoIjoiMzczOCIsImhlaWdodCI6IjUzODAiLCJ3bUtleSI6bnVsbCwid21XaWR0aCI6bnVsbCwid21IZWlnaHQiOm51bGwsIndtUG9zaXRpb24iOm51bGwsIndtUmVwZWF0IjpmYWxzZSwibmE5MSI6bnVsbH0%3D",
    "viewer": "https://hdl.handle.net/1887.1/item:760439",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "to-his-wife": {
    "workId": "to-his-wife",
    "library": "Leiden University Libraries",
    "shelfmark": "BPL 2",
    "date": "about 1480",
    "place": "Florence, Italy",
    "language": "Latin",
    "shows": "Folio 71r, where the rubric closes On the Apparel of Women and announces “ad uxorem liber primus incipit”; the text begins “…in Domino conservam, quid tibi sectandum sit post discessum de saeculo meum”. (The library's contents note lists ff. 71r–76v as Book II, but the rubric on this page names Book I.)",
    "imageService": "https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvRkMvRjMvN0UvMEUvMUEvRDQvOEIvMkMvMjgvOUUvRUIvMkEvODgvMzQvRDgvQzcvMTg4N18xX2l0ZW1fNzYwNDM5XzE1OC5qcDIiLCJyZXBfaWQiOiIxMjUyNDAyODEwMDAwMjcxMSIsImluc3RhbmNlIjoiZXUiLCJpbnN0aXR1dGlvbiI6IjMxVUtCX0xFVSIsIndpZHRoIjoiMzY5MCIsImhlaWdodCI6IjU1MjkiLCJ3bUtleSI6bnVsbCwid21XaWR0aCI6bnVsbCwid21IZWlnaHQiOm51bGwsIndtUG9zaXRpb24iOm51bGwsIndtUmVwZWF0IjpmYWxzZSwibmE5MSI6bnVsbH0%3D",
    "viewer": "https://hdl.handle.net/1887.1/item:760439",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "to-scapula": {
    "workId": "to-scapula",
    "library": "Leiden University Libraries",
    "shelfmark": "BPL 2",
    "date": "about 1480",
    "place": "Florence, Italy",
    "language": "Latin",
    "shows": "Folio 84r, where the rubric closes De Fuga and announces “Eiusdem ad Scapulam liber incipit”, above a white-vine initial.",
    "imageService": "https://eu-img02.ext.exlibrisgroup.com/iiif/2/eyJyZWdpb24iOiJldS1jZW50cmFsLTEiLCJidWNrZXQiOiJldS1zdDAxLmV4dC5leGxpYnJpc2dyb3VwLmNvbSIsImtleSI6IjMxVUtCX0xFVS9zdG9yYWdlL2FsbWEvRkMvRjMvN0UvMEUvMUEvRDQvOEIvMkMvMjgvOUUvRUIvMkEvODgvMzQvRDgvQzcvMTg4N18xX2l0ZW1fNzYwNDM5XzE4NC5qcDIiLCJyZXBfaWQiOiIxMjUyNDAyODEwMDAwMjcxMSIsImluc3RhbmNlIjoiZXUiLCJpbnN0aXR1dGlvbiI6IjMxVUtCX0xFVSIsIndpZHRoIjoiMzY5MCIsImhlaWdodCI6IjU1MjkiLCJ3bUtleSI6bnVsbCwid21XaWR0aCI6bnVsbCwid21IZWlnaHQiOm51bGwsIndtUG9zaXRpb24iOm51bGwsIndtUmVwZWF0IjpmYWxzZSwibmE5MSI6bnVsbH0%3D",
    "viewer": "https://hdl.handle.net/1887.1/item:760439",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "dialogues-eranistes": {
    "workId": "dialogues-eranistes",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "BSB Cod.graec. 130",
    "date": "second half of the 16th century",
    "place": "",
    "language": "Greek",
    "shows": "Folio 1r: under a red and black headpiece, the title “Of the blessed Theodoret, bishop of Cyrus, Eranistes or Polymorphus” and the opening of the prologue, “Εἰσί τινες…” (“There are some…”).",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00069322_00015",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00069322?page=15",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  },
  "theodoret-letters": {
    "workId": "theodoret-letters",
    "library": "Bayerische Staatsbibliothek, Munich",
    "shelfmark": "BSB Cod.graec. 207",
    "date": "about 1375",
    "place": "",
    "language": "Greek",
    "shows": "Folio 166v: the red heading “Of Theodoret, bishop of Cyrus, to Dioscorus, archbishop of Alexandria” and the start of the letter (Letter 83, as the Pinakes catalogue identifies it), copied in a collection of council documents. Only this one letter is in the book.",
    "imageService": "https://api.digitale-sammlungen.de/iiif/image/v2/bsb00069343_00349",
    "viewer": "https://www.digitale-sammlungen.de/en/view/bsb00069343?page=349",
    "rights": {
      "label": "Public Domain Mark 1.0",
      "href": "https://creativecommons.org/publicdomain/mark/1.0/"
    }
  }
};

/** Width the manuscript viewer asks for. The prefetch uses it too, so both requests share one download. */
export const MANUSCRIPT_VIEW_WIDTH = 2000;

export function manuscriptImage(m: ManuscriptPage, width: number): string {
  const w = m.maxWidth ? Math.min(width, m.maxWidth) : width;
  return m.imageService + "/" + (m.region ?? "full") + "/" + w + ",/0/default.jpg";
}
