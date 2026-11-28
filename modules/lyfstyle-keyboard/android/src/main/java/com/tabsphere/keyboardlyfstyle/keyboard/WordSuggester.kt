package com.tabsphere.keyboardlyfstyle.keyboard

import org.json.JSONArray
import org.json.JSONObject

/**
 * Word completions and next-word guesses, worked out on the phone. It works on plain
 * letters: the keyboard turns styled text back into plain letters first, and styles
 * the chosen word again when it types it.
 *
 * It also learns the words (and word pairs) the person types, so their own slang and
 * names come up. That stays in the keyboard's private storage and never leaves the phone.
 */
class WordSuggester(
    private val words: List<String>,
    private val next: Map<String, List<String>>,
) {
    data class Result(
        /** The half-typed word the suggestions would replace ("" after a space). */
        val partial: String,
        val words: List<String>,
    )

    private val learned = LinkedHashMap<String, Int>()
    private val learnedPairs = LinkedHashMap<String, Int>()

    fun suggest(before: String, limit: Int = 3): Result {
        if (before.isEmpty()) return EMPTY
        val partial = trailingWord(before)
        if (partial.isNotEmpty()) {
            val typed = key(partial)
            if (typed.isEmpty()) return EMPTY
            val mine = learned.entries.filter { it.value >= 2 && key(it.key).startsWith(typed) }
                .sortedByDescending { it.value }.map { it.key }
            val listed = words.filter { key(it).startsWith(typed) }
            val picks = (mine + listed)
                .filter { it != partial && !(it.equals(partial, ignoreCase = true) && it == it.lowercase()) }
                .map { matchCase(it, partial) }
                .filter { it != partial }
                .distinctBy { it.lowercase() }
                .take(limit)
            return Result(partial, picks)
        }
        // After a space: guess the next word from the last one or two words.
        if (before.last() != ' ') return EMPTY
        val trimmed = before.trimEnd()
        if (trimmed.isEmpty() || trimmed.last() in ".!?\n") return EMPTY
        val tokens = trimmed.split(Regex("[^\\p{L}'’]+")).filter { it.isNotEmpty() }
        if (tokens.isEmpty() || !isWordChar(trimmed.last())) return EMPTY
        val previous = tokens.last().lowercase()
        val pair = if (tokens.size >= 2) "${tokens[tokens.size - 2].lowercase()} $previous" else null
        val mine = learnedPairs.entries.filter { it.value >= 2 && it.key.startsWith("$previous ") }
            .sortedByDescending { it.value }.map { it.key.substringAfter(' ') }
        val listed = (pair?.let { next[it] } ?: emptyList()) + (next[previous] ?: emptyList())
        return Result("", (mine + listed).distinctBy { it.lowercase() }.take(limit))
    }

    /** Remembers a finished word (and the word before it). */
    fun learn(word: String, previous: String?) {
        val clean = word.trim('\'', '’')
        if (clean.length < 2 || clean.length > 24 || !clean.all { isWordChar(it) }) return
        // Keep capitals only for names mid-sentence ("Lagos"), not for sentence starts.
        val stored = if (previous != null && clean.first().isUpperCase() && clean.drop(1) == clean.drop(1).lowercase()) clean else clean.lowercase()
        learned[stored] = (learned.remove(stored) ?: 0) + 1
        if (previous != null) {
            val pair = "${previous.lowercase()} ${clean.lowercase()}"
            learnedPairs[pair] = (learnedPairs.remove(pair) ?: 0) + 1
        }
        trim(learned, MAX_WORDS)
        trim(learnedPairs, MAX_PAIRS)
    }

    fun exportLearned(): String = JSONObject()
        .put("w", JSONObject(learned as Map<*, *>))
        .put("p", JSONObject(learnedPairs as Map<*, *>))
        .toString()

    fun importLearned(json: String?) {
        learned.clear()
        learnedPairs.clear()
        runCatching {
            val root = JSONObject(json ?: return)
            root.optJSONObject("w")?.let { w -> w.keys().forEach { learned[it] = w.optInt(it, 1) } }
            root.optJSONObject("p")?.let { p -> p.keys().forEach { learnedPairs[it] = p.optInt(it, 1) } }
        }
    }

    fun forgetLearned() {
        learned.clear()
        learnedPairs.clear()
    }

    companion object {
        private val EMPTY = Result("", emptyList())
        private const val MAX_WORDS = 600
        private const val MAX_PAIRS = 800

        fun fromJson(json: String): WordSuggester {
            val root = JSONObject(json)
            val list = root.getJSONArray("words").let { array -> (0 until array.length()).map { array.getString(it) } }
            val nextJson = root.getJSONObject("next")
            val next = buildMap {
                nextJson.keys().forEach { key ->
                    val items: JSONArray = nextJson.getJSONArray(key)
                    put(key, (0 until items.length()).map { items.getString(it) })
                }
            }
            return WordSuggester(list, next)
        }

        fun isWordChar(c: Char) = c.isLetter() || c == '\'' || c == '’'
        fun key(word: String) = word.lowercase().filter { it.isLetter() }

        /** The letters right before the cursor ("" if the cursor follows a space or symbol). */
        fun trailingWord(text: String): String {
            var start = text.length
            while (start > 0 && isWordChar(text[start - 1])) start--
            return text.substring(start)
        }

        /** "Lo" → "Love", "LO" → "LOVE"; list words with their own capitals ("I'm") stay as they are. */
        fun matchCase(word: String, typed: String): String = when {
            typed.length > 1 && typed.all { !it.isLetter() || it.isUpperCase() } -> word.uppercase()
            typed.first().isUpperCase() -> word.replaceFirstChar { it.uppercase() }
            else -> word
        }

        private fun trim(map: LinkedHashMap<String, Int>, max: Int) {
            while (map.size > max) {
                // Drop the least-used of the oldest entries.
                val victim = map.entries.take(50).minByOrNull { it.value }?.key ?: break
                map.remove(victim)
            }
        }
    }
}
