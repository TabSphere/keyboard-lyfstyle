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
};
