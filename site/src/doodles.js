// Shehroz's own pen strokes. He draws them on the live page in doodle mode (doodle-editor.js, dev only), they are
// saved to /doodles.json, and here each one draws itself in, like his pen, the first time it comes into view.
// A stroke belongs to an anchor (a photo, a section, or the page) and is stored in units of that anchor's width,
// with its top-left corner as the origin, so it stays on the same spot of him or the text on any screen size.
const NS = 'http://www.w3.org/2000/svg';
export const UNIT = 1000;   // the anchor's width, in stroke units
const ANCHORS = '[data-anchor]';
const BLOCKS = 'section[aria-labelledby], footer[aria-labelledby]';

export const pageKey = () => location.pathname.replace(/\/(index\.html)?$/, '') || '/';

/** What a stroke starting at (x, y) belongs to: the smallest marked element under it (photos ignore pointer events,
 *  so this tests boxes, not hits), else the section under it, else the whole page. */
export function anchorAt(x, y, skip) {
  const inside = [...document.querySelectorAll(ANCHORS)].filter(el => {
    const r = el.getBoundingClientRect();
    return r.width && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  });
  if (inside.length) return inside.sort((a, b) => area(a) - area(b))[0];
  const hit = document.elementsFromPoint(x, y).find(el => !skip.contains(el));
  return hit?.closest(BLOCKS) || document.body;
}
const area = el => { const r = el.getBoundingClientRect(); return r.width * r.height; };

export const anchorName = el => el === document.body ? 'page' : el.dataset.anchor || `#${el.getAttribute('aria-labelledby')}`;
export function findAnchor(name) {
  if (name === 'page') return document.body;
  return name.startsWith('#')
    ? document.querySelector(`[aria-labelledby="${CSS.escape(name.slice(1))}"]`)
    : document.querySelector(`[data-anchor="${CSS.escape(name)}"]`);
}

/** The anchor's drawing layer: inside it, or for an image (which can't hold children) laid over it in its parent. */
function layer(anchor) {
  if (anchor._doodles) return anchor._doodles;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'doodles');
  svg.setAttribute('aria-hidden', 'true');
  const holds = !/^(IMG|VIDEO|CANVAS)$/.test(anchor.tagName);
  const host = holds ? anchor : anchor.offsetParent || document.body;
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
  host.appendChild(svg);
  const fit = () => {
    const w = anchor.offsetWidth || 1, h = anchor.offsetHeight;
    svg.setAttribute('viewBox', `0 0 ${UNIT} ${(UNIT * h / w).toFixed(1)}`);
    Object.assign(svg.style, holds
      ? {left: '0', top: '0', width: '100%', height: '100%'}
      : {left: `${anchor.offsetLeft}px`, top: `${anchor.offsetTop}px`, width: `${w}px`, height: `${h}px`});
  };
  fit();
  new ResizeObserver(fit).observe(anchor);
  anchor._doodles = svg;
  return svg;
}

/** Adds one stroke to its anchor's layer and returns the path, or null if the anchor isn't on this page any more. */
export function drawStroke(stroke, order = 0) {
  const anchor = findAnchor(stroke.a);
  if (!anchor) return null;
  const p = document.createElementNS(NS, 'path');
  p.setAttribute('d', stroke.d);
  p.setAttribute('stroke-width', stroke.w);
  p.setAttribute('pathLength', '1');
  p.style.stroke = `var(--${stroke.c})`;
  p.style.setProperty('--d', `${order * .12}s`);
  layer(anchor).appendChild(p);
  return p;
}

export async function loadDoodles() {
  try {
    const res = await fetch('/doodles.json', {cache: 'no-cache'});
    return res.ok ? await res.json() : {};
  } catch (_) {
    return {};
  }
}

/** The live site: draw this page's strokes, each anchor's set drawing in when it scrolls into view. */
export async function playDoodles() {
  const strokes = (await loadDoodles())[pageKey()] || [];
  const count = {};   // strokes draw one after another within their anchor, in the order he drew them
  const layers = new Set(strokes.map(s => drawStroke(s, count[s.a] = (count[s.a] ?? -1) + 1)?.parentNode).filter(Boolean));
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return layers.forEach(l => l.classList.add('drawn'));
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('drawn');
    io.unobserve(e.target);
  }), {rootMargin: '0px 0px -15% 0px'});
  layers.forEach(l => io.observe(l));
}
