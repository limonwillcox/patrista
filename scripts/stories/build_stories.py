#!/usr/bin/env python3
"""
The story list: every passage of the Bible that reads as one story, with its verse range.

Source: the section headings of the Berean Standard Bible (public domain, headings included), read from
its USFM release (https://github.com/BSB-publishing/bsb2usfm/releases, BSB_usfm.zip). A heading starts a
section at the next verse; the section runs to the verse before the next heading.

A section is often smaller than a story: the flood is eleven sections, Korah's rebellion five. The file
data/stories/merges.json joins neighbouring sections into one story, by hand. A merge must start where a
section starts and end where one ends, or the build stops.

Writes public/stories/<book>.json, one row per story in order:
  [first chapter, first verse, last chapter, last verse, title]
Book ids and verse counts come from Bibles/KJV, so the rows match the site's own numbering.

Usage:  python -I scripts/stories/build_stories.py [path to BSB_usfm.zip]
        (with no path, the zip is read from the release URL and not saved)
"""
import io
import json
import os
import re
import sys
import urllib.request
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
KJV = os.path.join(ROOT, "Bibles", "KJV")
MERGES = os.path.join(ROOT, "data", "stories", "merges.json")
OUT = os.path.join(ROOT, "public", "stories")
RELEASE = "https://github.com/BSB-publishing/bsb2usfm/releases/download/v5.19/BSB_usfm.zip"

# USFM book codes in the order of the KJV manifest.
USFM = (
    "GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM "
    "EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP "
    "COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV"
).split()

CHAPTER = re.compile(r"\\c (\d+)")
HEADING = re.compile(r"\\s[12]? (.+)")
VERSE = re.compile(r"\\v (\d+)")


def headings(usfm):
    """(chapter, verse, title) for each section heading: the verse is the first one after it."""
    out, chapter, pending = [], 0, None
    for line in usfm.splitlines():
        m = CHAPTER.match(line)
        if m:
            chapter = int(m[1])
            continue
        m = HEADING.match(line)
        if m:
            pending = re.sub(r"\\\w+\*?", "", m[1]).strip()
            continue
        m = VERSE.search(line)
        if m and pending is not None:
            out.append((chapter, int(m[1]), pending))
            pending = None
    return out


def sections(heads, counts):
    """Headings as ranges. `counts` is the verses in each chapter. Verses before the first heading are left out."""
    rows = []
    for i, (c, v, title) in enumerate(heads):
        if c > len(counts) or v > counts[c - 1]:
            continue
        if i + 1 < len(heads):
            nc, nv = heads[i + 1][0], heads[i + 1][1]
            ec, ev = (nc, nv - 1) if nv > 1 else (nc - 1, counts[nc - 2])
        else:
            ec, ev = len(counts), counts[-1]
        ec = min(ec, len(counts))
        ev = min(ev, counts[ec - 1])
        if (ec, ev) >= (c, v):
            rows.append([c, v, ec, ev, title])
    return rows


def point(text):
    c, v = text.split(":")
    return int(c), int(v)


def merge(rows, merges, book):
    """Replace the sections inside each merge with one story. Stops on a merge that cuts a section."""
    for m in merges:
        start, end = point(m["from"]), point(m["to"])
        inside = [r for r in rows if (r[0], r[1]) >= start and (r[2], r[3]) <= end]
        if not inside or (inside[0][0], inside[0][1]) != start or (inside[-1][2], inside[-1][3]) != end:
            near = [r for r in rows if (r[2], r[3]) >= start and (r[0], r[1]) <= end]
            sys.exit(f"merge {book} {m['from']}-{m['to']} ({m['title']}) does not match the sections: {near}")
        at = rows.index(inside[0])
        rows[at : at + len(inside)] = [[start[0], start[1], end[0], end[1], m["title"]]]
    return rows


def main():
    if len(sys.argv) > 1:
        data = open(sys.argv[1], "rb").read()
    else:
        data = urllib.request.urlopen(RELEASE, timeout=120).read()
    z = zipfile.ZipFile(io.BytesIO(data))
    files = {os.path.basename(n)[:3].upper(): n for n in z.namelist() if n.lower().endswith((".usfm", ".sfm"))}
    manifest = json.load(open(os.path.join(KJV, "manifest.json"), encoding="utf-8"))
    assert len(manifest) == len(USFM) == 66
    merges = json.load(open(MERGES, encoding="utf-8"))["stories"] if os.path.exists(MERGES) else {}
    os.makedirs(OUT, exist_ok=True)
    total = merged = 0
    for code, book in zip(USFM, manifest):
        kjv = json.load(open(os.path.join(KJV, book["id"] + ".json"), encoding="utf-8"))
        counts = [len(ch) for ch in kjv["chapters"]]
        rows = sections(headings(z.read(files[code]).decode("utf-8")), counts)
        before = len(rows)
        rows = merge(rows, merges.get(book["id"], []), book["id"])
        merged += len(merges.get(book["id"], []))
        total += len(rows)
        with open(os.path.join(OUT, book["id"] + ".json"), "w", encoding="utf-8", newline="\n") as f:
            f.write("[\n" + ",\n".join(json.dumps(r, ensure_ascii=False) for r in rows) + "\n]\n")
        if len(sys.argv) > 2 and sys.argv[2] == book["id"]:
            for r in rows:
                print(r)
        del before
    print(f"stories: {total} in 66 books ({merged} joined by hand)", file=sys.stderr)


if __name__ == "__main__":
    main()
