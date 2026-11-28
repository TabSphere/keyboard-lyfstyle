export type AndroidKeyboardStatus = {
  enabled: boolean;
  selected: boolean;
};

export type LyfstyleKeyboardNativeModule = {
  openKeyboardSettings(): Promise<void>;
  showKeyboardPicker(): Promise<void>;
  getAndroidKeyboardStatus(): Promise<AndroidKeyboardStatus>;
  setProUnlocked(value: boolean): Promise<void>;
  isProSyncAvailable(): Promise<boolean>;
  setKeyboardTheme(themeId: string): Promise<void>;
  setKeyboardPhoto(fileUri: string): Promise<void>;
  clearKeyboardPhoto(): Promise<void>;
  /** JSON: { background, key, text, accent, keyAlpha } — also selects the "custom-colors" theme. */
  setCustomTheme(json: string): Promise<void>;
  /** JSON array of { id, name, mapping } — the person's own styles, shown under "My styles". */
  setCustomStyles(json: string): Promise<void>;
  /** 0 (no darkening) to 0.8 (very dark) for the photo behind the keys. */
  setPhotoDim(value: number): Promise<void>;
  /** Android: whether voice typing in the keyboard may use the microphone. Always false on iPhone. */
  hasMicrophone(): Promise<boolean>;
  /** Android: shows the system microphone prompt. No-op on iPhone. */
  requestMicrophone(): Promise<void>;
};
