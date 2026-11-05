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
