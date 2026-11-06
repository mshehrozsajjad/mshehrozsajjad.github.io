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

const mm = gsap.matchMedia();
mm.add({motion: '(prefers-reduced-motion: no-preference)', wide}, ({conditions}) => {
  if (!conditions.motion) return;

  /* ---------- the hello arrives: letters rise, he steps in, his pen draws around him ---------- */
  const hello = SplitText.create('.hx-in', {type: 'chars', charsClass: 'hc'});
  const scribbles = $$('.hx-scrib path');
  gsap.timeline({defaults: {ease: 'expo.out'}})
    .from(hello.chars, {yPercent: 110, duration: 1.3, stagger: .07})
    .from('.hx-photo', {y: 80, autoAlpha: 0, duration: 1.4}, .25)
    .fromTo(scribbles[0], {strokeDashoffset: 1}, {strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut'}, .9)
    .fromTo(scribbles.slice(1), {strokeDashoffset: 1}, {strokeDashoffset: 0, duration: .35, stagger: .1, ease: 'power2.out'}, 1.85)
    .from('.hx-scrib .spark', {fillOpacity: 0, scale: .4, rotate: -45, transformOrigin: '50% 50%', duration: .6, ease: 'back.out(3)'}, 2.2)
    .from('.hx-note', {autoAlpha: 0, rotate: -16, y: 20, duration: .9}, 1.3)
    .from(['.hx-copy', '.hx .call-wrap'], {y: 30, autoAlpha: 0, duration: 1, stagger: .1}, 1.1);

  // and on the way out the word sinks behind him while he stays a beat longer
  gsap.timeline({scrollTrigger: {trigger: '.hx', start: 'top top', end: 'bottom top', scrub: true}})
    .to('.hx-word', {yPercent: 35, ease: 'none'}, 0)
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
  gsap.from(['.wl-a', '.wl-b'], {scale: 1.4, autoAlpha: 0, stagger: .15, duration: .9, ease: 'back.out(1.6)', scrollTrigger: {trigger: '.wl', start: 'top 55%'}});
  gsap.from('.wl-photo', {yPercent: 30, autoAlpha: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: {trigger: '.wl', start: 'top 45%'}});

  // the hand font changes line lengths once it loads, so measure again
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
});
