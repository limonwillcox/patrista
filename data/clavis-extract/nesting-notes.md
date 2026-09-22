# Clavis Clavium nesting notes (sample persons)

- Personae aliae list: 1,384 person links (DOM hrefs read without activating them). Each person opens in the same `Details.aspx?id=...` page.
- Person detail structure: `Work` tab active; breadcrumb/link back to `Personae aliae`; person heading; metadata rows (`Original Clavis`, `Century`, and sometimes `Location(s)` / `Function(s)`); then one or more grouped sections labelled `Genuina`, `Vide et`, `Spuria`, etc.
- Each group contains nested work links. The row shows the Latin title and one or more catalogue identifiers at right (e.g. `BHL-4298`, `BHL-273, CPL-2161`). The work href is another same-site `Details.aspx?id=...` link.
- Sample 1: Ricardus de Gerboredus episcopus Ambianensis -> group `Genuina` -> `Translatio faciei Ambianum anno 1206` (`BHL-4298`).
- Sample 2: Pseudo-Passecras -> group `Vide et` -> `Passio` (`BHL-3262x-3383f`).
- Sample 3: Crisentianus -> group `Spuria` -> `Passio Alexandri episcopi Baccanensis` (`BHL-273, CPL-2161`).
- English titles were not displayed on these sample pages, so `titleEnglish` is empty. Authenticity is recorded as `unknown`; group labels were noted above but are not asserted as the requested authenticity field.
