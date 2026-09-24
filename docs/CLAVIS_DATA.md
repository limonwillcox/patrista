# Clavis relational text store

English and original texts hang off Clavis works by foreign key. Clavis scrape sources stay read-only. This store is a mirror: import a JSONL export, attach a text by `work_id`, serve metadata from D1 and bodies from R2.

GitHub Pages stays the static UI. No AWS.

## Nesting

```
authors 1—* works 1—* work_texts
```

`works.parent_work_id` is a nullable self-FK for Clavis tree nodes that are themselves works (a book under a collection). `work_texts` identifies a body by the composite primary key `(work_id, language)`.

| Table | Role |
| --- | --- |
| `authors` | `author_id`, Latin name, optional detail URL, `letter_bucket` (A–Z from the first Latin letter, else `#`), `imported_at` |
| `works` | `work_id`, `author_id` FK, nullable `parent_work_id` FK, Latin title, optional designated title, `clavis_codes` JSON, `path_json` JSON, detail URL, `kind`, `imported_at` |
| `work_texts` | `(work_id, language)` PK, `language` `english` \| `original`, title, `status` default `draft`, `r2_key`, `source_path`, `content_sha256`, `byte_size`, `updated_at` |

Schema: `data/clavis/schema.sql`.

A Clavis export row looks like:

```json
{"author_id":"553436765CE645E3BBE5B69EBC2B87D1","authorNameLatin":"Acacius Constantinopolitanus","work_id":"6F4F6BC373DE46C0B5C6093B651B0EAE","titleLatin":"Epistula ad Petrum Alexandriae","clavis":["CPG-5991","CPG-9123"],"parent_id":"3AA7F34816089C4AAD0899479D8FD2EE","path":["Genuina"],"detailUrl":"https://clavis.brepols.net/clacla/OA/Details.aspx?id=6F4F6BC373DE46C0B5C6093B651B0EAE","kind":"work"}
```

Import upserts authors and works. It does not write scrape files. `parent_work_id` is set only when that parent row exists in `works`. A grouping id that was not exported (the Acacius `Genuina` node in the fixture) stays `NULL`. `path_json` still keeps `["Genuina"]`. Re-import is safe: the same `author_id` / `work_id` updates in place and does not delete `work_texts`.

Augustine example: `work_id` `E84EBB53FD524B8F8CD332CC55C805D1`, title `Retractationes`, author `Augustinus episcopus Hipponensis`. The fixture author id is synthetic. The work id is the Clavis id.

## D1 vs R2

| | D1 `CLAVIS_DB` | R2 `CLAVIS_TEXTS` |
| --- | --- | --- |
| Holds | authors, works, work_texts metadata | UTF-8 body bytes |
| Key | SQL primary keys | `clavis/texts/{work_id}/{language}.txt` |
| Does not hold | multi-MB bodies | Clavis catalogue rows |

Local sqlite (gitignored): `data/clavis/clavis.sqlite`.

Local body mirror (gitignored): `data/clavis/bodies/{work_id}/{language}.txt`.

`work_texts.r2_key` points at the R2 object. The sqlite file never contains the body.

## Pack and import

The catalogue spine checked into git is `data/clavis/imports/works-by-author.jsonl` (one Clavis work per line). `data/clavis/imports/authors-expanded.jsonl` fills `authors.detail_url`. Neither file is a scrape source; import only reads them.

```bash
pnpm clavis:import -- data/clavis/imports/works-by-author.jsonl data/clavis/clavis.sqlite --authors data/clavis/imports/authors-expanded.jsonl
pnpm clavis:pack
node scripts/clavis/attach-text.mjs \
  --work E84EBB53FD524B8F8CD332CC55C805D1 \
  --language english \
  --status ready \
  --title Retractations \
  --file data/clavis/fixtures/retractationes-english.txt
```

`clavis:import` and `clavis:pack` both apply `data/clavis/schema.sql` and upsert JSONL (one object per line, `#` comments allowed, or a JSON array). Pack does not drop `work_texts`. Attach refuses a `work_id` that is not already in `works`.

The same `work_id` sometimes appears under two authors in the export. Upsert keeps the last row. That cross-listing is why a title can sit on an unexpected author after import.

Tiny fixture: `data/clavis/fixtures/works.jsonl` and `data/clavis/fixtures/retractationes-english.txt`.

Scripts use `node:sqlite` `DatabaseSync`, same as `scripts/links/pack-sqlite.mjs`.

## First English tranche

`scripts/clavis/attach-english.mjs` maps `Fathers/English/**/*.txt` onto imported works. A row becomes `status=ready` only when the folder's author tokens and the Latin title hit exactly one work, and exactly one file claims that work. A reviewed standalone row in `data/clavis/imports/batch-001-promote-plan.json` may choose between two files of the same work (the Pilkington Confessions file is the one kept).

These stay off `ready`:

- two or more Clavis works share the title
- two files claim one work and the plan does not pick one
- the extract contains more than one work (volume dumps, shorter-and-longer Ignatius, catechetical lectures that continue into the mystagogic lectures)
- the plan marks the path as a collection section (`match: collection`)
- the title exists, but the stored author is a cross-list (Novatian, *De cibis iudaicis*, is stored under Tertullian)

A trailing block of `file:///ccel/` cache lines is stripped before the body is hashed. The bytes are still not stored in D1. Local copies go to `data/clavis/bodies/` (gitignored). The committed record is:

- `data/clavis/seeds/work-texts.jsonl` — `work_texts` metadata for the ready rows
- `data/clavis/reports/english-attach.json` — ready rows and every skip, with a reason

```bash
pnpm clavis:attach-english -- --report data/clavis/reports/english-attach.json --seed data/clavis/seeds/work-texts.jsonl
pnpm clavis:attach-english -- --dry-run
```

Re-running attach upserts the same `(work_id, language)` rows. Board label moves are not part of this import.

Staged bodies attached with `attach-text`, rather than a `Fathers/English` volume, are listed below. The bodies stay gitignored; the seed lines are the committed record.

- Issue #160: Chrysostom, *Ad illuminandos catechesis 1* (`84D990F10C594432B98F2B7720BC8D75`), "First Instruction to Catechumens". sha256 `0c063da13b5c0e8824e16f8095103471e8ae12e16fd485eeca63199cfac489b3`, 28572 bytes.
- Issue #150: Chrysostom, *Ad illuminandos catechesis 2* (`CBEB3672B73940E4ABEFFB72CF7F80C5`), "Second Instruction to Catechumens". sha256 `295bb627c982b69522fe3d1aa37321fbb4f3d618fc75995ac2e1b53fe3968a05`, 32575 bytes.
- Issue #124: Gregory Nazianzen, *De XIV luminibus iuxta Nazianzeni recensionem* (`99397283D8804F49A9F053C06D79114C`, CPG-3094), "Oration on the Holy Lights". sha256 `0059129718395301566f35d33716ad800cc4a78732f227ef7a34078d3fb6dc2b`, 33159 bytes.
- Issue #105: Gregory Nazianzen, *Ad Aegyptum in aduentu domini in Hierosolymas* (`9A4671890F0F4D17B10501321F88E559`, CPG-3115.1), "On the Arrival of the Egyptians". sha256 `5c361a2282d481528202a02a8f85cf90d1de227300f8e27cf5bada21fd450396`, 17887 bytes.
- Issue #116: Gregory Nazianzen, *De baptismate et de puritate* (`852554E9B5584DDBA5FCBF0FE2023387`, CPG-3113.2), "The Oration on Holy Baptism". sha256 `fe720e82d48b0c43f479959348e40ab9f28dc66f1a069b12fca144c130bcad54`, 83654 bytes.
- Issue #8: Augustine, *Ad Donatistas post collationem siue Contra partem Donati post gesta* (`12E4B8193BDC4A8C97B8549A3CF39F68`, CPL-338), "The Correction of the Donatists". sha256 `71650f991da761e2fd95640c5b8d5516ec5fb76a17a7f74b975c8f6685219083`, 89982 bytes.
- Issue #60: Athanasius, *Apologia contra Arianos (seu Apologia secunda)* (`3C5F838B863641D3B49601A7ED110890`, CPG-2123), "Defence Against the Arians". sha256 `e51dbcc1ff1006519c1a9ac08b9d885ac6688c1f84b2dc943f56e303650c4a04`, 212419 bytes.
- Issue #66: Athanasius, *Apologia de fuga sua* (`F447B660730E4BE2B4BFDB414FA24551`, CPG-2122), "Defence of His Flight". sha256 `60eba8953545a645473fcb1ed97b1f5b4198599e5b37fef956d59bc05ef0b270`, 38189 bytes.
- Issue #69: Athanasius, *Apologia ad Constantium* (`B6538F071CEA4C239332B00E7C9B7296`, CPG-2129), "Apology to the Emperor". sha256 `c0ebd9e2a271b2a11f9f95f71faabded991fb2a6bd6a95d0cf6052a8977ab44d`, 61743 bytes.
- Issue #185: Jerome, *Apologia aduersus libros Rufini seu Epistula Hieronymi aduersus Rufinum* (`C5D1DDB3C8924055B1EF983A824B2789`, CPL-613), "Apology Against Rufinus". sha256 `735a7550fdda539aea326296c3f87f92f4c887a8bb80cd49f3a11b7ef25870a9`, 289625 bytes.
- Issue #77: *Ad Petrum fratrem de differentia essentiae et hypostaseos* (`E6EEE603DF9D4278A69D23BB929A5E23`, CPG-3196), "To his Brother Gregory, concerning the difference between ουσία and υπόστασις". The export lists this `work_id` under both Basil and Gregory of Nyssa; the mirror keeps Gregory of Nyssa. sha256 `41d30637b2c73c9e7d84ed2cd624d6d9ab6ed9683c4ca84e1204a5fab741fc76`, 21538 bytes.
- Issue #84: Athanasius, *Commentarius de templo Athenarum* (`773B6E43A8464983BA3DFE7CF9E5CE3E`, CPG-2289), "On the Temple, Schools, and Theatres in Athens". sha256 `7ccc12e51a708fce1a181451274b988103a02b028bcc884d778d172e3144dcb6`, 6162 bytes.
- Issue #49: Ambrose, *De Nabuthae* (`ECD449066BF24006A0571686398CD252`, CPL-138), "On Naboth". sha256 `89aa3b96992fb67ae80c5cb8dbe54a5b230bfcdd1d5107ce28497d1e9fc33583`, 69026 bytes.
- Issue #89: Basil, *Canones XVI* (`87978F5DD3F84B62A7A05D83E01B3E46`, CPG-8510), "The First Canonical Epistle of St. Basil to Amphilochius (Canons I–XVI)". sha256 `4d8a4043833e06db398e32a82159f4cedde423c068b23588c7ab6f6d9175c35d`, 6595 bytes.
- Issue #192: *Apologia (contra Hieronymum)* (`449E4FAE1FFA41F1BE26941388BC1A10`, CPL-197), "The Apology of Rufinus". sha256 `91830a81fc68afd5be0f09f11b1d7dce4dc1d71878d0dcd70774c4c40313a692`, 278290 bytes.
- Issue #198: *Commentarii in Apocalypsim Ioannis* (`EB66B24E69C74E3895C20EC7A567BC40`, CPL-80), "Commentary on the Apocalypse of the Blessed John". sha256 `8bfaaf255d7a208bee4f57e97eb62955ee3f02b498246c870561aeda8d2dc1d2`, 90514 bytes.
- Issue #155: Chrysostom, *Ad Demetrium de compunctione liber 1* (`CE5CA020C8584E04B7A71F73083F1B70`, CPG-4308), "First Book on Compunction (to Demetrius)". sha256 `d6c20e948e8c09e71f4b168d786cd0dba703b022dcda166f78ecf247c883a487`, 69223 bytes.
- Issue #163: Chrysostom, *Ad Stelechium de compunctione liber 2* (`1F5F2DE50EE14B21940358C8FCDCF127`, CPG-4309), "Second Book on Compunction (to Stelechius)". sha256 `4f473d4cb33a93cf0dfaf6570c9e404a8b30f89b8084f139dad8406a210aaf5a`, 50131 bytes.
- Issue #38: Ambrose, *De Helia et ieiunio* (`52A399A65F674619AC6B8185E6F3C52B`, CPL-137), "On Elias and Fasting". sha256 `f0b149b3cf11725875d85e0c6881da80526816a9d9cc5c2a68e21d1cd84a3a2f`, 77651 bytes.
- Issue #55: Ambrose, *De bono mortis* (`2B1F6A2E09E741F58E1A4070E2F01A7E`, CPL-129), "Of the Happiness of Death". sha256 `377f3e857274136c92c805de1c07a2bf49a84f63466b7d82b5b2d0a4a967377d`, 62920 bytes.
- Issue #82: Basil, *Aduersus eos qui per calumniam dicunt dici a nobis tres deos* (`625C765E8FB845EC91632AE01F33DD04`, CPG-2914), "Letter CLXXXIX. To Eustathius the physician". sha256 `22943df5cb9dbda1cc53998e6746338b336806f558fb58f6e413086b9ed143d9`, 15835 bytes.
- Dewey FOUND: Cyrillus Hierosolymitanus, *Catecheses* (`700F6347743C4F79985FCC247EB1C789`, CPG-3585), "Catechetical Lectures (Procatechesis and Lectures I–XVIII)". sha256 `d4c5b8ecc26364a04eaf0a9e2ec2f039d3d74ec137c604b9242e75217483d0ce`, 774399 bytes.
- Dewey FOUND: Cassianus abbas Massiliensis, *Conlationes* (`7ADD1965B8FE433385C0A33D8DEF1981`, CPL-512), "The Conferences of John Cassian". sha256 `7ce300172a90415aa19ac7a053932fc21e17b8cf6c6e5bdcbc757469b855d446`, 1166121 bytes.
- Dewey FOUND: Irenaeus Lugdunensis, *Demonstratio praedicationis apostolicae (Epideixis)* (`CF46D0EA186A441BB1F4C5FCF6557677`, CPG-1307), "The Demonstration of the Apostolic Preaching". sha256 `1e095d515077e9f3f0144d34d766f354a60d0f888659b2fce58ef5ca6ed718b9`, 150581 bytes.
- Dewey FOUND: Cyprianus episcopus Carthaginensis, *Ad Donatum* (`7C1D229E0AB24F3B9659C216C92B5E15`, CPL-38), "Epistle I. To Donatus". sha256 `662c37cbe76f8ce98f9da2f4c88607105940ebacf28bb941c36b31c445ca6f2c`, 28875 bytes.
- Dewey FOUND: Lactantius, *Epitome Diuinarum Institutionum* (`7B2888F4BDD1433E9F58A2E1D247464B`, CPL-86), "The Epitome of the Divine Institutes". sha256 `e86dd99e9db225aa8c5ff8b44fe4c0962936bef0e16e52e97c51dc7c7813e555`, 396045 bytes.
- Dewey FOUND: Iohannes Chrysostomus, *Ad Theodorum lapsum libri 1-2* (`13CEA531516C45DA95FF4735A9C904FD`, CPG-4305), "An Exhortation to Theodore After His Fall". sha256 `09889e7fc648557ab0496dafc7c08c5e6f87f7529f74c8b9fd63c80cc57f4195`, 132272 bytes.
- Dewey FOUND: Eunomius Cyzicenus, *Contra Eunomium libri* (`8C5F722EA3A0488D80A0B94D4101F5DD`, CPG-3135), "Against Eunomius (Books I–XII)". sha256 `93100e049c38b0f27dadaf36ba704d2d66743cdfbd20b91ab00eabfdba3e3e10`, 1155551 bytes.
- Dewey FOUND: Cyrillus Hierosolymitanus, *Mystagogiae 1-5* (`04B64425F4C74D5EA8591B2BE09DC275`, CPG-3586), "Mystagogic Catechetical Lectures (Lectures XIX–XXIII)". sha256 `c7cbd448ce324a8bbc98f1176b236989e5a736b31e8a67a2ed02c46c6dc6ac9c`, 77344 bytes.
- Dewey FOUND: Cassianus abbas Massiliensis, *De institutis coenobiorum* (`47A887850794412E9AC961924EB0A9C2`, CPL-513), "The Twelve Books on the Institutes of the Coenobia". sha256 `26136ef50369595bcc45beba6033072bb595a77a42a739af0ec36eeae60bb7be`, 438408 bytes.
- Dewey FOUND: Cyprianus episcopus Carthaginensis, *Ad Quirinum (Testimoniorum libri iii)* (`6359B395B9A1499D8F039ADCC60A2A3E`, CPL-39), "Treatise XII. Three Books of Testimonies Against the Jews". sha256 `497fc5af2896c87fd1adb332c59a1c850f8e54d9e201037fadc96803e3f05d70`, 269729 bytes.
- Dewey FOUND: Tatianus, *Oratio ad Graecos* (`F36CC64FB9E04D5B8D78AEF3B7C39E74`, CPG-1082), "The Discourse to the Greeks". sha256 `cae1e72085f037b6be84f732964d040f3773a426a0d1aeeb5c5f667e6609990f`, 9947 bytes.
- Dewey FOUND: Lactantius, *De aue Phoenice* (`8EAC5D05D03C4088B8826FEEA37215F7`, CPL-90), "The Phoenix". sha256 `a85209e7b568bb13d83c7a0c60d73fe1f1645f525a7b0fce17db44bb5adb6840`, 12624 bytes.
- Dewey FOUND: Cassianus abbas Massiliensis, *De incarnatione Domini contra Nestorium* (`0363964018C743C3A595768B63C575AF`, CPL-514), "Seven Books on the Incarnation of the Lord, Against Nestorius". sha256 `f95cd26386cc1c07ffac674bb22b0e9b24b7685b6e5217686421d3454a75a05d`, 624335 bytes.
- Dewey FOUND: Cyprianus episcopus Carthaginensis, *De habitu uirginum* (`28AB3BB867454A7CB71B1A6AAFE3725B`, CPL-40), "Treatise II. On the Dress of Virgins". sha256 `c9eb98763561a9fce61f5caddee09a3bd578767ddb49116d6c7e12bc302242d6`, 37901 bytes.
- Dewey FOUND: Iustinus Martyr, *Cohortatio ad Graecos* (`59B86508830044119B7BA2E74F7B1FA5`, CPG-1083), "Hortatory Address to the Greeks". sha256 `4dedf533f0cca228afe36835331e2ba97cc4eb24a3d521114bab1b8746b6b946`, 90265 bytes.
- Dewey FOUND: Basilius Caesariensis, *De spiritu sancto* (`F3AAE8F52F7044FDAF5C3920C1E79B20`, CPG-2839), "On the Holy Spirit (De Spiritu Sancto)". sha256 `3cfd111ec84d37c74bd9f01ca60a4e6261bfbacf97ed6f589f6eae970de55e65`, 293447 bytes.
- Dewey FOUND: Gregorius Nyssenus, *Ad Eustathium de sancta trinitate* (`6BBF6C5F3ED64531A84EBEB7CEAF085C`, CPG-3137), "On the Holy Trinity, and of the Godhead of the Holy Spirit (To Eustathius)". sha256 `bab448fa355ec6c7f0f9cca8e564429230e1fe62ce837836ab495d48aef8e458`, 22204 bytes.
- Dewey FOUND: Cyprianus episcopus Carthaginensis, *De catholicae ecclesiae unitate* (`D3C6B0011C424D1F81888A9DE9A65BED`, CPL-41), "Treatise I. On the Unity of the Church". sha256 `3c721d943a9236e6ba6bef24a4786da2bb1261d0facd3c1e58c03d9bdb65bf22`, 48269 bytes.
- Dewey FOUND: Iustinus Martyr, *De monarchia* (`6CC1F72BEF4B49929EF37D6CE3F58A7E`, CPG-1084), "On the Sole Government of God". sha256 `34645732f718c22f1663f6ed3aadcf5e21254c5eeaf20a9c3136a8e39e536f79`, 17883 bytes.
- Dewey FOUND: Gregorius Nyssenus, *Ad Ablabium quod non sint tres dei* (`8403C5890607412DB09F54121D1C0882`, CPG-3139), "On "Not Three Gods" (To Ablabius)". sha256 `be0dbe4c66a12831a96fe2b11c98c217e17785a251e8c5d4af9ae8f6315044f3`, 31308 bytes.
- Dewey FOUND: Gregorius Magnus, *Regula pastoralis* (`F5B7BE76FA304C1B881525CAD062557D`, CPL-1712), "The Book of Pastoral Rule". sha256 `fb38f647887496337b19b269dceb5323294e1226d0347643e62168bc820138dd`, 377677 bytes.
- Dewey FOUND: Cyprianus episcopus Carthaginensis, *De lapsis* (`CB40644F575B4F33B78F2FA1FD6E510D`, CPL-42), "Treatise III. On the Lapsed". sha256 `79f2d2b413880855ec115ce337dd26a4ecf5302964a47e8620452a7ed7ab1b70`, 58377 bytes.
- Dewey FOUND: Iohannes Chrysostomus, *Ad uiduam iuniorem* (`2C4A6FF2AF8E49BA97E66130037BE656`, CPG-4314), "Letter to a Young Widow". sha256 `68c83c5f133ddaaedb2aef45b3c8a6876403d392b2ad37d542ec60fa4de17203`, 25242 bytes.
- Dewey FOUND: Gregorius Nyssenus, *Ad Simplicium de fide* (`37944672F45E480781E8E9A73E29A85D`, CPG-3140), "On the Faith (To Simplicius)". sha256 `c54fa550a3f8c47fde97c03620546559a3539e1d54bfa8e6db9105cdfeb6d325`, 15438 bytes.
- Dewey FOUND: Cyprianus episcopus Carthaginensis, *De dominica oratione* (`AE784095FFA740BDB688F37F7295DAFE`, CPL-43, CPPM1-1214), "Treatise IV. On the Lord's Prayer". sha256 `4002e3639a02748e4dc9ded2c35c7591783e67f5e5ba7e5119d4efc5613f17e9`, 54285 bytes.
- Dewey FOUND: Hilarius episcopus Pictaviensis, *De Trinitate* (`90E9F6BF787F432B889E19DFEB7ABC82`, CPL-433), "On the Trinity". sha256 `5504f9a9862b7bba37d2a916418729fd6f79dadd9f2d530e8cc521fde3761919`, 974704 bytes.
- Dewey FOUND: Tertullianus, *Passio SS. Perpetuae et Felicitatis* (`7548BCE2E40046089D8ECE090D024E28`, CPL-32), "The Passion of the Holy Martyrs Perpetua and Felicitas". sha256 `946a76972cf29f14dbc55c1f2b58bfb0f9717fc626c79a533e26e98cfa5d119b`, 36146 bytes.
- Dewey FOUND: Cyprianus episcopus Carthaginensis, *De mortalitate* (`F279A6267CD64CB8AAB5BAFF2669904C`, CPL-44), "Treatise VII. On the Mortality". sha256 `d593b825348d4948c704926d5fc45e13bbee1a05b3210ec7e43eaad3c8157078`, 37428 bytes.
- Dewey FOUND: Iohannes Chrysostomus, *De sacerdotio libri 1-6* (`6B1A9AEBAAC54D1987FE56EF753E051F`, CPG-4316), "On the Priesthood (Six Books)". sha256 `c2fe26bf461f013b6267a485e76c7e2a41ae0ea3d195b0cf81446da99b373bf1`, 250429 bytes.
- Dewey FOUND: Gregorius Nyssenus, *Aduersus Macedonianos de spiritu sancto* (`29CD75317DC2477094C9F4D25EB5C629`, CPG-3142), "On the Holy Spirit Against the Followers of Macedonius". sha256 `b25f137c85b9e7ef46fd129128632df88bdbf6089cbe9d678e65d52b8f5728da`, 60798 bytes.
- Dewey FOUND: Hilarius episcopus Pictaviensis, *De synodis* (`C73C999C6D954D46874BC30F8D7AF1DA`, CPL-434), "On the Councils, or, The Faith of the Easterns (De Synodis)". sha256 `448c0674988ec42f2286e76ad1daa6ac291e28cdd3cb18da4d68d64ab28137a6`, 165389 bytes.
- Dewey FOUND: Cyprianus episcopus Carthaginensis, *Ad Fortunatum (de exhortatione martyrii)* (`EE9356C4C4CC4561A4A5547E82CF1C6A`, CPL-45), "Treatise XI. Exhortation to Martyrdom, Addressed to Fortunatus". sha256 `c9fa09b11be3db82c1cba4cb64edb6dc6d340a69172cd11875de4c25551d7852`, 56943 bytes.
- Dewey FOUND: Gregorius Nyssenus, *De infantibus praemature abreptis* (`5C26BD3257764681AE46790FF9F1140A`, CPG-3145), "On Infants' Early Deaths". sha256 `fcd5b95669a2a241443d75e578e484c080045736c6de0731f987910e1bf84ef0`, 43703 bytes.
- Dewey FOUND: Cyprianus episcopus Carthaginensis, *Ad Demetrianum* (`13060EC8AAF245F2A8323AF18278D94B`, CPL-46), "Treatise V. An Address to Demetrianus". sha256 `a85dba9cb82e04d2f4e5d0810edc5405bde2aea5a7896c696cf042bc43154d40`, 43179 bytes.
- Dewey FOUND: Augustinus episcopus Hipponensis, *De moribus Ecclesiae catholicae et de moribus Manichaeorum* (`0D11ECFDA83849CFB1370F81BB81A4DA`, CPL-261), "On the Morals of the Catholic Church; and On the Morals of the Manichaeans". sha256 `764a33c03e2173283943de14d5d8c4f3eb044efbf200c505e8dda36a222b24e3`, 292373 bytes.
- Dewey FOUND: Ambrosius episcopus Mediolanensis, *De paenitentia* (`81BDAC3BF41249EEA4B9FB083543F52F`, CPL-156), "Two Books Concerning Repentance". sha256 `e296b2217621ec570d1918e8258af0c555ab735d08259040d9cf7d413db19a74`, 265155 bytes.
- Dewey FOUND: Hippolytus Romanus, *Epistula ad Diognetum* (`6A7B4E542150445E933F8DE559994112`, CPG-1112), "The Epistle of Mathetes to Diognetus". sha256 `5238dc391145b2bc4630c5015ab225e77e5ccea0d36ce8376c65915658ee4b2d`, 28309 bytes.
- Dewey FOUND: Athanasius Alexandrinus, *Oratio de incarnatione Verbi (seu De fide)* (`4D43DDE8311F44EBB1751FEDF9AC3DA0`, CPG-2091), "On the Incarnation of the Word". sha256 `891e657183836b8e536e319a06d740ca6d7dce041221ef7e09e4827dd8011650`, 304267 bytes.
- Dewey FOUND: Athanasius Alexandrinus, *Orationes contra Arianos III* (`23B12A4DF60F4DE98D7E8380625BBD3F`, CPG-2093), "Four Discourses Against the Arians (Orations/Discourses I–III)". sha256 `0e3fba817c9622eb4a70b872f4be8145974f3224465f6a7a3fa0e20fcf8727a5`, 746344 bytes.
- Dewey FOUND: Athanasius Alexandrinus, *Vita S. Antonii ab. in Thebaide* (`0FBB951E609D4F0AAEEE0B515DE99B1A`, CPG-2101, NBHG-Antonius Theb 1, BHG-140, BHG-140b, BHG-140c, BHG-140d, BHG-140e), "Life of Antony". sha256 `ccc06f698a0e596a29281264c1c2b8e8e2c122e5f30e0c723e9371dc73152b05`, 550787 bytes.
- Dewey FOUND: Augustinus episcopus Hipponensis, *Enchiridion ad Laurentium, seu de fide, spe et caritate* (`B56F7AFF65E04094A4FC0A43E8FF6C45`, CPL-295), "The Enchiridion". sha256 `66f55c1f17ac0fa0dab715549302396893c849a45f969e25514e15f4131d0c92`, 424417 bytes.
- Dewey FOUND: Athenagoras, *De resurrectione mortuorum* (`2A947A2E95874A89A893959ED14B1C5B`, CPG-1071), "On the Resurrection of the Dead". sha256 `4961193d3d1290987f4450fc6f7b0048cc6a7ef3f090a96a37e5545358e5fc15`, 94526 bytes.
- Dewey FOUND: Athenagoras, *Supplicatio pro Christianis* (`F3520F5C5F734F9BB2BB3FA2FFCD49FE`, CPG-1070), "A Plea for the Christians (Embassy)". sha256 `6dac8919067d48cbdf485ad9d3122be32d20acae70f684ba59d5b16aec59df19`, 104157 bytes.
- Dewey FOUND: Bardesanes, *Liber legum regionum* (`EE96887038474C85B2971FBF906B14E6`, CPG-1152), "The Book of the Laws of Various Countries". sha256 `c7dd2ce5df22d8537690c5676d9bb4df56a3f1abd403225c902451dc85da4568`, 54038 bytes.
- Dewey FOUND: Beda Venerabilis monachus in Anglia, *Historia ecclesiastica gentis Anglorum* (`2B3338894E6F417BA8EE5FC0C6066C8E`, CPL-1375), "Bede's Ecclesiastical History of England". sha256 `8a90d82801828f8e6095b79aa5bb063ff349c5f1de5aff965d12ae8feccfc035`, 629345 bytes.
- Dewey FOUND: Ignatius episcopus Antiochenus martyr, *Epistulae vii genuinae* (`92454D22E91440C98A18D0BA6C792F51`, CPG-1025), "The Seven Genuine Epistles of Ignatius (ANF shorter and longer versions)". sha256 `f1b2a99858480705adf5e385101c8d213868b2d8a02bc81334ff407aa6fea976`, 277645 bytes.
- Dewey FOUND: Tatianus, *Oratio ad Graecos* (`4A3837A44C424F69855C4DFD68035502`, CPG-1104), "Address of Tatian to the Greeks". sha256 `dcea9410b41fbe606d2262965950fc0fdd30cb5575fd88f7eee84f3c44ef869b`, 99399 bytes.
- Dewey FOUND: Commodianus, *Instructiones* (`BF9173970E214EEF8830F1CB42880CFA`, CPL-1470), "The Instructions of Commodianus". sha256 `c2bf7c34ea598775e3ae9b253ac7fc14529b4e312a7fd07be8e0fb01cb354e11`, 80254 bytes.
- Dewey FOUND: Tertullianus, *De cibis iudaicis* (`C5CAD272624D4A07B4A99D40FA464907`, CPL-68, CPPM2-1627), "On the Jewish Meats". sha256 `f4f0e19aa1defa5517f2f300e4c0a8069cabd0e50b166c708678321024032de0`, 29535 bytes.
- Dewey FOUND: Theodoretus episcopus Cyri, *Historia ecclesiastica* (`2366A8A732974E638039A9594F74DADC`, CPG-6222), "The Ecclesiastical History of Theodoret". sha256 `bd9d02f6f5efbe5770a53bb2952c298599d25a4961baaacfd018adfe108a51ef`, 697496 bytes.
- Dewey FOUND: Boethius, *Philosophiae consolatio* (`B2037578EC314E579A2F9D09E45E0D38`, CPL-878), "The Consolation of Philosophy". sha256 `d02c98b93f8c734e27f8b5746e21434ab716a6eb04f2395b99e5a0cf3eb02628`, 249385 bytes.
- Dewey FOUND: Sulpicius Severus, *Chronicorum l. ii* (`DBA8ED30B4CF4E4891B31036C5029B05`), "The Sacred History (Chronicles), Books I–II". sha256 `cd0a22c6ffa7bb47ff9d1d58b6a00bd7f4f8c7ed4bbc05769bfc0135bcede379`, 265833 bytes.
- Dewey FOUND: Cyprianus episcopus Carthaginensis, *Quod idola dii non sint* (`63FDDF09CBB8498B9E487B74BA48191D`, CPL-57, CPPM2-550), "On the Vanity of Idols". sha256 `33334646014de77840d0e0f4faa49388478c89a36bc3d50779831427b37dd613`, 19232 bytes.
- Dewey FOUND: Cyprianus episcopus Carthaginensis, *De opere et eleemosynis* (`711655E399F449C2A518D421511E52C3`, CPL-47), "On Works and Alms". sha256 `45369bffe2358a083d05610b6361dd50a64d25b00950c636334667cc6c10aa43`, 44225 bytes.
- Dewey FOUND: Cyprianus episcopus Carthaginensis, *De bono patientiae* (`DD4CAB9392EF4EABBAE72588A4C78F20`, CPL-48), "On the Advantage of Patience". sha256 `bacba21cd8b3c42ef03fb54f10161e22e887062cbdf6b68618e1b58f1fc492f8`, 39709 bytes.
- Dewey FOUND: Cyprianus episcopus Carthaginensis, *De zelo et liuore* (`731530545A7E42D89D244AA8C1BEFBEA`, CPL-49), "On Jealousy and Envy". sha256 `35064224c84f6907d04ded8418415a15b887821bd3f21ef63978edd4d1c2eecc`, 28967 bytes.
- Dewey FOUND: Hieronymus presbyter, *De uiris inlustribus* (`3DF9DF3CCA8D43E5A3214D58B714FF15`, CPL-616), "Lives of Illustrious Men (Jerome)". sha256 `3079acd3ae0a2d01647a3e273e7d16fb538701aab3159d1b69543f1d5a84a398`, 114923 bytes.
- Dewey FOUND: Hieronymus presbyter, *Dialogi contra Pelagianos libri iii* (`ED3101DA1ED14286914EEA361E11A9D7`, CPL-615), "Against the Pelagians (Three Books)". sha256 `4d4215b931ccefb5e81c368e9a1aaceb4212e29c0ab75192e29380f031cd2062`, 283082 bytes.
- Dewey FOUND: Hieronymus presbyter, *Vita Sancti Hilarionis* (`60A606A7A5284FB19B5D271AE70D6297`, BHL-3879, CPL-618), "The Life of St. Hilarion". sha256 `00d16a6df3bf420c84cf24dd605f2840ca328272b62debdc27145f0215a8aa62`, 62999 bytes.
- Dewey FOUND: Hieronymus presbyter, *Contra Vigilantium* (`8D17CCB137F74C5CBBAAA34620DBE189`, CPL-611), "Against Vigilantius". sha256 `c40294830f93edf9145a50600b559fcf27f1d5fa1ad43369f8b3701a198829ba`, 36547 bytes.
- Dewey FOUND: Hieronymus presbyter, *Aduersus Iovinianum* (`BD2877DB7FEA476AA9E6DB70A9B53A78`, CPL-610), "Against Jovinianus". sha256 `b242d7d934f20bbf3688983c9acac7e5a8d7aa6b711c90b9ba0b7e0affb57f8b`, 384023 bytes.
- Dewey FOUND: Theodoretus episcopus Cyri, *Eranistes* (`5967D46223AB4C7C8E510FC98114F83C`, CPG-6217), "Eranistes, or Dialogues". sha256 `a69e4598bca7c2a66452da3b27844abe27db851a8bc0faf1930c0e6e435a6d78`, 423748 bytes.
- Dewey FOUND: Eusebius Caesariensis, *Vita Constantini* (`F7C69DF39D6D49359A6D9D15EDB9DD4E`, CPG-3496, BHG-361x), "The Life of Constantine". sha256 `4d76bb9b279e7af3fdc0f9ef6313be2a9f1b287ca8a6b614a74df4e08192cd08`, 388448 bytes.
- Dewey FOUND: Eusebius Caesariensis, *Oratio ad coetum sanctorum* (`71CD2CB84BD646769CCEAA2AD26AD977`, CPG-3497, BHG-361y), "Oration of Constantine to the Assembly of the Saints". sha256 `1f985abe47b576fb064b6f2bdeef548f3249eaad3bd56c0b47d95d881a790217`, 114269 bytes.
- Dewey FOUND: Eusebius Caesariensis, *De laudibus Constantini* (`FD3FF75A9E3243A4B864B42DA97BCC75`, CPG-3498, BHG-361z), "Oration in Praise of Constantine". sha256 `49b90921d300c94d7d2c5300119115c4a47f8289431e80b7a5ddf0454a05340c`, 166878 bytes.
- Dewey FOUND: Eusebius Caesariensis, *De martyribus Palaestinae* (`A52F6CCD2C574571B5ECF856B4383E9D`, CPG-3490, BHG-1193), "The Martyrs of Palestine". sha256 `d4bc3ce665905e1a22cd474499fe4dc14c0dfabbdee1faffa0324cbf11819841`, 90396 bytes.
- Dewey FOUND: Gregorius Nazianzenus, *Apologeticus pro fuga sua* (`FA1860C60A8B4DDFBFB197327CF153E7`, BHL-3666t), "Oration II. In Defence of His Flight to Pontus". sha256 `a9bd4095d78d4006703518845eb99745e655265d939a1249d93f30c171a16c17`, 123403 bytes.
- Dewey FOUND: Eusebius Caesariensis, *Praeparatio euangelica* (`F61A9F25FEA242218C768ED8BDB1927A`, CPG-3486), "Preparation for the Gospel (Praeparatio Evangelica)". sha256 `d29872d8c1da25f35624f2a93ac57af3665d7282c95907125034f91ea099cf19`, 1875216 bytes.
- Dewey FOUND: Eusebius Caesariensis, *Demonstratio euangelica* (`9D52EDC1A40C448694B3DA344628C442`, CPG-3487), "The Proof of the Gospel (Demonstratio Evangelica)". sha256 `1278d3d363e740a8e09d845c503729009af8cb57dddd26febb87524ed81b2acf`, 1027488 bytes.
- Dewey FOUND: Gregorius Nyssenus, *De opificio hominis* (`0859C0FC73A6458F90C81E74A013B0A0`, CPG-3154), "On the Making of Man". sha256 `2a4b3bfd6dcf6f5d30252360ffe91ce068b3519cbc7e52042a5174bfb20d22ba`, 217980 bytes.
- Dewey FOUND: Gregorius Nyssenus, *Dialogus de anima et resurrectione* (`EACC5779D7264A28AE2620484A55F55E`, CPG-3149), "On the Soul and the Resurrection". sha256 `2c0224b5a2cc6b919bcc1804319b8c5d6104b9681745a971371e6c0c15f2054f`, 240696 bytes.
- Dewey FOUND: Gregorius Nyssenus, *Oratio catechetica magna* (`31F34E757644436CBF7CCB5C9D6FA343`, CPG-3150), "The Great Catechism". sha256 `b60399b19708617a8ae2a1fcdabccd0ccabc33d5ce4a9cb2d3247636f0d7763c`, 250834 bytes.
- Dewey FOUND: Hippolytus Romanus, *De Christo et Antichristo* (`DEBCD85163E24E65AB7C88ADE4617167`, BHG-812zb, CPG-1872), "Treatise on Christ and Antichrist". sha256 `7ec90bba7af878a1c9b43ffb3bb44d86b33c7c41019cf5e26aeded258311dc7e`, 83372 bytes.
- Dewey FOUND: Hippolytus Romanus, *Demonstratio aduersus Iudaeos* (`CF819A315C2D4B5385F6AD6F00DE4C42`, CPG-1914), "Expository Treatise Against the Jews". sha256 `a4bf2d0f17534ff6d3dbfb5bcc9837469257ffcebe55900de19c716d493b98f8`, 10455 bytes.
- Dewey FOUND: Hippolytus Romanus, *Contra Noetum* (`C9BD5522D88F42DCAB06472370E5254C`, CPG-1902), "Against the Heresy of One Noetus". sha256 `fa4d56d05101766f6e36e09b4cf35f80d8a77d722a720d554f3f03af850f40c3`, 45516 bytes.
- Dewey FOUND: Gregorius Nazianzenus, *Oratio de se ipso in concilio Constantinopolitano 150 episcoporum (λόγος συντακτήριος)* (`6952B2B123924032B8A92206A1FBF705`, CPG-3010.42, BHG-730b), "Oration XLII. The Last Farewell". sha256 `0ad79025d1c7c336bc90a34551918a1671297af73073969819267646107ede45`, 48237 bytes.
- Dewey FOUND: Canon Muratorianus, *Canon* (`BCB3D83838024D2C8E3B811E90CDD305`, CPG-1862), "Canon Muratorianus (Muratorian Fragment)". sha256 `ad68e274aba1f399eacfafcb7dc57d6d5f8aa82f34b724a759b3ce66140b009d`, 7188 bytes.
- Dewey FOUND: Clemens Romanus papa martyr Chersonae, *Epistula altera ad Corinthios* (`A2EE8AE7D5D64EE5856748C90FF7912F`, CPG-1003), "The Second Epistle of Clement". sha256 `3295790d05baee15371acb09ec030260a08e6212791631144814760a8aa02122`, 23369 bytes.
- Dewey FOUND: Clemens Romanus papa martyr Chersonae, *Homiliae XX* (`68137849291C4219B882D8A4A35CA032`, CANT-209.4, CPG-1015.4), "The Clementine Homilies (Twenty Homilies)". sha256 `beadf69451abc5c7564b5222478e000f5cc082fcfd0cd70eaee5d310de8584eb`, 630934 bytes.
- Dewey FOUND: Iohannes Chrysostomus, *Ad populum Antiochenum homiliae 1-21 (De statuis)* (`1300AF5DFA5B46CB9ACEC80C4F6F931B`, CPG-4330), "Homilies on the Statues (Twenty-One Homilies to the People of Antioch)". sha256 `666855cd4b33cfdafce4bcee9ad8b9a526c2ff987d31c8150c8f0c42795ce1ce`, 908088 bytes.
- Dewey FOUND: Iohannes Chrysostomus, *In Acta apostolorum homiliae 1-55* (`327F7B993C2A47CDB2AB1B6119609ED9`, CPG-4426), "Homilies on the Acts of the Apostles". sha256 `d797bb6973abffc3b2e88dc098f8ff453d4342f0befea13718f1888daf1f5ea9`, 1931090 bytes.
- Dewey FOUND: Iohannes Chrysostomus, *In epistulam ad Romanos homiliae 1-32* (`1FB848D7823A41468F7AF32AD34454D2`, CPG-4427), "Homilies on the Epistle to the Romans". sha256 `aa30a7c8db1ef65cff357a7c49e5240c6a485597bde5aefc55a63109ec06950b`, 1233697 bytes.
- Dewey FOUND: Iohannes Chrysostomus, *In epistulam I ad Corinthios argumentum et homiliae 1-44* (`F3DF6F14EAF74E5C97884F9FB9FC53A6`, CPG-4428), "Homilies on First Corinthians". sha256 `aab24b1fe568aefd761d4e60307554c4d032fe292f4eed5dcf4a3472acae9d6b`, 1406839 bytes.
- Dewey FOUND: Iohannes Chrysostomus, *In epistulam II ad Corinthios argumentum et homiliae 1-30* (`14F29CE90FB44FCBA5FE7880B81C92B3`, CPG-4429), "Homilies on Second Corinthians". sha256 `1b14d179793802793b3a99bfbdd38a94c88befc3999e840f4350b394a1841511`, 842035 bytes.
- Dewey FOUND: Iohannes Chrysostomus, *In epistulam ad Galatas commentarius* (`F880A19600AF4F9A89A9B2B5B9CDE701`, CPG-4430), "Commentary on Galatians". sha256 `466078b0891d6ee956337bbbccf294fb66d4883bd86f4286cd1adc53ce879f66`, 263706 bytes.
- Dewey FOUND: Iohannes Chrysostomus, *In epistulam ad Ephesios argumentum et homiliae 1-24* (`D028011E5CA548C4A496362814D8E8AB`, CPG-4431), "Homilies on the Epistle to the Ephesians". sha256 `1ad0e77393e379027a761230af1413d21db3028b8ad2de1c1891ef878c0eec9a`, 682642 bytes.
- Dewey FOUND: Iohannes Chrysostomus, *In epistulam ad Philippenses argumentum et homiliae 1-15* (`1C9F6BF8B4594FEDBA513DF539774EC0`, CPG-4432), "Homilies on the Epistle to the Philippians". sha256 `b7dffaed22b9a5a6363c736669fd6e9c4ec9f10af449cb7de1d47145ff8c4d8e`, 397420 bytes.
- Dewey FOUND: Iohannes Chrysostomus, *In epistulam ad Colossenses homiliae 1-12* (`F3F27057D27E4F448FC9F9854DB73E98`, CPG-4433), "Homilies on the Epistle to the Colossians". sha256 `3d4289624455dfb905f2013e48907dbdcdc2d53f0fcf9609f912417cddce1268`, 345352 bytes.
- Dewey FOUND: Iohannes Chrysostomus, *In epistulam I ad Thessalonicenses homiliae 1-11* (`D1F4B50EF29E44E6A461488A45D3E869`, CPG-4434), "Homilies on First Thessalonians". sha256 `b6f5720eb34fac319cdbd422008a1b0aa4220281daf660c7f600f9f551a4d1f9`, 272776 bytes.
- Dewey FOUND: Iohannes Chrysostomus, *In epistulam II ad Thessalonicenses homiliae 1-5* (`5F05C2E7C3D34778AFBEDBDC8C8D0B86`, CPG-4435), "Homilies on Second Thessalonians". sha256 `92d6b1fca4ea4d6f31fc62ce2c9f1388c67ea2ad004aef837b49a0b42a81b853`, 114892 bytes.
- Dewey FOUND: Iohannes Chrysostomus, *In epistulam I ad Timotheum argumentum et homiliae 1-18* (`0784BEBF8DCE462982A727E64D937845`, CPG-4436), "Homilies on First Timothy". sha256 `10fe8996d44d25a3ede20baaed3a316841720147d334db7202cbfecfb937ca23`, 339320 bytes.
- Dewey FOUND: Iohannes Chrysostomus, *In epistulam II ad Timotheum homiliae 1-10* (`E228B94D11344A539C1267AF0A4C165B`, CPG-4437), "Homilies on Second Timothy". sha256 `b2a5e04c1cf0eab7b0cb0689542675cd78bfe0ac28d43e7beeab9a475c6ba1ac`, 225393 bytes.
- Dewey FOUND: Iohannes Chrysostomus, *In epistulam ad Titum homiliae 1-6* (`3EAFEE13AC9B4177994C4771C01ECA26`, CPG-4438), "Homilies on the Epistle to Titus". sha256 `38e42cc8f5115bcb2370f4a8ac99e0f824b7a8abb57ac77957b967a9565692c7`, 133581 bytes.
- Dewey FOUND: Iohannes Chrysostomus, *In epistulam ad Philemonem argumentum et homiliae 1-3* (`388A7F36CC5047AABEF557D4E2C69B84`, CPG-4439), "Homilies on the Epistle to Philemon". sha256 `e2c89519cd57aa0e83aff188c449972a0a92c6e6e2f1ad98d23282d732f679e3`, 212406 bytes.
- Dewey FOUND: Iohannes Chrysostomus, *In Iohannem homiliae 1-88* (`370AE58AF79A4529A28BAF8B0A381FB9`, CPG-4425), "Homilies on the Gospel of St. John". sha256 `7bb8fa08ef2cec2598977b457435f1a529229fc6e0473cd84ca08ff27f7a23dd`, 1787824 bytes.
- Dewey FOUND: Iohannes Chrysostomus, *In epistulam ad Hebraeos argumentum et homiliae 1-34* (`AA73F7138E1E483CA6C44D8651B286E6`, CPG-4440), "Homilies on the Epistle to the Hebrews". sha256 `d9a1fe1add011f291c67004ab388f891ecc5defc625dfd1dadb3f9cba3b1c790`, 986787 bytes.
- Dewey FOUND: Evagrius Scholasticus, *Historia ecclesiastica* (`DE53E74B7D5C4C18AC862D03AB5B1B1F`, CPG-7500), "The Ecclesiastical History of Evagrius Scholasticus". sha256 `2db776721a1bdd162a51c43a3c15a6aee6c9d48dd75493f786c6b90e825b31f0`, 421105 bytes.
- Dewey FOUND: Gregorius Nazianzenus, *Oratio post consecrationem ad episcopatum Sasimorum seu apologeticus minor* (`0AA01FF61D9A4C37BA7DFDB736BB28F8`, CPG-3010.9, BHG-730u), "Oration I. On Easter and His Reluctance (Apologeticus minor / post consecrationem)". sha256 `88e513db40335a65b742980df113ec24d6f1a73c12def2144e9c0a787df663c1`, 7165 bytes.
- Dewey FOUND: Cosmas Indicopleustes, *Topographia christiana* (`93A4505862584B4BAAEB813BCD7B77FA`, CPG-7468), "The Christian Topography of Cosmas Indicopleustes". sha256 `a4bce61729aa21c576a9063a8720219e1f78cc83760345d9b0bfdb53884a27c9`, 785548 bytes.
- Dewey FOUND: Cyprianus episcopus Carthaginensis, *Sententiae episcoporum numero lxxxvii de haereticis baptizandis* (`0C7688AA0C7B4A68B8FEF8C1115F06DC`, CPL-56), "The Seventh Council of Carthage under Cyprian (Sententiae of Eighty-Seven Bishops on Baptizing Heretics)". sha256 `def32a025f0ca5a91defdc9c0e66d9fcf3964ecfb501fa5cf1a741f9c01f80b6`, 41510 bytes.
- Dewey FOUND: Cyprianus episcopus Carthaginensis, *De rebaptismate* (`936323F7125943B087045310963BFA85`, CPL-59, CPPM2-548), "A Treatise on Re-Baptism by an Anonymous Writer". sha256 `c621a229cdba48e665613d86a29b836932fe6f40dbbc38a5c2f0eb2838a9f698`, 59792 bytes.
- Dewey FOUND: Cyrillus Alexandrinus, *Cyrilli libri V contra Nestorium* (`9DA20CB916DE4331A0832DCC79234E13`, CPG-5217, CPG-8647), "Five Tomes Against Nestorius". sha256 `3b9b579ebf7b57d1c9bd89518d15c1d269edef801d2d5d2959a507fe6a77caaa`, 430382 bytes.
- Dewey FOUND: Cyrillus Alexandrinus, *Liber contra Synousiastas* (`44754F76E72D4DB1A9AD4A4901059637`, CPG-5230), "Against the Synousiasts". sha256 `fe7e9f113065837ae7faa367e40177f2c17f0b482c4a1fe30937af320d9305e0`, 34585 bytes.
- Dewey FOUND: Cyrillus Alexandrinus, *Quod unus sit Christus* (`F93D2B0B10A34A31B1D8B812C175A687`, CPG-5228), "That Christ is One (Quod unus sit Christus)". sha256 `0ee12ec28f530f10afac67b682fc9f2659f23623631cafc355551228902a93fb`, 199483 bytes.
- Dewey FOUND: Cyrillus Alexandrinus, *Scholia de incarnatione unigeniti.* (`C88F5CBAE1A44A78860598F2FC83AAE2`, CPG-5225), "Scholia on the Incarnation of the Only-Begotten". sha256 `beea094ca1926de91ec240ab394f0dab5c6230cfd0253f6a281b8446184a5c4b`, 124765 bytes.
- Dewey FOUND: Dionysius Alexandrinus, *Epistula (festalis) ad Alexandrinos* (`269FE18E204F4A8C8B35545834252FDC`, CPG-1565), "Epistle XII. To the Alexandrians". sha256 `3c87bad910dbf7ce2ba2194dd88dc30490c4897032d13d39d903abaa84a13848`, 7084 bytes.
- Dewey FOUND: Dionysius Alexandrinus, *Epistula (festalis) ad Hermammonem* (`AC99900AC42645EFB758CE387593A438`, CPG-1564), "Epistle XI. To Hermammon". sha256 `2803a551ac9453c04ae45b2a340c6ffc06fe9baa7d261b80146f4e1acd987057`, 12196 bytes.
- Dewey FOUND: Dionysius Alexandrinus, *Epistula ad Basilidem* (`C80180A0177B45C696256BA15DF615E5`, CPG-1569), "Epistle to Bishop Basilides". sha256 `08b7783626a449fca3bfa973f9bfbe3af4486cc1f1454ddd0cc6cc3b9e39a44e`, 12474 bytes.
- Dewey FOUND: Dionysius Alexandrinus, *Epistula ad Dionysium Romanum* (`50EE42F8775448BD93BEDBB2AC56DE0E`, CPG-1558), "Epistle to Dionysius, Bishop of Rome". sha256 `d65b9cc21d5809fa36ef5fd7bd37b1d60a10c1ab1dac619704fca90f10f8b984`, 12897 bytes.
- Dewey FOUND: Dionysius Alexandrinus, *Epistula ad Dometium et Didymum* (`545EF29923B34C95BB5B62D6120CE97C`, CPG-1563), "Epistle I. To Domitius and Didymus". sha256 `79eb243b4622ab87edac14052220dd1554bf7246b09b3acdc5a5ffe75441ab5b`, 6084 bytes.
- Dewey FOUND: Dionysius Alexandrinus, *Epistula ad Fabium Antiochenum* (`6BA12DF39D0C46E9973C7F54F0CE8D80`, CPG-1550), "Epistle III. To Fabius, Bishop of Antioch". sha256 `698b079119b57a5bdea5bf408b9e233ac15b37e7a3c417fa47444b8671752d51`, 26276 bytes.
- Dewey FOUND: Dionysius Alexandrinus, *Epistula ad Germanum* (`5943013371B540308A66520EE0A9DF57`, CPG-1551), "Epistle X. Against Bishop Germanus". sha256 `b3aaa3fcea432ac696954f5c23c4c6fcad7d89ab8dc878cfa95758f40b3c148b`, 17297 bytes.
- Dewey FOUND: Dionysius Alexandrinus, *Epistula ad Nouatianum* (`8FA027E00F354EE780830D9E29086256`, CPG-1552), "Epistle II. To Novatus (Novatian)". sha256 `7acdd0fff3489f2c5f28f3aefe8304663ba2f4088370704e85a84d20a0375953`, 2260 bytes.
- Dewey FOUND: Dionysius Alexandrinus, *Epistula ad Philemonem presbyterum Romanum* (`1117A865C9C74795905515EA0B87BEB8`, CPG-1557), "Epistle VII. To Philemon, a Presbyter". sha256 `76e6f9765b2742fd539d116457736268c5507c4f67908215b9e5f1978b6a2ee7`, 2990 bytes.
- Dewey FOUND: Dionysius Alexandrinus, *Epistula ad Sixtum Romanum* (`8EF504107A6B49D5A2C7B0D933932024`, CPG-1611), "Epistle VI. To Sixtus, Bishop of Rome". sha256 `10b0aec18b83ea04aab2ab2835f5049d682448c11396cb7fcd19ec3beb42b110`, 1950 bytes.
- Dewey FOUND: Dionysius Alexandrinus, *Epistula ad Stephanum Romanum* (`FC6143D97C4E4CE68E39D733DAB4061D`, CPG-1554), "Epistle V. To Stephen, Bishop of Rome (On Baptism)". sha256 `b4512b6fe27fd613993991ea896550c78c1fe6944b32e7e5b6c2895c4ce7ab74`, 5211 bytes.
- Dewey FOUND: Dionysius Alexandrinus, *Epistula ad Xistum (Sixtum II) Romanum* (`EFA81D7852C04DEDB0355FCB9D800263`, CPG-1556), "Epistle IX. To Sixtus II". sha256 `7d0030382cf2757cfdf25f9cd6d8ef32868cf8ec9573375c222019345ef0e3cd`, 2183 bytes.
- Dewey FOUND: Dionysius Alexandrinus, *Epistula festalis ad Hieracem* (`B73079F37C9E44BC8EA5537537F4AA11`, CPG-1566), "Epistle XIII. To Hierax, a Bishop in Egypt". sha256 `d4d50a944fb99555cd99767de8d9bfade454bf54e786ef4f270479a8282299eb`, 4721 bytes.
- Dewey FOUND: Eusebius Caesariensis, *Theophania* (`4E20EF5A1D3F4894938D735E0F2BE810`, CPG-3488), "The Theophania (Divine Manifestation) of Eusebius". sha256 `fc5e03769701d36cd8d5d196b2bd63b50424f172807e2602cf097886ded8e1e0`, 702545 bytes.
- Dewey FOUND: Methodius Olympius, *De libero arbitrio* (`25CA749A2B1F4C00AA4984C66FDEA810`, CPG-1811), "Concerning Free-Will". sha256 `ee28f438e7a104c1dc60972dfcbd33c20bc06969661230bd600ab6054ea7a057`, 37907 bytes.
- Dewey FOUND: Eugippius abbas, *Commemoratorium de uita Sancti Seuerini cum epistulis amoebaeis Eugippii et Paschasii diaconi* (`161926EE9AF54FC89BC0B2FDD2EBD5E3`, CPL-678, BHL-7655, BHL-7656, BHL-7657), "The Life of St. Severinus". sha256 `fc669f747481d11bbe0fc8d1da3ed7fd0954439ce7c35646781ce212f0a810ca`, 157702 bytes.
- Dewey FOUND: Eusebius Caesariensis, *Contra Hieroclem* (`162BDDB115E04CC6ABD2889194583274`, CPG-3485), "Against Hierocles". sha256 `718228cdaf7aa7c17e471aaf8e2c912db79584ef734bf9cd5aaca490720d9cf5`, 96691 bytes.
- Dewey FOUND: Gregorius Nyssenus, *De uirginitate* (`3A412CD85B6C40919973BE9057FA131B`, CPG-3165), "On Virginity". sha256 `b479c923c843b533d8d73b2b42d2c10cacef441f1694d4796b17ccfe3d0dc5ac`, 155816 bytes.
- Dewey FOUND: Gregorius Nyssenus, *In diem luminum* (`E7ED39666E20450AB37D07C8DD4AD0E5`, BHG-1934, CPG-3173), "On the Baptism of Christ (In diem luminum)". sha256 `471d09f191097e055c0a3542463f043c2d530fad9bab6811de1747147aea5eed`, 36641 bytes.
- Dewey FOUND: Gregorius Nyssenus, *Oratio funebris in Meletium episcopum* (`4070CFFFF97949C3A3EE3C2D11355265`, CPG-3180, NBHG-Meletius Anti 1, BHG-1243, BHG-1243b), "Funeral Oration on Meletius". sha256 `61469b719b792bcaaeb00500447ca30b935b5bbf1f74c0102496ffb3cfa5c457`, 28790 bytes.
- Dewey FOUND: Gregorius episcopus Neocaesariensis thaumaturgus, *De fide capitula duodecim (Liber de Dei Verbi incarnatione)* (`504F5E8FF22540219ECE1BA9B7AFEAB4`, CPG-1772), "A Sectional Confession of Faith". sha256 `df96c448e04df042120afad959620ac1ebe3eb88d0bd3e3589eeb770ad2869fc`, 37942 bytes.
- Dewey FOUND: Hippolytus Romanus, *Index apostolorum et discipulorum* (`C853D73DF5E44DB0802ED23E5E6E0ECB`, CPG-1911, BHG-153a, BHG-153b), "On the Seventy Apostles". sha256 `51f54d06cd3629cac935d96267793b0b93540763bd939dca973f604b2986cb65`, 14703 bytes.
- Dewey FOUND: Hippolytus Romanus, *Oratio de consummatione mundi et Antichristo et altero Christi adventu* (`B45104619E7048E9BF18E42B3A3FB4C0`, BHG-812z, CPG-1910), "A Discourse on the End of the World, and on Antichrist, and on the Second Coming of Our Lord". sha256 `5040805dba1be6b978514d520bb21e72b05d1ab4122ace5b64a424bd153f7a24`, 65819 bytes.
- Dewey FOUND: Hippolytus Romanus, *Sermo in sancta Theophania* (`0CB230F34E754E2197104128D5DA7657`, BHG-1940, CPG-1917), "Discourse on the Holy Theophany". sha256 `f1c97696765ac7d79a07633cb370fd9fa0dfb1bf325e07c57a4dc42f4a9a76cb`, 16840 bytes.
- Dewey FOUND: Iohannes Chrysostomus, *Ad illuminandos catecheses 1-2* (`4C1757AD1A594469808D076673C1FBCF`, CPG-4331), "Instructions to Catechumens (First and Second)". sha256 `28b495220aaabb8b768848cf6c04c7d0fbef8f1c7520fa938e659cf9d0f22f34`, 63774 bytes.
- Dewey FOUND: Iohannes Chrysostomus, *De Christi precibus* (`A326058D3F874AFD8E7099A092E1AF95`, CPG-4323), "Homily on Matt. xxvi. 19 (“Father if it be possible…”) and against Marcionists and Manichæans". sha256 `294ce6f0caa26604702c9df2c1b4c6ac6e3029fb3719a190cadb40449c30d46d`, 31321 bytes.
- Dewey FOUND: Iohannes Chrysostomus, *De diabolo tentatore homiliae 1-3* (`20DFB5397DD34C2BAF88CAB710E91379`, CPG-4332, BHG-939q, BHG-939r, BHG-939s), "Three Homilies Concerning the Power of Demons". sha256 `03964b8034b487b4bfa698c6eb9a714b3945679c29e48b9e47ebe4aa0aeff8f9`, 100996 bytes.
- Dewey FOUND: Iohannes Chrysostomus, *De profectu euangelii* (`9F8F904CCA234681984E119C854342FC`, CPG-4385), "Homily Concerning Lowliness of Mind (Phil. i. 18)". sha256 `2dd5a3e4ac0a76713c2b501f6b9e3483ba7cb9512801c8cbd26f1d0433789028`, 44954 bytes.
- Dewey FOUND: Iohannes Chrysostomus, *Dialogus de vita Iohannis Chrysostomi* (`2285537B145044A0ACC951603F191F8B`, CPG-6037, NBHG-Ioannes Chry 1, BHG-870, BHG-870e, BHG-870f), "Dialogue on the Life of St. John Chrysostom". sha256 `eebbcd6e45b674a6ce16508784007410c218ba80ea1a51f93bc5b728d409c120`, 296024 bytes.
- Dewey FOUND: Iohannes Chrysostomus, *Epistula Iohannis Chrysostomi ad Innocentium papam* (`FD3E42D7895E4DE0B66E4353981B134E`, CPG-4402, CPL-1641.4), "Letter from St. John Chrysostom to Innocent, Bishop of Rome (first letter, Easter 404)". sha256 `634ff5f326ffadc877fe63fd7379a31c6d9d6a05b3beb28b6b151c2682a2cba2`, 15955 bytes.
- Dewey FOUND: Iohannes Chrysostomus, *Epistula Iohannis Chrysostomi ad Innocentium papam* (`04E3176013F84194B93F64D83FD3F907`, CPG-4403, CPL-1641.11), "Letter from St. John Chrysostom to Innocent, Bishop of Rome (second letter, from exile)". sha256 `fc975d8d0831b3d898ce787ee3cb3eacd320a23324e1629a83d8abd3d59d7f80`, 4272 bytes.
- Dewey FOUND: Iohannes Chrysostomus, *Epistula seu libellus "Quod nemo laeditur nisi a seipso"* (`E589B526D82644D98E99BC43CAAB1E33`, CPG-4400, NBHG-Daniel Prop 11, BHG-488d), "No One Can Harm the Man Who Does Not Injure Himself". sha256 `458f2d11e43be669a859503ed26a7384aa77737b03f3eba7dbe4b2d19d54a731`, 72387 bytes.
- Dewey FOUND: Iohannes Chrysostomus, *Homilia de S. Babyla ep. Antiocheno m.* (`E8DF4CCC2D27478CAA8A7F479054E649`, CPG-4347, NBHG-Babylas Anti 3, BHG-207), "Homily on the Holy Martyr Saint Babylas". sha256 `58ecd21eee31134b1d2e417093aef5cb700af8f322c190a993243d74f32c934f`, 15101 bytes.
- Dewey FOUND: Iohannes Chrysostomus, *In Eutropium* (`974E6635A2814A87B2568A6E2A662CE4`, CPG-4392), "Two Homilies on Eutropius". sha256 `b961da5eb7f09cf87180ca6f1a394decae4bb683ecf430e478648cfb778eb575`, 93835 bytes.
- Dewey FOUND: Iohannes Chrysostomus, *In illud: Si esurierit inimicus (Rom. 12, 20)* (`1AC9653AD1CB4F8F894E74C9F1B4028F`, CPG-4375), "Homily to Those Who Had Not Attended the Assembly (Rom. xii. 20)". sha256 `655d69beb0b3f2c313a63dbc32b2f752f4602664be5eef9db8ec32e6d77c02fe`, 48962 bytes.
- Dewey FOUND: Iohannes Chrysostomus, *In paralyticum demissum per tectum* (`3CD66F4D4EC94BEAABC401FC580F8C4D`, CPG-4370), "Homily on the Paralytic Let Down Through the Roof". sha256 `dcaa58d52adfa01a1475a31f0ec9948c92b416d5244f69d9c0600e4ecff818bc`, 50868 bytes.
- Dewey FOUND: Iohannes Chrysostomus, *Peccata fratrum non euulganda* (`75C9E198F70F4D928E0CF4B6F04B9587`, CPG-4389), "Homily Against Publishing the Errors of the Brethren". sha256 `aa2ba13659a0556407ce708093d499fe65cd6119520fdf0ce87bed8af8f52b67`, 37739 bytes.
- Dewey FOUND: Methodius Olympius, *Sermo de Simeone et Anna* (`910FBBACBECD4735AF15D6C719150402`, BHG-1961, CPG-1827), "Oration Concerning Simeon and Anna". sha256 `79a911b89464373c96de408be088fdae8a8ca5ca8cc561b7799f42127b2e7381`, 57063 bytes.
- Dewey FOUND: Methodius Olympius, *Sermo in ramos palmarum* (`DC9BEEC40FA740F78C9ACF8893B4BB68`, CPG-1828), "Oration on the Palms". sha256 `834546f6642836e6b309aaa9ebe4affddbe22e10828dd2d16afc8c98330c3671`, 21680 bytes.

## Formatting English board

The Formatting English board may treat a work as having English only when both are true on `work_texts`:

1. `language = 'english'`
2. `status = 'ready'`

`isEnglishReady` in `server/clavis-api.ts` is that check. `GET /api/clavis/works/:id` and `GET /api/clavis/authors/:id/works` include `english_ready`, computed only from those rows.

A file under `Fathers/English/` does not open the gate. Flat English folders are the legacy corpus. They are not a `work_texts` row and they are not `status = ready`. Draft English stays off the board. `language = original` never satisfies the English gate. `source_path` is provenance, not a substitute for the gate.

## Worker API

Wired from `server/clavis-api.ts` into `server/donate-worker.ts`. Bindings in `wrangler.toml` are comments until the resources exist. Donate, fixes, and the Bible proxy are unchanged.

| Method | Path | Body |
| --- | --- | --- |
| GET | `/api/clavis/authors` | `{ authors: [...] }` |
| GET | `/api/clavis/authors/:id/works` | `{ author, works }` with `texts` and `english_ready` |
| GET | `/api/clavis/works/:id` | `{ work }` |
| GET | `/api/clavis/works/:id/text?language=english` | `text/plain` body from R2. `language` defaults to `english`. |

Missing `CLAVIS_DB`: **503** JSON `{ "error": "Clavis database is not connected. Bind D1 CLAVIS_DB." }`.

Missing `CLAVIS_TEXTS` on the text GET (database is bound, metadata row exists): **501** JSON `{ "error": "Clavis text bucket is not connected. Bind R2 CLAVIS_TEXTS." }`.

## Cache

Ready text GET sets `Cache-Control: public, max-age=86400` plus an `ETag` of `content_sha256`. Draft text GET sets `Cache-Control: private, no-store`. Metadata JSON sets `Cache-Control: public, max-age=300`. Errors are `no-store`.

The browser and Cloudflare cache the Worker response. GitHub Pages does not serve these bodies. D1 is not a body cache.

## Create the Cloudflare resources later

Do not run these as part of a code change. After they succeed, uncomment the matching blocks in `wrangler.toml` and fill `database_id`.

```bash
npx wrangler d1 create patrista-clavis
npx wrangler d1 execute patrista-clavis --remote --file=data/clavis/schema.sql
npx wrangler r2 bucket create patrista-clavis-texts
```

Upload a body to the key stored on the row, for example `clavis/texts/E84EBB53FD524B8F8CD332CC55C805D1/english.txt`. D1 should keep foreign keys enabled (D1 default).

Still out of scope here: rewriting `englishWorks.ts`, moving board labels, and creating the live D1 database or R2 bucket. The English attach above is the first ready tranche, not every file under `Fathers/English/`.
