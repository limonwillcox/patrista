#!/usr/bin/env python3
"""
Search the whole Bible for each pattern, and tune the shape settings against the Fathers.

Text: every verse tagged automatically (auto_steps, from auto_tag.py), read book by book as one long
list of steps. Queries: the sequence templates in the grammar and the hand-tagged stories.

Shape settings (local alignment, as for DNA):
  offset        a step pair must score above this to count; a bare match of one act earns 1 - offset
  gap_pattern   cost of skipping a step of the PATTERN (the passage lacks it)
  gap_text      cost of skipping a step of the TEXT (the passage has something extra in between).
                Automatic tags put extra acts in nearly every verse, so this one should be cheap.
  gap_optional  cost of skipping a pattern step marked optional

Tuning (--tune) uses an independent judge: the Fathers. For each hand-tagged story, every chapter of
the Bible gets a shape score (the best match ending in that chapter). A chapter counts as linked to the
story when a Father cites both, or a recorded patristic type ties them. A good setting ranks linked
chapters above unlinked ones; this is measured as AUC (0.5 = chance, 1.0 = perfect). Settings are
chosen on odd-numbered books and checked on even-numbered books, so the result is not fitted to the
very chapters it is judged on. A content-only score (the right acts, in any order) is reported beside
it: if it does as well, the order of steps adds nothing.

Usage:
  python -I scripts/connections/scan_patterns.py --tune     choose settings -> shape-params.json
  python -I scripts/connections/scan_patterns.py            find pattern instances -> pattern_hits, patterns.json
"""
import json
import math
import os
import random
import sqlite3
import sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from match_shapes import ancestors, load as load_grammar_and_stories, step_sim  # noqa: E402
from build_witness import load_books  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
DB = os.path.join(ROOT, "data", "connections", "connections.sqlite")
PARAMS = os.path.join(ROOT, "data", "connections", "shape-params.json")
OUT_JSON = os.path.join(ROOT, "public", "connections", "patterns.json")
DEFAULT = {"offset": 0.35, "gap_pattern": 0.5, "gap_text": 0.5, "gap_optional": 0.05}
GRID = {"offset": [0.2, 0.35, 0.5], "gap_pattern": [0.25, 0.5, 0.75], "gap_text": [0.02, 0.05, 0.1, 0.2, 0.35, 0.5]}
NEAR = 2
HITS_PER_QUERY = 40
SHUFFLES = 150


# ---------- references ----------
def ref_parser(db):
    books = load_books()
    num = {b: n for n, b in db.execute("select distinct book_num, book from verses")}
    by_name = {n.lower(): num[b["id"]] for b in books for n in b["names"]}
    import re
    rx = re.compile(r"^(\d?\s?[A-Za-z]+)\.?\s+(\d+)(?::(\d+))?(?:[-–](\d+)(?::(\d+))?)?$")

    def parse(ref):
        m = rx.match(ref.strip())
        if not m or m[1].lower() not in by_name:
            return None
        bn = by_name[m[1].lower()] * 1_000_000
        c1, v1, x, v2 = int(m[2]), m[3], m[4], m[5]
        if v1 is None:
            return bn + c1 * 1000 + 1, bn + (int(x) if x else c1) * 1000 + 999
        if x is None:
            return bn + c1 * 1000 + int(v1), bn + c1 * 1000 + int(v1)
        if v2 is None:
            return bn + c1 * 1000 + int(v1), bn + c1 * 1000 + int(x)
        return bn + c1 * 1000 + int(v1), bn + int(x) * 1000 + int(v2)
    return parse


# ---------- the text ----------
def load_text(db):
    books = defaultdict(list)
    for vid, act, who, zone in db.execute("select vid, act, who, zone from auto_steps order by vid, pos"):
        st = {"act": act, "who": json.loads(who), "vid": vid}
        if zone:
            st["where"] = zone
        books[vid // 1_000_000].append(st)
    return books


def sim_matrix(ids, query, text):
    return [[step_sim(ids, q, t) for t in text] for q in query]


def dp_columns(S, opt, p):
    """Best local-alignment score ending at each text step (column)."""
    q = len(S)
    m = len(S[0]) if q else 0
    off, gp, gt, go = p["offset"], p["gap_pattern"], p["gap_text"], p["gap_optional"]
    skip = [go if o else gp for o in opt]
    prev = [0.0] * (q + 1)
    best = [0.0] * m
    for j in range(m):
        cur = [0.0] * (q + 1)
        top = 0.0
        for i in range(1, q + 1):
            s = S[i - 1][j]
            v = prev[i] - gt
            if s > 0:
                d = prev[i - 1] + s - off
                if d > v:
                    v = d
            u = cur[i - 1] - skip[i - 1]
            if u > v:
                v = u
            if v < 0:
                v = 0.0
            cur[i] = v
            if v > top:
                top = v
        best[j] = top
        prev = cur
    return best


def dp_full(S, opt, p):
    """Full matrix with traceback pointers, for extracting hits."""
    q = len(S)
    m = len(S[0]) if q else 0
    off, gp, gt, go = p["offset"], p["gap_pattern"], p["gap_text"], p["gap_optional"]
    H = [[0.0] * (m + 1) for _ in range(q + 1)]
    T = [[0] * (m + 1) for _ in range(q + 1)]
    for j in range(1, m + 1):
        for i in range(1, q + 1):
            s = S[i - 1][j - 1]
            v, t = 0.0, 0
            l = H[i][j - 1] - gt
            if l > v:
                v, t = l, 3
            if s > 0:
                d = H[i - 1][j - 1] + s - off
                if d > v:
                    v, t = d, 1
            u = H[i - 1][j] - (go if opt[i - 1] else gp)
            if u > v:
                v, t = u, 2
            H[i][j], T[i][j] = v, t
    return H, T


def traceback(H, T, S, i, j):
    pairs = []
    while i > 0 and j > 0 and T[i][j]:
        t = T[i][j]
        if t == 1:
            if S[i - 1][j - 1] > 0:
                pairs.append((i - 1, j - 1))
            i, j = i - 1, j - 1
        elif t == 2:
            i -= 1
        else:
            j -= 1
    return pairs[::-1]


def chapter_scores(best, text):
    out = {}
    for j, st in enumerate(text):
        c = st["vid"] // 1000
        if best[j] > out.get(c, 0):
            out[c] = best[j]
    return out


def content_scores(S, text):
    """Order-free baseline: for each pattern step, the best match in the chapter, summed."""
    per = defaultdict(lambda: [0.0] * len(S))
    for j, st in enumerate(text):
        c = st["vid"] // 1000
        row = per[c]
        for i in range(len(S)):
            if S[i][j] > row[i]:
                row[i] = S[i][j]
    return {c: sum(r) for c, r in per.items()}


def auc(pos, neg):
    if not pos or not neg:
        return None
    allv = sorted([(s, 1) for s in pos] + [(s, 0) for s in neg])
    rank, r_pos, i = 0.0, 0.0, 0
    while i < len(allv):
        j = i
        while j < len(allv) and allv[j][0] == allv[i][0]:
            j += 1
        avg = (i + j + 1) / 2
        r_pos += avg * sum(1 for k in range(i, j) if allv[k][1])
        i = j
    return (r_pos - len(pos) * (len(pos) + 1) / 2) / (len(pos) * len(neg))


# ---------- witness labels ----------
def witnessed_chapters(db, a0, a1):
    out = set()
    for a, b in db.execute("select a, b from witness where (a between ? and ?) or (b between ? and ?)", (a0, a1, a0, a1)):
        other = b if a0 <= a <= a1 else a
        out.add(other // 1000)
    for x0, x1, y0, y1 in db.execute("select a0, a1, b0, b1 from witness_curated"):
        for (s0, s1), (o0, o1) in (((x0, x1), (y0, y1)), ((y0, y1), (x0, x1))):
            if s0 <= a1 and s1 >= a0:
                for c in range(o0 // 1000, o1 // 1000 + 1):
                    out.add(c)
    return out


def near(c, a0, a1):
    return c // 1000 == a0 // 1_000_000 and a0 // 1000 % 1000 - NEAR <= c % 1000 <= a1 // 1000 % 1000 + NEAR


def tune(db, ids, stories, text, parse):
    queries = []
    for s in stories:
        r = parse(s["ref"])
        if not r:
            continue
        queries.append((s, r, witnessed_chapters(db, *r)))
    sims = {}
    for s, _, _ in queries:
        for bn, steps in text.items():
            sims[(s["id"], bn)] = sim_matrix(ids, s["steps"], steps)
    print(f"tuning on {len(queries)} hand-tagged stories against {sum(len(t) for t in text.values())} auto steps",
          file=sys.stderr)

    def evaluate(p, scorer):
        res = {"train": [], "test": []}
        for s, (a0, a1), positives in queries:
            scores = {}
            for bn, steps in text.items():
                S = sims[(s["id"], bn)]
                if scorer == "shape":
                    scores.update(chapter_scores(dp_columns(S, [False] * len(S), p), steps))
                else:
                    scores.update(content_scores(S, steps))
            for split, odd in (("train", 1), ("test", 0)):
                pos, neg = [], []
                for bn, steps in text.items():
                    if bn % 2 != odd:
                        continue
                    for c in {st["vid"] // 1000 for st in steps}:
                        if near(c, a0, a1):
                            continue
                        (pos if c in positives else neg).append(scores.get(c, 0.0))
                a = auc(pos, neg)
                if a is not None and len(pos) >= 3:
                    res[split].append(a)
        return {k: (sum(v) / len(v) if v else None) for k, v in res.items()}

    base = evaluate(DEFAULT, "shape")
    content = evaluate(DEFAULT, "content")
    print(f"current settings: train AUC {base['train']:.3f}, test {base['test']:.3f}", file=sys.stderr)
    print(f"content only (no order): train {content['train']:.3f}, test {content['test']:.3f}", file=sys.stderr)
    best = None
    for off in GRID["offset"]:
        for gp in GRID["gap_pattern"]:
            for gt in GRID["gap_text"]:
                p = dict(DEFAULT, offset=off, gap_pattern=gp, gap_text=gt)
                r = evaluate(p, "shape")
                print(f"  offset {off:<4} gap_pattern {gp:<4} gap_text {gt:<4} -> train {r['train']:.3f} test {r['test']:.3f}",
                      file=sys.stderr)
                if best is None or r["train"] > best[1]["train"]:
                    best = (p, r)
    p, r = best
    out = dict(p, auc_train=round(r["train"], 4), auc_test=round(r["test"], 4),
               current_train=round(base["train"], 4), current_test=round(base["test"], 4),
               content_train=round(content["train"], 4), content_test=round(content["test"], 4),
               note="chosen on odd-numbered books (train), checked on even-numbered books (test)")
    json.dump(out, open(PARAMS, "w"), indent=1)
    print(f"chosen: {p} train {r['train']:.3f} test {r['test']:.3f} -> {PARAMS}", file=sys.stderr)


def scan(db, ids, grammar_entries, stories, text, parse):
    p = dict(DEFAULT, **{k: v for k, v in json.load(open(PARAMS)).items() if k in DEFAULT}) if os.path.exists(PARAMS) else DEFAULT
    print(f"scanning with {p}", file=sys.stderr)
    rng = random.Random(11)
    queries = []
    for e in grammar_entries:
        if e["kind"] == "sequence":
            known = [r for r in (parse(x) for x in e.get("instances", [])) if r]
            queries.append({"id": "seq:" + e["id"], "label": e["label"], "steps": e["steps"], "known": known, "range": None})
    for s in stories:
        r = parse(s["ref"])
        queries.append({"id": "story:" + s["id"], "label": s["title"], "steps": s["steps"], "known": [r] if r else [],
                        "range": r})
    rows, export = [], []
    for qd in queries:
        steps = qd["steps"]
        opt = [bool(st.get("optional")) for st in steps]
        need = min(3, sum(1 for o in opt if not o) or 1)
        witnessed = witnessed_chapters(db, *qd["range"]) if qd["range"] else set()
        cands = []
        for bn, text_steps in text.items():
            S = sim_matrix(ids, steps, text_steps)
            H, T = dp_full(S, opt, p)
            # candidate ends: the best cell in each chapter
            best_in = {}
            for j in range(1, len(text_steps) + 1):
                c = text_steps[j - 1]["vid"] // 1000
                for i in range(1, len(steps) + 1):
                    if H[i][j] > best_in.get(c, (0,))[0]:
                        best_in[c] = (H[i][j], i, j)
            for c, (score, i, j) in best_in.items():
                pairs = traceback(H, T, S, i, j)
                if len({pi for pi, _ in pairs}) < need:
                    continue
                span = (text_steps[pairs[0][1]]["vid"], text_steps[pairs[-1][1]]["vid"])
                if qd["range"] and span[0] <= qd["range"][1] and span[1] >= qd["range"][0]:
                    continue  # the story itself
                cands.append((score, bn, span, pairs, S, text_steps))
        cands.sort(key=lambda x: -x[0])
        hits = []
        for score, bn, span, pairs, S, text_steps in cands:
            if any(h["a0"] <= span[1] and h["a1"] >= span[0] for h in hits):
                continue
            j0, j1 = pairs[0][1], pairs[-1][1]
            lo, hi = max(0, j0 - 10), min(len(text_steps), j1 + 11)
            window = list(range(lo, hi))
            k = 0
            for _ in range(SHUFFLES):
                rng.shuffle(window)
                S2 = [[row[j] for j in window] for row in S]
                if max(dp_columns(S2, opt, p) or [0]) >= score - 1e-9:
                    k += 1
            pval = (k + 1) / (SHUFFLES + 1)
            known = any(a <= span[1] and b >= span[0] for a, b in qd["known"])
            wit = any(c in witnessed for c in range(span[0] // 1000, span[1] // 1000 + 1))
            hits.append({"a0": span[0], "a1": span[1], "score": round(score, 2), "matched": len({pi for pi, _ in pairs}),
                         "p": round(pval, 3), "known": known, "witness": wit,
                         "steps": [[steps[pi]["act"], text_steps[tj]["vid"]] for pi, tj in pairs]})
            if len(hits) >= HITS_PER_QUERY:
                break
        for h in hits:
            rows.append((qd["id"], h["a0"], h["a1"], h["score"], h["matched"], h["p"], int(h["known"]), int(h["witness"]),
                         json.dumps(h["steps"])))
        export.append({"id": qd["id"], "label": qd["label"], "steps": len(steps), "hits": hits})
        strong = sum(1 for h in hits if h["p"] < 0.05)
        print(f"  {qd['id']:<36} hits {len(hits):>2}, p<0.05 {strong:>2}, known {sum(h['known'] for h in hits)}, "
              f"witnessed {sum(h['witness'] for h in hits)}", file=sys.stderr)
    db.execute("drop table if exists pattern_hits")
    db.execute("create table pattern_hits (query TEXT, a0 INTEGER, a1 INTEGER, score REAL, matched INTEGER, p REAL,"
               " known INTEGER, witness INTEGER, steps TEXT)")
    db.executemany("insert into pattern_hits values (?,?,?,?,?,?,?,?,?)", rows)
    db.commit()
    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    tuning = json.load(open(PARAMS)) if os.path.exists(PARAMS) else {}
    json.dump({"params": p, "tuning": tuning, "queries": export}, open(OUT_JSON, "w", encoding="utf-8"),
              separators=(",", ":"))
    print(f"wrote {OUT_JSON}", file=sys.stderr)


def main():
    db = sqlite3.connect(DB)
    ids, stories = load_grammar_and_stories()
    parse = ref_parser(db)
    text = load_text(db)
    if "--tune" in sys.argv:
        tune(db, ids, stories, text, parse)
    else:
        scan(db, ids, list(ids.values()), stories, text, parse)


if __name__ == "__main__":
    main()
