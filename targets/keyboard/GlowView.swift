import UIKit

/// "Glow lights": a soft band of light that slowly travels around the keyboard's edge,
/// in the theme's colours, and flares a little on each key tap. Never takes touches.
/// Stays still when Reduce Motion is on.
final class GlowView: UIView {
    private let container = CALayer()
    private let gradient = CAGradientLayer()
    private let maskLayer = CALayer()
    private let strokes: [CAShapeLayer] = [CAShapeLayer(), CAShapeLayer(), CAShapeLayer()]
    private var colours: [UIColor] = [.systemPink, .systemPurple]

    override init(frame: CGRect) {
        super.init(frame: frame)
        isUserInteractionEnabled = false
        isAccessibilityElement = false
        gradient.type = .conic
        gradient.startPoint = CGPoint(x: 0.5, y: 0.5)
        gradient.endPoint = CGPoint(x: 0.5, y: 0)
        container.addSublayer(gradient)
        // Three strokes from wide and faint to thin and bright make the light look soft.
        for (stroke, (width, alpha)) in zip(strokes, [(11.0, 0.22), (5.5, 0.45), (2.2, 1.0)]) {
            stroke.fillColor = UIColor.clear.cgColor
            stroke.strokeColor = UIColor.black.withAlphaComponent(alpha).cgColor
            stroke.lineWidth = width
            maskLayer.addSublayer(stroke)
        }
        container.mask = maskLayer
        container.opacity = 0.8
        layer.addSublayer(container)
        NotificationCenter.default.addObserver(self, selector: #selector(motionChanged), name: UIAccessibility.reduceMotionStatusDidChangeNotification, object: nil)
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) is not used") }

    /// Accent plus a hue-shifted partner, so the light shimmers between two colours.
    func setAccent(_ accent: UIColor) {
        var hue: CGFloat = 0, saturation: CGFloat = 0, brightness: CGFloat = 0, alpha: CGFloat = 0
        accent.getHue(&hue, saturation: &saturation, brightness: &brightness, alpha: &alpha)
        let partner = UIColor(hue: (hue + 0.15).truncatingRemainder(dividingBy: 1), saturation: max(saturation, 0.45), brightness: max(brightness, 0.85), alpha: 1)
        colours = [accent, partner]
        let clear = accent.withAlphaComponent(0)
        gradient.colors = [accent, partner, clear, accent, partner, clear, accent].map(\.cgColor)
    }

    /// A short flare when a key is tapped.
    func pulse() {
        let flare = CABasicAnimation(keyPath: "opacity")
        flare.fromValue = 1
        flare.toValue = 0.8
        flare.duration = 0.45
        container.add(flare, forKey: "pulse")
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        container.frame = bounds
        maskLayer.frame = bounds
        // A square bigger than the keyboard, so the rotating colours always cover the edge.
        let side = hypot(bounds.width, bounds.height)
        gradient.bounds = CGRect(x: 0, y: 0, width: side, height: side)
        gradient.position = CGPoint(x: bounds.midX, y: bounds.midY)
        let path = UIBezierPath(roundedRect: bounds.insetBy(dx: 6, dy: 6), cornerRadius: 18).cgPath
        strokes.forEach { $0.frame = bounds; $0.path = path }
        CATransaction.commit()
        updateSpin()
    }

    override func didMoveToWindow() {
        super.didMoveToWindow()
        updateSpin()
    }

    override var isHidden: Bool {
        didSet { updateSpin() }
    }

    @objc private func motionChanged() { updateSpin() }

    private func updateSpin() {
        let shouldSpin = window != nil && !isHidden && !UIAccessibility.isReduceMotionEnabled
        if shouldSpin, gradient.animation(forKey: "spin") == nil {
            let spin = CABasicAnimation(keyPath: "transform.rotation.z")
            spin.fromValue = 0
            spin.toValue = CGFloat.pi * 2
            spin.duration = 7
            spin.repeatCount = .infinity
            spin.isRemovedOnCompletion = false
            gradient.add(spin, forKey: "spin")
        } else if !shouldSpin {
            gradient.removeAnimation(forKey: "spin")
        }
    }
}
