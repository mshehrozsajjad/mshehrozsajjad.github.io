// "Follow the pen": an element with data-reveal waits until the trail's pen has passed it, then gets .shown, once.
//   data-reveal="print"  rises and settles at its tilt (--tilt)
//   data-reveal="words"  sharpens word by word
//   data-reveal          fades up
// The motion itself lives in styles/ending.css, and only under .js, so reduced motion and no-JS see everything.
const AHEAD = 60; // start a little before the pen arrives, so the element is settling as the line reaches it

// every word of the node's text becomes <span class="w" style="--w:index">, tags and <br> kept; returns the word count
export function splitWords(node, count = {n: 0}){
  [...node.childNodes].forEach(n => {
    if (n.nodeType === 3){
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) return frag.appendChild(document.createTextNode(part));
        const w = document.createElement('span'); w.className = 'w'; w.style.setProperty('--w', count.n++); w.textContent = part; frag.appendChild(w);
      });
      n.replaceWith(frag);
    } else if (n.nodeType === 1 && n.tagName !== 'BR') splitWords(n, count);
  });
  return count.n;
}

export function createReveal(reduce){
  const els = [...document.querySelectorAll('[data-reveal]')];
  if (!reduce) els.forEach(el => { if (el.dataset.reveal === 'words') el.style.setProperty('--nw', splitWords(el)); });
  let waiting = [];
  return {
    // top(el): the element's top in the trail's coordinates; call after every layout
    measure(top){ waiting = reduce ? [] : els.filter(el => !el.classList.contains('shown')).map(el => ({el, y: top(el)})); },
    // per frame, from the trail's own frame(): no listeners of its own
    check(penY){
      if (!waiting.length) return;
      const reached = waiting.filter(r => r.y - AHEAD <= penY);
      reached.forEach(r => r.el.classList.add('shown'));
      waiting = waiting.filter(r => !reached.includes(r));
    }
  };
}
