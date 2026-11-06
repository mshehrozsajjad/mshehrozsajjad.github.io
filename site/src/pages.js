// The runtime for the pitch and the four role pages. The long story at /story keeps its own (main.js).
// One line drawn by hand down the left gutter, the same reveals and doodles, the postcard, and a hello for whoever the link was made for.
import {createReveal} from './reveal.js';
import {smooth} from './spline.js';
import {handDrawn} from './hand.js';

(() => {
"use strict";
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement, main = $('#main'), svg = $('#trail'), pLine = $('#pMain');
if (!reduce) root.classList.add('js');
const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const phone = () => innerWidth <= 760;

/* ---------- who this page is for ----------
   A link like /ai?for=anna&at=acme greets Anna (from Acme). It is remembered for the visit, and carried on every link between the pages.
   Only ever written with textContent, so a link cannot inject anything. */
const who = (() => {
  const q = new URLSearchParams(location.search), clean = v => (v || '').replace(/[<>{}\[\]"`\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40);
  const cap = v => v.replace(/(^|[\s-])\p{Ll}/gu, m => m.toUpperCase());
  let w = {name: cap(clean(q.get('for') || q.get('name'))), co: clean(q.get('at') || q.get('co'))};
  try {
    if (w.name || w.co) sessionStorage.setItem('who', JSON.stringify(w));
    else w = JSON.parse(sessionStorage.getItem('who') || '{}');
  } catch (_) {}
  return w;
})();
if (who.name) root.classList.add('has-name');
if (who.co) root.classList.add('has-co');
$$('[data-who]').forEach(el => { if (who.name) el.textContent = who.name; });
$$('[data-co]').forEach(el => { if (who.co) el.textContent = who.co; });
$$('[data-if-who]').forEach(el => { el.hidden = !who.name; });
$$('[data-if-co]').forEach(el => { el.hidden = !who.co; });
$$('[data-if-nobody]').forEach(el => { el.hidden = !!who.name; });
if (who.name || who.co){
  const qs = new URLSearchParams(); if (who.name) qs.set('for', who.name); if (who.co) qs.set('at', who.co);
  $$('a[href^="/"]').forEach(a => { const h = a.getAttribute('href'); if (/^\/(code|design|ai|hardware)?\/?(#.*)?$/.test(h)){ const [path, hash] = h.split('#'); a.setAttribute('href', `${path}?${qs}${hash ? '#' + hash : ''}`); } });
}

/* ---------- the sprites: two-frame animations, still for people who asked for less motion ---------- */
if (reduce) $$('img.sprite').forEach(i => { const a = i.getAttribute('src'); if (a && a.includes('-anim.webp')) i.setAttribute('src', a.replace('/v2/', '/').replace('-anim.webp', '.webp')); });
if (reduce) $$('video[autoplay]').forEach(v => { v.removeAttribute('autoplay'); v.pause(); });

/* ---------- the line ----------
   Waypoints are [data-o] elements in reading order. On phones every point moves to the gutter, except those marked data-keep.
   It draws as the reading point (64% down the screen) passes; on arrival the first stretch draws itself to the hero's pen. */
const pos = el => { const r = el.getBoundingClientRect(), m = main.getBoundingClientRect(); return {x: r.left - m.left + r.width/2, y: r.top - m.top + r.height/2}; };
const visible = el => el.offsetParent !== null || !!el.closest('.top');
let T = null, penLen = 0, introT = reduce ? 1 : 0;
function build(){
  if (!svg) return;
  svg.style.height = '0';
  const H = main.scrollHeight, W = main.clientWidth;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.style.height = H + 'px';
  let pts = $$('[data-o]', main).filter(visible).map(el => ({...pos(el), el, o: +el.dataset.o, vert: el.hasAttribute('data-v')})).sort((a, b) => a.o - b.o);
  if (phone()){
    const x0 = parseFloat(getComputedStyle($('main .wrap')).paddingLeft) - 24;
    pts = pts.filter(p => !p.el.closest('.top')).map(p => p.el.hasAttribute('data-keep') ? p : {...p, x: x0, vert: true});
  }
  if (pts.length < 2){ pLine.setAttribute('d', ''); T = null; return; }
  const d = handDrawn(smooth(pts), {anchors: pts, seed: pts.length, side: () => 0});
  pLine.setAttribute('d', d);
  const len = pLine.getTotalLength() || 0, N = Math.max(200, Math.round(len/6)), step = len/N, maxY = [];
  let mx = -1e9; for (let i = 0; i <= N; i++){ mx = Math.max(mx, pLine.getPointAtLength(i*step).y); maxY.push(mx); }
  pLine.style.strokeDasharray = `${len} ${len}`;
  T = {len, step, maxY, shown: T ? Math.min(T.shown, len) : 0};
  // how far along the line the pen sits
  const pen = $('.hero .pen'); penLen = 0;
  if (pen && visible(pen)){ const pp = pos(pen); let best = 1e9;
    for (let L = 0; L <= len; L += step){ const q = pLine.getPointAtLength(L), dd = (q.x - pp.x)**2 + (q.y - pp.y)**2; if (dd < best){ best = dd; penLen = L; } } }
  nodes = $$('.dot[data-o]', main).filter(visible).map(el => ({el, y: pos(el).y}));
  frame();
}
let nodes = [];
const drawnLength = (t, y) => { const a = t.maxY; if (!a.length || a[0] > y) return 0; let lo = 0, hi = a.length - 1; while (lo < hi){ const m = (lo + hi + 1) >> 1; if (a[m] <= y) lo = m; else hi = m - 1; } return lo*t.step; };

const reveal = createReveal(reduce);
let ticking = false;
function frame(){
  ticking = false;
  const readY = scrollY + innerHeight*.64 - (main.getBoundingClientRect().top + scrollY);
  const atEnd = scrollY + innerHeight >= document.documentElement.scrollHeight - 4;
  let busy = introT < 1;
  if (T){
    let target = reduce || atEnd ? T.len : drawnLength(T, readY);
    // on arrival the line leads to the pen; the first scroll takes over
    if (!reduce && penLen && scrollY < 24) target = Math.min(penLen*introT, penLen);
    T.shown = reduce ? target : T.shown + (target - T.shown)*.2;
    if (Math.abs(target - T.shown) > .5) busy = true;
    pLine.style.strokeDashoffset = (T.len - T.shown).toFixed(1);
    pLine.style.visibility = T.shown > 1 ? '' : 'hidden';
  }
  nodes.forEach(n => n.el.classList.toggle('hit', reduce || atEnd || n.y <= readY));
  reveal.check(atEnd);
  const fab = $('#fab'); if (fab) fab.classList.toggle('show', scrollY > innerHeight*.7);
  if (!reduce && busy) req();
}
function req(){ if (!ticking){ ticking = true; requestAnimationFrame(frame); } }
addEventListener('scroll', req, {passive: true});
let rz; const rebuild = () => { clearTimeout(rz); rz = setTimeout(build, 120); };
addEventListener('resize', rebuild);
if (main) new ResizeObserver(rebuild).observe(main);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
addEventListener('load', build);

// the hero stroke draws itself to the pen, then the spark
(() => {
  const spr = $('.hero .s-draw');
  if (reduce){ spr && spr.classList.add('arrived'); return; }
  const ease = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2;
  let t0 = 0;
  const tick = ts => { if (!t0) t0 = ts + 300; const k = cl((ts - t0)/1900); introT = ease(k); req(); if (k < 1) requestAnimationFrame(tick); else spr && spr.classList.add('arrived'); };
  const begin = () => requestAnimationFrame(tick);
  if (document.readyState === 'complete') begin(); else addEventListener('load', begin, {once: true});
})();

/* ---------- videos play only while they are on screen ---------- */
const vio = new IntersectionObserver(es => es.forEach(e => { const v = e.target; if (e.isIntersecting && !reduce && !v.closest('[hidden]')) v.play().catch(() => {}); else v.pause(); }), {threshold: .25});
$$('video:not(.twin)').forEach(v => { v.removeAttribute('autoplay'); vio.observe(v); });

/* ---------- tabs: a window of panes that plays through on its own, until someone picks one ---------- */
$$('[data-tabs]').forEach(bar => {
  const tabs = $$('[role=tab]', bar), win = $('#' + bar.dataset.tabs), STEP = 5000;
  let i = 0, timer = 0, resume = 0, seen = false, hold = false;
  const show = (k, focus) => {
    i = (k + tabs.length) % tabs.length;
    tabs.forEach((t, j) => { const on = j === i, pane = $('#' + t.getAttribute('aria-controls'));
      t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; pane.hidden = !on; pane.classList.toggle('on', on);
      const v = $('video', pane); if (v){ if (on && !reduce){ v.currentTime = 0; v.play().catch(() => {}); } else v.pause(); } });
    if (focus) tabs[i].focus();
    bar.classList.remove('run'); void bar.offsetWidth; if (timer) bar.classList.add('run');
  };
  const stop = () => { clearInterval(timer); timer = 0; bar.classList.remove('run'); };
  const start = () => { if (reduce || timer || !seen || hold) return; timer = setInterval(() => show(i + 1), STEP); bar.classList.add('run'); };
  const takeOver = () => { stop(); clearTimeout(resume); resume = setTimeout(start, 12000); };
  tabs.forEach((t, j) => { t.addEventListener('click', () => { takeOver(); show(j); });
    t.addEventListener('keydown', e => { const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (d){ e.preventDefault(); takeOver(); show(i + d, true); } }); });
  [win, bar].forEach(el => { el.addEventListener('pointerenter', () => { hold = true; stop(); }); el.addEventListener('pointerleave', () => { hold = false; start(); }); });
  bar.style.setProperty('--step', STEP + 'ms');
  new IntersectionObserver(es => es.forEach(e => { seen = e.isIntersecting; if (seen) start(); else stop(); }), {threshold: .2}).observe(win);
});

/* ---------- a screenshot that turns into its film ---------- */
document.addEventListener('click', e => {
  const f = e.target.closest('[data-film]'); if (!f) return;
  const card = $('#' + f.dataset.film), box = $('.m-film', card), v = $('video', box), on = box.hidden;
  box.hidden = !on; card.classList.toggle('playing', on); f.setAttribute('aria-pressed', on);
  $('.lbl', f).textContent = on ? 'Back to the product' : f.dataset.label;
  if (on){ v.currentTime = 0; if (!reduce) v.play().catch(() => {}); } else v.pause();
});

/* ---------- folds slide open and shut ---------- */
function slideDetails(d, open){
  if (d._anim){ d._anim.cancel(); d._anim = null; }
  if (reduce){ d.open = open; return; }
  const sum = d.querySelector(':scope > summary'), cs = getComputedStyle(d);
  const shut = () => sum.getBoundingClientRect().bottom - d.getBoundingClientRect().top + parseFloat(cs.paddingBottom) + parseFloat(cs.borderBottomWidth);
  const from = d.offsetHeight; if (open) d.open = true;
  const to = open ? d.offsetHeight : shut();
  if (Math.abs(to - from) < 2){ if (!open) d.open = false; return; }
  d.style.overflowX = 'visible'; d.style.overflowY = 'clip';
  const dur = Math.min(620, Math.max(320, Math.abs(to - from)*.7));
  d._dir = open;
  const anim = d._anim = d.animate({height: [from + 'px', to + 'px']}, {duration: dur, easing: 'cubic-bezier(.22,.7,.2,1)'});
  if (open) [...d.children].filter(c => c !== sum).forEach(c => c.animate({opacity: [0, 1], transform: ['translateY(10px)', 'none']}, {duration: dur*.9, delay: dur*.12, easing: 'ease-out', fill: 'backwards'}));
  anim.onfinish = anim.oncancel = () => { d.style.overflowX = d.style.overflowY = ''; if (d._anim === anim){ d._anim = null; if (!open) d.open = false; } requestAnimationFrame(build); };
}
document.addEventListener('click', e => {
  const sum = e.target.closest('summary'); if (sum){ const d = sum.parentElement; if (d.matches('.role,.qa')){ e.preventDefault(); slideDetails(d, !(d._anim ? d._dir : d.open)); } return; }
  const less = e.target.closest('.role-less'); if (less){ const d = less.closest('details'); slideDetails(d, false); $('summary', d).focus({preventScroll: true}); }
});

/* ---------- marker doodles, drawn when they come into view ---------- */
const NS = 'http://www.w3.org/2000/svg';
const SHAPES = {
  underline: {box: 'left:-3%;width:106%;bottom:-.26em;height:.42em', vb: '0 0 100 20', d: ['M2 13 C 18 8, 34 15, 52 11 S 84 8, 98 12']},
  underline2: {box: 'left:-4%;width:108%;bottom:-.34em;height:.5em', vb: '0 0 100 24', d: ['M2 10 C 22 5, 48 14, 70 8 S 92 7, 98 9', 'M8 18 C 30 14, 62 20, 94 15']}
};
function fit(s, sh){
  const r = s.getBoundingClientRect(); if (!r.width || !r.height) return;
  const [, , vw, vh] = sh.vb.split(' ').map(Number), sx = r.width/vw, sy = r.height/vh;
  s.setAttribute('viewBox', `0 0 ${r.width.toFixed(1)} ${r.height.toFixed(1)}`);
  $$('path', s).forEach((p, i) => { let k = 0; p.setAttribute('d', sh.d[i].replace(/-?\d*\.?\d+/g, n => (k++ % 2 ? +n*sy : +n*sx).toFixed(1))); });
}
const dio = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; setTimeout(() => e.target.classList.add('drawn'), 180); dio.unobserve(e.target); }), {rootMargin: '0px 0px -20% 0px'});
const refit = new ResizeObserver(es => es.forEach(e => { const s = $(':scope > .dd-svg', e.target); if (s) fit(s, SHAPES[e.target.dataset.doodle]); }));
$$('.dd[data-doodle]').forEach(el => {
  const sh = SHAPES[el.dataset.doodle]; if (!sh) return;
  const s = document.createElementNS(NS, 'svg'); s.setAttribute('class', 'dd-svg'); s.setAttribute('aria-hidden', 'true'); s.style.cssText = sh.box;
  sh.d.forEach((d, i) => { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); p.setAttribute('pathLength', '1'); p.style.setProperty('--d', (i*.3) + 's'); s.appendChild(p); });
  el.appendChild(s); fit(s, sh); refit.observe(el);
  if (reduce) el.classList.add('drawn'); else dio.observe(el);
});

/* ---------- the postcard ---------- */
const nl = $('#nl');
if (nl) nl.addEventListener('submit', e => { e.preventDefault(); const v = $('#nl-email').value.trim();
  $('#nl-msg').textContent = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? 'Thanks. Sign-up isn’t connected yet, so your email hasn’t been saved.' : 'That email looks off. Check it and try again.'; });
const book = $('#book');
if (book) book.addEventListener('click', () => { $('#book-msg').textContent = 'The booking link is coming soon. Until then, email me at mshehrozsajjad@gmail.com.'; });
const copy = $('#copy');
if (copy) copy.addEventListener('click', async () => {
  const h = $('#copy-hint');
  try { await navigator.clipboard.writeText('mshehrozsajjad@gmail.com'); h.textContent = 'copied!'; } catch (_) { h.textContent = 'select it'; }
  setTimeout(() => h.textContent = 'tap to copy', 1800);
});

/* ---------- the AI twin (home only) ---------- */
const scrim = $('#scrim'); let lastFocus = null;
function openD(id){ const d = $('#' + id); if (!d) return; if (!reduce){ const v = $('#twinVideo'); v && v.play().catch(() => {}); } lastFocus = document.activeElement; d.classList.add('open'); d.setAttribute('aria-hidden', 'false'); scrim.classList.add('open'); main.inert = true; document.body.style.overflow = 'hidden'; setTimeout(() => ($('#askInput') || $('.x', d)).focus(), 60); }
function closeD(restore){ $$('.drawer.open').forEach(d => { d.classList.remove('open'); d.setAttribute('aria-hidden', 'true'); }); if (scrim) scrim.classList.remove('open'); main.inert = false; document.body.style.overflow = ''; if (restore && lastFocus && lastFocus.focus) lastFocus.focus(); }
document.addEventListener('click', e => { const t = e.target.closest('button, a'); if (!t) return; if (t.dataset.open){ openD(t.dataset.open); } else if (t.hasAttribute('data-close')) closeD(true); });
if (scrim) scrim.addEventListener('click', () => closeD(true));
addEventListener('keydown', e => { if (e.key === 'Escape' && $('.drawer.open')) closeD(true); });
const A = {
  now: {t: "I'm a founding engineer at Beyond Presence. I own the creator and call platforms behind our real-time avatars and Managed Agents, frontend and backend (the real-time models and their scaling are my teammates'). I sit in customer meetings and ship what customers need on tight deadlines, like the integration that puts an avatar in a Zoom or Teams call.", go: ['The engineering side', '/code']},
  make: {t: "Yolk, my own AI device with an e-paper screen and a dial, which makes my German phone calls. And TARS, a 3D-printed desk robot running my avatar locally.", go: ['The hardware', '/hardware']},
  saas: {t: "myClosr, Slaptastic, Vorsprech and NPC Filter are live. RoomRush got 50 signups in its first 10 minutes, but the unit economics didn't hold, so I stopped it.", go: ['The AI products', '/ai']},
  design: {t: "Design is where I started: Photoshop in my first semester, then every brand, interface and launch film for my own products.", go: ['The design side', '/design']},
  oss: {t: "reels-in-code, the LiveKit JS plugin for Beyond Presence avatars, a verified n8n node and free n8n workflows.", go: ['The engineering side', '/code#open-source']},
  hire: {t: "Book a call or email me at mshehrozsajjad@gmail.com. Tell me what you're building and where it's stuck.", go: ['Book a call', '#contact']},
  none: {t: "I don't know that one, and I only answer from what I've confirmed. Email me at mshehrozsajjad@gmail.com.", go: null}
};
const route = q => { const s = q.toLowerCase();
  if (/(open source|open-source|github|plugin|reels|n8n)/.test(s)) return 'oss';
  if (/(yolk|tars|robot|hardware|device|hold|physical)/.test(s)) return 'make';
  if (/(design|brand|ui|ux|film|photo|figma)/.test(s)) return 'design';
  if (/(vorsprech|closr|roomrush|slaptastic|npc|saas|ai product|live|customer)/.test(s)) return 'saas';
  if (/(now|current|beyond|working on|today|avatar|platform|engineer|code)/.test(s)) return 'now';
  if (/(hire|work together|collab|email|contact|job|call|book)/.test(s)) return 'hire';
  return 'none'; };
const log = $('#log');
function answer(q, key){
  const a = A[key], p1 = document.createElement('p'), box = document.createElement('div'), p2 = document.createElement('p');
  p1.className = 'me'; p1.textContent = q; box.className = 'ai'; p2.textContent = a.t; box.appendChild(p2);
  if (a.go){ const l = document.createElement('a'); l.className = 'act'; l.href = a.go[1]; l.textContent = a.go[0] + ' '; l.addEventListener('click', () => closeD(false)); box.appendChild(l); }
  log.append(p1, box); log.scrollTop = 1e6;
}
if (log){
  $$('.q').forEach(b => b.addEventListener('click', () => answer(b.textContent, b.dataset.q)));
  $('#askForm').addEventListener('submit', e => { e.preventDefault(); const i = $('#askInput'), v = i.value.trim(); if (!v) return; answer(v, route(v)); i.value = ''; });
  const snd = (btn, vid) => btn && btn.addEventListener('click', () => { const v = $(vid), on = v.muted; v.muted = !on; if (on){ v.currentTime = 0; v.play().catch(() => {}); } btn.setAttribute('aria-pressed', String(on)); if (btn.id === 'twinSound') btn.textContent = on ? 'Sound off' : 'Sound on'; else btn.setAttribute('aria-label', on ? 'Turn sound off' : 'Turn sound on'); });
  snd($('#twinSound'), '#twinVideo'); snd($('#heroSound'), '#heroTwin');
}

/* ---------- theme ---------- */
try { const t = localStorage.getItem('site-theme'); if (['light', 'dark'].includes(t)) root.dataset.theme = t; } catch (_) {}
const th = () => root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
const themeBtn = $('#theme');
if (themeBtn){ const label = () => themeBtn.textContent = th() === 'dark' ? 'Light' : 'Dark';
  themeBtn.addEventListener('click', () => { root.dataset.theme = th() === 'dark' ? 'light' : 'dark'; try { localStorage.setItem('site-theme', th()); } catch (_) {} label(); }); label(); }

build();
})();
