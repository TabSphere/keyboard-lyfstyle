// Landing page interactions. Uses window.LYF from assets/data.js (built from the app's catalogue).
(() => {
  const { styles, themes } = window.LYF;
  const $ = (id) => document.getElementById(id);
  const byId = Object.fromEntries(styles.map((s) => [s.id, s]));
  const joinable = /^[A-Za-z0-9]$/;

  // Same rules as the app's styleEngine.transformText.
  const tf = (text, id) => {
    const s = byId[id];
    if (!s) return text;
    const chars = Array.from(text);
    let out = '';
    chars.forEach((c, i) => {
      out += s.map[c] ?? c;
      const next = chars[i + 1];
      if (s.join && next !== undefined && joinable.test(c) && joinable.test(next)) out += s.join;
    });
    return (s.pre || s.suf) && text.trim() ? `${s.pre ?? ''}${out}${s.suf ?? ''}` : out;
  };

  const toast = (msg) => {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove('show'), 1600);
  };
  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); return true; } catch {
      const ta = Object.assign(document.createElement('textarea'), { value: text });
      document.body.append(ta); ta.select();
      const ok = document.execCommand('copy'); ta.remove(); return ok;
    }
  };

  /* ---------- Playground ---------- */
  // A teaser, not the whole app: the 3 styles that are free in the app can be copied here;
  // a few Pro styles are shown as a preview only. The rest live in the app.
  const TEASER = ['frame-sparkles', 'script', 'sans-bold', 'bold-script', 'fraktur', 'circled', 'mythic', 'frame-hearts'].filter((id) => byId[id]);
  const TOTAL = window.LYF.totalStyles || 112;
  const words = $('words');
  const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');

  const renderResults = () => {
    const text = words.value || 'main character energy';
    $('results').innerHTML = TEASER.map((id) => {
      const s = byId[id];
      const tag = s.free ? '<span class="tag">FREE</span>' : '<span class="tag pro">🔒 IN THE APP</span>';
      return `<button type="button" class="style${s.free ? '' : ' locked'}" data-id="${id}"><span class="t"><span class="n">${s.name}${tag}</span><span class="o">${esc(tf(text, id))}</span></span><span class="c">${s.free ? 'Copy' : 'Get it'}</span></button>`;
    }).join('') + `<a class="style moreStyles" href="#get"><span class="t"><span class="o">+${TOTAL - TEASER.length} more styles</span><span class="n">Cursive, gothic, bubbles, glitch, emoji frames and kaomoji, in the app</span></span><span class="c">Get app</span></a>`;
  };
  $('results').addEventListener('click', async (e) => {
    const b = e.target.closest('button.style');
    if (!b) return;
    const s = byId[b.dataset.id];
    if (!s.free) {
      toast(`${s.name} and ${TOTAL - 3} more styles are in the app 💕`);
      document.getElementById('get').scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (await copy(tf(words.value || 'main character energy', b.dataset.id))) {
      b.classList.add('copied'); b.querySelector('.c').textContent = 'Copied';
      setTimeout(() => { b.classList.remove('copied'); b.querySelector('.c').textContent = 'Copy'; }, 1300);
      toast(`Copied ${s.name}. Paste it anywhere ✨`);
    }
  });
  words.addEventListener('input', renderResults);
  $('clear').addEventListener('click', () => { words.value = ''; words.focus(); renderResults(); });
  renderResults();

  /* ---------- Keyboard demo ---------- */
  const kbStyles = ['script', 'fraktur', 'bold-script', 'circled'].filter((id) => byId[id] && byId[id].kb);
  let kbStyle = kbStyles[0];
  let typed = '';
  let look = null; // { bg, key, alpha, text, accent, img, dim }

  const hexA = (h, a) => { const v = parseInt(h.slice(1), 16); return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${a})`; };
  const lum = (h) => { const v = parseInt(h.slice(1), 16); return (0.2126 * ((v >> 16) & 255) + 0.7152 * ((v >> 8) & 255) + 0.0722 * (v & 255)) / 255; };
  const onColour = (h) => (lum(h) > 0.55 ? '#22172F' : '#FFFFFF');

  const ROWS = [[...'qwertyuiop'], [...'asdfghjkl'], [...'zxcvbnm', '⌫']];
  const renderKeys = () => {
    const keyBg = hexA(look.key, look.alpha);
    const st = `background:${keyBg};color:${look.text}`;
    $('kbStyles').innerHTML = kbStyles.map((id) => `<button type="button" class="kchip" data-s="${id}" style="${id === kbStyle ? `background:${look.accent};color:${onColour(look.accent)}` : st}">${tf(byId[id].name, id)}</button>`).join('');
    $('rows').innerHTML = ROWS.map((row) => `<div class="row">${row.map((c) => `<button type="button" class="key${c === '⌫' ? ' wide' : ''}" data-k="${c}" style="${st}" aria-label="${c === '⌫' ? 'Delete' : c}">${c === '⌫' ? c : tf(c, kbStyle)}</button>`).join('')}</div>`).join('')
      + `<div class="row"><button type="button" class="key space" data-k=" " style="${st}">${tf('lyfstyle', kbStyle)}</button><button type="button" class="key send" data-k="send" style="background:${look.accent};color:${onColour(look.accent)}">send</button></div>`;
  };
  const renderTyped = () => { $('typed').textContent = tf(typed, kbStyle); };
  const applyLook = (l) => {
    look = l;
    const kb = $('kb');
    kb.style.backgroundColor = l.bg;
    kb.style.backgroundImage = l.img ? `url("${l.img}")` : 'none';
    $('kbdim').style.display = l.dim ? 'block' : 'none';
    renderKeys();
  };
  $('kb').addEventListener('click', (e) => {
    const chip = e.target.closest('[data-s]');
    if (chip) { kbStyle = chip.dataset.s; renderKeys(); renderTyped(); return; }
    const key = e.target.closest('[data-k]');
    if (!key) return;
    const k = key.dataset.k;
    if (k === '⌫') typed = Array.from(typed).slice(0, -1).join('');
    else if (k === 'send') { if (typed.trim()) { $('sent').textContent = tf(typed, kbStyle); typed = ''; } }
    else if (Array.from(typed).length < 40) typed += k;
    renderTyped();
  });

  // Themes: grouped like the app's picker.
  const tGroups = [...new Set(themes.map((t) => t.group))];
  let tGroup = 'Cute & sweet';
  let themeId = 'sakura';
  const themeLook = (t) => ({ bg: t.bg, key: t.key, alpha: t.img ? (t.alpha ?? 1) : 1, text: t.text, accent: t.accent, img: t.img ? `/assets/themes/${t.img}` : null, dim: false });
  const renderThemeGroups = () => {
    $('themeGroups').innerHTML = tGroups.map((g) => `<button type="button" class="chip" role="tab" aria-selected="${g === tGroup}" data-tg="${g}">${g}</button>`).join('');
  };
  const renderThemes = () => {
    $('themes').innerHTML = themes.filter((t) => t.group === tGroup).map((t) => {
      const bg = t.img ? `background-image:url('/assets/themes/thumbs/${t.img}')` : `background:${t.bg}`;
      return `<button type="button" class="thumb" data-t="${t.id}" aria-pressed="${t.id === themeId}" style="${bg}"><span>${t.name}</span></button>`;
    }).join('');
  };
  $('themeGroups').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tg]');
    if (!b) return;
    tGroup = b.dataset.tg; renderThemeGroups(); renderThemes();
  });
  $('themes').addEventListener('click', (e) => {
    const b = e.target.closest('[data-t]');
    if (!b) return;
    themeId = b.dataset.t;
    applyLook(themeLook(themes.find((t) => t.id === themeId)));
    renderThemes();
  });

  // Your photo: read locally, never uploaded.
  let photoUrl = null;
  $('photo').addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoUrl = URL.createObjectURL(file);
    themeId = null; renderThemes();
    applyLook({ bg: '#000000', key: '#FFFFFF', alpha: 0.22, text: '#FFFFFF', accent: look.accent, img: photoUrl, dim: true });
    toast('Your photo is on the keyboard 📷');
  });

  // Colour wheel: mix background, keys and accent.
  const mix = () => {
    themeId = null; renderThemes();
    const key = $('mixKey').value;
    applyLook({ bg: $('mixBg').value, key, alpha: 1, text: onColour(key), accent: $('mixAccent').value, img: null, dim: false });
  };
  ['mixBg', 'mixKey', 'mixAccent'].forEach((id) => $(id).addEventListener('input', mix));

  renderThemeGroups(); renderThemes();
  applyLook(themeLook(themes.find((t) => t.id === themeId) || themes[0]));
  typed = 'see u at 8';
  renderTyped();

  /* ---------- Video: load YouTube only on tap ---------- */
  $('player').addEventListener('click', function play() {
    this.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/jjAurty9SR8?autoplay=1&rel=0" title="Lyfstyle: Fonts Keyboard" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
    this.removeEventListener('click', play);
  });

  /* ---------- Store buttons ---------- */
  let live = 0;
  document.querySelectorAll('.store').forEach((a) => {
    if (a.dataset.href) { a.href = a.dataset.href; a.rel = 'noopener'; live += 1; return; }
    a.classList.add('soon');
    a.setAttribute('aria-disabled', 'true');
    a.addEventListener('click', (e) => { e.preventDefault(); toast(`${a.dataset.store}: coming very soon 💕`); });
  });
  if (live === 2) $('storeNote').textContent = 'Free to download. Lifetime Pro is £9.99 once.';
})();
