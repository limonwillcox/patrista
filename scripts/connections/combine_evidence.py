#!/usr/bin/env python3
"""
Combine the signals for each pair of tagged stories (METHOD rule 12).

  shape    the local-alignment score and its chance test (shape-matches.json)
  words    rare Hebrew/Greek words the two passages share (connections.sqlite, links table)
  witness  Fathers who cite both passages in one paragraph, or a curated patristic link

Tiers
  established  shape (p < 0.1) + shared rare words + a witness
  supported    two of the three
  candidate    one of the three


Usage:  python -I scripts/connections/combine_evidence.py
"""
import json
import os
import re
import sqlite3
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB = os.path.join(ROOT, "data", "connections", "connections.sqlite")
STORIES = os.path.join(ROOT, "data", "connections", "stories", "stories.json")
MATCHES = os.path.join(ROOT, "data", "connections", "shape-matches.json")
OUT = os.path.join(ROOT, "data", "connections", "story-evidence.json")

ABBR = {"Gen": "gn", "Exod": "ex", "Lev": "lv", "Num": "nm", "Deut": "dt", "Josh": "js", "Judg": "jud",
        "1 Sam": "1sm", "2 Sam": "2sm", "1 Kgs": "1kgs", "2 Kgs": "2kgs", "Jonah": "jn", "Matt": "mt",
        "Mark": "mk", "Luke": "lk", "John": "jo", "Rom": "rm"}
REF = re.compile(r"^(\d?\s?[A-Za-z]+)\s+(\d+)(?::(\d+))?(?:-(\d+)(?::(\d+))?)?$")
SHAPE_P = 0.1
WORD_MIN = 5.0     # a shared-word link must score at least this to count


def verse_range(ref, book_num):
    """'Gen 6:1-9:17' -> (first vid, last vid). Chapter-only refs cover whole chapters."""
    m = REF.match(ref.strip())
    if not m:
        raise ValueError(f"cannot parse reference {ref!r}")
    book, c1, v1, x, v2 = m.groups()
    bn = book_num[ABBR[book]]
    c1 = int(c1)
    if v1 is None:                       # "Gen 37-41" or "Gen 3"
        c2 = int(x) if x else c1
        return bn * 1_000_000 + c1 * 1000 + 1, bn * 1_000_000 + c2 * 1000 + 999
    v1 = int(v1)
    if x is None:                        # "Gen 1:2"
        return (bn * 1_000_000 + c1 * 1000 + v1,) * 2
    if v2 is None:                       # "Gen 1:1-10"
        return bn * 1_000_000 + c1 * 1000 + v1, bn * 1_000_000 + c1 * 1000 + int(x)
    return bn * 1_000_000 + c1 * 1000 + v1, bn * 1_000_000 + int(x) * 1000 + int(v2)


def main():
    db = sqlite3.connect(DB)
    book_num = {b: n for n, b in db.execute("select distinct book_num, book from verses")}
    gloss = {c: x for c, x in db.execute("select code, xlit from words")}
    stories = {s["id"]: s for s in json.load(open(STORIES, encoding="utf-8"))["stories"]}
    matches = json.load(open(MATCHES, encoding="utf-8"))["results"]
    ranges = {sid: verse_range(s["ref"], book_num) for sid, s in stories.items()}

    rows = []
    for r in matches:
        if r["b"].startswith("seq:"):
            continue
        (a0, a1), (b0, b1) = ranges[r["a"]], ranges[r["b"]]
        links = db.execute(
            "select score, evidence from links where "
            "((a between ? and ? and b between ? and ?) or (a between ? and ? and b between ? and ?)) "
            "and score >= ? order by score desc",
            (a0, a1, b0, b1, b0, b1, a0, a1, WORD_MIN)).fetchall()
        words = {}
        for _, ev in links:
            for code, s in json.loads(ev):
                words[code] = max(words.get(code, 0), s)
        top_words = sorted(words.items(), key=lambda kv: -kv[1])[:5]
        shape = r["p"] < SHAPE_P and r["matched"] >= 2
        word = bool(words)
        cited = db.execute(
            "select fathers from witness where (a between ? and ? and b between ? and ?)"
            " or (a between ? and ? and b between ? and ?)", (a0, a1, b0, b1, b0, b1, a0, a1)).fetchall()
        curated = db.execute(
            "select fathers, label from witness_curated where (a0 <= ? and a1 >= ? and b0 <= ? and b1 >= ?)"
            " or (a0 <= ? and a1 >= ? and b0 <= ? and b1 >= ?)",
            (a1, a0, b1, b0, b1, b0, a1, a0)).fetchall()
        fathers = sorted({f for (fs,) in cited for f in json.loads(fs)} | {f for fs, _ in curated for f in json.loads(fs)})
        witness = bool(fathers)
        n = shape + word + witness
        tier = "established" if n == 3 else "supported" if n == 2 else "candidate" if n == 1 else "none"
        rows.append({"a": r["a"], "b": r["b"], "tier": tier, "shape_score": r["score"], "shape_p": r["p"],
                     "verse_links": len(links),
                     "words": [f"{c} {gloss.get(c, '')}" for c, _ in top_words], "witness": fathers or None,
                     "witness_footnotes": len(cited), "witness_curated": sorted({l for _, l in curated})})

    order = {"established": 0, "supported": 1, "candidate": 2, "none": 3}
    rows.sort(key=lambda x: (order[x["tier"]], -x["shape_score"]))
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=1)
    sys.stdout.reconfigure(encoding="utf-8")
    for x in rows:
        if x["tier"] in ("none",):
            continue
        print(f"{x['tier']:<10} {x['a']:<17} {x['b']:<17} shape {x['shape_score']:.2f} p={x['shape_p']:.3f}  "
              f"links {x['verse_links']:>3}  {', '.join(x['words'][:4])}")


if __name__ == "__main__":
    main()
