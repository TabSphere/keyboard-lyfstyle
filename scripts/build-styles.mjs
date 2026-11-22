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
  // Pop Sugar keyboard themes: 12 bright + 12 pastel. The first 8 are free.
  themes: [
    theme('violet', 'Violet', '#6A3DF5', '#8762FF', '#FFFFFF', '#E2D8FF', '#FFD84D', true, false),
    theme('blush', 'Blush', '#FFE1EC', '#FFFFFF', '#22172F', '#8A6A7C', '#FF5FA2', false, false),
    theme('sun', 'Sun', '#FFD84D', '#FFFFFF', '#22172F', '#6E5A10', '#6A3DF5', false, false),
    theme('lilac', 'Lilac', '#CDB9FF', '#FFFFFF', '#22172F', '#5B4A86', '#6A3DF5', false, false),
    theme('bubblegum', 'Bubblegum', '#FF5FA2', '#FF8BBD', '#FFFFFF', '#FFE1EC', '#22172F', true, false),
    theme('mint', 'Mint', '#A8E8CF', '#FFFFFF', '#22172F', '#3D6B58', '#FF5FA2', false, false),
    theme('plum-night', 'Plum Night', '#22172F', '#3A2C4D', '#FFF3F6', '#B9A8CC', '#FFD84D', true, false),
    theme('cloud', 'Cloud', '#E6F1FF', '#FFFFFF', '#22172F', '#5A6B84', '#6A3DF5', false, false),
    theme('cherry', 'Cherry', '#E8304A', '#F05468', '#FFFFFF', '#FFD6DC', '#FFD84D', true, true),
    theme('ocean', 'Ocean', '#2563EB', '#3F7BF5', '#FFFFFF', '#D6E4FF', '#A8E8CF', true, true),
    theme('lime-pop', 'Lime Pop', '#C6F432', '#E3FA92', '#1A2410', '#4E5E1F', '#6A3DF5', false, true),
    theme('tangerine', 'Tangerine', '#FF8A2A', '#FFA65E', '#FFFFFF', '#FFE6D1', '#22172F', true, true),
    theme('grape', 'Grape', '#4B1D8F', '#62309F', '#FFFFFF', '#D9C8F5', '#FF5FA2', true, true),
    theme('neon-night', 'Neon Night', '#0F0F1A', '#1E1E33', '#E8FFF9', '#8F9BB8', '#38F2C0', true, true),
    theme('hot-pink', 'Hot Pink', '#D61F8A', '#E2489F', '#FFFFFF', '#FFD3EC', '#FFD84D', true, true),
    theme('ink-pop', 'Ink Pop', '#111114', '#26262C', '#FFFFFF', '#A0A0AA', '#FF5FA2', true, true),
    theme('peach', 'Peach', '#FFD3C2', '#FFFFFF', '#22172F', '#7E5446', '#FF5FA2', false, true),
    theme('lemon', 'Lemon', '#FFF5B8', '#FFFFFF', '#22172F', '#6E6630', '#6A3DF5', false, true),
    theme('cotton-candy', 'Cotton Candy', '#F7D6FF', '#FFFFFF', '#22172F', '#7A5A86', '#38B6FF', false, true),
    theme('sage', 'Sage', '#CFE3C8', '#FFFFFF', '#1F2A1C', '#55684F', '#6A3DF5', false, true),
    theme('lavender-night', 'Lavender Night', '#2E2547', '#43385F', '#F1E9FF', '#B5A8D4', '#CDB9FF', true, true),
    theme('rose', 'Rose', '#F4B6C2', '#FFE7EC', '#3A1F27', '#7D4F5B', '#E8304A', false, true),
    theme('ice', 'Ice', '#DDF3F7', '#FFFFFF', '#173038', '#4E6E77', '#2563EB', false, true),
    theme('butter', 'Butter', '#FFF0D1', '#FFFFFF', '#2B2414', '#7A6A48', '#FF8A2A', false, true),
  ],
};

function theme(id, name, background, key, text, secondary, accent, dark, isPro) {
  return { id, name, background, key, text, secondary, accent, dark, isPro };
}

const keyboardStyles = catalogue.styles.filter((style) => style.keyboard !== false && style.id !== 'normal');
const styled = catalogue.styles.filter((style) => style.id !== 'normal');
if (styled.length < 100) throw new Error(`Expected at least 100 styles, found ${styled.length}`);
if (keyboardStyles.length !== 48) throw new Error(`Expected 48 keyboard styles, found ${keyboardStyles.length}`);
if (new Set(catalogue.styles.map((style) => style.id)).size !== catalogue.styles.length) throw new Error('Duplicate style ids');
if (catalogue.themes.length !== 24) throw new Error('Expected 24 themes');
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
