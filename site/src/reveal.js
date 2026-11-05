// "Follow the pen": an element with data-reveal waits until the trail's pen has passed it, then gets .shown, once.
//   data-reveal="print"  rises and settles at its tilt (--r or --tilt)
//   data-reveal="words"  sharpens word by word
//   data-reveal          fades up
// The motion itself lives in styles/ending.css, and only under .js, so reduced motion and no-JS see everything.
const AHEAD = 60;   // start a little before the line arrives, so the element is settling as it does
const READ = .85;   // never wait below this share of the screen: anything above it is shown at once, whatever the pen is doing

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
    // per frame, from the trail's own frame(): no listeners of its own. penTop is the pen's height on screen.
    // Positions are read live (never cached), so a late image, an opened fold or an anchor jump cannot leave anything waiting unseen.
    check(penTop){
      if (!waiting.length) return;
      const line = Math.max(penTop, innerHeight*READ) + AHEAD;
      const reached = waiting.filter(el => el.getBoundingClientRect().top <= line);
      if (!reached.length) return;
      waiting = waiting.filter(el => !reached.includes(el));
      // what arrives together arrives one after another, in reading order
      reached.forEach((el, i) => { el.style.setProperty('--rd', Math.min(i*70, 280) + 'ms'); el.classList.add('shown'); setTimeout(() => el.style.removeProperty('--rd'), 1800); });
    }
  };
}
