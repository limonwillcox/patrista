import { Fragment, useEffect } from "react";
import { Link } from "react-router-dom";
import { ICONS } from "../components/Icons";
import { useApp } from "../context/AppContext";
import { LANDING_NAV } from "../lib/homeNav";
import { useReadTabHref } from "../lib/useReadTabHref";
import { readPath } from "../lib/workSlugs";

type Starter = {
  id: string;
  title: string;
  author: string;
  /** Catalog work id when readable; omit for a placeholder node. */
  workId?: string;
};

type EraGroup = {
  id: string;
  label: string;
  range: string;
  works: Starter[];
};

const ERAS: EraGroup[] = [
  {
    id: "33-150",
    label: "Apostolic age",
    range: "33–150",
    works: [
      { id: "didache", title: "Didache", author: "Teaching of the Twelve Apostles", workId: "didache" },
      { id: "ignatius-epistles", title: "Epistles of Ignatius", author: "Ignatius of Antioch", workId: "epistles-of-ignatius" },
      { id: "polycarp-martyrdom", title: "The Martyrdom of Polycarp", author: "Polycarp of Smyrna", workId: "martyrdom-of-polycarp" },
      { id: "1-clement", title: "First Epistle of Clement", author: "Clement of Rome", workId: "first-epistle-of-clement" }
    ]
  },
  {
    id: "150-313",
    label: "Ante-Nicene",
    range: "150–313",
    works: [
      { id: "tertullian-apology", title: "The Apology", author: "Tertullian", workId: "apology" },
      { id: "irenaeus-heresies", title: "Against Heresies", author: "Irenaeus of Lyons", workId: "against-heresies" },
      {
        id: "clement-rich-man",
        title: "Who is the Rich Man that Shall Be Saved",
        author: "Clement of Alexandria",
        workId: "who-is-the-rich-man-that-shall-be-saved"
      },
      { id: "origen-celsus", title: "Against Celsus", author: "Origen", workId: "against-celsus" }
    ]
  },
  {
    id: "313-500",
    label: "Nicene & post-Nicene",
    range: "313–500",
    works: [
      { id: "confessions", title: "The Confessions", author: "Augustine of Hippo", workId: "confessions" },
      { id: "eusebius-history", title: "Church History", author: "Eusebius of Caesarea", workId: "church-history" },
      { id: "chrysostom-matthew", title: "Homilies on Matthew", author: "John Chrysostom", workId: "homilies-on-matthew" },
      { id: "athanasius-incarnation", title: "On the Incarnation of the Word", author: "Athanasius of Alexandria", workId: "on-the-incarnation-of-the-word" }
    ]
  },
  {
    id: "500-modern",
    label: "Later ages",
    range: "500–modern day",
    works: [
      { id: "gregory-pastoral", title: "The Book of Pastoral Rule", author: "Gregory the Great", workId: "book-of-pastoral-rule" },
      { id: "damascus-orthodox-faith", title: "Exposition of the Orthodox Faith", author: "John of Damascus", workId: "exposition-of-the-orthodox-faith" },
      { id: "councils-seven", title: "The Seven Ecumenical Councils", author: "Ecumenical Councils", workId: "seven-ecumenical-councils" }
    ]
  }
];

function StarterCard({ work }: { work: Starter }) {
  if (work.workId) {
    return (
      <Link className="starter-card" to={readPath(work.workId)}>
        <strong>{work.title}</strong>
        <span className="sr-only"> by </span>
        <span className="starter-author">{work.author}</span>
      </Link>
    );
  }
  return (
    <div className="starter-card starter-card--soon" data-starter-id={work.id} aria-disabled="true">
      <strong>{work.title}</strong>
      <span className="sr-only"> by </span>
      <span className="starter-author">{work.author}</span>
      <span className="sr-only">. </span>
      <span className="starter-soon">Coming soon</span>
    </div>
  );
}

export function HomePage() {
  const { setActivePassage } = useApp();
  const readHref = useReadTabHref();

  useEffect(() => {
    setActivePassage(null);
  }, [setActivePassage]);

  useEffect(() => {
    document.body.classList.add("home-landing");
    return () => document.body.classList.remove("home-landing");
  }, []);

  return (
    <div className="landing">
      <section className="landing-hero" aria-label="Welcome">
        <div className="landing-hero-bg" role="img" aria-label="The Council of Nicaea" />
        <div className="landing-hero-shade" />
        <div className="landing-hero-inner">
          <p className="landing-kicker">Patrista</p>
          <blockquote className="landing-quote">
            <p>Knowing this first, that no prophecy of the scripture is of any private interpretation.</p>
            <p>
              For the prophecy came not in old time by the will of man: but holy men of God spake as they were moved by the
              Holy Ghost.
            </p>
            <cite>2 Peter 1:20–21</cite>
          </blockquote>
          <nav className="landing-ctas" aria-label="Site sections">
            {LANDING_NAV.map((item) => (
              <Link
                key={item.id}
                className={"landing-tile" + (item.featured ? " landing-tile--featured" : "")}
                to={item.id === "read" ? readHref : item.href}
              >
                {ICONS[item.id]}
                <span>{item.label}</span>
              </Link>
            )).flatMap((el, i) => (i ? [" ", el] : [el]))}
          </nav>
        </div>
      </section>

      <section className="landing-starters" id="great-places" aria-labelledby="great-places-title">
        <div className="landing-starters-inner">
          <h2 id="great-places-title">Great places to start</h2>
          <p className="landing-starters-lede">
            Four eras, a few trustworthy first reads to begin exploring the library.
          </p>
          <div className="starter-eras">
            {ERAS.map((era) => (
              <div className="starter-era" key={era.id}>
                <header className="starter-era-head">
                  <span className="starter-era-range">{era.range}</span>
                  <h3>{era.label}</h3>
                </header>
                <div className="starter-list">
                  {era.works.map((w) => (
                    <Fragment key={w.id}>
                      <StarterCard work={w} />{" "}
                    </Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
