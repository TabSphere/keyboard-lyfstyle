import { ImageBackground, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { transformText, type KeyboardTheme } from '../styleEngine';
import { colors, radii } from '../theme/tokens';
import { keyboardPictures } from '../theme/keyboardPictures';
import { type } from './ui';

// Saved in AsyncStorage by the Keyboard tab and the colour wheel.
export const THEME_KEY = 'lyfstyle.keyboardTheme';
export const PHOTO_KEY = 'lyfstyle.keyboardPhoto';
export const PHOTO_DIM_KEY = 'lyfstyle.keyboardPhotoDim';
export const CUSTOM_KEY = 'lyfstyle.customTheme';

/** The person's own photo, shown with white glass keys (matches the native keyboards). */
export const PHOTO_THEME: KeyboardTheme = {
  id: 'custom-photo', name: 'Your photo', background: '#22172F', key: '#FFFFFF', text: '#FFFFFF',
  secondary: '#EDE6F0', accent: '#FF3D8B', dark: true, isPro: true, image: '@photo', keyAlpha: 0.22, group: 'Yours',
};

export type CustomColours = { background: string; key: string; text: string; accent: string; keyAlpha: number };

export const DEFAULT_CUSTOM: CustomColours = { background: '#FFE0EA', key: '#FFFFFF', text: '#22172F', accent: '#FF3D8B', keyAlpha: 1 };

/** "My colours" from the colour wheel, in the same shape as the built-in themes. */
export function customTheme(colours: CustomColours): KeyboardTheme {
  return {
    id: 'custom-colors', name: 'My colours', background: colours.background, key: colours.key,
    text: colours.text, secondary: colours.text, accent: colours.accent,
    dark: luminance(colours.background) < 0.5, isPro: true, keyAlpha: colours.keyAlpha, group: 'Yours',
  };
}

export function luminance(hex: string) {
  const value = parseInt(hex.slice(1), 16);
  return (0.2126 * ((value >> 16) & 255) + 0.7152 * ((value >> 8) & 255) + 0.0722 * (value & 255)) / 255;
}

export function accentText(hex: string) {
  return luminance(hex) > 0.55 ? colors.ink : colors.white;
}

/** Key colour with the theme's opacity, so picture themes show through. */
export function keyColor(theme: KeyboardTheme) {
  const value = parseInt(theme.key.slice(1), 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${theme.keyAlpha ?? 1})`;
}

export function pictureSource(theme: KeyboardTheme, photoUri?: string | null): ImageSourcePropType | null {
  if (!theme.image) return null;
  if (theme.image === '@photo') return photoUri ? { uri: photoUri } : null;
  return keyboardPictures[theme.image] ?? null;
}

/** A small picture of the keyboard. Letters are drawn in `styleId`, like the real keyboard. */
export function KeyboardPreview({ theme, photoUri, photoDim = 0.3, styleId = 'script' }: {
  theme: KeyboardTheme; photoUri?: string | null; photoDim?: number; styleId?: string;
}) {
  const rows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  const source = pictureSource(theme, photoUri);
  const keyBg = keyColor(theme);
  const content = (
    <>
      <View style={styles.bar}>
        {['𝓢𝓬𝓻𝓲𝓹𝓽', '✨ ✨', '𝗕𝗼𝗹𝗱', 'ⓑⓤⓑ', '(◕‿◕)'].map((label, index) => (
          <View key={label} style={[styles.chip, { backgroundColor: index === 0 ? theme.accent : keyBg }]}>
            <Text style={[styles.chipText, { color: index === 0 ? accentText(theme.accent) : theme.text }]}>{label}</Text>
          </View>
        ))}
      </View>
      {rows.map((row) => (
        <View key={row} style={styles.row}>
          {Array.from(row).map((letter) => (
            <View key={letter} style={[styles.key, { backgroundColor: keyBg }]}>
              <Text style={[styles.keyText, { color: theme.text }]}>{transformText(letter, styleId)}</Text>
            </View>
          ))}
        </View>
      ))}
      <View style={styles.row}>
        <View style={[styles.key, styles.wide, { backgroundColor: keyBg }]}><Text style={[styles.keyText, { color: theme.text }]}>123</Text></View>
        <View style={[styles.key, styles.space, { backgroundColor: keyBg }]}><Text style={[styles.keyText, { color: theme.secondary }]}>{transformText('lyfstyle', styleId)}</Text></View>
        <View style={[styles.key, styles.wide, { backgroundColor: theme.accent }]}><Text style={[styles.keyText, { color: accentText(theme.accent) }]}>↵</Text></View>
      </View>
    </>
  );
  const label = `Preview of the ${theme.name} keyboard`;
  if (source) {
    return (
      <ImageBackground source={source} resizeMode="cover" accessibilityLabel={label} style={[styles.preview, { backgroundColor: theme.background }]} imageStyle={styles.image}>
        {theme.image === '@photo' ? <View style={[styles.dim, { backgroundColor: `rgba(0,0,0,${photoDim})` }]} /> : null}
        {content}
      </ImageBackground>
    );
  }
  return <View style={[styles.preview, { backgroundColor: theme.background }]} accessibilityLabel={label}>{content}</View>;
}

const styles = StyleSheet.create({
  preview: { borderRadius: radii.large, padding: 8, gap: 6, marginBottom: 18 },
  bar: { flexDirection: 'row', gap: 5, overflow: 'hidden', marginBottom: 2 },
  chip: { borderRadius: radii.pill, paddingHorizontal: 10, height: 28, justifyContent: 'center' },
  chipText: { fontSize: 12 },
  row: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
  key: {
    flex: 1, maxWidth: 34, height: 40, borderRadius: 7, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 0, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  keyText: { fontFamily: type.semibold, fontSize: 16 },
  wide: { maxWidth: 56, flex: 1.6 },
  space: { maxWidth: 220, flex: 6 },
  image: { borderRadius: radii.large },
  dim: { ...StyleSheet.absoluteFillObject, borderRadius: radii.large },
});
