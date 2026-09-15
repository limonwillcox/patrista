import SwiftUI

struct AboutView: View {
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    Text("Patrista")
                        .font(.pibliaSerif(32, weight: .semibold))
                    Text("A library of the Church Fathers for the phone. English follows Schaff’s NPNF (Pusey for the Confessions). Latin is the Confessiones. The King James Bible is public domain.")
                        .font(.pibliaSerif(18))
                        .foregroundStyle(.secondary)
                    Text("The website at patrista.com is the desk reader. This app is the phone.")
                        .font(.pibliaSerif(18))
                }
                .padding(24)
            }
            .navigationTitle("About")
        }
    }
}
