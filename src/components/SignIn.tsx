import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { accountsEnabled, GOOGLE_CLIENT_ID, useAccount } from "../lib/account";
import { onMark, signInWithGoogle, signOut, startAccountSync } from "../lib/accountSync";
import { countMarks } from "../lib/markMerge";

/**
 * Optional sign-in. Nothing here ever stands between a reader and a highlight: marks save in the
 * browser at once, and these pieces only offer to keep them somewhere they cannot be lost.
 */

type GoogleId = {
  initialize(opts: { client_id: string; callback: (res: { credential?: string }) => void }): void;
  renderButton(el: HTMLElement, opts: Record<string, unknown>): void;
};

const GSI_SRC = "https://accounts.google.com/gsi/client";
let gsiLoading: Promise<GoogleId> | null = null;

/** Google's sign-in script, fetched only when someone opens the sign-in box. */
function loadGoogle(): Promise<GoogleId> {
  if (gsiLoading) return gsiLoading;
  gsiLoading = new Promise<GoogleId>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.onload = () => {
      const id = (window as unknown as { google?: { accounts?: { id?: GoogleId } } }).google?.accounts?.id;
      if (id) resolve(id);
      else reject(new Error("Google sign-in did not load"));
    };
    script.onerror = () => reject(new Error("Google sign-in did not load"));
    document.head.appendChild(script);
  }).catch((err) => {
    gsiLoading = null;
    throw err;
  });
  return gsiLoading;
}

/** The sign-in box: one Google button. Opened from the header, the menu, or the bar below. */
export function SignInDialog() {
  const { loginOpen, setLoginOpen, showToast, theme } = useApp();
  const account = useAccount();
  const slot = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const open = loginOpen && accountsEnabled && !account;

  useEffect(() => {
    if (!open) return;
    let gone = false;
    setError("");
    loadGoogle()
      .then((google) => {
        if (gone || !slot.current) return;
        google.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (res) => {
            if (!res.credential) return;
            setBusy(true);
            void signInWithGoogle(res.credential).then((result) => {
              setBusy(false);
              if (!result.ok) return setError(result.error);
              setLoginOpen(false);
              showToast("Signed in. Your highlights and notes are saved.");
            });
          }
        });
        slot.current.innerHTML = "";
        google.renderButton(slot.current, {
          type: "standard",
          theme: theme === "night" ? "filled_black" : "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: 280
        });
      })
      .catch(() => {
        if (!gone) setError("Google sign-in could not load. Check your connection, or an ad blocker may be stopping it.");
      });
    return () => {
      gone = true;
    };
  }, [open, theme, setLoginOpen, showToast]);

  if (!open) return null;
  return (
    <div className="modal-back open" onClick={() => setLoginOpen(false)}>
      <div className="modal signin" role="dialog" aria-modal="true" aria-labelledby="signinTitle" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="signin-close" aria-label="Close" onClick={() => setLoginOpen(false)}>
          ×
        </button>
        <h2 id="signinTitle">Keep your highlights and notes</h2>
        <p className="signin-copy">
          Sign in and everything you have marked here is saved to your account, and follows you to your other devices.
        </p>
        <div className="signin-google" ref={slot} aria-busy={busy} />
        {busy ? <p className="signin-status">Saving your highlights…</p> : null}
        {error ? (
          <p className="signin-error" role="alert">
            {error}
          </p>
        ) : null}
        <p className="signin-fine">
          Optional. We keep only your email address and your marks.{" "}
          <Link to="/privacy" onClick={() => setLoginOpen(false)}>
            Privacy
          </Link>
        </p>
      </div>
    </div>
  );
}

/** "Sign in", or once signed in the address and "Sign out". `kind` picks the header or the ⋯ menu look. */
export function AccountLink({ kind }: { kind: "header" | "menu" }) {
  const { setLoginOpen, showToast } = useApp();
  const account = useAccount();
  if (!accountsEnabled) return null;
  const cls = kind === "header" ? "header-link header-account" : "site-menu-item";
  if (!account) {
    return (
      <button type="button" className={cls} onClick={() => setLoginOpen(true)}>
        Sign in
      </button>
    );
  }
  return (
    <button
      type="button"
      className={cls}
      title={"Signed in as " + account.email}
      onClick={() => {
        void signOut().then(() => showToast("Signed out. Your marks are still on this device."));
      }}
    >
      Sign out
      {kind === "menu" ? <span className="site-menu-note">{account.email}</span> : null}
    </button>
  );
}

const NUDGE_KEY = "patrista-signin-nudge-v1";
/** Scrolling this far after making a mark counts as moving on. */
const SCROLL_AWAY_PX = 120;
/** After one dismissal, ask once more when there is this much to lose. */
const SECOND_ASK_MARKS = 10;

function dismissals(): number {
  try {
    return Number(localStorage.getItem(NUDGE_KEY)) || 0;
  } catch {
    return 0;
  }
}

/** Ask after the first mark; if dismissed, once more at ten marks; then never again. */
export function nudgeDue(dismissed: number, marks: number): boolean {
  if (dismissed <= 0) return marks >= 1;
  if (dismissed === 1) return marks >= SECOND_ASK_MARKS;
  return false;
}

/**
 * A quiet bar at the bottom, shown once the reader has made a mark and scrolled on: marks live only
 * in this browser and can be lost. It never interrupts the highlight itself.
 */
export function SignInNudge() {
  const { setLoginOpen } = useApp();
  const account = useAccount();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!accountsEnabled) return;
    return startAccountSync();
  }, []);

  useEffect(() => {
    if (!accountsEnabled || account) {
      setShow(false);
      return;
    }
    let armed = false;
    const starts = new Map<EventTarget, number>();
    const offMark = onMark(() => {
      if (!nudgeDue(dismissals(), countMarks(localStorage))) return;
      armed = true;
      starts.clear();
    });
    function onScroll(e: Event) {
      if (!armed) return;
      const target = e.target === document ? document.scrollingElement : e.target;
      if (!(target instanceof Element)) return;
      const at = target.scrollTop;
      const from = starts.get(target);
      if (from == null) return void starts.set(target, at);
      if (Math.abs(at - from) < SCROLL_AWAY_PX) return;
      armed = false;
      setShow(true);
    }
    // Capture: the readers scroll inside their own panes, and scroll events do not bubble.
    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => {
      offMark();
      document.removeEventListener("scroll", onScroll, { capture: true });
    };
  }, [account]);

  if (!show) return null;
  function dismiss() {
    try {
      localStorage.setItem(NUDGE_KEY, String(dismissals() + 1));
    } catch {
      /* private window */
    }
    setShow(false);
  }
  return (
    <div className="signin-nudge" role="status">
      <p>Your highlights and notes are only saved on this device and may disappear. Sign in to keep them.</p>
      <button
        type="button"
        className="signin-nudge-go"
        onClick={() => {
          setShow(false);
          setLoginOpen(true);
        }}
      >
        Sign in
      </button>
      <button type="button" className="signin-nudge-close" aria-label="Dismiss" onClick={dismiss}>
        ×
      </button>
    </div>
  );
}
