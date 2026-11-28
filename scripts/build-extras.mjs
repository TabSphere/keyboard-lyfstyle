// Builds keyboard extras (word suggestions, next-word guesses, emoji) into extras.json
// for both keyboards. Run by `npm run generate`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const seen = new Set();
const words = [];
for (const line of fs.readFileSync(path.join(root, 'shared/words.txt'), 'utf8').split(/\r?\n/)) {
  if (!line.trim() || line.startsWith('#')) continue;
  for (const word of line.trim().split(/\s+/)) {
    const key = word.toLowerCase().replace(/'/g, '');
    if (!/^[A-Za-z']+$/.test(word) || seen.has(key)) continue;
    seen.add(key);
    words.push(word === 'i' ? 'I' : word.replace(/^i'/, "I'"));
  }
}

const nextRaw = JSON.parse(fs.readFileSync(path.join(root, 'shared/next-words.json'), 'utf8'));
const next = {};
for (const [key, list] of Object.entries(nextRaw)) {
  if (key.startsWith('_')) continue;
  next[key.toLowerCase()] = [...new Set(list)].slice(0, 5).map((word) => (word === 'i' ? 'I' : word));
}

// Emoji panel, shown after the aesthetic symbols. Kept to widely supported emoji.
const emoji = [
  ['Smileys', '😀 😃 😄 😁 😆 🥹 😅 😂 🤣 🥲 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😝 😜 🤪 🤨 🧐 🤓 😎 🥸 🤩 🥳 😏 😒 😞 😔 😟 😕 🙁 😣 😖 😫 😩 🥺 😢 😭 😤 😠 😡 🤬 🤯 😳 🥵 🥶 😱 😨 😰 😥 😓 🫣 🤗 🫡 🤔 🫢 🤭 🤫 🤥 😶 😐 😑 😬 🫠 🙄 😯 😦 😧 😮 😲 🥱 😴 🤤 😪 😵 🤐 🥴 🤢 🤮 🤧 😷 🤒 🤕 🤑 🤠 😈 👿 👻 💀 ☠️ 👽 🤖 💩 😺 😸 😹 😻 😼 😽 🙀 😿 😾'],
  ['Hearts', '❤️ 🩷 🧡 💛 💚 💙 🩵 💜 🖤 🩶 🤍 🤎 💔 ❤️‍🔥 ❤️‍🩹 ❣️ 💕 💞 💓 💗 💖 💘 💝 💟 💌 💋 🫶 🥰 😍 😘'],
  ['Hands & people', '👋 🤚 🖐️ ✋ 🖖 👌 🤌 🤏 ✌️ 🤞 🫰 🤟 🤘 🤙 👈 👉 👆 👇 ☝️ 👍 👎 ✊ 👊 🤛 🤜 👏 🙌 🫶 👐 🤲 🙏 💅 🤳 💪 👀 👁️ 👄 🫦 💁‍♀️ 🙋‍♀️ 🙆‍♀️ 🤷‍♀️ 🤦‍♀️ 💃 🕺 👯‍♀️ 👑 💍 👗 👠 👜 🕶️ 💄'],
  ['Animals & nature', '🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🐔 🐧 🐦 🐤 🦄 🐝 🦋 🐌 🐞 🐢 🐍 🐙 🐠 🐬 🐳 🦈 🌸 🌷 🌹 🥀 🌺 🌻 🌼 💐 🍀 🌿 🌱 🌴 🍁 🍄 🌈 ☀️ 🌤️ ☁️ 🌧️ ⛈️ ❄️ ⚡ 🔥 💧 🌊 🌙 ⭐ 🌟 ✨ 💫 🌍'],
  ['Food & drink', '🍓 🍒 🍑 🍉 🍋 🍌 🍍 🥭 🍎 🍏 🍐 🍇 🫐 🥑 🍅 🌶️ 🥕 🌽 🥐 🍞 🧀 🍳 🥞 🧇 🍔 🍟 🍕 🌭 🌮 🌯 🥗 🍝 🍜 🍣 🍱 🍤 🍙 🍦 🍧 🍨 🍩 🍪 🎂 🍰 🧁 🍫 🍬 🍭 🍿 ☕ 🧋 🍵 🥤 🧃 🍷 🍸 🍹 🍾 🥂'],
  ['Fun & things', '🎉 🎊 🎈 🎁 🎀 🎂 🎄 🎃 🎆 ✨ 🎵 🎶 🎤 🎧 🎸 🎹 🎮 🕹️ 🎲 🎯 🏀 ⚽ 🎾 🏐 🏋️‍♀️ 🧘‍♀️ 🏆 🥇 📸 📱 💻 🎬 📚 ✏️ 💌 📍 🛍️ 💸 💎 🔮 🪩 🧸 🕯️ 🌙 ✈️ 🚗 🏖️ 🏝️ 🗽 🗼 🎡 🏠 💤 💯 ✅ ❌ ‼️ ❓ 💬 🔔'],
].map(([title, list]) => [title, list.split(' ')]);

const json = `${JSON.stringify({ words, next, emoji })}\n`;
for (const destination of [
  'targets/keyboard/assets/extras.json',
  'modules/lyfstyle-keyboard/android/src/main/assets/extras.json',
  'modules/lyfstyle-keyboard/android/src/test/resources/extras.json',
]) {
  fs.mkdirSync(path.dirname(path.join(root, destination)), { recursive: true });
  fs.writeFileSync(path.join(root, destination), json);
}
console.log(`Keyboard extras: ${words.length} words, ${Object.keys(next).length} next-word lists, ${emoji.reduce((n, [, l]) => n + l.length, 0)} emoji.`);
