#!/usr/bin/env python3
"""
Tag every verse of the Bible with the symbolic grammar, automatically, from its Hebrew and Greek words.

The cues live in data/connections/grammar/cues.json: each act, figure, role, zone and number lists the
Strong's numbers that signal it. A verse becomes one step per act it contains, in word order:
  act    from an act cue ("yarad" -> go down). Some acts need a second word in the verse:
         "pass through" counts as passing through WATER only with a water word; "send" counts as
         sending a messenger only with a dove, raven or spy; "name" needs both "name" and "call".
  who    the figures, roles and numbers named in the verse (dove, ark, Spirit, forty …)
  where  the zone named in the verse (the deep, dry land, mountain …), most specific first

This is a rough first pass: a word is not a meaning. The hand-tagged stories in stories.json stay the
reviewed set; the automatic tags let the matcher search the whole Bible for candidates.

Writes table auto_steps(vid, pos, act, who, zone) into data/connections/connections.sqlite.

Usage:  python -I scripts/connections/auto_tag.py           tag the Bible
        python -I scripts/connections/auto_tag.py --show gn 8   print one chapter's steps
"""
import json
import os
import sqlite3
import sys
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CUES = os.path.join(ROOT, "data", "connections", "grammar", "cues.json")
STRONGS = os.path.join(ROOT, "public", "strongs", "kjv")
DB = os.path.join(ROOT, "data", "connections", "connections.sqlite")
ZONE_ORDER = ["the-deep", "dry-land", "holy-mountain", "garden-sanctuary", "wilderness", "pit", "house-of-bondage",
              "well", "city-of-man", "gate", "firmament"]


def load_cues():
    c = json.load(open(CUES, encoding="utf-8"))
    acts = {}
    for key, spec in c["acts"].items():
        act = key.split("#")[0]  # "pass-through-water#2" is a second way to signal the same act
        if isinstance(spec, list):
            acts[key] = {"act": act, "any": set(spec)}
        else:
            acts[key] = {"act": act, "any": set(spec["any"]),
                         "requires": set(c["groups"][spec["requires"]]) if "requires" in spec else None,
                         "requires_any": set(spec.get("requires_any", [])) or None}
    who = {}
    for sec in ("figures", "roles", "numbers"):
        for gid, codes in c[sec].items():
            for code in codes:
                who.setdefault(code, []).append(gid)
    zones = {}
    for gid, codes in c["zones"].items():
        for code in codes:
            zones.setdefault(code, []).append(gid)
    return acts, who, zones


def tag_verse(tokens, acts, who_cues, zone_cues):
    codes = [c for _, c in tokens]
    present = set(codes)
    who = sorted({g for c in present for g in who_cues.get(c, [])})
    zs = {g for c in present for g in zone_cues.get(c, [])}
    zone = next((z for z in ZONE_ORDER if z in zs), None)
    first = {}
    for spec in acts.values():
        hit = [i for i, c in enumerate(codes) if c in spec["any"]]
        if not hit:
            continue
        if spec.get("requires") and not (present & spec["requires"]):
            continue
        if spec.get("requires_any") and not (present & spec["requires_any"]):
            continue
        first[spec["act"]] = min(first.get(spec["act"], hit[0]), hit[0])
    steps = sorted((pos, act) for act, pos in first.items())
    # passing through water already says "down and up": drop a bare descend/ascend beside it
    if any(a == "pass-through-water" for _, a in steps):
        steps = [(p, a) for p, a in steps if a not in ("descend", "ascend")] or steps
    return [(pos, act, who, zone) for pos, act in steps]


def main():
    acts, who_cues, zone_cues = load_cues()
    db = sqlite3.connect(DB)
    book_num = {b: n for n, b in db.execute("select distinct book_num, book from verses")}
    if len(sys.argv) == 4 and sys.argv[1] == "--show":
        b, ch = sys.argv[2], int(sys.argv[3])
        data = json.load(open(os.path.join(STRONGS, b, f"{ch}.json"), encoding="utf-8"))
        for vs in sorted(data["v"], key=int):
            for pos, act, who, zone in tag_verse(data["v"][vs], acts, who_cues, zone_cues):
                print(f"{b} {ch}:{vs:<4} {act:<20} {','.join(who):<40} {zone or ''}")
        return
    rows = []
    for book, bn in sorted(book_num.items(), key=lambda kv: kv[1]):
        folder = os.path.join(STRONGS, book)
        for name in sorted(os.listdir(folder), key=lambda s: int(s[:-5])):
            ch = int(name[:-5])
            data = json.load(open(os.path.join(folder, name), encoding="utf-8"))
            for vs in sorted(data["v"], key=int):
                vid = bn * 1_000_000 + ch * 1000 + int(vs)
                for pos, act, who, zone in tag_verse(data["v"][vs], acts, who_cues, zone_cues):
                    rows.append((vid, pos, act, json.dumps(who), zone))
    db.execute("drop table if exists auto_steps")
    db.execute("create table auto_steps (vid INTEGER, pos INTEGER, act TEXT, who TEXT, zone TEXT)")
    db.executemany("insert into auto_steps values (?,?,?,?,?)", rows)
    db.execute("create index auto_steps_vid on auto_steps(vid)")
    db.commit()
    by_act = Counter(r[2] for r in rows)
    print(f"auto steps {len(rows)} in {len({r[0] for r in rows})} verses; "
          + ", ".join(f"{a} {n}" for a, n in by_act.most_common()), file=sys.stderr)


if __name__ == "__main__":
    main()
