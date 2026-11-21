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
  }
}

enum KeyboardSetupError: Error {
  case onlyAndroid
  case appGroupUnavailable
}
