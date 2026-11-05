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
