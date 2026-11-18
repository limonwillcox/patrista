# PD English source catalog

Address book of public-domain English collections of Christian texts from roughly 1–800 CE. One row is one volume, PDF, `.txt` dump, or web-library hub.

This branch is for **Tristan Willcox** to pull and run. It does not ingest texts into `Fathers/`. Clone does not download anything.

## Pull this branch

From a clone of [limonwillcox/patrista](https://github.com/limonwillcox/patrista):

```bash
git fetch origin
git checkout docs/pd-english-source-catalog
```

If you already have a dirty tree (other work in progress), use a second worktree so you do not mix it in:

```bash
git fetch origin
git worktree add ../patrista-pd-catalog docs/pd-english-source-catalog
cd ../patrista-pd-catalog
```

Files to start with:

| File | What it is |
|---|---|
| [`catalog.jsonl`](catalog.jsonl) | One JSON object per source. This is what scripts read. |
| [`catalog.md`](catalog.md) | The same rows as markdown tables, plus the coverage eyeball. |
| [`../../scripts/pd-english-sources/run.mjs`](../../scripts/pd-english-sources/run.mjs) | List / re-check URLs / opt-in fetch. |
| [`../../scripts/pd-english-sources/build_catalog.py`](../../scripts/pd-english-sources/build_catalog.py) | Regenerates `catalog.jsonl` and `catalog.md`. |

## Run things

List what Patrista does not already have as English:

```bash
node scripts/pd-english-sources/run.mjs list --coverage not_in_patrista
node scripts/pd-english-sources/run.mjs stats
```

Re-verify URLs (HEAD, then GET — Archive.org often fails HEAD):

```bash
node scripts/pd-english-sources/run.mjs check --section 1
```

Opt-in fetch. Dry run first, then `--yes`. Files land in `data/pd-english-sources/cache/` (gitignored).

```bash
# CCEL extras that are not already in Fathers/English/
node scripts/pd-english-sources/run.mjs fetch --coverage not_in_patrista --type TXT
node scripts/pd-english-sources/run.mjs fetch --yes --id s1-bede-sellar

# Archive.org OCR text or PDF for one scan
node scripts/pd-english-sources/run.mjs fetch --yes --id s5-james-ant --format djvu-txt
node scripts/pd-english-sources/run.mjs fetch --yes --id s3-lfc-43 --format pdf
```

ANF + NPNF volume dumps are already in `Fathers/English/`. Re-download those with the existing script:

```bash
node scripts/ccel-english/download.mjs
```

## Coverage eyeball (vs `Fathers/English/` on main)

Patrista English today is the Schaff set: ANF 10 + NPNF Series I 14 + NPNF Series II 14 as volume dumps, plus author-split `.txt` files cut from those same volumes. `scripts/ccel-english/download.mjs` already fetches them. New Advent is already wired (`corpus/newadvent.json`). A few Lightfoot dumps sit in `scratch/` and are not in `Fathers/`.

Of **283 catalog rows** (261 volumes + 22 hubs):

| Coverage | Rows | Share of volume rows |
|---|---:|---|
| `in_patrista` exact edition on disk | 38 | 15% |
| `overlap` same work, other PD edition | 138 | 53% |
| `not_in_patrista` no English of this work | 85 | 33% |
| `hub` web library | 22 | — |

So: **about two thirds of the volumes are works Patrista already has in Schaff English.** The remaining third is new English, plus Pearse *Additional Fathers* as a hub.

Where the new English is:

- **§5 Oriental / Syriac / Coptic / apocrypha** (most of the 85): Budge Coptic and desert-father volumes, Charles, James extras, Narsai, Philoxenus, Severus, Odes of Solomon, PO English, TTS.
- **LFC** Cyril of Alexandria (vols 43, 47, 48) and Gregory the Great *Morals on Job* (vols 18, 21, 23, 31).
- **English Bede**, Evagrius Scholasticus, Philo Yonge, Gildas/Nennius.
- **Unique SPCK:** Egeria (Latin only today), Macarius homilies, Palladius *Lausiac History* and the *Dialogue on Chrysostom*, Dionysius the Areopagite, Ferrar *Demonstratio Evangelica*, Irenaeus *Demonstration* (1904 find, after ANF).

New Advent and CCEL are already in the pipeline. Roger Pearse *Additional Fathers* (`tertullian.org/fathers/`) is the largest uningested English mine.

`coverage` on each JSONL row is an eyeball against folder names in `Fathers/English/` and `Fathers/Latin/`, not a line-by-line textual diff.

## Rules this catalog followed

- English translations of texts written c. 1–800 CE.
- US PD: first publication 1930 or earlier.
- Do not list individual authors/chapters/works inside a volume.
- Skip Syriac/Ethiopic-only text volumes (Budge *Contendings* vol. 1, Wright Acts vol. 1, Brooks TTS Severus vol. 1, …).
- Skip later compilations and post-800 authors (Ishoʿdad, Thomas of Marga, Evetts *History of the Patriarchs*, Kidd vol. 3).
- Skip Loeb volumes published 1931+ (Oulton 1932, Glover 1931, Wright 1933, Basil Letters vol. 4 1934).

Rebuild the tables after editing `build_catalog.py`:

```bash
python3 scripts/pd-english-sources/build_catalog.py
```
