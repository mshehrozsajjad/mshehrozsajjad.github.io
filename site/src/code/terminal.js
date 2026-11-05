// The engineering page's terminal. It introduces itself by typing two commands, then hands the prompt to the visitor.
// Commands answer from the same confirmed facts as the page, and `open` walks to the matching section.
// Output is only ever set with textContent.
import {mountPlatform} from './platform3d.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const term = document.getElementById('term'), out = document.getElementById('termOut'), form = document.getElementById('termForm'), input = document.getElementById('termIn');
const who = (() => { try { return JSON.parse(sessionStorage.getItem('who') || '{}').name || ''; } catch (_) { return ''; } })();

const SECTIONS = {'beyond-presence': '#work', 'npc-filter': '#npc', 'open-source': '#open-source', 'before': '#before', 'contact': '#contact'};
const go = sel => { const el = document.querySelector(sel); if (el) el.scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block: 'start'}); };
const CMD = {
  help: () => ['whoami         who this is', 'ls             what is on this page', 'open <name>    go to it (try: open npc-filter)', 'now            what I do right now', 'stats          the platform, in public numbers', 'contact        how to reach me', 'clear          start over'],
  whoami: () => ['Shehroz Sajjad. Product engineer, Munich.', 'Design → engineering → go-to-market, usually on the same product.'],
  ls: () => ['beyond-presence/   the platform I own', 'npc-filter/        built to stay cheap', 'open-source/       given away', 'before/            CTO, Keyhole, cureVision, a car company', 'contact'],
  now: () => ['Beyond Presence. I own the creator platform and the call platform:', 'the layer behind our real-time avatars and Managed Agents.'],
  stats: () => ['200,000+   avatar sessions served', '1,000+     running at the same time', '15,000+    startups, scaleups and enterprise teams', '(public figures, beyondpresence.ai)'],
  contact: () => ['mshehrozsajjad@gmail.com', 'or: open contact'],
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

const stage = document.getElementById('platform3d');
if (stage) mountPlatform(stage, {reduce});
