"""
Put Douay-Rheims words back under the KJV verse they translate, where the wording alignment of
scripts/import-bibles.ts (--by-wording) ran two verses into one and left the other empty.

The Douay follows the Latin Vulgate, which divides some passages differently from the Hebrew and Greek
behind the KJV. The import lays it on the KJV's numbers by wording, one source verse to one KJV verse, so
where the Vulgate has one verse for two of the KJV's, the second KJV verse was left empty and its words sat
at the end of the verse before ("Blessed are the poor in spirit ... Blessed are the meek ..." under Matthew
5:3, with 5:5 empty, because the Vulgate puts the meek before the mourners). Each move below names the
words that open the KJV verse, so it is checked by eye against the KJV, and the script stops if a verse is
not in the state it expects. Nothing is reworded: words only move to the verse they belong to.

Verses the Douay has no words for (the title of the Song of Songs, Joshua 21:36-37) stay empty; the
reader shows them as absent.

    python -I scripts/dra-fix-versification.py           # dry run
    python -I scripts/dra-fix-versification.py --write

Running it again changes nothing.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DRA = ROOT / "Bibles" / "DRA"

# (book, chapter, from verse, to verse, the words that start what moves). The words from there to the end
# of the "from" verse move to the start of the "to" verse; a move to an earlier verse ("head") takes the
# words before the marker instead.
TAIL = [
    ("gn", 38, 27, 28, "and in the very delivery of the infants"),
    ("gn", 50, 22, 23, "And he saw the children of Ephraim"),
    ("lv", 26, 45, 46, "These are the judgments, and precepts"),
    ("nm", 11, 34, 35, "And departing from the graves of lust"),
    ("nm", 27, 3, 4, "Why is his name taken away"),
    ("dt", 6, 12, 13, "Thou shalt fear the Lord thy God"),
    ("jud", 21, 24, 25, "In those days there was no king"),
    ("1ch", 20, 7, 8, "These were the sons of Rapha"),
    ("ne", 3, 30, 31, "After him Melcias the goldsmith"),
    ("job", 42, 16, 17, "and he died an old man"),
    ("ps", 5, 5, 6, "Thou wilt destroy all that speak a lie"),
    ("ps", 13, 5, 6, "I will sing to the Lord, who giveth"),
    ("ps", 20, 8, 9, "O Lord, save the king"),
    ("ps", 44, 21, 22, "Because for thy sake"),
    ("ps", 56, 10, 11, "In God have I hoped"),
    ("ps", 73, 23, 24, "and by thy will thou hast conducted me"),
    ("ps", 109, 17, 18, "And he put on cursing"),
    ("ps", 139, 3, 4, "for there is no speech in my tongue"),
    ("is", 10, 8, 9, "is not Calano as Charcamis"),
    # Isaiah 46:12-13: the Douay's 46:12 is the KJV's 46:13, and its 46:11 runs on into the KJV's 46:12.
    ("is", 46, 12, 13, "I have brought my justice near"),
    ("is", 46, 11, 12, "Hear me, O ye hardhearted"),
    ("jr", 37, 4, 5, "And the army of Pharao"),
    ("ez", 2, 9, 10, "and he spread it before me"),
    ("ho", 6, 2, 3, "We shall know, and we shall follow on"),
    ("mi", 5, 11, 12, "and I will take away sorceries"),
    # The Vulgate has the meek (5:4) before the mourners (5:5); the KJV the other way round.
    ("mt", 5, 3, 5, "Blessed are the meek"),
    ("mt", 17, 14, 15, "Lord, have pity on my son"),
    ("mk", 4, 40, 41, "And they feared exceedingly"),
    ("lk", 9, 43, 44, "Lay you up in your hearts"),
    ("act", 7, 55, 56, "And he said: Behold, I see the heavens opened"),
    ("act", 8, 8, 9, "Now there was a certain man named Simon"),
    ("act", 14, 6, 7, "and were there preaching the gospel"),
    ("act", 19, 40, 41, "And when he had said these things"),
    ("2co", 13, 12, 13, "All the saints salute you"),
    # Philippians 1:16-17 also come in the other order in the Vulgate.
    ("ph", 1, 15, 17, "Some out of charity"),
    ("1ts", 4, 11, 12, "and that you walk honestly"),
    ("2ts", 2, 10, 11, "Therefore God shall send them"),
    ("re", 20, 7, 8, "and shall go forth, and seduce the nations"),
]
HEAD = [
    # Nehemiah 7:47-48: the Douay's 7:48 opens with the KJV's 7:47.
    ("ne", 7, 48, 47, "the children of Lebana"),
]


def main(write):
    books = {}

    def chapter(b, c):
        if b not in books:
            books[b] = json.loads((DRA / (b + ".json")).read_text(encoding="utf-8"))
        return books[b]["chapters"][c - 1]

    moved = 0
    for b, c, frm, to, marker in TAIL + HEAD:
        ch = chapter(b, c)
        src, dst = ch[frm - 1], ch[to - 1]
        if marker not in src:
            if marker in dst:  # already moved
                continue
            raise SystemExit(f"{b} {c}:{frm} does not hold {marker!r}")
        if (b, c, frm, to, marker) in HEAD and src.startswith(marker) and dst.strip():  # already moved
            continue
        if dst.strip():
            raise SystemExit(f"{b} {c}:{to} is not empty: {dst[:60]!r}")
        at = src.index(marker)
        if (b, c, frm, to, marker) in HEAD:
            keep, move = src[at:], src[:at]
        else:
            keep, move = src[:at], src[at:]
        keep, move = keep.strip(), move.strip()
        if not move:
            raise SystemExit(f"{b} {c}:{frm}: nothing to move")
        ch[frm - 1], ch[to - 1] = keep, move
        moved += 1
        print(f"{b} {c}:{frm} -> {to}: {move[:80]}")
    print(f"moved {moved} passages")
    if write:
        for b, book in books.items():
            (DRA / (b + ".json")).write_text(json.dumps(book, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        print("written")
    else:
        print("dry run: nothing written")


if __name__ == "__main__":
    main("--write" in sys.argv)
