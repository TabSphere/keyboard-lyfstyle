package com.tabsphere.keyboardlyfstyle.keyboard

import android.content.Context
import org.json.JSONArray
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
    /** Styles the person made in the app ("My styles"). Letters only; frames stay in the app. */
    var custom: List<TextStyle> = emptyList()
        private set

    /** Reads the JSON the app saves: [{ id, name, mapping }]. Bad input leaves no custom styles. */
    fun loadCustom(json: String?) {
        ownReverse.clear()
        custom = try {
            val array = JSONArray(json ?: "[]")
            (0 until array.length()).mapNotNull { index ->
                val item = array.optJSONObject(index) ?: return@mapNotNull null
                val id = item.optString("id")
                if (!id.startsWith(CUSTOM_PREFIX)) return@mapNotNull null
                val mappingJson = item.optJSONObject("mapping") ?: JSONObject()
                val mapping = buildMap { mappingJson.keys().forEach { key -> put(key, mappingJson.optString(key, key)) } }
                TextStyle(
                    id = id, name = item.optString("name", "My style").ifBlank { "My style" },
                    category = "Mine", description = "", kind = "alphabet", isPro = true,
                    keyboard = true, mapping = mapping, group = MY_STYLES,
                )
            }
        } catch (_: Exception) {
            emptyList()
        }
    }

    val keyboardStyles: List<TextStyle> get() = custom + styles.filter { it.keyboard && it.id != "normal" }

    fun style(id: String): TextStyle = custom.firstOrNull { it.id == id }
        ?: styles.firstOrNull { it.id == id } ?: styles.first { it.id == "normal" }

    companion object {
        const val CUSTOM_PREFIX = "custom-"
        const val MY_STYLES = "My styles"
    }
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

    /** One style's own styled → plain map (lower case wins when a letter has both cases). */
    private val ownReverse = HashMap<String, Map<String, String>>()
    private fun reverseFor(styleId: String): Map<String, String> = ownReverse.getOrPut(styleId) {
        val style = style(styleId)
        if (style.id != styleId || style.kind == "normal") return@getOrPut emptyMap()
        val map = HashMap<String, String>()
        style.mapping.forEach { (plain, styled) ->
            if (styled == plain) return@forEach
            val existing = map[styled]
            if (existing == null || (existing != existing.lowercase() && plain == plain.lowercase())) map[styled] = plain
        }
        map
    }

    /**
     * Turns fancy text back into plain letters. Some fonts share symbols (Curvy's "w" is
     * Upside-down's "m"), so pass the font being typed in as [prefer] and its letters are
     * read first; anything else falls back to every font.
     */
    fun plain(input: String, prefer: String? = null): String {
        val own = prefer?.let { reverseFor(it) } ?: emptyMap()
        val longest = maxOf(longestStyled, own.keys.maxOfOrNull { it.length } ?: 1)
        val output = StringBuilder(input.length)
        var index = 0
        while (index < input.length) {
            var matched = false
            for (length in minOf(longest, input.length - index) downTo 1) {
                val key = input.substring(index, index + length)
                val hit = own[key] ?: reverse[key] ?: continue
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
