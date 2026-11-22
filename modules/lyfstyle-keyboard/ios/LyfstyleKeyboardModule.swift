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

    // The photo goes into the App Group container. iOS only lets the keyboard read it
    // when Full Access is on; without it the keyboard falls back to a built-in theme.
    AsyncFunction("setKeyboardPhoto") { (fileUri: String) in
      guard let source = URL(string: fileUri),
            let container = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: self.appGroup),
            let defaults = UserDefaults(suiteName: self.appGroup) else {
        throw KeyboardSetupError.appGroupUnavailable
      }
      let target = container.appendingPathComponent("keyboard_photo.jpg")
      let data = try Data(contentsOf: source)
      try data.write(to: target, options: .atomic)
      defaults.set("custom-photo", forKey: "theme")
      defaults.set(Date().timeIntervalSince1970, forKey: "themeUpdatedAt")
      defaults.synchronize()
    }

    AsyncFunction("clearKeyboardPhoto") {
      guard let container = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: self.appGroup),
            let defaults = UserDefaults(suiteName: self.appGroup) else { return }
      try? FileManager.default.removeItem(at: container.appendingPathComponent("keyboard_photo.jpg"))
      if defaults.string(forKey: "theme") == "custom-photo" {
        defaults.set("pop-pink", forKey: "theme")
        defaults.set(Date().timeIntervalSince1970, forKey: "themeUpdatedAt")
      }
    }

    // iPhone keyboards can't use the microphone (Apple rule); people use Apple's dictation mic instead.
    AsyncFunction("hasMicrophone") { false }
    AsyncFunction("requestMicrophone") {}

    // Colours mixed on the colour wheel: JSON with background, key, text, accent, keyAlpha.
    // Like the photo, the keyboard can only read this with Full Access on.
    AsyncFunction("setCustomTheme") { (json: String) in
      guard let defaults = UserDefaults(suiteName: self.appGroup) else {
        throw KeyboardSetupError.appGroupUnavailable
      }
      guard let data = json.data(using: .utf8), (try? JSONSerialization.jsonObject(with: data)) != nil else {
        throw KeyboardSetupError.invalidTheme
      }
      defaults.set(json, forKey: "customTheme")
      defaults.set("custom-colors", forKey: "theme")
      defaults.set(Date().timeIntervalSince1970, forKey: "themeUpdatedAt")
      defaults.synchronize()
    }

    // How much to darken the person's photo behind the keys (0 = not at all, 0.8 = very dark).
    AsyncFunction("setPhotoDim") { (value: Double) in
      guard let defaults = UserDefaults(suiteName: self.appGroup) else {
        throw KeyboardSetupError.appGroupUnavailable
      }
      defaults.set(min(max(value, 0), 0.8), forKey: "photoDim")
      defaults.synchronize()
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
  case invalidTheme
}
