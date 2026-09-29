# PibliaIOS audit

Date: 2026-09-29. Read-only. Nothing under `PibliaIOS/` was moved, edited, or deleted.

This folder is a hand-written SwiftUI skeleton for an iPhone reader. It is not the phone app going forward. The phone decision is an Expo app in this same repo (`apps/mobile`), built on Windows and tested on a Mac. `PibliaIOS/` cannot join that loop: it is an Xcode project, iOS 17, iPhone only, and it does not compile as checked in.

Recommendation: **archive it**. Do not keep it as a second app. Do not delete it until the two questions at the bottom are answered. The product decisions worth keeping are copied into this file.

## What it contains

```
PibliaIOS/
  README.md
  docs/PLAN.md
  docs/MIGRATION.md
  docs/APP_STORE.md
  Piblia.xcodeproj/project.pbxproj    (only file in the project; no shared .xcscheme)
  Piblia/
    PibliaApp.swift
    RootTabs.swift
    ReadView.swift
    SearchView.swift
    AboutView.swift
    GiveView.swift
    SettingsView.swift
    Models.swift
    Theme.swift
    SampleCorpus.swift
    BibleService.swift                 (on disk, not in the Xcode target)
    Assets.xcassets/                   (accent color + an empty 1024 icon slot, no PNG)
```

No tests, no `Info.plist` (the target generates one), no Swift package, no bundled corpus, no `Piblia/Resources/` folder. `docs/MIGRATION.md` line 17 says Goal 1 should copy Confessions JSON into `Piblia/Resources/`. That folder does not exist.

The project file looks hand-written. Object ids are sequential placeholders (`A10000000000000000000001` and following in `Piblia.xcodeproj/project.pbxproj`). `PibliaIOS/README.md` lines 11–12 tell you to throw the project away and make a new one in Xcode if it misbehaves.

## What the screens do

| Screen | File | Behavior |
| --- | --- | --- |
| App entry | `Piblia/PibliaApp.swift` 4–9 | `RootTabs()`, burgundy tint |
| Tabs | `Piblia/RootTabs.swift` 7–18 | Read, Search, About, Give, Settings |
| Focus hides the tab bar | `Piblia/RootTabs.swift` 19 | `.toolbar(focus ? .hidden : .visible, for: .tabBar)` |
| Reader | `Piblia/ReadView.swift` | One work: Augustine, Confessions. Numbered paragraphs. Liber sheet. Chi-Rho toggles Latin. Bookmark. Focus hides the leading chrome |
| Search | `Piblia/SearchView.swift` 6–9 | `ContentUnavailableView`: "Search waits on Goal 4" |
| Give | `Piblia/GiveView.swift` 6–9 | `ContentUnavailableView`: donation link not set |
| About | `Piblia/AboutView.swift` 8–14 | Static "Patrista" blurb. Credits Pusey, Confessiones, KJV |
| Settings | `Piblia/SettingsView.swift` | Latin, focus, translation picker, parallel-source toggles, ESV key field |

Reader data is five English paragraphs and five Latin paragraphs of Confessions Book I (`Piblia/SampleCorpus.swift` 14–33, Pusey and the Latin opening). Libers 2–13 return a placeholder (`SampleCorpus.swift` 35–44). Father and work pills render a chevron but are not buttons (`ReadView.swift` 50–51 calls `pill`, which is not a `Button`). Only the Liber pill opens a sheet (`ReadView.swift` 52–54).

Persisted keys, all `@AppStorage` / `UserDefaults`:

| Key | Where | Meaning |
| --- | --- | --- |
| `fg-latin` | `ReadView.swift` 4, `SettingsView.swift` 4 | Chi-Rho Latin toggle |
| `fg-focus` | `ReadView.swift` 5, `RootTabs.swift` 4 | Focus mode |
| `fg-liber` | `ReadView.swift` 6 | Last Liber, default 1 |
| `fg-bookmarks` | `ReadView.swift` 7, 131–135 | Comma-separated Liber numbers |
| `englishOn`, `latinOn`, `bibleOn`, `notesOn` | `SettingsView.swift` 6–9 | Parallel sources. Nothing reads them except the form |
| `bibleTranslation` | `SettingsView.swift` 11 | `KJV`, `ESV`, or `WEB` |
| `esv_api_key` | `SettingsView.swift` 12, `BibleService.swift` 43–45 | User-typed Crossway token, stored on device |

## Build settings

From `Piblia.xcodeproj/project.pbxproj`:

- iOS deployment target 17.0 (lines 183 and 204).
- iPhone only: `TARGETED_DEVICE_FAMILY = 1` (lines 232 and 258). Portrait plus both landscapes (line 223). No iPad, no Mac Catalyst (`SUPPORTS_MACCATALYST = NO`, line 229).
- Bundle id `com.piblia.app` (line 226). Marketing version 1.0, build 1.
- Display name **Patrista** (`INFOPLIST_KEY_CFBundleDisplayName`, line 219). Product name is still **Piblia** (line 99). Category `public.app-category.books` (line 220).
- `DEVELOPMENT_TEAM` is empty (lines 176, 197, 217). A simulator can run an unsigned debug build. A device install cannot, until someone sets a team.
- Claimed Xcode tools version 15.4 (`LastSwiftUpdateCheck = 1540`, line 110). Swift 5. `CreatedOnToolsVersion = 15.4` (line 115).
- No sources besides the ten Swift files listed at lines 152–161. `BibleService.swift` is not among them.

## What works, on paper

If the missing file were added to the target, the skeleton would be a small SwiftUI app with no third-party dependencies:

- Five tabs, a readable Book I, a 13-row Liber sheet, Latin toggle, focus mode, per-Liber bookmarks.
- Those four reader behaviors are implemented, not just described (`ReadView.swift` 46–135, `RootTabs.swift` 19).
- Settings stores parallel preferences for a screen that was never written.

This audit did not compile it. This machine is Windows and has no Xcode. `PibliaIOS/README.md` lines 13–14 say the same thing: it will not build off a Mac, and there is no Simulator here.

## What does not work

1. **The checked-in project does not compile.** `SettingsView.swift` lines 11, 14–15, 27–31, and 33–39 use `BibleTranslation`. Line 56 uses `ESVBibleService.copyrightNotice`. Both types live only in `BibleService.swift`. That file is not in `PBXFileReference`, `PBXBuildFile`, the Piblia group, or `PBXSourcesBuildPhase` (`project.pbxproj` lines 9–35 and 148–163). A clean Xcode build fails on unresolved identifiers before any screen opens.

2. **Even after that fix, Bible text never reaches the reader.** `ESVBibleService` (`BibleService.swift` 34–108) is an actor with an in-memory LRU cache capped at 450 entries. Nothing calls `fetchPassage`. `ReadView` only reads `SampleCorpus`. KJV and WEB are enum cases (`BibleService.swift` 3–6) with `isOfflineSupported == true` (lines 18–23) and no JSON, no loader, and no files under `Piblia/`.

3. **Search, Give, parallel, notes, and highlights are absent.** Search and Give are placeholder views. Parallel toggles have a footer that says "Used in Goal 3" (`SettingsView.swift` 51). There is no second pane, no notes editor, no highlight model. `PaneSource` (`Models.swift` 29–40) is unused by every view.

4. **No icon.** `Assets.xcassets/AppIcon.appiconset/Contents.json` declares a 1024 slot and gives it no `filename`. Accent color is set (`AccentColor.colorset/Contents.json`, burgundy). App Store notes require a 1024 PNG with no alpha (`docs/APP_STORE.md` lines 9–10). That file is not in the tree.

5. **No signing, no tests, no scheme, no device proof in the repo.** Empty development team. No test target. No shared scheme. Nothing in this audit can show it ever launched on a phone.

6. **The ESV key field is the wrong shape to copy.** `SettingsView.swift` 33–34 puts a Crossway token in `UserDefaults`. `BibleService.swift` 74–78 sends it as `Authorization: Token …`, or as `Token ` with an empty secret when the field is blank. The site is moving Bible keys behind the Worker so they never ship in a client. An app text field reintroduces that.

## Ideas worth keeping

These are decisions and interaction details. They are not Swift to transpile.

**Reader chrome, from code that actually exists**

- Top bar is Father, work, then section. Translator stays off the bar (`docs/PLAN.md` lines 20–21; `AboutView.swift` 10 names Pusey in the body, not the chrome).
- Chi-Rho means "show the original." One button, persisted (`ReadView.swift` 55–62).
- Focus is a cross that fills when on, hides the tab bar and the identity pills, and leaves bookmark plus the cross (`ReadView.swift` 66–82, `RootTabs.swift` 19).
- Section list is a medium/large sheet. Current row gets a check. Bookmarked rows get a 7pt burgundy dot (`ReadView.swift` 85–111).
- Paragraphs are numbered, serif, ~19pt, line spacing 6 (`ReadView.swift` 30–38).
- Colors: burgundy `rgb(0.58, 0.13, 0.02)`, gold, wood (`Theme.swift` 4–7). Serif is the system serif, not a bundled font (`Theme.swift` 11–13).

**Written rules that Swift never implemented**

- Parallel is landscape only. Each side cycles, and skips whatever the other side is showing. Panes: English, Latin, Bible (KJV), Notes (`docs/PLAN.md` lines 15–17; `docs/MIGRATION.md` lines 10–11).
- Highlights: yellow, green, blue, pink (`docs/PLAN.md` line 19). The archived web shell is the spec for this, not the Swift folder. `docs/MIGRATION.md` line 14 points highlights at `fg-hl-*` and says they are Goal 2 or later.
- Ship a thin reader before parallel or search. Plan order is 1 → 2 → 5 → 3 → 4 (`docs/PLAN.md` lines 27–45): Confessions English, then Latin, then a store listing, then parallel, then library search.
- Bookmarks and focus stay on device. No account in v1 (`docs/APP_STORE.md` line 8, `docs/PLAN.md` lines 52–53).
- Credits line to reuse almost as-is: Pusey 1838 public domain, Latin Confessiones, KJV public domain, not affiliated with YouVersion or Bible Gateway (`SettingsView.swift` 60–61).

**Do not treat the Swift information architecture as the Expo IA.** `PibliaIOS` is Fathers-first: open Confessions, Bible is a future side pane. The phone brief is scripture-first: read a chapter, tap a verse, see the Fathers. Keep the chrome habits. Do not copy the five tabs (Read, Search, About, Give, Settings) onto the new app without a decision. The Expo shell question is a different set: Bible, Fathers, Search, Saved, or a single reader.

**The richer spec is already archived.** `archive/ios-web/` is the browser phone shell this Swift folder was copying (`PibliaIOS/README.md` line 3, `archive/ios-web/README.md` lines 1–5, `docs/MIGRATION.md` lines 1–16). It has the tab shell, Chi-Rho, focus, Liber sheet, and the L/R parallel cycle in `archive/ios-web/js/ios.js` and `archive/ios-web/js/parallel.js`. `docs/FEATURES.md` lines 9–34 (author globe, life path, world-events timeline) is explicitly not a current goal (`docs/PLAN.md` lines 8–9). Leave it parked.

**App Store checklist, with the names updated later.** `docs/APP_STORE.md` and `docs/PLAN.md` lines 47–55: Apple Developer Program, 1024 icon, privacy form (on-device only, no tracking), TestFlight, age 4+, support URL `https://patrista.com`, marketing URL `https://patrista.com/get-app.html`. Bundle id in those docs is `com.piblia.app`. The Expo app should not inherit that id until the name question below is answered.

## What still points at this folder

These sentences call `PibliaIOS/` the native app. They are stale once the Expo app exists. This audit did not edit them.

| File | Line | What it says |
| --- | --- | --- |
| `README.md` | 13 | Native SwiftUI app is `PibliaIOS/`, plan in `PibliaIOS/docs/PLAN.md` |
| `docs/FEATURES.md` | 5, 40, 63 | Native app lives here; promote parked ideas into `PibliaIOS/docs/PLAN.md` |
| `archive/README.md` | 11 | "The Swift project is `PibliaIOS/`." |
| `archive/ios-web/README.md` | 3 | "Native app: `PibliaIOS/`." |

`get-app.html` is the public "get the app" page (`README.md` line 13). `docs/APP_STORE.md` lines 12–13 say to paste an App Store URL into it after review. There is no shipped app behind that page.

## Recommendation

**Archive. Do not keep. Do not delete yet.**

Keep would mean two phone codebases. This one cannot be built on the Windows dev machine, the project file omits a source the settings screen needs, and the only real text is five paragraphs.

Delete is reasonable after the questions below, because git history still has the files and this audit has the decisions. Doing it in this pass would skip the only person who might have run it.

When you say yes, the follow-up is one PR that:

1. Moves `PibliaIOS/` to `archive/piblia-ios/` (or deletes it, if you pick delete).
2. Rewrites the four pointers in the table above so they name `apps/mobile` and this audit, not a live Swift app.
3. Leaves `archive/ios-web/` where it is. That folder is the UI spec. It is already marked parked.

No Swift goals from `docs/PLAN.md` should be started.

## Questions

1. Did you ever run `PibliaIOS` on a simulator or a phone? If something in it felt right (focus mode, Chi-Rho, the Liber sheet, the five tabs), say which. The code cannot show that.
2. After this audit, should the folder move to `archive/piblia-ios/`, or be deleted from `main`?
3. Expo navigation is still open (Bible / Fathers / Search / Saved, or one reader). The Swift app hardcoded Read / Search / About / Give / Settings. Which set should the new app use?
4. Bundle id in this project is `com.piblia.app`, and the home screen name is already Patrista. Should the Expo app use `com.patrista.app` instead?
