// Doodle mode, dev server only: open any page with ?doodle and draw on it with an Apple Pencil, a mouse or a finger.
// Each stroke is anchored to what it was drawn on (doodles.js) and saved through the dev server (vite.config.js)
// to public/doodles.json, which the live site plays back. Switch to Scroll to move around the page, then back to Draw.
import {UNIT, anchorAt, anchorName, drawStroke, loadDoodles, pageKey} from './doodles.js';
import './styles/doodle-editor.css';

const NS = 'http://www.w3.org/2000/svg';
const COLORS = {signal: 'Blue', ink: 'Ink', pencil: 'Pencil'};
const WIDTHS = {Fine: 3, Pen: 5, Marker: 9};   // on-screen pixels while drawing
const MIN_STEP = 1.5;                           // drop points closer than this (stroke units) to keep paths small

const ui = document.createElement('div');
ui.className = 'dz';
ui.innerHTML = `
  <svg class="dz-live"><path/></svg>
  <div class="dz-bar" role="toolbar" aria-label="Doodle tools">
    <button type="button" data-mode aria-pressed="true">Draw</button>
    ${Object.entries(COLORS).map(([c, label], i) => `<button type="button" data-color="${c}" aria-pressed="${!i}" style="--c:var(--${c})">${label}</button>`).join('')}
    ${Object.entries(WIDTHS).map(([label, w]) => `<button type="button" data-width="${w}" aria-pressed="${w === WIDTHS.Pen}">${label}</button>`).join('')}
    <button type="button" data-undo>Undo</button>
    <span class="dz-msg" role="status"></span>
  </div>`;
document.body.appendChild(ui);
document.documentElement.classList.add('doodling');

const live = ui.querySelector('.dz-live path'), msg = ui.querySelector('.dz-msg');
const tool = {color: 'signal', width: WIDTHS.Pen, drawing: true};
let all = {}, paths = [];   // every saved stroke on every page, and this page's path elements in the same order

const strokes = () => (all[pageKey()] ||= []);
const say = text => { msg.textContent = text; };

// (Re)reads the saved strokes. Also runs when he comes back to the tab, so a tab left open on the iPad can't save
// an old copy over strokes removed meanwhile.
async function start() {
  paths.forEach(p => p?.remove());
  all = await loadDoodles();
  paths = strokes().map(s => drawStroke(s));
  paths.forEach(p => p?.parentNode.classList.add('drawn'));
  say(`${strokes().length} strokes on this page`);
}

async function save() {
  say('Saving…');
  try {
    const body = JSON.stringify({page: pageKey(), strokes: strokes()});   // only this page: the server merges it in
    const res = await fetch('/__doodles', {method: 'POST', headers: {'Content-Type': 'application/json'}, body});
    say(res.ok ? `Saved · ${strokes().length} strokes` : `Not saved: ${await res.text()}`);
  } catch (_) {
    say('Not saved: is the dev server running?');
  }
}

/* ---------- the toolbar ---------- */
const press = (group, btn) => ui.querySelectorAll(`[${group}]`).forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
ui.querySelector('.dz-bar').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.hasAttribute('data-mode')) {
    tool.drawing = !tool.drawing;
    b.textContent = tool.drawing ? 'Draw' : 'Scroll';
    b.setAttribute('aria-pressed', String(tool.drawing));
    ui.classList.toggle('scrolling', !tool.drawing);
  } else if (b.dataset.color) {
    tool.color = b.dataset.color; press('data-color', b);
  } else if (b.dataset.width) {
    tool.width = +b.dataset.width; press('data-width', b);
  } else if (b.hasAttribute('data-undo') && strokes().length) {
    strokes().pop();
    paths.pop()?.remove();
    save();
  }
});

/* ---------- drawing ---------- */
let pts = null, anchor = null;
const at = e => {   // the pen's in-between samples make smoother lines; some events come with none
  const all = e.getCoalescedEvents?.();
  return (all?.length ? all : [e]).map(c => [c.clientX, c.clientY]);
};
const drawLive = () => live.setAttribute('d', pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(''));

ui.addEventListener('pointerdown', e => {
  if (!tool.drawing || e.target.closest('.dz-bar')) return;
  try { ui.setPointerCapture(e.pointerId); } catch (_) { /* the stroke still works without capture */ }
  anchor = anchorAt(e.clientX, e.clientY, ui);
  pts = at(e);
  Object.assign(live.style, {stroke: `var(--${tool.color})`, strokeWidth: tool.width});
  drawLive();
});
ui.addEventListener('pointermove', e => { if (pts) { pts.push(...at(e)); drawLive(); } });
ui.addEventListener('pointerup', finish);
ui.addEventListener('pointercancel', () => { pts = null; live.removeAttribute('d'); });

function finish() {
  if (!pts) return;
  const r = anchor.getBoundingClientRect(), k = UNIT / r.width;
  const stroke = {a: anchorName(anchor), d: pathData(pts.map(([x, y]) => [(x - r.left) * k, (y - r.top) * k])), w: +(tool.width * k).toFixed(2), c: tool.color};
  pts = null;
  live.removeAttribute('d');
  strokes().push(stroke);
  const p = drawStroke(stroke);
  paths.push(p);
  p?.parentNode.classList.add('drawn');
  save();
}

/** A smooth path through the points: thinned, then curves through the midpoints so the line doesn't look digitised. */
function pathData(raw) {
  const q = [raw[0]];
  for (const p of raw.slice(1)) if (Math.hypot(p[0] - q.at(-1)[0], p[1] - q.at(-1)[1]) >= MIN_STEP) q.push(p);
  const f = ([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`;
  if (q.length < 3) return q.length === 1 ? `M${f(q[0])}L${f([q[0][0] + .1, q[0][1]])}` : `M${f(q[0])}L${f(q[1])}`;
  let d = `M${f(q[0])}`;
  for (let i = 1; i < q.length - 1; i++) d += `Q${f(q[i])} ${f([(q[i][0] + q[i + 1][0]) / 2, (q[i][1] + q[i + 1][1]) / 2])}`;
  return `${d}L${f(q.at(-1))}`;
}

start();
document.addEventListener('visibilitychange', () => { if (!document.hidden && !pts) start(); });
