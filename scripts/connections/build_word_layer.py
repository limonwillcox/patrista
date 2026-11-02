#!/usr/bin/env python3
"""
Build the word layer of the Connections database: which verses share Hebrew or Greek words.

Input (already in the repo, built by scripts/build-strongs.py):
  public/strongs/kjv/<book>/<chapter>.json   per verse: [[english word, code], ...]
  public/strongs/lex/<H|G><bucket>.json       lexicon entries keyed by code ("H3123")
  Bibles/KJV/manifest.json                    book order

Output:
  data/connections/connections.sqlite         tables: verses, words, word_occ, word_edges, links

How a link is scored
  Each verse gets a set of concepts with a weight:
    its own codes                         1.0
    the Septuagint (Greek) equivalent     0.9 x how alike the KJV renders them   lexicon "lxx" + "uses"
    a Greek word the KJV renders alike    0.9 x how alike (0.6 or more)        lexicon "uses" (see below)
    a certain Septuagint pair             0.9                                 KEY_BRIDGES, by hand
    the word it derives from              0.6                                 lexicon "deriv" field
  Weight of a concept = ln(N / reach), where reach is the number of verses that contain the code itself
  or a related code. A rare word ("tevah", ark) weighs about 7; a common one ("mayim", water) about 4.
  Two verses share a concept -> they gain weightA * weightB * weight of the concept. Each word of each
  verse counts once per link. So one shared common word is a weak link, and several shared common
  words (Spirit + water + heaven) add up to a strong one.

  Left out: words in more than MAX_DF verses ("and", "LORD", "say", "earth"), and grammar words
  (particles, pronouns, prepositions, conjunctions), which link everything and mean little.

  Each verse keeps its strongest links in three quotas, so no kind crowds out the others:
    near   same book, chapter distance <= NEAR_CHAPTERS (usually the same story)
    same   same Testament, outside the story
    cross  the other Testament

Bridges between Hebrew and Greek
  The lexicon's Septuagint lists miss common pairs (reshith "beginning" lists aparche "firstfruit" but
  not arche "beginning"), so a Hebrew and a Greek word the KJV translates alike are also bridged:
  reshith and arche are both "beginning" (0.75 alike). The English test also drops true Septuagint
  pairs the KJV happens to translate differently: par "bullock" / moschos "calf", kapporeth "mercy
  seat" / hilasterion "propitiation". The few of these that matter most for typology are listed by
  hand in KEY_BRIDGES. The rest of the dropped list stays dropped: sampled by hand, it is mostly noise
  ("seventy" -> "day", "chariot" -> "crystal").

Usage:  python -I scripts/connections/build_word_layer.py
"""
import json
import math
import os
import re
import sqlite3
import sys
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
STRONGS = os.path.join(ROOT, "public", "strongs")
OUT_DIR = os.path.join(ROOT, "data", "connections")
DB = os.path.join(OUT_DIR, "connections.sqlite")

MAX_DF = 800         # a word in more verses than this makes no links
MAX_POSTING = 1200   # ...nor a concept that reaches more verses than this through related words
MIN_HIT = 0.6        # a shared concept worth less than this is ignored (weak Septuagint guesses)
NEAR_CHAPTERS = 2
QUOTA = {"same": 20, "cross": 15, "near": 5}
W_SELF, W_LXX, W_DERIV = 1.0, 0.9, 0.6
LXX_MIN = 0.2          # Septuagint equivalents translated less alike than this are dropped
EN_MIN = 0.6           # a Hebrew and a Greek word the KJV translates at least this alike are bridged
PARTICLES = {"up", "down", "off", "out", "away", "forth", "again", "aside", "together", "back", "thing", "things",
             "self", "selve", "one"}
EN_SHARE = 0.2         # ...looked up by the renderings that make up at least this share of a word's uses
# Septuagint pairs certain enough to keep although the KJV translates them differently.
KEY_BRIDGES = {
    "H6499": ["G3448"],           # par "bullock" -> moschos "calf" (Lev 16; Heb 9:12)
    "H3727": ["G2435"],           # kapporeth "mercy seat" -> hilasterion (Rom 3:25; Heb 9:5)
    "H3722": ["G2433", "G2434"],  # kaphar "make atonement" -> hilaskomai, hilasmos "propitiation"
    "H6532": ["G2665"],           # paroketh "vail" -> katapetasma "veil"
    "H6944": ["G39"],             # qodesh "holy (place)" -> hagion "sanctuary, holiest"
    "H4899": ["G5547"],           # mashiach "anointed, Messiah" -> Christos
}
GRAMMAR_WORD = re.compile(r"\b(particle|preposition|prepositional|pronoun|pronominal|conjunction|"
                          r"demonstrative|interjection|definite article|relative)\b", re.I)

CODE_RE = re.compile(r"\{([HG]\d+)\}")

# A word the KJV mostly renders as "to", "upon", "with", "if", "thou"… is a grammar word even when its
# definition does not say so ('el, 'al, alla, oun). At 0.75, 'abar ("pass over", 0.60) and 'ereb
# ("evening", 0.55) stay in.
GRAMMAR_SHARE = 0.75
SMALL_WORDS = {"to", "unto", "upon", "with", "from", "of", "in", "into", "by", "for", "not", "no", "this", "that",
               "these", "he", "she", "it", "they", "thou", "thee", "thy", "ye", "also", "even", "so", "then",
               "therefore", "because", "if", "or", "but", "when", "as", "than", "among", "before", "after",
               "against", "between", "over", "under", "through", "about", "there", "here", "now", "yet", "which",
               "who", "what", "all", "every", "and", "the", "at", "on", "while", "how", "whether", "though"}


# Grammar words that neither test catches: the KJV tags prepositions too rarely for their renderings to
# show ('el has ten tagged uses), and "to be / to become" are verbs. Numbers are kept on purpose.
FUNCTION_CODES = {
    # Hebrew prepositions, particles, pronouns, "to be"
    "H413", "H5921", "H5704", "H854", "H853", "H5973", "H4480", "H996", "H8478", "H3651", "H1571", "H389",
    "H7535", "H637", "H2088", "H1931", "H1992", "H1994", "H859", "H589", "H595", "H3588", "H834", "H518",
    "H176", "H3808", "H408", "H369", "H3426", "H1961", "H6258", "H8033", "H3541", "H3644", "H4100",
    "H4310", "H2005", "H2009", "H3605", "H5750",
    # Greek "to be / become / have / behold", pronouns, particles
    "G1096", "G1510", "G2076", "G2258", "G1488", "G2192", "G2400", "G5101", "G5100", "G3739", "G3778",
    "G1565", "G846", "G1438", "G3754", "G2443", "G1437", "G1487", "G3767", "G235", "G1063", "G1161",
}


def grammar_share(entry):
    uses = entry.get("uses") or []
    total = sum(n for _, n in uses)
    return sum(n for w, n in uses if w.lower() in SMALL_WORDS) / total if total else 0.0


def vid(book_num, ch, vs):
    return book_num * 1_000_000 + ch * 1000 + vs


def load_lexicon():
    lex = {}
    for name in os.listdir(os.path.join(STRONGS, "lex")):
        with open(os.path.join(STRONGS, "lex", name), encoding="utf-8") as f:
            lex.update(json.load(f))
    return lex


def _norm(word):
    w = word.lower().replace("’", "'").split("'")[0]
    return w[:-1] if len(w) > 3 and w.endswith("s") and not w.endswith("ss") else w


def renderings(entry):
    """How often the KJV renders a word each way, as a vector: {"spirit": 232, "wind": 92, …}."""
    v = {}
    for w, n in entry.get("uses") or []:
        k = _norm(w)
        v[k] = v.get(k, 0) + n
    return v


def cosine(a, b):
    num = sum(x * b.get(k, 0) for k, x in a.items())
    den = math.sqrt(sum(x * x for x in a.values())) * math.sqrt(sum(x * x for x in b.values()))
    return num / den if den else 0.0


def related_codes(code, entry, lex):
    """
    Codes linked to this one by the lexicon: Septuagint equivalent and derivation.
    Strong's "lxx" lists are noisy for common words (ruach lists haima, "blood"). A Greek word counts
    as an equivalent in proportion to how alike the KJV translates the two words: ruach -> pneuma 0.88
    (both "spirit"), ruach -> haima 0 (dropped).
    """
    out = {}
    mine = renderings(entry)
    for g in entry.get("lxx") or []:
        if g == code or g not in lex:
            continue
        sim = cosine(mine, renderings(lex[g]))
        if sim >= LXX_MIN:
            out[g] = max(out.get(g, 0), W_LXX * sim)
    for r in CODE_RE.findall(entry.get("deriv") or ""):
        if r != code:
            out[r] = max(out.get(r, 0), W_DERIV)
    return out


def main():
    manifest = json.load(open(os.path.join(ROOT, "Bibles", "KJV", "manifest.json"), encoding="utf-8"))
    lex = load_lexicon()

    # ---- 1. Read every verse ----
    verses, verse_codes = [], {}
    occ = defaultdict(list)
    token_count = defaultdict(int)
    for bnum, book in enumerate(manifest, start=1):
        for ch in range(1, book["chapters"] + 1):
            path = os.path.join(STRONGS, "kjv", book["id"], f"{ch}.json")
            if not os.path.exists(path):
                continue
            data = json.load(open(path, encoding="utf-8"))
            for vs_key in sorted(data["v"], key=int):
                v = vid(bnum, ch, int(vs_key))
                words = data["v"][vs_key]
                codes = set()
                for _, code in words:
                    if code and code != "+":
                        codes.add(code)
                        token_count[code] += 1
                verses.append((v, book["id"], bnum, ch, int(vs_key), " ".join(w for w, _ in words)))
                verse_codes[v] = codes
                for c in codes:
                    occ[c].append(v)
    n = len(verses)
    df = {c: len(vs) for c, vs in occ.items()}
    grammar_words = {c for c in df if GRAMMAR_WORD.search((lex.get(c) or {}).get("def", ""))
                     or grammar_share(lex.get(c) or {}) >= GRAMMAR_SHARE or c in FUNCTION_CODES}
    linkable = {c for c in df if df[c] <= MAX_DF and c not in grammar_words}
    print(f"verses {n}, codes {len(df)}, linkable {len(linkable)}, grammar words left out {len(grammar_words)}",
          file=sys.stderr)

    # ---- 2. Word edges from the lexicon ----
    edges = {}
    edge_kind = {}
    for code in df:
        entry = lex.get(code)
        if entry:
            lxx = set(entry.get("lxx") or [])
            edges[code] = {r: w for r, w in related_codes(code, entry, lex).items() if r in df}
            for r in edges[code]:
                edge_kind[(code, r)] = "lxx" if r in lxx else "deriv"

    # Hebrew and Greek words the KJV translates alike, looked up by their main renderings. The small
    # words of English phrasal verbs are left out first: "brought up" and "spring up" are not alike.
    rend = {c: {w: k for w, k in renderings(lex[c]).items() if w not in SMALL_WORDS and w not in PARTICLES and len(w) > 2}
            for c in df if c in lex}
    main = {}
    for c, r in rend.items():
        total = sum(r.values())
        main[c] = {w for w, k in r.items() if w not in SMALL_WORDS and total and k >= EN_SHARE * total}
    greek_by_word = defaultdict(set)
    for c, words in main.items():
        if c.startswith("G"):
            for w in words:
                greek_by_word[w].add(c)
    added = 0
    for h, words in main.items():
        if not h.startswith("H"):
            continue
        for g in set().union(*(greek_by_word[w] for w in words)) if words else ():
            sim = cosine(rend[h], rend[g])
            if sim >= EN_MIN and edges.setdefault(h, {}).get(g, 0) < W_LXX * sim:
                if g not in edges[h]:
                    added += 1
                    edge_kind[(h, g)] = "english"
                edges[h][g] = W_LXX * sim
    for h, gs in KEY_BRIDGES.items():
        for g in gs:
            if h in df and g in df:
                edges.setdefault(h, {})[g] = W_LXX
                edge_kind[(h, g)] = "key"
    print(f"bridges by English rendering {added}, by hand {sum(len(g) for g in KEY_BRIDGES.values())}", file=sys.stderr)

    # ---- 3. Concepts per verse, and the verses each concept reaches ----
    concepts_of = {}
    postings = defaultdict(dict)        # concept -> {vid: (weight, via code)}
    for v, codes in verse_codes.items():
        concepts = {}
        for c in codes:
            if c in linkable:
                concepts[c] = (W_SELF, c)
        for c in codes:
            if c not in linkable:
                continue
            for r, w in edges.get(c, {}).items():
                if r in linkable and concepts.get(r, (0, None))[0] < w:
                    concepts[r] = (w, c)
        concepts_of[v] = concepts
        for c, wv in concepts.items():
            postings[c][v] = wv
    for c in [c for c, p in postings.items() if len(p) > MAX_POSTING]:
        del postings[c]
    weight = {c: math.log(n / len(p)) for c, p in postings.items()}
    est = sum(len(p) ** 2 for p in postings.values())
    print(f"concepts {len(postings)}, pair visits {est:,}", file=sys.stderr)

    # ---- 4. One verse at a time: score its candidates, keep its best links ----
    book_ch = {v: (b, ch) for v, _, b, ch, _, _ in verses}

    def kind(a, b):
        (ba, ca), (bb, cb) = book_ch[a], book_ch[b]
        if ba == bb and abs(ca - cb) <= NEAR_CHAPTERS:
            return "near"
        return "cross" if (ba <= 39) != (bb <= 39) else "same"

    kept = {}                           # (a, b) -> (score, evidence)
    done = 0
    for a, concepts in concepts_of.items():
        hits = defaultdict(list)
        for c, (wa, va) in concepts.items():
            plist = postings.get(c)
            if not plist:
                continue
            r = weight[c]
            for b, (wb, vb) in plist.items():
                if b == a or (wa < W_SELF and wb < W_SELF):
                    continue
                s = wa * wb * r
                if s >= MIN_HIT:
                    hits[b].append((s, va, vb, c))
        groups = defaultdict(list)
        for b, hs in hits.items():
            hs.sort(reverse=True)
            used_a, used_b, total, ev = set(), set(), 0.0, []
            for s, va, vb, c in hs:
                if va in used_a or vb in used_b:
                    continue
                used_a.add(va)
                used_b.add(vb)
                total += s
                ev.append((c, round(s, 2)))
            groups[kind(a, b)].append((total, b, ev))
        for k, lst in groups.items():
            lst.sort(key=lambda x: -x[0])
            for total, b, ev in lst[:QUOTA[k]]:
                key = (min(a, b), max(a, b))
                if key not in kept:
                    kept[key] = (total, ev)
        done += 1
        if done % 5000 == 0:
            print(f"  {done} verses, {len(kept)} links", file=sys.stderr)
    print(f"kept links {len(kept)}", file=sys.stderr)

    # ---- 5. Write SQLite ----
    os.makedirs(OUT_DIR, exist_ok=True)
    if os.path.exists(DB):
        os.remove(DB)
    db = sqlite3.connect(DB)
    db.executescript(
        """
        CREATE TABLE verses (vid INTEGER PRIMARY KEY, book TEXT, book_num INTEGER, ch INTEGER, vs INTEGER, english TEXT);
        CREATE TABLE words (code TEXT PRIMARY KEY, lemma TEXT, xlit TEXT, gloss TEXT, kjv TEXT,
                            verse_count INTEGER, token_count INTEGER, first_vid INTEGER, rarity REAL);
        CREATE TABLE word_occ (code TEXT, vid INTEGER);
        CREATE TABLE word_edges (code TEXT, related TEXT, kind TEXT, weight REAL);
        CREATE TABLE links (a INTEGER, b INTEGER, signal TEXT, score REAL, kind TEXT, evidence TEXT);
        """
    )
    db.executemany("INSERT INTO verses VALUES (?,?,?,?,?,?)", verses)
    db.executemany(
        "INSERT INTO words VALUES (?,?,?,?,?,?,?,?,?)",
        [(c, (lex.get(c) or {}).get("lemma"), (lex.get(c) or {}).get("xlit"), (lex.get(c) or {}).get("def"),
          (lex.get(c) or {}).get("kjv"), df[c], token_count[c], occ[c][0], round(math.log(n / df[c]), 4))
         for c in df])
    db.executemany("INSERT INTO word_occ VALUES (?,?)", [(c, v) for c, vs in occ.items() for v in vs])
    rows = []
    for c, rel in edges.items():
        for r, w in rel.items():
            rows.append((c, r, edge_kind.get((c, r), "deriv"), w))
    db.executemany("INSERT INTO word_edges VALUES (?,?,?,?)", rows)
    db.executemany("INSERT INTO links VALUES (?,?,?,?,?,?)",
                   [(a, b, "lexical", round(s, 3), kind(a, b), json.dumps(ev)) for (a, b), (s, ev) in kept.items()])
    db.executescript(
        """
        CREATE INDEX word_occ_code ON word_occ(code);
        CREATE INDEX word_occ_vid ON word_occ(vid);
        CREATE INDEX links_a ON links(a);
        CREATE INDEX links_b ON links(b);
        CREATE INDEX word_edges_code ON word_edges(code);
        """
    )
    db.commit()
    db.close()
    print(f"wrote {DB}", file=sys.stderr)


if __name__ == "__main__":
    main()
