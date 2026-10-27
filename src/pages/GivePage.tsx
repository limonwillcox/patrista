import { useEffect, useState } from "react";
import { loadAdsEnabled, saveAdsEnabled } from "../lib/adsPreference";
import { useApp } from "../context/AppContext";

export function GivePage() {
  const { setActivePassage } = useApp();
  const [adsOn, setAdsOn] = useState(() => loadAdsEnabled());

  useEffect(() => {
    setActivePassage(null);
  }, [setActivePassage]);

  function toggleAds() {
    const next = !adsOn;
    setAdsOn(next);
    saveAdsEnabled(next);
  }

  return (
    <div className="give-page">
      <section className="give-hero" aria-label="Patrista funding">
        <h1 className="give-quote">This is 100% personally funded</h1>
      </section>

      <div className="give-body">
        <div className="give-ask">
          <p className="give-ask-text">
            The easiest way to support the site is to enable ads by flipping this switch
          </p>
          <div className="give-ask-cue">
            <span className="give-ask-arrow" aria-hidden="true">
              ↓
            </span>
            <button
              type="button"
              className={"give-ads-switch" + (adsOn ? " on" : "")}
              role="switch"
              aria-checked={adsOn}
              aria-label="Enable ads"
              onClick={toggleAds}
            />
          </div>
        </div>
        <div className="give-ask give-ask--hardcover">
          <p className="give-ask-text">
            If you enjoy reading the Church Fathers with a physical book, using the link through the{" "}
            <span className="read-dict-bar read-hardcover-bar give-hardcover-sample">Get the Hardcover</span> button also
            substantially helps support the site.
          </p>
        </div>
      </div>
    </div>
  );
}
