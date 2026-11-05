// The engineering hero's 3D piece: the platform as a wireframe globe of nodes.
// Each node is a place an avatar session can run; small pulses travel the edges, the way sessions move through the call platform.
// Drags to turn, drifts on its own, and stands still for people who asked for less motion.
import * as THREE from 'three';

export function mountPlatform(host, {reduce = false} = {}){
  const W = () => host.clientWidth, H = () => host.clientHeight;
  const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
  renderer.setPixelRatio(Math.min(2, devicePixelRatio));
  renderer.setSize(W(), H());
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(38, W()/H(), .1, 100);
  camera.position.set(0, 0, 6.2);

  const css = getComputedStyle(document.documentElement);
  const col = new THREE.Color(css.getPropertyValue('--signal').trim() || '#2D2BE0');
  const dim = col.clone();   // on paper the edges are the same blue, just fainter
  const ink = new THREE.Color(css.getPropertyValue('--ink').trim() || '#111113');

  // nodes spread evenly over a sphere (Fibonacci), then each joins its nearest neighbours
  const N = 140, R = 1.7, pts = [];
  for (let i = 0; i < N; i++){
    const y = 1 - (i + .5)/N*2, r = Math.sqrt(1 - y*y), a = i*Math.PI*(3 - Math.sqrt(5));
    pts.push(new THREE.Vector3(Math.cos(a)*r*R, y*R, Math.sin(a)*r*R));
  }
  const edges = [];
  pts.forEach((p, i) => {
    pts.map((q, j) => [j, p.distanceToSquared(q)]).filter(([j]) => j > i).sort((a, b) => a[1] - b[1]).slice(0, 3).forEach(([j]) => edges.push([i, j]));
  });
  const group = new THREE.Group(); scene.add(group);
  const lineGeo = new THREE.BufferGeometry().setFromPoints(edges.flatMap(([a, b]) => [pts[a], pts[b]]));
  group.add(new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({color: dim, transparent: true, opacity: .32})));
  const nodeGeo = new THREE.BufferGeometry().setFromPoints(pts);
  group.add(new THREE.Points(nodeGeo, new THREE.PointsMaterial({color: col, size: .045, sizeAttenuation: true})));
  // an inner ring: the core everything routes through
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.62, .006, 6, 120), new THREE.MeshBasicMaterial({color: col, transparent: true, opacity: .8}));
  ring.rotation.x = Math.PI/2.4; group.add(ring);

  // pulses: points that run along random edges, then pick a neighbouring edge
  const P = reduce ? 0 : 36, pulsePos = new Float32Array(P*3), pulses = [];
  for (let k = 0; k < P; k++) pulses.push({e: (Math.random()*edges.length)|0, t: Math.random(), v: .4 + Math.random()*.8});
  const pulseGeo = new THREE.BufferGeometry(); pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePos, 3));
  group.add(new THREE.Points(pulseGeo, new THREE.PointsMaterial({color: ink, size: .07, transparent: true, opacity: .9})));

  let rx = .35, ry = 0, vx = 0, vy = reduce ? 0 : .0025, drag = null, last = performance.now(), raf = 0, on = false;
  const tmp = new THREE.Vector3();
  function frame(now){
    const dt = Math.min(50, now - last)/1000; last = now;
    if (!drag){ ry += vy; rx += vx; vx *= .94; vy += ((reduce ? 0 : .0025) - vy)*.02; }
    group.rotation.set(rx, ry, 0);
    pulses.forEach((p, k) => {
      p.t += p.v*dt;
      if (p.t >= 1){ const end = edges[p.e][1], next = edges.map((e, i) => [e, i]).filter(([e]) => e[0] === end || e[1] === end); const pick = next[(Math.random()*next.length)|0]; p.e = pick ? pick[1] : (Math.random()*edges.length)|0; p.t = 0; }
      const [a, b] = edges[p.e]; tmp.lerpVectors(pts[a], pts[b], p.t); pulsePos.set([tmp.x, tmp.y, tmp.z], k*3);
    });
    pulseGeo.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
    if (on) raf = requestAnimationFrame(frame);
  }
  const start = () => { if (on) return; on = true; last = performance.now(); raf = requestAnimationFrame(frame); };
  const stop = () => { on = false; cancelAnimationFrame(raf); };
  if (reduce) frame(performance.now()); else new IntersectionObserver(es => es[0].isIntersecting ? start() : stop()).observe(host);

  // drag to turn
  host.addEventListener('pointerdown', e => { drag = {x: e.clientX, y: e.clientY, rx, ry}; host.setPointerCapture(e.pointerId); host.classList.add('grab'); });
  host.addEventListener('pointermove', e => { if (!drag) return; const nx = drag.rx + (e.clientY - drag.y)*.006, ny = drag.ry + (e.clientX - drag.x)*.006; vx = (nx - rx)*.5; vy = (ny - ry)*.5; rx = nx; ry = ny; if (reduce) frame(performance.now()); });
  const up = () => { drag = null; host.classList.remove('grab'); };
  host.addEventListener('pointerup', up); host.addEventListener('pointercancel', up);
  new ResizeObserver(() => { renderer.setSize(W(), H()); camera.aspect = W()/H(); camera.updateProjectionMatrix(); if (!on) frame(performance.now()); }).observe(host);
}
