import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useAccount } from "../lib/account";
import { deleteAccount } from "../lib/accountSync";

/** What the site keeps about a reader, in plain words, and the button that deletes it. */
export function PrivacyPage() {
  const { setActivePassage, showToast } = useApp();
  const account = useAccount();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setActivePassage(null);
  }, [setActivePassage]);

  async function remove() {
    setBusy(true);
    const ok = await deleteAccount();
    setBusy(false);
    setAsking(false);
    showToast(ok ? "Your account is deleted. Your marks are still on this device." : "Could not reach the server. Nothing was deleted.");
  }

  return (
    <div className="about-page privacy-page">
      <article className="about-letter">
        <section className="about-block">
          <h1 className="about-q">Privacy</h1>
          <p>
            Patrista is free to read without an account. We do not run ads, we do not use cookies to follow you, and we
            do not sell or share anything about you. Cloudflare, the company that hosts the site, counts page visits
            for us without cookies and without identifying anyone.
          </p>
        </section>

        <section className="about-block">
          <h2 className="about-q">If you do not sign in</h2>
          <p>
            Your highlights, notes and settings are saved in your own browser, on your own device. They are never sent to
            us. Clearing your browser's data removes them.
          </p>
        </section>

        <section className="about-block">
          <h2 className="about-q">If you sign in with Google</h2>
          <p>Signing in is optional. It exists only so your highlights and notes are not lost. When you sign in we keep:</p>
          <ul>
            <li>your email address and the account number Google gives us for you;</li>
            <li>your highlights, your notes and the connections you saved;</li>
            <li>a record that you are signed in, which ends after 180 days or when you sign out.</li>
          </ul>
          <p>
            We do not receive your Google password, and we do not read your contacts, your mail or anything else in your
            Google account. We use your email address only to show you which account you are signed in to. We do not send
            you email.
          </p>
          <p>This is stored with Cloudflare, the company that hosts the site.</p>
        </section>

        <section className="about-block">
          <h2 className="about-q">Deleting your account</h2>
          <p>
            You can delete your account at any time. That removes your email address and every highlight and note we hold
            for you. The copies in your browser stay where they are.
          </p>
          {account ? (
            asking ? (
              <p className="privacy-delete">
                Delete the account for {account.email}?{" "}
                <button type="button" className="privacy-delete-go" disabled={busy} onClick={remove}>
                  {busy ? "Deleting…" : "Yes, delete it"}
                </button>{" "}
                <button type="button" className="privacy-delete-no" disabled={busy} onClick={() => setAsking(false)}>
                  Cancel
                </button>
              </p>
            ) : (
              <p className="privacy-delete">
                <button type="button" className="privacy-delete-go" onClick={() => setAsking(true)}>
                  Delete my account
                </button>
              </p>
            )
          ) : (
            <p>Sign in first, then come back to this page and a “Delete my account” button appears here.</p>
          )}
        </section>

        <section className="about-block">
          <h2 className="about-q">Other things the site does</h2>
          <p>
            If you <Link to="/fixes">report a problem</Link>, what you write is kept so we can fix it. Do not put anything
            private in a report. Links to books on Amazon take you to Amazon, which has its own privacy policy.
          </p>
          <p>
            Questions about any of this can be sent through the <Link to="/fixes">report form</Link>.
          </p>
        </section>
        <p className="fineprint">Last updated 13 November 2026.</p>
      </article>
    </div>
  );
}
