import { NativeModule, requireNativeModule } from 'expo';
import type { LyfstyleKeyboardNativeModule } from './LyfstyleKeyboard.types';

declare class LyfstyleKeyboardModule extends NativeModule<LyfstyleKeyboardNativeModule> implements LyfstyleKeyboardNativeModule {
  openKeyboardSettings(): Promise<void>;
  showKeyboardPicker(): Promise<void>;
  getAndroidKeyboardStatus(): Promise<import('./LyfstyleKeyboard.types').AndroidKeyboardStatus>;
  setProUnlocked(value: boolean): Promise<void>;
  isProSyncAvailable(): Promise<boolean>;
  setKeyboardTheme(themeId: string): Promise<void>;
  setKeyboardPhoto(fileUri: string): Promise<void>;
  clearKeyboardPhoto(): Promise<void>;
  setCustomTheme(json: string): Promise<void>;
  setCustomStyles(json: string): Promise<void>;
  setKeyboardOptions(json: string): Promise<void>;
  setPhotoDim(value: number): Promise<void>;
  hasMicrophone(): Promise<boolean>;
  requestMicrophone(): Promise<void>;
}

export default requireNativeModule<LyfstyleKeyboardModule>('LyfstyleKeyboard');
