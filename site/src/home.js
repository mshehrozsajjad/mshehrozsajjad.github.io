// The homepage's set pieces. pages.js still runs the shared parts (the line, the twin, the postcard, the theme);
// this file only adds the motion that makes the pitch feel like a poster coming alive.
// Everything is inside a reduced-motion media query, so people who asked for less motion get the finished page, still.
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {SplitText} from 'gsap/SplitText';
import {mountShelf} from './bookshelf.js';
import {mountMenu} from './menu.js';

gsap.registerPlugin(ScrollTrigger, SplitText);

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const wide = '(min-width: 761px)';

/* ---------- the entrance, cut like a film title: his four sides flash one beat each, then a letterbox opens across
   his sunglasses and the camera pulls back to the hero while the hello lands. A click or any key skips it. ---------- */
const CUTS = [   // word, background, colour (theme tokens, so dark mode inverts them too)
  ['Code', 'var(--ink)', 'var(--paper)'],
  ['Design', 'var(--paper)', 'var(--signal)'],
  ['AI', 'var(--signal)', 'var(--on-signal)'],
  ['Hardware', 'var(--paper)', 'var(--ink)'],
];
const BEAT = .25, ZOOM = 2.6;
const EYES = {x: .55, y: .125};   // where the sunglasses sit inside the front photo, as a share of its box

function playEntrance(intro, enter) {
  const root = document.documentElement, hero = $('.hx'), photo = $('.hx-photo'), word = $('.intro-w', intro);
  const top = $('.intro-top', intro), bottom = $('.intro-bot', intro);
  const loaded = Promise.race([
    Promise.all([photo.decode().catch(() => {}), document.fonts.load('700 100px "Instrument Sans"').catch(() => {})]),
    new Promise(r => setTimeout(r, 1200)),
  ]);

  history.scrollRestoration = 'manual';
  scrollTo(0, 0);
  root.classList.add('intro-on');
  enter.pause();
  gsap.set('.top', {autoAlpha: 0});

  // one word, as big as the screen allows
  const cut = (text, bg, fg) => {
    intro.style.background = bg;
    Object.assign(word.style, {color: fg, visibility: 'visible', fontSize: '100px'});
    word.textContent = text;
    word.style.fontSize = `${100 * Math.min(innerWidth * .9 / word.offsetWidth, innerHeight * .6 / word.offsetHeight)}px`;
  };
  // aim the letterbox and the camera at his sunglasses
  const aim = () => {
    const p = photo.getBoundingClientRect(), h = hero.getBoundingClientRect();
    const x = p.left + p.width * EYES.x, y = p.top + p.height * EYES.y;
    hero.style.transformOrigin = `${x - h.left}px ${y - h.top}px`;
    intro.style.setProperty('--cy', `${y}px`);
  };
  const strip = () => innerHeight * .045;   // half the height of the first slit

  const tl = gsap.timeline({paused: true, onComplete: finish});
  CUTS.forEach(([text, bg, fg], i) => tl
    .call(cut, [text, bg, fg], .2 + i * BEAT)
    .fromTo(word, {yPercent: 14, scale: 1.08}, {yPercent: 0, scale: 1, duration: .22, ease: 'expo.out', immediateRender: false}, .2 + i * BEAT));
  // one frame swaps the cover for the closed letterbox over the zoomed hero, so the full hero never flashes
  tl.addLabel('open', .3 + CUTS.length * BEAT)
    .set(hero, {scale: ZOOM}, 'open')
    .set([top, bottom], {visibility: 'visible'}, 'open')
    .set(word, {visibility: 'hidden'}, 'open')
    .set(intro, {background: 'transparent'}, 'open')
    .to(top, {y: () => -strip(), duration: .35, ease: 'power3.out'}, 'open')
    .to(bottom, {y: () => strip(), duration: .35, ease: 'power3.out'}, 'open')
    .to(top, {yPercent: -100, duration: 1.1, ease: 'expo.inOut'}, 'open+=.45')
    .to(bottom, {yPercent: 100, duration: 1.1, ease: 'expo.inOut'}, 'open+=.45')
    .to(hero, {scale: 1, duration: 1.5, ease: 'expo.inOut'}, 'open+=.3')
    .add(() => enter.play(0), 'open+=.9')
    .to('.top', {autoAlpha: 1, duration: .6}, 'open+=1.3');

  loaded.then(() => { aim(); tl.play(); });

  function finish() {
    intro.remove();
    gsap.set(hero, {clearProps: 'transform,transformOrigin'});
    gsap.set('.top', {clearProps: 'opacity,visibility'});
    root.classList.remove('intro-on');
    removeEventListener('keydown', skip);
    ScrollTrigger.refresh();   // the scroll scenes were measured while the hero was zoomed
  }
  function skip() { tl.progress(1); enter.progress(1); }
  intro.addEventListener('pointerdown', skip);
  addEventListener('keydown', skip, {once: true});
}

/* ---------- noughts and crosses in his hand, scattered round the quote so the section isn't empty ----------
   One per cell of a loose grid (so they spread evenly), nudged, sized and tilted by a fixed seed so every visit looks
   the same. Any that would land on the quote or the signature step aside, re-checked whenever the layout changes. */
const marks = $('.qt-marks');
if (marks) {
  const COLS = 8, ROWS = 5, CLEAR = 32;   // CLEAR: px kept free around the words
  let seed = 11;
  const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const m = document.createElement('span');
    m.className = rnd() < .2 ? 'qt-mark hot' : 'qt-mark';
    m.textContent = rnd() < .5 ? 'x' : 'o';
    m.dataset.x = (c + .15 + rnd() * .7) / COLS;
    m.dataset.y = (r + .15 + rnd() * .7) / ROWS;
    m.style.cssText = `left:${m.dataset.x * 100}%;top:${m.dataset.y * 100}%;--s:${(.7 + rnd() * 1.1).toFixed(2)};--r:${Math.round(rnd() * 60 - 30)}deg`;
    marks.appendChild(m);
  }
  const stepAside = () => {
    const box = marks.getBoundingClientRect();
    const words = ['.qt-text', '.qt-sign', '.qt .chap-l'].map(sel => $(sel).getBoundingClientRect());
    $$('.qt-mark', marks).forEach(m => {
      const x = box.left + m.dataset.x * box.width, y = box.top + m.dataset.y * box.height, pad = CLEAR + m.offsetHeight / 2;
      m.classList.toggle('off', words.some(w => x > w.left - pad && x < w.right + pad && y > w.top - pad && y < w.bottom + pad));
    });
  };
  stepAside();
  new ResizeObserver(stepAside).observe(marks);
  document.fonts?.ready.then(stepAside);
}

mountMenu();   // the header and the burger's menu (menu.js)
mountShelf($('#sides'));   // the pile of books, one on top at a time, and their contents (bookshelf.js; it deals them in itself)

const mm = gsap.matchMedia();
const doodling = import.meta.env.DEV && new URLSearchParams(location.search).has('doodle');
mm.add({motion: '(prefers-reduced-motion: no-preference)', wide}, ({conditions}) => {
  if (!conditions.motion || doodling) { $('.intro')?.remove(); return; }   // doodle mode needs the page to hold still

  /* ---------- the hello arrives: letters rise, HEL and LO slide out from the middle, his note follows ---------- */
  const hello = SplitText.create('.hx-in', {type: 'chars', charsClass: 'hc'});
  const toMiddle = edge => (i, el) => innerWidth / 2 - el.getBoundingClientRect()[edge];
  const enter = gsap.timeline({defaults: {ease: 'expo.out'}})
    .from(hello.chars, {yPercent: 110, duration: 1.2, stagger: .06})
    .from('.hx-l1', {x: toMiddle('right'), duration: 1.4, ease: 'expo.inOut'}, 0)
    .from('.hx-l2', {x: toMiddle('left'), duration: 1.4, ease: 'expo.inOut'}, 0)
    .from('.hx-note', {autoAlpha: 0, rotate: -16, y: 20, duration: .9}, 1.1)
    .from(['.hx-copy', '.hx .call-wrap'], {y: 30, autoAlpha: 0, duration: 1, stagger: .1}, .9);

  const intro = $('.intro');
  if (intro && !location.hash) playEntrance(intro, enter);
  else {
    intro?.remove();
    enter.from('.hx-photo', {y: 80, autoAlpha: 0, duration: 1.4}, .25);
  }

  // and on the way out the word comes apart behind him
  gsap.timeline({scrollTrigger: {trigger: '.hx', start: 'top top', end: 'bottom top', scrub: true}})
    .to('.hx-l1', {xPercent: -18, ease: 'none'}, 0)   // the two halves drift apart as he stays
    .to('.hx-l2', {xPercent: 18, ease: 'none'}, 0)
    .to('.hx-fig', {yPercent: 8, scale: .94, ease: 'none'}, 0)
    .to('.hx-note', {yPercent: -60, ease: 'none'}, 0);

  /* ---------- the short version writes itself as you scroll ---------- */
  const quote = SplitText.create('.qt-text', {type: 'words, chars', charsClass: 'hc'});
  gsap.timeline({scrollTrigger: {trigger: '.qt-pin', start: conditions.wide ? 'top top' : 'top 70%', end: conditions.wide ? '+=110%' : 'bottom 60%', scrub: .6, pin: conditions.wide}})
    .fromTo(quote.chars, {autoAlpha: .08}, {autoAlpha: 1, stagger: .04, ease: 'none'})
    .from('.qt-mark', {scale: 0, autoAlpha: 0, duration: .3, ease: 'back.out(3)', stagger: {each: .1, from: 'random'}}, 0)
    .from('.qt-sign', {autoAlpha: 0, x: -30, ease: 'power2.out', duration: .8});

  /* ---------- everything he does, each line sharp only while it passes the middle ---------- */
  $$('.ab-list li').forEach(li => {
    gsap.timeline({scrollTrigger: {trigger: li, start: 'top 85%', end: 'bottom 15%', scrub: true}})
      .fromTo(li, {filter: 'blur(10px)', autoAlpha: .18}, {filter: 'blur(0px)', autoAlpha: 1, ease: 'power1.out'})
      .to(li, {duration: .6})
      .to(li, {filter: 'blur(10px)', autoAlpha: .18, ease: 'power1.in'});
  });

  /* ---------- before you ask: the headline slams in ---------- */
  gsap.from('.fq-h', {xPercent: -12, autoAlpha: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: {trigger: '.fq-h', start: 'top 85%'}});

  /* ---------- the wall: his hand runs both ways under the promise ---------- */
  $$('.wl-hand p').forEach((p, i) => gsap.fromTo(p, {xPercent: i % 2 ? -18 : 0}, {xPercent: i % 2 ? 0 : -18, ease: 'none',
    scrollTrigger: {trigger: '.wl', start: 'top bottom', end: 'bottom top', scrub: true}}));
  gsap.from(['.wl-a', '.wl-b'], {scale: 1.4, autoAlpha: 0, stagger: .15, duration: .9, ease: 'back.out(1.6)', scrollTrigger: {trigger: '.wl', start: 'top 55%'}});

  // the hand font changes line lengths once it loads, so measure again
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
});

/* ---------- the footer's clock: the time where he is ---------- */
const clock = $('#ftClock');
if (clock) {
  const fmt = new Intl.DateTimeFormat('en-GB', {timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit'});
  const tick = () => { const d = new Date(); clock.textContent = fmt.format(d); clock.dateTime = d.toISOString(); };
  tick();
  setInterval(tick, 20000);
}
