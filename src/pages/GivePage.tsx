import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  DONATE_MIN_CENTS,
  DONATE_PRESETS_CENTS,
  dollarsToCents,
  feeCoverCents,
  formatUsd,
  type DonateInterval
} from "../../server/donate";
import { useApp } from "../context/AppContext";

const CADENCE: { id: DonateInterval; label: string }[] = [
  { id: "once", label: "Once" },
  { id: "month", label: "Monthly" },
  { id: "year", label: "Yearly" }
];

export function GivePage() {
  const { setActivePassage } = useApp();
  const [params] = useSearchParams();
  const thanks = params.get("thanks") === "1";
  const canceled = params.get("canceled") === "1";
  const heroRef = useRef<HTMLElement>(null);
  const [cadence, setCadence] = useState<DonateInterval>("once");
  const [preset, setPreset] = useState<number | "other" | null>(null);
  const [other, setOther] = useState("");
  const [feeCover, setFeeCover] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setActivePassage(null);
  }, [setActivePassage]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || thanks || canceled) return;
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
  }, [thanks, canceled]);

  const amountCents = useMemo(() => {
    if (preset === "other") return dollarsToCents(other);
    if (typeof preset === "number") return preset;
    return null;
  }, [preset, other]);

  const fee = amountCents != null ? feeCoverCents(amountCents) : 0;

  async function startCheckout() {
    if (amountCents == null || amountCents < DONATE_MIN_CENTS) {
      setError("Please select an amount (minimum $1)");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const base = import.meta.env.VITE_DONATE_API_BASE || "";
      const res = await fetch(base.replace(/\/+$/, "") + "/api/donate/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCents,
          interval: cadence,
          feeCover
        })
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error || "Checkout failed");
        return;
      }
      window.location.assign(data.url);
    } catch {
      setError("Could not reach the donation checkout. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  const quoteClass = "give-quote" + (thanks || canceled ? " rest" : "");

  return (
    <div className={"give-page" + (thanks || canceled ? " give-page-static" : "")}>
      <section className="give-hero" ref={heroRef} aria-label="Patrista funding">
        <h1 className={quoteClass}>
          This site has 0 ads.
          <br />
          This site has 0 paywalls.
          <br />
          It is 100% personally funded.
        </h1>
      </section>

      <div className="give-body">
        {thanks ? (
          <p className="give-banner give-banner-thanks" role="status">
            Thank you. Gifts like yours make this resource possible..
          </p>
        ) : null}
        {canceled ? (
          <p className="give-banner" role="status">
            Donation canceled. You can try again below whenever you are ready.
          </p>
        ) : null}

        <p className="give-ask">
          If you want to support me in keeping the writings of Church History freely accessible, please
          consider giving.
        </p>

        <form
          className="give-form"
          onSubmit={(e) => {
            e.preventDefault();
            void startCheckout();
          }}
          aria-busy={busy}
        >
          <fieldset className="give-fieldset">
            <legend>How often</legend>
            <div className="give-cadence" role="group" aria-label="Donation frequency">
              {CADENCE.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={cadence === c.id}
                  className={cadence === c.id ? "active" : ""}
                  onClick={() => {
                    setCadence(c.id);
                    setError(null);
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="give-fieldset">
            <legend>Donation amount (USD)</legend>
            <div className="give-amounts">
              {DONATE_PRESETS_CENTS.map((cents) => (
                <button
                  key={cents}
                  type="button"
                  aria-pressed={preset === cents}
                  className={preset === cents ? "active" : ""}
                  onClick={() => {
                    setPreset(cents);
                    setError(null);
                  }}
                >
                  {formatUsd(cents)}
                </button>
              ))}
              <button
                type="button"
                aria-pressed={preset === "other"}
                className={preset === "other" ? "active" : ""}
                onClick={() => {
                  setPreset("other");
                  setError(null);
                }}
              >
                Other
              </button>
            </div>
            {preset === "other" ? (
              <label className="give-other">
                Other amount
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g. 15"
                  value={other}
                  onChange={(e) => {
                    setOther(e.target.value);
                    setError(null);
                  }}
                />
              </label>
            ) : null}
          </fieldset>

          <label className="give-fee">
            <input
              type="checkbox"
              checked={feeCover}
              onChange={(e) => setFeeCover(e.target.checked)}
            />
            <span>
              {amountCents == null
                ? "I'll generously add the transaction fee so you can keep 100% of my donation."
                : "I'll generously add " + formatUsd(fee) + " to cover the transaction fees so you can keep 100% of my donation."}
            </span>
          </label>

          {error ? (
            <p className="give-error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="give-submit-wrap">
            <button type="submit" className="give-submit" disabled={busy}>
              {busy ? "Opening Stripe…" : "Give"}
            </button>
          </div>

          <p className="fineprint give-legal">
            Donations keep Patrista ad-free and paywall-free. This is not a registered charity, so gifts are not tax-deductible.
            You will finish on Stripe’s secure checkout.
          </p>
        </form>
      </div>
    </div>
  );
}
