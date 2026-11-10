// The humor dial on a build story. TARS has a humor setting, so the page about it has one too. There are two sliders
// (the big one in the hero, the pill that follows the reader) and they are one setting. The dial gives the page:
//   data-humor on <html>  the band, which picks the copy (.hm-dry under 50%, .hm-fun above, .hm-max asides from 90%)
//   --humor (0 to 1)      the exact value, which styles/story-page.css uses to drain the colour and size the readout
const SAY = {dry: 'facts only', fun: 'cheeky, as shipped', max: 'no filter'};
const band = v => v < 50 ? 'dry' : v < 90 ? 'fun' : 'max';

const all = s => [...document.querySelectorAll(s)];
const dials = all('[data-humor-dial]');
if (dials.length){
  const root = document.documentElement, outs = all('[data-humor-out]'), says = all('[data-humor-say]');
  const set = v => {
    const b = band(v);
    root.dataset.humor = b;
    root.style.setProperty('--humor', v / 100);
    dials.forEach(d => { d.value = v; d.setAttribute('aria-valuetext', `${v}%, ${SAY[b]}`); });
    outs.forEach(o => { o.textContent = v + '%'; });
    says.forEach(s => { s.textContent = SAY[b]; });
  };
  dials.forEach(d => d.addEventListener('input', () => { root.classList.add('hm-live'); set(+d.value); }));   // the copy fades in only once someone has turned it
  root.classList.add('has-dial');
  set(+dials[0].value);
}
