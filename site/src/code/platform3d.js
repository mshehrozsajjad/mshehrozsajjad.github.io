// The engineering hero's 3D piece: the platform as a wireframe globe of nodes.
// Each node is a place an avatar session can run; small pulses travel the edges, the way sessions move through the call platform.
// Drags to turn, drifts on its own, and stands still for people who asked for less motion.
// Drawn with WebGL (three.js) where the browser allows it. Where WebGL is off (hardware acceleration disabled, some embedded
// browsers), the same globe is drawn with a plain 2D canvas instead, so the hero never shows an error or an empty square.
import * as THREE from 'three';

const FOV = 38, CAM = 6.2;

function webglAvailable(){
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (_) { return false; }
}

export function mountPlatform(host, {reduce = false} = {}){
  const W = () => host.clientWidth, H = () => host.clientHeight;
  const css = getComputedStyle(document.documentElement);
  const signal = css.getPropertyValue('--signal').trim() || '#2D2BE0';
  const inkCol = css.getPropertyValue('--ink').trim() || '#111113';

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
  // the inner ring: the core everything routes through
  const RING_TILT = Math.PI/2.4, RING_R = .62;

  // pulses: points that run along random edges, then pick a neighbouring edge
  const P = reduce ? 0 : 36, pulses = [];
  for (let k = 0; k < P; k++) pulses.push({e: (Math.random()*edges.length)|0, t: Math.random(), v: .4 + Math.random()*.8, pos: new THREE.Vector3()});
  const stepPulses = dt => pulses.forEach(p => {
    p.t += p.v*dt;
    if (p.t >= 1){ const end = edges[p.e][1], next = edges.map((e, i) => [e, i]).filter(([e]) => e[0] === end || e[1] === end); const pick = next[(Math.random()*next.length)|0]; p.e = pick ? pick[1] : (Math.random()*edges.length)|0; p.t = 0; }
    const [a, b] = edges[p.e]; p.pos.lerpVectors(pts[a], pts[b], p.t);
  });

  const draw = webglAvailable() ? webglRenderer() : canvasRenderer();
  if (!draw){ host.classList.add('p3d-off'); return; }

  let rx = .35, ry = 0, vx = 0, vy = reduce ? 0 : .0025, drag = null, last = performance.now(), raf = 0, on = false;
  function frame(now){
    const dt = Math.min(50, now - last)/1000; last = now;
    if (!drag){ ry += vy; rx += vx; vx *= .94; vy += ((reduce ? 0 : .0025) - vy)*.02; }
    stepPulses(dt);
    draw.render(rx, ry);
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
  new ResizeObserver(() => { draw.resize(); if (!on) frame(performance.now()); }).observe(host);

  // ---------- WebGL, through three.js ----------
  function webglRenderer(){
    let renderer;
    try { renderer = new THREE.WebGLRenderer({antialias: true, alpha: true}); } catch (_) { return canvasRenderer(); }
    renderer.setPixelRatio(Math.min(2, devicePixelRatio));
    renderer.setSize(W(), H());
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(FOV, W()/H(), .1, 100);
    camera.position.set(0, 0, CAM);
    const col = new THREE.Color(signal), ink = new THREE.Color(inkCol);
    const group = new THREE.Group(); scene.add(group);
    group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(edges.flatMap(([a, b]) => [pts[a], pts[b]])), new THREE.LineBasicMaterial({color: col, transparent: true, opacity: .32})));
    group.add(new THREE.Points(new THREE.BufferGeometry().setFromPoints(pts), new THREE.PointsMaterial({color: col, size: .045, sizeAttenuation: true})));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(RING_R, .006, 6, 120), new THREE.MeshBasicMaterial({color: col, transparent: true, opacity: .8}));
    ring.rotation.x = RING_TILT; group.add(ring);
    const pulsePos = new Float32Array(Math.max(1, P)*3), pulseGeo = new THREE.BufferGeometry();
    pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePos, 3));
    group.add(new THREE.Points(pulseGeo, new THREE.PointsMaterial({color: ink, size: .07, transparent: true, opacity: .9})));
    return {
      render(rx, ry){
        group.rotation.set(rx, ry, 0);
        pulses.forEach((p, k) => pulsePos.set([p.pos.x, p.pos.y, p.pos.z], k*3));
        pulseGeo.attributes.position.needsUpdate = true;
        renderer.render(scene, camera);
      },
      resize(){ renderer.setSize(W(), H()); camera.aspect = W()/H(); camera.updateProjectionMatrix(); },
    };
  }

  // ---------- the same globe on a 2D canvas, for browsers without WebGL ----------
  function canvasRenderer(){
    const cv = document.createElement('canvas'), ctx = cv.getContext('2d');
    if (!ctx) return null;
    host.appendChild(cv);
    let dpr = 1, w = 0, h = 0, f = 1;
    const resize = () => {
      dpr = Math.min(2, devicePixelRatio || 1); w = W(); h = H();
      cv.width = w*dpr; cv.height = h*dpr; cv.style.width = w + 'px'; cv.style.height = h + 'px';
      f = (h/2)/Math.tan(FOV/2*Math.PI/180);   // the same perspective as the WebGL camera
    };
    resize();
    const ringPts = Array.from({length: 120}, (_, i) => { const a = i/120*Math.PI*2; return new THREE.Vector3(Math.cos(a)*RING_R, Math.sin(a)*RING_R, 0).applyAxisAngle(new THREE.Vector3(1, 0, 0), RING_TILT); });
    const e = new THREE.Euler(), v = new THREE.Vector3();
    // out.s is three.js's point scale (half the height over depth), so dot sizes match the WebGL version
    const proj = (p, out) => { v.copy(p).applyEuler(e); const s = f/(CAM - v.z); out.x = w/2 + v.x*s; out.y = h/2 - v.y*s; out.s = (h/2)/(CAM - v.z); return out; };
    const scr = pts.map(() => ({x: 0, y: 0, s: 1})), tmp = {x: 0, y: 0, s: 1};
    return {
      render(rx, ry){
        e.set(rx, ry, 0);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
        pts.forEach((p, i) => proj(p, scr[i]));
        ctx.strokeStyle = signal; ctx.globalAlpha = .32; ctx.lineWidth = 1; ctx.beginPath();
        edges.forEach(([a, b]) => { ctx.moveTo(scr[a].x, scr[a].y); ctx.lineTo(scr[b].x, scr[b].y); });
        ctx.stroke();
        ctx.globalAlpha = .8; ctx.beginPath();
        ringPts.forEach((p, i) => { proj(p, tmp); i ? ctx.lineTo(tmp.x, tmp.y) : ctx.moveTo(tmp.x, tmp.y); });
        ctx.closePath(); ctx.stroke();
        ctx.globalAlpha = 1; ctx.fillStyle = signal;
        scr.forEach(q => { const r = Math.max(.7, .045/2*q.s); ctx.fillRect(q.x - r, q.y - r, r*2, r*2); });
        ctx.fillStyle = inkCol; ctx.globalAlpha = .9;
        pulses.forEach(p => { proj(p.pos, tmp); const r = Math.max(.9, .07/2*tmp.s); ctx.fillRect(tmp.x - r, tmp.y - r, r*2, r*2); });
        ctx.globalAlpha = 1;
      },
      resize,
    };
  }
}
