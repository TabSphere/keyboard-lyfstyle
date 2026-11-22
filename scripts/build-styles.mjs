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

// ---------------------------------------------------------------------------
// v1.1 additions. Per-character styles work everywhere, including the keyboards.
// "Composite" styles (frames, between-letter joiners, kaomoji) wrap a whole
// message, so they are app-only (keyboard: false) and need no native support.
// ---------------------------------------------------------------------------

const byId = (id) => {
  const style = styles.find((item) => item.id === id);
  if (!style) throw new Error(`Unknown base style ${id}`);
  return style;
};
const both = (map) => merge(map, Object.fromEntries(Object.entries(map).map(([k, v]) => [k.toUpperCase(), v])));
const bothCases = (start) => merge(sequential(UPPER, start), sequential(LOWER, start));
const fromString = (letters) => {
  const values = [...letters];
  if (values.length !== 26) throw new Error(`Alphabet needs 26 letters, got ${values.length}`);
  return both(Object.fromEntries([...LOWER].map((letter, index) => [letter, values[index]])));
};
const overlay = (id, name, mark, options = {}) => ({
  id, name, category: options.category ?? 'Effects', kind: 'overlay', isPro: options.isPro ?? false,
  description: options.description ?? `${name} effect on letters and digits.`, fallback: 'preserve',
  mapping: Object.fromEntries([...(UPPER + LOWER + DIGITS)].map((letter) => [letter, `${letter}${mark}`])),
});
const alphabet = (id, name, mapping, options = {}) => ({
  id, name, category: options.category ?? 'Fancy', kind: 'alphabet', isPro: options.isPro ?? false,
  description: options.description ?? `${name} letterforms.`, fallback: 'preserve', mapping,
});

const moreFonts = [
  alphabet('bubble-filled', 'Night Bubble', bothCases(0x1f150), { category: 'Cute', description: 'Filled bubbles for every letter (shown as capitals).' }),
  alphabet('squared-all', 'Box Letters', bothCases(0x1f130), { category: 'Playful', description: 'Outlined squares for every letter (shown as capitals).' }),
  alphabet('night-box', 'Night Box', bothCases(0x1f170), { category: 'Bold', isPro: true, description: 'Filled squares for every letter (shown as capitals).' }),
  alphabet('parenthesized', 'Brackets', merge(sequential(LOWER, 0x249c), sequential(UPPER, 0x249c)), { category: 'Playful', isPro: true, description: 'Each letter in its own brackets.' }),
  alphabet('currency', 'Money', fromString('₳฿₵ĐɆ₣₲ⱧłJ₭Ⱡ₥₦Ø₱QⱤ₴₮ɄV₩ӾɎⱫ'), { category: 'Fancy', isPro: true }),
  alphabet('greek', 'Greekish', fromString('ΛBᄃDΣFGΉIJKᄂMПӨPQЯƧƬЦVЩXYZ'), { category: 'Fancy' }),
  alphabet('asian', 'Brush', fromString('卂乃匚ᗪ乇千Ꮆ卄丨ﾌҜㄥ爪几ㄖ卩Ɋ尺丂ㄒㄩᐯ山乂ㄚ乙'), { category: 'Fancy', isPro: true }),
  alphabet('wizard', 'Wizard', fromString('ᗩᗷᑕᗪEᖴGᕼIᒍKᒪᗰᑎOᑭᑫᖇᔕTᑌᐯᗯ᙭Yᘔ'), { category: 'Fancy' }),
  alphabet('rune', 'Runes', fromString('ᚨᛒᚲᛞᛖᚠᚷᚺᛁᛃᚲᛚᛗᚾᛟᛈᛩᚱᛋᛏᚢᚡᚹᛪᚤᛉ'), { category: 'Dark', isPro: true }),
  alphabet('cute-alpha', 'Kawaii', fromString('ąცƈɖɛʄɠɧıʝƙƖɱŋơ℘զཞʂɬų۷ῳҳყʑ'), { category: 'Cute' }),
  alphabet('tiny-cursive', 'Curly', fromString('ᥲᑲᥴᑯᥱ𝖿ᧁһᎥ᧒kᥣ𝗆ᥒ᥆ρqr᥉𝗍ᥙ᥎ᥕ᥊ᥡ𝗓'), { category: 'Cute', isPro: true }),
  alphabet('dotted', 'Sprinkles', fromString('ȧḃċḋėḟġḣıȷkŀṁṅȯṗqṙṡṫüvẇẋẏż'), { category: 'Cute', isPro: true }),
  alphabet('mirror', 'Mirror', fromString('ɒdɔbɘʇϱʜiįʞlmnoqpɿƨƚυvwxγz'), { category: 'Playful', isPro: true }),
  alphabet('wide-tiny', 'Tiny Wide', fromString('ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖᑫʳˢᵗᵘᵛʷˣʸᶻ'), { category: 'Cute' }),
];

const moreEffects = [
  overlay('glitch', 'Glitch', '̴͓', { isPro: false }),
  overlay('slash', 'Slashed', '̸'),
  overlay('double-underline', 'Double Underline', '̳'),
  overlay('overline', 'Overline', '̅', { isPro: true }),
  overlay('wavy', 'Wavy', '̰', { isPro: true }),
  overlay('arrows-below', 'Arrows', '͎', { isPro: true }),
  overlay('crossed', 'Crossed', '̽', { isPro: true }),
  overlay('heart-top', 'Love Notes', '͆', { isPro: true }),
  overlay('rain', 'Rain', '̤', { isPro: true }),
  overlay('boxed', 'Boxed', '⃞', { isPro: true, category: 'Playful' }),
];

styles.push(...moreFonts, ...moreEffects);

const composite = (id, name, category, { base = 'normal', prefix = '', suffix = '', joiner = '', isPro = false, description }) => ({
  id, name, category, kind: 'composite', isPro,
  description: description ?? `${name}: a finished look for bios, captions and chats.`,
  fallback: 'preserve',
  keyboard: false,
  mapping: base === 'normal' ? {} : { ...byId(base).mapping },
  prefix, suffix, joiner,
});

const frames = [
  ['sparkles', 'Sparkles', 'bold-script', '✨ ', ' ✨', false],
  ['flowers', 'Blossom', 'script', '🌸 ', ' 🌸', false],
  ['hearts', 'Love Hearts', 'bold', '💖 ', ' 💖', false],
  ['star-wave', 'Star Wave', 'sans-bold', '★彡 ', ' 彡★', false],
  ['moon', 'Moonlight', 'small-caps', '☾ ⋆ ', ' ⋆ ☽', false],
  ['butterfly', 'Butterfly', 'script', '🦋 ', ' 🦋', false],
  ['bow', 'Coquette Bow', 'normal', '🎀 ', ' 🎀', false],
  ['cloud', 'Cloud Nine', 'normal', '☁️ ', ' ☁️', false],
  ['fire', 'On Fire', 'sans-bold', '🔥 ', ' 🔥', false],
  ['crown', 'Royal', 'fraktur', '👑 ', ' 👑', false],
  ['wings', 'Angel Wings', 'fraktur', '꧁ ', ' ꧂', true],
  ['soft-kawaii', 'Soft Kawaii', 'normal', 'ʚ ', ' ɞ ♡', false],
  ['corner', 'Corners', 'normal', '「 ', ' 」', false],
  ['lenticular', 'Lenticular', 'sans-bold', '【 ', ' 】', true],
  ['white-corner', 'Quote Marks', 'normal', '『 ', ' 』', true],
  ['sparkle-dust', 'Stardust', 'script', '⋆｡°✩ ', ' ✩°｡⋆', true],
  ['heart-ribbon', 'Ribbon Hearts', 'normal', '𓆩♡𓆪 ', ' 𓆩♡𓆪', true],
  ['swirl', 'Swirl', 'small-caps', '˗ˏˋ ', ' ˎˊ˗', true],
  ['cherry', 'Cherry', 'normal', '🍒 ', ' 🍒', true],
  ['rainbow', 'Rainbow', 'normal', '🌈 ', ' 🌈', true],
  ['skull', 'Spooky', 'fraktur', '💀 ', ' 💀', true],
  ['ghost', 'Ghosted', 'normal', '👻 ', ' 👻', true],
  ['alien', 'Not From Here', 'monospace', '👽 ', ' 👽', true],
  ['money', 'Money Moves', 'sans-bold', '💸 ', ' 💸', true],
  ['lightning', 'Electric', 'sans-bold', '⚡ ', ' ⚡', true],
  ['music', 'On Repeat', 'script', '♫ ', ' ♫', true],
  ['bear-hug', 'Bear Hug', 'normal', 'ʕ•ᴥ•ʔ ', ' ♡', true],
  ['kitty', 'Kitty', 'normal', 'ฅ^•ﻌ•^ฅ ', '', true],
  ['arrow-heart', 'Cupid', 'script', '➳ ', ' ♡', true],
  ['brackets-soft', 'Soft Brackets', 'normal', '꒰ ', ' ꒱', true],
  ['twinkle', 'Twinkle', 'normal', '✧･ﾟ ', ' ✧･ﾟ', true],
  ['peace', 'Good Vibes', 'normal', '☮︎ ', ' ✌︎', true],
].map(([id, name, base, prefix, suffix, isPro]) => composite(`frame-${id}`, name, 'Emoji', { base, prefix, suffix, isPro }));

const joiners = [
  ['hearts', 'Heart Beats', '♡', false],
  ['stars', 'Starry', '⋆', false],
  ['spaced', 'S p a c e d', ' ', false],
  ['dots', 'Dotted', '·', true],
  ['sparkle', 'Glimmer', '✧', true],
  ['flowers', 'Flower Chain', '✿', true],
  ['music', 'Melody', '♪', true],
  ['wave', 'Wavy Chain', '~', true],
  ['bubbles', 'Bubbles', '°', true],
  ['arrows', 'Arrows Between', '➝', true],
].map(([id, name, joiner, isPro]) => composite(`between-${id}`, name, 'Cute', { joiner, isPro }));

const kaomoji = [
  ['love', 'Love Struck', ' (｡♡‿♡｡)', false],
  ['bear', 'Little Bear', ' ʕ•ᴥ•ʔ', false],
  ['hug', 'Big Hug', ' (づ｡◕‿‿◕｡)づ', false],
  ['flower', 'Flower Face', ' (◕‿◕✿)', true],
  ['cheer', 'Cheer', ' ٩(◕‿◕)۶', true],
  ['happy', 'So Happy', ' (≧◡≦)', true],
  ['flip', 'Table Flip', ' (╯°□°)╯︵ ┻━┻', true],
  ['shrug', 'Shrug', ' ¯\\_(ツ)_/¯', true],
  ['magic', 'Magic', ' (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧', true],
  ['cool', 'Too Cool', ' (⌐■_■)', true],
].map(([id, name, suffix, isPro]) => composite(`kaomoji-${id}`, name, 'Kaomoji', { suffix, isPro }));

const catalogue = {
  schemaVersion: 2,
  productId: 'com.tabsphere.keyboardlyfstyle.pro',
  styles: [
    { id: 'normal', name: 'Normal Text', category: 'Core', description: 'Standard text with no transformation.', kind: 'normal', isPro: false, fallback: 'preserve', mapping: {} },
    ...styles.map((style) => ({ ...style, keyboard: true })),
    ...frames,
    ...joiners,
    ...kaomoji,
  ],
  // Decorations were folded into the "Emoji" composite styles in schema 2.
  decorations: [],
  // Pop Sugar keyboard themes (no purples or pale blues). The first 8 are free.
  themes: [
    theme('pop-pink', 'Hot Pink', '#FF3D8B', '#FF70A8', '#FFFFFF', '#FFE0EC', '#FFD84D', true, false),
    theme('blush', 'Blush', '#FFE1EC', '#FFFFFF', '#22172F', '#8A6A7C', '#FF3D8B', false, false),
    theme('sun', 'Sun', '#FFD84D', '#FFFFFF', '#22172F', '#6E5A10', '#FF3D8B', false, false),
    theme('mint', 'Mint', '#A8E8CF', '#FFFFFF', '#22172F', '#3D6B58', '#FF3D8B', false, false),
    theme('peach', 'Peach', '#FFD3C2', '#FFFFFF', '#22172F', '#7E5446', '#FF3D8B', false, false),
    theme('lemon', 'Lemon', '#FFF5B8', '#FFFFFF', '#22172F', '#6E6630', '#FF3D8B', false, false),
    theme('tangerine', 'Tangerine', '#FF8A2A', '#FFA65E', '#FFFFFF', '#FFE6D1', '#22172F', true, false),
    theme('midnight', 'Midnight', '#17121F', '#2C2433', '#FFF3F6', '#B9A8B8', '#FF3D8B', true, false),
    theme('bubblegum', 'Bubblegum', '#FF8FBF', '#FFB3D4', '#22172F', '#6B2846', '#FFD84D', false, true),
    theme('cherry', 'Cherry', '#E8304A', '#F05468', '#FFFFFF', '#FFD6DC', '#FFD84D', true, true),
    theme('raspberry', 'Raspberry', '#C2185B', '#D6407A', '#FFFFFF', '#FFD0E2', '#FFD84D', true, true),
    theme('coral', 'Coral', '#FF6A5C', '#FF8C80', '#FFFFFF', '#FFE2DE', '#22172F', true, true),
    theme('rose', 'Rose', '#F4B6C2', '#FFE7EC', '#3A1F27', '#7D4F5B', '#E8304A', false, true),
    theme('lime-pop', 'Lime Pop', '#C6F432', '#E3FA92', '#1A2410', '#4E5E1F', '#FF3D8B', false, true),
    theme('emerald', 'Emerald', '#12B886', '#3CCB9E', '#FFFFFF', '#D5F5EA', '#FFD84D', true, true),
    theme('forest', 'Forest', '#1F5F46', '#2D7659', '#FFFFFF', '#CDE5DA', '#FFD84D', true, true),
    theme('sage', 'Sage', '#CFE3C8', '#FFFFFF', '#1F2A1C', '#55684F', '#FF3D8B', false, true),
    theme('ocean', 'Ocean', '#1D4ED8', '#3B67E4', '#FFFFFF', '#D6E4FF', '#FFD84D', true, true),
    theme('butter', 'Butter', '#FFF0D1', '#FFFFFF', '#2B2414', '#7A6A48', '#FF8A2A', false, true),
    theme('caramel', 'Caramel', '#C8823A', '#D69A5C', '#FFFFFF', '#FBE7D2', '#22172F', true, true),
    theme('mocha', 'Mocha', '#4A3428', '#634738', '#FFF3E8', '#CDB6A6', '#FF8FBF', true, true),
    theme('cream', 'Cream', '#FFF6EE', '#FFFFFF', '#22172F', '#7A6A62', '#E8304A', false, true),
    theme('graphite', 'Graphite', '#2B2B30', '#3E3E45', '#FFFFFF', '#B0B0B8', '#FFD84D', true, true),
    theme('neon-night', 'Neon Night', '#0F0F1A', '#1E1E33', '#E8FFF9', '#8F9BB8', '#38F2C0', true, true),
  ],
};

function theme(id, name, background, key, text, secondary, accent, dark, isPro) {
  return { id, name, background, key, text, secondary, accent, dark, isPro };
}

// Picture themes: a designed image behind see-through keys (keyAlpha = key opacity).
// Images live in assets/keyboard-themes/ and are copied into both keyboards below.
// `background` is the image's dominant colour, used while it loads or if it fails.
function pictureTheme(id, name, background, text, secondary, accent, dark, keyAlpha) {
  return {
    id, name, background, key: dark ? '#FFFFFF' : '#FFFFFF', text, secondary, accent, dark, isPro: true,
    image: `${id}.jpg`, keyAlpha,
  };
}
catalogue.themes.push(
  pictureTheme('sunset', 'Sunset', '#FF6A5C', '#22172F', '#5A2A3A', '#22172F', false, 0.78),
  pictureTheme('starry-night', 'Starry Night', '#0F1A3D', '#FFFFFF', '#C9C6E8', '#FFD84D', true, 0.16),
  pictureTheme('candy-hearts', 'Candy Hearts', '#FFD6E7', '#22172F', '#7A3A58', '#FF3D8B', false, 0.86),
  pictureTheme('daisy-days', 'Daisy Days', '#FFE88A', '#22172F', '#6E5A10', '#FF3D8B', false, 0.86),
  pictureTheme('aurora', 'Aurora', '#0E2A33', '#FFFFFF', '#BFE9E0', '#38F2C0', true, 0.16),
  pictureTheme('dreamy', 'Dreamy', '#FFD9CF', '#22172F', '#7E5446', '#FF3D8B', false, 0.68),
  pictureTheme('gingham', 'Picnic', '#FFE1EC', '#22172F', '#7A3A58', '#E8304A', false, 0.9),
  pictureTheme('ocean-waves', 'Ocean Waves', '#1D4ED8', '#FFFFFF', '#D6E4FF', '#FFD84D', true, 0.2),
  // Textures (v1.2).
  pictureTheme('leaves', 'Leaves', '#174D31', '#FFFFFF', '#CDEBD7', '#FFD84D', true, 0.18),
  pictureTheme('marble', 'Marble', '#F3F0EC', '#22172F', '#6E6378', '#C9A23F', false, 0.72),
  pictureTheme('pink-glitter', 'Pink Glitter', '#FF5AA0', '#22172F', '#7A3A58', '#22172F', false, 0.82),
  pictureTheme('clouds', 'Clouds', '#A8DBFF', '#22172F', '#3A5A78', '#FF3D8B', false, 0.8),
  pictureTheme('cherry-blossom', 'Cherry Blossom', '#FFE8F0', '#22172F', '#7A3A58', '#FF3D8B', false, 0.8),
  pictureTheme('checkers', 'Checkers', '#E4D9FF', '#22172F', '#5B4A8A', '#FF3D8B', false, 0.9),
  pictureTheme('butterflies', 'Butterflies', '#C9B2FA', '#22172F', '#4A3A75', '#FF3D8B', false, 0.84),
  pictureTheme('leopard', 'Leopard', '#E6C08A', '#22172F', '#6B4A26', '#22172F', false, 0.84),
  pictureTheme('lemons', 'Lemonade', '#3FAACB', '#22172F', '#2E5A6B', '#FFD84D', false, 0.86),
  pictureTheme('holo', 'Holo', '#EDE4FF', '#22172F', '#6E6378', '#FF3D8B', false, 0.62),
  pictureTheme('snowfall', 'Snowfall', '#0B2545', '#FFFFFF', '#D6E4FF', '#FF3D8B', true, 0.16),
  pictureTheme('strawberries', 'Strawberries', '#FFD6E0', '#22172F', '#7A3A58', '#F0384F', false, 0.86),
  // Photo-style pictures (v1.2, supplied artwork cut by hand into keyboard shape).
  pictureTheme('golden-lake', 'Golden Lake', '#E89A6A', '#22172F', '#5A3A4A', '#FF3D8B', false, 0.78),
  pictureTheme('neon-wave', 'Neon Wave', '#0B1030', '#FFFFFF', '#D6D3E8', '#8B7BFF', true, 0.16),
  pictureTheme('pastel-flow', 'Pastel Flow', '#FCEFE3', '#22172F', '#5A4A66', '#FF3D8B', false, 0.82),
  pictureTheme('monstera', 'Monstera', '#0F3324', '#FFFFFF', '#CDEBD7', '#FFD84D', true, 0.16),
  pictureTheme('london-nights', 'London Nights', '#3B2A5C', '#FFFFFF', '#E6DDF5', '#FFB547', true, 0.18),
  pictureTheme('above-clouds', 'Above the Clouds', '#C9B6E8', '#22172F', '#5A4A66', '#FF3D8B', false, 0.75),
  pictureTheme('neon-lines', 'Neon Lines', '#0A0F24', '#FFFFFF', '#D6D3E8', '#3B82F6', true, 0.16),
  pictureTheme('zen', 'Zen', '#7FA85A', '#22172F', '#2F4A22', '#22172F', false, 0.8),
  pictureTheme('sakura', 'Sakura', '#F7C9D6', '#22172F', '#7A3A58', '#FF3D8B', false, 0.8),
  pictureTheme('galaxy', 'Galaxy', '#0B0F2E', '#FFFFFF', '#D6D3E8', '#B57BFF', true, 0.16),
  pictureTheme('beach-day', 'Beach Day', '#4FC7C7', '#22172F', '#1F4A55', '#0E8A99', false, 0.8),
  pictureTheme('gold-lines', 'Gold Lines', '#141414', '#FFFFFF', '#E8DDC0', '#D9B45A', true, 0.14),
);

// Picture pack (v1.2): supplied artwork, cut to keyboard shape. List in keyboard-picture-pack.json.
const pack = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'keyboard-picture-pack.json'), 'utf8'));
for (const item of pack) {
  catalogue.themes.push(item.dark
    ? pictureTheme(item.id, item.name, item.background, '#FFFFFF', '#E6E1F0', '#FF3D8B', true, 0.2)
    : pictureTheme(item.id, item.name, item.background, '#22172F', '#5A4A66', '#FF3D8B', false, 0.78));
}

// Theme groups, so the pickers can show sections instead of one long list.
const THEME_GROUPS = {
  'Cute & sweet': ['candy-hearts', 'daisy-days', 'gingham', 'pink-glitter', 'cherry-blossom', 'checkers', 'butterflies', 'strawberries', 'lemons', 'holo', 'dreamy', 'pastel-flow', 'sakura'],
  'Nature & sky': ['sunset', 'starry-night', 'aurora', 'ocean-waves', 'leaves', 'clouds', 'snowfall', 'golden-lake', 'monstera', 'above-clouds', 'zen', 'galaxy', 'beach-day'],
  'Luxe & textures': ['marble', 'leopard', 'gold-lines'],
  'City & neon': ['london-nights', 'neon-wave', 'neon-lines'],
};
const packGroups = new Map(pack.map((item) => [item.id, item.group]));
for (const item of catalogue.themes) {
  item.group = !item.image ? 'Colours'
    : packGroups.get(item.id) ?? Object.entries(THEME_GROUPS).find(([, ids]) => ids.includes(item.id))?.[0];
  if (!item.group) throw new Error(`${item.id}: no theme group`);
}

// Font groups: nine clear sections instead of one long list (app and keyboard).
const STYLE_GROUPS = {
  'Cursive & cute': ['script', 'bold-script', 'tiny-cursive', 'cute-alpha', 'bubble-filled', 'dotted', 'wide-tiny'],
  'Bold & clean': ['bold', 'bold-italic', 'sans-bold', 'sans-bold-italic', 'italic', 'sans', 'sans-italic', 'monospace', 'double-struck', 'small-caps', 'fullwidth'],
  'Bubbles & boxes': ['circled', 'negative-circled', 'squared', 'negative-squared', 'squared-all', 'night-box', 'parenthesized', 'boxed'],
  'Gothic & fancy': ['fraktur', 'bold-fraktur', 'rune', 'currency', 'greek', 'asian', 'wizard'],
  Effects: ['glitch', 'slash', 'double-underline', 'overline', 'wavy', 'arrows-below', 'crossed', 'heart-top', 'rain', 'underline', 'strike'],
  'Fun & flipped': ['superscript', 'subscript', 'upside-down', 'mirror'],
};
for (const style of catalogue.styles) {
  if (style.id === 'normal') style.group = 'Normal';
  else if (style.id.startsWith('between-')) style.group = 'Spaced out';
  else if (style.id.startsWith('frame-')) style.group = 'Emoji frames';
  else if (style.id.startsWith('kaomoji-')) style.group = 'Kaomoji';
  else style.group = Object.entries(STYLE_GROUPS).find(([, ids]) => ids.includes(style.id))?.[0];
  if (!style.group) throw new Error(`${style.id}: no font group`);
}

// Free tier (decided 2026-11-22): Script, Sans Bold and Sparkles are free, plus the Hot Pink,
// Blush and Midnight themes. Everything else (incl. picture themes and photo upload) is Pro.
const FREE_STYLES = new Set(['normal', 'script', 'sans-bold', 'frame-sparkles']);
const FREE_THEMES = new Set(['pop-pink', 'blush', 'midnight']);
for (const style of catalogue.styles) style.isPro = !FREE_STYLES.has(style.id);
for (const item of catalogue.themes) item.isPro = !FREE_THEMES.has(item.id);

const keyboardStyles = catalogue.styles.filter((style) => style.keyboard !== false && style.id !== 'normal');
const styled = catalogue.styles.filter((style) => style.id !== 'normal');
if (styled.length < 100) throw new Error(`Expected at least 100 styles, found ${styled.length}`);
if (keyboardStyles.length !== 48) throw new Error(`Expected 48 keyboard styles, found ${keyboardStyles.length}`);
if (new Set(catalogue.styles.map((style) => style.id)).size !== catalogue.styles.length) throw new Error('Duplicate style ids');
if (catalogue.themes.length !== 112) throw new Error('Expected 112 themes (24 colour + 88 picture)');
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
console.log(`Generated ${styled.length} styles (${keyboardStyles.length} keyboard, ${styled.filter((s) => !s.isPro).length} free) and ${catalogue.themes.length} themes.`);

// Picture-theme images: copy into both keyboards. iOS bundles assets/ flat, so the
// files sit next to styles.json; Android reads them from assets/themes/.
const pictureDir = path.join(root, 'assets', 'keyboard-themes');
const androidThemes = path.join(root, 'modules/lyfstyle-keyboard/android/src/main/assets/themes');
fs.mkdirSync(androidThemes, { recursive: true });
for (const item of catalogue.themes.filter((theme) => theme.image)) {
  const source = path.join(pictureDir, item.image);
  if (!fs.existsSync(source)) throw new Error(`Missing picture for ${item.id}: run scripts/make-keyboard-pictures.cjs`);
  fs.copyFileSync(source, path.join(root, 'targets/keyboard/assets', item.image));
  fs.copyFileSync(source, path.join(androidThemes, item.image));
}
