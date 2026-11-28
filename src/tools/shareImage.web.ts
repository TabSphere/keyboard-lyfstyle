import type { RefObject } from 'react';
import type { View } from 'react-native';

// The web preview has no image capture; the phone apps do.
export async function shareViewAsImage(_ref: RefObject<View | null>): Promise<void> {
  throw new Error('Saving cards as images works in the iPhone and Android apps.');
}

export const canShareImages = false;
