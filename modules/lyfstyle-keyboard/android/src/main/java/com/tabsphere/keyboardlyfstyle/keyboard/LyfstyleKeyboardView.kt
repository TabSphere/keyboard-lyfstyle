package com.tabsphere.keyboardlyfstyle.keyboard

import android.content.Context
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.icu.text.BreakIterator
import android.inputmethodservice.InputMethodService
import android.os.Handler
import android.os.Looper
import android.text.InputType
import android.view.Gravity
import android.view.HapticFeedbackConstants
import android.view.View
import android.view.inputmethod.EditorInfo
import android.widget.Button
import android.widget.HorizontalScrollView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView

class LyfstyleKeyboardView(private val service: InputMethodService) : LinearLayout(service) {
    private val preferences = service.getSharedPreferences("lyfstyle_keyboard", Context.MODE_PRIVATE)
    private val catalogue = StyleCatalogue(service)
    private val handler = Handler(Looper.getMainLooper())
    private val rows = LinearLayout(service).apply { orientation = VERTICAL }
    private var drawer: LinearLayout? = null
    private var selectedStyle = preferences.getString("style", "script") ?: "script"
    private var normalMode = preferences.getBoolean("normalMode", false)
    private var favouritesOnly = false
    private var theme = catalogue.theme(preferences.getString("theme", "porcelain") ?: "porcelain")
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
        if (!isPro() && catalogue.style(selectedStyle).isPro) {
            selectedStyle = "script"
            preferences.edit().putString("style", selectedStyle).apply()
        }
        normalMode = preferences.getBoolean("normalMode", normalMode)
        theme = catalogue.theme(preferences.getString("theme", theme.id) ?: theme.id)
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
        setBackgroundColor(Color.parseColor(theme.background))
        setPadding(dp(5), dp(5), dp(5), dp(8))
        addView(createToolbar())
        if (drawer != null) addView(createStyleDrawer())
        rows.removeAllViews()
        addView(rows, LayoutParams(LayoutParams.MATCH_PARENT, 0, 1f))
        if (symbols) buildSymbolRows() else buildLetterRows()
        buildBottomRow()
        minimumHeight = dp(270)
    }

    private fun createToolbar(): View {
        val bar = LinearLayout(context).apply { orientation = HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
        val effectiveStyle = effectiveStyleId()
        val activeName = if (effectiveStyle == "normal") "Normal Text" else catalogue.style(effectiveStyle).name
        bar.addView(key(activeName, 2.4f, accent = drawer != null) {
            drawer = if (drawer == null) LinearLayout(context) else null
            rebuild()
        }.apply { contentDescription = "Choose typing style. Current style $activeName" })
        bar.addView(key(if (normalMode) "Normal ✓" else "Aa", 1.1f, accent = normalMode || safeNormal) {
            if (!safeNormal) {
                normalMode = !normalMode
                preferences.edit().putBoolean("normalMode", normalMode).apply()
                rebuild()
            }
        }.apply {
            contentDescription = if (safeNormal) "Normal text required for this field" else "Toggle normal text"
            isEnabled = !safeNormal
        })
        val isFavourite = favouriteIds().contains(selectedStyle)
        bar.addView(key(if (isFavourite) "★" else "☆", 0.8f) {
            val favourites = favouriteIds().toMutableSet()
            if (!favourites.add(selectedStyle)) favourites.remove(selectedStyle)
            preferences.edit().putStringSet("favourites", favourites).apply()
            rebuild()
        }.apply { contentDescription = if (isFavourite) "Remove current style from favourites" else "Favourite current style" })
        bar.addView(key(theme.name, 1.2f) {
            val themes = catalogue.themes
            theme = themes[(themes.indexOfFirst { it.id == theme.id } + 1) % themes.size]
            preferences.edit().putString("theme", theme.id).apply()
            rebuild()
        }.apply { contentDescription = "Keyboard theme ${theme.name}. Tap for next theme." })
        return bar
    }

    private fun createStyleDrawer(): View {
        val container = LinearLayout(context).apply { orientation = VERTICAL }
        val scroll = HorizontalScrollView(context).apply { isHorizontalScrollBarEnabled = false }
        val list = LinearLayout(context).apply { orientation = HORIZONTAL }
        val favourites = favouriteIds()
        val available = catalogue.styles.filter { it.id != "normal" && (isPro() || !it.isPro) }
        val ordered = available.sortedByDescending { recentIds().indexOf(it.id).let { index -> if (index < 0) -100 else 100 - index } }
        val visible = ordered.filter { !favouritesOnly || favourites.contains(it.id) }
        if (visible.isEmpty()) {
            list.addView(TextView(context).apply {
                text = "No saved styles yet. Tap the star to save one."
                setTextColor(Color.parseColor(theme.secondary)); textSize = 14f; setPadding(dp(16), dp(16), dp(16), dp(16))
            })
        }
        visible.forEach { style ->
            list.addView(key(style.name, 0f, accent = style.id == selectedStyle && !normalMode) {
                selectedStyle = style.id
                normalMode = false
                preferences.edit().putString("style", style.id).putBoolean("normalMode", false).apply()
                rememberRecent(style.id)
                rebuild()
            }.apply {
                layoutParams = LayoutParams(dp(112), dp(46)).apply { setMargins(dp(3), dp(3), dp(3), dp(3)) }
                contentDescription = "${style.name} style${if (favourites.contains(style.id)) ", favourite" else ""}"
            })
        }
        scroll.addView(list)
        container.addView(scroll)
        container.addView(key(if (favouritesOnly) "Show all styles" else "Favourites only", 0f) {
            favouritesOnly = !favouritesOnly
            rebuild()
        }.apply { layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, dp(38)) })
        drawer = container
        return container
    }

    private fun buildLetterRows() {
        letterRows.forEachIndexed { index, letters ->
            val row = keyRow()
            if (index == 2) row.addView(key(if (capsLock) "CAPS" else "Shift", 1.45f, accent = shifted || capsLock) {
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

    private fun buildBottomRow() {
        val row = keyRow()
        row.addView(key(if (symbols) "ABC" else "123", 1.25f) {
            symbols = !symbols; secondarySymbols = false; rebuild()
        })
        row.addView(key("Next", 1.15f) {
            service.switchToNextInputMethod(false)
        }.apply { contentDescription = "Switch to next keyboard" })
        row.addView(key("space", 4.4f) { commitText(" ") })
        row.addView(key(".", 0.85f) { commitText(".") })
        row.addView(key("return", 1.5f, accent = true) {
            val info = service.currentInputEditorInfo
            val action = info?.imeOptions?.and(EditorInfo.IME_MASK_ACTION) ?: EditorInfo.IME_ACTION_NONE
            if (action != EditorInfo.IME_ACTION_NONE && action != EditorInfo.IME_ACTION_UNSPECIFIED) {
                service.currentInputConnection?.performEditorAction(action)
            } else commitText("\n")
        })
        rows.addView(row, LayoutParams(LayoutParams.MATCH_PARENT, 0, 1f))
    }

    private fun keyRow() = LinearLayout(context).apply {
        orientation = HORIZONTAL
        gravity = Gravity.CENTER
        setPadding(0, dp(2), 0, dp(2))
    }

    private fun key(label: String, weight: Float, accent: Boolean = false, action: () -> Unit): Button {
        return Button(context).apply {
            text = label
            textSize = if (label.length > 6) 12f else 16f
            isAllCaps = false
            setTextColor(Color.parseColor(if (accent && theme.id != "mono") theme.background else theme.text))
            setPadding(dp(1), 0, dp(1), 0)
            minHeight = dp(46); minimumHeight = dp(46)
            background = GradientDrawable().apply {
                cornerRadius = dp(9).toFloat()
                setColor(Color.parseColor(if (accent) theme.accent else theme.key))
            }
            stateListAnimator = null
            setOnClickListener { performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP); action() }
            layoutParams = LayoutParams(0, LayoutParams.MATCH_PARENT, weight).apply {
                setMargins(dp(2), dp(2), dp(2), dp(2))
            }
        }
    }

    private fun deleteKey(): Button = key("delete", 1.45f) { deleteLastGrapheme() }.apply {
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

    private fun effectiveStyleId(): String {
        if (normalMode || safeNormal) return "normal"
        return if (!isPro() && catalogue.style(selectedStyle).isPro) "script" else selectedStyle
    }

    private fun commitText(raw: String) {
        val styled = catalogue.transform(raw, effectiveStyleId())
        service.currentInputConnection?.commitText(styled, 1)
        if (raw.length == 1 && raw[0].isLetter() && shifted && !capsLock) {
            shifted = false
            rebuild()
        }
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
    private fun favouriteIds() = preferences.getStringSet("favourites", emptySet()) ?: emptySet()
    private fun recentIds() = (preferences.getString("recents", "") ?: "").split(',').filter { it.isNotBlank() }
    private fun rememberRecent(id: String) {
        val updated = (listOf(id) + recentIds().filter { it != id }).take(6)
        preferences.edit().putString("recents", updated.joinToString(",")).apply()
    }

    fun stopKeyRepeat() {
        deleteRepeating = false
        handler.removeCallbacks(repeatDelete)
    }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()
}
