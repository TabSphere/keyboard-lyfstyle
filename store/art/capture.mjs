// Captures real Lyfstyle app screens from the Expo web build at phone size (3x) by
// driving headless Edge over the Chrome DevTools Protocol (Node's built-in WebSocket).
// Usage: node capture.mjs <outDir>
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.argv[2]);
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const BASE = 'http://localhost:8081';
const W = 430;
const H = 932;
fs.mkdirSync(OUT, { recursive: true });

const profile = path.join(OUT, '.profile');
const edge = spawn(EDGE, ['--headless=new', '--remote-debugging-port=9333', `--user-data-dir=${profile}`, '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let targets;
for (let i = 0; i < 120; i += 1) {
  try { targets = await (await fetch('http://127.0.0.1:9333/json')).json(); if (targets.some((t) => t.type === 'page')) break; } catch { /* starting */ }
  await sleep(250);
}
const page = targets.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let id = 0;
const pending = new Map();
ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
});
const send = (method, params = {}) => new Promise((resolve) => { id += 1; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params })); });
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 3, mobile: true });
await send('Emulation.setTouchEmulationEnabled', { enabled: true });

const custom = JSON.stringify({ background: '#2B1B4D', key: '#FFFFFF', text: '#FFFFFF', accent: '#FF3D8B', keyAlpha: 0.3 });
let primed = null;
async function prime(state) {
  // Set the app's saved state before any page script runs.
  if (primed) await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: primed });
  const res = await send('Page.addScriptToEvaluateOnNewDocument', { source: `localStorage.clear(); const s = ${JSON.stringify(state)}; for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v);` });
  primed = res.result.identifier;
}

async function shot(name, url, { scroll = 0, scrollToText = null, wait = 3500 } = {}) {
  await send('Page.navigate', { url: `${BASE}${url}` });
  await sleep(wait);
  if (scrollToText) {
    await evaluate(`(() => { const el=[...document.querySelectorAll('div')].reverse().find(d=>d.textContent.trim().startsWith(${JSON.stringify(scrollToText)})); if(el){el.scrollIntoView({block:'start'}); return true;} return false; })()`);
  }
  if (scroll) {
    await evaluate(`(() => { document.querySelectorAll('div').forEach(d=>{ if(d.scrollHeight>d.clientHeight+40 && getComputedStyle(d).overflowY!=='visible') d.scrollTop=${scroll}; }); return true; })()`);
  }
  // Hide the web-only developer warning toast (Expo renders it in #error-toast).
  await evaluate(`(() => { const t = document.getElementById('error-toast'); if (t) t.style.display = 'none'; return true; })()`);
  await sleep(900);
  const { result } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(OUT, `${name}.png`), Buffer.from(result.data, 'base64'));
  console.log('saved', name);
}

const draft = (text, style, recents = []) => JSON.stringify({ text, selectedStyle: style, favorites: ['frame-sparkles', 'script', 'bold-script'], recents });

// Pro view: no lock labels, nicer for feature screens.
await prime({ 'lyfstyle.demoPro': '1', 'lyfstyle.composer.v2': draft('main character energy', 'frame-sparkles', ['script', 'bold-fraktur']), 'lyfstyle.keyboardTheme': 'sakura', 'lyfstyle.customTheme': custom });
await shot('write', '/');
await shot('write-groups', '/', { scrollToText: '𝓒𝓾𝓻𝓼𝓲𝓿𝓮' });
await shot('presets', '/presets');
await shot('tools', '/tools');
await shot('keyboard', '/keyboard');
await shot('keyboard-pictures', '/keyboard', { scrollToText: 'K-POP' });
await shot('custom-theme', '/custom-theme');

// Free view for the Pro paywall.
await prime({ 'lyfstyle.demoPro': '0' });
await shot('pro', '/pro');

ws.close();
edge.kill();
process.exit(0);
