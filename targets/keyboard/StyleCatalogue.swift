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
    /// Section in the Fonts panel ("Cursive & cute", "Bold & clean"…).
    var group: String? = nil

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
    /// Section in the theme picker ("Colours", "K-pop", "Pride"…).
    var group: String? = nil

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

    static let customPrefix = "custom-"
    static let myStylesGroup = "My styles"

    /// Styles the person made in the app ("My styles"). Letters only; frames stay in the app.
    private(set) var custom: [TextStyle] = []

    private struct CustomPayload: Decodable {
        let id: String
        let name: String?
        let mapping: [String: String]?
    }

    /// Reads the JSON the app saves: [{ id, name, mapping }]. Bad input leaves no custom styles.
    func loadCustom(_ json: String?) {
        ownReverse = [:]
        guard let data = json?.data(using: .utf8),
              let items = try? JSONDecoder().decode([CustomPayload].self, from: data) else {
            custom = []
            return
        }
        custom = items.filter { $0.id.hasPrefix(Self.customPrefix) }.map { item in
            let name = (item.name ?? "").trimmingCharacters(in: .whitespaces)
            return TextStyle(
                id: item.id, name: name.isEmpty ? "My style" : name, category: "Mine", description: "",
                kind: "alphabet", isPro: true, fallback: "preserve", keyboard: true,
                mapping: item.mapping ?? [:], group: Self.myStylesGroup
            )
        }
    }

    func style(id: String) -> TextStyle {
        custom.first { $0.id == id } ?? data.styles.first { $0.id == id } ?? data.styles.first { $0.id == "normal" }!
    }

    func theme(id: String) -> KeyboardPalette {
        data.themes.first { $0.id == id } ?? data.themes[0]
    }

    var keyboardStyles: [TextStyle] {
        custom + data.styles.filter { $0.id != "normal" && $0.worksInKeyboard }
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

    /// One style's own styled → plain map (lower case wins when a letter has both cases).
    private var ownReverse: [String: [String: String]] = [:]
    private func reverse(for styleId: String) -> [String: String] {
        if let cached = ownReverse[styleId] { return cached }
        let style = style(id: styleId)
        var map: [String: String] = [:]
        if style.id == styleId && style.kind != "normal" {
            for (plain, styled) in style.mapping where styled != plain {
                if let existing = map[styled], existing == existing.lowercased() || plain != plain.lowercased() { continue }
                map[styled] = plain
            }
        }
        ownReverse[styleId] = map
        return map
    }

    /// Turns fancy text back into plain letters. Some fonts share symbols (Curvy's "w" is
    /// Upside-down's "m"), so pass the font being typed in as `prefer` and its letters are
    /// read first; anything else falls back to every font.
    func plain(_ input: String, prefer: String? = nil) -> String {
        let own = prefer.map { reverse(for: $0) } ?? [:]
        let lookup = { (key: String) -> String? in own[key] ?? self.reverse[key] }
        // Styled letters may be one or two Characters (e.g. letter + combining mark), so try pairs first.
        let characters = Array(input)
        var output = ""
        var index = 0
        while index < characters.count {
            if index + 1 < characters.count, let hit = lookup(String(characters[index...index + 1])) {
                output += hit
                index += 2
            } else if let hit = lookup(String(characters[index])) {
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
