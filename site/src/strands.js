// Hand-drawn strands for the lab: cubic S-curves that leave and arrive heading down.
// The wobble is seeded, so a strand looks the same on every resize and never jitters.
const f = n => n.toFixed(1);
const noise = (seed, k) => { const s = Math.sin(seed*127.1 + k*311.7)*43758.5453; return (s - Math.floor(s))*2 - 1; }; // -1..1
// a handle that keeps a sideways run of dx in a short drop from bending tighter than a radius of about 45px
const wide = dx => Math.sqrt(30*dx);

// a to b, heading down at both ends. ka / kb are the handle lengths as a share of the drop: a long start hugs
// the vertical, a short end swings in late. The hand shows as a small seeded sideways wobble of each handle.
// drop: the strand first runs straight down that far from a (the rule beside a column) before it curves.
// ta / tb: a small sideways lean (radians) at the start / end, so a strand clears the names above and below it. Where a strand ends and the next begins they share it.
// share: 'a' or 'b' when several strands share that end point. Their handle there must be one common length (len, from sharedHandle),
// or neighbours swap order on the way in and cross. Each strand still sizes its free end by its own drop and run.
export function strand(a, b, seed, ka = .55, kb = .3, drop = 0, ta = 0, tb = 0, share = '', len = 0){
  const s = {x:a.x, y:a.y + drop}, dy = b.y - s.y, dx = Math.abs(b.x - a.x), cap = dy*.85;
  const la = share === 'a' ? len : Math.min(cap, Math.max(dy*ka, wide(dx))), lb = share === 'b' ? len : Math.min(cap, Math.max(dy*kb, wide(dx)));
  // no wobble at a shared end or under a lean: there the strands fan out in order, and a wobble would swap neighbours
  const wa = share === 'a' || ta ? 0 : noise(seed, 1)*la*.05, wb = share === 'b' || tb ? 0 : noise(seed, 2)*lb*.05;
  return `M${f(a.x)} ${f(a.y)}${drop ? `L${f(s.x)} ${f(s.y)}` : ''}C${f(s.x + la*Math.sin(ta) + wa)} ${f(s.y + la*Math.cos(ta))} ${f(b.x - lb*Math.sin(tb) + wb)} ${f(b.y - lb*Math.cos(tb))} ${f(b.x)} ${f(b.y)}`;
}

// the common handle for strands [a, b, drop] that meet at one end: k of the shortest drop, widened for the widest run, and short enough for every drop
export const sharedHandle = (group, k) => {
  const dys = group.map(([a, b, drop = 0]) => Math.abs(b.y - a.y) - drop), dy = Math.min(...dys);
  return Math.min(dy*.85, Math.max(dy*k, wide(Math.max(...group.map(([a, b]) => Math.abs(b.x - a.x))))));
};
