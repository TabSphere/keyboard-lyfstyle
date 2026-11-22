// Draws the 8 picture keyboard themes as SVG and renders them to JPEG.
// Run with sharp available:  NODE_PATH=<dir with sharp> node scripts/make-keyboard-pictures.cjs
// Output: assets/keyboard-themes/<id>.jpg (1200x900), copied into both keyboards by build-styles.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const W = 1200;
const H = 900;
const out = path.join(__dirname, '..', 'assets', 'keyboard-themes');
fs.mkdirSync(out, { recursive: true });

// Small deterministic PRNG so the artwork is identical on every run.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const heart = (x, y, size, fill, rotate = 0, opacity = 1) =>
  `<path transform="translate(${x} ${y}) rotate(${rotate}) scale(${size / 32})" opacity="${opacity}" fill="${fill}" d="M0 9C0-3 16-6 16 6C16-6 32-3 32 9C32 20 16 28 16 32C16 28 0 20 0 9Z" transform-origin="16 16"/>`;

const sparkle = (x, y, r, fill, opacity = 1) =>
  `<path opacity="${opacity}" fill="${fill}" d="M${x} ${y - r}C${x + r * 0.12} ${y - r * 0.12} ${x + r * 0.12} ${y - r * 0.12} ${x + r} ${y}C${x + r * 0.12} ${y + r * 0.12} ${x + r * 0.12} ${y + r * 0.12} ${x} ${y + r}C${x - r * 0.12} ${y + r * 0.12} ${x - r * 0.12} ${y + r * 0.12} ${x - r} ${y}C${x - r * 0.12} ${y - r * 0.12} ${x - r * 0.12} ${y - r * 0.12} ${x} ${y - r}Z"/>`;

const daisy = (x, y, r, petal = '#FFFFFF', centre = '#FFB020') => {
  let petals = '';
  for (let i = 0; i < 10; i += 1) {
    petals += `<ellipse cx="${x}" cy="${y - r * 0.62}" rx="${r * 0.24}" ry="${r * 0.46}" fill="${petal}" transform="rotate(${i * 36} ${x} ${y})"/>`;
  }
  return `${petals}<circle cx="${x}" cy="${y}" r="${r * 0.3}" fill="${centre}"/>`;
};

const svg = (defs, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${defs}</defs>${body}</svg>`;

const designs = {
  sunset: () => {
    const r = rng(7);
    let sparkles = '';
    for (let i = 0; i < 18; i += 1) sparkles += sparkle(r() * W, r() * H * 0.55, 6 + r() * 12, '#FFFFFF', 0.25 + r() * 0.45);
    return svg(
      `<linearGradient id="g" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="#FF3D8B"/><stop offset="0.55" stop-color="#FF7A45"/><stop offset="1" stop-color="#FFD84D"/></linearGradient>
       <radialGradient id="sun" cx="0.72" cy="0.78" r="0.45"><stop offset="0" stop-color="#FFF6C8" stop-opacity="0.95"/><stop offset="1" stop-color="#FFF6C8" stop-opacity="0"/></radialGradient>`,
      `<rect width="${W}" height="${H}" fill="url(#g)"/><rect width="${W}" height="${H}" fill="url(#sun)"/>
       <path d="M0 720 C 200 660 420 760 640 700 S 1020 640 1200 700 L1200 900 L0 900Z" fill="#FF5A6E" opacity="0.35"/>
       <path d="M0 800 C 260 740 520 840 760 780 S 1060 760 1200 800 L1200 900 L0 900Z" fill="#E8304A" opacity="0.3"/>${sparkles}`,
    );
  },
  'starry-night': () => {
    const r = rng(42);
    let stars = '';
    for (let i = 0; i < 170; i += 1) stars += `<circle cx="${r() * W}" cy="${r() * H}" r="${0.8 + r() * 2.2}" fill="#FFFFFF" opacity="${0.35 + r() * 0.65}"/>`;
    for (let i = 0; i < 12; i += 1) stars += sparkle(r() * W, r() * H, 8 + r() * 14, i % 3 === 0 ? '#FFD84D' : '#FFFFFF', 0.85);
    return svg(
      `<radialGradient id="g" cx="0.3" cy="0.2" r="1.1"><stop offset="0" stop-color="#1E3270"/><stop offset="0.6" stop-color="#0F1A3D"/><stop offset="1" stop-color="#060A1C"/></radialGradient>
       <radialGradient id="moon" cx="0.82" cy="0.22" r="0.14"><stop offset="0" stop-color="#FFE48A" stop-opacity="0.45"/><stop offset="1" stop-color="#FFE48A" stop-opacity="0"/></radialGradient><mask id="crescent"><rect width="1200" height="900" fill="white"/><circle cx="1010" cy="178" r="54" fill="black"/></mask>`,
      `<rect width="${W}" height="${H}" fill="url(#g)"/>${stars}<rect width="${W}" height="${H}" fill="url(#moon)"/>
       <circle cx="984" cy="198" r="58" fill="#FFF3C4" mask="url(#crescent)"/>`,
    );
  },
  'candy-hearts': () => {
    let hearts = '';
    let row = 0;
    for (let y = -20; y < H + 60; y += 110, row += 1) {
      for (let x = (row % 2) * 70 - 40; x < W + 60; x += 140) {
        hearts += heart(x, y, 44, row % 3 === 0 ? '#FF3D8B' : row % 3 === 1 ? '#FF8FBF' : '#FFFFFF', row % 2 ? -14 : 12, 0.85);
      }
    }
    return svg(`<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE1EC"/><stop offset="1" stop-color="#FFC2DA"/></linearGradient>`,
      `<rect width="${W}" height="${H}" fill="url(#g)"/>${hearts}`);
  },
  'daisy-days': () => {
    const r = rng(11);
    let flowers = '';
    for (let i = 0; i < 26; i += 1) {
      const size = 34 + r() * 46;
      flowers += daisy(r() * W, r() * H, size, '#FFFFFF', i % 4 === 0 ? '#FF8A2A' : '#FFB020');
    }
    return svg(`<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF1B0"/><stop offset="1" stop-color="#FFDD5C"/></linearGradient>`,
      `<rect width="${W}" height="${H}" fill="url(#g)"/>${flowers}`);
  },
  aurora: () => {
    const r = rng(5);
    let stars = '';
    for (let i = 0; i < 60; i += 1) stars += `<circle cx="${r() * W}" cy="${r() * H * 0.6}" r="${0.8 + r() * 1.6}" fill="#FFFFFF" opacity="${0.3 + r() * 0.5}"/>`;
    return svg(
      `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#071A22"/><stop offset="1" stop-color="#0E2A33"/></linearGradient>
       <filter id="b" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="46"/></filter>`,
      `<rect width="${W}" height="${H}" fill="url(#g)"/>${stars}
       <g filter="url(#b)" opacity="0.9">
         <path d="M-100 420 C 200 200 420 520 700 300 S 1100 160 1320 300 L1320 420 C 1100 320 900 520 700 460 S 200 560 -100 560Z" fill="#38F2C0"/>
         <path d="M-100 520 C 260 380 520 620 820 430 S 1180 420 1320 470 L1320 560 C 1100 520 900 640 700 600 S 200 680 -100 660Z" fill="#12B886" opacity="0.8"/>
         <path d="M200 260 C 420 160 620 300 900 200 S 1200 140 1320 180 L1320 240 C 1100 240 900 320 700 300 S 380 300 200 320Z" fill="#FF8FBF" opacity="0.55"/>
       </g>
       <path d="M0 760 L140 690 L260 740 L420 650 L560 730 L700 670 L860 740 L1000 680 L1200 750 L1200 900 L0 900Z" fill="#04121A"/>`,
    );
  },
  dreamy: () => svg(
    `<filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="90"/></filter>`,
    `<rect width="${W}" height="${H}" fill="#FFE6DA"/>
     <g filter="url(#b)">
       <circle cx="220" cy="200" r="260" fill="#FF8FBF"/>
       <circle cx="960" cy="160" r="240" fill="#FFD84D" opacity="0.85"/>
       <circle cx="700" cy="760" r="300" fill="#FF6A5C" opacity="0.6"/>
       <circle cx="120" cy="780" r="220" fill="#A8E8CF" opacity="0.8"/>
       <circle cx="1140" cy="700" r="200" fill="#FFC2DA"/>
     </g>`,
  ),
  gingham: () => {
    const size = 75;
    return svg(
      `<pattern id="p" width="${size * 2}" height="${size * 2}" patternUnits="userSpaceOnUse">
         <rect width="${size * 2}" height="${size * 2}" fill="#FFFFFF"/>
         <rect width="${size}" height="${size * 2}" fill="#FF8FBF" opacity="0.45"/>
         <rect width="${size * 2}" height="${size}" fill="#FF8FBF" opacity="0.45"/>
       </pattern>`,
      `<rect width="${W}" height="${H}" fill="url(#p)"/>
       ${heart(80, 70, 70, '#E8304A', -12)}${heart(1040, 60, 60, '#E8304A', 14)}${heart(1080, 760, 80, '#E8304A', -8)}${heart(60, 770, 54, '#E8304A', 10)}`,
    );
  },
  'ocean-waves': () => {
    let waves = '';
    for (let i = 0; i < 9; i += 1) {
      const y = 140 + i * 95;
      waves += `<path d="M-50 ${y} Q 100 ${y - 40} 250 ${y} T 550 ${y} T 850 ${y} T 1150 ${y} T 1450 ${y}" fill="none" stroke="#FFFFFF" stroke-width="${6 + (i % 3) * 3}" stroke-linecap="round" opacity="${0.12 + (i % 4) * 0.06}"/>`;
    }
    return svg(`<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#38B6FF"/><stop offset="0.55" stop-color="#1D4ED8"/><stop offset="1" stop-color="#132E8A"/></linearGradient>`,
      `<rect width="${W}" height="${H}" fill="url(#g)"/>${waves}${sparkle(1020, 170, 26, '#FFD84D', 0.9)}${sparkle(160, 720, 18, '#FFFFFF', 0.7)}`);
  },
};

Promise.all(Object.entries(designs).map(([id, draw]) =>
  sharp(Buffer.from(draw())).jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(out, `${id}.jpg`)).then((info) => `${id}: ${Math.round(info.size / 1024)} KB`),
)).then((lines) => console.log(lines.join('\n')));
