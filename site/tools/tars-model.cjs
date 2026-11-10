// One-off: turns the TARS-AI community's assembled CAD (a 37 MB STEP file) into the small GLB the /tars page loads.
//   source   https://github.com/TARS-AI-Community/TARS-AI  ·  Static Version (no motors)/TARS_static_v1.step  (CC-BY-NC 4.0)
//   run      node tools/tars-model.cjs path/to/TARS_static_v1.step public/assets/models/tars.glb
//   needs    occt-import-js @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions meshoptimizer (not site dependencies: install
//            them anywhere and point NODE_PATH at that node_modules)
// The GLB keeps the assembly's three movable groups as nodes (chassis, legL, legR) plus "screen", the LCD, so the page
// can move the legs and put a face on the screen. Materials are named by role (print, screw, dark, screen); the page
// gives "print" the colour and sheen of his own filament.
const fs = require('fs');
const {Document, NodeIO} = require('@gltf-transform/core');
const {KHRMeshQuantization} = require('@gltf-transform/extensions');
const {weld, simplify, quantize, prune} = require('@gltf-transform/functions');
const {MeshoptSimplifier} = require('meshoptimizer');

const [src, out] = process.argv.slice(2);
if (!src || !out){ console.error('usage: node tools/tars-model.cjs in.step out.glb'); process.exit(1); }

const GROUPS = {'Chassis': 'chassis', 'Left Leg': 'legL', 'Right Leg': 'legR'};
const SCREEN = '5INCH-HDMI-LCD-H-TP';
// the Raspberry Pi and its hats sit inside the closed chassis, and the board's tiny components are smaller than a pixel
const HIDDEN = /raspberry|cooler|wm8960|studs|extruded|switch|fpc|so-8/i;
const DARK = /cam|translator/i;   // the camera and the LCD's board
const MIN_SIZE = 8;   // mm, a part's longest side

const size = p => { const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < p.length; i++){ const a = i % 3; if (p[i] < lo[a]) lo[a] = p[i]; if (p[i] > hi[a]) hi[a] = p[i]; }
  return Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]); };
const under = node => [...node.meshes, ...node.children.flatMap(under)];

require('occt-import-js')().then(async occt => {
  const cad = occt.ReadStepFile(fs.readFileSync(src), {linearDeflectionType: 'bounding_box_ratio', linearDeflection: 0.002, angularDeflection: 0.5});
  if (!cad.success) throw new Error('could not read ' + src);
  const assembly = cad.root.children.length === 1 ? cad.root.children[0] : cad.root;

  // parts → one bucket per (group, colour), so the GLB is a handful of draw calls
  const buckets = new Map();
  for (const group of assembly.children){
    const name = GROUPS[group.name];
    if (!name) throw new Error('unexpected group in the assembly: ' + group.name);
    for (const i of under(group)){
      const m = cad.meshes[i], pos = m.attributes.position.array;
      if (HIDDEN.test(m.name) || size(pos) < MIN_SIZE) continue;
      // his build is one filament all over, so the CAD's own greys are dropped: a part is the print, a screw, or electronics
      const node = m.name === SCREEN ? 'screen' : name, mat = m.name === SCREEN ? 'screen' : /screw/i.test(m.name) ? 'screw' : DARK.test(m.name) ? 'dark' : 'print';
      const key = node + '|' + mat, b = buckets.get(key) || buckets.set(key, {node, mat, pos: [], nor: [], idx: []}).get(key);
      const base = b.pos.length / 3;
      for (const v of pos) b.pos.push(v);
      for (const v of m.attributes.normal.array) b.nor.push(v);
      for (const v of m.index.array) b.idx.push(v + base);
    }
  }

  const doc = new Document(), buffer = doc.createBuffer(), scene = doc.createScene('tars'), nodes = {}, mats = {};
  for (const b of buckets.values()){
    mats[b.mat] ||= doc.createMaterial(b.mat).setBaseColorFactor(b.mat === 'print' ? [.7, .7, .72, 1] : [.03, .03, .03, 1]).setRoughnessFactor(.6).setMetallicFactor(0);
    const prim = doc.createPrimitive().setMaterial(mats[b.mat])
      .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(b.pos)).setBuffer(buffer))
      .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(b.nor)).setBuffer(buffer))
      .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(b.idx)).setBuffer(buffer));
    if (!nodes[b.node]){ nodes[b.node] = doc.createNode(b.node).setMesh(doc.createMesh(b.node)); scene.addChild(nodes[b.node]); }
    nodes[b.node].getMesh().addPrimitive(prim);
  }

  const tris = () => doc.getRoot().listMeshes().flatMap(m => m.listPrimitives()).reduce((n, p) => n + p.getIndices().getCount() / 3, 0);
  const before = tris();
  await MeshoptSimplifier.ready;
  // a screw head does not need 8,000 triangles; the error bound keeps the slabs' edges where they are
  await doc.transform(weld(), simplify({simplifier: MeshoptSimplifier, ratio: 0.1, error: 0.0015}), prune(), quantize());
  fs.mkdirSync(require('path').dirname(out), {recursive: true});
  const glb = await new NodeIO().registerExtensions([KHRMeshQuantization]).writeBinary(doc);
  fs.writeFileSync(out, glb);
  console.log(`${out}: ${before} → ${tris()} triangles, ${(glb.length / 1024).toFixed(0)} KB, nodes: ${Object.keys(nodes).join(', ')}`);
});
