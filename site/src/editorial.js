// Small, pointer-driven depth. No scroll interception or perpetual animation loop.
const bench = document.querySelector('.workbench');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const fine = matchMedia('(hover: hover) and (pointer: fine)');
if (bench) {
  const cards = [...bench.querySelectorAll('.specimen')];
  let frame = 0;
  const reset = () => {
    cancelAnimationFrame(frame);
    cards.forEach(card => { card.style.removeProperty('--px'); card.style.removeProperty('--py'); });
  };
  bench.addEventListener('pointermove', event => {
    if (motion.matches || !fine.matches) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const r = bench.getBoundingClientRect();
      const x = (event.clientX - r.left) / r.width - .5;
      const y = (event.clientY - r.top) / r.height - .5;
      cards.forEach((card, index) => {
        const depth = 8 + index * 3;
        card.style.setProperty('--px', `${x * depth}px`);
        card.style.setProperty('--py', `${y * depth}px`);
      });
    });
  });
  bench.addEventListener('pointerleave', reset);
  motion.addEventListener('change', reset);
}
