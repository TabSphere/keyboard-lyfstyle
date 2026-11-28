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
  // ---- Textures (v1.2) ----------------------------------------------------
  leaves: () => {
    const r = rng(23);
    let leaves = '';
    const greens = ['#2E8B57', '#3CB371', '#1F6F43', '#56C27A', '#7BD389'];
    for (let i = 0; i < 46; i += 1) {
      const x = r() * W;
      const y = r() * H;
      const s = 0.8 + r() * 1.4;
      const a = r() * 360;
      const g = greens[i % greens.length];
      leaves += `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})"><path d="M0 0 C 40 -62 128 -62 170 0 C 128 62 40 62 0 0Z" fill="${g}"/><path d="M6 0 L 160 0" stroke="#0E3B24" stroke-opacity="0.35" stroke-width="3"/>${[40, 80, 120].map((v) => `<path d="M${v} 0 L ${v + 22} -24 M${v} 0 L ${v + 22} 24" stroke="#0E3B24" stroke-opacity="0.25" stroke-width="2"/>`).join('')}</g>`;
    }
    return svg(`<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#174D31"/><stop offset="1" stop-color="#0B2E1C"/></linearGradient>`,
      `<rect width="${W}" height="${H}" fill="url(#g)"/>${leaves}`);
  },
  marble: () => {
    const r = rng(3);
    let veins = '';
    for (let i = 0; i < 7; i += 1) {
      // Long, gently drifting diagonal veins.
      let y = r() * H;
      let d = `M-50 ${y}`;
      for (let x = 350; x <= W + 400; x += 400) {
        const next = y + 60 + (r() - 0.3) * 160;
        d += ` C ${x - 260} ${y + (r() - 0.5) * 90} ${x - 140} ${next + (r() - 0.5) * 90} ${x} ${next}`;
        y = next;
      }
      veins += `<path d="${d}" fill="none" stroke="${i < 2 ? '#D9B45A' : '#9C97A6'}" stroke-width="${i < 2 ? 3 : 1.5 + r() * 2.5}" stroke-opacity="${i < 2 ? 0.8 : 0.35}"/>`;
    }
    return svg(
      `<filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.004 0.012" numOctaves="4" seed="8"/><feColorMatrix values="0 0 0 0 0.55  0 0 0 0 0.53  0 0 0 0 0.6  0 0 0 -1.6 1.1"/></filter>`,
      `<rect width="${W}" height="${H}" fill="#F8F5F1"/><rect width="${W}" height="${H}" filter="url(#n)" opacity="0.55"/>${veins}`,
    );
  },
  'pink-glitter': () => {
    const r = rng(99);
    let dots = '';
    for (let i = 0; i < 1400; i += 1) {
      const c = r();
      dots += `<circle cx="${r() * W}" cy="${r() * H}" r="${0.8 + r() * 2.6}" fill="${c < 0.5 ? '#FFFFFF' : c < 0.8 ? '#FFC2DA' : '#FFD84D'}" opacity="${0.25 + r() * 0.75}"/>`;
    }
    for (let i = 0; i < 26; i += 1) dots += sparkle(r() * W, r() * H, 8 + r() * 16, '#FFFFFF', 0.9);
    return svg(`<radialGradient id="g" cx="0.4" cy="0.3" r="1"><stop offset="0" stop-color="#FF8CC0"/><stop offset="1" stop-color="#E81E74"/></radialGradient>`,
      `<rect width="${W}" height="${H}" fill="url(#g)"/>${dots}`);
  },
  clouds: () => {
    const cloud = (x, y, s, o) => `<g transform="translate(${x} ${y}) scale(${s})" opacity="${o}" fill="#FFFFFF"><circle cx="0" cy="0" r="60"/><circle cx="70" cy="-30" r="80"/><circle cx="150" cy="0" r="62"/><circle cx="80" cy="30" r="58"/><rect x="0" y="0" width="150" height="62"/></g>`;
    return svg(
      `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7CC8FF"/><stop offset="1" stop-color="#D6F0FF"/></linearGradient><filter id="b"><feGaussianBlur stdDeviation="3"/></filter>`,
      `<rect width="${W}" height="${H}" fill="url(#g)"/><g filter="url(#b)">${cloud(60, 140, 1.2, 0.95)}${cloud(720, 90, 1, 0.9)}${cloud(380, 430, 1.5, 0.95)}${cloud(900, 520, 1.3, 0.92)}${cloud(-40, 720, 1.4, 0.95)}${cloud(620, 780, 1.1, 0.9)}</g>`,
    );
  },
  'cherry-blossom': () => {
    const r = rng(17);
    const blossom = (x, y, s) => {
      let petals = '';
      for (let i = 0; i < 5; i += 1) petals += `<ellipse cx="0" cy="-16" rx="11" ry="17" fill="#FFB7CF" transform="rotate(${i * 72})"/>`;
      return `<g transform="translate(${x} ${y}) scale(${s})">${petals}<circle r="6" fill="#FF6F9F"/></g>`;
    };
    let flowers = '';
    const along = [[120, 240], [260, 200], [380, 270], [520, 210], [640, 300], [760, 260], [880, 330], [1010, 300], [1120, 380], [300, 120], [700, 170]];
    along.forEach(([x, y]) => { flowers += blossom(x + (r() - 0.5) * 40, y + (r() - 0.5) * 40, 1.2 + r() * 0.8); });
    for (let i = 0; i < 40; i += 1) flowers += `<ellipse cx="${r() * W}" cy="${380 + r() * 520}" rx="7" ry="11" fill="#FFC9DA" opacity="${0.5 + r() * 0.5}" transform="rotate(${r() * 360} 0 0)"/>`;
    return svg(`<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF4F8"/><stop offset="1" stop-color="#FFE0EC"/></linearGradient>`,
      `<rect width="${W}" height="${H}" fill="url(#g)"/><path d="M-20 260 C 200 190 360 290 560 230 S 900 330 1240 390" stroke="#6B4339" stroke-width="16" fill="none" stroke-linecap="round"/><path d="M300 245 C 330 180 300 140 320 100 M700 260 C 690 210 720 190 700 150" stroke="#6B4339" stroke-width="9" fill="none" stroke-linecap="round"/>${flowers}`);
  },
  checkers: () => {
    const size = 100;
    return svg(
      `<pattern id="p" width="${size * 2}" height="${size * 2}" patternUnits="userSpaceOnUse"><rect width="${size * 2}" height="${size * 2}" fill="#FFFFFF"/><rect width="${size}" height="${size}" fill="#C7B3FF"/><rect x="${size}" y="${size}" width="${size}" height="${size}" fill="#C7B3FF"/></pattern>`,
      `<rect width="${W}" height="${H}" fill="url(#p)"/>${sparkle(160, 160, 30, '#FF3D8B')}${sparkle(1040, 720, 36, '#FF3D8B')}${heart(980, 120, 56, '#FF3D8B', 12)}${heart(120, 700, 50, '#FF3D8B', -10)}`,
    );
  },
  butterflies: () => {
    const r = rng(31);
    const butterfly = (x, y, s, a, c1, c2) => `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})"><ellipse cx="-22" cy="-16" rx="22" ry="28" fill="${c1}" transform="rotate(-25 -22 -16)"/><ellipse cx="22" cy="-16" rx="22" ry="28" fill="${c1}" transform="rotate(25 22 -16)"/><ellipse cx="-16" cy="20" rx="14" ry="18" fill="${c2}" transform="rotate(25 -16 20)"/><ellipse cx="16" cy="20" rx="14" ry="18" fill="${c2}" transform="rotate(-25 16 20)"/><rect x="-3" y="-30" width="6" height="60" rx="3" fill="#3A2A55"/></g>`;
    const colours = [['#FF8FBF', '#FFD84D'], ['#FFFFFF', '#FFC2DA'], ['#8FD3FF', '#FFFFFF'], ['#FFD84D', '#FF8FBF']];
    let body = '';
    for (let i = 0; i < 22; i += 1) {
      const [c1, c2] = colours[i % colours.length];
      body += butterfly(r() * W, r() * H, 0.9 + r() * 1.1, (r() - 0.5) * 60, c1, c2);
    }
    return svg(`<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D9C8FF"/><stop offset="1" stop-color="#B79CF5"/></linearGradient>`,
      `<rect width="${W}" height="${H}" fill="url(#g)"/>${body}`);
  },
  leopard: () => {
    const r = rng(77);
    let spots = '';
    for (let i = 0; i < 70; i += 1) {
      const x = r() * W;
      const y = r() * H;
      const s = 18 + r() * 22;
      spots += `<g transform="translate(${x} ${y}) rotate(${r() * 360})"><ellipse rx="${s * 0.8}" ry="${s * 0.62}" fill="#B9773A"/><path d="M${-s} 0 A ${s} ${s * 0.8} 0 0 1 ${s * 0.3} ${-s * 0.8}" stroke="#3B2314" stroke-width="${s * 0.32}" fill="none" stroke-linecap="round"/><path d="M${s} ${s * 0.1} A ${s} ${s * 0.8} 0 0 1 ${-s * 0.2} ${s * 0.82}" stroke="#3B2314" stroke-width="${s * 0.3}" fill="none" stroke-linecap="round"/></g>`;
    }
    return svg('', `<rect width="${W}" height="${H}" fill="#E6C08A"/>${spots}`);
  },
  lemons: () => {
    const r = rng(52);
    const slice = (x, y, s, a) => {
      let segments = '';
      for (let i = 0; i < 8; i += 1) segments += `<path d="M0 0 L ${50 * Math.cos((i * Math.PI) / 4)} ${50 * Math.sin((i * Math.PI) / 4)}" stroke="#FFFFFF" stroke-width="5"/>`;
      return `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})"><circle r="64" fill="#FFE34D"/><circle r="56" fill="#FFF7C2"/><circle r="50" fill="#FFE34D"/>${segments}<circle r="6" fill="#FFFFFF"/></g>`;
    };
    let body = '';
    for (let i = 0; i < 18; i += 1) body += slice(r() * W, r() * H, 0.7 + r() * 0.8, r() * 90);
    return svg(`<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4FC3D9"/><stop offset="1" stop-color="#2E8FB8"/></linearGradient>`,
      `<rect width="${W}" height="${H}" fill="url(#g)"/>${body}`);
  },
  holo: () => svg(
    `<filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="80"/></filter>`,
    `<rect width="${W}" height="${H}" fill="#F3ECFF"/>
     <g filter="url(#b)">
       <ellipse cx="200" cy="180" rx="320" ry="200" fill="#A8E8CF"/>
       <ellipse cx="900" cy="220" rx="340" ry="220" fill="#C7B3FF"/>
       <ellipse cx="520" cy="560" rx="380" ry="220" fill="#FFC2DA"/>
       <ellipse cx="1100" cy="760" rx="260" ry="200" fill="#8FD3FF"/>
       <ellipse cx="120" cy="800" rx="260" ry="180" fill="#FFE68A"/>
     </g>${sparkle(980, 140, 22, '#FFFFFF', 0.9)}${sparkle(260, 640, 16, '#FFFFFF', 0.8)}`,
  ),
  snowfall: () => {
    const r = rng(25);
    let snow = '';
    for (let i = 0; i < 160; i += 1) snow += `<circle cx="${r() * W}" cy="${r() * H}" r="${1.2 + r() * 3.2}" fill="#FFFFFF" opacity="${0.4 + r() * 0.6}"/>`;
    for (let i = 0; i < 14; i += 1) {
      const x = r() * W;
      const y = r() * H;
      const s = 14 + r() * 20;
      let arms = '';
      for (let k = 0; k < 6; k += 1) arms += `<path d="M0 0 L0 ${-s} M0 ${-s * 0.6} L${s * 0.25} ${-s * 0.85} M0 ${-s * 0.6} L${-s * 0.25} ${-s * 0.85}" transform="rotate(${k * 60})"/>`;
      snow += `<g transform="translate(${x} ${y})" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.85">${arms}</g>`;
    }
    return svg(`<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B2545"/><stop offset="1" stop-color="#1B4F72"/></linearGradient>`,
      `<rect width="${W}" height="${H}" fill="url(#g)"/>${snow}<path d="M0 800 C 300 760 600 820 900 780 S 1200 790 1200 790 L1200 900 L0 900Z" fill="#FFFFFF" opacity="0.9"/>`);
  },
  strawberries: () => {
    const r = rng(64);
    const berry = (x, y, s, a) => {
      let seeds = '';
      for (let i = 0; i < 9; i += 1) seeds += `<ellipse cx="${-18 + (i % 3) * 18}" cy="${-4 + Math.floor(i / 3) * 16}" rx="2.5" ry="4" fill="#FFE48A"/>`;
      return `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})"><path d="M-36 -18 C -36 -40 36 -40 36 -18 C 36 10 10 40 0 46 C -10 40 -36 10 -36 -18Z" fill="#F0384F"/>${seeds}<path d="M-26 -30 L -10 -40 L 0 -30 L 10 -40 L 26 -30 L 10 -24 L 0 -28 L -10 -24Z" fill="#3CB371"/></g>`;
    };
    let body = '';
    for (let i = 0; i < 26; i += 1) body += berry(r() * W, r() * H, 0.8 + r() * 0.9, (r() - 0.5) * 60);
    return svg(`<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE3EA"/><stop offset="1" stop-color="#FFC9D6"/></linearGradient>`,
      `<rect width="${W}" height="${H}" fill="url(#g)"/>${body}`);
  },
};

const only = process.argv.slice(2);
Promise.all(Object.entries(designs).filter(([id]) => !only.length || only.includes(id)).map(([id, draw]) =>
  sharp(Buffer.from(draw())).jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(out, `${id}.jpg`)).then((info) => `${id}: ${Math.round(info.size / 1024)} KB`),
)).then((lines) => console.log(lines.join('\n')));
