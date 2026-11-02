#!/usr/bin/env python3
"""
Find stories with the same shape.

A story is an ordered list of tagged steps (data/connections/stories/stories.json). Two stories are
compared with local alignment, as DNA sequences are: find the stretch where both do the same things
in the same order, allowing steps that one story has and the other lacks.

Step similarity
  act      same act 1.0; going down or coming up vs passing through water 0.5; otherwise no match
  who      overlap of the roles and figures, counting what each is an instance or part of
  where    same zone
  sense    opposite senses (+ / -) cost points

Chance test (METHOD rule 12)
  Shuffle the order of one story's steps many times. p = share of shuffles that score at least as
  high as the real order. A low p means the ORDER matches, not only the content.

Usage:
  python -I scripts/connections/match_shapes.py                 # all pairs + templates
  python -I scripts/connections/match_shapes.py flood jonah     # show one alignment in detail
"""
import json
import os
import random
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GRAMMAR = os.path.join(ROOT, "data", "connections", "grammar", "grammar.json")
STORIES = os.path.join(ROOT, "data", "connections", "stories", "stories.json")
OUT = os.path.join(ROOT, "data", "connections", "shape-matches.json")

MATCH_OFFSET = 0.35   # a step pair must beat this to count as a match
GAP = 0.5             # cost of a step that one side has and the other lacks
GAP_OPTIONAL = 0.05   # cost of skipping an optional template step
SHUFFLES = 1000
# Tuned settings from scan_patterns.py --tune, when present. Between two hand-tagged stories either
# side may have extra steps, so one gap cost is used: halfway between skipping a pattern step and
# skipping a text step.
_params = os.path.join(ROOT, "data", "connections", "shape-params.json")
if os.path.exists(_params):
    _p = json.load(open(_params))
    MATCH_OFFSET = _p["offset"]
    GAP = (_p["gap_pattern"] + _p["gap_text"]) / 2
    GAP_OPTIONAL = _p.get("gap_optional", GAP_OPTIONAL)
RELATED_ACTS = {frozenset(("descend", "pass-through-water")): 0.5,
                frozenset(("ascend", "pass-through-water")): 0.5}


def load():
    g = json.load(open(GRAMMAR, encoding="utf-8"))
    ids = {e["id"]: e for e in g["entries"]}
    stories = json.load(open(STORIES, encoding="utf-8"))["stories"]
    return ids, stories


def check_stories(ids, stories):
    errors = []
    for s in stories:
        for i, st in enumerate(s["steps"], 1):
            if ids.get(st["act"], {}).get("kind") != "act":
                errors.append(f"{s['id']} step {i}: {st['act']} is not an act")
            for w in st.get("who", []):
                if ids.get(w, {}).get("kind") not in ("role", "figure", "number"):
                    errors.append(f"{s['id']} step {i}: {w} is not a role, figure or number")
            if "where" in st and ids.get(st["where"], {}).get("kind") != "zone":
                errors.append(f"{s['id']} step {i}: {st['where']} is not a zone")
    return errors


def ancestors(ids, x, seen=None):
    """x plus everything x is an instance of or part of."""
    seen = seen if seen is not None else set()
    if x in seen:
        return seen
    seen.add(x)
    for rel in ("instance_of", "part_of"):
        for t in (ids.get(x, {}).get("rel") or {}).get(rel, []):
            ancestors(ids, t, seen)
    return seen


def step_sim(ids, a, b):
    if a["act"] == b["act"]:
        act = 1.0
    else:
        act = RELATED_ACTS.get(frozenset((a["act"], b["act"])), 0.0)
    if act == 0:
        return 0.0
    wa = set().union(*[ancestors(ids, w) for w in a.get("who", [])]) if a.get("who") else set()
    wb = set().union(*[ancestors(ids, w) for w in b.get("who", [])]) if b.get("who") else set()
    who = len(wa & wb) / len(wa | wb) if wa and wb else 0.0
    where = 1.0 if a.get("where") and a.get("where") == b.get("where") else 0.0
    sim = act * (1 + 0.6 * who + 0.4 * where)
    if a.get("sense") and b.get("sense") and a["sense"] != b["sense"]:
        sim -= 0.3
    return max(sim, 0.0)


def align(ids, A, B):
    """Smith-Waterman local alignment. Returns (score, [(i, j) matched], region in A, region in B)."""
    n, m = len(A), len(B)
    H = [[0.0] * (m + 1) for _ in range(n + 1)]
    T = [[None] * (m + 1) for _ in range(n + 1)]
    best, bi, bj = 0.0, 0, 0

    def gap(step):
        return GAP_OPTIONAL if step.get("optional") else GAP

    for i in range(1, n + 1):
        for j in range(1, m + 1):
            s = step_sim(ids, A[i - 1], B[j - 1])
            diag = H[i - 1][j - 1] + (s - MATCH_OFFSET if s > 0 else -GAP)
            up = H[i - 1][j] - gap(A[i - 1])
            left = H[i][j - 1] - gap(B[j - 1])
            H[i][j], T[i][j] = max((0.0, None), (diag, "d"), (up, "u"), (left, "l"), key=lambda x: x[0])
            if H[i][j] > best:
                best, bi, bj = H[i][j], i, j
    pairs, i, j = [], bi, bj
    while i > 0 and j > 0 and T[i][j]:
        if T[i][j] == "d":
            if step_sim(ids, A[i - 1], B[j - 1]) > 0:
                pairs.append((i - 1, j - 1))
            i, j = i - 1, j - 1
        elif T[i][j] == "u":
            i -= 1
        else:
            j -= 1
    pairs.reverse()
    return best, pairs, (i, bi), (j, bj)


def chance(ids, A, B, observed, rng):
    """Share of random re-orderings of B that score at least as high as the real order."""
    if observed <= 0:
        return 1.0
    hits = 0
    B2 = list(B)
    for _ in range(SHUFFLES):
        rng.shuffle(B2)
        if align(ids, A, B2)[0] >= observed - 1e-9:
            hits += 1
    return (hits + 1) / (SHUFFLES + 1)


def templates(ids):
    return [{"id": e["id"], "title": e["label"], "steps": e["steps"], "template": True}
            for e in ids.values() if e["kind"] == "sequence"]


def show(ids, A, B):
    score, pairs, (a0, a1), (b0, b1) = align(ids, A["steps"], B["steps"])
    print(f"\n{A['id']}  x  {B['id']}   score {score:.2f}")
    matched_a = {i for i, _ in pairs}
    matched_b = {j for _, j in pairs}
    pi = 0
    for i, j in pairs:
        a, b = A["steps"][i], B["steps"][j]
        print(f"  = {a['act']:<20} {a.get('ref', ''):<14} {a.get('names', a.get('note', ''))[:42]:<42} | "
              f"{b.get('ref', ''):<14} {b.get('names', b.get('note', ''))[:42]}")
    extra_a = [A["steps"][i] for i in range(a0, a1) if i not in matched_a]
    extra_b = [B["steps"][j] for j in range(b0, b1) if j not in matched_b]
    for s in extra_a:
        print(f"  < only in {A['id']}: {s['act']} {s.get('ref', '')} {s.get('names', '')[:60]}")
    for s in extra_b:
        print(f"  > only in {B['id']}: {s['act']} {s.get('ref', '')} {s.get('names', s.get('note', ''))[:60]}")


def main():
    ids, stories = load()
    errors = check_stories(ids, stories)
    if errors:
        sys.exit("\n".join(errors))
    by_id = {s["id"]: s for s in stories}
    for t in templates(ids):
        by_id.setdefault(t["id"], t)
    if len(sys.argv) == 3:
        show(ids, by_id[sys.argv[1]], by_id[sys.argv[2]])
        return

    rng = random.Random(7)
    results = []
    for i, A in enumerate(stories):
        for B in stories[i + 1:]:
            score, pairs, _, _ = align(ids, A["steps"], B["steps"])
            p = chance(ids, A["steps"], B["steps"], score, rng)
            results.append({"a": A["id"], "b": B["id"], "score": round(score, 3), "matched": len(pairs),
                            "p": round(p, 4)})
        for T in templates(ids):
            score, pairs, _, _ = align(ids, A["steps"], T["steps"])
            p = chance(ids, A["steps"], T["steps"], score, rng)
            results.append({"a": A["id"], "b": "seq:" + T["id"], "score": round(score, 3),
                            "matched": len(pairs), "p": round(p, 4)})
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({"note": "p = share of random step orders scoring at least as high (lower is stronger)",
                   "results": results}, f, indent=1)

    print("Story pairs, strongest first (score; steps matched; p):")
    pairs = sorted((r for r in results if not r["b"].startswith("seq:")), key=lambda r: -r["score"])
    for r in pairs:
        if r["score"] > 0:
            print(f"  {r['score']:5.2f}  {r['matched']}  p={r['p']:.3f}  {r['a']:<17} {r['b']}")
    print("\nBest sequence template for each story:")
    for s in stories:
        rs = sorted((r for r in results if r["a"] == s["id"] and r["b"].startswith("seq:")),
                    key=lambda r: -r["score"])[:3]
        print(f"  {s['id']:<17} " + "   ".join(f"{r['b'][4:]} {r['score']:.2f} (p={r['p']:.3f})" for r in rs))


if __name__ == "__main__":
    main()
