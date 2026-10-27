import { useEffect, useRef, useState } from "react";
import { loadAdsEnabled, saveAdsEnabled } from "../lib/adsPreference";
import { useApp } from "../context/AppContext";

export function GivePage() {
  const { setActivePassage } = useApp();
  const heroRef = useRef<HTMLElement>(null);
  const [adsOn, setAdsOn] = useState(() => loadAdsEnabled());

  useEffect(() => {
    setActivePassage(null);
  }, [setActivePassage]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const hero = heroRef.current;
    if (!hero) return;
    document.body.classList.add("give-chrome-dim");
    const io = new IntersectionObserver(
      ([entry]) => {
        const on = entry.isIntersecting && entry.intersectionRatio > 0.35;
        document.body.classList.toggle("give-chrome-dim", on);
      },
      { threshold: [0, 0.35, 0.6, 1] }
    );
    io.observe(hero);
    return () => {
      io.disconnect();
      document.body.classList.remove("give-chrome-dim");
    };
  }, []);

  function toggleAds() {
    const next = !adsOn;
    setAdsOn(next);
    saveAdsEnabled(next);
  }

  return (
    <div className="give-page">
      <section className="give-hero" ref={heroRef} aria-label="Patrista funding">
        <h1 className="give-quote">This is 100% personally funded</h1>
      </section>

      <div className="give-body">
        <p className="give-ask">
          <span>
            The easiest way to support the site is to enable ads by flipping this switch -&gt;
          </span>{" "}
          <button
            type="button"
            className={"give-ads-switch" + (adsOn ? " on" : "")}
            role="switch"
            aria-checked={adsOn}
            aria-label="Enable ads"
            onClick={toggleAds}
          />
        </p>
      </div>
    </div>
  );
}
