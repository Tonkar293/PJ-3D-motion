import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { LEFT, RIGHT, labelOf } from './pins.js';

export function textTexture(text, { w = 128, h = 48, font = '600 26px "JetBrains Mono", monospace', color = '#e8f1ff', bg = null } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
  g.font = font; g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, w / 2, h / 2 + 1);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

const PITCH = 2.54, PIN_Z = 11.4, PIN_Y = 3.9;
const pinX = i => 17.78 - i * PITCH;

export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x07090f, 260, 620);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.5, 2000);
  camera.position.set(70, 95, 115);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.495; controls.minDistance = 25; controls.maxDistance = 420;
  controls.target.set(0, 0, 5);
  controls.autoRotateSpeed = 0.6;

  // lights
  const hemi = new THREE.HemisphereLight(0xbfd9ff, 0x1a1028, 1.1);
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(60, 140, 70); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -160, right: 160, top: 120, bottom: -120, near: 10, far: 400 });
  sun.shadow.bias = -0.0005;
  const rim = new THREE.DirectionalLight(0x7a5cff, 1.2); rim.position.set(-120, 60, -90);
  scene.add(hemi, sun, rim);
  const baseLights = { hemi: 1.1, sun: 2.2, rim: 1.2 };

  // ground + grid
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x0c1019, roughness: 0.95 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600), groundMat);
  ground.rotation.x = -Math.PI / 2; ground.position.y = -3.05; ground.receiveShadow = true;
  scene.add(ground);
  let grid = new THREE.GridHelper(800, 80, 0x1d4a6a, 0x13243a); grid.position.y = -3; scene.add(grid);

  // breadboard
  const bbTexC = document.createElement('canvas'); bbTexC.width = bbTexC.height = 64;
  const bg = bbTexC.getContext('2d'); bg.fillStyle = '#dfe4ec'; bg.fillRect(0, 0, 64, 64);
  bg.fillStyle = '#5b6474'; bg.fillRect(24, 24, 16, 16);
  const bbTex = new THREE.CanvasTexture(bbTexC); bbTex.wrapS = bbTex.wrapT = THREE.RepeatWrapping;
  bbTex.repeat.set(130 / PITCH, 78 / PITCH); bbTex.colorSpace = THREE.SRGBColorSpace;
  const bbMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: bbTex, roughness: 0.85 });
  const breadboard = new THREE.Mesh(new THREE.BoxGeometry(130, 3, 78), [
    new THREE.MeshStandardMaterial({ color: 0xc9d0db }), new THREE.MeshStandardMaterial({ color: 0xc9d0db }),
    bbMat, new THREE.MeshStandardMaterial({ color: 0xc9d0db }), new THREE.MeshStandardMaterial({ color: 0xc9d0db }), new THREE.MeshStandardMaterial({ color: 0xc9d0db }),
  ]);
  breadboard.position.y = -1.5; breadboard.receiveShadow = true; scene.add(breadboard);
  for (const [z, col] of [[-36, 0xff3b5c], [-33, 0x2d7bff], [33, 0xff3b5c], [36, 0x2d7bff]]) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(126, 0.05, 0.4), new THREE.MeshBasicMaterial({ color: col }));
    s.position.set(0, 0.03, z); scene.add(s);
  }
  const trench = new THREE.Mesh(new THREE.BoxGeometry(126, 0.06, 2.4), new THREE.MeshStandardMaterial({ color: 0xaab3c2 }));
  trench.position.y = 0.02; scene.add(trench);

  // ===== ESP32 board =====
  const board = new THREE.Group(); scene.add(board);
  const boardMats = [];
  const M = o => { const m = new THREE.MeshStandardMaterial(o); boardMats.push(m); return m; };
  const add = (geo, mat, x, y, z, parent = board) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };

  const pcbMat = M({ color: 0x0d1626, roughness: 0.55, metalness: 0.1 });
  const pcb = add(new THREE.BoxGeometry(52, 1.6, 28), pcbMat, 0, 3.0, 0);
  pcb.userData.tip = 'ESP32 DevKit V1 (30 ขา)';
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(pcb.geometry), new THREE.LineBasicMaterial({ color: 0x39e6ff, transparent: true, opacity: 0.5 }));
  pcb.add(edges);
  // headers
  const hdrMat = M({ color: 0x15171c, roughness: 0.7 });
  add(new THREE.BoxGeometry(38.5, 2.2, 2.5), hdrMat, 0, 1.1, -PIN_Z);
  add(new THREE.BoxGeometry(38.5, 2.2, 2.5), hdrMat, 0, 1.1, PIN_Z);

  const chips = new THREE.Group(); board.add(chips);
  const usb = add(new THREE.BoxGeometry(6, 3, 8), M({ color: 0xc0c8d2, metalness: 0.9, roughness: 0.3 }), -25.5, 4.6, 0, chips);
  usb.userData.tip = 'Micro-USB (ไฟ 5V + อัปโหลดโค้ด)';
  const cp = add(new THREE.BoxGeometry(5, 0.9, 5), M({ color: 0x1b1d22, roughness: 0.4 }), -15, 4.2, -3.5, chips); cp.userData.tip = 'CP2102 USB-to-UART';
  const reg = add(new THREE.BoxGeometry(3.4, 1.4, 6), M({ color: 0x23262d, roughness: 0.4 }), -17, 4.5, 5.5, chips); reg.userData.tip = 'AMS1117 เรกูเลเตอร์ 3.3V';
  for (const [z, name] of [[-7.5, 'ปุ่ม EN (รีเซ็ต)'], [7.5, 'ปุ่ม BOOT (GPIO0)']]) {
    add(new THREE.BoxGeometry(3.6, 1.2, 3.6), M({ color: 0xb8c0ca, metalness: 0.8, roughness: 0.35 }), -21.5, 4.4, z, chips);
    const cap = add(new THREE.CylinderGeometry(1, 1, 0.8, 16), M({ color: 0x14161a }), -21.5, 5.3, z, chips); cap.userData.tip = name;
  }
  const builtinMat = new THREE.MeshStandardMaterial({ color: 0x2d8cff, emissive: 0x2d8cff, emissiveIntensity: 0 });
  const bled = add(new THREE.BoxGeometry(1.4, 0.7, 1), builtinMat, -10, 4.15, 6, chips); bled.userData.tip = 'LED บนบอร์ด (GPIO2)';
  const bledLight = new THREE.PointLight(0x2d8cff, 0, 30, 2); bledLight.position.set(-10, 6, 6); chips.add(bledLight);
  const pwrMat = new THREE.MeshStandardMaterial({ color: 0xff2d4a, emissive: 0xff2d4a, emissiveIntensity: 2.5 });
  const pled = add(new THREE.BoxGeometry(1.4, 0.7, 1), pwrMat, -10, 4.15, -6, chips); pled.userData.tip = 'LED ไฟเลี้ยง (PWR)';

  // WROOM module
  const mod = new THREE.Group(); board.add(mod);
  add(new THREE.BoxGeometry(25.5, 0.8, 18), M({ color: 0x0f2a1d, roughness: 0.6 }), 12.5, 4.2, 0, mod);
  const shield = add(new THREE.BoxGeometry(17.5, 2.4, 16), M({ color: 0xc9d1d9, metalness: 0.95, roughness: 0.28 }), 8.8, 5.8, 0, mod);
  shield.userData.tip = 'ESP32-WROOM-32 (Dual-core 240 MHz, Wi-Fi + BT)';
  const lbl = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), new THREE.MeshBasicMaterial({ map: textTexture('ESP32-WROOM-32', { w: 512, h: 160, font: '700 54px "Space Grotesk", sans-serif', color: '#40464f' }), transparent: true }));
  lbl.rotation.x = -Math.PI / 2; lbl.rotation.z = Math.PI / 2; lbl.position.set(8.8, 7.02, 0); mod.add(lbl);
  const antPts = []; for (let i = 0; i < 7; i++) { antPts.push(new THREE.Vector3(19.5 + (i % 2) * 4.5, 4.65, -6.5 + i * 2.1)); }
  const ant = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(antPts, false, 'catmullrom', 0.05), 80, 0.3, 6), M({ color: 0xd4a64a, metalness: 1, roughness: 0.3 }));
  ant.userData.tip = 'เสาอากาศ PCB 2.4 GHz'; mod.add(ant);

  // pins
  const pads = []; const pinMap = {}; const labels = [];
  const makePin = (id, i, z) => {
    const mat = new THREE.MeshStandardMaterial({ color: 0xd4a64a, metalness: 1, roughness: 0.35, emissive: 0x000000 });
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.3, 16), mat);
    pad.position.set(pinX(i), PIN_Y, z); pad.userData = { pin: id, hl: null, level: 0 };
    board.add(pad); pads.push(pad);
    const hit = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2, 2.3), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.copy(pad.position); hit.userData.pin = id; board.add(hit); pads.push(hit);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTexture(labelOf(id), { w: 96, h: 40, font: '600 24px "JetBrains Mono", monospace' }), transparent: true, depthWrite: false }));
    sp.scale.set(3.6, 1.5, 1); sp.position.set(pinX(i), PIN_Y + 0.9, z + Math.sign(z) * 3.4);
    board.add(sp); labels.push(sp);
    pinMap[id] = { pad, sprite: sp, pos: pad.position.clone().setY(PIN_Y + 0.15) };
  };
  LEFT.forEach((id, i) => makePin(id, i, -PIN_Z));
  RIGHT.forEach((id, i) => makePin(id, i, PIN_Z));

  function refreshPad(pad) {
    const u = pad.userData, m = pad.material;
    if (u.hl) { m.emissive.set(u.hl); m.emissiveIntensity = 1.6; }
    else if (u.level > 0.02) { m.emissive.set(0x26ffa0); m.emissiveIntensity = u.level * 2.2; }
    else { m.emissive.set(0x000000); m.emissiveIntensity = 0; }
  }
  function setPinLevel(id, level) {
    const p = pinMap[id]; if (!p) return;
    p.pad.userData.level = level; refreshPad(p.pad);
    if (id === '2') { builtinMat.emissiveIntensity = level * 6; bledLight.intensity = level * 120; }
  }
  function highlight(ids = [], color = 0xa77bff) {
    for (const id in pinMap) {
      const on = ids.includes(id);
      pinMap[id].pad.userData.hl = on ? color : null; refreshPad(pinMap[id].pad);
      pinMap[id].sprite.material.color.set(on ? color : 0xffffff);
      pinMap[id].sprite.scale.set(on ? 4.4 : 3.6, on ? 1.85 : 1.5, 1);
    }
  }

  // ===== lesson layer, wires, clickables =====
  const lessonRoot = new THREE.Group(); scene.add(lessonRoot);
  let wires = [], clickables = [], flow = true;
  const dotGeo = new THREE.SphereGeometry(0.42, 8, 8);

  function addWire(group, a, b, color = 0x39e6ff, { lift = 7, radius = 0.4 } = {}) {
    a = a.clone(); b = b.clone();
    const mid = a.clone().lerp(b, 0.5); mid.y = Math.max(a.y, b.y) + lift;
    const p1 = a.clone(); p1.y += lift * 0.7; const p2 = b.clone(); p2.y += lift * 0.7;
    const curve = new THREE.CatmullRomCurve3([a, p1.lerp(mid, 0.25), mid, p2.lerp(mid, 0.25), b]);
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, radius, 8, false), new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.1 }));
    mesh.castShadow = true; group.add(mesh);
    const dots = [];
    for (let i = 0; i < 6; i++) {
      const d = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(2.6) }));
      d.visible = false; group.add(d); dots.push(d);
    }
    const w = { curve, mesh, dots, level: 0, phase: Math.random(), setActive(v) { this.level = v; } };
    wires.push(w); return w;
  }
  function newLessonGroup() {
    lessonRoot.traverse(o => { if (o.geometry && o.geometry !== dotGeo) o.geometry.dispose(); if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { m.map?.dispose(); m.dispose(); }); } });
    lessonRoot.clear(); wires = []; clickables = [];
    const g = new THREE.Group(); lessonRoot.add(g); return g;
  }

  // ===== views =====
  function setView(mode) {
    boardMats.forEach(m => {
      m.wireframe = mode === 'wire';
      m.transparent = mode === 'xray'; m.opacity = mode === 'xray' ? 0.16 : 1; m.depthWrite = mode !== 'xray';
      m.needsUpdate = true;
    });
  }
  function explode(v) { mod.position.y = v; chips.position.y = v * 0.45; }
  function setLabels(on) { labels.forEach(s => (s.visible = on)); }
  let anim = null;
  function flyTo(pos, target, dur = 0.9) {
    anim = { t: 0, dur, p0: camera.position.clone(), p1: new THREE.Vector3(...pos), t0: controls.target.clone(), t1: new THREE.Vector3(...target) };
  }
  function setAmbient(f) { hemi.intensity = baseLights.hemi * f; sun.intensity = baseLights.sun * f; rim.intensity = baseLights.rim * Math.max(0.3, f); }
  function setTheme(dark) {
    const bgc = dark ? 0x07090f : 0xe9edf5;
    scene.background = new THREE.Color(dark ? 0x0a0e17 : 0xe4e9f2); scene.fog.color.set(dark ? 0x0a0e17 : 0xe4e9f2);
    groundMat.color.set(dark ? 0x0c1019 : 0xd9dfea);
    scene.remove(grid); grid.geometry.dispose();
    grid = dark ? new THREE.GridHelper(800, 80, 0x1d4a6a, 0x13243a) : new THREE.GridHelper(800, 80, 0x9fb3d1, 0xc3cfe2);
    grid.position.y = -3; scene.add(grid);
    edges.material.color.set(dark ? 0x39e6ff : 0x0a8fd6);
    labels.forEach(s => (s.material.map = textTexture(s.userData.txt || '', {})));
    return bgc;
  }
  labels.forEach((s, i) => { s.userData.txt = labelOf([...LEFT, ...RIGHT][i]); });
  // keep sprite text white-ish in both themes but with dark pill in light
  function relabel(dark) {
    labels.forEach(s => { s.material.map?.dispose(); s.material.map = textTexture(s.userData.txt, { w: 96, h: 40, font: '600 24px "JetBrains Mono", monospace', color: dark ? '#e8f1ff' : '#1a2440' }); s.material.needsUpdate = true; });
  }

  // ===== post =====
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.75, 0.5, 0.82);
  composer.addPass(bloom); composer.addPass(new OutputPass());
  let useBloom = true;

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); composer.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas);

  // ===== picking =====
  const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2();
  let pickCb = () => { }, hoverCb = () => { }, downPos = null, activeDown = null;
  const findTarget = o => { while (o) { if (o.userData && (o.userData.pin || o.userData.onDown || o.userData.tip)) return o; o = o.parent; } return null; };
  function hit(e, all = false) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const objs = all ? [...pads, ...clickables, lessonRoot, board] : [...pads, ...clickables];
    for (const h of ray.intersectObjects(objs, true)) { const t = findTarget(h.object); if (t) return t; }
    return null;
  }
  canvas.addEventListener('pointerdown', e => {
    downPos = [e.clientX, e.clientY];
    const t = hit(e);
    if (t && t.userData.onDown) { activeDown = t; controls.enabled = false; t.userData.onDown(); canvas.setPointerCapture(e.pointerId); }
  });
  canvas.addEventListener('pointerup', e => {
    if (activeDown) { activeDown.userData.onUp?.(); activeDown = null; controls.enabled = true; return; }
    if (!downPos) return;
    const moved = Math.hypot(e.clientX - downPos[0], e.clientY - downPos[1]); downPos = null;
    if (moved > 5) return;
    const t = hit(e);
    pickCb(t && t.userData.pin ? { id: t.userData.pin, x: e.clientX, y: e.clientY } : null);
  });
  let hoverT = 0;
  canvas.addEventListener('pointermove', e => {
    const now = performance.now(); if (now - hoverT < 50) return; hoverT = now;
    const t = hit(e, true);
    let tip = null;
    if (t) tip = t.userData.pin ? `${labelOf(t.userData.pin)} · คลิกดูรายละเอียด` : t.userData.tip;
    canvas.style.cursor = t && (t.userData.pin || t.userData.onDown) ? 'pointer' : 'grab';
    hoverCb(tip, e);
  });
  canvas.addEventListener('pointerleave', () => hoverCb(null));

  // ===== loop =====
  function update(dt) {
    if (anim) {
      anim.t += dt; const k = Math.min(1, anim.t / anim.dur); const e = 1 - Math.pow(1 - k, 3);
      camera.position.lerpVectors(anim.p0, anim.p1, e); controls.target.lerpVectors(anim.t0, anim.t1, e);
      if (k >= 1) anim = null;
    }
    for (const w of wires) {
      const on = flow && w.level > 0.02;
      if (on) w.phase += dt * (0.25 + w.level * 0.5);
      w.dots.forEach((d, i) => { d.visible = on; if (on) d.position.copy(w.curve.getPointAt(((w.phase + i / w.dots.length) % 1 + 1) % 1)); });
    }
    controls.update();
    if (useBloom) composer.render(); else renderer.render(scene, camera);
  }

  return {
    THREE, scene, camera, renderer, controls, update, resize, flyTo, setView, explode, setLabels, setAmbient, highlight, setPinLevel,
    addWire, newLessonGroup, addClickable: m => clickables.push(m),
    pinPos: id => pinMap[id].pos.clone(),
    onPick: cb => (pickCb = cb), onHover: cb => (hoverCb = cb),
    setTheme: dark => { setTheme(dark); relabel(dark); },
    setBloom: on => (useBloom = on), setShadows: on => { renderer.shadowMap.enabled = on; scene.traverse(o => { if (o.material) o.material.needsUpdate = true; }); },
    setFlow: on => (flow = on), setDpr: v => { renderer.setPixelRatio(Math.min(devicePixelRatio, v)); resize(); },
  };
}
