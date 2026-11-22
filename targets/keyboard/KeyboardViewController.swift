import UIKit
import StoreKit
import ImageIO

/// Lyfstyle keyboard (Pop Sugar). A style bar sits above the keys; the ☺ and 🎨
/// buttons swap the letter rows for the symbols panel or the theme picker.
final class KeyboardViewController: UIInputViewController {
    private enum Panel { case none, symbols, themes }

    private let catalogue = StyleCatalogue.shared
    private let defaults = UserDefaults.standard
    private let appGroup = "group.com.tabsphere.keyboardlyfstyle"
    private let productId = "com.tabsphere.keyboardlyfstyle.pro"
    private let root = UIStackView()
    private let backgroundView = UIImageView()
    private var backgroundKey = ""
    private var thumbnails: [String: UIImage] = [:]
    private var heightConstraint: NSLayoutConstraint?
    private var selectedStyle = UserDefaults.standard.string(forKey: "style") ?? "script"
    private var normalMode = UserDefaults.standard.bool(forKey: "normalMode")
    private var panel: Panel = .none
    private var palette: KeyboardPalette
    private var shifted = true
    private var capsLock = false
    private var symbols = false
    private var secondarySymbols = false
    private var safeNormal = false
    private var isPro = false
    private var deleteTimer: Timer?

    private let letters = [["q","w","e","r","t","y","u","i","o","p"], ["a","s","d","f","g","h","j","k","l"], ["z","x","c","v","b","n","m"]]
    private let numbers = [["1","2","3","4","5","6","7","8","9","0"], ["-","/",":",";","(",")","$","&","@","\""], [".",",","?","!","'","’"]]
    private let moreSymbols = [["[","]","{","}","#","%","^","*","+","="], ["_","\\","|","~","<",">","€","£","¥","•"], [".",",","?","!","'","…"]]

    /// Symbols panel content: (title, items, items per row).
    private let symbolGroups: [(String, [String], Int)] = [
        ("Hearts", ["♡", "♥", "❥", "❣", "💕", "💖", "🫶", "ღ", "𓆩♡𓆪", "ᥫ᭡"], 5),
        ("Stars", ["✦", "✧", "★", "☆", "⋆", "✩", "✨", "⋆｡˚", "✧･ﾟ", "彡"], 5),
        ("Cute", ["ʚ", "ɞ", "꒰", "꒱", "🎀", "🌸", "✿", "☁︎", "☾", "🦋"], 5),
        ("Arrows & lines", ["➜", "➳", "⇢", "↳", "⤷", "──────", "⋆⋅☆⋅⋆", "— ❧ —", "「 」", "꧁ ꧂"], 5),
        ("Kaomoji", ["(｡♡‿♡｡)", "ʕ•ᴥ•ʔ", "(◕‿◕✿)", "(づ｡◕‿‿◕｡)づ", "٩(◕‿◕)۶", "(≧◡≦)", "(⌐■_■)", "¯\\_(ツ)_/¯", "ฅ^•ﻌ•^ฅ", "(˘︶˘).｡*♡"], 2),
    ]

    override init(nibName nibNameOrNil: String?, bundle nibBundleOrNil: Bundle?) {
        palette = StyleCatalogue.shared.theme(id: UserDefaults.standard.string(forKey: "theme") ?? "pop-pink")
        super.init(nibName: nibNameOrNil, bundle: nibBundleOrNil)
    }

    required init?(coder: NSCoder) {
        palette = StyleCatalogue.shared.theme(id: UserDefaults.standard.string(forKey: "theme") ?? "pop-pink")
        super.init(coder: coder)
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(hex: palette.background)
        root.axis = .vertical
        root.spacing = 5
        root.translatesAutoresizingMaskIntoConstraints = false
        backgroundView.contentMode = .scaleAspectFill
        backgroundView.clipsToBounds = true
        backgroundView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(backgroundView)
        NSLayoutConstraint.activate([
            backgroundView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            backgroundView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            backgroundView.topAnchor.constraint(equalTo: view.topAnchor),
            backgroundView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])
        view.addSubview(root)
        NSLayoutConstraint.activate([
            root.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 5),
            root.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -5),
            root.topAnchor.constraint(equalTo: view.topAnchor, constant: 6),
            root.bottomAnchor.constraint(equalTo: view.bottomAnchor, constant: -5),
        ])
        heightConstraint = view.heightAnchor.constraint(equalToConstant: 300)
        heightConstraint?.priority = .defaultHigh
        heightConstraint?.isActive = true
        rebuild()
        Task { await refreshEntitlement() }
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        palette = resolveTheme(id: defaults.string(forKey: "theme") ?? palette.id)
        applySharedTheme()
        updateInputSafety()
        Task { await refreshEntitlement() }
    }

    override func viewWillLayoutSubviews() {
        super.viewWillLayoutSubviews()
        updateInputSafety()
    }

    override func textDidChange(_ textInput: UITextInput?) {
        super.textDidChange(textInput)
        updateInputSafety()
    }

    private func updateInputSafety() {
        let type = textDocumentProxy.keyboardType
        let contentType = textDocumentProxy.textContentType
        let required = (textDocumentProxy.isSecureTextEntry ?? false) ||
            contentType == .oneTimeCode ||
            type == .emailAddress || type == .URL || type == .numberPad ||
            type == .phonePad || type == .decimalPad || type == .numbersAndPunctuation ||
            type == .asciiCapableNumberPad
        if safeNormal != required {
            safeNormal = required
            rebuild()
        }
    }

    /// With Full Access on, a theme picked in the app is passed through the App Group.
    private func applySharedTheme() {
        guard hasFullAccess, let shared = UserDefaults(suiteName: appGroup),
              let id = shared.string(forKey: "theme") else { return }
        let updated = shared.double(forKey: "themeUpdatedAt")
        guard updated > defaults.double(forKey: "themeAppliedAt") else { return }
        defaults.set(updated, forKey: "themeAppliedAt")
        let candidate = resolveTheme(id: id)
        guard !candidate.requiresPro || isPro || shared.bool(forKey: "proUnlocked") else { return }
        palette = candidate
        defaults.set(candidate.id, forKey: "theme")
        rebuild()
    }

    private func refreshEntitlement() async {
        let direct = await readVerifiedStoreKitEntitlement()
        let shared = hasFullAccess && UserDefaults(suiteName: appGroup)?.bool(forKey: "proUnlocked") == true
        let unlocked = direct || shared
        if !unlocked && catalogue.style(id: selectedStyle).isPro {
            selectedStyle = "script"
            defaults.set(selectedStyle, forKey: "style")
        }
        if !unlocked && palette.requiresPro {
            palette = catalogue.theme(id: "pop-pink")
            defaults.set(palette.id, forKey: "theme")
        }
        defaults.set(direct ? "storekit" : shared ? "app-group" : "none", forKey: "entitlementLastSource")
        defaults.set(Date().timeIntervalSince1970, forKey: "entitlementLastChecked")
        isPro = unlocked
        rebuild()
    }

    private func readVerifiedStoreKitEntitlement() async -> Bool {
        for await result in Transaction.currentEntitlements {
            if case .verified(let transaction) = result,
               transaction.productID == productId,
               transaction.revocationDate == nil {
                return true
            }
        }
        return false
    }

    // MARK: - Layout

    private func rebuild() {
        root.arrangedSubviews.forEach { root.removeArrangedSubview($0); $0.removeFromSuperview() }
        view.backgroundColor = UIColor(hex: palette.background)
        applyBackground()
        root.addArrangedSubview(styleBar())
        let content = UIStackView()
        content.axis = .vertical
        content.spacing = 5
        content.heightAnchor.constraint(equalToConstant: 186).isActive = true
        switch panel {
        case .symbols: content.addArrangedSubview(symbolsPanel())
        case .themes: content.addArrangedSubview(themesPanel())
        case .none: addKeyRows(to: content)
        }
        root.addArrangedSubview(content)
        root.addArrangedSubview(bottomRow())
    }

    private func addKeyRows(to content: UIStackView) {
        let source = symbols ? (secondarySymbols ? moreSymbols : numbers) : letters
        for (index, values) in source.enumerated() {
            let row = rowStack()
            if index == 2 {
                if symbols {
                    row.addArrangedSubview(key(secondarySymbols ? "123" : "#+=") { [weak self] in
                        self?.secondarySymbols.toggle(); self?.rebuild()
                    })
                } else {
                    let shift = key(capsLock ? "Caps lock" : "Shift", accent: shifted || capsLock, systemImage: capsLock ? "capslock.fill" : shifted ? "shift.fill" : "shift") { [weak self] in
                        guard let self else { return }
                        self.shifted = self.capsLock ? false : !self.shifted
                        self.capsLock = false
                        self.rebuild()
                    }
                    shift.accessibilityHint = "Double tap for caps lock"
                    let doubleTap = UITapGestureRecognizer(target: self, action: #selector(toggleCaps))
                    doubleTap.numberOfTapsRequired = 2
                    shift.addGestureRecognizer(doubleTap)
                    row.addArrangedSubview(shift)
                }
            }
            for value in values {
                let label = !symbols && (shifted || capsLock) ? value.uppercased() : value
                row.addArrangedSubview(key(label) { [weak self] in self?.commit(label) })
            }
            if index == 2 { row.addArrangedSubview(deleteButton()) }
            content.addArrangedSubview(row)
        }
    }

    private func styleBar() -> UIView {
        let bar = UIStackView()
        bar.axis = .horizontal
        bar.spacing = 5
        bar.alignment = .center
        bar.heightAnchor.constraint(equalToConstant: 38).isActive = true

        let scroll = UIScrollView()
        scroll.showsHorizontalScrollIndicator = false
        // The chip strip takes whatever width the fixed Aa / ☺ / 🎨 buttons leave.
        scroll.setContentHuggingPriority(UILayoutPriority(1), for: .horizontal)
        scroll.setContentCompressionResistancePriority(UILayoutPriority(1), for: .horizontal)
        let chips = UIStackView()
        chips.axis = .horizontal
        chips.spacing = 5
        chips.alignment = .center
        chips.translatesAutoresizingMaskIntoConstraints = false
        scroll.addSubview(chips)
        NSLayoutConstraint.activate([
            chips.leadingAnchor.constraint(equalTo: scroll.contentLayoutGuide.leadingAnchor),
            chips.trailingAnchor.constraint(equalTo: scroll.contentLayoutGuide.trailingAnchor),
            chips.topAnchor.constraint(equalTo: scroll.contentLayoutGuide.topAnchor),
            chips.bottomAnchor.constraint(equalTo: scroll.contentLayoutGuide.bottomAnchor),
            chips.heightAnchor.constraint(equalTo: scroll.frameLayoutGuide.heightAnchor),
        ])
        let recents = recentIds()
        let ordered = catalogue.keyboardStyles
            .filter { isAvailable($0) }
            .sorted { first, second in
                let a = recents.firstIndex(of: first.id) ?? 100
                let b = recents.firstIndex(of: second.id) ?? 100
                return a < b
            }
        let effective = effectiveStyleId()
        for style in ordered {
            let active = style.id == effective
            let button = chip(catalogue.transform(style.name, styleId: style.id), active: active) { [weak self] in
                self?.selectStyle(style.id)
            }
            button.accessibilityLabel = "\(style.name) style\(active ? ", selected" : "")"
            chips.addArrangedSubview(button)
        }
        bar.addArrangedSubview(scroll)

        let normal = chip(normalMode || safeNormal ? "Aa ✓" : "Aa", active: normalMode || safeNormal) { [weak self] in
            guard let self, !self.safeNormal else { return }
            self.normalMode.toggle()
            self.defaults.set(self.normalMode, forKey: "normalMode")
            self.rebuild()
        }
        normal.isEnabled = !safeNormal
        normal.accessibilityLabel = safeNormal ? "Normal text required for this field" : "Toggle normal text"
        bar.addArrangedSubview(normal)
        let symbolsButton = chip("☺", active: panel == .symbols) { [weak self] in self?.toggle(.symbols) }
        symbolsButton.accessibilityLabel = "Symbols and kaomoji"
        bar.addArrangedSubview(symbolsButton)
        let themesButton = chip("🎨", active: panel == .themes) { [weak self] in self?.toggle(.themes) }
        themesButton.accessibilityLabel = "Keyboard themes. Current theme \(palette.name)"
        bar.addArrangedSubview(themesButton)
        return bar
    }

    private func toggle(_ target: Panel) {
        panel = panel == target ? .none : target
        rebuild()
    }

    private func symbolsPanel() -> UIView {
        let (scroll, column) = verticalScroll()
        for (title, items, perRow) in symbolGroups {
            column.addArrangedSubview(sectionLabel(title))
            var index = 0
            while index < items.count {
                let row = rowStack(height: 40)
                for item in items[index..<min(index + perRow, items.count)] {
                    let button = key(item) { [weak self] in self?.textDocumentProxy.insertText(item) }
                    button.titleLabel?.font = .systemFont(ofSize: perRow <= 2 ? 14 : 18)
                    row.addArrangedSubview(button)
                }
                for _ in 0..<(perRow - min(perRow, items.count - index)) { row.addArrangedSubview(UIView()) }
                column.addArrangedSubview(row)
                index += perRow
            }
        }
        return scroll
    }

    private func themesPanel() -> UIView {
        let (scroll, column) = verticalScroll()
        column.addArrangedSubview(sectionLabel(isPro ? "Pick a theme" : "Pick a theme · 🔒 unlock more with Lifetime Pro in the app"))
        let options = themeOptions()
        var index = 0
        while index < options.count {
            let row = rowStack(height: 48)
            for option in options[index..<min(index + 3, options.count)] {
                row.addArrangedSubview(themeSwatch(option))
            }
            column.addArrangedSubview(row)
            index += 3
        }
        return scroll
    }

    private func themeSwatch(_ option: KeyboardPalette) -> UIButton {
        let locked = option.requiresPro && !isPro
        let active = option.id == palette.id
        let button = UIButton(type: .system, primaryAction: UIAction(handler: { [weak self] _ in
            guard let self, !locked else { return }
            UISelectionFeedbackGenerator().selectionChanged()
            self.palette = option
            self.defaults.set(option.id, forKey: "theme")
            self.panel = .none
            self.rebuild()
        }))
        button.setTitle("\(locked ? "🔒 " : active ? "✓ " : "")\(option.name)", for: .normal)
        button.setTitleColor(UIColor(hex: option.text), for: .normal)
        button.titleLabel?.font = .systemFont(ofSize: 12, weight: .semibold)
        button.titleLabel?.lineBreakMode = .byTruncatingTail
        button.backgroundColor = UIColor(hex: option.background)
        if let image = option.image, let picture = thumbnail(image) {
            button.setBackgroundImage(picture, for: .normal)
            button.titleLabel?.layer.shadowColor = UIColor.black.cgColor
            button.titleLabel?.layer.shadowOpacity = 0.6
            button.titleLabel?.layer.shadowRadius = 2
            button.titleLabel?.layer.shadowOffset = CGSize(width: 0, height: 1)
        }
        button.clipsToBounds = true
        button.layer.cornerRadius = 12
        button.layer.borderWidth = active ? 3 : 1
        button.layer.borderColor = UIColor(hex: active ? option.accent : option.key).cgColor
        button.alpha = locked ? 0.6 : 1
        button.accessibilityLabel = "\(option.name) theme\(locked ? ", Pro" : "")\(active ? ", selected" : "")"
        return button
    }

    private func verticalScroll() -> (UIScrollView, UIStackView) {
        let scroll = UIScrollView()
        scroll.showsVerticalScrollIndicator = false
        let column = UIStackView()
        column.axis = .vertical
        column.spacing = 4
        column.translatesAutoresizingMaskIntoConstraints = false
        scroll.addSubview(column)
        NSLayoutConstraint.activate([
            column.leadingAnchor.constraint(equalTo: scroll.contentLayoutGuide.leadingAnchor),
            column.trailingAnchor.constraint(equalTo: scroll.contentLayoutGuide.trailingAnchor),
            column.topAnchor.constraint(equalTo: scroll.contentLayoutGuide.topAnchor),
            column.bottomAnchor.constraint(equalTo: scroll.contentLayoutGuide.bottomAnchor),
            column.widthAnchor.constraint(equalTo: scroll.frameLayoutGuide.widthAnchor),
        ])
        return (scroll, column)
    }

    private func sectionLabel(_ title: String) -> UILabel {
        let label = UILabel()
        label.text = title.uppercased()
        label.font = .systemFont(ofSize: 10, weight: .bold)
        label.textColor = UIColor(hex: palette.secondary)
        label.numberOfLines = 1
        label.adjustsFontSizeToFitWidth = true
        return label
    }

    private func bottomRow() -> UIView {
        let row = rowStack()
        row.distribution = .fill
        let modeButton = key(panel != .none || symbols ? "ABC" : "123") { [weak self] in
            guard let self else { return }
            if self.panel != .none { self.panel = .none } else { self.symbols.toggle(); self.secondarySymbols = false }
            self.rebuild()
        }
        row.addArrangedSubview(modeButton)
        let next = key("Next keyboard", systemImage: "globe") { [weak self] in self?.advanceToNextInputMode() }
        next.isHidden = !needsInputModeSwitchKey
        row.addArrangedSubview(next)
        let space = key("lyfstyle", secondaryText: true) { [weak self] in self?.commit(" ") }
        space.accessibilityLabel = "Space"
        row.addArrangedSubview(space)
        let period = key(".") { [weak self] in self?.commit(".") }
        row.addArrangedSubview(period)
        let returnButton = key("Return", accent: true, systemImage: "return") { [weak self] in self?.textDocumentProxy.insertText("\n") }
        row.addArrangedSubview(returnButton)
        NSLayoutConstraint.activate([
            modeButton.widthAnchor.constraint(equalTo: row.widthAnchor, multiplier: 0.13),
            next.widthAnchor.constraint(equalTo: row.widthAnchor, multiplier: 0.13),
            space.widthAnchor.constraint(equalTo: row.widthAnchor, multiplier: 0.40),
            period.widthAnchor.constraint(equalTo: row.widthAnchor, multiplier: 0.09),
            returnButton.widthAnchor.constraint(equalTo: row.widthAnchor, multiplier: 0.15),
        ])
        return row
    }

    private func rowStack(height: CGFloat = 43) -> UIStackView {
        let row = UIStackView()
        row.axis = .horizontal
        row.distribution = .fillEqually
        row.spacing = 4
        row.heightAnchor.constraint(equalToConstant: height).isActive = true
        return row
    }

    private func chip(_ title: String, active: Bool, action: @escaping () -> Void) -> UIButton {
        let button = UIButton(type: .system, primaryAction: UIAction(handler: { _ in
            UISelectionFeedbackGenerator().selectionChanged()
            action()
        }))
        button.setTitle(title, for: .normal)
        button.titleLabel?.font = .systemFont(ofSize: 14, weight: .medium)
        button.titleLabel?.lineBreakMode = .byTruncatingTail
        let foreground = active ? readableColor(on: palette.accent) : UIColor(hex: palette.text)
        button.setTitleColor(foreground, for: .normal)
        let fill = active ? UIColor(hex: palette.accent) : keyFill()
        button.setBackgroundImage(colorImage(fill), for: .normal)
        button.setBackgroundImage(colorImage(highlighted(fill)), for: .highlighted)
        button.contentEdgeInsets = UIEdgeInsets(top: 0, left: 12, bottom: 0, right: 12)
        button.layer.cornerRadius = 16
        button.clipsToBounds = true
        button.heightAnchor.constraint(equalToConstant: 32).isActive = true
        button.widthAnchor.constraint(greaterThanOrEqualToConstant: 40).isActive = true
        button.setContentCompressionResistancePriority(.required, for: .horizontal)
        return button
    }

    private func key(_ title: String, accent: Bool = false, secondaryText: Bool = false, systemImage: String? = nil, action: @escaping () -> Void) -> UIButton {
        let button = UIButton(type: .system, primaryAction: UIAction(handler: { _ in
            UISelectionFeedbackGenerator().selectionChanged()
            action()
        }))
        let foreground = accent ? readableColor(on: palette.accent) : UIColor(hex: secondaryText ? palette.secondary : palette.text)
        if let systemImage {
            let configuration = UIImage.SymbolConfiguration(pointSize: 16, weight: .medium)
            button.setImage(UIImage(systemName: systemImage, withConfiguration: configuration), for: .normal)
            button.tintColor = foreground
        } else {
            button.setTitle(title, for: .normal)
        }
        button.titleLabel?.font = .systemFont(ofSize: title.count > 6 ? 13 : 18, weight: .medium)
        button.titleLabel?.lineBreakMode = .byTruncatingTail
        let fill = accent ? UIColor(hex: palette.accent) : keyFill()
        button.setBackgroundImage(colorImage(fill), for: .normal)
        button.setBackgroundImage(colorImage(highlighted(fill)), for: .highlighted)
        button.setTitleColor(foreground, for: .normal)
        button.setTitleColor(foreground, for: .highlighted)
        button.layer.cornerRadius = 10
        button.clipsToBounds = true
        button.accessibilityLabel = title
        button.heightAnchor.constraint(greaterThanOrEqualToConstant: 36).isActive = true
        return button
    }

    private func colorImage(_ color: UIColor) -> UIImage {
        UIGraphicsImageRenderer(size: CGSize(width: 1, height: 1)).image { context in
            color.setFill()
            context.fill(CGRect(x: 0, y: 0, width: 1, height: 1))
        }
    }

    private func highlighted(_ color: UIColor) -> UIColor {
        var red: CGFloat = 0
        var green: CGFloat = 0
        var blue: CGFloat = 0
        var alpha: CGFloat = 0
        guard color.getRed(&red, green: &green, blue: &blue, alpha: &alpha) else { return color.withAlphaComponent(0.75) }
        return UIColor(red: red * 0.86, green: green * 0.86, blue: blue * 0.86, alpha: alpha)
    }

    private func deleteButton() -> UIButton {
        let button = key("Delete previous visible character. Hold to repeat", systemImage: "delete.backward") { [weak self] in self?.deleteBackward() }
        button.accessibilityLabel = "Delete previous visible character. Hold to repeat"
        let press = UILongPressGestureRecognizer(target: self, action: #selector(deleteLongPress(_:)))
        press.minimumPressDuration = 0.38
        button.addGestureRecognizer(press)
        return button
    }

    /// Plum ink on light accents, white on dark ones.
    private func readableColor(on hexColor: String) -> UIColor {
        let hex = String(hexColor.dropFirst())
        var value: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&value)
        let red = Double((value >> 16) & 0xff) / 255
        let green = Double((value >> 8) & 0xff) / 255
        let blue = Double(value & 0xff) / 255
        let luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue
        return luminance > 0.55 ? UIColor(hex: "#22172F") : UIColor(hex: "#FFFFFF")
    }

    // MARK: - Typing

    private func isAvailable(_ style: TextStyle) -> Bool {
        style.worksInKeyboard && (isPro || !style.isPro)
    }

    private func effectiveStyleId() -> String {
        if normalMode || safeNormal { return "normal" }
        return isAvailable(catalogue.style(id: selectedStyle)) ? selectedStyle : "script"
    }

    private func commit(_ raw: String) {
        textDocumentProxy.insertText(catalogue.transform(raw, styleId: effectiveStyleId()))
        if raw.count == 1, raw.range(of: "[A-Za-z]", options: .regularExpression) != nil, shifted, !capsLock {
            shifted = false
            rebuild()
        }
    }

    private func deleteBackward() {
        let proxy = textDocumentProxy
        guard let before = proxy.documentContextBeforeInput else {
            proxy.deleteBackward()
            return
        }
        guard let grapheme = before.last else { return }
        let graphemeUnits = String(grapheme).utf16.count
        let expectedUnits = before.utf16.count - graphemeUnits
        for _ in 0..<graphemeUnits {
            proxy.deleteBackward()
            guard let current = proxy.documentContextBeforeInput,
                  current.utf16.count > expectedUnits else { break }
        }
    }

    @objc private func deleteLongPress(_ gesture: UILongPressGestureRecognizer) {
        switch gesture.state {
        case .began:
            deleteTimer?.invalidate()
            deleteTimer = Timer.scheduledTimer(withTimeInterval: 0.055, repeats: true) { [weak self] _ in self?.deleteBackward() }
        case .ended, .cancelled, .failed:
            deleteTimer?.invalidate(); deleteTimer = nil
        default: break
        }
    }

    @objc private func toggleCaps() {
        capsLock.toggle(); shifted = capsLock; rebuild()
    }

    private func selectStyle(_ id: String) {
        selectedStyle = id
        normalMode = false
        panel = .none
        defaults.set(id, forKey: "style")
        defaults.set(false, forKey: "normalMode")
        let updated = [id] + recentIds().filter { $0 != id }
        defaults.set(Array(updated.prefix(6)), forKey: "recents")
        rebuild()
    }

    private func recentIds() -> [String] { defaults.stringArray(forKey: "recents") ?? [] }

    // MARK: - Picture themes and the person's photo

    /// White glass keys over the person's own photo (slightly dimmed).
    private static let photoTheme = KeyboardPalette(
        id: "custom-photo", name: "Your photo", background: "#22172F", key: "#FFFFFF",
        text: "#FFFFFF", secondary: "#EDE6F0", accent: "#FF3D8B", dark: true,
        isPro: true, image: "@photo", keyAlpha: 0.22
    )

    /// iOS only lets the keyboard read the shared photo when Full Access is on.
    private var photoURL: URL? {
        guard hasFullAccess,
              let container = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroup) else { return nil }
        let url = container.appendingPathComponent("keyboard_photo.jpg")
        return FileManager.default.fileExists(atPath: url.path) ? url : nil
    }

    private func resolveTheme(id: String) -> KeyboardPalette {
        if id == Self.photoTheme.id { return photoURL != nil ? Self.photoTheme : catalogue.theme(id: "pop-pink") }
        return catalogue.theme(id: id)
    }

    private func themeOptions() -> [KeyboardPalette] {
        photoURL != nil ? [Self.photoTheme] + catalogue.data.themes : catalogue.data.themes
    }

    private func imageURL(_ image: String) -> URL? {
        if image == "@photo" { return photoURL }
        let name = (image as NSString).deletingPathExtension
        let ext = (image as NSString).pathExtension
        return Bundle.main.url(forResource: name, withExtension: ext)
            ?? Bundle.main.url(forResource: name, withExtension: ext, subdirectory: "assets")
    }

    /// Keyboards have a small memory budget, so images are decoded at a reduced size.
    private func loadImage(_ image: String, maxPixels: Int) -> UIImage? {
        guard let url = imageURL(image), let source = CGImageSourceCreateWithURL(url as CFURL, nil) else { return nil }
        let options: [CFString: Any] = [
            kCGImageSourceCreateThumbnailFromImageAlways: true,
            kCGImageSourceCreateThumbnailWithTransform: true,
            kCGImageSourceThumbnailMaxPixelSize: maxPixels,
        ]
        guard let cgImage = CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary) else { return nil }
        return UIImage(cgImage: cgImage)
    }

    private func applyBackground() {
        guard let image = palette.image else {
            backgroundView.image = nil
            backgroundKey = ""
            return
        }
        let stamp: TimeInterval
        if image == "@photo", let url = photoURL,
           let modified = try? FileManager.default.attributesOfItem(atPath: url.path)[.modificationDate] as? Date {
            stamp = modified.timeIntervalSince1970
        } else {
            stamp = 0
        }
        let key = "\(palette.id):\(stamp)"
        guard key != backgroundKey else { return }
        backgroundKey = key
        var picture = loadImage(image, maxPixels: 1200)
        if image == "@photo", let photo = picture {
            // Dim people's own photos a little so the keys stay readable.
            picture = UIGraphicsImageRenderer(size: photo.size).image { context in
                photo.draw(at: .zero)
                UIColor.black.withAlphaComponent(0.3).setFill()
                context.fill(CGRect(origin: .zero, size: photo.size))
            }
        }
        backgroundView.image = picture
    }

    private func thumbnail(_ image: String) -> UIImage? {
        if let cached = thumbnails[image] { return cached }
        let picture = loadImage(image, maxPixels: 240)
        thumbnails[image] = picture
        return picture
    }

    /// Normal keys are see-through on picture themes.
    private func keyFill() -> UIColor {
        UIColor(hex: palette.key).withAlphaComponent(CGFloat(palette.keyAlpha ?? 1))
    }
}
