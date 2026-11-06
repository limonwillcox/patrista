"""
Make every verse of Bibles/KJV read exactly as the public-domain KJV of eBible.org (the 1769 standard
text, eng-kjv_vpl.zip), and keep anything else our copy had on the end of a verse as a margin note.

Our KJV came from a copy that ran some of its margin notes into the verse ("...shall not prevail against
it. Peter: this name signifies a rock"), left stray braces from its note markup ("{", "}"), printed the
epistles' subscriptions as part of the last verse, and differed from the 1769 text in spelling here and
there ("Bethel" for "Beth-el", "Abida" for "Abidah" in Genesis 25:4). Now:

- each verse is eBible's text, cleaned the way scripts/import-bibles.ts cleans every translation: no
  [brackets] round the words printed in italics, no pilcrows, spaces tidied. Nothing else changes;
- whatever our verse had after the end of eBible's text is moved to the book's "notes" map (it is a margin
  note, or an epistle's subscription in «guillemets»), so nothing is lost;
- the notes lose the stray braces.

    python -I scripts/kjv-match-ebible.py <eng-kjv_vpl.zip or eng-kjv_vpl.txt>           # dry run
    python -I scripts/kjv-match-ebible.py <eng-kjv_vpl.zip or eng-kjv_vpl.txt> --write

Running it again changes nothing. Afterwards every verse equals the cleaned eBible verse.
"""
import collections
import json
import re
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KJV = ROOT / "Bibles" / "KJV"

# eBible.org VPL book codes -> our book ids (as in scripts/import-bibles.ts).
VPL_BOOKS = {
    "GEN": "gn", "EXO": "ex", "LEV": "lv", "NUM": "nm", "DEU": "dt", "JOS": "js", "JDG": "jud", "RUT": "rt",
    "1SA": "1sm", "2SA": "2sm", "1KI": "1kgs", "2KI": "2kgs", "1CH": "1ch", "2CH": "2ch", "EZR": "ezr",
    "NEH": "ne", "EST": "et", "JOB": "job", "PSA": "ps", "PRO": "prv", "ECC": "ec", "SOL": "so", "ISA": "is",
    "JER": "jr", "LAM": "lm", "EZE": "ez", "DAN": "dn", "HOS": "ho", "JOE": "jl", "AMO": "am", "OBA": "ob",
    "JON": "jn", "MIC": "mi", "NAH": "na", "HAB": "hk", "ZEP": "zp", "HAG": "hg", "ZEC": "zc", "MAL": "ml",
    "MAT": "mt", "MAR": "mk", "LUK": "lk", "JOH": "jo", "ACT": "act", "ROM": "rm", "1CO": "1co", "2CO": "2co",
    "GAL": "gl", "EPH": "eph", "PHI": "ph", "COL": "cl", "1TH": "1ts", "2TH": "2ts", "1TI": "1tm", "2TI": "2tm",
    "TIT": "tt", "PHM": "phm", "HEB": "hb", "JAM": "jm", "1PE": "1pe", "2PE": "2pe", "1JO": "1jo", "2JO": "2jo",
    "3JO": "3jo", "JUD": "jd", "REV": "re",
}


# Verses where the KJV translators supplied "the LORD" in italics (the Hebrew lacks the divine name).
# Standard printings keep the small capitals; eBible lowercases supplied italics to "Lord". Restore them.
SUPPLIED_LORD = {
    ("1kgs", 13, 22), ("1sm", 3, 17), ("1sm", 16, 7), ("2ch", 3, 1), ("2ch", 17, 4),
    ("2ch", 18, 21), ("2kgs", 23, 19), ("dt", 16, 10), ("dt", 33, 12), ("nm", 23, 15),
}


def clean(text):
    """eBible's verse without the italics brackets and pilcrows, as scripts/import-bibles.ts cleanVerse()."""
    text = re.sub(r"[\[\]¶]", "", text)
    text = re.sub(r"\s+", " ", text)
    return re.sub(r"\s+([,.;:!?])", r"\1", text).strip()


def letters(text):
    """Letters only, folded: the two copies differ in apostrophes, hyphens, æ and case."""
    return re.sub(r"[^a-z]", "", text.lower().replace("æ", "ae"))


def read_ebible(path):
    p = Path(path)
    if p.suffix == ".zip":
        raw = zipfile.ZipFile(p).read("eng-kjv_vpl.txt").decode("utf-8-sig")
    else:
        raw = p.read_text(encoding="utf-8-sig")
    out = {}
    for line in raw.splitlines():
        m = re.match(r"(\S+) (\d+):(\d+) (.*)", line)
        if m and m[1] in VPL_BOOKS:
            out[(VPL_BOOKS[m[1]], int(m[2]), int(m[3]))] = clean(m[4])
    return out


def tail_after(ours, src):
    """What our verse has after the end of eBible's verse: "" when nothing, None when the two differ before
    that (a spelling, not an addition)."""
    want = letters(src)
    have = letters(ours)
    if not have.startswith(want):
        return None
    if have == want:
        return ""
    # Walk our text until it has used up eBible's letters, then past the verse's closing marks.
    seen = 0
    for i, ch in enumerate(ours):
        if seen == len(want):
            break
        seen += len(letters(ch))
    else:
        i = len(ours)
    return ours[i:].lstrip(" .,;:?!)’'\"")


def tidy_note(note):
    """A note without the stray braces of its old markup: "...fortified cities}" / "Cenchrea.}»"."""
    return re.sub(r"\s+", " ", note.replace("{", "").replace("}", "")).strip()


def main(src_path, write):
    src = read_ebible(src_path)
    manifest = json.loads((KJV / "manifest.json").read_text(encoding="utf-8"))
    counts = collections.Counter()
    moved = []
    for b in manifest:
        path = KJV / (b["id"] + ".json")
        book = json.loads(path.read_text(encoding="utf-8"))
        notes = dict(book.get("notes", {}))
        for ci, chapter in enumerate(book["chapters"], 1):
            for vi, ours in enumerate(chapter, 1):
                key = (b["id"], ci, vi)
                if key not in src:
                    raise SystemExit(f"{b['id']} {ci}:{vi} is not in the eBible text")
                want = src[key]
                if key in SUPPLIED_LORD:
                    want = re.sub(r"\bLord\b", "LORD", want)
                counts["verses"] += 1
                if ours == want:
                    continue
                extra = tail_after(ours, want)
                if extra:
                    note_key = f"{ci}:{vi}"
                    extra = tidy_note(extra)
                    if extra:
                        notes[note_key] = (notes[note_key] + " " + extra) if note_key in notes else extra
                        moved.append(f"{b['id']} {ci}:{vi}  {extra[:90]}")
                counts["note moved out" if extra else "wording or spelling" if extra is None else "punctuation or apostrophes"] += 1
                chapter[vi - 1] = want
        extra_verses = [k for k in src if k[0] == b["id"] and k[1] <= len(book["chapters"]) and k[2] > len(book["chapters"][k[1] - 1])]
        if extra_verses:
            raise SystemExit(f"eBible has verses our copy lacks: {extra_verses[:5]}")
        for k in list(notes):
            tidied = tidy_note(notes[k])
            counts["notes tidied"] += tidied != notes[k]
            if tidied:
                notes[k] = tidied
            else:
                del notes[k]
        if notes:
            book["notes"] = notes
        if write:
            path.write_text(json.dumps(book, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    for line in moved:
        print("  moved to notes:", line)
    print(dict(counts))
    print("written" if write else "dry run: nothing written")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    main(sys.argv[1], "--write" in sys.argv)
