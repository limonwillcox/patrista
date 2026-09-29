#!/usr/bin/env python3
"""Fetch and extract 12 treatises of Tertullian from The Latin Library (Public Domain).
Target: Fathers/Latin/Tertullian_Latin/
"""

import subprocess
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "Fathers" / "Latin" / "Tertullian_Latin"
OUT_DIR.mkdir(parents=True, exist_ok=True)


class LatinLibraryParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_body = False
        self.skip = False
        self.text_parts = []

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        cls = attrs_dict.get("class", "")
        if tag == "body":
            self.in_body = True
        elif cls in ("pagehead", "border", "smallborder", "footer"):
            self.skip = True
        elif tag == "p" and self.in_body and not self.skip:
            self.text_parts.append("\n\n")

    def handle_endtag(self, tag):
        if self.skip and tag in ("p", "div"):
            self.skip = False

    def handle_data(self, data):
        if self.in_body and not self.skip:
            d = data.strip()
            if d and not any(k in d for k in ["The Latin Library", "The Classics Page", "Christian Latin"]):
                self.text_parts.append(data)


def clean_html(html_str: str) -> str:
    parser = LatinLibraryParser()
    parser.feed(html_str)
    text = "".join(parser.text_parts)
    lines = [l.strip() for l in text.split("\n")]
    return "\n".join(line for line in lines if line)


def fetch_url(url: str) -> str:
    cmd = ["curl", "-sL", "--max-time", "30", url]
    return subprocess.check_output(cmd).decode("latin-1", errors="ignore")


TERTULLIAN_WORKS = [
    {
        "file": "The Prescription Against Heretics.txt",
        "work": "De Praescriptione Haereticorum",
        "clavis": "CPL-5",
        "urls": ["https://www.thelatinlibrary.com/tertullian/tertullian.praescrip.shtml"],
    },
    {
        "file": "On Baptism.txt",
        "work": "De Baptismo",
        "clavis": "CPL-8",
        "urls": ["https://www.thelatinlibrary.com/tertullian/tertullian.baptismo.shtml"],
    },
    {
        "file": "Of Patience.txt",
        "work": "De Patientia",
        "clavis": "CPL-9",
        "urls": ["https://www.thelatinlibrary.com/tertullian/tertullian.patientia.shtml"],
    },
    {
        "file": "On Repentance.txt",
        "work": "De Paenitentia",
        "clavis": "CPL-10",
        "urls": ["https://www.thelatinlibrary.com/tertullian/tertullian.paen.shtml"],
    },
    {
        "file": "On the Apparel of Women.txt",
        "work": "De Cultu Feminarum",
        "clavis": "CPL-11",
        "urls": [
            "https://www.thelatinlibrary.com/tertullian/tertullian.cultu1.shtml",
            "https://www.thelatinlibrary.com/tertullian/tertullian.cultu2.shtml",
        ],
    },
    {
        "file": "Against Hermogenes.txt",
        "work": "Adversus Hermogenem",
        "clavis": "CPL-13",
        "urls": ["https://www.thelatinlibrary.com/tertullian/tertullian.herm.shtml"],
    },
    {
        "file": "Against the Valentinians.txt",
        "work": "Adversus Valentinianos",
        "clavis": "CPL-16",
        "urls": ["https://www.thelatinlibrary.com/tertullian/tertullian.valentinianos.shtml"],
    },
    {
        "file": "A Treatise on the Soul.txt",
        "work": "De Anima",
        "clavis": "CPL-17",
        "urls": ["https://www.thelatinlibrary.com/tertullian/tertullian.anima.shtml"],
    },
    {
        "file": "On the Resurrection of the Flesh.txt",
        "work": "De Resurrectione Carnis",
        "clavis": "CPL-19",
        "urls": ["https://www.thelatinlibrary.com/tertullian/tertullian.resurrectione.shtml"],
    },
    {
        "file": "On Exhortation to Chastity.txt",
        "work": "De Exhortatione Castitatis",
        "clavis": "CPL-20",
        "urls": ["https://www.thelatinlibrary.com/tertullian/tertullian.castitatis.shtml"],
    },
    {
        "file": "De Fuga in Persecutione.txt",
        "work": "De Fuga in Persecutione",
        "clavis": "CPL-25",
        "urls": ["https://www.thelatinlibrary.com/tertullian/tertullian.fuga.shtml"],
    },
    {
        "file": "On Monogamy.txt",
        "work": "De Monogamia",
        "clavis": "CPL-28",
        "urls": ["https://www.thelatinlibrary.com/tertullian/tertullian.monog.shtml"],
    },
]


def main():
    print(f"Fetching {len(TERTULLIAN_WORKS)} Tertullian works from The Latin Library...")
    for item in TERTULLIAN_WORKS:
        texts = []
        for url in item["urls"]:
            html = fetch_url(url)
            txt = clean_html(html)
            texts.append(txt)

        content = "\n\n".join(texts)
        target = OUT_DIR / item["file"]
        header = [
            f"# source: {item['urls'][0]}",
            "# author: Quintus Septimius Florens Tertullianus",
            f"# work: {item['work']}",
            f"# clavis: {item['clavis']}",
            "# language: lat",
            "# public_domain: The Latin Library / Oehler pre-1928 edition",
            "",
            f"TERTULLIANI - {item['work'].upper()}",
            "=" * len(f"TERTULLIANI - {item['work'].upper()}"),
            "",
            content,
            "",
        ]
        target.write_text("\n".join(header), encoding="utf-8")
        print(f"Saved: {target.name} ({len(content):,} chars, {target.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
