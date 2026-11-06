# Patrista Works Audit: "Select Works" and "Letters" Split Analysis

**Date:** 2026-09-02
**Purpose:** Identify instances where generic "Select works," "Letters," or combined files need to be split into separate, properly-titled works.

---

## CRITICAL ISSUES

### 1. **ATHANASIUS** ⭐ (HIGH PRIORITY)
**File:** `Fathers/English/Athanasius_English/Select Writings and Letters.txt`

**Current Status:** Single combined file labeled "Select Writings and Letters"

**Works Contained (confirmed):**
1. **Against the Heathen** (Contra Gentes) - Apologetic work
2. **On the Incarnation of the Word** (De Incarnatione) - MAJOR work, one of most important in entire corpus
   - Includes synopsis and three-part structure
3. **Letter on the Subject of Deposition of Arius** - Epistolary
4. Multiple other letters and writings

**Issue:** "On the Incarnation" is monumentally important and buried in a generic "Select Writings" file. This is a flagship work of patristic theology that deserves its own entry.

**Recommendation:** Split into at least:
- `athanasius_incarnation.txt` (or `on-the-incarnation`)
- `athanasius_against-heathen.txt` 
- `athanasius_letters.txt`

---

### 2. **BASIL THE GREAT**
**File:** `Fathers/English/Basil_English/Letters and Select Works.txt`

**Current Status:** Three major works combined in one file

**Works Contained:**
1. **De Spiritu Sancto** (On the Holy Spirit) - Starts line 7251
   - Major theological treatise
2. **The Nine Homilies on the Hexaemeron** (Six Days of Creation)
   - Collection of homilies/sermon-like works
3. **Letters** - Starts line 18509
   - Contains 47+ individual letters (Letter I through Letter XLVII and beyond)
   - Letters are theological and practical correspondence

**Issue:** These are three completely distinct works grouped together. Letters section alone contains dozens of individual epistles that could be references separately.

**Recommendation:** Split into:
- `basil_de-spiritu-sancto.txt` (or `on-the-holy-spirit`)
- `basil_hexaemeron.txt` (or `nine-homilies-creation`)
- `basil_letters.txt`

---

### 3. **GREGORY OF NYSSA**
**File:** `Fathers/English/Gregory_Nyssa_English/Dogmatic Treatises and Select Writings.txt`

**Current Status:** Combined "Dogmatic Treatises and Select Writings"

**Likely Works Contained:**
- Multiple dogmatic treatises (distinct theological works)
- Biographical letters and writings
- Potentially: "On the Soul and Resurrection" (dialogue form with sister)
- Various epistles

**Issue:** Generic grouping hides specific major works

**Recommendation:** Requires detailed analysis of file contents to separate into individual works

---

### 4. **GREGORY OF NAZIANZUS** 
**File:** `Fathers/English/Gregory_Nazianzen_English/Select Orations and Letters.txt`

**Current Status:** Combined "Select Orations and Letters"

**Works Contained:**
- Multiple **Orations** (sermon-like addresses) - should be individually identifiable
- Multiple **Letters** - epistolary collection

**Issue:** Two distinct literary genres combined; orations and letters serve different functions and audiences

**Recommendation:** Split into:
- `gregory_nazianzen_orations.txt` (or `select-orations`)
- `gregory_nazianzen_letters.txt`

---

### 5. **EPHRAIM THE SYRIAN**
**File:** `Fathers/English/Ephraim_English/Nisibene Hymns and Select Works.txt`

**Current Status:** "Nisibene Hymns and Select Works" combined

**Works Contained:**
1. **Nisibene Hymns** - Poetry/hymnographic work
2. **Select Works** - Unspecified additional writings

**Issue:** Hymns are a distinct poetic genre; "Select Works" is too vague

**Recommendation:** Split into:
- `ephraim_nisibene-hymns.txt`
- `ephraim_select-works.txt` (then further break down what specific works are in this)

---

### 6. **HILARY OF POITIERS**
**File:** `Fathers/English/Hilary_English/Select Works.txt`

**Current Status:** Vague "Select Works"

**Issue:** No indication of what specific works are included

**Recommendation:** Examine file to identify specific titles (likely treatises, books, letters) and create separate entries

---

### 7. **AMBROSE OF MILAN** ⚠️
**Files:** 
- `Fathers/English/Ambrose_English/Letters.txt` (separate)
- Multiple other works listed separately (Concerning Virgins, Concerning Widows, On the Duties of the Clergy, Exposition of the Christian Faith)

**Current Status:** PARTIAL - Letters are separated but mixed with other works

**Positive:** Better than some fathers - has individual works broken out (Concerning Virgins, Concerning Widows, etc.)

**Issue:** Still contains "Letters.txt" which may have many individual epistles mixed together

**Recommendation:** 
- Examine Letters.txt to see if individual important letters should be separated
- Consider if any letters are particularly significant and deserve separate entries

---

### 8. **JEROME**
**Files:**
- `Fathers/English/Jerome_English/Letters.txt` (separate collection)
- `Fathers/English/Jerome_English/Select Works (NPNF2 VI remainder).txt`
- Plus: `The Life of Malchus, the Captive Monk.txt` and `The Life of Paulus the First Hermit.txt`

**Current Status:** MIXED - Some works separated, others grouped

**Positive:** Individual biographical works separated out

**Issue:** "Select Works" remainder is vague; Letters.txt may contain many distinct epistles

**Recommendation:**
- Audit "Select Works (NPNF2 VI remainder)" to identify specific titles
- Consider breaking down Letters.txt for particularly important epistles

---

## SECONDARY ISSUES

### 9. **LEO THE GREAT**
**File:** `Fathers/English/Leo_English/Sermons.txt`

**Current Status:** Single "Sermons.txt" file

**Issue:** Contains many sermons (homilies) - these may be individually referenced

**Recommendation:** May be acceptable if kept as sermon collection, but verify if individual sermons should be separately identifiable

---

## SUMMARY BY SEVERITY

### 🔴 **CRITICAL (Must Fix - Major Works Hidden)**
1. **Athanasius** - "On the Incarnation" is one of Christianity's most important theological works and is buried in "Select Writings"
2. **Basil** - Three entirely distinct works (treatise, homilies, letters) combined
3. **Gregory of Nyssa** - Multiple treatises obscured by generic naming
4. **Gregory of Nazianzus** - Two distinct genres (orations vs letters) combined

### 🟡 **IMPORTANT (Should Fix - Reduces Usability)**
5. **Ephraim** - Distinct literary genres (hymns vs prose) combined
6. **Hilary** - Vague "Select Works" hides specific titles
7. **Jerome** - Partially done; "Select Works remainder" needs clarification
8. **Ambrose** - Partially done; needs audit of remaining combined files

### 🟢 **MINOR (Monitor)**
9. **Leo the Great** - Check if sermon collection should remain unified or be indexed individually

---

## IMPLEMENTATION NOTES

When splitting files:
1. Preserve the metadata headers (`# source:`, `# series:`, `# volume:`, etc.)
2. Update `# work:` field with specific work title
3. Maintain all footnote references and cross-links
4. Update the `SPEC_OVERRIDES` in `server/englishWorks.ts` if chunk modes need adjustment
5. Run `discoverEnglishWorkSpecs()` to verify discovery still works
6. Test that new work IDs don't collide with existing ones

---

## ACTION ITEMS

- [ ] **Priority 1:** Split Athanasius file - especially extract "On the Incarnation"
- [ ] **Priority 2:** Split Basil file into three works
- [ ] **Priority 3:** Split Gregory of Nazianzus (orations vs letters)
- [ ] **Priority 4:** Audit and split Gregory of Nyssa
- [ ] **Priority 5:** Split/clarify Ephraim, Hilary, Jerome "Select Works"
