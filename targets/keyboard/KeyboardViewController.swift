import UIKit
import StoreKit
import ImageIO
import NaturalLanguage
#if canImport(Translation)
import Translation
#endif

/// Lyfstyle keyboard (Pop Sugar). A style bar sits above the keys; the ☺ and 🎨
/// buttons swap the letter rows for the symbols panel or the theme picker.
///
/// Typing feel: letters go in the moment a finger lands, with a pop-up preview.
/// Holding a letter shows accents (and the number on the top row). Key labels are
/// drawn in the selected style, so the keyboard shows what it will type.
final class KeyboardViewController: UIInputViewController {
    private enum Panel { case none, fonts, symbols, themes, voice, translate }

    private static let fontGroups = [StyleCatalogue.myStylesGroup, "Cursive & cute", "Bold & clean", "Bubbles & boxes", "Gothic & fancy", "Around the world", "Effects", "Fun & flipped"]
    private static let pictureGroups = ["Cute & sweet", "Nature & sky", "Art", "K-pop", "Movies", "Music", "Pride", "City & neon", "Luxe & textures"]
    private enum CapKind { case letter, function, accent }

    private let catalogue = StyleCatalogue.shared
    private let defaults = UserDefaults.standard
    private let appGroup = "group.com.tabsphere.keyboardlyfstyle"
    private let productId = "com.tabsphere.keyboardlyfstyle.pro"
    private let root = UIStackView()
    private let backgroundView = UIImageView()
    private var backgroundKey = ""
    private var thumbnails: [String: UIImage] = [:]
    /// Shown once at the top of the themes panel, e.g. after tapping a locked theme.
    private var themeNotice: String?
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

    // Live key references, so shift and style changes relabel keys without a rebuild.
    private var letterCaps: [(KeyCap, String)] = []
    private weak var shiftCap: KeyCap?
    private var lastShiftTap: TimeInterval = 0
    private var lastSpaceTap: TimeInterval = 0

    // Delete repeat.
    private var deleteDelay: Timer?
    private var deleteTimer: Timer?

    // Pop-up preview and the long-press accent strip.
    private let popup = UIView()
    private let popupLabel = UILabel()
    private let alternatesStrip = UIStackView()
    private var alternateTimer: Timer?
    private var alternates: [String] = []
    private var alternateIndex = 0
    private var alternatesShowing = false
    private var insertedOnDown = ""

    // Translator (Apple's on-device translation, iOS 26+).
    private var translateTarget = UserDefaults.standard.string(forKey: "translateTo") ?? "es"
    private var translateSource = ""
    private var translateResult = ""
    private var translateStatus = ""
    private weak var translateResultLabel: UILabel?
    private weak var translateActions: UIView?
    private let languages: [(String, String)] = [
        ("es", "Spanish"), ("fr", "French"), ("pt", "Portuguese"), ("de", "German"), ("it", "Italian"),
        ("ar", "Arabic"), ("hi", "Hindi"), ("zh-Hans", "Chinese"), ("ja", "Japanese"), ("ko", "Korean"),
        ("tr", "Turkish"), ("nl", "Dutch"), ("pl", "Polish"), ("en", "English"),
    ]

    // Sliding on the space bar moves the cursor.
    private var spaceStartX: CGFloat = 0
    private var spaceSliding = false

    private static let rowHeight: CGFloat = 54
    private static let keyInset = UIEdgeInsets(top: 5, left: 3, bottom: 5, right: 3)

    private let letters = [["q","w","e","r","t","y","u","i","o","p"], ["a","s","d","f","g","h","j","k","l"], ["z","x","c","v","b","n","m"]]
    private let numbers = [["1","2","3","4","5","6","7","8","9","0"], ["-","/",":",";","(",")","$","&","@","\""], [".",",","?","!","'","’"]]
    private let moreSymbols = [["[","]","{","}","#","%","^","*","+","="], ["_","\\","|","~","<",">","€","£","¥","•"], [".",",","?","!","'","…"]]

    /// Hold a key for these. Top-row letters offer their number first.
    private let accentMap: [String: [String]] = [
        "q": ["1"], "w": ["2"], "e": ["3", "è", "é", "ê", "ë", "ē", "ę"], "r": ["4"], "t": ["5"],
        "y": ["6", "ÿ", "ý"], "u": ["7", "ù", "ú", "û", "ü", "ū"], "i": ["8", "ì", "í", "î", "ï", "ī"],
        "o": ["9", "ò", "ó", "ô", "ö", "õ", "ø", "œ"], "p": ["0"],
        "a": ["à", "á", "â", "ä", "æ", "ã", "å", "ā"], "s": ["ß", "ś", "š"], "l": ["ł"],
        "z": ["ž", "ź", "ż"], "c": ["ç", "ć", "č"], "n": ["ñ", "ń"],
    ]

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
        // The keyboard is a rounded panel (like iPhone's own keyboard), not a square box:
        // the view stays clear and the background view carries the colour or picture.
        view.backgroundColor = .clear
        backgroundView.backgroundColor = UIColor(hex: palette.background)
        backgroundView.layer.cornerRadius = 22
        backgroundView.layer.cornerCurve = .continuous
        root.axis = .vertical
        root.spacing = 2
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
            root.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 3),
            root.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -3),
            root.topAnchor.constraint(equalTo: view.topAnchor, constant: 6),
            root.bottomAnchor.constraint(equalTo: view.bottomAnchor, constant: -4),
        ])
        heightConstraint = view.heightAnchor.constraint(equalToConstant: 270)
        heightConstraint?.priority = .defaultHigh
        heightConstraint?.isActive = true
        setUpPopup()
        rebuild()
        Task { await refreshEntitlement() }
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        // Styles made in the app reach the keyboard through the App Group (needs Full Access).
        catalogue.loadCustom(sharedDefaults?.string(forKey: "customStyles"))
        palette = resolveTheme(id: defaults.string(forKey: "theme") ?? palette.id)
        applySharedTheme()
        updateInputSafety()
        rebuild()
        updateAutoShift()
        Task { await refreshEntitlement() }
    }

    override func viewWillLayoutSubviews() {
        super.viewWillLayoutSubviews()
        updateInputSafety()
    }

    override func textDidChange(_ textInput: UITextInput?) {
        super.textDidChange(textInput)
        updateInputSafety()
        updateAutoShift()
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
        let candidate = resolveTheme(id: id)
        // Only mark the app's choice as applied once it really is: if Pro or the photo isn't
        // visible yet, try again next time the keyboard opens instead of skipping it for good.
        guard candidate.id == id, !candidate.requiresPro || isPro || shared.bool(forKey: "proUnlocked") else { return }
        defaults.set(updated, forKey: "themeAppliedAt")
        palette = candidate
        defaults.set(candidate.id, forKey: "theme")
    }

    private func refreshEntitlement() async {
        let direct = await readVerifiedStoreKitEntitlement()
        let shared = hasFullAccess && UserDefaults(suiteName: appGroup)?.bool(forKey: "proUnlocked") == true
        let unlocked = direct || shared
        var changed = unlocked != isPro
        if !unlocked && catalogue.style(id: selectedStyle).isPro {
            selectedStyle = "script"
            defaults.set(selectedStyle, forKey: "style")
            changed = true
        }
        if !unlocked && palette.requiresPro {
            palette = catalogue.theme(id: "pop-pink")
            defaults.set(palette.id, forKey: "theme")
            changed = true
        }
        defaults.set(direct ? "storekit" : shared ? "app-group" : "none", forKey: "entitlementLastSource")
        defaults.set(Date().timeIntervalSince1970, forKey: "entitlementLastChecked")
        isPro = unlocked
        // Rebuilding mid-touch would drop the key under the finger, so only rebuild on a real change.
        if changed { rebuild() }
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
        hidePopup()
        letterCaps = []
        shiftCap = nil
        root.arrangedSubviews.forEach { root.removeArrangedSubview($0); $0.removeFromSuperview() }
        backgroundView.backgroundColor = UIColor(hex: palette.background)
        applyBackground()
        root.addArrangedSubview(styleBar())
        let content = UIStackView()
        content.axis = .vertical
        content.spacing = 0
        content.heightAnchor.constraint(equalToConstant: Self.rowHeight * 3).isActive = true
        switch panel {
        case .fonts: content.addArrangedSubview(fontsPanel())
        case .symbols: content.addArrangedSubview(symbolsPanel())
        case .themes: content.addArrangedSubview(themesPanel())
        case .voice: content.addArrangedSubview(voicePanel())
        case .translate: content.addArrangedSubview(translatePanel())
        case .none: addKeyRows(to: content)
        }
        root.addArrangedSubview(content)
        root.addArrangedSubview(bottomRow())
        view.bringSubviewToFront(popup)
    }

    private func addKeyRows(to content: UIStackView) {
        if symbols {
            let source = secondarySymbols ? moreSymbols : numbers
            content.addArrangedSubview(weightedRow(source[0].map { (symbolCap($0), 1) }))
            content.addArrangedSubview(weightedRow(source[1].map { (symbolCap($0), 1) }))
            let toggle = cap(secondarySymbols ? "123" : "#+=", kind: .function)
            toggle.onUp = { [weak self] _, inside in
                guard let self, inside else { return }
                self.secondarySymbols.toggle(); self.rebuild()
            }
            var third: [(UIView, CGFloat)] = [(toggle, 1.5), (UIView(), 0.25)]
            third += source[2].map { (symbolCap($0), 1.0) as (UIView, CGFloat) }
            third += [(UIView(), 0.25), (deleteCap(), 1.5)]
            content.addArrangedSubview(weightedRow(third))
            return
        }
        content.addArrangedSubview(weightedRow(letters[0].map { (letterCap($0), 1) }))
        var second: [(UIView, CGFloat)] = [(UIView(), 0.5)]
        second += letters[1].map { (letterCap($0), 1.0) as (UIView, CGFloat) }
        second.append((UIView(), 0.5))
        content.addArrangedSubview(weightedRow(second))
        let shift = cap(nil, kind: .function)
        shift.onUp = { [weak self] _, inside in if inside { self?.tapShift() } }
        shiftCap = shift
        var third: [(UIView, CGFloat)] = [(shift, 1.4), (UIView(), 0.1)]
        third += letters[2].map { (letterCap($0), 1.0) as (UIView, CGFloat) }
        third += [(UIView(), 0.1), (deleteCap(), 1.4)]
        content.addArrangedSubview(weightedRow(third))
        updateLetterLabels()
    }

    /// Lays views out by relative width; the weights in a row add up to 10 key widths.
    private func weightedRow(_ items: [(UIView, CGFloat)], height: CGFloat = KeyboardViewController.rowHeight) -> UIStackView {
        let row = UIStackView()
        row.axis = .horizontal
        row.distribution = .fill
        row.spacing = 0
        row.heightAnchor.constraint(equalToConstant: height).isActive = true
        let total = items.reduce(0) { $0 + $1.1 }
        for (item, weight) in items {
            row.addArrangedSubview(item)
            item.widthAnchor.constraint(equalTo: row.widthAnchor, multiplier: weight / total).isActive = true
        }
        return row
    }

    private func styleBar() -> UIView {
        let bar = UIStackView()
        bar.axis = .horizontal
        bar.spacing = 5
        bar.alignment = .center
        bar.isLayoutMarginsRelativeArrangement = true
        bar.layoutMargins = UIEdgeInsets(top: 0, left: 2, bottom: 0, right: 2)
        bar.heightAnchor.constraint(equalToConstant: 40).isActive = true

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
        // Only recent fonts live in the bar; the Fonts button opens every font, grouped.
        let effective = effectiveStyleId()
        let ordered = barStyles(effective: effective)
        for style in ordered {
            let active = style.id == effective
            let button = chip(catalogue.transform(style.name, styleId: style.id), active: active) { [weak self] in
                self?.selectStyle(style.id)
            }
            button.accessibilityLabel = "\(style.name) style\(active ? ", selected" : "")"
            chips.addArrangedSubview(button)
        }
        let fonts = chip(panel == .fonts ? "Fonts ▴" : "Fonts ▾", active: panel == .fonts) { [weak self] in self?.toggle(.fonts) }
        fonts.accessibilityLabel = "All fonts"
        bar.insertArrangedSubview(fonts, at: 0)
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
        let translateButton = chip("文A", active: panel == .translate) { [weak self] in self?.openTranslator() }
        translateButton.accessibilityLabel = "Translate your message"
        bar.addArrangedSubview(translateButton)
        let symbolsButton = chip("☺", active: panel == .symbols) { [weak self] in self?.toggle(.symbols) }
        symbolsButton.accessibilityLabel = "Symbols and kaomoji"
        bar.addArrangedSubview(symbolsButton)
        let themesButton = chip("🎨", active: panel == .themes) { [weak self] in self?.toggle(.themes) }
        themesButton.accessibilityLabel = "Keyboard themes. Current theme \(palette.name)"
        bar.addArrangedSubview(themesButton)
        return bar
    }

    /// Recent fonts first (up to 6), always including the selected one.
    private func barStyles(effective: String) -> [TextStyle] {
        var ids = recentIds()
        if effective != "normal", !ids.contains(effective) { ids.insert(effective, at: 0) }
        var styles = ids.map { catalogue.style(id: $0) }.filter { $0.id != "normal" && isAvailable($0) }
        if styles.count < 4 {
            for style in catalogue.keyboardStyles where isAvailable(style) && !styles.contains(where: { $0.id == style.id }) {
                styles.append(style)
                if styles.count >= 6 { break }
            }
        }
        return Array(styles.prefix(7))
    }

    private func fontsPanel() -> UIView {
        let (scroll, column) = verticalScroll()
        if !isPro { column.addArrangedSubview(sectionLabel("🔒 Unlock every font with Lifetime Pro in the app")) }
        let effective = effectiveStyleId()
        for group in Self.fontGroups {
            let styles = catalogue.keyboardStyles.filter { ($0.group ?? "") == group }
            guard !styles.isEmpty else { continue }
            column.addArrangedSubview(sectionLabel(group))
            var index = 0
            while index < styles.count {
                let row = UIStackView()
                row.axis = .horizontal
                row.distribution = .fillEqually
                row.spacing = 6
                row.heightAnchor.constraint(equalToConstant: 40).isActive = true
                let chunk = styles[index..<min(index + 3, styles.count)]
                for style in chunk {
                    let locked = !isAvailable(style)
                    let title = (locked ? "🔒 " : "") + catalogue.transform(style.name, styleId: style.id)
                    let button = chip(title, active: style.id == effective) { [weak self] in
                        guard !locked else { return }
                        self?.selectStyle(style.id)
                    }
                    button.alpha = locked ? 0.55 : 1
                    button.accessibilityLabel = "\(style.name)\(locked ? ", Pro" : "")"
                    row.addArrangedSubview(button)
                }
                for _ in chunk.count..<3 { row.addArrangedSubview(UIView()) }
                column.addArrangedSubview(row)
                index += 3
            }
        }
        return scroll
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
                var row: [(UIView, CGFloat)] = []
                for item in items[index..<min(index + perRow, items.count)] {
                    let button = cap(item, kind: .letter)
                    button.label.font = .systemFont(ofSize: perRow <= 2 ? 15 : 20)
                    button.onUp = { [weak self] _, inside in
                        guard inside else { return }
                        self?.tick()
                        self?.textDocumentProxy.insertText(item)
                    }
                    row.append((button, 1))
                }
                for _ in 0..<(perRow - min(perRow, items.count - index)) { row.append((UIView(), 1)) }
                column.addArrangedSubview(weightedRow(row, height: 46))
                index += perRow
            }
        }
        return scroll
    }

    private func themesPanel() -> UIView {
        let (scroll, column) = verticalScroll()
        if let message = themeNotice {
            column.addArrangedSubview(notice(message))
            themeNotice = nil
        }
        if !isPro { column.addArrangedSubview(sectionLabel("🔒 Unlock every theme with Lifetime Pro in the app")) }
        if !hasFullAccess {
            // iPhone only lets a keyboard read the photo and colours saved in the app when Full Access is on.
            column.addArrangedSubview(notice("Your photo & colours need Full Access: Settings → General → Keyboard → Keyboards → Lyfstyle → Allow Full Access"))
        }
        if hasFullAccess, photoURL == nil, customTheme == nil {
            column.addArrangedSubview(sectionLabel("No photo yet: choose one in the Lyfstyle app → Keyboard tab"))
        }
        let mine = [photoTheme, customTheme].compactMap { $0 }
        var sections: [(String, [KeyboardPalette])] = [("Yours", mine)]
        for group in Self.pictureGroups {
            sections.append((group, catalogue.data.themes.filter { $0.image != nil && $0.group == group }))
        }
        sections.append(("Colours", catalogue.data.themes.filter { $0.image == nil }))
        defer {
            // What the keyboard can see, so problems with "Your photo" are easy to spot.
            let pro = isPro || (sharedDefaults?.bool(forKey: "proUnlocked") ?? false)
            column.addArrangedSubview(sectionLabel("Full Access \(hasFullAccess ? "on" : "off") · Photo \(photoURL != nil ? "found" : "not found") · Pro \(pro ? "yes" : "no")"))
        }
        for (title, options) in sections where !options.isEmpty {
            column.addArrangedSubview(sectionLabel(title))
            var index = 0
            while index < options.count {
                let row = UIStackView()
                row.axis = .horizontal
                row.distribution = .fillEqually
                row.spacing = 6
                row.heightAnchor.constraint(equalToConstant: 50).isActive = true
                let chunk = options[index..<min(index + 3, options.count)]
                for option in chunk { row.addArrangedSubview(themeSwatch(option)) }
                for _ in chunk.count..<3 { row.addArrangedSubview(UIView()) }
                column.addArrangedSubview(row)
                index += 3
            }
        }
        return scroll
    }

    private func themeSwatch(_ option: KeyboardPalette) -> UIButton {
        let locked = option.requiresPro && !isPro
        let active = option.id == palette.id
        let button = UIButton(type: .system, primaryAction: UIAction(handler: { [weak self] _ in
            guard let self else { return }
            self.tick()
            if locked {
                // Say why instead of silently ignoring the tap.
                self.themeNotice = self.hasFullAccess
                    ? "\(option.name) comes with Lifetime Pro. Unlock it in the Lyfstyle app, then come back here."
                    : "\(option.name) comes with Lifetime Pro. Already have Pro? Turn on Full Access: Settings → General → Keyboard → Keyboards → Lyfstyle."
                self.rebuild()
                return
            }
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
        if let image = option.image {
            // Thumbnails load off the main thread, so the panel opens and responds at once.
            if let cached = thumbnails[image] {
                button.setBackgroundImage(cached, for: .normal)
            } else if let url = imageURL(image) {
                DispatchQueue.global(qos: .userInitiated).async { [weak self, weak button] in
                    let picture = Self.decode(url, maxPixels: 240)
                    DispatchQueue.main.async {
                        self?.thumbnails[image] = picture
                        button?.setBackgroundImage(picture, for: .normal)
                    }
                }
            }
            button.titleLabel?.layer.shadowColor = UIColor.black.cgColor
            button.titleLabel?.layer.shadowOpacity = 0.7
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
            column.leadingAnchor.constraint(equalTo: scroll.contentLayoutGuide.leadingAnchor, constant: 3),
            column.trailingAnchor.constraint(equalTo: scroll.contentLayoutGuide.trailingAnchor, constant: -3),
            column.topAnchor.constraint(equalTo: scroll.contentLayoutGuide.topAnchor, constant: 2),
            column.bottomAnchor.constraint(equalTo: scroll.contentLayoutGuide.bottomAnchor, constant: -4),
            column.widthAnchor.constraint(equalTo: scroll.frameLayoutGuide.widthAnchor, constant: -6),
        ])
        return (scroll, column)
    }

    /// A highlighted, wrapping note at the top of a panel.
    private func notice(_ text: String) -> UIView {
        let label = UILabel()
        label.text = text
        label.font = .systemFont(ofSize: 12, weight: .semibold)
        label.textColor = readableColor(on: palette.accent)
        label.numberOfLines = 0
        label.textAlignment = .center
        let box = UIView()
        box.backgroundColor = UIColor(hex: palette.accent)
        box.layer.cornerRadius = 10
        label.translatesAutoresizingMaskIntoConstraints = false
        box.addSubview(label)
        NSLayoutConstraint.activate([
            label.leadingAnchor.constraint(equalTo: box.leadingAnchor, constant: 10),
            label.trailingAnchor.constraint(equalTo: box.trailingAnchor, constant: -10),
            label.topAnchor.constraint(equalTo: box.topAnchor, constant: 7),
            label.bottomAnchor.constraint(equalTo: box.bottomAnchor, constant: -7),
        ])
        return box
    }

    private func sectionLabel(_ title: String) -> UILabel {
        let label = UILabel()
        label.text = title.uppercased()
        label.font = .systemFont(ofSize: 10, weight: .bold)
        label.textColor = UIColor(hex: palette.secondary)
        label.numberOfLines = 1
        label.adjustsFontSizeToFitWidth = true
        label.heightAnchor.constraint(equalToConstant: 22).isActive = true
        return label
    }

    private func bottomRow() -> UIView {
        let mode = cap(panel != .none || symbols ? "ABC" : "123", kind: .function)
        mode.label.font = .systemFont(ofSize: 16, weight: .medium)
        mode.onUp = { [weak self] _, inside in
            guard let self, inside else { return }
            if self.panel != .none { self.panel = .none } else { self.symbols.toggle(); self.secondarySymbols = false }
            self.rebuild()
        }
        var items: [(UIView, CGFloat)] = [(mode, 1.3)]
        if needsInputModeSwitchKey {
            let globe = cap(nil, kind: .function)
            globe.icon.image = UIImage(systemName: "globe", withConfiguration: UIImage.SymbolConfiguration(pointSize: 18, weight: .regular))
            globe.icon.tintColor = UIColor(hex: palette.text)
            globe.accessibilityLabel = "Next keyboard"
            globe.addTarget(self, action: #selector(handleInputModeList(from:with:)), for: .allTouchEvents)
            items.append((globe, 1.3))
        }
        let mic = cap("🎙", kind: .function)
        mic.label.font = .systemFont(ofSize: 18)
        mic.accessibilityLabel = "Speak to type"
        mic.onUp = { [weak self] _, inside in
            guard let self, inside else { return }
            self.tick()
            self.toggle(.voice)
        }
        items.append((mic, 1.1))
        let space = cap(catalogue.transform("lyfstyle", styleId: effectiveStyleId()), kind: .letter)
        space.label.font = .systemFont(ofSize: 15, weight: .medium)
        space.label.textColor = UIColor(hex: palette.secondary)
        space.accessibilityLabel = "Space"
        space.onDown = { [weak self] key in
            self?.tick()
            self?.spaceStartX = key.convert(key.bounds, to: nil).midX
            self?.spaceSliding = false
        }
        space.onMove = { [weak self] _, point in self?.slideCursor(to: point.x) }
        space.onUp = { [weak self] _, inside in
            guard let self else { return }
            if !self.spaceSliding && inside { self.typeSpace() }
            self.spaceSliding = false
        }
        let period = cap(".", kind: .letter)
        period.onDown = { [weak self] _ in self?.tick(); self?.commit(".") }
        let returnKey = cap(nil, kind: .accent)
        returnKey.icon.image = UIImage(systemName: "return", withConfiguration: UIImage.SymbolConfiguration(pointSize: 18, weight: .semibold))
        returnKey.icon.tintColor = readableColor(on: palette.accent)
        returnKey.accessibilityLabel = "Return"
        returnKey.onUp = { [weak self] _, inside in
            guard let self, inside else { return }
            self.tick()
            self.textDocumentProxy.insertText("\n")
            self.updateAutoShift()
        }
        let used = items.reduce(0) { $0 + $1.1 } + 1.0 + 1.9
        items += [(space, 10 - used), (period, 1.0), (returnKey, 1.9)]
        return weightedRow(items)
    }

    private func chip(_ title: String, active: Bool, action: @escaping () -> Void) -> UIButton {
        let button = UIButton(type: .custom, primaryAction: UIAction(handler: { [weak self] _ in
            self?.tick()
            action()
        }))
        button.setTitle(title, for: .normal)
        button.titleLabel?.font = .systemFont(ofSize: 15, weight: .medium)
        button.titleLabel?.lineBreakMode = .byTruncatingTail
        let foreground = active ? readableColor(on: palette.accent) : UIColor(hex: palette.text)
        button.setTitleColor(foreground, for: .normal)
        let fill = active ? UIColor(hex: palette.accent) : keyFill()
        button.setBackgroundImage(colorImage(fill), for: .normal)
        button.setBackgroundImage(colorImage(blend(fill, UIColor(hex: palette.text), 0.18)), for: .highlighted)
        button.contentEdgeInsets = UIEdgeInsets(top: 0, left: 12, bottom: 0, right: 12)
        button.layer.cornerRadius = 16
        button.clipsToBounds = true
        button.heightAnchor.constraint(equalToConstant: 32).isActive = true
        button.widthAnchor.constraint(greaterThanOrEqualToConstant: 40).isActive = true
        button.setContentCompressionResistancePriority(.required, for: .horizontal)
        return button
    }

    // MARK: - Voice and translation

    /// Apple doesn't give add-on keyboards the microphone, so point people to the system dictation mic.
    private func voicePanel() -> UIView {
        let column = UIStackView()
        column.axis = .vertical
        column.alignment = .center
        column.spacing = 8
        column.isLayoutMarginsRelativeArrangement = true
        column.layoutMargins = UIEdgeInsets(top: 14, left: 16, bottom: 10, right: 16)
        let icon = UILabel()
        icon.text = "🎙 ↘"
        icon.font = .systemFont(ofSize: 30)
        column.addArrangedSubview(icon)
        let title = UILabel()
        title.text = "Tap the mic at the bottom right of your screen to speak"
        title.font = .systemFont(ofSize: 16, weight: .semibold)
        title.textColor = UIColor(hex: palette.text)
        title.textAlignment = .center
        title.numberOfLines = 2
        column.addArrangedSubview(title)
        let body = UILabel()
        body.text = "Apple doesn't let add-on keyboards use the microphone, so iPhone's own dictation does the listening."
        body.font = .systemFont(ofSize: 12)
        body.textColor = UIColor(hex: palette.secondary)
        body.textAlignment = .center
        body.numberOfLines = 3
        column.addArrangedSubview(body)
        return column
    }

    private func openTranslator() {
        if panel == .translate { panel = .none; rebuild(); return }
        let raw = textDocumentProxy.documentContextBeforeInput ?? ""
        translateSource = catalogue.plain(raw).trimmingCharacters(in: .whitespacesAndNewlines)
        translateResult = ""
        translateStatus = translateSource.isEmpty ? "Type your message first, then tap 文A." : ""
        panel = .translate
        rebuild()
        if !translateSource.isEmpty { runTranslation() }
    }

    private func translatePanel() -> UIView {
        let column = UIStackView()
        column.axis = .vertical
        column.spacing = 6
        column.isLayoutMarginsRelativeArrangement = true
        column.layoutMargins = UIEdgeInsets(top: 2, left: 4, bottom: 4, right: 4)

        let scroll = UIScrollView()
        scroll.showsHorizontalScrollIndicator = false
        scroll.heightAnchor.constraint(equalToConstant: 38).isActive = true
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
        for (code, name) in languages {
            chips.addArrangedSubview(chip(name, active: code == translateTarget) { [weak self] in
                guard let self else { return }
                self.translateTarget = code
                self.defaults.set(code, forKey: "translateTo")
                self.rebuild()
                if !self.translateSource.isEmpty { self.runTranslation() }
            })
        }
        column.addArrangedSubview(scroll)

        let result = UILabel()
        result.text = translateResult.isEmpty ? translateStatus : translateResult
        result.font = .systemFont(ofSize: 15)
        result.numberOfLines = 3
        result.textColor = UIColor(hex: palette.text)
        result.backgroundColor = keyFill()
        result.layer.cornerRadius = 10
        result.clipsToBounds = true
        result.heightAnchor.constraint(equalToConstant: 70).isActive = true
        translateResultLabel = result
        column.addArrangedSubview(result)

        let actions = UIStackView()
        actions.axis = .horizontal
        actions.spacing = 8
        actions.distribution = .fillEqually
        actions.addArrangedSubview(chip("Replace my text", active: true) { [weak self] in self?.useTranslation(replace: true) })
        actions.addArrangedSubview(chip("Add it", active: false) { [weak self] in self?.useTranslation(replace: false) })
        actions.alpha = translateResult.isEmpty ? 0 : 1
        translateActions = actions
        column.addArrangedSubview(actions)
        return column
    }

    private func showTranslation(_ result: String, _ status: String) {
        translateResult = result
        translateStatus = status
        translateResultLabel?.text = result.isEmpty ? status : result
        translateActions?.alpha = result.isEmpty ? 0 : 1
    }

    private func runTranslation() {
        let source = translateSource
        let recognizer = NLLanguageRecognizer()
        recognizer.processString(source)
        let detected = recognizer.dominantLanguage?.rawValue ?? "en"
        if detected.hasPrefix(translateTarget) || translateTarget.hasPrefix(detected) {
            showTranslation(source, "")
            return
        }
        showTranslation("", "Translating…")
        let target = translateTarget
        let targetName = languages.first { $0.0 == target }?.1 ?? target
        #if compiler(>=6.2)
        if #available(iOS 26.0, *) {
            Task { @MainActor in
                do {
                    let from = Locale.Language(identifier: detected)
                    let to = Locale.Language(identifier: target)
                    let status = await LanguageAvailability().status(from: from, to: to)
                    guard status == .installed else {
                        self.showTranslation("", status == .unsupported
                            ? "Apple can't translate this pair of languages yet."
                            : "Download \(targetName) first: Settings → Apps → Translate → Downloaded Languages.")
                        return
                    }
                    let session = TranslationSession(installedSource: from, target: to)
                    let response = try await session.translate(source)
                    if source == self.translateSource { self.showTranslation(response.targetText, "") }
                } catch {
                    self.showTranslation("", "Couldn't translate that. Try again.")
                }
            }
            return
        }
        #endif
        showTranslation("", "Translating in the keyboard needs iOS 26 or later.")
    }

    private func useTranslation(replace: Bool) {
        guard !translateResult.isEmpty else { return }
        if replace {
            let raw = textDocumentProxy.documentContextBeforeInput ?? ""
            for _ in 0..<raw.count { deleteBackward() }
        } else {
            textDocumentProxy.insertText("\n")
        }
        commit(translateResult)
        panel = .none
        rebuild()
    }

    // MARK: - Keys

    private func cap(_ title: String?, kind: CapKind) -> KeyCap {
        let key = KeyCap(inset: Self.keyInset)
        let base: UIColor
        switch kind {
        case .letter: base = keyFill()
        case .function: base = functionFill()
        case .accent: base = UIColor(hex: palette.accent)
        }
        key.fill = base
        key.pressedFill = blend(base, UIColor(hex: kind == .accent ? "#000000" : palette.text), 0.2)
        key.showsShadow = (palette.keyAlpha ?? 1) >= 1
        key.label.text = title
        key.label.font = .systemFont(ofSize: 23, weight: .regular)
        key.label.textColor = kind == .accent ? readableColor(on: palette.accent) : UIColor(hex: palette.text)
        key.accessibilityLabel = title
        key.accessibilityTraits = .keyboardKey
        return key
    }

    private func letterCap(_ letter: String) -> KeyCap {
        let key = cap(nil, kind: .letter)
        key.onDown = { [weak self] key in self?.letterDown(key, letter: letter) }
        key.onMove = { [weak self] _, point in self?.moveAlternates(to: point) }
        key.onUp = { [weak self] _, _ in self?.letterUp() }
        letterCaps.append((key, letter))
        return key
    }

    private func symbolCap(_ symbol: String) -> KeyCap {
        let key = cap(symbol, kind: .letter)
        key.onDown = { [weak self] key in
            guard let self else { return }
            self.tick()
            self.showPopup(over: key, text: self.catalogue.transform(symbol, styleId: self.effectiveStyleId()))
            self.commit(symbol)
        }
        key.onUp = { [weak self] _, _ in self?.hidePopup() }
        return key
    }

    private func deleteCap() -> KeyCap {
        let key = cap(nil, kind: .function)
        key.icon.image = UIImage(systemName: "delete.left", withConfiguration: UIImage.SymbolConfiguration(pointSize: 19, weight: .regular))
        key.icon.tintColor = UIColor(hex: palette.text)
        key.accessibilityLabel = "Delete"
        key.onDown = { [weak self] _ in
            guard let self else { return }
            self.tick()
            self.deleteBackward()
            self.deleteDelay?.invalidate()
            self.deleteDelay = Timer.scheduledTimer(withTimeInterval: 0.4, repeats: false) { [weak self] _ in
                self?.deleteTimer = Timer.scheduledTimer(withTimeInterval: 0.06, repeats: true) { [weak self] _ in self?.deleteBackward() }
            }
        }
        key.onUp = { [weak self] _, _ in
            self?.deleteDelay?.invalidate(); self?.deleteTimer?.invalidate()
            self?.deleteDelay = nil; self?.deleteTimer = nil
            self?.updateAutoShift()
        }
        return key
    }

    /// Relabels letters (shift + selected style) and the shift key, without rebuilding.
    private func updateLetterLabels() {
        let style = effectiveStyleId()
        let upper = shifted || capsLock
        for (key, letter) in letterCaps {
            let shown = upper ? letter.uppercased() : letter
            key.label.text = catalogue.transform(shown, styleId: style)
            key.accessibilityLabel = shown
        }
        guard let shift = shiftCap else { return }
        let name = capsLock ? "capslock.fill" : shifted ? "shift.fill" : "shift"
        shift.icon.image = UIImage(systemName: name, withConfiguration: UIImage.SymbolConfiguration(pointSize: 19, weight: .regular))
        let fill = capsLock ? UIColor(hex: palette.accent) : functionFill()
        shift.fill = fill
        shift.icon.tintColor = capsLock ? readableColor(on: palette.accent) : UIColor(hex: palette.text)
        shift.accessibilityLabel = capsLock ? "Caps lock on" : shifted ? "Shift on" : "Shift"
        shift.accessibilityHint = "Double tap for caps lock"
    }

    // MARK: - Pop-up preview and accents

    private func setUpPopup() {
        popup.isUserInteractionEnabled = false
        popup.isHidden = true
        popup.layer.cornerRadius = 10
        popup.layer.shadowColor = UIColor.black.cgColor
        popup.layer.shadowOpacity = 0.3
        popup.layer.shadowRadius = 4
        popup.layer.shadowOffset = CGSize(width: 0, height: 2)
        popupLabel.textAlignment = .center
        popupLabel.adjustsFontSizeToFitWidth = true
        popupLabel.minimumScaleFactor = 0.4
        popup.addSubview(popupLabel)
        alternatesStrip.axis = .horizontal
        alternatesStrip.distribution = .fillEqually
        alternatesStrip.isHidden = true
        popup.addSubview(alternatesStrip)
        view.addSubview(popup)
    }

    private func popupFill() -> UIColor {
        UIColor(hex: palette.key).withAlphaComponent(0.98)
    }

    private func showPopup(over key: KeyCap, text: String) {
        let frame = key.body.convert(key.body.bounds, to: view)
        let width = frame.width + 16
        let height = frame.height + 22
        var x = frame.midX - width / 2
        x = min(max(2, x), view.bounds.width - width - 2)
        let y = max(0, frame.maxY - height - frame.height * 0.55)
        popup.frame = CGRect(x: x, y: y, width: width, height: height)
        popup.backgroundColor = popupFill()
        popupLabel.frame = popup.bounds.insetBy(dx: 2, dy: 4)
        popupLabel.text = text
        popupLabel.font = .systemFont(ofSize: 32)
        popupLabel.textColor = UIColor(hex: palette.dark && (palette.keyAlpha ?? 1) < 1 ? "#22172F" : palette.text)
        popupLabel.isHidden = false
        alternatesStrip.isHidden = true
        popup.isHidden = false
        view.bringSubviewToFront(popup)
    }

    private func hidePopup() {
        popup.isHidden = true
        alternateTimer?.invalidate()
        alternateTimer = nil
        alternatesShowing = false
    }

    private func letterDown(_ key: KeyCap, letter: String) {
        tick()
        let shown = shifted || capsLock ? letter.uppercased() : letter
        let styled = catalogue.transform(shown, styleId: effectiveStyleId())
        showPopup(over: key, text: styled)
        insertedOnDown = styled
        commit(shown)
        let options = accentMap[letter] ?? []
        guard !options.isEmpty else { return }
        let upper = shifted || capsLock || shown != letter
        alternateTimer?.invalidate()
        alternateTimer = Timer.scheduledTimer(withTimeInterval: 0.42, repeats: false) { [weak self] _ in
            self?.showAlternates(over: key, options: options.map { upper ? $0.uppercased() : $0 })
        }
    }

    private func showAlternates(over key: KeyCap, options: [String]) {
        alternates = options
        alternateIndex = 0
        alternatesShowing = true
        let frame = key.body.convert(key.body.bounds, to: view)
        let cell: CGFloat = max(30, frame.width)
        let width = cell * CGFloat(options.count) + 8
        var x = frame.minX - 4
        x = min(max(2, x), view.bounds.width - width - 2)
        popup.frame = CGRect(x: x, y: popup.frame.minY, width: width, height: popup.frame.height)
        popupLabel.isHidden = true
        alternatesStrip.arrangedSubviews.forEach { $0.removeFromSuperview() }
        alternatesStrip.frame = popup.bounds.insetBy(dx: 4, dy: 6)
        for option in options {
            let label = UILabel()
            label.text = catalogue.transform(option, styleId: effectiveStyleId())
            label.textAlignment = .center
            label.font = .systemFont(ofSize: 24)
            label.layer.cornerRadius = 7
            label.clipsToBounds = true
            alternatesStrip.addArrangedSubview(label)
        }
        alternatesStrip.isHidden = false
        highlightAlternate()
        tick()
    }

    private func moveAlternates(to windowPoint: CGPoint) {
        guard alternatesShowing, !alternates.isEmpty else { return }
        let point = view.convert(windowPoint, from: nil)
        let local = point.x - popup.frame.minX - 4
        let cell = (popup.frame.width - 8) / CGFloat(alternates.count)
        let index = min(max(0, Int(local / cell)), alternates.count - 1)
        if index != alternateIndex {
            alternateIndex = index
            highlightAlternate()
            UISelectionFeedbackGenerator().selectionChanged()
        }
    }

    private func highlightAlternate() {
        for (index, view) in alternatesStrip.arrangedSubviews.enumerated() {
            guard let label = view as? UILabel else { continue }
            let selected = index == alternateIndex
            label.backgroundColor = selected ? UIColor(hex: palette.accent) : .clear
            label.textColor = selected ? readableColor(on: palette.accent) : popupLabel.textColor
        }
    }

    private func letterUp() {
        if alternatesShowing, alternates.indices.contains(alternateIndex) {
            // Swap the letter typed on touch-down for the chosen accent.
            for _ in 0..<max(1, insertedOnDown.count) { deleteBackward() }
            commit(alternates[alternateIndex])
        }
        hidePopup()
    }

    // MARK: - Typing

    private func isAvailable(_ style: TextStyle) -> Bool {
        style.worksInKeyboard && (isPro || !style.isPro)
    }

    private func effectiveStyleId() -> String {
        if normalMode || safeNormal { return "normal" }
        // A removed custom style (or one hidden without Full Access) falls back to Script.
        let style = catalogue.style(id: selectedStyle)
        return style.id == selectedStyle && isAvailable(style) ? selectedStyle : "script"
    }

    private func commit(_ raw: String) {
        textDocumentProxy.insertText(catalogue.transform(raw, styleId: effectiveStyleId()))
        updateAutoShift()
    }

    private func typeSpace() {
        let now = Date().timeIntervalSince1970
        let before = textDocumentProxy.documentContextBeforeInput ?? ""
        // Double-tap space: ". " like the built-in keyboard.
        if now - lastSpaceTap < 0.5, before.hasSuffix(" "), let previous = before.dropLast().last,
           previous.isLetter || previous.isNumber || previous.unicodeScalars.first.map({ $0.value > 0x2000 }) == true {
            textDocumentProxy.deleteBackward()
            textDocumentProxy.insertText(". ")
            lastSpaceTap = 0
        } else {
            textDocumentProxy.insertText(" ")
            lastSpaceTap = now
        }
        updateAutoShift()
    }

    private func slideCursor(to windowX: CGFloat) {
        let distance = windowX - spaceStartX
        if !spaceSliding && abs(distance) < 14 { return }
        spaceSliding = true
        let steps = Int(distance / 9)
        guard steps != 0 else { return }
        textDocumentProxy.adjustTextPosition(byCharacterOffset: steps)
        spaceStartX += CGFloat(steps) * 9
        UISelectionFeedbackGenerator().selectionChanged()
    }

    private func tapShift() {
        tick()
        let now = Date().timeIntervalSince1970
        if now - lastShiftTap < 0.3 {
            capsLock = true
            shifted = true
            lastShiftTap = 0
        } else {
            if capsLock { capsLock = false; shifted = false } else { shifted.toggle() }
            lastShiftTap = now
        }
        updateLetterLabels()
    }

    /// Capital letter at the start of a sentence, like the built-in keyboard.
    private func updateAutoShift() {
        guard !capsLock else { return }
        let type = textDocumentProxy.autocapitalizationType ?? .sentences
        let before = textDocumentProxy.documentContextBeforeInput ?? ""
        let should: Bool
        switch type {
        case .none: should = false
        case .allCharacters: should = true
        case .words: should = before.isEmpty || before.last?.isWhitespace == true
        default:
            let trimmed = before.trimmingCharacters(in: .whitespaces)
            let endsSentence = trimmed.last.map { ".!?\n".contains($0) } ?? true
            should = trimmed.isEmpty || before.last == "\n" || (before.last == " " && endsSentence)
        }
        if should != shifted {
            shifted = should
            updateLetterLabels()
        }
    }

    private func deleteBackward() {
        let proxy = textDocumentProxy
        // With text selected (e.g. after Select All), one delete removes just the selection.
        if let selected = proxy.selectedText, !selected.isEmpty {
            proxy.deleteBackward()
            return
        }
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

    private func tick() {
        UIDevice.current.playInputClick()
        UIImpactFeedbackGenerator(style: .light).impactOccurred(intensity: 0.6)
    }

    // MARK: - Picture themes, the person's photo and their own colours

    /// iOS only lets the keyboard read files and settings shared by the app when Full Access is on.
    private var sharedDefaults: UserDefaults? {
        hasFullAccess ? UserDefaults(suiteName: appGroup) : nil
    }

    private var photoURL: URL? {
        guard hasFullAccess,
              let container = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroup) else { return nil }
        let url = container.appendingPathComponent("keyboard_photo.jpg")
        return FileManager.default.fileExists(atPath: url.path) ? url : nil
    }

    /// White glass keys over the person's own photo.
    private var photoTheme: KeyboardPalette? {
        guard photoURL != nil else { return nil }
        return KeyboardPalette(
            id: "custom-photo", name: "Your photo", background: "#22172F", key: "#FFFFFF",
            text: "#FFFFFF", secondary: "#EDE6F0", accent: "#FF3D8B", dark: true,
            isPro: true, image: "@photo", keyAlpha: 0.22
        )
    }

    /// Colours the person mixed on the colour wheel in the app.
    private var customTheme: KeyboardPalette? {
        guard let json = sharedDefaults?.string(forKey: "customTheme"),
              let data = json.data(using: .utf8),
              let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let background = object["background"] as? String,
              let key = object["key"] as? String,
              let text = object["text"] as? String,
              let accent = object["accent"] as? String else { return nil }
        let alpha = object["keyAlpha"] as? Double ?? 1
        return KeyboardPalette(
            id: "custom-colors", name: "My colours", background: background, key: key,
            text: text, secondary: text, accent: accent, dark: luminance(background) < 0.5,
            isPro: true, image: nil, keyAlpha: alpha < 1 ? alpha : nil
        )
    }

    private func resolveTheme(id: String) -> KeyboardPalette {
        if id == "custom-photo" { return photoTheme ?? catalogue.theme(id: "pop-pink") }
        if id == "custom-colors" { return customTheme ?? catalogue.theme(id: "pop-pink") }
        return catalogue.theme(id: id)
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
        guard let url = imageURL(image) else { return nil }
        return Self.decode(url, maxPixels: maxPixels)
    }

    /// Decodes an image file at a reduced size. Safe to call off the main thread.
    private static func decode(_ url: URL, maxPixels: Int) -> UIImage? {
        guard let source = CGImageSourceCreateWithURL(url as CFURL, nil) else { return nil }
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
        var stamp: TimeInterval = 0
        let dim = sharedDefaults?.object(forKey: "photoDim") as? Double ?? 0.3
        if image == "@photo", let url = photoURL,
           let modified = try? FileManager.default.attributesOfItem(atPath: url.path)[.modificationDate] as? Date {
            stamp = modified.timeIntervalSince1970
        }
        let key = "\(palette.id):\(stamp):\(dim)"
        guard key != backgroundKey else { return }
        backgroundKey = key
        var picture = loadImage(image, maxPixels: 1200)
        if image == "@photo", let photo = picture {
            // Dim people's own photos (amount set in the app) so the keys stay readable.
            picture = UIGraphicsImageRenderer(size: photo.size).image { context in
                photo.draw(at: .zero)
                UIColor.black.withAlphaComponent(CGFloat(min(max(dim, 0), 0.8))).setFill()
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

    // MARK: - Colours

    /// Normal keys are see-through on picture themes.
    private func keyFill() -> UIColor {
        UIColor(hex: palette.key).withAlphaComponent(CGFloat(palette.keyAlpha ?? 1))
    }

    /// Shift, delete, 123: a shade between the keys and the text, like the built-in keyboard.
    private func functionFill() -> UIColor {
        if let alpha = palette.keyAlpha, alpha < 1 {
            return UIColor(hex: palette.key).withAlphaComponent(CGFloat(min(alpha + 0.14, 1)))
        }
        return blend(UIColor(hex: palette.key), UIColor(hex: palette.text), 0.13)
    }

    private func blend(_ base: UIColor, _ other: UIColor, _ amount: CGFloat) -> UIColor {
        var r1: CGFloat = 0, g1: CGFloat = 0, b1: CGFloat = 0, a1: CGFloat = 0
        var r2: CGFloat = 0, g2: CGFloat = 0, b2: CGFloat = 0, a2: CGFloat = 0
        guard base.getRed(&r1, green: &g1, blue: &b1, alpha: &a1),
              other.getRed(&r2, green: &g2, blue: &b2, alpha: &a2) else { return base }
        return UIColor(red: r1 + (r2 - r1) * amount, green: g1 + (g2 - g1) * amount, blue: b1 + (b2 - b1) * amount, alpha: a1)
    }

    private func colorImage(_ color: UIColor) -> UIImage {
        UIGraphicsImageRenderer(size: CGSize(width: 1, height: 1)).image { context in
            color.setFill()
            context.fill(CGRect(x: 0, y: 0, width: 1, height: 1))
        }
    }

    private func luminance(_ hexColor: String) -> Double {
        let hex = String(hexColor.dropFirst())
        var value: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&value)
        let red = Double((value >> 16) & 0xff) / 255
        let green = Double((value >> 8) & 0xff) / 255
        let blue = Double(value & 0xff) / 255
        return 0.2126 * red + 0.7152 * green + 0.0722 * blue
    }

    /// Plum ink on light accents, white on dark ones.
    private func readableColor(on hexColor: String) -> UIColor {
        luminance(hexColor) > 0.55 ? UIColor(hex: "#22172F") : UIColor(hex: "#FFFFFF")
    }
}

/// Lets `UIDevice.playInputClick()` make the standard key click (when the person has keyboard clicks on).
extension UIInputView: @retroactive UIInputViewAudioFeedback {
    public var enableInputClicksWhenVisible: Bool { true }
}
