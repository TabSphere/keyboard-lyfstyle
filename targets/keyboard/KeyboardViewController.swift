import UIKit
import StoreKit

final class KeyboardViewController: UIInputViewController {
    private let catalogue = StyleCatalogue.shared
    private let defaults = UserDefaults.standard
    private let appGroup = "group.com.tabsphere.keyboardlyfstyle"
    private let productId = "com.tabsphere.keyboardlyfstyle.pro"
    private let root = UIStackView()
    private var heightConstraint: NSLayoutConstraint?
    private var selectedStyle = UserDefaults.standard.string(forKey: "style") ?? "script"
    private var normalMode = UserDefaults.standard.bool(forKey: "normalMode")
    private var favouritesOnly = false
    private var drawerVisible = false
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

    override init(nibName nibNameOrNil: String?, bundle nibBundleOrNil: Bundle?) {
        palette = StyleCatalogue.shared.theme(id: UserDefaults.standard.string(forKey: "theme") ?? "porcelain")
        super.init(nibName: nibNameOrNil, bundle: nibBundleOrNil)
    }

    required init?(coder: NSCoder) {
        palette = StyleCatalogue.shared.theme(id: UserDefaults.standard.string(forKey: "theme") ?? "porcelain")
        super.init(coder: coder)
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(hex: palette.background)
        root.axis = .vertical
        root.spacing = 4
        root.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(root)
        NSLayoutConstraint.activate([
            root.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 5),
            root.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -5),
            root.topAnchor.constraint(equalTo: view.topAnchor, constant: 5),
            root.bottomAnchor.constraint(equalTo: view.bottomAnchor, constant: -5),
        ])
        heightConstraint = view.heightAnchor.constraint(equalToConstant: 292)
        heightConstraint?.priority = .defaultHigh
        heightConstraint?.isActive = true
        rebuild()
        Task { await refreshEntitlement() }
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
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

    private func refreshEntitlement() async {
        let direct = await readVerifiedStoreKitEntitlement()
        let shared = hasFullAccess && UserDefaults(suiteName: appGroup)?.bool(forKey: "proUnlocked") == true
        let unlocked = direct || shared
        if !unlocked && catalogue.style(id: selectedStyle).isPro {
            selectedStyle = "script"
            defaults.set(selectedStyle, forKey: "style")
        }
        defaults.set(direct ? "storekit" : shared ? "app-group" : "none", forKey: "entitlementLastSource")
        defaults.set(Date().timeIntervalSince1970, forKey: "entitlementLastChecked")
        if unlocked != isPro {
            isPro = unlocked
            rebuild()
        } else {
            isPro = unlocked
        }
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

    private func rebuild() {
        root.arrangedSubviews.forEach { root.removeArrangedSubview($0); $0.removeFromSuperview() }
        view.backgroundColor = UIColor(hex: palette.background)
        root.addArrangedSubview(toolbar())
        if drawerVisible { root.addArrangedSubview(styleDrawer()) }
        let source = symbols ? (secondarySymbols ? moreSymbols : numbers) : letters
        for (index, values) in source.enumerated() {
            let row = rowStack()
            if index == 2 {
                if symbols {
                    row.addArrangedSubview(key(secondarySymbols ? "123" : "#+=", accent: false) { [weak self] in
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
            root.addArrangedSubview(row)
        }
        root.addArrangedSubview(bottomRow())
    }

    private func toolbar() -> UIView {
        let row = rowStack()
        row.distribution = .fill
        let effectiveStyle = effectiveStyleId()
        let styleName = effectiveStyle == "normal" ? "Normal Text" : catalogue.style(id: effectiveStyle).name
        let styleButton = key(styleName, accent: drawerVisible) { [weak self] in
            self?.drawerVisible.toggle(); self?.rebuild()
        }
        styleButton.accessibilityLabel = "Choose typing style. Current style \(styleName)"
        row.addArrangedSubview(styleButton)
        let normal = key(normalMode || safeNormal ? "Aa ✓" : "Aa", accent: normalMode || safeNormal) { [weak self] in
            guard let self, !self.safeNormal else { return }
            self.normalMode.toggle()
            self.defaults.set(self.normalMode, forKey: "normalMode")
            self.rebuild()
        }
        normal.isEnabled = !safeNormal
        normal.accessibilityLabel = safeNormal ? "Normal text required for this field" : "Toggle normal text"
        row.addArrangedSubview(normal)
        let favourite = favourites().contains(selectedStyle)
        let favouriteButton = key(favourite ? "Remove from favourites" : "Add to favourites", systemImage: favourite ? "star.fill" : "star") { [weak self] in self?.toggleFavourite() }
        row.addArrangedSubview(favouriteButton)
        let themeButton = key("Keyboard theme \(palette.name). Tap for next theme", systemImage: "paintpalette") { [weak self] in self?.cycleTheme() }
        row.addArrangedSubview(themeButton)
        NSLayoutConstraint.activate([
            styleButton.widthAnchor.constraint(equalTo: row.widthAnchor, multiplier: 0.42),
            normal.widthAnchor.constraint(equalTo: row.widthAnchor, multiplier: 0.18),
            favouriteButton.widthAnchor.constraint(equalTo: row.widthAnchor, multiplier: 0.14),
            themeButton.widthAnchor.constraint(equalTo: row.widthAnchor, multiplier: 0.16),
        ])
        return row
    }

    private func styleDrawer() -> UIView {
        let container = UIStackView()
        container.axis = .vertical
        container.spacing = 3
        let scroll = UIScrollView()
        scroll.showsHorizontalScrollIndicator = false
        scroll.heightAnchor.constraint(equalToConstant: 56).isActive = true
        let list = UIStackView()
        list.axis = .horizontal
        list.spacing = 5
        list.translatesAutoresizingMaskIntoConstraints = false
        scroll.addSubview(list)
        NSLayoutConstraint.activate([
            list.leadingAnchor.constraint(equalTo: scroll.contentLayoutGuide.leadingAnchor),
            list.trailingAnchor.constraint(equalTo: scroll.contentLayoutGuide.trailingAnchor),
            list.topAnchor.constraint(equalTo: scroll.contentLayoutGuide.topAnchor),
            list.bottomAnchor.constraint(equalTo: scroll.contentLayoutGuide.bottomAnchor),
            list.heightAnchor.constraint(equalTo: scroll.frameLayoutGuide.heightAnchor),
        ])
        let available = catalogue.data.styles.filter { $0.id != "normal" && (isPro || !$0.isPro) }
        let ordered = available.sorted { first, second in
            let recents = recentIds()
            let firstIndex = recents.firstIndex(of: first.id) ?? 100
            let secondIndex = recents.firstIndex(of: second.id) ?? 100
            return firstIndex == secondIndex ? first.name < second.name : firstIndex < secondIndex
        }
        let visible = ordered.filter { !favouritesOnly || favourites().contains($0.id) }
        for style in visible {
            let sample = catalogue.transform("Aa", styleId: style.id)
            let button = key("\(sample)\n\(style.name)", accent: style.id == selectedStyle && !normalMode) { [weak self] in
                self?.selectStyle(style.id)
            }
            button.titleLabel?.numberOfLines = 2
            button.titleLabel?.textAlignment = .center
            button.titleLabel?.font = .systemFont(ofSize: 11, weight: .medium)
            button.widthAnchor.constraint(equalToConstant: 116).isActive = true
            list.addArrangedSubview(button)
        }
        if visible.isEmpty {
            let label = UILabel()
            label.text = "No saved styles yet"
            label.font = .systemFont(ofSize: 14)
            label.textColor = UIColor(hex: palette.secondary)
            list.addArrangedSubview(label)
        }
        container.addArrangedSubview(scroll)
        container.addArrangedSubview(key(favouritesOnly ? "Show all styles" : "Favourites only") { [weak self] in
            self?.favouritesOnly.toggle(); self?.rebuild()
        })
        return container
    }

    private func bottomRow() -> UIView {
        let row = rowStack()
        row.distribution = .fill
        let numbersButton = key(symbols ? "ABC" : "123") { [weak self] in
            self?.symbols.toggle(); self?.secondarySymbols = false; self?.rebuild()
        }
        row.addArrangedSubview(numbersButton)
        let next = key("Next keyboard", systemImage: "globe") { [weak self] in self?.advanceToNextInputMode() }
        next.isHidden = !needsInputModeSwitchKey
        row.addArrangedSubview(next)
        let space = key("space") { [weak self] in self?.commit(" ") }
        row.addArrangedSubview(space)
        let period = key(".") { [weak self] in self?.commit(".") }
        row.addArrangedSubview(period)
        let returnButton = key("Return", accent: true, systemImage: "return") { [weak self] in self?.commit("\n") }
        row.addArrangedSubview(returnButton)
        NSLayoutConstraint.activate([
            numbersButton.widthAnchor.constraint(equalTo: row.widthAnchor, multiplier: 0.13),
            next.widthAnchor.constraint(equalTo: row.widthAnchor, multiplier: 0.13),
            space.widthAnchor.constraint(equalTo: row.widthAnchor, multiplier: 0.40),
            period.widthAnchor.constraint(equalTo: row.widthAnchor, multiplier: 0.09),
            returnButton.widthAnchor.constraint(equalTo: row.widthAnchor, multiplier: 0.15),
        ])
        return row
    }

    private func rowStack() -> UIStackView {
        let row = UIStackView()
        row.axis = .horizontal
        row.distribution = .fillEqually
        row.spacing = 4
        row.heightAnchor.constraint(equalToConstant: drawerVisible ? 38 : 43).isActive = true
        return row
    }

    private func key(_ title: String, accent: Bool = false, systemImage: String? = nil, action: @escaping () -> Void) -> UIButton {
        let button = UIButton(type: .system, primaryAction: UIAction(handler: { _ in
            UISelectionFeedbackGenerator().selectionChanged()
            action()
        }))
        let foreground = accent ? accentTextColor() : UIColor(hex: palette.text)
        if let systemImage {
            let configuration = UIImage.SymbolConfiguration(pointSize: 16, weight: .medium)
            button.setImage(UIImage(systemName: systemImage, withConfiguration: configuration), for: .normal)
            button.tintColor = foreground
        } else {
            button.setTitle(title, for: .normal)
        }
        button.titleLabel?.font = .systemFont(ofSize: title.count > 6 ? 12 : 16, weight: .medium)
        button.titleLabel?.lineBreakMode = .byTruncatingTail
        let fill = UIColor(hex: accent ? palette.accent : palette.key)
        button.setBackgroundImage(colorImage(fill), for: .normal)
        button.setBackgroundImage(colorImage(highlighted(fill)), for: .highlighted)
        button.setTitleColor(foreground, for: .normal)
        button.setTitleColor(foreground, for: .highlighted)
        button.layer.cornerRadius = 9
        button.clipsToBounds = true
        button.accessibilityLabel = title
        button.heightAnchor.constraint(greaterThanOrEqualToConstant: 38).isActive = true
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

    private func accentTextColor() -> UIColor {
        let hex = String(palette.accent.dropFirst())
        var value: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&value)
        let red = Double((value >> 16) & 0xff) / 255
        let green = Double((value >> 8) & 0xff) / 255
        let blue = Double(value & 0xff) / 255
        let luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue
        return luminance > 0.36 ? UIColor(hex: "#1D1D1B") : UIColor(hex: "#FCFAF5")
    }

    private func effectiveStyleId() -> String {
        if normalMode || safeNormal { return "normal" }
        return catalogue.style(id: selectedStyle).isPro && !isPro ? "script" : selectedStyle
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
        defaults.set(id, forKey: "style")
        defaults.set(false, forKey: "normalMode")
        let updated = [id] + recentIds().filter { $0 != id }
        defaults.set(Array(updated.prefix(6)), forKey: "recents")
        rebuild()
    }

    private func toggleFavourite() {
        var saved = favourites()
        if saved.contains(selectedStyle) { saved.removeAll { $0 == selectedStyle } } else { saved.append(selectedStyle) }
        defaults.set(saved, forKey: "favourites")
        rebuild()
    }

    private func cycleTheme() {
        let themes = catalogue.data.themes
        let index = themes.firstIndex { $0.id == palette.id } ?? 0
        palette = themes[(index + 1) % themes.count]
        defaults.set(palette.id, forKey: "theme")
        rebuild()
    }

    private func favourites() -> [String] { defaults.stringArray(forKey: "favourites") ?? [] }
    private func recentIds() -> [String] { defaults.stringArray(forKey: "recents") ?? [] }
}
