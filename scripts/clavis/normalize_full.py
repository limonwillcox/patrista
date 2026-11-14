"""Turn the Clavis A-Z browse (browse_works.py) into the CPG / CPL translation checklist.

Input:  data/clavis/full/browse/letter-NN.jsonl (git-ignored), every work in Clavis Clavium.
Output: data/clavis/full/works.jsonl    one line per work with a CPG or CPL number
        data/clavis/full/checklist.csv  the same works as a spreadsheet

Each browse row has a plain-text path such as
"Scriptores Antenicaeni > Tertullianus > Opera catholica". The author is the path part
that matches a person name from data/clavis-extract/authors/ (or the survey authors);
the parts before it are the category and the parts after it the group.
A work with several paths takes its first path outside a "Vide et" cross-reference.

Usage: python -I scripts/clavis/normalize_full.py
"""
from __future__ import annotations

import csv
import glob
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FULL = os.path.join(ROOT, "data", "clavis", "full")
BROWSE = os.path.join(FULL, "browse")
LABELS = os.path.join(ROOT, "data", "clavis", "site-labels.json")
CROSS_REF = "Vide et"


def person_names() -> set[str]:
    names = set()
    for f in glob.glob(os.path.join(ROOT, "data", "clavis-extract", "authors", "authors-*.jsonl")):
        for line in open(f, encoding="utf-8"):
            names.add(json.loads(line)["nameLatin"])
    for line in open(os.path.join(ROOT, "data", "clavis", "authors.jsonl"), encoding="utf-8"):
        names.add(json.loads(line)["nameLatin"])
    return names


def split_path(path: list[str], persons: set[str]) -> tuple[list[str], str | None, list[str]]:
    """Return (category, author, group) for one path."""
    for i in range(len(path) - 1, -1, -1):  # the deepest person is the author
        if path[i] in persons:
            return path[:i], path[i], path[i + 1:]
    return path, None, []


def home_path(paths: list[list[str]]) -> list[str]:
    for p in paths:
        if CROSS_REF not in p:
            return p
    return paths[0] if paths else []


def first_number(nums: list[str], prefix: str) -> str:
    return next((n for n in nums if n.startswith(prefix)), "")


def sort_key(w: dict) -> tuple:
    """Order by clavis, then the number's integer part, then the rest."""
    n = w["cpg"] or w["cpl"]
    series, _, rest = n.partition("-")
    rest = rest.strip("[]* ")  # "[1931]": Clavis brackets a withdrawn or moved number
    lead = rest[: len(rest) - len(rest.lstrip("0123456789"))] or "0"
    return (series, int(lead), rest, w["titleLatin"])


def main() -> None:
    persons = person_names()
    on_site = {v["id"]: p for p, v in json.load(open(LABELS, encoding="utf-8")).items()}
    totals, rows_seen = 0, 0
    works: dict[str, dict] = {}
    for f in sorted(glob.glob(os.path.join(BROWSE, "letter-*.jsonl"))):
        with open(f + ".total") as t:
            totals += int(t.read())
        for line in open(f, encoding="utf-8"):
            r = json.loads(line)
            rows_seen += 1
            if not any(n.startswith(("CPG-", "CPL-")) for n in r["clavis"]) or r["id"] in works:
                continue
            category, author, group = split_path(home_path(r["paths"]), persons)
            works[r["id"]] = {
                "id": r["id"],
                "titleLatin": r["title"],
                "clavis": r["clavis"],
                "cpg": first_number(r["clavis"], "CPG-"),
                "cpl": first_number(r["clavis"], "CPL-"),
                "authorLatin": author,
                "group": " / ".join(group) or None,
                "category": category,
                "onPatrista": on_site.get(r["id"]),
            }

    rows = sorted(works.values(), key=sort_key)
    with open(os.path.join(FULL, "works.jsonl"), "w", encoding="utf-8", newline="\n") as f:
        for w in rows:
            f.write(json.dumps(w, ensure_ascii=False) + "\n")
    with open(os.path.join(FULL, "checklist.csv"), "w", encoding="utf-8-sig", newline="") as f:
        cw = csv.writer(f)
        cw.writerow(["CPG", "CPL", "All numbers", "Author", "Latin title", "Group", "Category",
                     "On Patrista (English file)", "English exists elsewhere", "Notes", "Clavis link"])
        for w in rows:
            cw.writerow([w["cpg"], w["cpl"], " ".join(w["clavis"]), w["authorLatin"] or "", w["titleLatin"],
                         w["group"] or "", " > ".join(w["category"]), w["onPatrista"] or "", "", "",
                         "https://clavis.brepols.net/clacla/OA/Details.aspx?id=" + w["id"]])

    cpg = sum(1 for w in rows if w["cpg"])
    cpl = sum(1 for w in rows if w["cpl"])
    site = sum(1 for w in rows if w["onPatrista"])
    no_author = sum(1 for w in rows if not w["authorLatin"])
    print(f"browse: {rows_seen} rows read, site totals {totals}")
    print(f"{len(rows)} CPG/CPL works ({cpg} with CPG, {cpl} with CPL), {site} on Patrista, {no_author} with no named author")


if __name__ == "__main__":
    main()
