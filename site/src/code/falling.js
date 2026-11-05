// The engineering hero's falling code. Every character is one day of Shehroz's public GitHub history:
// quiet days are a faint dot, busy days are a bright glyph, and streams of light run down the columns over them.
// Live numbers come from /api/contributions (the worker reads his public calendar); the snapshot in /data is the fallback.
// Pointing at an empty part of the hero names the day under the pointer. Still for reduced motion, paused off screen.

const CHARS = '{}[]()<>/\\=+*;:#$&%01λ';
const fmt = n => n.toLocaleString('en-US');

async function load(){
  for (const url of ['/api/contributions', '/data/contributions.json']){
    try { const r = await fetch(url); if (r.ok){ const d = await r.json(); if (d && d.counts && d.counts.length) return d; } } catch (_) {}
  }
  return null;
}
function dayOf(start, i){ const d = new Date(start + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + i); return d; }

export async function mountFalling(hero, {reduce = false} = {}){
  const data = await load(); if (!data) return;
  const {counts, start} = data, N = counts.length;
  const total = data.total ?? counts.reduce((a, b) => a + b, 0), week = counts.slice(-7).reduce((a, b) => a + b, 0);
  hero.querySelectorAll('[data-gh-total]').forEach(el => el.textContent = fmt(total));
  hero.querySelectorAll('[data-gh-week]').forEach(el => el.textContent = fmt(week));
  hero.querySelector('.gh-line')?.removeAttribute('hidden');

  const max = Math.max(1, ...counts), lvl = counts.map(n => n ? .3 + .7*Math.min(1, Math.log1p(n)/Math.log1p(Math.min(max, 40))) : 0);
  const glyph = counts.map((n, i) => n ? CHARS[(i*7 + n*13) % CHARS.length] : '·');

  const cv = document.createElement('canvas'); cv.className = 'fall'; cv.setAttribute('aria-hidden', 'true');
  hero.prepend(cv);
  const ctx = cv.getContext('2d'), base = document.createElement('canvas'), bctx = base.getContext('2d');
  const tip = document.createElement('span'); tip.className = 'fall-tip'; tip.setAttribute('aria-hidden', 'true'); hero.appendChild(tip);

  const css = getComputedStyle(document.documentElement);
  const sig = css.getPropertyValue('--signal').trim() || '#5BC0FF';
  const CW = 14, CH = 18;
  let W, H, cols, rows, dpr, streams = [];
  const day = (c, r) => (c*rows + r) % N;   // the year runs down the columns, left to right, and wraps

  function size(){
    dpr = Math.min(2, devicePixelRatio || 1); W = hero.clientWidth; H = hero.clientHeight;
    cols = Math.ceil(W/CW); rows = Math.ceil(H/CH);
    for (const c of [cv, base]){ c.width = W*dpr; c.height = H*dpr; }
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    // the resting layer: the whole year, faintly, drawn once
    bctx.setTransform(dpr, 0, 0, dpr, 0, 0); bctx.clearRect(0, 0, W, H);
    bctx.font = '500 12px "JetBrains Mono", ui-monospace, monospace'; bctx.textBaseline = 'top'; bctx.fillStyle = sig;
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++){
      const d = day(c, r); bctx.globalAlpha = lvl[d] ? .05 + .12*lvl[d] : .05; bctx.fillText(glyph[d], c*CW + 2, r*CH + 2);
    }
    // a stream per column; columns over busier days run a little faster
    streams = Array.from({length: cols}, (_, c) => ({y: Math.random()*rows*1.6 - rows*.6, v: .06 + Math.random()*.12, len: 6 + Math.random()*16, c}));
  }

  function frame(){
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    ctx.drawImage(base, 0, 0, W, H);
    ctx.font = '500 12px "JetBrains Mono", ui-monospace, monospace'; ctx.textBaseline = 'top';
    for (const s of streams){
      const head = Math.floor(s.y);
      for (let k = 0; k < s.len; k++){
        const r = head - k; if (r < 0 || r >= rows) continue;
        const d = day(s.c, r), fade = 1 - k/s.len, l = lvl[d];
        if (k === 0){ ctx.fillStyle = '#E7F6FF'; ctx.globalAlpha = .55 + .45*l; }
        else { ctx.fillStyle = sig; ctx.globalAlpha = fade*(l ? .2 + .8*l : .1); }
        ctx.fillText(glyph[d], s.c*CW + 2, r*CH + 2);
      }
      if (!reduce){ s.y += s.v; if (s.y - s.len > rows){ s.y = -Math.random()*rows*.5; s.v = .06 + Math.random()*.12; s.len = 6 + Math.random()*16; } }
    }
    ctx.globalAlpha = 1;
  }

  let on = false, raf = 0;
  const loop = () => { frame(); raf = on ? requestAnimationFrame(loop) : 0; };
  const play = v => { on = v && !reduce && !document.hidden; if (on && !raf) raf = requestAnimationFrame(loop); };
  size(); frame();
  new ResizeObserver(() => { const w = hero.clientWidth, h = hero.clientHeight; if (w !== W || h !== H){ size(); frame(); } }).observe(hero);
  let seen = true;
  new IntersectionObserver(([e]) => { seen = e.isIntersecting; play(seen); }).observe(hero);
  document.addEventListener('visibilitychange', () => play(seen));

  // name the day under the pointer, only over the empty parts of the hero (not over words, the globe or the terminal)
  const busy = '.hero-copy > *, .p3d, .term, a, button, input';
  hero.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || e.target.closest(busy)){ tip.classList.remove('on'); return; }
    const b = hero.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top;
    const d = day(Math.floor(x/CW), Math.floor(y/CH)), n = counts[d];
    tip.textContent = `${dayOf(start, d).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'})} · ${n ? fmt(n) : 'no'} contribution${n === 1 ? '' : 's'}`;
    tip.style.transform = `translate(${Math.min(x + 14, W - 230)}px, ${y + 16}px)`; tip.classList.add('on');
  });
  hero.addEventListener('pointerleave', () => tip.classList.remove('on'));
}
