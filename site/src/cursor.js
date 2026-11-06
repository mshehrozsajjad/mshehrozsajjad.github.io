// Shehroz's cursor: a pen nib that leaves a short line of his blue ink behind it, and a hand he drew over anything
// you can click. Only for a mouse or trackpad (touch keeps its own); text fields keep the normal text cursor;
// with reduced motion there's no ink trail.
const CLICKABLE = 'a[href], button, [role="button"], label, summary, select, [data-open]';
const TYPING = 'input, textarea, [contenteditable="true"]';
const INK_LIFE = 380;   // ms a drop of ink stays on screen
const INK_WIDTH = 2.8;  // px, at its freshest

// both drawn so the tip (nib) and the fingertip (hand) sit where the pointer really is: see the offsets in pages.css
const NIB = `<svg class="pen-nib" width="28" height="28" viewBox="8 4 28 28"><g transform="rotate(45 10 30)">
  <path d="M10 30 L3.5 15 Q2.5 11 5.5 8 L7.5 1 H12.5 L14.5 8 Q17.5 11 16.5 15 Z"/><path class="pen-cut" d="M10 29 V17"/><circle class="pen-cut" cx="10" cy="15.5" r="1.4"/></g></svg>`;
const HAND = `<svg class="pen-hand" width="24" height="30" viewBox="1 0 23 29"><path d="M9 3.5 C9 2 12 2 12 3.5 V12 C12 10.5 15 10.5 15 12 V13
  C15 11.5 18 11.5 18 13 V14 C18 12.5 21 12.5 21 14 V19 C21 24 18 27 14 27 C10.5 27 8.5 25.5 7 23 L3.6 17.4 C2.8 16 4.6 14.6 5.8 15.8 L9 19 Z"/></svg>`;

export function mountCursor() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  const pen = document.createElement('div');
  pen.className = 'pen';
  pen.setAttribute('aria-hidden', 'true');
  pen.hidden = true;
  pen.innerHTML = NIB + HAND;
  document.body.append(pen);
  root.classList.add('pen-cursor');

  /* ---------- the ink: recent points, drawn as a line that thins and fades with age ---------- */
  let ctx = null, drops = [], frame = 0;
  if (!reduce) {
    const canvas = document.createElement('canvas');
    canvas.className = 'pen-ink';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.append(canvas);
    ctx = canvas.getContext('2d');
    const size = () => {
      const k = devicePixelRatio || 1;
      canvas.width = innerWidth * k;
      canvas.height = innerHeight * k;
      ctx.setTransform(k, 0, 0, k, 0, 0);
    };
    size();
    addEventListener('resize', size);
  }
  function draw() {
    const now = performance.now();
    drops = drops.filter(d => now - d.t < INK_LIFE);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.lineCap = 'round';
    ctx.strokeStyle = getComputedStyle(root).getPropertyValue('--signal');   // follows the theme
    for (let i = 1; i < drops.length; i++) {
      const fresh = 1 - (now - drops[i].t) / INK_LIFE;
      ctx.globalAlpha = fresh;
      ctx.lineWidth = .4 + INK_WIDTH * fresh;
      ctx.beginPath();
      ctx.moveTo(drops[i - 1].x, drops[i - 1].y);
      ctx.lineTo(drops[i].x, drops[i].y);
      ctx.stroke();
    }
    frame = drops.length ? requestAnimationFrame(draw) : 0;
  }

  /* ---------- following the pointer ---------- */
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    const t = e.target instanceof Element ? e.target : null;
    const mode = t?.closest(TYPING) ? 'text' : t?.closest(CLICKABLE) ? 'hand' : 'nib';
    pen.hidden = false;
    pen.dataset.mode = mode;
    pen.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    if (ctx && mode === 'nib') {
      const now = performance.now();
      const all = e.getCoalescedEvents?.();   // the in-between samples make a smoother line; some events have none
      (all?.length ? all : [e]).forEach(c => drops.push({x: c.clientX, y: c.clientY, t: now}));
      if (!frame) frame = requestAnimationFrame(draw);
    }
  }, {passive: true});
  document.addEventListener('mouseout', e => { if (!e.relatedTarget) pen.hidden = true; });   // left the window
  addEventListener('pointerdown', () => pen.classList.add('down'));
  addEventListener('pointerup', () => pen.classList.remove('down'));
}
