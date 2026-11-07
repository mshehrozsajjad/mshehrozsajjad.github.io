// "Pick a side": the library card and the fanned volumes, kept in step.
//   The card's four lines are tabs: each says which side it is and who it's for. The open one is stamped ON LOAN with
//   today's date in its DATE DUE column, and the panel below shows what's inside it and the way in. The volume's film
//   plays through a window in its jacket, on the book on top.
//   Open a line and its book comes to the top; pick a book and its line opens. The arrow keys move along the lines.
//   Only the open panel's film plays, and only while the section is on screen.
//   Without the script every panel stays showing (home.css only stacks them under .on), so nothing is hidden.
import {mountShelf} from './bookshelf.js';

const today = new Intl.DateTimeFormat('en-GB', {day: '2-digit', month: 'short', year: 'numeric'});

export function mountSides(section) {
  if (!section) return null;
  const tabs = [...section.querySelectorAll('.lc-row')];
  const panels = tabs.map(t => section.querySelector(`#${t.getAttribute('aria-controls')}`));
  const films = [...section.querySelectorAll('.books .cv-film video')];   // each book's film, in its jacket's window; the open one plays
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let open = 0, inView = false;

  section.querySelectorAll('[data-today]').forEach(d => { d.textContent = today.format(new Date()); });

  const play = () => films.forEach((f, i) => {
    if (!f) return;
    if (i === open && inView && !still) f.play().catch(() => {});
    else f.pause();
  });
  const show = i => {
    open = i;
    tabs.forEach((t, j) => {
      t.setAttribute('aria-selected', j === i);
      t.tabIndex = j === i ? 0 : -1;
      panels[j].classList.toggle('open', j === i);
      panels[j].inert = j !== i;   // a hidden panel's link stays out of the tab order
    });
    play();
  };

  const shelf = mountShelf(section, {onPick: show});
  const choose = i => { shelf.touch(); shelf.pick(i); };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => choose(i));
    t.addEventListener('keydown', e => {
      const step = {ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1}[e.key];
      if (!step) return;
      e.preventDefault();
      const next = (i + step + tabs.length) % tabs.length;
      tabs[next].focus();
      choose(next);
    });
  });
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; play(); }, {threshold: .2}).observe(section);

  section.classList.add('on');
  show(0);
  return shelf;
}
