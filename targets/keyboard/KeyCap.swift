import UIKit

/// One key. The whole cell is touchable (no dead gaps between keys); the visible
/// key body is inset inside it. Callbacks fire straight from touch tracking, so a
/// letter can be typed the moment a finger lands instead of when it lifts.
final class KeyCap: UIControl {
    let body = UIView()
    let label = UILabel()
    let icon = UIImageView()

    var fill: UIColor = .white { didSet { refresh() } }
    var pressedFill: UIColor = .lightGray { didSet { refresh() } }
    var showsShadow = true { didSet { body.layer.shadowOpacity = showsShadow ? 0.25 : 0 } }

    /// Finger down on the key.
    var onDown: ((KeyCap) -> Void)?
    /// Finger moved; the point is in window coordinates.
    var onMove: ((KeyCap, CGPoint) -> Void)?
    /// Finger lifted (true when it lifted on or near the key) or the touch was cancelled (false).
    var onUp: ((KeyCap, Bool) -> Void)?
    /// Click and buzz the instant any key is touched (set once by the keyboard).
    static var pressFeedback: (() -> Void)?

    /// Extra touch area beside the visible key, in key widths. The outer keys of a short
    /// row (A, L, Z, M...) reach into the gap, so a tap there still types. The cell's
    /// width already includes this padding.
    var padStart: CGFloat = 0 { didSet { setNeedsLayout() } }
    var padEnd: CGFloat = 0 { didSet { setNeedsLayout() } }
    private let inset: UIEdgeInsets
    private var leadingEdge: NSLayoutConstraint!
    private var trailingEdge: NSLayoutConstraint!

    init(inset: UIEdgeInsets) {
        self.inset = inset
        super.init(frame: .zero)
        isExclusiveTouch = false
        body.isUserInteractionEnabled = false
        body.layer.cornerRadius = 9
        body.layer.cornerCurve = .continuous
        body.layer.shadowColor = UIColor.black.cgColor
        body.layer.shadowOffset = CGSize(width: 0, height: 1)
        body.layer.shadowRadius = 0
        body.layer.shadowOpacity = 0.25
        body.translatesAutoresizingMaskIntoConstraints = false
        addSubview(body)

        label.textAlignment = .center
        label.adjustsFontSizeToFitWidth = true
        label.minimumScaleFactor = 0.45
        label.baselineAdjustment = .alignCenters
        label.translatesAutoresizingMaskIntoConstraints = false
        body.addSubview(label)

        icon.contentMode = .center
        icon.translatesAutoresizingMaskIntoConstraints = false
        body.addSubview(icon)

        leadingEdge = body.leadingAnchor.constraint(equalTo: leadingAnchor, constant: inset.left)
        trailingEdge = body.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -inset.right)
        NSLayoutConstraint.activate([
            leadingEdge,
            trailingEdge,
            body.topAnchor.constraint(equalTo: topAnchor, constant: inset.top),
            body.bottomAnchor.constraint(equalTo: bottomAnchor, constant: -inset.bottom),
            label.leadingAnchor.constraint(equalTo: body.leadingAnchor, constant: 2),
            label.trailingAnchor.constraint(equalTo: body.trailingAnchor, constant: -2),
            label.centerYAnchor.constraint(equalTo: body.centerYAnchor),
            icon.centerXAnchor.constraint(equalTo: body.centerXAnchor),
            icon.centerYAnchor.constraint(equalTo: body.centerYAnchor),
        ])
        refresh()
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) is not used") }

    override var isHighlighted: Bool { didSet { refresh() } }

    override func layoutSubviews() {
        let cell = bounds.width / (1 + padStart + padEnd)
        let lead = inset.left + cell * padStart
        let trail = -(inset.right + cell * padEnd)
        if leadingEdge.constant != lead { leadingEdge.constant = lead }
        if trailingEdge.constant != trail { trailingEdge.constant = trail }
        super.layoutSubviews()
        body.layer.shadowPath = UIBezierPath(roundedRect: body.bounds, cornerRadius: body.layer.cornerRadius).cgPath
    }

    private func refresh() {
        body.backgroundColor = isHighlighted ? pressedFill : fill
    }

    override func beginTracking(_ touch: UITouch, with event: UIEvent?) -> Bool {
        Self.pressFeedback?()
        onDown?(self)
        return true
    }

    override func continueTracking(_ touch: UITouch, with event: UIEvent?) -> Bool {
        onMove?(self, touch.location(in: nil))
        return true
    }

    override func endTracking(_ touch: UITouch?, with event: UIEvent?) {
        super.endTracking(touch, with: event)
        let inside = touch.map { bounds.insetBy(dx: -24, dy: -24).contains($0.location(in: self)) } ?? false
        onUp?(self, inside)
    }

    /// VoiceOver and Switch Control: activating the key presses and releases it, so it
    /// types like a tap.
    override func accessibilityActivate() -> Bool {
        Self.pressFeedback?()
        onDown?(self)
        onUp?(self, true)
        return true
    }

    override func cancelTracking(with event: UIEvent?) {
        super.cancelTracking(with: event)
        onUp?(self, false)
    }
}
