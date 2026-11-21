import catalogueJson from '../shared/styles.json';

export type StyleKind = 'normal' | 'alphabet' | 'overlay';
export type Lyfstyle = {
  id: string;
  name: string;
  category: string;
  description: string;
  kind: StyleKind;
  isPro: boolean;
  fallback: 'preserve';
  mapping: Record<string, string>;
};
export type Decoration = {
  id: string;
  name: string;
  type: 'wrapper' | 'divider';
  prefix: string;
  suffix: string;
  isPro: boolean;
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
};

export const catalogue = catalogueJson as unknown as {
  schemaVersion: number;
  productId: string;
  styles: Lyfstyle[];
  decorations: Decoration[];
  themes: KeyboardTheme[];
};

export const styles = catalogue.styles;
export const themes = catalogue.themes;
export const decorations = catalogue.decorations;
export const PRODUCT_ID = catalogue.productId;

export function getStyle(styleId: string): Lyfstyle {
  return styles.find((style) => style.id === styleId) ?? styles[0];
}

export function transformText(input: string, styleId: string): string {
  const style = getStyle(styleId);
  if (style.kind === 'normal') return input;
  return Array.from(input, (character) => style.mapping[character] ?? character).join('');
}

export function unsupportedCharacters(input: string, styleId: string): string[] {
  const style = getStyle(styleId);
  if (style.kind === 'normal') return [];
  const missing = new Set<string>();
  for (const character of input) {
    if (/^[\p{L}\p{N}]$/u.test(character) && !style.mapping[character]) missing.add(character);
  }
  return [...missing];
}

export function availableStyles(isPro: boolean): Lyfstyle[] {
  return styles.filter((style) => style.id !== 'normal' && (isPro || !style.isPro));
}

export function applyDecoration(input: string, decorationId: string): string {
  const decoration = decorations.find((item) => item.id === decorationId);
  if (!decoration) return input;
  if (decoration.type === 'divider') return `${input}${input.trim() ? '\n' : ''}${decoration.suffix}`;
  return `${decoration.prefix}${input}${decoration.suffix}`;
}

export function compatibilityMessage(input: string, styleId: string): string {
  const missing = unsupportedCharacters(input, styleId);
  if (!missing.length) return 'Every letter and number in this preview has a styled form.';
  const list = missing.slice(0, 6).join(', ');
  const more = missing.length > 6 ? ` and ${missing.length - 6} more` : '';
  return `${missing.length} character${missing.length === 1 ? '' : 's'} kept normal: ${list}${more}.`;
}
