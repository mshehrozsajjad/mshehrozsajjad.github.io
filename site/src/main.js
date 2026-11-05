import {strand, sharedHandle} from './strands.js';
import {createReveal, splitWords} from './reveal.js';
import {smooth} from './spline.js';
import {handDrawn} from './hand.js';
(() => {
"use strict";
const $ = (s, r=document) => r.querySelector(s), $$ = (s, r=document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const main = $('#main'), svg = $('#trail'), pMain = $('#pMain'), pNow = $('#pMainNow');
if (!reduce) document.documentElement.classList.add('js');

// the sprites are two-frame animations; people who asked for less motion get the still frame
const calm = (root = document) => { if (reduce) $$('img.sprite', root).forEach(i => { const a = i.getAttribute('src'); if (a && a.includes('-anim.webp')) i.setAttribute('src', a.replace('/v2/', '/').replace('-anim.webp', '.webp')); }); };
calm();
/* ================= THE LAB: four collections on the line; one is open, and scrolling steps through it ================= */
const AR = d => `<svg class="ar" aria-hidden="true"><use href="#i-${d}"/></svg>`;
const LAB = [
  {id:'roomrush', n:'RoomRush', line:'I needed a flat in Munich, so I built a tool to find one. It found me one.', tip:'50 signups in 10 minutes',
   label:'Launched, then stopped', shot:'/assets/shots/roomrush.webp', a:[['roomrush.de','https://roomrush.de']],
   body:['My first self-initiated product, built for my own flat hunt. People loved it.','The unit economics made it too expensive to run as a business, so I stopped it.']},
  {id:'myclosr', n:'myClosr', line:'Live coaching during sales calls, then practice after them.', tip:'Live on Mac and Windows',
   label:'Launched', shot:'/assets/shots/myclosr.webp', a:[['myclosr.com','https://myclosr.com']],
   body:['A Mac and Windows app that coaches you while the call is happening and lets you practise afterwards.'], film:'/assets/media/myclosr-film.mp4', poster:'/assets/media/myclosr-film-poster.webp', filmBtn:'Watch the demo', filmLabel:'myClosr coaching during a live sales call'},
  {id:'slaptastic', n:'Slaptastic', line:'Give it a product photo and it makes creator-style video ads.', tip:'Customers from my own ads',
   label:'Live', shot:'/assets/shots/slaptastic.webp', a:[['getslaptastic.com','https://getslaptastic.com']],
   body:['It makes creator-style video ads and images from one product photo. I ran the ads for it myself and they brought in customers.']},
  {id:'vorsprech', n:'Vorsprech', line:'Practice for the spoken German medical exam, on Beyond Presence avatars.', tip:'B1 pilot customers',
   label:'Live', film:'/assets/media/vorsprech-film.mp4', poster:'/assets/media/vorsprech-film-poster.webp', filmLabel:'Vorsprech: a spoken exam task with the avatar examiner', a:[['vorsprech.com','https://vorsprech.com']],
   body:['My wife was preparing for the German medical language exam. Vorsprech runs the spoken part and scores it against the exam rubric.']},
  {id:'npcfilter', n:'NPC Filter', line:'LinkedIn filled up with AI comments, so my agent built a filter overnight.', tip:'Free in the Chrome Web Store',
   label:'Launched', shot:'/assets/shots/npcfilter.webp', film:'/assets/media/npc-film.mp4', poster:'/assets/media/npc-film-poster.webp', filmLabel:'The NPC Filter launch film', filmBtn:'Watch the film', a:[['npcfilter.com','https://npcfilter.com']],
   sub:'“Keep the weird. Skip the filler.”'},
  {id:'tars', n:'TARS', line:'My first robot, my first soldering, and a walk Claude learned.', tip:'Our avatars, running locally',
   label:'Prototype', clips:[['/assets/media/tars-falling.mp4','/assets/media/tars-falling-poster.webp','Falling, then walking'],['/assets/media/tars-my-face.mp4','/assets/media/tars-my-face-poster.webp','With my avatar face']],
   body:['Two years into building with AI, I wanted to try hardware. I 3D-printed an open-source TARS and soldered in a motion sensor, my first time holding an iron.'], sprite:'solder'},
  {id:'yolk', n:'Yolk', line:'I always wanted a Pokédex, so I designed my own AI device. It makes my phone calls in German.', tip:'Waitlist open',
   label:'Launched', clips:[['/assets/media/yolk-in-hand.mp4','/assets/media/yolk-in-hand-poster.webp','In my hand'],['/assets/media/yolk-film.mp4','/assets/media/yolk-film-poster.webp','The launch film']], a:[['Join the waitlist','https://getyolk.tech']],
   body:['When Meta open-sourced Muse Gadgets, I designed my own device around it: custom hardware, an e-paper screen and a rotary encoder that drives an AI agent.']},
  {id:'reels', n:'reels-in-code', label:'Open source', line:'A Claude skill that takes an idea to a finished reel: hooks, shots, captions, zooms, sound effects.', body:['Built with Claude and Remotion.'], a:[['GitHub','https://github.com/mshehrozsajjad/reels-in-code']], code:['reels-in-code','Claude skill · Remotion','idea → hooks → shots → captions → reel']},
  {id:'livekit', n:'LiveKit JS plugin', label:'Open source', line:'Brings Beyond Presence avatars to LiveKit web apps.', body:['Ported from the Python plugin.'], code:['LiveKit JS plugin','JavaScript · ported from Python','LiveKit web app → Beyond Presence avatar']},
  {id:'n8nflows', n:'n8n workflows', label:'Free', line:'Ready-made workflows for using Beyond Presence avatars in n8n.', code:['n8n workflows','Free · ready to import','trigger → avatar → result']},
  {id:'n8nnode', n:'Beyond Presence n8n node', label:'Published', line:'A custom node plus templates. The only verified n8n integration in the AI avatar category.', code:['Beyond Presence node','Verified on n8n','node + templates']},
  {id:'photos', n:'Photography', label:'Photos and aerial video', line:'A bridge from above, a lit dome at night, and a drone flight over a beach town.',
   photos:[['/assets/media/photo-bridge.webp','A bridge at night, shot from above'],['/assets/media/photo-dome.webp','A lit dome at night'],['/assets/media/drone.mp4','Drone shot over a beach town','/assets/media/drone-poster.webp']], sprite:'camera'},
  {id:'launch-films', n:'Launch films', label:'Two films', line:'The launch films for Yolk and NPC Filter, made alongside their brand and website.',
   clips:[['/assets/media/yolk-film.mp4','/assets/media/yolk-film-poster.webp','Yolk'],['/assets/media/npc-film.mp4','/assets/media/npc-film-poster.webp','NPC Filter']], mixed:true}
];
const BY = Object.fromEntries(LAB.map(w => [w.id, w]));
// Every strand leaves the one junction on the left and lands on the same row, so the four curves nest and cannot cross, whatever the order.
// The order is for the reader: Software is the core, Hardware second so the preselected return sweep is the shortest.
// Phones stack them vertically with Hardware last (CSS), so its way back to the line passes no other name.
const COLS = [
  {id:'software', n:'Software', unit:'projects', tag:'products', items:['roomrush','myclosr','slaptastic','vorsprech','npcfilter']},
  {id:'hardware', n:'Hardware', unit:'builds', tag:'builds', items:['yolk','tars']},
  {id:'opensource', n:'Open source', unit:'projects', tag:'repos', items:['reels','livekit','n8nflows','n8nnode']},
  {id:'creative', n:'Creative', unit:'pieces', tag:'pieces', items:['photos','launch-films']}
];
const COL = Object.fromEntries(COLS.map(c => [c.id, c]));
const img = (src, alt, pos = '') => `<img src="${src}" alt="${esc(alt)}" loading="lazy"${pos ? ` style="object-position:${pos}"` : ''}>`;
// each collection is a small pile of the same cream prints as chapter 01, back to front; the top one carries the handwritten caption.
// Open source has no imagery, so its prints are index cards: repo names on the back ones, a handwritten list on top
const PEEK = {
  software: [['/assets/shots/roomrush.webp'], ['/assets/shots/myclosr.webp'], ['/assets/shots/npcfilter.webp', '30% 50%']],
  hardware: [['/assets/media/tars-falling-poster.webp', '50% 40%'], ['/assets/media/yolk-in-hand-poster.webp', '50% 58%'], ['/assets/media/yolk-device.webp']],
  opensource: [['n8n-workflows'], ['livekit-js-plugin'], ['reels-in-code', 'livekit js plugin', 'n8n workflows', 'n8n node']],
  creative: [['/assets/media/yolk-film-poster.webp', '50% 35%'], ['/assets/media/drone-poster.webp'], ['/assets/media/photo-bridge.webp', '50% 40%']]
};
const printHTML = ([src, ...rest], cap) => {
  const face = src.startsWith('/') ? `<span class="snap-img">${img(src, '', rest[0])}</span>`
    : `<span class="snap-img note">${rest.length ? `<ul>${[src, ...rest].map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : `<code>${esc(src)}</code>`}</span>`;
  return `<span class="pk" data-reveal="print">${face}${cap ? `<span class="pk-cap">${esc(cap)}</span>` : ''}</span>`;
};
// the same column twice: on the fork, and again on the map at the end. The name is what the hand-drawn mark goes under
const colHTML = (c, cls, attrs, label) => {
  const cap = `${c.items.length} ${c.tag}`;
  return `<button class="fk${cls}" type="button" data-col="${c.id}" ${attrs} aria-label="${esc(label)}"><span class="fk-stack" aria-hidden="true">${PEEK[c.id].map((p, i, all) => printHTML(p, i === all.length - 1 && cap)).join('')}</span><i class="fk-dot" aria-hidden="true"></i><span class="fk-t" data-reveal><span class="fk-n"><span class="dd" data-doodle="underline2" data-manual>${esc(c.n)}</span></span><span class="fk-c" aria-hidden="true">${esc(cap)}</span></span></button>`;
};
$('#cols').innerHTML = COLS.map(c => colHTML(c, '', `id="col-${c.id}" aria-pressed="false" aria-controls="stage"`, `${c.n}, ${c.items.length} ${c.unit}`)).join('');
$('#rail').innerHTML = COLS.map(c => `<g class="st" data-c="${c.id}"><path class="st-out" pathLength="1"/><path class="st-back" pathLength="1"/></g>`).join('');
$('#mapNames').innerHTML = COLS.map(c => colHTML(c, ' mp', '', c.n)).join('');
// the masks reveal the dashed strands with the same draw-on as the solid ones
$('#mapSvg').innerHTML = `<path class="mp-trunk" pathLength="1"/>` + COLS.map(c => `<g data-c="${c.id}"><mask id="mk-${c.id}" maskUnits="userSpaceOnUse" x="-400" y="-100" width="4000" height="4000"><path class="mp-reveal" pathLength="1"/></mask><path class="mp-solid" pathLength="1"/><path class="mp-dash" mask="url(#mk-${c.id})"/></g>`).join('');
const reveal = createReveal(reduce);
const explored = new Set();

const TILTS = [-2.5, 2, -1.8, 2.6, -2.2];
const video = (src, poster, label) => `<video src="${src}" poster="${poster}" muted loop playsinline preload="none"${reduce ? ' controls' : ''} aria-label="${esc(label)}"></video>`;
function mediaHTML(w){
  if (w.photos) return `<div class="m-photos">${w.photos.map(([src, alt, poster]) => `<figure>${poster ? video(src, poster, alt) : img(src, alt)}</figure>`).join('')}</div>`;
  if (w.code) return `<div class="m-term" aria-hidden="true"><span class="dots"><i></i><i></i><i></i></span><code><b>${esc(w.code[0])}</b><i>${esc(w.code[1])}</i>${esc(w.code[2])}</code></div>`;
  if (w.clips) return `<div class="m-duo${w.mixed ? ' mixed' : ''}">${w.clips.map(c => `<figure>${video(...c)}<figcaption>${esc(c[2])}</figcaption></figure>`).join('')}</div>`;
  const vid = w.film ? video(w.film, w.poster, w.filmLabel || w.n) : '';
  if (w.shot) return `<div class="m-shot${w.tall ? ' tall' : ''}">${img(w.shot, w.shotAlt || (w.n + ' homepage'))}${w.film ? `<div class="m-film" hidden>${vid}</div>` : ''}</div>`;
  return `<div class="m-film${w.tall ? ' tall' : ''}">${vid}</div>`;
}
// one supporting sentence: the first of the body, unless the item names a better one
const support = w => w.sub || (w.body && w.body[0].split(/(?<=[.!?])\s/)[0]);
function itemHTML(w, i){
  const words = w.line.split(' '), sub = support(w), meta = [w.label, w.tip].filter(Boolean).join(' · ');
  const links = (w.a || []).map(a => `<a class="act" href="${a[1]}" target="_blank" rel="noopener">${esc(a[0])} ${AR('ne')}</a>`).join('') + (w.shot && w.film ? `<button type="button" class="it-film act" aria-pressed="false">${esc(w.filmBtn)} ${AR('right')}</button>` : '');
  return `<article class="itm" data-i="${i}" data-id="${w.id}" aria-label="${esc(w.n)}" style="--nw:${words.length};--tilt:${TILTS[i % TILTS.length]}deg">
    <div class="it-card">${mediaHTML(w)}</div>
    <div class="it-text">
      <p class="kicker">${esc(w.n)}</p>
      <h3 class="it-line">${words.map((x, j) => `<span class="w" style="--w:${j}">${esc(x)}</span>`).join(' ')}</h3>
      <p class="it-meta">${esc(meta)}</p>
      ${sub ? `<p class="it-sub">${esc(sub)}</p>` : ''}
      ${links ? `<div class="it-links">${links}</div>` : ''}
      ${w.sprite ? `<img class="sprite it-spr" src="/assets/sprites/v2/shehroz-${w.sprite}-anim.webp" alt="" aria-hidden="true" width="260" height="431">` : ''}
    </div>
  </article>`;
}

// the stage: on desktop it pins and scrolling steps through the open collection; on phones and for reduced motion the same items simply stack
const stageW = $('#stageWrap'), stageOut = $('.stage-out'), stage = $('#stage'), deck = $('#deck'), stgLine = $('#stgLine'), stgDots = $('#stgDots'), stgCount = $('#stgCount'), railOut = $('.rail-out');
const pinnedMQ = matchMedia('(min-width: 761px) and (prefers-reduced-motion: no-preference)');
let colNow = null, items = [], dots = [], active = -2, mode = null;
const playIn = (box, on) => $$('video', box).forEach(v => { if (on && !reduce && !v.closest('[hidden]')) v.play().catch(() => {}); else v.pause(); });
// stacked rows reveal as they enter
const stackIO = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting){ if (!reduce) e.target.classList.add('on'); if (e.target === items[items.length - 1]) markExplored(colNow); }
  playIn(e.target, e.isIntersecting);
}), {rootMargin:'0px 0px -12% 0px', threshold:.15});
function paintStage(cid){
  const c = COL[cid]; colNow = cid; mode = null;
  stageW.style.setProperty('--n', c.items.length);
  $('#stgCol').textContent = c.n;
  stgDots.innerHTML = c.items.map((id, i) => `<button type="button" aria-label="${esc(BY[id].n)}"><span></span></button>`).join('');
  deck.innerHTML = c.items.map((id, i) => itemHTML(BY[id], i)).join('');
  calm(deck);
  items = $$('.itm', deck); dots = $$('button', stgDots);
  dots.forEach((d, i) => d.addEventListener('click', () => toStep(i)));
}
function layoutStage(){
  const m = pinnedMQ.matches ? 'pinned' : 'stacked';
  // stacked, the global trail runs on through the rows; pinned, the stage draws its own stretch of it
  if (m === 'stacked'){ railOut.dataset.o = '20'; stageOut.dataset.o = '31'; } else { delete railOut.dataset.o; delete stageOut.dataset.o; }
  if (m === mode) return;
  mode = m; active = -2; stackIO.disconnect();
  stageW.classList.toggle('pinned', m === 'pinned');
  items.forEach(a => { a.classList.remove('on', 'past'); playIn(a, false); });
  if (m === 'stacked') items.forEach(a => stackIO.observe(a));
}
function setActive(i){
  active = i;
  items.forEach((a, j) => { a.classList.toggle('on', j === i); a.classList.toggle('past', j < i); playIn(a, j === i); });
  const k = cl(i, 0, items.length - 1);
  dots.forEach((d, j) => { d.classList.toggle('on', j === k); if (j === k) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current'); });
  stgCount.textContent = `${k + 1} / ${items.length}`;
  if (i >= items.length - 1) markExplored(colNow);
}
// per frame, from frame(): the line fills as you pass through, and the item at that point arrives
function stageFrame(){
  if (mode !== 'pinned') return;
  const r = stageW.getBoundingClientRect(), vh = innerHeight, n = items.length, p = cl(-r.top/(r.height - stage.offsetHeight));
  stgLine.style.setProperty('--p', p.toFixed(4));
  const i = r.top > vh*.62 ? -1 : r.bottom < vh*.3 ? n : Math.min(n - 1, Math.floor(p*n));
  if (i !== active) setActive(i);
}
function toStep(i, behavior = reduce ? 'auto' : 'smooth'){
  const r = stageW.getBoundingClientRect(), n = items.length;
  const top = mode === 'pinned' ? r.top + scrollY + (i ? (i + .5)/n : 0)*(r.height - stage.offsetHeight) : items[i].getBoundingClientRect().top + scrollY - 90;
  scrollTo({top, behavior});
}
// user: false for the preselection on load, which is only where the stage starts: the hand-drawn mark and the end of Shehroz's thinking wait for a real choice
function selectCol(cid, user = true){
  $$('.fk', cols).forEach(b => { const on = b.dataset.col === cid; b.classList.toggle('on', on); b.classList.toggle('picked', on && user); b.setAttribute('aria-pressed', on); });
  $$('.st').forEach(g => g.classList.toggle('on', g.dataset.c === cid));
  if (user) shelf.dataset.chosen = '';
  if (cid === colNow) return;
  playIn(deck, false); paintStage(cid); layoutStage();
  requestAnimationFrame(build);
}
window.labOpen = (cid, iid) => { closeD && closeD(false); selectCol(cid); toStep(Math.max(0, COL[cid].items.indexOf(iid))); };
// choosing gives the mark a moment to draw before the page walks down the chosen strand
const choose = e => { const b = e.target.closest('[data-col]'); if (!b) return; selectCol(b.dataset.col); if (reduce) toStep(0); else setTimeout(() => toStep(0), 600); };
$('#cols').addEventListener('click', choose);
$('#mapNames').addEventListener('click', choose);
$('.map-on').addEventListener('click', () => go('#close'));
deck.addEventListener('click', e => {
  const f = e.target.closest('.it-film'); if (!f) return;
  const a = f.closest('.itm'), card = $('.m-shot', a), box = $('.m-film', card), v = $('video', box), on = box.hidden;
  box.hidden = !on; card.classList.toggle('playing', on);
  f.setAttribute('aria-pressed', on); f.innerHTML = `${on ? 'Back to the product' : esc(BY[a.dataset.id].filmBtn)} ${AR('right')}`;
  if (on){ v.currentTime = 0; if (!reduce) v.play().catch(() => {}); } else v.pause();
});
// tabbing into an item that isn't showing brings its step into view
deck.addEventListener('focusin', e => { const a = e.target.closest('.itm'); if (a && mode === 'pinned' && items.indexOf(a) !== active) toStep(items.indexOf(a), 'instant'); });

// the fork: the line splits at a junction into four strands that each land on a column; the chosen one carries on to the stage.
// At the end the four rejoin as a map: strands you walked are solid, the rest dashed.
const rail = $('#rail'), shelf = $('#shelf'), cols = $('#cols');
const mapEl = $('#map'), mapStage = $('#mapStage'), mapSvg = $('#mapSvg'), mapK = $('#mapK'), mapTrunk = $('.mp-trunk', mapSvg);
const narrow = () => innerWidth <= 760;
const centre = (el, box) => { const r = el.getBoundingClientRect(); return {x:r.left + r.width/2 - box.left, y:r.top + r.height/2 - box.top}; };
const FORK = COLS.map((c, i) => { const g = $(`.st[data-c=${c.id}]`); return {c, seed:i + 1, g, out:$('.st-out', g), back:$('.st-back', g), btn:$(`.fk[data-col=${c.id}]`, cols), o:0, b:0}; });
const MAP = COLS.map((c, i) => { const g = $(`g[data-c=${c.id}]`, mapSvg); return {c, seed:i + 11, solid:$('.mp-solid', g), dash:$('.mp-dash', g), reveal:$('.mp-reveal', g), btn:$(`.fk[data-col=${c.id}]`, $('#mapNames')), p:0}; });
let forkJ, forkG, forkTrail, mapJ, mapT = {p:0};
// handle lengths (start, end) as a share of the drop; strand() lengthens them where a strand travels far sideways. Phones are nearly vertical
const reach = (mirror = false) => narrow() ? (mirror ? [0.3, .55] : [.55, .3]) : [.4, .4];
// a strand lands on its pile as a tack, slips behind the pile and out of its left edge, runs straight down the side of the column past the name,
// and only then curves away (phones have no piles: names are rows, so it just leaves the dot, at a slight angle so it clears the name above)
const lean = () => narrow() ? .3 : 0;
const slipOut = (btn, box) => { if (narrow()) return null; const p = $('.fk-stack', btn).getBoundingClientRect(); return {x:btn.getBoundingClientRect().left - box.left - 14, y:p.top + p.height*.95 - box.top}; };
const legDrop = (btn, from, box) => narrow() ? 0 : btn.getBoundingClientRect().bottom - box.top + 12 - from.y;
const planLeg = (s, box) => { s.via = slipOut(s.btn, box); s.drop = legDrop(s.btn, s.via || s.q, box); };

// the junction and the exit are the .rail-in / .rail-out waypoints, which the global trail passes through too, so the joins coincide
function layoutFork(){
  const sr = shelf.getBoundingClientRect(), j = centre($('.rail-in', shelf), sr), g = centre($('.rail-out', shelf), sr), [ka, kb] = reach();
  FORK.forEach(s => { s.q = centre($('.fk-dot', s.btn), sr); planLeg(s, sr); });
  const len = sharedHandle(FORK.map(s => [j, s.q]), ka);
  FORK.forEach(s => {
    // every strand bows the same way, so neighbours fanning out of one junction never swap order
    s.out.setAttribute('d', handDrawn(strand(j, s.q, s.seed, {ka, kb, tb:lean(), share:'a', len}), {seed: s.seed, k: .025, max: 10, side: () => 1}));
    s.back.setAttribute('d', handDrawn(strand(s.q, g, s.seed, {ka, kb, drop:s.drop, ta:lean(), via:s.via}), {anchors: s.via ? [s.via] : [], seed: s.seed + 5, k: .025, max: 12}));
  });
  rail.setAttribute('viewBox', `0 0 ${shelf.clientWidth} ${shelf.clientHeight}`);
  forkJ = j; forkG = g;
}
// the map's trunk is its own stretch of the line down the gutter (it pins with the stage); the strands converge where the global trail picks up again
function layoutMap(){
  mapEl.classList.toggle('pinned', pinnedMQ.matches);
  const mr = mapStage.getBoundingClientRect(), j = centre($('.map-jl', mapStage), mr), [ka, kb] = reach(true);
  MAP.forEach(m => { m.q = centre($('.fk-dot', m.btn), mr); planLeg(m, mr); });
  const len = sharedHandle(MAP.map(m => [m.via || m.q, j, m.drop]), kb);
  MAP.forEach(m => {
    const d = handDrawn(strand(m.q, j, m.seed, {ka, kb, drop:m.drop, ta:narrow() ? -0.22 : 0, share:'b', len, via:m.via}), {anchors: m.via ? [m.via] : [], seed: m.seed, k: .025, max: 10, side: () => 1});
    [m.solid, m.dash, m.reveal].forEach(p => p.setAttribute('d', d));
  });
  mapTrunk.setAttribute('d', `M${j.x.toFixed(1)} 0V${j.y.toFixed(1)}`);
  mapSvg.setAttribute('viewBox', `0 0 ${mapStage.clientWidth} ${mapStage.clientHeight}`);
  mapJ = j;
}
// strands draw as the trail's reading line passes them; an undrawn stroke still shows its round cap, so it hides until it has length
const reading = box => reduce ? 1e9 : innerHeight*.64 - box.getBoundingClientRect().top;
const along = (read, a, b) => cl((read - a)/(b - a));
const setDraw = (path, v) => { path.style.setProperty('--p', v.toFixed(3)); path.style.visibility = v > .002 ? '' : 'hidden'; };
// ease a drawn share toward its target the way the trail does; true while still moving
const chase = (o, k, to) => { o[k] = reduce || Math.abs(to - o[k]) < .002 ? to : o[k] + (to - o[k])*.2; return o[k] !== to; };
// one continuous stroke: the four strands draw out together once the line before them has arrived at the junction (a short draw, finished with the fork still
// in view, never scrubbed), and the chosen leg then follows the reading line down
function forkFrame(){
  const read = reading(shelf), open = reduce || !forkTrail || forkTrail.len - forkTrail.shown < 1.5;
  let moving = false;
  FORK.forEach(s => {
    moving = chase(s, 'o', open ? 1 : 0) || moving;
    moving = chase(s, 'b', s.o > .985 ? along(read, s.q.y, forkG.y) : 0) || moving;
    setDraw(s.out, s.o); setDraw(s.back, s.b); s.btn.classList.toggle('lit', s.o > .97);
  });
  return moving;
}
// the same, mirrored: the line comes down the gutter to the convergence, then the strands grow out of it to their columns
// (a strand's path runs column to junction, so a negative offset reveals it from the junction end)
const GROW = 180;
function mapFrame(){
  const r = mapEl.getBoundingClientRect(), vh = innerHeight, hold = mapEl.offsetHeight - mapStage.offsetHeight;
  let tip = reduce ? 1e9 : vh*.64 - r.top;
  // pinned, the hold is spent drawing: the tip runs on through the convergence and the growth of the strands
  if (!reduce && mapEl.classList.contains('pinned') && r.top < 0) tip = vh*.64 + (mapJ.y + GROW - vh*.64)*cl(-r.top/(hold*.6));
  let moving = chase(mapT, 'p', along(tip, 0, mapJ.y));
  setDraw(mapTrunk, mapT.p);
  MAP.forEach(m => {
    moving = chase(m, 'p', mapT.p > .985 ? along(tip, mapJ.y, mapJ.y + GROW) : 0) || moving;
    [m.solid, m.reveal].forEach(p => setDraw(p, m.p));
    m.btn.classList.toggle('lit', m.p > .97);
  });
  return moving;
}

// hover or focus: that strand thickens, the others recede, and the top card of its stack develops
function hot(cid){
  FORK.forEach(s => [s.btn, s.g].forEach(el => { el.classList.toggle('hot', s.c.id === cid); el.classList.toggle('dim', !!cid && s.c.id !== cid); }));
}
cols.addEventListener('pointerover', e => { const b = e.target.closest('.fk'); if (b) hot(b.dataset.col); });
cols.addEventListener('pointerleave', () => hot(null));
cols.addEventListener('focusin', e => hot(e.target.closest('.fk').dataset.col));
cols.addEventListener('focusout', () => hot(null));

function paintMap(){
  MAP.forEach(m => {
    const on = explored.has(m.c.id);
    m.btn.classList.toggle('done', on); m.solid.style.display = on ? '' : 'none'; m.dash.style.display = on ? 'none' : '';
    m.btn.setAttribute('aria-label', `${m.c.n}, ${m.c.items.length} ${m.c.unit}, ${on ? 'explored' : 'not explored yet'}`);
  });
  mapK.textContent = `${explored.size} of ${COLS.length} explored`;
}
// a collection counts once its last item has been shown
function markExplored(cid){ if (!explored.has(cid)){ explored.add(cid); paintMap(); } }
paintMap();
selectCol('hardware', false);

const ARCH = [
 ['Beyond Presence','Creator and call platforms, owned end to end. Joined at pre-seed.','Now'],
 ['NPC Filter','Flags likely AI-written posts. Built overnight on Cloudflare and Clef.','Live'],
 ['Yolk','My own AI device. Makes my German phone calls.','Waitlist'],
 ['TARS','A 3D-printed desk robot running my avatar locally.','Prototype'],
 ['Vorsprech','The spoken German medical exam, scored against the rubric.','Pilot customers'],
 ['Slaptastic','A product photo in, creator-style ads out.','Live'],
 ['myClosr','Live coaching during sales calls.','Live'],
 ['RoomRush','50 signups in the first 10 minutes, then stopped.','Stopped'],
 ['reels-in-code','A Claude skill that takes an idea to a finished reel.','Open source'],
 ['LiveKit JS plugin','Beyond Presence avatars in LiveKit web apps.','Open source'],
 ['n8n workflows','Free workflows for using Beyond Presence avatars.','Free'],
 ['Beyond Presence n8n node','The only verified n8n integration in the AI avatar category.','Published'],
 ['cureVision','Custom software on custom hardware, ML on the device.','Product'],
 ['Keyhole','Legacy platform components rebuilt in React.','Product'],
 ['CodeJunkie','Co-founded and ran as CTO. 25 people.','Company']];
$('#archList').innerHTML = ARCH.map(a => `<li><em>${esc(a[2])}</em><b>${esc(a[0])}</b><span>${esc(a[1])}</span></li>`).join('');

/* ================= TRAIL ================= */
function pos(el){ const r = el.getBoundingClientRect(), m = main.getBoundingClientRect(); return {x: r.left - m.left + r.width/2, y: r.top - m.top + r.height/2}; }
function visible(el){ return el.offsetParent !== null || !!el.closest('.top'); }
const f1 = n => n.toFixed(1);
const phone = () => innerWidth <= 760;
let nodes = [], trails = [];
function phonePoints(pts){
  // a living line: it swings across the page in the empty bands between sections, and sways in the gutter between nodes
  const x0 = parseFloat(getComputedStyle($('main .wrap')).paddingLeft) - 24;
  pts = pts.filter(p => !p.el.closest('.top'));
  // data-keep: the closer's loop keeps its own shape on phones too
  const norm = pts.map(p => p.el.hasAttribute('data-keep') ? {...p, keep:true} : (p.el.classList.contains('wm') || p.el.classList.contains('pen')) ? {...p, x:x0 + Math.min(p.x - x0, 70), swing:true} : {x:x0, y:p.y, el:p.el, vert:p.vert, vn:p.vn, cut:p.cut, arc:p.arc});
  norm.unshift({x:x0, y: pos($('.hero .kicker')).y - 6, vert:true});
  if (norm.length < 2) return norm;
  // a swing is a lobe, not a spike: it leaves and returns to the gutter over a long run, through a halfway point
  const lobe = (p, side, gap) => { const A = p.x - x0, d = Math.min(80, gap*.5); return side < 0 ? [{x:x0, y:p.y - d}, {x:x0 + A*.75, y:p.y - d/2}] : [{x:x0 + A*.75, y:p.y + d/2}, {x:x0, y:p.y + d}]; };
  const out = [norm[0]]; let alt = 1;
  for (let i=1;i<norm.length;i++){
    const a = norm[i-1], b = norm[i], gap = b.y - a.y;
    if (a.keep || b.keep){ out.push(b); continue; }
    if (b.swing){ if (gap > 90) out.push(...lobe(b, -1, gap)); out.push(b); continue; }
    if (a.swing){ if (gap > 90) out.push(...lobe(a, 1, gap)); out.push(b); continue; }
    if (gap > 110 && !(a.vn && b.vert) && !a.cut){ out.push({x: x0 + alt*11, y: a.y + gap*.5}); alt = -alt; }
    out.push(b);
  }
  return out;
}
function makeTrail(paths, pts){
  // drawn by hand: every stretch between waypoints bows a little; long gutter runs bow away from the text
  const W = main.clientWidth, away = (m, n) => Math.abs(n.x) > .85 ? (m.x < W/2 ? (n.x > 0 ? -1 : 1) : (n.x > 0 ? 1 : -1)) : 0;
  const d = pts.length > 1 ? handDrawn(smooth(pts), {anchors: pts, seed: pts.length, side: away}) : '';
  paths.forEach(p => p.setAttribute('d', d));
  const len = d ? (paths[0].getTotalLength() || 0) : 0;
  const N = Math.max(200, Math.round(len/6)), step = len ? len/N : 1, maxY = [];
  let mx = -1e9; if (len) for (let i=0;i<=N;i++){ mx = Math.max(mx, paths[0].getPointAtLength(i*step).y); maxY.push(mx); }
  paths.forEach(p => p.style.strokeDasharray = `${len} ${len}`);
  const prev = trails.find(t => t.paths[0] === paths[0]);
  // data-arc on a segment's first point: it draws along its own length over that many px of scroll (a loop doubles back, so depth cannot pace it)
  return {paths, len, maxY, step, arc: pts[0].arc, y0: pts[0].y, first: pts[0].el, last: pts[pts.length - 1].el, shown: prev ? Math.min(prev.shown, len) : 0};
}
// the dig-in branch: leaves the knot, runs beside the open details, rejoins the trail at the end
const NS = 'http://www.w3.org/2000/svg';
function drawBranch(d, animate){
  let b = $(':scope > .dig-branch', d);
  if (!d.open){ if (b) b.remove(); return; }
  const k = $('.knot', d), e = $('.dig-end', d), dr = d.getBoundingClientRect(), kr = k.getBoundingClientRect(), er = e.getBoundingClientRect();
  const y0 = kr.top + kr.height/2 - dr.top, h = Math.max(40, er.top - dr.top - y0), w = 22;
  const fresh = !b;
  if (fresh){ b = document.createElementNS(NS, 'svg'); b.setAttribute('class', 'dig-branch'); b.setAttribute('aria-hidden', 'true'); b.appendChild(document.createElementNS(NS, 'path')); d.appendChild(b); }
  b.style.top = y0 + 'px'; b.style.height = h + 'px'; b.setAttribute('viewBox', `0 0 30 ${f1(h)}`);
  const p = $('path', b), c = Math.min(28, h/4);
  p.setAttribute('d', `M0.5 0 C0.5 ${f1(c*.7)} ${w} ${f1(c*.35)} ${w} ${f1(c)} L${w} ${f1(h - c)} C${w} ${f1(h - c*.35)} 0.5 ${f1(h - c*.7)} 0.5 ${f1(h)}`);
  const l = p.getTotalLength(); p.style.strokeDasharray = `${l} ${l}`;
  if (fresh && animate && !reduce){ p.style.transition = 'none'; p.style.strokeDashoffset = l; p.getBoundingClientRect(); p.style.transition = ''; requestAnimationFrame(() => p.style.strokeDashoffset = 0); }
  else p.style.strokeDashoffset = 0;
}
// the trail can pause (data-cut) while it becomes something else, then pick up again
const PAIRS = [[pMain, pNow]];
function pair(i){ while (PAIRS.length <= i){ const a = pMain.cloneNode(), b = pNow.cloneNode(); a.removeAttribute('id'); b.removeAttribute('id'); svg.appendChild(a); svg.appendChild(b); PAIRS.push([a, b]); } return PAIRS[i]; }
let heroFloor = 0, heroLen = 0, heroT = reduce ? 1 : 0;
// on arrival the hero line draws itself, at a hand's pace, until it reaches the pen
(() => {
  if (reduce){ const s = document.querySelector('.hero .s-draw'); s && s.classList.add('arrived'); return; }
  let seen = false; try { seen = sessionStorage.getItem('intro-seen') === '1'; } catch(_) {}
  const delay = seen ? 250 : 650, dur = seen ? 1700 : 2600;
  const ease2 = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2;
  let t0 = 0, go = false;
  // start once the page has settled, so the stroke is seen from its first mark
  const begin = () => { if (go) return; go = true; requestAnimationFrame(tick); };
  const tick = ts => { if (!t0) t0 = ts + delay; const k = Math.max(0, Math.min(1, (ts - t0)/dur)); heroT = ease2(k);
    if (typeof req === 'function') req(); if (k < 1) requestAnimationFrame(tick); else { const s = document.querySelector('.hero .s-draw'); s && s.classList.add('arrived'); } };
  // the first-visit loader holds the stage; the line starts once it lifts
  (window.loaderDone || Promise.resolve()).then(() => {
    if (document.readyState === 'complete') begin(); else { addEventListener('load', begin, {once:true}); setTimeout(begin, 1800); }
  });
})();
// 03: what the platform runs, one screen at a time. It plays through on its own;
// a click takes over, and it picks up again after a while
(() => {
  const tabs = $$('.n3-tabs [role=tab]'); if (!tabs.length) return;
  const STEP = 5000, win = $('#mA'), bar = $('.n3-tabs');
  let i = 0, timer = 0, resume = 0, seen = false, hold = false;
  const show = (k, focus) => {
    i = (k + tabs.length) % tabs.length;
    tabs.forEach((t, j) => { const on = j === i, pane = $('#' + t.getAttribute('aria-controls'));
      t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; pane.hidden = !on; pane.classList.toggle('on', on);
      const v = $('video', pane); if (v){ if (on && !reduce){ v.currentTime = 0; v.play().catch(() => {}); } else v.pause(); } });
    if (focus) tabs[i].focus();
    // restart the progress bar under the active tab
    bar.classList.remove('run'); void bar.offsetWidth; if (timer) bar.classList.add('run');
  };
  const stop = () => { clearInterval(timer); timer = 0; bar.classList.remove('run'); };
  const start = () => { if (reduce || timer || !seen || hold) return; timer = setInterval(() => show(i + 1), STEP); bar.classList.add('run'); };
  const takeOver = () => { stop(); clearTimeout(resume); resume = setTimeout(start, 12000); };
  tabs.forEach((t, j) => { t.addEventListener('click', () => { takeOver(); show(j); });
    t.addEventListener('keydown', e => { const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (d){ e.preventDefault(); takeOver(); show(i + d, true); } }); });
  [win, bar].forEach(el => { el.addEventListener('pointerenter', () => { hold = true; stop(); }); el.addEventListener('pointerleave', () => { hold = false; start(); }); });
  bar.style.setProperty('--step', STEP + 'ms');
  new IntersectionObserver(es => es.forEach(e => { seen = e.isIntersecting; if (seen) start(); else stop(); }), {threshold:.2}).observe(win);
})();

// every fold on the page opens and closes with a slide instead of a jump
function slideDetails(d, open){
  if (d._anim){ d._anim.cancel(); d._anim = null; }
  if (reduce){ d.open = open; return; }
  const sum = d.querySelector(':scope > summary'), cs = getComputedStyle(d);
  const shut = () => sum.getBoundingClientRect().bottom - d.getBoundingClientRect().top + parseFloat(cs.paddingBottom) + parseFloat(cs.borderBottomWidth);
  const from = d.offsetHeight;
  if (open) d.open = true;
  const to = open ? d.offsetHeight : shut();
  if (Math.abs(to - from) < 2){ if (!open) d.open = false; return; }
  d.style.overflowX = 'visible'; d.style.overflowY = 'clip';
  if (!CSS.supports('overflow-y', 'clip')) d.style.overflow = 'hidden';
  const dur = Math.min(620, Math.max(320, Math.abs(to - from)*.7));
  d._dir = open;
  const anim = d._anim = d.animate({height:[from + 'px', to + 'px']}, {duration:dur, easing:'cubic-bezier(.22,.7,.2,1)'});
  if (open) [...d.children].filter(c => c !== sum && !c.matches('.way,svg')).forEach(c => c.animate({opacity:[0, 1], transform:['translateY(10px)', 'none']}, {duration:dur*.9, delay:dur*.12, easing:'ease-out', fill:'backwards'}));
  anim.onfinish = anim.oncancel = () => {
    d.style.overflow = d.style.overflowX = d.style.overflowY = '';
    if (d._anim === anim){ d._anim = null; if (!open) d.open = false; }
    requestAnimationFrame(build);
  };
}
document.addEventListener('click', e => {
  const sum = e.target.closest && e.target.closest('summary'); if (!sum) return;
  const d = sum.parentElement; if (!d || d.tagName !== 'DETAILS' || !d.matches('.role,.dig,.limb')) return;
  e.preventDefault(); slideDetails(d, !(d._anim ? d._dir : d.open));
});

// CodeJunkie role: opens in place, the trail below moves with it
$$('details.role').forEach(r => {
  r.addEventListener('toggle', () => { if (!r._anim) requestAnimationFrame(build); });
  const less = $('.role-less', r); if (less) less.addEventListener('click', () => { slideDetails(r, false); $('summary', r).focus({preventScroll:true}); const t = (r.closest('.step') || r.parentElement).getBoundingClientRect().top; if (t < 0) scrollBy({top:t - 90, behavior: reduce ? 'auto' : 'smooth'}); });
});
function build(){
  layoutStage(); layoutFork(); layoutMap(); layoutPeak();
  const pen = $('.hero .pen'); heroFloor = pen && visible(pen) ? pos(pen).y + 2 : 0;
  const penPt = pen && visible(pen) ? pos(pen) : null;
  // collapse the trail first, or its own old height keeps main tall after content shrinks
  svg.style.height = '0';
  const H = main.scrollHeight, W = main.clientWidth;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.style.height = H+'px';
  let pts = $$('[data-o]').filter(visible).map(el => ({...pos(el), el, o:+el.dataset.o, arc:+el.dataset.arc || 0, vert: el.hasAttribute('data-v'), vn: el.hasAttribute('data-vn'), cut: el.hasAttribute('data-cut'), free: el.hasAttribute('data-free')})).sort((a,b) => a.o - b.o);
  if (phone()) pts = phonePoints(pts);
  const segs = []; let cur = [];
  pts.forEach(p => { cur.push(p); if (p.cut){ segs.push(cur); cur = []; } });
  if (cur.length) segs.push(cur);
  trails = segs.map((sg, i) => makeTrail(pair(i), sg));
  forkTrail = trails[segs.findIndex(sg => sg[sg.length - 1].el === $('.rail-in'))];
  // the paper plane flies along the line's own heading at its end
  const tail = $('.dot.tail'), tt = trails[segs.findIndex(sg => sg[sg.length - 1].el === tail)];
  if (tt && tt.len){ const pth = tt.paths[0], a = pth.getPointAtLength(tt.len - 4), b = pth.getPointAtLength(tt.len); tail.style.setProperty('--ang', (Math.atan2(b.y - a.y, b.x - a.x)*180/Math.PI).toFixed(1) + 'deg'); }
  // how far along the first stroke the pen sits
  heroLen = 0;
  if (penPt && trails[0] && trails[0].len){ const t = trails[0], pth = t.paths[0]; let best = 1e9;
    for (let L = 0; L <= t.len; L += t.step){ const q = pth.getPointAtLength(L), dd = (q.x - penPt.x)**2 + (q.y - penPt.y)**2; if (dd < best){ best = dd; heroLen = L; } } }
  PAIRS.slice(segs.length).forEach(pp => pp.forEach(p => p.setAttribute('d', '')));
  // a knot on an arc trail lights when the pen arrives along the line; any other when the pen passes its depth
  nodes = $$('.dot[data-o]').filter(visible).map(el => {
    const p = pos(el), t = trails[segs.findIndex(sg => sg.some(q => q.el === el))], arc = t && t.arc;
    return {el, y: p.y, t: arc ? t : null, L: arc ? lengthAt(t, p) : 0};
  });
  $$('details.dig').forEach(d => drawBranch(d, false));
  const nb = $('#nowBg'), r = nb.getBoundingClientRect(), c = pos(nb);
  const rect = $('#nowRect'); rect.setAttribute('y', c.y - r.height/2); rect.setAttribute('width', W); rect.setAttribute('height', r.height);
  frame();
}
// how far along the trail the point nearest to pt lies
function lengthAt(t, pt){
  let best = 1e9, at = 0;
  for (let L = 0; L <= t.len; L += t.step){ const q = t.paths[0].getPointAtLength(L), d = (q.x - pt.x)**2 + (q.y - pt.y)**2; if (d < best){ best = d; at = L; } }
  return at;
}
function drawnLength(t, penY){ const a = t.maxY; if (!a.length || a[0] > penY) return 0; let lo=0, hi=a.length-1; while (lo<hi){ const mm=(lo+hi+1)>>1; if (a[mm] <= penY) lo=mm; else hi=mm-1; } return lo*t.step; }
document.addEventListener('toggle', e => {
  const d = e.target; if (!d.matches || !d.matches('details.dig')) return;
  requestAnimationFrame(() => { drawBranch(d, true); if (!d._anim) build(); });
}, true);

/* ================= THE PEAK: the line breathes through the numbers ================= */
const peak = $('#peak'), waveLine = $('#waveLine');
let PK = null;
function layoutPeak(){
  if (!peak) return;
  const st = $('.peak-stage', peak), sr = st.getBoundingClientRect(), W = st.clientWidth, H = st.clientHeight;
  const a = $('.peak-in', peak).getBoundingClientRect(), b = $('.peak-out', peak).getBoundingClientRect();
  const xa = a.left + a.width/2 - sr.left, xb = b.left + b.width/2 - sr.left, f = n => n.toFixed(1);
  const ns = $$('.peak-n', peak);
  let d = '';
  if (phone()){
    // phones: the trail keeps to the gutter and sways gently past a column of numbers
    const x0 = xb, A = 10, N = 80;
    for (let i = 0; i <= N; i++){ const u = i/N, y = H*u, x = x0 + A*Math.sin(u*Math.PI*3)*Math.min(1, u/.12, (1-u)/.12); d += `${i ? 'L' : 'M'}${f(x)} ${f(y)}`; }
    ns.forEach(n => { n.style.left = ''; n.style.top = ''; });
  } else {
    // desktop: in from the right margin, three soft swells right to left, out to the left gutter
    const xS = Math.max(xb + 70, W*.06), xE = Math.min(W - 110, xa - 240), y0 = H*.5, A = Math.min(88, H*.2), N = 160;
    const Y = u => y0 - A*Math.cos(2*Math.PI*(u - .2)/.6);
    const sl = Math.abs(A*2*Math.PI/.6*Math.sin(2*Math.PI*(0 - .2)/.6)/(xE - xS)), kE = Math.min(110, (xa - xE)*.6);
    d = `M${f(xa)} 0 C${f(xa)} ${f(H*.45)} ${f(xE + kE)} ${f(Y(1) + kE*sl)} ${f(xE)} ${f(Y(1))}`;
    for (let i = N; i >= 0; i--){ const u = i/N; d += ` L${f(xS + (xE - xS)*u)} ${f(Y(u))}`; }
    // leave along the swell's own slope, then settle vertical into the gutter
    const k = Math.min(60, (xS - xb)*.6);
    d += ` C${f(xS - k)} ${f(Y(0) + k*sl)} ${f(xb)} ${f(Math.max(Y(0) + k*sl + 20, H*.72))} ${f(xb)} ${f(H)}`;
    ns.forEach(n => { const u = +n.dataset.u, crest = Math.cos(2*Math.PI*(u - .2)/.6) > 0, h = n.offsetHeight;
      n.style.left = f(xS + (xE - xS)*u) + 'px';
      n.style.top = f(crest ? Y(u) + A*.95 : Y(u) - h - A*.95) + 'px'; });
  }
  $('#wave').setAttribute('viewBox', `0 0 ${W} ${H}`);
  waveLine.setAttribute('d', d);
  PK = {W, H};
}
// the wave is the same pen: it waits until the stroke coming down into it has arrived, then draws as the reading point passes
let waveP = 0;
const arrived = t => !t || reduce || t.len - t.shown < 1.5;
function peakFrame(){
  if (!PK) return false;
  const r = peak.getBoundingClientRect(), vh = innerHeight, into = trails.find(t => t.last && t.last.classList.contains('peak-in'));
  const target = reduce ? 1 : arrived(into) ? cl((vh*.64 - r.top)/r.height) : 0;
  waveP = reduce || Math.abs(target - waveP) < .002 ? target : waveP + (target - waveP)*.2;
  waveLine.style.strokeDashoffset = (1 - waveP).toFixed(4);
  waveLine.style.visibility = waveP > .002 ? '' : 'hidden';
  return waveP !== target;
}
/* ================= SCROLL ================= */
const nowSec = $('#now'), nowBg = $('#nowBg');
const cl = (v,a=0,b=1)=>Math.max(a,Math.min(b,v)), seg=(p,a,b)=>cl((p-a)/(b-a)), ease=t=>1-Math.pow(1-t,3);
let ticking = false;
function frame(){
  ticking = false;
  const mTop = main.getBoundingClientRect().top + scrollY;
  const readY = scrollY + innerHeight*0.64 - mTop;
  // at the very bottom the line has reached everything, however short the page ends
  const atEnd = scrollY + innerHeight >= document.documentElement.scrollHeight - 4;
  const penY = atEnd ? 1e9 : Math.max(readY, heroT >= 1 ? heroFloor : 0);
  let busy = heroT < 1;
  trails.forEach((t, j) => {
    // the stretch into the fork reads ahead, so the strands can finish drawing while the fork is still well in view
    let target = reduce ? t.len : t.arc ? t.len*cl((penY - t.y0)/t.arc) : drawnLength(t, t === forkTrail ? penY + innerHeight*.2 : penY);
    // until the pen is reached, the hero line leads; scrolling takes over at once
    const intro = heroT < 1 && heroLen && scrollY < 40, drawingIn = intro && j === 0;
    if (drawingIn) target = heroLen*heroT; else if (intro) target = 0;
    // one pen: a stretch starts only once the one before it has arrived where it begins (after the wave, once the wave has)
    if (!reduce && j && (!arrived(trails[j - 1]) || (t.first && t.first.classList.contains('peak-out') && waveP < .995))) target = 0;
    // arrived, still at the top: the stroke waits at the pen with its spark, and the first scroll carries it on into chapter 01
    else if (!reduce && heroLen && scrollY < 24) target = j === 0 ? Math.min(target, heroLen) : 0;
    t.shown = reduce || drawingIn ? target : t.shown + (target - t.shown)*0.2;
    if (Math.abs(target - t.shown) > 0.5) busy = true;
    // an undrawn stroke still shows its round cap as a dot, so hide it until it has length
    t.paths.forEach(p => { p.style.strokeDashoffset = (t.len - t.shown).toFixed(1); p.style.visibility = t.shown > 1 ? '' : 'hidden'; });
  });
  nodes.forEach(n => n.el.classList.toggle('hit', reduce || (n.t ? n.t.shown >= n.L - 2 : n.y <= penY)));
  reveal.check(atEnd);

  // present-day chapter opens out
  const vh = innerHeight, r = nowSec.getBoundingClientRect();
  const p = reduce ? 1 : cl((vh - r.top)/(vh*0.95));
  const o = ease(seg(p, 0, .55));
  nowBg.style.clipPath = `inset(${((1-o)*3).toFixed(2)}% ${((1-o)*6).toFixed(2)}% 0 ${((1-o)*6).toFixed(2)}% round ${((1-o)*28).toFixed(1)}px)`;

  stageFrame();
  if (peakFrame() | forkFrame() | mapFrame()) busy = true;
  $('#fab').classList.toggle('show', scrollY > vh*0.7);
  if (!reduce && busy) req();
}
function req(){ if (!ticking){ ticking = true; requestAnimationFrame(frame); } }
addEventListener('scroll', req, {passive:true});
let rz; const rebuild = () => { clearTimeout(rz); rz = setTimeout(build, 120); };
addEventListener('resize', rebuild);
new ResizeObserver(rebuild).observe(main);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
addEventListener('load', build);

/* ================= EVENTS ================= */
const go = sel => { const el = $(sel); if (el) el.scrollIntoView({behavior: reduce?'auto':'smooth', block:'start'}); };
document.addEventListener('click', e => {
  const t = e.target.closest('button, a'); if (!t) return;
  if (t.dataset.open){ openD(t.dataset.open); return; }
  if (t.hasAttribute('data-close')){ closeD(true); return; }
});
$('#scrim').addEventListener('click', () => closeD(true));
addEventListener('keydown', e => { if (e.key === 'Escape' && $('.drawer.open')) closeD(true); });

$('#nl').addEventListener('submit', e => {
  e.preventDefault(); const v = $('#nl-email').value.trim();
  $('#nl-msg').textContent = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? 'Thanks. Sign-up isn’t connected yet, so your email hasn’t been saved.' : 'That email looks off. Check it and try again.';
});
$('#book').addEventListener('click', () => { $('#book-msg').textContent = 'The booking link is coming soon. Until then, email me at mshehrozsajjad@gmail.com.'; });
// the "copied!" note is drawn by the micro layer below; only a failed copy changes the hint
$('#copy').addEventListener('click', async () => { try { await navigator.clipboard.writeText('mshehrozsajjad@gmail.com'); } catch(_) { const h = $('#copy-hint'); h.textContent = 'select it'; setTimeout(() => h.textContent = 'tap to copy', 1800); } });

/* drawers */
const scrim = $('#scrim'); let lastFocus = null;
function openD(id){ if (id === 'agent' && !reduce){ const v = $('#twinVideo'); v && v.play().catch(() => {}); } lastFocus = document.activeElement; closeD(false); const d = $('#'+id); d.classList.add('open'); d.setAttribute('aria-hidden','false'); scrim.classList.add('open'); main.inert = true; $('footer').inert = true; $('#fab').inert = true; document.body.style.overflow = 'hidden'; setTimeout(() => (id==='agent' ? $('#askInput') : $('.x', d)).focus(), 60); }
function closeD(restore){ $$('.drawer.open').forEach(d => { d.classList.remove('open'); d.setAttribute('aria-hidden','true'); }); scrim.classList.remove('open'); main.inert = false; $('footer').inert = false; $('#fab').inert = false; document.body.style.overflow = ''; if (restore && lastFocus && lastFocus.focus) lastFocus.focus(); }
addEventListener('keydown', e => {
  const drawer = $('.drawer.open');
  if (!drawer || e.key !== 'Tab') return;
  const controls = $$('button, input, a[href]', drawer).filter(el => !el.disabled && el.offsetParent !== null);
  const first = controls[0], last = controls[controls.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});

/* the AI self answers from confirmed notes and takes the visitor to the right place */
const A = {
  now:{t:"I own the creator and call platforms at Beyond Presence, the layer behind our real-time avatars and Managed Agents. I built the integration that sends avatars into Zoom and Teams calls. Lately I'm also automating our go-to-market with n8n and AI agents in Slack.", go:['Show me', () => go('#now')]},
  make:{t:"Yolk, my own AI device with an e-paper screen and a dial, which makes my German phone calls. And TARS, a 3D-printed desk robot running my avatar locally.", go:['Show me', () => labOpen('hardware','yolk')]},
  saas:{t:"myClosr, Slaptastic, Vorsprech and NPC Filter are live. RoomRush got 50 signups in its first 10 minutes, but the unit economics didn't hold, so I stopped it.", go:['Open the lab', () => labOpen('software','roomrush')]},
  oss:{t:"reels-in-code, the LiveKit JS plugin for Beyond Presence avatars, and free n8n workflows for using Beyond Presence.", go:['Show me', () => labOpen('opensource','reels')]},
  story:{t:"Design work in my first semester, then my own apps, then CodeJunkie, which I co-founded and ran as CTO with 25 people. Then product work at Keyhole, a top German car company and cureVision, and Beyond Presence at pre-seed, before there was a product.", go:['Walk the story', () => go('#story')]},
  hire:{t:"Book a call or email me at mshehrozsajjad@gmail.com. Tell me what you're building and where it's stuck.", go:['Book a call', () => go('#contact')]},
  none:{t:"I don't know that one, and I only answer from what I've confirmed. Email me at mshehrozsajjad@gmail.com.", go:null}
};
function route(q){
  const s = q.toLowerCase();
  if (/(open source|open-source|github|plugin|reels-in-code|free|n8n)/.test(s)) return 'oss';
  if (/(yolk|tars|robot|hardware|device|hold|physical)/.test(s)) return 'make';
  if (/(vorsprech|closr|roomrush|slaptastic|npc|saas|tool|live|app|product)/.test(s)) return 'saas';
  if (/(now|current|beyond|working on|today|avatar|platform)/.test(s)) return 'now';
  if (/(story|background|career|codejunkie|keyhole|curevision|car|how did|master)/.test(s)) return 'story';
  if (/(hire|work together|collab|email|contact|job|call|book)/.test(s)) return 'hire';
  return 'none';
}
let gid = 0;
function answer(q, key){
  const a = A[key], id = 'g'+(++gid);
  $('#log').insertAdjacentHTML('beforeend', `<p class="me"></p><div class="ai"><p></p>${a.go ? `<button type="button" class="act" id="${id}">${a.go[0]} ${AR('right')}</button>` : ''}</div>`);
  const ms = $$('#log .me'), as = $$('#log .ai p'); ms[ms.length-1].textContent = q; as[as.length-1].textContent = a.t;
  if (a.go) $('#'+id).addEventListener('click', () => { closeD(false); setTimeout(a.go[1], 250); });
  $('#log').scrollTop = 1e6;
}
$$('.q').forEach(b => b.addEventListener('click', () => answer(b.textContent, b.dataset.q)));
$('#askForm').addEventListener('submit', e => { e.preventDefault(); const i = $('#askInput'), v = i.value.trim(); if (!v) return; answer(v, route(v)); i.value = ''; });

$('#twinSound').addEventListener('click', e => { const v = $('#twinVideo'), on = v.muted; v.muted = !on; if (on){ v.currentTime = 0; v.play().catch(() => {}); } e.currentTarget.setAttribute('aria-pressed', String(on)); e.currentTarget.textContent = on ? 'Sound off' : 'Sound on'; });
$('#heroSound').addEventListener('click', e => { const v = $('#heroTwin'), b = e.currentTarget, on = v.muted; v.muted = !on; if (on){ v.currentTime = 0; v.play().catch(() => {}); } b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-label', on ? 'Turn sound off' : 'Turn sound on'); });
if (reduce) $$('video[autoplay]').forEach(v => { v.removeAttribute('autoplay'); v.pause(); });

/* theme */
try { const savedTheme = localStorage.getItem('site-theme'); if (['light','dark'].includes(savedTheme)) document.documentElement.dataset.theme = savedTheme; } catch (_) {}
const th = () => document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
const label = () => $('#theme').textContent = th()==='dark' ? 'Light' : 'Dark';
$('#theme').addEventListener('click', () => { document.documentElement.dataset.theme = th()==='dark' ? 'light' : 'dark'; try { localStorage.setItem('site-theme', th()); } catch (_) {} label(); });
label();

build();
})();
/* ===== Micro layer: marker doodles, margin notes and small reactions =====
   Lives beside the main script and only watches the DOM, so the journey logic stays untouched. */
(() => {
"use strict";
const $ = (s, r=document) => r.querySelector(s), $$ = (s, r=document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const NS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, attrs={}) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };

/* ---------- marker doodles, drawn when they enter view ---------- */
const SHAPES = {
  underline:  {box:'left:-3%;width:106%;bottom:-.26em;height:.42em', vb:'0 0 100 20', d:['M2 13 C 18 8, 34 15, 52 11 S 84 8, 98 12']},
  underline2: {box:'left:-4%;width:108%;bottom:-.34em;height:.5em', vb:'0 0 100 24', d:['M2 10 C 22 5, 48 14, 70 8 S 92 7, 98 9','M8 18 C 30 14, 62 20, 94 15']}
};
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  setTimeout(() => e.target.classList.add('drawn'), 180); io.unobserve(e.target);
}), {rootMargin:'0px 0px -20% 0px'});
// shapes are authored in a normalised box, then redrawn at the doodle's real pixel size,
// so the stroke keeps an even width and the draw-on dash stays continuous
function fit(svg, s){
  const r = svg.getBoundingClientRect(); if (!r.width || !r.height) return;
  const [,, vw, vh] = s.vb.split(' ').map(Number), sx = r.width/vw, sy = r.height/vh;
  svg.setAttribute('viewBox', `0 0 ${r.width.toFixed(1)} ${r.height.toFixed(1)}`);
  $$('path', svg).forEach((p, i) => { let k = 0; p.setAttribute('d', s.d[i].replace(/-?\d*\.?\d+/g, n => (k++ % 2 ? +n*sy : +n*sx).toFixed(1))); });
}
const refit = new ResizeObserver(es => es.forEach(e => { const svg = $(':scope > .dd-svg', e.target); if (svg) fit(svg, SHAPES[e.target.dataset.doodle]); }));
function doodle(el){
  if (el.dataset.ddDone) return; el.dataset.ddDone = '1';
  const s = SHAPES[el.dataset.doodle]; if (!s) return;
  const svg = svgEl('svg', {class:'dd-svg', 'aria-hidden':'true'});
  svg.style.cssText = s.box;
  s.d.forEach((d, i) => { const p = svgEl('path', {d, pathLength:'1'}); p.style.setProperty('--d', (i*0.3)+'s'); svg.appendChild(p); });
  el.appendChild(svg); fit(svg, s); refit.observe(el);
  if (reduce) el.classList.add('drawn');
  else if (!el.hasAttribute('data-manual')) io.observe(el);
}
const scan = () => $$('.dd[data-doodle]').forEach(doodle);

/* ---------- sparkle bursts ---------- */
function burst(host, x, y, rot=0){
  if (reduce || !host) return;
  const b = svgEl('svg', {class:'burst', viewBox:'0 0 34 34', 'aria-hidden':'true'});
  b.style.left = x+'px'; b.style.top = y+'px'; b.style.setProperty('--r', rot+'deg');
  ['M17 11 L17 2','M23 14 L30 8','M11 14 L4 8'].forEach((d, i) => { const p = svgEl('path', {d, pathLength:'1'}); p.style.animationDelay = (i*0.05)+'s'; b.appendChild(p); });
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
  host.appendChild(b); setTimeout(() => b.remove(), 1200);
}

/* ---------- thinking dots, copy note ---------- */
const think = $('.s-think');
if (think) think.insertAdjacentHTML('afterend', '<span class="think-dots" aria-hidden="true"><i></i><i></i><i></i></span>');
const copy = $('#copy');
if (copy) copy.addEventListener('click', () => {
  const n = document.createElement('span'); n.className = 'copied-note'; n.textContent = 'copied!';
  const host = copy.parentElement; if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
  n.style.left = (copy.offsetLeft + copy.offsetWidth/2)+'px'; n.style.top = copy.offsetTop+'px';
  host.appendChild(n); burst(host, copy.offsetLeft + copy.offsetWidth, copy.offsetTop, 30); setTimeout(() => n.remove(), 1500);
});

/* ---------- hero intro: a labelled cursor writes the headline, once per visit ---------- */
const h1 = $('#h1'), heroCopy = h1 && h1.parentElement;
let introSeen = false; try { introSeen = sessionStorage.getItem('intro-seen') === '1'; } catch(_) {}
if (h1 && !reduce && !introSeen){
  splitWords(h1);
  const words = $$('.w', h1), hero = $('.hero');
  hero.classList.add('intro-run');
  const cur = document.createElement('div'); cur.className = 'intro-cursor'; cur.setAttribute('aria-hidden', 'true');
  cur.innerHTML = '<svg viewBox="0 0 18 20"><path d="M2 1 L16 10 L9.5 11.5 L6 18 Z"/></svg><span>Shehroz</span>';
  heroCopy.appendChild(cur);
  const timers = []; let done = false;
  const place = w => { const r = w.getBoundingClientRect(), c = heroCopy.getBoundingClientRect(); cur.style.transform = `translate(${(r.right - c.left - 4).toFixed(0)}px, ${(r.bottom - c.top - 14).toFixed(0)}px)`; };
  const finish = () => {
    if (done) return; done = true; timers.forEach(clearTimeout);
    words.forEach(w => w.classList.add('on')); $$('.hero .dd').forEach(d => d.classList.add('drawn'));
    cur.style.opacity = '0'; setTimeout(() => { cur.remove(); hero.classList.remove('intro-run'); }, 400);
    try { sessionStorage.setItem('intro-seen', '1'); } catch(_) {}
    ['wheel','keydown','pointerdown','touchstart'].forEach(ev => removeEventListener(ev, finish));
  };
  place(words[0]); cur.style.opacity = '0';
  const end = 420 + words.length*140;
  // wait for the first-visit loader to lift, so the headline is written in front of the visitor
  (window.loaderDone || Promise.resolve()).then(() => {
    if (done) return;
    timers.push(setTimeout(() => { cur.style.opacity = '1'; }, 250));
    words.forEach((w, i) => timers.push(setTimeout(() => { w.classList.add('on'); place(w); }, 420 + i*140)));
    timers.push(setTimeout(() => $$('.hero .dd').forEach(d => d.classList.add('drawn')), end + 120));
    timers.push(setTimeout(() => { const a = $('.call-btn'); if (a){ const r = a.getBoundingClientRect(), c = heroCopy.getBoundingClientRect(); cur.style.transform = `translate(${(r.left - c.left).toFixed(0)}px, ${(r.top - c.top + 6).toFixed(0)}px)`; } }, end + 700));
    timers.push(setTimeout(finish, end + 1700));
    ['wheel','keydown','pointerdown','touchstart'].forEach(ev => addEventListener(ev, finish, {passive:true}));
  });
} else {
  $$('.hero .dd').forEach(d => d.removeAttribute('data-manual'));
}
scan();
})();
