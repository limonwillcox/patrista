import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent } from "react";
import { FIXES_MAX_SCREENSHOT_BYTES } from "../../server/fixes";
import { useApp } from "../context/AppContext";

type Shot = { mime: string; base64: string; previewUrl: string };

function fileToShot(file: File): Promise<Shot> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please paste an image"));
      return;
    }
    if (file.size > FIXES_MAX_SCREENSHOT_BYTES) {
      reject(new Error("Screenshot is too large (max about 1.5 MB)"));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the image"));
    reader.onload = () => {
      const result = String(reader.result || "");
      const comma = result.indexOf(",");
      const base64 = comma >= 0 ? result.slice(comma + 1) : result;
      resolve({
        mime: file.type,
        base64,
        previewUrl: URL.createObjectURL(file)
      });
    };
    reader.readAsDataURL(file);
  });
}

export function FixesPage() {
  const { setActivePassage } = useApp();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [problem, setProblem] = useState("");
  const [shot, setShot] = useState<Shot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ issueUrl?: string; local?: boolean; stored?: boolean } | null>(
    null
  );
  const pasteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActivePassage(null);
  }, [setActivePassage]);

  useEffect(() => {
    return () => {
      if (shot?.previewUrl) URL.revokeObjectURL(shot.previewUrl);
    };
  }, [shot]);

  async function onPaste(e: ClipboardEvent<HTMLDivElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (!item.type.startsWith("image/")) continue;
      e.preventDefault();
      const file = item.getAsFile();
      if (!file) continue;
      try {
        const next = await fileToShot(file);
        setShot((prev) => {
          if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
          return next;
        });
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not use that image");
      }
      return;
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const base = import.meta.env.VITE_DONATE_API_BASE || "";
      const res = await fetch(base.replace(/\/+$/, "") + "/api/fixes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          problem,
          screenshot: shot
            ? { mime: shot.mime, base64: shot.base64 }
            : null
        })
      });
      const data = (await res.json()) as {
        error?: string;
        issueUrl?: string;
        local?: boolean;
        stored?: boolean;
        ok?: boolean;
      };
      if (!res.ok) {
        setError(data.error || "Could not send the report");
        return;
      }
      setDone({
        issueUrl: data.issueUrl,
        local: data.local === true,
        stored: data.stored === true
      });
    } catch {
      setError("Could not reach the Fixes API. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="fixes-page prose">
        <h1>Thank you</h1>
        <p>
          Your report is in. We read every Fixes submission and turn the clear ones into work on the library.
        </p>
        {done.issueUrl ? (
          <p>
            Tracked as{" "}
            <a href={done.issueUrl} target="_blank" rel="noreferrer">
              a GitHub issue
            </a>
            .
          </p>
        ) : done.local ? (
          <p>Saved locally for development (no GitHub token on this machine).</p>
        ) : done.stored ? (
          <p>Saved to the Fixes inbox. We will open a GitHub issue when the bot token is connected.</p>
        ) : null}
        <p>
          <button
            type="button"
            className="fixes-again"
            onClick={() => {
              setDone(null);
              setProblem("");
              setShot((prev) => {
                if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
                return null;
              });
            }}
          >
            Send another
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="fixes-page">
      <header className="fixes-hero">
        <p className="fixes-eyebrow">Workshop</p>
        <h1>Fixes</h1>
        <p className="fixes-lede">
          Something broken, confusing, or missing? Tell us. A screenshot helps; a clear sentence helps more.
        </p>
      </header>

      <form className="fixes-form" onSubmit={onSubmit} noValidate>
        <div className="fixes-names">
          <label className="fixes-field">
            <span>First name</span>
            <input
              type="text"
              name="firstName"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              maxLength={80}
            />
          </label>
          <label className="fixes-field">
            <span>Last name</span>
            <input
              type="text"
              name="lastName"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              maxLength={80}
            />
          </label>
        </div>

        <div className="fixes-field">
          <span id="fixes-shot-label">Paste screenshot here</span>
          <div
            ref={pasteRef}
            className={"fixes-paste" + (shot ? " has-shot" : "")}
            tabIndex={0}
            role="group"
            aria-labelledby="fixes-shot-label"
            onPaste={onPaste}
            onClick={() => pasteRef.current?.focus()}
          >
            {shot ? (
              <>
                <img src={shot.previewUrl} alt="Pasted screenshot preview" />
                <button
                  type="button"
                  className="fixes-clear-shot"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShot((prev) => {
                      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
                      return null;
                    });
                  }}
                >
                  Remove
                </button>
              </>
            ) : (
              <p>
                Click here, then paste (<kbd>⌘V</kbd> / <kbd>Ctrl+V</kbd>). Optional.
              </p>
            )}
          </div>
        </div>

        <label className="fixes-field">
          <span>Write problem here</span>
          <textarea
            name="problem"
            rows={8}
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            required
            maxLength={12000}
            placeholder="What happened, what you expected, and where you were (page or verse)."
          />
        </label>

        {error ? (
          <p className="fixes-error" role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" className="fixes-submit" disabled={busy}>
          {busy ? "Sending…" : "Send fix"}
        </button>
      </form>
    </div>
  );
}
