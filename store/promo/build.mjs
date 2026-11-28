// Generates the Lyfstyle promo film (HyperFrames, 1080x1920, 30 fps).
// node build.mjs  → index.html + compositions/*.html
// Every timed element is written out with a stable id; GSAP tweens are generated alongside.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const catalogue = JSON.parse(fs.readFileSync(path.join(here, '../../shared/styles.json'), 'utf8'));
const MAP = Object.fromEntries(catalogue.styles.map((s) => [s.id, s.mapping]));
const tf = (text, id) => (id === 'plain' ? text : [...text].map((c) => MAP[id][c] ?? c).join(''));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// --wide builds the landscape cut (1920x1080, Google Play promo) into ../promo-wide.
const WIDE = process.argv.includes('--wide');
const OUT = WIDE ? path.join(here, '../promo-wide') : here;
const W = WIDE ? 1920 : 1080, H = WIDE ? 1080 : 1920;
const SCALE = WIDE ? 1.25 : 1.7;   // phone screen: 430x932 drawn at this scale
const PHONE_X = WIDE ? 1150 : (W - 430 * SCALE - 52) / 2;
const PHONE_Y = WIDE ? -150 : 360;
// Headline beside the phone (wide) or above it (portrait).
const headPos = (top, size) => (WIDE ? `left:120px;right:830px;text-align:left;top:360px;font-size:${Math.round(size * 1.08)}px` : `top:${top}px;font-size:${size}px`);
const P = (portrait, wide) => (WIDE ? wide : portrait);
const FONTS = ['script', 'fraktur', 'circled'];

const COMMON_CSS = `
@font-face { font-family: 'Bricolage'; src: url('assets/fonts/BricolageGrotesque_800ExtraBold.ttf'); font-weight: 800; }
#root { position: absolute; inset: 0; overflow: hidden; font-family: Inter, sans-serif; }
.ground { position: absolute; inset: 0; background: linear-gradient(160deg, #FF3D8B 0%, #FF7AAE 48%, #FFD6E4 100%); }
.blob { position: absolute; border-radius: 50%; filter: blur(60px); opacity: .55; }
.head { position: absolute; left: 70px; right: 70px; text-align: center; font-family: 'Bricolage', sans-serif; font-weight: 800; color: #fff; letter-spacing: -2px; line-height: 1.02; }
.head mark { background: #FFD84D; color: #22172F; padding: 0 12px; border-radius: 12px; }
.phone { position: absolute; width: ${430 * SCALE + 52}px; height: ${932 * SCALE + 52}px; border-radius: 120px; padding: 12px;
  background: linear-gradient(135deg, #f2efe9 0%, #b9b4ac 18%, #e9e5de 40%, #8f8a83 62%, #d9d4cc 82%, #7d7871 100%);
  box-shadow: 0 60px 120px rgba(80, 10, 40, .35); }
.phone .bezel { width: 100%; height: 100%; border-radius: 108px; background: #050505; padding: 14px; }
.phone .screen { position: relative; width: ${430 * SCALE}px; height: ${932 * SCALE}px; border-radius: 94px; overflow: hidden; background: #fbf9fc; }
.phone .canvas { position: absolute; left: 0; top: 0; width: 430px; height: 932px; transform: scale(${SCALE}); transform-origin: 0 0; }
.island { position: absolute; left: 50%; top: 11px; width: 124px; height: 36px; margin-left: -62px; border-radius: 20px; background: #000; z-index: 9; }
.ui { position: absolute; inset: 0; display: flex; flex-direction: column; }
.status { height: 54px; display: flex; align-items: center; justify-content: space-between; padding: 14px 34px 0 40px; font: 600 17px Inter, sans-serif; flex: none; }
.chathead { display: flex; align-items: center; gap: 10px; padding: 6px 16px 12px; border-bottom: 1px solid #eee; flex: none; background: #fff; }
.avatar { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, #ffb3c9, #c7b3ff); display: grid; place-items: center; font: 700 15px Inter, sans-serif; color: #fff; }
.chathead b { font: 700 16px Inter, sans-serif; } .chathead small { display: block; font: 500 12px Inter, sans-serif; color: #8a8a8f; }
.thread { flex: 1; padding: 14px; display: flex; flex-direction: column; justify-content: flex-end; gap: 8px; }
.bubble { max-width: 78%; padding: 10px 14px; border-radius: 20px; font: 400 17px/1.3 Inter, sans-serif; }
.in { align-self: flex-start; background: #ececf1; color: #111; border-bottom-left-radius: 6px; }
.out { align-self: flex-end; background: #FF3D8B; color: #fff; border-bottom-right-radius: 6px; }
.composer { display: flex; align-items: center; gap: 8px; padding: 8px 12px 10px; flex: none; }
.field { position: relative; flex: 1; height: 40px; border-radius: 20px; border: 1px solid #ddd; background: #fff; padding: 0 14px; font: 400 18px/38px Inter, sans-serif; color: #111; white-space: nowrap; overflow: hidden; }
.seg { position: absolute; left: 14px; top: 0; }
.send { width: 34px; height: 34px; border-radius: 50%; background: #FF3D8B; display: grid; place-items: center; color: #fff; font: 700 18px Inter, sans-serif; }
.kbwrap { flex: none; background: #d4d6dc; padding: 6px 4px 0; }
.kb { position: relative; height: 266px; border-radius: 22px; overflow: hidden; padding: 6px 3px 4px; --keybg: rgba(255,255,255,.82); --keyfg: #22172F; }
.kbbg { position: absolute; inset: 0; background: center / cover no-repeat; }
.bar { position: relative; display: flex; gap: 4px; align-items: center; height: 40px; padding: 0 2px; overflow: hidden; }
.chip { flex: none; height: 32px; padding: 0 9px; border-radius: 16px; display: grid; place-items: center; font: 500 14px Inter, sans-serif; white-space: nowrap; background: var(--keybg); color: var(--keyfg); }
.rows { position: relative; }
.row { position: relative; display: flex; height: 54px; }
.cell { position: relative; height: 54px; }
.key { position: absolute; inset: 5px 3px; border-radius: 9px; background: var(--keybg); color: var(--keyfg); box-shadow: 0 1px 0 rgba(0,0,0,.2); }
.key.fn { background: rgba(255,255,255,.6); }
.key.acc { background: #FF3D8B; color: #fff; }
.lab { position: absolute; inset: 0; display: grid; place-items: center; font: 400 23px Inter, sans-serif; }
.pop { position: absolute; width: 56px; height: 66px; border-radius: 12px; background: #fff; color: #22172F; display: grid; place-items: center; font: 400 32px Inter, sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,.3); z-index: 5; }
.sysbar { height: 46px; display: flex; justify-content: space-between; align-items: center; padding: 0 26px; color: #3a3a3c; font: 400 22px Inter, sans-serif; }
.tap { position: absolute; width: 70px; height: 70px; margin: -35px 0 0 -35px; border-radius: 50%; background: rgba(255,255,255,.55); border: 3px solid rgba(255,255,255,.95); z-index: 8; }
`;

// ---------- keyboard geometry (native px, relative to .kb) ----------
const KB_W = 430 - 8 - 6;          // inner width of the key area
const CELL = KB_W / 10;
const ROW_TOP = [46, 100, 154, 208];
const letterRows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
function keyCentre(ch) {
  if (ch === ' ') return { x: 3 + KB_W * (0.24 + 0.235), y: ROW_TOP[3] + 27 };
  for (let r = 0; r < 3; r += 1) {
    const i = letterRows[r].indexOf(ch);
    if (i < 0) continue;
    const offset = r === 0 ? 0 : r === 1 ? 0.5 : 1.5;
    return { x: 3 + (offset + i + 0.5) * CELL, y: ROW_TOP[r] + 27 };
  }
  return null;
}

function keyRows(s, activeFont) {
  const label = (ch) => FONTS.map((f) => `<span class="lab f-${f}" style="opacity:${f === activeFont ? 1 : 0}">${esc(tf(ch, f))}</span>`).join('');
  const cell = (id, w, inner, cls = '') => `<div class="cell" style="width:${w}%"><div id="${id}" class="key ${cls}">${inner}</div></div>`;
  const spacer = (w) => `<div style="width:${w}%"></div>`;
  const r0 = [...letterRows[0]].map((c) => cell(`${s}-k-${c}`, 10, label(c))).join('');
  const r1 = spacer(5) + [...letterRows[1]].map((c) => cell(`${s}-k-${c}`, 10, label(c))).join('') + spacer(5);
  const r2 = cell(`${s}-k-shift`, 14, '<span class="lab">⇧</span>', 'fn') + spacer(1) + [...letterRows[2]].map((c) => cell(`${s}-k-${c}`, 10, label(c))).join('') + spacer(1) + cell(`${s}-k-del`, 14, '<span class="lab" style="font-size:20px">⌫</span>', 'fn');
  const r3 = cell(`${s}-k-123`, 13, '<span class="lab" style="font-size:17px">123</span>', 'fn') + cell(`${s}-k-mic`, 11, '<span class="lab" style="font-size:18px">🎙</span>', 'fn')
    + cell(`${s}-k-space`, 47, FONTS.map((f) => `<span class="lab f-${f}" style="font-size:16px;opacity:${f === activeFont ? 0.8 : 0}">${esc(tf('lyfstyle', f))}</span>`).join(''))
    + cell(`${s}-k-dot`, 10, '<span class="lab">.</span>') + cell(`${s}-k-ret`, 19, '<span class="lab">↵</span>', 'acc');
  return `<div id="${s}-rows" class="rows"><div class="row">${r0}</div><div class="row">${r1}</div><div class="row">${r2}</div></div><div class="row">${r3}</div>`;
}

function chips(s) {
  const list = [['fonts', 'Fonts ▾'], ['script', tf('Script', 'script')], ['fraktur', tf('Fraktur', 'fraktur')], ['circled', tf('Bubbles', 'circled')]];
  return `<div class="bar">${list.map(([id, t]) => `<div id="${s}-c-${id}" class="chip">${esc(t)}</div>`).join('')}<div style="margin-left:auto;display:flex;gap:5px"><div id="${s}-c-tr" class="chip">文A</div><div id="${s}-c-th" class="chip">🎨</div></div></div>`;
}

function phone(s, { thread, field, kbExtra = '', kbBg = 'sakura', activeFont = 'script', panel = '' }) {
  return `<div id="${s}-phone" class="phone" style="left:${PHONE_X}px;top:${PHONE_Y}px"><div class="bezel"><div class="screen"><div class="island"></div><div class="canvas"><div class="ui">
  <div class="status"><span>9:41</span><span>●●●</span></div>
  <div class="chathead"><span style="font-size:26px;color:#FF3D8B;font-weight:300">‹</span><div class="avatar">M</div><div><b>Maya</b><small>online</small></div></div>
  <div id="${s}-thread" class="thread">${thread}</div>
  <div class="composer"><div class="field">${field}</div><div class="send">↑</div></div>
  <div class="kbwrap"><div id="${s}-kb" class="kb">
    <div id="${s}-bg" class="kbbg" style="background-image:url(assets/img/${kbBg}.jpg)"></div>${kbExtra}
    ${chips(s)}${panel}${keyRows(s, activeFont)}
  </div><div class="sysbar"><span>🌐︎</span><span>🎙︎</span></div></div>
</div></div></div></div></div>`;
}

// Screen px inside the phone → slide px (for tap rings).
const toSlide = (x, y) => ({ x: PHONE_X + 26 + x * SCALE, y: PHONE_Y + 26 + y * SCALE });
const KB_TOP_IN_SCREEN = 932 - 46 - 266 - 6; // keyboard top inside the 932 canvas

function scene(id, duration, body, script) {
  return `<template>
<style>${COMMON_CSS}</style>
<div id="root" data-composition-id="${id}" data-width="${W}" data-height="${H}" data-start="0" data-duration="${duration}" data-layout-allow-overflow>
${body}
</div>
<script>
const tl = gsap.timeline({ paused: true });
${script}
window.__timelines["${id}"] = tl;
</script>
</template>
`;
}

// Typing helpers: build field segments and key-press tweens.
function typing(s, text, font, start, step = 0.14) {
  let spans = '';
  let js = '';
  let pops = '';
  [...text].forEach((ch, i) => {
    const t = +(start + i * step).toFixed(2);
    spans += `<span id="${s}-t-${font}-${i}" style="opacity:0">${ch === ' ' ? '&nbsp;' : esc(tf(ch, font))}</span>`;
    js += `tl.fromTo("#${s}-t-${font}-${i}", { opacity: 0 }, { opacity: 1, duration: 0.01 }, ${t});\n`;
    const key = ch === ' ' ? 'space' : ch;
    js += `tl.to("#${s}-k-${key}", { scale: 0.9, filter: "brightness(0.85)", duration: 0.05, yoyo: true, repeat: 1, ease: "power1.out" }, ${t});\n`;
    const c = keyCentre(ch);
    if (c && ch !== ' ') {
      pops += `<div id="${s}-p-${font}-${i}" class="pop" style="left:${c.x - 28}px;top:${c.y - 27 - 72}px;opacity:0">${esc(tf(ch, font))}</div>`;
      js += `tl.fromTo("#${s}-p-${font}-${i}", { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.04 }, ${t});\n`;
      js += `tl.to("#${s}-p-${font}-${i}", { opacity: 0, duration: 0.05 }, ${(t + 0.12).toFixed(2)});\n`;
    }
  });
  return { spans, js, pops };
}

function tapRing(id, x, y, t) {
  const p = toSlide(x, y);
  return {
    html: `<div id="${id}" class="tap" style="left:${p.x}px;top:${p.y}px;opacity:0"></div>`,
    js: `tl.fromTo("#${id}", { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.12, ease: "power2.out" }, ${t});\ntl.to("#${id}", { opacity: 0, scale: 1.25, duration: 0.25, ease: "power1.in" }, ${(t + 0.14).toFixed(2)});\n`,
  };
}

function switchFont(s, from, to, t) {
  return `tl.to("#${s}-kb .f-${from}", { opacity: 0, duration: 0.2 }, ${t});\ntl.to("#${s}-kb .lab.f-${to}", { opacity: 1, duration: 0.2 }, ${t});\ntl.to("#${s}-k-space .f-${to}", { opacity: 0.8, duration: 0.2 }, ${t});\n`
    + `tl.to("#${s}-c-${from}", { backgroundColor: "rgba(255,255,255,.82)", color: "#22172F", duration: 0.15 }, ${t});\ntl.to("#${s}-c-${to}", { backgroundColor: "#FF3D8B", color: "#ffffff", duration: 0.15 }, ${t});\n`;
}

const ground = `<div class="ground"></div><div class="blob" style="left:-120px;top:-80px;width:520px;height:520px;background:#FFD84D"></div><div class="blob" style="right:-160px;top:620px;width:600px;height:600px;background:#C7B3FF"></div>`;
const phoneIn = (s) => `tl.fromTo("#${s}-phone", { y: 900 }, { y: 0, duration: 0.6, ease: "power3.out" }, 0);\n`;

// ---------- scenes ----------
const scenes = [];

// 1. Hook: plain text turns fancy, letter by letter.
{
  const s = 'hook';
  const text = 'soft but savage';
  let letters = '';
  let js = '';
  [...text].forEach((ch, i) => {
    letters += `<span style="position:relative;display:inline-block">${ch === ' ' ? '&nbsp;' : `<span id="${s}-a-${i}">${esc(ch)}</span><span id="${s}-b-${i}" style="position:absolute;left:0;top:0;opacity:0">${esc(tf(ch, 'script'))}</span>`}</span>`;
    if (ch !== ' ') {
      const t = (1.0 + i * 0.06).toFixed(2);
      js += `tl.fromTo("#${s}-a-${i}", { opacity: 1, y: 0 }, { opacity: 0, y: -18, duration: 0.18, ease: "power2.in" }, ${t});\n`;
      js += `tl.fromTo("#${s}-b-${i}", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.22, ease: "back.out(2)" }, ${t});\n`;
    }
  });
  const body = `${ground}
  <div id="${s}-h1" class="head" style="top:${P(300, 200)}px;font-size:${P(120, 130)}px">Your words.</div>
  <div id="${s}-h2" class="head" style="top:${P(440, 350)}px;font-size:${P(120, 130)}px"><mark>Any font.</mark></div>
  <div id="${s}-bubble" data-layout-allow-overlap style="position:absolute;left:${P(150, 560)}px;right:${P(190, 560)}px;top:${P(880, 620)}px;padding:40px 40px;border-radius:60px;border-bottom-right-radius:18px;background:#fff;box-shadow:0 40px 90px rgba(80,10,40,.25);text-align:center;font:400 74px/1.15 Inter, sans-serif;color:#22172F;white-space:nowrap">${letters}</div>`;
  // Title and bubble are on screen at frame 0 (the social thumbnail); the bubble settles in.
  js += `tl.fromTo("#${s}-bubble", { scale: 0.96 }, { scale: 1, duration: 0.6, ease: "power2.out" }, 0);\n`;
  js += `tl.fromTo("#${s}-h2", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, 1.9);\n`;
  scenes.push({ id: s, duration: 3, html: scene(s, 3, body, js) });
}

// 2. Typing: Script → Fraktur → Bubbles, keys follow the font.
{
  const s = 'type';
  const a = typing(s, 'see u later', 'script', 0.8);
  const b = typing(s, 'obsessed', 'fraktur', 3.0);
  const c = typing(s, 'omg', 'circled', 4.7);
  const sendBubble = `<div id="${s}-sent" class="bubble out" style="opacity:0">${esc(tf('see u later', 'script'))}</div>`;
  const thread = `<div class="bubble out">did u see the new menu at Nori</div><div class="bubble in">YES we're going</div><div class="bubble in">8 or 9?</div><div class="bubble out">8!! i'll book</div><div class="bubble in">are we still on for tonight</div><div class="bubble in">what are we wearing??</div>${sendBubble}`;
  const field = `<span id="${s}-segA" class="seg">${a.spans}</span><span id="${s}-segB" class="seg">${b.spans}${'<span>&nbsp;</span>'}${c.spans}</span>`;
  const ret = keyCentre(' ');
  const t1 = tapRing(`${s}-tap1`, 3 + KB_W * 0.905, KB_TOP_IN_SCREEN + ROW_TOP[3] + 27, 2.35);
  const chipX = (n) => 4 + 3 + [ 0, 75, 145, 222 ][n] + 30;
  const t2 = tapRing(`${s}-tap2`, chipX(2), KB_TOP_IN_SCREEN + 26, 2.6);
  const t3 = tapRing(`${s}-tap3`, chipX(3), KB_TOP_IN_SCREEN + 26, 4.3);
  const body = `${ground}
  <div id="${s}-head" class="head" style="${headPos(120, 92)}">Pick a font.<br><mark>Every key shows it.</mark></div>
  ${phone(s, { thread, field, kbExtra: '', kbBg: 'sakura', activeFont: 'script', panel: '' }).replace(`<div id="${s}-rows"`, `${a.pops}${b.pops}${c.pops}<div id="${s}-rows"`)}
  ${t1.html}${t2.html}${t3.html}`;
  let js = phoneIn(s);
  js += `tl.fromTo("#${s}-head", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, 0.15);\n`;
  js += `tl.set("#${s}-c-script", { backgroundColor: "#FF3D8B", color: "#ffffff" }, 0);\n`;
  js += a.js + t1.js;
  js += `tl.fromTo("#${s}-k-ret", { scale: 1 }, { scale: 0.9, duration: 0.05, yoyo: true, repeat: 1 }, 2.35);\n`;
  js += `tl.to("#${s}-segA", { opacity: 0, duration: 0.01 }, 2.4);\n`;
  js += `tl.fromTo("#${s}-sent", { opacity: 0, scale: 0.6, transformOrigin: "100% 100%" }, { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(2)" }, 2.4);\n`;
  js += t2.js + switchFont(s, 'script', 'fraktur', 2.65);
  js += b.js + t3.js + switchFont(s, 'fraktur', 'circled', 4.35);
  js += c.js;
  scenes.push({ id: s, duration: 6, html: scene(s, 6, body, js) });
}

// 3. Themes: the keyboard background flips through themes, ending on the person's photo.
{
  const s = 'themes';
  const themes = [
    ['sakura', 'Sakura', 'rgba(255,255,255,.82)', '#22172F'],
    ['galaxy', 'Galaxy', 'rgba(255,255,255,.16)', '#ffffff'],
    ['kpop-holographic-foil', 'Holo Foil', 'rgba(255,255,255,.78)', '#22172F'],
    ['neon-wave', 'Neon Wave', 'rgba(255,255,255,.16)', '#ffffff'],
    ['golden-lake', 'Golden Lake', 'rgba(255,255,255,.78)', '#22172F'],
    ['sunset-beach-golden', 'Your photo', 'rgba(255,255,255,.22)', '#ffffff'],
  ];
  const layers = themes.map(([img], i) => `<div id="${s}-l${i}" class="kbbg" style="background-image:url(assets/img/${img}.jpg);opacity:${i === 0 ? 1 : 0}"></div>`).join('')
    + `<div id="${s}-dim" class="kbbg" style="background:rgba(0,0,0,.25);opacity:0"></div>`;
  const labels = themes.map(([, name], i) => `<div id="${s}-n${i}" style="position:absolute;${P(`left:0;right:0;top:${PHONE_Y - 90}px;text-align:center`, 'left:120px;right:830px;top:640px;text-align:left')};opacity:0"><span style="display:inline-block;background:#22172F;color:#fff;font:800 40px Inter, sans-serif;padding:14px 30px;border-radius:99px">${name}</span></div>`).join('');
  const thread = `<div class="bubble in">send me the pics from saturday</div><div class="bubble out">sending now</div><div class="bubble in">omg the sunset one</div><div class="bubble in">wait what keyboard is that</div><div class="bubble out">${esc(tf('lyfstyle', 'script'))}</div><div class="bubble in">ur keyboard is so cute</div>`;
  const body = `${ground}
  <div id="${s}-head1" class="head" style="${headPos(110, 96)}"><mark>100+</mark> themes.</div>
  <div id="${s}-head2" class="head" style="${headPos(110, 96)};opacity:0">Your photo <mark>too.</mark></div>
  ${labels}
  ${phone(s, { thread, field: `<span class="seg" style="color:#999">Message</span>`, kbBg: 'sakura', activeFont: 'script' }).replace(`<div id="${s}-bg" class="kbbg" style="background-image:url(assets/img/sakura.jpg)"></div>`, layers)}`;
  let js = `tl.fromTo("#${s}-head1", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, 0.05);\n`;
  js += `tl.set("#${s}-c-script", { backgroundColor: "#FF3D8B", color: "#ffffff" }, 0);\n`;
  themes.forEach(([, , keybg, keyfg], i) => {
    const t = +(0.2 + i * 0.68).toFixed(2);
    if (i > 0) {
      js += `tl.fromTo("#${s}-l${i}", { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }, ${t});\n`;
      js += `tl.to("#${s}-kb", { "--keybg": "${keybg}", "--keyfg": "${keyfg}", duration: 0.3 }, ${t});\n`;
    }
    js += `tl.fromTo("#${s}-n${i}", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.15 }, ${t});\n`;
    if (i < themes.length - 1) js += `tl.to("#${s}-n${i}", { opacity: 0, duration: 0.12 }, ${(t + 0.56).toFixed(2)});\n`;
  });
  const photoT = +(0.2 + 5 * 0.68).toFixed(2);
  js += `tl.to("#${s}-dim", { opacity: 1, duration: 0.3 }, ${photoT});\n`;
  js += `tl.to("#${s}-head1", { opacity: 0, duration: 0.15 }, ${photoT});\n`;
  js += `tl.fromTo("#${s}-head2", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.35, ease: "power3.out" }, ${photoT});\n`;
  scenes.push({ id: s, duration: 5, html: scene(s, 5, body, js) });
}

// 4. Translate: 文A → Spanish → replace.
{
  const s = 'trans';
  const src = 'obviously, see you at 9';
  const out = 'Obvio, nos vemos a las 9';
  const resultChars = [...out].map((ch, i) => `<span id="${s}-r-${i}" style="opacity:0">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`).join('');
  const panel = `<div id="${s}-panel" style="position:absolute;left:3px;right:3px;top:46px;height:162px;padding:2px 4px;opacity:0;z-index:4">
    <div style="display:flex;gap:5px">${['Spanish', 'French', 'Korean', 'Japanese'].map((l) => `<div id="${s}-lang-${l}" class="chip">${l}</div>`).join('')}</div>
    <div style="margin-top:8px;border-radius:10px;padding:10px 12px;min-height:64px;background:rgba(255,255,255,.88);font:400 17px/1.3 Inter, sans-serif;color:#22172F">${resultChars}</div>
    <div style="display:flex;gap:8px;margin-top:8px"><div id="${s}-replace" class="chip" style="flex:1;background:#FF3D8B;color:#fff">Replace my text</div><div class="chip" style="flex:1">Add it</div></div></div>`;
  const thread = `<div class="bubble out">who's coming tonight?</div><div class="bubble in">me, Leo and my friend Lucía</div><div class="bubble in">she's from Madrid</div><div class="bubble in">¡Hola! Soy Lucía, la amiga de Maya</div><div class="bubble in">¿Vienes a la fiesta esta noche?</div><div id="${s}-sent" class="bubble out" style="opacity:0">${esc(tf(out, 'script'))}</div>`;
  const field = `<span id="${s}-f1" class="seg">${esc(tf(src, 'script'))}</span><span id="${s}-f2" class="seg" style="opacity:0">${esc(tf(out, 'script'))}</span>`;
  const t1 = tapRing(`${s}-tap1`, 4 + 3 + 340, KB_TOP_IN_SCREEN + 26, 0.55);
  const t2 = tapRing(`${s}-tap2`, 4 + 3 + 40, KB_TOP_IN_SCREEN + 46 + 18, 0.95);
  const t3 = tapRing(`${s}-tap3`, 4 + 3 + 100, KB_TOP_IN_SCREEN + 46 + 120, 2.5);
  const t4 = tapRing(`${s}-tap4`, 4 + 3 + 400, KB_TOP_IN_SCREEN - 28, 3.2);
  const body = `${ground}
  <div id="${s}-head" class="head" style="${headPos(120, 96)}">Translate<br><mark>as you type.</mark></div>
  ${phone(s, { thread, field, kbBg: 'sakura', activeFont: 'script', panel })}
  ${t1.html}${t2.html}${t3.html}${t4.html}`;
  let js = `tl.fromTo("#${s}-head", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, 0.05);\n`;
  js += `tl.set("#${s}-c-script", { backgroundColor: "#FF3D8B", color: "#ffffff" }, 0);\n`;
  js += t1.js + `tl.to("#${s}-c-tr", { backgroundColor: "#FF3D8B", color: "#ffffff", duration: 0.12 }, 0.6);\n`;
  js += `tl.to("#${s}-rows", { opacity: 0, duration: 0.2 }, 0.65);\ntl.fromTo("#${s}-panel", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }, 0.7);\n`;
  js += t2.js + `tl.to("#${s}-lang-Spanish", { backgroundColor: "#FF3D8B", color: "#ffffff", duration: 0.12 }, 1.0);\n`;
  [...out].forEach((_, i) => { js += `tl.fromTo("#${s}-r-${i}", { opacity: 0 }, { opacity: 1, duration: 0.01 }, ${(1.2 + i * 0.045).toFixed(2)});\n`; });
  js += t3.js + `tl.to("#${s}-f1", { opacity: 0, duration: 0.15 }, 2.55);\ntl.to("#${s}-f2", { opacity: 1, duration: 0.15 }, 2.6);\n`;
  js += `tl.to("#${s}-panel", { opacity: 0, duration: 0.2 }, 2.8);\ntl.to("#${s}-rows", { opacity: 1, duration: 0.2 }, 2.85);\ntl.to("#${s}-c-tr", { backgroundColor: "rgba(255,255,255,.82)", color: "#22172F", duration: 0.12 }, 2.85);\n`;
  js += t4.js + `tl.to("#${s}-f2", { opacity: 0, duration: 0.05 }, 3.25);\n`;
  js += `tl.fromTo("#${s}-sent", { opacity: 0, scale: 0.6, transformOrigin: "100% 100%" }, { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(2)" }, 3.25);\n`;
  scenes.push({ id: s, duration: 4, html: scene(s, 4, body, js) });
}

// 5. Claim.
{
  const s = 'claim';
  const lines = ['Pay once.', 'No ads.', 'No tracking.'];
  const body = `<div style="position:absolute;inset:0;background:#22172F"></div>
  ${lines.map((l, i) => `<div id="${s}-l${i}" class="head" style="top:${P(560, 200) + i * 190}px;font-size:150px;${i === 0 ? 'color:#FFD84D' : ''}">${l}</div>`).join('')}
  <div id="${s}-pills" style="position:absolute;left:0;right:0;top:${P(1240, 820)}px;display:flex;justify-content:center;gap:22px">
    ${['100+ fonts', '100+ themes', 'Your photo'].map((p, i) => `<span id="${s}-p${i}" style="font:800 40px Inter, sans-serif;background:#FF3D8B;color:#fff;border-radius:99px;padding:18px 30px">${p}</span>`).join('')}
  </div>`;
  let js = '';
  lines.forEach((_, i) => { js += `tl.fromTo("#${s}-l${i}", { opacity: 0, y: 60, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "back.out(1.8)" }, ${(0.1 + i * 0.4).toFixed(2)});\n`; });
  [0, 1, 2].forEach((i) => { js += `tl.fromTo("#${s}-p${i}", { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(2.5)" }, ${(1.5 + i * 0.15).toFixed(2)});\n`; });
  scenes.push({ id: s, duration: 2.6, html: scene(s, 2.6, body, js) });
}

// 6. End card.
{
  const s = 'end';
  const body = `${ground}
  <img id="${s}-icon" src="assets/img/icon.png" style="position:absolute;left:${W / 2 - 150}px;top:${P(560, 140)}px;width:300px;height:300px;border-radius:68px;box-shadow:0 40px 90px rgba(80,10,40,.35)">
  <div id="${s}-word" class="head" style="top:${P(930, 480)}px;font-size:170px;color:#22172F;letter-spacing:-6px"><span style="color:#FFD84D">lyf</span>style</div>
  <div id="${s}-sub" class="head" style="top:${P(1130, 680)}px;font-size:64px">Fonts Keyboard</div>
  <div id="${s}-stores" style="position:absolute;left:0;right:0;top:${P(1290, 820)}px;text-align:center"><span style="display:inline-block;font:800 40px Inter, sans-serif;background:#22172F;color:#fff;border-radius:99px;padding:20px 36px">App Store · Google Play</span></div>`;
  let js = `tl.fromTo("#${s}-icon", { opacity: 0, scale: 0.4, rotation: -12 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.5, ease: "back.out(1.8)" }, 0.1);\n`;
  js += `tl.fromTo("#${s}-word", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, 0.45);\n`;
  js += `tl.fromTo("#${s}-sub", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, 0.7);\n`;
  js += `tl.fromTo("#${s}-stores", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, 0.95);\n`;
  scenes.push({ id: s, duration: 3, html: scene(s, 3, body, js) });
}

// ---------- write ----------
fs.mkdirSync(path.join(OUT, 'compositions'), { recursive: true });
let t = 0;
const hosts = scenes.map((sc, i) => {
  fs.writeFileSync(path.join(OUT, 'compositions', `${sc.id}.html`), sc.html);
  const host = `      <div id="${sc.id}" data-composition-id="${sc.id}" data-composition-src="compositions/${sc.id}.html" data-start="${t}" data-duration="${sc.duration}" data-track-index="1" data-track-kind="graphics" data-width="${W}" data-height="${H}"></div>`;
  t = +(t + sc.duration).toFixed(2);
  return host;
}).join('\n');
const total = t;
const index = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { margin: 0; width: ${W}px; height: ${H}px; overflow: hidden; background: #FF3D8B; }
      #root { position: relative; width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="${W}" data-height="${H}">
${hosts}
<!--AUDIO-->
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
fs.writeFileSync(path.join(OUT, 'index.html'), index);
console.log(`wrote ${scenes.length} scenes, ${total}s`);

// ---------- sound (placed so each peak lands one frame after its picture) ----------
const FRAME = 1 / 30;
const SFX = {
  key: { file: 'assets/sfx/sfx_001.mp3', peak: 0.073, length: 0.13 },
  tap: { file: 'assets/sfx/sfx_001.mp3', peak: 0.073, length: 0.37 },
  whooshA: { file: 'assets/sfx/sfx_003.mp3', peak: 0.162, length: 0.57 },
  whooshB: { file: 'assets/sfx/sfx_002.mp3', peak: 0.755 },
  pop: { file: 'assets/sfx/sfx_004.mp3', peak: 0.099, length: 0.2 },
  riser: { file: 'assets/sfx/sfx_006.mp3', peak: 3.472 },
};
const cues = [];
const cue = (kind, at, volume = 1, extra = '') => cues.push({ kind, at, volume, extra });
const START = { hook: 0, type: 3, themes: 9, trans: 14, claim: 18, end: 20.6 };
// typing
[['see u later', 0.8], ['obsessed', 3.0], ['omg', 4.7]].forEach(([text, start]) => [...text].forEach((_, i) => cue('key', START.type + start + i * 0.14, 0.9)));
[2.35, 2.6, 4.3].forEach((t) => cue('tap', START.type + t, 1.2));
[0.55, 0.95, 2.5, 3.2].forEach((t) => cue('tap', START.trans + t, 1.2));
// scene changes
cue('whooshA', START.type + 0.05, 0.7);
cue('whooshB', START.claim + 0.05, 0.5, ' data-duration="1.4" data-fade-out="0.4"');
cue('whooshA', START.end + 0.05, 0.6);
// pops
for (let i = 1; i < 6; i += 1) cue('pop', START.themes + 0.2 + i * 0.68, 0.55);
[0.1, 0.5, 0.9].forEach((t) => cue('pop', START.claim + t + 0.15, 0.7));
[1.5, 1.65, 1.8].forEach((t) => cue('pop', START.claim + t + 0.1, 0.5));
// riser into the logo (once)
cue('riser', START.end + 0.1 + 0.2, 0.22, ' data-duration="4.0" data-fade-out="0.6"');

const audioTags = cues.map((c, i) => {
  const s = SFX[c.kind];
  const start = Math.max(0, +(c.at + FRAME - s.peak).toFixed(3));
  return `      <audio id="sfx-${i}" class="clip" src="${s.file}" data-start="${start}" data-track-index="${2 + (i % 3)}" data-volume="${c.volume}"${c.extra || (s.length ? ` data-duration="${s.length}"` : '')}></audio>`;
}).join('\n');
const indexPath = path.join(OUT, 'index.html');
// Music: "Plucky Pop". Its biggest lift (45.22 s in the track) lands on the logo at 20.7 s.
const DROP_IN_TRACK = 45.22, DROP_IN_FILM = 20.7;
const musicTag = `      <audio id="music" class="clip" src="assets/music/plucky-pop.mp3" data-start="0" data-duration="${total}" data-media-start="${(DROP_IN_TRACK - DROP_IN_FILM).toFixed(2)}" data-track-index="5" data-volume="0.85" data-fade-in="0.3" data-fade-out="1.2"></audio>`;
fs.writeFileSync(indexPath, fs.readFileSync(indexPath, 'utf8').replace('<!--AUDIO-->', [audioTags, musicTag].join(String.fromCharCode(10))));
console.log(`placed ${cues.length} sounds`);
