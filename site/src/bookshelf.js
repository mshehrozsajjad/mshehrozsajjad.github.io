// "Pick a side": a shelf of four books, all closed until you pull one. Each book is a block (home.css): the spine is its front
// face, the cover its side face, and turning the block shows the cover the way a real book turns.
//   click (or tab to) a spine: that book turns open and the open one turns back; click the open cover: its page opens
//   in a new tab. The arrows and the ← → keys step through the books, and the story beside the shelf follows.
//   Every frame, eased like a spring: the open book widens so its neighbours slide aside and turns in place on the
//   shelf; each face darkens as it turns from the light; the book under the pointer rises, like pulling it up off the shelf.
//   Hovered, the open book comes forward off the shelf and leans after the pointer in every direction, its sheen
//   sliding across the cover; let go, it settles back flush on the plank.
// Sizes come from the CSS (one size for every book), so this only reads them. Mouse and trackpad only; touch screens
// show the covers in a row (CSS). With reduced motion it snaps instead of easing.
const TURN = 7;    // how quickly a book turns (higher is snappier)
const TILT = 9;    // degrees the hovered open book leans after the pointer, side to side
const NOD = 6;     // ... and up and down
const ease = t => t * t * (3 - 2 * t);

export function mountShelf(section) {
  const shelf = section?.querySelector('.bookshelf');
  if (!shelf || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cap = section.querySelector('.shelf-cap'), info = cap.querySelector('.shelf-info'), open = cap.querySelector('.shelf-open');
  const ticks = [...cap.querySelectorAll('.shelf-ticks i')];
  const books = [...shelf.querySelectorAll('.book')].map(el => ({
    el, block: el.querySelector('.book-3d'), spine: el.querySelector('.spine'), cover: el.querySelector('.cover'),
    name: el.querySelector('.cv-t').textContent, inside: el.dataset.inside, o: 0, lift: 0, hover: false, tx: 0, ty: 0,
  }));
  const pad = n => String(n).padStart(2, '0');
  let active = -1, frame = 0, last = 0;   // -1: every book on the shelf, none open
  let mx = 0, my = 0;                     // the pointer, for the open book's lean

  function show(i) {
    active = (i + books.length) % books.length;
    const b = books[active];
    section.classList.add('sd-open');
    books.forEach((x, j) => x.el.classList.toggle('open', j === active));
    ticks.forEach((t, j) => t.classList.toggle('on', j === active));
    cap.querySelector('.shelf-count').textContent = `${pad(active + 1)} / ${pad(books.length)}`;
    cap.querySelector('.shelf-n').textContent = `Vol. ${pad(active + 1)}`;
    cap.querySelector('.shelf-t').textContent = b.name;
    cap.querySelector('.shelf-d').textContent = b.inside;
    open.href = b.el.href;   // keeps any ?for= the page added
    open.setAttribute('aria-label', `Open ${b.name} (opens in a new tab)`);
    info.classList.remove('swap'); void info.offsetWidth; info.classList.add('swap');
    wake();
  }

  /* ---------- the hands: clicks, keyboard focus, hover, arrows, keys ---------- */
  books.forEach((b, i) => {
    b.el.addEventListener('click', e => { if (i !== active) { e.preventDefault(); show(i); } });   // a spine turns; the cover opens its page
    // a mouse click focuses too, so only keyboard focus turns a book (the click handles the mouse)
    b.el.addEventListener('focus', () => { if (i !== active && b.el.matches(':focus-visible')) show(i); });
    b.el.addEventListener('pointerenter', () => { b.hover = true; wake(); });
    b.el.addEventListener('pointerleave', () => { b.hover = false; wake(); });
  });
  shelf.addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; wake(); });
  // from a closed shelf, → pulls the first book and ← the last
  const stepBy = d => show(active < 0 ? (d > 0 ? 0 : books.length - 1) : active + d);
  cap.querySelectorAll('.shelf-arrow').forEach(btn => btn.addEventListener('click', () => stepBy(+btn.dataset.step)));
  section.addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    stepBy(e.key === 'ArrowRight' ? 1 : -1);
    if (shelf.contains(document.activeElement)) books[active].el.focus({preventScroll: true});
  });

  /* ---------- every frame, until everything has settled ---------- */
  function wake() { if (!frame) { last = performance.now(); frame = requestAnimationFrame(step); } }
  function step(now) {
    const dt = Math.min(.05, (now - last) / 1000);
    last = now;
    const spring = r => reduce ? 1 : 1 - Math.exp(-dt * r);
    let moving = false;
    books.forEach((b, i) => {
      const want = i === active ? 1 : 0, lift = b.hover ? 1 : 0;   // any book under the pointer rises, open or not
      b.o += (want - b.o) * spring(TURN);
      b.lift += (lift - b.lift) * spring(12);
      if (Math.abs(want - b.o) < .001) b.o = want; else moving = true;
      if (Math.abs(lift - b.lift) < .001) b.lift = lift; else moving = true;
      const o = ease(b.o), h = b.el.offsetHeight, w = h * .17, cw = h * .7;   // the proportions set in home.css

      // the hovered open book leans after the pointer: -1..1 across the book, side to side and top to bottom
      let px = 0, py = 0;
      if (b.hover && i === active) {
        const r = b.el.getBoundingClientRect();
        px = Math.max(-1, Math.min(1, (mx - r.left - r.width / 2) / (r.width / 2)));
        py = Math.max(-1, Math.min(1, (my - r.top - r.height / 2) / (r.height / 2)));
      }
      b.tx += (px * TILT - b.tx) * spring(10);
      b.ty += (-py * NOD - b.ty) * spring(10);
      if (Math.abs(px * TILT - b.tx) > .01 || Math.abs(-py * NOD - b.ty) > .01) moving = true;

      b.el.style.width = `${w + (cw - w) * o}px`;
      b.el.style.zIndex = o > .01 ? 2 : '';
      // whichever face you see (the spine, or the cover once it's turned) sits on the plank's front edge, so the book
      // always stands on the shelf: set back half its depth, and as it turns, forward by the difference.
      // Hovered, the open book is lifted out: up, and forward off the shelf, so its lean reads as truly raised
      const raise = b.lift * o;
      b.block.style.transform = `translate3d(0, ${-b.lift * h * .06}px, ${-cw / 2 + o * (cw - w) / 2 + raise * cw * .28}px) ` +
        `rotateX(${b.ty * o}deg) rotateY(${-90 * o + b.tx * o}deg)`;
      b.spine.style.setProperty('--shade', (o * .55).toFixed(3));
      b.cover.style.setProperty('--shade', ((1 - o) * .5).toFixed(3));
      b.cover.style.setProperty('--gx', `${50 + b.tx * 4}%`);   // the sheen slides with the lean
    });
    frame = moving ? requestAnimationFrame(step) : 0;
  }

  cap.querySelector('.shelf-count').textContent = `${books.length} volumes`;
  cap.hidden = false;
  addEventListener('resize', wake);
  wake();
}
