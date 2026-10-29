import { describe, expect, it } from "vitest";
import type { Author } from "../server/types";
import type { FatherImageMap } from "../src/lib/fatherImages";
import { renderFatherProfileBody, renderFathersIndexBody } from "../src/lib/fatherPageHtml";
import {
  FATHERS_INDEX_PATH,
  fatherDirectoryRedirects,
  fatherProfileDescription,
  fatherProfileJsonLd,
  fatherProfilePath,
  fatherProfileTitle,
  lifeDatesFrom
} from "../src/lib/fatherPageMeta";
import { prerenderShell } from "../server/staticFathers";

function author(partial: Pick<Author, "id" | "name" | "deathYear"> & Partial<Author>): Author {
  return {
    dates: "",
    era: "post-nicene",
    region: "Various",
    bio: "",
    ...partial
  };
}

const images: FatherImageMap = {
  augustine: {
    alt: "Portrait of Augustine of Hippo",
    tile: {
      src: "/assets/father-img/augustine-460-aaaaaaaaaa.webp",
      srcset:
        "/assets/father-img/augustine-230-bbbbbbbbbb.webp 230w, /assets/father-img/augustine-460-aaaaaaaaaa.webp 460w",
      width: 230,
      height: 178
    },
    hero: {
      src: "/assets/father-img/augustine-720-cccccccccc.webp",
      srcset:
        "/assets/father-img/augustine-360-dddddddddd.webp 360w, /assets/father-img/augustine-720-cccccccccc.webp 720w",
      width: 489,
      height: 336
    },
    credit: {
      artist: "Philippe de Champaigne",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      source: "https://commons.wikimedia.org/wiki/File:Saint_Augustine.jpg",
      attributionRequired: true
    }
  },
  justin: {
    alt: "Portrait of Justin Martyr",
    tile: {
      src: "/assets/father-img/justin-460-eeeeeeeeee.webp",
      srcset: "/assets/father-img/justin-460-eeeeeeeeee.webp 460w",
      width: 230,
      height: 178
    },
    hero: {
      src: "/assets/father-img/justin-720-ffffffffff.webp",
      srcset: "/assets/father-img/justin-720-ffffffffff.webp 720w",
      width: 489,
      height: 336
    },
    credit: null
  }
};

const SHELL =
  '<!DOCTYPE html><html><head><title>Patrista — a searchable library of the Church Fathers</title><meta name="description" content="Look up a father, a work, or a keyword. Public-domain translations of the Church Fathers in a clean reading layout." /></head><body><div id="root"></div></body></html>';

describe("father directory copy", () => {
  it("builds the Augustine title, dates, and trailing-slash path", () => {
    expect(fatherProfileTitle("Augustine of Hippo", "354–430")).toBe(
      "Augustine of Hippo (354–430): Life and Writings"
    );
    expect(fatherProfilePath("augustine")).toBe("/fathers/augustine/");
    expect(FATHERS_INDEX_PATH).toBe("/fathers/");
    expect(lifeDatesFrom("354–430")).toEqual({ birthDate: "354", deathDate: "430" });
    expect(lifeDatesFrom("c. 340–397")).toEqual({ birthDate: "340", deathDate: "397" });
    expect(lifeDatesFrom("d. c. 110")).toEqual({ deathDate: "110" });
    expect(lifeDatesFrom("fl. c. 96")).toEqual({});
    expect(lifeDatesFrom("fl. 3rd–5th c.")).toEqual({});
  });

  it("emits exact redirects for the index and each profile, and leaves work files alone", () => {
    expect(fatherDirectoryRedirects(["augustine"])).toEqual([
      "/fathers  /fathers/index.html  200",
      "/fathers/  /fathers/index.html  200",
      "/fathers/augustine  /fathers/augustine/index.html  200",
      "/fathers/augustine/  /fathers/augustine/index.html  200"
    ]);
  });
});

describe("father directory HTML", () => {
  const augustine = author({
    id: "augustine",
    name: "Augustine of Hippo",
    dates: "354–430",
    region: "North Africa",
    deathYear: 430
  });
  const others = ["clement_rome", "ignatius", "polycarp", "justin"].map((id, index) =>
    author({ id, name: id, deathYear: 90 + index })
  );

  it("prerenders the profile with one h1, facts, a reader work link, and Person JSON-LD", () => {
    const body = renderFatherProfileBody(
      augustine,
      [
        { id: "confessions", title: "The Confessions" },
        { id: "city-of-god", title: "City of God" }
      ],
      images
    );
    expect(body.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(body).toContain("<h1>Augustine of Hippo</h1>");
    expect(body).toContain("was bishop of Hippo");
    expect(body).toContain("<dt>Dates</dt><dd>354–430</dd>");
    expect(body).toContain("<dt>Role</dt><dd>Bishop of Hippo</dd>");
    expect(body).toContain("<dt>See</dt><dd>North Africa</dd>");
    expect(body).toContain('href="/augustines-confessions"');
    expect(body).toContain('href="/read?work=city-of-god"');
    expect(body).not.toContain(".html\"");
    expect(body).toContain('alt="Portrait of Augustine of Hippo"');
    expect(body).toContain('loading="eager" fetchpriority="high"');
    expect(body).toContain('width="489"');
    expect(body).toContain('height="336"');
    expect(body).toContain("Philippe de Champaigne");
    expect(body).toContain("CC BY-SA 4.0");

    const description = fatherProfileDescription(
      "Augustine of Hippo (354–430) was bishop of Hippo in North Africa. He came to baptism in Milan under Ambrose, after years as a teacher of rhetoric and a hearer of the Manichees."
    );
    expect(description.length).toBeLessThanOrEqual(155);
    expect(description).toContain("bishop of Hippo");
    const html = prerenderShell(SHELL, "https://patrista.com", {
      canonicalPath: "/fathers/augustine/",
      title: fatherProfileTitle(augustine.name, augustine.dates),
      description,
      bodyHtml: body,
      extraHead:
        '<script type="application/ld+json" id="father-jsonld">' +
        JSON.stringify(
          fatherProfileJsonLd({
            origin: "https://patrista.com",
            name: augustine.name,
            path: "/fathers/augustine/",
            description,
            dates: augustine.dates,
            office: "Bishop of Hippo",
            region: "North Africa",
            sameAs: ["https://en.wikipedia.org/wiki/Augustine_of_Hippo", "https://www.wikidata.org/wiki/Q8018"]
          })
        ) +
        "</script>"
    });
    expect(html).toContain("<title>Augustine of Hippo (354–430): Life and Writings</title>");
    expect(html).toContain('rel="canonical" href="https://patrista.com/fathers/augustine/"');
    expect(html).toContain('"@type":"Person"');
    expect(html).toContain('"birthDate":"354"');
    expect(html).toContain('"deathDate":"430"');
    expect(html).toContain("https://www.wikidata.org/wiki/Q8018");
    expect(html).toContain('"@type":"BreadcrumbList"');
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).not.toContain('id="root"></div>');
  });

  it("prerenders the index with trailing-slash links and lazy portraits below the first row", () => {
    const body = renderFathersIndexBody([{ ...augustine, deathYear: 80 }, ...others], images);
    expect(body.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(body).toContain('href="/fathers/augustine/"');
    expect(body).not.toMatch(/href="\/fathers\/augustine"/);
    expect(body).toContain('width="230"');
    expect(body).toContain('height="178"');
    expect(body).toContain('sizes="120px"');
    const eager = body.split('fetchpriority="high"').length - 1;
    expect(eager).toBe(1);
    expect(body).toContain('loading="lazy"');
    expect(body).not.toContain("fathers-portrait-fallback");
    expect(body).not.toContain("/assets/fathers/");
    expect(body).not.toContain("/read?work=");
  });
});

describe("father portrait fallback", () => {
  it("uses Christ Pantocrator for fathers without a portrait", async () => {
    const { fatherImage } = await import("../src/lib/fatherImages");
    expect(fatherImage("tatian")?.alt).toBe("Christ Pantocrator");
    expect(fatherImage("augustine")?.alt).toContain("Augustine");
  });
});
