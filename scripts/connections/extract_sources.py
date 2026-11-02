#!/usr/bin/env python3
"""
Turn the private study notes into data/connections/grammar/sources.json.

The notes (one markdown file per source, written while reading) live outside the repo because they
quote copyrighted books. This script keeps, for each candidate entry:
  - the tradition (jordan / fathers / pageau / leithart)
  - kind, label, the paraphrased definition, key texts
  - WHERE the idea is found (chapter/page, Father + location, or URL)
It drops quotations from copyrighted books. It keeps the Fathers' quotations: those translations
are public domain (ANF / NPNF), and they are the tool's witnesses.

Usage:  python -I scripts/connections/extract_sources.py <notes folder>
"""
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "data", "connections", "grammar", "sources.json")

FILES = {
    "01": ("jordan", "James B. Jordan, Through New Eyes (1988), chs. 1-9"),
    "02": ("jordan", "James B. Jordan, Through New Eyes (1988), chs. 10-19"),
    "03": ("jordan", "James B. Jordan, Symbolism: A Manifesto (SM); Rebellion, Tyranny, and Dominion in the Book of Genesis (RTD)"),
    "04": ("fathers", "Church Fathers in the Patrista corpus (ANF/NPNF translations)"),
    "05": ("pageau", "Jonathan & Matthieu Pageau, Peter Leithart: free public talks, essays and reviews"),
    "06": ("pageau", "Matthieu Pageau, The Language of Creation (2018)"),
}

HEAD = re.compile(r"^###\s+`?([a-z0-9-]+)`?\s+[—–-]+\s+(.*)$")
FIELD = re.compile(r"^-\s+\*{0,2}([A-Za-z ]+?)\*{0,2}:\*{0,2}\s*(.*)$")
QUOTED = re.compile(r"[\"“][^\"”]*[\"”]")
PAREN = re.compile(r"\(([^()]*(?:ch\.|chs\.|p\.|pp\.|SM|RTD|chapter)[^()]*)\)")
URL = re.compile(r"https?://\S+?(?=[)\s,;]|$)")


def locations_from(text, keep_quotes):
    """Where the idea is found. Drops quotations unless keep_quotes."""
    if keep_quotes:
        return [text.strip()]
    locs = [m.strip() for m in PAREN.findall(text)]
    locs += URL.findall(text)
    if not locs:
        stripped = QUOTED.sub("", text).strip(" .;:—-")
        if stripped:
            locs.append(stripped)
    return locs


def parse(path, file_key):
    tradition, work = FILES[file_key]
    entries, cur, field = [], None, None
    for raw in open(path, encoding="utf-8"):
        line = raw.rstrip("\n")
        if line.startswith("## "):
            if cur:
                entries.append(cur)
            cur, field = None, None
            continue
        m = HEAD.match(line)
        if m:
            if cur:
                entries.append(cur)
            cur = {"src": f"{file_key}:{m[1]}", "tradition": tradition, "work": work,
                   "label": m[2].strip().strip("*"), "kind": "", "def": "", "texts": "",
                   "christ": "", "where": [], "confidence": ""}
            field = None
            continue
        if not cur:
            continue
        f = FIELD.match(line)
        if f:
            name, val = f[1].strip().lower(), f[2].strip()
            field = name
            if name == "kind":
                cur["kind"] = val.split()[0].strip("()") if val else ""
            elif name == "definition":
                cur["def"] = val
            elif name == "key texts":
                cur["texts"] = val
            elif name == "christ":
                cur["christ"] = val if file_key in ("04",) else QUOTED.sub("“…”", val)
            elif name == "confidence":
                cur["confidence"] = val
            elif name in ("jordan says", "pageau says", "source"):
                cur["where"] += locations_from(val, keep_quotes=False)
            elif name == "witnesses":
                if val:
                    cur["where"] += locations_from(val, keep_quotes=True)
            continue
        # continuation lines (indented bullets under Witnesses)
        if field == "witnesses" and line.strip().startswith("-"):
            cur["where"] += locations_from(line.strip()[1:], keep_quotes=True)
    if cur:
        entries.append(cur)
    # Leithart entries live in file 05
    for e in entries:
        if file_key == "05" and any("leithart" in w.lower() or "theopolis" in w.lower() for w in e["where"]):
            e["tradition"] = "leithart"
    return entries


def main():
    notes = sys.argv[1]
    out = {}
    for path in sorted(glob.glob(os.path.join(notes, "0*.md"))):
        key = os.path.basename(path)[:2]
        if key not in FILES:
            continue
        for e in parse(path, key):
            out[e["src"]] = e
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    by = {}
    for e in out.values():
        by[e["tradition"]] = by.get(e["tradition"], 0) + 1
    missing = [k for k, e in out.items() if not e["where"]]
    print(f"entries {len(out)} {by}; without a location: {len(missing)} {missing[:8]}", file=sys.stderr)


if __name__ == "__main__":
    main()
