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
   body:['Two years into building with AI, I wanted to try hardware. I 3D-printed an open-source TARS and soldered in a motion sensor, my first time holding an iron.']},
  {id:'yolk', n:'Yolk', line:'I always wanted a Pokédex, so I designed my own AI device. It makes my phone calls in German.', tip:'Waitlist open',
   label:'Launched', shot:'/assets/media/yolk-device.webp', shotAlt:'Yolk, the device', film:'/assets/media/yolk-film.mp4', poster:'/assets/media/yolk-film-poster.webp', filmLabel:'The Yolk launch film', filmBtn:'Watch the film', tall:true, a:[['Join the waitlist','https://getyolk.tech']],
   body:['When Meta open-sourced Muse Gadgets, I designed my own device around it: custom hardware, an e-paper screen and a rotary encoder that drives an AI agent.']},
  {id:'reels', n:'reels-in-code', label:'Open source', line:'A Claude skill that takes an idea to a finished reel: hooks, shots, captions, zooms, sound effects.', body:['Built with Claude and Remotion.'], a:[['GitHub','https://github.com/mshehrozsajjad/reels-in-code']], code:['reels-in-code','Claude skill · Remotion','idea → hooks → shots → captions → reel']},
  {id:'livekit', n:'LiveKit JS plugin', label:'Open source', line:'Brings Beyond Presence avatars to LiveKit web apps.', body:['Ported from the Python plugin.'], code:['LiveKit JS plugin','JavaScript · ported from Python','LiveKit web app → Beyond Presence avatar']},
  {id:'n8nflows', n:'n8n workflows', label:'Free', line:'Ready-made workflows for using Beyond Presence avatars in n8n.', code:['n8n workflows','Free · ready to import','trigger → avatar → result']},
  {id:'n8nnode', n:'Beyond Presence n8n node', label:'Published', line:'A custom node plus templates. The only verified n8n integration in the AI avatar category.', code:['Beyond Presence node','Verified on n8n','node + templates']},
  {id:'f-yolk', n:'Yolk', label:'Launch film', line:'The launch film for Yolk, made alongside its brand and website.', film:'/assets/media/yolk-film.mp4', poster:'/assets/media/yolk-film-poster.webp', filmLabel:'The Yolk launch film', tall:true},
  {id:'f-npc', n:'NPC Filter', label:'Launch film', line:'The launch film for NPC Filter.', film:'/assets/media/npc-film.mp4', poster:'/assets/media/npc-film-poster.webp', filmLabel:'The NPC Filter launch film'},
  {id:'drone', n:'Drone', label:'Drone footage', line:'A beach town from above, flown and edited by me.', film:'/assets/media/drone.mp4', poster:'/assets/media/drone-poster.webp', filmLabel:'Drone shot over a beach town'},
  {id:'photos', n:'Photos', label:'Photography', line:'A bridge from above and a lit dome, both at night.', photos:[['/assets/media/photo-bridge.webp','A bridge at night, shot from above'],['/assets/media/photo-dome.webp','A lit dome at night']]}
];
const BY = Object.fromEntries(LAB.map(w => [w.id, w]));
const COLS = [
  {id:'software', n:'Software', meta:'5 products · 4 live', items:['roomrush','myclosr','slaptastic','vorsprech','npcfilter']},
  {id:'hardware', n:'Hardware', meta:'2 builds · 1 launched', items:['yolk','tars']},
  {id:'given', n:'Given away', meta:'4 tools · all free', items:['reels','livekit','n8nflows','n8nnode']},
  {id:'films', n:'Films', meta:'2 launch films · drone · photos', items:['f-yolk','f-npc','drone','photos']}
];
const COL = Object.fromEntries(COLS.map(c => [c.id, c]));
const img = (src, alt) => `<img src="${src}" alt="${esc(alt)}" loading="lazy">`;
// the covers: a small stack of what's inside each collection
const COVERS = {
  software: `<span class="cv cv3">${img('/assets/shots/roomrush.webp','')}</span><span class="cv cv2">${img('/assets/shots/myclosr.webp','')}</span><span class="cv cv1">${img('/assets/shots/npcfilter.webp','')}</span>`,
  hardware: `<span class="cv cv3 blank"></span><span class="cv cv2 blank"></span><span class="cv cv1">${img('/assets/media/yolk-device.webp','')}</span>`,
  given: `<span class="cv cv3 blank"></span><span class="cv cv2 blank"></span><span class="cv cv1 term"><code><i>~/given-away</i>reels-in-code<br>livekit-js-plugin<br>n8n-workflows<br>n8n-node</code></span>`,
  films: `<span class="cv cv3">${img('/assets/media/photo-dome.webp','')}</span><span class="cv cv2">${img('/assets/media/npc-film-poster.webp','')}</span><span class="cv cv1">${img('/assets/media/drone-poster.webp','')}</span>`
};
$('#cols').innerHTML = COLS.map(c => `<button class="col" type="button" id="col-${c.id}" data-col="${c.id}" aria-pressed="false" aria-controls="stage">
  <span class="covers" aria-hidden="true">${COVERS[c.id]}</span>
  <span class="knot-r" aria-hidden="true"></span>
  <span class="col-n">${esc(c.n)}</span>
  <span class="col-meta">${esc(c.meta)}</span>
</button>`).join('');

const TILTS = [-2.5, 2, -1.8, 2.6, -2.2];
const video = (src, poster, label) => `<video src="${src}" poster="${poster}" muted loop playsinline preload="none"${reduce ? ' controls' : ''} aria-label="${esc(label)}"></video>`;
function mediaHTML(w){
  if (w.photos) return `<div class="m-photos">${w.photos.map(p => `<figure>${img(p[0], p[1])}</figure>`).join('')}</div>`;
  if (w.code) return `<div class="m-term" aria-hidden="true"><span class="dots"><i></i><i></i><i></i></span><code><b>${esc(w.code[0])}</b><i>${esc(w.code[1])}</i>${esc(w.code[2])}</code></div>`;
  if (w.clips) return `<div class="m-duo">${w.clips.map(c => `<figure>${video(...c)}<figcaption>${esc(c[2])}</figcaption></figure>`).join('')}</div>`;
  const vid = w.film ? video(w.film, w.poster, w.filmLabel || w.n) : '';
  if (w.shot) return `<div class="m-shot${w.tall ? ' tall' : ''}">${img(w.shot, w.shotAlt || (w.n + ' homepage'))}${w.film ? `<div class="m-film" hidden>${vid}</div>` : ''}</div>`;
  return `<div class="m-film${w.tall ? ' tall' : ''}">${vid}</div>`;
}
// one supporting sentence: the first of the body, unless the item names a better one
const support = w => w.sub || (w.body && w.body[0].split(/(?<=[.!?])\s/)[0]);
function itemHTML(w, i){
  const words = w.line.split(' '), sub = support(w), meta = [w.label, w.tip].filter(Boolean).join(' · ');
  const links = (w.a || []).map(a => `<a href="${a[1]}" target="_blank" rel="noopener">${esc(a[0])} ${AR('ne')}</a>`).join('') + (w.shot && w.film ? `<button type="button" class="it-film" aria-pressed="false">${esc(w.filmBtn)} ${AR('right')}</button>` : '');
  return `<article class="itm" data-i="${i}" data-id="${w.id}" aria-label="${esc(w.n)}" style="--nw:${words.length};--tilt:${TILTS[i % TILTS.length]}deg">
    <div class="it-card">${mediaHTML(w)}</div>
    <div class="it-text">
      <p class="it-eyebrow">${esc(w.n)}</p>
      <h3 class="it-line">${words.map((x, j) => `<span class="w" style="--w:${j}">${esc(x)}</span>`).join(' ')}</h3>
      <p class="it-meta">${esc(meta)}</p>
      ${sub ? `<p class="it-sub">${esc(sub)}</p>` : ''}
      ${links ? `<div class="it-links">${links}</div>` : ''}
    </div>
  </article>`;
}

// the stage: on desktop it pins and scrolling steps through the open collection; on phones and for reduced motion the same items simply stack
const stageW = $('#stageWrap'), stage = $('#stage'), deck = $('#deck'), stgLine = $('#stgLine'), stgDots = $('#stgDots'), stgCount = $('#stgCount'), railOut = $('.rail-out');
const pinnedMQ = matchMedia('(min-width: 761px) and (prefers-reduced-motion: no-preference)');
let colNow = null, items = [], dots = [], active = -2, mode = null;
const playIn = (box, on) => $$('video', box).forEach(v => { if (on && !reduce && !v.closest('[hidden]')) v.play().catch(() => {}); else v.pause(); });
// stacked rows reveal as they enter
const stackIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('on'); playIn(e.target, e.isIntersecting); }), {rootMargin:'0px 0px -12% 0px', threshold:.15});
function paintStage(cid){
  const c = COL[cid]; colNow = cid; mode = null;
  stageW.style.setProperty('--n', c.items.length);
  $('#stgCol').textContent = c.n;
  stgDots.innerHTML = c.items.map((id, i) => `<button type="button" aria-label="${esc(BY[id].n)}"><span></span></button>`).join('');
  deck.innerHTML = c.items.map((id, i) => itemHTML(BY[id], i)).join('');
  items = $$('.itm', deck); dots = $$('button', stgDots);
  dots.forEach((d, i) => d.addEventListener('click', () => toStep(i)));
}
function layoutStage(){
  const m = pinnedMQ.matches ? 'pinned' : 'stacked';
  // stacked, the global trail runs on through the rows; pinned, the stage draws its own stretch of it
  if (m === 'stacked') railOut.dataset.o = '20'; else delete railOut.dataset.o;
  if (m === mode) return;
  mode = m; active = -2; stackIO.disconnect();
  stageW.classList.toggle('pinned', m === 'pinned');
  items.forEach(a => { a.classList.remove('on', 'past'); playIn(a, false); });
  if (m === 'stacked' && !reduce) items.forEach(a => stackIO.observe(a));
}
function setActive(i){
  active = i;
  items.forEach((a, j) => { a.classList.toggle('on', j === i); a.classList.toggle('past', j < i); playIn(a, j === i); });
  const k = cl(i, 0, items.length - 1);
  dots.forEach((d, j) => { d.classList.toggle('on', j === k); if (j === k) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current'); });
  stgCount.textContent = `${k + 1} / ${items.length}`;
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
function selectCol(cid){
  $$('.col').forEach(b => { const on = b.dataset.col === cid; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  if (cid === colNow) return;
  playIn(deck, false); paintStage(cid); layoutStage();
  requestAnimationFrame(build);
}
window.labOpen = (cid, iid) => { closeD && closeD(false); selectCol(cid); toStep(Math.max(0, COL[cid].items.indexOf(iid))); };
$('#cols').addEventListener('click', e => { const b = e.target.closest('.col'); if (!b) return; selectCol(b.dataset.col); toStep(0); });
deck.addEventListener('click', e => {
  const f = e.target.closest('.it-film'); if (!f) return;
  const a = f.closest('.itm'), card = $('.m-shot', a), box = $('.m-film', card), v = $('video', box), on = box.hidden;
  box.hidden = !on; card.classList.toggle('playing', on);
  f.setAttribute('aria-pressed', on); f.innerHTML = `${on ? 'Back to the product' : esc(BY[a.dataset.id].filmBtn)} ${AR('right')}`;
  if (on){ v.currentTime = 0; if (!reduce) v.play().catch(() => {}); } else v.pause();
});
// tabbing into an item that isn't showing brings its step into view
deck.addEventListener('focusin', e => { const a = e.target.closest('.itm'); if (a && mode === 'pinned' && items.indexOf(a) !== active) toStep(items.indexOf(a), 'instant'); });
selectCol('hardware');

// the line arrives, runs through the four collections, turns at the edge, and comes back underneath them to the stage
const rail = $('#rail'), railLine = $('#railLine'), shelf = $('#shelf');
function layoutLimbs(){
  if (!shelf) return;
  const sr = shelf.getBoundingClientRect(), W = shelf.clientWidth, H = shelf.clientHeight, mr = main.getBoundingClientRect();
  const P = el => { const r = el.getBoundingClientRect(); return {x: r.left + r.width/2 - sr.left, y: r.top + r.height/2 - sr.top, free:true}; };
  const ks = $$('.knot-r', shelf).map(P), inn = P($('.rail-in', shelf)), out = P($('.rail-out', shelf));
  const [a, b, c, d] = ks, F = (x, y) => ({x, y, free:true});
  let pts;
  if (phone()){
    const x0 = parseFloat(getComputedStyle($('main .wrap')).paddingLeft) - 24 - (sr.left - mr.left);
    // two rows: run through the top pair, pass back between the rows, run through the bottom pair, come back underneath
    const cs = $$('.col', shelf).map(el => el.getBoundingClientRect()), g = (Math.max(cs[0].bottom, cs[1].bottom) + Math.min(cs[2].top, cs[3].top))/2 - sr.top;
    pts = [F(x0, inn.y), F(x0 + 12, a.y - 24), a, F((a.x + b.x)/2, a.y + 8), b, F(b.x + 34, b.y - 4), F(W + 12, (b.y + g)/2), F(W*.55, g), F(x0 + 6, g + 30),
           F(x0 + 4, c.y - 36), c, F((c.x + d.x)/2, c.y + 8), d, F(d.x + 34, d.y - 4), F(W + 12, (d.y + H)/2), F(W*.5, H - 14), F(x0 + 30, H - 12), F(x0, out.y), F(x0, out.y + 24)];
  } else {
    const ky = a.y;
    pts = [F(inn.x, inn.y), F(inn.x + 3, inn.y + 22), F(inn.x + 40, ky - 4), F(a.x - 80, ky + 4), a, F((a.x + b.x)/2, ky + 12), b, F((b.x + c.x)/2, ky - 10), c, F((c.x + d.x)/2, ky + 12), d,
           F(W + 18, ky + (H - ky)*.5), F(W - 50, H - 24), F(W*.5, H - 22), F(inn.x + 80, H - 22), F(out.x + 40, out.y - 12), F(out.x, out.y), F(out.x, out.y + 24)];
  }
  rail.setAttribute('viewBox', `0 0 ${W} ${H}`);
  railLine.setAttribute('d', smooth(pts));
}
function railFrame(){
  if (!shelf) return;
  const r = shelf.getBoundingClientRect(), vh = innerHeight;
  const p = reduce ? 1 : cl((vh*.75 - r.top)/(r.height + vh*.1));
  railLine.style.strokeDashoffset = (1 - p).toFixed(4);
  railLine.style.visibility = p > .002 ? '' : 'hidden';
  $$('.col', shelf).forEach((c, j) => c.classList.toggle('lit', reduce || p > .1 + j*.17));
}

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
// Catmull-Rom through the points, except where a point asks to be met vertically (data-v),
// and straight lines between stacked points (data-vn), so the line runs down the gutter beside open details
function smooth(pts){
  if (pts.length < 2) return '';
  let d = `M${f1(pts[0].x)} ${f1(pts[0].y)}`;
  for (let i=0; i<pts.length-1; i++){
    const p0 = pts[i-1]||pts[i], p1 = pts[i], p2 = pts[i+1], p3 = pts[i+2]||p2, k = 0.2, dy = p2.y - p1.y;
    if (p1.vn && p2.vert && Math.abs(p1.x - p2.x) < 2){ d += ` L${f1(p2.x)} ${f1(p2.y)}`; continue; }
    // keep every control point between the segment's ends, so a far neighbour never makes the line overshoot and loop
    const lo = Math.min(p1.y, p2.y), hi = Math.max(p1.y, p2.y), cy = y => (p1.free || p2.free) ? y : Math.max(lo, Math.min(hi, y));
    let c1, c2;
    if (true){
      // every stretch: centripetal Catmull-Rom, smooth through every point without loops or overshoot
      const dist = (a, b) => Math.max(1e-3, Math.pow(Math.hypot(b.x - a.x, b.y - a.y), .5));
      const t01 = p0 === p1 ? dist(p1, p2) : dist(p0, p1), t12 = dist(p1, p2), t23 = p3 === p2 ? dist(p1, p2) : dist(p2, p3);
      const q0 = p0 === p1 ? {x:2*p1.x - p2.x, y:2*p1.y - p2.y} : p0, q3 = p3 === p2 ? {x:2*p2.x - p1.x, y:2*p2.y - p1.y} : p3;
      const m1 = ['x','y'].map(a => (p2[a] - p1[a]) + t12*((p1[a] - q0[a])/t01 - (p2[a] - q0[a])/(t01 + t12)));
      const m2 = ['x','y'].map(a => (p2[a] - p1[a]) + t12*((q3[a] - p2[a])/t23 - (q3[a] - p1[a])/(t12 + t23)));
      c1 = {x:p1.x + m1[0]/3, y:p1.y + m1[1]/3}; c2 = {x:p2.x - m2[0]/3, y:p2.y - m2[1]/3};
      if (p1.vert) c1 = {x:p1.x, y:p1.y + dy*0.45};
      if (p2.vert) c2 = {x:p2.x, y:p2.y - dy*0.45};
    } else {
      c1 = p1.vert ? {x:p1.x, y:p1.y + dy*0.45} : {x:p1.x+(p2.x-p0.x)*k, y:cy(p1.y+(p2.y-p0.y)*k)};
      c2 = p2.vert ? {x:p2.x, y:p2.y - dy*0.45} : {x:p2.x-(p3.x-p1.x)*k, y:cy(p2.y-(p3.y-p1.y)*k)};
    }
    d += ` C${f1(c1.x)} ${f1(c1.y)} ${f1(c2.x)} ${f1(c2.y)} ${f1(p2.x)} ${f1(p2.y)}`;
  }
  return d;
}
const phone = () => innerWidth <= 760;
let nodes = [], trails = [];
function phonePoints(pts){
  // a living line: it swings across the page in the empty bands between sections, and sways in the gutter between nodes
  const x0 = parseFloat(getComputedStyle($('main .wrap')).paddingLeft) - 24;
  pts = pts.filter(p => !p.el.closest('.top'));
  const norm = pts.map(p => (p.el.classList.contains('wm') || p.el.classList.contains('pen')) ? {...p, swing:true} : {x:x0, y:p.y, el:p.el, vert:p.vert, vn:p.vn, cut:p.cut});
  norm.unshift({x:x0, y: pos($('.hero .label')).y - 6});
  if (norm.length < 2) return norm;
  const out = [norm[0]]; let alt = 1;
  for (let i=1;i<norm.length;i++){
    const a = norm[i-1], b = norm[i], gap = b.y - a.y;
    if (b.swing){ if (gap > 90) out.push({x:x0, y:b.y - Math.min(70, gap*.45)}); out.push(b); continue; }
    if (a.swing){ if (gap > 90) out.push({x:x0, y:a.y + Math.min(70, gap*.45)}); out.push(b); continue; }
    if (gap > 110 && !(a.vn && b.vert) && !a.cut){ out.push({x: x0 + alt*11, y: a.y + gap*.5}); alt = -alt; }
    out.push(b);
  }
  return out;
}
function makeTrail(paths, pts){
  const d = pts.length > 1 ? smooth(pts) : '';
  paths.forEach(p => p.setAttribute('d', d));
  const len = d ? (paths[0].getTotalLength() || 0) : 0;
  const N = Math.max(200, Math.round(len/6)), step = len ? len/N : 1, maxY = [];
  let mx = -1e9; if (len) for (let i=0;i<=N;i++){ mx = Math.max(mx, paths[0].getPointAtLength(i*step).y); maxY.push(mx); }
  paths.forEach(p => p.style.strokeDasharray = `${len} ${len}`);
  const prev = trails.find(t => t.paths[0] === paths[0]);
  return {paths, len, maxY, step, shown: prev ? Math.min(prev.shown, len) : 0};
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
  if (reduce){ const s = document.querySelector('.hero > .s-draw'); s && s.classList.add('arrived'); return; }
  let seen = false; try { seen = sessionStorage.getItem('intro-seen') === '1'; } catch(_) {}
  const delay = seen ? 250 : 650, dur = seen ? 1700 : 2600;
  const ease2 = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2;
  let t0 = 0, go = false;
  // start once the page has settled, so the stroke is seen from its first mark
  const begin = () => { if (go) return; go = true; requestAnimationFrame(tick); };
  const tick = ts => { if (!t0) t0 = ts + delay; const k = Math.max(0, Math.min(1, (ts - t0)/dur)); heroT = ease2(k);
    if (typeof req === 'function') req(); if (k < 1) requestAnimationFrame(tick); else { const s = document.querySelector('.hero > .s-draw'); s && s.classList.add('arrived'); } };
  if (document.readyState === 'complete') begin(); else { addEventListener('load', begin, {once:true}); setTimeout(begin, 1800); }
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

// 03: the field prints come in one by one
(() => {
  const prints = $$('.field-prints .snapcard'); if (!prints.length || reduce) return;
  prints.forEach((p, j) => { p.classList.add('enter'); p.style.setProperty('--d', (j*160) + 'ms'); });
  new IntersectionObserver((es, io) => es.forEach(e => { if (e.isIntersecting){ prints.forEach(p => p.classList.add('in')); io.disconnect(); } }), {threshold:.25, rootMargin:'0px 0px -10% 0px'}).observe($('.field-prints'));
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
    requestAnimationFrame(() => { if (typeof layoutLimbs === 'function') layoutLimbs(); build(); });
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
  layoutStage(); layoutLimbs(); layoutPeak();
  const pen = $('.hero .pen'); heroFloor = pen && visible(pen) ? pos(pen).y + 2 : 0;
  const penPt = pen && visible(pen) ? pos(pen) : null;
  // collapse the trail first, or its own old height keeps main tall after content shrinks
  svg.style.height = '0';
  const H = main.scrollHeight, W = main.clientWidth;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.style.height = H+'px';
  let pts = $$('[data-o]').filter(visible).map(el => ({...pos(el), el, o:+el.dataset.o, vert: el.hasAttribute('data-v'), vn: el.hasAttribute('data-vn'), cut: el.hasAttribute('data-cut'), free: el.hasAttribute('data-free')})).sort((a,b) => a.o - b.o);
  if (phone()) pts = phonePoints(pts);
  const segs = []; let cur = [];
  pts.forEach(p => { cur.push(p); if (p.cut){ segs.push(cur); cur = []; } });
  if (cur.length) segs.push(cur);
  trails = segs.map((sg, i) => makeTrail(pair(i), sg));
  // how far along the first stroke the pen sits
  heroLen = 0;
  if (penPt && trails[0] && trails[0].len){ const t = trails[0], pth = t.paths[0]; let best = 1e9;
    for (let L = 0; L <= t.len; L += t.step){ const q = pth.getPointAtLength(L), dd = (q.x - penPt.x)**2 + (q.y - penPt.y)**2; if (dd < best){ best = dd; heroLen = L; } } }
  PAIRS.slice(segs.length).forEach(pp => pp.forEach(p => p.setAttribute('d', '')));
  nodes = $$('.dot[data-o]').filter(visible).map(el => ({el, y: pos(el).y}));
  $$('details.dig').forEach(d => drawBranch(d, false));
  const nb = $('#nowBg'), r = nb.getBoundingClientRect(), c = pos(nb);
  const rect = $('#nowRect'); rect.setAttribute('y', c.y - r.height/2); rect.setAttribute('width', W); rect.setAttribute('height', r.height);
  frame();
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
    const xS = Math.max(xb + 70, W*.06), xE = Math.min(W - 70, xa - 40), y0 = H*.5, A = Math.min(140, H*.3), N = 160;
    const Y = u => y0 - A*Math.cos(2*Math.PI*(u - .2)/.6);
    const sl = Math.abs(A*2*Math.PI/.6*Math.sin(2*Math.PI*(0 - .2)/.6)/(xE - xS)), kE = Math.min(60, (xa - xE)*.7);
    d = `M${f(xa)} 0 C${f(xa)} ${f(H*.45)} ${f(xE + kE)} ${f(Y(1) + kE*sl)} ${f(xE)} ${f(Y(1))}`;
    for (let i = N; i >= 0; i--){ const u = i/N; d += ` L${f(xS + (xE - xS)*u)} ${f(Y(u))}`; }
    // leave along the swell's own slope, then settle vertical into the gutter
    const k = Math.min(60, (xS - xb)*.6);
    d += ` C${f(xS - k)} ${f(Y(0) + k*sl)} ${f(xb)} ${f(Math.max(Y(0) + k*sl + 20, H*.72))} ${f(xb)} ${f(H)}`;
    ns.forEach(n => { const u = +n.dataset.u, crest = Math.cos(2*Math.PI*(u - .2)/.6) > 0, h = n.offsetHeight;
      n.style.left = f(xS + (xE - xS)*u) + 'px';
      n.style.top = f(crest ? Y(u) + A*.64 : Y(u) - h - A*.6) + 'px'; });
  }
  $('#wave').setAttribute('viewBox', `0 0 ${W} ${H}`);
  waveLine.setAttribute('d', d);
  PK = {W, H};
}
function peakFrame(){
  if (!PK) return;
  const r = peak.getBoundingClientRect(), vh = innerHeight;
  // the line draws as the reading point passes, like the rest of the trail
  const p = reduce ? 1 : cl((vh*.7 - r.top)/(r.height + vh*.15));
  waveLine.style.strokeDashoffset = (1 - p).toFixed(4);
  const ph = phone();
  $$('.peak-n', peak).forEach(n => n.classList.toggle('on', reduce || (ph ? n.getBoundingClientRect().top < vh*.85 : p > (1 - +n.dataset.u)*.8 + .08)));
  peak.classList.toggle('speaking', reduce || p > .15);
}
/* ================= SCROLL ================= */
const nowSec = $('#now'), nowBg = $('#nowBg');
const cl = (v,a=0,b=1)=>Math.max(a,Math.min(b,v)), seg=(p,a,b)=>cl((p-a)/(b-a)), ease=t=>1-Math.pow(1-t,3);
let ticking = false;
function frame(){
  ticking = false;
  const mTop = main.getBoundingClientRect().top + scrollY;
  const readY = scrollY + innerHeight*0.64 - mTop, penY = Math.max(readY, heroT >= 1 ? heroFloor : 0);
  let busy = heroT < 1;
  trails.forEach((t, j) => {
    let target = reduce ? t.len : drawnLength(t, penY);
    // until the pen is reached, the hero line leads; scrolling takes over at once
    const intro = heroT < 1 && heroLen && scrollY < 40, drawingIn = intro && j === 0;
    if (drawingIn) target = heroLen*heroT; else if (intro) target = 0;
    t.shown = reduce || drawingIn ? target : t.shown + (target - t.shown)*0.2;
    if (Math.abs(target - t.shown) > 0.5) busy = true;
    // an undrawn stroke still shows its round cap as a dot, so hide it until it has length
    t.paths.forEach(p => { p.style.strokeDashoffset = (t.len - t.shown).toFixed(1); p.style.visibility = t.shown > 1 ? '' : 'hidden'; });
  });
  nodes.forEach(n => n.el.classList.toggle('hit', reduce || n.y <= penY));

  // present-day chapter opens out; product and marketing enter together
  const vh = innerHeight, r = nowSec.getBoundingClientRect();
  const p = reduce ? 1 : cl((vh - r.top)/(vh*0.95));
  const o = ease(seg(p, 0, .55));
  nowBg.style.clipPath = `inset(${((1-o)*3).toFixed(2)}% ${((1-o)*6).toFixed(2)}% 0 ${((1-o)*6).toFixed(2)}% round ${((1-o)*28).toFixed(1)}px)`;
  const mm = ease(seg(p, .32, .78));
  [['#mA',60],['#mB',90]].forEach(([s,dd]) => { const el = $(s); el.style.opacity = (reduce?1:.0001+mm).toString(); el.style.transform = reduce ? 'none' : `translateY(${((1-mm)*dd).toFixed(1)}px) scale(${(.94+.06*mm).toFixed(3)})`; });
  const t = ease(seg(p, .18, .5)), tx = $('#nowText'); tx.style.opacity = (reduce?1:.0001+t).toString(); tx.style.transform = reduce ? 'none' : `translateY(${((1-t)*30).toFixed(1)}px)`;
  const cp = seg(p, .62, .9); $$('.n3-note').forEach(el => el.style.opacity = (reduce?1:.0001+cp).toString());

  peakFrame(); railFrame(); stageFrame();
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

const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }), {rootMargin:'0px 0px -12% 0px'});
if (!reduce) $$('.rise').forEach(el => io.observe(el));

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
$('#copy').addEventListener('click', async e => { const b = e.currentTarget; try { await navigator.clipboard.writeText('mshehrozsajjad@gmail.com'); b.textContent = 'Copied'; } catch(_) { b.textContent = 'Select it'; } setTimeout(() => b.textContent = 'Copy', 1800); });

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
  oss:{t:"reels-in-code, the LiveKit JS plugin for Beyond Presence avatars, and free n8n workflows for using Beyond Presence.", go:['Show me', () => labOpen('given','reels')]},
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
  $('#log').insertAdjacentHTML('beforeend', `<p class="me"></p><div class="ai"><p></p>${a.go ? `<button type="button" id="${id}">${a.go[0]} ${AR('right')}</button>` : ''}</div>`);
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
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const NS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, attrs={}) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };

/* ---------- marker doodles, drawn when they enter view ---------- */
const SHAPES = {
  underline:  {box:'left:-3%;width:106%;bottom:-.26em;height:.42em', vb:'0 0 100 20', d:['M2 13 C 18 8, 34 15, 52 11 S 84 8, 98 12']},
  underline2: {box:'left:-4%;width:108%;bottom:-.34em;height:.5em', vb:'0 0 100 24', d:['M2 10 C 22 5, 48 14, 70 8 S 92 7, 98 9','M8 18 C 30 14, 62 20, 94 15']},
  circle:     {box:'left:-9%;width:118%;top:-24%;height:150%', vb:'0 0 100 40', d:['M14 31 C 2 23, 7 6, 40 4 C 72 2, 98 8, 97 21 C 96 34, 64 38, 40 37 C 16 36, 4 28, 10 16 C 13 11, 20 8, 31 6']}
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

/* milestones: a small burst the first time the trail reaches each one */
$$('.mile .dot').forEach(dot => {
  let done = false;
  new MutationObserver(() => { if (!done && dot.classList.contains('hit')){ done = true; burst(dot.parentElement, -20, -2, -20); } })
    .observe(dot, {attributes:true, attributeFilter:['class']});
});

/* crossroads and second fork: a burst when a path gets focus or is taken */
const seen = new WeakMap();
function watchOpts(root){
  if (!root) return;
  new MutationObserver(() => $$('.opt', root).forEach(o => {
    const state = (o.classList.contains('focus') ? 'f' : '') + (o.classList.contains('on') ? 'o' : '');
    if (state && seen.get(o) !== state){ const w = o.getBoundingClientRect().width; burst(o, Math.min(w - 8, 300), 6, 20); }
    seen.set(o, state);
  })).observe(root, {subtree:true, childList:true, attributes:true, attributeFilter:['class']});
}
watchOpts($('#fields'));

/* ---------- robot eyes that follow the pointer ---------- */
const sub = $('.bot-host');
if (sub){
  const eyes = document.createElement('span'); eyes.className = 'bot-eyes'; eyes.setAttribute('aria-hidden', 'true'); eyes.innerHTML = '<i></i><i></i>';
  sub.appendChild(eyes);
  if (fine && !reduce) addEventListener('pointermove', e => {
    $$('i', eyes).forEach(i => {
      const r = i.getBoundingClientRect(), dx = e.clientX - (r.left + r.width/2), dy = e.clientY - (r.top + r.height/2), d = Math.hypot(dx, dy) || 1;
      i.style.setProperty('--px', (dx/d*3).toFixed(1)+'px'); i.style.setProperty('--py', (dy/d*3.5).toFixed(1)+'px');
    });
  }, {passive:true});
}

/* ---------- Figma-style selection frame on placeholders ---------- */
if (fine) document.addEventListener('mouseover', e => {
  const ph = e.target.closest('.ph'); if (!ph || ph.classList.contains('snap')) return;
  let sel = $(':scope > .sel', ph);
  if (!sel){ sel = document.createElement('span'); sel.className = 'sel'; sel.setAttribute('aria-hidden', 'true'); sel.innerHTML = '<b></b><b></b><b></b><b></b><em></em>'; ph.appendChild(sel); }
  $('em', sel).textContent = `${Math.round(ph.offsetWidth)} × ${Math.round(ph.offsetHeight)}`;
});

/* ---------- thinking dots, speech bubble, copy note ---------- */
const think = $('.s-think');
if (think) think.insertAdjacentHTML('afterend', '<span class="think-dots" aria-hidden="true"><i></i><i></i><i></i></span>');
const wave = $('.s-wave');
if (wave) wave.insertAdjacentHTML('afterend', '<span class="say-hi" aria-hidden="true"><span class="long">If any of this sparked an idea, say hi.</span><span class="short">say hi.</span></span>');
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
function splitWords(node){
  [...node.childNodes].forEach(n => {
    if (n.nodeType === 3){
      const parts = n.textContent.split(/(\s+)/); const frag = document.createDocumentFragment();
      parts.forEach(p => { if (!p) return; if (/^\s+$/.test(p)) frag.appendChild(document.createTextNode(p)); else { const s = document.createElement('span'); s.className = 'w'; s.textContent = p; frag.appendChild(s); } });
      n.replaceWith(frag);
    } else if (n.nodeType === 1 && n.tagName !== 'BR') splitWords(n);
  });
}
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
  timers.push(setTimeout(() => { cur.style.opacity = '1'; }, 250));
  words.forEach((w, i) => timers.push(setTimeout(() => { w.classList.add('on'); place(w); }, 420 + i*140)));
  const end = 420 + words.length*140;
  timers.push(setTimeout(() => $$('.hero .dd').forEach(d => d.classList.add('drawn')), end + 120));
  timers.push(setTimeout(() => { const a = $('.ask'); if (a){ const r = a.getBoundingClientRect(), c = heroCopy.getBoundingClientRect(); cur.style.transform = `translate(${(r.left - c.left).toFixed(0)}px, ${(r.top - c.top + 6).toFixed(0)}px)`; } }, end + 700));
  timers.push(setTimeout(finish, end + 1700));
  ['wheel','keydown','pointerdown','touchstart'].forEach(ev => addEventListener(ev, finish, {passive:true}));
} else {
  $$('.hero .dd').forEach(d => d.removeAttribute('data-manual'));
}
scan();
})();
