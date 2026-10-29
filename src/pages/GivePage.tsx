import { useEffect } from "react";
import { useApp } from "../context/AppContext";
import { PRINT_EDITIONS } from "../lib/printEditions";

export function GivePage() {
  const { setActivePassage } = useApp();

  useEffect(() => {
    setActivePassage(null);
  }, [setActivePassage]);

  return (
    <div className="give-page">
      <section className="give-hero" aria-label="Patrista funding">
        <h1 className="give-quote">This is 100% personally funded</h1>
      </section>

      <div className="give-body">
        <div className="give-ask give-ask--hardcover">
          <p className="give-ask-text">
            If you enjoy reading the Church Fathers with a physical book, using the link through the{" "}
            <a
              className="read-dict-bar read-hardcover-bar give-hardcover-sample"
              href={PRINT_EDITIONS.confessions.url}
              target="_blank"
              rel="sponsored nofollow noopener"
            >
              Get the Hardcover
            </a> button helps support the site.
          </p>
        </div>
      </div>
    </div>
  );
}
