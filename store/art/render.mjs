// Renders studio.html slides to PNG at store sizes via headless Edge (CDP).
// node render.mjs <outDir> [ios|android|all] [indexes, e.g. 0,1]
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const OUT = path.resolve(process.argv[2] || 'out');
const which = process.argv[3] || 'all';
const only = process.argv[4] ? process.argv[4].split(',').map(Number) : [0, 1, 2, 3, 4, 5, 6, 7];
fs.mkdirSync(OUT, { recursive: true });
const studio = pathToFileURL(path.resolve('studio.html')).href;
const edge = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--remote-debugging-port=9335', `--user-data-dir=${path.resolve('.render-profile')}`, '--hide-scrollbars', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let t; for (let i = 0; i < 120; i++) { try { t = await (await fetch('http://127.0.0.1:9335/json')).json(); if (t.some((x) => x.type === 'page')) break; } catch {} await sleep(250); }
const ws = new WebSocket(t.find((x) => x.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let id = 0; const p = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && p.has(m.id)) { p.get(m.id)(m); p.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { id++; p.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
await send('Page.enable'); await send('Runtime.enable');

const jobs = [];
for (const platform of which === 'all' ? ['ios', 'android'] : [which]) for (const i of only) jobs.push([platform, i]);
for (const [platform, i] of jobs) {
  const [w, h] = platform === 'ipad' ? [1032, 1376] : platform === 'android' ? [360, 640] : [430, 932];
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: platform === 'ipad' ? 2 : 3, mobile: false });
  await send('Page.navigate', { url: `${studio}?p=${platform}&i=${i}` });
  await sleep(1500);
  await send('Runtime.evaluate', { expression: 'document.fonts.ready.then(() => Promise.all([...document.images].map((im) => im.complete ? 1 : new Promise((r) => { im.onload = im.onerror = r; }))))', awaitPromise: true });
  await sleep(800);
  const { result } = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
  const name = `${platform === 'android' ? 'play' : platform === 'ipad' ? 'appstore-ipad' : 'appstore'}-${String(i + 1).padStart(2, '0')}.png`;
  fs.writeFileSync(path.join(OUT, name), Buffer.from(result.data, 'base64'));
  console.log('saved', name);
}
if (which === 'all' || which === 'feature') {
  await send('Emulation.setDeviceMetricsOverride', { width: 1024, height: 500, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `${studio}?feature=1` });
  await sleep(1500);
  await send('Runtime.evaluate', { expression: 'document.fonts.ready', awaitPromise: true });
  await sleep(800);
  const { result } = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1024, height: 500, scale: 1 } });
  fs.writeFileSync(path.join(OUT, 'play-feature-graphic.png'), Buffer.from(result.data, 'base64'));
  console.log('saved play-feature-graphic.png');
}
ws.close(); edge.kill(); process.exit(0);
