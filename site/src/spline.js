// The trail's geometry: a C2 cubic spline through the waypoints, written as cubic béziers.
// Unlike Catmull-Rom (tangents continuous, curvature jumping at every waypoint) the curvature here changes smoothly all the way,
// and the spline is the one that bends least, so a few well-placed waypoints read as one confident pen stroke.
// A waypoint with .vert is met vertically (the gutter); the run between two such points is solved on its own.
const f1 = n => n.toFixed(1);

// second derivatives M of the spline through values y at chord-length parameters t. d0 / d1: clamped end slopes, or null for a natural end
function solve(t, y, d0, d1){
  const n = y.length, h = t.slice(1).map((v, i) => v - t[i]), a = Array(n).fill(0), b = Array(n).fill(0), c = Array(n).fill(0), r = Array(n).fill(0);
  for (let i = 1; i < n - 1; i++){ a[i] = h[i-1]; b[i] = 2*(h[i-1] + h[i]); c[i] = h[i]; r[i] = 6*((y[i+1] - y[i])/h[i] - (y[i] - y[i-1])/h[i-1]); }
  if (d0 === null){ b[0] = 1; } else { b[0] = 2*h[0]; c[0] = h[0]; r[0] = 6*((y[1] - y[0])/h[0] - d0); }
  if (d1 === null){ b[n-1] = 1; } else { a[n-1] = h[n-2]; b[n-1] = 2*h[n-2]; r[n-1] = 6*(d1 - (y[n-1] - y[n-2])/h[n-2]); }
  for (let i = 1; i < n; i++){ const w = a[i]/b[i-1]; b[i] -= w*c[i-1]; r[i] -= w*r[i-1]; }
  const M = Array(n); M[n-1] = r[n-1]/b[n-1];
  for (let i = n - 2; i >= 0; i--) M[i] = (r[i] - c[i]*M[i+1])/b[i];
  return {M, h};
}

// one run of points: bézier segments (as path text) from the first point to the last
function run(pts){
  // two points on top of each other would make a zero-length step
  pts = pts.filter((p, i) => !i || Math.hypot(p.x - pts[i-1].x, p.y - pts[i-1].y) > .5);
  if (pts.length < 2) return '';
  const t = [0]; pts.forEach((p, i) => i && t.push(t[i-1] + Math.hypot(p.x - pts[i-1].x, p.y - pts[i-1].y)));
  const n = pts.length, down = (a, b) => (b.y >= a.y ? 1 : -1);
  // a vertical end is a unit tangent straight up or down, in the direction of travel
  const s = pts[0].vert ? down(pts[0], pts[1]) : null, e = pts[n-1].vert ? down(pts[n-2], pts[n-1]) : null;
  const X = solve(t, pts.map(p => p.x), s === null ? null : 0, e === null ? null : 0), Y = solve(t, pts.map(p => p.y), s, e);
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  // the spline's slope at the start (end = false) or the end of segment i
  const slope = (v, m, i, h, end) => { const k = (v[i+1] - v[i])/h; return end ? k + h*(m[i] + 2*m[i+1])/6 : k - h*(2*m[i] + m[i+1])/6; };
  let d = '';
  for (let i = 0; i < n - 1; i++){
    const h = X.h[i];
    const c1 = {x:xs[i] + h*slope(xs, X.M, i, h, false)/3, y:ys[i] + h*slope(ys, Y.M, i, h, false)/3};
    const c2 = {x:xs[i+1] - h*slope(xs, X.M, i, h, true)/3, y:ys[i+1] - h*slope(ys, Y.M, i, h, true)/3};
    d += ` C${f1(c1.x)} ${f1(c1.y)} ${f1(c2.x)} ${f1(c2.y)} ${f1(xs[i+1])} ${f1(ys[i+1])}`;
  }
  return d;
}

export function smooth(pts){
  if (pts.length < 2) return '';
  let d = `M${f1(pts[0].x)} ${f1(pts[0].y)}`, from = 0;
  pts.forEach((p, i) => { if (i && (p.vert || i === pts.length - 1)){ d += run(pts.slice(from, i + 1)); from = i; } });
  return d;
}
