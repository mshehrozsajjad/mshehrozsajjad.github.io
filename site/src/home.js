// The homepage's set pieces. pages.js still runs the shared parts (the line, the twin, the postcard, the theme);
// this file only adds the motion that makes the pitch feel like a poster coming alive.
// Everything is inside a reduced-motion media query, so people who asked for less motion get the finished page, still.
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {SplitText} from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const wide = '(min-width: 761px)';

// the peek card follows the pointer inside its row (CSS shows it on hover)
$$('.sd-row').forEach(row => row.addEventListener('pointermove', e => {
  const r = row.getBoundingClientRect();
  row.style.setProperty('--mx', `${e.clientX - r.left}px`);
  row.style.setProperty('--my', `${e.clientY - r.top}px`);
}));

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

const mm = gsap.matchMedia();
mm.add({motion: '(prefers-reduced-motion: no-preference)', wide}, ({conditions}) => {
  if (!conditions.motion) return;

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
    .from('.qt-sign', {autoAlpha: 0, x: -30, ease: 'power2.out', duration: .8});

  /* ---------- everything he does, each line sharp only while it passes the middle ---------- */
  $$('.ab-list li').forEach(li => {
    gsap.timeline({scrollTrigger: {trigger: li, start: 'top 85%', end: 'bottom 15%', scrub: true}})
      .fromTo(li, {filter: 'blur(10px)', autoAlpha: .18}, {filter: 'blur(0px)', autoAlpha: 1, ease: 'power1.out'})
      .to(li, {duration: .6})
      .to(li, {filter: 'blur(10px)', autoAlpha: .18, ease: 'power1.in'});
  });

  /* ---------- the four sides rise out of their rows ---------- */
  $$('.sd-w').forEach(w => {
    const s = SplitText.create(w, {type: 'chars', charsClass: 'hc'});
    gsap.from(s.chars, {yPercent: 105, stagger: .025, duration: .9, ease: 'expo.out', scrollTrigger: {trigger: w, start: 'top 88%'}});
  });

  /* ---------- before you ask: the headline slams in ---------- */
  gsap.from('.fq-h', {xPercent: -12, autoAlpha: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: {trigger: '.fq-h', start: 'top 85%'}});

  /* ---------- the wall: his hand runs both ways under the promise ---------- */
  $$('.wl-hand p').forEach((p, i) => gsap.fromTo(p, {xPercent: i % 2 ? -18 : 0}, {xPercent: i % 2 ? 0 : -18, ease: 'none',
    scrollTrigger: {trigger: '.wl', start: 'top bottom', end: 'bottom top', scrub: true}}));
  gsap.from('.ft-wave', {yPercent: 100, duration: 1, ease: 'expo.out', scrollTrigger: {trigger: '.ft', start: 'top 85%'}});
  gsap.from(['.wl-a', '.wl-b'], {scale: 1.4, autoAlpha: 0, stagger: .15, duration: .9, ease: 'back.out(1.6)', scrollTrigger: {trigger: '.wl', start: 'top 55%'}});
  gsap.from('.wl-photo', {yPercent: 30, autoAlpha: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: {trigger: '.wl', start: 'top 45%'}});

  // the hand font changes line lengths once it loads, so measure again
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
});
