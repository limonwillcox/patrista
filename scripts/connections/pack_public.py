#!/usr/bin/env python3
"""
Pack the Connections data into small static files under public/connections/, one per thing the
reader can click. Vite serves public/ as-is in dev and copies it into dist/ on build.

  meta.json                       books and book groups
  verse/<book>/<chapter>.json     per verse: word links, passages the Fathers cite with it, the Fathers who
                                  cite it; per chapter: the types the Fathers draw that touch it
  word/<H|G><bucket>.json         per Hebrew/Greek word: verses, related words
  cited.json                      per verse: how many times the Fathers cite it
  types.json                      every type the Fathers draw: meaning, their words, and all its passages
  glosses.json                    per Hebrew/Greek word: the English word the KJV most often uses for it

Run after build_word_layer.py and build_witness.py.
Usage:  python -I scripts/connections/pack_public.py
"""
import json
import os
import shutil
import sqlite3
import sys
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA = os.path.join(ROOT, "data", "connections")
OUT = os.path.join(ROOT, "public", "connections")
BUCKET = 250
QUOTA = {"cross": 8, "same": 8}  # links inside the same story are left out
FATHERS_SAMPLES = 3
WITNESS_PER_VERSE = 10
NEAR_CHAPTERS = 2  # a Father citing "John i. 1-3" links 1:1 to 1:2 and 1:3: the same story, left out
SAMPLES_PER_VERSE = 2

GROUPS = [
    ("law", "Law", ["gn", "ex", "lv", "nm", "dt"]),
    ("history", "History", ["js", "jud", "rt", "1sm", "2sm", "1kgs", "2kgs", "1ch", "2ch", "ezr", "ne", "et"]),
    ("wisdom", "Wisdom and Psalms", ["job", "ps", "prv", "ec", "so"]),
    ("prophets", "Prophets", ["is", "jr", "lm", "ez", "dn", "ho", "jl", "am", "ob", "jn", "mi", "na", "hk", "zp", "hg", "zc", "ml"]),
    ("gospels", "Gospels and Acts", ["mt", "mk", "lk", "jo", "act"]),
    ("letters", "Letters", ["rm", "1co", "2co", "gl", "eph", "ph", "cl", "1ts", "2ts", "1tm", "2tm", "tt", "phm",
                            "hb", "jm", "1pe", "2pe", "1jo", "2jo", "3jo", "jd"]),
    ("revelation", "Revelation", ["re"]),
]
KIND_CODE = {"cross": "c", "same": "s"}



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

def dump(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))


def main():
    db = sqlite3.connect(os.path.join(DATA, "connections.sqlite"))
    manifest = json.load(open(os.path.join(ROOT, "Bibles", "KJV", "manifest.json"), encoding="utf-8"))
    group_of = {b: g for g, _, bs in GROUPS for b in bs}
    # Replace only what this script writes.
    for sub in ("verse", "word"):
        if os.path.exists(os.path.join(OUT, sub)):
            shutil.rmtree(os.path.join(OUT, sub))
    for old in ("map.json", "stories.json", "patterns.json", "grammar.json"):  # retired from the site
        if os.path.exists(os.path.join(OUT, old)):
            os.remove(os.path.join(OUT, old))

    # ---- meta ----
    verses_in = defaultdict(int)
    for (v,) in db.execute("select vid from verses"):
        verses_in[v // 1000] += 1
    dump(os.path.join(OUT, "meta.json"), {
        "books": [{"id": b["id"], "name": b["name"], "chapters": b["chapters"], "n": i + 1, "group": group_of[b["id"]]}
                  for i, b in enumerate(manifest)],
        "groups": [{"id": g, "label": label} for g, label, _ in GROUPS],
    })

    # ---- word links per verse ----
    # Read one verse's links at a time (indexes on a and b): holding all ~1M links at once ran out of memory.
    def links_of(v):
        per = defaultdict(list)
        for o, score, kind, ev in db.execute(
                "select b, score, kind, evidence from links where a = ? "
                "union all select a, score, kind, evidence from links where b = ?", (v, v)):
            per[kind].append((score, o, [c for c, _ in json.loads(ev)][:4]))
        return per
    wit = defaultdict(list)
    for a, b, fathers, works, n, sample in db.execute("select a, b, fathers, works, n, sample from witness"):
        row = (n, json.loads(fathers), json.loads(works), sample)
        wit[a].append((b,) + row)
        wit[b].append((a,) + row)
    curated = db.execute("select entry, label, fathers, cite, a0, a1, b0, b1 from witness_curated").fetchall()

    chapters = defaultdict(dict)
    for (v,) in db.execute("select vid from verses").fetchall():
        out = {}
        links = []
        per = links_of(v)
        for kind, q in QUOTA.items():
            for score, o, codes in sorted(per[kind], key=lambda x: (-x[0], x[1]))[:q]:
                links.append([o, round(score, 1), KIND_CODE[kind], codes])
        if links:
            out["l"] = links
        # The Father links worth showing: outside the verse's own story, most Fathers first, then most paragraphs.
        def same_story(o):
            return o // 1_000_000 == v // 1_000_000 and abs(o // 1000 % 1000 - v // 1000 % 1000) <= NEAR_CHAPTERS
        ws = sorted((x for x in wit[v] if not same_story(x[0])), key=lambda x: (-len(x[2]), -x[1]))[:WITNESS_PER_VERSE]
        if ws:
            out["w"] = [[o, n, fathers, works[:3]] + ([sample] if i < SAMPLES_PER_VERSE else [])
                        for i, (o, n, fathers, works, sample) in enumerate(ws)]
        fs = db.execute("select father, n, works, sample from cited where vid = ? order by n desc, father", (v,)).fetchall()
        if fs:
            out["f"] = [[f, n, json.loads(w)[:3]] + ([sample] if i < FATHERS_SAMPLES else [])
                        for i, (f, n, w, sample) in enumerate(fs)]
        if out:
            chapters[v // 1000][v % 1000] = out
    book_id = {i + 1: b["id"] for i, b in enumerate(manifest)}
    files = 0
    for key in sorted(verses_in):
        bn, ch = key // 1000, key % 1000
        cur = [[e, label, json.loads(f), json.loads(c), a0, a1, b0, b1]
               for e, label, f, c, a0, a1, b0, b1 in curated
               if (a0 // 1000 <= key <= a1 // 1000) or (b0 // 1000 <= key <= b1 // 1000)]
        dump(os.path.join(OUT, "verse", book_id[bn], f"{ch}.json"), {"v": chapters.get(key, {}), "c": cur})
        files += 1

    # ---- words ----
    occ = defaultdict(list)
    for code, v in db.execute("select code, vid from word_occ order by vid"):
        occ[code].append(v)
    rel = defaultdict(list)
    for code, r, kind, w in db.execute("select code, related, kind, weight from word_edges"):
        # A bridge found by English rendering or listed by hand is shown as an equivalent, like the Septuagint's.
        kind = "lxx" if kind in ("lxx", "english", "key") else kind
        rel[code].append([r, kind])
        rel[r].append([code, "lxx-of" if kind == "lxx" else "root-of"])
    buckets = defaultdict(dict)
    for code, n, first in db.execute("select code, verse_count, first_vid from words"):
        entry = {"n": n, "o": occ[code]}
        if rel[code]:
            entry["r"] = rel[code][:24]
        buckets[code[0] + str(int(code[1:]) // BUCKET)][code] = entry
    for name, content in buckets.items():
        dump(os.path.join(OUT, "word", name + ".json"), content)

    # ---- glosses: the English word the KJV most often uses for each Hebrew/Greek word ----
    counts = defaultdict(lambda: defaultdict(int))
    tagged = os.path.join(ROOT, "public", "strongs", "kjv")
    for bk in os.listdir(tagged):
        for name in os.listdir(os.path.join(tagged, bk)):
            ch = json.load(open(os.path.join(tagged, bk, name), encoding="utf-8"))
            for toks in ch["v"].values():
                for word, code in toks:
                    if code[:1] in "GH" and code[1:].isdigit() and word.isalpha():
                        counts[code][word] += 1
    glosses = {}
    for code, ws in counts.items():
        lower = defaultdict(int)
        for w, n in ws.items():
            lower[w.lower()] += n
        best = max(lower, key=lambda w: (lower[w], w))
        glosses[code] = max((w for w in ws if w.lower() == best), key=lambda w: ws[w])  # its usual casing
    dump(os.path.join(OUT, "glosses.json"), glosses)

    # ---- the types the Fathers draw, each with all its passages ----
    sources = json.load(open(os.path.join(DATA, "grammar", "sources.json"), encoding="utf-8"))
    sources.update(fathers_types(os.path.join(DATA, "grammar")))
    links_file = os.path.join(DATA, "grammar", "type-links.json")
    type_links = json.load(open(links_file, encoding="utf-8")) if os.path.exists(links_file) else {}
    ranges = defaultdict(set)
    for entry, a0, a1, b0, b1 in db.execute("select entry, a0, a1, b0, b1 from witness_curated"):
        ranges[entry].update({(a0, a1), (b0, b1)})
    types = []
    for entry, rs in ranges.items():
        src = sources.get(entry, {})
        # Keep the widest of overlapping ranges, so "Genesis 6-9" and "Genesis 8:6-12" do not both show.
        kept = []
        for r in sorted(rs, key=lambda r: (r[0], -(r[1] - r[0]))):
            if kept and r[0] >= kept[-1][0] and r[1] <= kept[-1][1]:
                continue
            kept.append(list(r))
        t = {"id": entry, "label": src.get("label", entry), "def": src.get("def", ""), "kind": src.get("kind", ""),
             "christ": src.get("christ", ""), "where": src.get("where", []), "ranges": kept}
        # The reader paragraph of each quotation (link_type_quotes.ts), else the chapter the entry gives.
        found = type_links.get(entry) or []
        given = src.get("links") or []
        links = [found[i] if i < len(found) and found[i] else (given[i] if i < len(given) else None)
                 for i in range(len(t["where"]))]
        if any(links):
            t["links"] = links
        types.append(t)
    types.sort(key=lambda t: t["label"])
    dump(os.path.join(OUT, "types.json"), types)

    # ---- how often the Fathers cite each verse ----
    dump(os.path.join(OUT, "cited.json"),
         {str(v): n for v, n in db.execute("select vid, sum(n) from cited group by vid")})

    size = sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(OUT) for f in fs)
    print(f"wrote {OUT}: {files} chapter files, {len(buckets)} word files, {size / 1e6:.1f} MB", file=sys.stderr)


if __name__ == "__main__":
    main()
