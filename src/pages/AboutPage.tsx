import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";

export function AboutPage() {
  const { setActivePassage } = useApp();
  useEffect(() => {
    setActivePassage(null);
  }, [setActivePassage]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    document.body.classList.add("about-read-dim");
    return () => {
      document.body.classList.remove("about-read-dim");
    };
  }, []);

  return (
    <div className="about-page">
      <div className="about-vignette" aria-hidden="true" />
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
            everyone. If you want to <Link to="/give">support this site</Link> with more than just feedback, I would really
            appreciate it — but it is absolutely not necessary.
          </p>
        </section>
      </article>
    </div>
  );
}
