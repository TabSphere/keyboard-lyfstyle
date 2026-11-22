import Foundation

struct TextStyle: Decodable {
    let id: String
    let name: String
    let category: String
    let description: String
    let kind: String
    let isPro: Bool
    let fallback: String
    /// Nil or true for per-letter styles; false for app-only composites (frames, joiners).
    let keyboard: Bool?
    let mapping: [String: String]

    var worksInKeyboard: Bool { keyboard ?? true }
}

struct KeyboardPalette: Decodable {
    let id: String
    let name: String
    let background: String
    let key: String
    let text: String
    let secondary: String
    let accent: String
    let dark: Bool
    let isPro: Bool?
    /// Picture themes: image file bundled next to styles.json ("@photo" = the person's own photo).
    let image: String?
    /// Opacity of normal keys over a picture (nil = solid keys).
    let keyAlpha: Double?

    var requiresPro: Bool { isPro ?? false }
}

struct StyleCatalogueData: Decodable {
    let schemaVersion: Int
    let productId: String
    let styles: [TextStyle]
    let decorations: [Decoration]
    let themes: [KeyboardPalette]
}

struct Decoration: Decodable {
    let id: String
    let name: String
    let type: String
    let prefix: String
    let suffix: String
    let isPro: Bool
}

final class StyleCatalogue {
    static let shared = StyleCatalogue()
    let data: StyleCatalogueData

    private init() {
        guard let url = Bundle.main.url(forResource: "styles", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let decoded = try? JSONDecoder().decode(StyleCatalogueData.self, from: data) else {
            fatalError("Lyfstyle keyboard catalogue is missing or invalid")
        }
        self.data = decoded
    }

    init(data: Data) throws {
        self.data = try JSONDecoder().decode(StyleCatalogueData.self, from: data)
    }

    func style(id: String) -> TextStyle {
        data.styles.first { $0.id == id } ?? data.styles.first { $0.id == "normal" }!
    }

    func theme(id: String) -> KeyboardPalette {
        data.themes.first { $0.id == id } ?? data.themes[0]
    }

    var keyboardStyles: [TextStyle] {
        data.styles.filter { $0.id != "normal" && $0.worksInKeyboard }
    }

    /// Styled character → plain letter, across every keyboard style (skips plain ASCII outputs).
    private lazy var reverse: [String: String] = {
        var map: [String: String] = [:]
        for style in data.styles where style.worksInKeyboard && style.kind != "normal" {
            for (plain, styled) in style.mapping where styled != plain && styled.unicodeScalars.contains(where: { $0.value > 127 }) {
                if map[styled] == nil { map[styled] = plain }
            }
        }
        return map
    }()

    /// Turns fancy text back into plain letters (used before translating).
    func plain(_ input: String) -> String {
        // Styled letters may be one or two Characters (e.g. letter + combining mark), so try pairs first.
        let characters = Array(input)
        var output = ""
        var index = 0
        while index < characters.count {
            if index + 1 < characters.count, let hit = reverse[String(characters[index...index + 1])] {
                output += hit
                index += 2
            } else if let hit = reverse[String(characters[index])] {
                output += hit
                index += 1
            } else {
                output.append(characters[index])
                index += 1
            }
        }
        return output
    }

    func transform(_ input: String, styleId: String) -> String {
        let selected = style(id: styleId)
        guard selected.kind != "normal" else { return input }
        return input.reduce(into: "") { result, character in
            let key = String(character)
            result.append(selected.mapping[key] ?? key)
        }
    }
}
