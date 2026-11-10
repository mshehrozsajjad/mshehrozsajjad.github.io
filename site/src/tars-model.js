// The 3D TARS in the hero of its story page: the TARS-AI community's CAD (tools/tars-model.cjs makes tars.glb from it),
// in the silver of his print, with his avatar on its screen. It stands in [data-tars], turns with a drag, idles, and
// behaves as the humor dial says (story.js sets data-humor on <html>).
// Less motion: it stands still, with a still face. No WebGL: the stage is hidden and the page reads as before.
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';

const root = document.documentElement, stage = document.querySelector('[data-tars]');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// metal is lit by what it reflects, so each surface is a colour, how metallic it is, and how rough (0 is a mirror)
const SURFACE = {
  print: {color: '#c4c6cc', metalness: .9, roughness: .36},   // the silver of his print (matched by eye to his own videos)
  screw: {color: '#3a3b3f', metalness: 1, roughness: .3},
};
// the front of the LCD (measured from its mesh), a hair proud of it; the lid in front masks it to its opening
const GLASS = {x0: 23.6, x1: 100.8, y0: 112.9, y1: 233.6, z: 63.7};
const FOV = 28, RAD = Math.PI / 180, SPAN = 295;   // SPAN: millimetres of height in view
// the model, in the CAD's millimetres: its middle, its right foot (what it leans over), and the shaft its legs swing on
const MID = {x: 55, y: 115, z: 32.5}, FOOT = {x: 176, y: -10}, SHAFT_Y = 190;
const REST = {fun: -.5, max: -.5, dry: 0};      // how far it stands turned away, per humor band: dry faces you squarely
const LEAN = {fun: 0, max: 5, dry: 0};          // degrees

async function mount(){
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
  model.traverse(o => { const s = SURFACE[o.material?.name]; if (s){ o.material.color.set(s.color); o.material.metalness = s.metalness; o.material.roughness = s.roughness; } });
  model.updateMatrixWorld(true);

  // his face fills the display, cropped to it, the way it does on the real one
  const pane = {x: GLASS.x1 - GLASS.x0, y: GLASS.y1 - GLASS.y0};
  const face = new THREE.Mesh(new THREE.PlaneGeometry(pane.x, pane.y), new THREE.MeshBasicMaterial({color: 0x111111, toneMapped: false}));
  face.position.set((GLASS.x0 + GLASS.x1) / 2, (GLASS.y0 + GLASS.y1) / 2, GLASS.z);
  model.add(face);
  const show = (tex, w, h) => { const k = (pane.x / pane.y) / (w / h);
    tex.repeat.set(Math.min(k, 1), Math.min(1 / k, 1)); tex.offset.set((1 - tex.repeat.x) / 2, (1 - tex.repeat.y) / 2); tex.colorSpace = THREE.SRGBColorSpace;
    face.material.color.set(0xffffff); face.material.map = tex; face.material.needsUpdate = true; run(); };
  let film = null;
  if (reduce) new THREE.TextureLoader().load('/assets/media/avatar-poster.webp', t => show(t, t.image.width, t.image.height));
  else { film = Object.assign(document.createElement('video'), {src: '/assets/media/avatar-loop.mp4', muted: true, loop: true, playsInline: true});
    film.addEventListener('loadeddata', () => show(new THREE.VideoTexture(film), film.videoWidth, film.videoHeight), {once: true}); }

  // the rig: each leg swings on its shaft, "tip" leans the whole robot about its right foot, "yaw" turns it about its own middle
  const hips = ['legL', 'legR'].map(n => { const hip = new THREE.Group(); hip.position.set(0, SHAFT_Y, MID.z); model.add(hip); hip.updateMatrixWorld(); hip.attach(model.getObjectByName(n)); return hip; });
  const yaw = new THREE.Group(), tip = new THREE.Group();
  tip.position.set(FOOT.x - MID.x, FOOT.y - MID.y, 0); model.position.set(-FOOT.x, -FOOT.y, -MID.z);
  tip.add(model); yaw.add(tip); scene.add(yaw);
  camera.position.set(0, 30, SPAN / 2 / Math.tan(FOV * RAD / 2)); camera.lookAt(0, 0, 0);
  stage.append(canvas);

  let raf = 0, seen = false, drag = 0, grabbed = false, turn = REST.fun, lean = 0;
  function draw(now){
    raf = 0;
    const t = now / 1000, humor = root.dataset.humor || 'fun';
    if (!grabbed && !reduce) drag *= .94;   // let go and it turns back
    turn += (REST[humor] - turn) * .08; lean += (LEAN[humor] - lean) * .08;
    yaw.rotation.y = turn + drag + (reduce || humor === 'dry' ? 0 : Math.sin(t * .5) * .2);
    tip.rotation.z = -lean * RAD;
    const stride = humor === 'max' && !reduce ? Math.sin(t * 3) * .16 : 0;   // no filter: it walks on the spot
    hips[0].rotation.x = stride; hips[1].rotation.x = -stride;
    renderer.render(scene, camera);
    if (seen && !reduce) run();
  }
  function run(){ if (!raf) raf = requestAnimationFrame(draw); }

  new ResizeObserver(() => { const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); run(); }).observe(stage);
  // it rests (film too) while it is off screen
  new IntersectionObserver(([e]) => { seen = e.isIntersecting; if (film) seen ? film.play().catch(() => {}) : film.pause(); run(); }).observe(stage);

  // a sideways drag turns it; up and down still scrolls the page (touch-action in the stylesheet)
  canvas.addEventListener('pointerdown', e => { grabbed = true; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => { if (grabbed){ drag += e.movementX * .012; run(); } });
  ['pointerup', 'pointercancel'].forEach(ev => canvas.addEventListener(ev, () => { grabbed = false; }));
}

if (stage) mount().catch(() => { stage.hidden = true; });
