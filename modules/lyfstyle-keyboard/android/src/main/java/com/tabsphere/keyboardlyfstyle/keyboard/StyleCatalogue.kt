package com.tabsphere.keyboardlyfstyle.keyboard

import android.content.Context
import org.json.JSONObject

data class TextStyle(
    val id: String,
    val name: String,
    val category: String,
    val description: String,
    val kind: String,
    val isPro: Boolean,
    val keyboard: Boolean,
    val mapping: Map<String, String>,
    /** Section in the Fonts panel ("Cursive & cute", "Bold & clean"…). */
    val group: String = "",
)

data class KeyboardPalette(
    val id: String,
    val name: String,
    val background: String,
    val key: String,
    val text: String,
    val secondary: String,
    val accent: String,
    val dark: Boolean,
    val isPro: Boolean,
    /** Picture themes: file in assets/themes ("@photo" = the person's own photo). */
    val image: String? = null,
    /** Opacity of normal keys over a picture (1 = solid). */
    val keyAlpha: Float = 1f,
    /** Section in the theme picker ("Colours", "K-pop", "Pride"…). */
    val group: String = "",
)

class StyleCatalogue private constructor(private val root: JSONObject) {
    constructor(context: Context) : this(
        JSONObject(context.assets.open("styles.json").bufferedReader().use { it.readText() }),
    )

    internal constructor(json: String) : this(JSONObject(json))
    val styles: List<TextStyle> = root.getJSONArray("styles").let { array ->
        (0 until array.length()).map { index ->
            val item = array.getJSONObject(index)
            val mappingJson = item.getJSONObject("mapping")
            val mapping = buildMap {
                mappingJson.keys().forEach { key -> put(key, mappingJson.getString(key)) }
            }
            TextStyle(
                id = item.getString("id"),
                name = item.getString("name"),
                category = item.getString("category"),
                description = item.getString("description"),
                kind = item.getString("kind"),
                isPro = item.getBoolean("isPro"),
                // Composite styles (frames, joiners) are app-only.
                keyboard = item.optBoolean("keyboard", true),
                mapping = mapping,
                group = item.optString("group", ""),
            )
        }
    }
    val themes: List<KeyboardPalette> = root.getJSONArray("themes").let { array ->
        (0 until array.length()).map { index ->
            val item = array.getJSONObject(index)
            KeyboardPalette(
                id = item.getString("id"), name = item.getString("name"),
                background = item.getString("background"), key = item.getString("key"),
                text = item.getString("text"), secondary = item.getString("secondary"),
                accent = item.getString("accent"), dark = item.getBoolean("dark"),
                isPro = item.optBoolean("isPro", false),
                image = item.optString("image", "").ifEmpty { null },
                keyAlpha = item.optDouble("keyAlpha", 1.0).toFloat(),
                group = item.optString("group", ""),
            )
        }
    }
    val keyboardStyles: List<TextStyle> get() = styles.filter { it.keyboard && it.id != "normal" }

    fun style(id: String): TextStyle = styles.firstOrNull { it.id == id } ?: styles.first { it.id == "normal" }
    fun theme(id: String): KeyboardPalette = themes.firstOrNull { it.id == id } ?: themes.first()

    /** Styled character → plain letter, across every keyboard style (skips plain ASCII outputs). */
    private val reverse: Map<String, String> by lazy {
        buildMap {
            styles.filter { it.keyboard && it.kind != "normal" }.forEach { style ->
                style.mapping.forEach { (plain, styled) ->
                    if (styled != plain && styled.any { it.code > 127 } && !containsKey(styled)) put(styled, plain)
                }
            }
        }
    }
    private val longestStyled by lazy { reverse.keys.maxOfOrNull { it.length } ?: 1 }

    /** Turns fancy text back into plain letters (used before translating). */
    fun plain(input: String): String {
        val output = StringBuilder(input.length)
        var index = 0
        while (index < input.length) {
            var matched = false
            for (length in minOf(longestStyled, input.length - index) downTo 1) {
                val hit = reverse[input.substring(index, index + length)] ?: continue
                output.append(hit)
                index += length
                matched = true
                break
            }
            if (!matched) {
                output.append(input[index])
                index += 1
            }
        }
        return output.toString()
    }

    fun transform(input: String, styleId: String): String {
        val style = style(styleId)
        if (style.kind == "normal") return input
        val output = StringBuilder(input.length)
        var offset = 0
        while (offset < input.length) {
            val point = input.codePointAt(offset)
            val character = String(Character.toChars(point))
            output.append(style.mapping[character] ?: character)
            offset += Character.charCount(point)
        }
        return output.toString()
    }
}
