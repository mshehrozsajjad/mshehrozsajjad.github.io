// The hardware page's exploded drawing. While the stage is pinned, scrolling pulls Yolk's layers apart along the depth axis
// and names each part as it separates. The pointer tilts the drawing a little; reduced motion shows it already apart.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const xp = document.getElementById('xp'), scene = document.getElementById('xpScene');
if (xp && scene){
  const calls = [...xp.querySelectorAll('.xp-calls li')];
  const n = calls.length, cl = v => Math.max(0, Math.min(1, v)), ease = t => t < .5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2)/2;
  let e = reduce ? 1 : 0, target = e, tx = 0, ty = 0, raf = 0;
  const pinned = () => !reduce && innerWidth > 760;
  function read(){
    if (!pinned()){ target = 1; return; }
    const r = xp.getBoundingClientRect(), span = r.height - innerHeight;
    target = ease(cl(-r.top/(span*.7)));
  }
  function draw(){
    raf = 0;
    e += (target - e)*(reduce ? 1 : .14);
    scene.style.setProperty('--e', e.toFixed(4));
    scene.style.setProperty('--tx', tx.toFixed(3)); scene.style.setProperty('--ty', ty.toFixed(3));
    // the front comes off first: its callout lights first
    calls.forEach((c, i) => c.classList.toggle('on', e > .08 + (i/(n - 1))*.8));
    xp.classList.toggle('apart', e > .9);
    if (Math.abs(target - e) > .001) raf = requestAnimationFrame(draw);
  }
  const kick = () => { read(); if (!raf) raf = requestAnimationFrame(draw); };
  addEventListener('scroll', kick, {passive: true}); addEventListener('resize', kick);
  if (!reduce) scene.addEventListener('pointermove', ev => { const r = scene.getBoundingClientRect(); tx = (ev.clientX - r.left)/r.width - .5; ty = (ev.clientY - r.top)/r.height - .5; kick(); });
  scene.addEventListener('pointerleave', () => { tx = ty = 0; kick(); });
  kick();
}
