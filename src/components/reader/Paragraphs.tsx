import { Fragment, useState, type MouseEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Footnote, Passage } from "../../../server/types";
import { paraAnchor } from "../../lib/readAnchors";
import { findScriptureRefs, scriptureHref, scriptureLabel } from "../../lib/scriptureRefs";

export type ParaMenuTarget = { chapter: number; n: number; text: string; x: number; y: number };

/** Footnote text with each Bible reference turned into a link to the Bible page. */
export function NoteText({ text }: { text: string }) {
  const refs = findScriptureRefs(text);
  if (!refs.length) return <>{text}</>;
  const parts: ReactNode[] = [];
  let at = 0;
  refs.forEach((ref, i) => {
    if (ref.start > at) parts.push(text.slice(at, ref.start));
    parts.push(
      <Link key={i} className="note-ref" to={scriptureHref(ref)} title={scriptureLabel(ref)}>
        {text.slice(ref.start, ref.end)}
      </Link>
    );
    at = ref.end;
  });
  if (at < text.length) parts.push(text.slice(at));
  return <>{parts}</>;
}

function notesLabel(notes: Footnote[]): string {
  const first = notes.flatMap((n) => findScriptureRefs(n.text))[0];
  const count = notes.length + (notes.length === 1 ? " note" : " notes");
  return first ? count + " · " + scriptureLabel(first) : count;
}

function Para({
  chapter,
  num,
  text,
  dataKey,
  section,
  subAnchor,
  notes,
  onMenu
}: {
  chapter: number;
  num: number;
  text: string;
  dataKey: string;
  section: string;
  subAnchor?: string;
  notes?: Footnote[];
  onMenu: (t: ParaMenuTarget) => void;
}) {
  const [open, setOpen] = useState(false);
  const anchor = paraAnchor(chapter, num);
  function onNum(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    const r = e.currentTarget.getBoundingClientRect();
    onMenu({ chapter, n: num, text, x: r.left, y: r.bottom + 6 });
  }
  return (
    <>
      <p className="para" id={subAnchor} data-key={dataKey} data-section={section}>
        <a className="pnum para-num" id={anchor} href={"#" + anchor} aria-label={"Paragraph " + num + ": link and citation"} onClick={onNum}>
          {num}
        </a>
        {text}
        {notes?.length ? (
          <button type="button" className="para-notes-btn" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            {notesLabel(notes)}
          </button>
        ) : null}
      </p>
      {open && notes?.length ? (
        <ol className="para-notes">
          {notes.map((note) => (
            <li key={note.n}>
              <NoteText text={note.text} />
            </li>
          ))}
        </ol>
      ) : null}
    </>
  );
}

/** English paragraphs: numbered, linkable, with their footnotes. */
export function TranslationParas({
  passage,
  version,
  onMenu
}: {
  passage: Passage;
  version: string;
  onMenu: (t: ParaMenuTarget) => void;
}) {
  const paras = passage.versions[version] || [];
  const subAt = new Map((passage.sections ?? []).map((s) => [s.para, s]));
  const notesAt = new Map<number, Footnote[]>();
  for (const note of passage.footnotes || []) {
    const list = notesAt.get(note.para);
    if (list) list.push(note);
    else notesAt.set(note.para, [note]);
  }
  let n = 0;
  return (
    <>
      {paras.map((text, i) => {
        const key = passage.work + "-" + passage.chapter + "-" + version + "-" + i;
        const section = `${passage.work}:${passage.chapter}:p${i}`;
        const sub = version === "schaff" ? subAt.get(i) : undefined;
        const subHead = sub ? (
          <h3 className="read-subchapter" id={"ch-" + passage.chapter + "-" + sub.n}>
            {sub.label}
            {sub.title ? " — " + sub.title : ""}
          </h3>
        ) : null;
        if (sub && !sub.inline && !sub.hidden) return <Fragment key={key + "-h"}>{subHead}</Fragment>;
        n += 1;
        const body = (
          <Para
            chapter={passage.chapter}
            num={n}
            text={text}
            dataKey={key}
            section={section}
            subAnchor={sub?.hidden ? "ch-" + passage.chapter + "-" + sub.n : undefined}
            notes={notesAt.get(i)}
            onMenu={onMenu}
          />
        );
        return (
          <Fragment key={key}>
            {subHead && !sub?.hidden ? subHead : null}
            {body}
          </Fragment>
        );
      })}
    </>
  );
}

/** Latin or Greek paragraphs, plain. */
export function OriginalParas({ paras, lang }: { paras: string[]; lang: string }) {
  return (
    <>
      {paras.map((text, i) => (
        <p className="para para--orig" lang={lang} key={i}>
          {text}
        </p>
      ))}
    </>
  );
}
