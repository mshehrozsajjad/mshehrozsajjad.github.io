// The design page's magazine moves: the brands reel turns a page at a time, and prints and posters lean toward the pointer like paper picked up.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
document.querySelectorAll('[data-reel]').forEach(reel => {
  const track = reel.querySelector('.reel-track'), pages = [...track.children], count = reel.querySelector('.reel-count');
  const at = () => Math.round(track.scrollLeft/(pages[0].offsetWidth + parseFloat(getComputedStyle(track).columnGap || 0)));
  const show = () => { count.textContent = `${String(Math.min(pages.length, at() + 1)).padStart(2, '0')} / ${String(pages.length).padStart(2, '0')}`; };
  reel.querySelectorAll('[data-dir]').forEach(b => b.addEventListener('click', () => { const i = Math.max(0, Math.min(pages.length - 1, at() + +b.dataset.dir)); track.scrollTo({left: pages[i].offsetLeft - pages[0].offsetLeft, behavior: reduce ? 'auto' : 'smooth'}); }));
  track.addEventListener('scroll', () => requestAnimationFrame(show), {passive: true});
  track.addEventListener('keydown', e => { const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (d){ e.preventDefault(); reel.querySelector(`[data-dir="${d}"]`).click(); } });
  show();
});
if (!reduce && matchMedia('(hover:hover) and (pointer:fine)').matches){
  document.querySelectorAll('.poster,.page,.sp-fig,.case-media').forEach(el => {
    el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(), x = (e.clientX - r.left)/r.width - .5, y = (e.clientY - r.top)/r.height - .5;
      el.style.setProperty('--rx', (-y*8).toFixed(2) + 'deg'); el.style.setProperty('--ry', (x*10).toFixed(2) + 'deg'); el.classList.add('tilt'); });
    el.addEventListener('pointerleave', () => { el.style.removeProperty('--rx'); el.style.removeProperty('--ry'); el.classList.remove('tilt'); });
  });
}

// long pages scroll themselves while on screen, slowly, and wait at the bottom before going back up.
// Hover, touch, focus or a wheel hands the page to the visitor until they leave it.
document.querySelectorAll('[data-ss] .ss-view').forEach(v => {
  if (reduce) return;
  let on = false, hold = false, pause = 0, raf = 0, y = 0;
  const step = () => {
    raf = 0; if (!on || hold) return;
    const max = v.scrollHeight - v.clientHeight;
    if (pause > 0) pause--;
    else if (v.scrollTop >= max - 1){ pause = 120; y = 0; setTimeout(() => { if (!hold) v.scrollTo({top: 0, behavior: 'smooth'}); }, 1500); }
    else { y = Math.max(y, v.scrollTop) + .7; v.scrollTop = y; }
    raf = requestAnimationFrame(step);
  };
  const go = () => { if (!raf) raf = requestAnimationFrame(step); };
  const stop = () => { hold = true; }, resume = () => { hold = false; y = v.scrollTop; go(); };
  ['pointerenter', 'touchstart', 'focus', 'wheel'].forEach(ev => v.addEventListener(ev, stop, {passive: true}));
  ['pointerleave', 'blur'].forEach(ev => v.addEventListener(ev, resume));
  new IntersectionObserver(es => { on = es[0].isIntersecting; if (on) go(); }, {threshold: .4}).observe(v);
});

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
  t.addEventListener('keydown', e => { const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (d){ e.preventDefault(); t.scrollBy({left: d*t.firstElementChild.offsetWidth, behavior: reduce ? 'auto' : 'smooth'}); } });
});

// the masthead runs the full width of the page whatever the font metrics: measure it once the fonts are in, and size it to fit
const mast = document.querySelector('.np-mast');
if (mast){
  const fit = () => { mast.style.fontSize = ''; const cs = getComputedStyle(mast.parentElement), w = mast.parentElement.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight); mast.style.minWidth = '0'; const s = mast.scrollWidth; mast.style.minWidth = ''; if (s > 0) mast.style.fontSize = (parseFloat(getComputedStyle(mast).fontSize)*w/s*.995) + 'px'; };
  (document.fonts?.ready || Promise.resolve()).then(fit);
  new ResizeObserver(fit).observe(mast.parentElement);
}
