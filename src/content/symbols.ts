// Symbol and kaomoji library. Shared idea with the keyboard panel (the native
// keyboards carry their own short copy of the most useful rows).
export const symbolGroups: { id: string; name: string; items: string[] }[] = [
  { id: 'hearts', name: 'Hearts', items: ['♡', '♥', '❤︎', '❥', '❣', '💕', '💖', '💗', '🫶', '𓆩♡𓆪', 'ღ', '❦', '❧', 'ᥫ᭡', '♡̷'] },
  { id: 'stars', name: 'Stars & sparkles', items: ['✦', '✧', '★', '☆', '⋆', '✩', '✪', '✫', '✬', '✮', '✰', '⁂', '˚₊‧', '⋆｡˚', '✧･ﾟ', '彡', '✨', '🌟'] },
  { id: 'cute', name: 'Cute bits', items: ['ʚ', 'ɞ', '꒰', '꒱', '୨', '୧', '🎀', '🌸', '✿', '❀', '☁︎', '☾', '☽', '🫧', '🍓', '🦋'] },
  { id: 'arrows', name: 'Arrows', items: ['➜', '➝', '➞', '➟', '➠', '➳', '⇢', '↬', '↳', '⤷', '↝', '⟶', '➵', '➸', '➺', '⇝'] },
  { id: 'dividers', name: 'Dividers', items: ['──────', '━━━━━━', '⋆⋅☆⋅⋆', '｡ﾟ•┈୨♡୧┈•ﾟ｡', '˗ˏˋ ★ ˎˊ˗', '— ❧ —', '•┈┈┈•', '✦ ✦ ✦', '·͙*̩̩͙˚̩̥̩̥*̩̩̥͙·', '♡ ♡ ♡'] },
  { id: 'brackets', name: 'Brackets', items: ['「 」', '『 』', '【 】', '〖 〗', '《 》', '〔 〕', '꧁ ꧂', '⟦ ⟧', '⦃ ⦄', '⌜ ⌟'] },
  { id: 'kaomoji', name: 'Kaomoji', items: ['(｡♡‿♡｡)', 'ʕ•ᴥ•ʔ', '(◕‿◕✿)', '(づ｡◕‿‿◕｡)づ', '٩(◕‿◕)۶', '(≧◡≦)', '(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧', '(⌐■_■)', '¯\\_(ツ)_/¯', '(╯°□°)╯︵ ┻━┻', 'ฅ^•ﻌ•^ฅ', '(｡•́︿•̀｡)', '(˘︶˘).｡*♡', '(っ˘ω˘ς )', '( ˘ ³˘)♥', '(•‿•)'] },
  { id: 'misc', name: 'Handy', items: ['✓', '✔︎', '✗', '☼', '☂︎', '♫', '♪', '☎︎', '✉︎', '⌛︎', '☕︎', '⚘', '♛', '♚', '☯︎', '∞'] },
];
