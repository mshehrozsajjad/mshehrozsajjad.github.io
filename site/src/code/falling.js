// The engineering hero: Shehroz's sprite beside his GitHub contribution calendar, built out of falling code.
// Thin streams of characters fall through the hero. Streams over the calendar land on it and fill it in, one character
// per day with contributions, bottom of each week first. Every other stream lands at the bottom of the screen and piles up,
// character by character, into a skyline of code; piles stay low under the words and grow taller in the open space.
// Quiet days stay a faint dot; busier days are bolder. Pointing at a day names it.
// Live numbers come from /api/contributions (the worker reads his public calendar); /data/contributions.json is the fallback.
// Reduced motion: the calendar is drawn filled, a low skyline is already there, and nothing falls.

const LETTERS = 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz{}[]()<>/=+*;:#$&%01ABCDEFGHIJKLMNOP';
const fmt = n => n.toLocaleString('en-US');
const pick = s => s[(Math.random()*s.length)|0];
const FONT = w => `${w} 11px "JetBrains Mono", ui-monospace, monospace`;

async function load(){
  for (const url of ['/api/contributions', '/data/contributions.json']){
    try { const r = await fetch(url); if (r.ok){ const d = await r.json(); if (d && d.counts && d.counts.length) return d; } } catch (_) {}
  }
  return null;
}
function dayOf(start, i){ const d = new Date(start + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + i); return d; }

export async function mountFalling(hero, {reduce = false} = {}){
  const box = hero.querySelector('#ghGrid'); if (!box) return;
  const copy = hero.querySelector('.hero-copy');
  const data = await load(); if (!data) return;
  const {counts, start} = data, N = counts.length;
  const total = data.total ?? counts.reduce((a, b) => a + b, 0), week = counts.slice(-7).reduce((a, b) => a + b, 0);
  hero.querySelectorAll('[data-gh-total]').forEach(el => el.textContent = fmt(total));
  hero.querySelectorAll('[data-gh-week]').forEach(el => el.textContent = fmt(week));
  hero.querySelector('.gh-line')?.removeAttribute('hidden');
  box.setAttribute('aria-label', `${fmt(total)} GitHub contributions in the last year, one character per day`);

  // a week per column, Sunday at the top, as GitHub draws it
  const offset = dayOf(start, 0).getUTCDay();
  const cap = Math.min(Math.max(1, ...counts), 40);
  const lvl = counts.map(n => n ? .35 + .65*Math.min(1, Math.log1p(n)/Math.log1p(cap)) : 0);

  const cv = document.createElement('canvas'); cv.className = 'fall'; cv.setAttribute('aria-hidden', 'true'); hero.prepend(cv);
  const ctx = cv.getContext('2d');
  const tip = document.createElement('span'); tip.className = 'fall-tip'; tip.setAttribute('aria-hidden', 'true'); hero.appendChild(tip);

  let sig, ink;
  const colours = () => { const c = getComputedStyle(document.documentElement); sig = c.getPropertyValue('--signal').trim() || '#2D2BE0'; ink = c.getPropertyValue('--ink').trim() || '#111113'; };
  colours();

  const CW = 11, CH = 17, GH = 12;     // column width, rain and pile row height, calendar row height
  let W, H, dpr, gx, gy, cells = [], gpiles = [], cols = 0, piles = [], caps = [], goal = [], streams = [], towers = null;

  function layout(){
    dpr = Math.min(2, devicePixelRatio || 1); W = hero.clientWidth; H = hero.clientHeight;
    cv.width = W*dpr; cv.height = H*dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    const hb = hero.getBoundingClientRect(), bb = box.getBoundingClientRect();
    const allWeeks = Math.ceil((N + offset)/7), weeks = Math.min(allWeeks, Math.max(8, Math.floor(bb.width/CW)));
    const first = (allWeeks - weeks)*7 - offset;            // on a narrow screen, the most recent weeks
    gx = bb.left - hb.left; gy = bb.top - hb.top + Math.max(0, (bb.height - 7*GH)/2);
    const had = new Map(cells.map(c => [c.d, c.ch]));
    cells = [];
    for (let w = 0; w < weeks; w++) for (let r = 0; r < 7; r++){
      const d = first + w*7 + r; if (d < 0 || d >= N) continue;
      cells.push({d, w, r, x: gx + w*CW, y: gy + r*GH, ch: had.get(d) || (reduce && counts[d] ? pick(LETTERS) : null)});
    }
    gpiles = Array.from({length: weeks}, (_, w) => cells.filter(c => c.w === w && counts[c.d] > 0 && !c.ch).sort((a, b) => b.r - a.r));
    // the skyline: one pile per column. Under the words it stays below them; in open space it may rise to 55% of the hero.
    cols = Math.ceil(W/CW);
    const cb = copy.getBoundingClientRect(), kids = [...copy.children].map(k => k.getBoundingClientRect()).filter(r => r.height);
    caps = Array.from({length: cols}, (_, i) => {
      const x0 = i*CW, x1 = x0 + CW;
      let floor = H*.45;                                                    // highest a pile may reach, from the top
      for (const r of kids) if (x1 > r.left - hb.left - 8 && x0 < r.right - hb.left + 8) floor = Math.max(floor, r.bottom - hb.top + 14);
      return Math.max(0, Math.floor((H - floor)/CH));
    });
    piles = Array.from({length: cols}, (_, i) => (piles[i] || []).slice(0, caps[i]));
    // towers, not a flat field: a few smooth bumps decide how tall each column wants to get
    if (!towers){
      const bumps = Array.from({length: 7 + (Math.random()*5|0)}, () => ({c: Math.random(), w: .012 + Math.random()*.03, h: .35 + Math.random()*.65}));
      towers = x => Math.min(1, bumps.reduce((a, b) => a + b.h*Math.exp(-((x - b.c)**2)/(2*b.w*b.w)), 0) + (Math.random() < .25 ? Math.random()*.25 : 0));
    }
    goal = caps.map((c, i) => Math.round(c*towers(i/cols)));
    if (reduce && !piles.some(p => p.length)) piles = goal.map(g => Array.from({length: g}, () => ({ch: pick(LETTERS), a: .45 + Math.random()*.55, b: Math.random() < .12})));
  }

  function rain(target){
    const text = Array.from({length: 16}, () => pick(LETTERS)), len = 3 + (Math.random()*9|0);
    if (target != null) return {x: gx + target*CW, col: -1, w: target, y: gy - 60 - Math.random()*Math.min(gy, 260), v: 3.2 + Math.random()*2.4, len, text};
    // columns that are still short of their tower are likelier to get the next stream
    let sum = 0; const want = goal.map((g, i) => { const d = Math.max(0, g - piles[i].length); sum += d; return d; });
    let col = (Math.random()*cols)|0;
    if (sum > 0){ let r = Math.random()*sum; for (let i = 0; i < cols; i++){ r -= want[i]; if (r <= 0){ col = i; break; } } }
    return {x: col*CW, col, w: -1, y: -Math.random()*H*.7, v: 1.6 + Math.random()*2.2, len, text};
  }
  function spawn(){
    const open = gpiles.map((p, w) => p.length ? w : -1).filter(w => w >= 0);
    return open.length && Math.random() < .65 ? rain(open[(Math.random()*open.length)|0]) : rain(null);
  }

  function frame(){
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    ctx.textBaseline = 'top';
    // the rain
    for (let i = 0; i < streams.length; i++){
      const s = streams[i];
      if (!reduce) s.y += s.v;
      if (s.w >= 0){                                   // aiming for the calendar
        const t = gpiles[s.w][0];
        if (!t){ s.w = -1; s.col = Math.round(s.x/CW); }
        else if (s.y >= t.y){ t.ch = s.text[0]; t.flash = 1; gpiles[s.w].shift(); s.text.shift(); s.len--; s.y -= CH; if (s.len <= 0){ streams[i] = spawn(); continue; } }
      }
      if (s.w < 0 && s.col >= 0 && s.col < cols){      // landing on the skyline, one character at a time
        const p = piles[s.col];
        while (s.len > 0 && p.length < Math.max(goal[s.col], 1) && p.length < caps[s.col] && s.y >= H - (p.length + 1)*CH){
          p.push({ch: s.text[0], a: .45 + Math.random()*.55, b: Math.random() < .12}); s.text.shift(); s.len--; s.y -= CH;
        }
        if (s.len <= 0){ streams[i] = spawn(); continue; }
      }
      ctx.font = FONT(500);
      for (let k = 0; k < s.len; k++){
        const y = s.y - k*CH; if (y < -CH || y > H) continue;
        ctx.fillStyle = sig; ctx.globalAlpha = k === 0 ? .75 : .38*(1 - k/s.len) + .06;
        ctx.fillText(s.text[k], s.x + 2, y);
      }
      if (s.y - s.len*CH > H) streams[i] = spawn();
    }
    // the skyline
    for (let i = 0; i < cols; i++){
      const p = piles[i];
      for (let k = 0; k < p.length; k++){ const c = p[k]; ctx.font = FONT(c.b ? 700 : 600); ctx.fillStyle = sig; ctx.globalAlpha = c.a; ctx.fillText(c.ch, i*CW + 2, H - (k + 1)*CH + 2); }
    }
    // the calendar
    for (const c of cells){
      const n = counts[c.d], l = lvl[c.d];
      if (c.ch){
        ctx.font = FONT(l > .75 ? 700 : 500); ctx.fillStyle = sig; ctx.globalAlpha = Math.min(1, l + (c.flash || 0)*.5);
        ctx.fillText(c.ch, c.x + 2, c.y);
        if (c.flash) c.flash = Math.max(0, c.flash - .04);
      } else {
        ctx.font = FONT(500); ctx.fillStyle = n ? sig : ink; ctx.globalAlpha = n ? .3 : .2;
        ctx.fillText('·', c.x + 3, c.y);
      }
    }
    ctx.globalAlpha = 1;
  }

  layout();
  streams = reduce ? [] : Array.from({length: Math.max(16, Math.round(W/26))}, spawn);
  frame();

  let on = false, raf = 0, seen = true;
  const loop = () => { frame(); raf = on ? requestAnimationFrame(loop) : 0; };
  const play = () => { on = seen && !reduce && !document.hidden; if (on && !raf) raf = requestAnimationFrame(loop); };
  new IntersectionObserver(([e]) => { seen = e.isIntersecting; play(); }).observe(hero);
  document.addEventListener('visibilitychange', play);
  let rw = W, rh = H;
  new ResizeObserver(() => { if (hero.clientWidth !== rw || hero.clientHeight !== rh){ rw = hero.clientWidth; rh = hero.clientHeight; layout(); frame(); } }).observe(hero);
  (document.fonts?.ready || Promise.resolve()).then(() => { layout(); frame(); });
  new MutationObserver(() => { colours(); frame(); }).observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { colours(); frame(); });

  // name the day under the pointer
  hero.addEventListener('pointermove', e => {
    const b = hero.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top;
    const c = cells.find(c => x >= c.x && x < c.x + CW && y >= c.y && y < c.y + GH);
    if (!c){ tip.classList.remove('on'); return; }
    const n = counts[c.d];
    tip.textContent = `${dayOf(start, c.d).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'})} · ${n ? fmt(n) : 'no'} contribution${n === 1 ? '' : 's'}`;
    tip.style.transform = `translate(${Math.min(x + 14, W - 230)}px, ${y + 16}px)`; tip.classList.add('on');
  });
  hero.addEventListener('pointerleave', () => tip.classList.remove('on'));
}
