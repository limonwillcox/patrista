#!/usr/bin/env python3
"""
The witness signal: Bible passages that a Church Father cites together in one paragraph.

Source: the per-Father folders in Fathers/English (Schaff ANF/NPNF, public domain). The ANF/NPNF volume
folders are skipped because they repeat the same works. A body paragraph carries footnote markers like
[8556]; the footnote lines ("[8556] Gen. i. 1, 2") give the references. References written inline in
the paragraph count too. Book names come from src/lib/scriptureRefs.ts, so the site and this script
read references the same way.

A pair counts when both references sit in one paragraph that cites at most MAX_REFS passages (a long
list of proof texts says little about any one pair) and they are not in the same story (same book,
chapter distance <= 2).

Writes the table `witness` into data/connections/connections.sqlite (run build_word_layer.py first):
  witness(a, b, fathers, works, n, sample)  a < b are verse ids; fathers/works are JSON lists;
  n = distinct Fathers; sample = a short excerpt of one paragraph.

Usage:  python -I scripts/connections/build_witness.py
"""
import json
import os
import re
import sqlite3
import sys
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FATHERS = os.path.join(ROOT, "Fathers", "English")
DB = os.path.join(ROOT, "data", "connections", "connections.sqlite")
REFS_TS = os.path.join(ROOT, "src", "lib", "scriptureRefs.ts")
SKIP = {"ANF", "NPNF1", "NPNF2", "_alignment", "Josephus_English"}
MAX_REFS = 8
NEAR_CHAPTERS = 2

FOOTNOTE = re.compile(r"^\s*\[(\d+)\]\s+(.*)$")
MARKER = re.compile(r"\[(\d+)\]")
ROMAN = {"i": 1, "v": 5, "x": 10, "l": 50, "c": 100}


def load_books():
    """Book ids, chapter counts and names, read from the site's own parser."""
    src = open(REFS_TS, encoding="utf-8").read()
    books = []
    for m in re.finditer(r'\{ id: "([^"]+)", name: "([^"]+)", chapters: (\d+), names: \[([^\]]*)\] \}', src):
        names = re.findall(r'"([^"]+)"', m[4])
        books.append({"id": m[1], "name": m[2], "chapters": int(m[3]), "names": names})
    assert len(books) == 66, len(books)
    return books


def roman(s):
    s = s.lower()
    if not re.fullmatch(r"[ivxlc]+", s):
        return None
    total = 0
    for i, ch in enumerate(s):
        v, nxt = ROMAN[ch], ROMAN.get(s[i + 1], 0) if i + 1 < len(s) else 0
        total += -v if v < nxt else v
    return total or None


def make_parser(books):
    by_name = {}
    for b in books:
        for n in b["names"]:
            by_name[n.lower()] = b
    alt = "|".join(n.replace(" ", r"\s?") for n in sorted((n for b in books for n in b["names"]), key=len, reverse=True))
    ref_re = re.compile(r"(?<![A-Za-z0-9])(" + alt + r")\.?\s+([ivxlcIVXLC]+|\d{1,3})(?:\.|:|,)\s?(\d{1,3})(?:\s?[-–]\s?(\d{1,3}))?")
    prefix = re.compile(r"\b(III|II|I) (?=[A-Z][a-z])")

    def parse(text):
        text = prefix.sub(lambda m: {"I": "1", "II": "2", "III": "3"}[m[1]] + " ", text)
        out = []
        for m in ref_re.finditer(text):
            key = re.sub(r"\s+", " ", m[1].lower())
            key = re.sub(r"^([123])(?=[a-z])", r"\1 ", key)
            b = by_name.get(key)
            if not b:
                continue
            ch = int(m[2]) if m[2].isdigit() else roman(m[2])
            vs = int(m[3])
            if not ch or ch > b["chapters"] or not vs or vs > 176:
                continue
            out.append((b["id"], ch, vs))
        return out
    return parse


def blocks(text):
    """Paragraphs separated by blank lines, as lists of lines."""
    cur = []
    for line in text.splitlines():
        if line.strip():
            cur.append(line)
        elif cur:
            yield cur
            cur = []
    if cur:
        yield cur



def fathers_types(grammar_dir):
    """Types added from the Fathers in the library, one JSON file each (grammar/fathers-types/). They sit
    beside sources.json, which extract_sources.py rewrites from the private notes, so they survive that."""
    folder = os.path.join(grammar_dir, "fathers-types")
    out = {}
    for name in sorted(os.listdir(folder)) if os.path.isdir(folder) else []:
        if name.endswith(".json"):
            e = json.load(open(os.path.join(folder, name), encoding="utf-8"))
            out[e["src"]] = e
    return out


def curated(db, books, book_num):
    """
    Curated witnesses: the typological links recorded by hand from the Fathers (sources.json, entries
    "04:*"). Footnotes miss allusions -- Tertullian's dove of the flood has no footnote to Genesis 8 --
    so each Fathers entry's key texts are paired, credited to the Fathers cited for that entry.
    Stored as passage ranges: witness_curated(entry, label, fathers, cite, a0, a1, b0, b1).
    """
    sources = json.load(open(os.path.join(ROOT, "data", "connections", "grammar", "sources.json"), encoding="utf-8"))
    sources.update(fathers_types(os.path.join(ROOT, "data", "connections", "grammar")))
    by_name = {n.lower(): b for b in books for n in b["names"]}
    ref_re = re.compile(r"^(\d?\s?[A-Za-z]+)\.?\s+(\d+)(?::(\d+))?(?:[-–](\d+)(?::(\d+))?)?$")

    def rng(text):
        m = ref_re.match(text.strip().rstrip("."))
        if not m or m[1].lower() not in by_name:
            return None
        bn = book_num[by_name[m[1].lower()]["id"]] * 1_000_000
        c1, v1, x, v2 = int(m[2]), m[3], m[4], m[5]
        if v1 is None:
            c2 = int(x) if x else c1
            return bn + c1 * 1000 + 1, bn + c2 * 1000 + 999
        if x is None:
            return bn + c1 * 1000 + int(v1), bn + c1 * 1000 + int(v1)
        if v2 is None:
            return bn + c1 * 1000 + int(v1), bn + c1 * 1000 + int(x)
        return bn + c1 * 1000 + int(v1), bn + int(x) * 1000 + int(v2)

    rows = []
    for key, e in sources.items():
        if not key.startswith("04:"):
            continue
        ranges = [r for r in (rng(t) for t in re.split(r"[;,]\s*(?=\d?\s?[A-Z])", e["texts"])) if r]
        fathers = sorted({w.split(",")[0].strip("* ") for w in e["where"] if "," in w})
        cites = sorted({w.split(" — ")[0] for w in e["where"]})[:12]
        for i in range(len(ranges)):
            for j in range(i + 1, len(ranges)):
                (a0, a1), (b0, b1) = sorted((ranges[i], ranges[j]))
                if a0 // 1_000_000 == b0 // 1_000_000 and abs(a0 // 1000 % 1000 - b0 // 1000 % 1000) <= NEAR_CHAPTERS:
                    continue
                rows.append((key, e["label"], json.dumps(fathers), json.dumps(cites), a0, a1, b0, b1))
    db.execute("drop table if exists witness_curated")
    db.execute("create table witness_curated (entry TEXT, label TEXT, fathers TEXT, cite TEXT,"
               " a0 INTEGER, a1 INTEGER, b0 INTEGER, b1 INTEGER)")
    db.executemany("insert into witness_curated values (?,?,?,?,?,?,?,?)", rows)
    return len(rows)


def main():
    books = load_books()
    parse = make_parser(books)
    db = sqlite3.connect(DB)
    book_num = {b: n for n, b in db.execute("select distinct book_num, book from verses")}
    have = {v for (v,) in db.execute("select vid from verses")}

    def vid(ref):
        b, ch, vs = ref
        return book_num[b] * 1_000_000 + ch * 1000 + vs

    pairs = defaultdict(lambda: {"fathers": set(), "works": set(), "sample": ""})
    # Every verse a Father cites, alone or in a list: (verse, Father) -> paragraphs, works, one excerpt.
    cited = defaultdict(lambda: {"n": 0, "works": set(), "sample": ""})
    files = paragraphs_used = 0
    for folder in sorted(os.listdir(FATHERS)):
        path = os.path.join(FATHERS, folder)
        if folder in SKIP or not os.path.isdir(path):
            continue
        father = folder.replace("_English", "").replace("_", " ")
        for name in sorted(os.listdir(path)):
            if not name.endswith(".txt"):
                continue
            files += 1
            text = open(os.path.join(path, name), encoding="utf-8", errors="replace").read()
            work = name[:-4]
            paras = list(blocks(text))
            notes = {}
            for p in paras:
                m = FOOTNOTE.match(p[0])
                if m:
                    notes[m[1]] = " ".join([m[2]] + [l.strip() for l in p[1:]])
            for p in paras:
                if FOOTNOTE.match(p[0]):
                    continue
                body = " ".join(l.strip() for l in p)
                refs = parse(MARKER.sub(" ", body))
                for mk in MARKER.findall(body):
                    if mk in notes:
                        refs += parse(notes[mk])
                vids = sorted({vid(r) for r in refs if vid(r) in have})
                for v in vids:
                    c = cited[(v, father)]
                    c["n"] += 1
                    c["works"].add(work)
                    if not c["sample"]:
                        c["sample"] = MARKER.sub("", body)[:280].strip()
                if len(vids) < 2 or len(vids) > MAX_REFS:
                    continue
                paragraphs_used += 1
                for i in range(len(vids)):
                    for j in range(i + 1, len(vids)):
                        a, b = vids[i], vids[j]
                        if a // 1_000_000 == b // 1_000_000 and abs(a // 1000 % 1000 - b // 1000 % 1000) <= NEAR_CHAPTERS:
                            continue
                        e = pairs[(a, b)]
                        e["fathers"].add(father)
                        e["works"].add(f"{father}: {work}")
                        if not e["sample"]:
                            e["sample"] = MARKER.sub("", body)[:280].strip()

    db.execute("drop table if exists witness")
    db.execute("create table witness (a INTEGER, b INTEGER, fathers TEXT, works TEXT, n INTEGER, sample TEXT)")
    db.executemany("insert into witness values (?,?,?,?,?,?)",
                   [(a, b, json.dumps(sorted(e["fathers"])), json.dumps(sorted(e["works"])[:6]),
                     len(e["fathers"]), e["sample"]) for (a, b), e in pairs.items()])
    db.execute("create index witness_a on witness(a)")
    db.execute("create index witness_b on witness(b)")
    db.execute("drop table if exists cited")
    db.execute("create table cited (vid INTEGER, father TEXT, n INTEGER, works TEXT, sample TEXT)")
    db.executemany("insert into cited values (?,?,?,?,?)",
                   [(v, f, c["n"], json.dumps(sorted(c["works"])[:4]), c["sample"]) for (v, f), c in cited.items()])
    db.execute("create index cited_vid on cited(vid)")
    print(f"cited: {len(cited)} (verse, Father) rows over {len({v for v, _ in cited})} verses", file=sys.stderr)
    n_curated = curated(db, books, book_num)
    db.commit()
    print(f"curated witness pairs {n_curated}", file=sys.stderr)
    multi = sum(1 for e in pairs.values() if len(e["fathers"]) > 1)
    print(f"files {files}, paragraphs with 2-{MAX_REFS} refs {paragraphs_used}, "
          f"witness pairs {len(pairs)} ({multi} by more than one Father)", file=sys.stderr)


if __name__ == "__main__":
    main()
