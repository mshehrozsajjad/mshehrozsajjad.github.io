// First-visit loader. The inline head script decides whether to show it (adds .booting) and
// creates window.loaderDone; here we draw the line as real assets arrive, then lift the loader away.
const root = document.documentElement;
const loader = document.getElementById('loader');
const done = () => window.__loaderResolve && window.__loaderResolve();

if (!root.classList.contains('booting') || !loader) done();
else {
  const MIN = 900, MAX = 4000, t0 = performance.now();
  const line = loader.querySelector('.loader-line path');
  // what the first screen needs: fonts, the hero's images and the twin's poster
  const imgs = [...document.querySelectorAll('.hero img, .hero video[poster]')].map(el => {
    const src = el.tagName === 'VIDEO' ? el.poster : el.currentSrc || el.src;
    return new Promise(res => { const i = new Image(); i.onload = i.onerror = res; i.src = src; });
  });
  const tasks = [document.fonts ? document.fonts.ready : Promise.resolve(), ...imgs,
    new Promise(res => document.readyState === 'complete' ? res() : addEventListener('load', res, {once: true}))];
  let settled = 0;
  const draw = p => line.style.setProperty('--p', (1 - p).toFixed(3));
  tasks.forEach(t => t.then(() => draw(++settled / tasks.length * .9)));

  const finish = () => {
    if (root.classList.contains('booted')) return;
    draw(1);
    setTimeout(() => {
      root.classList.add('booted');
      done();
      try { sessionStorage.setItem('loaded', '1'); } catch (_) {}
      setTimeout(() => { root.classList.remove('booting', 'booted'); loader.remove(); }, 650);
    }, 350);
  };
  Promise.all(tasks).then(() => setTimeout(finish, Math.max(0, MIN - (performance.now() - t0))));
  setTimeout(finish, MAX); // never hold anyone longer than this
}
