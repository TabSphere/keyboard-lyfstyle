import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import NativeKeyboard from '../nativeKeyboard';

/**
 * Lets the person pick a photo, crops it to keyboard shape, shrinks it (keyboards have
 * tight memory limits, especially on iPhone) and hands it to the native keyboard.
 * Returns the local URI of the saved preview, or null if they cancelled.
 */
export async function pickKeyboardPhoto(): Promise<string | null> {
  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 1,
  });
  if (picked.canceled || !picked.assets?.length) return null;

  const context = ImageManipulator.manipulate(picked.assets[0].uri);
  context.resize({ width: 1080 });
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });

  await NativeKeyboard.setKeyboardPhoto(saved.uri);
  return saved.uri;
}

export async function removeKeyboardPhoto(): Promise<void> {
  await NativeKeyboard.clearKeyboardPhoto();
}
