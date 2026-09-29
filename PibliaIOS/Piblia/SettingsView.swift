import SwiftUI

struct SettingsView: View {
    @AppStorage("fg-latin") private var latin = false
    @AppStorage("fg-focus") private var focus = false
    @AppStorage("englishOn") private var englishOn = true
    @AppStorage("latinOn") private var latinOn = true
    @AppStorage("bibleOn") private var bibleOn = true
    @AppStorage("notesOn") private var notesOn = true

    @AppStorage("bibleTranslation") private var translationRaw = BibleTranslation.kjv.rawValue
    @AppStorage("esv_api_key") private var esvApiKey = ""

    private var selectedTranslation: BibleTranslation {
        BibleTranslation(rawValue: translationRaw) ?? .kjv
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Reading") {
                    Toggle("Latin (Chi-Rho)", isOn: $latin)
                    Toggle("Focus mode", isOn: $focus)
                }
                
                Section("Bible Translation") {
                    Picker("Translation", selection: $translationRaw) {
                        ForEach(BibleTranslation.allCases) { trans in
                            Text(trans.displayName).tag(trans.rawValue)
                        }
                    }
                    
                    if selectedTranslation == .esv {
                        SecureField("ESV API Key (Optional)", text: $esvApiKey)
                        if !selectedTranslation.isOfflineSupported {
                            Text("Note: ESV requires an active internet connection. A maximum of 500 verses are cached locally in compliance with Crossway API guidelines.")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                
                Section {
                    Toggle("English", isOn: $englishOn)
                    Toggle("Latin", isOn: $latinOn)
                    Toggle("Bible (\(selectedTranslation.rawValue))", isOn: $bibleOn)
                    Toggle("Notes", isOn: $notesOn)
                } header: {
                    Text("Parallel sources")
                } footer: {
                    Text("Used in Goal 3. Each half of the screen cycles through what the other half is not showing.")
                }
                
                Section("Credits & Attribution") {
                    if selectedTranslation == .esv {
                        Text(ESVBibleService.copyrightNotice)
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                    Text("English: E. B. Pusey, 1838, public domain. Latin: Confessiones. KJV: public domain. Not affiliated with YouVersion or Bible Gateway.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Settings")
        }
    }
}
