import Foundation

struct TextStyle: Decodable {
    let id: String
    let name: String
    let category: String
    let description: String
    let kind: String
    let isPro: Bool
    let fallback: String
    let mapping: [String: String]
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

    func transform(_ input: String, styleId: String) -> String {
        let selected = style(id: styleId)
        guard selected.kind != "normal" else { return input }
        return input.reduce(into: "") { result, character in
            let key = String(character)
            result.append(selected.mapping[key] ?? key)
        }
    }
}
