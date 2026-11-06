// The header and the menu (menu.css).
//   The header slides away as you read down and comes back as soon as you scroll up; off the top it gets a paper
//   backing so it reads over the page.
//   The burger opens the menu: an ink circle grows out of the burger until it covers the screen, then the lines rise
//   in. Pointing at (or tabbing to) a line puts that side's card beside the list. Esc, the ×, or picking a line closes
//   it, the circle shrinking back into the burger. While it's open, Tab stays inside it and the page doesn't scroll.
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function mountMenu() {
  const top = $('#top'), btn = $('#burger'), menu = $('#menu');
  if (!top || !btn || !menu) return;
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const card = $('.menu-card', menu), img = $('img', card), say = $('figcaption', card);
  const links = $$('.menu-list a', menu);
  const sprite = name => reduce ? `/assets/sprites/shehroz-${name}.webp` : `/assets/sprites/v2/shehroz-${name}-anim.webp`;
  let open = false;

  links.forEach((a, i) => a.parentElement.style.setProperty('--i', i));

  /* ---------- the card follows the line you point at ---------- */
  let shown = null;
  function show(a) {
    if (a === shown) return;
    shown = a;
    card.style.setProperty('--cbg', a.dataset.bg);
    card.style.setProperty('--cfg', a.dataset.fg);
    img.src = sprite(a.dataset.spr);
    say.textContent = a.dataset.say;
    card.classList.remove('swap'); void card.offsetWidth; card.classList.add('swap');
  }
  links.forEach(a => ['pointerenter', 'focus'].forEach(ev => a.addEventListener(ev, () => show(a))));
  const here = links.find(a => a.getAttribute('aria-current') === 'page') || links[0];

  /* ---------- open and close: the circle grows out of the burger and back into it ---------- */
  function setOrigin() {
    const r = btn.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    menu.style.setProperty('--mx', `${x}px`);
    menu.style.setProperty('--my', `${y}px`);
    menu.style.setProperty('--mr', `${Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 20}px`);
  }
  function openMenu() {
    if (open) return;
    open = true;
    links.forEach(a => { new Image().src = sprite(a.dataset.spr); });   // so the card never waits on a sprite
    shown = null; show(here);
    top.classList.remove('away');
    setOrigin();
    menu.hidden = false;
    void menu.offsetWidth;   // start from the closed circle
    menu.classList.add('on');
    root.classList.add('menu-on');
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', 'Close the menu');
    setTimeout(() => open && here.focus({preventScroll: true}), reduce ? 0 : 450);
  }
  function closeMenu(focusBurger = true) {
    if (!open) return;
    open = false;
    setOrigin();
    menu.classList.remove('on');
    root.classList.remove('menu-on');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Menu');
    if (focusBurger) btn.focus({preventScroll: true});
    if (reduce) menu.hidden = true;
  }
  menu.addEventListener('transitionend', e => { if (e.target === menu && e.propertyName === 'clip-path' && !open) menu.hidden = true; });
  btn.addEventListener('click', () => open ? closeMenu() : openMenu());

  // picking a line: another page loads as usual; home (we're on it) just closes and goes back to the top
  links.forEach(a => a.addEventListener('click', e => {
    if (a.getAttribute('aria-current') === 'page') { e.preventDefault(); closeMenu(false); scrollTo({top: 0, behavior: reduce ? 'auto' : 'smooth'}); }
    else closeMenu(false);
  }));
  // the twin's drawer opens over the page (pages.js listens for data-open), so the menu gets out of its way
  $('.menu-twin', menu)?.addEventListener('click', () => closeMenu(false));

  // Esc closes; Tab and Shift+Tab go round the burger and the menu, never out to the page behind
  document.addEventListener('keydown', e => {
    if (!open) return;
    if (e.key === 'Escape') { e.preventDefault(); closeMenu(); return; }
    if (e.key !== 'Tab') return;
    const stops = [btn, ...$$('a[href], button', menu)].filter(el => el.offsetParent !== null);
    const i = stops.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); stops[stops.length - 1].focus(); }
    else if (!e.shiftKey && i === stops.length - 1) { e.preventDefault(); stops[0].focus(); }
    else if (i < 0) { e.preventDefault(); stops[0].focus(); }
  });
  addEventListener('resize', () => open && setOrigin());

  /* ---------- the header: away while you read down, back as soon as you scroll up ---------- */
  let lastY = scrollY, ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = scrollY;
      if (open) { lastY = y; return; }
      top.classList.toggle('solid', y > 8);
      if (y > lastY + 6 && y > top.offsetHeight * 2) top.classList.add('away');
      else if (y < lastY - 6 || y <= top.offsetHeight) top.classList.remove('away');
      if (Math.abs(y - lastY) > 6) lastY = y;
    });
  }, {passive: true});
}
