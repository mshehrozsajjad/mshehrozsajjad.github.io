// The hardware page's drawing of Yolk: his own CAD (public/assets/models/yolk.glb, sixteen named parts) drawn in ink on
// the drafting paper. One object for two places: it stands assembled on the cover with its dimensions, then follows the
// reader down to Sheet 1, where scrolling takes it apart and numbers each part against the parts list. At the end the
// drawing is "printed": the pale washes fill in as the real colours.
// The drawing lives in one fixed layer and is placed over whichever slot ([data-yk]) is on screen, so the page's own
// layout decides where it sits. No WebGL: the layer goes and the cover shows the studio render instead.
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import {toCreasedNormals} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {LineSegments2} from 'three/examples/jsm/lines/LineSegments2.js';
import {LineSegmentsGeometry} from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import {LineMaterial} from 'three/examples/jsm/lines/LineMaterial.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;
const layer = document.getElementById('ykLayer'), xp = document.getElementById('xp');
const slotA = document.querySelector('[data-yk="cover"]'), slotB = document.querySelector('[data-yk="apart"]');

// ---- the model, in the CAD's millimetres (+Z out of the front face, +Y up) ----
const CENTRE = [2.5, 3, -11];                              // the middle of the assembled body: what it turns about
const SCREEN = {size: 27, at: [6.5, 7.5, -4.25]};          // the e-paper's active area, behind the surround
const YOLK = '#f0bd12' /* matched by eye to his photographs of the built one */, DARK = '#2f3335', STEEL = '#c9cdd1', SOCKET = '#1c1f22';
const FINISH = {
  '01-front-shell': YOLK, '07-indicator-inlay': YOLK,
  '02-rear-tray': DARK, '03-screen-surround': DARK, '04-dial-cap': DARK, '06-talk-paddle': DARK,
  '08-rear-screws': STEEL, '08-rear-screw-sockets': SOCKET, 'hw-board-screws': STEEL, 'hw-board-screw-sockets': SOCKET,
  'hw-board-waveshare': '#1d5c3e', 'hw-battery-602035': '#c3c7cc', 'hw-speaker': '#3a3e42',
  'hw-dial-encoder-ec11': '#a7acb2', 'hw-usb-c-ribbon': '#c58a3a', 'hw-usb-c-extension-66mm': '#9ea3a8',
};
// how far each part travels when the device is apart
const TRAVEL = {
  '04-dial-cap': [0, 0, 34], '07-indicator-inlay': [0, 0, 34], '03-screen-surround': [0, 0, 20], '06-talk-paddle': [24, 0, 0],
  '01-front-shell': [0, 0, 0], 'hw-dial-encoder-ec11': [0, 0, -26], 'hw-board-waveshare': [0, 0, -30],
  'hw-board-screws': [0, 0, -38], 'hw-board-screw-sockets': [0, 0, -38],
  'hw-usb-c-extension-66mm': [0, -16, -30], 'hw-usb-c-ribbon': [0, -16, -30],
  'hw-speaker': [0, 0, -42], 'hw-battery-602035': [0, 0, -50],
  '02-rear-tray': [0, 0, -70], '08-rear-screws': [0, 0, -86], '08-rear-screw-sockets': [0, 0, -86],
};
const SPREAD = 1.5;       // the drawing pulls them further apart than that, so no part hides the next
const SPREAD_MID = -26;   // the middle of that travel along Z: the exploded drawing is centred on it
// the parts list, in the order of the rows on the page (.bom li). The first part of each carries the balloon:
// "at" picks a corner of its box (-1..1 on x and y), "to" is where the balloon sits from there, in pixels.
const ITEMS = [
  {parts: ['04-dial-cap', '07-indicator-inlay'], at: [0, -1], to: [-16, 44]},
  {parts: ['03-screen-surround'], at: [0, 1], to: [-22, -44]},
  {parts: ['06-talk-paddle'], at: [0, 1], to: [-4, -170]},
  {parts: ['01-front-shell'], at: [-.4, 1], to: [-26, -40]},
  {parts: ['hw-dial-encoder-ec11'], at: [0, -1], to: [0, 52]},
  {parts: ['hw-board-waveshare', 'hw-board-screws', 'hw-board-screw-sockets'], at: [0, 1], to: [0, -48]},
  {parts: ['hw-usb-c-extension-66mm', 'hw-usb-c-ribbon'], at: [0, -1], to: [18, 50]},
  {parts: ['hw-speaker'], at: [0, -1], to: [-100, 165]},
  {parts: ['hw-battery-602035'], at: [0, 1], to: [8, -66]},
  {parts: ['02-rear-tray', '08-rear-screws', '08-rear-screw-sockets'], at: [1, -1], to: [40, 30]},
];

// ---- the drawing ----
const INK = '#141414', RED = '#E0442A', PAPER = '#FBFAF6';
const WASH = .34;                                   // how much of a part's real colour shows before it is printed
const POSE = {cover: {rx: .2, ry: -.5}, apart: {rx: .4, ry: -1.05}};
const NEED = {whole: 104, apartW: 205, apartH: 128};   // millimetres the drawing needs across: assembled, and apart
const SVG = 'http://www.w3.org/2000/svg';

const cl = v => Math.max(0, Math.min(1, v)), mix = (a, b, t) => a + (b - a)*t, ease = t => t < .5 ? 2*t*t : 1 - (-2*t + 2)**2/2;

// a loaded mesh (quantized, with its own transform) as plain geometry in model space; fillets shade smooth, real edges stay crisp
function bake(mesh){
  const src = mesh.geometry.attributes.position, pos = new Float32Array(src.count*3), v = new THREE.Vector3();
  for (let i = 0; i < src.count; i++){ v.fromBufferAttribute(src, i).applyMatrix4(mesh.matrixWorld); pos.set([v.x, v.y, v.z], i*3); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  if (mesh.geometry.index) geo.setIndex(Array.from(mesh.geometry.index.array));
  return toCreasedNormals(geo, 32*Math.PI/180);
}
const inked = (positions, material) => new LineSegments2(new LineSegmentsGeometry().setPositions(positions), material);
const el = (name, attrs = {}, parent) => { const n = document.createElementNS(SVG, name); for (const k in attrs) n.setAttribute(k, attrs[k]); parent?.append(n); return n; };

async function mount(){
  // asked first, quietly: three.js fills the console with errors when the browser has WebGL switched off
  if (!document.createElement('canvas').getContext('webgl2')) throw new Error('no WebGL');
  const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 4000);   // no perspective: a drawing
  camera.position.z = 2000;
  const sun = new THREE.DirectionalLight(0xffffff, 1.5); sun.position.set(-.5, .9, 1);
  scene.add(new THREE.AmbientLight(0xffffff, 2), sun);
  // outer: where it sits, how big, and its tilt toward the viewer. turn: about its own upright. model: CAD space.
  const outer = new THREE.Group(), turn = new THREE.Group(), model = new THREE.Group();
  turn.add(model); outer.add(turn); scene.add(outer);

  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync('/assets/models/yolk.glb');
  gltf.scene.updateMatrixWorld(true);
  const ink = new LineMaterial({color: INK, linewidth: 1.15, transparent: true});
  const red = new LineMaterial({color: RED, linewidth: 1, transparent: true});
  const paper = new THREE.Color(PAPER), signal = new THREE.Color(RED);
  const parts = new Map();
  gltf.scene.traverse(src => {
    const name = src.name || src.parent?.name;
    if (!src.isMesh || !FINISH[name]) return;
    const geo = bake(src); geo.computeBoundingBox();
    // the fill sits a hair behind its own lines, and hides the lines of whatever is behind it
    const fill = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1}));
    const g = new THREE.Group();
    g.add(fill, new LineSegments2(new LineSegmentsGeometry().fromEdgesGeometry(new THREE.EdgesGeometry(geo, 30)), ink));
    model.add(g);
    parts.set(name, {g, fill, box: geo.boundingBox, real: new THREE.Color(FINISH[name]), travel: new THREE.Vector3(...TRAVEL[name]), item: ITEMS.findIndex(i => i.parts.includes(name))});
  });
  if (!parts.size) throw new Error('no parts');

  // the e-paper, showing what it shows when it is on: it rides with its board
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN.size, SCREEN.size), new THREE.MeshBasicMaterial({color: 0xf3f0e8}));
  new THREE.TextureLoader().load('/assets/media/yolk-screen.webp', t => { t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; screen.material.map = t; screen.material.needsUpdate = true; });
  model.add(screen);

  // the cover's dimensions, in red pencil: width under the body, height beside it, each with its extension lines and ticks
  const body = parts.get('01-front-shell').box.clone().union(parts.get('02-rear-tray').box);
  const {min, max} = body, z = max.z, OUT = 10, T = 1.8, wy = min.y - OUT, hx = min.x - OUT;
  const dims = inked([
    min.x, wy, z, max.x, wy, z,   min.x, min.y - 2, z, min.x, wy - 3, z,   max.x, min.y - 2, z, max.x, wy - 3, z,
    min.x - T, wy - T, z, min.x + T, wy + T, z,   max.x - T, wy - T, z, max.x + T, wy + T, z,
    hx, min.y, z, hx, max.y, z,   min.x - 2, min.y, z, hx - 3, min.y, z,   min.x - 2, max.y, z, hx - 3, max.y, z,
    hx - T, min.y - T, z, hx + T, min.y + T, z,   hx - T, max.y - T, z, hx + T, max.y + T, z,
  ], red);
  model.add(dims);
  const size = body.getSize(new THREE.Vector3());
  document.querySelectorAll('[data-yk-size]').forEach(n => { n.textContent = `Yolk · ${Math.round(size.x)} × ${Math.round(size.y)} × ${Math.round(size.z)} mm`; });

  // marks drawn over the canvas: the two dimension figures, and a numbered balloon per row of the parts list
  const marks = el('svg', {class: 'yk-marks'}, layer);
  const dimText = [[(min.x + max.x)/2, wy - 5, Math.round(size.x)], [hx - 6, (min.y + max.y)/2, Math.round(size.y)]]
    .map(([x, y, mm]) => { const t = el('text', {class: 'yk-dim'}, marks); t.textContent = mm; return {t, x, y}; });
  const rows = [...document.querySelectorAll('.bom li')];
  const balloons = ITEMS.map((item, i) => {
    const g = el('g', {class: 'yk-bal'}, marks);
    const line = el('line', {}, g); el('circle', {r: 2.5, class: 'dot'}, g);
    const ring = el('circle', {r: 13, class: 'ring'}, g), num = el('text', {}, g);
    num.textContent = String(i + 1).padStart(2, '0');
    return {g, line, ring, num, dot: g.children[1]};
  });
  // a row and its balloon point at each other: either one lights the part
  let hot = -1;
  const heat = i => { hot = i; rows.forEach((r, j) => r.classList.toggle('hot', j === i)); balloons.forEach((b, j) => b.g.classList.toggle('hot', j === i)); run(); };
  rows.forEach((r, i) => { r.addEventListener('pointerenter', () => heat(i)); r.addEventListener('pointerleave', () => heat(-1)); });
  balloons.forEach((b, i) => { b.g.addEventListener('pointerenter', () => heat(i)); b.g.addEventListener('pointerleave', () => heat(-1)); });

  // a sideways drag on the drawing turns it; let go and it turns back. Up and down still scrolls (touch-action in the stylesheet).
  const grab = document.createElement('div'); grab.className = 'yk-grab';
  layer.prepend(renderer.domElement); layer.append(grab);
  let spin = 0, held = false, tx = 0, ty = 0;
  grab.addEventListener('pointerdown', e => { held = true; grab.setPointerCapture(e.pointerId); layer.classList.add('turned'); });
  grab.addEventListener('pointermove', e => { if (held){ spin += e.movementX*.012; run(); } });
  ['pointerup', 'pointercancel'].forEach(ev => grab.addEventListener(ev, () => { held = false; run(); }));
  if (!reduce) addEventListener('pointermove', e => { tx = e.clientX/innerWidth - .5; ty = e.clientY/innerHeight - .5; run(); }, {passive: true});

  const v = new THREE.Vector3();
  const stage = xp.querySelector('.xp-stage');
  let W = 0, H = 0, pinned = false, raf = 0, t = 0, e = 0, k = 0, stx = 0, sty = 0, first = true;
  const px = (obj, x, y, zz) => { v.set(x, y, zz); obj.localToWorld(v).project(camera); return [(v.x*.5 + .5)*W, (-v.y*.5 + .5)*H]; };

  function frame(now){
    raf = 0;
    const w = layer.clientWidth, h = layer.clientHeight;
    if (w !== W || h !== H){ W = w; H = h; renderer.setSize(W, H, false); ink.resolution.set(W, H); red.resolution.set(W, H);
      camera.left = -W/2; camera.right = W/2; camera.top = H/2; camera.bottom = -H/2; camera.updateProjectionMatrix();
      pinned = getComputedStyle(stage).position === 'sticky'; }
    const a = slotA.getBoundingClientRect(), b = slotB.getBoundingClientRect(), x = xp.getBoundingClientRect();
    const seen = (a.bottom > 0 && a.top < H && a.width > 0) || (b.bottom > 0 && b.top < H);
    layer.classList.toggle('on', seen);
    if (!seen) return;

    // t: 0 on the cover, 1 on Sheet 1. e: how far apart. k: how far printed.
    // Where the sheet is pinned, the scroll through the pin drives e and k; where it is not (phones), the slot's own passage does.
    const span = x.height - H;
    let tt = a.width ? ease(cl((H - b.top)/(H*.75))) : 1, te, tk;
    if (reduce){ te = Math.round(tt); tk = 0; }
    else if (pinned){ const p = -x.top/span; te = ease(cl(p/.7)); tk = cl((p - .78)/.2); }
    else { te = ease(cl((H*.72 - b.top)/(H*.5))); tk = cl((H*.14 - b.top)/(H*.3)); }
    const rate = first || reduce ? 1 : .14; first = false;
    t += (tt - t)*rate; e += (te - e)*rate; k += (tk - k)*rate;
    if (!held) spin *= reduce ? 0 : .93;
    stx += (tx - stx)*.1; sty += (ty - sty)*.1;

    // place it: the middle of whichever slot it belongs to now, as large as that slot allows
    const cx = mix(a.left + a.width/2, b.left + b.width/2, t), cy = mix(a.top + a.height/2, b.top + b.height/2, t);
    const whole = Math.min(b.width, b.height)/NEED.whole, apart = Math.min(b.width/NEED.apartW, b.height/NEED.apartH);
    const s = mix(Math.min(a.width, a.height)/NEED.whole || whole, mix(whole, apart, e), t);
    outer.position.set(cx - W/2, H/2 - cy, 0); outer.scale.setScalar(s);
    outer.rotation.x = mix(POSE.cover.rx, POSE.apart.rx, t) + sty*.12;
    turn.rotation.y = mix(POSE.cover.ry, POSE.apart.ry, t) + spin + stx*.2 + (reduce ? 0 : Math.sin(now/1000*.6)*.1*(1 - t));
    model.position.set(-CENTRE[0], -CENTRE[1], -CENTRE[2] - SPREAD_MID*SPREAD*e);

    for (const [name, p] of parts){
      p.g.position.copy(p.travel).multiplyScalar(e*SPREAD);
      if (name.startsWith('hw-')) p.g.visible = e > .02;   // inside the shell there is nothing to draw
      p.fill.material.color.copy(paper).lerp(p.real, mix(WASH, 1, k));
      if (p.item === hot) p.fill.material.color.lerp(signal, .5);
    }
    screen.position.set(...SCREEN.at).addScaledVector(parts.get('hw-board-waveshare').travel, e*SPREAD);
    ink.opacity = mix(1, .55, k);
    dims.visible = t < .98; red.opacity = 1 - t;
    scene.updateMatrixWorld(true);

    marks.setAttribute('viewBox', `0 0 ${W} ${H}`);
    dimText.forEach(d => { const [X, Y] = px(model, d.x, d.y, z); d.t.setAttribute('x', X); d.t.setAttribute('y', Y); d.t.style.opacity = 1 - t; });
    ITEMS.forEach((item, i) => {
      const p = parts.get(item.parts[0]), c = p.box.getCenter(v), half = p.box.getSize(new THREE.Vector3()).multiplyScalar(.5);
      const [X, Y] = px(p.g, c.x + item.at[0]*half.x, c.y + item.at[1]*half.y, c.z + half.z), reach = Math.min(1, s/3), bx = X + item.to[0]*reach, by = Y + item.to[1]*reach;   // shorter leaders on a small drawing
      const on = e > .1 + i/(ITEMS.length - 1)*.66, b2 = balloons[i];
      rows[i]?.classList.toggle('on', on); b2.g.classList.toggle('on', on && e > .5);
      b2.line.setAttribute('x1', X); b2.line.setAttribute('y1', Y); b2.line.setAttribute('x2', bx); b2.line.setAttribute('y2', by);
      b2.dot.setAttribute('cx', X); b2.dot.setAttribute('cy', Y); b2.ring.setAttribute('cx', bx); b2.ring.setAttribute('cy', by);
      b2.num.setAttribute('x', bx); b2.num.setAttribute('y', by);
    });
    xp.classList.toggle('apart', e > .9);
    xp.classList.toggle('printed', k > .6);
    const r = s*46; grab.style.cssText = `left:${cx - r}px;top:${cy - r}px;width:${2*r}px;height:${2*r}px`;
    grab.hidden = e > .05;   // apart, the balloons want the pointer

    renderer.render(scene, camera);
    // it keeps drawing while it has somewhere to get to, or while it sways on the cover
    const moving = Math.abs(tt - t) + Math.abs(te - e) + Math.abs(tk - k) + Math.abs(spin) + Math.abs(tx - stx) + Math.abs(ty - sty) > .002;
    if (moving || held || (!reduce && t < .98)) run();
  }
  function run(){ if (!raf) raf = requestAnimationFrame(frame); }
  addEventListener('scroll', run, {passive: true}); addEventListener('resize', run);
  root.classList.add('yk-live');
  run();
}

if (layer && xp && slotA && slotB) mount().catch(() => { layer.hidden = true; root.classList.add('yk-off'); });
