// "Pick a side": the four volumes fanned out like a hand of cards (on phones, a pile).
//   The hand: book 0 on top, furthest right; each one under it turned a step further left about a point below the
//   hand. The pile: each one under the top a step up and to the right. Either way every title shows (home.css lays it
//   out from --d, so without the script it still lies there, every book a link).
//   Pick a book under the top one (click or tap it, or pick its line in the contents list, sides.js): it is pulled up
//   out of the hand (or out to the side of the pile), laid on top once it's clear, and slides home while the others
//   settle back a place. Click the book on top: its side opens. A stamp on it says so.
//   The books are out of the tab order; the contents list is the way in for keyboards and screen readers.
//   Hover a book underneath and it peeks out of the pile; hover the top one and it lifts off the desk and leans after
//   the pointer, its sheen sliding across the cover. Until you touch the pile, a book underneath peeks now and then.
//   When the pile first comes into view the books are dealt onto the desk, bottom one first.
// Every frame is a spring; with reduced motion everything snaps and nothing is dealt or nudged.
const LEAN = 9;     // degrees the top book leans after the pointer, side to side
const NOD = 6;      // ... and up and down
const TURN = 24;    // degrees every book rests turned towards you on its spine, so a strip of spine shows (home.css matches it)
const OUT = [.62, -.36];   // where a picked book is pulled to from the pile before it's laid on top, in its own width and height
const PULL = .62;          // ... and how far up out of the hand, in its own height
const SWAP_AT = .65;       // how far out it is (0..1) when it goes on top
const NUDGE_EVERY = 2600;  // ms between peeks, until the pile is touched

export function mountShelf(section, {onPick} = {}) {
  const shelf = section?.querySelector('.bookshelf');
  if (!shelf) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const pile = shelf.querySelector('.books');

  const books = [...pile.querySelectorAll('.book')].map((el, i) => {
    const li = el.parentElement;
    return {
      i, el, li, block: el.querySelector('.book-3d'), cover: el.querySelector('.cover'),
      rot: parseFloat(li.style.getPropertyValue('--r')) || 0,
      // springs: depth in the pile, how far it's pulled out, how far from being dealt; and their speeds
      d: i, vd: 0, out: 0, vout: 0, outTo: 0, deal: reduce ? 0 : 1, vdeal: 0, dealTo: reduce ? 0 : 1,
      peek: 0, lift: 0, tx: 0, ty: 0, hover: false, poke: false, picking: false,
    };
  });
  let order = books.map((_, i) => i);   // the pile, top first
  let touched = false, inView = false, frame = 0, last = 0, mx = 0, my = 0;
  let cw = 0, H = 0, dx = 0, dy = 0, fan = false, stepDeg = 0;
  const measure = () => {
    cw = books[0].li.offsetWidth; H = books[0].li.offsetHeight;
    const cs = getComputedStyle(pile);
    dx = parseFloat(cs.getPropertyValue('--dx')) || 0; dy = parseFloat(cs.getPropertyValue('--dy')) || 0;
    fan = cs.getPropertyValue('--fan').trim() === '1'; stepDeg = parseFloat(cs.getPropertyValue('--step')) || 0;
  };

  /* ---------- picking: pull it out, lay it on top, let the rest settle ---------- */
  function pick(i) {
    onPick?.(i);
    const b = books[i];
    if (order[0] === i || b.picking) return wake();
    if (reduce) return lay(b);
    b.picking = true;
    b.outTo = 1;
    wake();
  }
  function lay(b) {
    b.picking = false;
    b.outTo = 0;
    order = [b.i, ...order.filter(j => j !== b.i)];
    books.forEach(x => x.li.classList.toggle('is-top', x.i === order[0]));
    if (reduce) books.forEach(x => { x.d = order.indexOf(x.i); x.out = 0; });
    wake();
  }
  function touch() { touched = true; }

  /* ---------- the hands: clicks and hover ---------- */
  books.forEach(b => {
    b.el.addEventListener('click', e => {   // a book underneath comes to the top; the top one opens
      touch();
      if (order[0] !== b.i) { e.preventDefault(); pick(b.i); }
    });
    b.el.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { b.hover = true; touch(); wake(); } });
    b.el.addEventListener('pointerleave', () => { b.hover = false; wake(); });
  });
  pile.addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; wake(); });

  /* ---------- dealt onto the desk the first time it's seen, then a book peeks now and then until touched ---------- */
  new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    if (!inView || books.every(b => b.dealTo === 0)) return;
    [...order].reverse().forEach((i, n) => setTimeout(() => { books[i].dealTo = 0; wake(); }, 140 * n));
  }, {threshold: .3}).observe(pile);
  if (!reduce) {
    let n = 0;
    setInterval(() => {
      if (touched || !inView || books.some(b => b.deal > .01 || b.picking)) return;
      const b = books[order[1 + (n++ % (books.length - 1))]];
      b.poke = true; wake();
      setTimeout(() => { b.poke = false; wake(); }, 650);
    }, NUDGE_EVERY);
  }

  /* ---------- every frame, until everything has settled ---------- */
  function wake() { if (!frame) { last = performance.now(); frame = requestAnimationFrame(tick); } }
  function tick(now) {
    const dt = Math.min(.05, (now - last) / 1000);
    last = now;
    let moving = false;
    // a slightly loose spring, so a book lands with a little give
    const spring = (b, k, v, to, stiff = 150, damp = 21) => {
      if (reduce) { b[k] = to; b[v] = 0; return; }
      for (let t = dt; t > 0; t -= 1 / 120) {
        const h = Math.min(t, 1 / 120);
        b[v] += ((to - b[k]) * stiff - b[v] * damp) * h;
        b[k] += b[v] * h;
      }
      if (Math.abs(to - b[k]) < .0005 && Math.abs(b[v]) < .0005) { b[k] = to; b[v] = 0; } else moving = true;
    };
    const ease = (b, k, to, rate) => {
      b[k] += (to - b[k]) * (reduce ? 1 : 1 - Math.exp(-dt * rate));
      if (Math.abs(to - b[k]) < .001) b[k] = to; else moving = true;
    };

    books.forEach(b => {
      const top = order[0] === b.i;
      spring(b, 'out', 'vout', b.outTo, 170, 24);
      if (b.picking && b.out > SWAP_AT) lay(b);
      spring(b, 'd', 'vd', order.indexOf(b.i));
      spring(b, 'deal', 'vdeal', b.dealTo, 90, 17);
      ease(b, 'peek', !top && (b.hover || b.poke) ? 1 : 0, 12);
      ease(b, 'lift', (top && b.hover) || b.picking ? 1 : 0, 10);

      // the top book leans after the pointer: -1..1 across the book, side to side and top to bottom
      let px = 0, py = 0;
      if (fine && top && b.hover) {
        const r = b.li.getBoundingClientRect();
        px = Math.max(-1, Math.min(1, (mx - r.left - r.width / 2) / (r.width / 2)));
        py = Math.max(-1, Math.min(1, (my - r.top - r.height / 2) / (r.height / 2)));
      }
      ease(b, 'tx', px * LEAN, 10);
      ease(b, 'ty', -py * NOD, 10);

      // its place: its spot in the hand (or the pile), plus pulled out, plus not yet dealt (it comes up from below)
      let x, y, r;
      if (fan) {
        r = (1.5 - b.d) * stepDeg + b.rot * .25 - b.deal * 12;
        const a = r * Math.PI / 180, pull = b.out * PULL * H;   // pulled straight up out of the hand, along its own length
        x = Math.sin(a) * pull + b.deal * .1 * cw;
        y = -Math.cos(a) * pull + b.deal * 1.1 * H;
      } else {
        x = b.d * dx * cw + b.out * OUT[0] * cw + b.deal * .2 * cw;
        y = -b.d * dy * H + b.out * OUT[1] * H + b.deal * 1.1 * H;
        r = b.rot * (.35 + .65 * Math.min(1, Math.max(0, b.d))) + b.out * 7 + b.deal * 16;
      }
      b.li.style.transform = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) rotate(${r.toFixed(3)}deg) scale(${(1 + b.out * .04).toFixed(4)})`;
      b.li.style.zIndex = 10 - order.indexOf(b.i);
      b.li.style.opacity = b.deal > .001 ? Math.max(0, 1 - b.deal * 1.6).toFixed(3) : '';
      b.li.style.setProperty('--lift', Math.max(b.lift, b.peek * .5, b.out).toFixed(3));

      // the block: a peeking book slides up out of the hand or the pile; the top one rises towards you and leans
      const W = H * .17;
      b.block.style.transform = `translate3d(${(fan ? 0 : b.peek * cw * .05).toFixed(2)}px,${(-b.peek * H * (fan ? .1 : .07) - b.lift * H * .015).toFixed(2)}px,${(-W / 2 + b.lift * cw * .12).toFixed(2)}px) ` +
        `rotateX(${b.ty.toFixed(3)}deg) rotateY(${(b.tx - 90 + TURN).toFixed(3)}deg)`;
      b.cover.style.setProperty('--shade', (Math.min(3, Math.max(0, b.d)) * .07).toFixed(3));   // deeper in the pile, a little darker
      b.cover.style.setProperty('--gx', `${50 + b.tx * 4}%`);   // the sheen slides with the lean
    });
    frame = moving ? requestAnimationFrame(tick) : 0;
  }

  books[0].li.classList.add('is-top');
  measure();
  new ResizeObserver(() => { measure(); wake(); }).observe(pile);
  wake();
  return {pick, touch};
}
