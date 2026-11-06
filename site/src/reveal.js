// An element with data-reveal waits until its top crosses TRIGGER of the viewport height, so the visitor sees it arrive; then it gets .shown, once.
//   data-reveal="print"  rises and settles at its tilt (--r or --tilt)
//   data-reveal="words"  sharpens word by word
//   data-reveal          fades up
// The motion itself lives in styles/ending.css, and only under .js, so reduced motion and no-JS see everything.
const TRIGGER = .78;  // start when the top is about a fifth of the way into view
const SETTLED = .6;   // anything wholly above this share of the screen is shown at once, without motion (an anchor jump, a fast scroll)

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
  if (!reduce) els.filter(el => el.dataset.reveal === 'words').forEach(el => splitWords(el));
  let waiting = reduce ? [] : els;
  return {
    // per frame, from the trail's own frame(): no listeners of its own. atEnd: the page is scrolled to its bottom, so whatever is left shows.
    // Positions are read live (never cached), so a late image, an opened fold or an anchor jump cannot leave anything waiting unseen.
    check(atEnd){
      if (!waiting.length) return;
      const vh = innerHeight, rects = new Map(waiting.map(el => [el, el.getBoundingClientRect()]));
      const reached = waiting.filter(el => atEnd || rects.get(el).top <= vh*TRIGGER);
      if (!reached.length) return;
      waiting = waiting.filter(el => !reached.includes(el));
      // what arrives together arrives one after another, in reading order; what is already settled on screen just appears
      reached.forEach((el, i) => {
        if (atEnd || rects.get(el).bottom <= vh*SETTLED){ el.classList.add('snap', 'shown'); setTimeout(() => el.classList.remove('snap'), 80); return; }
        el.style.setProperty('--rd', Math.min(i*60, 240) + 'ms'); el.classList.add('shown'); setTimeout(() => el.style.removeProperty('--rd'), 1800);
      });
    }
  };
}
