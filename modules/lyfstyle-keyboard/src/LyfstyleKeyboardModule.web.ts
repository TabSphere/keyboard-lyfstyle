import type { AndroidKeyboardStatus } from './LyfstyleKeyboard.types';

const unavailable = async (): Promise<never> => {
  throw new Error('Lyfstyle native keyboard controls are unavailable on web.');
};

export default {
  openKeyboardSettings: unavailable,
  showKeyboardPicker: unavailable,
  getAndroidKeyboardStatus: async (): Promise<AndroidKeyboardStatus> => ({ enabled: false, selected: false }),
  setProUnlocked: unavailable,
  isProSyncAvailable: async (): Promise<boolean> => false,
  setKeyboardTheme: async (): Promise<void> => undefined,
  setKeyboardPhoto: unavailable,
  clearKeyboardPhoto: async (): Promise<void> => undefined,
};
