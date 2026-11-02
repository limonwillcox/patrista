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

      <div className="give-body">
        <div className="give-ask give-ask--hardcover">
          <p className="give-ask-text">
            If you enjoy reading the Church Fathers with a physical book, in the top left corner any given work there will be a {" "}
              <a
                className="read-dict-bar read-hardcover-bar give-hardcover-sample"
                href={PRINT_EDITIONS.confessions.url}
                target="_blank"
                rel="sponsored nofollow noopener"
                >
                Get the Hardcover
              </a> button. If you buy the book through this link, it will help support the site.
            <br />
          Thank you :)
          </p>
        </div>
      </div>
    </div>
  );
}
