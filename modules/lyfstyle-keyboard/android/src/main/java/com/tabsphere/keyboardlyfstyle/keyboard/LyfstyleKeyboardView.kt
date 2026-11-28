package com.tabsphere.keyboardlyfstyle.keyboard

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.provider.Settings
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Rect
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.GradientDrawable
import android.graphics.drawable.StateListDrawable
import android.media.AudioManager
import android.icu.text.BreakIterator
import android.inputmethodservice.InputMethodService
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.text.InputType
import android.text.TextUtils
import android.view.Gravity
import android.view.HapticFeedbackConstants
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import android.view.WindowInsets
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputMethodManager
import android.widget.Button
import android.widget.FrameLayout
import android.widget.HorizontalScrollView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import com.google.mlkit.common.model.DownloadConditions
import com.google.mlkit.nl.languageid.LanguageIdentification
import com.google.mlkit.nl.translate.TranslateLanguage
import com.google.mlkit.nl.translate.Translation
import com.google.mlkit.nl.translate.TranslatorOptions
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import kotlin.math.abs

/**
 * Lyfstyle keyboard (Pop Sugar). A style bar sits above the keys; the 😊 and 🎨
 * buttons swap the letter rows for the emoji & symbols panel or the theme picker.
 * While typing, the bar shows word suggestions in the chosen font instead of font chips.
 *
 * Typing feel: letters go in the moment a finger lands, with a pop-up preview.
 * Holding a letter shows accents (and the number on the top row). Key labels are
 * drawn in the selected style, so the keyboard shows what it will type.
 */
@SuppressLint("ViewConstructor")
class LyfstyleKeyboardView(private val service: InputMethodService) : FrameLayout(service) {
    private enum class Panel { NONE, FONTS, SYMBOLS, THEMES, VOICE, TRANSLATE }
    private enum class CapKind { LETTER, FUNCTION, ACCENT }

    private val preferences = service.getSharedPreferences("lyfstyle_keyboard", Context.MODE_PRIVATE)
    private val catalogue = StyleCatalogue(service)
    private val handler = Handler(Looper.getMainLooper())
    private val column = LinearLayout(service).apply { orientation = LinearLayout.VERTICAL }
    private val rows = LinearLayout(service).apply { orientation = LinearLayout.VERTICAL }
    private var selectedStyle = preferences.getString("style", "script") ?: "script"
    private var normalMode = preferences.getBoolean("normalMode", false)
    private val photoFile = File(service.filesDir, "keyboard_photo.jpg")

    // Word suggestions, emoji and glow lights.
    private val extras: JSONObject? = runCatching {
        JSONObject(service.assets.open("extras.json").bufferedReader().use { it.readText() })
    }.getOrNull()
    private val suggester: WordSuggester = runCatching { WordSuggester.fromJson(extras.toString()) }
        .getOrElse { WordSuggester(emptyList(), emptyMap()) }
    private val emojiGroups: List<Pair<String, List<String>>> = runCatching {
        val groups = extras?.getJSONArray("emoji") ?: JSONArray()
        (0 until groups.length()).map { index ->
            val group = groups.getJSONArray(index)
            val items = group.getJSONArray(1)
            group.getString(0) to (0 until items.length()).map { items.getString(it) }
        }
    }.getOrElse { emptyList() }
    private var stripScroll: View? = null
    private var suggestRow: LinearLayout? = null
    private var suggestion = WordSuggester.Result("", emptyList())
    private var unsavedLearning = 0
    private val glow = GlowView(service)
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
    private var lastShiftTap = 0L
    private var lastSpaceTap = 0L

    // Live key references, so shift and style changes relabel keys without a rebuild.
    private val letterCaps = mutableListOf<Pair<KeyCap, String>>()
    private var shiftCap: KeyCap? = null

    // Pop-up preview and the long-press accent strip.
    private val popup = TextView(service)
    private val alternatesStrip = LinearLayout(service).apply { orientation = LinearLayout.HORIZONTAL }
    private var alternates = listOf<String>()
    private var alternateIndex = 0
    private var alternatesShowing = false
    private var insertedOnDown = ""
    private val showAlternatesLater = Runnable { pendingAlternates?.invoke() }
    private var pendingAlternates: (() -> Unit)? = null

    // Voice typing (Android's own speech recogniser).
    private var recognizer: SpeechRecognizer? = null
    private var voiceText = ""
    private var voiceStatus = ""
    private var voiceLabel: TextView? = null
    private var voiceStatusLabel: TextView? = null

    // Translator (Google ML Kit, on the phone).
    private var translateTarget = preferences.getString("translateTo", "es") ?: "es"
    private var translateSource = ""
    private var translateResult = ""
    private var translateStatus = ""
    private var translateResultLabel: TextView? = null
    private var translateActions: View? = null
    private val languages = listOf(
        "es" to "Spanish", "fr" to "French", "pt" to "Portuguese", "de" to "German", "it" to "Italian",
        "ar" to "Arabic", "hi" to "Hindi", "zh" to "Chinese", "ja" to "Japanese", "ko" to "Korean",
        "tr" to "Turkish", "nl" to "Dutch", "pl" to "Polish", "sw" to "Swahili", "en" to "English",
    )

    // Sliding on the space bar moves the cursor.
    private var spaceStartX = 0f
    private var spaceSliding = false
    // Holding space opens the keyboard picker (replaces the 🌐 key that sat next to 123).
    private var spaceHeld = false
    private val spaceHold = Runnable {
        if (!spaceSliding) {
            spaceHeld = true
            (context.getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager)?.showInputMethodPicker()
        }
    }

    /**
     * Height of the system navigation / gesture bar under the keyboard. On Android 15+
     * the keyboard window reaches under it, and taps there go to the system instead of
     * the keys, so the bottom row is lifted above it.
     */
    private var navigationInset = 0

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

    /** Hold a key for these. Top-row letters offer their number first. */
    private val accentMap = mapOf(
        "q" to listOf("1"), "w" to listOf("2"), "e" to listOf("3", "è", "é", "ê", "ë", "ē", "ę"),
        "r" to listOf("4"), "t" to listOf("5"), "y" to listOf("6", "ÿ", "ý"),
        "u" to listOf("7", "ù", "ú", "û", "ü", "ū"), "i" to listOf("8", "ì", "í", "î", "ï", "ī"),
        "o" to listOf("9", "ò", "ó", "ô", "ö", "õ", "ø", "œ"), "p" to listOf("0"),
        "a" to listOf("à", "á", "â", "ä", "æ", "ã", "å", "ā"), "s" to listOf("ß", "ś", "š"),
        "l" to listOf("ł"), "z" to listOf("ž", "ź", "ż"), "c" to listOf("ç", "ć", "č"), "n" to listOf("ñ", "ń"),
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
        fitsSystemWindows = false
        addView(column, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT))
        addView(glow, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
        suggester.importLearned(preferences.getString("learnedWords", null))
        popup.apply {
            visibility = GONE
            gravity = Gravity.CENTER
            textSize = 28f
            maxLines = 1
            includeFontPadding = false
            elevation = dp(6).toFloat()
        }
        alternatesStrip.apply {
            visibility = GONE
            elevation = dp(6).toFloat()
            setPadding(dp(4), dp(6), dp(4), dp(6))
        }
        addView(popup, LayoutParams(dp(50), dp(64)))
        addView(alternatesStrip, LayoutParams(LayoutParams.WRAP_CONTENT, dp(64)))
        setOnApplyWindowInsetsListener { _, insets ->
            val bottom = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
                insets.getInsets(WindowInsets.Type.navigationBars()).bottom
            } else {
                @Suppress("DEPRECATION") insets.systemWindowInsetBottom
            }
            if (bottom != navigationInset) {
                navigationInset = bottom
                column.setPadding(dp(3), dp(6), dp(3), dp(6) + navigationInset)
            }
            insets
        }
        rebuild()
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        requestApplyInsets()
    }

    fun onInputStarted(info: EditorInfo?) {
        safeNormal = requiresNormalInput(info)
        catalogue.loadCustom(preferences.getString("customStyles", null))
        selectedStyle = preferences.getString("style", selectedStyle) ?: "script"
        if (!isAvailable(catalogue.style(selectedStyle))) {
            selectedStyle = "script"
            preferences.edit().putString("style", selectedStyle).apply()
        }
        normalMode = preferences.getBoolean("normalMode", normalMode)
        theme = resolveTheme(preferences.getString("theme", theme.id) ?: theme.id)
        // "Forget my words" in the app.
        val forgetAt = preferences.getLong("forgetWordsAt", 0L)
        if (forgetAt > preferences.getLong("forgotWordsAt", 0L)) {
            suggester.forgetLearned()
            preferences.edit().remove("learnedWords").putLong("forgotWordsAt", forgetAt).apply()
        }
        panel = Panel.NONE
        capsLock = false
        rebuild()
        updateAutoShift()
    }

    /** Called when the cursor moves (also after each letter), so capitals and suggestions follow. */
    fun onSelectionChanged() {
        updateAutoShift()
        refreshSuggestions()
    }

    /** Saves learned words when the keyboard closes (and every few words). */
    fun saveLearning() {
        if (unsavedLearning == 0) return
        unsavedLearning = 0
        preferences.edit().putString("learnedWords", suggester.exportLearned()).apply()
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
        if (panel != Panel.VOICE) stopVoice()
        hidePopup()
        letterCaps.clear()
        shiftCap = null
        column.removeAllViews()
        applyBackground()
        column.setPadding(dp(3), dp(6), dp(3), dp(6) + navigationInset)
        column.addView(createStyleBar(), LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, dp(44)))
        rows.removeAllViews()
        column.addView(rows, LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, dp(ROW_HEIGHT * 3)))
        when (panel) {
            Panel.FONTS -> rows.addView(fontsPanel(), LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
            Panel.SYMBOLS -> rows.addView(symbolsPanel(), LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
            Panel.THEMES -> rows.addView(themesPanel(), LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
            Panel.VOICE -> rows.addView(voicePanel(), LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
            Panel.TRANSLATE -> rows.addView(translatePanel(), LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
            Panel.NONE -> if (symbols) buildSymbolRows() else buildLetterRows()
        }
        column.addView(bottomRow(), LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, dp(ROW_HEIGHT)))
        glow.setColours(Color.parseColor(theme.accent))
        glow.visibility = if (glowOn()) VISIBLE else GONE
        glow.bringToFront()
        popup.bringToFront()
        alternatesStrip.bringToFront()
    }

    // ---- Themes and backgrounds ---------------------------------------------

    private fun resolveTheme(id: String): KeyboardPalette {
        val candidate = when (id) {
            PHOTO_THEME.id -> if (photoFile.exists()) PHOTO_THEME else catalogue.theme("pop-pink")
            CUSTOM_ID -> customTheme() ?: catalogue.theme("pop-pink")
            else -> catalogue.theme(id)
        }
        return if (candidate.isPro && !isPro()) catalogue.theme("pop-pink") else candidate
    }

    /** Colours the person mixed on the colour wheel in the app. */
    private fun customTheme(): KeyboardPalette? = runCatching {
        val json = JSONObject(preferences.getString("customTheme", null) ?: return null)
        val background = json.getString("background")
        val text = json.getString("text")
        KeyboardPalette(
            id = CUSTOM_ID, name = "My colours", background = background, key = json.getString("key"),
            text = text, secondary = text, accent = json.getString("accent"),
            dark = luminance(background) < 0.5, isPro = true,
            keyAlpha = json.optDouble("keyAlpha", 1.0).toFloat(),
        )
    }.getOrNull()

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
        val dim = preferences.getFloat("photoDim", 0.3f)
        val key = "${theme.id}:${width}x${height}:$stamp:$dim"
        if (key != backgroundKey) {
            backgroundBitmap?.recycle()
            backgroundBitmap = runCatching { loadCropped(image, width, height, dim) }.getOrNull()
            backgroundKey = key
        }
        background = backgroundBitmap?.let { BitmapDrawable(resources, it) }
            ?: ColorDrawable(Color.parseColor(theme.background))
    }

    private fun openImage(image: String) =
        if (image == "@photo") photoFile.inputStream() else service.assets.open("themes/$image")

    /** Decodes just enough pixels, then centre-crops to the keyboard's size. */
    private fun loadCropped(image: String, targetWidth: Int, targetHeight: Int, dim: Float): Bitmap? {
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
        // Dim people's own photos (amount set in the app) so the keys stay readable.
        if (image == "@photo") canvas.drawColor(Color.argb((dim.coerceIn(0f, 0.8f) * 255).toInt(), 0, 0, 0))
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

    /** Shift, delete, 123: a shade between the keys and the text, like the built-in keyboard. */
    private fun functionFill(): Int {
        val base = Color.parseColor(theme.key)
        if (theme.keyAlpha < 1f) {
            val alpha = ((theme.keyAlpha + 0.14f).coerceAtMost(1f) * 255).toInt()
            return Color.argb(alpha, Color.red(base), Color.green(base), Color.blue(base))
        }
        return blend(base, Color.parseColor(theme.text), 0.13f)
    }

    private fun blend(base: Int, other: Int, amount: Float): Int = Color.argb(
        Color.alpha(base),
        (Color.red(base) + (Color.red(other) - Color.red(base)) * amount).toInt(),
        (Color.green(base) + (Color.green(other) - Color.green(base)) * amount).toInt(),
        (Color.blue(base) + (Color.blue(other) - Color.blue(base)) * amount).toInt(),
    )

    // ---- Style bar ---------------------------------------------------------

    private fun createStyleBar(): View {
        val bar = LinearLayout(context).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
        val scroll = HorizontalScrollView(context).apply { isHorizontalScrollBarEnabled = false }
        val chips = LinearLayout(context).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
        // Only recent fonts live in the bar; the Fonts button opens every font, grouped.
        val effective = effectiveStyleId()
        val ordered = barStyles(effective)
        bar.addView(chip(if (panel == Panel.FONTS) "Fonts ▴" else "Fonts ▾", panel == Panel.FONTS) { togglePanel(Panel.FONTS) }.apply { contentDescription = "All fonts" })
        ordered.forEach { style ->
            val active = style.id == effective
            chips.addView(chip(catalogue.transform(style.name, style.id), active) { selectStyle(style.id) }.apply { contentDescription = "${style.name} style${if (active) ", selected" else ""}" })
        }
        scroll.addView(chips)
        bar.addView(scroll, LinearLayout.LayoutParams(0, dp(44), 1f))
        val suggestions = LinearLayout(context).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL; visibility = GONE }
        bar.addView(suggestions, LinearLayout.LayoutParams(0, dp(44), 1f))
        stripScroll = scroll
        suggestRow = suggestions
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
        bar.addView(chip("文A", panel == Panel.TRANSLATE) { openTranslator() }.apply { contentDescription = "Translate your message" })
        bar.addView(chip("😊", panel == Panel.SYMBOLS) { togglePanel(Panel.SYMBOLS) }.apply { contentDescription = "Emoji, symbols and kaomoji" })
        bar.addView(chip("🎨", panel == Panel.THEMES) { togglePanel(Panel.THEMES) }.apply { contentDescription = "Keyboard themes. Current theme ${theme.name}" })
        post { refreshSuggestions() }
        return bar
    }

    // ---- Word suggestions --------------------------------------------------

    private fun suggestionsOn() = preferences.getBoolean("suggestions", true)

    private fun currentSuggestions(): WordSuggester.Result {
        val none = WordSuggester.Result("", emptyList())
        if (panel != Panel.NONE || safeNormal || symbols || !suggestionsOn()) return none
        val connection = service.currentInputConnection ?: return none
        if (!connection.getSelectedText(0).isNullOrEmpty()) return none
        val before = connection.getTextBeforeCursor(80, 0)?.toString() ?: return none
        return suggester.suggest(catalogue.plain(before, effectiveStyleId()))
    }

    /** Shows suggestions in place of the font chips while a word is being typed. */
    private fun refreshSuggestions() {
        val row = suggestRow ?: return
        val scroll = stripScroll ?: return
        suggestion = currentSuggestions()
        row.removeAllViews()
        if (suggestion.words.isEmpty()) {
            row.visibility = GONE
            scroll.visibility = VISIBLE
            return
        }
        scroll.visibility = GONE
        row.visibility = VISIBLE
        val style = effectiveStyleId()
        suggestion.words.forEachIndexed { index, word ->
            if (index > 0) row.addView(View(context).apply {
                setBackgroundColor(blend(Color.parseColor(theme.secondary), Color.TRANSPARENT, 0.5f))
            }, LinearLayout.LayoutParams(dp(1), dp(20)))
            row.addView(TextView(context).apply {
                text = catalogue.transform(word, style)
                textSize = 16f
                maxLines = 1
                ellipsize = TextUtils.TruncateAt.END
                gravity = Gravity.CENTER
                setTextColor(Color.parseColor(theme.text))
                if (index == 0) setTypeface(typeface, android.graphics.Typeface.BOLD)
                contentDescription = "Suggestion: $word"
                background = StateListDrawable().apply {
                    addState(intArrayOf(android.R.attr.state_pressed), pill(keyFill()))
                    addState(intArrayOf(), ColorDrawable(Color.TRANSPARENT))
                }
                isClickable = true
                setOnClickListener { tick(this); pickSuggestion(word) }
            }, LinearLayout.LayoutParams(0, dp(36), 1f))
        }
    }

    /** Swaps the half-typed word (in whatever font it was typed) for the chosen one, plus a space. */
    private fun pickSuggestion(word: String) {
        val connection = service.currentInputConnection ?: return
        val before = connection.getTextBeforeCursor(80, 0)?.toString() ?: ""
        val plain = catalogue.plain(before, effectiveStyleId())
        val previous = previousWord(plain.dropLast(WordSuggester.trailingWord(plain).length))
        connection.beginBatchEdit()
        if (suggestion.partial.isNotEmpty()) connection.deleteSurroundingText(styledTailLength(before), 0)
        connection.commitText(catalogue.transform(word, effectiveStyleId()) + " ", 1)
        connection.endBatchEdit()
        learnWord(word, previous)
        updateAutoShift()
    }

    /** Length (in UTF-16 units) of the styled letters right before the cursor. */
    private fun styledTailLength(before: String): Int {
        val iterator = BreakIterator.getCharacterInstance()
        iterator.setText(before)
        var end = iterator.last()
        var length = 0
        while (end > 0) {
            val start = iterator.previous()
            if (start == BreakIterator.DONE) break
            val plain = catalogue.plain(before.substring(start, end), effectiveStyleId())
            if (plain.isEmpty() || !plain.all { WordSuggester.isWordChar(it) }) break
            length += end - start
            end = start
        }
        return length
    }

    /** The word before the cursor's word, if it's in the same sentence. */
    private fun previousWord(plainBefore: String): String? {
        val trimmed = plainBefore.trimEnd()
        if (trimmed.isEmpty() || !WordSuggester.isWordChar(trimmed.last())) return null
        return WordSuggester.trailingWord(trimmed).ifEmpty { null }
    }

    private fun learnWord(word: String, previous: String?) {
        if (safeNormal || !suggestionsOn()) return
        suggester.learn(word, previous)
        if (++unsavedLearning >= 5) saveLearning()
    }

    // ---- Glow lights --------------------------------------------------------

    private fun glowOn() = isPro() && preferences.getBoolean("glow", false)

    private fun selectStyle(id: String) {
        selectedStyle = id
        normalMode = false
        preferences.edit().putString("style", id).putBoolean("normalMode", false).apply()
        rememberRecent(id)
        panel = Panel.NONE
        rebuild()
    }

    /** Recent fonts first, always including the selected one; topped up so the bar is never empty. */
    private fun barStyles(effective: String): List<TextStyle> {
        val ids = recentIds().toMutableList()
        if (effective != "normal" && effective !in ids) ids.add(0, effective)
        val styles = ids.map { catalogue.style(it) }.filter { it.id != "normal" && isAvailable(it) }.distinctBy { it.id }.toMutableList()
        if (styles.size < 4) {
            catalogue.keyboardStyles.filter { isAvailable(it) && styles.none { s -> s.id == it.id } }.take(6 - styles.size).forEach { styles.add(it) }
        }
        return styles.take(7)
    }

    private fun fontsPanel(): View {
        val scroll = ScrollView(context).apply { isVerticalScrollBarEnabled = false }
        val list = LinearLayout(context).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(3), dp(2), dp(3), dp(4)) }
        if (!isPro()) list.addView(sectionLabel("🔒 Unlock every font with Lifetime Pro in the app"))
        val effective = effectiveStyleId()
        FONT_GROUPS.forEach { group ->
            val styles = catalogue.keyboardStyles.filter { it.group == group }
            if (styles.isEmpty()) return@forEach
            list.addView(sectionLabel(group))
            styles.chunked(3).forEach { chunk ->
                val row = LinearLayout(context).apply { orientation = LinearLayout.HORIZONTAL }
                chunk.forEach { style ->
                    val locked = !isAvailable(style)
                    row.addView(chip("${if (locked) "🔒 " else ""}${catalogue.transform(style.name, style.id)}", style.id == effective) {
                        if (!locked) selectStyle(style.id)
                    }.apply {
                        alpha = if (locked) 0.55f else 1f
                        contentDescription = "${style.name}${if (locked) ", Pro" else ""}"
                        layoutParams = LinearLayout.LayoutParams(0, dp(36), 1f).apply { setMargins(dp(3), dp(3), dp(3), dp(3)) }
                    })
                }
                repeat(3 - chunk.size) { row.addView(View(context), weighted(1f)) }
                list.addView(row, LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, dp(44)))
            }
        }
        scroll.addView(list)
        return scroll
    }

    private fun togglePanel(target: Panel) {
        if (panel == Panel.VOICE) stopVoice()
        panel = if (panel == target) Panel.NONE else target
        rebuild()
    }

    private fun chip(label: String, active: Boolean, action: () -> Unit): Button = Button(context).apply {
        text = label
        textSize = 15f
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
            addState(intArrayOf(android.R.attr.state_pressed), pill(blend(fill, Color.parseColor(theme.text), 0.18f)))
            addState(intArrayOf(), pill(fill))
        }
        setOnClickListener { tick(this); action() }
        layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, dp(34)).apply { setMargins(dp(3), 0, dp(3), 0) }
    }

    // ---- Panels ------------------------------------------------------------

    private fun recentEmoji() = (preferences.getString("recentEmoji", "") ?: "").split('\u0001').filter { it.isNotEmpty() }

    // Older phones lack newer emoji; hide those instead of showing empty boxes.
    private val glyphCheck = android.graphics.Paint()

    private fun emojiGrid(list: LinearLayout, items: List<String>) {
        items.filter { glyphCheck.hasGlyph(it) }.chunked(8).forEach { chunk ->
            val row = keyRow()
            chunk.forEach { item ->
                row.addView(TextView(context).apply {
                    text = item
                    textSize = 24f
                    gravity = Gravity.CENTER
                    includeFontPadding = false
                    contentDescription = item
                    background = StateListDrawable().apply {
                        addState(intArrayOf(android.R.attr.state_pressed), pill(keyFill()))
                        addState(intArrayOf(), ColorDrawable(Color.TRANSPARENT))
                    }
                    isClickable = true
                    setOnClickListener {
                        tick(this)
                        commitRaw(item)
                        val recent = (listOf(item) + recentEmoji().filter { it != item }).take(16)
                        preferences.edit().putString("recentEmoji", recent.joinToString("\u0001")).apply()
                    }
                }, weighted(1f))
            }
            repeat(8 - chunk.size) { row.addView(View(context), weighted(1f)) }
            list.addView(row, LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, dp(44)))
        }
    }

    private fun symbolsPanel(): View {
        val scroll = ScrollView(context).apply { isVerticalScrollBarEnabled = false }
        val list = LinearLayout(context).apply { orientation = LinearLayout.VERTICAL; setPadding(0, dp(2), 0, dp(2)) }
        val recent = recentEmoji()
        if (recent.isNotEmpty()) {
            list.addView(sectionLabel("Recent"))
            emojiGrid(list, recent)
        }
        symbolGroups.forEach { (title, items, perRow) ->
            list.addView(sectionLabel(title))
            items.chunked(perRow).forEach { chunk ->
                val row = keyRow()
                chunk.forEach { item ->
                    val key = cap(item, CapKind.LETTER, textSize = if (perRow <= 2) 15f else 20f)
                    key.onUp = { _, inside -> if (inside) { tick(key); commitRaw(item) } }
                    row.addView(key, weighted(1f))
                }
                repeat(perRow - chunk.size) { row.addView(View(context), weighted(1f)) }
                list.addView(row, LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, dp(46)))
            }
        }
        emojiGroups.forEach { (title, items) ->
            list.addView(sectionLabel(title))
            emojiGrid(list, items)
        }
        scroll.addView(list)
        return scroll
    }

    private fun themesPanel(): View {
        val scroll = ScrollView(context).apply { isVerticalScrollBarEnabled = false }
        val list = LinearLayout(context).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(3), dp(2), dp(3), dp(4)) }
        if (!isPro()) list.addView(sectionLabel("🔒 Unlock every theme with Lifetime Pro in the app"))
        list.addView(LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            addView(chip("✨ Glow lights ${if (glowOn()) "on" else "off"}${if (isPro()) "" else " 🔒"}", glowOn()) {
                if (!isPro()) {
                    android.widget.Toast.makeText(context, "Glow lights come with Lifetime Pro. Unlock it in the Lyfstyle app.", android.widget.Toast.LENGTH_SHORT).show()
                } else {
                    preferences.edit().putBoolean("glow", !glowOn()).apply()
                    rebuild()
                }
            }.apply { layoutParams = LinearLayout.LayoutParams(0, dp(36), 1f).apply { setMargins(dp(3), dp(4), dp(3), dp(2)) } })
            addView(chip("💬 Suggestions ${if (suggestionsOn()) "on" else "off"}", suggestionsOn()) {
                preferences.edit().putBoolean("suggestions", !suggestionsOn()).apply()
                rebuild()
            }.apply { layoutParams = LinearLayout.LayoutParams(0, dp(36), 1f).apply { setMargins(dp(3), dp(4), dp(3), dp(2)) } })
        })
        val mine = listOfNotNull(if (photoFile.exists()) PHOTO_THEME else null, customTheme())
        val sections = listOf("Yours" to mine) +
            PICTURE_GROUPS.map { group -> group to catalogue.themes.filter { it.image != null && it.group == group } } +
            listOf("Colours" to catalogue.themes.filter { it.image == null })
        sections.forEach { (title, options) ->
            if (options.isEmpty()) return@forEach
            list.addView(sectionLabel(title))
            options.chunked(3).forEach { chunk ->
                val row = LinearLayout(context).apply { orientation = LinearLayout.HORIZONTAL }
                chunk.forEach { option -> row.addView(themeSwatch(option)) }
                repeat(3 - chunk.size) { row.addView(View(context), weighted(1f)) }
                list.addView(row, LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, dp(52)))
            }
        }
        scroll.addView(list)
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
            if (picture != null) setShadowLayer(4f, 0f, 1f, Color.argb(180, 0, 0, 0))
            alpha = if (locked) 0.6f else 1f
            contentDescription = "${option.name} theme${if (locked) ", Pro" else ""}${if (active) ", selected" else ""}"
            setOnClickListener {
                if (locked) {
                    // Say why instead of silently ignoring the tap.
                    android.widget.Toast.makeText(context, "${option.name} comes with Lifetime Pro. Unlock it in the Lyfstyle app.", android.widget.Toast.LENGTH_SHORT).show()
                    return@setOnClickListener
                }
                tick(this)
                theme = option
                preferences.edit().putString("theme", option.id).apply()
                panel = Panel.NONE
                rebuild()
            }
            layoutParams = LinearLayout.LayoutParams(0, LayoutParams.MATCH_PARENT, 1f).apply { setMargins(dp(3), dp(3), dp(3), dp(3)) }
        }
    }

    private fun sectionLabel(title: String) = TextView(context).apply {
        text = title.uppercase()
        textSize = 10f
        letterSpacing = 0.08f
        setTextColor(Color.parseColor(theme.secondary))
        setPadding(dp(6), dp(8), dp(6), dp(2))
    }

    // ---- Voice typing --------------------------------------------------------

    private fun hasMicrophone() =
        service.checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED

    private fun startVoice() {
        panel = Panel.VOICE
        voiceText = ""
        when {
            !hasMicrophone() -> voiceStatus = "Allow the microphone once in the Lyfstyle app, then tap 🎙 again."
            !SpeechRecognizer.isRecognitionAvailable(service) -> voiceStatus = "Voice typing isn't available on this phone."
            else -> voiceStatus = "Listening… speak now"
        }
        rebuild()
        if (!hasMicrophone() || !SpeechRecognizer.isRecognitionAvailable(service)) return
        recognizer?.destroy()
        recognizer = SpeechRecognizer.createSpeechRecognizer(service).apply {
            setRecognitionListener(object : RecognitionListener {
                override fun onReadyForSpeech(params: Bundle?) = Unit
                override fun onBeginningOfSpeech() = Unit
                override fun onRmsChanged(rmsdB: Float) = Unit
                override fun onBufferReceived(buffer: ByteArray?) = Unit
                override fun onEndOfSpeech() { showVoice(voiceText, "Finishing…") }
                override fun onEvent(eventType: Int, params: Bundle?) = Unit
                override fun onPartialResults(partialResults: Bundle?) {
                    partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull()?.let { showVoice(it, "Listening… speak now") }
                }
                override fun onResults(results: Bundle?) {
                    val heard = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull().orEmpty()
                    if (heard.isNotBlank()) typeHeard(heard)
                    stopVoice()
                    panel = Panel.NONE
                    rebuild()
                }
                override fun onError(error: Int) {
                    val message = when (error) {
                        SpeechRecognizer.ERROR_NO_MATCH, SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "Didn't catch that. Tap 🎙 to try again."
                        SpeechRecognizer.ERROR_NETWORK, SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Voice typing needs an internet connection on this phone."
                        SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Allow the microphone once in the Lyfstyle app, then tap 🎙 again."
                        else -> "Voice typing stopped. Tap 🎙 to try again."
                    }
                    showVoice(voiceText, message)
                }
            })
            startListening(Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, service.packageName)
            })
        }
    }

    private fun showVoice(text: String, status: String) {
        voiceText = text
        voiceStatus = status
        voiceLabel?.text = text.ifBlank { "…" }
        voiceStatusLabel?.text = status
    }

    /** Spoken words go in through the selected style, with a space before them if needed. */
    private fun typeHeard(heard: String) {
        val before = service.currentInputConnection?.getTextBeforeCursor(1, 0)?.toString().orEmpty()
        val text = if (before.isNotEmpty() && !before.last().isWhitespace()) " $heard" else heard
        commitText(text)
    }

    fun stopVoice() {
        recognizer?.destroy()
        recognizer = null
    }

    private fun voicePanel(): View {
        val box = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(dp(12), dp(6), dp(12), dp(6))
        }
        box.addView(TextView(context).apply {
            text = "🎙"
            textSize = 30f
            gravity = Gravity.CENTER
        })
        voiceLabel = TextView(context).apply {
            text = voiceText.ifBlank { "…" }
            textSize = 18f
            maxLines = 2
            ellipsize = TextUtils.TruncateAt.START
            gravity = Gravity.CENTER
            setTextColor(Color.parseColor(theme.text))
        }
        box.addView(voiceLabel)
        voiceStatusLabel = TextView(context).apply {
            text = voiceStatus
            textSize = 12f
            gravity = Gravity.CENTER
            setTextColor(Color.parseColor(theme.secondary))
            setPadding(0, dp(4), 0, dp(6))
        }
        box.addView(voiceStatusLabel)
        if (!hasMicrophone()) {
            box.addView(chip("Open Lyfstyle to allow the mic", true) { openApp("lyfstyle://keyboard") })
        }
        return box
    }

    private fun openApp(link: String) {
        runCatching {
            service.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(link)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        }
    }

    // ---- Translator ------------------------------------------------------------

    private fun openTranslator() {
        if (panel == Panel.VOICE) stopVoice()
        if (panel == Panel.TRANSLATE) { panel = Panel.NONE; rebuild(); return }
        val raw = service.currentInputConnection?.getTextBeforeCursor(1000, 0)?.toString().orEmpty()
        translateSource = catalogue.plain(raw).trim()
        translateResult = ""
        translateStatus = if (translateSource.isEmpty()) "Type your message first, then tap 文A." else ""
        panel = Panel.TRANSLATE
        rebuild()
        if (translateSource.isNotEmpty()) runTranslation()
    }

    private fun translatePanel(): View {
        val box = LinearLayout(context).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(4), dp(2), dp(4), dp(2)) }
        val scroll = HorizontalScrollView(context).apply { isHorizontalScrollBarEnabled = false }
        val chips = LinearLayout(context).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
        languages.forEach { (code, name) ->
            chips.addView(chip(name, code == translateTarget) {
                translateTarget = code
                preferences.edit().putString("translateTo", code).apply()
                rebuild()
                if (translateSource.isNotEmpty()) runTranslation()
            })
        }
        scroll.addView(chips)
        box.addView(scroll, LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, dp(44)))
        translateResultLabel = TextView(context).apply {
            text = translateResult.ifBlank { translateStatus }
            textSize = 16f
            maxLines = 3
            ellipsize = TextUtils.TruncateAt.END
            setTextColor(Color.parseColor(theme.text))
            setPadding(dp(8), dp(6), dp(8), dp(6))
            background = GradientDrawable().apply { cornerRadius = dp(10).toFloat(); setColor(keyFill()) }
        }
        box.addView(translateResultLabel, LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, dp(70)))
        val actions = LinearLayout(context).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER; setPadding(0, dp(4), 0, 0) }
        actions.addView(chip("Replace my text", true) { useTranslation(replace = true) })
        actions.addView(chip("Add it", false) { useTranslation(replace = false) })
        actions.visibility = if (translateResult.isNotBlank()) VISIBLE else INVISIBLE
        translateActions = actions
        box.addView(actions, LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, dp(40)))
        return box
    }

    private fun showTranslation(result: String, status: String) {
        translateResult = result
        translateStatus = status
        translateResultLabel?.text = result.ifBlank { status }
        translateActions?.visibility = if (result.isNotBlank()) VISIBLE else INVISIBLE
    }

    private fun runTranslation() {
        val source = translateSource
        val target = TranslateLanguage.fromLanguageTag(translateTarget) ?: return
        showTranslation("", "Translating…")
        LanguageIdentification.getClient().identifyLanguage(source)
            .addOnSuccessListener { tag ->
                val from = TranslateLanguage.fromLanguageTag(if (tag == "und") "en" else tag) ?: TranslateLanguage.ENGLISH
                if (from == target) {
                    showTranslation(source, "")
                    return@addOnSuccessListener
                }
                val translator = Translation.getClient(TranslatorOptions.Builder().setSourceLanguage(from).setTargetLanguage(target).build())
                showTranslation("", "Getting ready… the first time, the language downloads once (about 30 MB).")
                translator.downloadModelIfNeeded(DownloadConditions.Builder().build())
                    .addOnSuccessListener {
                        showTranslation("", "Translating…")
                        translator.translate(source)
                            .addOnSuccessListener { out -> if (source == translateSource) showTranslation(out, ""); translator.close() }
                            .addOnFailureListener { showTranslation("", "Couldn't translate that. Try again."); translator.close() }
                    }
                    .addOnFailureListener { showTranslation("", "Couldn't download the language. Check your internet connection."); translator.close() }
            }
            .addOnFailureListener { showTranslation("", "Couldn't tell which language that is.") }
    }

    private fun useTranslation(replace: Boolean) {
        val connection = service.currentInputConnection ?: return
        if (translateResult.isBlank()) return
        if (replace) {
            val raw = connection.getTextBeforeCursor(1000, 0)?.toString().orEmpty()
            connection.deleteSurroundingText(raw.length, 0)
            commitText(translateResult)
        } else {
            commitRaw("\n")
            commitText(translateResult)
        }
        panel = Panel.NONE
        rebuild()
    }

    // ---- Keys ----------------------------------------------------------------

    private fun buildLetterRows() {
        rows.addView(keyRow().apply {
            letterRows[0].forEach { addView(letterCap(it), weighted(1f)) }
        }, rowParams())
        rows.addView(keyRow().apply {
            addPadded(this, letterRows[1].map { letterCap(it) }, 0.5f)
        }, rowParams())
        rows.addView(keyRow().apply {
            val shift = cap(null, CapKind.FUNCTION)
            shift.onUp = { _, inside -> if (inside) tapShift(shift) }
            shiftCap = shift
            addView(shift, weighted(1.4f))
            addPadded(this, letterRows[2].map { letterCap(it) }, 0.1f)
            addView(deleteCap(), weighted(1.4f))
        }, rowParams())
        updateLetterLabels()
    }

    private fun buildSymbolRows() {
        val source = if (secondarySymbols) symbolRows else numberRows
        rows.addView(keyRow().apply { source[0].forEach { addView(symbolCap(it), weighted(1f)) } }, rowParams())
        rows.addView(keyRow().apply { source[1].forEach { addView(symbolCap(it), weighted(1f)) } }, rowParams())
        rows.addView(keyRow().apply {
            val toggle = cap(if (secondarySymbols) "123" else "#+=", CapKind.FUNCTION, textSize = 16f)
            toggle.onUp = { _, inside -> if (inside) { secondarySymbols = !secondarySymbols; rebuild() } }
            addView(toggle, weighted(1.5f))
            addPadded(this, source[2].map { symbolCap(it) }, 0.25f)
            addView(deleteCap(), weighted(1.5f))
        }, rowParams())
    }

    private fun bottomRow(): View {
        val row = keyRow()
        val mode = cap(if (panel != Panel.NONE || symbols) "ABC" else "123", CapKind.FUNCTION, textSize = 16f)
        mode.onUp = { _, inside ->
            if (inside) {
                if (panel != Panel.NONE) panel = Panel.NONE else { symbols = !symbols; secondarySymbols = false }
                rebuild()
            }
        }
        // No 🌐 key here: Android puts a keyboard switcher in the navigation bar, and a 🌐 next
        // to 123 caught taps meant for 123. Holding space opens the keyboard picker instead.
        row.addView(mode, weighted(1.5f))
        val mic = cap("🎙", CapKind.FUNCTION, textSize = 18f).apply { contentDescription = "Speak to type" }
        mic.onUp = { key, inside -> if (inside) { tick(key); if (panel == Panel.VOICE) { stopVoice(); panel = Panel.NONE; rebuild() } else startVoice() } }
        row.addView(mic, weighted(1.2f))
        val space = cap(catalogue.transform("lyfstyle", effectiveStyleId()), CapKind.LETTER, textSize = 15f).apply {
            label.setTextColor(Color.parseColor(theme.secondary))
            contentDescription = "Space. Hold to switch keyboard."
            sound = AudioManager.FX_KEYPRESS_SPACEBAR
        }
        space.onDown = { key ->
            tick(key); spaceStartX = -1f; spaceSliding = false; spaceHeld = false
            handler.postDelayed(spaceHold, 600)
        }
        space.onMove = { _, rawX ->
            slideCursor(rawX)
            if (spaceSliding) handler.removeCallbacks(spaceHold)
        }
        space.onUp = { _, inside ->
            handler.removeCallbacks(spaceHold)
            if (!spaceSliding && !spaceHeld && inside) typeSpace()
            spaceSliding = false
            spaceHeld = false
        }
        row.addView(space, weighted(4.4f))
        val period = cap(".", CapKind.LETTER)
        period.onDown = { key -> tick(key); commitText(".") }
        row.addView(period, weighted(1f))
        val enter = cap("↵", CapKind.ACCENT, textSize = 20f).apply {
            contentDescription = "Return"
            sound = AudioManager.FX_KEYPRESS_RETURN
        }
        enter.onUp = { key, inside ->
            if (inside) {
                tick(key)
                val info = service.currentInputEditorInfo
                val action = info?.imeOptions?.and(EditorInfo.IME_MASK_ACTION) ?: EditorInfo.IME_ACTION_NONE
                val noEnterAction = info?.imeOptions?.and(EditorInfo.IME_FLAG_NO_ENTER_ACTION) != 0
                if (!noEnterAction && action != EditorInfo.IME_ACTION_NONE && action != EditorInfo.IME_ACTION_UNSPECIFIED) {
                    service.currentInputConnection?.performEditorAction(action)
                } else commitRaw("\n")
                updateAutoShift()
            }
        }
        row.addView(enter, weighted(1.9f))
        return row
    }

    private fun keyRow() = LinearLayout(context).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.CENTER
    }

    private fun rowParams() = LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, dp(ROW_HEIGHT))
    private fun weighted(weight: Float) = LinearLayout.LayoutParams(0, LayoutParams.MATCH_PARENT, weight)

    /**
     * A run of keys whose outer two keys also cover the gap of [pad] key widths on each
     * side, so no part of the row is dead to a tap.
     */
    private fun addPadded(row: LinearLayout, keys: List<KeyCap>, pad: Float) {
        keys.forEachIndexed { index, key ->
            if (index == 0) key.padStart = pad
            if (index == keys.lastIndex) key.padEnd = pad
            row.addView(key, weighted(1f + key.padStart + key.padEnd))
        }
    }

    private fun cap(label: String?, kind: CapKind, textSize: Float = 22f): KeyCap {
        val base = when (kind) {
            CapKind.LETTER -> keyFill()
            CapKind.FUNCTION -> functionFill()
            CapKind.ACCENT -> Color.parseColor(theme.accent)
        }
        return KeyCap(context).apply {
            setFill(base, blend(base, if (kind == CapKind.ACCENT) Color.BLACK else Color.parseColor(theme.text), 0.2f))
            this.label.text = label ?: ""
            this.label.textSize = textSize
            this.label.setTextColor(if (kind == CapKind.ACCENT) readableOn(theme.accent) else Color.parseColor(theme.text))
            body.elevation = if (theme.keyAlpha >= 1f) dp(1).toFloat() else 0f
            contentDescription = label
        }
    }

    private fun letterCap(letter: String): KeyCap {
        val key = cap(null, CapKind.LETTER)
        key.onDown = { letterDown(it, letter) }
        key.onMove = { _, rawX -> moveAlternates(rawX) }
        key.onUp = { _, _ -> letterUp() }
        letterCaps.add(key to letter)
        return key
    }

    private fun symbolCap(symbol: String): KeyCap {
        val key = cap(symbol, CapKind.LETTER)
        key.onDown = {
            tick(it)
            showPopup(it, catalogue.transform(symbol, effectiveStyleId()))
            commitText(symbol)
        }
        key.onUp = { _, _ -> hidePopup() }
        return key
    }

    private fun deleteCap(): KeyCap {
        val key = cap("⌫", CapKind.FUNCTION, textSize = 20f).apply {
            contentDescription = "Delete. Hold to repeat."
            sound = AudioManager.FX_KEYPRESS_DELETE
        }
        key.onDown = {
            tick(it)
            deleteLastGrapheme()
            deleteRepeating = true
            handler.postDelayed(repeatDelete, 400)
        }
        key.onUp = { _, _ -> stopKeyRepeat(); updateAutoShift() }
        return key
    }

    /** Relabels letters (shift + selected style) and the shift key, without rebuilding. */
    private fun updateLetterLabels() {
        val style = effectiveStyleId()
        val upper = shifted || capsLock
        letterCaps.forEach { (key, letter) ->
            val shown = if (upper) letter.uppercase() else letter
            key.label.text = catalogue.transform(shown, style)
            key.contentDescription = shown
        }
        shiftCap?.let { shift ->
            shift.label.text = if (capsLock) "⇪" else if (shifted) "⬆" else "⇧"
            val fill = if (capsLock) Color.parseColor(theme.accent) else functionFill()
            shift.setFill(fill, blend(fill, Color.parseColor(theme.text), 0.2f))
            shift.label.setTextColor(if (capsLock) readableOn(theme.accent) else Color.parseColor(theme.text))
            shift.contentDescription = if (capsLock) "Caps lock on" else if (shifted) "Shift on" else "Shift. Double tap for caps lock."
        }
    }

    // ---- Pop-up preview and accents ----------------------------------------

    private fun keyBodyRect(key: KeyCap): Rect {
        val mine = IntArray(2).also { getLocationInWindow(it) }
        val theirs = IntArray(2).also { key.body.getLocationInWindow(it) }
        val left = theirs[0] - mine[0]
        val top = theirs[1] - mine[1]
        return Rect(left, top, left + key.body.width, top + key.body.height)
    }

    private fun popupBackground() = GradientDrawable().apply {
        cornerRadius = dp(10).toFloat()
        setColor(Color.parseColor(theme.key))
    }

    private fun popupTextColor(): Int =
        if (theme.dark && theme.keyAlpha < 1f) Color.parseColor("#22172F") else Color.parseColor(theme.text)

    private fun showPopup(key: KeyCap, text: String) {
        val frame = keyBodyRect(key)
        val popupWidth = frame.width() + dp(16)
        val popupHeight = frame.height() + dp(22)
        val x = (frame.centerX() - popupWidth / 2).coerceIn(dp(2), (width - popupWidth - dp(2)).coerceAtLeast(dp(2)))
        val y = (frame.bottom - popupHeight - (frame.height() * 0.55f).toInt()).coerceAtLeast(0)
        popup.layoutParams = LayoutParams(popupWidth, popupHeight).apply { leftMargin = x; topMargin = y }
        popup.background = popupBackground()
        popup.setTextColor(popupTextColor())
        popup.text = text
        popup.visibility = VISIBLE
        alternatesStrip.visibility = GONE
        popup.bringToFront()
    }

    private fun hidePopup() {
        handler.removeCallbacks(showAlternatesLater)
        pendingAlternates = null
        popup.visibility = GONE
        alternatesStrip.visibility = GONE
        alternatesShowing = false
    }

    private fun letterDown(key: KeyCap, letter: String) {
        tick(key)
        val upper = shifted || capsLock
        val shown = if (upper) letter.uppercase() else letter
        val styled = catalogue.transform(shown, effectiveStyleId())
        showPopup(key, styled)
        insertedOnDown = styled
        commitText(shown)
        val options = accentMap[letter] ?: return
        pendingAlternates = { showAlternates(key, options.map { if (upper) it.uppercase() else it }) }
        handler.removeCallbacks(showAlternatesLater)
        handler.postDelayed(showAlternatesLater, 420)
    }

    private fun showAlternates(key: KeyCap, options: List<String>) {
        alternates = options
        alternateIndex = 0
        alternatesShowing = true
        val frame = keyBodyRect(key)
        val cell = maxOf(dp(32), frame.width())
        val stripWidth = cell * options.size + dp(8)
        val x = (frame.left - dp(4)).coerceIn(dp(2), (width - stripWidth - dp(2)).coerceAtLeast(dp(2)))
        val popupParams = popup.layoutParams as LayoutParams
        alternatesStrip.removeAllViews()
        options.forEach { option ->
            alternatesStrip.addView(TextView(context).apply {
                text = catalogue.transform(option, effectiveStyleId())
                textSize = 22f
                gravity = Gravity.CENTER
                includeFontPadding = false
            }, LinearLayout.LayoutParams(cell, LinearLayout.LayoutParams.MATCH_PARENT))
        }
        alternatesStrip.background = popupBackground()
        alternatesStrip.layoutParams = LayoutParams(stripWidth, popupParams.height).apply { leftMargin = x; topMargin = popupParams.topMargin }
        popup.visibility = GONE
        alternatesStrip.visibility = VISIBLE
        alternatesStrip.bringToFront()
        highlightAlternate()
        keyFeedback(key, AudioManager.FX_KEYPRESS_STANDARD)
    }

    private fun moveAlternates(rawX: Float) {
        if (!alternatesShowing || alternates.isEmpty()) return
        val location = IntArray(2).also { alternatesStrip.getLocationOnScreen(it) }
        val local = rawX - location[0] - dp(4)
        val cell = (alternatesStrip.width - dp(8)).toFloat() / alternates.size
        val index = (local / cell).toInt().coerceIn(0, alternates.size - 1)
        if (index != alternateIndex) {
            alternateIndex = index
            highlightAlternate()
            performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK)
        }
    }

    private fun highlightAlternate() {
        for (index in 0 until alternatesStrip.childCount) {
            val label = alternatesStrip.getChildAt(index) as? TextView ?: continue
            val selected = index == alternateIndex
            label.background = if (selected) GradientDrawable().apply {
                cornerRadius = dp(7).toFloat()
                setColor(Color.parseColor(theme.accent))
            } else null
            label.setTextColor(if (selected) readableOn(theme.accent) else popupTextColor())
        }
    }

    private fun letterUp() {
        if (alternatesShowing && alternateIndex in alternates.indices) {
            // Swap the letter typed on touch-down for the chosen accent.
            if (insertedOnDown.isNotEmpty()) deleteLastGrapheme()
            commitText(alternates[alternateIndex])
        }
        hidePopup()
    }

    // ---- Typing --------------------------------------------------------------

    private fun isAvailable(style: TextStyle) = style.keyboard && (isPro() || !style.isPro)

    private fun effectiveStyleId(): String {
        if (normalMode || safeNormal) return "normal"
        // A removed custom style falls back to Script.
        val style = catalogue.style(selectedStyle)
        return if (style.id != selectedStyle || !isAvailable(style)) "script" else selectedStyle
    }

    private fun commitText(raw: String) {
        val styled = catalogue.transform(raw, effectiveStyleId())
        service.currentInputConnection?.commitText(styled, 1)
        updateAutoShift()
    }

    /** Symbols, kaomoji and new lines are inserted exactly as shown. */
    private fun commitRaw(text: String) {
        service.currentInputConnection?.commitText(text, 1)
    }

    private fun typeSpace() {
        val connection = service.currentInputConnection ?: return
        val now = SystemClock.uptimeMillis()
        if (!safeNormal) {
            val plain = catalogue.plain(connection.getTextBeforeCursor(80, 0)?.toString() ?: "", effectiveStyleId())
            val word = WordSuggester.trailingWord(plain)
            if (word.isNotEmpty()) learnWord(word, previousWord(plain.dropLast(word.length)))
        }
        val before = connection.getTextBeforeCursor(3, 0)?.toString() ?: ""
        // Double-tap space: ". " like the built-in keyboard.
        val previous = before.dropLast(1).lastOrNull()
        if (now - lastSpaceTap < 500 && before.endsWith(" ") && previous != null && !previous.isWhitespace() && previous != '.') {
            connection.deleteSurroundingText(1, 0)
            connection.commitText(". ", 1)
            lastSpaceTap = 0
        } else {
            connection.commitText(" ", 1)
            lastSpaceTap = now
        }
        updateAutoShift()
    }

    private fun slideCursor(rawX: Float) {
        if (spaceStartX < 0f) { spaceStartX = rawX; return }
        val distance = rawX - spaceStartX
        if (!spaceSliding && abs(distance) < dp(14)) return
        spaceSliding = true
        val step = dp(9).toFloat()
        val steps = (distance / step).toInt()
        if (steps == 0) return
        val code = if (steps > 0) KeyEvent.KEYCODE_DPAD_RIGHT else KeyEvent.KEYCODE_DPAD_LEFT
        repeat(abs(steps)) { service.sendDownUpKeyEvents(code) }
        spaceStartX += steps * step
        performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK)
    }

    private fun tapShift(shift: KeyCap) {
        tick(shift)
        val now = SystemClock.uptimeMillis()
        if (now - lastShiftTap < 300) {
            capsLock = true
            shifted = true
            lastShiftTap = 0
        } else {
            if (capsLock) { capsLock = false; shifted = false } else shifted = !shifted
            lastShiftTap = now
        }
        updateLetterLabels()
    }

    /** Capital letter at the start of a sentence, using the app's own capitalisation setting. */
    private fun updateAutoShift() {
        if (capsLock) return
        val info = service.currentInputEditorInfo ?: return
        val connection = service.currentInputConnection ?: return
        val should = info.inputType != InputType.TYPE_NULL && connection.getCursorCapsMode(info.inputType) != 0
        if (should != shifted) {
            shifted = should
            updateLetterLabels()
        }
    }

    fun deleteLastGrapheme() {
        val connection = service.currentInputConnection ?: return
        // With text selected (e.g. after Select all), delete removes the selection.
        val selected = connection.getSelectedText(0)
        if (!selected.isNullOrEmpty()) {
            connection.commitText("", 1)
            return
        }
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

    /**
     * Feedback for taps outside the letter keys (chips, panels). Keys give their own
     * feedback the instant a finger lands (see [KeyCap]), so this skips them.
     */
    private fun tick(view: View) {
        if (view !is KeyCap) keyFeedback(view, AudioManager.FX_KEYPRESS_STANDARD)
    }

    private val audio = service.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
    private val vibrator: Vibrator? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        service.getSystemService(VibratorManager::class.java)?.defaultVibrator
    } else {
        @Suppress("DEPRECATION")
        service.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
    }
    private val keyBuzz: VibrationEffect? = when {
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q -> VibrationEffect.createPredefined(VibrationEffect.EFFECT_CLICK)
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.O -> VibrationEffect.createOneShot(14, VibrationEffect.DEFAULT_AMPLITUDE)
        else -> null
    }

    /**
     * A short, crisp buzz plus the phone's key click, like the built-in keyboard. Follows
     * the phone's own settings: "Touch sounds" for the click and "Touch feedback" (haptics)
     * for the buzz. The buzz goes straight to the vibrator because on many phones the
     * ordinary view haptic for key taps is so faint that typing feels dead.
     */
    private fun keyFeedback(view: View, sound: Int) {
        try {
            audio?.playSoundEffect(sound)
            val haptics = Settings.System.getInt(context.contentResolver, Settings.System.HAPTIC_FEEDBACK_ENABLED, 1) != 0
            val motor = vibrator
            if (haptics && motor != null && motor.hasVibrator()) {
                val effect = keyBuzz
                if (effect != null) motor.vibrate(effect) else @Suppress("DEPRECATION") motor.vibrate(14)
            } else if (haptics) view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
        } catch (_: RuntimeException) {
            view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
        }
        if (glow.visibility == VISIBLE) glow.pulse()
    }

    private fun pill(fill: Int) = GradientDrawable().apply {
        cornerRadius = dp(17).toFloat()
        setColor(fill)
    }

    private fun luminance(hex: String): Double {
        val color = Color.parseColor(hex)
        return (0.2126 * Color.red(color) + 0.7152 * Color.green(color) + 0.0722 * Color.blue(color)) / 255
    }

    /** Plum ink on light accents, white on dark ones. */
    private fun readableOn(hex: String): Int =
        if (luminance(hex) > 0.55) Color.parseColor("#22172F") else Color.WHITE

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

    /**
     * One key. The whole cell is touchable (no dead gaps between keys); the visible
     * body is inset inside it. Callbacks fire straight from the touch, so a letter
     * can be typed the moment a finger lands instead of when it lifts.
     */
    private inner class KeyCap(context: Context) : FrameLayout(context) {
        val body = FrameLayout(context)
        val label = TextView(context)
        var onDown: ((KeyCap) -> Unit)? = null
        var onMove: ((KeyCap, Float) -> Unit)? = null
        var onUp: ((KeyCap, Boolean) -> Unit)? = null
        /** The click the phone plays for this key (when touch sounds are on). */
        var sound = AudioManager.FX_KEYPRESS_STANDARD
        /**
         * Extra touch area beside the visible key, in key widths. The keys next to the
         * edges of a short row (A, L, Z, M...) reach into the gap, so a tap there still
         * types instead of landing on nothing. The cell's weight includes this padding.
         */
        var padStart = 0f
        var padEnd = 0f
        private var fillColor = Color.WHITE
        private var pressedColor = Color.LTGRAY
        private val shape = GradientDrawable().apply { cornerRadius = dp(8).toFloat() }

        init {
            label.gravity = Gravity.CENTER
            label.maxLines = 1
            label.includeFontPadding = false
            body.addView(label, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
            addView(body, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT).apply {
                setMargins(dp(3), dp(5), dp(3), dp(5))
            })
            body.background = shape
            isHapticFeedbackEnabled = true
        }

        override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
            val params = body.layoutParams as LayoutParams
            val cell = MeasureSpec.getSize(widthMeasureSpec) / (1f + padStart + padEnd)
            params.leftMargin = dp(3) + (cell * padStart).toInt()
            params.rightMargin = dp(3) + (cell * padEnd).toInt()
            super.onMeasure(widthMeasureSpec, heightMeasureSpec)
        }

        fun setFill(fill: Int, pressed: Int) {
            fillColor = fill
            pressedColor = pressed
            paint(false)
        }

        private fun paint(pressed: Boolean) {
            shape.setColor(if (pressed) pressedColor else fillColor)
        }

        @SuppressLint("ClickableViewAccessibility")
        override fun onTouchEvent(event: MotionEvent): Boolean {
            when (event.actionMasked) {
                MotionEvent.ACTION_DOWN -> { paint(true); keyFeedback(this, sound); onDown?.invoke(this) }
                MotionEvent.ACTION_MOVE -> onMove?.invoke(this, event.rawX)
                MotionEvent.ACTION_UP -> {
                    paint(false)
                    val slop = dp(24)
                    val inside = event.x >= -slop && event.x <= width + slop && event.y >= -slop && event.y <= height + slop
                    onUp?.invoke(this, inside)
                    if (inside) { clickFromTouch = true; performClick(); clickFromTouch = false }
                }
                MotionEvent.ACTION_CANCEL -> { paint(false); onUp?.invoke(this, false) }
            }
            return true
        }

        private var clickFromTouch = false

        /**
         * A click that didn't come from a finger on the key is TalkBack (double-tap, or lift
         * to type) or Switch Access: press and release the key so it types like a tap.
         */
        override fun performClick(): Boolean {
            super.performClick()
            if (!clickFromTouch) {
                keyFeedback(this, sound)
                onDown?.invoke(this)
                onUp?.invoke(this, true)
            }
            return true
        }
    }

    private companion object {
        const val ROW_HEIGHT = 54
        const val CUSTOM_ID = "custom-colors"
        val FONT_GROUPS = listOf(StyleCatalogue.MY_STYLES, "Cursive & cute", "Bold & clean", "Bubbles & boxes", "Gothic & fancy", "Around the world", "Effects", "Fun & flipped")
        val PICTURE_GROUPS = listOf("Cute & sweet", "Nature & sky", "Art", "K-pop", "Movies", "Music", "Pride", "City & neon", "Luxe & textures")

        /** The person's own photo as a theme: white glass keys over a dimmed picture. */
        val PHOTO_THEME = KeyboardPalette(
            id = "custom-photo", name = "Your photo", background = "#22172F", key = "#FFFFFF",
            text = "#FFFFFF", secondary = "#EDE6F0", accent = "#FF3D8B", dark = true, isPro = true,
            image = "@photo", keyAlpha = 0.22f,
        )
    }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()
}
