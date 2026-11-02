"""Take the translators' margin notes out of the KJV verse text and keep them beside it.

The KJV in Bibles/KJV/<book>.json came with its margin notes stuck on the end of the verse:
    "...or of he goats. he goats: Heb. great he goats"
This moves each note to the book's "notes" map, keyed "chapter:verse", and leaves the verse clean:
    chapters: "...or of he goats."      notes: {"1:11": "he goats: Heb. great he goats"}

Two signals find a note:
  1. the tagged KJV (public/strongs/kjv/<book>/<ch>.json) marks it between "f" markers (Old Testament only);
  2. its shape: words from the verse, a colon, then "Heb.", "Gr.", "or,", "Chaldee,", "that is," ... or a
     key cut short with "..." ("hast...: or, thou hast fitted me").
Every result is checked against the tagged copy: the clean verse must hold all of its words, in order.

Run:  python scripts/kjv-split-notes.py           (dry run: counts and problems)
      python scripts/kjv-split-notes.py --write   (rewrite the book files)
Running it again changes nothing.
"""
import collections
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KJV = ROOT / "Bibles" / "KJV"
TAGGED = ROOT / "public" / "strongs" / "kjv"

WORD = re.compile(r"[A-Za-z’']+")
# How a note opens. A strong opening marks a note by itself. A weak one is also real KJV wording ("in thy
# heart: that is, the word of faith"), so it needs a short key made of words the verse already has.
STRONG = r"(?:Heb\.|Heb\b|Gr\.|Chaldee,|\(Chaldee,|Chald\.|Syr\.|or,|Or,|which in the)"
WEAK = r"(?:that is\b|That is\b|also called|called\b|probably|otherwise|rather,)"
W = r"[A-Za-z’'()-]+"
# The key: words of the verse the note is about, with no stop inside, maybe cut short with "..." at the end
# or in the middle ("The wild...desert").
KEY = r"(" + W + r"(?:(?:\s|\.\.\.)" + W + r"){0,7}(?:\.\.\.)?)"
# A note starts after the verse's last mark ("»" closes an epistle's subscription). After a full stop, a
# short key may hold commas ("the LORD, and the").
AFTER_MARK = r"(?<=[.;:,?!)»])\s+"
AFTER_STOP = r"(?<=[.?!)»])\s+"
SHAPES = [
    (re.compile(AFTER_MARK + KEY + r":\s+" + STRONG), False),
    (re.compile(AFTER_STOP + r"(" + W + r"(?:,?\s" + W + r"){1,3}):\s+" + STRONG), False),
    # "Ashdothpisgah; or, the springs of Pisgah": a name after the verse's full stop.
    (re.compile(AFTER_STOP + r"([A-Z]" + W + r");\s+or,"), False),
    (re.compile(AFTER_MARK + r"(" + W + r"(?:\s" + W + r"){0,2}):\s+" + WEAK), True),
    # A key cut short with "..." is a note whatever follows.
    (re.compile(r"\s(" + W + r"(?:\s" + W + r"){0,7}\.\.\.):\s"), False),
]
# Notes no rule fits, by where they start: the last place the text appears in the verse.
BY_HAND = {
    ("mk", 7, 4): "pots: sextarius",
    # The note repeats the verse's opening words: "Praise ye the LORD. Praise: Heb. Hallelujah, etc".
    ("ps", 148, 1): "Praise ye the LORD. Praise: Heb.",
}
# What a note left in a verse looks like, for the last check.
LEFT = re.compile(r"\b(?:Heb|Gr|Chald)\.|:\s+or,|:\s+that is\b")
NOTE_PARTS = {"fr", "ft", "fq", "fqa", "fk"}
# Tagged tokens that are formatting, not words: paragraph, poetry, the divine name, added words, a break.
MARKERS = {"p", "q", "q1", "q2", "q3", "nd", "add", "b", "m", "pi", "li", "wj", "sc", "tl", "qs", "d", "mi", "nb", "pc"}


def fold(w: str) -> str:
    return re.sub(r"[’']", "", w.lower())


def tagged_parts(tokens):
    """The verse's words and its notes' words, from the tagged copy."""
    text, notes, cur, inside = [], [], [], False
    for w, c in tokens:
        if w == "f" and c == "":
            if inside:
                notes.append(cur)
            inside, cur = not inside, []
        elif inside:
            if w not in NOTE_PARTS:
                cur.append(fold(w))
        elif not (c == "" and w in MARKERS):
            text.extend(fold(p) for p in w.split())
    return text, notes


def cut_by_tags(text: str, notes) -> int | None:
    """Where the notes start, when the verse ends with exactly the tagged notes' words."""
    nw = [w for n in notes for w in n]
    ms = list(WORD.finditer(text))
    if not nw or len(ms) < len(nw) or [fold(m.group()) for m in ms[-len(nw):]] != nw:
        return None
    return ms[-len(nw)].start()


def cut_by_shape(text: str) -> int | None:
    """Where the first note starts, by its shape."""
    best = None
    for rx, check_key in SHAPES:
        for m in rx.finditer(text):
            at = m.start(1)
            words = list(WORD.finditer(m.group(1)))
            if check_key:
                key = [fold(w.group()) for w in words]
                before = {fold(w) for w in WORD.findall(text[:at])}
                if not all(k in before for k in key):
                    continue
            # A verse with no closing mark runs into its note: "the rest were blinded blinded: or, hardened".
            # The key then starts where its words repeat the ones just before them.
            ws = [fold(w.group()) for w in words]
            for k in range(1, len(ws) // 2 + 1):
                if ws[-k:] == ws[-2 * k:-k]:
                    at = m.start(1) + words[len(ws) - k].start()
                    break
            best = at if best is None else min(best, at)
            break
    return best


def anchor(text: str, at: int, tagged_words) -> int:
    """Move a cut to where the tagged copy says the verse ends. A verse that runs into its note with no
    closing mark ("hath he reconciled in...: or, by your mind") gets cut too early by shape alone. The
    first word end after the cut where the verse's end matches the tagged copy is the real end; when that
    is the end of the whole text, the "note" was verse text after all and nothing is cut."""
    if not tagged_words or ends_differ(text[:at].rstrip(), tagged_words) is None:
        return at
    for m in WORD.finditer(text):
        if m.end() <= at or ends_differ(text[: m.end()], tagged_words) is not None:
            continue
        p = m.end()
        while p < len(text) and text[p] in ".;:,?!)»”’ ":
            p += 1
        return p
    return at


def ends_differ(clean: str, tagged_words) -> str | None:
    """How the clean verse's end differs from the tagged copy's, letters only; None when they agree.
    The two editions spell some names apart ("Beersheba", "Beer-sheba"), so only the end is compared:
    a note left behind, or verse text cut away, shows there."""
    a = re.sub(r"[^a-z]", "", clean.lower())
    b = "".join(tagged_words)
    n = 0
    while n < min(len(a), len(b)) and a[-1 - n] == b[-1 - n]:
        n += 1
    if n >= 12 or a == b:
        return None
    return f"text ends …{a[-30:]} / tagged ends …{b[-30:]}"


def main(write: bool):
    manifest = json.loads((KJV / "manifest.json").read_text(encoding="utf-8"))
    moved = collections.Counter()
    problems = []
    for b in manifest:
        path = KJV / (b["id"] + ".json")
        book = json.loads(path.read_text(encoding="utf-8"))
        notes = dict(book.get("notes", {}))
        for ci, chapter in enumerate(book["chapters"], 1):
            f = TAGGED / b["id"] / f"{ci}.json"
            tv = json.loads(f.read_text(encoding="utf-8"))["v"] if f.exists() else {}
            for vi, text in enumerate(chapter, 1):
                tw, tnotes = tagged_parts(tv.get(str(vi), []))
                at = cut_by_tags(text, tnotes) if tnotes else None
                how = "tags"
                # The shape also finds a note the tagged copy left out, ahead of the ones it marks.
                by_shape = cut_by_shape(text if at is None else text[:at])
                if by_shape is not None:
                    at, how = anchor(text, by_shape, tw), ("shape" if at is None else "tags+shape")
                hand = BY_HAND.get((b["id"], ci, vi))
                if hand and hand in text:
                    at, how = text.rindex(hand), "by hand"
                if at is not None and at >= len(text):
                    at = None
                clean = text if at is None else text[:at].rstrip()
                if LEFT.search(clean):
                    problems.append(f"{b['id']} {ci}:{vi} NOTE LEFT | …{clean[-100:]}")
                diff = ends_differ(clean, tw) if tw else None
                if diff:
                    problems.append(f"{b['id']} {ci}:{vi} [{how if at is not None else 'none'}] {diff} | …{text[-100:]}")
                if at is None:
                    continue
                note = text[at:].strip()
                key = f"{ci}:{vi}"
                notes[key] = (notes[key] + " " + note) if key in notes else note
                chapter[vi - 1] = clean
                moved[how] += 1
        if notes:
            book["notes"] = notes
        if write:
            path.write_text(json.dumps(book, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"verses with notes moved: {sum(moved.values())}  {dict(moved)}")
    print(f"verses that do not match the tagged copy: {len(problems)}")
    left = [p for p in problems if "NOTE LEFT" in p]
    print(f"  a note left in the text: {len(left)}")
    for p in left[:30]:
        print("    ", p)
    cut = [p for p in problems if "NOTE LEFT" not in p and "[none]" not in p]
    print(f"  a cut verse whose end differs from the tagged copy: {len(cut)}")
    for p in cut[:40]:
        print("    ", p)
    print(f"  uncut verses whose end differs (editions apart): {len([p for p in problems if '[none]' in p])}")
    print("written" if write else "dry run: nothing written")


if __name__ == "__main__":
    main("--write" in sys.argv)
