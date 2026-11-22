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
    fun unknownStyleFallsBackToNormal() {
        assertEquals("normal", catalogue.style("unknown").id)
        assertEquals("A 👨‍👩‍👧‍👦", catalogue.transform("A 👨‍👩‍👧‍👦", "unknown"))
    }

    @Test
    fun catalogueCountsMatchProductContract() {
        val styled = catalogue.styles.filter { it.id != "normal" }
        assertEquals(100, styled.size)
        // Only per-character styles reach the keyboard; frames and joiners are app-only.
        assertEquals(48, catalogue.keyboardStyles.size)
        assertTrue(catalogue.keyboardStyles.all { it.kind == "alphabet" || it.kind == "overlay" })
        assertEquals(24, catalogue.themes.size)
        assertEquals(8, catalogue.themes.count { !it.isPro })
        assertTrue(catalogue.styles.all { it.mapping.values.none { output -> output.isEmpty() } })
    }
}
