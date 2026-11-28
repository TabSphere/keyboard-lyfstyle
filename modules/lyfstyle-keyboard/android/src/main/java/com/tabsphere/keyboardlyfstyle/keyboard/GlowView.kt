package com.tabsphere.keyboardlyfstyle.keyboard

import android.animation.ValueAnimator
import android.annotation.SuppressLint
import android.content.Context
import android.graphics.BlurMaskFilter
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.SweepGradient
import android.view.View
import android.view.animation.LinearInterpolator

/**
 * "Glow lights": a soft band of light that slowly travels around the keyboard's edge,
 * in the theme's colours, and flares a little on each key tap. Draw-only (never takes
 * touches). Stays still when the phone has animations turned off.
 */
@SuppressLint("ViewConstructor")
class GlowView(context: Context) : View(context) {
    private val density = resources.displayMetrics.density
    private val rect = RectF()
    private val rotation = Matrix()
    private var angle = 0f
    private var boost = 0f
    private var gradient: SweepGradient? = null
    private var colours = intArrayOf(Color.MAGENTA, Color.CYAN)

    private val halo = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = 9 * density
        maskFilter = BlurMaskFilter(7 * density, BlurMaskFilter.Blur.NORMAL)
    }
    private val line = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = 2.2f * density
    }

    private val spin = ValueAnimator.ofFloat(0f, 360f).apply {
        duration = 7000
        repeatCount = ValueAnimator.INFINITE
        interpolator = LinearInterpolator()
        addUpdateListener {
            angle = it.animatedValue as Float
            boost = (boost - 0.04f).coerceAtLeast(0f)
            invalidate()
        }
    }

    init {
        // Blur needs a software layer; the view is small and only redraws its own edge.
        setLayerType(LAYER_TYPE_SOFTWARE, null)
        isClickable = false
        isFocusable = false
        importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_NO
    }

    /** Accent plus a hue-shifted partner, so the light shimmers between two colours. */
    fun setColours(accent: Int) {
        val hsv = FloatArray(3).also { Color.colorToHSV(accent, it) }
        val partner = Color.HSVToColor(floatArrayOf((hsv[0] + 55f) % 360f, hsv[1].coerceAtLeast(0.45f), hsv[2].coerceAtLeast(0.85f)))
        val clear = Color.argb(0, Color.red(accent), Color.green(accent), Color.blue(accent))
        colours = intArrayOf(accent, partner, clear, accent, partner, clear, accent)
        gradient = null
        invalidate()
    }

    /** A short flare when a key is tapped. */
    fun pulse() {
        boost = 1f
        if (!spin.isRunning) invalidate()
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        if (visibility == VISIBLE && animationsOn()) spin.start()
    }

    override fun onDetachedFromWindow() {
        spin.cancel()
        super.onDetachedFromWindow()
    }

    override fun onVisibilityChanged(changedView: View, visibility: Int) {
        super.onVisibilityChanged(changedView, visibility)
        if (visibility == VISIBLE && isAttachedToWindow && animationsOn()) {
            if (!spin.isRunning) spin.start()
        } else spin.cancel()
    }

    private fun animationsOn() = android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.O ||
        ValueAnimator.areAnimatorsEnabled()

    // Never ask for space of its own: the keyboard's height comes from the keys, and the
    // glow is then stretched to match it.
    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        val exact = { spec: Int -> if (MeasureSpec.getMode(spec) == MeasureSpec.EXACTLY) MeasureSpec.getSize(spec) else 0 }
        setMeasuredDimension(exact(widthMeasureSpec), exact(heightMeasureSpec))
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        gradient = null
    }

    override fun onDraw(canvas: Canvas) {
        if (width == 0 || height == 0) return
        val inset = 5 * density
        rect.set(inset, inset, width - inset, height - inset)
        val shader = gradient ?: SweepGradient(width / 2f, height / 2f, colours, null).also { gradient = it }
        rotation.setRotate(angle, width / 2f, height / 2f)
        shader.setLocalMatrix(rotation)
        halo.shader = shader
        line.shader = shader
        halo.alpha = (150 + 105 * boost).toInt().coerceAtMost(255)
        line.alpha = (200 + 55 * boost).toInt().coerceAtMost(255)
        val radius = 18 * density
        canvas.drawRoundRect(rect, radius, radius, halo)
        canvas.drawRoundRect(rect, radius, radius, line)
    }
}
