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
        <Stat n="2" label="Languages" />
        <Stat n="PD" label="License" />
      </div>

      <h2>How to read</h2>
      <p>
        Open any title from <Link to="/church-fathers">Browse</Link> or the Writings list in the header. The whole work sits on
        one page; use the chapter strip to jump. <strong>Translation</strong> shows the English edition; <strong>Original</strong>{" "}
        shows Latin (or Greek) when we have it. Scripture commentary lives in the right-hand scroll on the Bible reader, not as
        inline tags in the Father text.
      </p>
      <p>
        Search accepts a keyword (<em>incarnation</em>, <em>restless</em>), a work and chapter (<em>Confessions 8</em>), or a
        father&apos;s name. Results are ordered through the corpus the way a Bible app orders a Find — by era, then author, then
        work and chapter.
      </p>

      <h2>First paths</h2>
      <ul>
        <li>
          <Link to="/read?work=confessions&chapter=8">Confessions VIII</Link> — the garden, conversion, and Monica&apos;s tears.
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
          <Link to="/church-history/">History</Link> for the cinematic;{" "}
          <Link to="/church-history/timeline#nativity">Timeline</Link> for the dated eras from the Birth of Christ to 1054.
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
