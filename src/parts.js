import * as THREE from 'three';
import { textTexture } from './scene.js';

const std = o => new THREE.MeshStandardMaterial(o);
const metal = () => std({ color: 0xb8c0c8, metalness: 1, roughness: 0.3 });
const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m; };

export const LED_COLORS = {
  red: { hex: 0xff2d4a, vf: 2.0, name: 'แดง (Vf 2.0V)' },
  yellow: { hex: 0xffc21a, vf: 2.1, name: 'เหลือง (Vf 2.1V)' },
  green: { hex: 0x2dff7a, vf: 2.2, name: 'เขียว (Vf 2.2V)' },
  blue: { hex: 0x2d8cff, vf: 3.0, name: 'น้ำเงิน (Vf 3.0V)' },
  white: { hex: 0xf4f7ff, vf: 3.0, name: 'ขาว (Vf 3.0V)' },
};

export function led(hex = 0xff2d4a) {
  const g = new THREE.Group();
  const mat = std({ color: hex, emissive: hex, emissiveIntensity: 0, transparent: true, opacity: 0.82, roughness: 0.15 });
  g.add(mesh(new THREE.SphereGeometry(1.6, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat, 0, 5.2, 0));
  g.add(mesh(new THREE.CylinderGeometry(1.6, 1.6, 3, 24), mat, 0, 3.7, 0));
  g.add(mesh(new THREE.CylinderGeometry(1.95, 1.95, 0.5, 24), mat, 0, 2.2, 0));
  const lm = metal();
  g.add(mesh(new THREE.CylinderGeometry(0.12, 0.12, 2, 6), lm, -0.6, 1, 0), mesh(new THREE.CylinderGeometry(0.12, 0.12, 2, 6), lm, 0.6, 1, 0));
  const light = new THREE.PointLight(hex, 0, 45, 2); light.position.y = 5.5; g.add(light);
  g.userData.tip = 'LED';
  g.set = v => { v = Math.max(0, Math.min(1, v)); mat.emissiveIntensity = v * 4.5; light.intensity = v * 320; mat.opacity = 0.78 + v * 0.22; };
  g.setColor = h => { mat.color.setHex(h); mat.emissive.setHex(h); light.color.setHex(h); };
  return g;
}

export function rgbLamp() {
  const g = new THREE.Group();
  const base = mesh(new THREE.CylinderGeometry(4.5, 5.5, 3, 32), std({ color: 0x1a1f2a, roughness: 0.4, metalness: 0.4 }), 0, 1.5, 0);
  const ballMat = std({ color: 0xffffff, emissive: 0x000000, emissiveIntensity: 2.2, transparent: true, opacity: 0.9, roughness: 0.6 });
  const ball = mesh(new THREE.SphereGeometry(6, 40, 24), ballMat, 0, 9, 0);
  const light = new THREE.PointLight(0xffffff, 0, 80, 2); light.position.y = 9;
  g.add(base, ball, light); g.userData.tip = 'RGB LED + โคมกระจกฝ้า';
  g.set = (r, gg, b) => {
    ballMat.emissive.setRGB(r, gg, b);
    const m = Math.max(r, gg, b);
    light.color.setRGB(m ? r / m : 1, m ? gg / m : 1, m ? b / m : 1); light.intensity = m * 900;
  };
  return g;
}

const BAND = [0x111111, 0x7a4a1c, 0xd8262c, 0xff7a1a, 0xffd21a, 0x2bb34a, 0x2b6cff, 0x8a3cff, 0x8a8f99, 0xf4f4f4];
export function resistorBands(ohms) {
  let e = Math.floor(Math.log10(Math.max(1, ohms))) - 1;
  let d = Math.round(ohms / 10 ** e);
  if (d >= 100) { d = Math.round(d / 10); e++; }
  return [Math.floor(d / 10), d % 10, Math.max(0, Math.min(9, e))];
}
export function resistor(ohms = 220) {
  const g = new THREE.Group();
  const body = mesh(new THREE.CylinderGeometry(0.85, 0.85, 4.6, 16), std({ color: 0xd9c39a, roughness: 0.6 }), 0, 1.2, 0);
  body.rotation.z = Math.PI / 2; g.add(body);
  const leg = mesh(new THREE.CylinderGeometry(0.1, 0.1, 6.2, 6), metal(), 0, 1.2, 0); leg.rotation.z = Math.PI / 2; g.add(leg);
  const bands = [-1.4, -0.6, 0.2, 1.5].map((x, i) => {
    const b = mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.38, 16), std({ color: i === 3 ? 0xc8a24a : 0x000000, roughness: 0.5, metalness: i === 3 ? 0.7 : 0 }), x, 1.2, 0);
    b.rotation.z = Math.PI / 2; g.add(b); return b;
  });
  g.set = o => { resistorBands(o).forEach((c, i) => bands[i].material.color.setHex(BAND[c])); g.userData.tip = `ตัวต้านทาน ${o >= 1000 ? (o / 1000) + 'kΩ' : o + 'Ω'}`; };
  g.set(ohms);
  return g;
}

export function button() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(6, 1.8, 6), std({ color: 0x23272f, roughness: 0.5 }), 0, 0.9, 0));
  const cap = mesh(new THREE.CylinderGeometry(1.9, 1.9, 1.6, 24), std({ color: 0xff4d6d, roughness: 0.35 }), 0, 2.5, 0);
  g.add(cap);
  const lm = metal();
  for (const [x, z] of [[-2.6, -2.6], [2.6, -2.6], [-2.6, 2.6], [2.6, 2.6]]) g.add(mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), lm, x, 0.2, z));
  g.cap = cap; g.userData.tip = 'ปุ่มกด (Tactile switch) — กดค้างได้';
  g.set = p => { cap.position.y = p ? 1.95 : 2.5; cap.material.emissive.setHex(p ? 0x661122 : 0); };
  return g;
}

export function ldr() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.7, 28), std({ color: 0xd6763a, roughness: 0.5 }), 0, 3.2, 0));
  const pts = []; for (let i = 0; i < 9; i++) pts.push(new THREE.Vector3(-1.6 + i * 0.4, 3.6, (i % 2 ? 1 : -1) * 1.4));
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.12, 5), std({ color: 0x5a2e10 })));
  const lm = metal(); g.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 3, 6), lm, -0.8, 1.5, 0), mesh(new THREE.CylinderGeometry(0.1, 0.1, 3, 6), lm, 0.8, 1.5, 0));
  g.userData.tip = 'LDR (ตัวต้านทานแปรค่าตามแสง)';
  return g;
}

export function lamp() {
  const g = new THREE.Group();
  const mat = std({ color: 0xfff1cc, emissive: 0xffd48a, emissiveIntensity: 0 });
  const bulb = mesh(new THREE.SphereGeometry(3.4, 24, 16), mat); g.add(bulb);
  const shade = mesh(new THREE.ConeGeometry(6, 5, 32, 1, true), std({ color: 0x2a3140, side: THREE.DoubleSide, metalness: 0.6, roughness: 0.4 }), 0, 2.4, 0);
  g.add(shade);
  const light = new THREE.SpotLight(0xffe0a8, 0, 120, Math.PI / 4, 0.5, 1.5); light.position.y = 0; light.target.position.set(0, -40, 0); g.add(light, light.target);
  g.userData.tip = 'แหล่งแสงจำลอง (ปรับ lux ได้)';
  g.set = v => { mat.emissiveIntensity = v * 5; light.intensity = v * 9000; };
  return g;
}

export function hcsr04() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(0.8, 10, 22), std({ color: 0x1f5fbf, roughness: 0.5 }), 0, 7, 0));
  for (const z of [-5.8, 5.8]) {
    const c = mesh(new THREE.CylinderGeometry(4, 4, 3.2, 32), std({ color: 0xc9d1d9, metalness: 0.9, roughness: 0.3 }), 1.9, 7, z); c.rotation.z = Math.PI / 2; g.add(c);
    const m = mesh(new THREE.CircleGeometry(3.3, 32), std({ color: 0x15181d, roughness: 0.9 }), 3.55, 7, z); m.rotation.y = Math.PI / 2; g.add(m);
  }
  g.add(mesh(new THREE.BoxGeometry(2.4, 2, 10.5), std({ color: 0x15171c }), -0.4, 1.0, 0));
  g.userData.tip = 'HC-SR04P เซนเซอร์อัลตร้าโซนิก (3.3V)';
  return g;
}

export function target() {
  const g = new THREE.Group();
  const m = mesh(new THREE.BoxGeometry(4, 16, 22), std({ color: 0xff8a3d, roughness: 0.5 }), 0, 8, 0);
  g.add(m);
  const stripe = mesh(new THREE.BoxGeometry(4.1, 2, 22.1), std({ color: 0x20242c }), 0, 10, 0); g.add(stripe);
  g.userData.tip = 'วัตถุเป้าหมาย — ปรับระยะในแผงด้านขวา';
  return g;
}

export function servo() {
  const g = new THREE.Group();
  const bm = std({ color: 0x2c5bd6, roughness: 0.45 });
  g.add(mesh(new THREE.BoxGeometry(12, 9, 6.5), bm, 0, 4.5, 0));
  g.add(mesh(new THREE.BoxGeometry(17, 1, 6.5), bm, 0, 7, 0));
  g.add(mesh(new THREE.CylinderGeometry(3, 3, 1.8, 24), bm, 3, 9.6, 0));
  g.add(mesh(new THREE.CylinderGeometry(1.1, 1.1, 1.6, 16), std({ color: 0xeeeeee }), 3, 10.8, 0));
  const horn = new THREE.Group(); horn.position.set(3, 11.4, 0); g.add(horn);
  const arm = mesh(new THREE.BoxGeometry(14, 0.9, 2.2), std({ color: 0xf2f4f8, roughness: 0.4 }), 6, 0, 0); horn.add(arm);
  const tip = mesh(new THREE.SphereGeometry(0.9, 12, 8), std({ color: 0xff6bb5, emissive: 0xff6bb5, emissiveIntensity: 1.5 }), 12.5, 0.5, 0); horn.add(tip);
  // protractor
  const ring = new THREE.Mesh(new THREE.RingGeometry(14, 14.6, 64, 1, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x39e6ff, side: THREE.DoubleSide, transparent: true, opacity: 0.7 }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(3, 11.2, 0); g.add(ring);
  for (let a = 0; a <= 180; a += 15) {
    const r = a * Math.PI / 180, t = mesh(new THREE.BoxGeometry(a % 45 ? 1 : 2, 0.1, 0.25), new THREE.MeshBasicMaterial({ color: 0x39e6ff }));
    t.position.set(3 + Math.cos(r) * 15.5, 11.2, -Math.sin(r) * 15.5); t.rotation.y = r; g.add(t);
  }
  g.userData.tip = 'Servo SG90 (0–180°)';
  g.set = deg => { horn.rotation.y = deg * Math.PI / 180; };
  return g;
}

export function router() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(18, 3.4, 11), std({ color: 0x1b1f27, roughness: 0.35, metalness: 0.3 }), 0, 1.7, 0));
  const am = std({ color: 0x111318, roughness: 0.5 });
  for (const x of [-6, 6]) { const a = mesh(new THREE.CylinderGeometry(0.55, 0.55, 13, 10), am, x, 9, -5); a.rotation.z = x > 0 ? -0.15 : 0.15; g.add(a); }
  const leds = [];
  for (let i = 0; i < 4; i++) { const m = new THREE.MeshStandardMaterial({ color: 0x3dffa8, emissive: 0x3dffa8, emissiveIntensity: 2 }); const l = mesh(new THREE.BoxGeometry(0.8, 0.3, 0.4), m, -4.5 + i * 3, 2.6, 5.4); g.add(l); leds.push(m); }
  g.userData.tip = 'Wi-Fi Router (2.4 GHz)';
  g.blink = t => leds.forEach((m, i) => (m.emissiveIntensity = i === 0 ? 2 : (Math.sin(t * (9 + i * 5) + i) > 0.2 ? 2.5 : 0.2)));
  return g;
}

export function phone() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(9, 0.9, 18), std({ color: 0x0b0d12, roughness: 0.3, metalness: 0.6 }), 0, 0.45, 0));
  const c = document.createElement('canvas'); c.width = 200; c.height = 400;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 16.4), new THREE.MeshBasicMaterial({ map: tex }));
  scr.rotation.x = -Math.PI / 2; scr.position.y = 0.92; g.add(scr);
  g.userData.tip = 'สมาร์ทโฟน (เปิดหน้าเว็บของ ESP32)';
  g.draw = (on, status) => {
    const x = c.getContext('2d');
    const gr = x.createLinearGradient(0, 0, 0, 400); gr.addColorStop(0, '#16233f'); gr.addColorStop(1, '#0a0f1a');
    x.fillStyle = gr; x.fillRect(0, 0, 200, 400);
    x.fillStyle = '#9fb0cc'; x.font = '600 16px sans-serif'; x.textAlign = 'center'; x.fillText('ESP32 LED', 100, 50);
    x.beginPath(); x.arc(100, 150, 46, 0, Math.PI * 2); x.fillStyle = on ? '#ffc94d' : '#1e283b'; x.shadowColor = '#ffb547'; x.shadowBlur = on ? 40 : 0; x.fill(); x.shadowBlur = 0;
    x.fillStyle = '#e8eef9'; x.font = '700 22px sans-serif'; x.fillText(on ? 'ON' : 'OFF', 100, 240);
    const bg = x.createLinearGradient(30, 0, 170, 0); bg.addColorStop(0, '#39e6ff'); bg.addColorStop(1, '#a77bff');
    x.fillStyle = bg; x.beginPath(); x.roundRect(30, 280, 140, 46, 14); x.fill();
    x.fillStyle = '#061018'; x.font = '700 18px sans-serif'; x.fillText('TOGGLE', 100, 310);
    x.fillStyle = '#8fa0bd'; x.font = '12px monospace'; x.fillText(status || '', 100, 360);
    tex.needsUpdate = true;
  };
  g.draw(false, '');
  return g;
}

export function display() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(20, 12, 1.4), std({ color: 0x0b0d12, roughness: 0.4 }), 0, 0, 0));
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(17, 8.5), new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(1.6, 1.6, 1.6) }));
  scr.position.z = 0.72; g.add(scr);
  g.userData.tip = 'OLED 0.96" (SSD1306)';
  g.set = (big, small, bar = 0) => {
    const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, 256, 128);
    x.fillStyle = '#7fe8ff'; x.font = '12px monospace'; x.fillText(small || '', 8, 18);
    x.font = '700 50px "JetBrains Mono", monospace'; x.fillText(big, 8, 82);
    x.strokeStyle = '#7fe8ff'; x.strokeRect(8, 100, 240, 16); x.fillRect(10, 102, 236 * Math.max(0, Math.min(1, bar)), 12);
    tex.needsUpdate = true;
  };
  g.set('--', '');
  return g;
}

export function wall() {
  const m = mesh(new THREE.BoxGeometry(2.5, 26, 44), std({ color: 0x8a96aa, transparent: true, opacity: 0.35, roughness: 0.9 }));
  m.position.y = 13; m.userData.tip = 'ผนัง (ลดสัญญาณ)';
  return m;
}

export function label(text, color = '#e8f1ff', scale = 1) {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTexture(text, { w: 256, h: 64, font: '600 30px "JetBrains Mono", monospace', color }), transparent: true, depthWrite: false }));
  sp.scale.set(12 * scale, 3 * scale, 1);
  sp.setText = (t, col = color) => { if (sp.userData.t === t) return; sp.userData.t = t; sp.material.map.dispose(); sp.material.map = textTexture(t, { w: 256, h: 64, font: '600 30px "JetBrains Mono", monospace', color: col }); };
  return sp;
}
