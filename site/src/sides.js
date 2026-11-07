// "Pick a side": the contents list and the fanned volumes, kept in step.
//   The list says in plain words what each side is and who it's for; exactly one line is open at a time, showing what's
//   inside, a short film from that side and the way in. Open a line and its book comes to the top; pick a book and its
//   line opens. ↑ ↓ move along the list. Only the open line's film plays, and only while the section is on screen.
//   Without the script every line stays open (home.css only folds them under .on), so nothing is hidden.
import {mountShelf} from './bookshelf.js';

export function mountSides(section) {
  if (!section) return null;
  const rows = [...section.querySelectorAll('.sx')].map(li => ({
    li, btn: li.querySelector('.sx-btn'), panel: li.querySelector('.sx-p'), film: li.querySelector('.sx-film'),
  }));
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let open = 0, inView = false;

  const play = () => rows.forEach((r, i) => {
    if (i === open && inView && !still) r.film.play().catch(() => {});
    else r.film.pause();
  });
  const show = i => {
    open = i;
    rows.forEach((r, j) => {
      r.li.classList.toggle('open', j === i);
      r.btn.setAttribute('aria-expanded', j === i);
      r.panel.inert = j !== i;   // a folded line's link stays out of the tab order
    });
    play();
  };

  const shelf = mountShelf(section, {onPick: show});
  rows.forEach((r, i) => {
    r.btn.addEventListener('click', () => { shelf.touch(); shelf.pick(i); });
    r.btn.addEventListener('keydown', e => {
      const step = {ArrowDown: 1, ArrowUp: -1}[e.key];
      if (!step) return;
      e.preventDefault();
      const next = (i + step + rows.length) % rows.length;
      rows[next].btn.focus();
      shelf.touch();
      shelf.pick(next);
    });
  });
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; play(); }, {threshold: .2}).observe(section);

  section.classList.add('on');
  show(0);
  return shelf;
}
