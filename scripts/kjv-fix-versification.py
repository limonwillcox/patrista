"""
Bring Bibles/KJV in line with the standard KJV verse numbering, and move the margin notes with the verses.

Ten chapters were off by one against the tagged KJV in public/strongs/kjv (the KJV the site's word study
and citations are numbered by):

- Six verses were missing, so every later verse in the chapter showed under the wrong number:
  Matthew 2:16, 22:1, 26:38; Mark 4:40, 7:11, 8:8. They are inserted from the public-domain KJV of
  ebible.org (eng-kjv_vpl.zip), without its pilcrows and the [brackets] it puts round italic words.
- Four verses were split in two, as some later editions do: 1 Samuel 20:42, 1 Kings 22:43, 3 John 14 and
  Revelation 13:1 (whose opening, "And I stood upon the sand of the sea", stood as Revelation 12:18).
  They are joined again.

Every inserted verse is checked word for word against the tagged KJV before anything is written, and the
script stops if any chapter is not in the state it expects. Run it again and it changes nothing.

    python -I scripts/kjv-fix-versification.py <path to eng-kjv_vpl.zip>          # dry run
    python -I scripts/kjv-fix-versification.py <path to eng-kjv_vpl.zip> --write
"""
import json
import re
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KJV = ROOT / "Bibles" / "KJV"
TAGGED = ROOT / "public" / "strongs" / "kjv"

# (book file, ebible code, chapter, verse): verses to insert.
MISSING = [("mt", "MAT", 2, 16), ("mt", "MAT", 22, 1), ("mt", "MAT", 26, 38),
           ("mk", "MAR", 4, 40), ("mk", "MAR", 7, 11), ("mk", "MAR", 8, 8)]
# (book file, chapter, verse): this verse and the next one in our file are one verse in the KJV.
SPLIT = [("1sm", 20, 42), ("1kgs", 22, 43), ("3jo", 1, 14)]


def words(s):
    """Lower-case words only; drops the tagged copy's markers for italics (add) and the divine name (nd)."""
    return [w for w in re.sub(r"[^a-z ]", " ", s.lower()).split() if w not in ("add", "nd")]


def tagged_verse(book, chapter, verse):
    data = json.loads((TAGGED / book / f"{chapter}.json").read_text(encoding="utf-8"))
    text = " ".join(tok[0] for tok in data["v"].get(str(verse), []))
    # The tagged copy keeps the margin notes inside the verse between "f" markers; drop them.
    return re.sub(r"(?:^| )f .*? f(?= |$)", " ", text)


def tagged_count(book, chapter):
    return len(json.loads((TAGGED / book / f"{chapter}.json").read_text(encoding="utf-8"))["v"])


def ebible_verses(zip_path):
    text = zipfile.ZipFile(zip_path).read("eng-kjv_vpl.txt").decode("utf-8-sig")
    out = {}
    for line in text.splitlines():
        m = re.match(r"(\w+) (\d+):(\d+) (.*)", line)
        if m:
            out[(m[1], int(m[2]), int(m[3]))] = m[4]
    return out


def clean(verse):
    verse = verse.replace("¶", "").replace("[", "").replace("]", "")
    return re.sub(r"\s+", " ", verse).strip()


def shift_notes(book_data, chapter, from_verse, by):
    """Move the notes of `chapter` at verse >= from_verse by `by` verses."""
    notes = book_data.get("notes")
    if not notes:
        return
    moved = {}
    for key, note in notes.items():
        c, v = (int(x) for x in key.split(":"))
        if c == chapter and v >= from_verse:
            v += by
        moved[f"{c}:{v}"] = note
    book_data["notes"] = dict(sorted(moved.items(), key=lambda kv: tuple(int(x) for x in kv[0].split(":"))))


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    write = "--write" in sys.argv
    source = ebible_verses(sys.argv[1])
    books = {}

    def book(name):
        if name not in books:
            books[name] = json.loads((KJV / f"{name}.json").read_text(encoding="utf-8"))
        return books[name]

    changes = 0
    for name, code, ch, v in MISSING:
        verses = book(name)["chapters"][ch - 1]
        want = tagged_count(name, ch)
        if len(verses) == want:
            continue  # already fixed
        assert len(verses) == want - 1, (name, ch, len(verses), want)
        text = clean(source[(code, ch, v)])
        assert words(text) == words(tagged_verse(name, ch, v)), (name, ch, v, text)
        # The verse now at v must be the tagged v + 1, i.e. v really is the one missing.
        assert words(verses[v - 1])[:6] == words(tagged_verse(name, ch, v + 1))[:6], (name, ch, v)
        verses.insert(v - 1, text)
        shift_notes(book(name), ch, v, +1)
        changes += 1
        print(f"insert {name} {ch}:{v}  {text[:70]}")

    for name, ch, v in SPLIT:
        verses = book(name)["chapters"][ch - 1]
        want = tagged_count(name, ch)
        if len(verses) == want:
            continue
        assert len(verses) == want + 1, (name, ch, len(verses), want)
        joined = verses[v - 1] + " " + verses[v]
        assert words(joined) == words(tagged_verse(name, ch, v)), (name, ch, v, joined)
        verses[v - 1 : v + 1] = [joined]
        # Notes on the second half stay with the joined verse; later notes move back one.
        shift_notes(book(name), ch, v + 1, -1)
        changes += 1
        print(f"join   {name} {ch}:{v}  …{joined[-60:]}")

    # Revelation 12:18 is the start of the KJV's 13:1.
    rev = book("re")["chapters"]
    if len(rev[11]) == tagged_count("re", 12) + 1:
        opening = rev[11].pop().rstrip(". ")
        rest = rev[12][0]
        rev[12][0] = opening + ", and " + (rest[4:] if rest.startswith("And ") else rest)
        assert words(rev[12][0]) == words(tagged_verse("re", 13, 1)), rev[12][0]
        changes += 1
        print(f"join   re 12:18 into 13:1  {rev[12][0][:70]}")

    for name, data in books.items():
        for i, verses in enumerate(data["chapters"]):
            count = tagged_count(name, i + 1)
            assert len(verses) == count, (name, i + 1, len(verses), count)
    print(f"{changes} changes; every changed chapter now has the tagged KJV's verse count")
    if write:
        for name, data in books.items():
            (KJV / f"{name}.json").write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        print("written")
    else:
        print("dry run: add --write to save")


if __name__ == "__main__":
    main()
