#!/usr/bin/env python3
"""
Build the word-study data for the Bible page: which Hebrew or Greek word stands behind each English
word of the King James Version, and what that word means.

Sources (all public domain):
  - KJV with Strong's numbers, eng-kjv2006 USFM, eBible.org (tagging courtesy of CrossWire Bible Society):
    https://ebible.org/Scriptures/eng-kjv2006_usfm.zip
  - Strong's Greek Dictionary XML 1.4, Open Scriptures:
    https://raw.githubusercontent.com/openscriptures/strongs/master/greek/StrongsGreekDictionaryXML_1.4.zip
  - Strong's Hebrew Dictionary XML, Open Scriptures:
    https://raw.githubusercontent.com/openscriptures/strongs/master/hebrew/StrongHebrewG.xml

Usage:  python -I scripts/build-strongs.py <folder with the three downloads>
Writes: public/strongs/kjv/<book>/<chapter>.json   per verse: [[word, code], ...]
          code: "G4074" / "H6697" for a tagged word, "+" for a word the translators added (printed in
          italics in the KJV), "" for a word with no tag.
        public/strongs/lex/<G|H><bucket>.json      entries by number, 250 to a file
"""
import io
import json
import os
import re
import sys
import xml.etree.ElementTree as ET
import zipfile
from collections import Counter, defaultdict

SRC = sys.argv[1]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "strongs")
BUCKET = 250

manifest = json.load(open(os.path.join(ROOT, "Bibles", "KJV", "manifest.json"), encoding="utf-8"))

# ---------- 1. The tagged KJV, one book per USFM file, in canonical order like our manifest ----------
z = zipfile.ZipFile(os.path.join(SRC, "kjv_usfm.zip"))
books = sorted(n for n in z.namelist() if n.endswith(".usfm"))
assert len(books) == len(manifest) == 66, (len(books), len(manifest))

TOKEN = re.compile(
    r"\\add\s(?P<add>.*?)\\add\*"          # words the translators supplied
    r"|\\\+?w\s(?P<w>[^|\\]+)\|strong=\"(?P<s>[GH]\d+)\"\\\+?w\*"  # a tagged word
    r"|(?P<plain>[A-Za-zÆæ][A-Za-zÆæ'’]*)"      # an untagged word
)
# A word, with the æ of "Cæsar", "Judæa", "Zacchæus" kept inside it (the reader splits words the same way).
WORD = re.compile(r"[A-Za-zÆæ][A-Za-zÆæ'’]*")


def code(s):
    return s[0] + str(int(s[1:]))  # G0976 -> G976


usage = defaultdict(Counter)  # code -> Counter of English renderings
total_words = 0
for meta, name in zip(manifest, books):
    text = z.read(name).decode("utf-8-sig")
    chapters = re.split(r"\\c\s+(\d+)", text)
    found = {}
    for i in range(1, len(chapters), 2):
        ch = int(chapters[i])
        body = chapters[i + 1].replace("\\wj*", " ").replace("\\wj", " ")
        verses = {}
        for vm in re.finditer(r"\\v\s+(\d+)\s(.*?)(?=\\v\s+\d+\s|\Z)", body, re.S):
            toks = []
            for t in TOKEN.finditer(vm.group(2)):
                if t.group("add") is not None:
                    inner = re.sub(r"\\\+?w\s([^|\\]+)\|strong=\"[GH]\d+\"\\\+?w\*", r"\1", t.group("add"))
                    for w in WORD.findall(inner):
                        toks.append([w, "+"])
                elif t.group("w") is not None:
                    c = code(t.group("s"))
                    for w in WORD.findall(t.group("w")):
                        toks.append([w, c])
                        usage[c][w.lower()] += 1
                else:
                    toks.append([t.group("plain"), ""])
            total_words += len(toks)
            verses[vm.group(1)] = toks
        found[ch] = verses
        d = os.path.join(OUT, "kjv", meta["id"])
        os.makedirs(d, exist_ok=True)
        with io.open(os.path.join(d, str(ch) + ".json"), "w", encoding="utf-8") as f:
            json.dump({"v": verses}, f, ensure_ascii=False, separators=(",", ":"))
    assert len(found) == meta["chapters"], (meta["id"], len(found), meta["chapters"])

# ---------- 2. Strong's dictionaries ----------
lex = {}


def inline(el, lang):
    """Text of an XML element, with references to other entries written as {G4074} / {H6696}. A Greek word
    quoted in a Greek entry ("from 435 and ὤψ ōps (the countenance ...)") is written as Strong's prints it:
    the word, then its transliteration. An editor's note on a corrected typo is not Strong's text and is left out."""
    out = [el.text or ""]
    for child in el:
        tag = child.tag.split("}")[-1]
        if tag == "strongsref":
            out.append("{" + ("G" if child.get("language") == "GREEK" else "H") + str(int(child.get("strongs"))) + "}")
        elif tag == "greek":
            out.append(" ".join(x for x in (child.get("unicode"), child.get("translit")) if x))
        elif tag == "pronunciation":
            out.append(child.get("strongs") or "")
        elif tag == "w" and child.get("src"):
            out.append("{" + lang + str(int(child.get("src"))) + "}")
        elif tag == "w":
            out.append(child.get("lemma") or "")
        elif tag == "note" and child.get("type") == "x-typo":
            pass
        else:
            out.append(inline(child, lang))
        out.append(child.tail or "")
    # U+FFFD, a character lost before the file reached us (H7578 "trembling. " + U+FFFD): nothing to restore.
    return re.sub(r"\s+", " ", "".join(out).replace("�", "")).strip()


def top_level_parts(text):
    """Split at the semicolons that are not inside brackets: "from 435 and ὤψ ōps (the countenance; from 3700);
    man-faced" is two parts, not three."""
    parts, depth, cur = [], 0, ""
    for ch in text:
        depth += ch == "("
        depth -= ch == ")" and depth > 0
        if ch == ";" and depth == 0:
            parts.append(cur.strip())
            cur = ""
        else:
            cur += ch
    parts.append(cur.strip())
    return [p for p in parts if p]


# A Greek entry opens with where the word comes from ("from 1 and 922", "of Hebrew origin", "a primary verb",
# "properly, feminine of Ludios") and then gives its meaning. An opening part that names no source word and
# none of these is already the meaning ("properly, to distinguish, i.e. decide").
DERIVATION = re.compile(
    r"\{[GH]\d+\}|\b(?:from|origin|primary|prime|form|akin|affinity|derivative|derived|compound|feminine|masculine|"
    r"neuter|comparative|superlative|genitive|dative|accusative|vocative|plural|participle|contraction|contracted|"
    r"prolonged|prolongation|strengthened|reduplicated|variation|adverb|imperative|person|middle|passive|"
    r"diminutive|ordinal|particle|corresponding|same as|for Latin|derivation|prim|probably for|article|enclitic|pronoun|declension|moods)\b"
)


def greek_def_and_deriv(der, df):
    """Strong's Greek entry is one paragraph: derivation; definition. The XML cuts it in two at the first
    semicolon, even one inside brackets, so "a deity, especially (with 3588) the supreme Divinity" of θεός
    landed with the derivation and ἄνθρωπος lost its meaning to "from 3700);". Join the two halves again and
    cut after the derivation: the first part, when it says where the word comes from."""
    whole = " ".join(x for x in (inline(der, "G") if der is not None else "", inline(df, "G") if df is not None else "") if x)
    whole = whole.strip().rstrip(";:,").strip()
    parts = top_level_parts(whole)
    if len(parts) < 2:
        # One part only (or brackets left open in the source): keep the XML's own cut.
        return (inline(df, "G") if df is not None else "").strip(), (inline(der, "G") if der is not None else "").strip()
    lead = 1
    # "(compare 2737); adverb from 2596; downwards": a bracket before the derivation belongs with it.
    while lead < len(parts) - 1 and parts[lead - 1].startswith("(") and parts[lead - 1].endswith(")"):
        lead += 1
    if not DERIVATION.search(parts[lead - 1]) and not re.search("[\u0370-\u03ff\u1f00-\u1fff]", parts[lead - 1]):
        return "; ".join(parts), ""
    # "including the comparative νεώτερος ...; a primary word; new": the second part is derivation too.
    # "from 2596; and ἧμαι hēmai (to sit ...); to sit down": a part opening with "and" carries on the derivation.
    while lead < len(parts) - 1 and re.match(r"(?:(?:apparently,? |probably |perhaps )?an? (?:primary|prim|prime)|and|or perhaps)\b", parts[lead]):
        lead += 1
    return "; ".join(parts[lead:]), "; ".join(parts[:lead]) + ";"


g = ET.fromstring(zipfile.ZipFile(os.path.join(SRC, "greek.zip")).read("strongsgreek.xml"))
for e in g.iter("entry"):
    n = int(e.get("strongs"))
    gk = e.find("greek")
    pron = e.find("pronunciation")
    der, df, kjv = e.find("strongs_derivation"), e.find("strongs_def"), e.find("kjv_def")
    lex["G" + str(n)] = {
        "lemma": gk.get("unicode") if gk is not None else "",
        "xlit": gk.get("translit") if gk is not None else "",
        "pron": pron.get("strongs") if pron is not None else "",
        "def": greek_def_and_deriv(der, df)[0],
        "deriv": greek_def_and_deriv(der, df)[1],
        "kjv": (inline(kjv, "G") if kjv is not None else "").lstrip(":-").strip(),
    }

h = ET.parse(os.path.join(SRC, "hebrew.xml")).getroot()
for e in h.iter():
    if e.tag.split("}")[-1] != "div" or e.get("type") != "entry":
        continue
    n = int(e.get("n"))
    w = next((c for c in e if c.tag.split("}")[-1] == "w"), None)
    if w is None:
        continue
    notes = {c.get("type"): c for c in e if c.tag.split("}")[-1] == "note"}
    items = [inline(i, "H") for i in e.iter() if i.tag.split("}")[-1] == "item"]
    greek = [c.get("gloss")[2:] for c in e.iter() if c.tag.split("}")[-1] == "w" and (c.get("gloss") or "").startswith("G:")]
    lex["H" + str(n)] = {
        "lemma": w.get("lemma") or "",
        "plain": w.text or "",  # without vowel points, as first written
        "xlit": w.get("xlit") or "",
        "pron": w.get("POS") or "",
        "def": inline(notes["explanation"], "H") if "explanation" in notes else "",
        "senses": items,
        "deriv": inline(notes["exegesis"], "H") if "exegesis" in notes else "",
        "kjv": inline(notes["translation"], "H") if "translation" in notes else "",
        "lxx": ["G" + str(int(x)) for x in greek if x.isdigit()],
    }

# The New Testament Greek words Strong's derives from a Hebrew word ("Μεσσίας ... of Hebrew origin (4899)").
for key, entry in lex.items():
    if key.startswith("G"):
        for h in dict.fromkeys(re.findall(r"\{(H\d+)\}", entry["deriv"])):
            if h in lex:
                lex[h].setdefault("greek", []).append(key)

# How the KJV renders each word, from the tagged text itself. Little words that ride along in a
# tagged phrase ("a rock", "the earth") are left out of the list unless they are all there is.
SMALL = set("a an the of to and in on at by for with from that this it is be his her their my thy thee unto upon them ye you your our which who".split())
for c, counts in usage.items():
    if c in lex:
        content = [(w, n) for w, n in counts.most_common() if w not in SMALL] or counts.most_common()
        lex[c]["uses"] = content[:8]
        lex[c]["count"] = sum(n for w, n in content)

buckets = defaultdict(dict)
for key, entry in lex.items():
    buckets[key[0] + str(int(key[1:]) // BUCKET)][key] = entry
os.makedirs(os.path.join(OUT, "lex"), exist_ok=True)
for name, entries in buckets.items():
    with io.open(os.path.join(OUT, "lex", name + ".json"), "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, separators=(",", ":"))

print("verses written for", len(manifest), "books;", total_words, "words;", len(lex), "lexicon entries;", len(buckets), "lexicon files")
