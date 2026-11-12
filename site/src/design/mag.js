// The design page's moves, shared by the paper (/design) and its brand features (/design/<brand>): headlines fitted to
// the width of the sheet, the paper spinning in, the strip that drags, and posters that lean toward the pointer like
// paper picked up.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;

// a line marked data-fit runs the full width of its box whatever the font metrics: measured once the fonts are in.
// Only while it is set on one line; where the stylesheet lets it wrap (phones), the stylesheet's size stands.
const fits = [...document.querySelectorAll('[data-fit]')];
function fit(el){
  el.style.fontSize = '';
  const cs = getComputedStyle(el);
  if (cs.whiteSpace !== 'nowrap') return;
  const box = el.parentElement, bs = getComputedStyle(box);
  const room = box.clientWidth - parseFloat(bs.paddingLeft) - parseFloat(bs.paddingRight) - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const probe = document.createRange(); probe.selectNodeContents(el);
  const width = probe.getBoundingClientRect().width;
  if (width > 0) el.style.fontSize = (parseFloat(cs.fontSize)*room/width*.995) + 'px';
}
let thrown = false;   // while the sheet is in the air its measurements are those of a spinning, shrunken page
const fitAll = () => { if (!thrown) fits.forEach(fit); };
const fontsIn = (document.fonts?.ready || Promise.resolve()).then(fitAll);
if (fits.length) new ResizeObserver(fitAll).observe(document.body);

// the entrance: the front page spins up out of the dark and lands, the way a film shows a headline. The head script
// put .spin on <html> before the first paint (design/index.html); here the sheet is thrown, and everything else
// appears once it has landed. A click or a key lands it at once.
const cover = document.querySelector('.np-cover');
if (cover && root.classList.contains('spin')){
  const land = () => { root.classList.remove('spin'); thrown = false; fitAll(); cover.style.removeProperty('--lift'); removeEventListener('keydown', skip); removeEventListener('pointerdown', skip);
    document.querySelector('.top')?.animate({opacity: [0, 1], translate: ['0 -12px', '0 0']}, {duration: 600, easing: 'ease-out'}); };
  let throwIt = null;
  function skip(){ throwIt ? throwIt.finish() : land(); }
  if (scrollY > 10) land();   // a reload half-way down the page: the front page is not on screen
  else {
    addEventListener('keydown', skip); addEventListener('pointerdown', skip);
    const turned = root.classList.contains('turned') ? 620 : 0;   // let the sheet from the last page clear first (shell.css)
    Promise.all([Promise.race([fontsIn, new Promise(r => setTimeout(r, 1000))]), new Promise(r => setTimeout(r, turned))]).then(() => {
      if (!root.classList.contains('spin')) return;   // skipped, or the safety net got there first
      const top = cover.getBoundingClientRect().top;
      cover.style.setProperty('--lift', top + 'px');   // the sheet covers the header's strip too, and its stock lines up with the page's
      cover.style.transformOrigin = `50% ${innerHeight/2 - top}px`;
      thrown = true;
      throwIt = cover.animate([
        {transform: 'rotate(-1080deg) scale(.02)', opacity: 0, easing: 'cubic-bezier(.3,.6,.25,1)'},
        {opacity: 1, offset: .06},
        {transform: 'rotate(5deg) scale(1.05)', opacity: 1, offset: .82, easing: 'cubic-bezier(.3,0,.2,1)'},
        {transform: 'rotate(0deg) scale(1)', opacity: 1},
      ], {duration: 1900});
      throwIt.finished.then(land, land);
    });
  }
}

// posters lean toward the pointer
if (!reduce && matchMedia('(hover:hover) and (pointer:fine)').matches){
  document.querySelectorAll('.poster').forEach(el => {
    el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(), x = (e.clientX - r.left)/r.width - .5, y = (e.clientY - r.top)/r.height - .5;
      el.style.setProperty('--rx', (-y*8).toFixed(2) + 'deg'); el.style.setProperty('--ry', (x*10).toFixed(2) + 'deg'); });
    el.addEventListener('pointerleave', () => { el.style.removeProperty('--rx'); el.style.removeProperty('--ry'); });
  });
}

// the front page carries today's date, like any paper
document.querySelectorAll('[data-today]').forEach(el => { el.textContent = new Date().toLocaleDateString('en-GB', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'}); });

// the featured strip drags sideways with a mouse (touch and trackpads scroll it natively), with a little throw on release
document.querySelectorAll('[data-strip] .ft-track').forEach(t => {
  let down = false, moved = 0, x0 = 0, s0 = 0, v = 0, lx = 0, raf = 0;
  t.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; moved = 0; x0 = lx = e.clientX; s0 = t.scrollLeft; v = 0; cancelAnimationFrame(raf); });
  addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - x0; moved = Math.max(moved, Math.abs(dx)); if (moved > 4) t.classList.add('drag'); t.scrollLeft = s0 - dx; v = e.clientX - lx; lx = e.clientX; });
  addEventListener('pointerup', () => {
    if (!down) return; down = false;
    setTimeout(() => t.classList.remove('drag'), 0);
    if (!reduce){ const glide = () => { v *= .94; t.scrollLeft -= v; if (Math.abs(v) > .4) raf = requestAnimationFrame(glide); }; raf = requestAnimationFrame(glide); }
  });
  t.addEventListener('click', e => { if (moved > 4) e.preventDefault(); }, true);
  // so nobody misses that it moves: the first time it is on screen it slides a little way along and back, once,
  // unless it has already been touched
  let touched = false;
  ['pointerdown', 'wheel', 'touchstart', 'keydown'].forEach(ev => t.addEventListener(ev, () => { touched = true; }, {passive: true, once: true}));
  if (!reduce) new IntersectionObserver((es, io) => {
    if (!es[0].isIntersecting) return;
    io.disconnect();
    const far = Math.min(180, t.scrollWidth - t.clientWidth), LONG = 1600;
    let t0 = 0;
    const nudge = now => {
      if (touched) return;
      if (root.classList.contains('spin')) return requestAnimationFrame(nudge);   // not while the paper is still in the air
      t0 ||= now + 500;
      const k = Math.max(0, Math.min(1, (now - t0)/LONG));
      t.scrollLeft = far*Math.sin(k*Math.PI)**2;   // out and back, eased at both ends
      if (k < 1) requestAnimationFrame(nudge);
    };
    requestAnimationFrame(nudge);
  }, {threshold: .6}).observe(t);
  t.addEventListener('keydown', e => { const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (d){ e.preventDefault(); t.scrollBy({left: d*t.firstElementChild.offsetWidth, behavior: reduce ? 'auto' : 'smooth'}); } });
});
