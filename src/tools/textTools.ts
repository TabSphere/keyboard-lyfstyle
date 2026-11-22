import { transformText } from '../styleEngine';

// ---- Text repeater -------------------------------------------------------

export type RepeatSeparator = 'newline' | 'space' | 'none';

export function repeatText(text: string, count: number, separator: RepeatSeparator): string {
  const times = Math.max(1, Math.min(500, Math.floor(count) || 1));
  const glue = separator === 'newline' ? '\n' : separator === 'space' ? ' ' : '';
  return Array.from({ length: times }, () => text).join(glue);
}

// ---- Emoji to text (big letters drawn with an emoji) ---------------------

// 5x5 pixel letters. '#' is drawn with the chosen emoji.
const GLYPHS: Record<string, string[]> = {
  A: ['.###.', '#...#', '#####', '#...#', '#...#'],
  B: ['####.', '#...#', '####.', '#...#', '####.'],
  C: ['.####', '#....', '#....', '#....', '.####'],
  D: ['####.', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '####.', '#....', '#####'],
  F: ['#####', '#....', '####.', '#....', '#....'],
  G: ['.####', '#....', '#..##', '#...#', '.###.'],
  H: ['#...#', '#...#', '#####', '#...#', '#...#'],
  I: ['#####', '..#..', '..#..', '..#..', '#####'],
  J: ['#####', '...#.', '...#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '###..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '####.', '#....', '#....'],
  Q: ['.###.', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '####.', '#..#.', '#...#'],
  S: ['.####', '#....', '.###.', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#.#.#', '##.##', '#...#'],
  X: ['#...#', '.#.#.', '..#..', '.#.#.', '#...#'],
  Y: ['#...#', '.#.#.', '..#..', '..#..', '..#..'],
  Z: ['#####', '...#.', '..#..', '.#...', '#####'],
  '0': ['.###.', '#..##', '#.#.#', '##..#', '.###.'],
  '1': ['..#..', '.##..', '..#..', '..#..', '.###.'],
  '2': ['.###.', '#...#', '..##.', '.#...', '#####'],
  '3': ['####.', '....#', '.###.', '....#', '####.'],
  '4': ['#..#.', '#..#.', '#####', '...#.', '...#.'],
  '5': ['#####', '#....', '####.', '....#', '####.'],
  '6': ['.###.', '#....', '####.', '#...#', '.###.'],
  '7': ['#####', '...#.', '..#..', '.#...', '.#...'],
  '8': ['.###.', '#...#', '.###.', '#...#', '.###.'],
  '9': ['.###.', '#...#', '.####', '....#', '.###.'],
  '!': ['..#..', '..#..', '..#..', '.....', '..#..'],
  '?': ['.###.', '#...#', '..##.', '.....', '..#..'],
  '♥': ['.#.#.', '#####', '#####', '.###.', '..#..'],
};

export const MAX_EMOJI_ART_CHARACTERS = 12;

/** Draws each supported character as a 5x5 block of `emoji`, one letter under another. */
export function emojiArt(text: string, emoji: string, blank = '⬜'): string {
  const letters = Array.from(text.toUpperCase())
    .filter((character) => character === ' ' || GLYPHS[character])
    .slice(0, MAX_EMOJI_ART_CHARACTERS);
  const blocks: string[] = [];
  for (const letter of letters) {
    if (letter === ' ') continue;
    blocks.push(GLYPHS[letter].map((row) => Array.from(row, (cell) => (cell === '#' ? emoji : blank)).join('')).join('\n'));
  }
  return blocks.join('\n\n');
}

export function emojiArtSupports(character: string): boolean {
  return Boolean(GLYPHS[character.toUpperCase()]);
}

// ---- Username generator --------------------------------------------------

const PATTERNS: ((name: string) => string)[] = [
  (n) => n,
  (n) => `${n}.official`,
  (n) => `itz.${n}`,
  (n) => `the.${n}`,
  (n) => `_${n}_`,
  (n) => `${n}.xo`,
  (n) => `its${n}`,
  (n) => `${n}_vibes`,
  (n) => `lil.${n}`,
  (n) => `${n}.studio`,
  (n) => `x${n}x`,
  (n) => `${n}isonline`,
];

const LOOKS = ['normal', 'small-caps', 'sans-bold', 'script', 'bold-script', 'double-struck', 'monospace', 'greek', 'wizard', 'frame-sparkles', 'frame-moon', 'between-stars'];

export type UsernameIdea = { plain: string; styled: string; styleId: string };

/** Plain handles (usable on Instagram/TikTok) plus a styled display name for each. */
export function usernameIdeas(raw: string): UsernameIdea[] {
  const name = raw.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, '').slice(0, 20);
  if (!name) return [];
  return PATTERNS.map((pattern, index) => {
    const plain = pattern(name);
    const styleId = LOOKS[index % LOOKS.length];
    return { plain, styleId, styled: transformText(plain, styleId) };
  });
}
