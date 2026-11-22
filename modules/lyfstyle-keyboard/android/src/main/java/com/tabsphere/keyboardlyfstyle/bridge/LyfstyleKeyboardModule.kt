package com.tabsphere.keyboardlyfstyle.bridge

import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.view.inputmethod.InputMethodManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class LyfstyleKeyboardModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("LyfstyleKeyboard")

    AsyncFunction("openKeyboardSettings") {
      val context = appContext.reactContext ?: throw IllegalStateException("No application context")
      context.startActivity(Intent(Settings.ACTION_INPUT_METHOD_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }

    AsyncFunction("showKeyboardPicker") {
      val context = appContext.reactContext ?: throw IllegalStateException("No application context")
      val manager = context.getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
      manager.showInputMethodPicker()
    }

    AsyncFunction("getAndroidKeyboardStatus") {
      val context = appContext.reactContext ?: throw IllegalStateException("No application context")
      val component = android.content.ComponentName(context, "com.tabsphere.keyboardlyfstyle.keyboard.LyfstyleImeService")
      val enabled = Settings.Secure.getString(context.contentResolver, Settings.Secure.ENABLED_INPUT_METHODS)
        ?.contains(component.flattenToShortString()) == true
      val selected = Settings.Secure.getString(context.contentResolver, Settings.Secure.DEFAULT_INPUT_METHOD)
        ?.contains(component.flattenToShortString()) == true
      mapOf("enabled" to enabled, "selected" to selected)
    }

    AsyncFunction("setProUnlocked") { value: Boolean ->
      val context = appContext.reactContext ?: throw IllegalStateException("No application context")
      context.getSharedPreferences("lyfstyle_keyboard", Context.MODE_PRIVATE)
        .edit()
        .putBoolean("proUnlocked", value)
        .putLong("proSyncedAt", System.currentTimeMillis())
        .apply()
    }

    AsyncFunction("isProSyncAvailable") { true }

    // The keyboard runs in this app's process, so it can read a file in our private files dir.
    AsyncFunction("setKeyboardPhoto") { fileUri: String ->
      val context = appContext.reactContext ?: throw IllegalStateException("No application context")
      val source = android.net.Uri.parse(fileUri)
      val target = java.io.File(context.filesDir, "keyboard_photo.jpg")
      context.contentResolver.openInputStream(source).use { input ->
        requireNotNull(input) { "Could not read the chosen photo" }
        target.outputStream().use { output -> input.copyTo(output) }
      }
      context.getSharedPreferences("lyfstyle_keyboard", Context.MODE_PRIVATE)
        .edit()
        .putString("theme", "custom-photo")
        .putLong("photoUpdatedAt", System.currentTimeMillis())
        .apply()
    }

    AsyncFunction("clearKeyboardPhoto") {
      val context = appContext.reactContext ?: throw IllegalStateException("No application context")
      java.io.File(context.filesDir, "keyboard_photo.jpg").delete()
      val preferences = context.getSharedPreferences("lyfstyle_keyboard", Context.MODE_PRIVATE)
      if (preferences.getString("theme", "") == "custom-photo") {
        preferences.edit().putString("theme", "pop-pink").apply()
      }
    }

    // Voice typing in the keyboard needs the microphone permission, which only the app can ask for.
    AsyncFunction("hasMicrophone") {
      val context = appContext.reactContext ?: throw IllegalStateException("No application context")
      context.checkSelfPermission(android.Manifest.permission.RECORD_AUDIO) == android.content.pm.PackageManager.PERMISSION_GRANTED
    }

    AsyncFunction("requestMicrophone") {
      val activity = appContext.currentActivity ?: throw IllegalStateException("No activity")
      activity.requestPermissions(arrayOf(android.Manifest.permission.RECORD_AUDIO), 4711)
    }

    // Colours mixed on the colour wheel: JSON with background, key, text, accent, keyAlpha.
    AsyncFunction("setCustomTheme") { json: String ->
      val context = appContext.reactContext ?: throw IllegalStateException("No application context")
      org.json.JSONObject(json) // reject malformed input before saving it
      context.getSharedPreferences("lyfstyle_keyboard", Context.MODE_PRIVATE)
        .edit()
        .putString("customTheme", json)
        .putString("theme", "custom-colors")
        .apply()
    }

    // How much to darken the person's photo behind the keys (0 = not at all, 0.8 = very dark).
    AsyncFunction("setPhotoDim") { value: Double ->
      val context = appContext.reactContext ?: throw IllegalStateException("No application context")
      context.getSharedPreferences("lyfstyle_keyboard", Context.MODE_PRIVATE)
        .edit()
        .putFloat("photoDim", value.toFloat().coerceIn(0f, 0.8f))
        .apply()
    }

    AsyncFunction("setKeyboardTheme") { themeId: String ->
      val context = appContext.reactContext ?: throw IllegalStateException("No application context")
      context.getSharedPreferences("lyfstyle_keyboard", Context.MODE_PRIVATE)
        .edit()
        .putString("theme", themeId)
        .apply()
    }
  }
}
