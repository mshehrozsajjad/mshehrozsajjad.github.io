// The 3D TARS in the hero of its story page: the TARS-AI community's CAD (tools/tars-model.cjs makes tars.glb from it),
// in the silver of his print, with his avatar on its screen. It stands in [data-tars], turns with a drag, idles, and
// behaves as the humor dial says (story.js sets data-humor on <html>). It walks on the spot the whole time.
// On the hardware page's blueprint (data-tars="drawing") the same robot is drawn instead: white line on the sheet's blue.
// On its own blueprint page (data-tars="built") it is the one he built: dark printed plastic, its panel lines picked out;
// further down that page (data-tars="elevation") it is drawn again, square to the reader and still, with his face in the opening.
// A page can hold more than one: every [data-tars] gets its own.
// Less motion: it stands still, with a still face. No WebGL: the stage is hidden and the page reads as before.
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {LineSegments2} from 'three/examples/jsm/lines/LineSegments2.js';
import {LineSegmentsGeometry} from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import {LineMaterial} from 'three/examples/jsm/lines/LineMaterial.js';

const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// metal is lit by what it reflects, so each surface is a colour, how metallic it is, and how rough (0 is a mirror)
const SURFACE = {
  print: {color: '#c4c6cc', metalness: .9, roughness: .36},   // the silver of his print (matched by eye to his own videos)
  graphite: {color: '#2a2c31', metalness: .35, roughness: .55},   // the dark print of the one in his photograph (not the model's own "dark" material, which keeps its colour)
  screw: {color: '#3a3b3f', metalness: 1, roughness: .3},
};
// the front of the LCD (measured from its mesh), a hair proud of it; the lid in front masks it to its opening
const GLASS = {x0: 23.6, x1: 100.8, y0: 112.9, y1: 233.6, z: 63.7};
const FOV = 28, RAD = Math.PI / 180, SPAN = 295;   // SPAN: millimetres of height in view
// the model, in the CAD's millimetres: its middle, its right foot (what it leans over), and the shaft its legs swing on
const MID = {x: 55, y: 115, z: 32.5}, FOOT = {x: 176, y: -10}, SHAFT_Y = 190;
const REST = {fun: -.5, max: -.5, dry: 0};      // how far it stands turned away, per humor band: dry faces you squarely
const LEAN = {fun: 0, max: 5, dry: 0};          // degrees

async function mount(stage){
  const mode = stage.dataset.tars, flat = mode === 'elevation', drawn = mode === 'drawing' || flat, built = mode === 'built';
  // asked first, quietly: three.js fills the console with errors when the browser has WebGL switched off
  if (!document.createElement('canvas').getContext('webgl2')) throw new Error('no WebGL');
  const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;   // keeps the metal's highlights from burning out
  const canvas = renderer.domElement, scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(FOV, 1, 10, 4000);
  // a soft studio for the metal to reflect, a key light for the panel lines, and a cool rim so its edges read
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = 1.25;
  const key = new THREE.DirectionalLight(0xffffff, 2.2), rim = new THREE.DirectionalLight(0xc8d4ff, 1.6);
  key.position.set(300, 500, 600); rim.position.set(-500, 200, -400);
  scene.add(key, rim);

  const model = (await new GLTFLoader().loadAsync('/assets/models/tars.glb')).scene;
  let line = null;
  if (drawn){
    // every surface takes the sheet's own blue, so it hides the lines behind it; its edges are ruled in white
    const fill = new THREE.MeshBasicMaterial({color: getComputedStyle(stage).getPropertyValue('--bp').trim() || '#123A66', toneMapped: false, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1});
    line = new LineMaterial({color: '#F2F6FB', linewidth: 1.1, toneMapped: false});
    const meshes = []; model.traverse(o => { if (o.isMesh) meshes.push(o); });
    meshes.forEach(o => { o.material = fill; o.add(new LineSegments2(new LineSegmentsGeometry().fromEdgesGeometry(new THREE.EdgesGeometry(o.geometry, 30)), line)); });
  } else {
    model.traverse(o => { const s = built && o.material?.name === 'print' ? SURFACE.graphite : SURFACE[o.material?.name]; if (s){ o.material.color.set(s.color); o.material.metalness = s.metalness; o.material.roughness = s.roughness; } });
    if (built){   // dark plastic on a dark sheet: its edges are ruled in, faintly, so the slabs and panels read
      line = new LineMaterial({color: '#AFC3DD', linewidth: 1, transparent: true, opacity: .55, toneMapped: false});
      const meshes = []; model.traverse(o => { if (o.isMesh){ o.material.polygonOffset = true; o.material.polygonOffsetFactor = 1; o.material.polygonOffsetUnits = 1; meshes.push(o); } });
      meshes.forEach(o => o.add(new LineSegments2(new LineSegmentsGeometry().fromEdgesGeometry(new THREE.EdgesGeometry(o.geometry, 30)), line)));
    }
  }
  model.updateMatrixWorld(true);
  // the room it needs to turn in: the furthest any corner gets from its upright axis, and from its middle in height
  const box = new THREE.Box3().setFromObject(model);
  const reach = Math.hypot(Math.max(box.max.x - MID.x, MID.x - box.min.x), Math.max(box.max.z - MID.z, MID.z - box.min.z)), rise = Math.max(box.max.y - MID.y, MID.y - box.min.y);

  // his face fills the display, cropped to it, the way it does on the real one
  const pane = {x: GLASS.x1 - GLASS.x0, y: GLASS.y1 - GLASS.y0};
  const face = new THREE.Mesh(new THREE.PlaneGeometry(pane.x, pane.y), new THREE.MeshBasicMaterial({color: 0x111111, toneMapped: false}));
  face.position.set((GLASS.x0 + GLASS.x1) / 2, (GLASS.y0 + GLASS.y1) / 2, GLASS.z);
  model.add(face);
  const show = (tex, w, h) => { const k = (pane.x / pane.y) / (w / h);
    tex.repeat.set(Math.min(k, 1), Math.min(1 / k, 1)); tex.offset.set((1 - tex.repeat.x) / 2, (1 - tex.repeat.y) / 2); tex.colorSpace = THREE.SRGBColorSpace;
    face.material.color.set(0xffffff); face.material.map = tex; face.material.needsUpdate = true; run(); };
  let film = null, blink = null;
  if (drawn && !flat){
    // on the blueprint its screen is a terminal: what is running, and the humor setting from its own story
    const pad = Object.assign(document.createElement('canvas'), {width: 308, height: 484}), ctx = pad.getContext('2d'), tex = new THREE.CanvasTexture(pad);
    const LINES = ['TARS · local', '', '> stt    ok', '> llm    ok', '> voice  ok', '> face   ok', '', 'humor  75%', ''];
    blink = on => { ctx.fillStyle = '#0B2747'; ctx.fillRect(0, 0, pad.width, pad.height); ctx.fillStyle = '#F2F6FB'; ctx.font = '500 26px "JetBrains Mono", ui-monospace, monospace';
      LINES.forEach((l, i) => ctx.fillText(l, 22, 56 + i*44)); ctx.fillText(on ? '> _' : '>', 22, 56 + LINES.length*44); tex.needsUpdate = true; };
    (document.fonts?.ready || Promise.resolve()).then(() => { blink(true); show(tex, pad.width, pad.height); });   // once the mono face is in, and the loop below exists
  }
  else if (reduce) new THREE.TextureLoader().load('/assets/media/avatar-poster.webp', t => show(t, t.image.width, t.image.height));
  else { film = Object.assign(document.createElement('video'), {src: '/assets/media/avatar-loop.mp4', muted: true, loop: true, playsInline: true});
    film.addEventListener('loadeddata', () => show(new THREE.VideoTexture(film), film.videoWidth, film.videoHeight), {once: true}); }

  // the rig: each leg swings on its shaft, "tip" leans the whole robot about its right foot, "yaw" turns it about its own middle
  const hips = ['legL', 'legR'].map(n => { const hip = new THREE.Group(); hip.position.set(0, SHAFT_Y, MID.z); model.add(hip); hip.updateMatrixWorld(); hip.attach(model.getObjectByName(n)); return hip; });
  const yaw = new THREE.Group(), tip = new THREE.Group();
  tip.position.set(FOOT.x - MID.x, FOOT.y - MID.y, 0); model.position.set(-FOOT.x, -FOOT.y, -MID.z);
  tip.add(model); yaw.add(tip); scene.add(yaw);
  camera.position.set(0, 30, SPAN / 2 / Math.tan(FOV * RAD / 2)); camera.lookAt(0, 0, 0);
  stage.append(canvas);

  let raf = 0, seen = false, lit = true, drag = 0, grabbed = false, turn = flat ? 0 : REST.fun, lean = 0;
  function draw(now){
    raf = 0;
    const t = now / 1000, humor = root.dataset.humor || 'fun';
    if (!grabbed && !reduce) drag *= .94;   // let go and it turns back
    turn += ((flat ? 0 : REST[humor]) - turn) * .08; lean += ((flat ? 0 : LEAN[humor]) - lean) * .08;
    yaw.rotation.y = turn + drag + (reduce || flat || humor === 'dry' ? 0 : Math.sin(t * .5) * .2);
    tip.rotation.z = -lean * RAD;
    const stride = reduce || flat ? 0 : humor === 'max' && !drawn ? Math.sin(t * 3.4) * .26 : Math.sin(t * 2) * .22;   // it walks on the spot, so it never reads as a block; no filter: faster
    if (blink && (t % 1 < .5) !== lit) blink(lit = !lit);
    hips[0].rotation.x = stride; hips[1].rotation.x = -stride;
    renderer.render(scene, camera);
    if (seen && !reduce) run();
  }
  function run(){ if (!raf) raf = requestAnimationFrame(draw); }

  new ResizeObserver(() => { const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); line?.resolution.set(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
    // on the blueprint it turns freely in a narrow stage: stand back until its whole turning circle fits, nearest corner included
    if (drawn || built){ const tv = Math.tan(FOV * RAD / 2), th = tv * camera.aspect; camera.position.z = 1.08 * (reach + Math.max(reach / th, rise / tv)); camera.lookAt(0, 0, 0); }
    if (flat){   // an elevation is seen dead level, and stands on the datum line ruled along the foot of its stage (12px of hatching)
      camera.position.y = 0; camera.lookAt(0, 0, 0);
      const half = Math.tan(FOV * RAD / 2) * camera.position.z; yaw.position.y = rise - half + 14 * 2 * half / h; }
    run(); }).observe(stage);
  // it rests (film too) while it is off screen
  new IntersectionObserver(([e]) => { seen = e.isIntersecting; if (film) seen ? film.play().catch(() => {}) : film.pause(); run(); }).observe(stage);

  // a sideways drag turns it; up and down still scrolls the page (touch-action in the stylesheet)
  canvas.addEventListener('pointerdown', e => { grabbed = true; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => { if (grabbed){ drag += e.movementX * .012; run(); } });
  ['pointerup', 'pointercancel'].forEach(ev => canvas.addEventListener(ev, () => { grabbed = false; }));
}

document.querySelectorAll('[data-tars]').forEach(stage => mount(stage).catch(() => { stage.hidden = true; }));
