// The AI page's dashboard: filters that dim what doesn't match, a sheet that opens a product's whole story,
// and the playbook as a list where one step is open at a time.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

// filters: the cards that don't match step back rather than vanish, so the grid never jumps
const pcs = $('#pcs');
$$('.filters button').forEach(b => b.addEventListener('click', () => {
  const f = b.dataset.f;
  $$('.filters button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  $$('.pc', pcs).forEach(c => { const on = f === 'all' || c.dataset.tags.split(' ').includes(f); c.classList.toggle('off', !on); c.tabIndex = on ? 0 : -1; c.setAttribute('aria-hidden', String(!on)); });
}));

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
pcs.addEventListener('click', e => { const c = e.target.closest('.pc'); if (c && !c.classList.contains('off')) openSheet(c.dataset.p, c); });

// the playbook: one step open at a time
const play = $('#play');
play.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  $$('li', play).forEach(li => { const btn = $('button', li), on = btn === b; btn.setAttribute('aria-expanded', String(on)); $('.pl-b', li).hidden = !on; li.classList.toggle('on', on); });
});
$('li', play).classList.add('on');

// the numbers count up once, when they come into view
if (!reduce) new IntersectionObserver((es, io) => es.forEach(e => {
  if (!e.isIntersecting) return; io.disconnect();
  $$('.kpi b[data-count]').forEach(b => { const n = +b.dataset.count, t0 = performance.now(); const tick = t => { const k = Math.min(1, (t - t0)/900); b.textContent = Math.round(n*(1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
}), {threshold: .4}).observe($('.kpis'));
