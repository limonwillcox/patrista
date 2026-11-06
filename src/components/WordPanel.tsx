import { useEffect, useState } from "react";
import { lookupWebster, reportDictionaryMiss, WEBSTER_SOURCE, type WebsterEntry } from "../lib/dictionary";
import { consonants, fetchStrongs, paleoHebrew, uncial, type StrongsEntry } from "../api/strongs";

/** The fonts for Hebrew and the old Paleo-Hebrew letters, fetched the first time a word is opened. */
function useScriptFonts() {
  useEffect(() => {
    if (document.getElementById("wd-fonts")) return;
    const link = document.createElement("link");
    link.id = "wd-fonts";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Noto+Sans+Phoenician&family=Noto+Serif+Hebrew:wght@400;600&display=swap";
    document.head.appendChild(link);
  }, []);
}

/** Text with {G4074} references turned into buttons that open that word. */
function Linked({ text, onOpen }: { text: string; onOpen: (code: string) => void }) {
  const parts = text.split(/(\{[GH]\d+\})/);
  return (
    <>
      {parts.map((p, i) => {
        const m = p.match(/^\{([GH]\d+)\}$/);
        return m ? (
          <button key={i} type="button" className="wd-ref" onClick={() => onOpen(m[1])}>
            {m[1]}
          </button>
        ) : (
          <span key={i}>{p}</span>
        );
      })}
    </>
  );
}

/** The root a word comes from, followed back as far as Strong's traces it (at most four steps). */
function useRoots(entry: StrongsEntry | null) {
  const [roots, setRoots] = useState<{ code: string; entry: StrongsEntry }[]>([]);
  useEffect(() => {
    let live = true;
    setRoots([]);
    (async () => {
      const chain: { code: string; entry: StrongsEntry }[] = [];
      let deriv = entry?.deriv ?? "";
      const seen = new Set<string>();
      for (let i = 0; i < 4; i++) {
        const m = deriv.match(/\{([GH]\d+)\}/);
        if (!m || seen.has(m[1])) break;
        seen.add(m[1]);
        const next = await fetchStrongs(m[1]);
        if (!next) break;
        chain.push({ code: m[1], entry: next });
        deriv = next.deriv;
      }
      if (live) setRoots(chain);
    })();
    return () => {
      live = false;
    };
  }, [entry]);
  return roots;
}

function short(def: string): string {
  const s = def.replace(/\{([GH]\d+)\}/g, "$1").replace(/\s+/g, " ").trim();
  return s.length > 70 ? s.slice(0, 68).replace(/[\s,;]+\S*$/, "") + "…" : s;
}

/** How the word looked on the page: the scripts it was written in, oldest last. */
function Scripts({ code, entry }: { code: string; entry: StrongsEntry }) {
  if (code.startsWith("G")) {
    return (
      <figure className="wd-leaf">
        <p className="wd-script wd-greek" lang="grc">
          {entry.lemma}
        </p>
        <p className="wd-script wd-uncial" lang="grc" aria-label={"In capitals: " + uncial(entry.lemma)}>
          {uncial(entry.lemma)}
        </p>
        <figcaption>
          Below, as the earliest Greek manuscripts write it: capitals, with no accents and no spaces between words.
        </figcaption>
      </figure>
    );
  }
  return (
    <figure className="wd-leaf">
      <p className="wd-script wd-hebrew" lang="he" dir="rtl">
        {entry.lemma}
      </p>
      <div className="wd-row">
        <p className="wd-script wd-hebrew wd-small" lang="he" dir="rtl">
          {entry.plain || consonants(entry.lemma)}
        </p>
        <p className="wd-script wd-paleo" dir="rtl" aria-label="In Paleo-Hebrew letters">
          {paleoHebrew(entry.plain || entry.lemma)}
        </p>
      </div>
      <figcaption>
        The vowel points were added by the Masoretes in roughly the 7th–10th centuries AD, some two thousand years after
        Moses. Before them the word was written in consonants only (left), and before the exile in the older Paleo-Hebrew
        letters (right).
      </figcaption>
    </figure>
  );
}

/**
 * One word from the Bible text: the Hebrew or Greek behind it, how it looked, what it means, how the
 * King James translates it elsewhere, and where it comes from. Then the English sense (Webster 1913).
 */
export function WordPanel({
  word,
  code,
  where,
  onClose
}: {
  word: string | null;
  /** "G4073" / "H6697"; "+" when the translators added the word; "" or undefined when untagged. */
  code?: string;
  where: string;
  onClose?: () => void;
}) {
  useScriptFonts();
  const [english, setEnglish] = useState<WebsterEntry | null | undefined>(undefined);
  /** The word being studied: starts at the clicked word's code, and follows links to roots. */
  const [trail, setTrail] = useState<string[]>([]);
  const [entry, setEntry] = useState<StrongsEntry | null>(null);
  /** Hebrew only: the New Testament Greek words Strong's derives from it ("Μεσσίας ... of Hebrew origin (4899)"). */
  const [greek, setGreek] = useState<{ code: string; entry: StrongsEntry }[]>([]);
  const current = trail[trail.length - 1];
  const roots = useRoots(entry);

  useEffect(() => setTrail(code && /^[GH]\d+$/.test(code) ? [code] : []), [code, word]);

  useEffect(() => {
    let live = true;
    setEntry(null);
    setGreek([]);
    if (!current) return;
    fetchStrongs(current).then(async (e) => {
      if (!live) return;
      setEntry(e);
      // Not the "lxx" list of the Open Scriptures file: it is unranked and mixed (Μεσσίας, never χριστός, for
      // mashiach; Bethesda for chesed), so it cannot say how the Septuagint renders a word.
      if (e?.greek?.length) {
        const found = await Promise.all(e.greek.map(async (c) => ({ code: c, entry: await fetchStrongs(c) })));
        if (live) setGreek(found.filter((f): f is { code: string; entry: StrongsEntry } => !!f.entry));
      }
    });
    return () => {
      live = false;
    };
  }, [current]);

  useEffect(() => {
    if (!word) return;
    let live = true;
    setEnglish(undefined);
    lookupWebster(word).then((found) => {
      if (!live) return;
      setEnglish(found);
      if (!found) reportDictionaryMiss(word, "bible");
    });
    return () => {
      live = false;
    };
  }, [word]);

  const open = (c: string) => setTrail((t) => [...t, c]);
  const lang = current?.startsWith("H") ? "Hebrew" : "Greek";

  return (
    <section className="cm wd" aria-labelledby="wd-title">
      <header className="cm-head">
        <div>
          <p className="cm-kicker">The word</p>
          <h2 id="wd-title" className="cm-title wd-title">
            {word ?? "Choose a word"}
          </h2>
          {word ? <p className="cm-sum">from {where}</p> : null}
        </div>
        {onClose ? (
          <button type="button" className="icon-btn cm-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        ) : null}
      </header>

      {!word ? (
        <div className="cm-empty">
          <p>
            Double-click any word in the Bible text. You will see the Hebrew or Greek behind it, how it was written, what it
            means, and where it comes from. Click a verse to read what the Fathers said about it.
          </p>
        </div>
      ) : null}

      {word && code === "+" ? (
        <div className="wd-note">
          <h3 className="cm-century-title">Added by the translators</h3>
          <p>
            “{word}” has no word behind it in the Hebrew or Greek. The King James translators added it so the English reads
            naturally, and printed it in italics to show that.
          </p>
        </div>
      ) : null}

      {current && entry ? (
        <div className="wd-original">
          <h3 className="cm-century-title">
            In the {lang}
            {trail.length > 1 ? (
              <button type="button" className="wd-back" onClick={() => setTrail((t) => t.slice(0, -1))}>
                ← back
              </button>
            ) : null}
          </h3>
          <Scripts code={current} entry={entry} />
          <p className="wd-say">
            <span className="wd-xlit">{entry.xlit}</span>
            {entry.pron ? <span className="wd-pron">say “{entry.pron}”</span> : null}
            <span className="wd-num">Strong's {current}</span>
          </p>
          {entry.def ? (
            <p className="wd-def">
              <Linked text={entry.def} onOpen={open} />
            </p>
          ) : null}
          {entry.senses?.length ? (
            <ul className="wd-sense-list">
              {entry.senses.map((s, i) => (
                <li key={i} className={/^\d+[a-z]/.test(s) ? "is-sub" : ""}>
                  {s.replace(/^\d+[a-z]?\)\s*/, "")}
                </li>
              ))}
            </ul>
          ) : null}

          {entry.uses?.length ? (
            <>
              <h3 className="cm-century-title">In the King James</h3>
              <p className="wd-count">
                Translated {entry.count} {entry.count === 1 ? "time" : "times"}, as:
              </p>
              <ul className="wd-uses">
                {entry.uses.map(([w, n]) => (
                  <li key={w}>
                    <span>{w}</span>
                    <span className="wd-bar" style={{ width: Math.max(6, (n / entry.uses![0][1]) * 100) + "%" }} />
                    <span className="wd-n">{n}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          {greek.length ? (
            <>
              <h3 className="cm-century-title">In the New Testament</h3>
              <p className="wd-count">Greek words that Strong's traces back to it:</p>
              <ul className="wd-chips">
                {greek.map((x) => (
                  <li key={x.code}>
                    <button type="button" onClick={() => open(x.code)}>
                      <span lang="grc">{x.entry.lemma}</span> {short(x.entry.def)}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          <h3 className="cm-century-title">Word history</h3>
          <ol className="wd-roots">
            <li className="is-here">
              <span className="wd-root-word" lang={lang === "Greek" ? "grc" : "he"}>
                {entry.lemma}
              </span>
              <span className="wd-root-gloss">
                <Linked text={entry.deriv || "Strong's gives no derivation."} onOpen={open} />
              </span>
            </li>
            {roots.map((r) => (
              <li key={r.code}>
                <button type="button" className="wd-root-word" onClick={() => open(r.code)} lang={r.code[0] === "G" ? "grc" : "he"}>
                  {r.entry.lemma}
                </button>
                <span className="wd-root-gloss">
                  {r.entry.xlit} · {short(r.entry.def)} <span className="wd-root-from">{r.entry.deriv.replace(/\{([GH]\d+)\}/g, "$1").trim()}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {word ? (
        english === undefined ? (
          <div className="cm-loading" aria-busy="true">
            <span />
          </div>
        ) : english ? (
          <div className="wd-block">
            <h3 className="cm-century-title">In English</h3>
            <ol className="wd-senses">
              {english.senses.map((sense, i) => (
                <li key={i}>{sense}</li>
              ))}
            </ol>
            <p className="wd-source">{WEBSTER_SOURCE}</p>
          </div>
        ) : null
      ) : null}

      {current ? (
        <p className="wd-credit">
          Hebrew and Greek: KJV with Strong's numbers (public domain, CrossWire Bible Society and eBible.org); Strong's
          Hebrew and Greek Dictionaries (public domain), digital edition by Open Scriptures.
          {current.startsWith("H") && entry?.senses?.length ? (
            <>
              {" "}
              The numbered senses are not Strong's: they come with the Open Scriptures Hebrew file (edited by David Troidl
              from David Instone-Brewer's text) and give the outline of the Brown–Driver–Briggs Hebrew lexicon (1906), abridged; a sense marked “TWOT” follows
              the Theological Wordbook of the Old Testament (Harris, Archer and Waltke, Moody, 1980).
            </>
          ) : null}
        </p>
      ) : null}
    </section>
  );
}
