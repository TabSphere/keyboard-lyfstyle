package com.tabsphere.keyboardlyfstyle.keyboard

import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class StyleCatalogueTest {
    private fun resource(name: String): String {
        val stream = requireNotNull(javaClass.classLoader?.getResourceAsStream(name)) { "Missing $name" }
        return stream.bufferedReader().use { it.readText() }
    }

    private val catalogue = StyleCatalogue(resource("styles.json"))

    @Test
    fun matchesEveryGoldenFixture() {
        val cases = JSONObject(resource("golden-tests.json")).getJSONArray("cases")
        for (index in 0 until cases.length()) {
            val fixture = cases.getJSONObject(index)
            assertEquals(
                fixture.getString("styleId"),
                fixture.getString("expected"),
                catalogue.transform(fixture.getString("input"), fixture.getString("styleId")),
            )
        }
    }

    @Test
    fun plainUndoesEveryKeyboardStyleForTranslation() {
        val message = "Hello there, see you at 9"
        // These share a letter shape with another style (e.g. Greek Λ, Crossbar Ŧ), or swap in plain letters, so they are not exactly reversible.
        val ambiguous = setOf("upside-down", "greek", "crossbar", "curvy")
        for (style in catalogue.keyboardStyles.filter { it.id !in ambiguous }) {
            val styled = catalogue.transform(message, style.id)
            val back = catalogue.plain(styled)
            // Styles that swap letters for other plain letters can't be undone; everything else must round-trip.
            if (styled.any { it.code > 127 }) assertEquals(style.id, message.lowercase(), back.lowercase())
        }
    }

    @Test
    fun unknownStyleFallsBackToNormal() {
        assertEquals("normal", catalogue.style("unknown").id)
        assertEquals("A 👨‍👩‍👧‍👦", catalogue.transform("A 👨‍👩‍👧‍👦", "unknown"))
    }

    @Test
    fun catalogueCountsMatchProductContract() {
        val styled = catalogue.styles.filter { it.id != "normal" }
        assertEquals(112, styled.size)
        // Only per-character styles reach the keyboard; frames and joiners are app-only.
        assertEquals(60, catalogue.keyboardStyles.size)
        assertTrue(catalogue.keyboardStyles.all { it.kind == "alphabet" || it.kind == "overlay" })
        assertEquals(112, catalogue.themes.size)
        assertEquals(88, catalogue.themes.count { it.image != null })
        assertTrue(catalogue.themes.all { it.group.isNotEmpty() })
        assertTrue(catalogue.keyboardStyles.all { it.group.isNotEmpty() })
        assertEquals(3, catalogue.themes.count { !it.isPro })
        assertEquals(3, styled.count { !it.isPro })
        assertTrue(catalogue.styles.all { it.mapping.values.none { output -> output.isEmpty() } })
    }

    @Test
    fun loadsCustomStylesFirstAndIgnoresJunk() {
        val local = StyleCatalogue(resource("styles.json"))
        local.loadCustom("""[{"id":"custom-1","name":"Mine","mapping":{"a":"α","b":"𝓫"}},{"id":"script","name":"Hijack","mapping":{}}]""")
        assertEquals(1, local.custom.size)
        assertEquals("custom-1", local.keyboardStyles.first().id)
        assertEquals(StyleCatalogue.MY_STYLES, local.style("custom-1").group)
        assertEquals("α𝓫c", local.transform("abc", "custom-1"))
        assertEquals("Script", local.style("script").name)
        local.loadCustom("not json")
        assertTrue(local.custom.isEmpty())
        assertEquals("normal", local.style("custom-1").id)
    }
}
