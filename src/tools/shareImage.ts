import type { RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

/** Renders a view to a PNG and opens the system share sheet (save to Photos, Instagram, etc). */
export async function shareViewAsImage(ref: RefObject<View | null>): Promise<void> {
  const uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' });
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
  await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your Lyfstyle card', UTI: 'public.png' });
}

export const canShareImages = true;
