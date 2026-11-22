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
            )
        }
    }
    val keyboardStyles: List<TextStyle> get() = styles.filter { it.keyboard && it.id != "normal" }

    fun style(id: String): TextStyle = styles.firstOrNull { it.id == id } ?: styles.first { it.id == "normal" }
    fun theme(id: String): KeyboardPalette = themes.firstOrNull { it.id == id } ?: themes.first()

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
