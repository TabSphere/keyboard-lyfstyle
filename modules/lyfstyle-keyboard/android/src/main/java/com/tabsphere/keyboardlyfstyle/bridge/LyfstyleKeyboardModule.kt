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
  }
}
