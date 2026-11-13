"""Read every work in Clavis Clavium through the Works A-Z browse, 20 per page.

This is about 2,200 pages for all ~43,600 works (all six claves), against ~10,000
person pages for crawl_claves.py. Each row gives the work id, Latin title, clavis
numbers, and its "higher levels" path (category > author > group).

Paging is a chain of form posts: each page needs the previous page's form state,
so the walk is strictly one request at a time.

Usage:
  python -I scripts/clavis/browse_works.py OUT_DIR [--cookies CURL_JAR] [--letters 1,5,20]

Writes OUT_DIR/letter-NN.jsonl, one row per work. A letter whose file is complete
(row count equals the site's total) is skipped on a re-run; an incomplete one restarts.
"""
from __future__ import annotations

import argparse
import html
import http.cookiejar
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

BASE = "https://clavis.brepols.net/clacla/"
WORKS = BASE + "OA/Browse/Works.aspx"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36"
DELAY_S = 1.0
TURNAWAY_WAIT_S = 300
LETTERS = 25  # LinkButton1..25: A..Z with I/J and U/V joined, then "Other"

_jar = http.cookiejar.CookieJar()
_opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(_jar))
_opener.addheaders = [("User-Agent", UA)]
_last = 0.0


def load_curl_jar(path: str) -> None:
    """Reuse a live session from a curl cookie file (curl marks HttpOnly lines with a prefix)."""
    for line in open(path, encoding="utf-8"):
        line = line.rstrip("\n")
        if line.startswith("#HttpOnly_"):
            line = line[len("#HttpOnly_"):]
        elif not line or line.startswith("#"):
            continue
        parts = line.split("\t")
        if len(parts) != 7:
            continue
        domain, _flag, path_, secure, expires, name, value = parts
        _jar.set_cookie(http.cookiejar.Cookie(
            0, name, value, None, False, domain, True, domain.startswith("."), path_, True,
            secure == "TRUE", int(expires) or None, expires == "0", None, None, {}))


def _request(url: str, body: dict | None = None) -> str:
    global _last
    wait = DELAY_S - (time.time() - _last)
    if wait > 0:
        time.sleep(wait)
    _last = time.time()
    data = urllib.parse.urlencode(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data)
    if data is not None:
        req.add_header("Content-Type", "application/x-www-form-urlencoded")
    with _opener.open(req, timeout=90) as r:
        return r.read().decode("utf-8", errors="replace")


def _open_session() -> None:
    gate = _request(WORKS)
    m = re.search(r'LoginToolLogin\.aspx\?tck=[^"]+', gate)
    if m:
        _request(BASE + m.group(0))


def fetch(body: dict | None) -> str:
    """GET the Works page (body None) or post a form to it, waiting out turnaways."""
    for attempt in range(5):
        try:
            page = _request(WORKS, body)
            if 'id="MainContent_txtSearch"' in page:
                return page
            if "Turnaway" in page:
                print(f"  turnaway; waiting {TURNAWAY_WAIT_S}s", file=sys.stderr, flush=True)
                time.sleep(TURNAWAY_WAIT_S)
            _open_session()
            if body is not None:
                raise RuntimeError("session lost mid-letter")  # form state is gone; restart the letter
        except RuntimeError:
            raise
        except Exception as e:
            print(f"  retry: {e}", file=sys.stderr, flush=True)
            time.sleep(10 * (attempt + 1))
    raise RuntimeError("could not reach the Works page")


# ---------------------------------------------------------------- parsing

def form_fields(page: str) -> dict:
    form = re.search(r'<form[^>]*id="form1"[^>]*>(.*)</form>', page, re.S).group(1)
    fields = {}
    for m in re.finditer(r"<input([^>]*)/?>", form):
        a = m.group(1)
        name = re.search(r'name="([^"]+)"', a)
        if not name:
            continue
        typ = (re.search(r'type="([^"]+)"', a) or [None, "text"])[1]
        val = html.unescape((re.search(r'value="([^"]*)"', a) or [None, ""])[1])
        if typ in ("radio", "checkbox"):
            if 'checked="checked"' in a:
                fields[html.unescape(name.group(1))] = val
        elif typ not in ("submit", "image"):
            fields[html.unescape(name.group(1))] = val
    return fields


def _label(page: str, name: str) -> int:
    m = re.search(r'id="MainContent_%s">(\d+)' % name, page)
    return int(m.group(1)) if m else 0


def _text(s: str) -> str:
    return " ".join(html.unescape(re.sub(r"<[^>]+>", " ", s)).split())


def parse_rows(page: str) -> list[dict]:
    rows = []
    for m in re.finditer(r'<a id="MainContent_repResults_HyperLink1_\d+" class="result" href="\.\./Details\.aspx\?id=([0-9A-F]{32})">(.*?)</a>', page, re.S):
        body = m.group(2)
        icon = re.search(r'src="[^"]*/objects/([a-z]+)\.png"', body)
        title = re.search(r'<div style="float: left;">(.*?)</div>', body, re.S)
        nums = re.search(r'<div style="float: right;">(.*?)</div>', body, re.S)
        paths = [_text(p) for p in re.findall(r'<div style="color: #999; padding-left: 35px;">(.*?)</div>', body, re.S)]
        rows.append({
            "id": m.group(1),
            "kind": icon.group(1) if icon else None,
            "title": _text(title.group(1)) if title else "",
            "clavis": [n.strip() for n in _text(nums.group(1)).split(",") if n.strip()] if nums else [],
            "paths": [[s.strip() for s in p.split(" > ")] for p in paths if p],
        })
    return rows


# ---------------------------------------------------------------- walking

def browse_letter(i: int, out_path: str) -> int:
    start = fetch(None)
    body = form_fields(start)
    body["__EVENTTARGET"] = f"ctl00$MainContent$LinkButton{i}"
    body["ctl00$MainContent$grpInclude"] = "rbtnPaths"  # show each work's higher levels
    page = fetch(body)
    total = _label(page, "lblMax")
    seen = set()
    with open(out_path + ".part", "w", encoding="utf-8", newline="\n") as out:
        while True:
            for r in parse_rows(page):
                if r["id"] not in seen:
                    seen.add(r["id"])
                    r["letter"] = i
                    out.write(json.dumps(r, ensure_ascii=False) + "\n")
            to = _label(page, "lblTo")
            if to >= total:
                break
            body = form_fields(page)
            body["ctl00$MainContent$imgNext.x"] = "5"
            body["ctl00$MainContent$imgNext.y"] = "5"
            nxt = fetch(body)
            if _label(nxt, "lblFrom") <= _label(page, "lblFrom"):
                raise RuntimeError(f"letter {i}: paging stopped at {to} of {total}")
            page = nxt
            if (to // 20) % 25 == 0:
                print(f"  letter {i}: {to} / {total}", flush=True)
    os.replace(out_path + ".part", out_path)
    with open(out_path + ".total", "w") as f:
        f.write(str(total))
    return len(seen)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("out_dir")
    ap.add_argument("--cookies")
    ap.add_argument("--letters", help="comma list of letter buttons (1-25); default all")
    a = ap.parse_args()
    if a.cookies:
        load_curl_jar(a.cookies)
    os.makedirs(a.out_dir, exist_ok=True)
    letters = [int(x) for x in a.letters.split(",")] if a.letters else range(1, LETTERS + 1)
    for i in letters:
        path = os.path.join(a.out_dir, f"letter-{i:02d}.jsonl")
        if os.path.exists(path) and os.path.exists(path + ".total"):
            print(f"letter {i}: done already")
            continue
        for attempt in range(3):
            try:
                n = browse_letter(i, path)
                total = open(path + ".total").read()
                print(f"letter {i}: {n} works (site says {total})", flush=True)
                break
            except RuntimeError as e:
                print(f"letter {i}: {e}; restarting the letter", file=sys.stderr, flush=True)
                time.sleep(30)
        else:
            raise SystemExit(f"letter {i} failed 3 times; stopping. Re-run to resume.")


if __name__ == "__main__":
    main()
