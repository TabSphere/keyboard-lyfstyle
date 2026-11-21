import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';

const scalar = (codePoint) => String.fromCodePoint(codePoint);
const sequential = (characters, start) => Object.fromEntries(
  [...characters].map((character, index) => [character, scalar(start + index)]),
);
const merge = (...maps) => Object.assign({}, ...maps);
const explicit = (value) => Object.fromEntries(Object.entries(value));

const mathematical = (id, name, upper, lower, options = {}) => ({
  id,
  name,
  category: options.category ?? 'Classic',
  description: options.description ?? `${name} Unicode letterforms.`,
  kind: 'alphabet',
  isPro: options.isPro ?? false,
  fallback: 'preserve',
  mapping: merge(
    sequential(UPPER, upper),
    sequential(LOWER, lower),
    options.digits ? sequential(DIGITS, options.digits) : {},
    options.exceptions ? explicit(options.exceptions) : {},
  ),
});

const styles = [
  mathematical('bold', 'Serif Bold', 0x1d400, 0x1d41a, { digits: 0x1d7ce, category: 'Bold' }),
  mathematical('italic', 'Serif Italic', 0x1d434, 0x1d44e, {
    exceptions: { h: 'ℎ' },
  }),
  mathematical('bold-italic', 'Bold Italic', 0x1d468, 0x1d482, { isPro: true, category: 'Bold' }),
  mathematical('script', 'Script', 0x1d49c, 0x1d4b6, {
    category: 'Soft',
    exceptions: { B: 'ℬ', E: 'ℰ', F: 'ℱ', H: 'ℋ', I: 'ℐ', L: 'ℒ', M: 'ℳ', R: 'ℛ', e: 'ℯ', g: 'ℊ', o: 'ℴ' },
  }),
  mathematical('bold-script', 'Bold Script', 0x1d4d0, 0x1d4ea, { isPro: true, category: 'Soft' }),
  mathematical('fraktur', 'Fraktur', 0x1d504, 0x1d51e, {
    category: 'Dark',
    exceptions: { C: 'ℭ', H: 'ℌ', I: 'ℑ', R: 'ℜ', Z: 'ℨ' },
  }),
  mathematical('double-struck', 'Double Struck', 0x1d538, 0x1d552, {
    digits: 0x1d7d8,
    exceptions: { C: 'ℂ', H: 'ℍ', N: 'ℕ', P: 'ℙ', Q: 'ℚ', R: 'ℝ', Z: 'ℤ' },
  }),
  mathematical('bold-fraktur', 'Bold Fraktur', 0x1d56c, 0x1d586, { isPro: true, category: 'Dark' }),
  mathematical('sans', 'Sans', 0x1d5a0, 0x1d5ba, { digits: 0x1d7e2 }),
  mathematical('sans-bold', 'Sans Bold', 0x1d5d4, 0x1d5ee, { digits: 0x1d7ec, category: 'Bold' }),
  mathematical('sans-italic', 'Sans Italic', 0x1d608, 0x1d622, { isPro: true }),
  mathematical('sans-bold-italic', 'Sans Bold Italic', 0x1d63c, 0x1d656, { isPro: true, category: 'Bold' }),
  mathematical('monospace', 'Monospace', 0x1d670, 0x1d68a, { digits: 0x1d7f6 }),
  {
    id: 'circled', name: 'Circled', category: 'Playful', kind: 'alphabet', isPro: false,
    description: 'Open circles around Latin letters and digits.', fallback: 'preserve',
    mapping: merge(sequential(UPPER, 0x24b6), sequential(LOWER, 0x24d0), sequential('123456789', 0x2460), { '0': '⓪' }),
  },
  {
    id: 'fullwidth', name: 'Fullwidth', category: 'Bold', kind: 'alphabet', isPro: false,
    description: 'Wide Latin letterforms and fullwidth digits.', fallback: 'preserve',
    mapping: merge(sequential(UPPER, 0xff21), sequential(LOWER, 0xff41), sequential(DIGITS, 0xff10)),
  },
  {
    id: 'small-caps', name: 'Small Caps', category: 'Classic', kind: 'alphabet', isPro: false,
    description: 'Compact capitals; unsupported letters remain unchanged.', fallback: 'preserve',
    mapping: (() => {
      const values = [...'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘꞯʀꜱᴛᴜᴠᴡxʏᴢ'];
      const lower = Object.fromEntries([...LOWER].map((letter, index) => [letter, values[index]]));
      return merge(lower, Object.fromEntries([...UPPER].map((letter, index) => [letter, values[index]])));
    })(),
  },
  {
    id: 'underline', name: 'Underline', category: 'Decorated', kind: 'overlay', isPro: false,
    description: 'A combining low line beneath supported letters and digits.', fallback: 'preserve',
    mapping: Object.fromEntries([...(UPPER + LOWER + DIGITS)].map((letter) => [letter, `${letter}̲`])),
  },
  {
    id: 'negative-circled', name: 'Night Circled', category: 'Dark', kind: 'alphabet', isPro: true,
    description: 'Filled circles for capital letters; other characters stay normal.', fallback: 'preserve',
    mapping: sequential(UPPER, 0x1f150),
  },
  {
    id: 'squared', name: 'Squared', category: 'Playful', kind: 'alphabet', isPro: true,
    description: 'Outlined squares for capital letters; other characters stay normal.', fallback: 'preserve',
    mapping: sequential(UPPER, 0x1f130),
  },
  {
    id: 'negative-squared', name: 'Night Squared', category: 'Dark', kind: 'alphabet', isPro: true,
    description: 'Filled squares for capital letters; other characters stay normal.', fallback: 'preserve',
    mapping: sequential(UPPER, 0x1f170),
  },
  {
    id: 'superscript', name: 'Superscript', category: 'Playful', kind: 'alphabet', isPro: true,
    description: 'Raised Unicode characters. There is no superscript q; gaps remain normal.', fallback: 'preserve',
    mapping: explicit({
      '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹',
      a:'ᵃ',b:'ᵇ',c:'ᶜ',d:'ᵈ',e:'ᵉ',f:'ᶠ',g:'ᵍ',h:'ʰ',i:'ⁱ',j:'ʲ',k:'ᵏ',l:'ˡ',m:'ᵐ',n:'ⁿ',o:'ᵒ',p:'ᵖ',r:'ʳ',s:'ˢ',t:'ᵗ',u:'ᵘ',v:'ᵛ',w:'ʷ',x:'ˣ',y:'ʸ',z:'ᶻ',
      A:'ᴬ',B:'ᴮ',D:'ᴰ',E:'ᴱ',G:'ᴳ',H:'ᴴ',I:'ᴵ',J:'ᴶ',K:'ᴷ',L:'ᴸ',M:'ᴹ',N:'ᴺ',O:'ᴼ',P:'ᴾ',R:'ᴿ',T:'ᵀ',U:'ᵁ',V:'ⱽ',W:'ᵂ',
    }),
  },
  {
    id: 'subscript', name: 'Subscript', category: 'Playful', kind: 'alphabet', isPro: true,
    description: 'Lowered Unicode characters where a standard form exists.', fallback: 'preserve',
    mapping: explicit({
      '0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉',
      a:'ₐ',e:'ₑ',h:'ₕ',i:'ᵢ',j:'ⱼ',k:'ₖ',l:'ₗ',m:'ₘ',n:'ₙ',o:'ₒ',p:'ₚ',r:'ᵣ',s:'ₛ',t:'ₜ',u:'ᵤ',v:'ᵥ',x:'ₓ',
    }),
  },
  {
    id: 'strike', name: 'Strike Through', category: 'Decorated', kind: 'overlay', isPro: true,
    description: 'A combining strike through supported letters and digits.', fallback: 'preserve',
    mapping: Object.fromEntries([...(UPPER + LOWER + DIGITS)].map((letter) => [letter, `${letter}̶`])),
  },
  {
    id: 'upside-down', name: 'Upside Down', category: 'Playful', kind: 'alphabet', isPro: true,
    description: 'Playful rotated-looking letters; punctuation and accents remain normal.', fallback: 'preserve',
    mapping: explicit({
      a:'ɐ',b:'q',c:'ɔ',d:'p',e:'ǝ',f:'ɟ',g:'ƃ',h:'ɥ',i:'ᴉ',j:'ɾ',k:'ʞ',l:'l',m:'ɯ',n:'u',o:'o',p:'d',q:'b',r:'ɹ',s:'s',t:'ʇ',u:'n',v:'ʌ',w:'ʍ',x:'x',y:'ʎ',z:'z',
      A:'∀',B:'𐐒',C:'Ɔ',D:'ᗡ',E:'Ǝ',F:'Ⅎ',G:'⅁',H:'H',I:'I',J:'ſ',K:'ʞ',L:'˥',M:'W',N:'N',O:'O',P:'Ԁ',Q:'Q',R:'ᴚ',S:'S',T:'┴',U:'∩',V:'Λ',W:'M',X:'X',Y:'⅄',Z:'Z',
    }),
  },
];

const catalogue = {
  schemaVersion: 1,
  productId: 'com.tabsphere.keyboardlyfstyle.pro',
  styles: [
    { id: 'normal', name: 'Normal Text', category: 'Core', description: 'Standard text with no transformation.', kind: 'normal', isPro: false, fallback: 'preserve', mapping: {} },
    ...styles,
  ],
  decorations: [
    { id: 'soft-stars', name: 'Soft Stars', type: 'wrapper', prefix: '˚₊· ͟͟͞͞➳❥ ', suffix: ' ˚₊·', isPro: false },
    { id: 'corner-frame', name: 'Corner Frame', type: 'wrapper', prefix: '「 ', suffix: ' 」', isPro: false },
    { id: 'ornate-frame', name: 'Ornate Frame', type: 'wrapper', prefix: '꧁ ', suffix: ' ꧂', isPro: true },
    { id: 'sparkle-frame', name: 'Sparkle Frame', type: 'wrapper', prefix: '✧˖° ', suffix: ' °˖✧', isPro: true },
    { id: 'fine-divider', name: 'Fine Divider', type: 'divider', prefix: '', suffix: '──────────', isPro: false },
    { id: 'botanical-divider', name: 'Botanical Divider', type: 'divider', prefix: '', suffix: '— ❧ —', isPro: true },
  ],
  themes: [
    { id: 'porcelain', name: 'Porcelain', background: '#F4F1EA', key: '#FCFAF5', text: '#1D1D1B', secondary: '#6B675F', accent: '#E85D3F', dark: false },
    { id: 'ink', name: 'Ink', background: '#171816', key: '#272925', text: '#F4F1EA', secondary: '#B8B5AC', accent: '#FF7959', dark: true },
    { id: 'mono', name: 'Mono', background: '#E5E5E1', key: '#F5F5F1', text: '#242422', secondary: '#64645F', accent: '#44443F', dark: false },
    { id: 'blush', name: 'Blush', background: '#F0DDDA', key: '#FAEFEC', text: '#392827', secondary: '#7A5A56', accent: '#A43E3B', dark: false },
  ],
};

if (styles.length !== 24) throw new Error(`Expected 24 styles, found ${styles.length}`);
if (styles.filter((style) => !style.isPro).length !== 12) throw new Error('Expected 12 free styles');
if (styles.filter((style) => style.isPro).length !== 12) throw new Error('Expected 12 Pro styles');
for (const style of catalogue.styles) {
  if (style.fallback !== 'preserve') throw new Error(`${style.id}: unsafe fallback`);
  for (const [input, output] of Object.entries(style.mapping)) {
    if ([...input].length !== 1 || !output) throw new Error(`${style.id}: invalid mapping ${input}`);
  }
}

const json = `${JSON.stringify(catalogue, null, 2)}\n`;
const destinations = [
  'shared/styles.json',
  'targets/keyboard/assets/styles.json',
  'modules/lyfstyle-keyboard/android/src/main/assets/styles.json',
];
for (const destination of destinations) {
  const output = path.join(root, destination);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, json);
}

const androidTestResources = path.join(root, 'modules/lyfstyle-keyboard/android/src/test/resources');
fs.mkdirSync(androidTestResources, { recursive: true });
fs.writeFileSync(path.join(androidTestResources, 'styles.json'), json);
fs.copyFileSync(
  path.join(root, 'shared/golden-tests.json'),
  path.join(androidTestResources, 'golden-tests.json'),
);
console.log(`Generated ${styles.length} audited styles, ${catalogue.decorations.length} decorations and ${catalogue.themes.length} themes.`);
