// Hand-drawn strands for the lab: cubic S-curves that leave and arrive heading down.
// The wobble is seeded, so a strand looks the same on every resize and never jitters.
const f = n => n.toFixed(1);
const noise = (seed, k) => { const s = Math.sin(seed*127.1 + k*311.7)*43758.5453; return (s - Math.floor(s))*2 - 1; }; // -1..1

// the small lean a strand has where it meets its name; both curves that meet there share it, so the joint stays smooth
export const lean = seed => noise(seed, 3)*.12;

// a to b, heading down at both ends; ta / tb lean each end sideways (radians).
// ka / kb are the handle lengths as a share of the drop: a long start hugs it, a short end swings in late. They differ a little, like a hand would
export function strand(a, b, seed, ta = 0, tb = 0, ka = .55, kb = .3){
  const dy = b.y - a.y, la = dy*(ka + .06*noise(seed, 1)), lb = dy*(kb + .05*noise(seed, 2));
  const c1 = {x:a.x + la*Math.sin(ta), y:a.y + la*Math.cos(ta)}, c2 = {x:b.x - lb*Math.sin(tb), y:b.y - lb*Math.cos(tb)};
  return `M${f(a.x)} ${f(a.y)}C${f(c1.x)} ${f(c1.y)} ${f(c2.x)} ${f(c2.y)} ${f(b.x)} ${f(b.y)}`;
}
