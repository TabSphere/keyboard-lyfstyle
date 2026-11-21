package com.tabsphere.keyboardlyfstyle.keyboard

import android.inputmethodservice.InputMethodService
import android.view.KeyEvent
import android.view.View
import android.view.inputmethod.EditorInfo

class LyfstyleImeService : InputMethodService() {
    private var keyboardView: LyfstyleKeyboardView? = null

    override fun onCreateInputView(): View {
        return LyfstyleKeyboardView(this).also { keyboardView = it }
    }

    override fun onStartInputView(info: EditorInfo?, restarting: Boolean) {
        super.onStartInputView(info, restarting)
        keyboardView?.onInputStarted(info)
    }

    override fun onFinishInputView(finishingInput: Boolean) {
        keyboardView?.stopKeyRepeat()
        super.onFinishInputView(finishingInput)
    }

    override fun onEvaluateFullscreenMode(): Boolean = false

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_DEL) {
            keyboardView?.deleteLastGrapheme()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }
}
