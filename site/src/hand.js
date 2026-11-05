// A pen never draws a perfectly straight run. This pass takes a finished path and lets every stretch between
// two anchors (waypoints, knots, joins) drift sideways in one gentle bow, a little more on long stretches,
// with a slow ripple on very long ones. The drift is sin²-shaped, so it is zero at each anchor and so is its slope:
// joins, knots and the directions the line meets them stay exactly where the layout put them.
import {smooth} from './spline.js';

const NS = 'http://www.w3.org/2000/svg';
let probe;
const path = d => {
  if (!probe){ const s = document.createElementNS(NS, 'svg'); s.setAttribute('aria-hidden', 'true'); s.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden'; probe = document.createElementNS(NS, 'path'); s.appendChild(probe); document.body.appendChild(s); }
  probe.setAttribute('d', d); return probe;
};
const noise = (seed, k) => { const s = Math.sin(seed*127.1 + k*311.7)*43758.5453; return (s - Math.floor(s))*2 - 1; };

// d: the path. anchors: points the line must still pass through untouched (in order along the path).
// k: bow as a share of the stretch's length, capped at max px. side(p, n): which way a stretch may bow
// (+1 along the normal n, -1 against it, 0 to let the seed decide), so a gutter run can bow away from the text.
export function handDrawn(d, {anchors = [], seed = 1, k = .03, max = 16, side = () => 0, step = 6} = {}){
  const p = path(d), L = p.getTotalLength();
  if (!L || L < 80) return d;
  const S = []; for (let s = 0; s <= L; s += step) S.push(p.getPointAtLength(s)); S.push(p.getPointAtLength(L));
  const at = i => i*step > L ? L : i*step;
  // where each anchor sits along the path: the nearest sample, searching forward so a loop's crossing is not mistaken for it
  const stops = [0]; let from = 0;
  for (const a of anchors){
    let best = -1, bd = 1e9;
    for (let i = from; i < S.length; i++){ const dd = (S[i].x - a.x)**2 + (S[i].y - a.y)**2; if (dd < bd){ bd = dd; best = i; } if (bd < 4 && dd > 400) break; }
    if (best > 0 && bd < 36 && at(best) - stops[stops.length - 1] > 40){ stops.push(at(best)); from = best; }
  }
  if (L - stops[stops.length - 1] > 40) stops.push(L); else stops[stops.length - 1] = L;
  const pt = s => { const i = Math.min(S.length - 1, Math.round(s/step)); return S[i]; };
  const normal = s => { const a = pt(Math.max(0, s - step*2)), b = pt(Math.min(L, s + step*2)), dx = b.x - a.x, dy = b.y - a.y, m = Math.hypot(dx, dy) || 1; return {x: -dy/m, y: dx/m}; };
  const out = [{x: S[0].x, y: S[0].y, vert: anchors[0] && anchors[0].vert}];
  let last = noise(seed, 0) < 0 ? -1 : 1;
  for (let j = 0; j < stops.length - 1; j++){
    const a = stops[j], b = stops[j + 1], len = b - a;
    const mid = pt((a + b)/2), n = normal((a + b)/2), p0 = pt(a), p1 = pt(b);
    // only a stretch that is nearly straight gets the hand's drift; a curve already drawn as one (a loop, a swing) keeps its shape
    const straightish = Math.hypot(p1.x - p0.x, p1.y - p0.y)/len > .985 && len >= 140;
    // neighbouring stretches keep bowing the same way, so the drift reads as one stroke, not a wiggle
    const want = side(mid, n), sign = want || last; last = sign;
    const A = straightish ? sign*Math.min(max, len*k) : 0, ripples = Math.max(1, Math.round(len/480)), ph = noise(seed, j + 40)*Math.PI;
    for (let s = a + 18; s < b - 1; s += 18){
      const u = (s - a)/len, w = A*Math.sin(Math.PI*u)**2*(1 + (ripples > 1 ? .3*Math.sin(2*Math.PI*u*ripples + ph) : 0));
      const q = pt(s), nn = normal(s);
      out.push({x: q.x + nn.x*w, y: q.y + nn.y*w});
    }
    const e = pt(b); out.push({x: e.x, y: e.y});
  }
  return smooth(out);
}
