import { styles, type Lyfstyle } from './styleEngine';

// A style someone makes in the app: a base alphabet, an optional effect on top,
// an optional frame and joiner, and any single letters they swapped by hand.
export type CustomStyleSpec = {
  id: string;
  name: string;
  /** Alphabet style id, or "normal" for plain letters. */
  base: string;
  /** Overlay style id (underline, glitch…) or null. */
  effect: string | null;
  prefix: string;
  suffix: string;
  joiner: string;
  /** Hand-picked replacements, e.g. { a: "α" }. */
  overrides: Record<string, string>;
  createdAt: number;
};

export const CUSTOM_ID_PREFIX = 'custom-';
export const MY_STYLES_GROUP = 'My styles';
export const MAX_CUSTOM_STYLES = 30;
// maxLength on inputs counts UTF-16 units, which is never fewer than the code points kept here.
export const LIMITS = { name: 24, frame: 16, joiner: 6, letter: 6 } as const;

const graphemes = (value: string) => Array.from(value);
const clip = (value: unknown, max: number) => (typeof value === 'string' ? graphemes(value).slice(0, max).join('') : '');

export const LETTERS = [...'abcdefghijklmnopqrstuvwxyz', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', ...'0123456789'];

/** Base alphabets people can start from (plain letters first). */
export const BASE_OPTIONS = styles.filter((style) => style.id === 'normal' || style.kind === 'alphabet');
/** Effects that sit on top of any letter. */
export const EFFECT_OPTIONS = styles.filter((style) => style.kind === 'overlay');

const unique = <T,>(items: T[], key: (item: T) => string) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

/** Frames taken from the shipped emoji-frame styles. */
export const FRAME_PRESETS = unique(
  styles
    .filter((style) => style.kind === 'composite' && (style.prefix || style.suffix))
    .map((style) => ({ prefix: style.prefix ?? '', suffix: style.suffix ?? '' })),
  (frame) => `${frame.prefix}|${frame.suffix}`,
);

/** Between-letter joiners taken from the shipped styles. */
export const JOINER_PRESETS = unique(
  styles.filter((style) => style.joiner).map((style) => style.joiner as string),
  (joiner) => joiner,
);

/** The combining marks an effect adds to one letter (works for precomposed letters too). */
function effectMarks(effect: Lyfstyle | undefined, character: string): string {
  if (!effect) return '';
  const styled = effect.mapping[character];
  if (!styled) return '';
  const decomposed = styled.normalize('NFD');
  const plain = character.normalize('NFD');
  return decomposed.startsWith(plain) ? decomposed.slice(plain.length) : '';
}

/** Every styled form of one letter across the catalogue, for the letter-by-letter editor. */
export function letterChoices(character: string): string[] {
  const forms = styles
    .filter((style) => style.kind === 'alphabet')
    .map((style) => style.mapping[character])
    .filter((form): form is string => Boolean(form) && form !== character);
  return [character, ...new Set(forms)];
}

export function newCustomStyle(now = Date.now()): CustomStyleSpec {
  return { id: `${CUSTOM_ID_PREFIX}${now}`, name: '', base: 'script', effect: null, prefix: '', suffix: '', joiner: '', overrides: {}, createdAt: now };
}

/** Turns a saved spec into a style the engine, the cards and the keyboards understand. */
export function resolveCustomStyle(spec: CustomStyleSpec): Lyfstyle {
  const base = styles.find((style) => style.id === spec.base && (style.kind === 'alphabet' || style.id === 'normal'));
  const effect = spec.effect ? styles.find((style) => style.id === spec.effect && style.kind === 'overlay') : undefined;
  const keys = new Set([...LETTERS, ...Object.keys(base?.mapping ?? {}), ...Object.keys(spec.overrides)]);
  const mapping: Record<string, string> = {};
  for (const character of keys) {
    const letter = spec.overrides[character] || base?.mapping[character] || character;
    const out = letter + effectMarks(effect, character);
    if (out !== character) mapping[character] = out;
  }
  const framed = Boolean(spec.prefix || spec.suffix || spec.joiner);
  return {
    id: spec.id,
    name: spec.name.trim() || 'My style',
    category: 'Mine',
    group: MY_STYLES_GROUP,
    description: 'A style you made.',
    kind: framed ? 'composite' : 'alphabet',
    isPro: true,
    fallback: 'preserve',
    keyboard: true,
    mapping,
    ...(spec.prefix ? { prefix: spec.prefix } : {}),
    ...(spec.suffix ? { suffix: spec.suffix } : {}),
    ...(spec.joiner ? { joiner: spec.joiner } : {}),
  };
}

/** Cleans anything read back from storage; returns null for junk. */
export function sanitizeSpec(value: unknown): CustomStyleSpec | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.id !== 'string' || !raw.id.startsWith(CUSTOM_ID_PREFIX)) return null;
  const overrides: Record<string, string> = {};
  if (raw.overrides && typeof raw.overrides === 'object') {
    for (const [key, form] of Object.entries(raw.overrides as Record<string, unknown>)) {
      const letter = clip(form, LIMITS.letter);
      if (LETTERS.includes(key) && letter) overrides[key] = letter;
    }
  }
  return {
    id: raw.id,
    name: clip(raw.name, LIMITS.name),
    base: typeof raw.base === 'string' ? raw.base : 'normal',
    effect: typeof raw.effect === 'string' ? raw.effect : null,
    prefix: clip(raw.prefix, LIMITS.frame),
    suffix: clip(raw.suffix, LIMITS.frame),
    joiner: clip(raw.joiner, LIMITS.joiner),
    overrides,
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : 0,
  };
}

/** What the keyboards get: letters only. Frames and joiners wrap a whole message, so they stay in the app. */
export function keyboardPayload(list: Lyfstyle[]): string {
  return JSON.stringify(list.map((style) => ({ id: style.id, name: style.name, mapping: style.mapping })));
}
