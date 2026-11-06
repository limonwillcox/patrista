import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="stat">
      <strong>{n}</strong>
      {label}
    </div>
  );
}

export function StudyPage() {
  const { setActivePassage, catalog } = useApp();
  useEffect(() => {
    setActivePassage(null);
  }, [setActivePassage]);

  const workCount = catalog?.works.length;
  const authorCount = catalog?.authors.length;

  return (
    <div className="prose">
      <h1>Study desk</h1>
      <p>
        A short map of the library: how to open a Father, how search works, and a few first paths worth taking. Nothing here
        replaces reading the texts themselves — it only points you in.
      </p>
      <div className="stat-row">
        <Stat n={authorCount != null ? String(authorCount) : "…"} label="Fathers" />
        <Stat n={workCount != null ? String(workCount) : "…"} label="Works" />
        <Stat n="3" label="Languages" />
        <Stat n="PD" label="License" />
      </div>

      <h2>How to read</h2>
      <p>
        Pick a Father on <Link to="/fathers/">Fathers</Link> and take a book off their shelf, or use the Writings list in the
        header. The whole work sits on one page; use the chapter box to jump. Where we have the original, choose{" "}
        <strong>English</strong>, <strong>Latin</strong> or <strong>Side by side</strong> above the text.
      </p>
      <p>
        Each paragraph has a number in the margin. Click it to copy a link to that paragraph or a ready-made citation. Where the
        translator left notes, a small <em>notes</em> button opens them, and Bible references in the notes go straight to the
        verse on the <Link to="/bible">Bible</Link> page, where the Fathers&apos; commentary sits beside the text.
      </p>
      <p>
        <Link to="/types">Types of Christ</Link> gathers figures the Fathers saw in the Old Testament, from the
        paschal lamb to the bronze serpent, each with its passages from Genesis to Revelation and the Fathers&apos; own words.
      </p>
      <p>
        <Link to="/search">Search</Link> takes a word or phrase (<em>incarnation</em>, <em>restless heart</em>) and looks
        through every chapter of the English texts; narrow the results to one Father with the chips above them. A work and
        chapter (<em>Confessions 8</em>) or a Father&apos;s name opens that page directly.
      </p>

      <h2>First paths</h2>
      <ul>
        <li>
          <Link to="/read?work=confessions&chapter=8">Confessions VIII</Link> — the garden in Milan, “take up and read,” and Monica&apos;s joy at her son&apos;s conversion.
        </li>
        <li>
          <Link to="/read?work=against-heresies">Irenaeus, Against Heresies</Link> — the rule of faith against the gnostic schools.
        </li>
        <li>
          <Link to="/read?work=apology">Tertullian, The Apology</Link> — Christianity before a pagan magistrate.
        </li>
        <li>
          <Link to="/read?work=first-epistle-of-clement">1 Clement</Link> — Rome writing to Corinth while the apostles&apos;
          generation was still in living memory.
        </li>
        <li>
          <Link to="/church-history/">Church history</Link> tells the early Church&apos;s story scene by scene;{" "}
          <Link to="/fathers/#nativity">The Fathers page</Link> shows each century's events, from the Birth of Christ to 1054, beside its Fathers.
        </li>
      </ul>

      <h2>The Confessions, in brief</h2>
      <p>
        Books I–IX tell Augustine&apos;s life up to his baptism and the death of Monica. Book X turns to memory and temptation.
        Books XI–XIII pray through time and the opening of Genesis.{" "}
        <Link to="/read?work=confessions">Read the whole work</Link> ·{" "}
        <Link to="/read?work=confessions&chapter=1">Book I</Link> ·{" "}
        <Link to="/read?work=confessions&chapter=10">Book X</Link>
      </p>
    </div>
  );
}
