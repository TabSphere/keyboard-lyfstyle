import UIKit

/// Word completions and next-word guesses, worked out on the phone. Same rules as the
/// Android keyboard's WordSuggester.kt. It works on plain letters: the keyboard turns
/// styled text back into plain letters first, and styles the chosen word again.
///
/// It also learns the words (and word pairs) the person types. That stays in the
/// keyboard's own storage and never leaves the phone.
final class WordSuggester {
    struct Result {
        /// The half-typed word the suggestions would replace ("" after a space).
        let partial: String
        let words: [String]
        static let empty = Result(partial: "", words: [])
    }

    private let words: [String]
    private let next: [String: [String]]
    private var learned: [String: Int] = [:]
    private var learnedPairs: [String: Int] = [:]
    private let checker = UITextChecker()
    private static let maxWords = 600
    private static let maxPairs = 800

    init(words: [String], next: [String: [String]]) {
        self.words = words
        self.next = next
    }

    convenience init(json data: Data?) {
        guard let data,
              let root = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            self.init(words: [], next: [:])
            return
        }
        self.init(words: root["words"] as? [String] ?? [], next: root["next"] as? [String: [String]] ?? [:])
    }

    static func isWordChar(_ c: Character) -> Bool { c.isLetter || c == "'" || c == "’" }
    static func key(_ word: String) -> String { String(word.lowercased().filter { $0.isLetter }) }

    /// The letters right before the cursor ("" if the cursor follows a space or symbol).
    static func trailingWord(_ text: String) -> String {
        var start = text.endIndex
        while start > text.startIndex, isWordChar(text[text.index(before: start)]) {
            start = text.index(before: start)
        }
        return String(text[start...])
    }

    /// "Lo" → "Love", "LO" → "LOVE"; list words with their own capitals ("I'm") stay as they are.
    static func matchCase(_ word: String, typed: String) -> String {
        if typed.count > 1, typed.allSatisfy({ !$0.isLetter || $0.isUppercase }) { return word.uppercased() }
        if typed.first?.isUppercase == true { return word.prefix(1).uppercased() + word.dropFirst() }
        return word
    }

    func suggest(_ before: String, limit: Int = 3) -> Result {
        guard !before.isEmpty else { return .empty }
        let partial = Self.trailingWord(before)
        if !partial.isEmpty {
            let typed = Self.key(partial)
            guard !typed.isEmpty else { return .empty }
            let mine = learned.filter { $0.value >= 2 && Self.key($0.key).hasPrefix(typed) }
                .sorted { $0.value > $1.value }.map(\.key)
            let listed = words.filter { Self.key($0).hasPrefix(typed) }
            // Apple's own on-phone dictionary fills in words our list doesn't have.
            let lower = partial.lowercased()
            let apple = (checker.completions(forPartialWordRange: NSRange(location: 0, length: lower.utf16.count), in: lower, language: "en_US") ?? [])
            var seen = Set<String>()
            var picks: [String] = []
            for word in mine + listed + apple {
                if word == partial || (word.caseInsensitiveCompare(partial) == .orderedSame && word == word.lowercased()) { continue }
                let shown = Self.matchCase(word, typed: partial)
                guard shown != partial, seen.insert(shown.lowercased()).inserted else { continue }
                picks.append(shown)
                if picks.count == limit { break }
            }
            return Result(partial: partial, words: picks)
        }
        // After a space: guess the next word from the last one or two words.
        guard before.last == " " else { return .empty }
        let trimmed = before.trimmingCharacters(in: .whitespaces)
        guard let last = trimmed.last, !".!?\n".contains(last), Self.isWordChar(last) else { return .empty }
        let tokens = trimmed.split(whereSeparator: { !Self.isWordChar($0) }).map(String.init)
        guard let previous = tokens.last?.lowercased() else { return .empty }
        let pair = tokens.count >= 2 ? "\(tokens[tokens.count - 2].lowercased()) \(previous)" : nil
        let mine = learnedPairs.filter { $0.value >= 2 && $0.key.hasPrefix(previous + " ") }
            .sorted { $0.value > $1.value }.map { String($0.key.split(separator: " ").last ?? "") }
        let listed = (pair.flatMap { next[$0] } ?? []) + (next[previous] ?? [])
        var seen = Set<String>()
        let picks = (mine + listed).filter { !$0.isEmpty && seen.insert($0.lowercased()).inserted }
        return Result(partial: "", words: Array(picks.prefix(limit)))
    }

    /// Remembers a finished word (and the word before it).
    func learn(_ word: String, previous: String?) {
        let clean = word.trimmingCharacters(in: CharacterSet(charactersIn: "'’"))
        guard (2...24).contains(clean.count), clean.allSatisfy(Self.isWordChar) else { return }
        // Keep capitals only for names mid-sentence ("Lagos"), not for sentence starts.
        let rest = clean.dropFirst()
        let stored = previous != nil && clean.first?.isUppercase == true && rest == rest.lowercased() ? clean : clean.lowercased()
        learned[stored, default: 0] += 1
        if let previous {
            learnedPairs["\(previous.lowercased()) \(clean.lowercased())", default: 0] += 1
        }
        Self.trim(&learned, to: Self.maxWords)
        Self.trim(&learnedPairs, to: Self.maxPairs)
    }

    func exportLearned() -> [String: Any] { ["w": learned, "p": learnedPairs] }

    func importLearned(_ value: Any?) {
        guard let root = value as? [String: Any] else { learned = [:]; learnedPairs = [:]; return }
        learned = root["w"] as? [String: Int] ?? [:]
        learnedPairs = root["p"] as? [String: Int] ?? [:]
    }

    func forgetLearned() {
        learned = [:]
        learnedPairs = [:]
    }

    private static func trim(_ map: inout [String: Int], to max: Int) {
        while map.count > max, let victim = map.min(by: { $0.value < $1.value })?.key {
            map.removeValue(forKey: victim)
        }
    }
}
