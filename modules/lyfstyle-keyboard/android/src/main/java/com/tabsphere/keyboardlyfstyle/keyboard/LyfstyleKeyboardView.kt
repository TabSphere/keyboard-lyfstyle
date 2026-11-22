package com.tabsphere.keyboardlyfstyle.keyboard

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Rect
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.GradientDrawable
import android.graphics.drawable.StateListDrawable
import android.icu.text.BreakIterator
import android.inputmethodservice.InputMethodService
import android.os.Handler
import android.os.Looper
import android.text.InputType
import android.text.TextUtils
import android.view.Gravity
import android.view.HapticFeedbackConstants
import android.view.View
import android.view.inputmethod.EditorInfo
import android.widget.Button
import android.widget.HorizontalScrollView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import java.io.File

/**
 * Lyfstyle keyboard (Pop Sugar). A style bar sits above the keys; the ☺ and 🎨
 * buttons swap the letter rows for the symbols panel or the theme picker.
 */
class LyfstyleKeyboardView(private val service: InputMethodService) : LinearLayout(service) {
    private enum class Panel { NONE, SYMBOLS, THEMES }

    private val preferences = service.getSharedPreferences("lyfstyle_keyboard", Context.MODE_PRIVATE)
    private val catalogue = StyleCatalogue(service)
    private val handler = Handler(Looper.getMainLooper())
    private val rows = LinearLayout(service).apply { orientation = VERTICAL }
    private var selectedStyle = preferences.getString("style", "script") ?: "script"
    private var normalMode = preferences.getBoolean("normalMode", false)
    private val photoFile = File(service.filesDir, "keyboard_photo.jpg")
    private var theme = resolveTheme(preferences.getString("theme", "pop-pink") ?: "pop-pink")
    private var backgroundKey: String? = null
    private var backgroundBitmap: Bitmap? = null
    private val thumbnails = mutableMapOf<String, Bitmap?>()
    private var panel = Panel.NONE
    private var shifted = true
    private var capsLock = false
    private var symbols = false
    private var secondarySymbols = false
    private var safeNormal = true
    private var deleteRepeating = false

    private val repeatDelete = object : Runnable {
        override fun run() {
            deleteLastGrapheme()
            if (deleteRepeating) handler.postDelayed(this, 55)
        }
    }

    private val letterRows = listOf(
        listOf("q", "w", "e", "r", "t", "y", "u", "i", "o", "p"),
        listOf("a", "s", "d", "f", "g", "h", "j", "k", "l"),
        listOf("z", "x", "c", "v", "b", "n", "m"),
    )
    private val numberRows = listOf(
        listOf("1", "2", "3", "4", "5", "6", "7", "8", "9", "0"),
        listOf("-", "/", ":", ";", "(", ")", "$", "&", "@", "\""),
        listOf(".", ",", "?", "!", "'", "’"),
    )
    private val symbolRows = listOf(
        listOf("[", "]", "{", "}", "#", "%", "^", "*", "+", "="),
        listOf("_", "\\", "|", "~", "<", ">", "€", "£", "¥", "•"),
        listOf(".", ",", "?", "!", "'", "…"),
    )

    // Symbols panel content: (title, items, items per row).
    private val symbolGroups = listOf(
        Triple("Hearts", listOf("♡", "♥", "❥", "❣", "💕", "💖", "🫶", "ღ", "𓆩♡𓆪", "ᥫ᭡"), 5),
        Triple("Stars", listOf("✦", "✧", "★", "☆", "⋆", "✩", "✨", "⋆｡˚", "✧･ﾟ", "彡"), 5),
        Triple("Cute", listOf("ʚ", "ɞ", "꒰", "꒱", "🎀", "🌸", "✿", "☁︎", "☾", "🦋"), 5),
        Triple("Arrows & lines", listOf("➜", "➳", "⇢", "↳", "⤷", "──────", "⋆⋅☆⋅⋆", "— ❧ —", "「 」", "꧁ ꧂"), 5),
        Triple("Kaomoji", listOf("(｡♡‿♡｡)", "ʕ•ᴥ•ʔ", "(◕‿◕✿)", "(づ｡◕‿‿◕｡)づ", "٩(◕‿◕)۶", "(≧◡≦)", "(⌐■_■)", "¯\\_(ツ)_/¯", "ฅ^•ﻌ•^ฅ", "(˘︶˘).｡*♡"), 2),
    )

    init {
        orientation = VERTICAL
        fitsSystemWindows = false
        rebuild()
    }

    fun onInputStarted(info: EditorInfo?) {
        safeNormal = requiresNormalInput(info)
        shifted = info?.inputType?.let { inputType ->
            inputType and InputType.TYPE_CLASS_TEXT != 0 &&
                inputType and InputType.TYPE_TEXT_FLAG_CAP_SENTENCES != 0
        } ?: true
        selectedStyle = preferences.getString("style", selectedStyle) ?: "script"
        if (!isAvailable(catalogue.style(selectedStyle))) {
            selectedStyle = "script"
            preferences.edit().putString("style", selectedStyle).apply()
        }
        normalMode = preferences.getBoolean("normalMode", normalMode)
        theme = resolveTheme(preferences.getString("theme", theme.id) ?: theme.id)
        panel = Panel.NONE
        rebuild()
    }

    private fun requiresNormalInput(info: EditorInfo?): Boolean {
        if (info == null) return true
        val type = info.inputType
        val variation = type and InputType.TYPE_MASK_VARIATION
        return when (type and InputType.TYPE_MASK_CLASS) {
            InputType.TYPE_CLASS_NUMBER, InputType.TYPE_CLASS_PHONE, InputType.TYPE_CLASS_DATETIME -> true
            InputType.TYPE_CLASS_TEXT -> variation == InputType.TYPE_TEXT_VARIATION_PASSWORD ||
                variation == InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD ||
                variation == InputType.TYPE_TEXT_VARIATION_WEB_PASSWORD ||
                variation == InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS ||
                variation == InputType.TYPE_TEXT_VARIATION_WEB_EMAIL_ADDRESS ||
                variation == InputType.TYPE_TEXT_VARIATION_URI
            else -> true
        }
    }

    private fun rebuild() {
        removeAllViews()
        applyBackground()
        setPadding(dp(5), dp(6), dp(5), dp(8))
        addView(createStyleBar())
        rows.removeAllViews()
        addView(rows, LayoutParams(LayoutParams.MATCH_PARENT, dp(196)))
        when (panel) {
            Panel.SYMBOLS -> rows.addView(symbolsPanel(), LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
            Panel.THEMES -> rows.addView(themesPanel(), LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
            Panel.NONE -> if (symbols) buildSymbolRows() else buildLetterRows()
        }
        addView(bottomRow(), LayoutParams(LayoutParams.MATCH_PARENT, dp(50)))
    }

    // ---- Themes and backgrounds ---------------------------------------------


    private fun resolveTheme(id: String): KeyboardPalette {
        val candidate = if (id == PHOTO_THEME.id) {
            if (photoFile.exists()) PHOTO_THEME else catalogue.theme("pop-pink")
        } else catalogue.theme(id)
        return if (candidate.isPro && !isPro()) catalogue.theme("pop-pink") else candidate
    }

    private fun themeOptions(): List<KeyboardPalette> =
        if (photoFile.exists()) listOf(PHOTO_THEME) + catalogue.themes else catalogue.themes

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        applyBackground()
    }

    private fun applyBackground() {
        val image = theme.image
        if (image == null || width == 0 || height == 0) {
            background = ColorDrawable(Color.parseColor(theme.background))
            return
        }
        val stamp = if (image == "@photo") photoFile.lastModified() else 0L
        val key = "${theme.id}:${width}x${height}:$stamp"
        if (key != backgroundKey) {
            backgroundBitmap?.recycle()
            backgroundBitmap = runCatching { loadCropped(image, width, height) }.getOrNull()
            backgroundKey = key
        }
        background = backgroundBitmap?.let { BitmapDrawable(resources, it) }
            ?: ColorDrawable(Color.parseColor(theme.background))
    }

    private fun openImage(image: String) =
        if (image == "@photo") photoFile.inputStream() else service.assets.open("themes/$image")

    /** Decodes just enough pixels, then centre-crops to the keyboard's size. */
    private fun loadCropped(image: String, targetWidth: Int, targetHeight: Int): Bitmap? {
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        openImage(image).use { BitmapFactory.decodeStream(it, null, bounds) }
        if (bounds.outWidth <= 0 || bounds.outHeight <= 0) return null
        var sample = 1
        while (bounds.outWidth / (sample * 2) >= targetWidth && bounds.outHeight / (sample * 2) >= targetHeight) sample *= 2
        val decoded = openImage(image).use {
            BitmapFactory.decodeStream(it, null, BitmapFactory.Options().apply { inSampleSize = sample })
        } ?: return null
        val scale = maxOf(targetWidth.toFloat() / decoded.width, targetHeight.toFloat() / decoded.height)
        val cropWidth = (targetWidth / scale).toInt().coerceAtMost(decoded.width)
        val cropHeight = (targetHeight / scale).toInt().coerceAtMost(decoded.height)
        val left = (decoded.width - cropWidth) / 2
        val top = (decoded.height - cropHeight) / 2
        val result = Bitmap.createBitmap(targetWidth, targetHeight, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(result)
        canvas.drawBitmap(decoded, Rect(left, top, left + cropWidth, top + cropHeight), Rect(0, 0, targetWidth, targetHeight), null)
        // Dim people's own photos a little so the keys stay readable.
        if (image == "@photo") canvas.drawColor(Color.argb(80, 0, 0, 0))
        decoded.recycle()
        return result
    }

    private fun thumbnail(image: String): Bitmap? = thumbnails.getOrPut(image) {
        runCatching {
            openImage(image).use { BitmapFactory.decodeStream(it, null, BitmapFactory.Options().apply { inSampleSize = 8 }) }
        }.getOrNull()
    }

    /** Normal keys are see-through on picture themes. */
    private fun keyFill(): Int {
        val base = Color.parseColor(theme.key)
        return Color.argb((theme.keyAlpha * 255).toInt().coerceIn(0, 255), Color.red(base), Color.green(base), Color.blue(base))
    }

    // ---- Style bar ---------------------------------------------------------

    private fun createStyleBar(): View {
        val bar = LinearLayout(context).apply { orientation = HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
        val scroll = HorizontalScrollView(context).apply { isHorizontalScrollBarEnabled = false }
        val chips = LinearLayout(context).apply { orientation = HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
        val recents = recentIds()
        val ordered = catalogue.keyboardStyles
            .filter { isAvailable(it) }
            .sortedBy { style -> recents.indexOf(style.id).let { if (it < 0) 100 else it } }
        val effective = effectiveStyleId()
        ordered.forEach { style ->
            val active = style.id == effective
            chips.addView(chip(catalogue.transform(style.name, style.id), active) {
                selectedStyle = style.id
                normalMode = false
                preferences.edit().putString("style", style.id).putBoolean("normalMode", false).apply()
                rememberRecent(style.id)
                panel = Panel.NONE
                rebuild()
            }.apply { contentDescription = "${style.name} style${if (active) ", selected" else ""}" })
        }
        scroll.addView(chips)
        bar.addView(scroll, LayoutParams(0, dp(44), 1f))
        bar.addView(chip(if (normalMode || safeNormal) "Aa ✓" else "Aa", normalMode || safeNormal) {
            if (!safeNormal) {
                normalMode = !normalMode
                preferences.edit().putBoolean("normalMode", normalMode).apply()
                rebuild()
            }
        }.apply {
            contentDescription = if (safeNormal) "Normal text required for this field" else "Toggle normal text"
            isEnabled = !safeNormal
        })
        bar.addView(chip("☺", panel == Panel.SYMBOLS) { togglePanel(Panel.SYMBOLS) }.apply { contentDescription = "Symbols and kaomoji" })
        bar.addView(chip("🎨", panel == Panel.THEMES) { togglePanel(Panel.THEMES) }.apply { contentDescription = "Keyboard themes. Current theme ${theme.name}" })
        return bar
    }

    private fun togglePanel(target: Panel) {
        panel = if (panel == target) Panel.NONE else target
        rebuild()
    }

    private fun chip(label: String, active: Boolean, action: () -> Unit): Button = Button(context).apply {
        text = label
        textSize = 14f
        isAllCaps = false
        maxLines = 1
        ellipsize = TextUtils.TruncateAt.END
        includeFontPadding = false
        stateListAnimator = null
        setPadding(dp(12), 0, dp(12), 0)
        minWidth = dp(44); minimumWidth = dp(44)
        minHeight = dp(34); minimumHeight = dp(34)
        val fill = if (active) Color.parseColor(theme.accent) else keyFill()
        setTextColor(if (active) readableOn(theme.accent) else Color.parseColor(theme.text))
        background = StateListDrawable().apply {
            addState(intArrayOf(android.R.attr.state_pressed), pill(shiftColor(fill, 0.86f)))
            addState(intArrayOf(), pill(fill))
        }
        setOnClickListener { performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP); action() }
        layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, dp(34)).apply { setMargins(dp(3), 0, dp(3), 0) }
    }

    // ---- Panels ------------------------------------------------------------

    private fun symbolsPanel(): View {
        val scroll = ScrollView(context).apply { isVerticalScrollBarEnabled = false }
        val column = LinearLayout(context).apply { orientation = VERTICAL; setPadding(0, dp(2), 0, dp(2)) }
        symbolGroups.forEach { (title, items, perRow) ->
            column.addView(sectionLabel(title))
            items.chunked(perRow).forEach { chunk ->
                val row = keyRow()
                chunk.forEach { item -> row.addView(key(item, 1f, textSizeOverride = if (perRow <= 2) 14f else 18f) { commitRaw(item) }) }
                repeat(perRow - chunk.size) { row.addView(View(context), LayoutParams(0, 1, 1f)) }
                column.addView(row, LayoutParams(LayoutParams.MATCH_PARENT, dp(44)))
            }
        }
        scroll.addView(column)
        return scroll
    }

    private fun themesPanel(): View {
        val scroll = ScrollView(context).apply { isVerticalScrollBarEnabled = false }
        val column = LinearLayout(context).apply { orientation = VERTICAL; setPadding(0, dp(2), 0, dp(2)) }
        column.addView(sectionLabel(if (isPro()) "Pick a theme" else "Pick a theme · 🔒 unlock more with Lifetime Pro in the app"))
        themeOptions().chunked(3).forEach { chunk ->
            val row = keyRow()
            chunk.forEach { option -> row.addView(themeSwatch(option)) }
            column.addView(row, LayoutParams(LayoutParams.MATCH_PARENT, dp(52)))
        }
        scroll.addView(column)
        return scroll
    }

    private fun themeSwatch(option: KeyboardPalette): Button {
        val locked = option.isPro && !isPro()
        val active = option.id == theme.id
        return Button(context).apply {
            text = "${if (locked) "🔒 " else if (active) "✓ " else ""}${option.name}"
            textSize = 12f
            isAllCaps = false
            maxLines = 1
            stateListAnimator = null
            setTextColor(Color.parseColor(option.text))
            val picture = option.image?.let { thumbnail(it) }
            background = if (picture != null) {
                BitmapDrawable(resources, picture)
            } else GradientDrawable().apply {
                cornerRadius = dp(12).toFloat()
                setColor(Color.parseColor(option.background))
                setStroke(dp(if (active) 3 else 1), if (active) Color.parseColor(option.accent) else Color.parseColor(option.key))
            }
            if (picture != null) setShadowLayer(4f, 0f, 1f, Color.argb(160, 0, 0, 0))
            alpha = if (locked) 0.6f else 1f
            contentDescription = "${option.name} theme${if (locked) ", Pro" else ""}${if (active) ", selected" else ""}"
            setOnClickListener {
                if (locked) return@setOnClickListener
                performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                theme = option
                preferences.edit().putString("theme", option.id).apply()
                panel = Panel.NONE
                rebuild()
            }
            layoutParams = LayoutParams(0, LayoutParams.MATCH_PARENT, 1f).apply { setMargins(dp(3), dp(3), dp(3), dp(3)) }
        }
    }

    private fun sectionLabel(title: String) = TextView(context).apply {
        text = title.uppercase()
        textSize = 10f
        letterSpacing = 0.08f
        setTextColor(Color.parseColor(theme.secondary))
        setPadding(dp(6), dp(8), dp(6), dp(2))
    }

    // ---- Keys ----------------------------------------------------------------

    private fun buildLetterRows() {
        letterRows.forEachIndexed { index, letters ->
            val row = keyRow()
            if (index == 2) row.addView(key(if (capsLock) "⇪" else "⇧", 1.35f, accent = shifted || capsLock) {
                shifted = if (capsLock) false else !shifted
                capsLock = false
                rebuild()
            }.apply {
                setOnLongClickListener {
                    capsLock = !capsLock; shifted = capsLock; rebuild(); true
                }
                contentDescription = "Shift. Long press for caps lock."
            })
            letters.forEach { letter ->
                row.addView(key(letterLabel(letter), 1f) { commitText(letterLabel(letter)) })
            }
            if (index == 2) row.addView(deleteKey())
            rows.addView(row, LayoutParams(LayoutParams.MATCH_PARENT, 0, 1f))
        }
    }

    private fun buildSymbolRows() {
        val source = if (secondarySymbols) symbolRows else numberRows
        source.forEachIndexed { index, symbolsInRow ->
            val row = keyRow()
            if (index == 2) row.addView(key(if (secondarySymbols) "123" else "#+=", 1.4f) {
                secondarySymbols = !secondarySymbols; rebuild()
            })
            symbolsInRow.forEach { symbol -> row.addView(key(symbol, 1f) { commitText(symbol) }) }
            if (index == 2) row.addView(deleteKey())
            rows.addView(row, LayoutParams(LayoutParams.MATCH_PARENT, 0, 1f))
        }
    }

    private fun bottomRow(): View {
        val row = keyRow()
        val label = when {
            panel != Panel.NONE -> "ABC"
            symbols -> "ABC"
            else -> "123"
        }
        row.addView(key(label, 1.25f) {
            if (panel != Panel.NONE) panel = Panel.NONE else { symbols = !symbols; secondarySymbols = false }
            rebuild()
        })
        row.addView(key("🌐", 1.05f) {
            service.switchToNextInputMethod(false)
        }.apply { contentDescription = "Switch to next keyboard" })
        row.addView(key("lyfstyle", 4.5f, secondaryText = true) { commitText(" ") }.apply { contentDescription = "Space" })
        row.addView(key(".", 0.8f) { commitText(".") })
        if (panel != Panel.NONE) row.addView(deleteKey())
        row.addView(key("↵", 1.35f, accent = true) {
            val info = service.currentInputEditorInfo
            val action = info?.imeOptions?.and(EditorInfo.IME_MASK_ACTION) ?: EditorInfo.IME_ACTION_NONE
            if (action != EditorInfo.IME_ACTION_NONE && action != EditorInfo.IME_ACTION_UNSPECIFIED) {
                service.currentInputConnection?.performEditorAction(action)
            } else commitRaw("\n")
        }.apply { contentDescription = "Return" })
        return row
    }

    private fun keyRow() = LinearLayout(context).apply {
        orientation = HORIZONTAL
        gravity = Gravity.CENTER
        setPadding(0, dp(2), 0, dp(2))
    }

    private fun key(
        label: String,
        weight: Float,
        accent: Boolean = false,
        secondaryText: Boolean = false,
        textSizeOverride: Float? = null,
        action: () -> Unit,
    ): Button {
        return Button(context).apply {
            text = label
            textSize = textSizeOverride ?: if (label.length > 6) 12f else 18f
            isAllCaps = false
            gravity = Gravity.CENTER
            maxLines = 1
            includeFontPadding = false
            setTextColor(
                when {
                    accent -> readableOn(theme.accent)
                    secondaryText -> Color.parseColor(theme.secondary)
                    else -> Color.parseColor(theme.text)
                },
            )
            setPadding(dp(2), 0, dp(2), 0)
            minHeight = dp(42); minimumHeight = dp(42)
            val fill = if (accent) Color.parseColor(theme.accent) else keyFill()
            background = StateListDrawable().apply {
                addState(intArrayOf(android.R.attr.state_pressed), roundedKey(shiftColor(fill, 0.86f)))
                addState(intArrayOf(), roundedKey(fill))
            }
            stateListAnimator = null
            setOnClickListener { performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP); action() }
            layoutParams = LayoutParams(0, LayoutParams.MATCH_PARENT, weight).apply {
                setMargins(dp(2), dp(2), dp(2), dp(2))
            }
        }
    }

    private fun roundedKey(fill: Int) = GradientDrawable().apply {
        cornerRadius = dp(10).toFloat()
        setColor(fill)
    }

    private fun pill(fill: Int) = GradientDrawable().apply {
        cornerRadius = dp(17).toFloat()
        setColor(fill)
    }

    private fun shiftColor(color: Int, factor: Float): Int = Color.argb(
        Color.alpha(color),
        (Color.red(color) * factor).toInt().coerceIn(0, 255),
        (Color.green(color) * factor).toInt().coerceIn(0, 255),
        (Color.blue(color) * factor).toInt().coerceIn(0, 255),
    )

    /** Plum ink on light accents, white on dark ones. */
    private fun readableOn(hex: String): Int {
        val color = Color.parseColor(hex)
        val luminance = (0.2126 * Color.red(color) + 0.7152 * Color.green(color) + 0.0722 * Color.blue(color)) / 255
        return if (luminance > 0.55) Color.parseColor("#22172F") else Color.WHITE
    }

    private fun deleteKey(): Button = key("⌫", 1.35f) { deleteLastGrapheme() }.apply {
        contentDescription = "Delete previous visible character. Hold to repeat."
        setOnLongClickListener {
            if (!deleteRepeating) {
                deleteRepeating = true
                handler.postDelayed(repeatDelete, 380)
            }
            true
        }
        setOnTouchListener { _, event ->
            if (event.action == android.view.MotionEvent.ACTION_UP || event.action == android.view.MotionEvent.ACTION_CANCEL) {
                stopKeyRepeat()
            }
            false
        }
    }

    private fun letterLabel(letter: String): String = if (shifted || capsLock) letter.uppercase() else letter

    private fun isAvailable(style: TextStyle) = style.keyboard && (isPro() || !style.isPro)

    private fun effectiveStyleId(): String {
        if (normalMode || safeNormal) return "normal"
        return if (!isAvailable(catalogue.style(selectedStyle))) "script" else selectedStyle
    }

    private fun commitText(raw: String) {
        val styled = catalogue.transform(raw, effectiveStyleId())
        service.currentInputConnection?.commitText(styled, 1)
        if (raw.length == 1 && raw[0].isLetter() && shifted && !capsLock) {
            shifted = false
            rebuild()
        }
    }

    /** Symbols, kaomoji and new lines are inserted exactly as shown. */
    private fun commitRaw(text: String) {
        service.currentInputConnection?.commitText(text, 1)
    }

    fun deleteLastGrapheme() {
        val connection = service.currentInputConnection ?: return
        val before = connection.getTextBeforeCursor(256, 0) ?: return
        if (before.isEmpty()) return
        val text = before.toString()
        val iterator = BreakIterator.getCharacterInstance()
        iterator.setText(text)
        val end = iterator.last()
        val start = iterator.previous()
        val length = if (start != BreakIterator.DONE && end > start) end - start else {
            val point = text.codePointBefore(text.length)
            Character.charCount(point)
        }
        connection.deleteSurroundingText(length, 0)
    }

    private fun isPro() = preferences.getBoolean("proUnlocked", false)
    private fun recentIds() = (preferences.getString("recents", "") ?: "").split(',').filter { it.isNotBlank() }
    private fun rememberRecent(id: String) {
        val updated = (listOf(id) + recentIds().filter { it != id }).take(6)
        preferences.edit().putString("recents", updated.joinToString(",")).apply()
    }

    fun stopKeyRepeat() {
        deleteRepeating = false
        handler.removeCallbacks(repeatDelete)
    }

    private companion object {
        /** The person's own photo as a theme: white glass keys over a slightly dimmed picture. */
        val PHOTO_THEME = KeyboardPalette(
            id = "custom-photo", name = "Your photo", background = "#22172F", key = "#FFFFFF",
            text = "#FFFFFF", secondary = "#EDE6F0", accent = "#FF3D8B", dark = true, isPro = true,
            image = "@photo", keyAlpha = 0.22f,
        )
    }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()
}
