// The engineering page's terminal. It introduces itself by typing two commands, then hands the prompt to the visitor.
// Commands answer from the same confirmed facts as the page, and `open` walks to the matching section.
// Output is only ever set with textContent.
import {mountFalling} from './falling.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const term = document.getElementById('term'), out = document.getElementById('termOut'), form = document.getElementById('termForm'), input = document.getElementById('termIn');
const who = (() => { try { return JSON.parse(sessionStorage.getItem('who') || '{}').name || ''; } catch (_) { return ''; } })();

const SECTIONS = {'shipped': '#shipped', 'beyond-presence': '#work', 'npc-filter': '#shipped', 'open-source': '#open-source', 'before': '#before', 'contact': '#contact'};
const go = sel => { const el = document.querySelector(sel); if (el) el.scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block: 'start'}); };
const CMD = {
  help: () => ['whoami         who this is', 'ls             what is on this page', 'open <name>    go to it (try: open shipped)', 'now            what I do right now', 'stats          the platform, in public numbers', 'contact        how to reach me', 'clear          start over'],
  whoami: () => ['Shehroz Sajjad. Founding engineer, Munich.', 'I sit with the customer, own the platform, and ship what they need, fast.'],
  ls: () => ['shipped/           a night, a few days, a month', 'beyond-presence/   the platform I own', 'open-source/       given away', 'before/            CTO, Keyhole, cureVision, a car company', 'contact'],
  now: () => ['Beyond Presence, founding engineer. I own the creator and call platforms,', 'frontend and backend. Plus customer meetings and fast turnarounds.'],
  stats: () => ['200,000+   avatar sessions served', '1,000+     running at the same time', '15,000+    startups, scaleups and enterprise teams', '(public figures, beyondpresence.ai)'],
  contact: () => ['hello@shehrozsajjad.com', 'or: open contact'],
  sudo: () => ['Nice try. Book a call instead: open contact'],
};
function print(lines, cls = ''){ (Array.isArray(lines) ? lines : [lines]).forEach(t => { const p = document.createElement('p'); if (cls) p.className = cls; p.textContent = t; out.appendChild(p); }); out.scrollTop = out.scrollHeight; }
function echo(cmd){ const p = document.createElement('p'); p.className = 'cmd'; const s = document.createElement('span'); s.textContent = '$ '; p.append(s, cmd); out.appendChild(p); }
function run(raw){
  const line = raw.trim(); if (!line) return;
  echo(line);
  const [c, ...rest] = line.toLowerCase().split(/\s+/), arg = rest.join('-').replace(/\/$/, '');
  if (c === 'clear'){ out.textContent = ''; return; }
  if (c === 'open' || c === 'cd'){
    if (SECTIONS[arg]){ print(`opening ${arg}…`, 'dim'); setTimeout(() => go(SECTIONS[arg]), reduce ? 0 : 250); }
    else print(`no such thing: ${arg || '(nothing)'}. try: ls`, 'err');
    return;
  }
  if (CMD[c]) print(CMD[c]()); else print(`command not found: ${c}. try: help`, 'err');
}
form.addEventListener('submit', e => { e.preventDefault(); const v = input.value; input.value = ''; run(v); });
term.addEventListener('click', e => { if (!e.target.closest('a,button')) input.focus({preventScroll: true}); });
document.querySelectorAll('[data-cmd]').forEach(b => b.addEventListener('click', () => { run(b.dataset.cmd); input.focus({preventScroll: true}); }));

// the self-introduction: two commands typed by hand, then the prompt is the visitor's
const intro = [['whoami'], ['ls']];
async function type(cmd){
  if (reduce){ run(cmd); return; }
  for (let i = 1; i <= cmd.length; i++){ input.value = cmd.slice(0, i); await new Promise(r => setTimeout(r, 70 + Math.random()*60)); }
  await new Promise(r => setTimeout(r, 220)); input.value = ''; run(cmd);
  await new Promise(r => setTimeout(r, 500));
}
(async () => {
  print(`hi ${who || 'stranger'}. this terminal works: type help.`, 'dim');
  for (const [c] of intro) await type(c);
})();

// each section's command types itself as the section arrives
document.querySelectorAll('[data-type]').forEach(el => {
  if (reduce) return;
  const text = el.textContent; el.textContent = ''; el.classList.add('typing');
  new IntersectionObserver(([e], io) => { if (!e.isIntersecting) return; io.disconnect();
    let i = 0; const tick = () => { el.textContent = text.slice(0, ++i); if (i < text.length) setTimeout(tick, 28 + Math.random() * 40); else el.classList.remove('typing'); };
    setTimeout(tick, 250); }, {threshold: 1}).observe(el.parentElement);
});

// the platform, full screen: the stage is pinned for a run of scrolling, and how far through the run you are picks the
// demo and its caption. It grows from a framed window to the whole screen as it arrives. A tab jumps to its demo.
const platRun = document.querySelector('.plat-run');
if (platRun){
  const stage = platRun.firstElementChild, panes = [...stage.querySelectorAll('.st-pane')], caps = [...stage.querySelectorAll('.st-cap')], tabs = [...stage.querySelectorAll('.st-tab')];
  const glows = [...stage.querySelectorAll('.st-glow i')];
  let shown = 0, queued = false;
  const show = i => { shown = i; [panes, caps, tabs, glows].forEach(set => set.forEach((el, j) => el.classList.toggle('on', j === i)));
    panes.forEach((p, j) => { const v = p.querySelector('video'); if (j === i && !reduce) v.play().catch(() => {}); else v.pause(); }); };
  const room = () => platRun.offsetHeight - stage.offsetHeight;
  const place = () => { queued = false;
    const r = platRun.getBoundingClientRect(), k = (stage.getBoundingClientRect().top - r.top) / Math.max(1, room());
    stage.style.setProperty('--z', Math.max(0, Math.min(1, 1 - r.top / innerHeight)).toFixed(3));   // 0 as it enters from below, 1 once it fills the screen
    const i = Math.max(0, Math.min(panes.length - 1, Math.floor(k * panes.length))); if (i !== shown) show(i); };
  addEventListener('scroll', () => { if (!queued){ queued = true; requestAnimationFrame(place); } }, {passive: true});
  addEventListener('resize', place);
  tabs.forEach((t, i) => t.addEventListener('click', () => scrollTo({top: platRun.getBoundingClientRect().top + scrollY + room() * (i + .5) / tabs.length, behavior: reduce ? 'auto' : 'smooth'})));
  place();
}

// a window's output prints line by line when you reach it, the way a command's would
if (!reduce) document.querySelectorAll('.tw .code').forEach(pre => {
  pre.innerHTML = pre.innerHTML.split('\n').map((line, i) => `<span class="ln" style="--i:${i}">${line || ' '}</span>`).join('\n');
  pre.classList.add('wait');
  new IntersectionObserver(([e], io) => { if (e.isIntersecting){ io.disconnect(); pre.classList.replace('wait', 'run'); } }, {threshold: .6}).observe(pre);
});

// his years as a chart: reaching for a row (pointer, keyboard or tap) shows that employer in the detail cell
const gantt = document.getElementById('gantt');
if (gantt){
  const rows = [...gantt.querySelectorAll('.gt-row')], details = [...gantt.querySelectorAll('.gt-d')];
  let at = 0, seen = false;
  const pick = i => { at = i; rows.forEach((r, j) => { r.classList.toggle('on', j === i); r.setAttribute('aria-pressed', j === i); }); details.forEach((d, j) => d.classList.toggle('on', j === i)); };
  // it plays through its rows by itself while on screen, so nothing is missed; the first touch takes over
  const STEP = 3400, play = reduce ? 0 : setInterval(() => { if (seen) pick((at + 1) % rows.length); }, STEP);
  if (play){ gantt.classList.add('auto'); gantt.style.setProperty('--step', STEP + 'ms'); }
  new IntersectionObserver(([e]) => { seen = e.isIntersecting; }, {threshold: .5}).observe(gantt);
  rows.forEach((r, i) => ['pointerenter', 'focus', 'click'].forEach(ev => r.addEventListener(ev, () => { clearInterval(play); gantt.classList.remove('auto'); pick(i); })));
}

// code keeps falling down the page's two margins after the hero (which has its own, falling.js): a few thin streams,
// in his blue, never under the words. Wide screens only; nothing moves under reduced motion.
if (!reduce && matchMedia('(min-width:1280px)').matches){
  const cv = Object.assign(document.createElement('canvas'), {className: 'rain'}), g = cv.getContext('2d'), CH = 17;
  cv.setAttribute('aria-hidden', 'true'); document.querySelector('.sess').prepend(cv);
  const GLYPHS = 'abcdefghijklmnopqrstuvwxyz{}[]()<>/=+*;:#$&%01';
  let W = 0, H = 0, margin = 0, streams = [], seen = false;
  const fresh = (s = {}) => { const side = Math.random() < .5, len = 5 + (Math.random() * 12 | 0);
    return Object.assign(s, {x: Math.round((side ? 0 : W - margin) + 14 + Math.random() * Math.max(1, margin - 40)), y: -len * CH - Math.random() * H, v: .5 + Math.random() * 1.1,
      text: Array.from({length: len}, () => GLYPHS[Math.random() * GLYPHS.length | 0])}); };
  const size = () => { const d = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; margin = (W - 1120) / 2;
    cv.width = W * d; cv.height = H * d; g.setTransform(d, 0, 0, d, 0, 0); streams = Array.from({length: Math.round(margin / 9)}, () => fresh()); };
  const colour = () => '#8E8CFF';   // the session's violet: it only falls over the dark zone
  const draw = () => { if (!seen) return;
    g.clearRect(0, 0, W, H); g.font = '500 11px "JetBrains Mono", monospace'; g.fillStyle = colour();
    for (const s of streams){ s.y += s.v;
      s.text.forEach((ch, i) => { g.globalAlpha = .07 + .5 * (i / s.text.length) ** 2; g.fillText(ch, s.x, s.y + i * CH); });   // brightest at the head
      if (s.y > H) fresh(s); }
    requestAnimationFrame(draw); };
  size(); addEventListener('resize', size);
  // only once the hero (and its own rain) has left the screen
  new IntersectionObserver(([e]) => { const on = !e.isIntersecting; cv.classList.toggle('on', on); if (on && !seen){ seen = true; draw(); } else seen = on; }).observe(document.querySelector('.code-hero'));
}

const codeHero = document.querySelector('.code-hero');
if (codeHero) mountFalling(codeHero, {reduce});
