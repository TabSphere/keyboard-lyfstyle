package com.tabsphere.keyboardlyfstyle.keyboard

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class WordSuggesterTest {
    private fun resource(name: String): String {
        val stream = requireNotNull(javaClass.classLoader?.getResourceAsStream(name)) { "Missing $name" }
        return stream.bufferedReader().use { it.readText() }
    }

    private fun suggester() = WordSuggester.fromJson(resource("extras.json"))

    @Test
    fun completesHalfTypedWords() {
        val result = suggester().suggest("I lo")
        assertEquals("lo", result.partial)
        assertTrue(result.words.isNotEmpty())
        assertTrue(result.words.all { it.lowercase().startsWith("lo") })
        assertTrue(result.words.size <= 3)
    }

    @Test
    fun keepsTheCaseThePersonTyped() {
        assertTrue(suggester().suggest("Lo").words.all { it.first().isUpperCase() })
        assertTrue(suggester().suggest("LO").words.all { it == it.uppercase() })
    }

    @Test
    fun offersContractionsWithoutTheApostrophe() {
        assertTrue("I'm" in suggester().suggest("im").words || "I'm" in suggester().suggest("i").words)
        assertTrue(suggester().suggest("don").words.contains("don't"))
    }

    @Test
    fun guessesTheNextWordAfterASpace() {
        val result = suggester().suggest("I love ")
        assertEquals("", result.partial)
        assertTrue(result.words.contains("you"))
        assertTrue(suggester().suggest("happy ").words.contains("birthday"))
    }

    @Test
    fun staysQuietWhereSuggestionsMakeNoSense() {
        assertTrue(suggester().suggest("").words.isEmpty())
        assertTrue(suggester().suggest("Hello. ").words.isEmpty())
        assertTrue(suggester().suggest("12 ").words.isEmpty())
    }

    @Test
    fun learnsThePersonsOwnWords() {
        val words = suggester()
        assertTrue("Zainab" !in words.suggest("Za").words)
        words.learn("Zainab", "hey")
        words.learn("Zainab", "hey")
        assertEquals("Zainab", words.suggest("Za").words.first())
        assertEquals("zainab", words.suggest("hey ").words.first().lowercase())
        val copy = suggester().apply { importLearned(words.exportLearned()) }
        assertEquals("Zainab", copy.suggest("Za").words.first())
        copy.forgetLearned()
        assertTrue("Zainab" !in copy.suggest("Za").words)
    }

    @Test
    fun findsTheWordBeforeTheCursor() {
        assertEquals("lo", WordSuggester.trailingWord("I lo"))
        assertEquals("", WordSuggester.trailingWord("I love "))
        assertEquals("don't", WordSuggester.trailingWord("I don't"))
    }
}
