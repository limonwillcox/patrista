import { AMAZON_DISCLOSURE } from "../lib/printEditions";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";

export function AboutPage() {
  const { setActivePassage } = useApp();
  useEffect(() => {
    setActivePassage(null);
  }, [setActivePassage]);

  return (
    <div className="about-page">
      <article className="about-letter">
        <section className="about-block about-what">
          <h1 className="about-q">What is Patrista?</h1>
          <p>Patrista is a free, searchable library of the Church Fathers.</p>
        </section>

        <section className="about-block about-why">
          <h2 className="about-q">Why does Patrista exist?</h2>
          <p>
            A few years ago I found myself really wanting to dive deep into church history. Searching the web, I found that
            everything was either steeply paywalled or almost unusable. Once I found out how easy it was to get Bible
            translations and English translations of the Church Fathers in digital form, I decided to give a crack at making
            my own site.
          </p>
          <p>
            This is a pretty small operation, so any{" "}
            <Link to="/fixes">feedback</Link> you can give is gold, and unbelievably helpful in making the site better for
            everyone.
          </p>
        </section>
        <p className="fineprint">
          {AMAZON_DISCLOSURE} <Link to="/privacy">Privacy</Link>
        </p>
      </article>
    </div>
  );
}
