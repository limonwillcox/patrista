"""Write data/clavis/site-labels.json: the CPG / CPL numbers of each work on the site.

The site knows each work by its English source file (Fathers/English/<Father>_English/<file>.txt).
Two inputs say which Clavis work a file is:
  1. data/clavis/works.jsonl rows whose translationPath is that file (made by attach-english.mjs);
  2. data/clavis/site-labels-manual.json, {file path: entry}, for corrections and files step 1 misses.
     An entry is a Clavis work id; or {"id", "numbers"} when Clavis files the work inside a larger
     entry; or null to remove a wrong label. A manual entry wins over step 1.

Numbers come from data/clavis/full/works.jsonl (the full CPG / CPL walk) when it has the work,
else from the checklist row. Only CPG and CPL numbers are kept.

Usage: python -I scripts/clavis/build_site_labels.py
"""
from __future__ import annotations

import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CHECKLIST = os.path.join(ROOT, "data", "clavis", "works.jsonl")
FULL = os.path.join(ROOT, "data", "clavis", "full", "works.jsonl")
MANUAL = os.path.join(ROOT, "data", "clavis", "site-labels-manual.json")
OUT = os.path.join(ROOT, "data", "clavis", "site-labels.json")
KEEP = ("CPG-", "CPL-")


def read_jsonl(path: str) -> list[dict]:
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def main() -> None:
    numbers: dict[str, list[str]] = {}
    for row in read_jsonl(CHECKLIST):
        numbers.setdefault(row["work_id"], row.get("clavis") or [])
    for row in read_jsonl(FULL):  # the full walk is newer, so it wins
        numbers[row["id"]] = row.get("clavis") or []

    by_path: dict[str, str] = {}
    forced: dict[str, list[str]] = {}
    for row in read_jsonl(CHECKLIST):
        p = row.get("translationPath")
        if p:
            by_path[p] = row["work_id"]
    if os.path.exists(MANUAL):
        with open(MANUAL, encoding="utf-8") as f:
            for p, wid in json.load(f).items():
                if p.startswith("_"):
                    continue
                if wid is None:  # a wrong match with no sure replacement: no label
                    by_path.pop(p, None)
                elif isinstance(wid, dict):  # {"id", "numbers"}: Clavis files it inside a larger entry
                    by_path[p] = wid["id"]
                    forced[p] = wid["numbers"]
                else:
                    by_path[p] = wid

    out: dict[str, dict] = {}
    missing_files, no_number = [], []
    for p, wid in sorted(by_path.items()):
        if not os.path.exists(os.path.join(ROOT, p)):
            missing_files.append(p)
            continue
        nums = [n for n in forced.get(p) or numbers.get(wid, []) if n.startswith(KEEP)]
        if not nums:
            no_number.append(p)
            continue
        out[p] = {"id": wid, "numbers": nums}

    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        json.dump(out, f, ensure_ascii=False, indent=1, sort_keys=True)
        f.write("\n")
    print(f"{len(out)} labelled files -> {os.path.relpath(OUT, ROOT)}")
    for p in missing_files:
        print("  file not found:", p, file=sys.stderr)
    for p in no_number:
        print("  no CPG/CPL number:", p, file=sys.stderr)


if __name__ == "__main__":
    main()
