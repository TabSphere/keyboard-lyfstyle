import ExpoModulesCore

public class LyfstyleKeyboardModule: Module {
  private let appGroup = "group.com.tabsphere.keyboardlyfstyle"

  public func definition() -> ModuleDefinition {
    Name("LyfstyleKeyboard")

    AsyncFunction("openKeyboardSettings") {
      await MainActor.run {
        guard let url = URL(string: UIApplication.openSettingsURLString) else { return }
        UIApplication.shared.open(url)
      }
    }

    AsyncFunction("showKeyboardPicker") {
      throw KeyboardSetupError.onlyAndroid
    }

    AsyncFunction("getAndroidKeyboardStatus") {
      throw KeyboardSetupError.onlyAndroid
    }

    AsyncFunction("setProUnlocked") { (value: Bool) in
      guard let defaults = UserDefaults(suiteName: self.appGroup) else {
        throw KeyboardSetupError.appGroupUnavailable
      }
      defaults.set(value, forKey: "proUnlocked")
      defaults.set(Date().timeIntervalSince1970, forKey: "proSyncedAt")
      defaults.synchronize()
    }

    AsyncFunction("isProSyncAvailable") {
      UserDefaults(suiteName: self.appGroup) != nil
    }

    // The keyboard reads this only with Full Access; otherwise people pick themes in the keyboard itself.
    AsyncFunction("setKeyboardTheme") { (themeId: String) in
      guard let defaults = UserDefaults(suiteName: self.appGroup) else {
        throw KeyboardSetupError.appGroupUnavailable
      }
      defaults.set(themeId, forKey: "theme")
      defaults.set(Date().timeIntervalSince1970, forKey: "themeUpdatedAt")
      defaults.synchronize()
    }
  }
}

enum KeyboardSetupError: Error {
  case onlyAndroid
  case appGroupUnavailable
}
