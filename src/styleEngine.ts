import catalogueJson from '../shared/styles.json';

// normal: unchanged text. alphabet/overlay: per-character mapping (works in the keyboards).
// composite: a mapping plus a frame (prefix/suffix) and/or a joiner between letters.
// Composites wrap a whole message, so they are app-only (keyboard: false).
export type StyleKind = 'normal' | 'alphabet' | 'overlay' | 'composite';
export type Lyfstyle = {
  id: string;
  name: string;
  category: string;
  description: string;
  kind: StyleKind;
  isPro: boolean;
  fallback: 'preserve';
  keyboard: boolean;
  mapping: Record<string, string>;
  prefix?: string;
  suffix?: string;
  joiner?: string;
};
export type KeyboardTheme = {
  id: string;
  name: string;
  background: string;
  key: string;
  text: string;
  secondary: string;
  accent: string;
  dark: boolean;
  isPro: boolean;
  /** Picture themes: image file in assets/keyboard-themes and key opacity. */
  image?: string;
  keyAlpha?: number;
};

export const catalogue = catalogueJson as unknown as {
  schemaVersion: number;
  productId: string;
  styles: Lyfstyle[];
  themes: KeyboardTheme[];
};

export const styles = catalogue.styles;
export const themes = catalogue.themes;
export const PRODUCT_ID = catalogue.productId;

/** Categories in the order the app shows them. */
export const CATEGORIES = ['Emoji', 'Cute', 'Bold', 'Fancy', 'Soft', 'Dark', 'Playful', 'Effects', 'Kaomoji', 'Classic', 'Decorated'] as const;

export function getStyle(styleId: string): Lyfstyle {
  return styles.find((style) => style.id === styleId) ?? styles[0];
}

const joinable = /^[A-Za-z0-9]$/;

export function transformText(input: string, styleId: string): string {
  const style = getStyle(styleId);
  if (style.kind === 'normal') return input;
  const characters = Array.from(input);
  let output = '';
  characters.forEach((character, index) => {
    output += style.mapping[character] ?? character;
    const next = characters[index + 1];
    if (style.joiner && next !== undefined && joinable.test(character) && joinable.test(next)) {
      output += style.joiner;
    }
  });
  if (style.kind === 'composite' && input.trim()) {
    return `${style.prefix ?? ''}${output}${style.suffix ?? ''}`;
  }
  return output;
}

export function unsupportedCharacters(input: string, styleId: string): string[] {
  const style = getStyle(styleId);
  if (style.kind === 'normal' || Object.keys(style.mapping).length === 0) return [];
  const missing = new Set<string>();
  for (const character of input) {
    if (/^[\p{L}\p{N}]$/u.test(character) && !style.mapping[character]) missing.add(character);
  }
  return [...missing];
}

export function availableStyles(isPro: boolean): Lyfstyle[] {
  return styles.filter((style) => style.id !== 'normal' && (isPro || !style.isPro));
}

export function keyboardStyles(): Lyfstyle[] {
  return styles.filter((style) => style.id !== 'normal' && style.keyboard);
}

export function compatibilityMessage(input: string, styleId: string): string {
  const missing = unsupportedCharacters(input, styleId);
  if (!missing.length) return 'Every letter and number has a styled form.';
  const list = missing.slice(0, 6).join(', ');
  const more = missing.length > 6 ? ` and ${missing.length - 6} more` : '';
  return `${missing.length} character${missing.length === 1 ? '' : 's'} kept normal: ${list}${more}.`;
}
