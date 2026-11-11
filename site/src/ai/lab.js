// The side projects' shop: a receipt that opens a product's whole story,
// and the house rules on a letter board, each pointing at the product it came from.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

const pcs = $('#pcs');

// the sheet
const sheet = $('#sheet'), sheetIn = $('#sheetIn');
let opener = null;
function openSheet(id, from){
  opener = from;
  sheetIn.replaceChildren($('#sheet-' + id).content.cloneNode(true));
  const h = $('h3', sheetIn); h.id = 'sheetTitle';
  sheet.showModal(); document.body.style.overflow = 'hidden';
  const v = $('video', sheetIn); if (v && !reduce) v.play().catch(() => {});
}
function closeSheet(){ $$('video', sheetIn).forEach(v => v.pause()); if (sheet.open) sheet.close(); }
sheet.addEventListener('close', () => { document.body.style.overflow = ''; opener && opener.focus({preventScroll: true}); });
sheet.addEventListener('click', e => { if (e.target === sheet || e.target.closest('[data-sheet-close]')) closeSheet(); });
pcs.addEventListener('click', e => { const c = e.target.closest('.pc'); if (c) openSheet(c.dataset.p, c); });

// the house rules: a rule's product opens that product's receipt
const play = $('#play');
play.addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (b) openSheet(b.dataset.p, b); });
// letter-board letters are pushed in by hand, so none sits quite straight (the same every load)
$$('.pl-t', play).forEach((title, n) => {
  const text = title.textContent; title.setAttribute('aria-label', text);
  title.replaceChildren(...text.split(' ').flatMap((word, w) => {
    const span = Object.assign(document.createElement('span'), {className: 'pl-w', ariaHidden: 'true'});
    span.append(...[...word].map((ch, i) => { const l = document.createElement('i'), k = Math.sin((n * 7 + w * 3 + i) * 12.9898) * 43758.5453 % 1;
      l.textContent = ch; l.style.rotate = (k * 2.4).toFixed(2) + 'deg'; l.style.translate = `0 ${(k * 2.5).toFixed(1)}px`; return l; }));
    return [span, ' '];
  }));
});

// the numbers count up once, when they come into view
if (!reduce) new IntersectionObserver((es, io) => es.forEach(e => {
  if (!e.isIntersecting) return; io.disconnect();
  $$('.till [data-count]').forEach(b => { const n = +b.dataset.count, t0 = performance.now(); const tick = t => { const k = Math.min(1, (t - t0)/900); b.textContent = Math.round(n*(1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
}), {threshold: .4}).observe($('.till'));
