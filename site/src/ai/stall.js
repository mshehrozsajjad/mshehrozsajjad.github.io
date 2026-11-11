// The side projects' shopfront, in 3D, filling the hero and seen at an angle: a striped cloth awning over the whole of
// it, moving in the air; a varnished wooden counter, whole and free-standing; and the five products stacked on it as
// printed shipping cartons, which drop onto the counter one by one as you arrive. The words of the hero are the page's
// own, set over it (ai.css). Hovering a carton lifts it, and a carton opens that product's receipt (the same sheet the
// shelf opens, lab.js).
// Names, lines and statuses are read from the page, so there is one source for them. No WebGL: the hero keeps its flat
// awning and receipt. Less motion: everything stands still, already in place.
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';

const root = document.documentElement, stage = document.querySelector('[data-stall]');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * k;

// Everything is in "stall units": a carton is 2.7 wide, and the hero is SPAN of them tall.
const COLOR = {blue: '#2D2BE0', cream: '#FBF7EE', trim: '#5E3B1E',live: '#0E9F6E', stop: '#6F7480'};
const SANS = '"Instrument Sans", sans-serif', MONO = '"JetBrains Mono", monospace';
const FOV = 38, RAD = Math.PI / 180, SPAN = 12, LOOK_Y = 6;   // a wide lens, so near and far differ
const YAW = .4;   // the whole shopfront is turned: its right end comes toward you, its left runs away into the page
const COUNTER = {h: 2.3, d: 3.4, z: 1.2};   // its width is whatever shows it whole on this screen
const ROOF = {w: 66, back: {y: 17, z: -4}, front: {y: 10.8, z: 4}, drop: 1.1, stripe: .9};   // the awning: down from the wall to its front edge, then the valance
const NARROW = {stripes: 1.8, drop: .56};   // a phone sees the same awning with finer stripes and a shorter valance
const BOX = {w: 2.7, h: 1.8, d: 2.2};
// where the five stand: three on the counter, two on top, none quite square (x, row, turn)
const STACK = [[-2.9, 0, .1], [0, 0, -.06], [2.95, 0, .14], [-1.4, 1, -.12], [1.55, 1, .08]];
const DROP = {from: 5, seconds: .75, apart: .13, wait: .35};   // the cartons' arrival

const canvasOf = (w, h) => { const c = Object.assign(document.createElement('canvas'), {width: w, height: h}); return [c, c.getContext('2d')]; };
const textureOf = (c, repeatX = 1, repeatY = 1) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeatX, repeatY); return t; };
// a cheap, repeatable scatter for grain and specks (the same every load)
const noise = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
// lands with one small bounce
const settle = k => k < .72 ? (k / .72) ** 2 : 1 - .06 * Math.sin((k - .72) / .28 * Math.PI);

/* ---------- surfaces: his texture pictures (public/assets/textures/shop-*.webp, made by tools/shop-textures.py) ---------- */
const PIC = {};
const loadPictures = () => Promise.all(['counter-top', 'counter-front', 'cardboard', 'canvas'].map(name => new Promise((ok, fail) => {
  const img = new Image(); img.onload = () => { PIC[name] = img; ok(); }; img.onerror = fail; img.src = `/assets/textures/shop-${name}.webp`; })));
// a picture laid over a surface, repeated; mirrored at each repeat, so a picture that doesn't tile shows no seam
function picture(name, repeatX, repeatY){
  const t = new THREE.Texture(PIC[name]); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16;
  t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping; t.repeat.set(repeatX, repeatY); t.needsUpdate = true; return t;
}
// the cloth: his canvas dyed in one blue stripe and one cream, each shaded toward its edges like a soft fold.
// The valance's stripes end in a scallop each (cut out, so the edge is real), hemmed at the top and stitched round the curve
function clothTexture(scalloped){
  const s = 256, h = scalloped ? Math.round(s * ROOF.drop / ROOF.stripe) : s, [c, g] = canvasOf(s * 2, h);
  [[COLOR.blue, COLOR.cream], [COLOR.cream, COLOR.blue]].forEach(([colour, thread], i) => {
    const x0 = i * s, edge = new Path2D();
    if (scalloped){ edge.moveTo(x0, 0); edge.lineTo(x0, h - s / 2); edge.arc(x0 + s / 2, h - s / 2, s / 2, Math.PI, 0, true); edge.lineTo(x0 + s, 0); edge.closePath(); }
    else edge.rect(x0, 0, s, h);
    g.save(); g.clip(edge);
    for (let y = 0; y < h; y += s) g.drawImage(PIC.canvas, 0, 0, PIC.canvas.width / 2, PIC.canvas.height / 2, x0, y, s, s);   // a quarter of the picture per stripe, so the weave reads at this scale
    g.globalCompositeOperation = 'multiply'; g.fillStyle = colour; g.fillRect(x0, 0, s, h); g.globalCompositeOperation = 'source-over';
    const fold = g.createLinearGradient(x0, 0, x0 + s, 0);
    fold.addColorStop(0, 'rgba(10,8,60,.16)'); fold.addColorStop(.3, 'rgba(10,8,60,0)'); fold.addColorStop(.55, 'rgba(255,255,255,.07)'); fold.addColorStop(.8, 'rgba(10,8,60,0)'); fold.addColorStop(1, 'rgba(10,8,60,.14)');
    g.fillStyle = fold; g.fillRect(x0, 0, s, h);
    if (scalloped){
      g.fillStyle = 'rgba(10,8,60,.14)'; g.fillRect(x0, 0, s, 16);                    // the hem it hangs by
      g.strokeStyle = thread; g.globalAlpha = .7; g.lineWidth = 3; g.setLineDash([10, 8]);
      g.beginPath(); g.moveTo(x0 + 18, 16); g.lineTo(x0 + 18, h - s / 2); g.arc(x0 + s / 2, h - s / 2, s / 2 - 18, Math.PI, 0, true); g.lineTo(x0 + s - 18, 16); g.stroke();
    }
    g.restore();
  });
  // the roof's texture is repeated down its slope too, so its weave keeps square threads
  const t = textureOf(c, ROOF.w / ROOF.stripe / 2, scalloped ? 1 : Math.hypot(ROOF.back.y - ROOF.front.y, ROOF.front.z - ROOF.back.z) / ROOF.stripe);
  if (scalloped) t.wrapT = THREE.ClampToEdgeWrapping;   // repeated downward, the hem at its top would show again as a thin line under the scallops
  return t;
}
// plain card, for a carton: a piece of his cardboard, from a different part of the picture for each seed
function cardTexture(seed){
  const [c, g] = canvasOf(512, 512), rnd = noise(seed), img = PIC.cardboard, k = .62;
  g.drawImage(img, rnd() * img.width * (1 - k), rnd() * img.height * (1 - k), img.width * k, img.height * k, 0, 0, 512, 512);
  return c;
}
// a carton's face, printed the way shipping cartons are: one ink on kraft. The run number over a rule, the name set
// tight beneath it, handling marks in the corner, packing tape over the flaps, a white address label saying what's
// inside, and a round sticker for its status
function boxFace(pc, n){
  const W = 768, H = 512, [c, g] = canvasOf(W, H), rnd = noise(n * 97 + 13), INK = 'rgba(38,28,18,.9)';
  const name = $('.pc-edge b', pc).textContent.toUpperCase(), line = $('.pc-line', pc).textContent, metric = $('.pc-metric', pc).textContent.toUpperCase(), tag = $('.tag', pc);
  const spaced = px => { if ('letterSpacing' in g) g.letterSpacing = px + 'px'; };

  // the card, with a little shade toward its edges
  g.drawImage(cardTexture(n * 97 + 13), 0, 0, W, H);
  const shade = g.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, W * .72); shade.addColorStop(0, 'rgba(60,36,12,0)'); shade.addColorStop(1, 'rgba(60,36,12,.2)');
  g.fillStyle = shade; g.fillRect(0, 0, W, H);

  // packing tape, down from the top flaps, torn off unevenly
  g.fillStyle = 'rgba(243,230,196,.62)'; g.beginPath(); g.moveTo(322, 0); g.lineTo(430, 0); g.lineTo(430, 168);
  for (let x = 430; x >= 322; x -= 12) g.lineTo(x, 160 + rnd() * 16); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(330, 0, 6, 158);

  // handling marks: this way up
  g.strokeStyle = g.fillStyle = INK; g.lineWidth = 7; g.lineJoin = 'miter';
  [60, 118].forEach(x => { g.beginPath(); g.moveTo(x, 122); g.lineTo(x, 62); g.stroke(); g.beginPath(); g.moveTo(x - 20, 76); g.lineTo(x, 44); g.lineTo(x + 20, 76); g.closePath(); g.fill(); });
  g.fillRect(36, 130, 106, 7);
  g.font = `500 17px ${MONO}`; g.textAlign = 'left'; spaced(2.5); g.fillText('THIS WAY UP', 36, 164);

  // the run number, a rule, the name as wide as the carton, and what it has to show for itself
  g.font = `500 21px ${MONO}`; spaced(3); g.fillText(`SIDE PROJECT  N° 0${n} / 05`, 40, 296);
  g.textAlign = 'right'; g.fillText('MUNICH', W - 40, 296); g.textAlign = 'left'; spaced(0);
  g.fillRect(40, 310, W - 80, 3);
  g.font = `700 160px ${SANS}`;
  const squeeze = Math.min(.78, (W - 80) / g.measureText(name).width);
  g.save(); g.translate(38, 446); g.scale(squeeze, 1); g.fillText(name, 0, 0); g.restore();
  g.font = `500 19px ${MONO}`; spaced(2.5); g.fillText(metric, 40, 484); spaced(0);

  // the address label: what's inside, in his words
  g.save(); g.translate(446, 34); g.rotate(.028);
  g.shadowColor = 'rgba(40,24,8,.35)'; g.shadowBlur = 10; g.shadowOffsetY = 3; g.fillStyle = '#FFFEFA'; g.fillRect(0, 0, 284, 214); g.shadowColor = 'transparent';
  g.fillStyle = '#6B665D'; g.font = `500 14px ${MONO}`; spaced(2); g.fillText('CONTENTS', 18, 32); spaced(0);
  g.fillStyle = '#1D1B18'; g.fillRect(18, 42, 248, 2);
  g.font = `600 21px ${SANS}`;
  const lines = line.split(' ').reduce((ls, w) => { const l = ls[ls.length - 1] + (ls[ls.length - 1] ? ' ' : '') + w; if (g.measureText(l).width > 246) ls.push(w); else ls[ls.length - 1] = l; return ls; }, ['']).slice(0, 4);
  lines.forEach((l, i) => g.fillText(l, 18, 72 + i * 26));
  for (let x = 18, i = 0; x < 262; i++){ const w = [3, 1, 4, 2, 1, 3][i % 6]; g.fillRect(x, 174, w, 26); x += w + [2, 3, 2][i % 3]; }
  g.restore();

  // the status: a round sticker, pressed on a little crooked over the label's corner
  const stopped = tag.classList.contains('stopped');
  g.save(); g.translate(452, 244); g.rotate(-.2);
  g.shadowColor = 'rgba(40,24,8,.35)'; g.shadowBlur = 8; g.shadowOffsetY = 2;
  g.fillStyle = stopped ? COLOR.stop : COLOR.blue; g.beginPath(); g.arc(0, 0, 58, 0, Math.PI * 2); g.fill(); g.shadowColor = 'transparent';
  g.strokeStyle = 'rgba(251,247,238,.55)'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 49, 0, Math.PI * 2); g.stroke();
  g.fillStyle = COLOR.cream; g.textAlign = 'center'; g.font = `700 34px ${SANS}`;
  const word = tag.textContent.trim().toUpperCase(); g.save(); g.scale(Math.min(.8, 84 / g.measureText(word).width), 1); g.fillText(word, 0, 12); g.restore();
  g.restore();

  const tex = textureOf(c); tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; return tex;
}
// the top of a carton: two flaps meeting under a strip of tape
function boxTop(){
  const c = cardTexture(41), g = c.getContext('2d');
  g.fillStyle = 'rgba(60,36,12,.55)'; g.fillRect(0, 254, 512, 3);
  g.fillStyle = 'rgba(243,230,196,.62)'; g.fillRect(0, 212, 512, 88); g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(0, 220, 512, 6);
  const t = textureOf(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}

/* ---------- the counter: planked front, a varnished top a little proud of it, a moulding under the top and a skirting at the floor ---------- */
function buildCounter(){
  const counter = new THREE.Group();   // built one unit wide and stretched to the width that fits the screen (fit, below)
  const part = (h, d, material) => { const m = new THREE.Mesh(new THREE.BoxGeometry(1, h, d), material); m.castShadow = m.receiveShadow = true; counter.add(m); return m; };
  const planks = repeatX => new THREE.MeshStandardMaterial({map: picture('counter-front', repeatX, COUNTER.h / 10), roughness: .74});   // one picture: 10 units square, a dozen planks
  const trim = new THREE.MeshStandardMaterial({color: COLOR.trim, roughness: .6}), front = planks(1), end = planks(COUNTER.d / 10);
  part(COUNTER.h, COUNTER.d, [end, end, front, front, front, front]).position.set(0, COUNTER.h / 2, COUNTER.z);
  // varnished: it catches the sky. One picture is 5.6 by 4.2 units: eight boards across the depth, running along the counter.
  // Tinted down a little: in this light the oak alone washes out
  const top = new THREE.MeshPhysicalMaterial({map: picture('counter-top', 1, 1), color: '#E0C6A2', roughness: .55, clearcoat: .3, clearcoatRoughness: .4});
  part(.28, COUNTER.d + .8, top).position.set(0, COUNTER.h + .14, COUNTER.z);
  part(.2, COUNTER.d + .36, trim).position.set(0, COUNTER.h - .1, COUNTER.z);
  part(.4, COUNTER.d + .24, trim).position.set(0, .2, COUNTER.z);
  // what it stands on: nothing but its own soft shadow
  const [c, g] = canvasOf(256, 256), dark = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  dark.addColorStop(0, 'rgba(24,16,8,.42)'); dark.addColorStop(.55, 'rgba(24,16,8,.2)'); dark.addColorStop(1, 'rgba(24,16,8,0)');
  g.fillStyle = dark; g.fillRect(0, 0, 256, 256);
  const shade = new THREE.Mesh(new THREE.PlaneGeometry(1.3, COUNTER.d + 5), new THREE.MeshBasicMaterial({map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, toneMapped: false}));
  shade.rotation.x = -Math.PI / 2; shade.position.set(0, .01, COUNTER.z); counter.add(shade);
  const fit = (w, x) => { counter.scale.x = w; counter.position.x = x; front.map.repeat.x = w / 10; top.map.repeat.x = w / 5.6; };
  return {counter, fit};
}

/* ---------- the awning: cloth over the whole shopfront, pinned along the wall and along its front rod, breathing between them; its valance hangs free ---------- */
function buildAwning(){
  const cloth = map => new THREE.MeshStandardMaterial({map, roughness: .95, side: THREE.DoubleSide, alphaTest: .5});
  const roof = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 220, 10), cloth(clothTexture(false)));
  const valance = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 220, 6), cloth(clothTexture(true)));
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, ROOF.w, 12), new THREE.MeshStandardMaterial({color: COLOR.trim, roughness: .5}));
  rod.rotation.z = Math.PI / 2; rod.position.set(0, ROOF.front.y + .04, ROOF.front.z - .06);
  roof.castShadow = valance.castShadow = rod.castShadow = true;
  const stripes = ROOF.w / ROOF.stripe / 2;
  let drop = ROOF.drop;
  const fit = narrow => { [roof, valance].forEach(m => { m.material.map.repeat.x = stripes * (narrow ? NARROW.stripes : 1); }); drop = ROOF.drop * (narrow ? NARROW.drop : 1); };
  const blow = t => {
    const air = reduce ? 0 : 1;
    [roof, valance].forEach(mesh => {
      const pos = mesh.geometry.attributes.position, uv = mesh.geometry.attributes.uv;
      for (let i = 0; i < pos.count; i++){
        const v = 1 - uv.getY(i), x = (uv.getX(i) - .5) * ROOF.w;   // v runs from the pinned edge to the free one
        if (mesh === roof){
          const give = Math.sin(Math.PI * v);   // none at the pinned edges, most between them; the gusts travel along it
          pos.setXYZ(i, x, lerp(ROOF.back.y, ROOF.front.y, v) + give * (-.2 + air * (.14 * Math.sin(x * .35 + t * .9) + .05 * Math.sin(x * 1.5 - t * 2.1))), lerp(ROOF.back.z, ROOF.front.z, v));
        } else pos.setXYZ(i, x, ROOF.front.y - v * drop, ROOF.front.z + air * v * v * (.2 * Math.sin(x * 1.9 + t * 2.4) + .2 * Math.sin(x * .45 + t * 1.1)));
      }
      pos.needsUpdate = true; mesh.geometry.computeVertexNormals();
    });
  };
  return {parts: [roof, valance, rod], blow, fit};
}

/* ---------- the products: a carton each, printed on the front and the back ---------- */
function buildBoxes(){
  const card = new THREE.MeshStandardMaterial({map: textureOf(cardTexture(23)), roughness: .88}), top = new THREE.MeshStandardMaterial({map: boxTop(), roughness: .88});
  return $$('.pc').slice(0, STACK.length).map((pc, i) => {
    const face = new THREE.MeshStandardMaterial({map: boxFace(pc, i + 1), roughness: .88}), [x, row, turn] = STACK[i];
    const box = new THREE.Mesh(new RoundedBoxGeometry(BOX.w, BOX.h, BOX.d, 3, .05), [card, card, top, card, face, face]);
    box.castShadow = box.receiveShadow = true;
    box.userData = {pc, name: $('.pc-edge b', pc).textContent, x, y: BOX.h / 2 + row * BOX.h, row, turn, lift: 0, lands: DROP.wait + i * DROP.apart};
    return box;
  });
}

async function mount(){
  await Promise.all([`700 160px ${SANS}`, `600 21px ${SANS}`, `500 21px ${MONO}`].map(f => document.fonts.load(f))).catch(() => {});   // the cartons are printed with the page's fonts
  await loadPictures();   // no pictures, no shopfront: the flat hero stays
  const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement, scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(FOV, 1, 1, 200);
  // a soft sky for everything to sit in, a warm low sun from the near side that throws long soft shadows down the counter,
  // and a cool fill from the far side so the shaded faces stay readable
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = .7;
  const sun = new THREE.DirectionalLight(0xffeccf, 3), fill = new THREE.DirectionalLight(0xbfcdff, .65);
  sun.position.set(14, 17, 15); fill.position.set(-14, 7, 4);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 9; sun.shadow.blurSamples = 16; sun.shadow.bias = -.0005; sun.shadow.normalBias = .03;
  Object.assign(sun.shadow.camera, {left: -22, right: 22, top: 16, bottom: -12, near: 1, far: 80});

  const awning = buildAwning(), counter = buildCounter(), boxes = buildBoxes(), goods = new THREE.Group(), shop = new THREE.Group();   // goods: what stands on the counter
  goods.add(...boxes); goods.position.set(0, COUNTER.h + .28, COUNTER.z);
  shop.add(counter.counter, ...awning.parts, goods); shop.rotation.y = YAW;
  scene.add(sun, fill, shop);
  const dist = SPAN / 2 / Math.tan(FOV * RAD / 2);
  camera.position.set(0, LOOK_Y + 2.4, dist); camera.lookAt(0, LOOK_Y - .2, 0);   // a little above, and still: only the cloth and the cartons move
  stage.prepend(canvas);

  const tip = $('.stall-tip', stage), ray = new THREE.Raycaster(), ptr = new THREE.Vector2(9, 9);
  const spot = new THREE.Vector3();
  let raf = 0, seen = false, hot = null, held = false, began = null;   // held: the pointer is on the label, so its carton stays picked
  function draw(now){
    raf = 0;
    const t = now / 1000;
    if (began === null && seen) began = t;
    const since = began === null ? 0 : t - began;
    awning.blow(t);
    ray.setFromCamera(ptr, camera);
    const hit = held ? hot : ray.intersectObjects(boxes.filter(b => b.visible))[0]?.object || null;
    if (hit !== hot){ hot = hit; canvas.style.cursor = hot ? 'pointer' : ''; tip.classList.toggle('on', !!hot); }
    boxes.forEach(box => {
      const d = box.userData, landing = reduce ? 1 : clamp((since - d.lands) / DROP.seconds), on = box === hot ? 1 : 0;
      // the one under the pointer is picked out the only way that touches nothing: a top carton rises, a bottom one slides
      // straight out from under the others. Neither turns, since a turning corner would pass through its neighbour
      d.lift += (on - d.lift) * .16;
      box.visible = landing > 0;
      box.position.set(d.x, d.y + (1 - settle(landing)) * DROP.from + d.lift * d.row * .45, d.lift * (d.row ? .15 : .7));
      box.rotation.set((1 - landing) * .25, d.turn + (1 - landing) * .5, 0);
    });
    if (hot){   // its label sits on the carton's own face, so the pointer reaches it without crossing another carton
      hot.localToWorld(spot.set(0, BOX.h * .2, BOX.d / 2)).project(camera);
      tip.style.translate = `${(spot.x + 1) / 2 * canvas.clientWidth - tip.offsetWidth / 2}px ${(1 - spot.y) / 2 * canvas.clientHeight - tip.offsetHeight / 2}px`;
    }
    renderer.render(scene, camera);
    if (seen && !reduce) run();
  }
  function run(){ if (!raf) raf = requestAnimationFrame(draw); }

  // the cartons stand to the right of the words on a wide screen, and under them, smaller, on a narrow one
  new ResizeObserver(() => { const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
    // the stage is taller than the hero: it runs up behind the header to the top of the page, and on below the hero (ai.css).
    // The hero is still what the camera frames; the rest is more of the same view above and below it
    const hero = stage.parentElement.clientHeight, up = stage.parentElement.offsetTop;
    stage.style.top = -up + 'px';
    renderer.setSize(w, h, false); camera.aspect = w / hero; camera.setViewOffset(w, hero, 0, -up, w, h);
    const half = SPAN / 2 * camera.aspect, narrow = camera.aspect < 1;
    goods.scale.setScalar(narrow ? Math.min(.8, half * 2 / 11) : Math.min(1.25, half / 8.5)); goods.position.x = narrow ? 0 : half * .42;
    counter.fit(half * (narrow ? 1.9 : 1.5), narrow ? 0 : half * .17);   // the whole counter in view, both ends, with the cartons toward one end
    awning.fit(narrow); run(); }).observe(stage);
  new IntersectionObserver(([e]) => { seen = e.isIntersecting; run(); }).observe(stage);   // it rests while it is off screen

  const at = e => { const r = canvas.getBoundingClientRect(); ptr.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); run(); };
  canvas.addEventListener('pointermove', at);
  canvas.addEventListener('pointerleave', () => { ptr.set(9, 9); run(); });
  canvas.addEventListener('click', e => { at(e); ray.setFromCamera(ptr, camera);
    ray.intersectObjects(boxes)[0]?.object.userData.pc.click(); });   // the shelf's own receipt for it (lab.js)
  tip.addEventListener('pointerenter', () => { held = true; });
  tip.addEventListener('pointerleave', () => { held = false; run(); });
  tip.addEventListener('click', () => hot?.userData.pc.click());
}

// asked first, quietly: three.js fills the console with errors when the browser has WebGL switched off
if (stage && document.createElement('canvas').getContext('webgl2')){
  root.classList.add('has-3d');
  mount().catch(() => root.classList.remove('has-3d'));
}
