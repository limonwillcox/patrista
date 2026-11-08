#!/usr/bin/env python3
"""
Pack the Connections data into small static files under public/connections/, one per thing the
reader can click. Vite serves public/ as-is in dev and copies it into dist/ on build.

  meta.json                       books and book groups
  verse/<book>/<chapter>.json     per verse: word links, passages the Fathers cite with it, the Fathers who
                                  cite it; per chapter: the types the Fathers saw that touch it
  word/<H|G><bucket>.json         per Hebrew/Greek word: verses, related words
  cited.json                      per verse: how many times the Fathers cite it
  types.json                      every type the Fathers saw (data/connections/typology/types.json, from
                                  build_fathers_types.ts): their words and all its passages
  glosses.json                    per Hebrew/Greek word: the KJV's most frequent rendering of it ("mercy seat")

Run after build_word_layer.py and build_witness.py.
Usage:  python -I scripts/connections/pack_public.py
"""
import json
import os
import re
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



def site_types():
    """The types on the site: the approved list of types the Fathers saw, as build_fathers_types.ts writes it."""
    return json.load(open(os.path.join(DATA, "typology", "types.json"), encoding="utf-8"))


def type_pairs(types):
    """Each type's passages, two by two, as the chapter files list them: (entry, label, Fathers, citations,
    a0, a1, b0, b1). Passages in the same story (a few chapters apart in one book) are not paired."""
    rows = []
    for t in types:
        fathers = json.dumps(sorted({w.split(",")[0].strip("* ") for w in t["where"] if "," in w}))
        cites = json.dumps(sorted({w.split(" — ")[0] for w in t["where"]})[:12])
        rs = t["ranges"]
        for i in range(len(rs)):
            for j in range(i + 1, len(rs)):
                (a0, a1), (b0, b1) = sorted((rs[i], rs[j]))
                if a0 // 1_000_000 == b0 // 1_000_000 and abs(a0 // 1000 % 1000 - b0 // 1000 % 1000) <= NEAR_CHAPTERS:
                    continue
                rows.append((t["id"], t["label"], fathers, cites, a0, a1, b0, b1))
    return rows


# Words that ride along in a rendering ("the lilies", "shall arise", "to judge"): left off its ends.
GLOSS_SMALL = set((
    "a an the of to and in on at by for with from that this it is be his her their my thy thee thine unto upon "
    "them ye you your our which who shall shalt will wilt was were are art have hast hath had did do doth let "
    "may might should would not no all any he she they we i me us him thou also even so as then there when but "
    "or nor if into").split())
# Untagged words that sit before a rendering without being part of it ("now negligent", "O generation").
GLOSS_NOT_BEFORE = GLOSS_SMALL | set(
    "now what o how own yet therefore thus lo behold why where whom whose these those every saying said say".split())
# Tokens of the tagged text that are formatting, not words, and the markers round a margin note.
GLOSS_MARKS = {"p", "q", "q1", "q2", "q3", "nd", "add", "b", "m", "pi", "li", "wj", "sc", "tl", "qs", "d", "mi",
               "nb", "pc", "fr", "ft", "fq", "fqa", "fk"}


def kjv_glosses(tagged, lex_dir):
    """Per Hebrew/Greek word, a short English gloss: Strong's own KJV rendering when Strong lists only one,
    else the KJV's most frequent rendering of it, as a whole phrase. The tagged KJV
    puts the number on the last word of a rendering and leaves the words before it untagged ("a mercy
    seat/H3727", "a burnt offering/H5930", "rose up/H6965"), so a rendering is the tagged word with the
    untagged words just before it, less the little words on its ends ("the lilies" -> "lilies"). Counting
    single tagged words instead gave "the" for the lily and the key, "offering" for every kind of offering,
    "seat" for the mercy seat and "up" for arise. A word whose renderings are all little words keeps its
    usual one ("the" for the article)."""
    phrases = defaultdict(lambda: defaultdict(int))
    singles = defaultdict(lambda: defaultdict(int))

    def close(before, run, code):
        while run and run[-1].lower() in GLOSS_SMALL:  # the tagged words themselves, not those before them
            run = run[:-1]
        if not run:
            return
        words = before + run
        while words and words[0].lower() in GLOSS_SMALL:
            words.pop(0)
        # An untagged word before a little word is not part of this rendering ("Abraham begat").
        while len(words) > len(run) and any(w.lower() in GLOSS_NOT_BEFORE for w in words[: len(words) - len(run)]):
            words.pop(0)
        if words:
            phrases[code][" ".join(words)] += 1

    for bk in os.listdir(tagged):
        for name in os.listdir(os.path.join(tagged, bk)):
            ch = json.load(open(os.path.join(tagged, bk, name), encoding="utf-8"))
            for toks in ch["v"].values():
                before, run, code_now, in_note = [], [], None, False
                for word, code in toks + [["", "end"]]:
                    if code == "" and word == "f":
                        in_note = not in_note
                        continue
                    if in_note or (code == "" and word in GLOSS_MARKS):
                        continue
                    tagged_word = code[:1] in "GH" and code[1:].isdigit()
                    if tagged_word and code == code_now:
                        run.append(word)
                    else:
                        if run:
                            close(before, run, code_now)
                            before = []
                        if tagged_word:
                            run, code_now = [word], code
                        else:
                            run, code_now = [], None
                            before = [] if code == "+" else (before + [word])[-2:]
                    if tagged_word:
                        singles[code][word] += 1
    # Strong's own list of the KJV's renderings, when it holds just one ("lily.", "mercy seat.", "which hath
    # an husband."): that is the gloss, as Strong gives it.
    strongs = {}
    for name in os.listdir(lex_dir):
        for code, e in json.load(open(os.path.join(lex_dir, name), encoding="utf-8")).items():
            only = re.sub(r"\.$", "", (e.get("kjv") or "").strip()).strip()
            # Not one with Strong's idiom mark "X", a note ("Compare ...") or a run-on ("also an Israelite:--Jacob").
            if only and not re.search(r"[,;:()\[\]{}.]|[^\x00-\x7fæÆ]|\bX\b|\bCompare\b|\bAlso\b|--", only):
                strongs[code] = only
    glosses = {}
    for code in singles:
        if code in strongs:
            glosses[code] = strongs[code]
            continue
        best = top(phrases.get(code) or {})
        # "the" for the article and "and" for kai: a little word more frequent than any rendering.
        small = top({w: n for w, n in singles[code].items() if w.lower() in GLOSS_SMALL})
        if best is None or (small and small[1] > best[1]):
            best = small or top(singles[code])
        glosses[code] = best[0]
    return glosses


def top(counts):
    """The most frequent entry, case folded, in its usual casing, with its count; None when empty."""
    if not counts:
        return None
    lower = defaultdict(int)
    for w, n in counts.items():
        lower[w.lower()] += n
    best = max(lower, key=lambda w: (lower[w], w))
    return max((w for w in counts if w.lower() == best), key=lambda w: counts[w]), lower[best]


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
    curated = type_pairs(site_types())

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

    # ---- glosses: how the KJV most often renders each Hebrew/Greek word ----
    dump(os.path.join(OUT, "glosses.json"), kjv_glosses(os.path.join(ROOT, "public", "strongs", "kjv"),
                                                          os.path.join(ROOT, "public", "strongs", "lex")))

    # ---- the types the Fathers saw (build_fathers_types.ts), each with all its passages ----
    dump(os.path.join(OUT, "types.json"), site_types())

    # ---- how often the Fathers cite each verse ----
    dump(os.path.join(OUT, "cited.json"),
         {str(v): n for v, n in db.execute("select vid, sum(n) from cited group by vid")})

    size = sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(OUT) for f in fs)
    print(f"wrote {OUT}: {files} chapter files, {len(buckets)} word files, {size / 1e6:.1f} MB", file=sys.stderr)


if __name__ == "__main__":
    main()
