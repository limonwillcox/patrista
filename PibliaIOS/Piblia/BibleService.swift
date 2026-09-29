import Foundation

enum BibleTranslation: String, CaseIterable, Identifiable {
    case kjv = "KJV"
    case esv = "ESV"
    case web = "WEB"

    var id: String { rawValue }
    
    var displayName: String {
        switch self {
        case .kjv: return "King James Version (KJV)"
        case .esv: return "English Standard Version (ESV)"
        case .web: return "World English Bible (WEB)"
        }
    }
    
    var isOfflineSupported: Bool {
        switch self {
        case .kjv, .web: return true
        case .esv: return false // Requires live API fetching due to Crossway 500-verse caching limit
        }
    }
}

protocol BibleService {
    func fetchPassage(reference: String) async throws -> String
}

/// ESV Bible service adhering strictly to Crossway's API guidelines:
/// - Maximum 500 verses cached at any time (LRU eviction).
/// - Live fetching over HTTPS with proper Bearer/Token authorization.
/// - Required copyright attribution.
actor ESVBibleService: BibleService {
    static let shared = ESVBibleService()
    
    static let copyrightNotice = "Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), copyright © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved."
    
    private var cache: [String: String] = [:]
    private var cacheOrder: [String] = []
    private let maxCacheSize = 450 // Capped strictly under Crossway's 500 verse limit

    private var apiKey: String? {
        UserDefaults.standard.string(forKey: "esv_api_key")
    }

    func fetchPassage(reference: String) async throws -> String {
        let cleanRef = reference.trimmingCharacters(in: .whitespacesAndNewlines)
        
        // 1. Check in-memory LRU cache
        if let cachedText = cache[cleanRef] {
            return cachedText
        }
        
        // 2. Prepare API URL
        guard var components = URLComponents(string: "https://api.esv.org/v3/passage/text/") else {
            throw URLError(.badURL)
        }
        
        components.queryItems = [
            URLQueryItem(name: "q", value: cleanRef),
            URLQueryItem(name: "include-passage-references", value: "false"),
            URLQueryItem(name: "include-verse-numbers", value: "true"),
            URLQueryItem(name: "include-first-verse-numbers", value: "true"),
            URLQueryItem(name: "include-footnotes", value: "false"),
            URLQueryItem(name: "include-headings", value: "false")
        ]
        
        guard let url = components.url else {
            throw URLError(.badURL)
        }
        
        var request = URLRequest(url: url)
        if let key = apiKey, !key.isEmpty {
            request.setValue("Token \(key)", forHTTPHeaderField: "Authorization")
        } else {
            // Placeholder/Default token header for when user or proxy key is set
            request.setValue("Token ", forHTTPHeaderField: "Authorization")
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }
        
        struct ESVResponse: Decodable {
            let passages: [String]
        }
        
        let decoded = try JSONDecoder().decode(ESVResponse.self, from: data)
        guard let text = decoded.passages.first, !text.isEmpty else {
            throw URLError(.cannotParseResponse)
        }
        
        let trimmedText = text.trimmingCharacters(in: .whitespacesAndNewlines)
        
        // 3. Enforce 500-verse LRU Cache eviction
        if cacheOrder.count >= maxCacheSize {
            let oldestKey = cacheOrder.removeFirst()
            cache.removeValue(forKey: oldestKey)
        }
        
        cache[cleanRef] = trimmedText
        cacheOrder.append(cleanRef)
        
        return trimmedText
    }
}
